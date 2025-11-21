/**
 * Funciones globales disponibles en todas las páginas
 */

// Función global de logout
function logout() {
    if (auth && typeof auth.logout === 'function') {
        auth.logout();
    } else {
        // Fallback manual
        localStorage.removeItem('paints_token');
        localStorage.removeItem('paints_user');
        window.location.href = '/frontend/pages/public/login.html';
    }
}

// Función para cargar datos del usuario en el header
function loadUserData() {
    if (!auth || !auth.user) return;

    const elements = {
        userAvatar: document.getElementById('userAvatar'),
        userName: document.getElementById('userName'),
        userRole: document.getElementById('userRole'),
        sidebarRole: document.getElementById('sidebarRole'),
        sidebarEmail: document.getElementById('sidebarEmail'),
        welcomeMessage: document.getElementById('welcomeMessage')
    };

    if (elements.userAvatar) {
        elements.userAvatar.textContent = auth.getUserInitials();
    }
    if (elements.userName) {
        elements.userName.textContent = auth.user.nombre_completo || auth.user.email;
    }
    if (elements.userRole) {
        elements.userRole.textContent = auth.user.rol || 'Usuario';
    }
    if (elements.sidebarRole) {
        elements.sidebarRole.textContent = auth.user.rol || 'Usuario';
    }
    if (elements.sidebarEmail) {
        elements.sidebarEmail.textContent = auth.user.email || '';
    }
    if (elements.welcomeMessage) {
        elements.welcomeMessage.textContent = `Bienvenido, ${auth.user.nombre_completo || auth.user.email}`;
    }
}

// Inicializar datos del usuario cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadUserData);
} else {
    loadUserData();
}
