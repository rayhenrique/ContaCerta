'use strict';

const bcrypt = require('bcryptjs');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('Users', [{
      name: 'Ray Henrique',
      email: 'rayhenrique@gmail.com',
      password: '1508rcrc',
      access_level: 'admin',
      created_at: new Date(),
      updated_at: new Date()
    }], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Users', { email: 'rayhenrique@gmail.com' }, {});
  }
};
