'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class CotizacionDetalle extends Model {
    static associate(models) {
      // Un detalle pertenece a una cotización
      CotizacionDetalle.belongsTo(models.Cotizacion, {
        foreignKey: 'cotizacion_id',
        as: 'cotizacion'
      });

      // Un detalle pertenece a un producto
      CotizacionDetalle.belongsTo(models.Producto, {
        foreignKey: 'producto_id',
        as: 'producto'
      });

      // Un detalle pertenece a una unidad de medida
      CotizacionDetalle.belongsTo(models.UnidadMedida, {
        foreignKey: 'unidad_medida_id',
        as: 'unidad_medida'
      });
    }

    // Método para calcular precio con descuento
    getPrecioConDescuento() {
      if (this.descuento_porcentaje > 0) {
        const descuento = (this.precio_unitario * this.descuento_porcentaje) / 100;
        return this.precio_unitario - descuento;
      }
      return this.precio_unitario;
    }
  }

  CotizacionDetalle.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    cotizacion_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'cotizaciones',
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
    precio_unitario: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    descuento_porcentaje: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0,
      validate: {
        min: 0,
        max: 100
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
    modelName: 'CotizacionDetalle',
    tableName: 'cotizaciones_detalle',
    timestamps: false,
    hooks: {
      beforeValidate: (detalle) => {
        // Calcular subtotal automáticamente
        if (detalle.cantidad && detalle.precio_unitario) {
          let precioFinal = detalle.precio_unitario;
          
          // Aplicar descuento si existe
          if (detalle.descuento_porcentaje > 0) {
            const descuento = (precioFinal * detalle.descuento_porcentaje) / 100;
            precioFinal -= descuento;
          }
          
          detalle.subtotal = detalle.cantidad * precioFinal;
        }
      }
    }
  });

  return CotizacionDetalle;
};