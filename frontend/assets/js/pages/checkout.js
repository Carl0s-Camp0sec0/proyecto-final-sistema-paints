// Variables globales
let currentStep = 1;
let orderData = {};
let selectedDeliveryType = 'pickup';
let selectedPaymentMethod = 'cash';
let shippingCost = 0;

// Inicializar página
document.addEventListener('DOMContentLoaded', function() {
    // Verificar autenticación
    if (!auth.isAuthenticated()) {
        Utils.showToast('Debes iniciar sesión para continuar', 'error');
        window.location.href = '/frontend/pages/public/login.html';
        return;
    }

    loadOrderData();
    loadUserData();
    updateOrderSummary();
    updateStepDisplay();
    formatCardInputs();
});

// Cargar datos del usuario autenticado
function loadUserData() {
    if (auth.user) {
        document.getElementById('fullName').value = auth.user.nombre_completo || '';
        document.getElementById('email').value = auth.user.email || '';
        document.getElementById('phone').value = auth.user.telefono || '';
    }
}

// Cargar datos del carrito
function loadOrderData() {
    const checkoutData = localStorage.getItem('paints_checkout_data');
    if (checkoutData) {
        orderData = JSON.parse(checkoutData);
        console.log('Datos del pedido cargados:', orderData);
    } else {
        // Si no hay datos específicos de checkout, cargar del carrito
        const cartData = localStorage.getItem('paints_cart');
        if (cartData) {
            const cart = JSON.parse(cartData);
            orderData = {
                items: cart,
                shipping: 'pickup',
                shipping_cost: 0,
                discount: 0
            };
        } else {
            Utils.showToast('No hay productos en el carrito', 'error');
            window.location.href = '/frontend/pages/public/carrito.html';
            return;
        }
    }
}

// Actualizar resumen del pedido
function updateOrderSummary() {
    if (!orderData.items || orderData.items.length === 0) {
        Utils.showToast('No hay productos para procesar', 'error');
        return;
    }

    // Mostrar productos
    const orderItemsHtml = orderData.items.map(item => `
        <div class="order-item">
            <div class="item-image">
                <i class="fas fa-paint-brush"></i>
            </div>
            <div class="item-details">
                <div class="item-name">${item.name || item.nombre || 'Producto'}</div>
                <div class="item-specs">Cantidad: ${item.quantity || item.cantidad || 1}</div>
                <div class="item-price">Q ${((item.price || item.precio || 0) * (item.quantity || item.cantidad || 1)).toFixed(2)}</div>
            </div>
        </div>
    `).join('');

    document.getElementById('orderItems').innerHTML = orderItemsHtml;

    // Calcular totales
    const subtotal = orderData.items.reduce((sum, item) => {
        const price = item.price || item.precio || 0;
        const quantity = item.quantity || item.cantidad || 1;
        return sum + (price * quantity);
    }, 0);

    const tax = subtotal * 0.12;
    const total = subtotal + shippingCost + tax;

    document.getElementById('subtotal').textContent = Utils.formatCurrency(subtotal);
    document.getElementById('shipping').textContent = shippingCost > 0 ? Utils.formatCurrency(shippingCost) : 'Gratis';
    document.getElementById('tax').textContent = Utils.formatCurrency(tax);
    document.getElementById('total').textContent = Utils.formatCurrency(total);
}

// Seleccionar tipo de entrega
function selectDelivery(type) {
    selectedDeliveryType = type;

    // Actualizar UI
    document.querySelectorAll('.delivery-option').forEach(option => {
        option.classList.remove('selected');
    });
    document.querySelector(`[data-type="${type}"]`).classList.add('selected');

    // Mostrar/ocultar secciones
    const storePickup = document.getElementById('storePickup');
    const homeDelivery = document.getElementById('homeDelivery');

    if (type === 'pickup') {
        storePickup.style.display = 'block';
        homeDelivery.style.display = 'none';
        shippingCost = 0;
    } else {
        storePickup.style.display = 'none';
        homeDelivery.style.display = 'block';
        shippingCost = 25.00;
    }

    updateOrderSummary();
}

// Seleccionar método de pago
function selectPaymentMethod(method) {
    selectedPaymentMethod = method;

    // Actualizar UI
    document.querySelectorAll('.payment-method').forEach(el => {
        el.classList.remove('selected');
    });
    document.querySelector(`[data-method="${method}"]`).classList.add('selected');

    // Mostrar/ocultar formulario de tarjeta
    const cardForm = document.getElementById('cardForm');
    if (method === 'card') {
        cardForm.classList.add('active');
    } else {
        cardForm.classList.remove('active');
    }
}

// Siguiente paso
function nextStep() {
    if (validateCurrentStep()) {
        if (currentStep === 3) {
            processOrder();
        } else {
            currentStep++;
            updateStepDisplay();
        }
    }
}

// Paso anterior
function previousStep() {
    if (currentStep > 1) {
        currentStep--;
        updateStepDisplay();
    }
}

