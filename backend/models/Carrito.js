'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Carrito extends Model {
    static associate(models) {
      // Un item de carrito pertenece a un cliente
      Carrito.belongsTo(models.Cliente, {
        foreignKey: 'cliente_id',
        as: 'cliente'
      });

      // Un item de carrito pertenece a una sucursal
      Carrito.belongsTo(models.Sucursal, {
        foreignKey: 'sucursal_id',
        as: 'sucursal'
      });

      // Un item de carrito pertenece a un producto
      Carrito.belongsTo(models.Producto, {
        foreignKey: 'producto_id',
        as: 'producto'
      });

      // Un item de carrito pertenece a una unidad de medida
      Carrito.belongsTo(models.UnidadMedida, {
        foreignKey: 'unidad_medida_id',
        as: 'unidad_medida'
      });
    }

    // Método para calcular subtotal del item
    getSubtotal() {
      return this.cantidad * this.precio_unitario;
    }

    // Método para verificar disponibilidad del stock
    async verificarDisponibilidad() {
      const inventario = await sequelize.models.InventarioSucursal.findOne({
        where: {
          sucursal_id: this.sucursal_id,
          producto_id: this.producto_id,
          unidad_medida_id: this.unidad_medida_id
        }
      });

      return inventario && inventario.stock_disponible >= this.cantidad;
    }
  }

  Carrito.init({
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
    sucursal_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'sucursales',
        key: 'id'
      },
      comment: 'Sucursal donde se realizará la compra'
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
    cantidad: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1
      }
    },
    precio_unitario: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0
      },
      comment: 'Precio al momento de agregar al carrito'
    },
    fecha_creacion: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'Carrito',
    tableName: 'carrito',
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['cliente_id', 'producto_id', 'unidad_medida_id', 'sucursal_id']
      }
    ]
  });

  return Carrito;
};