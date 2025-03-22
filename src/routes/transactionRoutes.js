const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const transactionService = require('../services/transactionService');

router.use(authMiddleware.protect);

router.get('/me', async (req, res, next) => {
  try {
    const transactions = await transactionService.getUserTransactions(req.user._id);
    res.json(transactions);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const transaction = await transactionService.updateTransaction(req.params.id, req.body);
    res.json(transaction);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await transactionService.deleteTransaction(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

module.exports = router;