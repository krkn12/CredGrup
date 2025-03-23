require('dotenv').config();
const express = require('express');
const https = require('https');
const fs = require('fs');
const connectDB = require('./config/database');
const securityConfig = require('./config/security');
const logger = require('./utils/logger');
const errorMiddleware = require('./middleware/errorMiddleware');
const path = require('path');

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

// CORS para o domínio
const cors = require('cors');
app.use(cors({ origin: 'https://credgrup.click' }));

// Segurança
app.use(securityConfig.helmet);
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Rotas
app.use('/api/users', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/deposits', depositRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/loans', loanRoutes);
app.use('/api/investments', investmentRoutes);
app.use('/api/admin', adminRoutes);

// Uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

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

  const PORT = process.env.PORT || 3000;
  
  try {
    // Tenta usar HTTPS se os certificados existirem
    const privateKey = fs.readFileSync(path.join(__dirname, '../ssl/selfsigned.key'), 'utf8');
    const certificate = fs.readFileSync(path.join(__dirname, '../ssl/selfsigned.crt'), 'utf8');
    const credentials = { key: privateKey, cert: certificate };
    
    const server = https.createServer(credentials, app);
    server.listen(PORT, () => {
      logger.info(`Servidor rodando na porta ${PORT} com HTTPS`);
    });
  } catch (error) {
    // Fallback para HTTP em caso de erro
    logger.warn('Certificados SSL não encontrados. Usando HTTP para desenvolvimento.');
    app.listen(PORT, () => {
      logger.info(`Servidor rodando na porta ${PORT} em modo HTTP (desenvolvimento)`);
    });
  }
};

startServer();