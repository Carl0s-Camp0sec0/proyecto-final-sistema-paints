const { Sequelize, Op } = require('sequelize');
const db = require('../models');

// Importar modelos
const Factura = db.Factura;
const FacturaDetalle = db.FacturaDetalle;
const FacturaPago = db.FacturaPago;
const Producto = db.Producto;
const Categoria = db.Categoria;
const Sucursal = db.Sucursal;
const Usuario = db.Usuario;
const Cliente = db.Cliente;
const MedioPago = db.MedioPago;
const InventarioSucursal = db.InventarioSucursal;
const UnidadMedida = db.UnidadMedida;
const IngresoInventario = db.IngresoInventario;
const IngresoDetalle = db.IngresoDetalle;
const Proveedor = db.Proveedor;

/* ============================================
   REPORTE 1: VENTAS POR PERÍODO Y MEDIOS DE PAGO
   ============================================ */
exports.getVentasPorPeriodo = async (req, res) => {
    try {
        const { fecha_inicio, fecha_fin, sucursal_id, metodo_pago, usuario_id } = req.query;

        // Validar fechas
        if (!fecha_inicio || !fecha_fin) {
            return res.status(400).json({
                success: false,
                message: 'Las fechas de inicio y fin son requeridas'
            });
        }

        // Construir filtros
        const whereFactura = {
            fecha_creacion: {
                [Op.between]: [new Date(fecha_inicio), new Date(fecha_fin + ' 23:59:59')]
            },
            estado: 'activa'
        };

        if (sucursal_id) {
            whereFactura.sucursal_id = sucursal_id;
        }

        if (usuario_id) {
            whereFactura.usuario_id = usuario_id;
        }

        // Obtener facturas del período
        const facturas = await Factura.findAll({
            where: whereFactura,
            include: [
                {
                    model: FacturaPago,
                    as: 'pagos',
                    include: [{
                        model: MedioPago,
                        as: 'medioPago'
                    }]
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
                },
                {
                    model: Cliente,
                    as: 'cliente',
                    attributes: ['id', 'nombre_completo']
                }
            ],
            order: [['fecha_creacion', 'DESC']]
        });

        // Calcular totales por medio de pago
        let totalGeneral = 0;
        let totalEfectivo = 0;
        let totalCheque = 0;
        let totalTarjeta = 0;
        let totalTransferencia = 0;

        const desglosePorMedioPago = {};

        facturas.forEach(factura => {
            totalGeneral += parseFloat(factura.total);

            factura.pagos.forEach(pago => {
                const nombreMedio = pago.medioPago.nombre.toLowerCase();
                const monto = parseFloat(pago.monto);

                // Acumular en categorías principales
                if (nombreMedio.includes('efectivo')) {
                    totalEfectivo += monto;
                } else if (nombreMedio.includes('cheque')) {
                    totalCheque += monto;
                } else if (nombreMedio.includes('tarjeta') || nombreMedio.includes('crédito') || nombreMedio.includes('débito')) {
                    totalTarjeta += monto;
                } else if (nombreMedio.includes('transferencia')) {
                    totalTransferencia += monto;
                }

                // Desglose detallado
                if (!desglosePorMedioPago[pago.medioPago.nombre]) {
                    desglosePorMedioPago[pago.medioPago.nombre] = 0;
                }
                desglosePorMedioPago[pago.medioPago.nombre] += monto;
            });
        });

        // Calcular estadísticas
        const numeroFacturas = facturas.length;
        const ventaPromedio = numeroFacturas > 0 ? totalGeneral / numeroFacturas : 0;

        // Facturas anuladas en el período
        const facturasAnuladas = await Factura.count({
            where: {
                fecha_creacion: whereFactura.fecha_creacion,
                estado: 'anulada',
                ...(sucursal_id && { sucursal_id })
            }
        });

        // Ventas por día (para gráfico)
        const ventasPorDia = await Factura.findAll({
            where: whereFactura,
            attributes: [
                [Sequelize.fn('DATE', Sequelize.col('fecha_creacion')), 'fecha'],
                [Sequelize.fn('COUNT', Sequelize.col('id')), 'cantidad_facturas'],
                [Sequelize.fn('SUM', Sequelize.col('total')), 'total_vendido']
            ],
            group: [Sequelize.fn('DATE', Sequelize.col('fecha_creacion'))],
            order: [[Sequelize.fn('DATE', Sequelize.col('fecha_creacion')), 'ASC']],
            raw: true
        });

        // Ventas por sucursal
        const ventasPorSucursal = await Factura.findAll({
            where: whereFactura,
            attributes: [
                [Sequelize.fn('COUNT', Sequelize.col('Factura.id')), 'cantidad_facturas'],
                [Sequelize.fn('SUM', Sequelize.col('total')), 'total_vendido'],
                [Sequelize.fn('AVG', Sequelize.col('total')), 'venta_promedio']
            ],
            include: [{
                model: Sucursal,
                as: 'sucursal',
                attributes: ['id', 'nombre']
            }],
            group: ['sucursal.id', 'sucursal.nombre'],
            raw: true
        });

        res.json({
            success: true,
            data: {
                resumen: {
                    total_general: parseFloat(totalGeneral.toFixed(2)),
                    total_efectivo: parseFloat(totalEfectivo.toFixed(2)),
                    total_cheque: parseFloat(totalCheque.toFixed(2)),
                    total_tarjeta: parseFloat(totalTarjeta.toFixed(2)),
                    total_transferencia: parseFloat(totalTransferencia.toFixed(2)),
                    numero_facturas: numeroFacturas,
                    venta_promedio: parseFloat(ventaPromedio.toFixed(2)),
                    facturas_anuladas: facturasAnuladas
                },
                desglose_medios_pago: desglosePorMedioPago,
                ventas_por_dia: ventasPorDia,
                ventas_por_sucursal: ventasPorSucursal,
                facturas: facturas.map(f => ({
                    id: f.id,
                    numero_factura: f.numero_factura,
                    fecha: f.fecha_creacion,
                    cliente: f.cliente ? f.cliente.nombre_completo : 'Consumidor Final',
                    sucursal: f.sucursal.nombre,
                    usuario: f.usuario.nombre_completo,
                    total: parseFloat(f.total),
                    medios_pago: f.pagos.map(p => ({
                        medio: p.medioPago.nombre,
                        monto: parseFloat(p.monto)
                    }))
                })),
                periodo: {
                    fecha_inicio,
                    fecha_fin
                }
            }
        });

    } catch (error) {
        console.error('Error en getVentasPorPeriodo:', error);
        res.status(500).json({
            success: false,
            message: 'Error al generar reporte de ventas',
            error: error.message
        });
    }
};

