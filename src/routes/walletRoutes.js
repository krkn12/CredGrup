const router = require('express').Router();
const walletController = require('../controllers/walletController');
const authMiddleware = require('../middleware/authMiddleware');

// Rotas de carteira
router.get('/data', authMiddleware, walletController.getWalletData);
router.get('/transactions', authMiddleware, walletController.getTransactions);

// Exportação CORRETA (apenas o router)
module.exports = router;