// Funciones específicas para la página de login de clientes

// Verificar si ya está logueado
if (auth.isAuthenticated()) {
    const user = auth.getUser();
    if (user && user.tipo === 'cliente') {
        window.location.href = '/frontend/pages/public/catalogo.html';
    } else {
        window.location.href = '/frontend/pages/admin/dashboard.html';
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    // Manejar envío del formulario
    const loginForm = document.getElementById('loginClienteForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = new FormData(e.target);
            const email = formData.get('email').trim().toLowerCase();
            const password = formData.get('password');

            const submitBtn = e.target.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;

            submitBtn.innerHTML = '<div class="spinner" style="width: 20px; height: 20px;"></div> Iniciando sesión...';
            submitBtn.disabled = true;

            try {
                // Llamar al endpoint de login de clientes
                const response = await fetch(`${CONFIG.API_BASE_URL}/clientes/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email, password })
                });

                const result = await response.json();

                if (result.success && result.token) {
                    Utils.showToast('Login exitoso', 'success');

                    // Guardar token y datos del cliente
                    localStorage.setItem('paints_token', result.token);
                    localStorage.setItem('paints_user', JSON.stringify({
                        ...result.cliente,
                        tipo: 'cliente'
                    }));

                    // Redireccionar al catálogo
                    setTimeout(() => {
                        window.location.href = '/frontend/pages/public/catalogo.html';
                    }, 500);
                } else {
                    Utils.showToast(result.message || 'Credenciales inválidas', 'error');
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                }
            } catch (error) {
                console.error('Error en login:', error);
                Utils.showToast('Error de conexión', 'error');
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        });
    }
});
