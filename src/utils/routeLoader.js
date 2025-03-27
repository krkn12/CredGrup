const fs = require('fs');
const path = require('path');
const logger = require('./logger');

module.exports = (app) => {
  const routesPath = path.join(__dirname, '../routes');
  
  fs.readdirSync(routesPath).forEach(file => {
    if (!file.endsWith('Routes.js')) return;
    
    try {
      const route = require(path.join(routesPath, file));
      const routeName = file.replace('Routes.js', '');
      app.use(`/api/${routeName}`, route);
      logger.info(`Rota carregada: /api/${routeName}`);
    } catch (error) {
      logger.error(`Erro na rota ${file}: ${error.message}`);
    }
  });
};