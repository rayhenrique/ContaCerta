const { ExpenseClassification } = require('../models');

module.exports = {
  async index(req, res) {
    try {
      const classifications = await ExpenseClassification.findAll({
        order: [['name', 'ASC']]
      });
      return res.json(classifications);
    } catch (error) {
      console.error('Erro ao listar classificações:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },

  async store(req, res) {
    try {
      const { name, description } = req.body;
      const classification = await ExpenseClassification.create({
        name,
        description
      });
      return res.status(201).json(classification);
    } catch (error) {
      console.error('Erro ao criar classificação:', error);
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({ error: 'Já existe uma classificação com este nome' });
      }
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },

  async update(req, res) {
    try {
      const { id } = req.params;
      const { name, description } = req.body;

      const classification = await ExpenseClassification.findByPk(id);
      if (!classification) {
        return res.status(404).json({ error: 'Classificação não encontrada' });
      }

      await classification.update({ name, description });
      return res.json(classification);
    } catch (error) {
      console.error('Erro ao atualizar classificação:', error);
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({ error: 'Já existe uma classificação com este nome' });
      }
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },

  async destroy(req, res) {
    try {
      const { id } = req.params;
      const classification = await ExpenseClassification.findByPk(id);
      
      if (!classification) {
        return res.status(404).json({ error: 'Classificação não encontrada' });
      }

      await classification.destroy();
      return res.status(204).send();
    } catch (error) {
      console.error('Erro ao excluir classificação:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
}; 