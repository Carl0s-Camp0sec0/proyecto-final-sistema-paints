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
