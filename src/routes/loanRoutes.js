const express = require('express');
const router = express.Router();
const Loan = require('../models/Loan');
const Transaction = require('../models/Transaction');
const User = require('../models/User');

router.get('/', async (req, res) => {
  try {
    const loans = await Loan.find({ user: req.user.id });
    res.json(loans);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao listar empréstimos' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { amount } = req.body;
    if (amount <= 0) return res.status(400).json({ message: 'Valor inválido' });
    const user = await User.findById(req.user.id);
    const loanLimitBrl = user.brlBalance * 0.5; // Limite de 50% do saldo
    if (amount > loanLimitBrl) return res.status(400).json({ message: 'Valor excede o limite de empréstimo' });

    const loan = new Loan({ user: req.user.id, amount });
    await loan.save();
    await new Transaction({ user: req.user.id, type: 'loan', amount, description: 'Empréstimo solicitado' }).save();
    res.status(201).json(loan);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao criar empréstimo' });
  }
});

router.put('/:id/approve', async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id);
    if (!loan) return res.status(404).json({ message: 'Empréstimo não encontrado' });
    if (loan.status !== 'pending') return res.status(400).json({ message: 'Empréstimo já processado' });

    loan.status = 'approved';
    await loan.save();

    const user = await User.findById(loan.user);
    user.brlBalance = (user.brlBalance || 0) + loan.amount;
    await user.save();

    await new Transaction({ user: loan.user, type: 'loan', amount: loan.amount, description: 'Empréstimo aprovado' }).save();
    res.json(loan);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao aprovar empréstimo' });
  }
});

router.put('/:id/reject', async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id);
    if (!loan) return res.status(404).json({ message: 'Empréstimo não encontrado' });
    if (loan.status !== 'pending') return res.status(400).json({ message: 'Empréstimo já processado' });
    loan.status = 'rejected';
    await loan.save();
    await new Transaction({ user: loan.user, type: 'loan', amount: loan.amount, description: 'Empréstimo rejeitado' }).save();
    res.json(loan);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao rejeitar empréstimo' });
  }
});

module.exports = router;