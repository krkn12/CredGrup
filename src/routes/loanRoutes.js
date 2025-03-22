const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const loanService = require('../services/loanService');

router.use(authMiddleware.protect);

router.post('/', async (req, res, next) => {
  try {
    const loanData = { ...req.body, userId: req.user._id };
    const loan = await loanService.createLoan(loanData);
    res.status(201).json(loan);
  } catch (error) {
    next(error);
  }
});

router.get('/me', async (req, res, next) => {
  try {
    const loans = await loanService.getUserLoans(req.user._id);
    res.json(loans);
  } catch (error) {
    next(error);
  }
});

module.exports = router;