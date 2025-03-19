const express = require('express');
const { createTransaction } = require('../controllers/transactionController');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

router.post('/', authMiddleware, createTransaction);

module.exports = router;