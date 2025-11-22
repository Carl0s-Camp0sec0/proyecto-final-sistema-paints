// Funciones específicas para la página de registro de clientes

// Verificar si ya está logueado
if (auth.isAuthenticated()) {
    // Si es cliente, ir al catálogo; si es usuario, al dashboard
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
    const registerForm = document.getElementById('registerClienteForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = new FormData(e.target);
            const password = formData.get('password');
            const confirmPassword = formData.get('confirmPassword');

            // Validar contraseñas
            if (password !== confirmPassword) {
                Utils.showToast('Las contraseñas no coinciden', 'error');
                return;
            }

            // Validar longitud de contraseña
            if (password.length < 6) {
                Utils.showToast('La contraseña debe tener al menos 6 caracteres', 'error');
                return;
            }

            // Preparar datos para envío
            const registerData = {
                nombre_completo: formData.get('nombre_completo').trim(),
                email: formData.get('email').trim().toLowerCase(),
                password: password,
                telefono: formData.get('telefono')?.trim() || null,
                nit: formData.get('nit')?.trim() || 'CF',
                direccion: formData.get('direccion')?.trim() || null
            };

            const submitBtn = e.target.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;

            submitBtn.innerHTML = '<div class="spinner" style="width: 20px; height: 20px;"></div> Creando cuenta...';
            submitBtn.disabled = true;

            try {
                // Llamar al endpoint de registro de clientes
                const response = await fetch(`${CONFIG.API_BASE_URL}/clientes/registro`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(registerData)
                });

                const result = await response.json();

                if (result.success && result.token) {
                    Utils.showToast('¡Cuenta creada exitosamente!', 'success');

                    // Guardar token y datos del cliente
                    localStorage.setItem('paints_token', result.token);
                    localStorage.setItem('paints_user', JSON.stringify({
                        ...result.cliente,
                        tipo: 'cliente'
                    }));

                    // Redireccionar al catálogo después de 1 segundo
                    setTimeout(() => {
                        window.location.href = '/frontend/pages/public/catalogo.html';
                    }, 1000);
                } else {
                    Utils.showToast(result.message || 'Error creando la cuenta', 'error');
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                }

            } catch (error) {
                console.error('Registration error:', error);
                Utils.showToast('Error de conexión al crear la cuenta', 'error');
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        });
    }
});
