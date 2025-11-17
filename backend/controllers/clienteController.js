const { Cliente, Sucursal, Factura, Cotizacion } = require('../models');
const { Op } = require('sequelize');

class ClienteController {
  // Listar clientes
  static async listar(req, res) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        buscar, 
        activo = true,
        recibe_promociones 
      } = req.query;

      const offset = (page - 1) * limit;
      const whereClause = {};

      // Filtros
      if (activo !== undefined) whereClause.activo = activo;
      if (recibe_promociones !== undefined) whereClause.recibe_promociones = recibe_promociones;
      if (buscar) {
        whereClause[Op.or] = [
          { nombre_completo: { [Op.like]: `%${buscar}%` } },
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
      console.error('Error listando clientes:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Obtener cliente por ID
  static async obtenerPorId(req, res) {
    try {
      const { id } = req.params;
      const { incluir_estadisticas = false } = req.query;

      const include = [];

      if (incluir_estadisticas === 'true') {
        include.push(
          {
            model: Factura,
            as: 'facturas',
            where: { estado: 'activa' },
            required: false,
            attributes: ['id', 'total', 'fecha_creacion']
          },
          {
            model: Cotizacion,
            as: 'cotizaciones',
            required: false,
            attributes: ['id', 'total', 'estado', 'fecha_creacion']
          }
        );
      }

      const cliente = await Cliente.findByPk(id, { include });

      if (!cliente) {
        return res.status(404).json({
          success: false,
          message: 'Cliente no encontrado'
        });
      }

      // Calcular estadísticas si se solicitaron
      let estadisticas = null;
      if (incluir_estadisticas === 'true') {
        const totalFacturado = cliente.facturas?.reduce((sum, factura) => 
          sum + parseFloat(factura.total), 0) || 0;
        
        estadisticas = {
          total_facturas: cliente.facturas?.length || 0,
          total_facturado: totalFacturado,
          total_cotizaciones: cliente.cotizaciones?.length || 0,
          cotizaciones_activas: cliente.cotizaciones?.filter(c => c.estado === 'activa').length || 0
        };
      }

      res.json({
        success: true,
        data: {
          ...cliente.toJSON(),
          estadisticas
        }
      });

    } catch (error) {
      console.error('Error obteniendo cliente:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Crear nuevo cliente
  static async crear(req, res) {
    try {
      const {
        nombre_completo,
        email,
        telefono,
        direccion,
        latitud,
        longitud,
        recibe_promociones = false
      } = req.body;

      // Validaciones básicas
      if (!nombre_completo) {
        return res.status(400).json({
          success: false,
          message: 'El nombre completo es requerido'
        });
      }

      // Validar email único si se proporciona
      if (email) {
        const emailExistente = await Cliente.findOne({ where: { email } });
        if (emailExistente) {
          return res.status(400).json({
            success: false,
            message: 'El email ya está registrado'
          });
        }
      }

      const cliente = await Cliente.create({
        nombre_completo,
        email,
        telefono,
        direccion,
        latitud: latitud ? parseFloat(latitud) : null,
        longitud: longitud ? parseFloat(longitud) : null,
        recibe_promociones: Boolean(recibe_promociones),
        activo: true
      });

      res.status(201).json({
        success: true,
        message: 'Cliente creado exitosamente',
        data: cliente
      });

    } catch (error) {
      console.error('Error creando cliente:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Actualizar cliente
  static async actualizar(req, res) {
    try {
      const { id } = req.params;
      const datos = req.body;

      const cliente = await Cliente.findByPk(id);
      if (!cliente) {
        return res.status(404).json({
          success: false,
          message: 'Cliente no encontrado'
        });
      }

      // Validar email único si se está cambiando
      if (datos.email && datos.email !== cliente.email) {
        const emailExistente = await Cliente.findOne({ 
          where: { 
            email: datos.email,
            id: { [Op.ne]: id }
          }
        });
        if (emailExistente) {
          return res.status(400).json({
            success: false,
            message: 'El email ya está registrado por otro cliente'
          });
        }
      }

      await cliente.update({
        nombre_completo: datos.nombre_completo || cliente.nombre_completo,
        email: datos.email || cliente.email,
        telefono: datos.telefono || cliente.telefono,
        direccion: datos.direccion || cliente.direccion,
        latitud: datos.latitud !== undefined ? parseFloat(datos.latitud) : cliente.latitud,
        longitud: datos.longitud !== undefined ? parseFloat(datos.longitud) : cliente.longitud,
        recibe_promociones: datos.recibe_promociones !== undefined ? 
          Boolean(datos.recibe_promociones) : cliente.recibe_promociones,
        activo: datos.activo !== undefined ? datos.activo : cliente.activo
      });

      res.json({
        success: true,
        message: 'Cliente actualizado exitosamente',
        data: cliente
      });

    } catch (error) {
      console.error('Error actualizando cliente:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Buscar sucursal más cercana
  static async sucursalMasCercana(req, res) {
    try {
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
          latitud: { [Op.ne]: null },
          longitud: { [Op.ne]: null }
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

      res.json({
        success: true,
        message: 'Sucursal más cercana encontrada',
        data: sucursalMasCercana
      });

    } catch (error) {
      console.error('Error buscando sucursal más cercana:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Eliminar cliente (soft delete)
  static async eliminar(req, res) {
    try {
      const { id } = req.params;

      const cliente = await Cliente.findByPk(id);
      if (!cliente) {
        return res.status(404).json({
          success: false,
          message: 'Cliente no encontrado'
        });
      }

      await cliente.update({ activo: false });

      res.json({
        success: true,
        message: 'Cliente eliminado exitosamente'
      });

    } catch (error) {
      console.error('Error eliminando cliente:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Listar clientes que reciben promociones
  static async listarParaPromociones(req, res) {
    try {
      const clientes = await Cliente.findAll({
        where: { 
          recibe_promociones: true, 
          activo: true,
          email: { [Op.ne]: null }
        },
        attributes: ['id', 'nombre_completo', 'email', 'fecha_creacion'],
        order: [['nombre_completo', 'ASC']]
      });

      res.json({
        success: true,
        data: clientes,
        total: clientes.length
      });

    } catch (error) {
      console.error('Error listando clientes para promociones:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
}

module.exports = ClienteController;