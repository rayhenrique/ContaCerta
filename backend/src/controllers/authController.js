const jwt = require('jsonwebtoken');
const { User } = require('../models');

module.exports = {
  async login(req, res) {
    try {
      const { email, password } = req.body;

      const user = await User.findOne({ where: { email } });

      if (!user) {
        return res.status(401).json({ error: 'Usuário não encontrado' });
      }

      const validPassword = await user.checkPassword(password);

      if (!validPassword) {
        return res.status(401).json({ error: 'Senha inválida' });
      }

      const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
        expiresIn: '1d',
      });

      const { id, name, accessLevel } = user;

      return res.json({
        user: {
          id,
          name,
          email,
          accessLevel,
        },
        token,
      });
    } catch (error) {
      console.error('Erro no login:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },
};
