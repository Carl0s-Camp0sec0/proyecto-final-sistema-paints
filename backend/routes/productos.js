const express = require('express');
const router = express.Router();

// Importar modelos y controladores
const { Producto, Categoria, UnidadMedida, ProductoDetallePintura, ProductoDetalleAccesorio, ProductoVariacion, InventarioSucursal } = require('../models');
const AuthMiddleware = require('../middleware/auth');

/**
 * @route   GET /api/productos
 * @desc    Listar productos con filtros
 * @access  Private
 */
router.get('/',
  AuthMiddleware.verificarToken,
  async (req, res) => {
    try {
      console.log('🛍️ Listando productos...');
      
      const { 
        page = 1, 
        limit = 10, 
        categoria_id, 
        buscar, 
        sucursal_id 
      } = req.query;

      const offset = (page - 1) * limit;
      const whereClause = { activo: true };

      // Filtros
      if (categoria_id) whereClause.categoria_id = categoria_id;
      if (buscar) {
        const { Op } = require('sequelize');
        whereClause[Op.or] = [
          { nombre: { [Op.like]: `%${buscar}%` } },
          { marca: { [Op.like]: `%${buscar}%` } },
          { codigo_producto: { [Op.like]: `%${buscar}%` } }
        ];
      }

      const include = [
        {
          model: Categoria,
          as: 'categoria',
          attributes: ['id', 'nombre', 'requiere_medidas']
        },
        {
          model: ProductoDetallePintura,
          as: 'detalle_pintura',
          required: false
        },
        {
          model: ProductoVariacion,
          as: 'variaciones',
          required: false,
          include: [{
            model: UnidadMedida,
            as: 'unidad_medida',
            attributes: ['id', 'nombre', 'abreviatura']
          }]
        }
      ];

      // Si se especifica sucursal, incluir inventario
      if (sucursal_id) {
        include.push({
          model: InventarioSucursal,
          as: 'inventarios',
          where: { sucursal_id },
          required: false,
          include: [{
            model: UnidadMedida,
            as: 'unidad_medida',
            attributes: ['id', 'nombre', 'abreviatura']
          }]
        });
      }

      const productos = await Producto.findAndCountAll({
        where: whereClause,
        include,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['nombre', 'ASC']]
      });

      console.log(`✅ ${productos.count} productos encontrados`);

      res.json({
        success: true,
        data: productos.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: productos.count,
          pages: Math.ceil(productos.count / limit)
        }
      });

    } catch (error) {
      console.error('❌ Error listando productos:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * @route   GET /api/productos/:id
 * @desc    Obtener producto por ID
 * @access  Private
 */
router.get('/:id',
  AuthMiddleware.verificarToken,
  async (req, res) => {
    try {
      console.log('🛍️ Obteniendo producto:', req.params.id);
      
      const { id } = req.params;
      const { sucursal_id } = req.query;

      const include = [
        {
          model: Categoria,
          as: 'categoria'
        },
        {
          model: ProductoDetallePintura,
          as: 'detalle_pintura',
          required: false
        },
        {
          model: ProductoDetalleAccesorio,
          as: 'detalle_accesorio',
          required: false
        },
        {
          model: ProductoVariacion,
          as: 'variaciones',
          include: [{
            model: UnidadMedida,
            as: 'unidad_medida'
          }]
        }
      ];

      // Si se especifica sucursal, incluir inventario
      if (sucursal_id) {
        include.push({
          model: InventarioSucursal,
          as: 'inventarios',
          where: { sucursal_id },
          required: false,
          include: [{
            model: UnidadMedida,
            as: 'unidad_medida'
          }]
        });
      }

      const producto = await Producto.findByPk(id, { include });

      if (!producto) {
        return res.status(404).json({
          success: false,
          message: 'Producto no encontrado'
        });
      }

      console.log('✅ Producto obtenido:', producto.nombre);

      res.json({
        success: true,
        data: producto
      });

    } catch (error) {
      console.error('❌ Error obteniendo producto:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

module.exports = router;