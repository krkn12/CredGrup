const Loan = require('../models/Loan');

const createLoan = async (loanData) => {
  const loan = new Loan(loanData);
  await loan.save();
  return loan;
};

const updateLoan = async (id, status) => Loan.findByIdAndUpdate(id, { status }, { new: true });

module.exports = { createLoan, updateLoan };