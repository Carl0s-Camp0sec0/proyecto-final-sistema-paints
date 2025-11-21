// Ejecutar: node test-controller.js

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Usuario, Rol } = require('./backend/models');
const authConfig = require('./backend/config/auth');

async function testControllerDirecto() {
    console.log('🔍 TEST DIRECTO DEL AUTHCONTROLLER');
    console.log('================================\n');

    try {
        // Simular el req.body que envía Postman
        const email = 'cajero@paints.com';
        const password = 'cajero123';
        
        console.log('📧 Email:', email);
        console.log('🔑 Password:', password);

        // PASO 1: Buscar usuario (igual que AuthController)
        console.log('\n🔍 Buscando usuario...');
        
        const usuario = await Usuario.findOne({
            where: { email, activo: true },
            include: [{
                model: Rol,
                as: 'rol',
                attributes: ['id', 'nombre', 'descripcion']
            }]
        });

        console.log('👤 Usuario encontrado:', !!usuario);
        
        if (!usuario) {
            console.log('❌ FALLO: Usuario no encontrado');
            return;
        }

        console.log('📊 Datos del usuario:');
        console.log('  - ID:', usuario.id);
        console.log('  - Nombre:', usuario.nombre_completo);
        console.log('  - Email:', usuario.email);
        console.log('  - Activo:', usuario.activo);
        console.log('  - Rol:', usuario.rol?.nombre);
        console.log('  - Hash:', usuario.password_hash.substring(0, 30) + '...');

        // PASO 2: Verificar password (igual que AuthController)
        console.log('\n🔐 Verificando password...');
        
        const passwordValida = await bcrypt.compare(password, usuario.password_hash);
        console.log('✅ Password válida:', passwordValida);
        
        if (!passwordValida) {
            console.log('❌ FALLO: Password inválida');
            return;
        }

        // PASO 3: Generar JWT (igual que AuthController)
        console.log('\n🎫 Generando JWT...');
        
        const token = jwt.sign(
            {
                id: usuario.id,
                email: usuario.email,
                rol: usuario.rol.nombre,
                rol_id: usuario.rol_id
            },
            authConfig.jwt.secret,
            { expiresIn: authConfig.jwt.expiresIn }
        );

        console.log('🎫 Token generado:', token.substring(0, 50) + '...');
        
        // PASO 4: Respuesta final
        const respuesta = {
            success: true,
            message: 'Login exitoso',
            data: {
                token,
                usuario: {
                    id: usuario.id,
                    nombre_completo: usuario.nombre_completo,
                    email: usuario.email,
                    rol: usuario.rol.nombre
                }
            }
        };

        console.log('\n✅ RESPUESTA FINAL:');
        console.log(JSON.stringify(respuesta, null, 2));
        
        console.log('\n🎉 ¡EL AUTHCONTROLLER DEBERÍA FUNCIONAR PERFECTAMENTE!');
        console.log('Si este test funciona pero Postman falla, el problema son las RUTAS.');

    } catch (error) {
        console.error('💥 Error en test:', error);
        
        if (error.name === 'JsonWebTokenError') {
            console.log('🔧 Problema: JWT_SECRET no está configurado correctamente');
        }
    }
}

testControllerDirecto()
    .then(() => process.exit(0))
    .catch(error => {
        console.error('Error:', error);
        process.exit(1);
    });