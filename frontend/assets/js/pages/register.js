// Funciones específicas para la página de registro

// Verificar si ya está logueado
if (auth.isAuthenticated()) {
    window.location.href = '/frontend/pages/admin/dashboard.html';
}

// Función para alternar visibilidad de contraseña
function togglePasswordVisibility(button) {
    const input = button.previousElementSibling;
    const icon = button.querySelector('i');

    if (input.type === 'password') {
        input.type = 'text';
        icon.className = 'fas fa-eye-slash';
    } else {
        input.type = 'password';
        icon.className = 'fas fa-eye';
    }
}

// Cargar sucursales
async function loadSucursales() {
    try {
        const response = await api.getSucursales();
        if (response.success) {
            const select = document.getElementById('sucursalSelect');
            const options = response.data.map(sucursal =>
                `<option value="${sucursal.id}">${sucursal.nombre} - ${sucursal.ubicacion}</option>`
            ).join('');
            select.innerHTML = '<option value="">Seleccione una sucursal</option>' + options;
        }
    } catch (error) {
        console.error('Error loading sucursales:', error);
        Utils.showToast('Error cargando sucursales', 'warning');
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    loadSucursales();

    // Manejar envío del formulario
    const registerForm = document.getElementById('registerForm');
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

            // Preparar datos para envío
            const registerData = {
                nombre_completo: `${formData.get('nombre')} ${formData.get('apellido')}`,
                email: formData.get('email'),
                telefono: formData.get('telefono'),
                sucursal_id: parseInt(formData.get('sucursal_id')),
                rol: formData.get('rol'),
                password: password,
                activo: true
            };

            const submitBtn = e.target.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;

            submitBtn.innerHTML = '<div class="spinner" style="width: 20px; height: 20px;"></div>';
            submitBtn.disabled = true;

            try {
                // Crear usuario
                const response = await api.createUsuario(registerData);

                if (response.success) {
                    Utils.showToast('¡Cuenta creada exitosamente!', 'success');

                    // Redireccionar después de 2 segundos
                    setTimeout(() => {
                        window.location.href = '/frontend/pages/public/login.html';
                    }, 2000);
                } else {
                    Utils.showToast(response.message || 'Error creando la cuenta', 'error');
                }

            } catch (error) {
                console.error('Registration error:', error);
                Utils.showToast('Error de conexión al crear la cuenta', 'error');
            } finally {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        });
    }
});
