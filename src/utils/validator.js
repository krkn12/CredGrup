const { body } = require('express-validator');

module.exports = {
  loginSchema: [
    body('email').isEmail().withMessage('Email inválido'),
    body('password').notEmpty().withMessage('Senha é obrigatória')
  ],
  registerSchema: [
    body('name').notEmpty().withMessage('Nome é obrigatório'),
    body('email').isEmail().withMessage('Email inválido'),
    body('password')
      .isLength({ min: 6 }).withMessage('Senha deve ter no mínimo 6 caracteres')
  ]
};