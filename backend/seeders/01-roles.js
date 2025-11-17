'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('roles', [
      {
        id: 1,
        nombre: 'Administrador',
        descripcion: 'Control total del sistema, configuración y gestión de usuarios',
        activo: true,
        fecha_creacion: new Date()
      },
      {
        id: 2,
        nombre: 'Digitador',
        descripcion: 'Persona encargada de alimentar el sistema con productos, inventario y configuraciones',
        activo: true,
        fecha_creacion: new Date()
      },
      {
        id: 3,
        nombre: 'Cajero',
        descripcion: 'Persona que solo podrá cobrar y procesar ventas',
        activo: true,
        fecha_creacion: new Date()
      },
      {
        id: 4,
        nombre: 'Gerente',
        descripcion: 'Persona que podrá observar los reportes y supervisar operaciones',
        activo: true,
        fecha_creacion: new Date()
      }
    ], {
      ignoreDuplicates: true
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('roles', null, {});
  }
};