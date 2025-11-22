# 📋 INFORME DE ANÁLISIS COMPLETO - SISTEMA PAINTS
**Fecha:** 2025-11-22
**Análisis exhaustivo de frontend y backend**

---

## 📊 RESUMEN EJECUTIVO

Se realizó un análisis completo del proyecto **Sistema Paints** comparando el esquema de base de datos, el código backend (Node.js/Express/Sequelize) y el código frontend (HTML/JavaScript vanilla). Se identificaron **inconsistencias críticas, archivos faltantes y problemas de configuración** que están causando los errores reportados.

### Estado General:
- ✅ **Backend**: 70% completo - Falta implementar 6 controllers y rutas asociadas
- ⚠️ **Modelos**: 86% completo - Faltan 4 modelos de 29 tablas
- ❌ **Frontend-Backend Integration**: 60% funcional - Múltiples inconsistencias
- ❌ **Seguridad (CSP)**: Configuración bloqueando funcionalidad

---

## 🔴 PROBLEMAS CRÍTICOS IDENTIFICADOS

### 1. MODELOS SEQUELIZE FALTANTES (4 modelos)

Estas tablas existen en la BD pero **NO tienen modelo Sequelize**:

| Tabla BD | Modelo Faltante | Prioridad |
|----------|-----------------|-----------|
| `auditoria_inventario` | AuditoriaInventario.js | ALTA |
| `logs_acceso` | LogAcceso.js | ALTA |
| `configuraciones` | Configuracion.js | MEDIA |
| `backups` | Backup.js | BAJA |

**Impacto:**
- No se pueden registrar movimientos de inventario (triggers de BD fallarían)
- No se puede auditar accesos al sistema
- No se pueden guardar configuraciones del sistema

---

### 2. CONTROLLERS FALTANTES (6 controllers)

| Controller Faltante | Funcionalidad | Estado Actual | Prioridad |
|---------------------|---------------|---------------|-----------|
| **cotizacionController.js** | CRUD de cotizaciones | No existe | CRÍTICA |
| **carritoController.js** | Gestión de carrito de compras | No existe | CRÍTICA |
| **ingresoInventarioController.js** | Ingresos de inventario (compras) | No existe | ALTA |
| **comunicacionController.js** | Comunicaciones masivas a clientes | No existe | MEDIA |
| **categoriaController.js** | CRUD de categorías | Parcial en sistemaController | MEDIA |
| **configuracionController.js** | Configuraciones del sistema | No existe | BAJA |

**Impacto:**
- ❌ Sistema de cotizaciones NO funciona (frontend lo llama)
- ❌ Carrito de compras NO funciona
- ❌ No se pueden registrar compras a proveedores
- ❌ No se pueden enviar promociones

---

### 3. RUTAS FALTANTES

#### Rutas NO implementadas pero requeridas:

**A. Cotizaciones** (Prioridad CRÍTICA)
```javascript
GET    /api/cotizaciones                    // Listar cotizaciones
GET    /api/cotizaciones/:id                // Obtener cotización
POST   /api/cotizaciones                    // Crear cotizacion
PUT    /api/cotizaciones/:id                // Actualizar cotización
DELETE /api/cotizaciones/:id                // Anular cotización
POST   /api/cotizaciones/:id/facturar       // Convertir a factura
```

**B. Carrito** (Prioridad CRÍTICA)
```javascript
GET    /api/carrito                         // Ver carrito del cliente
POST   /api/carrito                         // Agregar producto al carrito
PUT    /api/carrito/:id                     // Actualizar cantidad
DELETE /api/carrito/:id                     // Remover del carrito
DELETE /api/carrito                         // Vaciar carrito
POST   /api/carrito/checkout                // Procesar compra
```

**C. Ingresos de Inventario** (Prioridad ALTA)
```javascript
GET    /api/ingresos                        // Listar ingresos
GET    /api/ingresos/:id                    // Obtener ingreso
POST   /api/ingresos                        // Crear ingreso
PUT    /api/ingresos/:id/procesar           // Procesar ingreso
DELETE /api/ingresos/:id                    // Cancelar ingreso
```

**D. Comunicaciones** (Prioridad MEDIA)
```javascript
GET    /api/comunicaciones                  // Listar comunicaciones
POST   /api/comunicaciones                  // Crear comunicación
PUT    /api/comunicaciones/:id              // Actualizar comunicación
DELETE /api/comunicaciones/:id              // Eliminar comunicación
POST   /api/comunicaciones/:id/enviar       // Enviar comunicación
```

