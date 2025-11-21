// Cliente API para comunicación con el backend
class ApiClient {
    constructor() {
        this.baseURL = CONFIG.API_BASE_URL;
    }

    // Método genérico para hacer requests
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        // Agregar token si está disponible
        if (auth.token) {
            config.headers.Authorization = `Bearer ${auth.token}`;
        }

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            // Manejar token expirado
            if (response.status === 401) {
                auth.logout();
                return { success: false, message: 'Sesión expirada' };
            }

            return data;
        } catch (error) {
            console.error('Error en API:', error);
            return { success: false, message: 'Error de conexión' };
        }
    }

    // Método GET con parámetros de query
    async get(endpoint, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const url = queryString ? `${endpoint}?${queryString}` : endpoint;
        return this.request(url, { method: 'GET' });
    }

    // === MÉTODOS DE SISTEMA ===
    async getCategorias() {
        return this.request('/sistema/categorias');
    }

    async getSucursales() {
        return this.request('/sistema/sucursales');
    }

    async getMediosPago() {
        return this.request('/sistema/medios-pago');
    }

    async getUnidadesMedida(categoriaId = null) {
        const params = categoriaId ? `?categoria_id=${categoriaId}` : '';
        return this.request(`/sistema/unidades-medida${params}`);
    }

    // === MÉTODOS DE PRODUCTOS ===
    async getProductos(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/productos?${queryString}`);
    }

    async getProducto(id, sucursalId = null) {
        const params = sucursalId ? `?sucursal_id=${sucursalId}` : '';
        return this.request(`/productos/${id}${params}`);
    }

    async createProducto(productData) {
        return this.request('/productos', {
            method: 'POST',
            body: JSON.stringify(productData)
        });
    }

    async updateProducto(id, productData) {
        return this.request(`/productos/${id}`, {
            method: 'PUT',
            body: JSON.stringify(productData)
        });
    }

    // === MÉTODOS DE CLIENTES ===
    async getClientes(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/clientes?${queryString}`);
    }

    async createCliente(clientData) {
        return this.request('/clientes', {
            method: 'POST',
            body: JSON.stringify(clientData)
        });
    }

    async getSucursalCercana(latitud, longitud) {
        return this.request(`/clientes/sucursal-cercana?latitud=${latitud}&longitud=${longitud}`);
    }

    // === MÉTODOS DE INVENTARIO ===
    async getInventarioSucursal(sucursalId, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/inventario/sucursal/${sucursalId}?${queryString}`);
    }

    async getStockEspecifico(sucursalId, productoId, unidadMedidaId) {
        return this.request(`/inventario/sucursal/${sucursalId}/producto/${productoId}/unidad/${unidadMedidaId}`);
    }

    // === MÉTODOS DE FACTURACIÓN ===
    async getFacturas(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/facturas?${queryString}`);
    }

    async createFactura(facturaData) {
        return this.request('/facturas', {
            method: 'POST',
            body: JSON.stringify(facturaData)
        });
    }

    async getFacturaPorNumero(numeroFactura) {
        return this.request(`/facturas/numero/${numeroFactura}`);
    }

    async getEstadisticasVentas(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/facturas/estadisticas?${queryString}`);
    }
}

// Instancia global del cliente API
const api = new ApiClient();