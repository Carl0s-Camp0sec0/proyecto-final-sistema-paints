'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const seriesFacturasData = [
      // Serie A para cada sucursal
      {
        id: 1,
        sucursal_id: 1, // Pradera Chimaltenango
        letra_serie: 'A',
        descripcion: 'Serie principal Chimaltenango',
        correlativo_actual: 0,
        activo: true,
        fecha_creacion: new Date()
      },
      {
        id: 2,
        sucursal_id: 2, // Pradera Escuintla
        letra_serie: 'A',
        descripcion: 'Serie principal Escuintla',
        correlativo_actual: 0,
        activo: true,
        fecha_creacion: new Date()
      },
      {
        id: 3,
        sucursal_id: 3, // Las Américas Mazatenango
        letra_serie: 'A',
        descripcion: 'Serie principal Mazatenango',
        correlativo_actual: 0,
        activo: true,
        fecha_creacion: new Date()
      },
      {
        id: 4,
        sucursal_id: 4, // La Trinidad Coatepeque
        letra_serie: 'A',
        descripcion: 'Serie principal Coatepeque',
        correlativo_actual: 0,
        activo: true,
        fecha_creacion: new Date()
      },
      {
        id: 5,
        sucursal_id: 5, // Pradera Xela Quetzaltenango
        letra_serie: 'A',
        descripcion: 'Serie principal Quetzaltenango',
        correlativo_actual: 0,
        activo: true,
        fecha_creacion: new Date()
      },
      {
        id: 6,
        sucursal_id: 6, // Centro Comercial Miraflores
        letra_serie: 'A',
        descripcion: 'Serie principal Miraflores',
        correlativo_actual: 0,
        activo: true,
        fecha_creacion: new Date()
      }
    ];

    await queryInterface.bulkInsert('series_facturas', seriesFacturasData, {
      ignoreDuplicates: true
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('series_facturas', null, {});
  }
};