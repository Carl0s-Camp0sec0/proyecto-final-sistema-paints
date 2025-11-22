const { Carrito, Producto, UnidadMedida, InventarioSucursal, Sucursal, sequelize } = require('../models');

/**
 * Obtener carrito del cliente autenticado
 */
const obtenerCarrito = async (req, res) => {
    try {
        const cliente_id = req.usuario.id;

        const carrito = await Carrito.findAll({
            where: { cliente_id },
            include: [
                {
                    model: Producto,
                    as: 'producto',
                    attributes: ['id', 'nombre', 'marca', 'descripcion', 'precio_base']
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
            order: [['fecha_creacion', 'DESC']]
        });

        // Calcular totales
        const subtotal = carrito.reduce((sum, item) => {
            return sum + (item.precio_unitario * item.cantidad);
        }, 0);

        const total = subtotal;

        res.json({
            success: true,
            data: {
                items: carrito,
                resumen: {
                    cantidad_items: carrito.length,
                    subtotal,
                    total
                }
            }
        });

    } catch (error) {
        console.error('❌ Error al obtener carrito:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener carrito',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Agregar producto al carrito
 */
const agregar = async (req, res) => {
    try {
        const cliente_id = req.usuario.id;
        const { sucursal_id, producto_id, unidad_medida_id, cantidad } = req.body;

        // Validaciones
        if (!sucursal_id || !producto_id || !unidad_medida_id || !cantidad) {
            return res.status(400).json({
                success: false,
                message: 'Todos los campos son requeridos'
            });
        }

        if (cantidad < 1) {
            return res.status(400).json({
                success: false,
                message: 'La cantidad debe ser mayor a 0'
            });
        }

        // Validar que el producto existe
        const producto = await Producto.findByPk(producto_id);
        if (!producto) {
            return res.status(404).json({
                success: false,
                message: 'Producto no encontrado'
            });
        }

        // Validar stock disponible
        const inventario = await InventarioSucursal.findOne({
            where: { sucursal_id, producto_id, unidad_medida_id }
        });

        if (!inventario) {
            return res.status(404).json({
                success: false,
                message: 'Producto no disponible en esta sucursal'
            });
        }

        if (inventario.stock_disponible < cantidad) {
            return res.status(400).json({
                success: false,
                message: `Stock insuficiente. Disponible: ${inventario.stock_disponible}`,
                stock_disponible: inventario.stock_disponible
            });
        }

        // Obtener precio actual del producto
        const precio_unitario = producto.precio_base;

        // Verificar si ya existe en el carrito
        const itemExistente = await Carrito.findOne({
            where: {
                cliente_id,
                producto_id,
                unidad_medida_id,
                sucursal_id
            }
        });

        let item;

        if (itemExistente) {
            // Actualizar cantidad
            const nuevaCantidad = itemExistente.cantidad + cantidad;

            // Verificar stock para la nueva cantidad
            if (inventario.stock_disponible < nuevaCantidad) {
                return res.status(400).json({
                    success: false,
                    message: `Stock insuficiente para la cantidad total. Disponible: ${inventario.stock_disponible}`,
                    stock_disponible: inventario.stock_disponible
                });
            }

            await itemExistente.update({
                cantidad: nuevaCantidad,
                precio_unitario // Actualizar precio por si cambió
            });

            item = itemExistente;
            console.log(`✅ Cantidad actualizada en carrito para producto ${producto_id}`);
        } else {
            // Crear nuevo item
            item = await Carrito.create({
                cliente_id,
                sucursal_id,
                producto_id,
                unidad_medida_id,
                cantidad,
                precio_unitario
            });

            console.log(`✅ Producto ${producto_id} agregado al carrito`);
        }

        // Recargar con relaciones
        const itemCompleto = await Carrito.findByPk(item.id, {
            include: [
                { model: Producto, as: 'producto' },
                { model: UnidadMedida, as: 'unidad_medida' },
                { model: Sucursal, as: 'sucursal' }
            ]
        });

        res.status(201).json({
            success: true,
            message: itemExistente ? 'Cantidad actualizada en el carrito' : 'Producto agregado al carrito',
            data: itemCompleto
        });

    } catch (error) {
        console.error('❌ Error al agregar al carrito:', error);
        res.status(500).json({
            success: false,
            message: 'Error al agregar producto al carrito',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Actualizar cantidad de un item del carrito
 */
const actualizar = async (req, res) => {
    try {
        const { id } = req.params;
        const { cantidad } = req.body;
        const cliente_id = req.usuario.id;

        if (cantidad < 1) {
            return res.status(400).json({
                success: false,
                message: 'La cantidad debe ser mayor a 0'
            });
        }

        const item = await Carrito.findOne({
            where: { id, cliente_id }
        });

        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Item no encontrado en el carrito'
            });
        }

        // Validar stock
        const inventario = await InventarioSucursal.findOne({
            where: {
                sucursal_id: item.sucursal_id,
                producto_id: item.producto_id,
                unidad_medida_id: item.unidad_medida_id
            }
        });

        if (!inventario || inventario.stock_disponible < cantidad) {
            return res.status(400).json({
                success: false,
                message: `Stock insuficiente. Disponible: ${inventario ? inventario.stock_disponible : 0}`,
                stock_disponible: inventario ? inventario.stock_disponible : 0
            });
        }

        await item.update({ cantidad });

        console.log(`✅ Cantidad actualizada en carrito item ${id}`);

        res.json({
            success: true,
            message: 'Carrito actualizado',
            data: item
        });

    } catch (error) {
        console.error('❌ Error al actualizar carrito:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar carrito',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Eliminar item del carrito
 */
const eliminar = async (req, res) => {
    try {
        const { id } = req.params;
        const cliente_id = req.usuario.id;

        const item = await Carrito.findOne({
            where: { id, cliente_id }
        });

        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Item no encontrado'
            });
        }

        await item.destroy();

        console.log(`✅ Item ${id} eliminado del carrito`);

        res.json({
            success: true,
            message: 'Item eliminado del carrito'
        });

    } catch (error) {
        console.error('❌ Error al eliminar del carrito:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar item',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Vaciar carrito completo
 */
const vaciar = async (req, res) => {
    try {
        const cliente_id = req.usuario.id;

        const count = await Carrito.destroy({
            where: { cliente_id }
        });

        console.log(`✅ Carrito vaciado: ${count} items eliminados`);

        res.json({
            success: true,
            message: `Carrito vaciado exitosamente (${count} items eliminados)`
        });

    } catch (error) {
        console.error('❌ Error al vaciar carrito:', error);
        res.status(500).json({
            success: false,
            message: 'Error al vaciar carrito',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

module.exports = {
    obtenerCarrito,
    agregar,
    actualizar,
    eliminar,
    vaciar
};
