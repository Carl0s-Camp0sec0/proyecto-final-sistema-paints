module.exports = (sequelize, DataTypes) => {
    const LogAcceso = sequelize.define('LogAcceso', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        usuario_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: 'ID del usuario si el acceso fue exitoso'
        },
        email_intento: {
            type: DataTypes.STRING(100),
            allowNull: false,
            comment: 'Email usado en el intento de login'
        },
        ip_address: {
            type: DataTypes.STRING(45),
            comment: 'Dirección IP del cliente'
        },
        user_agent: {
            type: DataTypes.TEXT,
            comment: 'User agent del navegador'
        },
        acceso_exitoso: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            comment: 'Indica si el login fue exitoso'
        },
        motivo_fallo: {
            type: DataTypes.STRING(100),
            comment: 'Razón del fallo si acceso_exitoso es false'
        },
        fecha_creacion: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
            field: 'fecha_creacion'
        }
    }, {
        tableName: 'logs_acceso',
        timestamps: false,
        indexes: [
            {
                name: 'idx_fecha_usuario',
                fields: ['fecha_creacion', 'usuario_id']
            },
            {
                name: 'idx_acceso_exitoso',
                fields: ['acceso_exitoso']
            },
            {
                name: 'idx_ip_address',
                fields: ['ip_address']
            }
        ]
    });

    LogAcceso.associate = (models) => {
        LogAcceso.belongsTo(models.Usuario, {
            foreignKey: 'usuario_id',
            as: 'usuario'
        });
    };

    // Método estático para registrar intento de login
    LogAcceso.registrarIntento = async function(datos) {
        try {
            return await this.create({
                usuario_id: datos.usuario_id || null,
                email_intento: datos.email,
                ip_address: datos.ip,
                user_agent: datos.userAgent,
                acceso_exitoso: datos.exitoso,
                motivo_fallo: datos.motivo || null
            });
        } catch (error) {
            console.error('Error registrando log de acceso:', error);
            // No lanzar error para no interrumpir el flujo de login
        }
    };

    // Método estático para obtener intentos fallidos recientes
    LogAcceso.getIntentosFallidos = async function(email, minutos = 15) {
        const { Op } = require('sequelize');
        const fechaLimite = new Date(Date.now() - minutos * 60 * 1000);

        return await this.count({
            where: {
                email_intento: email,
                acceso_exitoso: false,
                fecha_creacion: {
                    [Op.gte]: fechaLimite
                }
            }
        });
    };

    // Método estático para verificar si una IP está bloqueada
    LogAcceso.ipBloqueada = async function(ip, intentosMaximos = 5, minutos = 15) {
        const { Op } = require('sequelize');
        const fechaLimite = new Date(Date.now() - minutos * 60 * 1000);

        const intentos = await this.count({
            where: {
                ip_address: ip,
                acceso_exitoso: false,
                fecha_creacion: {
                    [Op.gte]: fechaLimite
                }
            }
        });

        return intentos >= intentosMaximos;
    };

    return LogAcceso;
};
