const jwt = require('jsonwebtoken');
const authConfig = require('../config/auth');

// Importar modelos de forma más segura
let Usuario, Rol, Cliente;
try {
  const models = require('../models');
  Usuario = models.Usuario;
  Rol = models.Rol;
  Cliente = models.Cliente;
} catch (error) {
  console.error('Error importando modelos en middleware:', error);
}

class AuthMiddleware {
  // Verificar token JWT (soporta usuarios internos y clientes)
  static async verificarToken(req, res, next) {
    try {
      console.log('🔐 Verificando token...');

      // Intentar obtener token de múltiples fuentes
      let token = req.header('Authorization')?.replace('Bearer ', '').trim() ||
                  req.header('authorization')?.replace('Bearer ', '').trim() ||
                  req.header('x-auth-token')?.trim() ||
                  req.query.token?.trim();

      // En desarrollo, logging más detallado
      if (process.env.NODE_ENV === 'development') {
        console.log('📋 Headers de autorización:', {
          authorization: req.header('Authorization'),
          'x-auth-token': req.header('x-auth-token'),
          query_token: req.query.token ? 'presente' : 'ausente'
        });
      }

      if (!token) {
        console.log('❌ No se proporcionó token');
        return res.status(401).json({
          success: false,
          message: 'Token de acceso requerido'
        });
      }

      // Verificar y decodificar token
      const decoded = jwt.verify(token, authConfig.jwt.secret);
      console.log('🔓 Token decodificado:', { id: decoded.id, email: decoded.email, tipo: decoded.tipo });

      // Verificar que los modelos estén disponibles
      if (!Usuario || !Rol || !Cliente) {
        console.error('❌ Modelos no disponibles en middleware');
        return res.status(500).json({
          success: false,
          message: 'Error de configuración del servidor'
        });
      }

      // Determinar si es usuario interno o cliente
      if (decoded.tipo === 'cliente') {
        // Buscar cliente en base de datos
        const cliente = await Cliente.findByPk(decoded.id, {
          attributes: { exclude: ['password_hash'] }
        });

        if (!cliente) {
          console.log('❌ Cliente no encontrado en BD');
          return res.status(401).json({
            success: false,
            message: 'Token inválido - Cliente no encontrado'
          });
        }

        if (!cliente.activo) {
          console.log('❌ Cliente desactivado');
          return res.status(401).json({
            success: false,
            message: 'Cuenta de cliente desactivada'
          });
        }

        // Agregar información del cliente a la request
        req.usuario = {
          id: cliente.id,
          nombre_completo: cliente.nombre_completo,
          email: cliente.email,
          tipo: 'cliente',
          cliente: cliente
        };

        console.log('✅ Token válido para cliente:', cliente.email);
      } else {
        // Buscar usuario interno en base de datos
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
          tipo: 'usuario',
          permisos: usuario.rol
        };

        console.log('✅ Token válido para usuario:', usuario.email);
      }

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