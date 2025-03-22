const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const depositService = require('../services/depositService');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, process.env.UPLOAD_DIR),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage });

router.use(authMiddleware.protect);

router.post('/', upload.single('comprovante'), async (req, res, next) => {
  try {
    const depositData = {
      ...req.body,
      userId: req.user._id,
      comprovante: req.file ? req.file.filename : null,
    };
    const deposit = await depositService.createDeposit(depositData);
    res.status(201).json(deposit);
  } catch (error) {
    next(error);
  }
});

router.get('/me', async (req, res, next) => {
  try {
    const deposits = await depositService.getUserDeposits(req.user._id);
    res.json(deposits);
  } catch (error) {
    next(error);
  }
});

module.exports = router;