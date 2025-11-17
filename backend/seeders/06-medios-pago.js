'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const mediosPagoData = [
      {
        id: 1,
        nombre: 'Efectivo',
        descripcion: 'Pago en efectivo - billetes y monedas',
        requiere_referencia: false,
        activo: true,
        fecha_creacion: new Date()
      },
      {
        id: 2,
        nombre: 'Cheque',
        descripcion: 'Pago con cheque bancario',
        requiere_referencia: true,
        activo: true,
        fecha_creacion: new Date()
      },
      {
        id: 3,
        nombre: 'Tarjeta de Débito',
        descripcion: 'Pago con tarjeta de débito',
        requiere_referencia: true,
        activo: true,
        fecha_creacion: new Date()
      },
      {
        id: 4,
        nombre: 'Tarjeta de Crédito',
        descripcion: 'Pago con tarjeta de crédito',
        requiere_referencia: true,
        activo: true,
        fecha_creacion: new Date()
      },
      {
        id: 5,
        nombre: 'Transferencia Bancaria',
        descripcion: 'Transferencia electrónica',
        requiere_referencia: true,
        activo: true,
        fecha_creacion: new Date()
      }
    ];

    await queryInterface.bulkInsert('medios_pago', mediosPagoData, {
      ignoreDuplicates: true
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('medios_pago', null, {});
  }
};