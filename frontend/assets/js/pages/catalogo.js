// Variables globales
let currentPage = 1;
let totalPages = 1;
let currentProducts = [];
let cartItems = getCartFromStorage();
let allProducts = [];

// Cargar productos desde la API
async function loadProductsFromAPI() {
    try {
        console.log('🔄 Iniciando carga de productos desde API...');
        const response = await fetch(`${CONFIG.API_BASE_URL}/productos?limit=1000`);
        const result = await response.json();

        console.log('📦 Respuesta de la API:', result);

        if (result.success && result.data && result.data.length > 0) {
            allProducts = result.data.map(p => {
                // Calcular stock total desde inventario o variaciones
                let stock = 0;
                if (p.inventario && p.inventario.length > 0) {
                    stock = p.inventario.reduce((sum, inv) => sum + (inv.stock_actual || 0), 0);
                } else if (p.variaciones && p.variaciones.length > 0) {
                    stock = p.variaciones.reduce((sum, v) => sum + (v.stock || 0), 0);
                }

                return {
                    id: p.id,
                    nombre: p.nombre,
                    categoria: { nombre: p.categoria?.nombre || 'Otros' },
                    marca: p.marca || 'Sin marca',
                    descripcion: p.descripcion || '',
                    precio_base: parseFloat(p.precio_base) || 0,
                    precio_descuento: p.precio_descuento ? parseFloat(p.precio_descuento) : null,
                    stock: stock,
                    colores: p.detalle_pintura?.colores || [],
                    rating: 4.0 + Math.random() * 0.8,
                    reviews: Math.floor(Math.random() * 50) + 5
                };
            });
            console.log(`✅ Cargados ${allProducts.length} productos desde la API`);
            console.log('📊 Primeros productos:', allProducts.slice(0, 3));
        } else {
            console.warn('⚠️ No se pudieron cargar productos de la API, usando productos de respaldo');
            allProducts = mockProducts;
        }
    } catch (error) {
        console.error('❌ Error cargando productos:', error);
        allProducts = mockProducts;
    }
}

// Datos de productos simulados (fallback)
const mockProducts = [
    {
        id: 1,
        nombre: "Pintura Látex Premium Blanca",
        categoria: { nombre: "Pinturas" },
        marca: "Sherwin Williams",
        descripcion: "Pintura de látex premium para interiores y exteriores con excelente cobertura",
        precio_base: 360.00,
        precio_descuento: 320.00,
        stock: 45,
        colores: ["#FFFFFF", "#F8F8FF", "#FFFAF0", "#FDF5E6"],
        rating: 4.5,
        reviews: 24
    },
    {
        id: 2,
        nombre: "Brocha Professional 3 pulgadas",
        categoria: { nombre: "Accesorios" },
        marca: "Pro Tools",
        descripcion: "Brocha de cerdas naturales para acabados profesionales y aplicación uniforme",
        precio_base: 89.00,
        stock: 23,
        colores: [],
        rating: 4.2,
        reviews: 18
    },
    {
        id: 3,
        nombre: "Aguarrás Mineral 1/2 Galón",
        categoria: { nombre: "Solventes" },
        marca: "Industrial",
        descripcion: "Solvente de alta pureza para dilución de pinturas y limpieza de herramientas",
        precio_base: 45.00,
        stock: 67,
        colores: [],
        rating: 4.0,
        reviews: 12
    },
    {
        id: 4,
        nombre: "Pintura Comex Vinimex Azul",
        categoria: { nombre: "Pinturas" },
        marca: "Comex",
        descripcion: "Pintura vinílica lavable para interiores, resistente a manchas y fácil limpieza",
        precio_base: 280.00,
        precio_descuento: 250.00,
        stock: 12,
        colores: ["#0066CC", "#4169E1", "#1E90FF", "#87CEEB", "#6495ED"],
        rating: 4.3,
        reviews: 31
    },
    {
        id: 5,
        nombre: "Rodillo Antichorreo 9 pulgadas",
        categoria: { nombre: "Accesorios" },
        marca: "Premium",
        descripcion: "Rodillo de microfibra de alta densidad para pinturas látex, acabado perfecto",
        precio_base: 65.00,
        stock: 34,
        colores: [],
        rating: 4.7,
        reviews: 15
    },
    {
        id: 6,
        nombre: "Barniz Marino Transparente",
        categoria: { nombre: "Barnices" },
        marca: "Marina",
        descripcion: "Barniz poliuretánico transparente resistente al agua para exteriores",
        precio_base: 168.00,
        stock: 8,
        colores: [],
        rating: 4.1,
        reviews: 9
    },
    {
        id: 7,
        nombre: "Pintura Benjamin Moore Regal",
        categoria: { nombre: "Pinturas" },
        marca: "Benjamin Moore",
        descripcion: "Pintura premium con tecnología avanzada, máxima cobertura y durabilidad",
        precio_base: 450.00,
        stock: 15,
        colores: ["#8B4513", "#CD853F", "#DEB887", "#F4A460", "#D2B48C"],
        rating: 4.8,
        reviews: 42
    },
    {
        id: 8,
        nombre: "Espátula Flexible 4 pulgadas",
        categoria: { nombre: "Herramientas" },
        marca: "Pro Tools",
        descripcion: "Espátula de acero inoxidable con mango ergonómico, ideal para preparación",
        precio_base: 35.00,
        stock: 56,
        colores: [],
        rating: 4.4,
        reviews: 23
    },
    {
        id: 9,
        nombre: "Pintura Comex 100% Acrílica",
        categoria: { nombre: "Pinturas" },
        marca: "Comex",
        descripcion: "Pintura acrílica de alta calidad para exteriores, resistente a la intemperie",
        precio_base: 395.00,
        precio_descuento: 355.00,
        stock: 0,
        colores: ["#DC143C", "#FF6347", "#FF4500", "#FF1493"],
        rating: 4.6,
        reviews: 37
    },
    {
        id: 10,
        nombre: "Thinner Acrílico 1 Galón",
        categoria: { nombre: "Solventes" },
        marca: "Solvex",
        descripcion: "Thinner especial para pinturas acrílicas, secado rápido y sin residuos",
        precio_base: 85.00,
        stock: 28,
        colores: [],
        rating: 4.2,
        reviews: 16
    }
];

