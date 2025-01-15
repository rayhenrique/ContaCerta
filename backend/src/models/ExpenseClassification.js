const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class ExpenseClassification extends Model {
    static associate(models) {
      ExpenseClassification.hasMany(models.Expense, {
        foreignKey: 'classificationId',
        as: 'expenses'
      });
    }
  }

  ExpenseClassification.init(
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          notEmpty: true
        }
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true
      }
    },
    {
      sequelize,
      modelName: 'ExpenseClassification',
      tableName: 'ExpenseClassifications'
    }
  );

  return ExpenseClassification;
}; 