const Transaction = require('../models/Transaction');

const updateTransaction = async (id, data) => Transaction.findByIdAndUpdate(id, data, { new: true });

const deleteTransaction = async (id) => Transaction.findByIdAndDelete(id);

module.exports = { updateTransaction, deleteTransaction };