/* ============================================
   REPORTE 2: PRODUCTOS QUE MÁS DINERO GENERAN
   ============================================ */
exports.getProductosTopIngresos = async (req, res) => {
    try {
        const { fecha_inicio, fecha_fin, sucursal_id, limit = 10 } = req.query;

        if (!fecha_inicio || !fecha_fin) {
            return res.status(400).json({
                success: false,
                message: 'Las fechas de inicio y fin son requeridas'
            });
        }

        const whereFactura = {
            fecha_creacion: {
                [Op.between]: [new Date(fecha_inicio), new Date(fecha_fin + ' 23:59:59')]
            },
            estado: 'activa'
        };

        if (sucursal_id) {
            whereFactura.sucursal_id = sucursal_id;
        }

        // Obtener productos más vendidos por ingreso
        const productos = await FacturaDetalle.findAll({
            attributes: [
                [Sequelize.fn('SUM', Sequelize.col('subtotal')), 'total_vendido'],
                [Sequelize.fn('SUM', Sequelize.col('cantidad')), 'cantidad_vendida'],
                [Sequelize.fn('COUNT', Sequelize.literal('DISTINCT factura_id')), 'numero_facturas']
            ],
            include: [
                {
                    model: Factura,
                    as: 'factura',
                    where: whereFactura,
                    attributes: []
                },
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
                }
            ],
            group: ['producto.id', 'producto.nombre', 'producto.marca', 'categoria.id', 'categoria.nombre', 'unidad_medida.id', 'unidad_medida.nombre', 'unidad_medida.abreviatura'],
            order: [[Sequelize.fn('SUM', Sequelize.col('subtotal')), 'DESC']],
            limit: parseInt(limit),
            raw: false
        });

        // Calcular total general para porcentajes
        const totalGeneral = productos.reduce((sum, p) => sum + parseFloat(p.dataValues.total_vendido), 0);

        const productosFormateados = productos.map((item, index) => {
            const totalVendido = parseFloat(item.dataValues.total_vendido);
            const porcentaje = totalGeneral > 0 ? (totalVendido / totalGeneral * 100) : 0;

            return {
                posicion: index + 1,
                producto_id: item.producto.id,
                nombre: item.producto.nombre,
                marca: item.producto.marca,
                categoria: item.producto.categoria.nombre,
                unidad_medida: item.unidad_medida.nombre,
                cantidad_vendida: parseInt(item.dataValues.cantidad_vendida),
                total_vendido: parseFloat(totalVendido.toFixed(2)),
                numero_facturas: parseInt(item.dataValues.numero_facturas),
                porcentaje: parseFloat(porcentaje.toFixed(2))
            };
        });

        res.json({
            success: true,
            data: {
                productos: productosFormateados,
                total_general: parseFloat(totalGeneral.toFixed(2)),
                periodo: { fecha_inicio, fecha_fin }
            }
        });

    } catch (error) {
        console.error('Error en getProductosTopIngresos:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener productos con más ingresos',
            error: error.message
        });
    }
};

/* ============================================
   REPORTE 3: PRODUCTOS MÁS VENDIDOS POR CANTIDAD
   ============================================ */
