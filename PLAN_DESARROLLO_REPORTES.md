# PLAN DE DESARROLLO - SISTEMA DE REPORTES
## Proyecto Sistema Paints
**Fecha:** 21 de Noviembre de 2025

---

## 📋 ANÁLISIS DE ARCHIVOS EXISTENTES

### HTML Existentes (✅ COMPLETOS Y REUTILIZABLES)

1. **reporte-ventas.html** - ✅ Excelente estructura
   - Filtros por período, sucursal, método de pago, usuario
   - Estadísticas resumen (4 cards)
   - Gráficos (Canvas para Chart.js)
   - Top 10 productos vendidos
   - Ventas por sucursal
   - Botones exportar PDF/Imprimir

2. **reporte-inventario.html** - ✅ Buena estructura
   - Estadísticas: Total productos, valor total, stock bajo, agotados
   - Filtros por sucursal, categoría, estado, marca
   - Alertas críticas de stock
   - Inventario detallado
   - Botón exportar Excel

3. **reporte-productos.html** - ✅ Muy completo
   - Estadísticas: Total, más vendido, activos, sin movimiento
   - Filtros por categoría, marca, estado, rotación, precio
   - Top 5 más vendidos
   - Top 5 menos vendidos
   - Análisis por categoría
   - Listado completo paginado

4. **reporte-clientes.html** - ⚠️ Necesita verificación

5. **reportes.html** - ✅ Panel principal con tarjetas

### JavaScript Existentes (❌ VACÍOS - SOLO TIENEN FUNCIÓN LOGOUT)

Los archivos `/frontend/assets/js/pages/reporte-*.js` existen pero están vacíos:
- reporte-ventas.js
- reporte-inventario.js
- reporte-productos.js
- reporte-clientes.js

**Acción:** Implementar completamente la lógica JavaScript

---

## 🎯 10 REPORTES REQUERIDOS POR EL ENUNCIADO

### Mapeo de Reportes a Archivos:

| # | Reporte Requerido | Archivo HTML | Archivo JS | Estado |
|---|-------------------|--------------|------------|--------|
| 1 | Ventas por período y medio de pago | reporte-ventas.html | reporte-ventas.js | HTML ✅ / JS ❌ |
| 2 | Productos que más dinero generan | reporte-ventas.html | reporte-ventas.js | HTML ✅ / JS ❌ |
| 3 | Productos más vendidos (cantidad) | reporte-productos.html | reporte-productos.js | HTML ✅ / JS ❌ |
| 4 | Inventario actual general | reporte-inventario.html | reporte-inventario.js | HTML ✅ / JS ❌ |
| 5 | Productos con menos ventas | reporte-productos.html | reporte-productos.js | HTML ✅ / JS ❌ |
| 6 | Productos sin stock | reporte-inventario.html | reporte-inventario.js | HTML ✅ / JS ❌ |
| 7 | Búsqueda factura por número | **CREAR NUEVO** | **CREAR NUEVO** | ❌ |
| 8 | Ingresos al inventario | **CREAR NUEVO** | **CREAR NUEVO** | ❌ |
| 9 | Productos bajo stock mínimo | reporte-inventario.html | reporte-inventario.js | HTML ✅ / JS ❌ |
| 10 | Inventario por tienda | reporte-inventario.html | reporte-inventario.js | HTML ✅ / JS ❌ |

---

## 🔧 ARCHIVOS A CREAR/MODIFICAR

### Backend (CREAR NUEVOS):

1. **`/backend/routes/reportes.js`** - Rutas de reportes
2. **`/backend/controllers/reporteController.js`** - Lógica de reportes

### Frontend - JavaScript (MODIFICAR/COMPLETAR):

1. **`/frontend/assets/js/pages/reporte-ventas.js`** - Reportes 1 y 2
2. **`/frontend/assets/js/pages/reporte-productos.js`** - Reportes 3 y 5
3. **`/frontend/assets/js/pages/reporte-inventario.js`** - Reportes 4, 6, 9 y 10

