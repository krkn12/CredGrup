const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  valorPagamento: {
    type: Number,
    required: true
  },
  descricaoPagamento: {
    type: String,
    required: true
  },
  categoriaPagamento: {
    type: String,
    required: true
  },
  pixKey: {
    type: String,
    required: true
  },
  taxa: {
    type: Number,
    required: true,
    default: 0
  },
  status: {
    type: String,
    enum: ['Pendente', 'Concluído', 'Rejeitado'],
    default: 'Pendente'
  },
  valorTotal: {
    type: Number,
    required: false
  },
  cashback: {
    type: Number,
    default: 0
  },
  dataProcessamento: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('Payment', PaymentSchema);
