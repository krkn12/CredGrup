const express = require('express');
const router = express.Router();
const depositController = require('../controllers/depositController');
const multer = require('multer');
const upload = multer({ dest: '../uploads/' });

router.get('/me', depositController.getUserDeposits);
router.post('/', upload.single('comprovante'), depositController.createDeposit);

module.exports = router;