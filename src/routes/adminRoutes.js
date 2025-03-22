const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const userService = require('../services/userService');
const depositService = require('../services/depositService');
const paymentService = require('../services/paymentService');
const transactionService = require('../services/transactionService');
const loanService = require('../services/loanService');
const investmentService = require('../services/investmentService');
const { logSensitiveAccess } = require('../utils/logger');

router.use(authMiddleware.protect);
router.use(authMiddleware.restrictTo('admin'));

router.get('/users', async (req, res, next) => {
  try {
    const users = await userService.getAllUsers();
    logSensitiveAccess(req, 'users_list'); // Auditoria
    res.json(users);
  } catch (error) {
    next(error);
  }
});

router.put('/users/:id', async (req, res, next) => {
  try {
    const user = await userService.updateUser(req.params.id, req.body);
    logSensitiveAccess(req, 'user_update'); // Auditoria
    res.json(user);
  } catch (error) {
    next(error);
  }
});

router.delete('/users/:id', async (req, res, next) => {
  try {
    await userService.deleteUser(req.params.id);
    logSensitiveAccess(req, 'user_delete'); // Auditoria
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

router.get('/deposits', async (req, res, next) => {
  try {
    const deposits = await depositService.getAllDeposits();
    logSensitiveAccess(req, 'deposits_list'); // Auditoria
    res.json(deposits);
  } catch (error) {
    next(error);
  }
});

router.put('/deposits/:id', async (req, res, next) => {
  try {
    const deposit = await depositService.updateDeposit(req.params.id, req.body);
    logSensitiveAccess(req, 'deposit_update'); // Auditoria
    res.json(deposit);
  } catch (error) {
    next(error);
  }
});

router.get('/payments', async (req, res, next) => {
  try {
    const payments = await paymentService.getAllPayments();
    logSensitiveAccess(req, 'payments_list'); // Auditoria
    res.json(payments);
  } catch (error) {
    next(error);
  }
});

router.put('/payments/:id', async (req, res, next) => {
  try {
    const payment = await paymentService.updatePayment(req.params.id, req.body);
    logSensitiveAccess(req, 'payment_update'); // Auditoria
    res.json(payment);
  } catch (error) {
    next(error);
  }
});

router.get('/transactions', async (req, res, next) => {
  try {
    const transactions = await transactionService.getAllTransactions();
    logSensitiveAccess(req, 'transactions_list'); // Auditoria
    res.json(transactions);
  } catch (error) {
    next(error);
  }
});

router.put('/transactions/:id', async (req, res, next) => {
  try {
    const transaction = await transactionService.updateTransaction(req.params.id, req.body);
    logSensitiveAccess(req, 'transaction_update'); // Auditoria
    res.json(transaction);
  } catch (error) {
    next(error);
  }
});

router.delete('/transactions/:id', async (req, res, next) => {
  try {
    await transactionService.deleteTransaction(req.params.id);
    logSensitiveAccess(req, 'transaction_delete'); // Auditoria
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

router.get('/loans', async (req, res, next) => {
  try {
    const loans = await loanService.getAllLoans();
    logSensitiveAccess(req, 'loans_list'); // Auditoria
    res.json(loans);
  } catch (error) {
    next(error);
  }
});

router.put('/loans/:id', async (req, res, next) => {
  try {
    const loan = await loanService.updateLoan(req.params.id, req.body);
    logSensitiveAccess(req, 'loan_update'); // Auditoria
    res.json(loan);
  } catch (error) {
    next(error);
  }
});

router.get('/investments', async (req, res, next) => {
  try {
    const investments = await investmentService.getAllInvestments();
    logSensitiveAccess(req, 'investments_list'); // Auditoria
    res.json(investments);
  } catch (error) {
    next(error);
  }
});

module.exports = router;