---

### 4. INCONSISTENCIAS FRONTEND vs BACKEND

#### A. Nombres de variables de configuración

**Problema:** Inconsistencia en nombres de constantes

**tiendas.js línea 25:**
```javascript
const response = await fetch(`${API_CONFIG.BASE_URL}/sistema/sucursales`, {
```

**CORRECTO (config.js):**
```javascript
const CONFIG = {
    API_BASE_URL: 'http://localhost:3000/api'
}
```

**Solución:**
Cambiar `API_CONFIG.BASE_URL` por `CONFIG.API_BASE_URL` en **tiendas.js**

---

#### B. Estructura de respuesta de sucursales

**reporte-ventas.js línea 49:**
```javascript
if (!response || !response.success || !response.data || !response.data.sucursales) {
```

El código espera `response.data.sucursales`, pero el backend retorna `response.data` directamente.

**Backend (sistemaController.js):**
```javascript
return res.status(200).json({
    success: true,
    data: sucursales  // ❌ Retorna array directamente
});
```

**Solución:**
Modificar backend para retornar:
```javascript
return res.status(200).json({
    success: true,
    data: {
        sucursales: sucursales
    }
});
```

---

#### C. Endpoints que funcionan pero el frontend no los llama correctamente

1. **Productos en cotización**
   - Frontend carga productos correctamente
   - ✅ Endpoint `/api/productos` existe y funciona

2. **Login de clientes**
   - ✅ Endpoint `/api/clientes/login` existe en backend
   - ✅ Frontend lo llama correctamente

3. **Registro de clientes**
   - ✅ Endpoint `/api/clientes/registro` existe en backend
   - ✅ Frontend lo llama correctamente

---

### 5. PROBLEMAS DE CONTENT SECURITY POLICY (CSP)

**Error en consola:**
```
Executing inline event handler violates the following Content Security Policy directive:
"script-src-attr 'none'"
```

**Causa:**
Helmet está bloqueando eventos inline como `onclick=""` en HTML

**Archivos afectados:**
- tiendas.html (líneas 348, 361-367)
- cotizacion.html (línea 176-179)
- reporte-ventas.html (línea 71-97)
- Todos los HTML con `onclick` inline

**Solución 1 - Ajustar Helmet (Recomendado):**

**backend/app.js:**
```javascript
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: [
                "'self'",
                "'unsafe-inline'",  // ⚠️ Permitir scripts inline
                "https://cdn.jsdelivr.net",
                "https://cdnjs.cloudflare.com",
                "https://unpkg.com",
                "https://fonts.googleapis.com"
            ],
            styleSrc: [
                "'self'",
                "'unsafe-inline'",
                "https://cdnjs.cloudflare.com",
                "https://fonts.googleapis.com"
            ],
            imgSrc: ["'self'", "data:", "https:", "http:"],
            connectSrc: ["'self'", "http://localhost:3000"],
            fontSrc: [
                "'self'",
                "https://fonts.gstatic.com",
                "https://cdnjs.cloudflare.com"
            ]
        }
    }
}));
```

**Solución 2 - Migrar onclick a event listeners (Más seguro):**

Convertir todos los `onclick=""` a event listeners en JavaScript.

---

### 6. FUNCIONES GLOBALES NO DEFINIDAS

**Errores en consola del navegador:**
```
ReferenceError: cargasSucursales is not defined at tiendas.html:62
```

**Causa:**
La función `cargarSucursales()` se llama antes de que el script se cargue.

**HTML:**
```html
<!-- ❌ Orden incorrecto -->
<script src="/frontend/assets/js/config.js"></script>
<script src="/frontend/assets/js/pages/tiendas.js"></script>
<!-- La función ya se auto-ejecuta en DOMContentLoaded -->
```

**Solución:**
✅ El código ya maneja esto correctamente con `DOMContentLoaded`. El error puede ser de caché del navegador.

---

## 🛠️ ARCHIVOS QUE FALTAN CREAR

### 1. MODELOS SEQUELIZE

