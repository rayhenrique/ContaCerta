require('dotenv').config();
const { sequelize, User } = require('../models');
const bcrypt = require('bcryptjs');

async function createAdminUser() {
  try {
    await sequelize.sync();

    // Check if admin user already exists
    const existingAdmin = await User.findOne({
      where: { email: 'rayhenrique@gmail.com' }
    });

    if (existingAdmin) {
      console.log('Usuário admin já existe.');
      process.exit(0);
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash('1508rcc', 10);

    const adminUser = await User.create({
      name: 'Ray Henrique',
      email: 'rayhenrique@gmail.com',
      password: hashedPassword,
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
