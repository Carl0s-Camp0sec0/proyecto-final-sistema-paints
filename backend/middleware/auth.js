const jwt = require('jsonwebtoken');
const authConfig = require('../config/auth');

// Importar modelos de forma más segura
let Usuario, Rol;
try {
  const models = require('../models');
  Usuario = models.Usuario;
  Rol = models.Rol;
} catch (error) {
  console.error('Error importando modelos en middleware:', error);
}

class AuthMiddleware {
  // Verificar token JWT
  static async verificarToken(req, res, next) {
    try {
      console.log('🔐 Verificando token...');

      const token = req.header('Authorization')?.replace('Bearer ', '') || 
                   req.header('x-auth-token') ||
                   req.query.token;

      if (!token) {
        console.log('❌ No se proporcionó token');
        return res.status(401).json({
          success: false,
          message: 'Token de acceso requerido'
        });
      }

      // Verificar y decodificar token
      const decoded = jwt.verify(token, authConfig.jwt.secret);
      console.log('🔓 Token decodificado:', { id: decoded.id, email: decoded.email });

      // Verificar que los modelos estén disponibles
      if (!Usuario || !Rol) {
        console.error('❌ Modelos no disponibles en middleware');
        return res.status(500).json({
          success: false,
          message: 'Error de configuración del servidor'
        });
      }

      // Buscar usuario en base de datos
      const usuario = await Usuario.findByPk(decoded.id, {
        include: [{
          model: Rol,
          as: 'rol',
          attributes: ['id', 'nombre', 'descripcion']
        }],
        attributes: { exclude: ['password_hash'] }
      });

      if (!usuario) {
        console.log('❌ Usuario no encontrado en BD');
        return res.status(401).json({
          success: false,
          message: 'Token inválido - Usuario no encontrado'
        });
      }

      if (!usuario.activo) {
        console.log('❌ Usuario desactivado');
        return res.status(401).json({
          success: false,
          message: 'Cuenta de usuario desactivada'
        });
      }

      // Agregar información del usuario a la request
      req.usuario = {
        id: usuario.id,
        nombre_completo: usuario.nombre_completo,
        email: usuario.email,
        rol_id: usuario.rol_id,
        rol: usuario.rol.nombre,
        permisos: usuario.rol
      };

      console.log('✅ Token válido para:', usuario.email);
      next();

    } catch (error) {
      console.error('❌ Error verificando token:', error);
      
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Token inválido'
        });
      }
      
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token expirado'
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
}

module.exports = AuthMiddleware;