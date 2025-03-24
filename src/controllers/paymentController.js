const Payment = require('../models/Payment');
const paymentService = require('../services/paymentService');

const getUserPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ userId: req.user.id }).populate('userId', 'name');
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao obter pagamentos' });
  }
};

const createPayment = async (req, res) => {
  try {
    const paymentData = {
      userId: req.user.id,
      descricaoPagamento: req.body.descricaoPagamento,
      valorPagamento: req.body.valorPagamento,
      taxa: req.body.taxa || 0,
      pixKey: req.body.pixKey,
      cashback: req.body.cashback || 0,
    };
    const payment = await paymentService.createPayment(paymentData);
    res.status(201).json(payment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = { getUserPayments, createPayment };