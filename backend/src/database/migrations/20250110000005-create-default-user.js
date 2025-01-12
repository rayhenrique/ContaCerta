'use strict';

const bcrypt = require('bcryptjs');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const hashedPassword = await bcrypt.hash('1508rcrc', 10);
    
    await queryInterface.bulkInsert('Users', [{
      name: 'Ray Henrique',
      email: 'rayhenrique@gmail.com',
      password: hashedPassword,
      access_level: 'admin',
      created_at: new Date(),
      updated_at: new Date()
    }], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Users', { email: 'rayhenrique@gmail.com' }, {});
  }
};
