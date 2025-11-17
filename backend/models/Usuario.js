'use strict';
const { Model } = require('sequelize');
const bcrypt = require('bcrypt');

module.exports = (sequelize, DataTypes) => {
  class Usuario extends Model {
    static associate(models) {
      // Un usuario pertenece a un rol
      Usuario.belongsTo(models.Rol, {
        foreignKey: 'rol_id',
        as: 'rol'
      });

      // Un usuario puede emitir muchas facturas
      Usuario.hasMany(models.Factura, {
        foreignKey: 'usuario_id',
        as: 'facturas'
      });

      // Un usuario puede crear ingresos de inventario
      Usuario.hasMany(models.IngresoInventario, {
        foreignKey: 'usuario_id',
        as: 'ingresos_inventario'
      });
    }

    // Método para validar password
    async validarPassword(password) {
      return await bcrypt.compare(password, this.password_hash);
    }

    // Método para cambiar password
    async cambiarPassword(nuevaPassword) {
      const salt = await bcrypt.genSalt(12);
      this.password_hash = await bcrypt.hash(nuevaPassword, salt);
      return await this.save();
    }
  }

  Usuario.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nombre_completo: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 100]
      }
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
        notEmpty: true
      }
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    rol_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'roles',
        key: 'id'
      }
    },
    activo: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    ultimo_acceso: {
      type: DataTypes.DATE,
      allowNull: true
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
    modelName: 'Usuario',
    tableName: 'usuarios',
    timestamps: true,
    createdAt: 'fecha_creacion',
    updatedAt: 'fecha_actualizacion',
    hooks: {
      // Hash password antes de crear usuario
      beforeCreate: async (usuario) => {
        if (usuario.password_hash) {
          const salt = await bcrypt.genSalt(12);
          usuario.password_hash = await bcrypt.hash(usuario.password_hash, salt);
        }
      },
      // Hash password antes de actualizar si cambió
      beforeUpdate: async (usuario) => {
        if (usuario.changed('password_hash')) {
          const salt = await bcrypt.genSalt(12);
          usuario.password_hash = await bcrypt.hash(usuario.password_hash, salt);
        }
      }
    }
  });

  return Usuario;
};