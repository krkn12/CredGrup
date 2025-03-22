const mongoose = require('mongoose');

const loanSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  totalToRepay: { type: Number, required: true },
  dueDate: { type: Date, required: true },
  status: { type: String, enum: ['active', 'repaid', 'overdue'], default: 'active' },
}, { timestamps: true });

module.exports = mongoose.model('Loan', loanSchema);