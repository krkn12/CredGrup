const authService = require('../services/authService');
const logger = require('../utils/logger');

const register = async (req, res) => {
  try {
    const user = await authService.register(req.body);
    logger.info(`Usuário registrado: ${user.email}`);
    res.status(201).json(user);
  } catch (error) {
    logger.error(`Erro ao registrar: ${error.message}`);
    res.status(400).json({ message: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const { user, token } = await authService.login(email, password);
    logger.info(`Login bem-sucedido: ${email}`);
    res.json({ user, token });
  } catch (error) {
    logger.error(`Erro ao fazer login: ${error.message}`);
    res.status(401).json({ message: error.message });
  }
};

module.exports = { register, login };