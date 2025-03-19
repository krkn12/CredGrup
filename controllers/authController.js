const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// Função de Registro
const register = async (req, res) => {
  const { name, email, phone, password } = req.body;

  try {
    // Verifica se o email já está registrado
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email já registrado' });
    }

    // Gera o hash da senha
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Cria o novo usuário
    const user = new User({
      name,
      email,
      phone,
      password: hashedPassword, // Senha hasheada
      saldoReais: 0,
      wbtcBalance: 0,
      pontos: 0,
      walletAddress: '0xSeuEnderecoAqui',
      isAdmin: false,
    });

    await user.save();
    res.status(201).json({ message: 'Usuário registrado com sucesso' });
  } catch (error) {
    console.error('Erro ao registrar usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Função de Login
const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Busca o usuário pelo email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // Verifica a senha
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // Gera o token JWT
    const payload = {
      id: user._id,
      email: user.email,
      isAdmin: user.isAdmin,
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Retorna os dados esperados pelo frontend
    res.json({
      token,
      id: user._id,
      name: user.name,
      email: user.email,
      saldoReais: user.saldoReais,
      wbtcBalance: user.wbtcBalance,
      pontos: user.pontos,
      walletAddress: user.walletAddress,
      isAdmin: user.isAdmin,
    });
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

module.exports = { register, login };