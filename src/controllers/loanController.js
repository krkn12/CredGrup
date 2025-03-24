const Loan = require('../models/Loan');
const loanService = require('../services/loanService');

const getUserLoans = async (req, res) => {
  try {
    const loans = await Loan.find({ userId: req.user.id }).populate('userId', 'name');
    res.json(loans);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao obter empréstimos' });
  }
};

const createLoan = async (req, res) => {
  try {
    const loanData = {
      userId: req.user.id,
      amount: req.body.amount,
      totalToRepay: req.body.totalToRepay,
      dueDate: req.body.dueDate,
    };
    const loan = await loanService.createLoan(loanData);
    res.status(201).json(loan);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = { getUserLoans, createLoan };