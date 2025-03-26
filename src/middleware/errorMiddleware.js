const logger = require('../utils/logger');

module.exports = (err, req, res, next) => {
  logger.error(`Erro: ${err.message}`);
  res.status(500).json({ message: 'Erro interno do servidor' });
};