const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  password: { type: String, required: true },
  saldoReais: { type: Number, default: 0 },
  wbtcBalance: { type: Number, default: 0 },
  pontos: { type: Number, default: 0 },
  isAdmin: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);