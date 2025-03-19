const axios = require('axios');
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const depositRoutes = require('./routes/deposits');
const transactionRoutes = require('./routes/transactions');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const multer = require('multer');
const fs = require('fs');

const app = express();
connectDB();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, 'comprovante-' + uniqueSuffix + extension);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Apenas imagens e PDFs são permitidos'));
    }
  }
});

const auth = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token não fornecido' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token inválido' });
  }
};

const authenticateAdmin = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token não fornecido' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.isAdmin) {
      return res.status(403).json({ error: 'Acesso negado. Apenas administradores.' });
    }
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token inválido' });
  }
};

// Função centralizada para buscar o preço do WBTC
let lastValidPrice = 481826.0; // Valor inicial (Abril 2024)
let lastFetchTime = 0;
const MIN_FETCH_INTERVAL = 10000; // 10 segundos

const fetchBitcoinPrice = async () => {
  const now = Date.now();
  if (lastFetchTime > 0 && now - lastFetchTime < MIN_FETCH_INTERVAL) {
    return lastValidPrice;
  }
  
  try {
    const response = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=wrapped-bitcoin&vs_currencies=brl', {
      timeout: 5000,
    });
    
    const price = response.data['wrapped-bitcoin'].brl;
    if (!price || isNaN(price)) {
      console.warn('Preço recebido inválido:', price);
      return lastValidPrice;
    }
    
    console.log(`Preço do WBTC em BRL atualizado: R$ ${price}`);
    lastValidPrice = price;
    lastFetchTime = now;
    return price;
  } catch (error) {
    console.error('Erro ao buscar preço do WBTC:', error.message);
    return lastValidPrice;
  }
};

// Configurações da carteira e Arbiscan
const walletAddress = "0x1c580b494ea23661feec1738bfd8e38adc264775";
const wbtcContractAddress = "0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f";
const apiKey = process.env.ARBISCAN_API_KEY;
let cachedWalletData = { wbtcBalance: 0, lastUpdated: null };
let lastWalletFetchTime = 0;
const WALLET_FETCH_INTERVAL = 30000; // 30 segundos

const fetchWalletBalance = async () => {
  const now = Date.now();
  if (lastWalletFetchTime > 0 && now - lastWalletFetchTime < WALLET_FETCH_INTERVAL) {
    return cachedWalletData;
  }

  try {
    const response = await axios.get(
      `https://api.arbiscan.io/api?module=account&action=tokenbalance&contractaddress=${wbtcContractAddress}&address=${walletAddress}&tag=latest&apikey=${apiKey}`
    );

    if (response.data.status !== "1") {
      throw new Error(response.data.message || "Erro na API da Arbiscan");
    }

    const wbtcBalance = parseFloat(response.data.result) / 1e8;
    cachedWalletData = {
      wbtcBalance,
      lastUpdated: new Date().toISOString(),
    };
    lastWalletFetchTime = now;
    console.log(`Saldo WBTC atualizado: ${wbtcBalance} WBTC`);
    return cachedWalletData;
  } catch (error) {
    console.error("Erro ao buscar saldo da carteira:", error.message);
    return cachedWalletData;
  }
};

setInterval(fetchWalletBalance, WALLET_FETCH_INTERVAL);

// Rotas
app.get('/api/wallet/data', auth, async (req, res) => {
  try {
    const walletData = await fetchWalletBalance();
    res.json(walletData);
  } catch (error) {
    console.error('Erro na rota /api/wallet/data:', error.message);
    res.status(500).json({ error: 'Erro ao buscar dados da carteira' });
  }
});

async function createAdmin() {
  try {
    const User = require('./models/User');
    const adminExists = await User.findOne({ email: 'josiassm701@gmail.com' });
    if (!adminExists) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('32588589', salt);

      const admin = new User({
        email: 'josiassm701@gmail.com',
        password: hashedPassword,
        name: 'Josias',
        phone: '(11) 99999-9999',
        saldoReais: 0,
        wbtcBalance: 0,
        pontos: 0,
        isAdmin: true,
      });
      await admin.save();
      console.log('Admin criado com sucesso: josiassm701@gmail.com');
    } else {
      if (!adminExists.isAdmin) {
        adminExists.isAdmin = true;
        await adminExists.save();
        console.log('Usuário existente atualizado para admin: josiassm701@gmail.com');
      } else {
        console.log('Admin já existe: josiassm701@gmail.com');
      }
    }
  } catch (error) {
    console.error('Erro ao criar/atualizar admin:', error);
  }
}

