const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const investmentService = require('../services/investmentService');

router.use(authMiddleware.protect);

router.post('/', async (req, res, next) => {
  try {
    const investmentData = { ...req.body, userId: req.user._id };
    const investment = await investmentService.createInvestment(investmentData);
    res.status(201).json(investment);
  } catch (error) {
    next(error);
  }
});

router.get('/me', async (req, res, next) => {
  try {
    const investment = await investmentService.getUserInvestment(req.user._id);
    res.json(investment || { amount: 0 });
  } catch (error) {
    next(error);
  }
});

router.get('/', authMiddleware.restrictTo('admin'), async (req, res, next) => {
  try {
    const investments = await investmentService.getAllInvestments();
    res.json(investments);
  } catch (error) {
    next(error);
  }
});

router.put('/release/:userId', authMiddleware.restrictTo('admin'), async (req, res, next) => {
  try {
    const investment = await investmentService.releaseFunds(req.params.userId);
    res.json({ investment });
  } catch (error) {
    next(error);
  }
});

module.exports = router;