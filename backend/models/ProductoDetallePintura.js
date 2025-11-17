'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ProductoDetallePintura extends Model {
    static associate(models) {
      // Pertenece a un producto
      ProductoDetallePintura.belongsTo(models.Producto, {
        foreignKey: 'producto_id',
        as: 'producto'
      });
    }
  }

  ProductoDetallePintura.init({
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
    duracion_anos: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Duración en años'
    },
    cobertura_m2: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: true,
      comment: 'Cobertura en metros cuadrados'
    },
    color: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Color específico de la pintura'
    },
    codigo_color: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: 'Código hexadecimal o referencia del color'
    },
    tipo_base: {
      type: DataTypes.ENUM('agua', 'aceite'),
      allowNull: true,
      comment: 'Base de la pintura'
    },
    acabado: {
      type: DataTypes.ENUM('mate', 'semi_mate', 'brillante'),
      defaultValue: 'mate'
    },
    fecha_creacion: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'ProductoDetallePintura',
    tableName: 'productos_detalles_pintura',
    timestamps: false
  });

  return ProductoDetallePintura;
};