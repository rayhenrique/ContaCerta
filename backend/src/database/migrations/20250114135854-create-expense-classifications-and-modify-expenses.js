'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Criar tabela de classificações de despesas
    await queryInterface.createTable('ExpenseClassifications', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Remover coluna observation da tabela Expenses
    await queryInterface.removeColumn('Expenses', 'observation');

    // Adicionar coluna classification_id na tabela Expenses
    await queryInterface.addColumn('Expenses', 'classification_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'ExpenseClassifications',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Reverter as alterações
    await queryInterface.removeColumn('Expenses', 'classification_id');
    await queryInterface.addColumn('Expenses', 'observation', {
      type: Sequelize.TEXT,
      allowNull: true
    });
    await queryInterface.dropTable('ExpenseClassifications');
  }
};
