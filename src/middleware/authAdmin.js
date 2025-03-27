// src/middleware/authAdmin.js
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ message: 'Acesso negado. Token não fornecido.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verifica se o usuário é admin (assumindo que 'role' está no token)
    if (decoded.role !== 'admin') {
      return res.status(403).json({ message: 'Acesso restrito a administradores.' });
    }

    req.user = decoded; // Anexa os dados do usuário à requisição
    next();
  } catch (error) {
    res.status(400).json({ message: 'Token inválido ou expirado.' });
  }
};