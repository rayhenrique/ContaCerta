const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Category extends Model {
    static associate(models) {
      Category.hasMany(models.Category, { as: 'children', foreignKey: 'parentId' });
      Category.belongsTo(models.Category, { as: 'parent', foreignKey: 'parentId' });
      Category.hasMany(models.Revenue, { foreignKey: 'categoryId' });
      Category.hasMany(models.Expense, { foreignKey: 'categoryId' });
    }
  }

  Category.init(
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      type: {
        type: DataTypes.ENUM('source', 'block', 'group', 'action'),
        allowNull: false,
      },
      parentId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      expenseClassification: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'Category',
    }
  );

  return Category;
};
