// Datos del carrito (simulado)
let carrito = JSON.parse(localStorage.getItem('carrito')) || [];

// Inicializar página
document.addEventListener('DOMContentLoaded', function() {
    console.log('Página de promociones cargada');
    actualizarContadorCarrito();

    // Newsletter form
    document.getElementById('newsletterForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const email = e.target.querySelector('input[type="email"]').value;
        alert(`¡Gracias! Te has suscrito con el email: ${email}`);
        e.target.reset();
    });
});

// Aplicar filtros
function aplicarFiltros() {
    const categoria = document.getElementById('filtroCategoria').value;
    const descuento = document.getElementById('filtroDescuento').value;

    const promociones = document.querySelectorAll('.promocion-item');
    const estadoVacio = document.getElementById('estadoVacio');
    let itemsVisibles = 0;

    promociones.forEach(promocion => {
        let mostrar = true;

        // Filtrar por categoría
        if (categoria && promocion.dataset.categoria !== categoria) {
            mostrar = false;
        }

        // Filtrar por descuento
        if (descuento && mostrar) {
            const [min, max] = descuento.split('-').map(Number);
            const descuentoPromocion = parseInt(promocion.dataset.descuento);
            if (descuentoPromocion < min || descuentoPromocion > max) {
                mostrar = false;
            }
        }

        promocion.style.display = mostrar ? 'block' : 'none';
        if (mostrar) itemsVisibles++;
    });

    // Mostrar estado vacío si no hay items visibles
    estadoVacio.style.display = itemsVisibles === 0 ? 'block' : 'none';
}

// Limpiar filtros
function limpiarFiltros() {
    document.getElementById('filtroCategoria').value = '';
    document.getElementById('filtroDescuento').value = '';

    document.querySelectorAll('.promocion-item').forEach(promocion => {
        promocion.style.display = 'block';
    });

    document.getElementById('estadoVacio').style.display = 'none';
}

// Agregar al carrito
function agregarAlCarrito(productoId) {
    const productos = {
        'combo1': { nombre: 'Combo Pintura + Accesorios', precio: 425, imagen: 'combo.jpg' },
        'sherwin1': { nombre: 'Sherwin-Williams Premium', precio: 780, imagen: 'sherwin.jpg' },
        'kit1': { nombre: 'Kit Profesional Completo', precio: 262, imagen: 'kit.jpg' },
        'comex1': { nombre: 'Comex Vinimex', precio: 360, imagen: 'comex.jpg' },
        'brocha1': { nombre: 'Brocha Premium 4"', precio: 84, imagen: 'brocha.jpg' },
        'aguarras1': { nombre: 'Aguarrás 1/2 Galón', precio: 72, imagen: 'aguarras.jpg' },
        'barniz1': { nombre: 'Barniz Marino 1/4 Galón', precio: 168, imagen: 'barniz.jpg' },
        'benjamin1': { nombre: 'Benjamin Moore Eco', precio: 712, imagen: 'benjamin.jpg' },
        'rodillo1': { nombre: 'Rodillo Antichorreo', precio: 53, imagen: 'rodillo.jpg' }
    };

    const producto = productos[productoId];
    if (producto) {
        // Buscar si ya existe en el carrito
        const itemExistente = carrito.find(item => item.id === productoId);

        if (itemExistente) {
            itemExistente.cantidad += 1;
        } else {
            carrito.push({
                id: productoId,
                ...producto,
                cantidad: 1
            });
        }

        // Guardar en localStorage
        localStorage.setItem('carrito', JSON.stringify(carrito));
        actualizarContadorCarrito();

        // Mostrar confirmación
        mostrarNotificacion(`${producto.nombre} agregado al carrito`);
    }
}

// Ver carrito
function verCarrito() {
    if (carrito.length === 0) {
        alert('Tu carrito está vacío');
        return;
    }

    let mensaje = 'Carrito de compras:\n\n';
    let total = 0;

    carrito.forEach(item => {
        mensaje += `${item.nombre} - Q${item.precio} x ${item.cantidad}\n`;
        total += item.precio * item.cantidad;
    });

    mensaje += `\nTotal: Q${total.toLocaleString()}`;
    alert(mensaje);
}

// Actualizar contador del carrito
function actualizarContadorCarrito() {
    const badge = document.querySelector('.cart-badge');
    const totalItems = carrito.reduce((sum, item) => sum + item.cantidad, 0);
    badge.textContent = totalItems;
    badge.style.display = totalItems > 0 ? 'block' : 'none';
}

// Mostrar notificación
function mostrarNotificacion(mensaje) {
    // Crear notificación temporal
    const notificacion = document.createElement('div');
    notificacion.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--success-green);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;
    notificacion.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.5rem;">
            <i class="fas fa-check-circle"></i>
            <span>${mensaje}</span>
        </div>
    `;

    document.body.appendChild(notificacion);

    // Remover después de 3 segundos
    setTimeout(() => {
        notificacion.style.animation = 'slideOut 0.3s ease forwards';
        setTimeout(() => {
            document.body.removeChild(notificacion);
        }, 300);
    }, 3000);
}
