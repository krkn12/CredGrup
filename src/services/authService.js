const login = async (email, password) => {
  const user = await User.findOne({ email });
  if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new Error('Credenciais inválidas');
  }
  const token = jwt.sign({ id: user._id, isAdmin: user.isAdmin }, process.env.JWT_SECRET, { expiresIn: '1h' });
  return {
      token,
      user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          saldoReais: user.saldoReais,
          wbtcBalance: user.wbtcBalance,
          pontos: user.pontos,
          walletAddress: user.walletAddress || '',
          isAdmin: user.isAdmin,
      },
  };
};