// Cargar carrito desde localStorage
function getCartFromStorage() {
    const cart = localStorage.getItem('paints_cart');
    return cart ? JSON.parse(cart) : [];
}

// Guardar carrito en localStorage
function saveCartToStorage() {
    localStorage.setItem('paints_cart', JSON.stringify(cartItems));
    updateCartBadge();
}

// Actualizar badge del carrito
function updateCartBadge() {
    const badges = document.querySelectorAll('.cart-badge');
    const total = cartItems.reduce((sum, item) => sum + item.quantity, 0);

    badges.forEach(badge => {
        if (total > 0) {
            badge.textContent = total;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    });
}

// Filtrar productos
function filterProducts() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const categoryFilter = document.getElementById('categoryFilter').value.toLowerCase();
    const brandFilter = document.getElementById('brandFilter').value.toLowerCase();
    const priceFilter = document.getElementById('priceFilter').value;

    let filtered = allProducts.filter(product => {
        const matchesSearch = !searchTerm ||
            product.nombre.toLowerCase().includes(searchTerm) ||
            product.descripcion.toLowerCase().includes(searchTerm) ||
            product.marca.toLowerCase().includes(searchTerm);

        const matchesCategory = !categoryFilter ||
            product.categoria.nombre.toLowerCase().includes(categoryFilter);

        const matchesBrand = !brandFilter ||
            product.marca.toLowerCase().includes(brandFilter);

        let matchesPrice = true;
        if (priceFilter) {
            const price = product.precio_descuento || product.precio_base;
            switch (priceFilter) {
                case '0-50':
                    matchesPrice = price <= 50;
                    break;
                case '50-100':
                    matchesPrice = price > 50 && price <= 100;
                    break;
                case '100-300':
                    matchesPrice = price > 100 && price <= 300;
                    break;
                case '300-500':
                    matchesPrice = price > 300 && price <= 500;
                    break;
                case '500+':
                    matchesPrice = price > 500;
                    break;
            }
        }

        return matchesSearch && matchesCategory && matchesBrand && matchesPrice;
    });

    return filtered;
}

