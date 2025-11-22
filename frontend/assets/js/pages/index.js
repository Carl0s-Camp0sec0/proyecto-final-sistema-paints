// Verificar si ya está logueado
if (auth.isAuthenticated()) {
    const user = auth.getUser();
    const userMenu = document.querySelector('#userMenu');

    if (user && user.tipo === 'cliente') {
        // Menú para clientes
        userMenu.innerHTML = `
            <a href="/frontend/pages/public/carrito.html" class="btn btn-secondary btn-sm">
                <i class="fas fa-shopping-cart"></i>
                Carrito
            </a>
            <a href="/frontend/pages/public/catalogo.html" class="btn btn-secondary btn-sm">
                <i class="fas fa-paint-brush"></i>
                Catálogo
            </a>
            <span class="btn btn-sm" style="background: transparent; color: var(--gray-700);">
                <i class="fas fa-user"></i>
                ${user.nombre_completo}
            </span>
            <button onclick="auth.logout()" class="btn btn-secondary btn-sm">
                <i class="fas fa-sign-out-alt"></i>
                Salir
            </button>
        `;
    } else {
        // Menú para empleados
        userMenu.innerHTML = `
            <a href="/frontend/pages/admin/dashboard.html" class="btn btn-primary btn-sm">
                <i class="fas fa-tachometer-alt"></i>
                Dashboard
            </a>
            <button onclick="auth.logout()" class="btn btn-secondary btn-sm">
                <i class="fas fa-sign-out-alt"></i>
                Salir
            </button>
        `;
    }
}

// Smooth scrolling para los enlaces del menú
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth'
            });
        }
    });
});

// Variables del carrusel
let currentIndex = 0;
let productos = [];
let autoplayInterval;

// Cargar productos para el carrusel
async function loadCarruselProductos() {
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/productos?limit=10`);
        const result = await response.json();

        const container = document.getElementById('carruselProductos');

        if (result.success && result.data && result.data.length > 0) {
            productos = result.data;
            renderCarrusel();
            startAutoplay();
        } else {
            container.innerHTML = `
                <div style="text-align: center; padding: 2rem; width: 100%;">
                    <i class="fas fa-paint-brush" style="font-size: 3rem; color: var(--gray-400);"></i>
                    <p style="margin-top: 1rem; color: var(--gray-600);">No hay productos disponibles</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error cargando carrusel:', error);
        const container = document.getElementById('carruselProductos');
        container.innerHTML = `
            <div style="text-align: center; padding: 2rem; width: 100%;">
                <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: var(--error-red);"></i>
                <p style="margin-top: 1rem; color: var(--gray-600);">Error al cargar productos</p>
            </div>
        `;
    }
}

// Renderizar carrusel
function renderCarrusel() {
    const container = document.getElementById('carruselProductos');
    const productsHTML = productos.map((product, index) => `
        <div class="feature-card" style="min-width: 300px; cursor: pointer; flex-shrink: 0;" onclick="window.location.href='/frontend/pages/public/catalogo.html'">
            <div style="background: linear-gradient(135deg, var(--gray-100), var(--gray-200));
                 height: 180px; border-radius: 8px; display: flex; align-items: center;
                 justify-content: center; margin-bottom: 1rem; color: var(--primary-blue); font-size: 4rem;">
                <i class="fas fa-paint-brush"></i>
            </div>
            <h4 style="font-size: 1.1rem; margin-bottom: 0.5rem; color: var(--gray-800); height: 2.5rem; overflow: hidden;">${product.nombre}</h4>
            <p style="color: var(--gray-600); font-size: 0.875rem; margin-bottom: 0.5rem;">${product.marca || 'Sin marca'}</p>
            <p style="color: var(--primary-blue); font-weight: 600; font-size: 1.5rem;">
                Q ${(product.precio_base || 0).toFixed(2)}
            </p>
        </div>
    `).join('');

    container.innerHTML = productsHTML;
}

// Mover carrusel
function moverCarrusel(direction) {
    // Detener autoplay al interactuar manualmente
    stopAutoplay();

    const container = document.getElementById('carruselProductos');
    const cardWidth = 300 + 32; // ancho de card + gap
    const visibleCards = Math.floor(window.innerWidth / cardWidth);

    currentIndex += direction;

    // Límites del carrusel
    if (currentIndex < 0) {
        currentIndex = 0;
    } else if (currentIndex > productos.length - visibleCards) {
        currentIndex = Math.max(0, productos.length - visibleCards);
    }

    const offset = -currentIndex * cardWidth;
    container.style.transform = `translateX(${offset}px)`;

    // Reiniciar autoplay después de 5 segundos
    setTimeout(startAutoplay, 5000);
}

// Autoplay del carrusel
function startAutoplay() {
    stopAutoplay(); // Limpiar cualquier intervalo existente
    autoplayInterval = setInterval(() => {
        const container = document.getElementById('carruselProductos');
        const cardWidth = 300 + 32;
        const visibleCards = Math.floor(window.innerWidth / cardWidth);

        currentIndex++;
        if (currentIndex > productos.length - visibleCards) {
            currentIndex = 0;
        }

        const offset = -currentIndex * cardWidth;
        container.style.transform = `translateX(${offset}px)`;
    }, 3000); // Cambiar cada 3 segundos
}

function stopAutoplay() {
    if (autoplayInterval) {
        clearInterval(autoplayInterval);
        autoplayInterval = null;
    }
}

// Cargar el carrusel cuando la página esté lista
document.addEventListener('DOMContentLoaded', () => {
    loadCarruselProductos();
});
