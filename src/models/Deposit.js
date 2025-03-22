const mongoose = require('mongoose');

const depositSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  valor: { type: Number, required: true },
  metodoId: { type: String, required: true },
  metodoNome: { type: String, required: true },
  taxa: { type: Number, default: 0 },
  comprovante: { type: String }, // Nome do arquivo no servidor
  status: { type: String, enum: ['Pendente', 'Concluído', 'Rejeitado'], default: 'Pendente' },
}, { timestamps: true });

module.exports = mongoose.model('Deposit', depositSchema);