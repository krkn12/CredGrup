const User = require('../models/User');
const logger = require('../utils/logger');

module.exports = {
  register: async (userData) => {
    try {
      const user = new User(userData);
      await user.save();
      return user;
    } catch (error) {
      logger.error(`Register service error: ${error.message}`);
      throw error;
    }
  },
  
  findUserByEmail: async (email) => {
    return await User.findOne({ email }).select('+password');
  }
};