### Frontend - HTML (CREAR NUEVOS):

1. **`/frontend/pages/reportes/reporte-factura.html`** - Reporte 7
2. **`/frontend/pages/reportes/reporte-ingresos.html`** - Reporte 8

### Frontend - JavaScript (CREAR NUEVOS):

1. **`/frontend/assets/js/pages/reporte-factura.js`** - Búsqueda de facturas
2. **`/frontend/assets/js/pages/reporte-ingresos.js`** - Ingresos de inventario

---

## 📊 ENDPOINTS DEL BACKEND A CREAR

```javascript
// /backend/routes/reportes.js

// Reporte 1: Ventas por período y medios de pago
GET /api/reportes/ventas/periodo
Query params: fecha_inicio, fecha_fin, sucursal_id?, metodo_pago?
Response: { total, efectivo, cheque, tarjeta, facturas[], estadisticas }

// Reporte 2: Productos que más dinero generan
GET /api/reportes/productos/top-ingresos
Query params: fecha_inicio, fecha_fin, sucursal_id?, limit?
Response: { productos: [{ nombre, categoria, total_vendido, cantidad, porcentaje }] }

// Reporte 3: Productos más vendidos por cantidad
GET /api/reportes/productos/top-cantidad
Query params: fecha_inicio, fecha_fin, sucursal_id?, limit?
Response: { productos: [{ nombre, cantidad_vendida, unidad_medida }] }

// Reporte 4: Inventario actual general
GET /api/reportes/inventario/general
Query params: sucursal_id?, categoria_id?
Response: { productos[], total_productos, valor_total, stock_bajo, agotados }

// Reporte 5: Productos con menos ventas
GET /api/reportes/productos/menos-vendidos
Query params: fecha_inicio, fecha_fin, sucursal_id?, limit?
Response: { productos: [{ nombre, cantidad_vendida, dias_sin_venta }] }

// Reporte 6: Productos sin stock
GET /api/reportes/inventario/sin-stock
Query params: sucursal_id?
Response: { productos: [{ nombre, sucursal, ultima_venta, proveedor }] }

// Reporte 7: Búsqueda de factura
GET /api/reportes/facturas/:numero_factura
Response: { factura, detalles[], medios_pago[], usuario, cliente }

// Reporte 8: Ingresos al inventario
GET /api/reportes/inventario/ingresos
Query params: fecha_inicio, fecha_fin, sucursal_id?, proveedor_id?
Response: { ingresos: [{ fecha, proveedor, sucursal, productos[], total }] }

// Reporte 9: Productos bajo stock mínimo
GET /api/reportes/inventario/stock-bajo
Query params: sucursal_id?
Response: { productos: [{ nombre, stock_actual, stock_minimo, deficit }] }

// Reporte 10: Inventario por tienda
GET /api/reportes/inventario/por-tienda
Query params: categoria_id?
Response: { sucursales: [{ nombre, productos[], valor_total }] }
```

---

## 🎨 FUNCIONALIDADES JAVASCRIPT A IMPLEMENTAR

### Para cada archivo JS de reporte:

1. **Inicialización**
   ```javascript
   - Verificar autenticación con auth.js
   - Cargar datos del usuario
   - Configurar fechas por defecto
   - Cargar filtros (sucursales, categorías, etc.) desde API
   ```

2. **Generación de Reporte**
   ```javascript
   - Función generarReporte()
   - Llamada al endpoint correspondiente con filtros
   - Mostrar loading
   - Procesar datos recibidos
   - Actualizar estadísticas
   - Actualizar tablas
   - Generar gráficos con Chart.js
   ```

3. **Exportación PDF**
   ```javascript
   - Función exportarPDF()
   - Usar jsPDF y autoTable
   - Header con logo de empresa
   - Contenido del reporte
   - Gráficos como imágenes
   - Footer con información
   ```

4. **Exportación Excel**
   ```javascript
   - Función exportarExcel()
   - Usar ExcelJS (ya está en package.json)
   - Hoja con datos del reporte
   - Formato y estilos
   - Logo de empresa
   ```

