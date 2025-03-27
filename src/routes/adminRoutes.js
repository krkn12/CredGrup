const express = require('express');
const router = express.Router();
const Deposit = require('../models/Deposit');
const Payment = require('../models/Payment');
const Loan = require('../models/Loan');
const Investment = require('../models/Investment');
const authAdmin = require('../middleware/authAdmin'); // Middleware que verifica se o usuário é admin

router.get('/pending', async (req, res) => {
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