'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class IngresoDetalle extends Model {
    static associate(models) {
      // Un detalle pertenece a un ingreso
      IngresoDetalle.belongsTo(models.IngresoInventario, {
        foreignKey: 'ingreso_id',
        as: 'ingreso'
      });

      // Un detalle pertenece a un producto
      IngresoDetalle.belongsTo(models.Producto, {
        foreignKey: 'producto_id',
        as: 'producto'
      });

      // Un detalle pertenece a una unidad de medida
      IngresoDetalle.belongsTo(models.UnidadMedida, {
        foreignKey: 'unidad_medida_id',
        as: 'unidad_medida'
      });
    }
  }

  IngresoDetalle.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    ingreso_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'ingresos_inventario',
        key: 'id'
      }
    },
    producto_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'productos',
        key: 'id'
      }
    },
    unidad_medida_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'unidades_medida',
        key: 'id'
      }
    },
    cantidad: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1
      }
    },
    costo_unitario: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    subtotal: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    fecha_creacion: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'IngresoDetalle',
    tableName: 'ingresos_detalle',
    timestamps: false,
    hooks: {
      beforeValidate: (detalle) => {
        // Calcular subtotal automáticamente
        if (detalle.cantidad && detalle.costo_unitario) {
          detalle.subtotal = detalle.cantidad * detalle.costo_unitario;
        }
      }
    }
  });

  return IngresoDetalle;
};