5. **Gráficos**
   ```javascript
   - Usar Chart.js (disponible vía CDN)
   - Gráficos de barras, líneas, pie según reporte
   - Colores del sistema (CSS variables)
   - Responsive
   ```

6. **Utilidades Comunes**
   ```javascript
   - configurarFechas() - Para períodos predefinidos
   - limpiarFiltros()
   - formatearMoneda() - Usar Utils.formatCurrency
   - formatearFecha() - Usar Utils.formatDate
   ```

---

## 📝 ESTRUCTURA ESTÁNDAR PARA CADA ARCHIVO JS

```javascript
/* ==========================
   REPORTE: [Nombre del Reporte]
   Archivo: reporte-xxx.js
   ========================== */

// 1. VERIFICACIÓN DE AUTENTICACIÓN
if (!auth.isAuthenticated()) {
    window.location.href = '/frontend/pages/public/login.html';
}

// Verificar permisos (solo Gerente y Admin pueden ver reportes)
if (!auth.hasPermission([CONFIG.ROLES.ADMIN, CONFIG.ROLES.GERENTE])) {
    Utils.showToast('No tienes permisos para acceder a reportes', 'error');
    window.location.href = '/frontend/pages/admin/dashboard.html';
}

// 2. VARIABLES GLOBALES
let datosReporte = null;
let chartInstance = null;

// 3. INICIALIZACIÓN
document.addEventListener('DOMContentLoaded', function() {
    inicializarReporte();
    configurarEventos();
    configurarFechasPorDefecto();
});

// 4. FUNCIONES PRINCIPALES
function inicializarReporte() {
    cargarDatosUsuario();
    cargarFiltros();
}

function cargarDatosUsuario() {
    document.getElementById('userAvatar').textContent = auth.getUserInitials();
    document.getElementById('userName').textContent = auth.user.nombre_completo;
    document.getElementById('userRole').textContent = auth.user.rol;
}

async function generarReporte() {
    // Obtener filtros
    const filtros = obtenerFiltros();

    // Validar
    if (!validarFiltros(filtros)) return;

    try {
        // Mostrar loading
        mostrarLoading(true);

        // Llamar al API
        const response = await api.get('/reportes/endpoint', filtros);

        // Guardar datos
        datosReporte = response.data;

        // Mostrar datos
        mostrarEstadisticas(datosReporte);
        mostrarTablas(datosReporte);
        mostrarGraficos(datosReporte);

        Utils.showToast('Reporte generado exitosamente', 'success');

    } catch (error) {
        console.error('Error al generar reporte:', error);
        Utils.showToast('Error al generar el reporte', 'error');
    } finally {
        mostrarLoading(false);
    }
}

// 5. EXPORTACIONES
async function exportarPDF() {
    if (!datosReporte) {
        Utils.showToast('Primero genera el reporte', 'warning');
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Header
    agregarHeaderPDF(doc);

    // Contenido
    agregarContenidoPDF(doc, datosReporte);

    // Footer
    agregarFooterPDF(doc);

    // Descargar
    doc.save(`reporte_xxx_${new Date().getTime()}.pdf`);
}

async function exportarExcel() {
    if (!datosReporte) {
        Utils.showToast('Primero genera el reporte', 'warning');
        return;
    }

    // Implementar con ExcelJS
    Utils.showToast('Exportación a Excel en desarrollo', 'info');
}

// 6. UTILIDADES
function configurarFechas() {
    const periodo = document.getElementById('periodoSelect').value;
    const hoy = new Date();

    switch(periodo) {
        case 'today':
            // Lógica para hoy
            break;
        case 'week':
            // Lógica para semana
            break;
        // ... más casos
    }
}

function logout() {
    auth.logout();
}

// Exportar funciones globales
window.generarReporte = generarReporte;
window.exportarPDF = exportarPDF;
window.exportarExcel = exportarExcel;
window.configurarFechas = configurarFechas;
window.limpiarFiltros = limpiarFiltros;
window.logout = logout;
```

