const { Expense, Category, ExpenseClassification } = require('../models');

module.exports = {
  async index(req, res) {
    try {
      const expenses = await Expense.findAll({
        include: [
          {
            model: Category,
            as: 'category',
            attributes: ['id', 'name']
          },
          {
            model: ExpenseClassification,
            as: 'classification',
            attributes: ['id', 'name']
          }
        ],
        order: [['date', 'DESC']]
      });
      return res.json(expenses);
    } catch (error) {
      console.error('Erro ao listar despesas:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },

  async store(req, res) {
    try {
      const { description, value, date, categoryId, classificationId, status } = req.body;

      // Parse the date string directly to ensure correct date
      const [year, month, day] = date.split('-').map(Number);
      
      // Create a date object at midnight in local time, avoiding timezone shifts
      const localDate = new Date(year, month - 1, day, 0, 0, 0, 0);

      console.log('Received date string:', date);
      console.log('Parsed date components:', { year, month, day });
      console.log('Created local date:', localDate);
      console.log('Local date toString:', localDate.toString());
      console.log('Local date toISOString:', localDate.toISOString());

      const expense = await Expense.create({
        description,
        value,
        date: localDate,  // Use the local date at midnight
        categoryId,
        classificationId,
        status,
        userId: req.userId
      });

      const expenseWithRelations = await Expense.findByPk(expense.id, {
        include: [
          {
            model: Category,
            as: 'category',
            attributes: ['id', 'name']
          },
          {
            model: ExpenseClassification,
            as: 'classification',
            attributes: ['id', 'name']
          }
        ]
      });

      return res.status(201).json(expenseWithRelations);
    } catch (error) {
      console.error('Erro ao criar despesa:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },

  async update(req, res) {
    try {
      const { id } = req.params;
      const { description, value, date, categoryId, classificationId, status } = req.body;

      // Parse the date string directly to ensure correct date
      const [year, month, day] = date.split('-').map(Number);
      
      // Create a date object at midnight in local time, avoiding timezone shifts
      const localDate = new Date(year, month - 1, day, 0, 0, 0, 0);

      console.log('Received date string:', date);
      console.log('Parsed date components:', { year, month, day });
      console.log('Created local date:', localDate);
      console.log('Local date toString:', localDate.toString());
      console.log('Local date toISOString:', localDate.toISOString());

      const expense = await Expense.findByPk(id);
      if (!expense) {
        return res.status(404).json({ error: 'Despesa não encontrada' });
      }

      await expense.update({
        description,
        value,
        date: localDate,  // Use the local date at midnight
        categoryId,
        classificationId,
        status
      });

      const updatedExpense = await Expense.findByPk(id, {
        include: [
          {
            model: Category,
            as: 'category',
            attributes: ['id', 'name']
          },
          {
            model: ExpenseClassification,
            as: 'classification',
            attributes: ['id', 'name']
          }
        ]
      });

      return res.json(updatedExpense);
    } catch (error) {
      console.error('Erro ao atualizar despesa:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },

  async destroy(req, res) {
    try {
      const { id } = req.params;
      const expense = await Expense.findByPk(id);
      
      if (!expense) {
        return res.status(404).json({ error: 'Despesa não encontrada' });
      }

      await expense.destroy();
      return res.status(204).send();
    } catch (error) {
      console.error('Erro ao excluir despesa:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
};
