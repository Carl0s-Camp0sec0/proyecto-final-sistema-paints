'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Comunicacion extends Model {
    static associate(models) {
      // Una comunicación es creada por un usuario
      Comunicacion.belongsTo(models.Usuario, {
        foreignKey: 'usuario_id',
        as: 'usuario'
      });

      // Una comunicación puede tener muchos destinatarios
      Comunicacion.hasMany(models.ComunicacionCliente, {
        foreignKey: 'comunicacion_id',
        as: 'destinatarios'
      });
    }
  }

  Comunicacion.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    titulo: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    mensaje: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    tipo_contenido: {
      type: DataTypes.ENUM('mensaje', 'imagen', 'pdf'),
      defaultValue: 'mensaje'
    },
    archivo_adjunto: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Ruta del archivo adjunto'
    },
    usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'usuarios',
        key: 'id'
      }
    },
    estado: {
      type: DataTypes.ENUM('borrador', 'enviado', 'cancelado'),
      defaultValue: 'borrador'
    },
    fecha_programada: {
      type: DataTypes.DATE,
      allowNull: true
    },
    fecha_envio: {
      type: DataTypes.DATE,
      allowNull: true
    },
    fecha_creacion: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'Comunicacion',
    tableName: 'comunicaciones',
    timestamps: false
  });

  return Comunicacion;
};