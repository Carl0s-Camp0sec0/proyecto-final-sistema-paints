'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Coordenadas cerca de las sucursales para testing
    const clientesData = [
      {
        id: 1,
        nombre_completo: 'Juan Carlos Pérez López',
        email: 'juan.perez@email.com',
        telefono: '5551-2345',
        direccion: 'Zona 1, Chimaltenango',
        latitud: 14.6355, // Cerca de Pradera Chimaltenango
        longitud: -90.8195,
        recibe_promociones: true,
        activo: true,
        fecha_creacion: new Date(),
        fecha_actualizacion: new Date()
      },
      {
        id: 2,
        nombre_completo: 'María Elena Gonzalez Morales',
        email: 'maria.gonzalez@email.com',
        telefono: '5552-3456',
        direccion: 'Zona 3, Escuintla',
        latitud: 14.3065, // Cerca de Pradera Escuintla
        longitud: -90.7865,
        recibe_promociones: true,
        activo: true,
        fecha_creacion: new Date(),
        fecha_actualizacion: new Date()
      },
      {
        id: 3,
        nombre_completo: 'Carlos Roberto Mendez Silva',
        email: 'carlos.mendez@email.com',
        telefono: '5553-4567',
        direccion: 'Colonia Los Pinos, Guatemala',
        latitud: 14.6125, // Cerca de Miraflores
        longitud: -90.5335,
        recibe_promociones: false,
        activo: true,
        fecha_creacion: new Date(),
        fecha_actualizacion: new Date()
      },
      {
        id: 4,
        nombre_completo: 'Ana Lucía Hernandez Castro',
        email: 'ana.hernandez@email.com',
        telefono: '5554-5678',
        direccion: 'Mazatenango, Suchitepéquez',
        latitud: 14.5350, // Cerca de Las Américas
        longitud: -91.5045,
        recibe_promociones: true,
        activo: true,
        fecha_creacion: new Date(),
        fecha_actualizacion: new Date()
      },
      {
        id: 5,
        nombre_completo: 'Luis Fernando Ramírez Torres',
        email: 'luis.ramirez@email.com',
        telefono: '5555-6789',
        direccion: 'Quetzaltenango, Zona 5',
        latitud: 14.8350, // Cerca de Pradera Xela
        longitud: -91.5195,
        recibe_promociones: true,
        activo: true,
        fecha_creacion: new Date(),
        fecha_actualizacion: new Date()
      },
      {
        id: 6,
        nombre_completo: 'Rosa Maria López Gutiérrez',
        email: 'rosa.lopez@email.com',
        telefono: '5556-7890',
        direccion: 'Coatepeque, Quetzaltenango',
        latitud: 14.7050, // Cerca de La Trinidad
        longitud: -91.8665,
        recibe_promociones: false,
        activo: true,
        fecha_creacion: new Date(),
        fecha_actualizacion: new Date()
      },
      {
        id: 7,
        nombre_completo: 'Pedro Antonio Morales Díaz',
        email: null, // Cliente sin email
        telefono: '5557-8901',
        direccion: 'Aldea San José, Chimaltenango',
        latitud: null,
        longitud: null,
        recibe_promociones: false,
        activo: true,
        fecha_creacion: new Date(),
        fecha_actualizacion: new Date()
      },
      {
        id: 8,
        nombre_completo: 'Gloria Isabel Vásquez Reyes',
        email: 'gloria.vasquez@email.com',
        telefono: '5558-9012',
        direccion: 'Ciudad de Guatemala, Zona 10',
        latitud: 14.6118,
        longitud: -90.5328,
        recibe_promociones: true,
        activo: true,
        fecha_creacion: new Date(),
        fecha_actualizacion: new Date()
      }
    ];

    await queryInterface.bulkInsert('clientes', clientesData, {
      ignoreDuplicates: true
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('clientes', null, {});
  }
};