---

## 🚀 ORDEN DE IMPLEMENTACIÓN

### Fase 1: Backend (Día 1)
1. Crear `/backend/controllers/reporteController.js`
2. Crear `/backend/routes/reportes.js`
3. Registrar rutas en `/backend/routes/index.js`
4. Probar endpoints con Postman/Thunder Client

### Fase 2: Reporte de Ventas (Día 2)
1. Implementar `reporte-ventas.js` completamente
2. Reportes #1 y #2
3. Gráficos con Chart.js
4. Exportación PDF y Excel
5. Probar integración

### Fase 3: Reporte de Productos (Día 3)
1. Implementar `reporte-productos.js` completamente
2. Reportes #3 y #5
3. Gráficos
4. Exportaciones
5. Probar

### Fase 4: Reporte de Inventario (Día 4)
1. Implementar `reporte-inventario.js` completamente
2. Reportes #4, #6, #9 y #10
3. Alertas visuales
4. Exportaciones
5. Probar

### Fase 5: Reportes Adicionales (Día 5)
1. Crear `reporte-factura.html` y `reporte-factura.js` (Reporte #7)
2. Crear `reporte-ingresos.html` y `reporte-ingresos.js` (Reporte #8)
3. Exportaciones
4. Probar

### Fase 6: Integración y Pruebas (Día 6)
1. Actualizar panel de reportes (`reportes.html`)
2. Agregar enlaces a nuevos reportes
3. Pruebas end-to-end de todos los reportes
4. Ajustes de diseño y UX
5. Verificar exportaciones
6. Documentación

---

## 📦 LIBRERÍAS NECESARIAS

### Ya Disponibles:
- ✅ **jsPDF** - Generación de PDFs
- ✅ **jsPDF-AutoTable** - Tablas en PDFs
- ✅ **ExcelJS** - Exportación a Excel (en package.json)
- ✅ **Chart.js** - Gráficos (usar vía CDN)

### A Agregar en HTML:
```html
<!-- Chart.js para gráficos -->
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>

<!-- jsPDF y autoTable (ya están en algunos HTMLs) -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.31/jspdf.plugin.autotable.min.js"></script>
```

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

### Backend:
- [ ] Crear controlador de reportes
- [ ] Crear rutas de reportes
- [ ] Registrar rutas en index.js
- [ ] Implementar consultas SQL/Sequelize para cada reporte
- [ ] Probar todos los endpoints

### Frontend - JavaScript:
- [ ] reporte-ventas.js completo (Reportes 1, 2)
- [ ] reporte-productos.js completo (Reportes 3, 5)
- [ ] reporte-inventario.js completo (Reportes 4, 6, 9, 10)
- [ ] reporte-factura.js nuevo (Reporte 7)
- [ ] reporte-ingresos.js nuevo (Reporte 8)

### Frontend - HTML:
- [ ] reporte-factura.html nuevo
- [ ] reporte-ingresos.html nuevo
- [ ] Actualizar reportes.html con nuevos reportes
- [ ] Agregar Chart.js a todos los HTML

### Funcionalidades:
- [ ] Gráficos funcionando en todos los reportes
- [ ] Exportación PDF con logo funcionando
- [ ] Exportación Excel funcionando
- [ ] Filtros aplicándose correctamente
- [ ] Fechas predefinidas funcionando
- [ ] Loading states
- [ ] Manejo de errores
- [ ] Responsive

---

## 🎯 RESULTADO ESPERADO

Al finalizar la implementación:
- ✅ 10 reportes completamente funcionales
- ✅ Datos reales del backend (no mock data)
- ✅ Gráficos interactivos con Chart.js
- ✅ Exportación PDF con logo de empresa
- ✅ Exportación Excel
- ✅ Filtros funcionando
- ✅ Diseño consistente con el sistema
- ✅ Responsive
- ✅ Cumplimiento 100% con enunciado

---

**Preparado para comenzar implementación**
**Fecha de inicio:** 21 de Noviembre de 2025
