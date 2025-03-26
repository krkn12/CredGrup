const express = require('express');
const router = express.Router();
const Investment = require('../models/Investment');
const Transaction = require('../models/Transaction');
const User = require('../models/User');

router.get('/', async (req, res) => {
  try {
    const investments = await Investment.find({ user: req.user.id });
    res.json(investments);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao listar investimentos' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { amount } = req.body;
    if (amount <= 0) return res.status(400).json({ message: 'Valor inválido' });
    const user = await User.findById(req.user.id);
    if (user.brlBalance < amount) return res.status(400).json({ message: 'Saldo insuficiente' });

    const investment = new Investment({ user: req.user.id, amount });
    await investment.save();
    await new Transaction({ user: req.user.id, type: 'investment', amount, description: 'Investimento solicitado' }).save();
    res.status(201).json(investment);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao criar investimento' });
  }
});

router.put('/:id/approve', async (req, res) => {
  try {
    const investment = await Investment.findById(req.params.id);
    if (!investment) return res.status(404).json({ message: 'Investimento não encontrado' });
    if (investment.status !== 'pending') return res.status(400).json({ message: 'Investimento já processado' });

    const user = await User.findById(investment.user);
    if (user.brlBalance < investment.amount) return res.status(400).json({ message: 'Saldo insuficiente' });

    investment.status = 'approved';
    user.brlBalance -= investment.amount;
    user.brlInvested = (user.brlInvested || 0) + investment.amount;
    await investment.save();
    await user.save();

    await new Transaction({ user: investment.user, type: 'investment', amount: investment.amount, description: 'Investimento aprovado' }).save();
    res.json(investment);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao aprovar investimento' });
  }
});

router.put('/:id/reject', async (req, res) => {
  try {
    const investment = await Investment.findById(req.params.id);
    if (!investment) return res.status(404).json({ message: 'Investimento não encontrado' });
    if (investment.status !== 'pending') return res.status(400).json({ message: 'Investimento já processado' });
    investment.status = 'rejected';
    await investment.save();
    await new Transaction({ user: investment.user, type: 'investment', amount: investment.amount, description: 'Investimento rejeitado' }).save();
    res.json(investment);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao rejeitar investimento' });
  }
});

module.exports = router;