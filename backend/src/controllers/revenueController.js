const { Revenue, Category, User } = require('../models');
const { Op } = require('sequelize');

module.exports = {
  async index(req, res) {
    try {
      const { startDate, endDate, categoryId } = req.query;
      const where = {};

      if (startDate && endDate) {
        where.date = {
          [Op.between]: [new Date(startDate), new Date(endDate)],
        };
      }

      if (categoryId) {
        where.categoryId = categoryId;
      }

      const revenues = await Revenue.findAll({
        where,
        include: [
          {
            model: Category,
            as: 'category',
            attributes: ['id', 'name', 'type', 'parentId'],
          },
          {
            model: User,
            as: 'user',
            attributes: ['id', 'name'],
          },
        ],
        order: [['date', 'DESC']],
      });

      return res.json(revenues);
    } catch (error) {
      console.error('Erro ao listar receitas:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },

  async show(req, res) {
    try {
      const revenue = await Revenue.findByPk(req.params.id, {
        include: [
          {
            model: Category,
            as: 'category',
            attributes: ['id', 'name', 'type', 'parentId'],
          },
          {
            model: User,
            as: 'user',
            attributes: ['id', 'name'],
          },
        ],
      });

      if (!revenue) {
        return res.status(404).json({ error: 'Receita não encontrada' });
      }

      return res.json(revenue);
    } catch (error) {
      console.error('Erro ao buscar receita:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },

  async create(req, res) {
    try {
      const { categoryId } = req.body;

      const category = await Category.findByPk(categoryId);
      if (!category) {
        return res.status(400).json({ error: 'Categoria não encontrada' });
      }

      const revenue = await Revenue.create({
        ...req.body,
        userId: req.userId,
      });

      return res.status(201).json(revenue);
    } catch (error) {
      console.error('Erro ao criar receita:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },

  async update(req, res) {
    try {
      const revenue = await Revenue.findByPk(req.params.id);

      if (!revenue) {
        return res.status(404).json({ error: 'Receita não encontrada' });
      }

      if (req.body.categoryId) {
        const category = await Category.findByPk(req.body.categoryId);
        if (!category) {
          return res.status(400).json({ error: 'Categoria não encontrada' });
        }
      }

      await revenue.update(req.body);

      return res.json(revenue);
    } catch (error) {
      console.error('Erro ao atualizar receita:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },

  async delete(req, res) {
    try {
      const revenue = await Revenue.findByPk(req.params.id);

      if (!revenue) {
        return res.status(404).json({ error: 'Receita não encontrada' });
      }

      await revenue.destroy();

      return res.status(204).send();
    } catch (error) {
      console.error('Erro ao excluir receita:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },
};
