'use strict';

const bcrypt = require('bcryptjs');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('Users', [
      {
        name: 'Administrador',
        email: 'rayhenrique@gmail.com',
        password: await bcrypt.hash('1508rcrc.', 10),
        role: 'admin',
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Users', {
      email: 'rayhenrique@gmail.com'
    }, {});
  }
};
