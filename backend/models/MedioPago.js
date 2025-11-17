'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class MedioPago extends Model {
    static associate(models) {
      // Un medio de pago puede ser usado en muchos pagos de facturas
      MedioPago.hasMany(models.FacturaPago, {
        foreignKey: 'medio_pago_id',
        as: 'facturas_pagos'
      });
    }

    // Método para obtener estadísticas de uso
    async getEstadisticasUso(fechaInicio = null, fechaFin = null) {
      const whereClause = { medio_pago_id: this.id };
      
      if (fechaInicio && fechaFin) {
        whereClause['$factura.fecha_creacion$'] = {
          [sequelize.Sequelize.Op.between]: [fechaInicio, fechaFin]
        };
      }

      const estadisticas = await sequelize.models.FacturaPago.findAll({
        where: whereClause,
        include: [{
          model: sequelize.models.Factura,
          as: 'factura',
          where: { estado: 'activa' },
          attributes: []
        }],
        attributes: [
          [sequelize.fn('COUNT', sequelize.col('FacturaPago.id')), 'total_transacciones'],
          [sequelize.fn('SUM', sequelize.col('FacturaPago.monto')), 'monto_total']
        ],
        raw: true
      });

      return estadisticas[0] || { total_transacciones: 0, monto_total: 0 };
    }
  }

  MedioPago.init({
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
    requiere_referencia: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Indica si requiere número de referencia'
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
    modelName: 'MedioPago',
    tableName: 'medios_pago',
    timestamps: false
  });

  return MedioPago;
};