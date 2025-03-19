const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment'); // Ajuste o caminho conforme necessário
const authMiddleware = require('../middleware/auth'); // Middleware para autenticação

// Rota para listar pagamentos do usuário autenticado
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const payments = await Payment.find({ userId: req.user.id }); // req.user.id vem do middleware de autenticação
    res.json(payments);
  } catch (error) {
    console.error('Erro ao buscar pagamentos:', error);
    res.status(500).json({ message: 'Erro interno no servidor' });
  }
});

module.exports = router;