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
 * @access  Private
 */
router.get('/sucursales',
  AuthMiddleware.verificarToken,
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
        data: sucursales
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