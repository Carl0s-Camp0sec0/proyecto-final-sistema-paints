'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Producto extends Model {
    static associate(models) {
      // Un producto pertenece a una categoría
      Producto.belongsTo(models.Categoria, {
        foreignKey: 'categoria_id',
        as: 'categoria'
      });

      // Un producto puede tener detalles específicos para pinturas
      Producto.hasOne(models.ProductoDetallePintura, {
        foreignKey: 'producto_id',
        as: 'detalle_pintura'
      });

      // Un producto puede tener detalles específicos para accesorios
      Producto.hasOne(models.ProductoDetalleAccesorio, {
        foreignKey: 'producto_id',
        as: 'detalle_accesorio'
      });

      // Un producto puede tener muchas variaciones (diferentes medidas/precios)
      Producto.hasMany(models.ProductoVariacion, {
        foreignKey: 'producto_id',
        as: 'variaciones'
      });

      // Un producto puede estar en inventarios
      Producto.hasMany(models.InventarioSucursal, {
        foreignKey: 'producto_id',
        as: 'inventarios'
      });

      // Un producto puede estar en facturas
      Producto.hasMany(models.FacturaDetalle, {
        foreignKey: 'producto_id',
        as: 'facturas_detalle'
      });
    }

    // Método para obtener precio según unidad de medida
    async obtenerPrecio(unidadMedidaId) {
      const variacion = await this.getVariaciones({
        where: { unidad_medida_id: unidadMedidaId, activo: true }
      });
      
      if (variacion.length > 0) {
        return variacion[0].precio_venta;
      }
      
      return this.precio_base;
    }

    // Método para verificar stock en sucursal
    async verificarStock(sucursalId, unidadMedidaId, cantidad = 1) {
      const inventario = await this.getInventarios({
        where: { 
          sucursal_id: sucursalId, 
          unidad_medida_id: unidadMedidaId 
        }
      });
      
      if (inventario.length > 0) {
        return inventario[0].stock_disponible >= cantidad;
      }
      
      return false;
    }
  }

  Producto.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    categoria_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'categorias',
        key: 'id'
      }
    },
    nombre: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 100]
      }
    },
    marca: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    codigo_producto: {
      type: DataTypes.STRING(50),
      allowNull: true,
      unique: true,
      comment: 'Código interno del producto'
    },
    precio_base: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0
      },
      comment: 'Precio base del producto'
    },
    descuento_porcentaje: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0,
      validate: {
        min: 0,
        max: 100
      },
      comment: 'Porcentaje de descuento aplicable'
    },
    stock_minimo: {
      type: DataTypes.INTEGER,
      defaultValue: 10,
      validate: {
        min: 0
      },
      comment: 'Cantidad mínima de stock requerida'
    },
    activo: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    fecha_creacion: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    fecha_actualizacion: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'Producto',
    tableName: 'productos',
    timestamps: true,
    createdAt: 'fecha_creacion',
    updatedAt: 'fecha_actualizacion',
    indexes: [
      {
        fields: ['categoria_id']
      },
      {
        fields: ['activo']
      },
      {
        unique: true,
        fields: ['codigo_producto']
      }
    ]
  });

  return Producto;
};