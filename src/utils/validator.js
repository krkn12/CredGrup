const Joi = require('joi');

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

const registerSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  phone: Joi.string().pattern(/^\(\d{2}\) \d{5}-\d{4}$/).required(),
  password: Joi.string().min(6).required(),
});

const depositSchema = Joi.object({
  valor: Joi.number().positive().required(),
  metodoId: Joi.string().required(),
  metodoNome: Joi.string().required(),
  taxa: Joi.number().default(0),
});

const paymentSchema = Joi.object({
  descricaoPagamento: Joi.string().required(),
  valorPagamento: Joi.number().positive().required(),
  pixKey: Joi.string().allow(''),
  taxa: Joi.number().default(0),
  cashback: Joi.number().default(0),
});

const validateLogin = (data) => loginSchema.validate(data);
const validateRegister = (data) => registerSchema.validate(data);
const validateDeposit = (data) => depositSchema.validate(data);
const validatePayment = (data) => paymentSchema.validate(data);

module.exports = { validateLogin, validateRegister, validateDeposit, validatePayment };