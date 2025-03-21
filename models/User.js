const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  password: { type: String, required: true },
  saldoReais: { type: Number, default: 0 },
  wbtcBalance: { type: Number, default: 0 },
  pontos: { type: Number, default: 0 },
  walletAddress: { type: String, default: '0xSeuEnderecoAqui' },
  paymentHistory: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' }],
  isAdmin: { type: Boolean, default: true },
}, { timestamps: true });

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);