exports.getProductosTopCantidad = async (req, res) => {
    try {
        const { fecha_inicio, fecha_fin, sucursal_id, limit = 10 } = req.query;

        if (!fecha_inicio || !fecha_fin) {
            return res.status(400).json({
                success: false,
                message: 'Las fechas de inicio y fin son requeridas'
            });
        }

        const whereFactura = {
            fecha_creacion: {
                [Op.between]: [new Date(fecha_inicio), new Date(fecha_fin + ' 23:59:59')]
            },
            estado: 'activa'
        };

        if (sucursal_id) {
            whereFactura.sucursal_id = sucursal_id;
        }

        const productos = await FacturaDetalle.findAll({
            attributes: [
                [Sequelize.fn('SUM', Sequelize.col('cantidad')), 'cantidad_vendida'],
                [Sequelize.fn('SUM', Sequelize.col('subtotal')), 'total_vendido'],
                [Sequelize.fn('COUNT', Sequelize.literal('DISTINCT factura_id')), 'numero_facturas']
            ],
            include: [
                {
                    model: Factura,
                    as: 'factura',
                    where: whereFactura,
                    attributes: []
                },
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
                }
            ],
            group: ['producto.id', 'producto.nombre', 'producto.marca', 'categoria.id', 'categoria.nombre', 'unidad_medida.id', 'unidad_medida.nombre', 'unidad_medida.abreviatura'],
            order: [[Sequelize.fn('SUM', Sequelize.col('cantidad')), 'DESC']],
            limit: parseInt(limit),
            raw: false
        });

        const productosFormateados = productos.map((item, index) => ({
            posicion: index + 1,
            producto_id: item.producto.id,
            nombre: item.producto.nombre,
            marca: item.producto.marca,
            categoria: item.producto.categoria.nombre,
            unidad_medida: item.unidad_medida.nombre,
            cantidad_vendida: parseInt(item.dataValues.cantidad_vendida),
            total_vendido: parseFloat(item.dataValues.total_vendido),
            numero_facturas: parseInt(item.dataValues.numero_facturas)
        }));

        res.json({
            success: true,
            data: {
                productos: productosFormateados,
                periodo: { fecha_inicio, fecha_fin }
            }
        });

    } catch (error) {
        console.error('Error en getProductosTopCantidad:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener productos más vendidos',
            error: error.message
        });
    }
};

/* ============================================
   REPORTE 4: INVENTARIO ACTUAL GENERAL
   ============================================ */
exports.getInventarioGeneral = async (req, res) => {
    try {
        const { sucursal_id, categoria_id } = req.query;

        const whereInventario = {};
        const whereProducto = {};

        if (sucursal_id) {
            whereInventario.sucursal_id = sucursal_id;
        }

        if (categoria_id) {
            whereProducto.categoria_id = categoria_id;
        }

        const inventario = await InventarioSucursal.findAll({
            where: whereInventario,
            include: [
                {
                    model: Producto,
                    as: 'producto',
                    where: whereProducto,
                    attributes: ['id', 'nombre', 'marca', 'precio_base', 'stock_minimo'],
                    include: [{
                        model: Categoria,
                        as: 'categoria',
                        attributes: ['nombre']
                    }]
                },
                {
                    model: Sucursal,
                    as: 'sucursal',
                    attributes: ['id', 'nombre']
                },
                {
                    model: UnidadMedida,
                    as: 'unidad_medida',
                    attributes: ['nombre', 'abreviatura']
                }
            ],
            order: [['producto', 'nombre', 'ASC']]
        });

        // Calcular estadísticas
        let totalProductos = 0;
        let valorTotal = 0;
        let stockBajo = 0;
        let agotados = 0;

        const productosFormateados = inventario.map(item => {
            const precio = parseFloat(item.producto.precio_base);
            const stock = parseInt(item.stock_actual);
            const stockMin = parseInt(item.producto.stock_minimo);
            const valor = precio * stock;

            totalProductos++;
            valorTotal += valor;

            if (stock === 0) {
                agotados++;
            } else if (stock <= stockMin) {
                stockBajo++;
            }

            return {
                producto_id: item.producto.id,
                nombre: item.producto.nombre,
                marca: item.producto.marca,
                categoria: item.producto.categoria.nombre,
                sucursal: item.sucursal.nombre,
                unidad_medida: item.unidad_medida.nombre,
                stock_actual: stock,
                stock_minimo: stockMin,
                stock_reservado: parseInt(item.stock_reservado),
                stock_disponible: parseInt(item.stock_disponible),
                precio_unitario: precio,
                valor_inventario: parseFloat(valor.toFixed(2)),
                estado: stock === 0 ? 'agotado' : stock <= stockMin ? 'bajo' : 'normal'
            };
        });

        res.json({
            success: true,
            data: {
                estadisticas: {
                    total_productos: totalProductos,
                    valor_total: parseFloat(valorTotal.toFixed(2)),
                    stock_bajo: stockBajo,
                    agotados: agotados
                },
                productos: productosFormateados
            }
        });

    } catch (error) {
        console.error('Error en getInventarioGeneral:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener inventario general',
            error: error.message
        });
    }
};

/* ============================================
   REPORTE 5: PRODUCTOS CON MENOS VENTAS
   ============================================ */
