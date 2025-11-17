'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Cotizacion extends Model {
    static associate(models) {
      // Una cotización pertenece a un cliente
      Cotizacion.belongsTo(models.Cliente, {
        foreignKey: 'cliente_id',
        as: 'cliente'
      });

      // Una cotización pertenece a una sucursal
      Cotizacion.belongsTo(models.Sucursal, {
        foreignKey: 'sucursal_id',
        as: 'sucursal'
      });

      // Una cotización puede ser creada por un usuario
      Cotizacion.belongsTo(models.Usuario, {
        foreignKey: 'usuario_id',
        as: 'usuario'
      });

      // Una cotización puede tener muchos detalles
      Cotizacion.hasMany(models.CotizacionDetalle, {
        foreignKey: 'cotizacion_id',
        as: 'detalles'
      });

      // Una cotización puede generar una factura
      Cotizacion.hasOne(models.Factura, {
        foreignKey: 'cotizacion_id',
        as: 'factura'
      });
    }

    // Método para verificar si está vigente
    estaVigente() {
      const ahora = new Date();
      const fechaVencimiento = new Date(this.fecha_creacion);
      fechaVencimiento.setDate(fechaVencimiento.getDate() + this.vigencia_dias);
      
      return ahora <= fechaVencimiento && this.estado === 'activa';
    }

    // Método para calcular total desde detalles
    async calcularTotal() {
      const detalles = await this.getDetalles();
      const subtotalCalculado = detalles.reduce((sum, detalle) => {
        return sum + parseFloat(detalle.subtotal || 0);
      }, 0);
      
      this.subtotal = subtotalCalculado;
      this.total = subtotalCalculado - this.descuento;
      await this.save();
      
      return this.total;
    }

    // Método para generar número de cotización
    static async generarNumeroCotizacion() {
      const fecha = new Date();
      const año = fecha.getFullYear();
      const mes = String(fecha.getMonth() + 1).padStart(2, '0');
      
      // Buscar la última cotización del mes
      const ultimaCotizacion = await Cotizacion.findOne({
        where: {
          numero_cotizacion: {
            [sequelize.Sequelize.Op.like]: `COT-${año}${mes}%`
          }
        },
        order: [['numero_cotizacion', 'DESC']]
      });

      let numeroSecuencial = 1;
      if (ultimaCotizacion) {
        const ultimoNumero = ultimaCotizacion.numero_cotizacion.split('-')[1];
        numeroSecuencial = parseInt(ultimoNumero.slice(6)) + 1;
      }

      return `COT-${año}${mes}${String(numeroSecuencial).padStart(4, '0')}`;
    }
  }

  Cotizacion.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    numero_cotizacion: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true
    },
    cliente_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'clientes',
        key: 'id'
      }
    },
    sucursal_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'sucursales',
        key: 'id'
      }
    },
    usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'usuarios',
        key: 'id'
      },
      comment: 'Usuario que genera la cotización'
    },
    subtotal: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    descuento: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    total: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    vigencia_dias: {
      type: DataTypes.INTEGER,
      defaultValue: 15,
      comment: 'Días de vigencia de la cotización'
    },
    fecha_vencimiento: {
      type: DataTypes.VIRTUAL,
      get() {
        if (this.fecha_creacion && this.vigencia_dias) {
          const fecha = new Date(this.fecha_creacion);
          fecha.setDate(fecha.getDate() + this.vigencia_dias);
          return fecha;
        }
        return null;
      }
    },
    estado: {
      type: DataTypes.ENUM('activa', 'vencida', 'facturada', 'cancelada'),
      defaultValue: 'activa'
    },
    observaciones: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    fecha_creacion: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'Cotizacion',
    tableName: 'cotizaciones',
    timestamps: false,
    hooks: {
      beforeCreate: async (cotizacion) => {
        if (!cotizacion.numero_cotizacion) {
          cotizacion.numero_cotizacion = await Cotizacion.generarNumeroCotizacion();
        }
      }
    }
  });

  return Cotizacion;
};