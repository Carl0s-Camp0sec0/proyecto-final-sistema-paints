'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class FacturaDetalle extends Model {
    static associate(models) {
      // Un detalle pertenece a una factura
      FacturaDetalle.belongsTo(models.Factura, {
        foreignKey: 'factura_id',
        as: 'factura'
      });

      // Un detalle pertenece a un producto
      FacturaDetalle.belongsTo(models.Producto, {
        foreignKey: 'producto_id',
        as: 'producto'
      });

      // Un detalle pertenece a una unidad de medida
      FacturaDetalle.belongsTo(models.UnidadMedida, {
        foreignKey: 'unidad_medida_id',
        as: 'unidadMedida'
      });
    }

    // Método para calcular precio con descuento
    getPrecioConDescuento() {
      if (this.descuento_porcentaje > 0) {
        const descuento = (this.precio_unitario * this.descuento_porcentaje) / 100;
        return this.precio_unitario - descuento;
      }
      return this.precio_unitario;
    }

    // Método para calcular descuento en monto
    getMontoDescuento() {
      if (this.descuento_porcentaje > 0) {
        return (this.precio_unitario * this.descuento_porcentaje) / 100 * this.cantidad;
      }
      return 0;
    }

    // Método para verificar disponibilidad antes de facturar
    async verificarDisponibilidad() {
      const factura = await this.getFactura({ include: ['sucursal'] });
      
      const inventario = await sequelize.models.InventarioSucursal.findOne({
        where: {
          sucursal_id: factura.sucursal_id,
          producto_id: this.producto_id,
          unidad_medida_id: this.unidad_medida_id
        }
      });

      return inventario && inventario.stock_disponible >= this.cantidad;
    }
  }

  FacturaDetalle.init({
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
      }
    },
    descuento_porcentaje: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0,
      validate: {
        min: 0,
        max: 100
      }
    },
    subtotal: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    fecha_creacion: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'FacturaDetalle',
    tableName: 'facturas_detalle',
    timestamps: false,
    hooks: {
      beforeValidate: (detalle) => {
        // Calcular subtotal automáticamente
        if (detalle.cantidad && detalle.precio_unitario) {
          let precioFinal = detalle.precio_unitario;
          
          // Aplicar descuento si existe
          if (detalle.descuento_porcentaje > 0) {
            const descuento = (precioFinal * detalle.descuento_porcentaje) / 100;
            precioFinal -= descuento;
          }
          
          detalle.subtotal = detalle.cantidad * precioFinal;
        }
      },
      afterCreate: async (detalle) => {
        // Actualizar inventario después de crear el detalle
        const factura = await detalle.getFactura();
        
        if (factura && factura.estado === 'activa') {
          const inventario = await sequelize.models.InventarioSucursal.findOne({
            where: {
              sucursal_id: factura.sucursal_id,
              producto_id: detalle.producto_id,
              unidad_medida_id: detalle.unidad_medida_id
            }
          });

          if (inventario) {
            await inventario.decrementarStock(detalle.cantidad);
          }
        }
      }
    }
  });

  return FacturaDetalle;
};