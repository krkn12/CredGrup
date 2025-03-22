const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Extrair o nome do banco de dados da URI ou usar um padrão
    const dbName = process.env.MONGO_URI.includes('CredGrup') ? 'CredGrup' : 'CredGrup';
    
    // Conectar explicitamente ao banco de dados correto
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      dbName: dbName
    });
    
    console.log(`MongoDB Conectado: ${conn.connection.host}, Banco: ${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`Erro na conexão: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;