const router = require('express').Router();
const authController = require('../controllers/authController');
const validate = require('../middleware/validateMiddleware');
const { loginSchema, registerSchema } = require('../utils/validator');

// Rotas de autenticação
router.post('/login', 
  validate(loginSchema), // Middleware de validação
  authController.login   // Controller deve ser uma função definida
);

router.post('/register', 
  validate(registerSchema), // Middleware de validação
  authController.register  // Controller deve ser uma função definida
);

module.exports = router;