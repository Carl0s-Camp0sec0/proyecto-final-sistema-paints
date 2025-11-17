'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Factura extends Model {
    static associate(models) {
      // Una factura pertenece a una serie
      Factura.belongsTo(models.SerieFactura, {
        foreignKey: 'serie_factura_id',
        as: 'serie_factura'
      });

      // Una factura pertenece a un cliente
      Factura.belongsTo(models.Cliente, {
        foreignKey: 'cliente_id',
        as: 'cliente'
      });

      // Una factura pertenece a una sucursal
      Factura.belongsTo(models.Sucursal, {
        foreignKey: 'sucursal_id',
        as: 'sucursal'
      });

      // Una factura es emitida por un usuario
      Factura.belongsTo(models.Usuario, {
        foreignKey: 'usuario_id',
        as: 'usuario'
      });

      // Una factura puede originarse de una cotización
      Factura.belongsTo(models.Cotizacion, {
        foreignKey: 'cotizacion_id',
        as: 'cotizacion'
      });

      // Una factura puede tener muchos detalles
      Factura.hasMany(models.FacturaDetalle, {
        foreignKey: 'factura_id',
        as: 'detalles'
      });

      // Una factura puede tener muchos pagos
      Factura.hasMany(models.FacturaPago, {
        foreignKey: 'factura_id',
        as: 'pagos'
      });
    }

    // Método para calcular total desde detalles
    async calcularTotal() {
      const detalles = await this.getDetalles();
      const subtotalCalculado = detalles.reduce((sum, detalle) => {
        return sum + parseFloat(detalle.subtotal || 0);
      }, 0);
      
      this.subtotal = subtotalCalculado;
      this.total = subtotalCalculado - this.descuento + this.impuestos;
      await this.save();
      
      return this.total;
    }

    // Método para verificar si está completamente pagada
    async estaPagada() {
      const pagos = await this.getPagos();
      const totalPagado = pagos.reduce((sum, pago) => {
        return sum + parseFloat(pago.monto || 0);
      }, 0);
      
      return Math.abs(totalPagado - this.total) < 0.01; // Tolerance for decimal precision
    }

    // Método para obtener saldo pendiente
    async getSaldoPendiente() {
      const pagos = await this.getPagos();
      const totalPagado = pagos.reduce((sum, pago) => {
        return sum + parseFloat(pago.monto || 0);
      }, 0);
      
      return Math.max(0, this.total - totalPagado);
    }

    // Método para anular factura
    async anular(motivoAnulacion, usuarioId) {
      if (this.estado === 'anulada') {
        throw new Error('La factura ya está anulada');
      }

      // Restaurar inventario
      const detalles = await this.getDetalles();
      for (const detalle of detalles) {
        const inventario = await sequelize.models.InventarioSucursal.findOne({
          where: {
            sucursal_id: this.sucursal_id,
            producto_id: detalle.producto_id,
            unidad_medida_id: detalle.unidad_medida_id
          }
        });

        if (inventario) {
          await inventario.incrementarStock(detalle.cantidad);
        }
      }

      // Actualizar estado de la factura
      this.estado = 'anulada';
      this.fecha_anulacion = new Date();
      this.motivo_anulacion = motivoAnulacion;
      this.total = 0; // Según requerimientos, el monto debe aparecer en cero
      await this.save();

      return true;
    }

    // Método para obtener número de factura virtual
    get numero_factura_completo() {
      if (this.letra_serie && this.numero_correlativo) {
        return `${this.letra_serie}${String(this.numero_correlativo).padStart(8, '0')}`;
      }
      return null;
    }
  }

  Factura.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    numero_correlativo: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    letra_serie: {
      type: DataTypes.CHAR(1),
      allowNull: false
    },
    numero_factura: {
      type: DataTypes.VIRTUAL,
      get() {
        return this.numero_factura_completo;
      }
    },
    serie_factura_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'series_facturas',
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
      allowNull: false,
      references: {
        model: 'usuarios',
        key: 'id'
      },
      comment: 'Usuario que emite la factura'
    },
    cotizacion_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'cotizaciones',
        key: 'id'
      },
      comment: 'Cotización origen si aplica'
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
    impuestos: {
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
    estado: {
      type: DataTypes.ENUM('activa', 'anulada'),
      defaultValue: 'activa'
    },
    fecha_anulacion: {
      type: DataTypes.DATE,
      allowNull: true
    },
    motivo_anulacion: {
      type: DataTypes.TEXT,
      allowNull: true
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
    modelName: 'Factura',
    tableName: 'facturas',
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['serie_factura_id', 'numero_correlativo']
      },
      {
        fields: ['letra_serie', 'numero_correlativo']
      },
      {
        fields: ['fecha_creacion', 'estado']
      }
    ]
  });

  return Factura;
};