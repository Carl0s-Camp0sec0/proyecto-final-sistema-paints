const express = require('express');
const router = express.Router();

// Importar rutas
const authRoutes = require('./auth-simple');
const sistemaRoutes = require('./sistema');
const productosRoutes = require('./productos');
const clientesRoutes = require('./clientes');
const inventarioRoutes = require('./inventario');
const facturasRoutes = require('./facturas');

// Configurar rutas
router.use('/auth', authRoutes);
router.use('/sistema', sistemaRoutes);
router.use('/productos', productosRoutes);
router.use('/clientes', clientesRoutes);
router.use('/inventario', inventarioRoutes);
router.use('/facturas', facturasRoutes);

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
      'GET /api/facturas'
    ]
  });
});

module.exports = router;