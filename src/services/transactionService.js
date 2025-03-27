const Transaction = require('../models/Transaction');
const logger = require('../utils/logger');

module.exports = {
  createTransaction: async (userId, transactionData) => {
    try {
      const transaction = new Transaction({
        user: userId,
        ...transactionData
      });
      await transaction.save();
      return transaction;
    } catch (error) {
      logger.error(`Transaction error: ${error.message}`);
      throw error;
    }
  },

  getUserTransactions: async (userId, limit = 10) => {
    return await Transaction.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(limit);
  }
};