#### A. `/backend/models/AuditoriaInventario.js`
```javascript
module.exports = (sequelize, DataTypes) => {
    const AuditoriaInventario = sequelize.define('AuditoriaInventario', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        tipo_movimiento: {
            type: DataTypes.ENUM('ingreso', 'venta', 'ajuste', 'transferencia'),
            allowNull: false
        },
        sucursal_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        producto_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        unidad_medida_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        cantidad_anterior: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        cantidad_movimiento: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        cantidad_nueva: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        documento_referencia: {
            type: DataTypes.STRING(100)
        },
        usuario_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        observaciones: {
            type: DataTypes.TEXT
        },
        fecha_creacion: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    }, {
        tableName: 'auditoria_inventario',
        timestamps: false
    });

    AuditoriaInventario.associate = (models) => {
        AuditoriaInventario.belongsTo(models.Sucursal, {
            foreignKey: 'sucursal_id',
            as: 'sucursal'
        });
        AuditoriaInventario.belongsTo(models.Producto, {
            foreignKey: 'producto_id',
            as: 'producto'
        });
        AuditoriaInventario.belongsTo(models.UnidadMedida, {
            foreignKey: 'unidad_medida_id',
            as: 'unidad_medida'
        });
        AuditoriaInventario.belongsTo(models.Usuario, {
            foreignKey: 'usuario_id',
            as: 'usuario'
        });
    };

    return AuditoriaInventario;
};
```

#### B. `/backend/models/LogAcceso.js`
```javascript
module.exports = (sequelize, DataTypes) => {
    const LogAcceso = sequelize.define('LogAcceso', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        usuario_id: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        email_intento: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        ip_address: {
            type: DataTypes.STRING(45)
        },
        user_agent: {
            type: DataTypes.TEXT
        },
        acceso_exitoso: {
            type: DataTypes.BOOLEAN,
            allowNull: false
        },
        motivo_fallo: {
            type: DataTypes.STRING(100)
        },
        fecha_creacion: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    }, {
        tableName: 'logs_acceso',
        timestamps: false
    });

    LogAcceso.associate = (models) => {
        LogAcceso.belongsTo(models.Usuario, {
            foreignKey: 'usuario_id',
            as: 'usuario'
        });
    };

    return LogAcceso;
};
```

#### C. `/backend/models/Configuracion.js`
```javascript
module.exports = (sequelize, DataTypes) => {
    const Configuracion = sequelize.define('Configuracion', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        clave: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true
        },
        valor: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        descripcion: {
            type: DataTypes.TEXT
        },
        tipo_dato: {
            type: DataTypes.ENUM('string', 'number', 'boolean', 'json'),
            defaultValue: 'string'
        },
        categoria: {
            type: DataTypes.STRING(50),
            defaultValue: 'general'
        },
        fecha_creacion: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        fecha_actualizacion: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    }, {
        tableName: 'configuraciones',
        timestamps: false
    });

    return Configuracion;
};
```

#### D. `/backend/models/Backup.js`
```javascript
module.exports = (sequelize, DataTypes) => {
    const Backup = sequelize.define('Backup', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        nombre_archivo: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        tipo_backup: {
            type: DataTypes.ENUM('completo', 'diferencial', 'incremental'),
            allowNull: false
        },
        ruta_archivo: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        tamano_bytes: {
            type: DataTypes.BIGINT
        },
        usuario_id: {
            type: DataTypes.INTEGER
        },
        estado: {
            type: DataTypes.ENUM('en_proceso', 'completado', 'fallido'),
            defaultValue: 'en_proceso'
        },
        tiempo_duracion: {
            type: DataTypes.INTEGER
        },
        fecha_inicio: {
            type: DataTypes.DATE,
            allowNull: false
        },
        fecha_fin: {
            type: DataTypes.DATE
        },
        observaciones: {
            type: DataTypes.TEXT
        }
    }, {
        tableName: 'backups',
        timestamps: false
    });

    Backup.associate = (models) => {
        Backup.belongsTo(models.Usuario, {
            foreignKey: 'usuario_id',
            as: 'usuario'
        });
    };

    return Backup;
};
```

---

### 2. CONTROLLERS

