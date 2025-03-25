const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  console.log('Token recebido no authMiddleware:', token); // Adicione este log
  if (!token) {
    return res.status(401).json({ message: 'Acesso negado. Token não fornecido.' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token decodificado:', decoded); // Adicione este log
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ message: 'Usuário não encontrado.' });
    }
    req.user = user;
    next();
  } catch (error) {
    console.error('Erro no authMiddleware:', error.message);
    res.status(401).json({ message: 'Token inválido.' });
  }
};

module.exports = authMiddleware;