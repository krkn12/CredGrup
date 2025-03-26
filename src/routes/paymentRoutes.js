const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const User = require('../models/User');
const Config = require('../models/Config');
const Transaction = require('../models/Transaction');

router.get('/', async (req, res) => {
  try {
    const payments = await Payment.find({ user: req.user.id });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao listar pagamentos' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { amount, description } = req.body;
    if (amount <= 0) return res.status(400).json({ message: 'Valor inválido' });
    const user = await User.findById(req.user.id);
    if (user.brlBalance < amount) return res.status(400).json({ message: 'Saldo insuficiente' });

    const payment = new Payment({ user: req.user.id, amount, description });
    await payment.save();
    await new Transaction({ user: req.user.id, type: 'payment', amount, description: 'Pagamento solicitado: ' + description }).save();
    res.status(201).json(payment);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao criar pagamento' });
  }
});

router.put('/:id/approve', async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ message: 'Pagamento não encontrado' });
    if (payment.status !== 'pending') return res.status(400).json({ message: 'Pagamento já processado' });

    const user = await User.findById(payment.user);
    if (user.brlBalance < payment.amount) return res.status(400).json({ message: 'Saldo insuficiente' });

    const config = await Config.findOne();
    const btcReward = payment.amount * (config.btcRewardRate || 0.0002);

    payment.status = 'approved';
    user.brlBalance -= payment.amount;
    user.wbtcBalance = (user.wbtcBalance || 0) + btcReward;
    await payment.save();
    await user.save();

    await new Transaction({ user: payment.user, type: 'payment', amount: payment.amount, description: 'Pagamento aprovado: ' + payment.description }).save();
    await new Transaction({ user: payment.user, type: 'btc_reward', amount: btcReward, description: 'Recompensa BTC por pagamento' }).save();

    res.json(payment);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao aprovar pagamento' });
  }
});

router.put('/:id/reject', async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ message: 'Pagamento não encontrado' });
    if (payment.status !== 'pending') return res.status(400).json({ message: 'Pagamento já processado' });
    payment.status = 'rejected';
    await payment.save();
    await new Transaction({ user: payment.user, type: 'payment', amount: payment.amount, description: 'Pagamento rejeitado: ' + payment.description }).save();
    res.json(payment);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao rejeitar pagamento' });
  }
});

module.exports = router;