const Payment = require('../models/Payment');
const User = require('../models/User');

class PaymentService {
  async createPayment(paymentData) {
    const payment = new Payment(paymentData);
    await payment.save();
    return payment;
  }

  async getUserPayments(userId) {
    return await Payment.find({ userId }).sort({ createdAt: -1 });
  }

  async updatePayment(id, data) {
    const payment = await Payment.findByIdAndUpdate(id, data, { new: true });
    if (!payment) throw new Error('Pagamento não encontrado');
    if (data.status === 'Concluído') {
      await User.findByIdAndUpdate(payment.userId, {
        $inc: { saldoReais: -(payment.valorPagamento + payment.taxa), wbtcBalance: payment.cashback },
      });
    }
    return payment;
  }
}

module.exports = new PaymentService();