const bcrypt = require('bcryptjs');

const hashPassword = async (password) => bcrypt.hash(password, 10);

const comparePassword = async (password, hashed) => bcrypt.compare(password, hashed);

module.exports = { hashPassword, comparePassword };