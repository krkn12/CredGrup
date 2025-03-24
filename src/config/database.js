const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    logger.info('Conectado ao MongoDB com sucesso');
  } catch (error) {
    logger.error(`Erro ao conectar ao MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;