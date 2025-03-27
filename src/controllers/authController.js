const User = require('../models/User');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

module.exports = {
  login: async (req, res) => {  // ← Esta função deve existir
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email }).select('+password');
      
      if (!user || !(await user.comparePassword(password))) {
        return res.status(401).json({ message: 'Credenciais inválidas' });
      }
      
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
      res.json({ token });
    } catch (error) {
      logger.error(`Login error: ${error.message}`);
      res.status(500).json({ message: 'Erro no servidor' });
    }
  },

  register: async (req, res) => {  // ← Esta função deve existir
    try {
      const user = new User(req.body);
      await user.save();
      res.status(201).json(user);
    } catch (error) {
      logger.error(`Register error: ${error.message}`);
      res.status(400).json({ message: 'Erro no registro' });
    }
  }
};