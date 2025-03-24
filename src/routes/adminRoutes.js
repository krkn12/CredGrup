const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

router.get('/users', adminController.getAllUsers);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);
router.get('/deposits', adminController.getAllDeposits);
router.put('/deposits/:id', adminController.updateDeposit);
router.get('/deposits/:id/comprovante', adminController.getDepositReceipt);
router.get('/payments', adminController.getAllPayments);
router.put('/payments/:id', adminController.updatePayment);
router.get('/transactions', adminController.getAllTransactions);
router.put('/transactions/:id', adminController.updateTransaction);
router.delete('/transactions/:id', adminController.deleteTransaction);
router.get('/loans', adminController.getAllLoans);
router.put('/loans/:id', adminController.updateLoan);
router.get('/investments', adminController.getAllInvestments);
router.put('/investments/release/:userId', adminController.releaseInvestment);

module.exports = router;