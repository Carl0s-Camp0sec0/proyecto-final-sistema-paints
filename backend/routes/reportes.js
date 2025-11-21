const express = require('express');
const router = express.Router();
const reporteController = require('../controllers/reporteController');
const { verificarToken } = require('../middleware/auth');

// Middleware de autenticación en todas las rutas de reportes
router.use(verificarToken);

/* ============================================
   RUTAS DE REPORTES
   ============================================ */

// Reporte 1: Ventas por período y medios de pago
// GET /api/reportes/ventas/periodo?fecha_inicio=2024-01-01&fecha_fin=2024-01-31&sucursal_id=1&metodo_pago=efectivo
router.get('/ventas/periodo', reporteController.getVentasPorPeriodo);

// Reporte 2: Productos que más dinero generan
// GET /api/reportes/productos/top-ingresos?fecha_inicio=2024-01-01&fecha_fin=2024-01-31&sucursal_id=1&limit=10
router.get('/productos/top-ingresos', reporteController.getProductosTopIngresos);

// Reporte 3: Productos más vendidos por cantidad
// GET /api/reportes/productos/top-cantidad?fecha_inicio=2024-01-01&fecha_fin=2024-01-31&sucursal_id=1&limit=10
router.get('/productos/top-cantidad', reporteController.getProductosTopCantidad);

// Reporte 4: Inventario actual general
// GET /api/reportes/inventario/general?sucursal_id=1&categoria_id=1
router.get('/inventario/general', reporteController.getInventarioGeneral);

// Reporte 5: Productos con menos ventas
// GET /api/reportes/productos/menos-vendidos?fecha_inicio=2024-01-01&fecha_fin=2024-01-31&sucursal_id=1&limit=10
router.get('/productos/menos-vendidos', reporteController.getProductosMenosVendidos);

// Reporte 6: Productos sin stock
// GET /api/reportes/inventario/sin-stock?sucursal_id=1
router.get('/inventario/sin-stock', reporteController.getProductosSinStock);

// Reporte 7: Búsqueda de factura por número
// GET /api/reportes/facturas/A00001234
router.get('/facturas/:numero_factura', reporteController.getFacturaPorNumero);

// Reporte 8: Ingresos al inventario
// GET /api/reportes/inventario/ingresos?fecha_inicio=2024-01-01&fecha_fin=2024-01-31&sucursal_id=1&proveedor_id=1
router.get('/inventario/ingresos', reporteController.getIngresosInventario);

// Reporte 9: Productos bajo stock mínimo
// GET /api/reportes/inventario/stock-bajo?sucursal_id=1
router.get('/inventario/stock-bajo', reporteController.getProductosStockBajo);

// Reporte 10: Inventario por tienda
// GET /api/reportes/inventario/por-tienda?categoria_id=1
router.get('/inventario/por-tienda', reporteController.getInventarioPorTienda);

module.exports = router;
