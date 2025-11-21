// Ejecutar: node verificar-bd.js

const bcrypt = require('bcrypt');
const { Usuario } = require('./backend/models');

async function verificarBaseDeDatos() {
    console.log('🔍 VERIFICANDO ESTADO ACTUAL DE LA BASE DE DATOS');
    console.log('==============================================\n');

    try {
        // Obtener TODOS los usuarios
        const usuarios = await Usuario.findAll({
            attributes: ['id', 'email', 'nombre_completo', 'password_hash', 'activo']
        });

        console.log(`📊 Total usuarios encontrados: ${usuarios.length}\n`);

        // Passwords esperados
        const passwordsEsperados = {
            'admin@paints.com': 'admin123',
            'digitador@paints.com': 'digitador123', 
            'cajero@paints.com': 'cajero123',
            'gerente@paints.com': 'gerente123'
        };

        console.log('🧪 TESTING CADA USUARIO:');
        console.log('========================');

        for (const usuario of usuarios) {
            console.log(`\n👤 Usuario: ${usuario.email}`);
            console.log(`📧 Email: ${usuario.email}`);
            console.log(`✅ Activo: ${usuario.activo}`);
            console.log(`🔒 Hash: ${usuario.password_hash}`);
            console.log(`🔒 Hash preview: ${usuario.password_hash.substring(0, 30)}...`);
            
            // Test del password esperado
            const passwordEsperado = passwordsEsperados[usuario.email];
            if (passwordEsperado) {
                console.log(`🔑 Password esperado: ${passwordEsperado}`);
                
                const esValido = await bcrypt.compare(passwordEsperado, usuario.password_hash);
                console.log(`✅ Password válido: ${esValido}`);
                
                if (!esValido) {
                    console.log(`❌ PROBLEMA: ${usuario.email} no acepta su password`);
                    
                    // Generar hash correcto
                    const hashCorrecto = await bcrypt.hash(passwordEsperado, 12);
                    console.log(`🔧 Hash correcto sería: ${hashCorrecto}`);
                }
            } else {
                console.log(`⚠️  No hay password esperado definido para este usuario`);
            }
            
            console.log('─'.repeat(50));
        }

        console.log('\n📋 RESUMEN:');
        console.log('===========');
        
        let usuariosCorrectos = 0;
        let usuariosIncorrectos = 0;

        for (const usuario of usuarios) {
            const passwordEsperado = passwordsEsperados[usuario.email];
            if (passwordEsperado) {
                const esValido = await bcrypt.compare(passwordEsperado, usuario.password_hash);
                if (esValido) {
                    usuariosCorrectos++;
                } else {
                    usuariosIncorrectos++;
                    console.log(`❌ ${usuario.email} tiene hash incorrecto`);
                }
            }
        }
        
        console.log(`✅ Usuarios con hash correcto: ${usuariosCorrectos}`);
        console.log(`❌ Usuarios con hash incorrecto: ${usuariosIncorrectos}`);

        if (usuariosIncorrectos > 0) {
            console.log('\n🔧 COMANDOS SQL PARA CORREGIR:');
            console.log('==============================');
            
            for (const usuario of usuarios) {
                const passwordEsperado = passwordsEsperados[usuario.email];
                if (passwordEsperado) {
                    const esValido = await bcrypt.compare(passwordEsperado, usuario.password_hash);
                    if (!esValido) {
                        const hashCorrecto = await bcrypt.hash(passwordEsperado, 12);
                        console.log(`UPDATE usuarios SET password_hash = '${hashCorrecto}' WHERE email = '${usuario.email}';`);
                    }
                }
            }
        } else {
            console.log('\n🎉 ¡Todos los hashes están correctos!');
        }

    } catch (error) {
        console.error('💥 Error:', error);
    }
}

verificarBaseDeDatos()
    .then(() => process.exit(0))
    .catch(error => {
        console.error('Error:', error);
        process.exit(1);
    });