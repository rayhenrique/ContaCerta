const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Revenue extends Model {
    static associate(models) {
      Revenue.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
      Revenue.belongsTo(models.Category, { foreignKey: 'categoryId', as: 'category' });
    }
  }

  Revenue.init(
    {
      description: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      value: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
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
    },
    {
      sequelize,
      modelName: 'Revenue',
    }
  );

  return Revenue;
};
