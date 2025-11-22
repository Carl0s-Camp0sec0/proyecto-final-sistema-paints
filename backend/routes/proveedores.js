const express = require('express');
const router = express.Router();
const { Proveedor } = require('../models');
const AuthMiddleware = require('../middleware/auth');
const { Op } = require('sequelize');

/**
 * @route   GET /api/proveedores
 * @desc    Listar proveedores
 * @access  Private
 */
router.get('/',
  AuthMiddleware.verificarToken,
  async (req, res) => {
    try {
      console.log('🏭 Listando proveedores...');

      const {
        page = 1,
        limit = 50,
        buscar,
        activo
      } = req.query;

      const offset = (page - 1) * limit;
      const whereClause = {};

      // Filtros
      if (activo !== undefined) whereClause.activo = activo === 'true';
      if (buscar) {
        whereClause[Op.or] = [
          { nombre: { [Op.like]: `%${buscar}%` } },
          { codigo: { [Op.like]: `%${buscar}%` } },
          { email: { [Op.like]: `%${buscar}%` } }
        ];
      }

      const proveedores = await Proveedor.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['nombre', 'ASC']]
      });

      console.log(`✅ ${proveedores.count} proveedores encontrados`);

      res.json({
        success: true,
        data: proveedores.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: proveedores.count,
          pages: Math.ceil(proveedores.count / limit)
        }
      });

    } catch (error) {
      console.error('❌ Error listando proveedores:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * @route   GET /api/proveedores/:id
 * @desc    Obtener proveedor por ID
 * @access  Private
 */
router.get('/:id',
  AuthMiddleware.verificarToken,
  async (req, res) => {
    try {
      const { id } = req.params;
      console.log(`🏭 Obteniendo proveedor ${id}...`);

      const proveedor = await Proveedor.findByPk(id);

      if (!proveedor) {
        return res.status(404).json({
          success: false,
          message: 'Proveedor no encontrado'
        });
      }

      console.log(`✅ Proveedor encontrado: ${proveedor.nombre}`);

      res.json({
        success: true,
        data: proveedor
      });

    } catch (error) {
      console.error('❌ Error obteniendo proveedor:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * @route   POST /api/proveedores
 * @desc    Crear nuevo proveedor
 * @access  Private (Admin, Digitador)
 */
router.post('/',
  AuthMiddleware.verificarToken,
  async (req, res) => {
    try {
      console.log('🏭 Creando nuevo proveedor...');

      const {
        codigo,
        nombre,
        direccion,
        telefono,
        email,
        contacto_nombre,
        contacto_telefono,
        contacto_email,
        dias_credito,
        limite_credito
      } = req.body;

      // Validaciones
      if (!codigo || !nombre) {
        return res.status(400).json({
          success: false,
          message: 'Código y nombre son requeridos'
        });
      }

      // Verificar que el código no exista
      const proveedorExistente = await Proveedor.findOne({
        where: { codigo }
      });

      if (proveedorExistente) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe un proveedor con ese código'
        });
      }

      const proveedor = await Proveedor.create({
        codigo,
        nombre,
        direccion,
        telefono,
        email,
        contacto_nombre,
        contacto_telefono,
        contacto_email,
        dias_credito: dias_credito || 0,
        limite_credito: limite_credito || 0,
        activo: true
      });

      console.log(`✅ Proveedor creado: ${proveedor.nombre}`);

      res.status(201).json({
        success: true,
        message: 'Proveedor creado exitosamente',
        data: proveedor
      });

    } catch (error) {
      console.error('❌ Error creando proveedor:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * @route   PUT /api/proveedores/:id
 * @desc    Actualizar proveedor
 * @access  Private (Admin, Digitador)
 */
router.put('/:id',
  AuthMiddleware.verificarToken,
  async (req, res) => {
    try {
      const { id } = req.params;
      const datos = req.body;

      console.log(`🏭 Actualizando proveedor ${id}...`);

      const proveedor = await Proveedor.findByPk(id);

      if (!proveedor) {
        return res.status(404).json({
          success: false,
          message: 'Proveedor no encontrado'
        });
      }

      // Si se está cambiando el código, verificar que no exista otro con ese código
      if (datos.codigo && datos.codigo !== proveedor.codigo) {
        const proveedorExistente = await Proveedor.findOne({
          where: {
            codigo: datos.codigo,
            id: { [Op.ne]: id }
          }
        });

        if (proveedorExistente) {
          return res.status(400).json({
            success: false,
            message: 'Ya existe otro proveedor con ese código'
          });
        }
      }

      await proveedor.update({
        codigo: datos.codigo || proveedor.codigo,
        nombre: datos.nombre || proveedor.nombre,
        direccion: datos.direccion !== undefined ? datos.direccion : proveedor.direccion,
        telefono: datos.telefono !== undefined ? datos.telefono : proveedor.telefono,
        email: datos.email !== undefined ? datos.email : proveedor.email,
        contacto_nombre: datos.contacto_nombre !== undefined ? datos.contacto_nombre : proveedor.contacto_nombre,
        contacto_telefono: datos.contacto_telefono !== undefined ? datos.contacto_telefono : proveedor.contacto_telefono,
        contacto_email: datos.contacto_email !== undefined ? datos.contacto_email : proveedor.contacto_email,
        dias_credito: datos.dias_credito !== undefined ? datos.dias_credito : proveedor.dias_credito,
        limite_credito: datos.limite_credito !== undefined ? datos.limite_credito : proveedor.limite_credito,
        activo: datos.activo !== undefined ? datos.activo : proveedor.activo
      });

      console.log(`✅ Proveedor actualizado: ${proveedor.nombre}`);

      res.json({
        success: true,
        message: 'Proveedor actualizado exitosamente',
        data: proveedor
      });

    } catch (error) {
      console.error('❌ Error actualizando proveedor:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * @route   DELETE /api/proveedores/:id
 * @desc    Eliminar proveedor (soft delete)
 * @access  Private (Solo Admin)
 */
router.delete('/:id',
  AuthMiddleware.verificarToken,
  async (req, res) => {
    try {
      const { id } = req.params;
      console.log(`🏭 Eliminando proveedor ${id}...`);

      const proveedor = await Proveedor.findByPk(id);

      if (!proveedor) {
        return res.status(404).json({
          success: false,
          message: 'Proveedor no encontrado'
        });
      }

      await proveedor.update({ activo: false });

      console.log(`✅ Proveedor eliminado: ${proveedor.nombre}`);

      res.json({
        success: true,
        message: 'Proveedor eliminado exitosamente'
      });

    } catch (error) {
      console.error('❌ Error eliminando proveedor:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

module.exports = router;
