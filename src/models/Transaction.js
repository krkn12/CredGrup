const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['deposit', 'withdrawal', 'transfer', 'payment'], required: true },
  amount: { type: Number, required: true },
  currency: { type: String, enum: ['BRL', 'USD'], default: 'BRL' },
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
  description: String
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);