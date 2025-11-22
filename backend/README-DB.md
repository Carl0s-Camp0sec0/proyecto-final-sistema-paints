# Configuración de Base de Datos - Sistema Paints

## Enfoque de Sincronización

Este proyecto **NO utiliza migraciones de Sequelize**. En su lugar, utiliza `sequelize.sync()` para sincronizar automáticamente los modelos con la base de datos.

## ¿Por qué se usa sequelize.sync()?

### Ventajas para este proyecto:
- ✅ **Simplicidad**: No requiere crear archivos de migración para cada cambio
- ✅ **Ideal para desarrollo**: Cambios rápidos en modelos sin gestión de versiones
- ✅ **Proyecto académico**: No requiere control estricto de versiones de esquema
- ✅ **Equipo pequeño**: Fácil de mantener con pocos desarrolladores

### Configuración actual

En `backend/server.js:23`:
```javascript
await sequelize.sync({ alter: false });
```

**Opciones de sync():**
- `{ alter: false }` - **ACTUAL**: No modifica tablas existentes (seguro)
- `{ alter: true }` - Actualiza tablas sin borrar datos (útil en desarrollo)
- `{ force: true }` - ⚠️ BORRA y recrea todas las tablas (solo para reset completo)

## Configuración de la Base de Datos

### Archivo de configuración
- **Ubicación**: `backend/config/database.js`
- **Variables de entorno**: `.env`

### Parámetros importantes

```javascript
dialectOptions: {
  charset: 'utf8mb4',           // Soporte completo de caracteres Unicode
  collate: 'utf8mb4_unicode_ci', // Ordenamiento insensible a mayúsculas
  dateStrings: true,             // Fechas como strings
  typeCast: true                 // Conversión automática de tipos
}

define: {
  timestamps: true,              // Agregar fecha_creacion y fecha_actualizacion
  underscored: false,            // Usar camelCase en lugar de snake_case
  createdAt: 'fecha_creacion',   // Nombre personalizado para createdAt
  updatedAt: 'fecha_actualizacion' // Nombre personalizado para updatedAt
}
```

### Zona horaria
- **Configurada**: `timezone: '-06:00'` (Guatemala)
- Todas las fechas se manejan en hora de Guatemala

### Pool de conexiones

**Desarrollo**:
- max: 5 conexiones simultáneas
- min: 0 conexiones mínimas
- acquire: 30 segundos timeout
- idle: 10 segundos antes de liberar

**Producción**:
- max: 15 conexiones simultáneas
- min: 5 conexiones mínimas

## Seeders

El proyecto SÍ utiliza seeders para datos iniciales:
- **Ubicación**: `backend/seeders/`
- **Comando**: `npm run db:seed`

Los seeders permiten poblar la base de datos con datos de prueba o iniciales.

## Scripts disponibles

```bash
# Iniciar servidor (sincroniza automáticamente en desarrollo)
npm start

# Modo desarrollo con auto-reload
npm run dev

# Ejecutar seeders
npm run db:seed

# Backup de base de datos
npm run backup
```

## Modelos cargados

El sistema carga automáticamente todos los modelos desde `backend/models/`:

- Cliente
- Usuario
- Producto
- Categoria
- Sucursal
- Inventario
- Factura / FacturaDetalle
- Cotizacion / CotizacionDetalle
- Carrito
- Y más...

## Verificación de conexión

Al iniciar el servidor, verás:
```
✅ Conexión a base de datos establecida correctamente
✅ Modelos sincronizados correctamente
📋 Modelos cargados (XX): [lista de modelos]
```

## ⚠️ Advertencias importantes

### NO usar en producción con alter: true o force: true
```javascript
// ❌ NUNCA en producción
await sequelize.sync({ force: true }); // Borra TODOS los datos

// ⚠️ Cuidado en producción
await sequelize.sync({ alter: true }); // Puede causar pérdida de datos

// ✅ Seguro en producción
await sequelize.sync({ alter: false }); // No modifica tablas existentes
```

### Migraciones futuras

Si en el futuro necesitas migrar a un sistema de migraciones:

1. Crear directorio `backend/migrations/`
2. Generar migraciones desde modelos actuales
3. Eliminar `sequelize.sync()` de `server.js`
4. Usar `sequelize-cli db:migrate` en lugar de sync

## Conexión a la base de datos

### Variables de entorno (.env)
```
DB_HOST=localhost
DB_PORT=3306
DB_NAME=sistema_paints
DB_USER=tu_usuario
DB_PASSWORD=tu_password
```

### Verificar conexión
```bash
# Desde MySQL
mysql -u root -p
USE sistema_paints;
SHOW TABLES;
```

## Solución de problemas

### Error de conexión
```bash
# Verificar MySQL está corriendo
systemctl status mysql

# Verificar que la base de datos existe
mysql -u root -p -e "SHOW DATABASES LIKE 'sistema_paints';"
```

### Tablas no se crean
- Verificar que `NODE_ENV=development` en `.env`
- El sync solo se ejecuta en modo desarrollo (ver `server.js:19`)

### Problemas con caracteres especiales
- Verificar que las tablas usen `utf8mb4_unicode_ci`
- Revisar `backend/config/database.js`

## Resumen

Este proyecto usa un enfoque simple y directo:
- **Modelos de Sequelize** definen la estructura
- **sequelize.sync()** crea/actualiza las tablas automáticamente
- **Seeders** poblan datos iniciales
- **Sin migraciones** = menos complejidad para proyecto académico

Para un proyecto de producción real, se recomienda migrar a sistema de migraciones.
