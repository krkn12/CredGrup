const logger = require('../utils/logger');

const errorMiddleware = (err, req, res, next) => {
  logger.error(`${err.message} - ${req.method} ${req.url}`);
  res.status(err.status || 500).json({
    message: err.message || 'Erro interno do servidor',
  });
};

module.exports = errorMiddleware;