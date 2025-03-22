const helmet = require('helmet');

const securityConfig = {
  helmet: helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
      },
    },
    hsts: { maxAge: 31536000, includeSubDomains: true },
    xssFilter: true,
  }),
  jwt: {
    expiresIn: '1h',
  },
};

module.exports = securityConfig;