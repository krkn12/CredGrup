const User = require('../models/User');
const logger = require('../utils/logger');

module.exports = {
  getProfile: async (req, res) => {
    try {
      const user = await User.findById(req.user.id);
      res.json(user);
    } catch (error) {
      logger.error(`Get profile error: ${error.message}`);
      res.status(500).json({ message: 'Erro ao buscar perfil' });
    }
  },

  updateProfile: async (req, res) => {
    try {
      const user = await User.findByIdAndUpdate(req.user.id, req.body, { new: true });
      res.json(user);
    } catch (error) {
      logger.error(`Update profile error: ${error.message}`);
      res.status(400).json({ message: 'Erro ao atualizar perfil' });
    }
  },

  uploadKyc: async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'Nenhum arquivo enviado' });
      }
      
      const user = await User.findByIdAndUpdate(
        req.user.id,
        { 
          kycDocument: req.file.path,
          kycStatus: 'pending'
        },
        { new: true }
      );
      
      res.json({ message: 'Documento enviado para verificação', user });
    } catch (error) {
      logger.error(`KYC upload error: ${error.message}`);
      res.status(500).json({ message: 'Erro ao processar documento' });
    }
  }
};