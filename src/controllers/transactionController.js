const transactionService = require('../services/transactionService');
const logger = require('../utils/logger');

module.exports = {
  getTransactions: async (req, res) => {
    try {
      const transactions = await transactionService.getUserTransactions(req.user.id);
      res.json(transactions);
    } catch (error) {
      logger.error(`Get transactions error: ${error.message}`);
      res.status(500).json({ message: 'Erro ao buscar transações' });
    }
  },

  createTransaction: async (req, res) => {
    try {
      const transaction = await transactionService.createTransaction(req.user.id, req.body);
      res.status(201).json(transaction);
    } catch (error) {
      logger.error(`Create transaction error: ${error.message}`);
      res.status(400).json({ message: 'Erro ao criar transação' });
    }
  }
};