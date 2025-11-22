const express = require('express');
const router = express.Router();
const { 
  Factura, 
  FacturaDetalle, 
  FacturaPago, 
  Cliente, 
  Usuario, 
  Sucursal, 
  Producto, 
  UnidadMedida, 
  MedioPago, 
  SerieFactura,
  InventarioSucursal,
  sequelize 
} = require('../models');
const AuthMiddleware = require('../middleware/auth');

/**
 * @route   GET /api/facturas
 * @desc    Listar facturas
 * @access  Private
 */
router.get('/',
  AuthMiddleware.verificarToken,
  async (req, res) => {
    try {
      console.log('🧾 Listando facturas...');
      
      const { 
        page = 1, 
        limit = 10
      } = req.query;

      const offset = (page - 1) * limit;

      const facturas = await Factura.findAndCountAll({
        include: [
          {
            model: Cliente,
            as: 'cliente',
            attributes: ['id', 'nombre_completo', 'email']
          },
          {
            model: Sucursal,
            as: 'sucursal',
            attributes: ['id', 'nombre']
          },
          {
            model: Usuario,
            as: 'usuario',
            attributes: ['id', 'nombre_completo']
          }
        ],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['fecha_creacion', 'DESC']]
      });

      console.log(`✅ ${facturas.count} facturas encontradas`);

      res.json({
        success: true,
        data: facturas.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: facturas.count,
          pages: Math.ceil(facturas.count / limit)
        }
      });

    } catch (error) {
      console.error('❌ Error listando facturas:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * @route   POST /api/facturas
 * @desc    Crear nueva factura
 * @access  Private
 */
router.post('/',
  AuthMiddleware.verificarToken,
  async (req, res) => {
    const transaction = await sequelize.transaction();
    
    try {
      console.log('🧾 Creando nueva factura...');
      
      const {
        cliente_id,
        sucursal_id,
        productos,
        medios_pago,
        descuento = 0,
        observaciones
      } = req.body;

      // Validaciones básicas
      if (!cliente_id || !sucursal_id || !productos || productos.length === 0) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Cliente, sucursal y productos son requeridos'
        });
      }

      console.log(`👤 Cliente: ${cliente_id}, 🏪 Sucursal: ${sucursal_id}, 🛍️ Productos: ${productos.length}`);

      // Verificar que exista el cliente
      const cliente = await Cliente.findByPk(cliente_id);
      if (!cliente) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Cliente no encontrado'
        });
      }

      // Verificar que exista la sucursal
      const sucursal = await Sucursal.findByPk(sucursal_id);
      if (!sucursal) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Sucursal no encontrada'
        });
      }

      // Obtener o crear serie de factura para la sucursal
      let [serieFactura] = await SerieFactura.findOrCreate({
        where: { sucursal_id, letra_serie: 'A' },
        defaults: {
          descripcion: 'Serie principal',
          correlativo_actual: 0,
          activo: true
        },
        transaction
      });

      // Verificar disponibilidad de productos y calcular subtotal
      let subtotal = 0;
      const productosVerificados = [];

      for (const item of productos) {
        console.log(`🔍 Verificando producto ${item.producto_id}, cantidad: ${item.cantidad}`);
        
        // Verificar que el producto existe
        const producto = await Producto.findByPk(item.producto_id);
        if (!producto) {
          await transaction.rollback();
          return res.status(400).json({
            success: false,
            message: `Producto ${item.producto_id} no encontrado`
          });
        }

        // Verificar stock disponible
        const inventario = await InventarioSucursal.findOne({
          where: {
            sucursal_id,
            producto_id: item.producto_id,
            unidad_medida_id: item.unidad_medida_id
          }
        });

        if (!inventario || inventario.stock_disponible < item.cantidad) {
          await transaction.rollback();
          return res.status(400).json({
            success: false,
            message: `Stock insuficiente para ${producto.nombre}. Disponible: ${inventario?.stock_disponible || 0}, Solicitado: ${item.cantidad}`
          });
        }

        // Calcular subtotal del item
        const subtotalItem = item.cantidad * parseFloat(item.precio_unitario);
        subtotal += subtotalItem;

        productosVerificados.push({
          ...item,
          subtotal: subtotalItem,
          producto: producto.nombre
        });
      }

      // Calcular total con IVA
      const afterDiscount = subtotal - parseFloat(descuento);
      const impuestos = afterDiscount * 0.12; // IVA 12%
      const total = afterDiscount + impuestos;

      // Validar medios de pago
      let totalPagado = 0;
      if (medios_pago && medios_pago.length > 0) {
        for (const pago of medios_pago) {
          totalPagado += parseFloat(pago.monto);
        }

        if (Math.abs(totalPagado - total) > 0.01) {
          await transaction.rollback();
          return res.status(400).json({
            success: false,
            message: `El total pagado (${totalPagado}) no coincide con el total de la factura (${total})`
          });
        }
      }

      // Obtener siguiente correlativo
      const siguienteCorrelativo = serieFactura.correlativo_actual + 1;

      console.log(`🧾 Creando factura ${serieFactura.letra_serie}${siguienteCorrelativo.toString().padStart(8, '0')}`);

      // Crear la factura
      const factura = await Factura.create({
        numero_correlativo: siguienteCorrelativo,
        letra_serie: serieFactura.letra_serie,
        serie_factura_id: serieFactura.id,
        cliente_id,
        sucursal_id,
        usuario_id: req.usuario.id,
        subtotal,
        descuento: parseFloat(descuento),
        impuestos: parseFloat(impuestos.toFixed(2)),
        total: parseFloat(total.toFixed(2)),
        estado: 'activa',
        observaciones
      }, { transaction });

      // Crear detalles de la factura
      for (const item of productosVerificados) {
        await FacturaDetalle.create({
          factura_id: factura.id,
          producto_id: item.producto_id,
          unidad_medida_id: item.unidad_medida_id,
          cantidad: item.cantidad,
          precio_unitario: parseFloat(item.precio_unitario),
          descuento_porcentaje: item.descuento_porcentaje || 0,
          subtotal: item.subtotal
        }, { transaction });

        // Actualizar inventario (descontar stock)
        await InventarioSucursal.decrement('stock_actual', {
          by: item.cantidad,
          where: {
            sucursal_id,
            producto_id: item.producto_id,
            unidad_medida_id: item.unidad_medida_id
          },
          transaction
        });

        console.log(`📦 Stock actualizado - Producto ${item.producto_id}: -${item.cantidad}`);
      }

      // Crear registros de pagos si se proporcionaron
      if (medios_pago && medios_pago.length > 0) {
        for (const pago of medios_pago) {
          await FacturaPago.create({
            factura_id: factura.id,
            medio_pago_id: pago.medio_pago_id,
            monto: parseFloat(pago.monto),
            referencia: pago.referencia,
            observaciones: pago.observaciones
          }, { transaction });
        }
      }

      // Actualizar correlativo de la serie
      await serieFactura.update({
        correlativo_actual: siguienteCorrelativo
      }, { transaction });

      // Confirmar transacción
      await transaction.commit();

      console.log(`✅ Factura creada exitosamente: ${factura.letra_serie}${factura.numero_correlativo.toString().padStart(8, '0')}`);

      res.status(201).json({
        success: true,
        message: 'Factura creada exitosamente',
        data: {
          id: factura.id,
          numero_factura: `${factura.letra_serie}${factura.numero_correlativo.toString().padStart(8, '0')}`,
          total: factura.total,
          cliente: cliente.nombre_completo,
          sucursal: sucursal.nombre
        }
      });

    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error creando factura:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * @route   GET /api/facturas/siguiente-correlativo
 * @desc    Obtener siguiente número correlativo para una sucursal
 * @access  Private
 */
