module.exports = (sequelize, DataTypes) => {
    const Configuracion = sequelize.define('Configuracion', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        clave: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true,
            comment: 'Clave única de la configuración'
        },
        valor: {
            type: DataTypes.TEXT,
            allowNull: false,
            comment: 'Valor de la configuración (puede ser JSON)'
        },
        descripcion: {
            type: DataTypes.TEXT,
            comment: 'Descripción de para qué sirve la configuración'
        },
        tipo_dato: {
            type: DataTypes.ENUM('string', 'number', 'boolean', 'json'),
            defaultValue: 'string',
            comment: 'Tipo de dato del valor'
        },
        categoria: {
            type: DataTypes.STRING(50),
            defaultValue: 'general',
            comment: 'Categoría de la configuración'
        },
        fecha_creacion: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
            field: 'fecha_creacion'
        },
        fecha_actualizacion: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
            field: 'fecha_actualizacion'
        }
    }, {
        tableName: 'configuraciones',
        timestamps: false,
        hooks: {
            beforeUpdate: (configuracion) => {
                configuracion.fecha_actualizacion = new Date();
            }
        }
    });

    // Método para obtener valor con conversión de tipo
    Configuracion.prototype.getValor = function() {
        switch (this.tipo_dato) {
            case 'number':
                return parseFloat(this.valor);
            case 'boolean':
                return this.valor === 'true' || this.valor === '1';
            case 'json':
                try {
                    return JSON.parse(this.valor);
                } catch (error) {
                    console.error('Error parsing JSON:', error);
                    return null;
                }
            default:
                return this.valor;
        }
    };

    // Método estático para obtener configuración por clave
    Configuracion.getPorClave = async function(clave, valorPorDefecto = null) {
        try {
            const config = await this.findOne({ where: { clave } });
            return config ? config.getValor() : valorPorDefecto;
        } catch (error) {
            console.error(`Error obteniendo configuración ${clave}:`, error);
            return valorPorDefecto;
        }
    };

    // Método estático para establecer configuración
    Configuracion.setPorClave = async function(clave, valor, tipo_dato = 'string', descripcion = null) {
        try {
            const valorStr = tipo_dato === 'json' ? JSON.stringify(valor) : String(valor);

            const [config, created] = await this.findOrCreate({
                where: { clave },
                defaults: {
                    clave,
                    valor: valorStr,
                    tipo_dato,
                    descripcion
                }
            });

            if (!created) {
                await config.update({
                    valor: valorStr,
                    tipo_dato,
                    descripcion: descripcion || config.descripcion
                });
            }

            return config;
        } catch (error) {
            console.error(`Error estableciendo configuración ${clave}:`, error);
            throw error;
        }
    };

    // Método estático para obtener todas las configuraciones de una categoría
    Configuracion.getPorCategoria = async function(categoria) {
        try {
            const configs = await this.findAll({
                where: { categoria },
                order: [['clave', 'ASC']]
            });

            return configs.reduce((obj, config) => {
                obj[config.clave] = config.getValor();
                return obj;
            }, {});
        } catch (error) {
            console.error(`Error obteniendo configuraciones de categoría ${categoria}:`, error);
            return {};
        }
    };

    return Configuracion;
};
