const express = require('express');
const router = express.Router();
const { Usuario, Rol } = require('../models');
const AuthMiddleware = require('../middleware/auth');

/**
 * @route   GET /api/usuarios
 * @desc    Listar usuarios
 * @access  Private
 */
router.get('/',
  AuthMiddleware.verificarToken,
  async (req, res) => {
    try {
      console.log('👥 Listando usuarios...');

      const {
        page = 1,
        limit = 100,
        rol_id,
        activo
      } = req.query;

      const offset = (page - 1) * limit;
      const whereClause = {};

      if (rol_id) {
        whereClause.rol_id = rol_id;
      }

      if (activo !== undefined) {
        whereClause.activo = activo === 'true';
      }

      const usuarios = await Usuario.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: Rol,
            as: 'rol',
            attributes: ['id', 'nombre', 'descripcion']
          }
        ],
        attributes: { exclude: ['password_hash'] },
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['nombre_completo', 'ASC']]
      });

      console.log(`✅ ${usuarios.count} usuarios encontrados`);

      res.json({
        success: true,
        data: usuarios.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: usuarios.count,
          pages: Math.ceil(usuarios.count / limit)
        }
      });

    } catch (error) {
      console.error('❌ Error listando usuarios:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * @route   GET /api/usuarios/:id
 * @desc    Obtener usuario por ID
 * @access  Private
 */
router.get('/:id',
  AuthMiddleware.verificarToken,
  async (req, res) => {
    try {
      const { id } = req.params;
      console.log(`👤 Obteniendo usuario ${id}...`);

      const usuario = await Usuario.findByPk(id, {
        include: [
          {
            model: Rol,
            as: 'rol',
            attributes: ['id', 'nombre', 'descripcion']
          }
        ],
        attributes: { exclude: ['password_hash'] }
      });

      if (!usuario) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      console.log(`✅ Usuario ${id} encontrado`);

      res.json({
        success: true,
        data: usuario
      });

    } catch (error) {
      console.error('❌ Error obteniendo usuario:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * @route   GET /api/usuarios/estadisticas
 * @desc    Obtener estadísticas de usuarios
 * @access  Private
 */
router.get('/estadisticas/general',
  AuthMiddleware.verificarToken,
  async (req, res) => {
    try {
      console.log('📊 Obteniendo estadísticas de usuarios...');

      const totalUsuarios = await Usuario.count();
      const usuariosActivos = await Usuario.count({
        where: { activo: true }
      });

      const usuariosPorRol = await Usuario.findAll({
        attributes: [
          'rol_id',
          [require('sequelize').fn('COUNT', require('sequelize').col('Usuario.id')), 'total']
        ],
        include: [
          {
            model: Rol,
            as: 'rol',
            attributes: ['nombre']
          }
        ],
        group: ['rol_id', 'rol.id', 'rol.nombre']
      });

      console.log('✅ Estadísticas de usuarios calculadas');

      res.json({
        success: true,
        data: {
          total_usuarios: totalUsuarios,
          usuarios_activos: usuariosActivos,
          usuarios_inactivos: totalUsuarios - usuariosActivos,
          por_rol: usuariosPorRol.map(u => ({
            rol: u.rol.nombre,
            total: parseInt(u.dataValues.total)
          }))
        }
      });

    } catch (error) {
      console.error('❌ Error obteniendo estadísticas de usuarios:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

module.exports = router;