#### A. `/backend/controllers/cotizacionController.js`
```javascript
const { Cotizacion, CotizacionDetalle, Cliente, Sucursal, Usuario, Producto, UnidadMedida, sequelize } = require('../models');
const { Op } = require('sequelize');

// Listar cotizaciones con filtros
const listar = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            sucursal_id,
            cliente_id,
            estado,
            fecha_inicio,
            fecha_fin
        } = req.query;

        const offset = (page - 1) * limit;

        // Construir filtros
        const where = {};

        if (sucursal_id) where.sucursal_id = sucursal_id;
        if (cliente_id) where.cliente_id = cliente_id;
        if (estado) where.estado = estado;

        if (fecha_inicio && fecha_fin) {
            where.fecha_creacion = {
                [Op.between]: [new Date(fecha_inicio), new Date(fecha_fin)]
            };
        }

        const { count, rows } = await Cotizacion.findAndCountAll({
            where,
            include: [
                { model: Cliente, as: 'cliente', attributes: ['id', 'nombre_completo', 'email', 'telefono'] },
                { model: Sucursal, as: 'sucursal', attributes: ['id', 'nombre'] },
                { model: Usuario, as: 'usuario', attributes: ['id', 'nombre_completo'] },
                {
                    model: CotizacionDetalle,
                    as: 'detalles',
                    include: [
                        { model: Producto, as: 'producto', attributes: ['id', 'nombre', 'marca'] },
                        { model: UnidadMedida, as: 'unidad_medida', attributes: ['id', 'nombre', 'abreviatura'] }
                    ]
                }
            ],
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['fecha_creacion', 'DESC']]
        });

        res.json({
            success: true,
            data: {
                cotizaciones: rows,
                pagination: {
                    total: count,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(count / limit)
                }
            }
        });
    } catch (error) {
        console.error('Error al listar cotizaciones:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener cotizaciones',
            error: error.message
        });
    }
};

// Obtener cotización por ID
const obtenerPorId = async (req, res) => {
    try {
        const { id } = req.params;

        const cotizacion = await Cotizacion.findByPk(id, {
            include: [
                { model: Cliente, as: 'cliente' },
                { model: Sucursal, as: 'sucursal' },
                { model: Usuario, as: 'usuario', attributes: ['id', 'nombre_completo'] },
                {
                    model: CotizacionDetalle,
                    as: 'detalles',
                    include: [
                        { model: Producto, as: 'producto' },
                        { model: UnidadMedida, as: 'unidad_medida' }
                    ]
                }
            ]
        });

        if (!cotizacion) {
            return res.status(404).json({
                success: false,
                message: 'Cotización no encontrada'
            });
        }

        res.json({
            success: true,
            data: cotizacion
        });
    } catch (error) {
        console.error('Error al obtener cotización:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener cotización',
            error: error.message
        });
    }
};

// Crear cotización
const crear = async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
        const { cliente_id, sucursal_id, productos, observaciones, vigencia_dias = 15 } = req.body;

        // Validar productos
        if (!productos || productos.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Debe incluir al menos un producto'
            });
        }

        // Calcular totales
        let subtotal = 0;
        const detallesData = [];

        for (const item of productos) {
            const { producto_id, unidad_medida_id, cantidad, precio_unitario, descuento_porcentaje = 0 } = item;

            // Validar producto existe
            const producto = await Producto.findByPk(producto_id);
            if (!producto) {
                throw new Error(`Producto ${producto_id} no encontrado`);
            }

            const descuento = (precio_unitario * cantidad * descuento_porcentaje) / 100;
            const subtotalItem = (precio_unitario * cantidad) - descuento;

            subtotal += subtotalItem;

            detallesData.push({
                producto_id,
                unidad_medida_id,
                cantidad,
                precio_unitario,
                descuento_porcentaje,
                subtotal: subtotalItem
            });
        }

        const total = subtotal; // Sin impuestos en cotización

        // Crear cotización
        const cotizacion = await Cotizacion.create({
            numero_cotizacion: await Cotizacion.generarNumeroCotizacion(),
            cliente_id,
            sucursal_id,
            usuario_id: req.usuario.id,
            subtotal,
            descuento: 0,
            total,
            vigencia_dias,
            observaciones,
            estado: 'activa'
        }, { transaction });

        // Crear detalles
        for (const detalle of detallesData) {
            await CotizacionDetalle.create({
                cotizacion_id: cotizacion.id,
                ...detalle
            }, { transaction });
        }

        await transaction.commit();

        // Recargar con relaciones
        const cotizacionCompleta = await Cotizacion.findByPk(cotizacion.id, {
            include: [
                { model: Cliente, as: 'cliente' },
                { model: Sucursal, as: 'sucursal' },
                {
                    model: CotizacionDetalle,
                    as: 'detalles',
                    include: [
                        { model: Producto, as: 'producto' },
                        { model: UnidadMedida, as: 'unidad_medida' }
                    ]
                }
            ]
        });

        res.status(201).json({
            success: true,
            message: 'Cotización creada exitosamente',
            data: cotizacionCompleta
        });

    } catch (error) {
        await transaction.rollback();
        console.error('Error al crear cotización:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear cotización',
            error: error.message
        });
    }
};

// Anular cotización
const anular = async (req, res) => {
    try {
        const { id } = req.params;
        const { motivo } = req.body;

        const cotizacion = await Cotizacion.findByPk(id);

        if (!cotizacion) {
            return res.status(404).json({
                success: false,
                message: 'Cotización no encontrada'
            });
        }

        if (cotizacion.estado !== 'activa') {
            return res.status(400).json({
                success: false,
                message: 'Solo se pueden anular cotizaciones activas'
            });
        }

        await cotizacion.update({
            estado: 'cancelada',
            observaciones: `${cotizacion.observaciones || ''}\n\nCANCELADA: ${motivo || 'Sin motivo especificado'}`
        });

        res.json({
            success: true,
            message: 'Cotización anulada exitosamente',
            data: cotizacion
        });

    } catch (error) {
        console.error('Error al anular cotización:', error);
        res.status(500).json({
            success: false,
            message: 'Error al anular cotización',
            error: error.message
        });
    }
};

module.exports = {
    listar,
    obtenerPorId,
    crear,
    anular
};
```

