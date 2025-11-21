// Script para actualizar passwords DIRECTAMENTE en BD
// Sin usar modelos de Sequelize para evitar hooks

const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixPasswordsDirecto() {
    console.log('🔧 ARREGLANDO PASSWORDS DIRECTAMENTE EN BD');
    console.log('==========================================\n');

    // Crear conexión directa a MySQL
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME || 'sistema_paints'
    });

    console.log('✅ Conectado a la base de datos\n');

    // Usuarios a actualizar
    const usuarios = [
        { email: 'admin@paints.com', password: 'admin123' },
        { email: 'digitador@paints.com', password: 'digitador123' },
        { email: 'cajero@paints.com', password: 'cajero123' },
        { email: 'gerente@paints.com', password: 'gerente123' }
    ];

    for (const user of usuarios) {
        console.log(`🔄 Procesando: ${user.email}`);

        // Generar nuevo hash
        const nuevoHash = await bcrypt.hash(user.password, 12);
        console.log(`   🔒 Nuevo hash: ${nuevoHash.substring(0, 30)}...`);

        // Actualizar DIRECTAMENTE en BD con SQL
        const [result] = await connection.execute(
            'UPDATE usuarios SET password_hash = ?, fecha_actualizacion = NOW() WHERE email = ?',
            [nuevoHash, user.email]
        );

        console.log(`   ✅ Actualizado (${result.affectedRows} fila)\n`);
    }

    console.log('🎉 Todos los passwords actualizados correctamente\n');

    // Verificar
    console.log('🧪 VERIFICANDO...');
    for (const user of usuarios) {
        const [rows] = await connection.execute(
            'SELECT email, password_hash FROM usuarios WHERE email = ?',
            [user.email]
        );

        if (rows.length > 0) {
            const esValido = await bcrypt.compare(user.password, rows[0].password_hash);
            console.log(`   ${esValido ? '✅' : '❌'} ${user.email}: ${esValido ? 'VÁLIDO' : 'INVÁLIDO'}`);
        }
    }

    await connection.end();
    console.log('\n✅ Proceso completado');
}

fixPasswordsDirecto()
    .then(() => process.exit(0))
    .catch(error => {
        console.error('💥 Error:', error);
        process.exit(1);
    });
