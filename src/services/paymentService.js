const Payment = require('../models/Payment');
const User = require('../models/User');

const createPayment = async (paymentData) => {
  const payment = new Payment(paymentData);
  await payment.save();
  return payment;
};

const updatePayment = async (id, status) => {
  const payment = await Payment.findByIdAndUpdate(id, { status }, { new: true }).populate('userId');
  if (status === 'Concluído') {
    const user = await User.findById(payment.userId);
    user.saldoReais -= (payment.valorPagamento + payment.taxa);
    user.pontos += 1;
    await user.save();
  }
  return payment;
};

module.exports = { createPayment, updatePayment };