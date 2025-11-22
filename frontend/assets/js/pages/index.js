// Verificar si ya está logueado
if (auth.isAuthenticated()) {
    // Mostrar botón de dashboard en lugar de login
    const userMenu = document.querySelector('.user-menu');
    userMenu.innerHTML = `
        <a href="/frontend/pages/public/catalogo.html" class="btn btn-secondary btn-sm">
            <i class="fas fa-paint-brush"></i>
            Catálogo
        </a>
        <a href="/frontend/pages/admin/dashboard.html" class="btn btn-primary btn-sm">
            <i class="fas fa-tachometer-alt"></i>
            Dashboard
        </a>
        <button onclick="auth.logout()" class="btn btn-secondary btn-sm" style="margin-left: 0.5rem;">
            <i class="fas fa-sign-out-alt"></i>
            Salir
        </button>
    `;
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

// Cargar preview del catálogo
async function loadCatalogPreview() {
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/productos?limit=6`);
        const result = await response.json();

        const container = document.getElementById('catalogoPreview');

        if (result.success && result.data && result.data.length > 0) {
            const productsHTML = result.data.map(product => `
                <div class="feature-card" style="cursor: pointer;" onclick="window.location.href='/frontend/pages/public/catalogo.html'">
                    <div style="background: linear-gradient(135deg, var(--gray-100), var(--gray-200));
                         height: 120px; border-radius: 8px; display: flex; align-items: center;
                         justify-content: center; margin-bottom: 1rem; color: var(--primary-blue); font-size: 3rem;">
                        <i class="fas fa-paint-brush"></i>
                    </div>
                    <h4 style="font-size: 1rem; margin-bottom: 0.5rem; color: var(--gray-800);">${product.nombre}</h4>
                    <p style="color: var(--gray-600); font-size: 0.875rem; margin-bottom: 0.5rem;">${product.marca || 'Sin marca'}</p>
                    <p style="color: var(--primary-blue); font-weight: 600; font-size: 1.25rem;">
                        Q ${(product.precio_base || 0).toFixed(2)}
                    </p>
                </div>
            `).join('');

            container.innerHTML = productsHTML;
        } else {
            container.innerHTML = `
                <div style="text-align: center; padding: 2rem; grid-column: 1 / -1;">
                    <i class="fas fa-paint-brush" style="font-size: 3rem; color: var(--gray-400);"></i>
                    <p style="margin-top: 1rem; color: var(--gray-600);">No hay productos disponibles</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error cargando preview del catálogo:', error);
        const container = document.getElementById('catalogoPreview');
        container.innerHTML = `
            <div style="text-align: center; padding: 2rem; grid-column: 1 / -1;">
                <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: var(--error-red);"></i>
                <p style="margin-top: 1rem; color: var(--gray-600);">Error al cargar productos</p>
            </div>
        `;
    }
}

// Cargar el preview cuando la página esté lista
document.addEventListener('DOMContentLoaded', () => {
    loadCatalogPreview();
});
