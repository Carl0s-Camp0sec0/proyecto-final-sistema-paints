'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class SesionCliente extends Model {
    static associate(models) {
      // Una sesión pertenece a un cliente
      SesionCliente.belongsTo(models.Cliente, {
        foreignKey: 'cliente_id',
        as: 'cliente'
      });
    }

    // Método para verificar si está expirada
    estaExpirada() {
      return new Date() > this.expira_en;
    }

    // Método para extender expiración
    async extenderExpiracion(horas = 24) {
      const nuevaExpiracion = new Date();
      nuevaExpiracion.setHours(nuevaExpiracion.getHours() + horas);
      
      this.expira_en = nuevaExpiracion;
      await this.save();
      
      return this;
    }
  }

  SesionCliente.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    cliente_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'clientes',
        key: 'id'
      }
    },
    token_hash: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    expira_en: {
      type: DataTypes.DATE,
      allowNull: false
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
    modelName: 'SesionCliente',
    tableName: 'sesiones_clientes',
    timestamps: false
  });

  return SesionCliente;
};