const { Op } = require('sequelize');
const { Revenue, Expense, Category, User } = require('../models');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const { format } = require('date-fns');
const ptBR = require('date-fns/locale/pt-BR');

const getReportData = async (req, res) => {
  try {
    const { startDate, endDate, categoryId, type } = req.query;

    const whereClause = {
      date: {
        [Op.between]: [startDate, endDate],
      },
      ...(categoryId && { categoryId }),
    };

    // Buscar receitas e despesas
    const [revenues, expenses] = await Promise.all([
      Revenue.findAll({
        where: whereClause,
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
        order: [['date', 'ASC']],
      }),
      Expense.findAll({
        where: whereClause,
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
        order: [['date', 'ASC']],
      }),
    ]);

    // Processar dados por período (diário, mensal ou anual)
    const processedData = processDataByPeriod(revenues, expenses, type);

    // Agrupar por categoria
    const revenuesByCategory = groupByCategory(revenues);
    const expensesByCategory = groupByCategory(expenses);

    res.json({
      labels: processedData.labels,
      revenues: processedData.revenues,
      expenses: processedData.expenses,
      revenuesByCategory,
      expensesByCategory,
    });
  } catch (error) {
    console.error('Erro ao gerar relatório:', error);
    res.status(500).json({ error: 'Erro ao gerar relatório' });
  }
};

const exportPDF = async (req, res) => {
  try {
    const { startDate, endDate, categoryId, type } = req.query;
    const reportData = await generateReportData(startDate, endDate, categoryId, type);

    const doc = new PDFDocument();
    doc.pipe(res);

    // Configurar cabeçalho
    doc.fontSize(20).text('Relatório Financeiro', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Período: ${format(new Date(startDate), 'dd/MM/yyyy')} a ${format(new Date(endDate), 'dd/MM/yyyy')}`, { align: 'center' });
    doc.moveDown();

    // Resumo
    doc.fontSize(16).text('Resumo', { underline: true });
    doc.moveDown();
    
    const totalRevenues = reportData.revenues.reduce((sum, value) => sum + value, 0);
    const totalExpenses = reportData.expenses.reduce((sum, value) => sum + value, 0);
    const balance = totalRevenues - totalExpenses;

    doc.fontSize(12).text(`Total de Receitas: ${formatCurrency(totalRevenues)}`);
    doc.text(`Total de Despesas: ${formatCurrency(totalExpenses)}`);
    doc.text(`Saldo: ${formatCurrency(balance)}`);
    doc.moveDown();

    // Receitas por Categoria
    doc.fontSize(16).text('Receitas por Categoria', { underline: true });
    doc.moveDown();
    Object.entries(reportData.revenuesByCategory).forEach(([category, value]) => {
      doc.fontSize(12).text(`${category}: ${formatCurrency(value)}`);
    });
    doc.moveDown();

    // Despesas por Categoria
    doc.fontSize(16).text('Despesas por Categoria', { underline: true });
    doc.moveDown();
    Object.entries(reportData.expensesByCategory).forEach(([category, value]) => {
      doc.fontSize(12).text(`${category}: ${formatCurrency(value)}`);
    });

    doc.end();
  } catch (error) {
    console.error('Erro ao exportar PDF:', error);
    res.status(500).json({ error: 'Erro ao exportar PDF' });
  }
};

const exportExcel = async (req, res) => {
  try {
    const { startDate, endDate, categoryId, type } = req.query;
    const reportData = await generateReportData(startDate, endDate, categoryId, type);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'ContaCerta';
    workbook.created = new Date();

    // Planilha de Resumo
    const summarySheet = workbook.addWorksheet('Resumo');
    summarySheet.columns = [
      { header: 'Período', key: 'period', width: 15 },
      { header: 'Receitas', key: 'revenues', width: 15 },
      { header: 'Despesas', key: 'expenses', width: 15 },
      { header: 'Saldo', key: 'balance', width: 15 },
    ];

    reportData.labels.forEach((label, index) => {
      summarySheet.addRow({
        period: label,
        revenues: reportData.revenues[index],
        expenses: reportData.expenses[index],
        balance: reportData.revenues[index] - reportData.expenses[index],
      });
    });

    // Planilha de Receitas por Categoria
    const revenuesSheet = workbook.addWorksheet('Receitas por Categoria');
    revenuesSheet.columns = [
      { header: 'Categoria', key: 'category', width: 30 },
      { header: 'Valor', key: 'value', width: 15 },
    ];

    Object.entries(reportData.revenuesByCategory).forEach(([category, value]) => {
      revenuesSheet.addRow({ category, value });
    });

    // Planilha de Despesas por Categoria
    const expensesSheet = workbook.addWorksheet('Despesas por Categoria');
    expensesSheet.columns = [
      { header: 'Categoria', key: 'category', width: 30 },
      { header: 'Valor', key: 'value', width: 15 },
    ];

    Object.entries(reportData.expensesByCategory).forEach(([category, value]) => {
      expensesSheet.addRow({ category, value });
    });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=relatorio_${format(new Date(startDate), 'dd-MM-yyyy')}_${format(
        new Date(endDate),
        'dd-MM-yyyy'
      )}.xlsx`
    );

    await workbook.xlsx.write(res);
  } catch (error) {
    console.error('Erro ao exportar Excel:', error);
    res.status(500).json({ error: 'Erro ao exportar Excel' });
  }
};