// Actualizar visualización del paso
function updateStepDisplay() {
    // Actualizar indicadores de progreso
    document.querySelectorAll('.progress-step').forEach((step, index) => {
        step.classList.remove('active', 'completed');
        if (index + 1 < currentStep) {
            step.classList.add('completed');
        } else if (index + 1 === currentStep) {
            step.classList.add('active');
        }
    });

    // Mostrar contenido del paso actual
    document.querySelectorAll('.step-content').forEach(content => {
        content.classList.remove('active');
    });

    const stepNames = ['', 'shipping', 'payment', 'review', 'confirmation'];
    const currentContent = document.getElementById(`content-${stepNames[currentStep]}`);
    if (currentContent) {
        currentContent.classList.add('active');
    }

    // Actualizar botones
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');

    prevBtn.style.display = currentStep > 1 ? 'block' : 'none';

    if (currentStep === 3) {
        nextBtn.innerHTML = '<i class="fas fa-credit-card"></i> Procesar Pedido';
        nextBtn.className = 'btn btn-success';
    } else if (currentStep === 4) {
        nextBtn.style.display = 'none';
    } else {
        nextBtn.innerHTML = 'Continuar <i class="fas fa-arrow-right"></i>';
        nextBtn.className = 'btn btn-primary';
    }

    // Llenar revisión en el paso 3
    if (currentStep === 3) {
        populateReview();
    }
}

// Validar paso actual
function validateCurrentStep() {
    switch (currentStep) {
        case 1:
            return validateShippingInfo();
        case 2:
            return validatePaymentMethod();
        case 3:
            return true;
        default:
            return false;
    }
}

// Validar información de envío
function validateShippingInfo() {
    const fullName = document.getElementById('fullName').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const email = document.getElementById('email').value.trim();

    if (!fullName || !phone || !email) {
        Utils.showToast('Completa toda la información personal', 'error');
        return false;
    }

    if (selectedDeliveryType === 'delivery') {
        const municipality = document.getElementById('municipality').value.trim();
        const address = document.getElementById('address').value.trim();

        if (!municipality || !address) {
            Utils.showToast('Completa la información de dirección', 'error');
            return false;
        }
    }

    return true;
}

// Validar método de pago
function validatePaymentMethod() {
    if (selectedPaymentMethod === 'card') {
        const cardNumber = document.getElementById('cardNumber').value.trim();
        const expiryDate = document.getElementById('expiryDate').value.trim();
        const cvv = document.getElementById('cvv').value.trim();
        const cardHolder = document.getElementById('cardHolder').value.trim();

        if (!cardNumber || !expiryDate || !cvv || !cardHolder) {
            Utils.showToast('Completa toda la información de la tarjeta', 'error');
            return false;
        }

        if (cardNumber.replace(/\s/g, '').length < 13) {
            Utils.showToast('Número de tarjeta inválido', 'error');
            return false;
        }
    }

    return true;
}

// Llenar revisión
function populateReview() {
    // Información del cliente
    const fullName = document.getElementById('fullName').value;
    const phone = document.getElementById('phone').value;
    const email = document.getElementById('email').value;

    document.getElementById('customerReview').innerHTML = `
        <p><strong>Nombre:</strong> ${fullName}</p>
        <p><strong>Teléfono:</strong> ${phone}</p>
        <p><strong>Email:</strong> ${email}</p>
    `;

    // Información de entrega
    let deliveryInfo = '';
    if (selectedDeliveryType === 'pickup') {
        const store = document.getElementById('storeLocation').selectedOptions[0].text;
        deliveryInfo = `
            <p><strong>Método:</strong> Recoger en tienda</p>
            <p><strong>Sucursal:</strong> ${store}</p>
            <p><strong>Costo:</strong> Gratis</p>
        `;
    } else {
        const department = document.getElementById('department').selectedOptions[0].text;
        const municipality = document.getElementById('municipality').value;
        const address = document.getElementById('address').value;
        deliveryInfo = `
            <p><strong>Método:</strong> Entrega a domicilio</p>
            <p><strong>Dirección:</strong> ${address}, ${municipality}, ${department}</p>
            <p><strong>Costo:</strong> Q 25.00</p>
        `;
    }

    document.getElementById('deliveryReview').innerHTML = deliveryInfo;

    // Método de pago
    let paymentInfo = '';
    switch (selectedPaymentMethod) {
        case 'cash':
            paymentInfo = '<p><strong>Efectivo</strong> - Pago al recibir el pedido</p>';
            break;
        case 'card':
            const cardNumber = document.getElementById('cardNumber').value;
            const maskedCard = '**** **** **** ' + cardNumber.slice(-4);
            paymentInfo = `<p><strong>Tarjeta</strong> - ${maskedCard}</p>`;
            break;
        case 'check':
            paymentInfo = '<p><strong>Cheque</strong> - Cheque al recibir el pedido</p>';
            break;
    }

    document.getElementById('paymentReview').innerHTML = paymentInfo;
}

