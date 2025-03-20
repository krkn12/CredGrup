const mongoose = require('mongoose');

const InvestmentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true, default: 0 }, // Saldo total investido
  initialDate: { type: Date, required: true }, // Data do primeiro investimento
  lastAddedDate: { type: Date }, // Última adição de saldo
}, { timestamps: true });

module.exports = mongoose.model('Investment', InvestmentSchema);