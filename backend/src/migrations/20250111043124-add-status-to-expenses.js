'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Expenses', 'status', {
      type: Sequelize.STRING,
      defaultValue: 'pending',
      allowNull: false,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Expenses', 'status');
  }
};
