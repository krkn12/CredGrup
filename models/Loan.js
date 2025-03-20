const mongoose = require('mongoose');

const loanSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  interestRate: { type: Number, default: 0.05 },
  startDate: { type: Date, default: Date.now },
  dueDate: { type: Date, required: true },
  totalToRepay: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['active', 'repaid', 'overdue'], 
    default: 'active' 
  },
});

module.exports = mongoose.model('Loan', loanSchema);