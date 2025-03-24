const express = require('express');
const router = express.Router();
const investmentController = require('../controllers/investmentController');

router.get('/me', investmentController.getUserInvestment);
router.post('/', investmentController.createInvestment);

module.exports = router;