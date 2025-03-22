const mongoose = require("mongoose");

const DepositSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    valor: {
      type: Number,
      required: true,
    },
    metodoId: {
      type: String,
      required: true,
    },
    metodoNome: {
      type: String,
      required: true,
    },
    taxa: {
      type: Number,
      default: 0,
    },
    comprovantePath: {
      type: String,
      required: false,
    },
    pontosGanhos: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["Pendente", "Concluído", "Rejeitado"],
      default: "Pendente",
    },
  },
  { timestamps: true, collection: 'deposits' }
);

module.exports = mongoose.model("Deposit", DepositSchema);