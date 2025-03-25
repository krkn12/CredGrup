const mongoose = require('mongoose');

const configSchema = new mongoose.Schema({
  loanInterestRate: { type: Number, default: 0.1 }, // 10% padrão
  investmentInterestRate: { type: Number, default: 0.15 }, // 15% padrão
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Config', configSchema);