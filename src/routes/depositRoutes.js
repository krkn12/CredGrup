const express = require('express');
const router = express.Router();
const Deposit = require('../models/Deposit');
const Transaction = require('../models/Transaction');
const User = require('../models/User');

router.get('/', async (req, res) => {
  try {
    const deposits = await Deposit.find({ user: req.user.id });
    res.json(deposits);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao listar depósitos' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { amount } = req.body;
    if (amount <= 0) return res.status(400).json({ message: 'Valor inválido' });
    const deposit = new Deposit({ user: req.user.id, amount });
    await deposit.save();
    await new Transaction({ user: req.user.id, type: 'deposit', amount, description: 'Depósito solicitado' }).save();
    res.status(201).json(deposit);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao criar depósito' });
  }
});

router.put('/:id/approve', async (req, res) => {
  try {
    const deposit = await Deposit.findById(req.params.id);
    if (!deposit) return res.status(404).json({ message: 'Depósito não encontrado' });
    if (deposit.status !== 'pending') return res.status(400).json({ message: 'Depósito já processado' });

    deposit.status = 'approved';
    await deposit.save();

    const user = await User.findById(deposit.user);
    user.brlBalance = (user.brlBalance || 0) + deposit.amount;
    await user.save();

    await new Transaction({ user: deposit.user, type: 'deposit', amount: deposit.amount, description: 'Depósito aprovado' }).save();
    res.json(deposit);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao aprovar depósito' });
  }
});

router.put('/:id/reject', async (req, res) => {
  try {
    const deposit = await Deposit.findById(req.params.id);
    if (!deposit) return res.status(404).json({ message: 'Depósito não encontrado' });
    if (deposit.status !== 'pending') return res.status(400).json({ message: 'Depósito já processado' });
    deposit.status = 'rejected';
    await deposit.save();
    await new Transaction({ user: deposit.user, type: 'deposit', amount: deposit.amount, description: 'Depósito rejeitado' }).save();
    res.json(deposit);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao rejeitar depósito' });
  }
});

module.exports = router;