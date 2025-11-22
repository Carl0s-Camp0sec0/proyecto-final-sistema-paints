# Instrucciones para Probar la Aplicación en localhost:3000

## ✅ Cambios Implementados (OPCIÓN 1)

Se ha implementado exitosamente la **OPCIÓN 1** con los siguientes cambios:

### 1. Limpieza de scripts innecesarios
- ✅ Eliminados scripts de migraciones de `package.json`
- ✅ Actualizado `.sequelizerc` con documentación clara
- ✅ Mantenido `sequelize.sync()` en `backend/server.js`

### 2. Documentación
- ✅ Creado `backend/README-DB.md` con configuración completa
- ✅ Documentado por qué se usa sync() en lugar de migraciones

### 3. Configuración del servidor
- ✅ Servidor ya configurado para servir archivos estáticos del frontend
- ✅ Rutas del HTML usando `/frontend/` correctamente
- ✅ API configurada en `http://localhost:3000/api`

## 🚀 Cómo Probar la Aplicación

### Paso 1: Verificar que MySQL esté corriendo

```bash
# En Windows (CMD o PowerShell)
net start MySQL80  # o el nombre de tu servicio MySQL

# En Linux/Mac
sudo systemctl start mysql
# o
sudo service mysql start
```

### Paso 2: Verificar que la base de datos exista

```bash
mysql -u root -p
```

Dentro de MySQL:
```sql
SHOW DATABASES LIKE 'sistema_paints';
```

Si no existe:
```sql
CREATE DATABASE sistema_paints CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Paso 3: Iniciar el servidor

```bash
# Desde la raíz del proyecto
npm start

# O en modo desarrollo (con auto-reload)
npm run dev
```

### Paso 4: Verificar que el servidor inicie correctamente

Deberías ver en la consola:
```
🔄 Iniciando Sistema Paints...
📊 Verificando conexión a base de datos...
✅ Conexión a base de datos establecida correctamente
🔧 Sincronizando modelos con base de datos...
✅ Modelos sincronizados correctamente
📋 Modelos cargados (XX): [lista de modelos]

🚀 ===================================
   SISTEMA PAINTS - SERVIDOR INICIADO
🚀 ===================================

📍 URL: http://localhost:3000
🌍 Entorno: development
📊 Base de datos: sistema_paints
```

### Paso 5: Acceder a la aplicación

Abre tu navegador y ve a:

#### ✅ Opción 1: Ruta raíz (redirige automáticamente)
```
http://localhost:3000
```
Se redirigirá a `http://localhost:3000/frontend/pages/public/index.html`

#### ✅ Opción 2: Ruta directa al index
```
http://localhost:3000/frontend/pages/public/index.html
```

#### ✅ Opción 3: Probar la API
```
http://localhost:3000/api/test
```
Deberías ver un JSON con información del servidor.

## 🎯 Diferencias con Live Server

### Con Live Server (127.0.0.1:5500)
- ❌ Solo sirve archivos estáticos
- ❌ No ejecuta el backend
- ❌ Las llamadas API no funcionan (a menos que el backend esté corriendo por separado)
- ✅ Útil para desarrollo solo del frontend

### Con localhost:3000 (Express Server)
- ✅ Sirve archivos estáticos del frontend
- ✅ Ejecuta el backend simultáneamente
- ✅ Las llamadas API funcionan correctamente
- ✅ Todo el sistema funciona integrado
- ✅ Refleja cómo funcionará en producción

## 📱 Rutas Disponibles

### Frontend (Páginas Públicas)
```
http://localhost:3000/frontend/pages/public/index.html         → Página principal
http://localhost:3000/frontend/pages/public/catalogo.html      → Catálogo de productos
http://localhost:3000/frontend/pages/public/tiendas.html       → Sucursales
http://localhost:3000/frontend/pages/public/cotizacion.html    → Cotizaciones
http://localhost:3000/frontend/pages/public/carrito.html       → Carrito de compras
http://localhost:3000/frontend/pages/public/login-cliente.html → Login clientes
http://localhost:3000/frontend/pages/public/login.html         → Login empleados
```

### API Endpoints
```
http://localhost:3000/api/test                  → Test de API
http://localhost:3000/api/productos             → Listar productos
http://localhost:3000/api/categorias            → Listar categorías
http://localhost:3000/api/sucursales            → Listar sucursales
http://localhost:3000/api/auth/login            → Login de usuarios
http://localhost:3000/api/auth/login-cliente    → Login de clientes
```

## 🔧 Solución de Problemas

### Error: "Cannot GET /frontend/pages/public/index.html"
- Verificar que el servidor Express esté corriendo
- Verificar la ruta en `backend/app.js:88`

### Error: "ECONNREFUSED" al cargar datos
- MySQL no está corriendo
- Verificar credenciales en `.env`
- Verificar que la base de datos exista

### Error: "CORS policy"
- Ya está configurado en `backend/app.js:14-62`
- Permite localhost:3000 y 127.0.0.1:5500

### Página se carga pero no hay datos
- Verificar que el backend esté corriendo
- Abrir DevTools → Network para ver las llamadas API
- Verificar que las llamadas a `/api/*` respondan

## 📊 Poblar la Base de Datos

Si necesitas datos de prueba:

```bash
# Ejecutar seeders
npm run db:seed
```

Esto creará:
- Usuarios de ejemplo
- Categorías
- Productos
- Sucursales
- Otros datos iniciales

## ✅ Verificación Final

Para confirmar que TODO funciona:

1. ✅ Servidor inicia sin errores
2. ✅ Se conecta a MySQL correctamente
3. ✅ Carga todos los modelos
4. ✅ `http://localhost:3000` redirige al index
5. ✅ `http://localhost:3000/api/test` responde con JSON
6. ✅ La página principal se carga correctamente
7. ✅ Los estilos CSS se aplican (no se ve texto plano)
8. ✅ Puedes navegar entre páginas
9. ✅ El catálogo carga productos (si hay datos)
10. ✅ El login muestra el formulario

## 🎉 Listo

Con estos cambios, tu aplicación funciona tanto en:
- ✅ **Live Server** (127.0.0.1:5500) - Solo frontend
- ✅ **Express Server** (localhost:3000) - Frontend + Backend integrado

La configuración de base de datos con `sequelize.sync()` es:
- ✅ Simple y directa
- ✅ Funcional para tu proyecto
- ✅ Sin complejidad innecesaria
- ✅ Documentada para futuras referencias

## 📚 Documentación Adicional

- Ver `backend/README-DB.md` para detalles de configuración de BD
- Ver `package.json` para scripts disponibles
- Ver `.sequelizerc` para configuración de Sequelize
