const Transaction = require('../models/Transaction');

class TransactionService {
  async createTransaction(transactionData) {
    const transaction = new Transaction(transactionData);
    await transaction.save();
    return transaction;
  }

  async getUserTransactions(userId) {
    return await Transaction.find({ userId }).sort({ date: -1 });
  }

  async updateTransaction(id, data) {
    const transaction = await Transaction.findByIdAndUpdate(id, data, { new: true });
    if (!transaction) throw new Error('Transação não encontrada');
    return transaction;
  }

  async deleteTransaction(id) {
    const transaction = await Transaction.findByIdAndDelete(id);
    if (!transaction) throw new Error('Transação não encontrada');
    return transaction;
  }
}

module.exports = new TransactionService();