// Procesar pedido
function processOrder() {
    document.getElementById('processingOverlay').style.display = 'flex';

    // Preparar datos del pedido
    const orderPayload = {
        customer: {
            name: document.getElementById('fullName').value,
            phone: document.getElementById('phone').value,
            email: document.getElementById('email').value
        },
        delivery: {
            type: selectedDeliveryType,
            store: selectedDeliveryType === 'pickup' ? document.getElementById('storeLocation').value : null,
            address: selectedDeliveryType === 'delivery' ? {
                department: document.getElementById('department').value,
                municipality: document.getElementById('municipality').value,
                address: document.getElementById('address').value,
                reference: document.getElementById('reference').value
            } : null,
            cost: shippingCost
        },
        payment: {
            method: selectedPaymentMethod,
            details: selectedPaymentMethod === 'card' ? {
                cardNumber: document.getElementById('cardNumber').value,
                expiryDate: document.getElementById('expiryDate').value,
                cardHolder: document.getElementById('cardHolder').value
            } : null
        },
        items: orderData.items,
        totals: {
            subtotal: parseFloat(document.getElementById('subtotal').textContent.replace('Q ', '')),
            shipping: shippingCost,
            tax: parseFloat(document.getElementById('tax').textContent.replace('Q ', '')),
            total: parseFloat(document.getElementById('total').textContent.replace('Q ', ''))
        }
    };

    // Simular procesamiento
    setTimeout(() => {
        document.getElementById('processingTitle').textContent = 'Confirmando Pedido...';
        document.getElementById('processingMessage').textContent = 'Guardando información del pedido';

        setTimeout(() => {
            // Simular API call exitosa
            const orderNumber = 'PNT-' + new Date().getFullYear() + '-' + String(Math.floor(Math.random() * 1000)).padStart(3, '0');

            // Calcular fecha de entrega
            const deliveryDate = new Date();
            if (selectedDeliveryType === 'pickup') {
                deliveryDate.setHours(deliveryDate.getHours() + 4); // 4 horas
            } else {
                deliveryDate.setDate(deliveryDate.getDate() + 2); // 2 días
            }

            document.getElementById('orderNumber').textContent = '#' + orderNumber;
            document.getElementById('deliveryDate').textContent = deliveryDate.toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            // Limpiar datos del carrito
            localStorage.removeItem('paints_cart');
            localStorage.removeItem('paints_checkout_data');

            // Guardar información del pedido para seguimiento
            localStorage.setItem('paints_last_order', JSON.stringify({
                orderNumber: orderNumber,
                customer: orderPayload.customer,
                delivery: orderPayload.delivery,
                payment: orderPayload.payment,
                total: orderPayload.totals.total,
                date: new Date().toISOString(),
                status: 'confirmed'
            }));

            // Ocultar overlay y mostrar confirmación
            document.getElementById('processingOverlay').style.display = 'none';
            currentStep = 4;
            updateStepDisplay();

            Utils.showToast('¡Pedido procesado exitosamente!', 'success');

        }, 2000);
    }, 3000);
}

// Descargar comprobante
function downloadInvoice() {
    const lastOrder = localStorage.getItem('paints_last_order');
    if (lastOrder) {
        const order = JSON.parse(lastOrder);

        // En un sistema real, aquí se generaría y descargaría el PDF
        Utils.showToast('Generando comprobante de compra...', 'info');

        setTimeout(() => {
            Utils.showToast('Comprobante descargado exitosamente', 'success');
        }, 1500);
    } else {
        Utils.showToast('No se encontró información del pedido', 'error');
    }
}

// Seguir pedido
function trackOrder() {
    const orderNumber = document.getElementById('orderNumber').textContent;
    Utils.showToast(`Redirigiendo al seguimiento del pedido ${orderNumber}...`, 'info');

    setTimeout(() => {
        // En un sistema real, aquí se redirigiría a la página de seguimiento
        window.location.href = '/frontend/pages/public/seguimiento.html';
    }, 1500);
}

// Ir a inicio
function goToHome() {
    window.location.href = '/frontend/pages/public/index.html';
}

// Formatear inputs de tarjeta
function formatCardInputs() {
    const cardNumberInput = document.getElementById('cardNumber');
    if (cardNumberInput) {
        cardNumberInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
            let matches = value.match(/\d{4,16}/g);
            let match = matches && matches[0] || '';
            let parts = [];
            for (let i = 0, len = match.length; i < len; i += 4) {
                parts.push(match.substring(i, i + 4));
            }
            if (parts.length) {
                e.target.value = parts.join(' ');
            } else {
                e.target.value = value;
            }
        });
    }

    const expiryInput = document.getElementById('expiryDate');
    if (expiryInput) {
        expiryInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length >= 2) {
                value = value.substring(0, 2) + '/' + value.substring(2, 4);
            }
            e.target.value = value;
        });
    }

    const cvvInput = document.getElementById('cvv');
    if (cvvInput) {
        cvvInput.addEventListener('input', function(e) {
            e.target.value = e.target.value.replace(/\D/g, '');
        });
    }
}

// Hacer funciones disponibles globalmente
window.selectDelivery = selectDelivery;
window.selectPaymentMethod = selectPaymentMethod;
window.nextStep = nextStep;
window.previousStep = previousStep;
window.downloadInvoice = downloadInvoice;
window.trackOrder = trackOrder;
window.goToHome = goToHome;
