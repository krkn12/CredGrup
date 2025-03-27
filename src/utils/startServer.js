const https = require('https');
const fs = require('fs');
const logger = require('./logger');

module.exports = {
  createServer: (app) => {
    const PORT = process.env.PORT || 5000;
    
    if (process.env.NODE_ENV === 'production') {
      const options = {
        key: fs.readFileSync('./config/ssl/selfsigned.key'),
        cert: fs.readFileSync('./config/ssl/selfsigned.crt')
      };
      https.createServer(options, app).listen(PORT, () => {
        logger.info(`HTTPS rodando na porta ${PORT}`);
      });
    } else {
      app.listen(PORT, () => {
        logger.info(`HTTP rodando na porta ${PORT}`);
      });
    }
  }
};