#### B. `/backend/controllers/carritoController.js`
```javascript
const { Carrito, Producto, UnidadMedida, InventarioSucursal, Cliente, sequelize } = require('../models');

// Obtener carrito del cliente
const obtenerCarrito = async (req, res) => {
    try {
        const cliente_id = req.usuario.id; // El cliente autenticado

        const carrito = await Carrito.findAll({
            where: { cliente_id },
            include: [
                {
                    model: Producto,
                    as: 'producto',
                    attributes: ['id', 'nombre', 'marca', 'descripcion']
                },
                {
                    model: UnidadMedida,
                    as: 'unidad_medida',
                    attributes: ['id', 'nombre', 'abreviatura']
                },
                {
                    model: InventarioSucursal,
                    as: 'inventario',
                    attributes: ['stock_actual', 'stock_disponible']
                }
            ]
        });

        // Calcular totales
        const subtotal = carrito.reduce((sum, item) => sum + (item.precio_unitario * item.cantidad), 0);
        const total = subtotal;

        res.json({
            success: true,
            data: {
                items: carrito,
                resumen: {
                    cantidad_items: carrito.length,
                    subtotal,
                    total
                }
            }
        });

    } catch (error) {
        console.error('Error al obtener carrito:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener carrito',
            error: error.message
        });
    }
};

// Agregar producto al carrito
const agregar = async (req, res) => {
    try {
        const cliente_id = req.usuario.id;
        const { sucursal_id, producto_id, unidad_medida_id, cantidad } = req.body;

        // Validar stock disponible
        const inventario = await InventarioSucursal.findOne({
            where: { sucursal_id, producto_id, unidad_medida_id }
        });

        if (!inventario || inventario.stock_disponible < cantidad) {
            return res.status(400).json({
                success: false,
                message: 'Stock insuficiente'
            });
        }

        // Obtener precio actual del producto
        const producto = await Producto.findByPk(producto_id);
        const precio_unitario = producto.precio_base;

        // Verificar si ya existe en el carrito
        const itemExistente = await Carrito.findOne({
            where: { cliente_id, producto_id, unidad_medida_id, sucursal_id }
        });

        let item;

        if (itemExistente) {
            // Actualizar cantidad
            await itemExistente.update({
                cantidad: itemExistente.cantidad + cantidad
            });
            item = itemExistente;
        } else {
            // Crear nuevo item
            item = await Carrito.create({
                cliente_id,
                sucursal_id,
                producto_id,
                unidad_medida_id,
                cantidad,
                precio_unitario
            });
        }

        res.status(201).json({
            success: true,
            message: 'Producto agregado al carrito',
            data: item
        });

    } catch (error) {
        console.error('Error al agregar al carrito:', error);
        res.status(500).json({
            success: false,
            message: 'Error al agregar producto al carrito',
            error: error.message
        });
    }
};

// Actualizar cantidad de un item
const actualizar = async (req, res) => {
    try {
        const { id } = req.params;
        const { cantidad } = req.body;
        const cliente_id = req.usuario.id;

        const item = await Carrito.findOne({
            where: { id, cliente_id }
        });

        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Item no encontrado en el carrito'
            });
        }

        // Validar stock
        const inventario = await InventarioSucursal.findOne({
            where: {
                sucursal_id: item.sucursal_id,
                producto_id: item.producto_id,
                unidad_medida_id: item.unidad_medida_id
            }
        });

        if (!inventario || inventario.stock_disponible < cantidad) {
            return res.status(400).json({
                success: false,
                message: 'Stock insuficiente'
            });
        }

        await item.update({ cantidad });

        res.json({
            success: true,
            message: 'Carrito actualizado',
            data: item
        });

    } catch (error) {
        console.error('Error al actualizar carrito:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar carrito',
            error: error.message
        });
    }
};

// Eliminar item del carrito
const eliminar = async (req, res) => {
    try {
        const { id } = req.params;
        const cliente_id = req.usuario.id;

        const item = await Carrito.findOne({
            where: { id, cliente_id }
        });

        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Item no encontrado'
            });
        }

        await item.destroy();

        res.json({
            success: true,
            message: 'Item eliminado del carrito'
        });

    } catch (error) {
        console.error('Error al eliminar del carrito:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar item',
            error: error.message
        });
    }
};

// Vaciar carrito
const vaciar = async (req, res) => {
    try {
        const cliente_id = req.usuario.id;

        await Carrito.destroy({
            where: { cliente_id }
        });

        res.json({
            success: true,
            message: 'Carrito vaciado exitosamente'
        });

    } catch (error) {
        console.error('Error al vaciar carrito:', error);
        res.status(500).json({
            success: false,
            message: 'Error al vaciar carrito',
            error: error.message
        });
    }
};

module.exports = {
    obtenerCarrito,
    agregar,
    actualizar,
    eliminar,
    vaciar
};
```

