const Transaction = require('../models/Transaction');
const User = require('../models/User');

exports.createTransaction = async (req, res) => {
  const { description, amount, tipo, taxa, status, pixKey } = req.body;

  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });

    if (tipo === 'pagamento' && user.saldoReais < Math.abs(amount) + taxa) {
      return res.status(400).json({ error: 'Saldo insuficiente' });
    }
    if (tipo === 'venda' && user.wbtcBalance < Math.abs(amount / 481826.0)) {
      return res.status(400).json({ error: 'Saldo WBTC insuficiente' });
    }

    const transaction = new Transaction({
      userId: req.user.id,
      description,
      amount,
      tipo,
      taxa,
      status,
      pixKey,
    });
    await transaction.save();

    if (tipo === 'pagamento') {
      user.saldoReais -= (Math.abs(amount) + taxa);
      user.wbtcBalance += (Math.abs(amount) * 0.002) / 481826.0; // Cashback fixo
      user.pontos += 1;
    } else if (tipo === 'venda') {
      user.wbtcBalance -= Math.abs(amount / 481826.0);
      user.saldoReais += amount;
      user.pontos += 1;
    }

    user.paymentHistory.push(transaction._id);
    await user.save();

    res.status(201).json(transaction);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar transação' });
  }
};