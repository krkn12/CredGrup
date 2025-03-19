const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Adicionar opções de configuração para prevenir erros
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Timeout após 5 segundos
      socketTimeoutMS: 45000, // Fecha sockets inativos após 45 segundos
    });

    console.log(`MongoDB Conectado: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`Erro na conexão: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;