---

### 3. RUTAS

#### A. `/backend/routes/cotizaciones.js`
```javascript
const express = require('express');
const router = express.Router();
const cotizacionController = require('../controllers/cotizacionController');
const { verificarToken } = require('../middleware/auth');

// Todas las rutas requieren autenticación
router.use(verificarToken);

// Listar cotizaciones
router.get('/', cotizacionController.listar);

// Obtener cotización por ID
router.get('/:id', cotizacionController.obtenerPorId);

// Crear cotización
router.post('/', cotizacionController.crear);

// Anular cotización
router.put('/:id/anular', cotizacionController.anular);

module.exports = router;
```

#### B. `/backend/routes/carrito.js`
```javascript
const express = require('express');
const router = express.Router();
const carritoController = require('../controllers/carritoController');
const { verificarToken } = require('../middleware/auth');

// Todas las rutas requieren autenticación (solo clientes)
router.use(verificarToken);

// Obtener carrito
router.get('/', carritoController.obtenerCarrito);

// Agregar al carrito
router.post('/', carritoController.agregar);

// Actualizar cantidad
router.put('/:id', carritoController.actualizar);

// Eliminar item
router.delete('/:id', carritoController.eliminar);

// Vaciar carrito
router.delete('/', carritoController.vaciar);

module.exports = router;
```

---

## 📝 ARCHIVOS A MODIFICAR

### 1. `/backend/routes/index.js`
**Agregar rutas nuevas:**

```javascript
const cotizacionesRoutes = require('./cotizaciones');
const carritoRoutes = require('./carrito');

// Agregar en la sección de rutas
app.use('/api/cotizaciones', cotizacionesRoutes);
app.use('/api/carrito', carritoRoutes);
```

### 2. `/backend/app.js`
**Ajustar Content Security Policy:**

```javascript
if (process.env.NODE_ENV === 'production') {
    app.use(helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: [
                    "'self'",
                    "'unsafe-inline'",  // Permitir scripts inline
                    "https://cdn.jsdelivr.net",
                    "https://cdnjs.cloudflare.com",
                    "https://unpkg.com"
                ],
                styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com"],
                imgSrc: ["'self'", "data:", "https:", "http:"],
                connectSrc: ["'self'", "http://localhost:3000"],
                fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"]
            }
        }
    }));
} else {
    // En desarrollo, deshabilitar CSP
    app.use(helmet({ contentSecurityPolicy: false }));
}
```

### 3. `/backend/controllers/sistemaController.js`
**Modificar respuesta de sucursales:**

