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
