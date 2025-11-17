'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class IngresoInventario extends Model {
    static associate(models) {
      // Un ingreso pertenece a un proveedor
      IngresoInventario.belongsTo(models.Proveedor, {
        foreignKey: 'proveedor_id',
        as: 'proveedor'
      });

      // Un ingreso pertenece a una sucursal
      IngresoInventario.belongsTo(models.Sucursal, {
        foreignKey: 'sucursal_id',
        as: 'sucursal'
      });

      // Un ingreso pertenece a un usuario
      IngresoInventario.belongsTo(models.Usuario, {
        foreignKey: 'usuario_id',
        as: 'usuario'
      });

      // Un ingreso puede tener muchos detalles
      IngresoInventario.hasMany(models.IngresoDetalle, {
        foreignKey: 'ingreso_id',
        as: 'detalles'
      });
    }

    // Método para calcular total desde detalles
    async calcularTotal() {
      const detalles = await this.getDetalles();
      const total = detalles.reduce((sum, detalle) => {
        return sum + parseFloat(detalle.subtotal || 0);
      }, 0);
      
      this.total = total;
      await this.save();
      return total;
    }

    // Método para procesar ingreso (actualizar inventario)
    async procesar() {
      if (this.estado !== 'pendiente') {
        throw new Error('Solo se pueden procesar ingresos pendientes');
      }

      const detalles = await this.getDetalles({
        include: ['producto', 'unidad_medida']
      });

      for (const detalle of detalles) {
        // Actualizar o crear inventario en sucursal
        const [inventario] = await sequelize.models.InventarioSucursal.findOrCreate({
          where: {
            sucursal_id: this.sucursal_id,
            producto_id: detalle.producto_id,
            unidad_medida_id: detalle.unidad_medida_id
          },
          defaults: {
            stock_actual: 0,
            stock_reservado: 0
          }
        });

        await inventario.incrementarStock(detalle.cantidad);
      }

      this.estado = 'procesado';
      await this.save();
    }
  }

  IngresoInventario.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    proveedor_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'proveedores',
        key: 'id'
      }
    },
    sucursal_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'sucursales',
        key: 'id'
      }
    },
    usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'usuarios',
        key: 'id'
      },
      comment: 'Usuario que registra el ingreso'
    },
    numero_documento: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: 'Número de factura o documento del proveedor'
    },
    fecha_ingreso: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    total: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    observaciones: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    estado: {
      type: DataTypes.ENUM('pendiente', 'procesado', 'cancelado'),
      defaultValue: 'pendiente'
    },
    fecha_creacion: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'IngresoInventario',
    tableName: 'ingresos_inventario',
    timestamps: false
  });

  return IngresoInventario;
};