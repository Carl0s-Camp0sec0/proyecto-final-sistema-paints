'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Proveedor extends Model {
    static associate(models) {
      // Un proveedor puede tener muchos ingresos de inventario
      Proveedor.hasMany(models.IngresoInventario, {
        foreignKey: 'proveedor_id',
        as: 'ingresos_inventario'
      });
    }

    // Método para obtener total de compras
    async getTotalCompras(fechaInicio = null, fechaFin = null) {
      const whereClause = { proveedor_id: this.id };
      
      if (fechaInicio && fechaFin) {
        whereClause.fecha_ingreso = {
          [sequelize.Sequelize.Op.between]: [fechaInicio, fechaFin]
        };
      }

      const result = await sequelize.models.IngresoInventario.sum('total', {
        where: whereClause
      });

      return result || 0;
    }
  }

  Proveedor.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nombre_empresa: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 100]
      }
    },
    nombre_contacto: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    telefono: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: true,
      validate: {
        isEmail: true
      }
    },
    direccion: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    sitio_web: {
      type: DataTypes.STRING(100),
      allowNull: true,
      validate: {
        isUrl: true
      }
    },
    activo: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    fecha_creacion: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    fecha_actualizacion: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'Proveedor',
    tableName: 'proveedores',
    timestamps: true,
    createdAt: 'fecha_creacion',
    updatedAt: 'fecha_actualizacion'
  });

  return Proveedor;
};