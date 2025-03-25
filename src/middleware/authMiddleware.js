const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ message: 'Acesso negado. Token não fornecido.' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password'); // Busca o usuário, excluindo a senha
    if (!user) {
      return res.status(401).json({ message: 'Usuário não encontrado.' });
    }
    req.user = user; // Atribui o objeto completo do usuário
    next();
  } catch (error) {
    console.error('Erro no authMiddleware:', error.message);
    res.status(401).json({ message: 'Token inválido.' });
  }
};

module.exports = authMiddleware;