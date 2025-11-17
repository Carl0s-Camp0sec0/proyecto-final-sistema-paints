'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const unidadesMedidaData = [
      // Unidades para Accesorios (por unidad)
      {
        id: 1,
        categoria_id: 1, // Accesorios
        nombre: 'Unidad',
        abreviatura: 'und',
        factor_conversion: 1,
        activo: true,
        fecha_creacion: new Date()
      },
      
      // Unidades para Solventes
      {
        id: 2,
        categoria_id: 2, // Solventes
        nombre: '1/32 Galón',
        abreviatura: '1/32gl',
        factor_conversion: 0.03125,
        activo: true,
        fecha_creacion: new Date()
      },
      {
        id: 3,
        categoria_id: 2,
        nombre: '1/16 Galón',
        abreviatura: '1/16gl',
        factor_conversion: 0.0625,
        activo: true,
        fecha_creacion: new Date()
      },
      {
        id: 4,
        categoria_id: 2,
        nombre: '1/8 Galón',
        abreviatura: '1/8gl',
        factor_conversion: 0.125,
        activo: true,
        fecha_creacion: new Date()
      },
      {
        id: 5,
        categoria_id: 2,
        nombre: '1/4 Galón',
        abreviatura: '1/4gl',
        factor_conversion: 0.25,
        activo: true,
        fecha_creacion: new Date()
      },
      {
        id: 6,
        categoria_id: 2,
        nombre: '1/2 Galón',
        abreviatura: '1/2gl',
        factor_conversion: 0.5,
        activo: true,
        fecha_creacion: new Date()
      },
      
      // Unidades para Pinturas
      {
        id: 7,
        categoria_id: 3, // Pinturas
        nombre: '1/32 Galón',
        abreviatura: '1/32gl',
        factor_conversion: 0.03125,
        activo: true,
        fecha_creacion: new Date()
      },
      {
        id: 8,
        categoria_id: 3,
        nombre: '1/16 Galón',
        abreviatura: '1/16gl',
        factor_conversion: 0.0625,
        activo: true,
        fecha_creacion: new Date()
      },
      {
        id: 9,
        categoria_id: 3,
        nombre: '1/8 Galón',
        abreviatura: '1/8gl',
        factor_conversion: 0.125,
        activo: true,
        fecha_creacion: new Date()
      },
      {
        id: 10,
        categoria_id: 3,
        nombre: '1/4 Galón',
        abreviatura: '1/4gl',
        factor_conversion: 0.25,
        activo: true,
        fecha_creacion: new Date()
      },
      {
        id: 11,
        categoria_id: 3,
        nombre: '1/2 Galón',
        abreviatura: '1/2gl',
        factor_conversion: 0.5,
        activo: true,
        fecha_creacion: new Date()
      },
      {
        id: 12,
        categoria_id: 3,
        nombre: '1 Galón',
        abreviatura: '1gl',
        factor_conversion: 1,
        activo: true,
        fecha_creacion: new Date()
      },
      {
        id: 13,
        categoria_id: 3,
        nombre: '1 Cubeta',
        abreviatura: 'cub',
        factor_conversion: 5, // 1 cubeta = 5 galones
        activo: true,
        fecha_creacion: new Date()
      },
      
      // Unidades para Barnices
      {
        id: 14,
        categoria_id: 4, // Barnices
        nombre: '1/32 Galón',
        abreviatura: '1/32gl',
        factor_conversion: 0.03125,
        activo: true,
        fecha_creacion: new Date()
      },
      {
        id: 15,
        categoria_id: 4,
        nombre: '1/16 Galón',
        abreviatura: '1/16gl',
        factor_conversion: 0.0625,
        activo: true,
        fecha_creacion: new Date()
      },
      {
        id: 16,
        categoria_id: 4,
        nombre: '1/8 Galón',
        abreviatura: '1/8gl',
        factor_conversion: 0.125,
        activo: true,
        fecha_creacion: new Date()
      },
      {
        id: 17,
        categoria_id: 4,
        nombre: '1/4 Galón',
        abreviatura: '1/4gl',
        factor_conversion: 0.25,
        activo: true,
        fecha_creacion: new Date()
      },
      {
        id: 18,
        categoria_id: 4,
        nombre: '1/2 Galón',
        abreviatura: '1/2gl',
        factor_conversion: 0.5,
        activo: true,
        fecha_creacion: new Date()
      }
    ];

    await queryInterface.bulkInsert('unidades_medida', unidadesMedidaData, {
      ignoreDuplicates: true
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('unidades_medida', null, {});
  }
};