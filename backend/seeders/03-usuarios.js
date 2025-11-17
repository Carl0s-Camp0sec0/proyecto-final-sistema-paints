'use strict';
const bcrypt = require('bcrypt');
const config = require('../config/seeder-config');

module.exports = {
  async up(queryInterface, Sequelize) {
    // Generar passwords encriptadas
    const saltRounds = 12;
    
    const usuariosData = [
      {
        id: 1,
        nombre_completo: 'Administrador del Sistema',
        email: config.usuarios.admin.email,
        password_hash: await bcrypt.hash(config.usuarios.admin.password, saltRounds),
        rol_id: 1, // Administrador
        activo: true,
        ultimo_acceso: null,
        fecha_creacion: new Date(),
        fecha_actualizacion: new Date()
      },
      {
        id: 2,
        nombre_completo: 'María González - Digitadora',
        email: config.usuarios.digitador.email,
        password_hash: await bcrypt.hash(config.usuarios.digitador.password, saltRounds),
        rol_id: 2, // Digitador
        activo: true,
        ultimo_acceso: null,
        fecha_creacion: new Date(),
        fecha_actualizacion: new Date()
      },
      {
        id: 3,
        nombre_completo: 'Carlos López - Cajero',
        email: config.usuarios.cajero.email,
        password_hash: await bcrypt.hash(config.usuarios.cajero.password, saltRounds),
        rol_id: 3, // Cajero
        activo: true,
        ultimo_acceso: null,
        fecha_creacion: new Date(),
        fecha_actualizacion: new Date()
      },
      {
        id: 4,
        nombre_completo: 'Ana Rodríguez - Gerente',
        email: config.usuarios.gerente.email,
        password_hash: await bcrypt.hash(config.usuarios.gerente.password, saltRounds),
        rol_id: 4, // Gerente
        activo: true,
        ultimo_acceso: null,
        fecha_creacion: new Date(),
        fecha_actualizacion: new Date()
      }
    ];

    await queryInterface.bulkInsert('usuarios', usuariosData, {
      ignoreDuplicates: true
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('usuarios', null, {});
  }
};