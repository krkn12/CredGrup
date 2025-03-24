require('dotenv').config();
const express = require('express');
const connectDB = require('./config/database');
const securityConfig = require('./config/security');
const logger = require('./utils/logger');
const errorMiddleware = require('./middleware/errorMiddleware');
const authMiddleware = require('./middleware/authMiddleware');
const rateLimitMiddleware = require('./middleware/rateLimitMiddleware');
const path = require('path');
const cors = require('cors');
const multer = require('multer');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads')),
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

// Confiar em proxies para express-rate-limit (corrige ERR_ERL_UNEXPECTED_X_FORWARDED_FOR)
app.set('trust proxy', 1); // Confia no primeiro proxy (ajuste conforme necessário)

// CORS
app.use(cors({ origin: 'https://credgrup.vercel.app' }));

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

// Rota para dados da carteira
app.get('/api/wallet/data', authMiddleware, async (req, res) => {
  try {
    const User = require('./models/User');
    const user = await User.findById(req.user.id);
    res.json({
      wbtcBalance: user.wbtcBalance || 0,
      lastUpdated: user.updatedAt || new Date(),
    });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao obter dados da carteira' });
  }
});

// Uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rota padrão
app.get('/', (req, res) => res.send('Servidor CredGrup rodando!'));

// Middleware de erro
app.use(errorMiddleware);

// Inicialização do admin padrão
const initializeAdmin = async () => {
  const User = require('./models/User');
  const authService = require('./services/authService');
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
  } else {
    logger.info('Admin já existe, pulando criação');
  }
};

// Iniciar servidor
const startServer = async () => {
  await connectDB();
  await initializeAdmin();

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, '0.0.0.0', () => {
    logger.info(`Servidor rodando na porta ${PORT} em modo HTTP`);
  });
};

startServer();