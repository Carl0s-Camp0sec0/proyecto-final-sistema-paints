const { InventarioSucursal, Producto, UnidadMedida, Sucursal, Categoria } = require('../models');
const { Op } = require('sequelize');

class InventarioController {
  // Listar inventario por sucursal
  static async listarPorSucursal(req, res) {
    try {
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
          where: {}
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
        include[0].where[Op.or] = [
          { nombre: { [Op.like]: `%${buscar}%` } },
          { marca: { [Op.like]: `%${buscar}%` } },
          { codigo_producto: { [Op.like]: `%${buscar}%` } }
        ];
      }

      // Filtro por stock bajo
      if (stock_bajo === 'true') {
        whereClause[Op.and] = [
          { stock_actual: { [Op.lte]: { [Op.col]: 'producto.stock_minimo' } } }
        ];
      }

      const inventarios = await InventarioSucursal.findAndCountAll({
        where: whereClause,
        include,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['producto', 'nombre', 'ASC']]
      });

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
      console.error('Error listando inventario:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Obtener stock de un producto específico en una sucursal
  static async obtenerStock(req, res) {
    try {
      const { sucursal_id, producto_id, unidad_medida_id } = req.params;

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

      res.json({
        success: true,
        data: inventario
      });

    } catch (error) {
      console.error('Error obteniendo stock:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Ajustar stock manualmente
  static async ajustarStock(req, res) {
    try {
      const { sucursal_id, producto_id, unidad_medida_id } = req.params;
      const { cantidad_nueva, motivo } = req.body;

      if (!cantidad_nueva || cantidad_nueva < 0) {
        return res.status(400).json({
          success: false,
          message: 'La cantidad nueva debe ser un número positivo'
        });
      }

      let inventario = await InventarioSucursal.findOne({
        where: { sucursal_id, producto_id, unidad_medida_id }
      });

      // Si no existe el registro de inventario, crearlo
      if (!inventario) {
        inventario = await InventarioSucursal.create({
          sucursal_id,
          producto_id,
          unidad_medida_id,
          stock_actual: parseInt(cantidad_nueva),
          stock_reservado: 0
        });
      } else {
        await inventario.update({
          stock_actual: parseInt(cantidad_nueva)
        });
      }

      // Registrar en auditoría (aquí podrías crear el registro de auditoría)
      console.log(`Ajuste de stock: Usuario ${req.usuario.id} ajustó inventario. Motivo: ${motivo}`);

      res.json({
        success: true,
        message: 'Stock ajustado exitosamente',
        data: inventario
      });

    } catch (error) {
      console.error('Error ajustando stock:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Reporte de productos con stock bajo
  static async stockBajo(req, res) {
    try {
      const { sucursal_id } = req.query;

      const whereClause = {};
      if (sucursal_id) {
        whereClause.sucursal_id = sucursal_id;
      }

      const inventarios = await InventarioSucursal.findAll({
        where: {
          ...whereClause,
          [Op.and]: [
            { stock_actual: { [Op.lte]: { [Op.col]: 'producto.stock_minimo' } } }
          ]
        },
        include: [
          {
            model: Producto,
            as: 'producto',
            attributes: ['id', 'nombre', 'marca', 'stock_minimo'],
            include: [{
              model: Categoria,
              as: 'categoria',
              attributes: ['id', 'nombre']
            }]
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
        ],
        order: [['stock_actual', 'ASC']]
      });

      res.json({
        success: true,
        data: inventarios,
        total: inventarios.length
      });

    } catch (error) {
      console.error('Error generando reporte de stock bajo:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Reporte de productos sin stock
  static async sinStock(req, res) {
    try {
      const { sucursal_id } = req.query;

      const whereClause = { stock_actual: 0 };
      if (sucursal_id) {
        whereClause.sucursal_id = sucursal_id;
      }

      const inventarios = await InventarioSucursal.findAll({
        where: whereClause,
        include: [
          {
            model: Producto,
            as: 'producto',
            attributes: ['id', 'nombre', 'marca'],
            include: [{
              model: Categoria,
              as: 'categoria',
              attributes: ['id', 'nombre']
            }]
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
        ],
        order: [['producto', 'nombre', 'ASC']]
      });

      res.json({
        success: true,
        data: inventarios,
        total: inventarios.length
      });

    } catch (error) {
      console.error('Error generando reporte sin stock:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Resumen de inventario general
  static async resumen(req, res) {
    try {
      const { sucursal_id } = req.query;

      const whereClause = {};
      if (sucursal_id) {
        whereClause.sucursal_id = sucursal_id;
      }

      // Contar productos por estado
      const totalProductos = await InventarioSucursal.count({
        where: whereClause
      });

      const productosSinStock = await InventarioSucursal.count({
        where: {
          ...whereClause,
          stock_actual: 0
        }
      });

      const productosStockBajo = await InventarioSucursal.count({
        where: {
          ...whereClause,
          [Op.and]: [
            { stock_actual: { [Op.gt]: 0 } },
            { stock_actual: { [Op.lte]: { [Op.col]: 'producto.stock_minimo' } } }
          ]
        },
        include: [{
          model: Producto,
          as: 'producto',
          attributes: []
        }]
      });

      const productosStockNormal = totalProductos - productosSinStock - productosStockBajo;

      res.json({
        success: true,
        data: {
          total_productos: totalProductos,
          productos_sin_stock: productosSinStock,
          productos_stock_bajo: productosStockBajo,
          productos_stock_normal: productosStockNormal,
          porcentaje_sin_stock: totalProductos > 0 ? 
            Math.round((productosSinStock / totalProductos) * 100) : 0,
          porcentaje_stock_bajo: totalProductos > 0 ? 
            Math.round((productosStockBajo / totalProductos) * 100) : 0
        }
      });

    } catch (error) {
      console.error('Error generando resumen de inventario:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
}

module.exports = InventarioController;