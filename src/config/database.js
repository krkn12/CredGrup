const mongoose = require('mongoose');
const logger = require('../utils/logger');

module.exports = {
  connectDB: async () => {
    try {
      await mongoose.connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 5000
      });
      logger.info('Conectado ao MongoDB');
    } catch (error) {
      logger.error(`Erro no MongoDB: ${error.message}`);
      process.exit(1);
    }
  }
};