const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const authConfig = require('../config/auth');

// Importar modelos de forma más segura
let Usuario, Rol;
try {
  const models = require('../models');
  Usuario = models.Usuario;
  Rol = models.Rol;
} catch (error) {
  console.error('Error importando modelos:', error);
}

class AuthController {
  // Login de usuarios
  static async login(req, res) {
    try {
      console.log('🔐 Intento de login:', req.body.email);
      
      const { email, password } = req.body;

      // Validar campos requeridos
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email y contraseña son requeridos'
        });
      }

      // Verificar que los modelos estén disponibles
      if (!Usuario || !Rol) {
        console.error('❌ Modelos no disponibles');
        return res.status(500).json({
          success: false,
          message: 'Error de configuración del servidor'
        });
      }

      // Buscar usuario por email
      const usuario = await Usuario.findOne({
        where: { email, activo: true },
        include: [{
          model: Rol,
          as: 'rol',
          attributes: ['id', 'nombre', 'descripcion']
        }]
      });

      console.log('👤 Usuario encontrado:', usuario ? 'Sí' : 'No');

      if (!usuario) {
        return res.status(401).json({
          success: false,
          message: 'Credenciales incorrectas'
        });
      }

      // Verificar contraseña
      const passwordValida = await bcrypt.compare(password, usuario.password_hash);
      console.log('🔑 Password válida:', passwordValida);
      
      if (!passwordValida) {
        return res.status(401).json({
          success: false,
          message: 'Credenciales incorrectas'
        });
      }

      // Generar JWT
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

      console.log('✅ Login exitoso para:', email);

      res.json({
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
      });

    } catch (error) {
      console.error('❌ Error en login:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Obtener perfil del usuario autenticado
  static async perfil(req, res) {
    try {
      console.log('👤 Obteniendo perfil para usuario:', req.usuario?.id);

      // Verificar que el usuario esté en el request (del middleware)
      if (!req.usuario) {
        return res.status(401).json({
          success: false,
          message: 'Usuario no autenticado'
        });
      }

      // Verificar que los modelos estén disponibles
      if (!Usuario || !Rol) {
        console.error('❌ Modelos no disponibles en perfil');
        return res.status(500).json({
          success: false,
          message: 'Error de configuración del servidor'
        });
      }

      const usuario = await Usuario.findByPk(req.usuario.id, {
        include: [{
          model: Rol,
          as: 'rol',
          attributes: ['id', 'nombre', 'descripcion']
        }],
        attributes: { exclude: ['password_hash'] }
      });

      if (!usuario) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      console.log('✅ Perfil obtenido exitosamente');

      res.json({
        success: true,
        data: usuario
      });

    } catch (error) {
      console.error('❌ Error obteniendo perfil:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

module.exports = AuthController;