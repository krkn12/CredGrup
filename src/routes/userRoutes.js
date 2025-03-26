const express = require('express');
const router = express.Router();
const User = require('../models/User');

router.get('/me', async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'Usuário não encontrado' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao obter usuário' });
  }
});

module.exports = router;