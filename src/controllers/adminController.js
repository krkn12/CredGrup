const User = require('../models/User');
const Deposit = require('../models/Deposit');
const Payment = require('../models/Payment');
const Transaction = require('../models/Transaction');
const Loan = require('../models/Loan');
const Investment = require('../models/Investment');
const userService = require('../services/userService');
const depositService = require('../services/depositService');
const paymentService = require('../services/paymentService');
const transactionService = require('../services/transactionService');
const loanService = require('../services/loanService');
const investmentService = require('../services/investmentService');

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao obter usuários' });
  }
};

const updateUser = async (req, res) => {
  try {
    const user = await userService.updateUser(req.params.id, req.body);
    res.json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    await userService.deleteUser(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getAllDeposits = async (req, res) => {
  try {
    const deposits = await Deposit.find().populate('userId', 'name');
    res.json(deposits);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao obter depósitos' });
  }
};

const updateDeposit = async (req, res) => {
  try {
    const deposit = await depositService.updateDeposit(req.params.id, req.body.status);
    res.json(deposit);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getDepositReceipt = async (req, res) => {
  try {
    const deposit = await Deposit.findById(req.params.id);
    if (!deposit || !deposit.comprovante) {
      return res.status(404).json({ message: 'Comprovante não encontrado' });
    }
    res.json({ fileName: deposit.comprovante });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao obter comprovante' });
  }
};

const getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.find().populate('userId', 'name');
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao obter pagamentos' });
  }
};

const updatePayment = async (req, res) => {
  try {
    const payment = await paymentService.updatePayment(req.params.id, req.body.status);
    res.json(payment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getAllTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find().populate('user', 'name');
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao obter transações' });
  }
};

const updateTransaction = async (req, res) => {
  try {
    const transaction = await transactionService.updateTransaction(req.params.id, req.body);
    res.json(transaction);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const deleteTransaction = async (req, res) => {
  try {
    await transactionService.deleteTransaction(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getAllLoans = async (req, res) => {
  try {
    const loans = await Loan.find().populate('userId', 'name');
    res.json(loans);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao obter empréstimos' });
  }
};

const updateLoan = async (req, res) => {
  try {
    const loan = await loanService.updateLoan(req.params.id, req.body.status);
    res.json(loan);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getAllInvestments = async (req, res) => {
  try {
    const investments = await Investment.find().populate('userId', 'name');
    res.json(investments);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao obter investimentos' });
  }
};

const releaseInvestment = async (req, res) => {
  try {
    const investment = await investmentService.releaseInvestment(req.params.userId);
    res.json({ investment });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  getAllUsers,
  updateUser,
  deleteUser,
  getAllDeposits,
  updateDeposit,
  getDepositReceipt,
  getAllPayments,
  updatePayment,
  getAllTransactions,
  updateTransaction,
  deleteTransaction,
  getAllLoans,
  updateLoan,
  getAllInvestments,
  releaseInvestment,
};