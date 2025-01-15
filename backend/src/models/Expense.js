const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Expense extends Model {
    static associate(models) {
      Expense.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
      Expense.belongsTo(models.Category, { foreignKey: 'categoryId', as: 'category' });
      Expense.belongsTo(models.ExpenseClassification, { foreignKey: 'classificationId', as: 'classification' });
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
        type: DataTypes.DATEONLY, // Change to DATEONLY to avoid time zone issues
        allowNull: false,
        get() {
          // Always return the date in local time
          const rawDate = this.getDataValue('date');
          return rawDate ? new Date(rawDate) : null;
        },
        set(val) {
          // Ensure the date is set without time
          const date = val instanceof Date ? val : new Date(val);
          const localDate = new Date(
            date.getFullYear(), 
            date.getMonth(), 
            date.getDate()
          );
          this.setDataValue('date', localDate);
        },
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      categoryId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      classificationId: {
        type: DataTypes.INTEGER,
        allowNull: true,
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
