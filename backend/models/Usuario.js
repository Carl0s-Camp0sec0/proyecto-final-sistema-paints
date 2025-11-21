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

    // Método para cambiar password - CON CONTROL MANUAL
    async cambiarPassword(nuevaPassword) {
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(nuevaPassword, salt);
      
      // Actualizar SIN activar hooks
      await this.update({ 
        password_hash: hashedPassword 
      }, { 
        hooks: false // ← CRÍTICO: Desactivar hooks para esta operación
      });
      
      return true;
    }

    // Método estático para crear usuario con password
    static async crearUsuario(datosUsuario) {
      const { password, ...otrosDatos } = datosUsuario;
      
      // Hash del password MANUAL
      const salt = await bcrypt.genSalt(12);
      const password_hash = await bcrypt.hash(password, salt);
      
      // Crear usuario SIN hooks
      return await Usuario.create({
        ...otrosDatos,
        password_hash
      }, { hooks: false });
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
    updatedAt: 'fecha_actualizacion'
    // ✅ HOOKS REMOVIDOS COMPLETAMENTE
    // Los hooks automáticos causaban double hashing
    // Ahora usamos métodos manuales para control total
  });

  return Usuario;
};