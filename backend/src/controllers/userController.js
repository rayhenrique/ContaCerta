const { User } = require('../models');

module.exports = {
  async index(req, res) {
    try {
      const users = await User.findAll({
        attributes: { exclude: ['password'] },
        order: [['name', 'ASC']],
      });
      return res.json(users);
    } catch (error) {
      console.error('Erro ao listar usuários:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },

  async show(req, res) {
    try {
      const user = await User.findByPk(req.params.id, {
        attributes: { exclude: ['password'] },
      });

      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      return res.json(user);
    } catch (error) {
      console.error('Erro ao buscar usuário:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },

  async create(req, res) {
    try {
      const { email } = req.body;

      const userExists = await User.findOne({ where: { email } });

      if (userExists) {
        return res.status(400).json({ error: 'Email já cadastrado' });
      }

      const user = await User.create(req.body);

      user.password = undefined;

      return res.status(201).json(user);
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },

  async update(req, res) {
    try {
      const user = await User.findByPk(req.params.id);

      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      if (req.body.email && req.body.email !== user.email) {
        const userExists = await User.findOne({
          where: { email: req.body.email },
        });

        if (userExists) {
          return res.status(400).json({ error: 'Email já cadastrado' });
        }
      }

      await user.update(req.body);

      user.password = undefined;

      return res.json(user);
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },

  async delete(req, res) {
    try {
      const user = await User.findByPk(req.params.id);

      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      await user.destroy();

      return res.status(204).send();
    } catch (error) {
      console.error('Erro ao deletar usuário:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },
};
