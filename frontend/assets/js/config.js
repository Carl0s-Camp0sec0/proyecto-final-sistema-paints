// Configuración de la aplicación
const CONFIG = {
    API_BASE_URL: 'http://localhost:3000/api',
    APP_NAME: 'Paints',
    VERSION: '1.0.0',
    
    // Roles del sistema
    ROLES: {
        ADMIN: 'Administrador',
        DIGITADOR: 'Digitador', 
        CAJERO: 'Cajero',
        GERENTE: 'Gerente'
    },
    
    // Estados de stock
    STOCK_LEVELS: {
        HIGH: 'high',
        MEDIUM: 'medium', 
        LOW: 'low',
        OUT: 'out'
    },
    
    // Medios de pago
    PAYMENT_METHODS: {
        EFECTIVO: 1,
        CHEQUE: 2,
        TARJETA_DEBITO: 3,
        TARJETA_CREDITO: 4,
        TRANSFERENCIA: 5
    }
};