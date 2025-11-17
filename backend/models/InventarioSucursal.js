'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class InventarioSucursal extends Model {
    static associate(models) {
      // Un inventario pertenece a una sucursal
      InventarioSucursal.belongsTo(models.Sucursal, {
        foreignKey: 'sucursal_id',
        as: 'sucursal'
      });

      // Un inventario pertenece a un producto
      InventarioSucursal.belongsTo(models.Producto, {
        foreignKey: 'producto_id',
        as: 'producto'
      });

      // Un inventario pertenece a una unidad de medida
      InventarioSucursal.belongsTo(models.UnidadMedida, {
        foreignKey: 'unidad_medida_id',
        as: 'unidad_medida'
      });
    }

    // Método para verificar si está bajo stock mínimo
    estaEnStockBajo() {
      return this.stock_actual <= (this.producto?.stock_minimo || 0);
    }

    // Método para decrementar stock
    async decrementarStock(cantidad) {
      if (this.stock_disponible >= cantidad) {
        this.stock_actual -= cantidad;
        await this.save();
        return true;
      }
      return false;
    }

    // Método para incrementar stock
    async incrementarStock(cantidad) {
      this.stock_actual += cantidad;
      await this.save();
      return true;
    }
  }

  InventarioSucursal.init({
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
    producto_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'productos',
        key: 'id'
      }
    },
    unidad_medida_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'unidades_medida',
        key: 'id'
      }
    },
    stock_actual: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    stock_reservado: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0
      },
      comment: 'Stock reservado en cotizaciones pendientes'
    },
    stock_disponible: {
      type: DataTypes.VIRTUAL,
      get() {
        return this.stock_actual - this.stock_reservado;
      }
    },
    fecha_actualizacion: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'InventarioSucursal',
    tableName: 'inventario_sucursal',
    timestamps: true,
    createdAt: false,
    updatedAt: 'fecha_actualizacion',
    indexes: [
      {
        unique: true,
        fields: ['sucursal_id', 'producto_id', 'unidad_medida_id']
      },
      {
        fields: ['sucursal_id', 'producto_id']
      }
    ]
  });

  return InventarioSucursal;
};