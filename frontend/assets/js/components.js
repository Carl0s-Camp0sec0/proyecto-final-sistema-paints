// Componentes de UI reutilizables
const Components = {
    // Loading spinner
    loading() {
        return `
            <div class="loading">
                <div class="spinner"></div>
            </div>
        `;
    },

    // Header de la aplicación
    header(cartCount = 0) {
        if (!auth.isAuthenticated()) {
            return `
                <header class="header">
                    <div class="header-content">
                        <a href="#" class="logo">
                            <span class="logo-icon">
                                <i class="fas fa-paint-brush"></i>
                            </span>
                            ${CONFIG.APP_NAME}
                        </a>
                        <nav>
                            <ul class="nav-menu">
                                <li><a href="#productos" class="nav-link">Productos</a></li>
                                <li><a href="#inicio" class="nav-link">Inicio</a></li>
                                <li><a href="#contacto" class="nav-link">Contacto</a></li>
                            </ul>
                        </nav>
                        <div class="user-menu">
                            <button class="cart-icon" onclick="App.showCart()">
                                <i class="fas fa-shopping-cart"></i>
                                ${cartCount > 0 ? `<span class="cart-badge">${cartCount}</span>` : ''}
                            </button>
                            <a href="#login" class="btn btn-primary btn-sm">Login</a>
                            <a href="#register" class="btn btn-secondary btn-sm">Sign up</a>
                        </div>
                    </div>
                </header>
            `;
        }

        return `
            <header class="header">
                <div class="header-content">
                    <a href="#dashboard" class="logo">
                        <span class="logo-icon">
                            <i class="fas fa-paint-brush"></i>
                        </span>
                        ${CONFIG.APP_NAME}
                    </a>
                    <div class="user-menu">
                        <div class="user-info">
                            <span class="user-avatar">${auth.getUserInitials()}</span>
                            <div>
                                <div style="font-weight: 500;">${auth.user.nombre_completo}</div>
                                <div style="font-size: 0.875rem; color: var(--gray-500);">${auth.user.rol}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>
        `;
    },

    // Sidebar de navegación
    sidebar() {
        const userRole = auth.user.rol;
        const menuItems = [];

        // Inventario - todos los roles
        if (auth.hasPermission([CONFIG.ROLES.ADMIN, CONFIG.ROLES.DIGITADOR, CONFIG.ROLES.CAJERO, CONFIG.ROLES.GERENTE])) {
            menuItems.push({
                icon: 'fas fa-boxes',
                label: 'Inventario',
                route: 'inventario',
                active: window.location.hash.includes('inventario')
            });
        }

        // Ventas - Cajero, Digitador, Admin
        if (auth.hasPermission([CONFIG.ROLES.ADMIN, CONFIG.ROLES.DIGITADOR, CONFIG.ROLES.CAJERO])) {
            menuItems.push({
                icon: 'fas fa-cash-register',
                label: 'Ventas',
                route: 'ventas',
                active: window.location.hash.includes('ventas')
            });
        }

        // Facturación - Cajero, Digitador, Admin
        if (auth.hasPermission([CONFIG.ROLES.ADMIN, CONFIG.ROLES.DIGITADOR, CONFIG.ROLES.CAJERO])) {
            menuItems.push({
                icon: 'fas fa-file-invoice',
                label: 'Facturación',
                route: 'facturacion',
                active: window.location.hash.includes('facturacion')
            });
        }

        // Reportes - Gerente, Admin
        if (auth.hasPermission([CONFIG.ROLES.ADMIN, CONFIG.ROLES.GERENTE])) {
            menuItems.push({
                icon: 'fas fa-chart-bar',
                label: 'Reportes',
                route: 'reportes',
                active: window.location.hash.includes('reportes')
            });
        }

        const menuHTML = menuItems.map(item => `
            <li>
                <a href="#${item.route}" class="${item.active ? 'active' : ''}">
                    <i class="${item.icon}"></i>
                    ${item.label}
                </a>
            </li>
        `).join('');

        return `
            <aside class="sidebar">
                <div class="sidebar-header">
                    <h2 class="sidebar-title">${userRole}</h2>
                    <p class="sidebar-subtitle">${auth.user.email}</p>
                </div>
                <nav>
                    <ul class="sidebar-nav">
                        ${menuHTML}
                    </ul>
                </nav>
                <button class="logout-btn" onclick="auth.logout()">
                    <i class="fas fa-sign-out-alt"></i>
                    Cerrar Sesión
                </button>
            </aside>
        `;
    },

    // Card de producto
    productCard(product) {
        const price = product.precio_base || product.variaciones?.[0]?.precio_venta || 0;
        const hasStock = product.inventarios?.some(inv => inv.stock_actual > 0) ?? true;
        
        return `
            <div class="card product-card">
                <div class="product-image">
                    <img src="https://via.placeholder.com/200x200/f3f4f6/9ca3af?text=Producto" 
                         alt="${product.nombre}" class="product-img">
                </div>
                <div class="card-content">
                    <h3 class="product-name">${product.nombre}</h3>
                    <p class="product-brand">${product.marca}</p>
                    <div class="product-price">${Utils.formatCurrency(price)}</div>
                    <div class="product-status">
                        <span class="badge ${hasStock ? 'badge-success' : 'badge-error'}">
                            <i class="fas fa-circle"></i>
                            ${hasStock ? 'En Stock' : 'Sin Stock'}
                        </span>
                    </div>
                    <div class="product-actions">
                        <button class="btn btn-primary btn-sm" onclick="App.addToCart(${product.id})">
                            <i class="fas fa-cart-plus"></i>
                            Agregar
                        </button>
                        <button class="btn btn-secondary btn-sm" onclick="App.viewProduct(${product.id})">
                            <i class="fas fa-eye"></i>
                            Ver
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    // Tabla de inventario
    inventoryTable(items, options = {}) {
        const showActions = options.showActions !== false; // Por defecto true
        const editCallback = options.editCallback || 'viewProductDetails';
        const deleteCallback = options.deleteCallback || null;
        const editIcon = options.editIcon || (editCallback === 'editProduct' ? 'fa-edit' : 'fa-eye');

        if (!items || items.length === 0) {
            return `
                <div class="table-container">
                    <p style="text-align: center; padding: 2rem; color: var(--gray-500);">
                        No hay productos en inventario
                    </p>
                </div>
            `;
        }

        const rows = items.map(item => {
            const stockLevel = Utils.getStockLevel(item.stock_actual, item.producto.stock_minimo);
            const stockClass = Utils.getStockClass(stockLevel);
            const stockText = Utils.getStockText(stockLevel);

            return `
                <tr>
                    <td>
                        <div>
                            <strong>${item.producto.nombre}</strong>
                            <br>
                            <small style="color: var(--gray-500);">${item.producto.marca}</small>
                        </div>
                    </td>
                    <td>${Utils.formatCurrency(item.producto.precio_base)}</td>
                    <td>
                        <span class="badge ${stockClass}">
                            ${item.stock_actual}
                        </span>
                    </td>
                    <td>
                        <span class="badge ${stockClass}">
                            ${stockText}
                        </span>
                    </td>
                    <td>
                        ${item.producto.categoria?.nombre || 'N/A'}
                    </td>
                    ${showActions ? `
                    <td>
                        <div class="table-actions">
                            <button class="btn btn-sm btn-secondary" onclick="${editCallback}(${item.producto.id})" title="${editCallback === 'editProduct' ? 'Editar producto' : 'Ver detalles'}">
                                <i class="fas ${editIcon}"></i>
                            </button>
                            ${deleteCallback ? `
                            <button class="btn btn-sm btn-danger" onclick="${deleteCallback}(${item.producto.id})" title="Eliminar producto">
                                <i class="fas fa-trash"></i>
                            </button>
                            ` : ''}
                        </div>
                    </td>
                    ` : ''}
                </tr>
            `;
        }).join('');

        return `
            <div class="table-container">
                <table class="table">
                    <thead>
                        <tr>
                            <th>Producto</th>
                            <th>Precio Venta</th>
                            <th>Existencias</th>
                            <th>Estado</th>
                            <th>Categoría</th>
                            ${showActions ? '<th>Acciones</th>' : ''}
                        </tr>
                    </thead>
                    <tbody>
                        ${rows}
                    </tbody>
                </table>
            </div>
        `;
    },

    // Paginación
    pagination(currentPage, totalPages, onPageChange) {
        if (totalPages <= 1) return '';

        const pages = [];
        const maxVisible = 5;
        
        // Calcular rango de páginas visibles
        let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
        let end = Math.min(totalPages, start + maxVisible - 1);
        
        if (end - start + 1 < maxVisible) {
            start = Math.max(1, end - maxVisible + 1);
        }

        // Botón anterior
        if (currentPage > 1) {
            pages.push(`
                <button class="pagination-btn" onclick="${onPageChange}(${currentPage - 1})">
                    <i class="fas fa-chevron-left"></i>
                </button>
            `);
        }

        // Páginas numeradas
        for (let i = start; i <= end; i++) {
            pages.push(`
                <button class="pagination-btn ${i === currentPage ? 'active' : ''}" 
                        onclick="${onPageChange}(${i})">
                    ${i}
                </button>
            `);
        }

        // Botón siguiente
        if (currentPage < totalPages) {
            pages.push(`
                <button class="pagination-btn" onclick="${onPageChange}(${currentPage + 1})">
                    <i class="fas fa-chevron-right"></i>
                </button>
            `);
        }

        return `
            <div class="pagination">
                ${pages.join('')}
            </div>
            <style>
                .pagination {
                    display: flex;
                    justify-content: center;
                    gap: 0.5rem;
                    margin: 2rem 0;
                }
                .pagination-btn {
                    padding: 0.5rem 1rem;
                    border: 1px solid var(--gray-300);
                    background: white;
                    border-radius: var(--border-radius);
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .pagination-btn:hover {
                    background: var(--gray-100);
                }
                .pagination-btn.active {
                    background: var(--primary-blue);
                    color: white;
                    border-color: var(--primary-blue);
                }
            </style>
        `;
    }
};