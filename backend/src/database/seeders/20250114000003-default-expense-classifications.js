'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('ExpenseClassifications', [
      {
        name: 'Aluguel',
        description: 'Despesas com aluguel de imóveis',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Combustível',
        description: 'Despesas com combustível para veículos',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Água',
        description: 'Despesas com conta de água',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Medicamentos',
        description: 'Despesas com medicamentos e farmácia',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Móveis',
        description: 'Despesas com móveis e decoração',
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('ExpenseClassifications', null, {});
  }
}; 