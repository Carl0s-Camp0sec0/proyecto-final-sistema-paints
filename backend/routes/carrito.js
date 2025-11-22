const express = require('express');
const router = express.Router();
const carritoController = require('../controllers/carritoController');
const AuthMiddleware = require('../middleware/auth');

// Todas las rutas requieren autenticación (solo clientes)
router.use(AuthMiddleware.verificarToken);

/**
 * @route   GET /api/carrito
 * @desc    Obtener carrito del cliente autenticado
 * @access  Private (Cliente)
 */
router.get('/', carritoController.obtenerCarrito);

/**
 * @route   POST /api/carrito
 * @desc    Agregar producto al carrito
 * @access  Private (Cliente)
 * @body    sucursal_id, producto_id, unidad_medida_id, cantidad
 */
router.post('/', carritoController.agregar);

/**
 * @route   PUT /api/carrito/:id
 * @desc    Actualizar cantidad de un item del carrito
 * @access  Private (Cliente)
 * @body    cantidad
 */
router.put('/:id', carritoController.actualizar);

/**
 * @route   DELETE /api/carrito/:id
 * @desc    Eliminar item específico del carrito
 * @access  Private (Cliente)
 */
router.delete('/:id', carritoController.eliminar);

/**
 * @route   DELETE /api/carrito
 * @desc    Vaciar carrito completo
 * @access  Private (Cliente)
 */
router.delete('/', carritoController.vaciar);

module.exports = router;
