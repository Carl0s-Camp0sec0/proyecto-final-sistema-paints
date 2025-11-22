const express = require('express');
const router = express.Router();
const { Cliente, Sucursal } = require('../models');
const AuthMiddleware = require('../middleware/auth');
const ClienteController = require('../controllers/clienteController');
const jwt = require('jsonwebtoken');

/**
 * @route   GET /api/clientes
 * @desc    Listar clientes
 * @access  Private
 */
router.get('/',
  AuthMiddleware.verificarToken,
  async (req, res) => {
    try {
      console.log('👥 Listando clientes...');
      
      const {
        page = 1,
        limit = 10,
        buscar,
        nit
      } = req.query;

      const offset = (page - 1) * limit;
      const whereClause = { activo: true };

      // Búsqueda por NIT específico (búsqueda exacta)
      if (nit) {
        whereClause.nit = nit;
      }
      // Búsqueda general (búsqueda parcial)
      else if (buscar) {
        const { Op } = require('sequelize');
        whereClause[Op.or] = [
          { nombre_completo: { [Op.like]: `%${buscar}%` } },
          { nit: { [Op.like]: `%${buscar}%` } },
          { email: { [Op.like]: `%${buscar}%` } },
          { telefono: { [Op.like]: `%${buscar}%` } }
        ];
      }

      const clientes = await Cliente.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['nombre_completo', 'ASC']],
        attributes: { exclude: ['latitud', 'longitud'] } // Excluir coordenadas por privacidad
      });

      console.log(`✅ ${clientes.count} clientes encontrados`);

      res.json({
        success: true,
        data: clientes.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: clientes.count,
          pages: Math.ceil(clientes.count / limit)
        }
      });

    } catch (error) {
      console.error('❌ Error listando clientes:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * @route   POST /api/clientes
 * @desc    Crear nuevo cliente
 * @access  Private
 */
router.post('/',
  AuthMiddleware.verificarToken,
  async (req, res) => {
    try {
      console.log('👥 Creando nuevo cliente...');

      const {
        nombre_completo,
        nit,
        email,
        telefono,
        direccion,
        latitud,
        longitud
      } = req.body;

      // Validaciones básicas
      if (!nombre_completo || !nit) {
        return res.status(400).json({
          success: false,
          message: 'Nombre completo y NIT son requeridos'
        });
      }

      // Verificar si ya existe un cliente con ese NIT
      const { Op } = require('sequelize');
      const clienteExistente = await Cliente.findOne({
        where: {
          nit: nit,
          activo: true
        }
      });

      if (clienteExistente) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe un cliente con ese NIT',
          data: clienteExistente
        });
      }

      // Crear el cliente
      const nuevoCliente = await Cliente.create({
        nombre_completo,
        nit,
        email: email || null,
        telefono: telefono || null,
        direccion: direccion || null,
        latitud: latitud || null,
        longitud: longitud || null,
        activo: true
      });

      console.log(`✅ Cliente creado: ${nuevoCliente.nombre_completo}`);

      res.status(201).json({
        success: true,
        message: 'Cliente creado exitosamente',
        data: nuevoCliente
      });

    } catch (error) {
      console.error('❌ Error creando cliente:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * @route   GET /api/clientes/sucursal-cercana
 * @desc    Encontrar sucursal más cercana
 * @access  Public
 */
router.get('/sucursal-cercana', async (req, res) => {
  try {
    console.log('🗺️ Buscando sucursal más cercana...');
    
    const { latitud, longitud } = req.query;

    if (!latitud || !longitud) {
      return res.status(400).json({
        success: false,
        message: 'Latitud y longitud son requeridas'
      });
    }

    const lat = parseFloat(latitud);
    const lng = parseFloat(longitud);

    // Obtener todas las sucursales activas
    const sucursales = await Sucursal.findAll({
      where: { 
        activo: true,
        latitud: { [require('sequelize').Op.ne]: null },
        longitud: { [require('sequelize').Op.ne]: null }
      }
    });

    if (sucursales.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No hay sucursales disponibles'
      });
    }

    // Calcular distancias y encontrar la más cercana
    let sucursalMasCercana = null;
    let distanciaMinima = Infinity;

    sucursales.forEach(sucursal => {
      const R = 6371; // Radio de la Tierra en km
      const dLat = (sucursal.latitud - lat) * Math.PI / 180;
      const dLng = (sucursal.longitud - lng) * Math.PI / 180;
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat * Math.PI / 180) * Math.cos(sucursal.latitud * Math.PI / 180) *
        Math.sin(dLng/2) * Math.sin(dLng/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distancia = R * c;

      if (distancia < distanciaMinima) {
        distanciaMinima = distancia;
        sucursalMasCercana = {
          ...sucursal.toJSON(),
          distancia: Math.round(distancia * 100) / 100 // Redondear a 2 decimales
        };
      }
    });

    console.log(`✅ Sucursal más cercana: ${sucursalMasCercana.nombre} (${sucursalMasCercana.distancia}km)`);

    res.json({
      success: true,
      message: 'Sucursal más cercana encontrada',
      data: sucursalMasCercana
    });

  } catch (error) {
    console.error('❌ Error buscando sucursal más cercana:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   POST /api/clientes/registro
 * @desc    Registro de nuevo cliente (público)
 * @access  Public
 */
router.post('/registro', async (req, res) => {
  try {
    console.log('🆕 Registrando nuevo cliente...');

    const {
      nombre_completo,
      email,
      password,
      telefono,
      nit,
      direccion
    } = req.body;

    // Validaciones básicas
    if (!nombre_completo || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Nombre completo, email y contraseña son requeridos'
      });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Formato de email inválido'
      });
    }

    // Validar longitud de contraseña
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña debe tener al menos 6 caracteres'
      });
    }

    // Verificar si ya existe un cliente con ese email
    const { Op } = require('sequelize');
    const clienteExistente = await Cliente.findOne({
      where: {
        email: email,
        activo: true
      }
    });

    if (clienteExistente) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe una cuenta con ese email'
      });
    }

    // Crear el cliente usando el método estático
    const nuevoCliente = await Cliente.crearCliente({
      nombre_completo,
      email,
      password,
      telefono: telefono || null,
      nit: nit || 'CF',
      direccion: direccion || null,
      recibe_promociones: true,
      activo: true
    });

    // Generar token JWT
    const token = jwt.sign(
      {
        id: nuevoCliente.id,
        email: nuevoCliente.email,
        tipo: 'cliente'
      },
      process.env.JWT_SECRET || 'tu_secreto_super_seguro_cambialo',
      { expiresIn: '7d' }
    );

    console.log(`✅ Cliente registrado: ${nuevoCliente.nombre_completo}`);

    // No devolver el password_hash
    const clienteResponse = nuevoCliente.toJSON();
    delete clienteResponse.password_hash;

    res.status(201).json({
      success: true,
      message: 'Cliente registrado exitosamente',
      token,
      cliente: clienteResponse
    });

  } catch (error) {
    console.error('❌ Error registrando cliente:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   POST /api/clientes/login
 * @desc    Login de cliente
 * @access  Public
 */
router.post('/login', async (req, res) => {
  try {
    console.log('🔐 Cliente intentando login...');

    const { email, password } = req.body;

    // Validaciones
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email y contraseña son requeridos'
      });
    }

    // Buscar cliente por email
    const cliente = await Cliente.findOne({
      where: {
        email: email,
        activo: true
      }
    });

    if (!cliente) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    // Verificar contraseña
    const passwordValida = await cliente.validarPassword(password);

    if (!passwordValida) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    // Generar token JWT
    const token = jwt.sign(
      {
        id: cliente.id,
        email: cliente.email,
        tipo: 'cliente'
      },
      process.env.JWT_SECRET || 'tu_secreto_super_seguro_cambialo',
      { expiresIn: '7d' }
    );

    console.log(`✅ Cliente autenticado: ${cliente.nombre_completo}`);

    // No devolver el password_hash
    const clienteResponse = cliente.toJSON();
    delete clienteResponse.password_hash;

    res.json({
      success: true,
      message: 'Login exitoso',
      token,
      cliente: clienteResponse
    });

  } catch (error) {
    console.error('❌ Error en login de cliente:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   GET /api/clientes/perfil
 * @desc    Obtener perfil del cliente autenticado
 * @access  Private (Cliente)
 */
router.get('/perfil',
  AuthMiddleware.verificarToken,
  async (req, res) => {
    try {
      console.log('👤 Obteniendo perfil de cliente...');

      // Verificar que el token sea de un cliente
      if (req.usuario.tipo !== 'cliente') {
        return res.status(403).json({
          success: false,
          message: 'Acceso denegado'
        });
      }

      const cliente = await Cliente.findByPk(req.usuario.id, {
        attributes: { exclude: ['password_hash'] }
      });

      if (!cliente || !cliente.activo) {
        return res.status(404).json({
          success: false,
          message: 'Cliente no encontrado'
        });
      }

      res.json({
        success: true,
        data: cliente
      });

    } catch (error) {
      console.error('❌ Error obteniendo perfil:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * @route   PUT /api/clientes/:id
 * @desc    Actualizar cliente
 * @access  Private
 */
router.put('/:id',
  AuthMiddleware.verificarToken,
  ClienteController.actualizar
);

/**
 * @route   DELETE /api/clientes/:id
 * @desc    Eliminar cliente (soft delete)
 * @access  Private (Solo Admin)
 */
router.delete('/:id',
  AuthMiddleware.verificarToken,
  ClienteController.eliminar
);

module.exports = router;