exports.getProductosMenosVendidos = async (req, res) => {
    try {
        const { fecha_inicio, fecha_fin, sucursal_id, limit = 10 } = req.query;

        if (!fecha_inicio || !fecha_fin) {
            return res.status(400).json({
                success: false,
                message: 'Las fechas de inicio y fin son requeridas'
            });
        }

        const whereFactura = {
            fecha_creacion: {
                [Op.between]: [new Date(fecha_inicio), new Date(fecha_fin + ' 23:59:59')]
            },
            estado: 'activa'
        };

        if (sucursal_id) {
            whereFactura.sucursal_id = sucursal_id;
        }

        // Obtener productos vendidos
        const productos = await FacturaDetalle.findAll({
            attributes: [
                [Sequelize.fn('SUM', Sequelize.col('cantidad')), 'cantidad_vendida'],
                [Sequelize.fn('SUM', Sequelize.col('subtotal')), 'total_vendido'],
                [Sequelize.fn('MAX', Sequelize.col('factura.fecha_creacion')), 'ultima_venta']
            ],
            include: [
                {
                    model: Factura,
                    as: 'factura',
                    where: whereFactura,
                    attributes: []
                },
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
                    attributes: ['id', 'nombre']
                }
            ],
            group: ['producto.id', 'producto.nombre', 'producto.marca', 'categoria.id', 'categoria.nombre', 'unidad_medida.id', 'unidad_medida.nombre'],
            order: [[Sequelize.fn('SUM', Sequelize.col('cantidad')), 'ASC']],
            limit: parseInt(limit),
            raw: false
        });

        const productosFormateados = productos.map((item, index) => {
            const ultimaVenta = new Date(item.dataValues.ultima_venta);
            const hoy = new Date();
            const diasSinVenta = Math.floor((hoy - ultimaVenta) / (1000 * 60 * 60 * 24));

            return {
                posicion: index + 1,
                producto_id: item.producto.id,
                nombre: item.producto.nombre,
                marca: item.producto.marca,
                categoria: item.producto.categoria.nombre,
                unidad_medida: item.unidad_medida.nombre,
                cantidad_vendida: parseInt(item.dataValues.cantidad_vendida),
                total_vendido: parseFloat(item.dataValues.total_vendido),
                ultima_venta: item.dataValues.ultima_venta,
                dias_sin_venta: diasSinVenta
            };
        });

        res.json({
            success: true,
            data: {
                productos: productosFormateados,
                periodo: { fecha_inicio, fecha_fin }
            }
        });

    } catch (error) {
        console.error('Error en getProductosMenosVendidos:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener productos menos vendidos',
            error: error.message
        });
    }
};

/* ============================================
   REPORTE 6: PRODUCTOS SIN STOCK
   ============================================ */
exports.getProductosSinStock = async (req, res) => {
    try {
        const { sucursal_id } = req.query;

        const whereInventario = {
            stock_actual: 0
        };

        if (sucursal_id) {
            whereInventario.sucursal_id = sucursal_id;
        }

        const productosSinStock = await InventarioSucursal.findAll({
            where: whereInventario,
            include: [
                {
                    model: Producto,
                    as: 'producto',
                    attributes: ['id', 'nombre', 'marca', 'stock_minimo'],
                    include: [{
                        model: Categoria,
                        as: 'categoria',
                        attributes: ['nombre']
                    }]
                },
                {
                    model: Sucursal,
                    as: 'sucursal',
                    attributes: ['id', 'nombre']
                },
                {
                    model: UnidadMedida,
                    as: 'unidad_medida',
                    attributes: ['nombre']
                }
            ],
            order: [['producto', 'nombre', 'ASC']]
        });

        // Para cada producto, obtener última venta
        const productosConInfo = await Promise.all(
            productosSinStock.map(async (item) => {
                // Buscar última venta del producto
                const ultimaVenta = await FacturaDetalle.findOne({
                    where: {
                        producto_id: item.producto.id,
                        unidad_medida_id: item.unidad_medida_id
                    },
                    include: [{
                        model: Factura,
                        as: 'factura',
                        where: {
                            estado: 'activa',
                            sucursal_id: item.sucursal_id
                        },
                        attributes: ['fecha_creacion']
                    }],
                    order: [['factura', 'fecha_creacion', 'DESC']],
                    limit: 1
                });

                const fechaUltimaVenta = ultimaVenta ? ultimaVenta.factura.fecha_creacion : null;
                const diasSinStock = fechaUltimaVenta
                    ? Math.floor((new Date() - new Date(fechaUltimaVenta)) / (1000 * 60 * 60 * 24))
                    : null;

                return {
                    producto_id: item.producto.id,
                    nombre: item.producto.nombre,
                    marca: item.producto.marca,
                    categoria: item.producto.categoria.nombre,
                    sucursal: item.sucursal.nombre,
                    unidad_medida: item.unidad_medida.nombre,
                    stock_minimo: item.producto.stock_minimo,
                    ultima_venta: fechaUltimaVenta,
                    dias_sin_stock: diasSinStock,
                    requiere_pedido: true
                };
            })
        );

        res.json({
            success: true,
            data: {
                total_productos_agotados: productosConInfo.length,
                productos: productosConInfo
            }
        });

    } catch (error) {
        console.error('Error en getProductosSinStock:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener productos sin stock',
            error: error.message
        });
    }
};

/* ============================================
   REPORTE 7: BÚSQUEDA DE FACTURA POR NÚMERO
   ============================================ */
