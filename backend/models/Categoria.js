'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Categoria extends Model {
    static associate(models) {
      // Una categoría puede tener muchos productos
      Categoria.hasMany(models.Producto, {
        foreignKey: 'categoria_id',
        as: 'productos'
      });

      // Una categoría puede tener muchas unidades de medida
      Categoria.hasMany(models.UnidadMedida, {
        foreignKey: 'categoria_id',
        as: 'unidades_medida'
      });
    }
  }

  Categoria.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nombre: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
        len: [2, 50]
      }
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    requiere_medidas: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Indica si los productos de esta categoría manejan diferentes unidades de medida'
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
    modelName: 'Categoria',
    tableName: 'categorias',
    timestamps: false
  });

  return Categoria;
};