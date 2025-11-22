const { Cotizacion, CotizacionDetalle, Cliente, Sucursal, Usuario, Producto, UnidadMedida, sequelize } = require('../models');
const { Op } = require('sequelize');

/**
 * Listar cotizaciones con filtros
 */
const listar = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            sucursal_id,
            cliente_id,
            estado,
            fecha_inicio,
            fecha_fin
        } = req.query;

        const offset = (page - 1) * limit;

        // Construir filtros
        const where = {};

        if (sucursal_id) where.sucursal_id = sucursal_id;
        if (cliente_id) where.cliente_id = cliente_id;
        if (estado) where.estado = estado;

        if (fecha_inicio && fecha_fin) {
            where.fecha_creacion = {
                [Op.between]: [new Date(fecha_inicio), new Date(fecha_fin)]
            };
        }

        const { count, rows } = await Cotizacion.findAndCountAll({
            where,
            include: [
                {
                    model: Cliente,
                    as: 'cliente',
                    attributes: ['id', 'nombre_completo', 'email', 'telefono']
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
                    model: CotizacionDetalle,
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
                }
            ],
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['fecha_creacion', 'DESC']]
        });

        res.json({
            success: true,
            data: {
                cotizaciones: rows,
                pagination: {
                    total: count,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(count / limit)
                }
            }
        });
    } catch (error) {
        console.error('❌ Error al listar cotizaciones:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener cotizaciones',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Obtener cotización por ID
 */
const obtenerPorId = async (req, res) => {
    try {
        const { id } = req.params;

        const cotizacion = await Cotizacion.findByPk(id, {
            include: [
                { model: Cliente, as: 'cliente' },
                { model: Sucursal, as: 'sucursal' },
                {
                    model: Usuario,
                    as: 'usuario',
                    attributes: ['id', 'nombre_completo']
                },
                {
                    model: CotizacionDetalle,
                    as: 'detalles',
                    include: [
                        { model: Producto, as: 'producto' },
                        { model: UnidadMedida, as: 'unidad_medida' }
                    ]
                }
            ]
        });

        if (!cotizacion) {
            return res.status(404).json({
                success: false,
                message: 'Cotización no encontrada'
            });
        }

        res.json({
            success: true,
            data: cotizacion
        });
    } catch (error) {
        console.error('❌ Error al obtener cotización:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener cotización',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Crear cotización
 */
const crear = async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
        const {
            cliente_id,
            sucursal_id,
            productos,
            observaciones,
            vigencia_dias = 15
        } = req.body;

        // Validar productos
        if (!productos || productos.length === 0) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: 'Debe incluir al menos un producto'
            });
        }

        // Validar cliente
        const cliente = await Cliente.findByPk(cliente_id);
        if (!cliente) {
            await transaction.rollback();
            return res.status(404).json({
                success: false,
                message: 'Cliente no encontrado'
            });
        }

        // Calcular totales
        let subtotal = 0;
        const detallesData = [];

        for (const item of productos) {
            const {
                producto_id,
                unidad_medida_id,
                cantidad,
                precio_unitario,
                descuento_porcentaje = 0
            } = item;

            // Validar producto existe
            const producto = await Producto.findByPk(producto_id);
            if (!producto) {
                await transaction.rollback();
                return res.status(404).json({
                    success: false,
                    message: `Producto ${producto_id} no encontrado`
                });
            }

            const descuento = (precio_unitario * cantidad * descuento_porcentaje) / 100;
            const subtotalItem = (precio_unitario * cantidad) - descuento;

            subtotal += subtotalItem;

            detallesData.push({
                producto_id,
                unidad_medida_id,
                cantidad,
                precio_unitario,
                descuento_porcentaje,
                subtotal: subtotalItem
            });
        }

        const total = subtotal;

        // Generar número de cotización
        const ultimaCotizacion = await Cotizacion.findOne({
            order: [['id', 'DESC']]
        });
        const siguienteNumero = ultimaCotizacion ? ultimaCotizacion.id + 1 : 1;
        const numeroCotizacion = `COT-${String(siguienteNumero).padStart(8, '0')}`;

        // Crear cotización
        const cotizacion = await Cotizacion.create({
            numero_cotizacion: numeroCotizacion,
            cliente_id,
            sucursal_id,
            usuario_id: req.usuario.id,
            subtotal,
            descuento: 0,
            total,
            vigencia_dias,
            observaciones,
            estado: 'activa'
        }, { transaction });

        // Crear detalles
        for (const detalle of detallesData) {
            await CotizacionDetalle.create({
                cotizacion_id: cotizacion.id,
                ...detalle
            }, { transaction });
        }

        await transaction.commit();

        // Recargar con relaciones
        const cotizacionCompleta = await Cotizacion.findByPk(cotizacion.id, {
            include: [
                { model: Cliente, as: 'cliente' },
                { model: Sucursal, as: 'sucursal' },
                {
                    model: CotizacionDetalle,
                    as: 'detalles',
                    include: [
                        { model: Producto, as: 'producto' },
                        { model: UnidadMedida, as: 'unidad_medida' }
                    ]
                }
            ]
        });

        console.log(`✅ Cotización ${numeroCotizacion} creada exitosamente`);

        res.status(201).json({
            success: true,
            message: 'Cotización creada exitosamente',
            data: cotizacionCompleta
        });

    } catch (error) {
        await transaction.rollback();
        console.error('❌ Error al crear cotización:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear cotización',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Anular cotización
 */
const anular = async (req, res) => {
    try {
        const { id } = req.params;
        const { motivo } = req.body;

        const cotizacion = await Cotizacion.findByPk(id);

        if (!cotizacion) {
            return res.status(404).json({
                success: false,
                message: 'Cotización no encontrada'
            });
        }

        if (cotizacion.estado !== 'activa') {
            return res.status(400).json({
                success: false,
                message: 'Solo se pueden anular cotizaciones activas'
            });
        }

        await cotizacion.update({
            estado: 'cancelada',
            observaciones: `${cotizacion.observaciones || ''}\n\nCANCELADA: ${motivo || 'Sin motivo especificado'}`
        });

        console.log(`✅ Cotizacion ${cotizacion.numero_cotizacion} anulada`);

        res.json({
            success: true,
            message: 'Cotización anulada exitosamente',
            data: cotizacion
        });

    } catch (error) {
        console.error('❌ Error al anular cotización:', error);
        res.status(500).json({
            success: false,
            message: 'Error al anular cotización',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

module.exports = {
    listar,
    obtenerPorId,
    crear,
    anular
};
