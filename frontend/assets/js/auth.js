// Gestión de autenticación
class AuthManager {
    constructor() {
        this.token = localStorage.getItem('paints_token');
        this.user = this.getStoredUser();
    }

    // Obtener usuario almacenado
    getStoredUser() {
        const userData = localStorage.getItem('paints_user');
        return userData ? JSON.parse(userData) : null;
    }

    // Verificar si está autenticado
    isAuthenticated() {
        return this.token && this.user;
    }

    // Login
    async login(email, password) {
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (data.success) {
                this.token = data.data.token;
                this.user = data.data.usuario;
                
                // Almacenar en localStorage
                localStorage.setItem('paints_token', this.token);
                localStorage.setItem('paints_user', JSON.stringify(this.user));
                
                return { success: true, user: this.user };
            } else {
                return { success: false, message: data.message };
            }
        } catch (error) {
            console.error('Error en login:', error);
            return { success: false, message: 'Error de conexión' };
        }
    }

    // Logout
    logout() {
        this.token = null;
        this.user = null;
        localStorage.removeItem('paints_token');
        localStorage.removeItem('paints_user');
        window.location.reload();
    }

    // Obtener token para requests
    getAuthHeaders() {
        return {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json'
        };
    }

    // Verificar permisos por rol
    hasPermission(requiredRoles) {
        if (!this.user || !this.user.rol) return false;
        
        // Admin siempre tiene acceso
        if (this.user.rol === CONFIG.ROLES.ADMIN) return true;
        
        // Verificar roles específicos
        if (Array.isArray(requiredRoles)) {
            return requiredRoles.includes(this.user.rol);
        }
        
        return this.user.rol === requiredRoles;
    }

    // Obtener iniciales del usuario
    getUserInitials() {
        if (!this.user || !this.user.nombre_completo) return 'U';
        
        const names = this.user.nombre_completo.split(' ');
        if (names.length >= 2) {
            return names[0][0] + names[1][0];
        }
        return names[0][0];
    }
}

// Instancia global del AuthManager
const auth = new AuthManager();