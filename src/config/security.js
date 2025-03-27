const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});

module.exports = (app) => {
  app.use(helmet());
  app.use(cors({
    origin: ['http://localhost:3000', 'https://credgrup.vercel.app'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
  }));
  app.use(limiter);
  app.options('*', cors());
  
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Credentials', 'true');
    next();
  });
  
  logger.info('Segurança configurada');
};