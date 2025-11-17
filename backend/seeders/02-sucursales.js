'use strict';
const config = require('../config/seeder-config');

module.exports = {
  async up(queryInterface, Sequelize) {
    const sucursalesData = [
      {
        id: 1,
        nombre: 'Pradera Chimaltenango',
        direccion: 'Centro Comercial Pradera Chimaltenango, Chimaltenango, Guatemala',
        latitud: config.sucursales['Pradera Chimaltenango'].lat,
        longitud: config.sucursales['Pradera Chimaltenango'].lng,
        telefono: '7765-4321',
        email: 'chimaltenango@paints.com',
        activo: true,
        fecha_creacion: new Date()
      },
      {
        id: 2,
        nombre: 'Pradera Escuintla',
        direccion: 'Centro Comercial Pradera Escuintla, Escuintla, Guatemala',
        latitud: config.sucursales['Pradera Escuintla'].lat,
        longitud: config.sucursales['Pradera Escuintla'].lng,
        telefono: '7788-5432',
        email: 'escuintla@paints.com',
        activo: true,
        fecha_creacion: new Date()
      },
      {
        id: 3,
        nombre: 'Las Américas Mazatenango',
        direccion: 'Centro Comercial Las Américas, Mazatenango, Suchitepéquez, Guatemala',
        latitud: config.sucursales['Las Américas Mazatenango'].lat,
        longitud: config.sucursales['Las Américas Mazatenango'].lng,
        telefono: '7721-6543',
        email: 'mazatenango@paints.com',
        activo: true,
        fecha_creacion: new Date()
      },
      {
        id: 4,
        nombre: 'La Trinidad Coatepeque',
        direccion: 'Centro Comercial La Trinidad, Coatepeque, Quetzaltenango, Guatemala',
        latitud: config.sucursales['La Trinidad Coatepeque'].lat,
        longitud: config.sucursales['La Trinidad Coatepeque'].lng,
        telefono: '7775-7654',
        email: 'coatepeque@paints.com',
        activo: true,
        fecha_creacion: new Date()
      },
      {
        id: 5,
        nombre: 'Pradera Xela Quetzaltenango',
        direccion: 'Centro Comercial Pradera Xela, Quetzaltenango, Guatemala',
        latitud: config.sucursales['Pradera Xela Quetzaltenango'].lat,
        longitud: config.sucursales['Pradera Xela Quetzaltenango'].lng,
        telefono: '7761-8765',
        email: 'quetzaltenango@paints.com',
        activo: true,
        fecha_creacion: new Date()
      },
      {
        id: 6,
        nombre: 'Centro Comercial Miraflores',
        direccion: 'Centro Comercial Miraflores, Ciudad de Guatemala, Guatemala',
        latitud: config.sucursales['Centro Comercial Miraflores'].lat,
        longitud: config.sucursales['Centro Comercial Miraflores'].lng,
        telefono: '2234-9876',
        email: 'miraflores@paints.com',
        activo: true,
        fecha_creacion: new Date()
      }
    ];

    await queryInterface.bulkInsert('sucursales', sucursalesData, {
      ignoreDuplicates: true
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('sucursales', null, {});
  }
};