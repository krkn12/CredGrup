const logger = require('../utils/logger');

const errorMiddleware = (err, req, res, next) => {
  logger.error(`${req.method} ${req.originalUrl} - ${err.message}`, { stack: err.stack });
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    error: err.message || 'Erro interno do servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorMiddleware;