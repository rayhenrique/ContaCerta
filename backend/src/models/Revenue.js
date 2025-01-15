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
        defaultValue: 'pending',
        allowNull: false,
        validate: {
          isIn: [['pending', 'confirmed', 'cancelled']]
        }
      },
    },
    {
      sequelize,
      modelName: 'Revenue',
    }
  );

  return Revenue;
};