// Ordenar productos
function sortProducts(products) {
    const sortBy = document.getElementById('sortFilter').value;

    return products.sort((a, b) => {
        switch (sortBy) {
            case 'name':
                return a.nombre.localeCompare(b.nombre);
            case 'name_desc':
                return b.nombre.localeCompare(a.nombre);
            case 'price_asc':
                return (a.precio_descuento || a.precio_base) - (b.precio_descuento || b.precio_base);
            case 'price_desc':
                return (b.precio_descuento || b.precio_base) - (a.precio_descuento || a.precio_base);
            case 'category':
                return a.categoria.nombre.localeCompare(b.categoria.nombre);
            case 'brand':
                return a.marca.localeCompare(b.marca);
            default:
                return 0;
        }
    });
}

// Cargar productos
function loadProducts() {
    const container = document.getElementById('productsContainer');

    // Filtrar y ordenar
    let filtered = filterProducts();
    let sorted = sortProducts(filtered);

    currentProducts = sorted;

    // Actualizar contador
    const resultsCount = document.getElementById('resultsCount');
    resultsCount.textContent = `${sorted.length} productos encontrados`;

    // Mostrar productos
    displayProducts(sorted);
}

// Mostrar productos
function displayProducts(products) {
    const container = document.getElementById('productsContainer');

    if (!products || products.length === 0) {
        container.innerHTML = `
            <div class="products-grid">
                <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: var(--gray-500);">
                    <i class="fas fa-search" style="font-size: 4rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                    <h3>No se encontraron productos</h3>
                    <p>Intenta ajustar los filtros de búsqueda</p>
                    <button class="btn btn-primary" onclick="clearFilters()" style="margin-top: 1rem;">
                        <i class="fas fa-times"></i>
                        Limpiar Filtros
                    </button>
                </div>
            </div>
        `;
        return;
    }

    const productsHTML = products.map(product => {
        const finalPrice = product.precio_descuento || product.precio_base;
        const hasDiscount = product.precio_descuento && product.precio_descuento < product.precio_base;

        let stockClass = 'in-stock';
        let stockText = `En stock (${product.stock})`;
        let buttonDisabled = '';

        if (product.stock === 0) {
            stockClass = 'out-of-stock';
            stockText = 'Agotado';
            buttonDisabled = 'disabled';
        } else if (product.stock <= 10) {
            stockClass = 'low-stock';
            stockText = `Pocas unidades (${product.stock})`;
        }

        // Generar estrellas
        const rating = product.rating || 4.0;
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            if (i <= rating) {
                stars.push('<i class="fas fa-star"></i>');
            } else if (i - 0.5 <= rating) {
                stars.push('<i class="fas fa-star-half-alt"></i>');
            } else {
                stars.push('<i class="far fa-star"></i>');
            }
        }

        const colorsHTML = product.colores && product.colores.length > 0 ? `
            <div class="color-palette">
                ${product.colores.slice(0, 4).map(color => `
                    <div class="color-swatch" style="background-color: ${color}" title="Color disponible"></div>
                `).join('')}
                ${product.colores.length > 4 ? `<span style="font-size: 0.75rem; color: var(--gray-500); margin-left: 0.5rem;">+${product.colores.length - 4} más</span>` : ''}
            </div>
        ` : '';

        return `
            <div class="product-card">
                <div class="product-image">
                    <i class="fas fa-paint-brush"></i>
                    ${hasDiscount ? `<div style="position: absolute; top: 10px; right: 10px; background: var(--error-red); color: white; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: bold;">OFERTA</div>` : ''}
                </div>
                <div class="product-content">
                    <span class="product-category">${product.categoria.nombre}</span>
                    <h3 class="product-name">${product.nombre}</h3>
                    <p class="product-brand"><i class="fas fa-tag"></i> ${product.marca}</p>

                    <div class="product-rating" style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem;">
                        <div class="stars" style="color: #ffc107; font-size: 0.875rem;">
                            ${stars.join('')}
                        </div>
                        <span style="font-size: 0.75rem; color: var(--gray-500);">(${product.reviews || 0})</span>
                    </div>

                    <p class="product-description">${product.descripcion}</p>

                    <div class="product-price">
                        Q ${finalPrice.toFixed(2)}
                        ${hasDiscount ? `<span class="original-price">Q ${product.precio_base.toFixed(2)}</span>` : ''}
                    </div>

                    <div class="product-stock ${stockClass}">
                        <i class="fas fa-box"></i> ${stockText}
                    </div>

                    ${colorsHTML}

                    <div class="product-actions">
                        <button class="cart-button" onclick="addToCart(${product.id}, '${product.nombre.replace(/'/g, "\\'")}', ${finalPrice})" ${buttonDisabled}>
                            <i class="fas fa-cart-plus"></i>
                            ${product.stock > 0 ? 'Agregar' : 'Agotado'}
                        </button>
                        <button class="action-button" onclick="viewProduct(${product.id})" title="Ver detalles">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="action-button" onclick="addToWishlist(${product.id})" title="Agregar a favoritos">
                            <i class="fas fa-heart"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = `<div class="products-grid">${productsHTML}</div>`;
}

// Agregar al carrito
function addToCart(productId, productName, price) {
    const product = allProducts.find(p => p.id === productId);
    if (!product || product.stock === 0) {
        showToast('Producto no disponible', 'error');
        return;
    }

    const existingItem = cartItems.find(item => item.id === productId);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cartItems.push({
            id: productId,
            name: productName,
            price: price,
            quantity: 1,
            image: '' // Se puede agregar imagen después
        });
    }

    saveCartToStorage();
    showToast(`${productName} agregado al carrito`, 'success');
}

// Ver producto
function viewProduct(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) {
        showToast('Producto no encontrado', 'error');
        return;
    }

    openProductModal(product);
}

// Abrir modal de producto
function openProductModal(product) {
    const modal = document.getElementById('productModal');

    // Llenar información básica
    document.getElementById('modalProductName').textContent = 'Detalles del Producto';
    document.getElementById('modalProductTitle').textContent = product.nombre;
    document.getElementById('modalProductDescription').textContent = product.descripcion;

    // Precios
    const currentPrice = product.precio_descuento || product.precio_base;
    document.getElementById('modalCurrentPrice').textContent = `Q ${currentPrice.toFixed(2)}`;

    const originalPriceEl = document.getElementById('modalOriginalPrice');
    const savingsEl = document.getElementById('modalSavings');

    if (product.precio_descuento && product.precio_descuento < product.precio_base) {
        originalPriceEl.textContent = `Q ${product.precio_base.toFixed(2)}`;
        originalPriceEl.style.display = 'block';

        const savings = product.precio_base - product.precio_descuento;
        savingsEl.textContent = `Ahorras Q ${savings.toFixed(2)}`;
        savingsEl.style.display = 'block';
    } else {
        originalPriceEl.style.display = 'none';
        savingsEl.style.display = 'none';
    }

    // Badges
    const badgesHtml = [];
    if (product.precio_descuento) {
        badgesHtml.push('<span class="badge badge-offer">OFERTA</span>');
    }
    if (product.id <= 3) {
        badgesHtml.push('<span class="badge badge-popular">POPULAR</span>');
    }
    document.getElementById('modalBadges').innerHTML = badgesHtml.join('');

    // Stock
    const stockInfo = document.getElementById('modalStockInfo');
    const addToCartBtn = document.getElementById('modalAddToCart');

    if (product.stock === 0) {
        stockInfo.innerHTML = '<i class="fas fa-times-circle" style="color: var(--error-red);"></i><span style="color: var(--error-red);">Agotado</span>';
        addToCartBtn.disabled = true;
        addToCartBtn.textContent = 'Agotado';
    } else if (product.stock <= 10) {
        stockInfo.innerHTML = `<i class="fas fa-exclamation-triangle" style="color: var(--warning-yellow);"></i><span style="color: var(--warning-yellow);">Pocas unidades (${product.stock})</span>`;
        addToCartBtn.disabled = false;
        addToCartBtn.innerHTML = '<i class="fas fa-cart-plus"></i> Agregar al Carrito';
    } else {
        stockInfo.innerHTML = `<i class="fas fa-check-circle" style="color: var(--success-green);"></i><span style="color: var(--success-green);">En stock (${product.stock})</span>`;
        addToCartBtn.disabled = false;
        addToCartBtn.innerHTML = '<i class="fas fa-cart-plus"></i> Agregar al Carrito';
    }

    // Especificaciones
    const specs = getProductSpecs(product);
    const specsHtml = specs.map(spec => `
        <div class="spec-item">
            <span class="spec-label">${spec.label}:</span>
            <span>${spec.value}</span>
        </div>
    `).join('');
    document.getElementById('modalSpecs').innerHTML = specsHtml;

    // Colores (para pinturas)
    const colorSelector = document.getElementById('modalColorSelector');
    if (product.colores && product.colores.length > 0) {
        const colorsHtml = product.colores.map((color, index) => `
            <div class="color-option ${index === 0 ? 'selected' : ''}"
                 style="background-color: ${color}"
                 onclick="selectColor(this, '${color}')">
            </div>
        `).join('');
        document.getElementById('modalColorOptions').innerHTML = colorsHtml;
        colorSelector.style.display = 'block';
    } else {
        colorSelector.style.display = 'none';
    }

    // Contenido de tabs
    setupModalTabs(product);

    // Reset quantity
    document.getElementById('modalQuantity').value = 1;
    document.getElementById('modalQuantity').max = product.stock || 1;

    // Mostrar modal
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    // Guardar producto actual para las acciones
    window.currentModalProduct = product;
}

// Obtener especificaciones del producto
function getProductSpecs(product) {
    const baseSpecs = [
        { label: 'Marca', value: product.marca },
        { label: 'Categoría', value: product.categoria.nombre }
    ];

    // Especificaciones específicas por categoría
    if (product.categoria.nombre === 'Pinturas') {
        baseSpecs.push(
            { label: 'Tipo de base', value: 'Base agua' },
            { label: 'Acabado', value: 'Mate/Semi-mate' },
            { label: 'Cobertura', value: '12-15 m² por galón' },
            { label: 'Tiempo de secado', value: '2-4 horas' },
            { label: 'Durabilidad', value: '8-10 años' }
        );
    } else if (product.categoria.nombre === 'Accesorios') {
        baseSpecs.push(
            { label: 'Material', value: 'Cerdas naturales' },
            { label: 'Tamaño', value: product.nombre.includes('3') ? '3 pulgadas' : 'Estándar' },
            { label: 'Uso recomendado', value: 'Pinturas látex y acrílicas' }
        );
    } else if (product.categoria.nombre === 'Solventes') {
        baseSpecs.push(
            { label: 'Pureza', value: '99.5%' },
            { label: 'Punto de inflamación', value: '40°C' },
            { label: 'Densidad', value: '0.85 g/ml' }
        );
    }

    return baseSpecs;
}

// Configurar tabs del modal
function setupModalTabs(product) {
    // Descripción detallada
    document.getElementById('modalDetailedDescription').innerHTML = `
        <p>${product.descripcion}</p>
        <h5>Características destacadas:</h5>
        <ul>
            <li>Alta calidad y durabilidad</li>
            <li>Fácil aplicación y limpieza</li>
            <li>Excelente cobertura y adherencia</li>
            <li>Resistente a condiciones climáticas</li>
            <li>Secado rápido</li>
        </ul>
    `;

    // Especificaciones técnicas detalladas
    const detailedSpecs = getProductSpecs(product);
    const detailedSpecsHtml = `
        <div class="specs-grid">
            ${detailedSpecs.map(spec => `
                <div class="spec-item">
                    <span class="spec-label">${spec.label}</span>
                    <span>${spec.value}</span>
                </div>
            `).join('')}
        </div>
        <h5 style="margin-top: 1.5rem;">Información adicional:</h5>
        <p>Este producto cumple con todas las normas de calidad internacionales y ha sido probado bajo rigurosas condiciones de laboratorio.</p>
    `;
    document.getElementById('modalDetailedSpecs').innerHTML = detailedSpecsHtml;
}

// Cambiar cantidad
function changeQuantity(delta) {
    const quantityInput = document.getElementById('modalQuantity');
    let newQuantity = parseInt(quantityInput.value) + delta;
    const maxQuantity = parseInt(quantityInput.max);

    if (newQuantity < 1) newQuantity = 1;
    if (newQuantity > maxQuantity) newQuantity = maxQuantity;

    quantityInput.value = newQuantity;
}

// Seleccionar color
function selectColor(element, color) {
    // Remover selección anterior
    document.querySelectorAll('.color-option').forEach(el => {
        el.classList.remove('selected');
    });

    // Seleccionar nuevo color
    element.classList.add('selected');

    // Guardar color seleccionado
    window.selectedColor = color;
}

// Cambiar tab
function switchTab(tabName) {
    // Remover active de headers
    document.querySelectorAll('.tab-header').forEach(el => {
        el.classList.remove('active');
    });

    // Remover active de panes
    document.querySelectorAll('.tab-pane').forEach(el => {
        el.classList.remove('active');
    });

    // Activar nuevo tab
    event.target.classList.add('active');
    document.getElementById(`tab-${tabName}`).classList.add('active');
}

// Agregar al carrito desde el modal
function addToCartFromModal() {
    if (!window.currentModalProduct) return;

    const product = window.currentModalProduct;
    const quantity = parseInt(document.getElementById('modalQuantity').value);
    const selectedColor = window.selectedColor || 'Color estándar';

    // Verificar stock
    if (product.stock < quantity) {
        showToast('Cantidad no disponible en stock', 'error');
        return;
    }

    const finalPrice = product.precio_descuento || product.precio_base;

    // Buscar si ya existe en el carrito
    const existingItemIndex = cartItems.findIndex(item =>
        item.id === product.id &&
        (item.color === selectedColor || (!item.color && !window.selectedColor))
    );

    if (existingItemIndex !== -1) {
        cartItems[existingItemIndex].quantity += quantity;
    } else {
        const cartItem = {
            id: product.id,
            name: product.nombre,
            price: finalPrice,
            quantity: quantity,
            brand: product.marca,
            category: product.categoria.nombre
        };

        if (window.selectedColor) {
            cartItem.color = selectedColor;
        }

        cartItems.push(cartItem);
    }

    saveCartToStorage();
    showToast(`${quantity} x ${product.nombre} agregado al carrito`, 'success');

    // Cerrar modal
    closeProductModal();
}

// Agregar a favoritos desde el modal
function addToWishlistFromModal() {
    if (!window.currentModalProduct) return;

    const product = window.currentModalProduct;
    showToast(`${product.nombre} agregado a favoritos`, 'success');
}

// Cerrar modal
function closeProductModal() {
    const modal = document.getElementById('productModal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';

    // Limpiar producto actual
    window.currentModalProduct = null;
    window.selectedColor = null;
}

// Cerrar modal al hacer clic fuera
document.addEventListener('click', function(event) {
    const modal = document.getElementById('productModal');
    if (event.target === modal) {
        closeProductModal();
    }
});

// Cerrar modal con tecla Escape
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeProductModal();
    }
});

// Agregar a favoritos
function addToWishlist(productId) {
    showToast('Agregado a favoritos', 'success');
}

// Ir al carrito
function goToCart() {
    window.location.href = '/frontend/pages/public/carrito.html';
}

// Aplicar filtros
function applyFilters() {
    loadProducts();
}

// Limpiar filtros
function clearFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('categoryFilter').value = '';
    document.getElementById('brandFilter').value = '';
    document.getElementById('priceFilter').value = '';
    document.getElementById('sortFilter').value = 'name';
    loadProducts();
}

// Aplicar ordenamiento
function applySort() {
    loadProducts();
}

// Mostrar toast
function showToast(message, type = 'info') {
    // Crear elemento toast
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? 'var(--success-green)' : type === 'error' ? 'var(--error-red)' : 'var(--info-color)'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    toast.textContent = message;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Event listeners
function setupEventListeners() {
    // Búsqueda en tiempo real
    const searchInput = document.getElementById('searchInput');
    let searchTimeout;
    searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            loadProducts();
        }, 300);
    });

    // Filtros
    ['categoryFilter', 'brandFilter', 'priceFilter'].forEach(filterId => {
        document.getElementById(filterId).addEventListener('change', loadProducts);
    });
}

// Inicializar página
document.addEventListener('DOMContentLoaded', async () => {
    // Cargar productos desde la API primero
    await loadProductsFromAPI();

    setupEventListeners();
    loadProducts();
    updateCartBadge();

    // Configurar menú de usuario
    const userMenu = document.getElementById('userMenu');
    // Aquí puedes agregar lógica de autenticación si está disponible
});

// Agregar estilos para animación
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
`;
document.head.appendChild(style);
