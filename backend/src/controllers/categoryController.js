const { Category } = require('../models');

module.exports = {
  async index(req, res) {
    try {
      const categories = await Category.findAll({
        include: [
          {
            model: Category,
            as: 'children',
            include: [
              {
                model: Category,
                as: 'children',
                include: [
                  {
                    model: Category,
                    as: 'children',
                  },
                ],
              },
            ],
          },
        ],
        where: {
          parentId: null,
        },
        order: [
          ['name', 'ASC'],
          [{ model: Category, as: 'children' }, 'name', 'ASC'],
          [{ model: Category, as: 'children' }, { model: Category, as: 'children' }, 'name', 'ASC'],
          [{ model: Category, as: 'children' }, { model: Category, as: 'children' }, { model: Category, as: 'children' }, 'name', 'ASC'],
        ],
      });

      return res.json(categories);
    } catch (error) {
      console.error('Erro ao listar categorias:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },

  async show(req, res) {
    try {
      const category = await Category.findByPk(req.params.id, {
        include: [
          {
            model: Category,
            as: 'children',
          },
          {
            model: Category,
            as: 'parent',
          },
        ],
      });

      if (!category) {
        return res.status(404).json({ error: 'Categoria não encontrada' });
      }

      return res.json(category);
    } catch (error) {
      console.error('Erro ao buscar categoria:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },

  async create(req, res) {
    try {
      const { parentId, type } = req.body;

      if (parentId) {
        const parentCategory = await Category.findByPk(parentId);
        if (!parentCategory) {
          return res.status(400).json({ error: 'Categoria pai não encontrada' });
        }

        // Validar hierarquia
        const validHierarchy = {
          source: [],
          block: ['source'],
          group: ['block'],
          action: ['group'],
        };

        if (!validHierarchy[type].includes(parentCategory.type)) {
          return res.status(400).json({
            error: `Uma categoria do tipo ${type} não pode ser filha de uma categoria do tipo ${parentCategory.type}`,
          });
        }
      } else if (type !== 'source') {
        return res.status(400).json({
          error: 'Apenas categorias do tipo source podem não ter pai',
        });
      }

      const category = await Category.create(req.body);

      return res.status(201).json(category);
    } catch (error) {
      console.error('Erro ao criar categoria:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },

  async update(req, res) {
    try {
      const category = await Category.findByPk(req.params.id);

      if (!category) {
        return res.status(404).json({ error: 'Categoria não encontrada' });
      }

      if (req.body.parentId && req.body.parentId !== category.parentId) {
        const parentCategory = await Category.findByPk(req.body.parentId);
        if (!parentCategory) {
          return res.status(400).json({ error: 'Categoria pai não encontrada' });
        }

        const validHierarchy = {
          source: [],
          block: ['source'],
          group: ['block'],
          action: ['group'],
        };

        if (!validHierarchy[category.type].includes(parentCategory.type)) {
          return res.status(400).json({
            error: `Uma categoria do tipo ${category.type} não pode ser filha de uma categoria do tipo ${parentCategory.type}`,
          });
        }
      }

      await category.update(req.body);

      return res.json(category);
    } catch (error) {
      console.error('Erro ao atualizar categoria:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },

  async delete(req, res) {
    try {
      const category = await Category.findByPk(req.params.id);

      if (!category) {
        return res.status(404).json({ error: 'Categoria não encontrada' });
      }

      await category.destroy();

      return res.status(204).send();
    } catch (error) {
      console.error('Erro ao deletar categoria:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },
};
