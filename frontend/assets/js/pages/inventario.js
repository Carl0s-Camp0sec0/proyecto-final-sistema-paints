// Verificar autenticación
if (!auth.isAuthenticated()) {
    window.location.href = '/frontend/pages/public/login.html';
}

let currentPage = 1;
const itemsPerPage = 20;

// Cargar datos del usuario
function loadUserData() {
    document.getElementById('userAvatar').textContent = auth.getUserInitials();
    document.getElementById('userName').textContent = auth.user.nombre_completo;
    document.getElementById('userRole').textContent = auth.user.rol;
    document.getElementById('sidebarRole').textContent = auth.user.rol;
    document.getElementById('sidebarEmail').textContent = auth.user.email;
}

// Cargar menú según rol
function loadSidebarMenu() {
    const menuItems = [];

    // Dashboard - siempre visible
    menuItems.push({
        icon: 'fas fa-home',
        label: 'Dashboard',
        href: '/frontend/pages/admin/dashboard.html',
        active: false
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
            active: true
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

// Cargar botones de acción según permisos
function loadInventoryActions() {
    const actionsContainer = document.getElementById('inventoryActions');
    let actionsHTML = '';

    if (auth.hasPermission([CONFIG.ROLES.ADMIN, CONFIG.ROLES.DIGITADOR])) {
        actionsHTML = `
            <a href="/frontend/pages/productos/productos.html" class="btn btn-primary">
                <i class="fas fa-plus"></i>
                Nuevo Producto
            </a>
        `;
    }

    actionsContainer.innerHTML = actionsHTML;
}

// Cargar categorías en el filtro
async function loadCategories() {
    try {
        const response = await api.getCategorias();
        if (response.success) {
            const categorySelect = document.getElementById('categoryFilter');
            const options = response.data.map(cat =>
                `<option value="${cat.id}">${cat.nombre}</option>`
            ).join('');
            categorySelect.innerHTML = '<option value="">Todas las Categorías</option>' + options;
        }
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

// Cargar inventario
async function loadInventory(page = 1) {
    try {
        currentPage = page;
        const searchTerm = document.getElementById('searchInput').value;
        const categoryId = document.getElementById('categoryFilter').value;
        const stockFilter = document.getElementById('stockFilter').value;

        const params = {
            page: currentPage,
            limit: itemsPerPage
        };

        if (searchTerm) params.buscar = searchTerm;
        if (categoryId) params.categoria_id = categoryId;
        if (stockFilter) params.stock_bajo = stockFilter === 'low';

        document.getElementById('inventoryContent').innerHTML = '<div class="loading"><div class="spinner"></div></div>';

        const response = await api.getInventarioSucursal(1, params);

        if (response.success) {
            document.getElementById('inventoryContent').innerHTML = Components.inventoryTable(response.data);

            if (response.pagination) {
                document.getElementById('paginationContainer').innerHTML = Components.pagination(
                    response.pagination.page,
                    response.pagination.pages,
                    'loadInventory'
                );
            }
        } else {
            throw new Error(response.message);
        }

    } catch (error) {
        console.error('Error loading inventory:', error);
        document.getElementById('inventoryContent').innerHTML = `
            <div style="text-align: center; padding: 2rem; color: var(--error-red);">
                Error cargando inventario: ${error.message}
            </div>
        `;
    }
}

// Configurar event listeners
function setupEventListeners() {
    // Búsqueda con debounce
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', Utils.debounce(() => {
        loadInventory(1);
    }, 300));

    // Filtros
    document.getElementById('categoryFilter').addEventListener('change', () => {
        loadInventory(1);
    });

    document.getElementById('stockFilter').addEventListener('change', () => {
        loadInventory(1);
    });
}

// Funciones para botones de acción (placeholder)
function editProduct(productId) {
    window.location.href = `/frontend/pages/productos/productos.html?edit=${productId}`;
}

async function deleteProduct(productId) {
    const confirmed = await Utils.confirm(
        '¿Estás seguro de que deseas eliminar este producto?',
        'Confirmar eliminación'
    );

    if (confirmed) {
        Utils.showToast('Función de eliminar producto en desarrollo', 'info');
    }
}

// Hacer funciones disponibles globalmente
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.loadInventory = loadInventory;

// Inicializar página
document.addEventListener('DOMContentLoaded', async () => {
    loadUserData();
    loadSidebarMenu();
    loadInventoryActions();
    setupEventListeners();
    await loadCategories();
    await loadInventory();
});
