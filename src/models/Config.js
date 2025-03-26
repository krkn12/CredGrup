const mongoose = require('mongoose');

const configSchema = new mongoose.Schema({
  loanInterestRate: { type: Number, default: 0.1 },
  investmentInterestRate: { type: Number, default: 0.15 },
  btcRewardRate: { type: Number, default: 0.0002 },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Config', configSchema);