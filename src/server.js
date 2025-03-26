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

// Verificação inicial das variáveis de ambiente
if (!process.env.MONGO_URI) {
  logger.error('MONGO_URI não está definido no .env');
  process.exit(1);
}

// Configuração do Multer para uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, 'uploads')),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});
const upload = multer({ storage });

// Rotas
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const depositRoutes = require('./routes/depositRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const loanRoutes = require('./routes/loanRoutes');
const investmentRoutes = require('./routes/investmentRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

// Confiar em proxies para express-rate-limit
app.set('trust proxy', 1);

// CORS ajustado para produção e testes locais
app.use(cors({
  origin: ['https://credgrup.vercel.app', 'http://localhost:3000'],
  credentials: true,
}));

// Segurança
app.use(securityConfig.helmet);
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(rateLimitMiddleware);

// Rotas públicas
app.use('/api/users', authRoutes);

// Rotas protegidas
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

// Rota para dados da carteira (atualizada)
app.get('/api/wallet/data', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'Usuário não encontrado' });

    // Calcular total investido
    const investments = await Investment.find({ user: req.user.id, status: 'approved' });
    const totalInvested = investments.reduce((sum, inv) => sum + inv.amount, 0);

    // Calcular valor disponível para empréstimo (ex.: 2x o total investido ou saldo, o menor dos dois)
    const loanMultiplier = 2; // Ajustável no futuro via Config
    const loanAvailable = Math.min(user.wbtcBalance * loanMultiplier, totalInvested * loanMultiplier);

    res.json({
      wbtcBalance: user.wbtcBalance || 0,
      totalInvested: totalInvested || 0,
      loanAvailable: loanAvailable || 0,
      lastUpdated: user.updatedAt || new Date(),
    });
  } catch (error) {
    logger.error(`Erro ao obter dados da carteira: ${error.message}`);
    res.status(500).json({ message: 'Erro interno ao obter dados da carteira' });
  }
});

// Rotas de configuração
app.get('/api/admin/config', authMiddleware, async (req, res) => {
  try {
    if (!req.user.isAdmin) return res.status(403).json({ message: 'Acesso negado' });
    const config = await Config.findOne();
    if (!config) return res.status(404).json({ message: 'Configuração não encontrada' });
    res.json(config);
  } catch (error) {
    logger.error(`Erro ao obter configuração: ${error.message}`);
    res.status(500).json({ message: 'Erro ao obter configuração' });
  }
});

app.put('/api/admin/config', authMiddleware, async (req, res) => {
  try {
    if (!req.user.isAdmin) return res.status(403).json({ message: 'Acesso negado' });
    const { loanInterestRate, investmentInterestRate, btcRewardRate } = req.body;
    if (loanInterestRate < 0 || investmentInterestRate < 0 || btcRewardRate < 0) {
      return res.status(400).json({ message: 'As taxas não podem ser negativas' });
    }
    const config = await Config.findOneAndUpdate(
      {},
      { loanInterestRate, investmentInterestRate, btcRewardRate, updatedAt: new Date() },
      { new: true, upsert: true }
    );
    res.json(config);
  } catch (error) {
    logger.error(`Erro ao atualizar configuração: ${error.message}`);
    res.status(500).json({ message: 'Erro ao atualizar configuração' });
  }
});

// Uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rota padrão
app.get('/', (req, res) => res.send('Servidor CredGrup rodando!'));

// Middleware de erro
app.use(errorMiddleware);

// Inicialização do admin padrão e configuração
const initializeAdmin = async () => {
  const authService = require('./services/authService');
  try {
    const adminExists = await User.findOne({ email: process.env.ADMIN_EMAIL });
    if (!adminExists) {
      await authService.register({
        name: process.env.ADMIN_NAME,
        email: process.env.ADMIN_EMAIL,
        phone: process.env.ADMIN_PHONE,
        password: process.env.ADMIN_PASSWORD,
        isAdmin: true,
      });
      logger.info('Admin padrão criado com sucesso');
    }

    const configExists = await Config.findOne();
    if (!configExists) {
      await new Config({
        loanInterestRate: 0.1,
        investmentInterestRate: 0.15,
        btcRewardRate: 0.0002,
      }).save();
      logger.info('Configuração padrão criada com sucesso');
    }
  } catch (error) {
    logger.error(`Erro ao inicializar: ${error.message}`);
    throw error;
  }
};

// Iniciar servidor
const startServer = async () => {
  try {
    logger.info('Iniciando o servidor...');
    await connectDB();
    await initializeAdmin();

    const PORT = process.env.PORT || 5000;
    if (process.env.NODE_ENV === 'production' && process.env.SSL_KEY && process.env.SSL_CERT) {
      const httpsOptions = {
        key: fs.readFileSync(process.env.SSL_KEY),
        cert: fs.readFileSync(process.env.SSL_CERT),
      };
      https.createServer(httpsOptions, app).listen(PORT, '0.0.0.0', () => {
        logger.info(`Servidor rodando na porta ${PORT} em modo HTTPS`);
      });
    } else {
      app.listen(PORT, '0.0.0.0', () => {
        logger.info(`Servidor rodando na porta ${PORT} em modo HTTP`);
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
    logger.error(`Erro ao iniciar o servidor: ${error.message}`);
    process.exit(1);
  }
};

startServer();