const express = require('express');
const router = express.Router();
const { Cliente, Sucursal } = require('../models');
const AuthMiddleware = require('../middleware/auth');

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

module.exports = router;