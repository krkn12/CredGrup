const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Deposit = require('../models/Deposit');
const auth = require('../middleware/auth');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
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

router.post('/', auth, upload.single('comprovante'), async (req, res) => {
  try {
    console.log('Recebida requisição de depósito:', req.body);
    const { valor, metodoId, metodoNome } = req.body;
    const taxa = req.body.taxa || 0;
    if (!valor || !metodoId) {
      return res.status(400).json({ message: 'Valor e método de pagamento são obrigatórios' });
    }
    if (!req.file) {
      return res.status(400).json({ message: 'Comprovante é obrigatório' });
    }
    console.log("Banco atual antes de salvar depósito:", mongoose.connection.name);
    const deposit = new Deposit({
      userId: req.user.id,
      valor: parseFloat(valor),
      metodoId,
      metodoNome: metodoNome || metodoId,
      taxa: parseFloat(taxa),
      comprovantePath: req.file.path,
      status: 'Pendente'
    });
    await deposit.save();
    console.log('Depósito salvo com sucesso:', deposit);
    res.status(201).json(deposit);
  } catch (error) {
    console.error('Erro ao processar depósito:', error);
    res.status(500).json({ message: 'Erro ao processar depósito', error: error.message });
  }
});

router.get('/me', auth, async (req, res) => {
  try {
    const deposits = await Deposit.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(deposits);
  } catch (error) {
    console.error('Erro ao listar depósitos:', error);
    res.status(500).json({ message: 'Erro ao listar depósitos' });
  }
});

router.get('/me/updates', auth, async (req, res) => {
  try {
    const { desde } = req.query;
    const date = desde ? new Date(desde) : new Date(0);
    const updatedDeposits = await Deposit.find({
      userId: req.user.id,
      updatedAt: { $gt: date }
    });
    res.json({
      depositosAtualizados: updatedDeposits.length > 0,
      saldoAtualizado: false,
      pontosAtualizados: false
    });
  } catch (error) {
    console.error('Erro ao verificar atualizações:', error);
    res.status(500).json({ message: 'Erro ao verificar atualizações' });
  }
});

module.exports = router;