'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const categoriasData = [
      {
        id: 1,
        nombre: 'Accesorios',
        descripcion: 'Brochas, rodillos, bandejas, mantas de limpieza, espátulas y otros accesorios para pintar',
        requiere_medidas: false, // Se venden por unidad
        activo: true,
        fecha_creacion: new Date()
      },
      {
        id: 2,
        nombre: 'Solventes',
        descripcion: 'Aguarrás, solventes limpiadores, gas y otros productos químicos para pintura',
        requiere_medidas: true, // Se venden en diferentes medidas
        activo: true,
        fecha_creacion: new Date()
      },
      {
        id: 3,
        nombre: 'Pinturas',
        descripcion: 'Pinturas a base de agua, aceite y otros tipos para paredes y superficies',
        requiere_medidas: true, // Se venden en diferentes medidas
        activo: true,
        fecha_creacion: new Date()
      },
      {
        id: 4,
        nombre: 'Barnices',
        descripcion: 'Barnices sintéticos, acrílicos y otros acabados protectores',
        requiere_medidas: true, // Se venden en diferentes medidas
        activo: true,
        fecha_creacion: new Date()
      }
    ];

    await queryInterface.bulkInsert('categorias', categoriasData, {
      ignoreDuplicates: true
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('categorias', null, {});
  }
};