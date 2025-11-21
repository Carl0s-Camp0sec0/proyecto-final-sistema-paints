// Test detallado del proceso de login
const bcrypt = require('bcrypt');
const { Usuario, Rol } = require('./backend/models');

async function testLoginCompleto() {
    console.log('🧪 TEST COMPLETO DEL PROCESO DE LOGIN');
    console.log('=====================================\n');

    const email = 'admin@paints.com';
    const password = 'admin123';

    try {
        console.log('1️⃣  Datos de entrada:');
        console.log('   📧 Email:', email);
        console.log('   🔑 Password:', password);
        console.log('');

        console.log('2️⃣  Buscando usuario en BD...');
        const usuario = await Usuario.findOne({
            where: { email, activo: true },
            include: [{
                model: Rol,
                as: 'rol',
                attributes: ['id', 'nombre', 'descripcion']
            }]
        });

        console.log('   ✅ Usuario encontrado:', usuario ? 'SÍ' : 'NO');

        if (!usuario) {
            console.log('   ❌ ERROR: Usuario no encontrado o inactivo');
            return;
        }

        console.log('   👤 ID:', usuario.id);
        console.log('   👤 Nombre:', usuario.nombre_completo);
        console.log('   👤 Email:', usuario.email);
        console.log('   👤 Activo:', usuario.activo);
        console.log('   🔒 Password hash:', usuario.password_hash);
        console.log('   🔒 Hash length:', usuario.password_hash?.length);
        console.log('   👮 Rol:', usuario.rol?.nombre);
        console.log('');

        console.log('3️⃣  Verificando password...');
        console.log('   🔑 Password ingresado:', password);
        console.log('   🔒 Hash en BD:', usuario.password_hash.substring(0, 50) + '...');

        // Test directo con bcrypt
        console.log('   ⏳ Ejecutando bcrypt.compare...');
        const passwordValida = await bcrypt.compare(password, usuario.password_hash);

        console.log('   ✅ Resultado bcrypt.compare:', passwordValida);
        console.log('');

        if (!passwordValida) {
            console.log('❌ ERROR: Password inválido');
            console.log('');
            console.log('🔍 DIAGNÓSTICO ADICIONAL:');

            // Generar hash fresco para comparar
            const hashFresco = await bcrypt.hash(password, 12);
            console.log('   🆕 Hash fresco generado:', hashFresco.substring(0, 50) + '...');

            // Verificar el hash fresco
            const testHashFresco = await bcrypt.compare(password, hashFresco);
            console.log('   ✅ Test con hash fresco:', testHashFresco);

            // Comparar longitudes
            console.log('   📏 Longitud hash BD:', usuario.password_hash.length);
            console.log('   📏 Longitud hash fresco:', hashFresco.length);

            // Ver si el hash en BD es un double hash
            console.log('   🔍 ¿Es el hash de BD un double hash?');
            const esDoubleHash = usuario.password_hash.length > 100;
            console.log('   ', esDoubleHash ? '⚠️  POSIBLE (longitud > 100)' : '✅ NO (longitud normal)');

        } else {
            console.log('✅ PASSWORD VÁLIDO - LOGIN EXITOSO');
            console.log('');
            console.log('🎯 El login debería funcionar correctamente');
        }

    } catch (error) {
        console.error('💥 Error en test:', error);
    }
}

testLoginCompleto()
    .then(() => process.exit(0))
    .catch(error => {
        console.error('Error fatal:', error);
        process.exit(1);
    });
