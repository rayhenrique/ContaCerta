const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Expense extends Model {
    static associate(models) {
      Expense.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
      Expense.belongsTo(models.Category, { foreignKey: 'categoryId', as: 'category' });
    }
  }

  Expense.init(
    {
      description: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      value: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        get() {
          const rawValue = this.getDataValue('value');
          return rawValue === null ? null : parseFloat(rawValue);
        },
        set(val) {
          const numericValue = typeof val === 'string' ? 
            parseFloat(val.replace(',', '.')) : 
            parseFloat(val);
          this.setDataValue('value', numericValue);
        },
      },
      date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      observation: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      categoryId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'pending',
        validate: {
          isIn: [['pending', 'confirmed', 'cancelled']]
        }
      }
    },
    {
      sequelize,
      modelName: 'Expense',
      tableName: 'Expenses',
    }
  );

  return Expense;
};
