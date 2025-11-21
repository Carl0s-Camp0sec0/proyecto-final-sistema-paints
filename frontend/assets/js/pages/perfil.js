        // Variables globales
        let originalData = {};

        // Inicializar página
        document.addEventListener('DOMContentLoaded', function() {
            loadUserData();
            setupFormHandlers();
        });

        // Cambiar tabs
        function switchTab(tabName) {
            // Remover active de todos los tabs
            document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
            
            // Activar tab seleccionado
            event.target.classList.add('active');
            document.getElementById(`tab-${tabName}`).classList.add('active');
        }

        // Cargar datos del usuario
        function loadUserData() {
            // Simular carga de datos del usuario
            originalData = {
                firstName: document.getElementById('firstName').value,
                lastName: document.getElementById('lastName').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('phone').value,
                address: document.getElementById('address').value,
                birthDate: document.getElementById('birthDate').value,
                bio: document.getElementById('bio').value
            };
        }

        // Configurar manejadores de formularios
        function setupFormHandlers() {
            // Formulario de información personal
            document.getElementById('personalForm').addEventListener('submit', function(e) {
                e.preventDefault();
                savePersonalInfo();
            });

            // Formulario de contraseña
            document.getElementById('passwordForm').addEventListener('submit', function(e) {
                e.preventDefault();
                changePassword();
            });
        }

        // Guardar información personal
        function savePersonalInfo() {
            const formData = {
                firstName: document.getElementById('firstName').value,
                lastName: document.getElementById('lastName').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('phone').value,
                address: document.getElementById('address').value,
                birthDate: document.getElementById('birthDate').value,
                bio: document.getElementById('bio').value
            };

            // Simular guardado
            setTimeout(() => {
                alert('✅ Información personal actualizada correctamente');
                
                // Actualizar nombre en el header
                const displayName = `${formData.firstName} ${formData.lastName}`;
                document.getElementById('displayName').textContent = displayName;
                
                // Actualizar avatar
                const initials = formData.firstName.charAt(0) + formData.lastName.charAt(0);
                document.getElementById('userAvatar').innerHTML = initials + '<button class="avatar-upload" onclick="uploadAvatar()"><i class="fas fa-camera"></i></button>';
                
                originalData = { ...formData };
            }, 1000);
        }

        // Cancelar edición
        function cancelEdit() {
            // Restaurar valores originales
            Object.keys(originalData).forEach(key => {
                const element = document.getElementById(key);
                if (element) {
                    element.value = originalData[key];
                }
            });
        }

        // Cambiar contraseña
        function changePassword() {
            const currentPassword = document.getElementById('currentPassword').value;
            const newPassword = document.getElementById('newPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;

            // Validaciones
            if (newPassword !== confirmPassword) {
                alert('❌ Las contraseñas no coinciden');
                return;
            }

            if (newPassword.length < 8) {
                alert('❌ La contraseña debe tener al menos 8 caracteres');
                return;
            }

            // Simular cambio de contraseña
            setTimeout(() => {
                alert('✅ Contraseña actualizada correctamente');
                document.getElementById('passwordForm').reset();
                document.getElementById('passwordStrength').style.display = 'none';
            }, 1000);
        }

        // Verificar fortaleza de contraseña
        function checkPasswordStrength() {
            const password = document.getElementById('newPassword').value;
            const strengthDiv = document.getElementById('passwordStrength');
            const fillDiv = document.getElementById('strengthFill');
            const textDiv = document.getElementById('strengthText');

            if (!password) {
                strengthDiv.style.display = 'none';
                return;
            }

            strengthDiv.style.display = 'block';

            let score = 0;
            let feedback = [];

            // Criterios de validación
            if (password.length >= 8) score++;
            else feedback.push('al menos 8 caracteres');

            if (/[A-Z]/.test(password)) score++;
            else feedback.push('una mayúscula');

            if (/[a-z]/.test(password)) score++;
            else feedback.push('una minúscula');

            if (/[0-9]/.test(password)) score++;
            else feedback.push('un número');

            if (/[^A-Za-z0-9]/.test(password)) score++;
            else feedback.push('un símbolo');

            // Actualizar visual
            fillDiv.className = 'strength-fill';
            if (score <= 2) {
                fillDiv.classList.add('strength-weak');
                textDiv.textContent = `Débil. Necesitas: ${feedback.join(', ')}`;
            } else if (score === 3) {
                fillDiv.classList.add('strength-fair');
                textDiv.textContent = `Regular. Mejora agregando: ${feedback.join(', ')}`;
            } else if (score === 4) {
                fillDiv.classList.add('strength-good');
                textDiv.textContent = 'Buena. ¡Casi perfecta!';
            } else {
                fillDiv.classList.add('strength-strong');
                textDiv.textContent = '¡Excelente! Contraseña muy segura';
            }
        }

        // Alternar visibilidad de contraseña
        function togglePassword(inputId) {
            const input = document.getElementById(inputId);
            const icon = event.target;

            if (input.type === 'password') {
                input.type = 'text';
                icon.className = 'fas fa-eye-slash';
            } else {
                input.type = 'password';
                icon.className = 'fas fa-eye';
            }
        }

        // Subir avatar
        function uploadAvatar() {
            alert('📷 Función de subir avatar en desarrollo');
        }

        // Configurar 2FA
        function setup2FA() {
            alert('🔐 Configuración de autenticación de dos factores en desarrollo');
        }
    </script>
