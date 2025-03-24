const Transaction = require('../models/Transaction');

const getUserTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user.id }).populate('user', 'name');
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao obter transações' });
  }
};

module.exports = { getUserTransactions };