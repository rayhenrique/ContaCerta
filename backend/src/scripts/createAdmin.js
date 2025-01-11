require('dotenv').config();
const { sequelize, User } = require('../models');

async function createAdminUser() {
  try {
    await sequelize.sync();

    const adminUser = await User.create({
      name: 'Ray Henrique',
      email: 'rayhenrique@gmail.com',
      password: '1508rcrc',
      accessLevel: 'admin'
    });

    console.log('Usuário admin criado com sucesso:', adminUser.toJSON());
    process.exit(0);
  } catch (error) {
    console.error('Erro ao criar usuário admin:', error);
    process.exit(1);
  }
}

createAdminUser();
