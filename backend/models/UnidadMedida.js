'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class UnidadMedida extends Model {
    static associate(models) {
      // Una unidad de medida pertenece a una categoría
      UnidadMedida.belongsTo(models.Categoria, {
        foreignKey: 'categoria_id',
        as: 'categoria'
      });

      // Una unidad de medida puede tener muchas variaciones de productos
      UnidadMedida.hasMany(models.ProductoVariacion, {
        foreignKey: 'unidad_medida_id',
        as: 'variaciones_productos'
      });

      // Una unidad de medida puede estar en inventarios
      UnidadMedida.hasMany(models.InventarioSucursal, {
        foreignKey: 'unidad_medida_id',
        as: 'inventarios'
      });
    }
  }

  UnidadMedida.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    categoria_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'categorias',
        key: 'id'
      }
    },
    nombre: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 50]
      },
      comment: 'Ej: 1/32 galón, 1 unidad, 1 cubeta'
    },
    abreviatura: {
      type: DataTypes.STRING(10),
      allowNull: true,
      comment: 'Ej: 1/32gl, und, cub'
    },
    factor_conversion: {
      type: DataTypes.DECIMAL(10, 4),
      defaultValue: 1,
      comment: 'Factor de conversión a la unidad base'
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
    modelName: 'UnidadMedida',
    tableName: 'unidades_medida',
    timestamps: false
  });

  return UnidadMedida;
};