exports.getFacturaPorNumero = async (req, res) => {
    try {
        const { numero_factura } = req.params;

        if (!numero_factura) {
            return res.status(400).json({
                success: false,
                message: 'El número de factura es requerido'
            });
        }

        // Extraer serie y número
        const letra_serie = numero_factura.charAt(0);
        const numero = parseInt(numero_factura.substring(1));

        const factura = await Factura.findOne({
            where: {
                letra_serie: letra_serie,
                numero_correlativo: numero
            },
            include: [
                {
                    model: FacturaDetalle,
                    as: 'detalles',
                    include: [
                        {
                            model: Producto,
                            as: 'producto',
                            include: [{
                                model: Categoria,
                                as: 'categoria'
                            }]
                        },
                        {
                            model: UnidadMedida,
                            as: 'unidad_medida'
                        }
                    ]
                },
                {
                    model: FacturaPago,
                    as: 'pagos',
                    include: [{
                        model: MedioPago,
                        as: 'medioPago'
                    }]
                },
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
                    attributes: ['id', 'nombre_completo', 'email']
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
            data: {
                factura: {
                    id: factura.id,
                    numero_factura: factura.numero_factura,
                    serie: factura.letra_serie,
                    correlativo: factura.numero_correlativo,
                    fecha: factura.fecha_creacion,
                    estado: factura.estado,
                    subtotal: parseFloat(factura.subtotal),
                    descuento: parseFloat(factura.descuento),
                    impuestos: parseFloat(factura.impuestos),
                    total: parseFloat(factura.total),
                    fecha_anulacion: factura.fecha_anulacion,
                    motivo_anulacion: factura.motivo_anulacion,
                    observaciones: factura.observaciones
                },
                cliente: factura.cliente ? {
                    id: factura.cliente.id,
                    nombre: factura.cliente.nombre_completo,
                    email: factura.cliente.email,
                    telefono: factura.cliente.telefono
                } : {
                    nombre: 'Consumidor Final'
                },
                sucursal: {
                    id: factura.sucursal.id,
                    nombre: factura.sucursal.nombre
                },
                usuario_responsable: {
                    id: factura.usuario.id,
                    nombre: factura.usuario.nombre_completo,
                    email: factura.usuario.email
                },
                detalles: factura.detalles.map(d => ({
                    producto_id: d.producto.id,
                    nombre: d.producto.nombre,
                    categoria: d.producto.categoria.nombre,
                    cantidad: parseInt(d.cantidad),
                    unidad_medida: d.unidad_medida.nombre,
                    precio_unitario: parseFloat(d.precio_unitario),
                    descuento_porcentaje: parseFloat(d.descuento_porcentaje),
                    subtotal: parseFloat(d.subtotal)
                })),
                medios_pago: factura.pagos.map(p => ({
                    medio_pago: p.medioPago.nombre,
                    monto: parseFloat(p.monto),
                    referencia: p.referencia,
                    observaciones: p.observaciones
                }))
            }
        });

    } catch (error) {
        console.error('Error en getFacturaPorNumero:', error);
        res.status(500).json({
            success: false,
            message: 'Error al buscar factura',
            error: error.message
        });
    }
};

/* ============================================
   REPORTE 8: INGRESOS AL INVENTARIO
   ============================================ */
exports.getIngresosInventario = async (req, res) => {
    try {
        const { fecha_inicio, fecha_fin, sucursal_id, proveedor_id, producto } = req.query;

        if (!fecha_inicio || !fecha_fin) {
            return res.status(400).json({
                success: false,
                message: 'Las fechas de inicio y fin son requeridas'
            });
        }

        const whereIngreso = {
            fecha_ingreso: {
                [Op.between]: [new Date(fecha_inicio), new Date(fecha_fin)]
            }
        };

        if (sucursal_id) {
            whereIngreso.sucursal_id = sucursal_id;
        }

        if (proveedor_id) {
            whereIngreso.proveedor_id = proveedor_id;
        }

        // Construir where para producto si se especifica
        const whereProducto = {};
        if (producto) {
            whereProducto[Op.or] = [
                { nombre: { [Op.like]: `%${producto}%` } },
                { marca: { [Op.like]: `%${producto}%` } }
            ];
        }

        const ingresos = await IngresoInventario.findAll({
            where: whereIngreso,
            include: [
                {
                    model: Proveedor,
                    as: 'proveedor',
                    attributes: ['id', 'nombre_empresa', 'nombre_contacto']
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
                },
                {
                    model: IngresoDetalle,
                    as: 'detalles',
                    ...(producto ? { required: true } : {}),
                    include: [
                        {
                            model: Producto,
                            as: 'producto',
                            attributes: ['id', 'nombre', 'marca'],
                            ...(producto ? { where: whereProducto, required: true } : {}),
                            include: [{
                                model: Categoria,
                                as: 'categoria',
                                attributes: ['nombre']
                            }]
                        },
                        {
                            model: UnidadMedida,
                            as: 'unidad_medida',
                            attributes: ['nombre']
                        }
                    ]
                }
            ],
            order: [['fecha_ingreso', 'DESC']]
        });

        // Calcular estadísticas
        const totalIngresos = ingresos.length;
        const totalMonto = ingresos.reduce((sum, ing) => sum + parseFloat(ing.total), 0);

        const ingresosFormateados = ingresos.map(ingreso => ({
            id: ingreso.id,
            numero_documento: ingreso.numero_documento,
            fecha_ingreso: ingreso.fecha_ingreso,
            proveedor: {
                id: ingreso.proveedor.id,
                nombre: ingreso.proveedor.nombre_empresa,
                contacto: ingreso.proveedor.nombre_contacto
            },
            sucursal: {
                id: ingreso.sucursal.id,
                nombre: ingreso.sucursal.nombre
            },
            usuario: ingreso.usuario.nombre_completo,
            total: parseFloat(ingreso.total),
            estado: ingreso.estado,
            observaciones: ingreso.observaciones,
            productos: ingreso.detalles.map(d => ({
                producto_id: d.producto.id,
                nombre: d.producto.nombre,
                marca: d.producto.marca,
                categoria: d.producto.categoria.nombre,
                cantidad: parseInt(d.cantidad),
                unidad_medida: d.unidad_medida.nombre,
                costo_unitario: parseFloat(d.costo_unitario),
                subtotal: parseFloat(d.subtotal)
            }))
        }));

        res.json({
            success: true,
            data: {
                estadisticas: {
                    total_ingresos: totalIngresos,
                    total_monto: parseFloat(totalMonto.toFixed(2))
                },
                ingresos: ingresosFormateados,
                periodo: { fecha_inicio, fecha_fin }
            }
        });

    } catch (error) {
        console.error('Error en getIngresosInventario:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener ingresos de inventario',
            error: error.message
        });
    }
};

