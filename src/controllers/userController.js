const userService = require('../services/userService');

const getMe = async (req, res) => {
  try {
    const user = await userService.getUserById(req.user.id);
    if (!user) return res.status(404).json({ message: 'Usuário não encontrado' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao obter dados do usuário' });
  }
};

module.exports = { getMe };