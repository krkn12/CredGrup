const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

const register = async ({ name, email, phone, password, isAdmin = false }) => {
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new User({ name, email, phone, password: hashedPassword, isAdmin });
  await user.save();
  return user;
};

const login = async (email, password) => {
  const user = await User.findOne({ email });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new Error('Credenciais inválidas');
  }
  const token = jwt.sign({ id: user._id, isAdmin: user.isAdmin }, process.env.JWT_SECRET, { expiresIn: '1h' });
  return {
    token,
    id: user._id,
    name: user.name,
    email: user.email,
    saldoReais: user.saldoReais,
    wbtcBalance: user.wbtcBalance,
    pontos: user.pontos,
    walletAddress: user.walletAddress || '',
    isAdmin: user.isAdmin,
  };
};

module.exports = { register, login };