/* ============================================
   REPORTE 9: PRODUCTOS BAJO STOCK MÍNIMO
   ============================================ */
exports.getProductosStockBajo = async (req, res) => {
    try {
        const { sucursal_id } = req.query;

        const whereInventario = {};

        if (sucursal_id) {
            whereInventario.sucursal_id = sucursal_id;
        }

        const inventario = await InventarioSucursal.findAll({
            where: whereInventario,
            include: [
                {
                    model: Producto,
                    as: 'producto',
                    attributes: ['id', 'nombre', 'marca', 'stock_minimo'],
                    include: [{
                        model: Categoria,
                        as: 'categoria',
                        attributes: ['nombre']
                    }]
                },
                {
                    model: Sucursal,
                    as: 'sucursal',
                    attributes: ['id', 'nombre']
                },
                {
                    model: UnidadMedida,
                    as: 'unidad_medida',
                    attributes: ['nombre']
                }
            ]
        });

        // Filtrar solo productos con stock bajo o agotado
        const productosBajoStock = inventario
            .filter(item => item.stock_actual <= item.producto.stock_minimo)
            .map(item => {
                const stockActual = parseInt(item.stock_actual);
                const stockMinimo = parseInt(item.producto.stock_minimo);
                const deficit = stockMinimo - stockActual;

                return {
                    producto_id: item.producto.id,
                    nombre: item.producto.nombre,
                    marca: item.producto.marca,
                    categoria: item.producto.categoria.nombre,
                    sucursal: item.sucursal.nombre,
                    unidad_medida: item.unidad_medida.nombre,
                    stock_actual: stockActual,
                    stock_minimo: stockMinimo,
                    deficit: deficit,
                    estado: stockActual === 0 ? 'agotado' : 'bajo',
                    prioridad: stockActual === 0 ? 'alta' : deficit >= 10 ? 'media' : 'baja'
                };
            })
            .sort((a, b) => b.deficit - a.deficit);

        res.json({
            success: true,
            data: {
                total_productos: productosBajoStock.length,
                productos_agotados: productosBajoStock.filter(p => p.estado === 'agotado').length,
                productos_bajo_stock: productosBajoStock.filter(p => p.estado === 'bajo').length,
                productos: productosBajoStock
            }
        });

    } catch (error) {
        console.error('Error en getProductosStockBajo:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener productos con stock bajo',
            error: error.message
        });
    }
};

/* ============================================
   REPORTE 10: INVENTARIO POR TIENDA
   ============================================ */
