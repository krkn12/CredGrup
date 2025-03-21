const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB Conectado: ${conn.connection.host}, Banco: ${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`Erro na conexão com o MongoDB: ${error.message}`);
    console.error("MONGO_URI usada:", process.env.MONGO_URI);
    process.exit(1);
  }
};

module.exports = connectDB;