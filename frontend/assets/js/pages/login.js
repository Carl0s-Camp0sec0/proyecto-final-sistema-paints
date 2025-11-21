// Funciones específicas para la página de login
// Nota: togglePasswordVisibility ahora está definida en global.js

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    // Verificar si ya está logueado
    if (auth.isAuthenticated()) {
        window.location.href = '/frontend/pages/admin/dashboard.html';
        return;
    }

    // Manejar envío del formulario
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = new FormData(e.target);
            const email = formData.get('email');
            const password = formData.get('password');

            const submitBtn = e.target.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;

            submitBtn.innerHTML = '<div class="spinner" style="width: 20px; height: 20px;"></div>';
            submitBtn.disabled = true;

            try {
                const result = await auth.login(email, password);

                if (result.success) {
                    Utils.showToast('Login exitoso', 'success');
                    window.location.href = '/frontend/pages/admin/dashboard.html';
                } else {
                    Utils.showToast(result.message, 'error');
                }
            } catch (error) {
                console.error('Error en login:', error);
                Utils.showToast('Error de conexión', 'error');
            } finally {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        });
    }
});
