const { Revenue, Expense, Category, ExpenseClassification } = require('../models');
const { Op } = require('sequelize');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');

module.exports = {
  async getReportData(req, res) {
    try {
      const {
        startDate,
        endDate,
        type,
        categoryId,
        classificationId,
        status
      } = req.query;

      const dateFilter = {};
      if (startDate && endDate) {
        dateFilter.date = {
          [Op.between]: [new Date(startDate), new Date(endDate)]
        };
      }

      const whereClause = {
        ...dateFilter
      };

      if (status) {
        whereClause.status = status;
      }

      // Detailed category filtering
      if (categoryId) {
        // Find all subcategories of the given category
        const subcategories = await Category.findAll({
          where: {
            [Op.or]: [
              { id: categoryId },
              { parentId: categoryId }
            ]
          },
          attributes: ['id']
        });

        const subcategoryIds = subcategories.map(cat => cat.id);
        whereClause.categoryId = {
          [Op.in]: subcategoryIds
        };
      }

      // Add classification filter for expenses
      if (type === 'expenses' && classificationId) {
        whereClause.classificationId = classificationId;
      }

      if (type === 'revenues') {
        const revenues = await Revenue.findAll({
          where: whereClause,
          include: [
            {
              model: Category,
              as: 'category',
              attributes: ['id', 'name', 'parentId'],
              include: [{
                model: Category,
                as: 'parent',
                attributes: ['id', 'name']
              }]
            }
          ],
          order: [['date', 'ASC']]
        });

        // Group revenues by month or day
        const groupedData = revenues.reduce((acc, revenue) => {
          const date = new Date(revenue.date);
          const key = req.query.reportType === 'daily' 
            ? date.toISOString().split('T')[0] 
            : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          
          acc[key] = (acc[key] || 0) + revenue.value;
          return acc;
        }, {});

        const labels = Object.keys(groupedData).sort();
        const data = labels.map(label => groupedData[label]);

        return res.json({
          labels,
          datasets: [{
            label: 'Receitas',
            data,
            backgroundColor: 'rgba(75, 192, 192, 0.6)'
          }]
        });
      }

      if (type === 'expenses') {
        const expenses = await Expense.findAll({
          where: whereClause,
          include: [
            {
              model: Category,
              as: 'category',
              attributes: ['id', 'name', 'parentId'],
              include: [{
                model: Category,
                as: 'parent',
                attributes: ['id', 'name']
              }]
            },
            {
              model: ExpenseClassification,
              as: 'classification',
              attributes: ['id', 'name']
            }
          ],
          order: [['date', 'ASC']]
        });

        // Group expenses by month or day
        const groupedData = expenses.reduce((acc, expense) => {
          const date = new Date(expense.date);
          const key = req.query.reportType === 'daily' 
            ? date.toISOString().split('T')[0] 
            : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          
          acc[key] = (acc[key] || 0) + expense.value;
          return acc;
        }, {});

        const labels = Object.keys(groupedData).sort();
        const data = labels.map(label => groupedData[label]);

        return res.json({
          labels,
          datasets: [{
            label: 'Despesas',
            data,
            backgroundColor: 'rgba(255, 99, 132, 0.6)'
          }]
        });
      }

      return res.status(400).json({ error: 'Tipo de relatório inválido' });
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },

  async exportPDF(req, res) {
    try {
      const {
        startDate,
        endDate,
        type,
        categoryId,
        classificationId
      } = req.query;

      const dateFilter = {};
      if (startDate && endDate) {
        dateFilter.date = {
          [Op.between]: [new Date(startDate), new Date(endDate)]
        };
      }

      const whereClause = {
        ...dateFilter
      };

      if (categoryId) {
        whereClause.categoryId = categoryId;
      }

      // Add classification filter for expenses
      if (type === 'expenses' && classificationId) {
        whereClause.classificationId = classificationId;
      }

      let data;
      if (type === 'revenues') {
        data = await Revenue.findAll({
          where: whereClause,
          include: [
            {
              model: Category,
              as: 'category',
              attributes: ['id', 'name']
            }
          ],
          order: [['date', 'DESC']]
        });
      } else if (type === 'expenses') {
        data = await Expense.findAll({
          where: whereClause,
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
      } else {
        return res.status(400).json({ error: 'Tipo de relatório inválido' });
      }

      // Create PDF
      const doc = new PDFDocument();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=relatorio_${type}_${startDate}_${endDate}.pdf`);
      
      doc.pipe(res);

      // Add title
      doc.fontSize(20).text(`Relatório de ${type === 'revenues' ? 'Receitas' : 'Despesas'}`, { align: 'center' });
      doc.moveDown();

      // Add date range
      doc.fontSize(12).text(`Período: ${startDate} a ${endDate}`, { align: 'center' });
      doc.moveDown(2);

      // Table headers
      doc.fontSize(10)
        .text('Data', 50, doc.y, { width: 100, bold: true })
        .text('Descrição', 150, doc.y, { width: 200 })
        .text('Categoria', 350, doc.y, { width: 100 })
        .text('Valor', 450, doc.y, { width: 100, align: 'right' });

      doc.moveDown();
      doc.strokeColor('#aaaaaa').lineWidth(0.5).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(0.5);

      // Add data rows
      let total = 0;
      data.forEach((item) => {
        doc.fontSize(10)
          .text(new Date(item.date).toLocaleDateString(), 50, doc.y, { width: 100 })
          .text(item.description, 150, doc.y, { width: 200 })
          .text(item.category.name, 350, doc.y, { width: 100 })
          .text(`R$ ${item.value.toFixed(2)}`, 450, doc.y, { width: 100, align: 'right' });
        
        total += item.value;
        doc.moveDown();
      });

      // Add total
      doc.moveDown();
      doc.fontSize(12)
        .text('Total', 350, doc.y, { width: 100, bold: true })
        .text(`R$ ${total.toFixed(2)}`, 450, doc.y, { width: 100, align: 'right', bold: true });

      doc.end();
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },

  async exportExcel(req, res) {
    try {
      const {
        startDate,
        endDate,
        type,
        categoryId,
        classificationId
      } = req.query;

      const dateFilter = {};
      if (startDate && endDate) {
        dateFilter.date = {
          [Op.between]: [new Date(startDate), new Date(endDate)]
        };
      }

      const whereClause = {
        ...dateFilter
      };

      if (categoryId) {
        whereClause.categoryId = categoryId;
      }

      // Add classification filter for expenses
      if (type === 'expenses' && classificationId) {
        whereClause.classificationId = classificationId;
      }

      let data;
      if (type === 'revenues') {
        data = await Revenue.findAll({
          where: whereClause,
          include: [
            {
              model: Category,
              as: 'category',
              attributes: ['id', 'name']
            }
          ],
          order: [['date', 'DESC']]
        });
      } else if (type === 'expenses') {
        data = await Expense.findAll({
          where: whereClause,
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
      } else {
        return res.status(400).json({ error: 'Tipo de relatório inválido' });
      }

      // Create workbook and worksheet
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(`Relatório de ${type === 'revenues' ? 'Receitas' : 'Despesas'}`);

      // Add title
      worksheet.mergeCells('A1:D1');
      worksheet.getCell('A1').value = `Relatório de ${type === 'revenues' ? 'Receitas' : 'Despesas'}`;
      worksheet.getCell('A1').font = { bold: true, size: 14 };
      worksheet.getCell('A1').alignment = { horizontal: 'center' };

      // Add date range
      worksheet.mergeCells('A2:D2');
      worksheet.getCell('A2').value = `Período: ${startDate} a ${endDate}`;
      worksheet.getCell('A2').alignment = { horizontal: 'center' };

      // Add headers
      worksheet.columns = [
        { header: 'Data', key: 'date', width: 15 },
        { header: 'Descrição', key: 'description', width: 30 },
        { header: 'Categoria', key: 'category', width: 20 },
        { header: 'Valor', key: 'value', width: 15 }
      ];

      // Add data rows
      let total = 0;
      data.forEach((item) => {
        worksheet.addRow({
          date: new Date(item.date).toLocaleDateString(),
          description: item.description,
          category: item.category.name,
          value: item.value
        });
        total += item.value;
      });

      // Add total row
      worksheet.addRow({
        category: 'Total',
        value: total
      });
      worksheet.getCell(`C${worksheet.rowCount}`).font = { bold: true };
      worksheet.getCell(`D${worksheet.rowCount}`).font = { bold: true };

      // Set response headers
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=relatorio_${type}_${startDate}_${endDate}.xlsx`);

      // Write to response
      await workbook.xlsx.write(res);
      res.end();
    } catch (error) {
      console.error('Erro ao exportar Excel:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
};
