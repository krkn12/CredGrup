const router = require('express').Router();
const transactionController = require('../controllers/transactionController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', authMiddleware, transactionController.getTransactions);
router.post('/', authMiddleware, transactionController.createTransaction);

module.exports = router;