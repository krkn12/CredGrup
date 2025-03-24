const Investment = require('../models/Investment');
const investmentService = require('../services/investmentService');

const getUserInvestment = async (req, res) => {
  try {
    const investment = await Investment.findOne({ userId: req.user.id }).populate('userId', 'name');
    res.json(investment || { amount: 0 });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao obter investimento' });
  }
};

const createInvestment = async (req, res) => {
  try {
    const investmentData = {
      userId: req.user.id,
      amount: req.body.amount,
      initialDate: new Date(),
      lastAddedDate: new Date(),
    };
    const investment = await investmentService.createInvestment(investmentData);
    res.status(201).json(investment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = { getUserInvestment, createInvestment };