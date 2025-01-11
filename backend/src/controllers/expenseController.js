const { Expense, Category, User } = require('../models');
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

      const expenses = await Expense.findAll({
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

      return res.json(expenses);
    } catch (error) {
      console.error('Erro ao listar despesas:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },

  async show(req, res) {
    try {
      const expense = await Expense.findByPk(req.params.id, {
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

      if (!expense) {
        return res.status(404).json({ error: 'Despesa não encontrada' });
      }

      return res.json(expense);
    } catch (error) {
      console.error('Erro ao buscar despesa:', error);
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

      const expense = await Expense.create({
        ...req.body,
        userId: req.userId,
      });

      return res.status(201).json(expense);
    } catch (error) {
      console.error('Erro ao criar despesa:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },

  async update(req, res) {
    try {
      const expense = await Expense.findByPk(req.params.id);

      if (!expense) {
        return res.status(404).json({ error: 'Despesa não encontrada' });
      }

      if (req.body.categoryId) {
        const category = await Category.findByPk(req.body.categoryId);
        if (!category) {
          return res.status(400).json({ error: 'Categoria não encontrada' });
        }
      }

      await expense.update(req.body);

      return res.json(expense);
    } catch (error) {
      console.error('Erro ao atualizar despesa:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },

  async delete(req, res) {
    try {
      const expense = await Expense.findByPk(req.params.id);

      if (!expense) {
        return res.status(404).json({ error: 'Despesa não encontrada' });
      }

      await expense.destroy();

      return res.status(204).send();
    } catch (error) {
      console.error('Erro ao excluir despesa:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },
};
