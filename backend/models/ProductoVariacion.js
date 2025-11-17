'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ProductoVariacion extends Model {
    static associate(models) {
      // Una variación pertenece a un producto
      ProductoVariacion.belongsTo(models.Producto, {
        foreignKey: 'producto_id',
        as: 'producto'
      });

      // Una variación pertenece a una unidad de medida
      ProductoVariacion.belongsTo(models.UnidadMedida, {
        foreignKey: 'unidad_medida_id',
        as: 'unidad_medida'
      });

      // Una variación puede estar en inventarios
      ProductoVariacion.hasMany(models.InventarioSucursal, {
        foreignKey: 'unidad_medida_id',
        as: 'inventarios'
      });
    }

    // Método para calcular precio con descuento
    getPrecioConDescuento() {
      if (this.producto && this.producto.descuento_porcentaje > 0) {
        const descuento = (this.precio_venta * this.producto.descuento_porcentaje) / 100;
        return this.precio_venta - descuento;
      }
      return this.precio_venta;
    }
  }

  ProductoVariacion.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
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
    precio_venta: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0
      },
      comment: 'Precio específico para esta medida'
    },
    codigo_variacion: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Código específico de la variación'
    },
    activo: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    fecha_creacion: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'ProductoVariacion',
    tableName: 'productos_variaciones',
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['producto_id', 'unidad_medida_id']
      }
    ]
  });

  return ProductoVariacion;
};