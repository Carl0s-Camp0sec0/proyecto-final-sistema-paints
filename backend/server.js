require('dotenv').config();
const app = require('./app');
const { sequelize } = require('./models');

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';

// Función para iniciar servidor
async function startServer() {
  try {
    console.log('🔄 Iniciando Sistema Paints...');
    
    // === VERIFICAR CONEXIÓN A BASE DE DATOS ===
    console.log('📊 Verificando conexión a base de datos...');
    await sequelize.authenticate();
    console.log('✅ Conexión a base de datos establecida correctamente');

    // === SINCRONIZAR MODELOS (Solo en desarrollo) ===
    if (process.env.NODE_ENV === 'development') {
      console.log('🔧 Sincronizando modelos con base de datos...');
      // NOTA: alter: true actualiza tablas sin borrar datos
      // Si necesitas recrear todo: { force: true }
      await sequelize.sync({ alter: false }); // Deshabilitado después de migración de NIT
      console.log('✅ Modelos sincronizados correctamente');
    }

    // === VERIFICAR MODELOS CARGADOS ===
    const modelNames = Object.keys(sequelize.models);
    console.log(`📋 Modelos cargados (${modelNames.length}): ${modelNames.join(', ')}`);

    // === INICIAR SERVIDOR HTTP ===
    const server = app.listen(PORT, HOST, () => {
      console.log(`
🚀 ===================================
   SISTEMA PAINTS - SERVIDOR INICIADO
🚀 ===================================
   
📍 URL: http://${HOST}:${PORT}
🌍 Entorno: ${process.env.NODE_ENV || 'development'}
📊 Base de datos: ${process.env.DB_NAME}
🏢 Host DB: ${process.env.DB_HOST}:${process.env.DB_PORT}
🕐 Fecha: ${new Date().toLocaleString('es-GT')}
📁 Modelos: ${modelNames.length} cargados
   
🎯 Proyecto Universidad UMES
   Bases de Datos II - Programación Web
   
✅ Sistema funcionando correctamente
🌐 API disponible en: http://${HOST}:${PORT}/api/test
===================================
      `);
    });

    // === MANEJO GRACEFUL SHUTDOWN ===
    const gracefulShutdown = async (signal) => {
      console.log(`\n⚠️  Señal ${signal} recibida. Cerrando servidor...`);
      
      server.close(async () => {
        console.log('🔴 Servidor HTTP cerrado');
        
        try {
          await sequelize.close();
          console.log('🔴 Conexiones de base de datos cerradas');
        } catch (error) {
          console.error('❌ Error cerrando base de datos:', error);
        }
        
        console.log('👋 Sistema Paints finalizado correctamente');
        process.exit(0);
      });

      // Forzar cierre después de 10 segundos
      setTimeout(() => {
        console.error('⚠️  Forzando cierre del sistema...');
        process.exit(1);
      }, 10000);
    };

    // Escuchar señales de cierre
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    console.error('❌ Error crítico al iniciar servidor:', error);
    
    // Mostrar detalles específicos del error
    if (error.name === 'SequelizeConnectionError') {
      console.error('\n🔧 SOLUCIÓN: Verifica tu configuración de base de datos en .env:');
      console.error('   - DB_HOST, DB_PORT, DB_NAME');
      console.error('   - DB_USER, DB_PASSWORD');
      console.error('   - Que MySQL esté ejecutándose');
      console.error(`   - Que la base de datos '${process.env.DB_NAME}' exista\n`);
    }
    
    process.exit(1);
  }
}

// === MANEJO DE ERRORES NO CAPTURADOS ===
process.on('unhandledRejection', (err, promise) => {
  console.error('❌ Error no manejado (Promise Rejection):', err.message);
  console.error('📍 Promise:', promise);
  
  if (process.env.NODE_ENV !== 'production') {
    console.error('📚 Stack trace:', err.stack);
  }
  
  // En producción, cerrar gracefully
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

process.on('uncaughtException', (err) => {
  console.error('❌ Excepción no capturada:', err.message);
  
  if (process.env.NODE_ENV !== 'production') {
    console.error('📚 Stack trace:', err.stack);
  }
  
  // Siempre cerrar en este caso
  process.exit(1);
});

// === INICIAR SERVIDOR ===
startServer();