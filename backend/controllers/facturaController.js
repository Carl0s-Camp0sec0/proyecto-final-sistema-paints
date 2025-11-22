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
const { Op } = require('sequelize');

class FacturaController {
  // Listar facturas con filtros
  static async listar(req, res) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        sucursal_id, 
        cliente_id,
        estado = 'activa',
        fecha_inicio,
        fecha_fin,
        buscar 
      } = req.query;

      const offset = (page - 1) * limit;
      const whereClause = {};

      // Filtros
      if (sucursal_id) whereClause.sucursal_id = sucursal_id;
      if (cliente_id) whereClause.cliente_id = cliente_id;
      if (estado) whereClause.estado = estado;
      
      // Filtro por rango de fechas
      if (fecha_inicio && fecha_fin) {
        whereClause.fecha_creacion = {
          [Op.between]: [fecha_inicio, fecha_fin]
        };
      }

      // Búsqueda por número de factura
      if (buscar) {
        whereClause[Op.or] = [
          { numero_correlativo: { [Op.like]: `%${buscar}%` } },
          { letra_serie: { [Op.like]: `%${buscar}%` } }
        ];
      }

      const facturas = await Factura.findAndCountAll({
        where: whereClause,
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
      console.error('Error listando facturas:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Obtener factura completa por ID
  static async obtenerPorId(req, res) {
    try {
      const { id } = req.params;

      const factura = await Factura.findByPk(id, {
        include: [
          {
            model: Cliente,
            as: 'cliente'
          },
          {
            model: Sucursal,
            as: 'sucursal'
          },
          {
            model: Usuario,
            as: 'usuario',
            attributes: ['id', 'nombre_completo']
          },
          {
            model: FacturaDetalle,
            as: 'detalles',
            include: [
              {
                model: Producto,
                as: 'producto',
                attributes: ['id', 'nombre', 'marca']
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
            include: [{
              model: MedioPago,
              as: 'medio_pago',
              attributes: ['id', 'nombre']
            }]
          }
        ]
      });

      if (!factura) {
        return res.status(404).json({
          success: false,
          message: 'Factura no encontrada'
        });
      }

      res.json({
        success: true,
        data: factura
      });

    } catch (error) {
      console.error('Error obteniendo factura:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Crear nueva factura
  static async crear(req, res) {
    const transaction = await sequelize.transaction();
    
    try {
      const {
        cliente_id,
        sucursal_id,
        productos, // Array de productos: [{ producto_id, unidad_medida_id, cantidad, precio_unitario }]
        medios_pago, // Array de pagos: [{ medio_pago_id, monto, referencia }]
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

      // Calcular IVA (12%) y total
      const afterDiscount = subtotal - parseFloat(descuento);
      const impuestos = afterDiscount * 0.12; // IVA del 12%
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
            message: `El total pagado (${totalPagado.toFixed(2)}) no coincide con el total de la factura (${total.toFixed(2)})`
          });
        }
      }

      // Obtener siguiente correlativo
      const siguienteCorrelativo = serieFactura.getSiguienteCorrelativo();

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
        impuestos: impuestos,
        total,
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
      await serieFactura.incrementarCorrelativo({ transaction });

      // Confirmar transacción
      await transaction.commit();

      // Obtener factura completa para respuesta
      const facturaCompleta = await Factura.findByPk(factura.id, {
        include: [
          { model: Cliente, as: 'cliente' },
          { model: Sucursal, as: 'sucursal' },
          {
            model: FacturaDetalle,
            as: 'detalles',
            include: [
              { model: Producto, as: 'producto' },
              { model: UnidadMedida, as: 'unidad_medida' }
            ]
          },
          {
            model: FacturaPago,
            as: 'pagos',
            include: [{ model: MedioPago, as: 'medio_pago' }]
          }
        ]
      });

      // Generar número de factura formateado
      const numeroFactura = `${factura.letra_serie}${String(factura.numero_correlativo).padStart(8, '0')}`;

      res.status(201).json({
        success: true,
        message: 'Factura creada exitosamente',
        data: {
          ...facturaCompleta.toJSON(),
          numero_factura: numeroFactura
        }
      });

    } catch (error) {
      await transaction.rollback();
      console.error('Error creando factura:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Anular factura
  static async anular(req, res) {
    const transaction = await sequelize.transaction();
    
    try {
      const { id } = req.params;
      const { motivo_anulacion } = req.body;

      if (!motivo_anulacion) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Motivo de anulación es requerido'
        });
      }

      const factura = await Factura.findByPk(id, {
        include: [{
          model: FacturaDetalle,
          as: 'detalles'
        }],
        transaction
      });

      if (!factura) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: 'Factura no encontrada'
        });
      }

      if (factura.estado === 'anulada') {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'La factura ya está anulada'
        });
      }

      // Restaurar inventario
      for (const detalle of factura.detalles) {
        await InventarioSucursal.increment('stock_actual', {
          by: detalle.cantidad,
          where: {
            sucursal_id: factura.sucursal_id,
            producto_id: detalle.producto_id,
            unidad_medida_id: detalle.unidad_medida_id
          },
          transaction
        });
      }

      // Anular factura
      await factura.update({
        estado: 'anulada',
        fecha_anulacion: new Date(),
        motivo_anulacion,
        total: 0 // Según requerimientos, el monto debe aparecer en cero
      }, { transaction });

      await transaction.commit();

      res.json({
        success: true,
        message: 'Factura anulada exitosamente',
        data: factura
      });

    } catch (error) {
      await transaction.rollback();
      console.error('Error anulando factura:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Buscar factura por número
  static async buscarPorNumero(req, res) {
    try {
      const { numero_factura } = req.params;

      // Extraer letra y número del formato A00000001
      const letra = numero_factura.charAt(0);
      const numero = parseInt(numero_factura.substring(1));

      const factura = await Factura.findOne({
        where: { 
          letra_serie: letra,
          numero_correlativo: numero
        },
        include: [
          { model: Cliente, as: 'cliente' },
          { model: Sucursal, as: 'sucursal' },
          { model: Usuario, as: 'usuario', attributes: ['id', 'nombre_completo'] },
          {
            model: FacturaDetalle,
            as: 'detalles',
            include: [
              { model: Producto, as: 'producto' },
              { model: UnidadMedida, as: 'unidad_medida' }
            ]
          },
          {
            model: FacturaPago,
            as: 'pagos',
            include: [{ model: MedioPago, as: 'medio_pago' }]
          }
        ]
      });

      if (!factura) {
        return res.status(404).json({
          success: false,
          message: 'Factura no encontrada'
        });
      }

      res.json({
        success: true,
        data: factura
      });

    } catch (error) {
      console.error('Error buscando factura por número:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Obtener estadísticas de ventas
  static async estadisticasVentas(req, res) {
    try {
      const {
        sucursal_id,
        fecha_inicio,
        fecha_fin,
        agrupacion = 'dia' // dia, semana, mes
      } = req.query;

      const whereClause = { estado: 'activa' };

      if (sucursal_id) whereClause.sucursal_id = sucursal_id;
      if (fecha_inicio && fecha_fin) {
        whereClause.fecha_creacion = {
          [Op.between]: [fecha_inicio, fecha_fin]
        };
      }

      // Estadísticas generales
      const estadisticasGenerales = await Factura.findAll({
        where: whereClause,
        attributes: [
          [sequelize.fn('COUNT', sequelize.col('id')), 'total_facturas'],
          [sequelize.fn('SUM', sequelize.col('total')), 'monto_total'],
          [sequelize.fn('AVG', sequelize.col('total')), 'promedio_factura']
        ],
        raw: true
      });

      // Ventas por medio de pago
      const ventasPorMedioPago = await FacturaPago.findAll({
        include: [{
          model: Factura,
          as: 'factura',
          where: whereClause,
          attributes: []
        }, {
          model: MedioPago,
          as: 'medio_pago',
          attributes: ['nombre']
        }],
        attributes: [
          [sequelize.fn('SUM', sequelize.col('FacturaPago.monto')), 'total'],
          [sequelize.fn('COUNT', sequelize.col('FacturaPago.id')), 'cantidad_transacciones']
        ],
        group: ['medio_pago.id', 'medio_pago.nombre'],
        raw: true
      });

      res.json({
        success: true,
        data: {
          estadisticas_generales: estadisticasGenerales[0],
          ventas_por_medio_pago: ventasPorMedioPago
        }
      });

    } catch (error) {
      console.error('Error obteniendo estadísticas de ventas:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Obtener siguiente correlativo para una sucursal
  static async obtenerSiguienteCorrelativo(req, res) {
    try {
      const { sucursal_id } = req.query;

      if (!sucursal_id) {
        return res.status(400).json({
          success: false,
          message: 'sucursal_id es requerido'
        });
      }

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

      res.json({
        success: true,
        data: {
          letra_serie: serieFactura.letra_serie,
          siguiente_correlativo: siguienteCorrelativo,
          numero_factura: numeroFactura
        }
      });

    } catch (error) {
      console.error('Error obteniendo siguiente correlativo:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
}

module.exports = FacturaController;