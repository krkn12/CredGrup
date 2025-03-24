const Deposit = require('../models/Deposit');
const User = require('../models/User');

const createDeposit = async (depositData) => {
  const deposit = new Deposit(depositData);
  await deposit.save();
  return deposit;
};

const updateDeposit = async (id, status) => {
  const deposit = await Deposit.findByIdAndUpdate(id, { status }, { new: true }).populate('userId');
  if (status === 'Concluído') {
    const user = await User.findById(deposit.userId);
    user.saldoReais += deposit.valor;
    await user.save();
  }
  return deposit;
};

module.exports = { createDeposit, updateDeposit };