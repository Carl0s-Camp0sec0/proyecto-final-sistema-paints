const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');

// Importar middlewares correctamente
const AuthMiddleware = require('../middleware/auth');
const ValidationMiddleware = require('../middleware/validation');
const AuditMiddleware = require('../middleware/audit');
const RateLimiterMiddleware = require('../middleware/rateLimiter');

/**
 * @route   POST /api/auth/login
 * @desc    Iniciar sesión
 * @access  Public
 */
router.post('/login',
  RateLimiterMiddleware.loginLimiter(),
  ValidationMiddleware.validarLogin(),
  AuditMiddleware.login(),
  AuthController.login
);

/**
 * @route   GET /api/auth/perfil
 * @desc    Obtener perfil del usuario autenticado
 * @access  Private
 */
router.get('/perfil',
  AuthMiddleware.verificarToken,
  AuthController.perfil
);

/**
 * @route   PUT /api/auth/cambiar-password
 * @desc    Cambiar contraseña del usuario
 * @access  Private
 */
router.put('/cambiar-password',
  AuthMiddleware.verificarToken,
  ValidationMiddleware.validarCambioPassword(),
  AuditMiddleware.registrarAccion('CAMBIAR_PASSWORD', 'Cambio de contraseña'),
  AuthController.cambiarPassword
);

/**
 * @route   GET /api/auth/validar-token
 * @desc    Validar token JWT
 * @access  Private
 */
router.get('/validar-token',
  AuthMiddleware.verificarToken,
  AuthController.validarToken
);

module.exports = router;