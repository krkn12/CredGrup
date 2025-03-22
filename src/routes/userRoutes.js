const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const userService = require('../services/userService');

router.use(authMiddleware.protect);

router.get('/me', async (req, res, next) => {
  try {
    const user = await userService.getUserById(req.user._id);
    res.json(user);
  } catch (error) {
    next(error);
  }
});

router.put('/me', async (req, res, next) => {
  try {
    const user = await userService.updateUser(req.user._id, req.body);
    res.json(user);
  } catch (error) {
    next(error);
  }
});

module.exports = router;