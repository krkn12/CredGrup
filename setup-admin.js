require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
const connectDatabase = require("./config/connectDB");

async function setupAdmin() {
  try {
    await connectDatabase();
    
    // Verifique se o email já existe
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    
    if (!adminEmail || !adminPassword) {
      console.error("ADMIN_EMAIL e ADMIN_PASSWORD devem ser definidos no arquivo .env");
      process.exit(1);
    }
    
    let admin = await User.findOne({ email: adminEmail });
    
    if (admin) {
      // Se o usuário já existe, apenas garanta que ele seja admin
      if (!admin.isAdmin) {
        admin.isAdmin = true;
        await admin.save();
        console.log(`Usuário ${adminEmail} promovido a administrador.`);
      } else {
        console.log(`Usuário ${adminEmail} já é administrador.`);
      }
    } else {
      // Crie o usuário admin
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(adminPassword, salt);
      
      admin = new User({
        name: "Administrador",
        email: adminEmail,
        phone: "0000000000",
        password: hashedPassword,
        saldoReais: 0,
        wbtcBalance: 0,
        pontos: 0,
        walletAddress: "0xDefaultAddress",
        paymentHistory: [],
        isAdmin: true,
      });
      
      await admin.save();
      console.log(`Administrador ${adminEmail} criado com sucesso.`);
    }
    
    mongoose.disconnect();
  } catch (error) {
    console.error("Erro ao configurar administrador:", error);
    process.exit(1);
  }
}

setupAdmin();
