const express = require('express');
const router = express.Router();
const cotizacionController = require('../controllers/cotizacionController');
const AuthMiddleware = require('../middleware/auth');

// Todas las rutas requieren autenticación
router.use(AuthMiddleware.verificarToken);

/**
 * @route   GET /api/cotizaciones
 * @desc    Listar cotizaciones con filtros y paginación
 * @access  Private
 * @query   page, limit, sucursal_id, cliente_id, estado, fecha_inicio, fecha_fin
 */
router.get('/', cotizacionController.listar);

/**
 * @route   GET /api/cotizaciones/:id
 * @desc    Obtener cotización por ID con todos sus detalles
 * @access  Private
 */
router.get('/:id', cotizacionController.obtenerPorId);

/**
 * @route   POST /api/cotizaciones
 * @desc    Crear nueva cotización
 * @access  Private
 * @body    cliente_id, sucursal_id, productos[], observaciones, vigencia_dias
 */
router.post('/', cotizacionController.crear);

/**
 * @route   PUT /api/cotizaciones/:id/anular
 * @desc    Anular una cotización
 * @access  Private
 * @body    motivo
 */
router.put('/:id/anular', cotizacionController.anular);

module.exports = router;
