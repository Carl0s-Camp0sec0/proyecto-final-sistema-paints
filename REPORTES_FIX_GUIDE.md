# Guía de Corrección de Reportes - Sistema Paints

## Resumen de Problemas Encontrados y Solucionados

### 1. **Falta de Datos de Ventas/Facturas en la Base de Datos**

**Problema**: Los reportes de productos (Análisis ABC, Productos Top, Más Vendidos) mostraban errores 500 porque no había datos de facturas en la base de datos.

**Solución**: Se creó el seeder `13-facturas-ejemplo.js` que genera:
- **300-500 facturas** de los últimos 60 días
- Facturas distribuidas entre las 6 sucursales
- Ventas para los 8 clientes de ejemplo
- Productos variados en cada factura (1-5 productos por factura)
- Detalles de factura con cantidades y precios realistas
- Pagos con diferentes medios de pago (80% pagos únicos, 20% combinados)

### 2. **Errores en el Frontend (reportes.js)**

**Problema**: Las funciones `showMasVendidosReport` y `showAnalisisABCReport` intentaban acceder a `response.data` cuando la estructura correcta es `response.data.productos`.

**Solución**: Se corrigieron ambas funciones para acceder correctamente a:
```javascript
const productos = response.data?.productos || [];
```

### 3. **Funciones de Búsqueda y Exportación Faltantes**

**Problema**: El reporte de productos tenía botones de "Aplicar Filtros" y "Exportar" sin funcionalidad.

**Solución**:
- Se implementó la función `buscarProductos()` en `reporte-productos.js`
- Se conectaron los botones con `onclick` en el HTML
- La función de exportar ya existía, solo se conectó al botón

---

## Pasos para Ejecutar la Solución

### Paso 1: Ejecutar los Seeders

Para poblar la base de datos con datos de facturas y ventas:

```bash
# Opción 1: Ejecutar todos los seeders (recomendado si es primera vez)
npm run db:seed

# Opción 2: Ejecutar solo el seeder de facturas
npx sequelize-cli db:seed --seed 13-facturas-ejemplo.js
```

**Nota**: Asegúrate de que MySQL esté corriendo antes de ejecutar los seeders.

#### Verificar que los seeders se ejecutaron correctamente:

```bash
# Conectarse a MySQL
mysql -u root -p

# Usar la base de datos
USE paints;

# Verificar facturas
SELECT COUNT(*) as total_facturas FROM facturas;

# Verificar detalles
SELECT COUNT(*) as total_detalles FROM facturas_detalle;

# Verificar pagos
SELECT COUNT(*) as total_pagos FROM facturas_pagos;

# Ver distribución de facturas por día (últimos 10 días)
SELECT DATE(fecha_creacion) as fecha, COUNT(*) as facturas
FROM facturas
GROUP BY DATE(fecha_creacion)
ORDER BY fecha DESC
LIMIT 10;
```

### Paso 2: Reiniciar el Servidor (si está corriendo)

```bash
# Si estás usando npm run dev
Ctrl + C  # Detener
npm run dev  # Reiniciar

# O simplemente recargar la página si el servidor ya está corriendo
```

### Paso 3: Probar los Reportes

1. **Reporte de Clientes** (`/frontend/pages/reportes/reporte-clientes.html`)
   - ✅ Debería cargar estadísticas de clientes
   - ✅ Debería mostrar clientes activos
   - ✅ Debería mostrar nuevos clientes

2. **Reporte de Inventario** (`/frontend/pages/reportes/reporte-inventario.html`)
   - ✅ Debería cargar inventario general
   - ✅ Debería mostrar alertas críticas de stock
   - ✅ La exportación PDF debería funcionar

3. **Reporte de Productos** (`/frontend/pages/reportes/reporte-productos.html`)
   - ✅ Debería cargar productos más vendidos
   - ✅ Debería cargar productos menos vendidos
   - ✅ Búsqueda y filtros deberían funcionar
   - ✅ Exportación PDF debería funcionar

4. **Reporte de Ventas** (`/frontend/pages/reportes/reporte-ventas.html`)
   - ✅ Debería cargar ventas por período
   - ✅ Debería mostrar desglose por medio de pago
   - ✅ Exportación debería incluir datos reales

