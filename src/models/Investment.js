const mongoose = require('mongoose');

const investmentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  initialDate: { type: Date, required: true },
  lastAddedDate: { type: Date, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Investment', investmentSchema);