const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Deposit = require('../models/Deposit');
const auth = require('../middleware/auth');

// Configurar o multer para armazenar uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    
    // Criar diretório se não existir
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
  limits: { fileSize: 10 * 1024 * 1024 }, // Limite de 10MB
  fileFilter: (req, file, cb) => {
    // Aceitar apenas imagens e PDFs
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Apenas imagens e PDFs são permitidos'));
    }
  }
});

// Rota para criar um novo depósito
router.post('/', auth, upload.single('comprovante'), async (req, res) => {
  try {
    console.log('Recebida requisição de depósito:', req.body);
    
    // Validar os dados
    const { valor, metodoId, metodoNome } = req.body;
    const taxa = req.body.taxa || 0;
    
    if (!valor || !metodoId) {
      return res.status(400).json({ message: 'Valor e método de pagamento são obrigatórios' });
    }
    
    if (!req.file) {
      return res.status(400).json({ message: 'Comprovante é obrigatório' });
    }
    
    // Criar o registro de depósito
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

// Rota para listar depósitos do usuário
router.get('/me', auth, async (req, res) => {
  try {
    const deposits = await Deposit.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(deposits);
  } catch (error) {
    console.error('Erro ao listar depósitos:', error);
    res.status(500).json({ message: 'Erro ao listar depósitos' });
  }
});

// Rota para verificar atualizações nos depósitos
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
      saldoAtualizado: false, // O backend decide se o saldo foi atualizado
      pontosAtualizados: false
    });
  } catch (error) {
    console.error('Erro ao verificar atualizações:', error);
    res.status(500).json({ message: 'Erro ao verificar atualizações' });
  }
});

module.exports = router;