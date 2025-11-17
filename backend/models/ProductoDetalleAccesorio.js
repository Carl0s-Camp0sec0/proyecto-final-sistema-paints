'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ProductoDetalleAccesorio extends Model {
    static associate(models) {
      // Pertenece a un producto
      ProductoDetalleAccesorio.belongsTo(models.Producto, {
        foreignKey: 'producto_id',
        as: 'producto'
      });
    }
  }

  ProductoDetalleAccesorio.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    producto_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      references: {
        model: 'productos',
        key: 'id'
      }
    },
    tamano: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: 'Tamaño del accesorio (ej: 1", 2", pequeño, mediano)'
    },
    material: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Material del accesorio'
    },
    peso: {
      type: DataTypes.DECIMAL(8, 3),
      allowNull: true,
      comment: 'Peso en kilogramos'
    },
    fecha_creacion: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'ProductoDetalleAccesorio',
    tableName: 'productos_detalles_accesorio',
    timestamps: false
  });

  return ProductoDetalleAccesorio;
};