// Verificar autenticación y permisos
if (!auth.isAuthenticated()) {
    window.location.href = '/frontend/pages/public/login.html';
}

if (!auth.hasPermission([CONFIG.ROLES.ADMIN, CONFIG.ROLES.CAJERO, CONFIG.ROLES.DIGITADOR])) {
    Utils.showToast('No tienes permisos para acceder al punto de venta', 'error');
    window.location.href = '/frontend/pages/admin/dashboard.html';
}

// Variables globales
let invoiceItems = [];
let selectedPaymentMethod = 'efectivo';
let currentCategory = 'all';
let discountAmount = 0;

// Cargar datos del usuario
function loadUserData() {
    document.getElementById('userAvatar').textContent = auth.getUserInitials();
    document.getElementById('userName').textContent = auth.user.nombre_completo;
    document.getElementById('userRole').textContent = auth.user.rol;
    document.getElementById('sidebarRole').textContent = auth.user.rol;
    document.getElementById('sidebarEmail').textContent = auth.user.email;
    document.getElementById('cashierName').textContent = auth.user.nombre_completo;
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
            active: false
        });
    }

    // Ventas - Cajero, Digitador, Admin
    if (auth.hasPermission([CONFIG.ROLES.ADMIN, CONFIG.ROLES.DIGITADOR, CONFIG.ROLES.CAJERO])) {
        menuItems.push({
            icon: 'fas fa-cash-register',
            label: 'Punto de Venta',
            href: '/frontend/pages/ventas/pos.html',
            active: true
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

// Buscar productos
async function searchProducts(query) {
    if (!query || query.length < 2) {
        document.getElementById('productSearchResults').innerHTML = `
            <div style="padding: 2rem; text-align: center; color: var(--gray-500);">
                <i class="fas fa-search" style="font-size: 3rem; opacity: 0.3; margin-bottom: 1rem;"></i>
                <p>Escriba al menos 2 caracteres para buscar</p>
            </div>
        `;
        return;
    }

    try {
        const params = { buscar: query, limit: 20, sucursal_id: 1 };
        if (currentCategory !== 'all') {
            params.categoria = currentCategory;
        }

        const response = await api.getProductos(params);
        console.log('📦 Respuesta de productos:', response);

        if (response.success && response.data.length > 0) {
            const resultsHTML = response.data.map(product => {
                console.log('🔍 Producto:', product.nombre, 'Inventarios:', product.inventarios);
                // Calcular stock total sumando todas las cantidades del inventario
                const stock = product.inventarios && product.inventarios.length > 0
                    ? product.inventarios.reduce((total, inv) => total + (inv.cantidad || 0), 0)
                    : 0;
                console.log('📊 Stock calculado para', product.nombre, ':', stock);
                const stockClass = stock > 10 ? '' : stock > 0 ? 'low' : 'out';
                const stockText = stock > 0 ? `Stock: ${stock}` : 'Sin stock';

                return `
                    <div class="product-search-item" onclick="addToInvoice(${product.id}, '${product.nombre.replace(/'/g, "\\'")}', ${product.precio_base}, ${stock})">
                        <div class="product-info">
                            <div class="product-name">${product.nombre}</div>
                            <div class="product-details">
                                ${product.marca || 'Sin marca'} • ${product.categoria || 'Sin categoría'}
                            </div>
                            <div class="product-stock ${stockClass}">${stockText}</div>
                        </div>
                        <div class="product-price-section">
                            <div class="product-price">
                                ${Utils.formatCurrency(product.precio_base)}
                            </div>
                            <button class="btn btn-sm btn-primary">
                                <i class="fas fa-plus"></i>
                            </button>
                        </div>
                    </div>
                `;
            }).join('');

            document.getElementById('productSearchResults').innerHTML = resultsHTML;
        } else {
            document.getElementById('productSearchResults').innerHTML = `
                <div style="padding: 2rem; text-align: center; color: var(--gray-500);">
                    <i class="fas fa-search" style="font-size: 3rem; opacity: 0.3; margin-bottom: 1rem;"></i>
                    <p>No se encontraron productos para "${query}"</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error searching products:', error);
        document.getElementById('productSearchResults').innerHTML = `
            <div style="padding: 2rem; text-align: center; color: var(--error-red);">
                <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                <p>Error buscando productos</p>
            </div>
        `;
    }
}

// Filtrar productos por categoría
function filterProducts(category) {
    currentCategory = category;

    // Actualizar botones de filtro
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-category="${category}"]`).classList.add('active');

    // Realizar búsqueda si hay texto
    const query = document.getElementById('productSearchInput').value;
    if (query && query.length >= 2) {
        searchProducts(query);
    }
}

// Escanear código de barras
function scanBarcode() {
    // En un entorno real, aquí se activaría la cámara o escáner
    Utils.showToast('Función de escáner de códigos de barras en desarrollo', 'info');
}

// Agregar producto a la factura
function addToInvoice(productId, productName, price, stock) {
    const existingItem = invoiceItems.find(item => item.productId === productId);

    if (existingItem) {
        existingItem.quantity += 1;
        if (stock === 0 || existingItem.quantity > stock) {
            Utils.showToast(`Advertencia: ${productName} - Stock insuficiente`, 'warning');
        } else {
            Utils.showToast(`Cantidad actualizada: ${productName}`, 'success');
        }
    } else {
        invoiceItems.push({
            productId: productId,
            name: productName,
            price: price,
            quantity: 1,
            maxStock: stock
        });
        if (stock === 0) {
            Utils.showToast(`${productName} agregado (Sin stock disponible)`, 'warning');
        } else {
            Utils.showToast(`${productName} agregado a la factura`, 'success');
        }
    }

    updateInvoiceDisplay();
}

// Actualizar cantidad de producto
function updateQuantity(productId, newQuantity) {
    const item = invoiceItems.find(item => item.productId === productId);
    if (item) {
        if (newQuantity > 0) {
            item.quantity = newQuantity;
            if (item.maxStock === 0 || newQuantity > item.maxStock) {
                Utils.showToast('Advertencia: Cantidad excede el stock disponible', 'warning');
            }
            updateInvoiceDisplay();
        } else {
            removeFromInvoice(productId);
        }
    }
}

// Remover producto de la factura
function removeFromInvoice(productId) {
    invoiceItems = invoiceItems.filter(item => item.productId !== productId);
    updateInvoiceDisplay();
}

// Limpiar factura
function clearInvoice() {
    if (invoiceItems.length > 0 && confirm('¿Está seguro de limpiar toda la factura?')) {
        invoiceItems = [];
        discountAmount = 0;
        updateInvoiceDisplay();
        Utils.showToast('Factura limpiada', 'info');
    }
}

// Aplicar descuento
function applyDiscount() {
    const subtotal = invoiceItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    if (subtotal === 0) {
        Utils.showToast('No hay productos para aplicar descuento', 'warning');
        return;
    }

    const discount = prompt('Ingrese el porcentaje de descuento (0-100):', '0');
    if (discount !== null) {
        const discountPercent = parseFloat(discount);
        if (!isNaN(discountPercent) && discountPercent >= 0 && discountPercent <= 100) {
            discountAmount = subtotal * (discountPercent / 100);
            updateInvoiceDisplay();
            Utils.showToast(`Descuento del ${discountPercent}% aplicado`, 'success');
        } else {
            Utils.showToast('Porcentaje de descuento inválido', 'error');
        }
    }
}

// Actualizar visualización de la factura
function updateInvoiceDisplay() {
    const container = document.getElementById('invoiceProducts');
    const itemCount = document.getElementById('itemCount');

    if (invoiceItems.length === 0) {
        container.innerHTML = `
            <div style="padding: 2rem; text-align: center; color: var(--gray-500);">
                <i class="fas fa-shopping-cart" style="font-size: 3rem; opacity: 0.3; margin-bottom: 1rem;"></i>
                <p>No hay productos agregados</p>
                <p style="font-size: 0.875rem;">Busque productos para agregarlos</p>
            </div>
        `;
        itemCount.textContent = '0 productos';
    } else {
        const itemsHTML = invoiceItems.map(item => {
            const stockWarning = (item.maxStock === 0 || item.quantity > item.maxStock) ?
                ' <span style="color: var(--warning-yellow);">⚠</span>' : '';

            return `
                <div class="invoice-product-item">
                    <div style="flex: 1;">
                        <div style="font-weight: 500;">${item.name}${stockWarning}</div>
                        <div style="font-size: 0.875rem; color: var(--gray-600);">
                            ${Utils.formatCurrency(item.price)} c/u • Stock: ${item.maxStock}
                        </div>
                    </div>
                    <div class="quantity-controls">
                        <button class="quantity-btn" onclick="updateQuantity(${item.productId}, ${item.quantity - 1})"
                                ${item.quantity <= 1 ? 'style="opacity: 0.5;"' : ''}>-</button>
                        <input type="number" value="${item.quantity}" class="quantity-input"
                               onchange="updateQuantity(${item.productId}, parseInt(this.value))"
                               min="1">
                        <button class="quantity-btn" onclick="updateQuantity(${item.productId}, ${item.quantity + 1})">+</button>
                        <button class="btn btn-sm btn-danger" onclick="removeFromInvoice(${item.productId})"
                                style="margin-left: 0.5rem;" title="Eliminar producto">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = itemsHTML;
        itemCount.textContent = `${invoiceItems.length} producto${invoiceItems.length !== 1 ? 's' : ''}`;
    }

    updateTotals();
}

// Actualizar totales
function updateTotals() {
    const subtotal = invoiceItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const afterDiscount = subtotal - discountAmount;
    const tax = afterDiscount * 0.12; // IVA 12%
    const total = afterDiscount + tax;

    document.getElementById('invoiceSubtotal').textContent = Utils.formatCurrency(subtotal);
    document.getElementById('invoiceDiscount').textContent = Utils.formatCurrency(discountAmount);
    document.getElementById('invoiceTax').textContent = Utils.formatCurrency(tax);
    document.getElementById('invoiceTotal').textContent = Utils.formatCurrency(total);

    // Habilitar/deshabilitar botón de procesar
    document.getElementById('processBtn').disabled = invoiceItems.length === 0;

    // Actualizar campos de pago
    if (selectedPaymentMethod === 'efectivo') {
        calculateChange();
    }
}

// Configurar métodos de pago
function setupPaymentMethods() {
    const paymentButtons = document.querySelectorAll('.payment-method');

    paymentButtons.forEach(button => {
        button.addEventListener('click', () => {
            paymentButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            selectedPaymentMethod = button.dataset.method;
            updatePaymentDetails();
        });
    });
}

// Actualizar detalles de pago
function updatePaymentDetails() {
    const section = document.getElementById('paymentDetailsSection');
    const total = parseFloat(document.getElementById('invoiceTotal').textContent.replace('Q', '').replace(',', ''));

    if (selectedPaymentMethod === 'efectivo') {
        section.innerHTML = `
            <div class="form-group">
                <label class="form-label">Monto Recibido</label>
                <input type="number" class="form-input" id="cashAmount"
                       placeholder="0.00" step="0.01" oninput="calculateChange()">
            </div>
            <div class="form-group">
                <label class="form-label">Vuelto</label>
                <input type="number" class="form-input" id="changeAmount"
                       readonly style="background: var(--gray-100);">
            </div>
        `;
    } else if (selectedPaymentMethod === 'tarjeta') {
        section.innerHTML = `
            <div class="form-group">
                <label class="form-label">Número de Tarjeta</label>
                <input type="text" class="form-input" id="cardNumber"
                       placeholder="**** **** **** ****" maxlength="19">
            </div>
            <div class="form-group">
                <label class="form-label">Monto</label>
                <input type="number" class="form-input" id="cardAmount"
                       value="${total.toFixed(2)}" readonly style="background: var(--gray-100);">
            </div>
        `;
    } else { // cheque
        section.innerHTML = `
            <div class="form-group">
                <label class="form-label">Número de Cheque</label>
                <input type="text" class="form-input" id="checkNumber"
                       placeholder="Número de cheque">
            </div>
            <div class="form-group">
                <label class="form-label">Banco</label>
                <input type="text" class="form-input" id="bankName"
                       placeholder="Banco emisor">
            </div>
        `;
    }
}

// Calcular vuelto
function calculateChange() {
    const cashAmountElement = document.getElementById('cashAmount');
    const changeAmountElement = document.getElementById('changeAmount');

    if (cashAmountElement && changeAmountElement) {
        const cashAmount = parseFloat(cashAmountElement.value) || 0;
        const total = parseFloat(document.getElementById('invoiceTotal').textContent.replace('Q', '').replace(',', ''));
        const change = Math.max(0, cashAmount - total);

        changeAmountElement.value = change.toFixed(2);
    }
}

// Procesar venta
async function processInvoice() {
    if (invoiceItems.length === 0) {
        Utils.showToast('No hay productos en la factura', 'error');
        return;
    }

    try {
        const total = parseFloat(document.getElementById('invoiceTotal').textContent.replace('Q', '').replace(',', ''));

        // Validar método de pago
        if (selectedPaymentMethod === 'efectivo') {
            const cashAmount = parseFloat(document.getElementById('cashAmount').value) || 0;
            if (cashAmount < total) {
                Utils.showToast('El monto recibido es menor al total', 'error');
                return;
            }
        } else if (selectedPaymentMethod === 'tarjeta') {
            const cardNumber = document.getElementById('cardNumber').value.trim();
            if (!cardNumber) {
                Utils.showToast('Ingrese el número de tarjeta', 'error');
                return;
            }
        } else if (selectedPaymentMethod === 'cheque') {
            const checkNumber = document.getElementById('checkNumber').value.trim();
            const bankName = document.getElementById('bankName').value.trim();
            if (!checkNumber || !bankName) {
                Utils.showToast('Complete la información del cheque', 'error');
                return;
            }
        }

        // Preparar datos de la factura
        const facturaData = {
            serie: 'A',
            correlativo: parseInt(document.getElementById('nextCorrelativo').textContent),
            fecha_emision: new Date().toISOString(),
            consumidor_final: document.getElementById('consumidorFinal').checked,
            cliente_nit: document.getElementById('clientNit').value || null,
            cliente_nombre: document.getElementById('clientName').value || 'Consumidor Final',
            cliente_direccion: document.getElementById('clientAddress').value || null,
            sucursal_id: 1,
            empleado_id: auth.user.id,
            descuento_total: discountAmount,
            productos: invoiceItems.map(item => ({
                producto_id: item.productId,
                cantidad: item.quantity,
                precio_unitario: item.price,
                descuento: 0
            })),
            metodos_pago: [{
                tipo_pago_id: selectedPaymentMethod === 'efectivo' ? 1 : selectedPaymentMethod === 'tarjeta' ? 3 : 2,
                monto: total
            }]
        };

        Utils.showToast('Procesando venta...', 'info');

        // Simular API call (reemplazar con llamada real)
        // const response = await api.createFactura(facturaData);

        // Simulación de éxito
        setTimeout(() => {
            const invoiceNumber = `A-${document.getElementById('nextCorrelativo').textContent}`;
            showSuccessModal(invoiceNumber, total);

            // Limpiar factura
            invoiceItems = [];
            discountAmount = 0;
            updateInvoiceDisplay();

            // Incrementar correlativo
            const nextNum = parseInt(document.getElementById('nextCorrelativo').textContent) + 1;
            document.getElementById('nextCorrelativo').textContent = nextNum.toString().padStart(3, '0');

            // Limpiar campos de cliente
            document.getElementById('consumidorFinal').checked = true;
            document.getElementById('clientDataSection').classList.add('hidden');

            // Resetear método de pago
            updatePaymentDetails();

        }, 1500);

    } catch (error) {
        console.error('Error processing invoice:', error);
        Utils.showToast('Error procesando la venta', 'error');
    }
}

// Mostrar modal de éxito
function showSuccessModal(invoiceNumber, total) {
    document.getElementById('invoiceNumber').textContent = invoiceNumber;
    document.getElementById('invoiceTotalModal').textContent = Utils.formatCurrency(total);
    document.getElementById('successModal').style.display = 'flex';
}

// Cerrar modal de éxito
function closeSuccessModal() {
    document.getElementById('successModal').style.display = 'none';
}

// Imprimir factura
function printInvoice() {
    Utils.showToast('Imprimiendo factura...', 'info');
    // Aquí se implementaría la lógica de impresión
}

// Configurar event listeners
function setupEventListeners() {
    // Búsqueda de productos
    const searchInput = document.getElementById('productSearchInput');
    searchInput.addEventListener('input', Utils.debounce((e) => {
        searchProducts(e.target.value);
    }, 300));

    // Checkbox consumidor final
    document.getElementById('consumidorFinal').addEventListener('change', (e) => {
        const clientSection = document.getElementById('clientDataSection');
        if (e.target.checked) {
            clientSection.classList.add('hidden');
        } else {
            clientSection.classList.remove('hidden');
        }
    });

    // Teclas de acceso rápido
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey || e.metaKey) {
            switch(e.key) {
                case 'f':
                case 'F':
                    e.preventDefault();
                    document.getElementById('productSearchInput').focus();
                    break;
                case 'n':
                case 'N':
                    e.preventDefault();
                    clearInvoice();
                    break;
                case 'Enter':
                    if (invoiceItems.length > 0) {
                        e.preventDefault();
                        processInvoice();
                    }
                    break;
            }
        }
    });
}

// Hacer funciones disponibles globalmente
window.addToInvoice = addToInvoice;
window.updateQuantity = updateQuantity;
window.removeFromInvoice = removeFromInvoice;
window.clearInvoice = clearInvoice;
window.applyDiscount = applyDiscount;
window.filterProducts = filterProducts;
window.scanBarcode = scanBarcode;
window.calculateChange = calculateChange;
window.processInvoice = processInvoice;
window.closeSuccessModal = closeSuccessModal;
window.printInvoice = printInvoice;

// Inicializar página
document.addEventListener('DOMContentLoaded', () => {
    loadUserData();
    loadSidebarMenu();
    setupEventListeners();
    setupPaymentMethods();
    updatePaymentDetails();
});
