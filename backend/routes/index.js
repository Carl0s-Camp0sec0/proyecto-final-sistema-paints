const express = require('express');
const router = express.Router();

// Importar rutas
const authRoutes = require('./auth-simple');
const sistemaRoutes = require('./sistema');
const productosRoutes = require('./productos');
const clientesRoutes = require('./clientes');
const inventarioRoutes = require('./inventario');
const facturasRoutes = require('./facturas');
const reportesRoutes = require('./reportes');
const usuariosRoutes = require('./usuarios');
const proveedoresRoutes = require('./proveedores');
const cotizacionesRoutes = require('./cotizaciones');
const carritoRoutes = require('./carrito');

// Configurar rutas
router.use('/auth', authRoutes);
router.use('/sistema', sistemaRoutes);
router.use('/productos', productosRoutes);
router.use('/clientes', clientesRoutes);
router.use('/inventario', inventarioRoutes);
router.use('/facturas', facturasRoutes);
router.use('/reportes', reportesRoutes);
router.use('/usuarios', usuariosRoutes);
router.use('/proveedores', proveedoresRoutes);
router.use('/cotizaciones', cotizacionesRoutes);
router.use('/carrito', carritoRoutes);

// Ruta de prueba
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'API Routes funcionando correctamente',
    timestamp: new Date().toISOString(),
    routes_available: [
      'POST /api/auth/login',
      'GET /api/productos',
      'GET /api/clientes',
      'GET /api/inventario/sucursal/:id',
      'POST /api/facturas',
      'GET /api/facturas',
      'GET /api/reportes/ventas/periodo',
      'GET /api/reportes/productos/top-ingresos',
      'GET /api/reportes/inventario/general',
      'GET /api/cotizaciones',
      'POST /api/cotizaciones',
      'GET /api/carrito',
      'POST /api/carrito'
    ]
  });
});

module.exports = router;