5. **Panel de Reportes Principal** (`/frontend/pages/reportes/reportes.html`)
   - ✅ "Alertas de Stock" debería funcionar
   - ✅ "Productos Más Vendidos" debería funcionar
   - ✅ "Análisis ABC" debería funcionar

---

## Archivos Modificados

### Backend

1. **`backend/seeders/13-facturas-ejemplo.js`** (NUEVO)
   - Genera datos realistas de facturas de los últimos 60 días
   - Crea entre 3-8 facturas por día
   - Incluye productos variados, detalles y pagos

### Frontend

2. **`frontend/assets/js/pages/reportes.js`**
   - **Línea 161**: Corregido acceso a datos de productos más vendidos
   - **Línea 256**: Corregido acceso a datos de análisis ABC
   - Cambio: `response.data` → `response.data?.productos`

3. **`frontend/assets/js/pages/reporte-productos.js`**
   - **Líneas 305-330**: Agregada función `buscarProductos()`
   - **Línea 334**: Modificada función `cargarListadoCompleto()` para aceptar filtros
   - **Línea 536**: Exportada función `buscarProductos` globalmente

4. **`frontend/pages/reportes/reporte-productos.html`**
   - **Línea 211**: Agregado `onclick="buscarProductos()"` al botón de filtros
   - **Línea 215**: Agregado `onclick="exportarReporte()"` al botón de exportar

---

## Endpoints de Reportes (Backend)

### Productos
- `GET /api/reportes/productos/top-ingresos` - Top productos por ingresos
- `GET /api/reportes/productos/top-cantidad` - Top productos por cantidad vendida
- `GET /api/reportes/productos/menos-vendidos` - Productos con menos ventas

### Inventario
- `GET /api/reportes/inventario/general` - Inventario general
- `GET /api/reportes/inventario/stock-bajo` - Productos con stock bajo
- `GET /api/reportes/inventario/sin-stock` - Productos agotados
- `GET /api/reportes/inventario/por-tienda` - Inventario por sucursal

### Ventas
- `GET /api/reportes/ventas/periodo` - Ventas por período
- `GET /api/reportes/facturas/:numero_factura` - Búsqueda de factura

### Clientes
- `GET /api/reportes/clientes/estadisticas` - Estadísticas de clientes
- `GET /api/reportes/clientes/top-ventas` - Top clientes
- `GET /api/reportes/clientes/segmentacion` - Segmentación de clientes
- `GET /api/reportes/clientes/por-tipo` - Clientes por tipo

---

## Datos Generados por el Seeder

### Facturas
- **Total aproximado**: 300-500 facturas
- **Período**: Últimos 60 días
- **Distribución**: 3-8 facturas por día
- **Sucursales**: Distribuidas entre las 6 sucursales
- **Estado**: Todas activas

### Detalles de Factura
- **Productos por factura**: 1-5 productos aleatorios
- **Cantidad por producto**: 1-5 unidades
- **Descuentos**: 20% de probabilidad de descuento del 5%
- **Precios**: Basados en el seeder de productos

### Pagos
- **80% pagos únicos**: Un solo medio de pago
- **20% pagos combinados**: Efectivo + Tarjeta
- **Medios de pago**: Efectivo, Cheque, Tarjeta, Transferencia
- **Referencias**: Generadas para cheques y tarjetas

---

## Verificación de Funcionamiento

### Consola del Navegador

Después de ejecutar los seeders y cargar los reportes, NO deberías ver:

❌ **Errores previos**:
```
GET http://localhost:3000/api/reportes/productos/top-ingresos - 500 (Internal Server Error)
GET http://localhost:3000/api/reportes/productos/top-cantidad - 500 (Internal Server Error)
Error: Error al obtener productos con más ingresos
Error: Error al obtener productos más vendidos
```

✅ **Comportamiento esperado**:
```
Reporte generado exitosamente
Búsqueda aplicada
Reporte exportado exitosamente
```

### Base de Datos

Consultas para verificar:

