'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class SerieFactura extends Model {
    static associate(models) {
      // Una serie pertenece a una sucursal
      SerieFactura.belongsTo(models.Sucursal, {
        foreignKey: 'sucursal_id',
        as: 'sucursal'
      });

      // Una serie puede tener muchas facturas
      SerieFactura.hasMany(models.Factura, {
        foreignKey: 'serie_factura_id',
        as: 'facturas'
      });
    }

    // Método para obtener siguiente correlativo
    getSiguienteCorrelativo() {
      return this.correlativo_actual + 1;
    }

    // Método para incrementar correlativo
    async incrementarCorrelativo() {
      this.correlativo_actual += 1;
      await this.save();
      return this.correlativo_actual;
    }

    // Método para generar número de factura completo
    generarNumeroFactura(correlativo = null) {
      const numeroCorrelativo = correlativo || this.getSiguienteCorrelativo();
      return `${this.letra_serie}${String(numeroCorrelativo).padStart(8, '0')}`;
    }
  }

  SerieFactura.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    sucursal_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'sucursales',
        key: 'id'
      }
    },
    letra_serie: {
      type: DataTypes.CHAR(1),
      allowNull: false,
      validate: {
        isAlpha: true,
        len: [1, 1]
      }
    },
    descripcion: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    correlativo_actual: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0
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
    modelName: 'SerieFactura',
    tableName: 'series_facturas',
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['sucursal_id', 'letra_serie']
      }
    ]
  });

  return SerieFactura;
};