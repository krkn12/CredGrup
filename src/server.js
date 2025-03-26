const path = require('path');
const https = require('https');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const express = require('express');
const connectDB = require('./config/database');
const securityConfig = require('./config/security');
const logger = require('./utils/logger');
const errorMiddleware = require('./middleware/errorMiddleware');
const authMiddleware = require('./middleware/authMiddleware');
const rateLimitMiddleware = require('./middleware/rateLimitMiddleware');
const cors = require('cors');
const multer = require('multer');
const Config = require('./models/Config');
const User = require('./models/User');
const Investment = require('./models/Investment');
const Transaction = require('./models/Transaction');
const axios = require('axios');

// Verificação inicial das variáveis de ambiente
const requiredEnv = ['MONGO_URI', 'JWT_SECRET', 'ADMIN_EMAIL', 'ADMIN_PASSWORD'];
requiredEnv.forEach((env) => {
  if (!process.env[env]) {
    logger.error(`${env} não está definido no .env`);
    process.exit(1);
  }
});

// Configuração do Multer para uploads com validação
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, 'uploads')),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limite de 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Apenas JPEG, PNG ou PDF são permitidos'));
    }
    cb(null, true);
  },
});

const app = express();

// Confiar em proxies para rate-limiting
app.set('trust proxy', 1);

// CORS ajustado
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? 'https://credgrup.vercel.app/' : 'http://localhost:3000/',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));

// Segurança
app.use(securityConfig.helmet);
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(rateLimitMiddleware);

// Rotas
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const depositRoutes = require('./routes/depositRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const loanRoutes = require('./routes/loanRoutes');
const investmentRoutes = require('./routes/investmentRoutes');
const adminRoutes = require('./routes/adminRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/users', authMiddleware, userRoutes);
app.use('/api/deposits', authMiddleware, depositRoutes);
app.use('/api/payments', authMiddleware, paymentRoutes);
app.use('/api/transactions', authMiddleware, transactionRoutes);
app.use('/api/loans', authMiddleware, loanRoutes);
app.use('/api/investments', authMiddleware, investmentRoutes);
app.use('/api/admin', authMiddleware, (req, res, next) => {
  if (!req.user.isAdmin) return res.status(403).json({ message: 'Acesso negado. Apenas administradores.' });
  next();
}, adminRoutes);

// Endpoint para dados da carteira
app.get('/api/wallet/data', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'Usuário não encontrado' });

    const investments = await Investment.find({ user: req.user.id, status: 'approved' });
    const transactions = await Transaction.find({ user: req.user.id }).sort({ createdAt: -1 }).limit(10);
    const totalInvested = investments.reduce((sum, inv) => sum + inv.amount, 0);
    const loanMultiplier = 2;
    const loanAvailable = Math.min(user.wbtcBalance * loanMultiplier, totalInvested * loanMultiplier);

    const { data: { 'wrapped-bitcoin': { brl: wbtcToBrlRate } } } = await axios.get(
      'https://api.coingecko.com/api/v3/simple/price?ids=wrapped-bitcoin&vs_currencies=brl'
    );
    const { data: { usd: { brl: usdToBrlRate } } } = await axios.get(
      'https://api.coingecko.com/api/v3/simple/price?ids=usd&vs_currencies=brl'
    );

    const wbtcBalanceBrl = user.wbtcBalance * wbtcToBrlRate;
    const totalInvestedBrl = totalInvested * usdToBrlRate;
    const loanAvailableBrl = loanAvailable * usdToBrlRate;

    res.json({
      wbtcBalance: wbtcBalanceBrl,
      totalInvested: totalInvestedBrl,
      loanAvailable: loanAvailableBrl,
      recentTransactions: transactions.map(t => ({
        type: t.type,
        amount: t.amount * (t.currency === 'BRL' ? 1 : usdToBrlRate),
        date: t.createdAt,
      })),
      lastUpdated: new Date(),
      currency: 'BRL',
    });
  } catch (error) {
    logger.error(`Erro ao obter dados da carteira: ${error.message}`);
    res.status(500).json({ message: 'Erro interno ao obter dados da carteira' });
  }
});

