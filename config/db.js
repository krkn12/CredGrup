const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      dbName: 'Pagconta' // Força o uso do banco Pagconta
    });
    console.log(`MongoDB Conectado: ${conn.connection.host}, Banco: ${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`Erro na conexão: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;