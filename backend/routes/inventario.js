const express = require('express');
const router = express.Router();
const { InventarioSucursal, Producto, UnidadMedida, Sucursal, Categoria } = require('../models');
const AuthMiddleware = require('../middleware/auth');

/**
 * @route   GET /api/inventario/sucursal/:sucursal_id
 * @desc    Listar inventario por sucursal
 * @access  Private
 */
router.get('/sucursal/:sucursal_id',
  AuthMiddleware.verificarToken,
  async (req, res) => {
    try {
      console.log('📦 Obteniendo inventario sucursal:', req.params.sucursal_id);
      
      const { sucursal_id } = req.params;
      const { 
        page = 1, 
        limit = 10, 
        categoria_id, 
        buscar, 
        stock_bajo = false 
      } = req.query;

      const offset = (page - 1) * limit;
      const whereClause = { sucursal_id };

      // Incluir productos con filtros
      const include = [
        {
          model: Producto,
          as: 'producto',
          include: [{
            model: Categoria,
            as: 'categoria',
            attributes: ['id', 'nombre']
          }],
          where: { activo: true }
        },
        {
          model: UnidadMedida,
          as: 'unidad_medida',
          attributes: ['id', 'nombre', 'abreviatura']
        },
        {
          model: Sucursal,
          as: 'sucursal',
          attributes: ['id', 'nombre']
        }
      ];

      // Filtro por categoría
      if (categoria_id) {
        include[0].where.categoria_id = categoria_id;
      }

      // Filtro por búsqueda
      if (buscar) {
        const { Op } = require('sequelize');
        include[0].where[Op.or] = [
          { nombre: { [Op.like]: `%${buscar}%` } },
          { marca: { [Op.like]: `%${buscar}%` } },
          { codigo_producto: { [Op.like]: `%${buscar}%` } }
        ];
      }

      const inventarios = await InventarioSucursal.findAndCountAll({
        where: whereClause,
        include,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['producto', 'nombre', 'ASC']]
      });

      console.log(`✅ ${inventarios.count} productos en inventario`);

      res.json({
        success: true,
        data: inventarios.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: inventarios.count,
          pages: Math.ceil(inventarios.count / limit)
        }
      });

    } catch (error) {
      console.error('❌ Error obteniendo inventario:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * @route   GET /api/inventario/sucursal/:sucursal_id/producto/:producto_id/unidad/:unidad_medida_id
 * @desc    Obtener stock específico
 * @access  Private
 */
router.get('/sucursal/:sucursal_id/producto/:producto_id/unidad/:unidad_medida_id',
  AuthMiddleware.verificarToken,
  async (req, res) => {
    try {
      const { sucursal_id, producto_id, unidad_medida_id } = req.params;
      
      console.log(`📦 Verificando stock - Sucursal:${sucursal_id}, Producto:${producto_id}, Unidad:${unidad_medida_id}`);

      const inventario = await InventarioSucursal.findOne({
        where: { sucursal_id, producto_id, unidad_medida_id },
        include: [
          {
            model: Producto,
            as: 'producto',
            attributes: ['id', 'nombre', 'stock_minimo']
          },
          {
            model: UnidadMedida,
            as: 'unidad_medida',
            attributes: ['id', 'nombre', 'abreviatura']
          }
        ]
      });

      if (!inventario) {
        return res.status(404).json({
          success: false,
          message: 'Producto no encontrado en inventario'
        });
      }

      console.log(`✅ Stock disponible: ${inventario.stock_disponible}`);

      res.json({
        success: true,
        data: inventario
      });

    } catch (error) {
      console.error('❌ Error obteniendo stock:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

module.exports = router;