// Configurações administrativas
app.get('/api/admin/config', authMiddleware, async (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ message: 'Acesso negado' });
  const config = await Config.findOne();
  if (!config) return res.status(404).json({ message: 'Configuração não encontrada' });
  res.json(config);
});

app.put('/api/admin/config', authMiddleware, async (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ message: 'Acesso negado' });
  const { loanInterestRate, investmentInterestRate, btcRewardRate } = req.body;
  if ([loanInterestRate, investmentInterestRate, btcRewardRate].some(rate => rate < 0 || rate > 1)) {
    return res.status(400).json({ message: 'As taxas devem estar entre 0 e 1 (0% a 100%)' });
  }
  const config = await Config.findOneAndUpdate(
    {},
    { loanInterestRate, investmentInterestRate, btcRewardRate, updatedAt: new Date() },
    { new: true, upsert: true }
  );
  res.json(config);
});

// Upload de documentos para KYC
app.post('/api/users/kyc', authMiddleware, upload.single('document'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Nenhum arquivo enviado' });
    const user = await User.findById(req.user.id);
    user.kycDocument = req.file.path;
    user.kycStatus = 'pending';
    await user.save();
    res.json({ message: 'Documento enviado para verificação' });
  } catch (error) {
    logger.error(`Erro no upload KYC: ${error.message}`);
    res.status(500).json({ message: 'Erro ao enviar documento' });
  }
});

// Servir uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rota padrão
app.get('/', (req, res) => res.send('Fintech Server Online'));

// Middleware de erro
app.use(errorMiddleware);

// Inicialização
const initializeApp = async () => {
  const authService = require('./services/authService');
  try {
    const adminExists = await User.findOne({ email: process.env.ADMIN_EMAIL });
    if (!adminExists) {
      await authService.register({
        name: process.env.ADMIN_NAME || 'Admin',
        email: process.env.ADMIN_EMAIL,
        phone: process.env.ADMIN_PHONE || '00000000000',
        password: process.env.ADMIN_PASSWORD,
        isAdmin: true,
        kycStatus: 'approved',
      });
      logger.info('Admin padrão criado');
    }

    const configExists = await Config.findOne();
    if (!configExists) {
      await new Config({
        loanInterestRate: 0.05, // 5%
        investmentInterestRate: 0.08, // 8%
        btcRewardRate: 0.0001, // 0.01%
      }).save();
      logger.info('Configuração padrão criada');
    }
  } catch (error) {
    logger.error(`Erro ao inicializar: ${error.message}`);
    throw error;
  }
};

// Iniciar servidor
const startServer = async () => {
  try {
    logger.info('Iniciando servidor...');
    await connectDB();
    await initializeApp();

    const PORT = process.env.PORT || 5000;
    if (process.env.NODE_ENV === 'production' && process.env.SSL_KEY && process.env.SSL_CERT) {
      const httpsOptions = {
        key: fs.readFileSync(process.env.SSL_KEY),
        cert: fs.readFileSync(process.env.SSL_CERT),
      };
      https.createServer(httpsOptions, app).listen(PORT, '0.0.0.0', () => {
        logger.info(`Servidor HTTPS na porta ${PORT}`);
      });
    } else {
      app.listen(PORT, '0.0.0.0', () => {
        logger.info(`Servidor HTTP na porta ${PORT}`);
      });
    }

    process.on('uncaughtException', (error) => {
      logger.error(`Erro não capturado: ${error.message}`);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason) => {
      logger.error(`Rejeição não tratada: ${reason}`);
      process.exit(1);
    });
  } catch (error) {
    logger.error(`Erro ao iniciar servidor: ${error.message}`);
    process.exit(1);
  }
};

startServer();