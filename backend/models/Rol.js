'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Rol extends Model {
    static associate(models) {
      // Un rol puede tener muchos usuarios
      Rol.hasMany(models.Usuario, {
        foreignKey: 'rol_id',
        as: 'usuarios'
      });
    }
  }

  Rol.init({
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
    activo: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    fecha_creacion: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'fecha_creacion'
    }
  }, {
    sequelize,
    modelName: 'Rol',
    tableName: 'roles',
    timestamps: false, // Usamos nuestro campo personalizado
    indexes: [
      {
        unique: true,
        fields: ['nombre']
      }
    ]
  });

  return Rol;
};