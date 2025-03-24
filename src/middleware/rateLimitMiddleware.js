const rateLimit = require('express-rate-limit');

const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Limite de 100 requisições por IP
  message: 'Muitas requisições a partir deste IP, tente novamente mais tarde.',
});

module.exports = rateLimiter;