const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const paymentService = require('../services/paymentService');

router.use(authMiddleware.protect);

router.post('/', async (req, res, next) => {
  try {
    const paymentData = { ...req.body, userId: req.user._id };
    const payment = await paymentService.createPayment(paymentData);
    res.status(201).json(payment);
  } catch (error) {
    next(error);
  }
});

router.get('/me', async (req, res, next) => {
  try {
    const payments = await paymentService.getUserPayments(req.user._id);
    res.json(payments);
  } catch (error) {
    next(error);
  }
});

module.exports = router;