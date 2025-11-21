# Sistema Paints - Guía de Uso del Frontend

## Configuración Completada ✅

El sistema ha sido configurado para que el frontend funcione directamente desde el servidor **sin necesidad de LiveServer**.

### Cambios Realizados:

1. **Puerto actualizado**: El servidor ahora usa el puerto **3001** (en lugar de 3000)
2. **Archivos estáticos**: El frontend se sirve desde el servidor en la ruta `/frontend`
3. **JavaScript separado**: El código JavaScript inline fue movido a archivos externos en `frontend/assets/js/pages/`
4. **Servidor configurado**: El backend sirve correctamente todos los archivos del frontend

---

## Cómo Usar el Sistema

### 1. Iniciar el Servidor

Opción A - Usando el script:
```bash
./start-server.sh
```

Opción B - Manualmente:
```bash
PORT=3001 node backend/server.js
```

### 2. Acceder al Frontend

Una vez iniciado el servidor, abre tu navegador en:

- **Página principal**: http://localhost:3001
- **Login directo**: http://localhost:3001/frontend/pages/public/login.html
- **Dashboard**: http://localhost:3001/frontend/pages/admin/dashboard.html

### 3. Usuarios de Prueba

| Rol | Email | Password |
|-----|-------|----------|
| Administrador | admin@paints.com | admin123 |
| Cajero | cajero@paints.com | cajero123 |
| Digitador | digitador@paints.com | digitador123 |
| Gerente | gerente@paints.com | gerente123 |

---

## Estructura de URLs

El servidor sirve el frontend con las siguientes rutas:

```
http://localhost:3001/
├── /                                    → Redirige al index
├── /frontend/pages/public/
│   ├── index.html                       → Página principal
│   ├── login.html                       → Inicio de sesión
│   ├── register.html                    → Registro
│   └── ...
├── /frontend/pages/admin/
│   ├── dashboard.html                   → Panel de administración
│   ├── usuarios.html                    → Gestión de usuarios
│   └── ...
├── /frontend/assets/
│   ├── css/styles.css                   → Estilos
│   ├── js/config.js                     → Configuración (Puerto: 3001)
│   ├── js/auth.js                       → Autenticación
│   ├── js/pages/login.js                → Lógica de login (separado)
│   └── ...
└── /api/                                → API REST del backend
```

---

## Arquitectura del Proyecto

```
sistema-paints/
├── backend/
│   ├── app.js                           → Configuración Express (sirve frontend)
│   ├── server.js                        → Servidor principal
│   ├── controllers/
│   │   └── authController.js            → Login corregido
│   ├── models/
│   │   └── Usuario.js                   → Modelo sin hooks
│   └── routes/
│       └── auth-simple.js               → Rutas de autenticación
├── frontend/
│   ├── pages/                           → Páginas HTML
│   └── assets/
│       ├── css/                         → Estilos
│       └── js/
│           ├── config.js                → Config API (Puerto 3001)
│           ├── auth.js                  → Manejo de autenticación
│           └── pages/
│               └── login.js             → JS separado del login
└── start-server.sh                      → Script de inicio
```

---

## Solución de Problemas

### El login no funciona
1. Verifica que el servidor esté corriendo en el puerto 3001
2. Abre la consola del navegador (F12) para ver errores
3. Asegúrate de que `config.js` use `http://localhost:3001/api`

### Error de CORS
El servidor ya está configurado para aceptar peticiones desde el navegador. Si ves errores de CORS:
- Verifica que estés accediendo vía `http://localhost:3001` (no `file://`)
- Revisa `backend/app.js` líneas 14-38 para configuración CORS

### Puerto ocupado
Si el puerto 3001 está en uso:
```bash
# Ver qué proceso usa el puerto
lsof -i :3001

# Matar el proceso (reemplaza PID con el número real)
kill <PID>
```

### No se cargan los estilos/JS
1. Verifica que la ruta en el HTML sea correcta: `/frontend/assets/...`
2. Abre las Developer Tools > Network para ver qué archivos fallan
3. Revisa que el servidor esté sirviendo archivos estáticos (línea 88 de `backend/app.js`)

---

## Diferencias con LiveServer

| Aspecto | LiveServer | Servidor Node |
|---------|------------|---------------|
| Puerto | 5500 | 3001 |
| Hot Reload | ✅ Sí | ❌ No (reiniciar manualmente) |
| Autenticación | ❌ Requiere CORS | ✅ Integrada |
| Producción | ❌ Solo desarrollo | ✅ Listo para deploy |
| Archivos estáticos | ✅ Automático | ✅ Configurado en Express |

---

## Próximos Pasos (Opcional)

### 1. Separar más JavaScript Inline
Los siguientes archivos HTML también tienen JavaScript inline que puede separarse:
- `dashboard.html`
- `usuarios.html`
- `productos.html`
- etc.

### 2. Implementar Hot Reload
Puedes usar `nodemon` para recargar automáticamente:
```bash
npm install -D nodemon
PORT=3001 nodemon backend/server.js
```

### 3. Variables de Entorno
Actualiza el `.env` para configurar el puerto:
```env
PORT=3001
```

Y luego en `backend/server.js`:
```javascript
const PORT = process.env.PORT || 3001;
```

---

## Contacto y Soporte

- Proyecto académico: Universidad UMES
- Curso: Bases de Datos II - Programación Web
- Año: 2025

**¡El sistema está listo para usarse sin LiveServer!** 🎉
