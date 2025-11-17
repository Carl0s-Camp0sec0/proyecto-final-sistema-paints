const rateLimit = require('express-rate-limit');

class RateLimiterMiddleware {
  // Rate limiter para login (más restrictivo)
  static loginLimiter() {
    return rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutos
      max: 5, // Máximo 5 intentos por IP
      message: {
        success: false,
        message: 'Demasiados intentos de login. Intenta de nuevo en 15 minutos.'
      },
      standardHeaders: true,
      legacyHeaders: false,
    });
  }

  // Rate limiter para API general
  static apiLimiter() {
    return rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutos
      max: 100, // Máximo 100 requests por IP
      message: {
        success: false,
        message: 'Demasiadas solicitudes desde esta IP. Intenta de nuevo más tarde.'
      },
      standardHeaders: true,
      legacyHeaders: false,
    });
  }

  // Rate limiter para operaciones críticas
  static operacionesCriticas() {
    return rateLimit({
      windowMs: 5 * 60 * 1000, // 5 minutos
      max: 10, // Máximo 10 operaciones críticas por IP
      message: {
        success: false,
        message: 'Demasiadas operaciones críticas. Intenta de nuevo en 5 minutos.'
      },
      standardHeaders: true,
      legacyHeaders: false,
    });
  }

  // Rate limiter para reportes
  static reportesLimiter() {
    return rateLimit({
      windowMs: 60 * 1000, // 1 minuto
      max: 5, // Máximo 5 reportes por minuto
      message: {
        success: false,
        message: 'Demasiadas solicitudes de reportes. Intenta de nuevo en 1 minuto.'
      },
      standardHeaders: true,
      legacyHeaders: false,
    });
  }
}

module.exports = RateLimiterMiddleware;