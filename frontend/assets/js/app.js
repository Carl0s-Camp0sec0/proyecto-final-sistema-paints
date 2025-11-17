// Aplicación principal - Maneja routing y estado global
class App {
    constructor() {
        this.currentPage = null;
        this.cart = this.getStoredCart();
        this.currentSucursal = 1; // Sucursal por defecto
        this.init();
    }

    // Inicializar aplicación
    init() {
        this.setupEventListeners();
        this.initializeRouter();
        this.loadInitialData();
    }

    // Configurar event listeners globales
    setupEventListeners() {
        // Manejar cambios en el hash para routing
        window.addEventListener('hashchange', () => {
            this.handleRoute();
        });

        // Manejar submit de formularios
        document.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleFormSubmit(e);
        });

        // Manejar clicks en enlaces de navegación
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-route]')) {
                e.preventDefault();
                const route = e.target.getAttribute('data-route');
                window.location.hash = route;
            }
        });
    }

    // Inicializar router
    initializeRouter() {
        // Si no hay hash, redirigir según estado de auth
        if (!window.location.hash) {
            window.location.hash = auth.isAuthenticated() ? '#dashboard' : '#login';
        } else {
            this.handleRoute();
        }
    }

    // Manejar rutas
    handleRoute() {
        const hash = window.location.hash.slice(1);
        const [route, ...params] = hash.split('/');

        // Proteger rutas que requieren autenticación
        const protectedRoutes = ['dashboard', 'inventario', 'ventas', 'facturacion', 'reportes'];
        
        if (protectedRoutes.includes(route) && !auth.isAuthenticated()) {
            window.location.hash = '#login';
            return;
        }

        // Redirigir a dashboard si ya está logueado y trata de acceder a login
        if ((route === 'login' || route === 'register') && auth.isAuthenticated()) {
            window.location.hash = '#dashboard';
            return;
        }

        this.currentPage = route;
        this.renderPage(route, params);
    }

    // Renderizar página según ruta
    async renderPage(route, params) {
        const app = document.getElementById('app');
        app.innerHTML = Components.loading();

        try {
            switch (route) {
                case 'login':
                    app.innerHTML = await this.renderLoginPage();
                    break;
                
                case 'register':
                    app.innerHTML = await this.renderRegisterPage();
                    break;
                
                case 'dashboard':
                    app.innerHTML = await this.renderDashboard();
                    break;
                
                case 'inventario':
                    app.innerHTML = await this.renderInventarioPage();
                    break;
                
                case 'ventas':
                    app.innerHTML = await this.renderVentasPage();
                    break;
                
                case 'facturacion':
                    app.innerHTML = await this.renderFacturacionPage();
                    break;
                
                case 'reportes':
                    app.innerHTML = await this.renderReportesPage();
                    break;
                
                case 'productos':
                    app.innerHTML = await this.renderProductosPublicos();
                    break;
                
                default:
                    app.innerHTML = await this.render404();
            }
        } catch (error) {
            console.error('Error rendering page:', error);
            app.innerHTML = this.renderError(error.message);
        }
    }

    // === PÁGINAS ===

    // Página de login
    async renderLoginPage() {
        return `
            <div class="login-container">
                <div class="login-left">
                    <div class="login-brand">
                        <h1 class="login-title">El color de tus ideas</h1>
                        <p class="login-subtitle">Calidad que inspira.</p>
                    </div>
                    <div class="login-footer">
                        © 2024 ${CONFIG.APP_NAME}. Todos los derechos reservados.
                        <div style="margin-top: 0.5rem;">
                            <a href="#" style="color: currentColor; margin-right: 1rem;">Términos de servicio</a>
                            <a href="#" style="color: currentColor;">Política de privacidad</a>
                        </div>
                    </div>
                </div>
                <div class="login-right">
                    <div class="login-form-container">
                        <h2 class="login-form-title">Accede a tu cuenta</h2>
                        <p class="login-form-subtitle">Bienvenido a ${CONFIG.APP_NAME}</p>
                        
                        <form id="loginForm">
                            <div class="form-group">
                                <label class="form-label">Correo electrónico / Usuario</label>
                                <input type="email" name="email" class="form-input" 
                                       placeholder="tu@email.com" required>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Contraseña</label>
                                <div class="password-input-container">
                                    <input type="password" name="password" class="form-input" 
                                           placeholder="••••••••" required>
                                    <button type="button" class="password-toggle" onclick="this.togglePasswordVisibility()">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                </div>
                            </div>
                            
                            <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 1rem;">
                                Entrar
                            </button>
                        </form>
                        
                        <div class="login-links">
                            ¿No tienes una cuenta? <a href="#register">Regístrate aquí</a>
                        </div>
                        
                        <!-- Usuarios de prueba -->
                        <div style="margin-top: 2rem; padding: 1rem; background: var(--gray-100); border-radius: var(--border-radius);">
                            <p style="font-size: 0.875rem; color: var(--gray-600); margin-bottom: 0.5rem;">
                                <strong>Usuarios de prueba:</strong>
                            </p>
                            <div style="font-size: 0.75rem; color: var(--gray-500);">
                                <div>Admin: admin@paints.com / admin123</div>
                                <div>Cajero: cajero@paints.com / cajero123</div>
                                <div>Digitador: digitador@paints.com / digitador123</div>
                                <div>Gerente: gerente@paints.com / gerente123</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Dashboard principal
    async renderDashboard() {
        let dashboardContent = '';

        try {
            // Obtener datos del dashboard según rol
            const promises = [];
            
            if (auth.hasPermission([CONFIG.ROLES.ADMIN, CONFIG.ROLES.GERENTE])) {
                promises.push(api.getEstadisticasVentas());
            }
            
            promises.push(api.getInventarioSucursal(this.currentSucursal, { limit: 5 }));
            
            const results = await Promise.all(promises);
            const estadisticas = results[0];
            const inventario = results[results.length - 1];

            // Generar contenido del dashboard
            dashboardContent = `
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem; margin-bottom: 2rem;">
                    ${auth.hasPermission([CONFIG.ROLES.ADMIN, CONFIG.ROLES.GERENTE]) && estadisticas?.success ? `
                        <div class="card">
                            <div class="card-header">
                                <h3 class="card-title">Estadísticas de Ventas</h3>
                            </div>
                            <div class="card-content">
                                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem;">
                                    <div style="text-align: center;">
                                        <div style="font-size: 2rem; font-weight: 600; color: var(--success-green);">
                                            ${estadisticas.data?.estadisticas_generales?.total_facturas || 0}
                                        </div>
                                        <div style="color: var(--gray-600);">Total Facturas</div>
                                    </div>
                                    <div style="text-align: center;">
                                        <div style="font-size: 2rem; font-weight: 600; color: var(--primary-blue);">
                                            ${Utils.formatCurrency(estadisticas.data?.estadisticas_generales?.monto_total || 0)}
                                        </div>
                                        <div style="color: var(--gray-600);">Monto Total</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ` : ''}
                    
                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">Accesos Rápidos</h3>
                        </div>
                        <div class="card-content">
                            <div style="display: grid; gap: 0.5rem;">
                                ${auth.hasPermission([CONFIG.ROLES.ADMIN, CONFIG.ROLES.CAJERO, CONFIG.ROLES.DIGITADOR]) ? `
                                    <a href="#facturacion" class="btn btn-primary">
                                        <i class="fas fa-plus"></i>
                                        Nueva Venta
                                    </a>
                                ` : ''}
                                <a href="#inventario" class="btn btn-secondary">
                                    <i class="fas fa-boxes"></i>
                                    Ver Inventario
                                </a>
                                ${auth.hasPermission([CONFIG.ROLES.ADMIN, CONFIG.ROLES.GERENTE]) ? `
                                    <a href="#reportes" class="btn btn-secondary">
                                        <i class="fas fa-chart-bar"></i>
                                        Ver Reportes
                                    </a>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Inventario Reciente</h3>
                        <a href="#inventario" class="btn btn-sm btn-secondary">Ver Todo</a>
                    </div>
                    <div class="card-content">
                        ${inventario?.success ? Components.inventoryTable(inventario.data) : '<p>Error cargando inventario</p>'}
                    </div>
                </div>
            `;

        } catch (error) {
            console.error('Error loading dashboard:', error);
            dashboardContent = `
                <div class="card">
                    <div class="card-content">
                        <p style="color: var(--error-red);">Error cargando el dashboard: ${error.message}</p>
                    </div>
                </div>
            `;
        }

        return `
            ${Components.header()}
            <div class="main-layout">
                ${Components.sidebar()}
                <main class="main-content">
                    <div style="margin-bottom: 2rem;">
                        <h1>Dashboard</h1>
                        <p style="color: var(--gray-600);">Bienvenido, ${auth.user.nombre_completo}</p>
                    </div>
                    ${dashboardContent}
                </main>
            </div>
        `;
    }

    // Página de inventario
    async renderInventarioPage() {
        try {
            const response = await api.getInventarioSucursal(this.currentSucursal, { page: 1, limit: 20 });
            
            if (!response.success) {
                throw new Error(response.message);
            }

            return `
                ${Components.header()}
                <div class="main-layout">
                    ${Components.sidebar()}
                    <main class="main-content">
                        <div class="card">
                            <div class="card-header">
                                <h1 class="card-title">Gestión de Inventario</h1>
                                ${auth.hasPermission([CONFIG.ROLES.ADMIN, CONFIG.ROLES.DIGITADOR]) ? `
                                    <button class="btn btn-primary" onclick="App.showAddProductForm()">
                                        <i class="fas fa-plus"></i>
                                        Añadir Producto
                                    </button>
                                ` : ''}
                            </div>
                            
                            <div class="card-content">
                                <div style="margin-bottom: 1.5rem; display: flex; gap: 1rem; align-items: center;">
                                    <div style="flex: 1;">
                                        <input type="text" placeholder="Buscar por nombre, código o descripción..." 
                                               class="form-input" id="searchInput">
                                    </div>
                                    <select class="form-select" style="width: 200px;" id="categoryFilter">
                                        <option value="">Todas las Categorías</option>
                                    </select>
                                    <select class="form-select" style="width: 150px;" id="stockFilter">
                                        <option value="">Todos</option>
                                        <option value="low">Stock Bajo</option>
                                        <option value="out">Sin Stock</option>
                                    </select>
                                </div>
                                
                                ${Components.inventoryTable(response.data)}
                                
                                ${response.pagination ? Components.pagination(
                                    response.pagination.page, 
                                    response.pagination.pages,
                                    'App.goToInventoryPage'
                                ) : ''}
                            </div>
                        </div>
                    </main>
                </div>
            `;

        } catch (error) {
            return this.renderError(`Error cargando inventario: ${error.message}`);
        }
    }

    // Página de facturación (Punto de Venta)
    async renderFacturacionPage() {
        try {
            const [productosRes, clientesRes, sucursalesRes, mediosPagoRes] = await Promise.all([
                api.getProductos({ limit: 10 }),
                api.getClientes({ limit: 10 }),
                api.getSucursales(),
                api.getMediosPago()
            ]);

            return `
                ${Components.header()}
                <div class="main-layout">
                    ${Components.sidebar()}
                    <main class="main-content">
                        <div style="display: grid; grid-template-columns: 1fr 400px; gap: 1.5rem; height: calc(100vh - 140px);">
                            <!-- Panel de búsqueda de productos -->
                            <div class="card" style="display: flex; flex-direction: column;">
                                <div class="card-header">
                                    <h2>Punto de Venta</h2>
                                    <div style="font-size: 0.875rem; color: var(--gray-600);">
                                        ${CONFIG.APP_NAME} - Sucursal Central
                                        <br>Cajero: ${auth.user.nombre_completo}
                                    </div>
                                </div>
                                
                                <div class="card-content" style="flex: 1; overflow: hidden;">
                                    <div class="form-group">
                                        <label class="form-label">Buscar Producto</label>
                                        <input type="text" placeholder="Nombre, código, o categoría" 
                                               class="form-input" id="productSearchInput">
                                    </div>
                                    
                                    <div id="productSearchResults" style="flex: 1; overflow-y: auto;">
                                        ${this.renderProductSearchResults(productosRes.data || [])}
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Panel de factura -->
                            <div class="card" style="display: flex; flex-direction: column;">
                                <div class="card-header">
                                    <h3>Detalle de la Factura</h3>
                                    <div style="font-size: 0.875rem; color: var(--gray-600);">
                                        Serie: A &nbsp;&nbsp; Correlativo: <span id="nextCorrelativo">Calculando...</span>
                                    </div>
                                </div>
                                
                                <div class="card-content" style="flex: 1; display: flex; flex-direction: column;">
                                    <!-- Datos del Cliente -->
                                    <div style="margin-bottom: 1.5rem;">
                                        <div class="form-group">
                                            <label>
                                                <input type="checkbox" id="consumidorFinal" checked> 
                                                Consumidor Final
                                            </label>
                                        </div>
                                        
                                        <div id="clientDataSection" class="hidden">
                                            <div class="form-group">
                                                <label class="form-label">NIT</label>
                                                <input type="text" class="form-input" id="clientNit">
                                            </div>
                                            <div class="form-group">
                                                <label class="form-label">Nombre</label>
                                                <input type="text" class="form-input" id="clientName">
                                            </div>
                                            <div class="form-group">
                                                <label class="form-label">Dirección</label>
                                                <input type="text" class="form-input" id="clientAddress">
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <!-- Productos en la factura -->
                                    <div style="flex: 1; border: 1px solid var(--gray-200); border-radius: var(--border-radius); overflow: hidden;">
                                        <div style="background: var(--gray-50); padding: 0.75rem; border-bottom: 1px solid var(--gray-200); font-weight: 600;">
                                            Productos
                                        </div>
                                        <div id="invoiceProducts" style="flex: 1; overflow-y: auto; max-height: 300px;">
                                            <div style="padding: 2rem; text-align: center; color: var(--gray-500);">
                                                No hay productos agregados
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <!-- Totales y método de pago -->
                                    <div style="margin-top: 1rem;">
                                        <div style="border-top: 1px solid var(--gray-200); padding-top: 1rem;">
                                            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                                                <span>Subtotal:</span>
                                                <span id="invoiceSubtotal">Q0.00</span>
                                            </div>
                                            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                                                <span>Impuestos (IVA 12%):</span>
                                                <span id="invoiceTax">Q0.00</span>
                                            </div>
                                            <div style="display: flex; justify-content: space-between; font-weight: 600; font-size: 1.125rem;">
                                                <span>Total:</span>
                                                <span id="invoiceTotal">Q0.00</span>
                                            </div>
                                        </div>
                                        
                                        <div style="margin-top: 1rem;">
                                            <label class="form-label">Método de Pago</label>
                                            <div style="display: flex; gap: 0.5rem; margin-bottom: 1rem;">
                                                <button class="btn btn-secondary payment-method active" data-method="efectivo">
                                                    Efectivo
                                                </button>
                                                <button class="btn btn-secondary payment-method" data-method="tarjeta">
                                                    Tarjeta
                                                </button>
                                            </div>
                                            
                                            <div id="paymentDetails">
                                                <div class="form-group">
                                                    <label class="form-label">Monto Efectivo</label>
                                                    <input type="number" class="form-input" id="cashAmount" 
                                                           placeholder="0.00" step="0.01">
                                                </div>
                                                <div class="form-group">
                                                    <label class="form-label">Vuelto</label>
                                                    <input type="number" class="form-input" id="changeAmount" 
                                                           readonly style="background: var(--gray-100);">
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <button class="btn btn-primary" style="width: 100%; margin-top: 1rem;" 
                                                onclick="App.processInvoice()" disabled id="processBtn">
                                            Procesar Venta
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </main>
                </div>
                
                <style>
                .payment-method {
                    flex: 1;
                    transition: all 0.2s;
                }
                .payment-method.active {
                    background: var(--primary-blue);
                    color: white;
                }
                .product-search-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 0.75rem;
                    border: 1px solid var(--gray-200);
                    border-radius: var(--border-radius);
                    margin-bottom: 0.5rem;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .product-search-item:hover {
                    background: var(--gray-50);
                    border-color: var(--primary-blue);
                }
                .invoice-product-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 0.75rem;
                    border-bottom: 1px solid var(--gray-200);
                }
                .quantity-controls {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }
                .quantity-btn {
                    width: 30px;
                    height: 30px;
                    border: 1px solid var(--gray-300);
                    background: white;
                    border-radius: 4px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .quantity-input {
                    width: 60px;
                    padding: 0.25rem;
                    text-align: center;
                    border: 1px solid var(--gray-300);
                    border-radius: 4px;
                }
                </style>
            `;

        } catch (error) {
            return this.renderError(`Error cargando punto de venta: ${error.message}`);
        }
    }

    // Página de reportes
    async renderReportesPage() {
        return `
            ${Components.header()}
            <div class="main-layout">
                ${Components.sidebar()}
                <main class="main-content">
                    <div style="margin-bottom: 2rem;">
                        <h1>Panel de Reportes</h1>
                        <p style="color: var(--gray-600);">Revisa y analiza todas las transacciones.</p>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem;">
                        <!-- Total Facturado -->
                        <div class="card">
                            <div class="card-content" style="text-align: center;">
                                <div style="background: var(--success-green); color: white; border-radius: 50%; width: 60px; height: 60px; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem;">
                                    <i class="fas fa-chart-line" style="font-size: 1.5rem;"></i>
                                </div>
                                <h3>Total Facturado</h3>
                                <p style="color: var(--gray-600);">Informe de monto total facturado</p>
                                <button class="btn btn-primary" onclick="App.showReport('total-facturado')">
                                    Ver Reporte <i class="fas fa-arrow-right"></i>
                                </button>
                            </div>
                        </div>
                        
                        <!-- Productos con Mayor Ingreso -->
                        <div class="card">
                            <div class="card-content" style="text-align: center;">
                                <div style="background: var(--primary-blue); color: white; border-radius: 50%; width: 60px; height: 60px; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem;">
                                    <i class="fas fa-trophy" style="font-size: 1.5rem;"></i>
                                </div>
                                <h3>Productos con Mayor Ingreso</h3>
                                <p style="color: var(--gray-600);">Productos que más dinero generan</p>
                                <button class="btn btn-primary" onclick="App.showReport('mayor-ingreso')">
                                    Ver Reporte <i class="fas fa-arrow-right"></i>
                                </button>
                            </div>
                        </div>
                        
                        <!-- Productos Más Vendidos -->
                        <div class="card">
                            <div class="card-content" style="text-align: center;">
                                <div style="background: var(--warning-yellow); color: white; border-radius: 50%; width: 60px; height: 60px; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem;">
                                    <i class="fas fa-chart-bar" style="font-size: 1.5rem;"></i>
                                </div>
                                <h3>Productos Más Vendidos</h3>
                                <p style="color: var(--gray-600);">Productos más vendidos por cantidad</p>
                                <button class="btn btn-primary" onclick="App.showReport('mas-vendidos')">
                                    Ver Reporte <i class="fas fa-arrow-right"></i>
                                </button>
                            </div>
                        </div>
                        
                        <!-- Estado de Inventario -->
                        <div class="card">
                            <div class="card-content" style="text-align: center;">
                                <div style="background: var(--gray-600); color: white; border-radius: 50%; width: 60px; height: 60px; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem;">
                                    <i class="fas fa-boxes" style="font-size: 1.5rem;"></i>
                                </div>
                                <h3>Estado de Inventario</h3>
                                <p style="color: var(--gray-600);">Inventario actual de todos los productos</p>
                                <button class="btn btn-primary" onclick="App.showReport('inventario')">
                                    Ver Reporte <i class="fas fa-arrow-right"></i>
                                </button>
                            </div>
                        </div>
                        
                        <!-- Productos Menos Vendidos -->
                        <div class="card">
                            <div class="card-content" style="text-align: center;">
                                <div style="background: var(--error-red); color: white; border-radius: 50%; width: 60px; height: 60px; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem;">
                                    <i class="fas fa-chart-line-down" style="font-size: 1.5rem;"></i>
                                </div>
                                <h3>Productos Menos Vendidos</h3>
                                <p style="color: var(--gray-600);">Productos con menor rotación de ventas</p>
                                <button class="btn btn-primary" onclick="App.showReport('menos-vendidos')">
                                    Ver Reporte <i class="fas fa-arrow-right"></i>
                                </button>
                            </div>
                        </div>
                        
                        <!-- Productos Agotados -->
                        <div class="card">
                            <div class="card-content" style="text-align: center;">
                                <div style="background: var(--error-red); color: white; border-radius: 50%; width: 60px; height: 60px; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem;">
                                    <i class="fas fa-exclamation-triangle" style="font-size: 1.5rem;"></i>
                                </div>
                                <h3>Productos Agotados</h3>
                                <p style="color: var(--gray-600);">Productos que se encuentran sin stock</p>
                                <button class="btn btn-primary" onclick="App.showReport('agotados')">
                                    Ver Reporte <i class="fas fa-arrow-right"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        `;
    }

    // === MÉTODOS AUXILIARES ===

    // Renderizar resultados de búsqueda de productos
    renderProductSearchResults(products) {
        if (!products || products.length === 0) {
            return '<p style="text-align: center; padding: 1rem; color: var(--gray-500);">No se encontraron productos</p>';
        }

        return products.map(product => `
            <div class="product-search-item" onclick="App.addToInvoice(${product.id}, '${product.nombre}', ${product.precio_base})">
                <div>
                    <strong>${product.nombre}</strong>
                    <br>
                    <small style="color: var(--gray-600);">${product.marca}</small>
                </div>
                <div style="text-align: right;">
                    <div style="font-weight: 600; color: var(--primary-blue);">
                        ${Utils.formatCurrency(product.precio_base)}
                    </div>
                    <button class="btn btn-sm btn-primary">Agregar</button>
                </div>
            </div>
        `).join('');
    }

    // Cargar datos iniciales
    async loadInitialData() {
        // Cargar datos que se necesitan en toda la app
    }

    // Manejar envío de formularios
    async handleFormSubmit(e) {
        const form = e.target;
        
        if (form.id === 'loginForm') {
            await this.handleLogin(form);
        }
    }

    // Manejar login
    async handleLogin(form) {
        const formData = new FormData(form);
        const email = formData.get('email');
        const password = formData.get('password');

        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        
        submitBtn.innerHTML = '<div class="spinner" style="width: 20px; height: 20px;"></div>';
        submitBtn.disabled = true;

        try {
            const result = await auth.login(email, password);
            
            if (result.success) {
                Utils.showToast('Login exitoso', 'success');
                window.location.hash = '#dashboard';
            } else {
                Utils.showToast(result.message, 'error');
            }
        } catch (error) {
            Utils.showToast('Error de conexión', 'error');
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    // === MÉTODOS PÚBLICOS PARA EVENTOS ===

    // Agregar producto a factura (llamado desde onclick)
    addToInvoice(productId, productName, price) {
        console.log('Adding to invoice:', productId, productName, price);
        // Implementar lógica de agregar producto a factura
        Utils.showToast(`${productName} agregado a la factura`, 'success');
    }

    // Procesar factura
    async processInvoice() {
        console.log('Processing invoice...');
        Utils.showToast('Procesando venta...', 'info');
        // Implementar lógica de procesar factura
    }

    // Renderizar error
    renderError(message) {
        return `
            <div class="card" style="margin: 2rem; text-align: center;">
                <div class="card-content">
                    <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: var(--error-red); margin-bottom: 1rem;"></i>
                    <h2>Error</h2>
                    <p style="color: var(--gray-600); margin-bottom: 1.5rem;">${message}</p>
                    <button class="btn btn-primary" onclick="window.location.reload()">
                        Recargar Página
                    </button>
                </div>
            </div>
        `;
    }

    // 404
    async render404() {
        return `
            <div class="card" style="margin: 2rem; text-align: center;">
                <div class="card-content">
                    <h1 style="font-size: 4rem; color: var(--gray-300);">404</h1>
                    <h2>Página no encontrada</h2>
                    <p style="color: var(--gray-600); margin-bottom: 1.5rem;">
                        La página que buscas no existe.
                    </p>
                    <a href="#dashboard" class="btn btn-primary">Ir al Dashboard</a>
                </div>
            </div>
        `;
    }

    // === GESTIÓN DEL CARRITO (para interfaz pública) ===
    
    getStoredCart() {
        const cart = localStorage.getItem('paints_cart');
        return cart ? JSON.parse(cart) : [];
    }

    saveCart() {
        localStorage.setItem('paints_cart', JSON.stringify(this.cart));
    }
}

// Inicializar aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.App = new App();
});

// Funciones globales para eventos onclick
window.togglePasswordVisibility = function() {
    const input = this.previousElementSibling;
    const icon = this.querySelector('i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.className = 'fas fa-eye-slash';
    } else {
        input.type = 'password';
        icon.className = 'fas fa-eye';
    }
};