const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: 'Muitas requisições. Tente novamente em um minuto.',
});
app.use('/api/user/sell-wbtc', limiter);

app.post('/api/user/sell-wbtc', auth, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { wbtcAmount } = req.body;
    const wbtcToSell = parseFloat(wbtcAmount);

    if (!Number.isFinite(wbtcToSell) || wbtcToSell <= 0 || wbtcToSell > 1000) {
      throw new Error('Quantidade de WBTC inválida ou fora do limite permitido (máx: 1000 WBTC)');
    }

    const User = require('./models/User');
    const user = await User.findById(req.user.id).session(session);
    if (!user) throw new Error('Usuário não encontrado');
    if (user.wbtcBalance < wbtcToSell) throw new Error('Saldo insuficiente de WBTC');

    const currentPrice = await fetchBitcoinPrice();
    if (!currentPrice || currentPrice <= 0) throw new Error('Erro ao obter o preço atual do WBTC');

    const valorReais = Math.min(wbtcToSell * currentPrice, Number.MAX_SAFE_INTEGER);
    const valorLiquido = valorReais;
    const pontosGanhos = 1;

    user.wbtcBalance = Math.max(user.wbtcBalance - wbtcToSell, 0);
    user.saldoReais = Math.min(user.saldoReAIS + valorLiquido, Number.MAX_SAFE_INTEGER);
    user.pontos = Math.min(user.pontos + pontosGanhos, Number.MAX_SAFE_INTEGER);

    const Transaction = require('./models/Transaction');
    const transaction = new Transaction({
      userId: user._id,
      description: `Venda de ${wbtcToSell.toFixed(8)} WBTC`,
      amount: valorLiquido,
      taxa: 0,
      status: 'Concluído',
      tipo: 'venda',
      wbtcPrice: currentPrice,
      cashback: 0,
      date: new Date(),
      pontosGanhos,
    });

    await user.save({ session });
    await transaction.save({ session });
    await session.commitTransaction();

    console.log(`Venda concluída: Usuário ${user._id} vendeu ${wbtcToSell} WBTC por R$${valorLiquido}`);

    res.status(201).json({
      message: 'Venda realizada com sucesso',
      transaction,
      updatedUser: {
        wbtcBalance: user.wbtcBalance,
        saldoReais: user.saldoReais,
        pontos: user.pontos,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Erro ao processar venda de WBTC:', error.message);
    res.status(400).json({ error: error.message || 'Erro ao processar a venda' });
  } finally {
    session.endSession();
  }
});

app.get('/api/bitcoin/price', async (req, res) => {
  try {
    const price = await fetchBitcoinPrice();
    res.json({ price });
  } catch (error) {
    console.error('Erro na rota /api/bitcoin/price:', error.message);
    res.status(500).json({ error: 'Erro ao buscar preço do WBTC' });
  }
});

app.post('/api/payments/pix', auth, async (req, res) => {
  try {
    const { valorPagamento, descricaoPagamento, categoriaPagamento, pixKey } = req.body;

    const Payment = require('./models/Payment');
    const payment = new Payment({
      userId: req.user.id,
      valorPagamento: parseFloat(valorPagamento),
      descricaoPagamento,
      categoriaPagamento,
      pixKey,
      taxa: parseFloat(valorPagamento) * 0.03,
      status: 'Pendente',
      cashback: 0,
    });

    await payment.save();
    res.status(201).json(payment);
  } catch (error) {
    console.error('Erro ao criar pagamento:', error);
    res.status(500).json({ message: 'Erro ao processar pagamento', error: error.message });
  }
});

app.get('/api/payments/me', auth, async (req, res) => {
  try {
    const Payment = require('./models/Payment');
    const payments = await Payment.find({ userId: req.user.id });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar pagamentos' });
  }
});

app.get('/api/admin/payments', authenticateAdmin, async (req, res) => {
  try {
    const Payment = require('./models/Payment');
    const payments = await Payment.find().populate('userId', 'name email');
    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar pagamentos' });
  }
});

app.put('/api/admin/payments/:id', authenticateAdmin, async (req, res) => {
  const { status } = req.body;
  if (!['Concluído', 'Rejeitado'].includes(status)) {
    return res.status(400).json({ error: 'Status inválido' });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const Payment = require('./models/Payment');
    const User = require('./models/User');
    
    const payment = await Payment.findById(req.params.id).session(session);
    if (!payment) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ error: 'Pagamento não encontrado' });
    }

    if (payment.status === status) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ error: `Pagamento já está com status ${status}` });
    }

    const user = await User.findById(payment.userId).session(session);
    if (!user) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    payment.status = status;

    if (status === 'Concluído') {
      const valorTotal = payment.valorPagamento + payment.taxa;
      if (user.saldoReais < valorTotal) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ error: 'Saldo insuficiente para aprovar o pagamento' });
      }

      const currentPrice = await fetchBitcoinPrice();
      if (!currentPrice || currentPrice <= 0) {
        await session.abortTransaction();
        session.endSession();
        return res.status(500).json({ error: 'Erro ao obter o preço atual do WBTC' });
      }

      const cashback = payment.valorPagamento * 0.002 / currentPrice;
      
      user.saldoReais -= valorTotal;
      user.wbtcBalance += cashback;
      user.pontos += 1;
      payment.cashback = cashback;

      await user.save({ session });
    }

    await payment.save({ session });
    await session.commitTransaction();
    session.endSession();

    res.json({
      ...payment.toObject(),
      user: {
        saldoReais: user.saldoReais,
        wbtcBalance: user.wbtcBalance,
        pontos: user.pontos,
      }
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Erro ao atualizar pagamento:', error);
    res.status(500).json({ error: 'Erro ao atualizar pagamento', details: error.message });
  }
});

