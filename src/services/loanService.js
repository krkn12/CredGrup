const Loan = require('../models/Loan');

class LoanService {
  async createLoan(loanData) {
    const loan = new Loan(loanData);
    await loan.save();
    return loan;
  }

  async getUserLoans(userId) {
    return await Loan.find({ userId }).sort({ createdAt: -1 });
  }

  async updateLoan(id, data) {
    const loan = await Loan.findByIdAndUpdate(id, data, { new: true });
    if (!loan) throw new Error('Empréstimo não encontrado');
    return loan;
  }
}

module.exports = new LoanService();