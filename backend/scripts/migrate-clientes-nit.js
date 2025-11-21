/**
 * Script de migración para agregar campo NIT a clientes existentes
 */

require('dotenv').config();
const { sequelize, Cliente } = require('../models');

async function migrateClientesNIT() {
  try {
    console.log('🔄 Iniciando migración de NITs para clientes existentes...');

    await sequelize.authenticate();
    console.log('✅ Conectado a la base de datos');

    // Obtener todos los clientes sin NIT
    const clientes = await Cliente.findAll({
      where: {
        nit: null
      }
    });

    console.log(`📋 Encontrados ${clientes.length} clientes sin NIT`);

    // Actualizar cada cliente con un NIT único
    for (let i = 0; i < clientes.length; i++) {
      const cliente = clientes[i];
      const nit = `CF-${Date.now()}-${i}`;

      await cliente.update({ nit });
      console.log(`✅ Cliente ${cliente.id} actualizado con NIT: ${nit}`);
    }

    console.log('✅ Migración completada exitosamente');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error en migración:', error);
    process.exit(1);
  }
}

migrateClientesNIT();
