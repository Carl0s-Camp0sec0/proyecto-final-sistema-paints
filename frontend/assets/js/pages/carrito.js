// Variables globales
let cartItems = getCartFromStorage();
let selectedShipping = 'pickup';
let shippingCost = 0;
let promoDiscount = 0;

// Cargar carrito desde localStorage
function getCartFromStorage() {
    const cart = localStorage.getItem('paints_cart');
    return cart ? JSON.parse(cart) : [];
}

// Guardar carrito en localStorage
function saveCartToStorage() {
    localStorage.setItem('paints_cart', JSON.stringify(cartItems));
}

// Configurar menú según autenticación
function setupUserMenu() {
    const userMenu = document.getElementById('userMenu');

    if (auth.isAuthenticated()) {
        userMenu.innerHTML = `
            <a href="/frontend/pages/admin/dashboard.html" class="btn btn-primary btn-sm">
                <i class="fas fa-tachometer-alt"></i>
                Dashboard
            </a>
            <button onclick="auth.logout()" class="btn btn-secondary btn-sm" style="margin-left: 0.5rem;">
                <i class="fas fa-sign-out-alt"></i>
                Salir
            </button>
        `;
    } else {
        userMenu.innerHTML = `
            <a href="/frontend/pages/public/login.html" class="btn btn-primary btn-sm">Iniciar Sesión</a>
            <a href="/frontend/pages/public/register.html" class="btn btn-secondary btn-sm">Registrarse</a>
        `;
    }
}

