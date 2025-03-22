const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  descricaoPagamento: { type: String, required: true },
  valorPagamento: { type: Number, required: true },
  taxa: { type: Number, default: 0 },
  pixKey: { type: String },
  cashback: { type: Number, default: 0 },
  status: { type: String, enum: ['Pendente', 'Concluído', 'Rejeitado'], default: 'Pendente' },
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);