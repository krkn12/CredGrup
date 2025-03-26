const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const User = require('../models/User');
const Config = require('../models/Config');

router.get('/', async (req, res) => {
  try {
    const payments = await Payment.find({ user: req.user.id });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao listar pagamentos' });
  }
});

router.post('/', async (req, res) => {
  const { amount, description } = req.body;
  try {
    const payment = new Payment({
      user: req.user.id,
      amount,
      description,
      status: 'pending',
    });
    await payment.save();
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

    const config = await Config.findOne();
    const btcReward = amount * (config.btcRewardRate || 0.0002);
    payment.status = 'approved';
    await payment.save();

    const user = await User.findById(payment.user);
    user.wbtcBalance = (user.wbtcBalance || 0) + btcReward;
    await user.save();

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
    res.json(payment);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao rejeitar pagamento' });
  }
});

module.exports = router;