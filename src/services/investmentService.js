const Investment = require('../models/Investment');
const User = require('../models/User');

class InvestmentService {
  async createInvestment(investmentData) {
    const investment = new Investment(investmentData);
    await investment.save();
    return investment;
  }

  async getUserInvestment(userId) {
    return await Investment.findOne({ userId });
  }

  async getAllInvestments() {
    return await Investment.find().populate('userId', 'name');
  }

  async releaseFunds(userId) {
    const investment = await Investment.findOneAndUpdate(
      { userId },
      { initialDate: new Date() },
      { new: true }
    );
    if (!investment) throw new Error('Investimento não encontrado');
    return investment;
  }
}

module.exports = new InvestmentService();