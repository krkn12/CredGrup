require("dotenv").config({ path: "./.env" });
console.log("MONGO_URI carregada:", process.env.MONGO_URI);

const mongoose = require("mongoose"); // Importar mongoose no início
const express = require("express");
const cors = require("cors");
const path = require("path");
const https = require("https");
const fs = require("fs");
const connectDatabase = require("./config/connectDB");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use("/api/uploads", express.static(path.join(__dirname, "uploads")));

// Conectar ao banco de dados antes de importar modelos e rotas
connectDatabase()
  .then(() => {
    console.log("Banco conectado:", mongoose.connection.name);

    // Importar modelos após a conexão
    const User = require("./models/User");
    const Deposit = require("./models/Deposit");
    const Transaction = require("./models/Transaction");
    const Payment = require("./models/Payment");
    const Loan = require("./models/Loan");
    const Investment = require("./models/Investment");

    // Configuração do Multer
    const multer = require("multer");
    const storage = multer.diskStorage({
      destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, "uploads");
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
      },
      filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const extension = path.extname(file.originalname);
        cb(null, "comprovante-" + uniqueSuffix + extension);
      },
    });
    const upload = multer({
      storage: storage,
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
      fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith("image/") || file.mimetype === "application/pdf") {
          cb(null, true);
        } else {
          cb(new Error("Apenas imagens e PDFs são permitidos"));
        }
      },
    });

    // Middleware de autenticação
    const jwt = require("jsonwebtoken");
    const auth = (req, res, next) => {
      const token = req.header("Authorization")?.split(" ")[1];
      if (!token) return res.status(401).json({ error: "Token não fornecido" });
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
      } catch (error) {
        res.status(401).json({ error: "Token inválido" });
      }
    };

    const authenticateAdmin = (req, res, next) => {
      const token = req.headers.authorization?.split(" ")[1];
      if (!token) return res.status(401).json({ error: "Token não fornecido" });
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded.isAdmin) {
          return res.status(403).json({ error: "Acesso negado. Apenas administradores." });
        }
        req.user = decoded;
        next();
      } catch (error) {
        res.status(401).json({ error: "Token inválido" });
      }
    };

    // Rotas
    app.use("/api/users", require("./routes/auth"));
    app.use("/api/users", require("./routes/users"));
    app.use("/api/deposits", require("./routes/deposits"));
    app.use("/api/user/transaction", require("./routes/transactions"));

    // Rotas adicionais
    const axios = require("axios");
    const rateLimit = require("express-rate-limit");

    let lastValidPrice = 481826.0;
    let lastFetchTime = 0;
    const MIN_FETCH_INTERVAL = 10000;
    const fetchBitcoinPrice = async () => {
      const now = Date.now();
      if (lastFetchTime > 0 && now - lastFetchTime < MIN_FETCH_INTERVAL) {
        return lastValidPrice;
      }
      try {
        const response = await axios.get(
          "https://api.coingecko.com/api/v3/simple/price?ids=wrapped-bitcoin&vs_currencies=brl",
          { timeout: 5000 }
        );
        const price = response.data["wrapped-bitcoin"].brl;
        if (!price || isNaN(price)) {
          console.warn("Preço recebido inválido:", price);
          return lastValidPrice;
        }
        console.log(`Preço do WBTC em BRL atualizado: R$ ${price}`);
        lastValidPrice = price;
        lastFetchTime = now;
        return price;
      } catch (error) {
        console.error("Erro ao buscar preço do WBTC:", error.message);
        return lastValidPrice;
      }
    };

    const walletAddress = "0x1c580b494ea23661feec1738bfd8e38adc264775";
    const wbtcContractAddress = "0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f";
    const apiKey = process.env.ARBISCAN_API_KEY;
    let cachedWalletData = { wbtcBalance: 0, lastUpdated: null };
    let lastWalletFetchTime = 0;
    const WALLET_FETCH_INTERVAL = 30000;

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
        cachedWalletData = { wbtcBalance, lastUpdated: new Date().toISOString() };
        lastWalletFetchTime = now;
        console.log(`Saldo WBTC atualizado: ${wbtcBalance} WBTC`);
        return cachedWalletData;
      } catch (error) {
        console.error("Erro ao buscar saldo da carteira:", error.message);
        return cachedWalletData;
      }
    };

    setInterval(fetchWalletBalance, WALLET_FETCH_INTERVAL);

    app.get("/api/wallet/data", auth, async (req, res) => {
      try {
        const walletData = await fetchWalletBalance();
        res.json(walletData);
      } catch (error) {
        console.error("Erro na rota /api/wallet/data:", error.message);
        res.status(500).json({ error: "Erro ao buscar dados da carteira" });
      }
    });

    const limiter = rateLimit({
      windowMs: 60 * 1000,
      max: 5,
      message: "Muitas requisições. Tente novamente em um minuto.",
    });
    app.use("/api/user/sell-wbtc", limiter);

    app.post("/api/user/sell-wbtc", auth, async (req, res) => {
      const session = await mongoose.startSession();
      session.startTransaction();
      try {
        const { wbtcAmount } = req.body;
        const wbtcToSell = parseFloat(wbtcAmount);
        if (!Number.isFinite(wbtcToSell) || wbtcToSell <= 0 || wbtcToSell > 1000) {
          throw new Error("Quantidade de WBTC inválida ou fora do limite permitido (máx: 1000 WBTC)");
        }
        const user = await User.findById(req.user.id).session(session);
        if (!user) throw new Error("Usuário não encontrado");
        if (user.wbtcBalance < wbtcToSell) throw new Error("Saldo insuficiente de WBTC");
        const currentPrice = await fetchBitcoinPrice();
        if (!currentPrice || currentPrice <= 0) throw new Error("Erro ao obter o preço atual do WBTC");
        const valorReais = Math.min(wbtcToSell * currentPrice, Number.MAX_SAFE_INTEGER);
        const valorLiquido = valorReais;
        const pontosGanhos = 1;
        user.wbtcBalance = Math.max(user.wbtcBalance - wbtcToSell, 0);
        user.saldoReais = Math.min(user.saldoReais + valorLiquido, Number.MAX_SAFE_INTEGER);
        user.pontos = Math.min(user.pontos + pontosGanhos, Number.MAX_SAFE_INTEGER);
        const transaction = new Transaction({
          userId: user._id,
          description: `Venda de ${wbtcToSell.toFixed(8)} WBTC`,
          amount: valorLiquido,
          taxa: 0,
          status: "Concluído",
          tipo: "venda",
          wbtcPrice: currentPrice,
          cashback: 0,
          date: new Date(),
          pontosGanhos,
        });
        await user.save({ session });
        await transaction.save({ session });
        await session.commitTransaction();
        res.status(201).json({
          message: "Venda realizada com sucesso",
          transaction,
          updatedUser: {
            wbtcBalance: user.wbtcBalance,
            saldoReais: user.saldoReais,
            pontos: user.pontos,
          },
        });
      } catch (error) {
        await session.abortTransaction();
        console.error("Erro ao processar venda de WBTC:", error.message);
        res.status(400).json({ error: error.message || "Erro ao processar a venda" });
      } finally {
        session.endSession();
      }
    });

    app.get("/api/bitcoin/price", async (req, res) => {
      try {
        const price = await fetchBitcoinPrice();
        res.json({ price });
      } catch (error) {
        console.error("Erro na rota /api/bitcoin/price:", error.message);
        res.status(500).json({ error: "Erro ao buscar preço do WBTC" });
      }
    });

    app.post("/api/payments/pix", auth, async (req, res) => {
      try {
        const { valorPagamento, descricaoPagamento, categoriaPagamento, pixKey } = req.body;
        console.log("Banco atual antes de salvar pagamento:", mongoose.connection.name);
        const payment = new Payment({
          userId: req.user.id,
          valorPagamento: parseFloat(valorPagamento),
          descricaoPagamento,
          categoriaPagamento,
          pixKey,
          taxa: parseFloat(valorPagamento) * 0.03,
          status: "Pendente",
          cashback: 0,
        });
        await payment.save();
        res.status(201).json(payment);
      } catch (error) {
        console.error("Erro ao criar pagamento:", error);
        res.status(500).json({ message: "Erro ao processar pagamento", error: error.message });
      }
    });

    app.get("/api/payments/me", auth, async (req, res) => {
      try {
        const payments = await Payment.find({ userId: req.user.id });
        res.json(payments);
      } catch (error) {
        res.status(500).json({ error: "Erro ao buscar pagamentos" });
      }
    });

    app.get("/api/admin/payments", authenticateAdmin, async (req, res) => {
      try {
        const payments = await Payment.find().populate("userId", "name email");
        res.json(payments);
      } catch (error) {
        res.status(500).json({ error: "Erro ao buscar pagamentos" });
      }
    });

    app.put("/api/admin/payments/:id", authenticateAdmin, async (req, res) => {
      const { status } = req.body;
      if (!["Concluído", "Rejeitado"].includes(status)) {
        return res.status(400).json({ error: "Status inválido" });
      }
      const session = await mongoose.startSession();
      session.startTransaction();
      try {
        const payment = await Payment.findById(req.params.id).session(session);
        if (!payment) {
          await session.abortTransaction();
          session.endSession();
          return res.status(404).json({ error: "Pagamento não encontrado" });
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
          return res.status(404).json({ error: "Usuário não encontrado" });
        }
        payment.status = status;
        if (status === "Concluído") {
          const valorTotal = payment.valorPagamento + payment.taxa;
          if (user.saldoReais < valorTotal) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ error: "Saldo insuficiente para aprovar o pagamento" });
          }
          const currentPrice = await fetchBitcoinPrice();
          if (!currentPrice || currentPrice <= 0) {
            await session.abortTransaction();
            session.endSession();
            return res.status(500).json({ error: "Erro ao obter o preço atual do WBTC" });
          }
          const cashback = (payment.valorPagamento * 0.002) / currentPrice;
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
          },
        });
      } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error("Erro ao atualizar pagamento:", error);
        res.status(500).json({ error: "Erro ao atualizar pagamento", details: error.message });
      }
    });

    app.post("/api/deposits", auth, upload.single("comprovante"), async (req, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ message: "Comprovante obrigatório" });
        }
        const { valor, metodoId, metodoNome } = req.body;
        const taxa = 0;
        console.log("Banco atual antes de salvar depósito:", mongoose.connection.name);
        const deposit = new Deposit({
          userId: req.user.id,
          valor: parseFloat(valor),
          metodoId,
          metodoNome: metodoNome || metodoId,
          taxa,
          comprovantePath: req.file.path,
          status: "Pendente",
        });
        await deposit.save();
        res.status(201).json(deposit);
      } catch (error) {
        console.error("Erro ao criar depósito:", error);
        res.status(500).json({ message: "Erro ao processar depósito", error: error.message });
      }
    });

    app.get("/api/admin/users", authenticateAdmin, async (req, res) => {
      try {
        const users = await User.find().select("-password");
        res.json(users);
      } catch (error) {
        res.status(500).json({ error: "Erro ao buscar usuários" });
      }
    });

    app.put("/api/admin/users/:id", authenticateAdmin, async (req, res) => {
      const { saldoReais, wbtcBalance, pontos, isAdmin } = req.body;
      try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ error: "Usuário não encontrado" });
        user.saldoReais = saldoReais !== undefined ? saldoReais : user.saldoReais;
        user.wbtcBalance = wbtcBalance !== undefined ? wbtcBalance : user.wbtcBalance;
        user.pontos = pontos !== undefined ? pontos : user.pontos;
        user.isAdmin = isAdmin !== undefined ? isAdmin : user.isAdmin;
        await user.save();
        res.json(user);
      } catch (error) {
        res.status(500).json({ error: "Erro ao atualizar usuário" });
      }
    });

    app.delete("/api/admin/users/:id", authenticateAdmin, async (req, res) => {
      try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) return res.status(404).json({ error: "Usuário não encontrado" });
        res.json({ message: "Usuário deletado com sucesso" });
      } catch (error) {
        res.status(500).json({ error: "Erro ao deletar usuário" });
      }
    });

    app.get("/api/admin/deposits", authenticateAdmin, async (req, res) => {
      try {
        const deposits = await Deposit.find().populate("userId", "name email");
        res.json(deposits);
      } catch (error) {
        console.error("Erro na rota /api/admin/deposits:", error);
        res.status(500).json({ error: "Erro ao buscar depósitos", details: error.message });
      }
    });

    app.put("/api/admin/deposits/:id", authenticateAdmin, async (req, res) => {
      const { status } = req.body;
      if (!["Concluído", "Rejeitado"].includes(status)) {
        return res.status(400).json({ error: "Status inválido" });
      }
      try {
        const deposit = await Deposit.findById(req.params.id);
        if (!deposit) {
          return res.status(404).json({ error: "Depósito não encontrado" });
        }
        if (deposit.status === status) {
          return res.status(400).json({ error: `Depósito já está com status ${status}` });
        }
        deposit.status = status;
        if (status === "Concluído") {
          const user = await User.findById(deposit.userId);
          if (!user) {
            return res.status(404).json({ error: "Usuário não encontrado" });
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
        console.error("Erro na rota /api/admin/deposits/:id:", error);
        res.status(500).json({ error: "Erro ao atualizar depósito", details: error.message });
      }
    });

    app.get("/api/admin/transactions", authenticateAdmin, async (req, res) => {
      try {
        const payments = await Payment.find().populate("userId", "name email");
        const formattedPayments = payments.map((payment) => ({
          _id: payment._id,
          user: payment.userId,
          description: payment.descricaoPagamento,
          amount: payment.valorPagamento,
          taxa: payment.taxa,
          status: payment.status,
          date: payment.createdAt,
          type: "payment",
        }));
        let transactions = [];
        try {
          transactions = await Transaction.find().populate("userId", "name email");
        } catch (e) {
          console.log("Modelo de Transaction não encontrado ou erro:", e.message);
        }
        const allTransactions = [...formattedPayments, ...transactions];
        allTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
        res.json(allTransactions);
      } catch (error) {
        console.error("Erro ao buscar transações:", error);
        res.status(500).json({ error: "Erro ao buscar transações", details: error.message });
      }
    });

    app.put("/api/admin/transactions/:id", authenticateAdmin, async (req, res) => {
      const { status, amount, taxa } = req.body;
      try {
        const transaction = await Transaction.findById(req.params.id);
        if (!transaction) return res.status(404).json({ error: "Transação não encontrada" });
        transaction.status = status || transaction.status;
        transaction.amount = amount !== undefined ? amount : transaction.amount;
        transaction.taxa = taxa !== undefined ? taxa : transaction.taxa;
        await transaction.save();
        res.json(transaction);
      } catch (error) {
        res.status(500).json({ error: "Erro ao atualizar transação" });
      }
    });

    app.delete("/api/admin/transactions/:id", authenticateAdmin, async (req, res) => {
      try {
        const transaction = await Transaction.findByIdAndDelete(req.params.id);
        if (!transaction) return res.status(404).json({ error: "Transação não encontrada" });
        res.json({ message: "Transação deletada com sucesso" });
      } catch (error) {
        res.status(500).json({ error: "Erro ao deletar transação" });
      }
    });

    app.get("/api/admin/deposits/:id/comprovante", authenticateAdmin, async (req, res) => {
      try {
        const deposit = await Deposit.findById(req.params.id);
        if (!deposit) {
          return res.status(404).json({ error: "Depósito não encontrado" });
        }
        if (!deposit.comprovantePath) {
          return res.status(404).json({ error: "Comprovante não encontrado para este depósito" });
        }
        res.json({
          filePath: deposit.comprovantePath,
          fileName: path.basename(deposit.comprovantePath),
        });
      } catch (error) {
        console.error("Erro ao buscar comprovante:", error);
        res.status(500).json({ error: "Erro ao buscar informações do comprovante" });
      }
    });

    app.get("/api/investments/me", auth, async (req, res) => {
      try {
        const investment = await Investment.findOne({ userId: req.user.id });
        if (!investment) {
          return res.status(200).json({ amount: 0, initialDate: null, canWithdraw: false, profit: 0 });
        }
        const oneYearLater = new Date(investment.initialDate);
        oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
        const canWithdraw = new Date() >= oneYearLater;
        const profit = investment.amount * 0.15;
        res.json({
          amount: investment.amount,
          initialDate: investment.initialDate,
          lastAddedDate: investment.lastAddedDate,
          canWithdraw,
          profit,
        });
      } catch (error) {
        console.error("Erro ao buscar investimentos:", error);
        res.status(500).json({ error: "Erro ao buscar investimentos" });
      }
    });

    app.post("/api/investments/withdraw", auth, async (req, res) => {
      const session = await mongoose.startSession();
      session.startTransaction();
      try {
        const investment = await Investment.findOne({ userId: req.user.id }).session(session);
        if (!investment) {
          await session.abortTransaction();
          return res.status(404).json({ error: "Nenhum investimento encontrado" });
        }
        const oneYearLater = new Date(investment.initialDate);
        oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
        if (new Date() < oneYearLater) {
          await session.abortTransaction();
          return res.status(400).json({ error: "O resgate só é permitido após 1 ano do primeiro investimento" });
        }
        const user = await User.findById(req.user.id).session(session);
        const profit = investment.amount * 0.15;
        const totalWithdraw = investment.amount + profit;
        user.saldoReais += totalWithdraw;
        await Investment.deleteOne({ userId: req.user.id }).session(session);
        await user.save({ session });
        await session.commitTransaction();
        res.json({
          message: "Resgate concluído com sucesso",
          amountWithdrawn: totalWithdraw,
          saldoReais: user.saldoReais,
        });
      } catch (error) {
        await session.abortTransaction();
        console.error("Erro ao resgatar investimento:", error);
        res.status(500).json({ error: "Erro ao processar resgate" });
      } finally {
        session.endSession();
      }
    });

    app.get("/api/admin/investments", authenticateAdmin, async (req, res) => {
      try {
        const investments = await Investment.find().populate("userId", "name email");
        res.json(investments);
      } catch (error) {
        console.error("Erro ao buscar investimentos admin:", error);
        res.status(500).json({ error: "Erro ao buscar investimentos" });
      }
    });

    app.post("/api/investments", auth, async (req, res) => {
      const session = await mongoose.startSession();
      session.startTransaction();
      try {
        const { amount } = req.body;
        const investmentAmount = parseFloat(amount);
        if (!investmentAmount || investmentAmount <= 0) {
          throw new Error("Valor inválido para investimento");
        }
        const user = await User.findById(req.user.id).session(session);
        if (!user) throw new Error("Usuário não encontrado");
        if (user.saldoReais < investmentAmount) throw new Error("Saldo insuficiente");
        let investment = await Investment.findOne({ userId: req.user.id }).session(session);
        const currentDate = new Date();
        if (investment) {
          investment.amount += investmentAmount;
          investment.lastAddedDate = currentDate;
        } else {
          investment = new Investment({
            userId: req.user.id,
            amount: investmentAmount,
            initialDate: currentDate,
            lastAddedDate: currentDate,
          });
        }
        user.saldoReais -= investmentAmount;
        await user.save({ session });
        await investment.save({ session });
        await session.commitTransaction();
        res.status(201).json({
          message: "Investimento realizado com sucesso",
          investment: {
            amount: investment.amount,
            initialDate: investment.initialDate,
            lastAddedDate: investment.lastAddedDate,
          },
          saldoReais: user.saldoReais,
        });
      } catch (error) {
        await session.abortTransaction();
        console.error("Erro ao processar investimento:", error);
        res.status(400).json({ error: error.message || "Erro ao processar investimento" });
      } finally {
        session.endSession();
      }
    });

    app.post("/api/loans", auth, async (req, res) => {
      const session = await mongoose.startSession();
      session.startTransaction();
      try {
        const { amount } = req.body;
        const loanAmount = parseFloat(amount);
        if (!loanAmount || loanAmount <= 0) {
          throw new Error("Valor inválido para empréstimo");
        }
        const user = await User.findById(req.user.id).session(session);
        if (!user) throw new Error("Usuário não encontrado");
        const investment = await Investment.findOne({ userId: req.user.id }).session(session);
        if (!investment || investment.amount <= 0) {
          throw new Error("Você precisa ter investimentos ativos para solicitar um empréstimo");
        }
        const maxLoanAmount = investment.amount * 0.85;
        if (loanAmount > maxLoanAmount) {
          throw new Error(`O valor máximo de empréstimo é R$ ${maxLoanAmount.toFixed(2)}`);
        }
        const dueDate = new Date();
        dueDate.setMonth(dueDate.getMonth() + 1);
        const totalToRepay = loanAmount * 1.05;
        const loan = new Loan({
          userId: req.user.id,
          amount: loanAmount,
          dueDate,
          totalToRepay,
        });
        user.saldoReais += loanAmount;
        await loan.save({ session });
        await user.save({ session });
        await session.commitTransaction();
        res.status(201).json({
          message: "Empréstimo solicitado com sucesso",
          loan: {
            amount: loan.amount,
            dueDate: loan.dueDate,
            totalToRepay: loan.totalToRepay,
            status: loan.status,
          },
          saldoReais: user.saldoReais,
        });
      } catch (error) {
        await session.abortTransaction();
        console.error("Erro ao processar empréstimo:", error);
        res.status(400).json({ error: error.message || "Erro ao processar empréstimo" });
      } finally {
        session.endSession();
      }
    });

    app.get("/api/loans/me", auth, async (req, res) => {
      try {
        const loans = await Loan.find({ userId: req.user.id });
        const currentDate = new Date();
        for (let loan of loans) {
          if (loan.status === "active" && currentDate > new Date(loan.dueDate)) {
            loan.status = "overdue";
            await loan.save();
          }
        }
        res.json(loans);
      } catch (error) {
        console.error("Erro ao buscar empréstimos:", error);
        res.status(500).json({ error: "Erro ao buscar empréstimos" });
      }
    });

    app.post("/api/lo pesos/repay/:id", auth, async (req, res) => {
      const session = await mongoose.startSession();
      session.startTransaction();
      try {
        const loan = await Loan.findById(req.params.id).session(session);
        if (!loan || loan.userId.toString() !== req.user.id.toString()) {
          throw new Error("Empréstimo não encontrado");
        }
        if (loan.status !== "active") {
          throw new Error("Este empréstimo não pode ser pago (já foi pago ou está vencido)");
        }
        const user = await User.findById(req.user.id).session(session);
        if (user.saldoReais < loan.totalToRepay) {
          throw new Error("Saldo insuficiente para pagar o empréstimo");
        }
        user.saldoReais -= loan.totalToRepay;
        loan.status = "repaid";
        await user.save({ session });
        await loan.save({ session });
        await session.commitTransaction();
        res.json({
          message: "Empréstimo pago com sucesso",
          saldoReais: user.saldoReais,
        });
      } catch (error) {
        await session.abortTransaction();
        console.error("Erro ao pagar empréstimo:", error);
        res.status(400).json({ error: error.message || "Erro ao pagar empréstimo" });
      } finally {
        session.endSession();
      }
    });

    app.get("/api/admin/loans", authenticateAdmin, async (req, res) => {
      try {
        const loans = await Loan.find().populate("userId", "name email");
        res.json(loans);
      } catch (error) {
        console.error("Erro ao buscar empréstimos admin:", error);
        res.status(500).json({ error: "Erro ao buscar empréstimos" });
      }
    });

    app.put("/api/admin/investments/release/:userId", authenticateAdmin, async (req, res) => {
      const session = await mongoose.startSession();
      session.startTransaction();
      try {
        const investment = await Investment.findOne({ userId: req.params.userId }).session(session);
        if (!investment) {
          await session.abortTransaction();
          return res.status(404).json({ error: "Nenhum investimento encontrado para este usuário" });
        }
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        investment.initialDate = oneYearAgo;
        await investment.save({ session });
        await session.commitTransaction();
        res.json({
          message: "Fundos liberados com sucesso. O usuário pode resgatar o investimento imediatamente.",
          investment: {
            amount: investment.amount,
            initialDate: investment.initialDate,
            lastAddedDate: investment.lastAddedDate,
          },
        });
      } catch (error) {
        await session.abortTransaction();
        console.error("Erro ao liberar fundos de investimento:", error);
        res.status(500).json({ error: "Erro ao liberar fundos de investimento" });
      } finally {
        session.endSession();
      }
    });

    // Configuração do servidor HTTPS
    const PORT = process.env.PORT || 5000;
    const sslOptions = {
      key: fs.readFileSync(path.join(__dirname, "ssl", "private-key.pem")),
      cert: fs.readFileSync(path.join(__dirname, "ssl", "certificate.pem")),
    };
    https.createServer(sslOptions, app).listen(PORT, () => {
      console.log(`Servidor HTTPS rodando na porta ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Erro ao conectar ao banco de dados:", error);
    process.exit(1);
  });