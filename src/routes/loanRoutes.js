const express = require('express');
const router = express.Router();
const loanController = require('../controllers/loanController');

router.get('/me', loanController.getUserLoans);
router.post('/', loanController.createLoan);

module.exports = router;