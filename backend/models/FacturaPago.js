'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class FacturaPago extends Model {
    static associate(models) {
      // Un pago pertenece a una factura
      FacturaPago.belongsTo(models.Factura, {
        foreignKey: 'factura_id',
        as: 'factura'
      });

      // Un pago utiliza un medio de pago
      FacturaPago.belongsTo(models.MedioPago, {
        foreignKey: 'medio_pago_id',
        as: 'medio_pago'
      });
    }

    // Método para validar que la referencia es requerida
    validarReferencia() {
      return new Promise(async (resolve, reject) => {
        const medioPago = await this.getMedio_pago();
        
        if (medioPago && medioPago.requiere_referencia && !this.referencia) {
          reject(new Error(`El medio de pago ${medioPago.nombre} requiere número de referencia`));
        }
        
        resolve(true);
      });
    }

    // Método para formatear información de pago
    getInfoFormateada() {
      return {
        medio_pago: this.medio_pago?.nombre || 'No especificado',
        monto: parseFloat(this.monto),
        referencia: this.referencia || 'Sin referencia',
        fecha: this.fecha_creacion,
        observaciones: this.observaciones || ''
      };
    }
  }

  FacturaPago.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    factura_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'facturas',
        key: 'id'
      }
    },
    medio_pago_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'medios_pago',
        key: 'id'
      }
    },
    monto: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      validate: {
        min: 0.01
      }
    },
    referencia: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Número de cheque, referencia de tarjeta, etc.'
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
    modelName: 'FacturaPago',
    tableName: 'facturas_pagos',
    timestamps: false,
    hooks: {
      beforeCreate: async (pago) => {
        // Validar referencia requerida
        await pago.validarReferencia();
      },
      beforeUpdate: async (pago) => {
        // Validar referencia requerida al actualizar
        await pago.validarReferencia();
      },
      afterCreate: async (pago) => {
        // Verificar si la factura está completamente pagada
        const factura = await pago.getFactura({ include: ['pagos'] });
        
        if (factura) {
          const totalPagado = factura.pagos.reduce((sum, p) => {
            return sum + parseFloat(p.monto || 0);
          }, 0);
          
          // Si está completamente pagada, podrías agregar lógica adicional aquí
          if (Math.abs(totalPagado - factura.total) < 0.01) {
            console.log(`Factura ${factura.numero_factura_completo} completamente pagada`);
          }
        }
      }
    }
  });

  return FacturaPago;
};