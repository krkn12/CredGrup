const Deposit = require('../models/Deposit');
const User = require('../models/User');

class DepositService {
  async createDeposit(depositData) {
    const deposit = new Deposit(depositData);
    await deposit.save();
    return deposit;
  }

  async getUserDeposits(userId) {
    return await Deposit.find({ userId }).sort({ createdAt: -1 });
  }

  async updateDeposit(id, data) {
    const deposit = await Deposit.findByIdAndUpdate(id, data, { new: true });
    if (!deposit) throw new Error('Depósito não encontrado');
    if (data.status === 'Concluído') {
      await User.findByIdAndUpdate(deposit.userId, {
        $inc: { saldoReais: deposit.valor - deposit.taxa },
      });
    }
    return deposit;
  }
}

module.exports = new DepositService();