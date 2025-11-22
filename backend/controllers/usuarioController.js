const { Usuario, Rol, Sucursal } = require('../models');
const bcrypt = require('bcrypt');
const { Op } = require('sequelize');

class UsuarioController {
  // Listar usuarios con filtros
  static async listar(req, res) {
    try {
      console.log('👥 Listando usuarios...');

      const {
        page = 1,
        limit = 100,
        rol_id,
        sucursal_id,
        activo,
        buscar
      } = req.query;

      const offset = (page - 1) * limit;
      const whereClause = {};

      // Filtros
      if (rol_id) whereClause.rol_id = rol_id;
      if (sucursal_id) whereClause.sucursal_id = sucursal_id;
      if (activo !== undefined) whereClause.activo = activo === 'true';
      if (buscar) {
        whereClause[Op.or] = [
          { nombre_completo: { [Op.like]: `%${buscar}%` } },
          { email: { [Op.like]: `%${buscar}%` } }
        ];
      }

      const usuarios = await Usuario.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: Rol,
            as: 'rol',
            attributes: ['id', 'nombre', 'descripcion']
          },
          {
            model: Sucursal,
            as: 'sucursal',
            attributes: ['id', 'nombre', 'direccion'],
            required: false
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

  // Obtener usuario por ID
  static async obtenerPorId(req, res) {
    try {
      const { id } = req.params;
      console.log(`👤 Obteniendo usuario ${id}...`);

      const usuario = await Usuario.findByPk(id, {
        include: [
          {
            model: Rol,
            as: 'rol',
            attributes: ['id', 'nombre', 'descripcion']
          },
          {
            model: Sucursal,
            as: 'sucursal',
            attributes: ['id', 'nombre', 'direccion'],
            required: false
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

      console.log(`✅ Usuario encontrado: ${usuario.nombre_completo}`);

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

  // Crear nuevo usuario
  static async crear(req, res) {
    try {
      console.log('👤 Creando nuevo usuario...');

      const {
        rol_id,
        sucursal_id,
        nombre_completo,
        email,
        password,
        telefono,
        activo = true
      } = req.body;

      // Validaciones
      if (!rol_id || !nombre_completo || !email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Rol, nombre completo, email y contraseña son requeridos'
        });
      }

      // Verificar que el email no esté en uso
      const usuarioExistente = await Usuario.findOne({
        where: { email }
      });

      if (usuarioExistente) {
        return res.status(400).json({
          success: false,
          message: 'El email ya está registrado'
        });
      }

      // Verificar que el rol existe
      const rol = await Rol.findByPk(rol_id);
      if (!rol) {
        return res.status(400).json({
          success: false,
          message: 'Rol no encontrado'
        });
      }

      // Verificar sucursal si se proporciona
      if (sucursal_id) {
        const sucursal = await Sucursal.findByPk(sucursal_id);
        if (!sucursal) {
          return res.status(400).json({
            success: false,
            message: 'Sucursal no encontrada'
          });
        }
      }

      // Hash de la contraseña
      const password_hash = await bcrypt.hash(password, 10);

      // Crear usuario
      const usuario = await Usuario.create({
        rol_id,
        sucursal_id: sucursal_id || null,
        nombre_completo,
        email,
        password_hash,
        telefono,
        activo
      });

      // Obtener usuario completo para respuesta
      const usuarioCompleto = await Usuario.findByPk(usuario.id, {
        include: [
          {
            model: Rol,
            as: 'rol',
            attributes: ['id', 'nombre', 'descripcion']
          },
          {
            model: Sucursal,
            as: 'sucursal',
            attributes: ['id', 'nombre'],
            required: false
          }
        ],
        attributes: { exclude: ['password_hash'] }
      });

      console.log(`✅ Usuario creado: ${usuario.nombre_completo}`);

      res.status(201).json({
        success: true,
        message: 'Usuario creado exitosamente',
        data: usuarioCompleto
      });

    } catch (error) {
      console.error('❌ Error creando usuario:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Actualizar usuario
  static async actualizar(req, res) {
    try {
      const { id } = req.params;
      console.log(`👤 Actualizando usuario ${id}...`);

      const {
        rol_id,
        sucursal_id,
        nombre_completo,
        email,
        password,
        telefono,
        activo
      } = req.body;

      const usuario = await Usuario.findByPk(id);

      if (!usuario) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      // Si se está actualizando el email, verificar que no exista
      if (email && email !== usuario.email) {
        const emailExistente = await Usuario.findOne({
          where: {
            email,
            id: { [Op.ne]: id }
          }
        });

        if (emailExistente) {
          return res.status(400).json({
            success: false,
            message: 'El email ya está en uso por otro usuario'
          });
        }
      }

      // Preparar datos de actualización
      const datosActualizacion = {};
      if (rol_id !== undefined) datosActualizacion.rol_id = rol_id;
      if (sucursal_id !== undefined) datosActualizacion.sucursal_id = sucursal_id;
      if (nombre_completo) datosActualizacion.nombre_completo = nombre_completo;
      if (email) datosActualizacion.email = email;
      if (telefono !== undefined) datosActualizacion.telefono = telefono;
      if (activo !== undefined) datosActualizacion.activo = activo;

      // Si se proporciona nueva contraseña, hashearla
      if (password) {
        datosActualizacion.password_hash = await bcrypt.hash(password, 10);
      }

      // Actualizar usuario
      await usuario.update(datosActualizacion);

      // Obtener usuario actualizado con relaciones
      const usuarioActualizado = await Usuario.findByPk(id, {
        include: [
          {
            model: Rol,
            as: 'rol',
            attributes: ['id', 'nombre', 'descripcion']
          },
          {
            model: Sucursal,
            as: 'sucursal',
            attributes: ['id', 'nombre'],
            required: false
          }
        ],
        attributes: { exclude: ['password_hash'] }
      });

      console.log(`✅ Usuario actualizado: ${usuario.nombre_completo}`);

      res.json({
        success: true,
        message: 'Usuario actualizado exitosamente',
        data: usuarioActualizado
      });

    } catch (error) {
      console.error('❌ Error actualizando usuario:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Eliminar usuario (soft delete)
  static async eliminar(req, res) {
    try {
      const { id } = req.params;
      console.log(`👤 Eliminando usuario ${id}...`);

      const usuario = await Usuario.findByPk(id);

      if (!usuario) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      // No permitir eliminar al usuario autenticado
      if (req.usuario && req.usuario.id === parseInt(id)) {
        return res.status(400).json({
          success: false,
          message: 'No puedes eliminar tu propia cuenta'
        });
      }

      // Soft delete
      await usuario.update({ activo: false });

      console.log(`✅ Usuario desactivado: ${usuario.nombre_completo}`);

      res.json({
        success: true,
        message: 'Usuario eliminado exitosamente'
      });

    } catch (error) {
      console.error('❌ Error eliminando usuario:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Estadísticas de usuarios
  static async estadisticas(req, res) {
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

      console.log('✅ Estadísticas calculadas');

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
      console.error('❌ Error obteniendo estadísticas:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

module.exports = UsuarioController;
