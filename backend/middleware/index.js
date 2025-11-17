// Exportar todos los middlewares desde un solo archivo
const AuthMiddleware = require('./auth');
const ValidationMiddleware = require('./validation');
const AuditMiddleware = require('./audit');
const RateLimiterMiddleware = require('./rateLimiter');

module.exports = {
  // Autenticación
  Auth: AuthMiddleware,
  
  // Validación
  Validation: ValidationMiddleware,
  
  // Auditoría
  Audit: AuditMiddleware,
  
  // Rate Limiting
  RateLimit: RateLimiterMiddleware
};