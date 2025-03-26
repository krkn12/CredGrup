const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  password: { type: String, required: true },
  isAdmin: { type: Boolean, default: false },
  wbtcBalance: { type: Number, default: 0 }, // Saldo em WBTC
  brlBalance: { type: Number, default: 0 }, // Saldo em reais
  brlInvested: { type: Number, default: 0 }, // Valor investido em reais
  wbtcInvested: { type: Number, default: 0 }, // Valor investido em WBTC
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('User', userSchema);