// Mostrar carrito
function displayCart() {
    const container = document.getElementById('cartContent');

    if (cartItems.length === 0) {
        container.innerHTML = `
            <div class="empty-cart">
                <i class="fas fa-shopping-cart"></i>
                <h2>Tu carrito está vacío</h2>
                <p>Explora nuestro catálogo y encuentra productos increíbles</p>
                <a href="/frontend/pages/public/catalogo.html" class="btn btn-primary">
                    <i class="fas fa-paint-brush"></i>
                    Ver Catálogo
                </a>
            </div>
        `;
        return;
    }

    const cartItemsHTML = cartItems.map(item => `
        <div class="cart-item">
            <div class="cart-item-image">
                <i class="fas fa-paint-brush"></i>
            </div>
            <div class="cart-item-info">
                <h3 class="cart-item-name">${item.name}</h3>
                <div class="cart-item-price">${Utils.formatCurrency(item.price)} c/u</div>
                <div class="cart-item-controls">
                    <div class="quantity-control">
                        <button class="quantity-btn" onclick="updateQuantity(${item.id}, ${item.quantity - 1})">
                            <i class="fas fa-minus"></i>
                        </button>
                        <input type="number" value="${item.quantity}" class="quantity-input"
                               onchange="updateQuantity(${item.id}, parseInt(this.value))" min="1">
                        <button class="quantity-btn" onclick="updateQuantity(${item.id}, ${item.quantity + 1})">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                    <div style="margin-left: auto; display: flex; align-items: center; gap: 1rem;">
                        <strong>${Utils.formatCurrency(item.price * item.quantity)}</strong>
                        <button class="remove-btn" onclick="removeFromCart(${item.id})" title="Eliminar">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');

    container.innerHTML = `
        <div class="cart-layout">
            <div class="cart-items">
                <h2 style="margin-bottom: 1.5rem;">Productos (${cartItems.length})</h2>
                ${cartItemsHTML}

                <div style="margin-top: 2rem; padding: 1rem; background: var(--gray-50); border-radius: var(--border-radius);">
                    <h4>¿Necesitas ayuda con tu compra?</h4>
                    <p style="margin: 0.5rem 0; color: var(--gray-600);">
                        Nuestros expertos pueden asesorarte para elegir los productos correctos.
                    </p>
                    <button class="btn btn-secondary" onclick="requestAdvice()">
                        <i class="fas fa-comment"></i>
                        Solicitar Asesoría
                    </button>
                </div>
            </div>

            <div class="cart-summary">
                <h3 style="margin-bottom: 1rem;">Resumen del Pedido</h3>

                ${generateSummaryHTML()}

                ${generateShippingHTML()}

                ${generatePromoHTML()}

                <div class="checkout-section">
                    <button class="btn btn-primary" style="width: 100%;" onclick="proceedToCheckout()">
                        <i class="fas fa-credit-card"></i>
                        Proceder al Pago
                    </button>

                    <div style="margin-top: 1rem; text-align: center;">
                        <button class="btn btn-secondary" style="width: 100%;" onclick="generateQuote()">
                            <i class="fas fa-file-pdf"></i>
                            Generar Cotización PDF
                        </button>
                    </div>

                    <div style="margin-top: 1rem; text-align: center; font-size: 0.875rem; color: var(--gray-500);">
                        <i class="fas fa-shield-alt"></i>
                        Compra 100% segura y protegida
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Generar HTML del resumen
function generateSummaryHTML() {
    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 0.12; // IVA 12%
    const total = subtotal + tax + shippingCost - promoDiscount;

    return `
        <div class="summary-row">
            <span>Subtotal:</span>
            <span>${Utils.formatCurrency(subtotal)}</span>
        </div>
        <div class="summary-row">
            <span>IVA (12%):</span>
            <span>${Utils.formatCurrency(tax)}</span>
        </div>
        <div class="summary-row">
            <span>Envío:</span>
            <span>${shippingCost > 0 ? Utils.formatCurrency(shippingCost) : 'Gratis'}</span>
        </div>
        ${promoDiscount > 0 ? `
        <div class="summary-row" style="color: var(--success-green);">
            <span>Descuento:</span>
            <span>-${Utils.formatCurrency(promoDiscount)}</span>
        </div>
        ` : ''}
        <div class="summary-row summary-total">
            <span>Total:</span>
            <span>${Utils.formatCurrency(total)}</span>
        </div>
    `;
}

// Generar opciones de envío
function generateShippingHTML() {
    return `
        <div class="shipping-options">
            <h4>Opciones de Entrega</h4>
            <label class="shipping-option ${selectedShipping === 'pickup' ? 'selected' : ''}" onclick="selectShipping('pickup')">
                <input type="radio" name="shipping" value="pickup" ${selectedShipping === 'pickup' ? 'checked' : ''}>
                <div>
                    <strong>Recoger en tienda</strong>
                    <div style="font-size: 0.875rem; color: var(--gray-600);">Gratis - Disponible hoy</div>
                </div>
            </label>
            <label class="shipping-option ${selectedShipping === 'delivery' ? 'selected' : ''}" onclick="selectShipping('delivery')">
                <input type="radio" name="shipping" value="delivery" ${selectedShipping === 'delivery' ? 'checked' : ''}>
                <div>
                    <strong>Entrega a domicilio</strong>
                    <div style="font-size: 0.875rem; color: var(--gray-600);">Q25.00 - 1-2 días hábiles</div>
                </div>
            </label>
        </div>
    `;
}

// Generar sección de código promocional
function generatePromoHTML() {
    return `
        <div class="promo-code">
            <h4>Código Promocional</h4>
            <div class="promo-input">
                <input type="text" placeholder="Ingresa tu código" class="form-input" id="promoInput">
                <button class="btn btn-secondary" onclick="applyPromoCode()">
                    Aplicar
                </button>
            </div>
        </div>
    `;
}

// Actualizar cantidad
function updateQuantity(itemId, newQuantity) {
    if (newQuantity <= 0) {
        removeFromCart(itemId);
        return;
    }

    const item = cartItems.find(item => item.id === itemId);
    if (item) {
        item.quantity = newQuantity;
        saveCartToStorage();
        displayCart();
    }
}

// Remover del carrito
function removeFromCart(itemId) {
    cartItems = cartItems.filter(item => item.id !== itemId);
    saveCartToStorage();
    displayCart();
    Utils.showToast('Producto eliminado del carrito', 'success');
}

// Seleccionar método de envío
function selectShipping(method) {
    selectedShipping = method;
    shippingCost = method === 'delivery' ? 25 : 0;
    displayCart();
}

// Aplicar código promocional
function applyPromoCode() {
    const promoInput = document.getElementById('promoInput');
    const code = promoInput.value.trim().toUpperCase();

    // Códigos de prueba
    const promoCodes = {
        'DESCUENTO10': 0.10,
        'PRIMERA': 0.15,
        'ESTUDIANTE': 0.05
    };

    if (promoCodes[code]) {
        const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        promoDiscount = subtotal * promoCodes[code];

        Utils.showToast(`¡Código aplicado! Descuento: ${(promoCodes[code] * 100)}%`, 'success');
        promoInput.value = '';
        displayCart();
    } else {
        Utils.showToast('Código promocional inválido', 'error');
    }
}

// Solicitar asesoría
function requestAdvice() {
    if (auth.isAuthenticated()) {
        Utils.showToast('Un asesor se contactará contigo pronto', 'success');
    } else {
        Utils.showToast('Inicia sesión para solicitar asesoría personalizada', 'info');
        setTimeout(() => {
            window.location.href = '/frontend/pages/public/login.html';
        }, 2000);
    }
}

// Generar cotización
function generateQuote() {
    Utils.showToast('Generando cotización PDF...', 'info');
    // Implementar generación de PDF
    setTimeout(() => {
        Utils.showToast('Cotización generada exitosamente', 'success');
    }, 2000);
}

// Proceder al checkout
function proceedToCheckout() {
    if (cartItems.length === 0) {
        Utils.showToast('Tu carrito está vacío', 'error');
        return;
    }

    if (auth.isAuthenticated()) {
        // Redirigir al proceso de pago
        const orderData = {
            items: cartItems,
            shipping: selectedShipping,
            shipping_cost: shippingCost,
            discount: promoDiscount,
            total: calculateTotal()
        };

        localStorage.setItem('paints_checkout_data', JSON.stringify(orderData));
        Utils.showToast('Redirigiendo al proceso de pago...', 'info');

        // Si es recogida en tienda, ir al POS
        if (selectedShipping === 'pickup') {
            setTimeout(() => {
                window.location.href = '/frontend/pages/ventas/pos.html';
            }, 1500);
        } else {
            // Para entrega, implementar checkout online
            Utils.showToast('Proceso de pago online en desarrollo', 'info');
        }
    } else {
        Utils.showToast('Inicia sesión para continuar con la compra', 'info');
        setTimeout(() => {
            window.location.href = '/frontend/pages/public/login.html';
        }, 2000);
    }
}

// Calcular total
function calculateTotal() {
    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 0.12;
    return subtotal + tax + shippingCost - promoDiscount;
}

// Hacer funciones disponibles globalmente
window.updateQuantity = updateQuantity;
window.removeFromCart = removeFromCart;
window.selectShipping = selectShipping;
window.applyPromoCode = applyPromoCode;
window.requestAdvice = requestAdvice;
window.generateQuote = generateQuote;
window.proceedToCheckout = proceedToCheckout;

// Inicializar página
document.addEventListener('DOMContentLoaded', () => {
    setupUserMenu();
    displayCart();
});