exports.getInventarioPorTienda = async (req, res) => {
    try {
        const { categoria_id } = req.query;

        const whereProducto = {};

        if (categoria_id) {
            whereProducto.categoria_id = categoria_id;
        }

        const sucursales = await Sucursal.findAll({
            where: { activo: true },
            attributes: ['id', 'nombre', 'direccion']
        });

        const inventarioPorSucursal = await Promise.all(
            sucursales.map(async (sucursal) => {
                const inventario = await InventarioSucursal.findAll({
                    where: {
                        sucursal_id: sucursal.id
                    },
                    include: [
                        {
                            model: Producto,
                            as: 'producto',
                            where: whereProducto,
                            attributes: ['id', 'nombre', 'marca', 'precio_base'],
                            include: [{
                                model: Categoria,
                                as: 'categoria',
                                attributes: ['nombre']
                            }]
                        },
                        {
                            model: UnidadMedida,
                            as: 'unidad_medida',
                            attributes: ['nombre']
                        }
                    ]
                });

                // Calcular estadísticas de la sucursal
                let totalProductos = inventario.length;
                let valorTotal = 0;
                let stockTotal = 0;
                let productosBajoStock = 0;

                const productos = inventario.map(item => {
                    const precio = parseFloat(item.producto.precio_base);
                    const stock = parseInt(item.stock_actual);
                    const valor = precio * stock;

                    valorTotal += valor;
                    stockTotal += stock;

                    return {
                        producto_id: item.producto.id,
                        nombre: item.producto.nombre,
                        marca: item.producto.marca,
                        categoria: item.producto.categoria.nombre,
                        unidad_medida: item.unidad_medida.nombre,
                        stock_actual: stock,
                        precio_unitario: precio,
                        valor_inventario: parseFloat(valor.toFixed(2))
                    };
                });

                return {
                    sucursal: {
                        id: sucursal.id,
                        nombre: sucursal.nombre,
                        direccion: sucursal.direccion
                    },
                    estadisticas: {
                        total_productos: totalProductos,
                        stock_total: stockTotal,
                        valor_total: parseFloat(valorTotal.toFixed(2))
                    },
                    productos: productos
                };
            })
        );

        // Calcular totales generales
        const estadisticasGenerales = {
            total_sucursales: sucursales.length,
            valor_total_sistema: inventarioPorSucursal.reduce(
                (sum, s) => sum + s.estadisticas.valor_total,
                0
            ),
            stock_total_sistema: inventarioPorSucursal.reduce(
                (sum, s) => sum + s.estadisticas.stock_total,
                0
            )
        };

        res.json({
            success: true,
            data: {
                estadisticas_generales: estadisticasGenerales,
                sucursales: inventarioPorSucursal
            }
        });

    } catch (error) {
        console.error('Error en getInventarioPorTienda:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener inventario por tienda',
            error: error.message
        });
    }
};

/* ============================================
   REPORTES DE CLIENTES
   ============================================ */

// Estadísticas generales de clientes
exports.getClientesEstadisticas = async (req, res) => {
    try {
        const { periodo_dias = 30 } = req.query;

        // Fecha límite para clientes activos y nuevos
        const fechaLimite = new Date();
        fechaLimite.setDate(fechaLimite.getDate() - parseInt(periodo_dias));

        // Total de clientes
        const totalClientes = await Cliente.count({
            where: { estado: 'activo' }
        });

        // Clientes activos (con compras en el período)
        const clientesActivos = await Factura.count({
            where: {
                fecha_creacion: { [Op.gte]: fechaLimite },
                estado: 'activa'
            },
            distinct: true,
            col: 'cliente_id'
        });

        // Nuevos clientes (registrados en el período)
        const nuevosClientes = await Cliente.count({
            where: {
                fecha_creacion: { [Op.gte]: fechaLimite },
                estado: 'activo'
            }
        });

        // Ticket promedio
        const ventasTotales = await Factura.sum('total', {
            where: {
                fecha_creacion: { [Op.gte]: fechaLimite },
                estado: 'activa'
            }
        });

        const numeroFacturas = await Factura.count({
            where: {
                fecha_creacion: { [Op.gte]: fechaLimite },
                estado: 'activa'
            }
        });

        const ticketPromedio = numeroFacturas > 0 ? ventasTotales / numeroFacturas : 0;

        res.json({
            success: true,
            data: {
                total_clientes: totalClientes,
                clientes_activos: clientesActivos,
                nuevos_clientes: nuevosClientes,
                ticket_promedio: parseFloat(ticketPromedio.toFixed(2))
            }
        });

    } catch (error) {
        console.error('Error en getClientesEstadisticas:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener estadísticas de clientes',
            error: error.message
        });
    }
};

// Top clientes por ventas
exports.getClientesTopVentas = async (req, res) => {
    try {
        const {
            fecha_inicio,
            fecha_fin,
            sucursal_id,
            tipo_cliente,
            limit = 10
        } = req.query;

        // Construir filtros para facturas
        const whereFactura = { estado: 'activa' };

        if (fecha_inicio && fecha_fin) {
            whereFactura.fecha_creacion = {
                [Op.between]: [new Date(fecha_inicio), new Date(fecha_fin + ' 23:59:59')]
            };
        }

        if (sucursal_id) {
            whereFactura.sucursal_id = sucursal_id;
        }

        // Construir filtros para clientes
        const whereCliente = { estado: 'activo' };

        if (tipo_cliente) {
            whereCliente.tipo_cliente = tipo_cliente;
        }

        // Obtener top clientes
        const topClientes = await Factura.findAll({
            where: whereFactura,
            attributes: [
                'cliente_id',
                [Sequelize.fn('COUNT', Sequelize.col('Factura.id')), 'total_compras'],
                [Sequelize.fn('SUM', Sequelize.col('total')), 'total_vendido']
            ],
            include: [{
                model: Cliente,
                as: 'cliente',
                where: whereCliente,
                attributes: ['id', 'nombre', 'tipo_cliente']
            }],
            group: ['Factura.cliente_id', 'cliente.id', 'cliente.nombre', 'cliente.tipo_cliente'],
            order: [[Sequelize.literal('total_vendido'), 'DESC']],
            limit: parseInt(limit),
            raw: false
        });

        // Formatear resultados
        const clientes = topClientes.map(item => ({
            cliente_id: item.cliente_id,
            nombre: item.cliente.nombre,
            tipo_cliente: item.cliente.tipo_cliente,
            total_compras: parseInt(item.dataValues.total_compras),
            total_vendido: parseFloat(item.dataValues.total_vendido)
        }));

        res.json({
            success: true,
            data: { clientes }
        });

    } catch (error) {
        console.error('Error en getClientesTopVentas:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener top clientes',
            error: error.message
        });
    }
};

