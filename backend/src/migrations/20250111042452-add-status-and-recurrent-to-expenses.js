'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('expenses', 'status', {
      type: Sequelize.ENUM('pending', 'confirmed', 'cancelled'),
      defaultValue: 'pending',
      allowNull: false,
    });

    await queryInterface.addColumn('expenses', 'recurrent', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('expenses', 'recurrent');
    
    // Para remover um ENUM, primeiro precisamos remover a coluna e depois o tipo ENUM
    await queryInterface.removeColumn('expenses', 'status');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_expenses_status";');
  }
};
