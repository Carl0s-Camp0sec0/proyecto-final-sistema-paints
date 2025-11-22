const express = require('express');
const router = express.Router();

// Importar modelos directamente
const { Categoria, UnidadMedida, Sucursal, MedioPago, Rol } = require('../models');
const AuthMiddleware = require('../middleware/auth');

/**
 * @route   GET /api/sistema/categorias
 * @desc    Obtener todas las categorías
 * @access  Private
 */
router.get('/categorias',
  AuthMiddleware.verificarToken,
  async (req, res) => {
    try {
      console.log('📋 Obteniendo categorías...');
      
      const categorias = await Categoria.findAll({
        where: { activo: true },
        order: [['nombre', 'ASC']]
      });

      console.log(`✅ ${categorias.length} categorías encontradas`);

      res.json({
        success: true,
        data: categorias
      });
    } catch (error) {
      console.error('❌ Error obteniendo categorías:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * @route   GET /api/sistema/sucursales
 * @desc    Obtener todas las sucursales
 * @access  Public (necesario para mapa de tiendas)
 */
router.get('/sucursales',
  async (req, res) => {
    try {
      console.log('🏪 Obteniendo sucursales...');
      
      const sucursales = await Sucursal.findAll({
        where: { activo: true },
        order: [['nombre', 'ASC']]
      });

      console.log(`✅ ${sucursales.length} sucursales encontradas`);

      res.json({
        success: true,
        data: {
          sucursales: sucursales
        }
      });
    } catch (error) {
      console.error('❌ Error obteniendo sucursales:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * @route   GET /api/sistema/unidades-medida
 * @desc    Obtener unidades de medida
 * @access  Private
 */
router.get('/unidades-medida',
  AuthMiddleware.verificarToken,
  async (req, res) => {
    try {
      console.log('📏 Obteniendo unidades de medida...');
      
      const { categoria_id } = req.query;
      const whereClause = { activo: true };
      
      if (categoria_id) {
        whereClause.categoria_id = categoria_id;
      }

      const unidades = await UnidadMedida.findAll({
        where: whereClause,
        include: [{
          model: Categoria,
          as: 'categoria',
          attributes: ['id', 'nombre']
        }],
        order: [['factor_conversion', 'ASC']]
      });

      console.log(`✅ ${unidades.length} unidades de medida encontradas`);

      res.json({
        success: true,
        data: unidades
      });
    } catch (error) {
      console.error('❌ Error obteniendo unidades de medida:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * @route   GET /api/sistema/medios-pago
 * @desc    Obtener medios de pago activos
 * @access  Private
 */
router.get('/medios-pago',
  AuthMiddleware.verificarToken,
  async (req, res) => {
    try {
      console.log('💳 Obteniendo medios de pago...');
      
      const mediosPago = await MedioPago.findAll({
        where: { activo: true },
        order: [['nombre', 'ASC']]
      });

      console.log(`✅ ${mediosPago.length} medios de pago encontrados`);

      res.json({
        success: true,
        data: mediosPago
      });
    } catch (error) {
      console.error('❌ Error obteniendo medios de pago:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * @route   POST /api/sistema/categorias
 * @desc    Crear nueva categoría
 * @access  Private (Admin, Digitador)
 */
router.post('/categorias',
  AuthMiddleware.verificarToken,
  async (req, res) => {
    try {
      console.log('📋 Creando nueva categoría...');

      const { nombre, descripcion, requiere_medidas = false } = req.body;

      if (!nombre) {
        return res.status(400).json({
          success: false,
          message: 'El nombre es requerido'
        });
      }

      // Verificar si ya existe
      const categoriaExistente = await Categoria.findOne({
        where: { nombre }
      });

      if (categoriaExistente) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe una categoría con ese nombre'
        });
      }

      const categoria = await Categoria.create({
        nombre,
        descripcion,
        requiere_medidas,
        activo: true
      });

      console.log(`✅ Categoría creada: ${categoria.nombre}`);

      res.status(201).json({
        success: true,
        message: 'Categoría creada exitosamente',
        data: categoria
      });
    } catch (error) {
      console.error('❌ Error creando categoría:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * @route   PUT /api/sistema/categorias/:id
 * @desc    Actualizar categoría
 * @access  Private (Admin, Digitador)
 */
router.put('/categorias/:id',
  AuthMiddleware.verificarToken,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { nombre, descripcion, requiere_medidas, activo } = req.body;

      const categoria = await Categoria.findByPk(id);
      if (!categoria) {
        return res.status(404).json({
          success: false,
          message: 'Categoría no encontrada'
        });
      }

      // Si se está cambiando el nombre, verificar que no exista otra con ese nombre
      if (nombre && nombre !== categoria.nombre) {
        const { Op } = require('sequelize');
        const categoriaExistente = await Categoria.findOne({
          where: {
            nombre,
            id: { [Op.ne]: id }
          }
        });

        if (categoriaExistente) {
          return res.status(400).json({
            success: false,
            message: 'Ya existe otra categoría con ese nombre'
          });
        }
      }

      await categoria.update({
        nombre: nombre || categoria.nombre,
        descripcion: descripcion !== undefined ? descripcion : categoria.descripcion,
        requiere_medidas: requiere_medidas !== undefined ? requiere_medidas : categoria.requiere_medidas,
        activo: activo !== undefined ? activo : categoria.activo
      });

      console.log(`✅ Categoría actualizada: ${categoria.nombre}`);

      res.json({
        success: true,
        message: 'Categoría actualizada exitosamente',
        data: categoria
      });
    } catch (error) {
      console.error('❌ Error actualizando categoría:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * @route   DELETE /api/sistema/categorias/:id
 * @desc    Eliminar categoría (soft delete)
 * @access  Private (Solo Admin)
 */
router.delete('/categorias/:id',
  AuthMiddleware.verificarToken,
  async (req, res) => {
    try {
      const { id } = req.params;

      const categoria = await Categoria.findByPk(id);
      if (!categoria) {
        return res.status(404).json({
          success: false,
          message: 'Categoría no encontrada'
        });
      }

      await categoria.update({ activo: false });

      console.log(`✅ Categoría eliminada: ${categoria.nombre}`);

      res.json({
        success: true,
        message: 'Categoría eliminada exitosamente'
      });
    } catch (error) {
      console.error('❌ Error eliminando categoría:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * @route   POST /api/sistema/sucursales
 * @desc    Crear nueva sucursal
 * @access  Private (Solo Admin)
 */
router.post('/sucursales',
  AuthMiddleware.verificarToken,
  async (req, res) => {
    try {
      console.log('🏪 Creando nueva sucursal...');

      const {
        nombre,
        direccion,
        telefono,
        email,
        latitud,
        longitud,
        horario_apertura,
        horario_cierre
      } = req.body;

      if (!nombre || !direccion) {
        return res.status(400).json({
          success: false,
          message: 'Nombre y dirección son requeridos'
        });
      }

      const sucursal = await Sucursal.create({
        nombre,
        direccion,
        telefono,
        email,
        latitud: latitud ? parseFloat(latitud) : null,
        longitud: longitud ? parseFloat(longitud) : null,
        horario_apertura,
        horario_cierre,
        activo: true
      });

      console.log(`✅ Sucursal creada: ${sucursal.nombre}`);

      res.status(201).json({
        success: true,
        message: 'Sucursal creada exitosamente',
        data: sucursal
      });
    } catch (error) {
      console.error('❌ Error creando sucursal:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * @route   PUT /api/sistema/sucursales/:id
 * @desc    Actualizar sucursal
 * @access  Private (Solo Admin)
 */
router.put('/sucursales/:id',
  AuthMiddleware.verificarToken,
  async (req, res) => {
    try {
      const { id } = req.params;
      const datos = req.body;

      const sucursal = await Sucursal.findByPk(id);
      if (!sucursal) {
        return res.status(404).json({
          success: false,
          message: 'Sucursal no encontrada'
        });
      }

      await sucursal.update({
        nombre: datos.nombre || sucursal.nombre,
        direccion: datos.direccion || sucursal.direccion,
        telefono: datos.telefono !== undefined ? datos.telefono : sucursal.telefono,
        email: datos.email !== undefined ? datos.email : sucursal.email,
        latitud: datos.latitud !== undefined ? parseFloat(datos.latitud) : sucursal.latitud,
        longitud: datos.longitud !== undefined ? parseFloat(datos.longitud) : sucursal.longitud,
        horario_apertura: datos.horario_apertura || sucursal.horario_apertura,
        horario_cierre: datos.horario_cierre || sucursal.horario_cierre,
        activo: datos.activo !== undefined ? datos.activo : sucursal.activo
      });

      console.log(`✅ Sucursal actualizada: ${sucursal.nombre}`);

      res.json({
        success: true,
        message: 'Sucursal actualizada exitosamente',
        data: sucursal
      });
    } catch (error) {
      console.error('❌ Error actualizando sucursal:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * @route   DELETE /api/sistema/sucursales/:id
 * @desc    Eliminar sucursal (soft delete)
 * @access  Private (Solo Admin)
 */
router.delete('/sucursales/:id',
  AuthMiddleware.verificarToken,
  async (req, res) => {
    try {
      const { id } = req.params;

      const sucursal = await Sucursal.findByPk(id);
      if (!sucursal) {
        return res.status(404).json({
          success: false,
          message: 'Sucursal no encontrada'
        });
      }

      await sucursal.update({ activo: false });

      console.log(`✅ Sucursal eliminada: ${sucursal.nombre}`);

      res.json({
        success: true,
        message: 'Sucursal eliminada exitosamente'
      });
    } catch (error) {
      console.error('❌ Error eliminando sucursal:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * @route   GET /api/sistema/info
 * @desc    Información general del sistema
 * @access  Public
 */
router.get('/info', async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        nombre: 'Sistema Paints',
        version: '1.0.0',
        descripcion: 'Sistema de gestión para cadena de pinturas',
        universidad: 'Universidad UMES',
        proyecto: 'Bases de Datos II - Programación Web',
        fecha_sistema: new Date().toISOString(),
        estado: 'operativo'
      }
    });
  } catch (error) {
    console.error('❌ Error obteniendo información del sistema:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router;