require('dotenv').config();

module.exports = {
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    refreshExpiresIn: '7d'
  },
  bcrypt: {
    rounds: parseInt(process.env.BCRYPT_ROUNDS) || 12
  },
  session: {
    maxSessions: 3, // Máximo de sesiones simultáneas por usuario
    cleanupInterval: '1h' // Limpiar sesiones expiradas cada hora
  }
};