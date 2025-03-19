const Deposit = require('../models/Deposit');
const User = require('../models/User');
const path = require('path');

exports.createDeposit = async (req, res) => {
  const { valor, metodoId, metodoNome, taxa } = req.body;
  const comprovante = req.file ? req.file.path : null;

  if (!comprovante) return res.status(400).json({ error: 'Comprovante é obrigatório' });

  try {
    const deposit = new Deposit({
      userId: req.user.id,
      valor,
      metodoId,
      metodoNome,
      taxa,
      comprovante,
    });
    await deposit.save();

    // Não atualiza o saldo imediatamente, espera aprovação
    res.status(201).json(deposit);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao registrar depósito' });
  }
};

exports.getUserDeposits = async (req, res) => {
  try {
    const deposits = await Deposit.find({ userId: req.user.id });
    res.json(deposits);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar depósitos' });
  }
};