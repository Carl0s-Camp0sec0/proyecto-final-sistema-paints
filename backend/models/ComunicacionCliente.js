'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ComunicacionCliente extends Model {
    static associate(models) {
      // Un destinatario pertenece a una comunicación
      ComunicacionCliente.belongsTo(models.Comunicacion, {
        foreignKey: 'comunicacion_id',
        as: 'comunicacion'
      });

      // Un destinatario es un cliente
      ComunicacionCliente.belongsTo(models.Cliente, {
        foreignKey: 'cliente_id',
        as: 'cliente'
      });
    }
  }

  ComunicacionCliente.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    comunicacion_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'comunicaciones',
        key: 'id'
      }
    },
    cliente_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'clientes',
        key: 'id'
      }
    },
    enviado: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    fecha_envio: {
      type: DataTypes.DATE,
      allowNull: true
    },
    error_envio: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Detalle del error si falla el envío'
    },
    fecha_creacion: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'ComunicacionCliente',
    tableName: 'comunicaciones_clientes',
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['comunicacion_id', 'cliente_id']
      }
    ]
  });

  return ComunicacionCliente;
};