```sql
-- Ver facturas recientes
SELECT
    f.numero_factura,
    f.fecha_creacion,
    c.nombre_completo as cliente,
    s.nombre as sucursal,
    f.total
FROM facturas f
LEFT JOIN clientes c ON f.cliente_id = c.id
LEFT JOIN sucursales s ON f.sucursal_id = s.id
ORDER BY f.fecha_creacion DESC
LIMIT 10;

-- Ver productos más vendidos
SELECT
    p.nombre,
    SUM(fd.cantidad) as total_vendido,
    SUM(fd.subtotal) as ingresos
FROM facturas_detalle fd
JOIN productos p ON fd.producto_id = p.id
JOIN facturas f ON fd.factura_id = f.id
WHERE f.estado = 'activa'
GROUP BY p.id, p.nombre
ORDER BY ingresos DESC
LIMIT 10;

-- Ver ventas por día
SELECT
    DATE(fecha_creacion) as fecha,
    COUNT(*) as num_facturas,
    SUM(total) as total_vendido
FROM facturas
WHERE estado = 'activa'
GROUP BY DATE(fecha_creacion)
ORDER BY fecha DESC;
```

---

## Resolución de Problemas

### Problema: "Error al ejecutar seeder"

**Solución**:
1. Verificar que MySQL esté corriendo: `sudo service mysql status`
2. Verificar credenciales en `.env`
3. Verificar que la base de datos exista: `CREATE DATABASE IF NOT EXISTS paints;`

### Problema: "Los reportes siguen mostrando 'No hay datos'"

**Solución**:
1. Verificar que el seeder se ejecutó: `SELECT COUNT(*) FROM facturas;`
2. Limpiar caché del navegador (Ctrl + Shift + R)
3. Verificar que el servidor esté corriendo
4. Revisar consola del navegador para errores

### Problema: "Error 500 en endpoints de reportes"

**Solución**:
1. Revisar logs del servidor backend
2. Verificar que las tablas tengan datos:
   ```sql
   SELECT COUNT(*) FROM facturas;
   SELECT COUNT(*) FROM facturas_detalle;
   SELECT COUNT(*) FROM facturas_pagos;
   ```
3. Verificar que las relaciones en los modelos estén correctas

### Problema: "Búsqueda de productos no funciona"

**Solución**:
1. Verificar que el archivo `reporte-productos.js` tenga la función `buscarProductos`
2. Verificar que el HTML tenga `onclick="buscarProductos()"`
3. Verificar consola del navegador para errores JavaScript

---

## Resumen de Mejoras

### ✅ Backend
- Creado seeder completo de facturas con datos realistas
- Corregidos nombres de tablas en seeder (`facturas_detalle`, `facturas_pagos`)
- Endpoints de reportes ya estaban bien codificados

### ✅ Frontend
- Corregido acceso a datos en `reportes.js` (2 lugares)
- Implementada función de búsqueda en reporte de productos
- Conectados botones de búsqueda y exportación
- Función de exportación PDF ya existía y funciona

### ✅ Funcionalidad Completa
- Todos los reportes ahora tienen datos para mostrar
- Búsqueda y filtros funcionan en reporte de productos
- Exportación PDF funciona en todos los reportes
- Análisis ABC muestra clasificación real de productos
- Productos más/menos vendidos muestran datos reales

---

## Próximos Pasos Opcionales

1. **Agregar más datos de prueba**: Ejecutar el seeder múltiples veces para tener más historial
2. **Personalizar rangos de fechas**: Modificar `diasHistorico` en el seeder
3. **Agregar más variedad**: Incluir facturas anuladas (modificar seeder)
4. **Optimizar consultas**: Agregar índices si los reportes son lentos
5. **Agregar gráficas**: Implementar Chart.js para visualizaciones

---

## Contacto y Soporte

Si encuentras algún problema:
1. Revisa la consola del navegador (F12)
2. Revisa los logs del servidor backend
3. Verifica que MySQL tenga los datos ejecutando las consultas SQL de verificación
4. Asegúrate de que todos los seeders anteriores se hayan ejecutado correctamente

---

**Fecha de corrección**: Noviembre 22, 2025
**Sistema**: Paints - Sistema de Gestión para Cadena de Pinturas
**Versión**: 1.0.0
