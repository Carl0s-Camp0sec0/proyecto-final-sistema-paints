module.exports = (sequelize, DataTypes) => {
    const AuditoriaInventario = sequelize.define('AuditoriaInventario', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        tipo_movimiento: {
            type: DataTypes.ENUM('ingreso', 'venta', 'ajuste', 'transferencia'),
            allowNull: false,
            comment: 'Tipo de movimiento de inventario'
        },
        sucursal_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: 'Sucursal donde se realizó el movimiento'
        },
        producto_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: 'Producto afectado'
        },
        unidad_medida_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: 'Unidad de medida del producto'
        },
        cantidad_anterior: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: 'Stock antes del movimiento'
        },
        cantidad_movimiento: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: 'Cantidad del movimiento (+ ingreso, - salida)'
        },
        cantidad_nueva: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: 'Stock después del movimiento'
        },
        documento_referencia: {
            type: DataTypes.STRING(100),
            comment: 'Número de factura, ingreso, etc.'
        },
        usuario_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: 'Usuario que realizó el movimiento'
        },
        observaciones: {
            type: DataTypes.TEXT
        },
        fecha_creacion: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
            field: 'fecha_creacion'
        }
    }, {
        tableName: 'auditoria_inventario',
        timestamps: false,
        indexes: [
            {
                name: 'idx_fecha_tipo',
                fields: ['fecha_creacion', 'tipo_movimiento']
            },
            {
                name: 'idx_producto_sucursal',
                fields: ['producto_id', 'sucursal_id']
            }
        ]
    });

    AuditoriaInventario.associate = (models) => {
        AuditoriaInventario.belongsTo(models.Sucursal, {
            foreignKey: 'sucursal_id',
            as: 'sucursal'
        });
        AuditoriaInventario.belongsTo(models.Producto, {
            foreignKey: 'producto_id',
            as: 'producto'
        });
        AuditoriaInventario.belongsTo(models.UnidadMedida, {
            foreignKey: 'unidad_medida_id',
            as: 'unidad_medida'
        });
        AuditoriaInventario.belongsTo(models.Usuario, {
            foreignKey: 'usuario_id',
            as: 'usuario'
        });
    };

    // Método estático para registrar movimiento
    AuditoriaInventario.registrarMovimiento = async function(datos) {
        try {
            return await this.create({
                tipo_movimiento: datos.tipo_movimiento,
                sucursal_id: datos.sucursal_id,
                producto_id: datos.producto_id,
                unidad_medida_id: datos.unidad_medida_id,
                cantidad_anterior: datos.cantidad_anterior,
                cantidad_movimiento: datos.cantidad_movimiento,
                cantidad_nueva: datos.cantidad_nueva,
                documento_referencia: datos.documento_referencia,
                usuario_id: datos.usuario_id,
                observaciones: datos.observaciones
            });
        } catch (error) {
            console.error('Error registrando auditoría de inventario:', error);
            throw error;
        }
    };

    return AuditoriaInventario;
};