// Segmentación de clientes
exports.getClientesSegmentacion = async (req, res) => {
    try {
        const { fecha_inicio, fecha_fin, sucursal_id } = req.query;

        // Definir segmentos basados en el total de compras
        const segmentos = [
            { nombre: 'VIP', min: 10000, max: 999999999, descripcion: 'Compras > Q10,000' },
            { nombre: 'Premium', min: 5000, max: 9999.99, descripcion: 'Compras Q5,000 - Q10,000' },
            { nombre: 'Regular', min: 1000, max: 4999.99, descripcion: 'Compras Q1,000 - Q5,000' },
            { nombre: 'Ocasional', min: 0, max: 999.99, descripcion: 'Compras < Q1,000' }
        ];

        // Construir filtros
        const whereFactura = { estado: 'activa' };

        if (fecha_inicio && fecha_fin) {
            whereFactura.fecha_creacion = {
                [Op.between]: [new Date(fecha_inicio), new Date(fecha_fin + ' 23:59:59')]
            };
        }

        if (sucursal_id) {
            whereFactura.sucursal_id = sucursal_id;
        }

        // Obtener ventas por cliente
        const ventasPorCliente = await Factura.findAll({
            where: whereFactura,
            attributes: [
                'cliente_id',
                [Sequelize.fn('COUNT', Sequelize.col('Factura.id')), 'num_compras'],
                [Sequelize.fn('SUM', Sequelize.col('total')), 'total_vendido']
            ],
            group: ['cliente_id'],
            raw: true
        });

        // Clasificar clientes en segmentos
        const resultadosSegmentos = segmentos.map(segmento => {
            const clientesSegmento = ventasPorCliente.filter(c => {
                const total = parseFloat(c.total_vendido);
                return total >= segmento.min && total <= segmento.max;
            });

            const cantidad = clientesSegmento.length;
            const ingresosTotal = clientesSegmento.reduce((sum, c) => sum + parseFloat(c.total_vendido), 0);
            const comprasTotal = clientesSegmento.reduce((sum, c) => sum + parseInt(c.num_compras), 0);

            return {
                nombre: segmento.nombre,
                descripcion: segmento.descripcion,
                cantidad: cantidad,
                compra_promedio: cantidad > 0 ? parseFloat((ingresosTotal / cantidad).toFixed(2)) : 0,
                frecuencia: cantidad > 0 ? parseFloat((comprasTotal / cantidad).toFixed(1)) : 0,
                ingresos_totales: parseFloat(ingresosTotal.toFixed(2))
            };
        });

        res.json({
            success: true,
            data: { segmentos: resultadosSegmentos }
        });

    } catch (error) {
        console.error('Error en getClientesSegmentacion:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener segmentación de clientes',
            error: error.message
        });
    }
};

// Clientes por tipo
exports.getClientesPorTipo = async (req, res) => {
    try {
        const { fecha_inicio, fecha_fin, sucursal_id } = req.query;

        // Construir filtros
        const whereFactura = { estado: 'activa' };

        if (fecha_inicio && fecha_fin) {
            whereFactura.fecha_creacion = {
                [Op.between]: [new Date(fecha_inicio), new Date(fecha_fin + ' 23:59:59')]
            };
        }

        if (sucursal_id) {
            whereFactura.sucursal_id = sucursal_id;
        }

        // Obtener ventas agrupadas por tipo de cliente
        const ventasPorTipo = await Factura.findAll({
            where: whereFactura,
            attributes: [
                [Sequelize.fn('COUNT', Sequelize.col('Factura.id')), 'num_compras'],
                [Sequelize.fn('SUM', Sequelize.col('total')), 'total_vendido']
            ],
            include: [{
                model: Cliente,
                as: 'cliente',
                attributes: ['tipo_cliente'],
                where: { estado: 'activo' }
            }],
            group: ['cliente.tipo_cliente'],
            raw: true
        });

        // Formatear resultados
        const tipos = ventasPorTipo.map(item => ({
            tipo: item['cliente.tipo_cliente'] || 'Sin tipo',
            num_compras: parseInt(item.num_compras),
            total_vendido: parseFloat(item.total_vendido)
        }));

        res.json({
            success: true,
            data: { tipos }
        });

    } catch (error) {
        console.error('Error en getClientesPorTipo:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener clientes por tipo',
            error: error.message
        });
    }
};

module.exports = exports;
