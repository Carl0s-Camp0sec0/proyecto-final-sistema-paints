// Funciones utilitarias
const Utils = {
    // Formatear moneda guatemalteca
    formatCurrency(amount) {
        return new Intl.NumberFormat('es-GT', {
            style: 'currency',
            currency: 'GTQ',
            minimumFractionDigits: 2
        }).format(amount);
    },

    // Formatear fecha
    formatDate(dateString) {
        return new Intl.DateTimeFormat('es-GT', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(new Date(dateString));
    },

    // Formatear fecha solo día
    formatDateOnly(dateString) {
        return new Intl.DateTimeFormat('es-GT', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        }).format(new Date(dateString));
    },

    // Capitalizar primera letra
    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    },

    // Generar ID único simple
    generateId() {
        return Math.random().toString(36).substr(2, 9);
    },

    // Debounce función
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Validar email
    isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },

    // Mostrar notificación toast
    showToast(message, type = 'info') {
        // Crear elemento toast
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <span class="toast-icon">
                    ${type === 'success' ? '✓' : type === 'error' ? '✗' : 'i'}
                </span>
                <span class="toast-message">${message}</span>
            </div>
        `;

        // Agregar estilos si no existen
        if (!document.querySelector('.toast-styles')) {
            const style = document.createElement('style');
            style.className = 'toast-styles';
            style.textContent = `
                .toast {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
                    padding: 1rem 1.5rem;
                    border-left: 4px solid var(--primary-blue);
                    z-index: 1000;
                    animation: slideIn 0.3s ease;
                }
                .toast-success { border-left-color: var(--success-green); }
                .toast-error { border-left-color: var(--error-red); }
                .toast-warning { border-left-color: var(--warning-yellow); }
                .toast-content {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }
                .toast-icon {
                    font-weight: bold;
                    font-size: 1.25rem;
                }
                .toast-success .toast-icon { color: var(--success-green); }
                .toast-error .toast-icon { color: var(--error-red); }
                .toast-warning .toast-icon { color: var(--warning-yellow); }
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(toast);

        // Auto eliminar después de 4 segundos
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 4000);
    },

    // Confirmar acción
    async confirm(message, title = 'Confirmación') {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'modal-overlay';
            modal.innerHTML = `
                <div class="modal">
                    <div class="modal-header">
                        <h3>${title}</h3>
                    </div>
                    <div class="modal-body">
                        <p>${message}</p>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary cancel-btn">Cancelar</button>
                        <button class="btn btn-primary confirm-btn">Confirmar</button>
                    </div>
                </div>
            `;

            // Agregar estilos del modal si no existen
            if (!document.querySelector('.modal-styles')) {
                const style = document.createElement('style');
                style.className = 'modal-styles';
                style.textContent = `
                    .modal-overlay {
                        position: fixed;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background: rgba(0, 0, 0, 0.5);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        z-index: 1000;
                    }
                    .modal {
                        background: white;
                        border-radius: var(--border-radius);
                        max-width: 400px;
                        width: 90%;
                        box-shadow: var(--shadow-md);
                    }
                    .modal-header {
                        padding: 1.5rem;
                        border-bottom: 1px solid var(--gray-200);
                    }
                    .modal-header h3 {
                        margin: 0;
                        font-size: 1.25rem;
                        font-weight: 600;
                    }
                    .modal-body {
                        padding: 1.5rem;
                    }
                    .modal-footer {
                        padding: 1.5rem;
                        border-top: 1px solid var(--gray-200);
                        display: flex;
                        gap: 1rem;
                        justify-content: flex-end;
                    }
                `;
                document.head.appendChild(style);
            }

            document.body.appendChild(modal);

            modal.querySelector('.cancel-btn').onclick = () => {
                document.body.removeChild(modal);
                resolve(false);
            };

            modal.querySelector('.confirm-btn').onclick = () => {
                document.body.removeChild(modal);
                resolve(true);
            };

            // Cerrar con click fuera del modal
            modal.onclick = (e) => {
                if (e.target === modal) {
                    document.body.removeChild(modal);
                    resolve(false);
                }
            };
        });
    },

    // Determinar nivel de stock
    getStockLevel(current, minimum) {
        if (current === 0) return CONFIG.STOCK_LEVELS.OUT;
        if (current <= minimum) return CONFIG.STOCK_LEVELS.LOW;
        if (current <= minimum * 2) return CONFIG.STOCK_LEVELS.MEDIUM;
        return CONFIG.STOCK_LEVELS.HIGH;
    },

    // Obtener clase CSS para nivel de stock
    getStockClass(level) {
        switch (level) {
            case CONFIG.STOCK_LEVELS.OUT:
                return 'badge-error';
            case CONFIG.STOCK_LEVELS.LOW:
                return 'badge-warning';
            case CONFIG.STOCK_LEVELS.MEDIUM:
                return 'badge-warning';
            case CONFIG.STOCK_LEVELS.HIGH:
                return 'badge-success';
            default:
                return '';
        }
    },

    // Obtener texto para nivel de stock
    getStockText(level) {
        switch (level) {
            case CONFIG.STOCK_LEVELS.OUT:
                return 'Sin Stock';
            case CONFIG.STOCK_LEVELS.LOW:
                return 'Stock Bajo';
            case CONFIG.STOCK_LEVELS.MEDIUM:
                return 'Stock Medio';
            case CONFIG.STOCK_LEVELS.HIGH:
                return 'En Stock';
            default:
                return 'Desconocido';
        }
    }
};