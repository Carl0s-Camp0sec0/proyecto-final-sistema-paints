// Verificar autenticación
if (!auth.isAuthenticated()) {
    window.location.href = '/frontend/pages/public/login.html';
}

// Cargar datos del usuario
function loadUserData() {
    document.getElementById('userAvatar').textContent = auth.getUserInitials();
    document.getElementById('userName').textContent = auth.user.nombre_completo;
    document.getElementById('userRole').textContent = auth.user.rol;
    document.getElementById('sidebarRole').textContent = auth.user.rol;
    document.getElementById('sidebarEmail').textContent = auth.user.email;
    document.getElementById('welcomeMessage').textContent = `Bienvenido, ${auth.user.nombre_completo}`;
}

// Cargar menú según rol
function loadSidebarMenu() {
    const menuItems = [];
    const userRole = auth.user.rol;

    // Dashboard - siempre visible
    menuItems.push({
        icon: 'fas fa-home',
        label: 'Dashboard',
        href: '/frontend/pages/admin/dashboard.html',
        active: true
    });

    // Gestión de Productos - Admin y Digitador
    if (auth.hasPermission([CONFIG.ROLES.ADMIN, CONFIG.ROLES.DIGITADOR])) {
        menuItems.push({
            icon: 'fas fa-box',
            label: 'Productos',
            href: '/frontend/pages/productos/productos.html',
            active: false
        });

        menuItems.push({
            icon: 'fas fa-tags',
            label: 'Categorías',
            href: '/frontend/pages/productos/categorias.html',
            active: false
        });
    }

    // Inventario - todos los roles
    if (auth.hasPermission([CONFIG.ROLES.ADMIN, CONFIG.ROLES.DIGITADOR, CONFIG.ROLES.CAJERO, CONFIG.ROLES.GERENTE])) {
        menuItems.push({
            icon: 'fas fa-boxes',
            label: 'Inventario',
            href: '/frontend/pages/productos/inventario.html',
            active: false
        });
    }

    // Ventas - Cajero, Digitador, Admin
    if (auth.hasPermission([CONFIG.ROLES.ADMIN, CONFIG.ROLES.DIGITADOR, CONFIG.ROLES.CAJERO])) {
        menuItems.push({
            icon: 'fas fa-cash-register',
            label: 'Punto de Venta',
            href: '/frontend/pages/ventas/pos.html',
            active: false
        });
    }

    // Reportes - Gerente, Admin
    if (auth.hasPermission([CONFIG.ROLES.ADMIN, CONFIG.ROLES.GERENTE])) {
        menuItems.push({
            icon: 'fas fa-chart-bar',
            label: 'Reportes',
            href: '/frontend/pages/reportes/reportes.html',
            active: false
        });
    }

    // Gestión de Usuarios - Solo Admin
    if (auth.hasPermission([CONFIG.ROLES.ADMIN])) {
        menuItems.push({
            icon: 'fas fa-users',
            label: 'Usuarios',
            href: '/frontend/pages/admin/usuarios.html',
            active: false
        });
    }

    const menuHTML = menuItems.map(item => `
        <li>
            <a href="${item.href}" class="${item.active ? 'active' : ''}">
                <i class="${item.icon}"></i>
                ${item.label}
            </a>
        </li>
    `).join('');

    document.getElementById('sidebarNav').innerHTML = menuHTML;
}

