const Deposit = require('../models/Deposit');
const depositService = require('../services/depositService');

const getUserDeposits = async (req, res) => {
  try {
    const deposits = await Deposit.find({ userId: req.user.id }).populate('userId', 'name');
    res.json(deposits);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao obter depósitos' });
  }
};

const createDeposit = async (req, res) => {
  try {
    const depositData = {
      userId: req.user.id,
      valor: req.body.valor,
      metodoId: req.body.metodoId,
      metodoNome: req.body.metodoNome,
      taxa: req.body.taxa,
      comprovante: req.file ? req.file.filename : null,
    };
    const deposit = await depositService.createDeposit(depositData);
    res.status(201).json(deposit);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = { getUserDeposits, createDeposit };