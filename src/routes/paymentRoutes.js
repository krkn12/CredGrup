const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

router.get('/me', paymentController.getUserPayments);
router.post('/', paymentController.createPayment);

module.exports = router;