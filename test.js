// Ejecutar en la raíz del proyecto: node test-definitivo.js

const bcrypt = require('bcrypt');

// Conectar a la base de datos
const { Usuario } = require('./backend/models');

async function testDefinitivo() {
    console.log('🔍 TEST DEFINITIVO - VERIFICANDO PROBLEMA');
    console.log('==========================================\n');

    try {
        // 1. Buscar el usuario admin en la BD
        const usuario = await Usuario.findOne({
            where: { email: 'admin@paints.com' }
        });

        if (!usuario) {
            console.log('❌ Usuario no encontrado en BD');
            return;
        }

        console.log('👤 Usuario encontrado:');
        console.log('📧 Email:', usuario.email);
        console.log('🔒 Hash actual:', usuario.password_hash);
        console.log('🔒 Hash preview:', usuario.password_hash.substring(0, 30) + '...');

        // 2. Test directo del hash
        const password = 'admin123';
        console.log('\n🧪 Testeando password:', password);
        
        const isValid = await bcrypt.compare(password, usuario.password_hash);
        console.log('✅ Password válido con hash actual:', isValid);

        // 3. Generar hash fresco para comparar
        console.log('\n🔄 Generando hash fresco...');
        const hashFresco = await bcrypt.hash(password, 12);
        console.log('🆕 Hash fresco:', hashFresco);
        
        const testFresco = await bcrypt.compare(password, hashFresco);
        console.log('✅ Test hash fresco:', testFresco);

        // 4. **AQUÍ ESTÁ LA PRUEBA CRÍTICA**
        console.log('\n🚨 PRUEBA CRÍTICA: Simular UPDATE de Sequelize');
        console.log('================================================');
        
        // Intentar actualizar el campo password_hash con un hash correcto
        console.log('🔄 Actualizando password_hash con hash fresco...');
        
        // Esto va a pasar por el hook beforeUpdate
        usuario.password_hash = hashFresco;
        await usuario.save();

        console.log('💾 Usuario guardado.');
        
        // 5. Verificar qué pasó después del save
        const usuarioActualizado = await Usuario.findOne({
            where: { email: 'admin@paints.com' }
        });
        
        console.log('\n📋 RESULTADO DESPUÉS DEL SAVE:');
        console.log('🔒 Hash ANTES del save:', hashFresco.substring(0, 30) + '...');
        console.log('🔒 Hash DESPUÉS del save:', usuarioActualizado.password_hash.substring(0, 30) + '...');
        console.log('🔄 ¿Son iguales?', hashFresco === usuarioActualizado.password_hash);

        // 6. Test final
        const testFinal = await bcrypt.compare(password, usuarioActualizado.password_hash);
        console.log('✅ ¿Password funciona después del save?', testFinal);

        console.log('\n🎯 DIAGNÓSTICO:');
        if (!testFinal && hashFresco !== usuarioActualizado.password_hash) {
            console.log('❌ CONFIRMADO: Los hooks están hasheando de nuevo el hash');
            console.log('🔧 SOLUCIÓN: Desactivar temporalmente los hooks del modelo');
        } else {
            console.log('✅ Los hooks no están causando problemas');
        }

    } catch (error) {
        console.error('💥 Error en test:', error);
    }
}

testDefinitivo()
    .then(() => process.exit(0))
    .catch(error => {
        console.error('Error:', error);
        process.exit(1);
    });