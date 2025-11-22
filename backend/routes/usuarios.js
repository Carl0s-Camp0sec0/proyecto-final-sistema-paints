const express = require('express');
const router = express.Router();
const { Usuario, Rol } = require('../models');
const AuthMiddleware = require('../middleware/auth');
const UsuarioController = require('../controllers/usuarioController');

/**
 * @route   GET /api/usuarios
 * @desc    Listar usuarios
 * @access  Private
 */
router.get('/',
  AuthMiddleware.verificarToken,
  UsuarioController.listar
);

/**
 * @route   GET /api/usuarios/estadisticas/general
 * @desc    Obtener estadísticas de usuarios
 * @access  Private
 */
router.get('/estadisticas/general',
  AuthMiddleware.verificarToken,
  UsuarioController.estadisticas
);

/**
 * @route   GET /api/usuarios/:id
 * @desc    Obtener usuario por ID
 * @access  Private
 */
router.get('/:id',
  AuthMiddleware.verificarToken,
  UsuarioController.obtenerPorId
);

/**
 * @route   POST /api/usuarios
 * @desc    Crear nuevo usuario
 * @access  Private (Solo Admin)
 */
router.post('/',
  AuthMiddleware.verificarToken,
  UsuarioController.crear
);

/**
 * @route   PUT /api/usuarios/:id
 * @desc    Actualizar usuario
 * @access  Private (Solo Admin)
 */
router.put('/:id',
  AuthMiddleware.verificarToken,
  UsuarioController.actualizar
);

/**
 * @route   DELETE /api/usuarios/:id
 * @desc    Eliminar usuario (soft delete)
 * @access  Private (Solo Admin)
 */
router.delete('/:id',
  AuthMiddleware.verificarToken,
  UsuarioController.eliminar
);

module.exports = router;