// Cargar contenido del dashboard
async function loadDashboardContent() {
    try {
        const dashboardElement = document.getElementById('dashboardContent');

        let content = '';

        // Estadísticas para gerentes y admin
        if (auth.hasPermission([CONFIG.ROLES.ADMIN, CONFIG.ROLES.GERENTE])) {
            try {
                const estadisticas = await api.getEstadisticasVentas();
                if (estadisticas.success && estadisticas.data) {
                    content += `
                        <div class="card" style="margin-bottom: 1.5rem;">
                            <div class="card-header">
                                <h3 class="card-title">Estadísticas de Ventas</h3>
                            </div>
                            <div class="card-content">
                                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                                    <div style="text-align: center; padding: 1rem; background: var(--gray-50); border-radius: 8px;">
                                        <div style="font-size: 2rem; font-weight: 600; color: var(--success-green);">
                                            ${estadisticas.data?.estadisticas_generales?.total_facturas || 0}
                                        </div>
                                        <div style="color: var(--gray-600);">Total Facturas</div>
                                    </div>
                                    <div style="text-align: center; padding: 1rem; background: var(--gray-50); border-radius: 8px;">
                                        <div style="font-size: 2rem; font-weight: 600; color: var(--primary-blue);">
                                            ${Utils.formatCurrency(estadisticas.data?.estadisticas_generales?.monto_total || 0)}
                                        </div>
                                        <div style="color: var(--gray-600);">Monto Total</div>
                                    </div>
                                    <div style="text-align: center; padding: 1rem; background: var(--gray-50); border-radius: 8px;">
                                        <div style="font-size: 2rem; font-weight: 600; color: var(--warning-yellow);">
                                            ${Utils.formatCurrency(estadisticas.data?.estadisticas_generales?.total_efectivo || 0)}
                                        </div>
                                        <div style="color: var(--gray-600);">Efectivo</div>
                                    </div>
                                    <div style="text-align: center; padding: 1rem; background: var(--gray-50); border-radius: 8px;">
                                        <div style="font-size: 2rem; font-weight: 600; color: var(--secondary-blue);">
                                            ${Utils.formatCurrency(estadisticas.data?.estadisticas_generales?.total_tarjeta || 0)}
                                        </div>
                                        <div style="color: var(--gray-600);">Tarjeta</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                }
            } catch (error) {
                console.error('Error cargando estadísticas:', error);
                // Continuar cargando el resto del dashboard
            }
        }

        // Grid de accesos rápidos
        content += `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem; margin-bottom: 2rem;">
        `;

        // Accesos Rápidos
        content += `
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Accesos Rápidos</h3>
                    </div>
                    <div class="card-content">
                        <div style="display: grid; gap: 0.75rem;">
                            ${auth.hasPermission([CONFIG.ROLES.ADMIN, CONFIG.ROLES.CAJERO, CONFIG.ROLES.DIGITADOR]) ? `
                                <a href="/frontend/pages/ventas/pos.html" class="btn btn-primary">
                                    <i class="fas fa-cash-register"></i>
                                    Nueva Venta
                                </a>
                            ` : ''}
                            ${auth.hasPermission([CONFIG.ROLES.ADMIN, CONFIG.ROLES.DIGITADOR]) ? `
                                <a href="/frontend/pages/productos/productos.html" class="btn btn-secondary">
                                    <i class="fas fa-plus"></i>
                                    Nuevo Producto
                                </a>
                            ` : ''}
                            <a href="/frontend/pages/productos/inventario.html" class="btn btn-secondary">
                                <i class="fas fa-boxes"></i>
                                Ver Inventario
                            </a>
                            ${auth.hasPermission([CONFIG.ROLES.ADMIN, CONFIG.ROLES.GERENTE]) ? `
                                <a href="/frontend/pages/reportes/reportes.html" class="btn btn-secondary">
                                    <i class="fas fa-chart-bar"></i>
                                    Ver Reportes
                                </a>
                            ` : ''}
                            ${auth.hasPermission([CONFIG.ROLES.ADMIN]) ? `
                                <a href="/frontend/pages/admin/usuarios.html" class="btn btn-secondary">
                                    <i class="fas fa-users"></i>
                                    Gestionar Usuarios
                                </a>
                            ` : ''}
                        </div>
                    </div>
                </div>
        `;

        // Estadísticas rápidas para Admin
        if (auth.hasPermission([CONFIG.ROLES.ADMIN])) {
            content += `
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Estado del Sistema</h3>
                    </div>
                    <div class="card-content">
                        <div style="display: grid; gap: 1rem;">
                            <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: var(--gray-50); border-radius: 8px;">
                                <span><i class="fas fa-box" style="margin-right: 0.5rem; color: var(--primary-blue);"></i>Productos Activos</span>
                                <span style="font-weight: 600;" id="activeProductsCount">-</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: var(--gray-50); border-radius: 8px;">
                                <span><i class="fas fa-tags" style="margin-right: 0.5rem; color: var(--success-green);"></i>Categorías</span>
                                <span style="font-weight: 600;" id="categoriesCount">-</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: var(--gray-50); border-radius: 8px;">
                                <span><i class="fas fa-users" style="margin-right: 0.5rem; color: var(--warning-yellow);"></i>Usuarios Activos</span>
                                <span style="font-weight: 600;" id="activeUsersCount">-</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: var(--gray-50); border-radius: 8px;">
                                <span><i class="fas fa-exclamation-triangle" style="margin-right: 0.5rem; color: var(--error-red);"></i>Stock Bajo</span>
                                <span style="font-weight: 600;" id="lowStockCount">-</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        content += `</div>`; // Cerrar grid

        // Inventario reciente para todos
        try {
            const inventario = await api.getInventarioSucursal(1, { limit: 5 });
            if (inventario.success && inventario.data && inventario.data.length > 0) {
                content += `
                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">Productos Recientes</h3>
                            <a href="/frontend/pages/productos/inventario.html" class="btn btn-sm btn-secondary">Ver Todo</a>
                        </div>
                        <div class="card-content">
                            ${Components.inventoryTable(inventario.data, {
                                showActions: true,
                                editCallback: 'viewProductDetails',
                                deleteCallback: null
                            })}
                        </div>
                    </div>
                `;
            } else if (inventario.success) {
                content += `
                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">Productos Recientes</h3>
                        </div>
                        <div class="card-content">
                            <p style="text-align: center; padding: 2rem; color: var(--gray-500);">
                                No hay productos en el inventario.
                                <a href="/frontend/pages/productos/productos.html" style="color: var(--primary-blue);">Agregar productos</a>
                            </p>
                        </div>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error cargando inventario:', error);
            content += `
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Productos Recientes</h3>
                    </div>
                    <div class="card-content">
                        <p style="text-align: center; padding: 2rem; color: var(--error-red);">
                            Error al cargar el inventario. Por favor, intente nuevamente.
                        </p>
                    </div>
                </div>
            `;
        }

        dashboardElement.innerHTML = content;

        // Cargar estadísticas adicionales para Admin
        if (auth.hasPermission([CONFIG.ROLES.ADMIN])) {
            loadAdminStats();
        }

    } catch (error) {
        console.error('Error loading dashboard:', error);
        document.getElementById('dashboardContent').innerHTML = `
            <div class="card">
                <div class="card-content">
                    <p style="color: var(--error-red);">Error cargando el dashboard: ${error.message}</p>
                </div>
            </div>
        `;
    }
}

// Cargar estadísticas adicionales para administradores
async function loadAdminStats() {
    // Productos activos
    try {
        const productos = await api.getProductos({ limit: 1 });
        if (productos.success && productos.pagination) {
            const productCount = productos.pagination.total || 0;
            const elem = document.getElementById('activeProductsCount');
            if (elem) elem.textContent = productCount;
        }
    } catch (error) {
        console.error('Error cargando productos:', error);
        const elem = document.getElementById('activeProductsCount');
        if (elem) elem.textContent = 'Error';
    }

    // Categorías
    try {
        const categorias = await api.getCategorias();
        if (categorias.success && categorias.data) {
            const elem = document.getElementById('categoriesCount');
            if (elem) elem.textContent = categorias.data.length || 0;
        }
    } catch (error) {
        console.error('Error cargando categorías:', error);
        const elem = document.getElementById('categoriesCount');
        if (elem) elem.textContent = 'Error';
    }

    // Usuarios activos
    try {
        const usuarios = await api.getUsuarios({ limit: 1 });
        if (usuarios.success && usuarios.pagination) {
            const userCount = usuarios.pagination.total || 0;
            const elem = document.getElementById('activeUsersCount');
            if (elem) elem.textContent = userCount;
        }
    } catch (error) {
        console.error('Error cargando usuarios:', error);
        const elem = document.getElementById('activeUsersCount');
        if (elem) elem.textContent = 'Error';
    }

    // Stock bajo
    try {
        const inventario = await api.getInventarioSucursal(1, { limit: 100 });
        if (inventario.success && inventario.data) {
            // Contar productos con stock bajo
            const lowStock = inventario.data.filter(item => {
                const stockLevel = Utils.getStockLevel(item.stock_actual, item.producto.stock_minimo);
                return stockLevel === CONFIG.STOCK_LEVELS.LOW || stockLevel === CONFIG.STOCK_LEVELS.OUT;
            }).length;
            const elem = document.getElementById('lowStockCount');
            if (elem) elem.textContent = lowStock;
        }
    } catch (error) {
        console.error('Error cargando stock bajo:', error);
        const elem = document.getElementById('lowStockCount');
        if (elem) elem.textContent = 'Error';
    }
}

// Función para ver detalles de producto
function viewProductDetails(productId) {
    // Redirigir a la página de inventario con el producto seleccionado
    window.location.href = `/frontend/pages/productos/inventario.html?producto=${productId}`;
}

// Inicializar página
document.addEventListener('DOMContentLoaded', async () => {
    loadUserData();
    loadSidebarMenu();
    await loadDashboardContent();
});
