module.exports = (sequelize, DataTypes) => {
    const Backup = sequelize.define('Backup', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        nombre_archivo: {
            type: DataTypes.STRING(255),
            allowNull: false,
            comment: 'Nombre del archivo de backup'
        },
        tipo_backup: {
            type: DataTypes.ENUM('completo', 'diferencial', 'incremental'),
            allowNull: false,
            comment: 'Tipo de backup realizado'
        },
        ruta_archivo: {
            type: DataTypes.TEXT,
            allowNull: false,
            comment: 'Ruta completa donde se guardó el backup'
        },
        tamano_bytes: {
            type: DataTypes.BIGINT,
            comment: 'Tamaño del archivo en bytes'
        },
        usuario_id: {
            type: DataTypes.INTEGER,
            comment: 'Usuario que ejecutó el backup'
        },
        estado: {
            type: DataTypes.ENUM('en_proceso', 'completado', 'fallido'),
            defaultValue: 'en_proceso',
            comment: 'Estado del backup'
        },
        tiempo_duracion: {
            type: DataTypes.INTEGER,
            comment: 'Duración en segundos'
        },
        fecha_inicio: {
            type: DataTypes.DATE,
            allowNull: false,
            comment: 'Fecha y hora de inicio del backup'
        },
        fecha_fin: {
            type: DataTypes.DATE,
            comment: 'Fecha y hora de finalización del backup'
        },
        observaciones: {
            type: DataTypes.TEXT,
            comment: 'Observaciones o mensajes de error'
        }
    }, {
        tableName: 'backups',
        timestamps: false,
        indexes: [
            {
                name: 'idx_fecha_tipo',
                fields: ['fecha_inicio', 'tipo_backup']
            }
        ]
    });

    Backup.associate = (models) => {
        Backup.belongsTo(models.Usuario, {
            foreignKey: 'usuario_id',
            as: 'usuario'
        });
    };

    // Método para marcar como completado
    Backup.prototype.marcarCompletado = async function(tamanoBytes, observaciones = null) {
        const fechaFin = new Date();
        const duracion = Math.floor((fechaFin - this.fecha_inicio) / 1000);

        return await this.update({
            estado: 'completado',
            tamano_bytes: tamanoBytes,
            fecha_fin: fechaFin,
            tiempo_duracion: duracion,
            observaciones: observaciones
        });
    };

    // Método para marcar como fallido
    Backup.prototype.marcarFallido = async function(mensajeError) {
        const fechaFin = new Date();
        const duracion = Math.floor((fechaFin - this.fecha_inicio) / 1000);

        return await this.update({
            estado: 'fallido',
            fecha_fin: fechaFin,
            tiempo_duracion: duracion,
            observaciones: mensajeError
        });
    };

    // Método estático para iniciar un backup
    Backup.iniciar = async function(datos) {
        return await this.create({
            nombre_archivo: datos.nombreArchivo,
            tipo_backup: datos.tipo || 'completo',
            ruta_archivo: datos.ruta,
            usuario_id: datos.usuarioId,
            estado: 'en_proceso',
            fecha_inicio: new Date()
        });
    };

    // Método estático para limpiar backups antiguos
    Backup.limpiarAntiguos = async function(diasRetencion = 30) {
        const { Op } = require('sequelize');
        const fechaLimite = new Date();
        fechaLimite.setDate(fechaLimite.getDate() - diasRetencion);

        const backupsAntiguos = await this.findAll({
            where: {
                fecha_inicio: {
                    [Op.lt]: fechaLimite
                },
                estado: 'completado'
            }
        });

        // Aquí se debería agregar lógica para eliminar los archivos físicos
        // antes de eliminar los registros de la BD

        await this.destroy({
            where: {
                fecha_inicio: {
                    [Op.lt]: fechaLimite
                },
                estado: 'completado'
            }
        });

        return backupsAntiguos.length;
    };

    // Método para obtener tamaño formateado
    Backup.prototype.getTamanoFormateado = function() {
        if (!this.tamano_bytes) return 'Desconocido';

        const bytes = this.tamano_bytes;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        if (bytes === 0) return '0 Bytes';

        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    };

    return Backup;
};
