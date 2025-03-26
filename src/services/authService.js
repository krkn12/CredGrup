const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const register = async ({ name, email, phone, password, isAdmin = false }) => {
  let user = await User.findOne({ email });
  if (user) throw new Error('Email já registrado');
  
  user = new User({ name, email, phone, password, isAdmin });
  await user.save();

  const token = jwt.sign({ id: user._id, isAdmin: user.isAdmin }, process.env.JWT_SECRET, { expiresIn: '1h' });
  return { user: user.toJSON(), token };
};

const login = async (email, password) => {
  const user = await User.findOne({ email });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new Error('Credenciais inválidas');
  }

  const token = jwt.sign({ id: user._id, isAdmin: user.isAdmin }, process.env.JWT_SECRET, { expiresIn: '1h' });
  return { user: user.toJSON(), token };
};

module.exports = { register, login };