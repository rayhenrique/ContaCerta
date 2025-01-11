require('dotenv').config();

module.exports = {
  development: {
    dialect: 'mysql',
    host: '127.0.0.1',
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'contacerta',
    define: {
      timestamps: true,
      underscored: true,
    },
    logging: false
  },
  test: {
    dialect: 'mysql',
    host: '127.0.0.1',
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'contacerta_test',
    define: {
      timestamps: true,
      underscored: true,
    },
    logging: false
  },
  production: {
    dialect: 'mysql',
    host: '127.0.0.1',
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    define: {
      timestamps: true,
      underscored: true,
    },
    logging: false
  }
};
