'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Sucursal extends Model {
    static associate(models) {
      // Una sucursal puede tener muchas facturas
      Sucursal.hasMany(models.Factura, {
        foreignKey: 'sucursal_id',
        as: 'facturas'
      });

      // Una sucursal puede tener muchos inventarios
      Sucursal.hasMany(models.InventarioSucursal, {
        foreignKey: 'sucursal_id',
        as: 'inventarios'
      });

      // Una sucursal puede tener series de facturas
      Sucursal.hasMany(models.SerieFactura, {
        foreignKey: 'sucursal_id',
        as: 'series_facturas'
      });
    }

    // Método para calcular distancia a coordenadas dadas
    calcularDistancia(lat, lng) {
      if (!this.latitud || !this.longitud) return null;
      
      const R = 6371; // Radio de la Tierra en km
      const dLat = (lat - this.latitud) * Math.PI / 180;
      const dLng = (lng - this.longitud) * Math.PI / 180;
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(this.latitud * Math.PI / 180) * Math.cos(lat * Math.PI / 180) *
        Math.sin(dLng/2) * Math.sin(dLng/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c; // Distancia en km
    }
  }

  Sucursal.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nombre: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 100]
      }
    },
    direccion: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    latitud: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: true,
      validate: {
        min: -90,
        max: 90
      }
    },
    longitud: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: true,
      validate: {
        min: -180,
        max: 180
      }
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
    modelName: 'Sucursal',
    tableName: 'sucursales',
    timestamps: false
  });

  return Sucursal;
};