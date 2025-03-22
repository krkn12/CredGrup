const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const mongoose = require("mongoose"); // Adicione esta linha

const register = async (req, res) => {
  const { name, email, phone, password } = req.body;

  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ error: "Email já cadastrado" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const userCount = await User.countDocuments();
    const isFirstUser = userCount === 0;
    const isSpecialAdmin = email === process.env.ADMIN_EMAIL;

    user = new User({
      name,
      email,
      phone,
      password: hashedPassword,
      saldoReais: 0,
      wbtcBalance: 0,
      pontos: 0,
      walletAddress: "0xDefaultAddress",
      paymentHistory: [],
      isAdmin: isFirstUser || isSpecialAdmin,
    });

    // Usar uma coleção temporária para teste
    const tempCollection = mongoose.connection.db.collection('users_temp');
    const result = await tempCollection.insertOne(user.toObject());
    console.log('Usuário salvo em coleção temporária:', tempCollection.collectionName, 'ID:', result.insertedId);
    user._id = result.insertedId;

    const payload = { id: user._id, isAdmin: user.isAdmin };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });

    res.status(201).json({
      token,
      id: user._id,
      name: user.name,
      email: user.email,
      saldoReais: user.saldoReais,
      wbtcBalance: user.wbtcBalance,
      pontos: user.pontos,
      walletAddress: user.walletAddress,
      isAdmin: user.isAdmin,
    });
  } catch (error) {
    console.error("Erro ao registrar usuário:", error);
    res.status(500).json({ error: "Erro ao registrar usuário" });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      console.log("Usuário não encontrado:", email);
      return res.status(401).json({ error: "Credenciais inválidas" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log("Senha incorreta para:", email);
      return res.status(401).json({ error: "Credenciais inválidas" });
    }

    const payload = {
      id: user._id,
      email: user.email,
      isAdmin: user.isAdmin,
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });

    res.json({
      token,
      id: user._id,
      name: user.name,
      email: user.email,
      saldoReais: user.saldoReais,
      wbtcBalance: user.wbtcBalance,
      pontos: user.pontos,
      walletAddress: user.walletAddress,
      isAdmin: user.isAdmin,
    });
  } catch (error) {
    console.error("Erro ao fazer login:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

module.exports = { register, login };