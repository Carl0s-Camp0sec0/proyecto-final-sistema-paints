const { Producto, Categoria, UnidadMedida, ProductoDetallePintura, ProductoDetalleAccesorio, ProductoVariacion, InventarioSucursal, Sucursal } = require('../models');
const { Op } = require('sequelize');

class ProductoController {
  // Listar productos con filtros
  static async listar(req, res) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        categoria_id, 
        buscar, 
        activo = true,
        sucursal_id 
      } = req.query;

      const offset = (page - 1) * limit;
      const whereClause = {};

      // Filtros
      if (categoria_id) whereClause.categoria_id = categoria_id;
      if (activo !== undefined) whereClause.activo = activo;
      if (buscar) {
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
          model: ProductoDetalleAccesorio,
          as: 'detalle_accesorio',
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

      // Siempre incluir inventarios (filtrar por sucursal si se especifica)
      const inventarioInclude = {
        model: InventarioSucursal,
        as: 'inventarios',
        required: false,
        include: [{
          model: UnidadMedida,
          as: 'unidad_medida',
          attributes: ['id', 'nombre', 'abreviatura']
        }, {
          model: Sucursal,
          as: 'sucursal',
          attributes: ['id', 'nombre']
        }]
      };

      // Si se especifica sucursal, filtrar solo esa
      if (sucursal_id) {
        inventarioInclude.where = { sucursal_id };
      }

      include.push(inventarioInclude);

      const productos = await Producto.findAndCountAll({
        where: whereClause,
        include,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['nombre', 'ASC']]
      });

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
      console.error('Error listando productos:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Obtener producto por ID
  static async obtenerPorId(req, res) {
    try {
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

      res.json({
        success: true,
        data: producto
      });

    } catch (error) {
      console.error('Error obteniendo producto:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Crear nuevo producto
  static async crear(req, res) {
    try {
      const {
        categoria_id,
        nombre,
        marca,
        descripcion,
        codigo_producto,
        precio_base,
        descuento_porcentaje,
        stock_minimo,
        // Detalles específicos para pinturas
        duracion_anos,
        cobertura_m2,
        color,
        codigo_color,
        tipo_base,
        acabado,
        // Detalles específicos para accesorios
        tamano,
        material,
        peso,
        // Variaciones de precio por unidad de medida
        variaciones
      } = req.body;

      // Validaciones básicas
      if (!categoria_id || !nombre || !precio_base) {
        return res.status(400).json({
          success: false,
          message: 'Categoría, nombre y precio base son requeridos'
        });
      }

      // Verificar si la categoría existe
      const categoria = await Categoria.findByPk(categoria_id);
      if (!categoria) {
        return res.status(400).json({
          success: false,
          message: 'Categoría no encontrada'
        });
      }

      // Crear producto base
      const producto = await Producto.create({
        categoria_id,
        nombre,
        marca,
        descripcion,
        codigo_producto,
        precio_base: parseFloat(precio_base),
        descuento_porcentaje: parseFloat(descuento_porcentaje) || 0,
        stock_minimo: parseInt(stock_minimo) || 10,
        activo: true
      });

      // Crear detalles específicos según categoría
      if (categoria.nombre === 'Pinturas' || categoria.nombre === 'Barnices') {
        if (duracion_anos || cobertura_m2 || color || tipo_base) {
          await ProductoDetallePintura.create({
            producto_id: producto.id,
            duracion_anos: parseInt(duracion_anos) || null,
            cobertura_m2: parseFloat(cobertura_m2) || null,
            color,
            codigo_color,
            tipo_base,
            acabado: acabado || 'mate'
          });
        }
      } else if (categoria.nombre === 'Accesorios') {
        if (tamano || material || peso) {
          await ProductoDetalleAccesorio.create({
            producto_id: producto.id,
            tamano,
            material,
            peso: parseFloat(peso) || null
          });
        }
      }

      // Crear variaciones de precio si se proporcionaron
      if (variaciones && Array.isArray(variaciones)) {
        for (const variacion of variaciones) {
          await ProductoVariacion.create({
            producto_id: producto.id,
            unidad_medida_id: variacion.unidad_medida_id,
            precio_venta: parseFloat(variacion.precio_venta),
            codigo_variacion: variacion.codigo_variacion,
            activo: true
          });
        }
      }

      // Obtener producto completo para respuesta
      const productoCompleto = await Producto.findByPk(producto.id, {
        include: [
          { model: Categoria, as: 'categoria' },
          { model: ProductoDetallePintura, as: 'detalle_pintura', required: false },
          { model: ProductoDetalleAccesorio, as: 'detalle_accesorio', required: false },
          { 
            model: ProductoVariacion, 
            as: 'variaciones',
            include: [{ model: UnidadMedida, as: 'unidad_medida' }]
          }
        ]
      });

      res.status(201).json({
        success: true,
        message: 'Producto creado exitosamente',
        data: productoCompleto
      });

    } catch (error) {
      console.error('Error creando producto:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Actualizar producto
  static async actualizar(req, res) {
    try {
      const { id } = req.params;
      const datos = req.body;

      const producto = await Producto.findByPk(id);
      if (!producto) {
        return res.status(404).json({
          success: false,
          message: 'Producto no encontrado'
        });
      }

      // Actualizar producto base
      await producto.update({
        nombre: datos.nombre || producto.nombre,
        marca: datos.marca || producto.marca,
        descripcion: datos.descripcion || producto.descripcion,
        codigo_producto: datos.codigo_producto || producto.codigo_producto,
        precio_base: datos.precio_base ? parseFloat(datos.precio_base) : producto.precio_base,
        descuento_porcentaje: datos.descuento_porcentaje !== undefined ? 
          parseFloat(datos.descuento_porcentaje) : producto.descuento_porcentaje,
        stock_minimo: datos.stock_minimo ? parseInt(datos.stock_minimo) : producto.stock_minimo,
        activo: datos.activo !== undefined ? datos.activo : producto.activo
      });

      res.json({
        success: true,
        message: 'Producto actualizado exitosamente',
        data: producto
      });

    } catch (error) {
      console.error('Error actualizando producto:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Eliminar producto (soft delete)
  static async eliminar(req, res) {
    try {
      const { id } = req.params;

      const producto = await Producto.findByPk(id);
      if (!producto) {
        return res.status(404).json({
          success: false,
          message: 'Producto no encontrado'
        });
      }

      await producto.update({ activo: false });

      res.json({
        success: true,
        message: 'Producto eliminado exitosamente'
      });

    } catch (error) {
      console.error('Error eliminando producto:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
}

module.exports = ProductoController;