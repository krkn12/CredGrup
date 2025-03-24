const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  description: { type: String, required: true },
  amount: { type: Number, required: true },
  taxa: { type: Number, default: 0 },
  status: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);