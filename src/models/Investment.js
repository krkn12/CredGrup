const mongoose = require('mongoose');

const investmentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  initialDate: { type: Date, default: Date.now },
  lastAddedDate: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('Investment', investmentSchema);