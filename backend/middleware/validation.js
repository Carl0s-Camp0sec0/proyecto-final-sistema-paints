const { validationResult, body, param, query } = require('express-validator');

class ValidationMiddleware {
  // Middleware para verificar errores de validación
  static verificarErrores(req, res, next) {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Errores de validación',
        errors: errors.array()
      });
    }
    
    next();
  }

  // Validaciones para login
  static validarLogin() {
    return [
      body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Email debe ser válido'),
      body('password')
        .isLength({ min: 6 })
        .withMessage('Contraseña debe tener al menos 6 caracteres'),
      ValidationMiddleware.verificarErrores
    ];
  }

  // Validaciones para crear cliente
  static validarCliente() {
    return [
      body('nombre_completo')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Nombre debe tener entre 2 y 100 caracteres'),
      body('email')
        .optional()
        .isEmail()
        .normalizeEmail()
        .withMessage('Email debe ser válido'),
      body('telefono')
        .optional()
        .isLength({ min: 8 })
        .withMessage('Teléfono debe ser válido'),
      body('latitud')
        .optional()
        .isFloat({ min: -90, max: 90 })
        .withMessage('Latitud debe estar entre -90 y 90'),
      body('longitud')
        .optional()
        .isFloat({ min: -180, max: 180 })
        .withMessage('Longitud debe estar entre -180 y 180'),
      ValidationMiddleware.verificarErrores
    ];
  }

  // Validaciones para crear producto
  static validarProducto() {
    return [
      body('categoria_id')
        .isInt({ min: 1 })
        .withMessage('Categoría es requerida'),
      body('nombre')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Nombre debe tener entre 2 y 100 caracteres'),
      body('precio_base')
        .isFloat({ min: 0.01 })
        .withMessage('Precio base debe ser mayor a 0'),
      body('descuento_porcentaje')
        .optional()
        .isFloat({ min: 0, max: 100 })
        .withMessage('Descuento debe estar entre 0 y 100'),
      body('stock_minimo')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Stock mínimo debe ser un número positivo'),
      ValidationMiddleware.verificarErrores
    ];
  }

  // Validaciones para parámetros ID
  static validarId(campo = 'id') {
    return [
      param(campo)
        .isInt({ min: 1 })
        .withMessage(`${campo} debe ser un número entero positivo`),
      ValidationMiddleware.verificarErrores
    ];
  }

  // Validaciones para paginación
  static validarPaginacion() {
    return [
      query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Página debe ser un número entero positivo'),
      query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Límite debe estar entre 1 y 100'),
      ValidationMiddleware.verificarErrores
    ];
  }

  // Validaciones para geolocalización
  static validarGeolocalizacion() {
    return [
      query('latitud')
        .isFloat({ min: -90, max: 90 })
        .withMessage('Latitud debe estar entre -90 y 90'),
      query('longitud')
        .isFloat({ min: -180, max: 180 })
        .withMessage('Longitud debe estar entre -180 y 180'),
      ValidationMiddleware.verificarErrores
    ];
  }

  // Validaciones para cambiar contraseña
  static validarCambioPassword() {
    return [
      body('password_actual')
        .notEmpty()
        .withMessage('Contraseña actual es requerida'),
      body('password_nueva')
        .isLength({ min: 6 })
        .withMessage('Nueva contraseña debe tener al menos 6 caracteres'),
      body('confirmar_password')
        .custom((value, { req }) => {
          if (value !== req.body.password_nueva) {
            throw new Error('Las contraseñas no coinciden');
          }
          return true;
        }),
      ValidationMiddleware.verificarErrores
    ];
  }

  // Validaciones para ajuste de stock
  static validarAjusteStock() {
    return [
      body('cantidad_nueva')
        .isInt({ min: 0 })
        .withMessage('Cantidad nueva debe ser un número entero positivo'),
      body('motivo')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Motivo no puede exceder 500 caracteres'),
      ValidationMiddleware.verificarErrores
    ];
  }

  // Exportar body, param, query para usar en otras rutas
  static body = body;
  static param = param;
  static query = query;
}

module.exports = ValidationMiddleware;