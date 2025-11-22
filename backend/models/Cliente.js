'use strict';
const { Model } = require('sequelize');
const bcrypt = require('bcrypt');

module.exports = (sequelize, DataTypes) => {
  class Cliente extends Model {
    static associate(models) {
      // Un cliente puede tener muchas facturas
      Cliente.hasMany(models.Factura, {
        foreignKey: 'cliente_id',
        as: 'facturas'
      });

      // Un cliente puede tener muchas cotizaciones
      Cliente.hasMany(models.Cotizacion, {
        foreignKey: 'cliente_id',
        as: 'cotizaciones'
      });

      // Un cliente puede tener items en carrito
      Cliente.hasMany(models.Carrito, {
        foreignKey: 'cliente_id',
        as: 'carrito'
      });

      // Un cliente puede tener sesiones
      Cliente.hasMany(models.SesionCliente, {
        foreignKey: 'cliente_id',
        as: 'sesiones'
      });

      // Un cliente puede recibir comunicaciones
      Cliente.hasMany(models.ComunicacionCliente, {
        foreignKey: 'cliente_id',
        as: 'comunicaciones_recibidas'
      });
    }

    // Método para calcular distancia a una sucursal
    calcularDistanciaASucursal(sucursal) {
      if (!this.latitud || !this.longitud || !sucursal.latitud || !sucursal.longitud) {
        return null;
      }

      const R = 6371; // Radio de la Tierra en km
      const dLat = (sucursal.latitud - this.latitud) * Math.PI / 180;
      const dLng = (sucursal.longitud - this.longitud) * Math.PI / 180;
      const a =
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(this.latitud * Math.PI / 180) * Math.cos(sucursal.latitud * Math.PI / 180) *
        Math.sin(dLng/2) * Math.sin(dLng/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c; // Distancia en km
    }

    // Método para validar contraseña
    async validarPassword(password) {
      if (!this.password_hash) return false;
      return await bcrypt.compare(password, this.password_hash);
    }

    // Método para cambiar contraseña
    async cambiarPassword(nuevaPassword) {
      const salt = await bcrypt.genSalt(10);
      this.password_hash = await bcrypt.hash(nuevaPassword, salt);
      await this.save();
    }

    // Método estático para crear cliente con password
    static async crearCliente(datos) {
      const { password, ...datosCliente } = datos;

      // Hash de la contraseña si se proporciona
      if (password) {
        const salt = await bcrypt.genSalt(10);
        datosCliente.password_hash = await bcrypt.hash(password, salt);
      }

      return await Cliente.create(datosCliente);
    }
  }

  Cliente.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nombre_completo: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 100]
      }
    },
    nit: {
      type: DataTypes.STRING(20),
      allowNull: true, // Temporalmente nullable para migración
      unique: false, // Temporalmente no unique para migración
      validate: {
        notEmpty: true
      },
      comment: 'NIT del cliente (CF para consumidor final)'
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: true,
      validate: {
        isEmail: true
      }
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Hash de la contraseña para autenticación del cliente'
    },
    telefono: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    direccion: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    latitud: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: true,
      comment: 'Coordenada GPS del cliente',
      validate: {
        min: -90,
        max: 90
      }
    },
    longitud: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: true,
      comment: 'Coordenada GPS del cliente',
      validate: {
        min: -180,
        max: 180
      }
    },
    recibe_promociones: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
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
    modelName: 'Cliente',
    tableName: 'clientes',
    timestamps: true,
    createdAt: 'fecha_creacion',
    updatedAt: 'fecha_actualizacion'
  });

  return Cliente;
};