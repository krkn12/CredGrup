const walletService = require('../services/walletService');
const logger = require('../utils/logger');

module.exports = {
  getWalletData: async (req, res) => {
    try {
      const data = await walletService.getWalletData(req.user.id);
      res.json(data);
    } catch (error) {
      logger.error(`Wallet error: ${error.message}`);
      res.status(500).json({ message: 'Erro ao buscar dados da carteira' });
    }
  },

  getTransactions: async (req, res) => {
    try {
      const transactions = await walletService.getTransactions(req.user.id);
      res.json(transactions);
    } catch (error) {
      logger.error(`Transactions error: ${error.message}`);
      res.status(500).json({ message: 'Erro ao buscar transações' });
    }
  }
};