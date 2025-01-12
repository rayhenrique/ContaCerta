'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const now = new Date();
    
    // Criar fonte
    await queryInterface.bulkInsert('Categories', [{
      name: 'Salário',
      type: 'source',
      parent_id: null,
      created_at: now,
      updated_at: now
    }]);

    // Buscar o ID da fonte
    const source = await queryInterface.sequelize.query(
      'SELECT id FROM Categories WHERE name = ? AND type = ?',
      {
        replacements: ['Salário', 'source'],
        type: Sequelize.QueryTypes.SELECT
      }
    );

    if (source && source[0]) {
      // Criar bloco
      await queryInterface.bulkInsert('Categories', [{
        name: 'Mensal',
        type: 'block',
        parent_id: source[0].id,
        created_at: now,
        updated_at: now
      }]);

      // Buscar o ID do bloco
      const block = await queryInterface.sequelize.query(
        'SELECT id FROM Categories WHERE name = ? AND type = ?',
        {
          replacements: ['Mensal', 'block'],
          type: Sequelize.QueryTypes.SELECT
        }
      );

      if (block && block[0]) {
        // Criar grupo
        await queryInterface.bulkInsert('Categories', [{
          name: 'Fixo',
          type: 'group',
          parent_id: block[0].id,
          created_at: now,
          updated_at: now
        }]);

        // Buscar o ID do grupo
        const group = await queryInterface.sequelize.query(
          'SELECT id FROM Categories WHERE name = ? AND type = ?',
          {
            replacements: ['Fixo', 'group'],
            type: Sequelize.QueryTypes.SELECT
          }
        );

        if (group && group[0]) {
          // Criar ações
          await queryInterface.bulkInsert('Categories', [
            {
              name: 'Salário Base',
              type: 'action',
              parent_id: group[0].id,
              created_at: now,
              updated_at: now
            },
            {
              name: 'Hora Extra',
              type: 'action',
              parent_id: group[0].id,
              created_at: now,
              updated_at: now
            }
          ]);
        }
      }
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Categories', null, {});
  }
}; 