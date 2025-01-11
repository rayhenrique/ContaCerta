const { Revenue, Expense } = require('../models');
const { Op, Sequelize } = require('sequelize');

module.exports = {
  async index(req, res) {
    try {
      const currentDate = new Date();
      const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      // Obter total de receitas do mês
      const totalRevenue = await Revenue.sum('value', {
        where: {
          date: {
            [Op.between]: [firstDayOfMonth, lastDayOfMonth],
          },
        },
      }) || 0;

      // Obter total de despesas do mês
      const totalExpenses = await Expense.sum('value', {
        where: {
          date: {
            [Op.between]: [firstDayOfMonth, lastDayOfMonth],
          },
        },
      }) || 0;

      // Calcular saldo
      const balance = totalRevenue - totalExpenses;

      // Obter dados dos últimos 6 meses para o gráfico
      const last6Months = Array.from({ length: 6 }, (_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        return {
          year: date.getFullYear(),
          month: date.getMonth(),
          monthName: new Date(date.getFullYear(), date.getMonth(), 1).toLocaleString('pt-BR', { month: 'short' }),
        };
      }).reverse();

      const revenueByMonth = await Revenue.findAll({
        attributes: [
          [Sequelize.fn('YEAR', Sequelize.col('date')), 'year'],
          [Sequelize.fn('MONTH', Sequelize.col('date')), 'month'],
          [Sequelize.fn('SUM', Sequelize.col('value')), 'total'],
        ],
        where: {
          date: {
            [Op.gte]: new Date(last6Months[0].year, last6Months[0].month, 1),
            [Op.lte]: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0),
          },
        },
        group: [
          Sequelize.fn('YEAR', Sequelize.col('date')),
          Sequelize.fn('MONTH', Sequelize.col('date')),
        ],
        raw: true,
      });

      const expensesByMonth = await Expense.findAll({
        attributes: [
          [Sequelize.fn('YEAR', Sequelize.col('date')), 'year'],
          [Sequelize.fn('MONTH', Sequelize.col('date')), 'month'],
          [Sequelize.fn('SUM', Sequelize.col('value')), 'total'],
        ],
        where: {
          date: {
            [Op.gte]: new Date(last6Months[0].year, last6Months[0].month, 1),
            [Op.lte]: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0),
          },
        },
        group: [
          Sequelize.fn('YEAR', Sequelize.col('date')),
          Sequelize.fn('MONTH', Sequelize.col('date')),
        ],
        raw: true,
      });

      const chartData = {
        labels: last6Months.map(m => m.monthName),
        datasets: [
          {
            label: 'Receitas',
            data: last6Months.map(month => {
              const revenue = revenueByMonth.find(
                r => r.year == month.year && r.month == month.month + 1
              );
              return revenue ? Number(revenue.total) : 0;
            }),
          },
          {
            label: 'Despesas',
            data: last6Months.map(month => {
              const expense = expensesByMonth.find(
                e => e.year == month.year && e.month == month.month + 1
              );
              return expense ? Number(expense.total) : 0;
            }),
          },
        ],
      };

      // Obter transações recentes
      const recentTransactions = await Promise.all([
        Revenue.findAll({
          limit: 5,
          order: [['date', 'DESC']],
          attributes: ['id', 'description', 'value', 'date'],
          raw: true,
        }),
        Expense.findAll({
          limit: 5,
          order: [['date', 'DESC']],
          attributes: ['id', 'description', 'value', 'date'],
          raw: true,
        }),
      ]);

      // Combinar e ordenar transações
      const allTransactions = [
        ...recentTransactions[0].map(t => ({ ...t, type: 'revenue' })),
        ...recentTransactions[1].map(t => ({ ...t, type: 'expense' })),
      ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

      return res.json({
        totalRevenue,
        totalExpenses,
        balance,
        recentTransactions: allTransactions,
        chartData,
      });
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },
};
