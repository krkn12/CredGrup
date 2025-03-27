const User = require('../models/User');
const Investment = require('../models/Investment');
const Transaction = require('../models/Transaction');
const axios = require('axios');
const logger = require('../utils/logger');

module.exports = {
  getWalletData: async (userId) => {
    try {
      const [user, investments, transactions] = await Promise.all([
        User.findById(userId),
        Investment.find({ user: userId, status: 'approved' }),
        Transaction.find({ user: userId })
          .sort({ createdAt: -1 })
          .limit(10)
      ]);

      if (!user) throw new Error('Usuário não encontrado');

      const totalInvested = investments.reduce((sum, inv) => sum + inv.amount, 0);
      const loanMultiplier = 2;
      const loanAvailable = Math.min(
        user.wbtcBalance * loanMultiplier,
        totalInvested * loanMultiplier
      );

      const [wbtcResponse, usdResponse] = await Promise.all([
        axios.get('https://api.coingecko.com/api/v3/simple/price?ids=wrapped-bitcoin&vs_currencies=brl'),
        axios.get('https://api.coingecko.com/api/v3/simple/price?ids=usd&vs_currencies=brl')
      ]);

      const rates = {
        wbtc: wbtcResponse.data['wrapped-bitcoin'].brl,
        usd: usdResponse.data.usd.brl
      };

      return {
        wbtcBalance: user.wbtcBalance * rates.wbtc,
        totalInvested: totalInvested * rates.usd,
        loanAvailable: loanAvailable * rates.usd,
        recentTransactions: transactions.map(t => ({
          type: t.type,
          amount: t.amount * (t.currency === 'BRL' ? 1 : rates.usd),
          date: t.createdAt
        })),
        lastUpdated: new Date(),
        currency: 'BRL'
      };
    } catch (error) {
      logger.error(`Erro no WalletService: ${error.message}`);
      throw error;
    }
  }
};