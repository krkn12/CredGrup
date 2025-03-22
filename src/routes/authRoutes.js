const express = require('express');
const router = express.Router();
const authService = require('../services/authService');
const { validateLogin, validateRegister } = require('../utils/validator');
const rateLimitMiddleware = require('../middleware/rateLimitMiddleware');

router.post('/login', rateLimitMiddleware.loginLimiter, async (req, res, next) => {
  try {
    const { error } = validateLogin(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });
    const { token, user } = await authService.login(req.body.email, req.body.password);
    res.json({ 
      token, 
      id: user._id, 
      name: user.name,
      email: user.email, 
      phone: user.phone,
      saldoReais: user.saldoReais,
      wbtcBalance: user.wbtcBalance,
      pontos: user.pontos,
      walletAddress: user.walletAddress,
      isAdmin: user.isAdmin 
    });
  } catch (error) {
    next(error);
  }
});

router.post('/register', rateLimitMiddleware.registerLimiter, async (req, res, next) => {
  try {
    const { error } = validateRegister(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });
    const user = await authService.register(req.body);
    res.status(201).json({ message: 'Usuário registrado com sucesso' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;