// Funções auxiliares
const processDataByPeriod = (revenues, expenses, type) => {
  const data = {
    labels: [],
    revenues: [],
    expenses: [],
  };

  const periods = new Set();

  // Função para formatar a data de acordo com o tipo
  const formatPeriod = (date) => {
    switch (type) {
      case 'daily':
        return format(new Date(date), 'dd/MM/yyyy');
      case 'monthly':
        return format(new Date(date), 'MMMM/yyyy', { locale: ptBR });
      case 'yearly':
        return format(new Date(date), 'yyyy');
      default:
        return format(new Date(date), 'dd/MM/yyyy');
    }
  };

  // Agrupar receitas por período
  revenues.forEach((revenue) => {
    const period = formatPeriod(revenue.date);
    periods.add(period);
  });

  // Agrupar despesas por período
  expenses.forEach((expense) => {
    const period = formatPeriod(expense.date);
    periods.add(period);
  });

  // Ordenar períodos
  data.labels = Array.from(periods).sort();

  // Calcular valores para cada período
  data.labels.forEach((period) => {
    const periodRevenues = revenues
      .filter((revenue) => formatPeriod(revenue.date) === period)
      .reduce((sum, revenue) => sum + Number(revenue.value), 0);

    const periodExpenses = expenses
      .filter((expense) => formatPeriod(expense.date) === period)
      .reduce((sum, expense) => sum + Number(expense.value), 0);

    data.revenues.push(periodRevenues);
    data.expenses.push(periodExpenses);
  });

  return data;
};

const groupByCategory = (items) => {
  return items.reduce((acc, item) => {
    const categoryName = item.category?.name || 'Sem categoria';
    acc[categoryName] = (acc[categoryName] || 0) + Number(item.value);
    return acc;
  }, {});
};

const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const generateReportData = async (startDate, endDate, categoryId, type) => {
  const whereClause = {
    date: {
      [Op.between]: [startDate, endDate],
    },
    ...(categoryId && { categoryId }),
  };

  const [revenues, expenses] = await Promise.all([
    Revenue.findAll({
      where: whereClause,
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
      order: [['date', 'ASC']],
    }),
    Expense.findAll({
      where: whereClause,
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
      order: [['date', 'ASC']],
    }),
  ]);

  const processedData = processDataByPeriod(revenues, expenses, type);
  const revenuesByCategory = groupByCategory(revenues);
  const expensesByCategory = groupByCategory(expenses);

  return {
    labels: processedData.labels,
    revenues: processedData.revenues,
    expenses: processedData.expenses,
    revenuesByCategory,
    expensesByCategory,
  };
};

module.exports = {
  getReportData,
  exportPDF,
  exportExcel,
};
