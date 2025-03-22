const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');
const securityConfig = require('../config/security');

class AuthService {
  async login(email, password) {
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      throw new Error('Credenciais inválidas');
    }
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: securityConfig.jwt.expiresIn,
    });
    return { token, user: user.toObject({ getters: true }) };
  }

  async register(data) {
    const user = new User(data);
    await user.save();
    return user;
  }
}

module.exports = new AuthService();