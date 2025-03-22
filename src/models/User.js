const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  phone: { type: String, required: true }, // Sem criptografia para o MVP
  password: { type: String, required: true, select: false },
  saldoReais: { type: Number, default: 0 },
  wbtcBalance: { type: Number, default: 0 },
  pontos: { type: Number, default: 0 },
  walletAddress: { type: String, default: '' },
  isAdmin: { type: Boolean, default: false },
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 12);
  }
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);