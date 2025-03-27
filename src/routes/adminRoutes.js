// src/routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const authAdmin = require('../middleware/authAdmin'); // Caminho corrigido
const Deposit = require('../models/Deposit');
// ... outros requires

// Rota protegida por autenticação admin
router.get('/pending', authAdmin, async (req, res) => {
  try {
    const [deposits, payments, loans, investments] = await Promise.all([
      Deposit.find({ status: 'pending' }),
      Payment.find({ status: 'pending' }),
      Loan.find({ status: 'pending' }),
      Investment.find({ status: 'pending' }),
    ]);
    res.json({ deposits, payments, loans, investments });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao listar pendências' });
  }
});

module.exports = router;