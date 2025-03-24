const User = require('../models/User');

const getUserById = async (id) => User.findById(id).select('-password');

const updateUser = async (id, data) => User.findByIdAndUpdate(id, data, { new: true });

const deleteUser = async (id) => User.findByIdAndDelete(id);

module.exports = { getUserById, updateUser, deleteUser };