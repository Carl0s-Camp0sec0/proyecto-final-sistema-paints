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

    async getCategoria(id) {
        return this.request(`/sistema/categorias/${id}`);
    }

    async createCategoria(categoryData) {
        return this.request('/sistema/categorias', {
            method: 'POST',
            body: JSON.stringify(categoryData)
        });
    }

    async updateCategoria(id, categoryData) {
        return this.request(`/sistema/categorias/${id}`, {
            method: 'PUT',
            body: JSON.stringify(categoryData)
        });
    }

    async deleteCategoria(id) {
        return this.request(`/sistema/categorias/${id}`, {
            method: 'DELETE'
        });
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

    async deleteProducto(id) {
        return this.request(`/productos/${id}`, {
            method: 'DELETE'
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

    async getSiguienteCorrelativo(sucursalId) {
        return this.request(`/facturas/siguiente-correlativo?sucursal_id=${sucursalId}`);
    }

    async getEstadisticasVentas(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/facturas/estadisticas?${queryString}`);
    }

    // === MÉTODOS DE USUARIOS ===
    async getUsuarios(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/usuarios?${queryString}`);
    }

    async getUsuario(id) {
        return this.request(`/usuarios/${id}`);
    }

    async createUsuario(userData) {
        return this.request('/usuarios', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    }

    async updateUsuario(id, userData) {
        return this.request(`/usuarios/${id}`, {
            method: 'PUT',
            body: JSON.stringify(userData)
        });
    }

    async deleteUsuario(id) {
        return this.request(`/usuarios/${id}`, {
            method: 'DELETE'
        });
    }

    // === MÉTODOS DE CARRITO ===
    async getCarrito() {
        return this.request('/carrito');
    }

    async agregarAlCarrito(data) {
        return this.request('/carrito', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async actualizarItemCarrito(id, cantidad) {
        return this.request(`/carrito/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ cantidad })
        });
    }

    async eliminarItemCarrito(id) {
        return this.request(`/carrito/${id}`, {
            method: 'DELETE'
        });
    }

    async vaciarCarrito() {
        return this.request('/carrito', {
            method: 'DELETE'
        });
    }

    // === MÉTODOS DE REPORTES ===
    async getReporteVentasPeriodo(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/reportes/ventas/periodo?${queryString}`);
    }

    async getReporteProductosTopIngresos(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/reportes/productos/top-ingresos?${queryString}`);
    }

    async getReporteProductosTopCantidad(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/reportes/productos/top-cantidad?${queryString}`);
    }

    async getReporteInventarioGeneral() {
        return this.request('/reportes/inventario/general');
    }

    async getReporteProductosMenosVendidos(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/reportes/productos/menos-vendidos?${queryString}`);
    }

    async getReporteProductosSinStock() {
        return this.request('/reportes/inventario/sin-stock');
    }

    async getReporteProductosStockBajo() {
        return this.request('/reportes/inventario/stock-bajo');
    }

    async getReporteInventarioPorTienda(sucursalId) {
        return this.request(`/reportes/inventario/por-tienda?sucursal_id=${sucursalId}`);
    }

    async getReporteFactura(numeroFactura) {
        return this.request(`/reportes/facturas/${numeroFactura}`);
    }

    async getReporteIngresosInventario(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/reportes/inventario/ingresos?${queryString}`);
    }
}

// Instancia global del cliente API
const api = new ApiClient();