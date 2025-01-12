const { Model, DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize) => {
  class User extends Model {
    static associate(models) {
      User.hasMany(models.Revenue, { foreignKey: 'userId' });
      User.hasMany(models.Expense, { foreignKey: 'userId' });
    }
  }

  User.init(
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      accessLevel: {
        type: DataTypes.ENUM('admin', 'operator'),
        allowNull: false,
        defaultValue: 'operator',
        field: 'access_level'
      },
    },
    {
      sequelize,
      modelName: 'User',
      underscored: true,
      hooks: {
        beforeCreate: async (user) => {
          user.password = await bcrypt.hash(user.password, 10);
        },
        beforeUpdate: async (user) => {
          if (user.changed('password')) {
            user.password = await bcrypt.hash(user.password, 10);
          }
        },
      },
    }
  );

  User.prototype.checkPassword = function (password) {
    return bcrypt.compare(password, this.password);
  };

  return User;
};