app.post('/api/deposits', auth, upload.single('comprovante'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Comprovante obrigatório' });
    }

    const { valor, metodoId, metodoNome } = req.body;
    const taxa = 0;

    const Deposit = require('./models/Deposit');
    const deposit = new Deposit({
      userId: req.user.id,
      valor: parseFloat(valor),
      metodoId,
      metodoNome: metodoNome || metodoId,
      taxa,
      comprovantePath: req.file.path,
      status: 'Pendente'
    });

    await deposit.save();
    res.status(201).json(deposit);
  } catch (error) {
    console.error('Erro ao criar depósito:', error);
    res.status(500).json({ message: 'Erro ao processar depósito', error: error.message });
  }
});

// Rotas de roteamento
app.use('/api/users', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/deposits', depositRoutes);
app.use('/api/user/transaction', transactionRoutes);

app.get('/api/admin/users', authenticateAdmin, async (req, res) => {
  try {
    const User = require('./models/User');
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar usuários' });
  }
});

app.put('/api/admin/users/:id', authenticateAdmin, async (req, res) => {
  const { saldoReais, wbtcBalance, pontos, isAdmin } = req.body;
  try {
    const User = require('./models/User');
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });

    user.saldoReais = saldoReais !== undefined ? saldoReais : user.saldoReais;
    user.wbtcBalance = wbtcBalance !== undefined ? wbtcBalance : user.wbtcBalance;
    user.pontos = pontos !== undefined ? pontos : user.pontos;
    user.isAdmin = isAdmin !== undefined ? isAdmin : user.isAdmin;

    await user.save();
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar usuário' });
  }
});

