const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  description: { type: String, required: true },
  amount: { type: Number, required: true },
  tipo: { type: String, enum: ['pagamento', 'venda', 'deposito'], required: true },
  taxa: { type: Number, default: 0 },
  status: { type: String, enum: ['Pendente', 'Concluído', 'Rejeitado'], default: 'Concluído' },
  cashback: { type: Number, default: 0 },
  pixKey: { type: String },
  wbtcPrice: { type: Number },
}, { timestamps: true });

module.exports = mongoose.model('Transaction', TransactionSchema);