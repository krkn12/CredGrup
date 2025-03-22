const User = require('../models/User');

class UserService {
  async getAllUsers() {
    return await User.find().lean();
  }

  async getUserById(id) {
    const user = await User.findById(id).lean();
    if (!user) throw new Error('Usuário não encontrado');
    return user;
  }

  async updateUser(id, data) {
    const user = await User.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!user) throw new Error('Usuário não encontrado');
    return user;
  }

  async deleteUser(id) {
    const user = await User.findByIdAndDelete(id);
    if (!user) throw new Error('Usuário não encontrado');
    return user;
  }
}

module.exports = new UserService();