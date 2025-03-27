require('dotenv').config();
const express = require('express');
const path = require('path');
const { connectDB } = require('./config/database');
const configureSecurity = require('./config/security');
const loadRoutes = require('./utils/routeLoader');
const { createServer } = require('./utils/startServer');
const logger = require('./utils/logger');

const app = express();

// Configurações básicas
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Inicialização
(async () => {
  try {
    // 1. Segurança
    configureSecurity(app);
    
    // 2. Banco de dados
    await connectDB();
    
    // 3. Rotas
    loadRoutes(app);
    
    // 4. Arquivos estáticos
    app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
    
    // 5. Health check
    app.get('/health', (req, res) => res.status(200).json({ status: 'healthy' }));
    
    // 6. Rota raiz
    app.get('/', (req, res) => res.send('Credgrup API Online'));
    
    // 7. Iniciar servidor
    createServer(app);
  } catch (error) {
    logger.error(`Falha na inicialização: ${error.message}`);
    process.exit(1);
  }
})();