router.get('/siguiente-correlativo',
  AuthMiddleware.verificarToken,
  async (req, res) => {
    try {
      const { sucursal_id } = req.query;

      if (!sucursal_id) {
        return res.status(400).json({
          success: false,
          message: 'sucursal_id es requerido'
        });
      }

      console.log(`🔢 Obteniendo siguiente correlativo para sucursal ${sucursal_id}...`);

      // Obtener o crear serie de factura para la sucursal
      let [serieFactura] = await SerieFactura.findOrCreate({
        where: { sucursal_id, letra_serie: 'A' },
        defaults: {
          descripcion: 'Serie principal',
          correlativo_actual: 0,
          activo: true
        }
      });

      const siguienteCorrelativo = serieFactura.getSiguienteCorrelativo();
      const numeroFactura = serieFactura.generarNumeroFactura(siguienteCorrelativo);

      console.log(`✅ Siguiente correlativo: ${numeroFactura}`);

      res.json({
        success: true,
        data: {
          letra_serie: serieFactura.letra_serie,
          siguiente_correlativo: siguienteCorrelativo,
          numero_factura: numeroFactura
        }
      });

    } catch (error) {
      console.error('❌ Error obteniendo siguiente correlativo:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * @route   GET /api/facturas/estadisticas
 * @desc    Obtener estadísticas de facturas
 * @access  Private
 */
router.get('/estadisticas',
  AuthMiddleware.verificarToken,
  async (req, res) => {
    try {
      console.log('📊 Obteniendo estadísticas de facturas...');

      // Obtener totales
      const totalFacturas = await Factura.count({
        where: { estado: 'activa' }
      });

      const totalVentas = await Factura.sum('total', {
        where: { estado: 'activa' }
      });

      // Facturas del mes actual
      const inicioMes = new Date();
      inicioMes.setDate(1);
      inicioMes.setHours(0, 0, 0, 0);

      const ventasMes = await Factura.sum('total', {
        where: {
          estado: 'activa',
          fecha_creacion: {
            [require('sequelize').Op.gte]: inicioMes
          }
        }
      });

      const facturasMes = await Factura.count({
        where: {
          estado: 'activa',
          fecha_creacion: {
            [require('sequelize').Op.gte]: inicioMes
          }
        }
      });

      console.log('✅ Estadísticas calculadas');

      res.json({
        success: true,
        data: {
          total_facturas: totalFacturas || 0,
          total_ventas: parseFloat(totalVentas || 0).toFixed(2),
          ventas_mes: parseFloat(ventasMes || 0).toFixed(2),
          facturas_mes: facturasMes || 0,
          promedio_venta: totalFacturas > 0 ? parseFloat((totalVentas || 0) / totalFacturas).toFixed(2) : '0.00'
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
);

/**
 * @route   GET /api/facturas/:id
 * @desc    Obtener factura por ID
 * @access  Private
 */
router.get('/:id',
  AuthMiddleware.verificarToken,
  async (req, res) => {
    try {
      const { id } = req.params;
      console.log(`🧾 Obteniendo factura ${id}...`);

      const factura = await Factura.findByPk(id, {
        include: [
          {
            model: Cliente,
            as: 'cliente',
            attributes: ['id', 'nombre_completo', 'nit', 'email', 'telefono', 'direccion']
          },
          {
            model: Sucursal,
            as: 'sucursal',
            attributes: ['id', 'nombre', 'direccion', 'telefono']
          },
          {
            model: Usuario,
            as: 'usuario',
            attributes: ['id', 'nombre_completo', 'email']
          },
          {
            model: FacturaDetalle,
            as: 'detalles',
            include: [
              {
                model: Producto,
                as: 'producto',
                attributes: ['id', 'nombre', 'codigo_producto']
              },
              {
                model: UnidadMedida,
                as: 'unidad_medida',
                attributes: ['id', 'nombre', 'abreviatura']
              }
            ]
          },
          {
            model: FacturaPago,
            as: 'pagos',
            include: [
              {
                model: MedioPago,
                as: 'medioPago',
                attributes: ['id', 'nombre']
              }
            ]
          }
        ]
      });

      if (!factura) {
        return res.status(404).json({
          success: false,
          message: 'Factura no encontrada'
        });
      }

      console.log(`✅ Factura ${id} encontrada`);

      res.json({
        success: true,
        data: factura
      });

    } catch (error) {
      console.error('❌ Error obteniendo factura:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

module.exports = router;