app.delete('/api/admin/users/:id', authenticateAdmin, async (req, res) => {
  try {
    const User = require('./models/User');
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
    res.json({ message: 'Usuário deletado com sucesso' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao deletar usuário' });
  }
});

app.get('/api/admin/deposits', authenticateAdmin, async (req, res) => {
  try {
    const Deposit = require('./models/Deposit');
    const deposits = await Deposit.find().populate('userId', 'name email');
    res.json(deposits);
  } catch (error) {
    console.error('Erro na rota /api/admin/deposits:', error);
    res.status(500).json({ error: 'Erro ao buscar depósitos', details: error.message });
  }
});

app.put('/api/admin/deposits/:id', authenticateAdmin, async (req, res) => {
  const { status } = req.body;
  if (!['Concluído', 'Rejeitado'].includes(status)) {
    return res.status(400).json({ error: 'Status inválido' });
  }

  try {
    const Deposit = require('./models/Deposit');
    const deposit = await Deposit.findById(req.params.id);
    if (!deposit) {
      return res.status(404).json({ error: 'Depósito não encontrado' });
    }

    if (deposit.status === status) {
      return res.status(400).json({ error: `Depósito já está com status ${status}` });
    }

    deposit.status = status;

    if (status === 'Concluído') {
      const User = require('./models/User');
      const user = await User.findById(deposit.userId);
      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      user.saldoReais += deposit.valor;
      const pontosGanhos = 1;
      user.pontos += pontosGanhos;

      await user.save();
      deposit.pontosGanhos = pontosGanhos;
    }

    await deposit.save();
    res.json(deposit);
  } catch (error) {
    console.error('Erro na rota /api/admin/deposits/:id:', error);
    res.status(500).json({ error: 'Erro ao atualizar depósito', details: error.message });
  }
});

app.get('/api/admin/transactions', authenticateAdmin, async (req, res) => {
  try {
    const Payment = require('./models/Payment');
    const Transaction = require('./models/Transaction');
    
    const payments = await Payment.find().populate('userId', 'name email');
    const formattedPayments = payments.map(payment => ({
      _id: payment._id,
      user: payment.userId,
      description: payment.descricaoPagamento,
      amount: payment.valorPagamento,
      taxa: payment.taxa,
      status: payment.status,
      date: payment.createdAt,
      type: 'payment'
    }));
    
    let transactions = [];
    try {
      transactions = await Transaction.find().populate('user', 'name email');
    } catch (e) {
      console.log('Modelo de Transaction não encontrado ou erro:', e.message);
    }
    
    const allTransactions = [...formattedPayments, ...transactions];
    allTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    res.json(allTransactions);
  } catch (error) {
    console.error('Erro ao buscar transações:', error);
    res.status(500).json({ error: 'Erro ao buscar transações', details: error.message });
  }
});

app.put('/api/admin/transactions/:id', authenticateAdmin, async (req, res) => {
  const { status, amount, taxa } = req.body;
  try {
    const Transaction = require('./models/Transaction');
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) return res.status(404).json({ error: 'Transação não encontrada' });

    transaction.status = status || transaction.status;
    transaction.amount = amount !== undefined ? amount : transaction.amount;
    transaction.taxa = taxa !== undefined ? taxa : transaction.taxa;

    await transaction.save();
    res.json(transaction);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar transação' });
  }
});

app.delete('/api/admin/transactions/:id', authenticateAdmin, async (req, res) => {
  try {
    const Transaction = require('./models/Transaction');
    const transaction = await Transaction.findByIdAndDelete(req.params.id);
    if (!transaction) return res.status(404).json({ error: 'Transação não encontrada' });
    res.json({ message: 'Transação deletada com sucesso' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao deletar transação' });
  }
});

app.get('/api/admin/deposits/:id/comprovante', authenticateAdmin, async (req, res) => {
  try {
    const Deposit = require('./models/Deposit');
    const deposit = await Deposit.findById(req.params.id);
    if (!deposit) {
      return res.status(404).json({ error: 'Depósito não encontrado' });
    }
    
    if (!deposit.comprovantePath) {
      return res.status(404).json({ error: 'Comprovante não encontrado para este depósito' });
    }
    
    res.json({ 
      filePath: deposit.comprovantePath,
      fileName: path.basename(deposit.comprovantePath) 
    });
  } catch (error) {
    console.error('Erro ao buscar comprovante:', error);
    res.status(500).json({ error: 'Erro ao buscar informações do comprovante' });
  }
});

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  createAdmin().then(() => {
    app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
  });
});