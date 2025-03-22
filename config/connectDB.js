const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    console.log('Conectando ao MongoDB com URI:', process.env.MONGO_URI);
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB Conectado: ${conn.connection.host}, Banco: ${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`Erro na conexão: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;