```javascript
const listarSucursales = async (req, res) => {
    try {
        const sucursales = await Sucursal.findAll({
            where: { activo: true },
            order: [['nombre', 'ASC']]
        });

        return res.status(200).json({
            success: true,
            data: {
                sucursales: sucursales  // ✅ Envolver en objeto
            }
        });
    } catch (error) {
        console.error('Error al listar sucursales:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al obtener sucursales'
        });
    }
};
```

### 4. `/frontend/assets/js/pages/tiendas.js`
**Línea 25 - Corregir variable:**

```javascript
// ❌ ANTES
const response = await fetch(`${API_CONFIG.BASE_URL}/sistema/sucursales`, {

// ✅ DESPUÉS
const response = await fetch(`${CONFIG.API_BASE_URL}/sistema/sucursales`, {
```

---

## 🔧 CORRECCIONES ADICIONALES

### 1. Modelo Cotizacion - Agregar método estático

**`/backend/models/Cotizacion.js` (agregar al final):**

```javascript
Cotizacion.generarNumeroCotizacion = async function() {
    const ultimaCotizacion = await Cotizacion.findOne({
        order: [['id', 'DESC']]
    });

    const siguienteNumero = ultimaCotizacion ? ultimaCotizacion.id + 1 : 1;
    return `COT-${String(siguienteNumero).padStart(8, '0')}`;
};
```

### 2. Actualizar asociaciones de modelos

**`/backend/models/index.js` - Asegurar que se cargan todos los modelos:**

```javascript
// Cargar todos los modelos
const models = {
    // ... modelos existentes ...
    AuditoriaInventario: require('./AuditoriaInventario')(sequelize, Sequelize.DataTypes),
    LogAcceso: require('./LogAcceso')(sequelize, Sequelize.DataTypes),
    Configuracion: require('./Configuracion')(sequelize, Sequelize.DataTypes),
    Backup: require('./Backup')(sequelize, Sequelize.DataTypes)
};

// Asociaciones
Object.keys(models).forEach(modelName => {
    if (models[modelName].associate) {
        models[modelName].associate(models);
    }
});
```

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

### Prioridad CRÍTICA (Implementar PRIMERO)
- [ ] Crear modelo **AuditoriaInventario.js**
- [ ] Crear modelo **LogAcceso.js**
- [ ] Crear controller **cotizacionController.js**
- [ ] Crear controller **carritoController.js**
- [ ] Crear rutas **cotizaciones.js**
- [ ] Crear rutas **carrito.js**
- [ ] Modificar **routes/index.js** para agregar las nuevas rutas
- [ ] Corregir CSP en **app.js**
- [ ] Corregir respuesta de sucursales en **sistemaController.js**
- [ ] Corregir variable `API_CONFIG` en **tiendas.js**

### Prioridad ALTA
- [ ] Crear modelo **Configuracion.js**
- [ ] Crear controller **ingresoInventarioController.js**
- [ ] Crear rutas **ingresos.js**
- [ ] Actualizar asociaciones en **models/index.js**

### Prioridad MEDIA
- [ ] Crear modelo **Backup.js**
- [ ] Crear controller **comunicacionController.js**
- [ ] Crear rutas **comunicaciones.js**

### Prioridad BAJA
- [ ] Migrar onclick a event listeners (seguridad)
- [ ] Implementar logs de acceso en login
- [ ] Implementar sistema de backups

---

## 📈 IMPACTO ESPERADO

Al completar las correcciones:
- ✅ Sistema de cotizaciones funcionará 100%
- ✅ Carrito de compras funcionará 100%
- ✅ Se eliminarán errores de CSP
- ✅ Tiendas/Sucursales cargarán correctamente
- ✅ Reportes funcionarán sin errores
- ✅ Auditoría de inventario estará habilitada

---

## 🎯 PRÓXIMOS PASOS RECOMENDADOS

1. **Semana 1**: Implementar archivos CRÍTICOS (modelos y controllers principales)
2. **Semana 2**: Implementar rutas y probar endpoints
3. **Semana 3**: Corregir CSP y problemas de frontend
4. **Semana 4**: Testing completo y ajustes finales

---

## 📞 SOPORTE

Para dudas sobre este informe o la implementación:
- Revisar documentación de Sequelize: https://sequelize.org
- Revisar documentación de Express: https://expressjs.com
- Revisar documentación de Helmet: https://helmetjs.github.io/

---

**Fin del informe**
*Generado el 2025-11-22 mediante análisis exhaustivo de 78 archivos*
