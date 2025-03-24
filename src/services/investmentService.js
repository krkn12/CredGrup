const Investment = require('../models/Investment');

const createInvestment = async (investmentData) => {
  const investment = new Investment(investmentData);
  await investment.save();
  return investment;
};

const releaseInvestment = async (userId) => Investment.findOneAndUpdate(
  { userId },
  { initialDate: new Date(0) },
  { new: true }
);

module.exports = { createInvestment, releaseInvestment };