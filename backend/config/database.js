require('dotenv').config();

module.exports = {
  development: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mysql',
    timezone: '-06:00', // Guatemala timezone
    dialectOptions: {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
      useUTC: false,
      dateStrings: true,
      typeCast: true
    },
    define: {
      timestamps: true,
      underscored: false,
      createdAt: 'fecha_creacion',
      updatedAt: 'fecha_actualizacion',
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci'
    },
    logging: console.log, // Mostrar queries en desarrollo
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  },
  test: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME + '_test',
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mysql',
    logging: false
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mysql',
    dialectOptions: {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci'
    },
    define: {
      timestamps: true,
      underscored: false,
      createdAt: 'fecha_creacion',
      updatedAt: 'fecha_actualizacion'
    },
    logging: false,
    pool: {
      max: 15,
      min: 5,
      acquire: 30000,
      idle: 10000
    }
  }
};