// Verificar autenticación y permisos
if (!auth.isAuthenticated()) {
    window.location.href = '/frontend/pages/public/login.html';
}

if (!auth.hasPermission([CONFIG.ROLES.ADMIN, CONFIG.ROLES.GERENTE])) {
    Utils.showToast('No tienes permisos para acceder a los reportes', 'error');
    window.location.href = '/frontend/pages/admin/dashboard.html';
}

// Cargar datos del usuario
function loadUserData() {
    document.getElementById('userAvatar').textContent = auth.getUserInitials();
    document.getElementById('userName').textContent = auth.user.nombre_completo;
    document.getElementById('userRole').textContent = auth.user.rol;
}

// Mostrar reporte específico
function showReport(reportType) {
    try {
        console.log('showReport llamado con tipo:', reportType);
        const reportContent = document.getElementById('reportContent');

        if (!reportContent) {
            console.error('Elemento reportContent no encontrado');
            return;
        }

        switch(reportType) {
            case 'stock-minimo':
                showStockMinimoReport(reportContent);
                break;
            case 'mas-vendidos':
                showMasVendidosReport(reportContent);
                break;
            case 'analisis-abc':
                showAnalisisABCReport(reportContent);
                break;
            default:
                Utils.showToast('Reporte no disponible', 'info');
        }
    } catch (error) {
        console.error('Error en showReport:', error);
        Utils.showToast('Error al mostrar el reporte', 'error');
    }
}

// Reporte de Stock Mínimo
async function showStockMinimoReport(container) {
    container.innerHTML = '<div class="loading"><div class="spinner"></div><p>Cargando reporte de stock...</p></div>';

    try {
        const response = await api.getReporteProductosStockBajo();

        if (!response.success) {
            throw new Error(response.message || 'Error al cargar reporte');
        }

        const productos = response.data?.productos || [];

        let tableRows = '';
        if (productos.length === 0) {
            tableRows = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 2rem; color: var(--gray-500);">
                        No hay productos con stock bajo en este momento
                    </td>
                </tr>
            `;
        } else {
            tableRows = productos.map(producto => {
                const stockStatus = producto.stock_actual === 0 ? 'Agotado' :
                    producto.stock_actual <= producto.stock_minimo / 2 ? 'Crítico' : 'Bajo';
                const statusClass = producto.stock_actual === 0 ? 'badge-danger' :
                    producto.stock_actual <= producto.stock_minimo / 2 ? 'badge-danger' : 'badge-warning';

                return `
                    <tr>
                        <td>${producto.nombre || producto.producto?.nombre || 'N/A'}</td>
                        <td>${producto.categoria?.nombre || 'N/A'}</td>
                        <td style="color: var(${producto.stock_actual === 0 ? '--error-red' : '--warning-yellow'}); font-weight: 600;">
                            ${producto.stock_actual || 0}
                        </td>
                        <td>${producto.stock_minimo || 0}</td>
                        <td><span class="badge ${statusClass}">${stockStatus}</span></td>
                        <td><button class="btn btn-sm btn-primary" onclick="solicitarReposicion(${producto.id})">Solicitar</button></td>
                    </tr>
                `;
            }).join('');
        }

        container.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">
                        <i class="fas fa-exclamation-triangle" style="color: var(--error-red);"></i>
                        Alertas de Stock
                    </h3>
                    <button class="btn btn-sm btn-primary" onclick="window.print()">
                        <i class="fas fa-print"></i> Imprimir
                    </button>
                </div>
                <div class="card-content">
                    <p style="color: var(--gray-600); margin-bottom: 1.5rem;">
                        Productos que han alcanzado o están por debajo del stock mínimo configurado.
                    </p>
                    <div class="table-responsive">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Producto</th>
                                    <th>Categoría</th>
                                    <th>Stock Actual</th>
                                    <th>Stock Mínimo</th>
                                    <th>Estado</th>
                                    <th>Acción</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${tableRows}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error cargando reporte de stock:', error);
        container.innerHTML = `
            <div class="card">
                <div class="card-content">
                    <div style="text-align: center; padding: 2rem; color: var(--error-red);">
                        <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                        <h3>Error al cargar el reporte</h3>
                        <p>${error.message}</p>
                    </div>
                </div>
            </div>
        `;
    }
}

// Reporte de Productos Más Vendidos
async function showMasVendidosReport(container) {
    container.innerHTML = '<div class="loading"><div class="spinner"></div><p>Cargando productos más vendidos...</p></div>';

    try {
        // Usar fechas por defecto (último mes)
        const fechaFin = new Date();
        const fechaInicio = new Date();
        fechaInicio.setMonth(fechaInicio.getMonth() - 1);

        const response = await api.getReporteProductosTopCantidad({
            limit: 10,
            fecha_inicio: fechaInicio.toISOString().split('T')[0],
            fecha_fin: fechaFin.toISOString().split('T')[0]
        });

        if (!response.success) {
            throw new Error(response.message || 'Error al cargar reporte');
        }

        const productos = response.data || [];

        let tableRows = '';
        if (productos.length === 0) {
            tableRows = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 2rem; color: var(--gray-500);">
                        No hay datos de ventas disponibles
                    </td>
                </tr>
            `;
        } else {
            tableRows = productos.map((producto, index) => `
                <tr>
                    <td>${index + 1}</td>
                    <td>${producto.nombre || 'N/A'}</td>
                    <td>${producto.categoria || 'N/A'}</td>
                    <td>${producto.cantidad_vendida || 0}</td>
                    <td>${Utils.formatCurrency(producto.total_ingresos || 0)}</td>
                    <td>${producto.porcentaje_total ? producto.porcentaje_total.toFixed(1) + '%' : 'N/A'}</td>
                </tr>
            `).join('');
        }

        container.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">
                        <i class="fas fa-trophy" style="color: var(--warning-yellow);"></i>
                        Productos Más Vendidos
                    </h3>
                    <button class="btn btn-sm btn-primary" onclick="window.print()">
                        <i class="fas fa-print"></i> Imprimir
                    </button>
                </div>
                <div class="card-content">
                    <p style="color: var(--gray-600); margin-bottom: 1.5rem;">
                        Top 10 productos con mayor volumen de ventas.
                    </p>
                    <div class="table-responsive">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Producto</th>
                                    <th>Categoría</th>
                                    <th>Unidades Vendidas</th>
                                    <th>Ingresos</th>
                                    <th>% del Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${tableRows}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error cargando reporte de productos más vendidos:', error);
        container.innerHTML = `
            <div class="card">
                <div class="card-content">
                    <div style="text-align: center; padding: 2rem; color: var(--error-red);">
                        <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                        <h3>Error al cargar el reporte</h3>
                        <p>${error.message}</p>
                    </div>
                </div>
            </div>
        `;
    }
}

// Reporte de Análisis ABC
async function showAnalisisABCReport(container) {
    container.innerHTML = '<div class="loading"><div class="spinner"></div><p>Cargando análisis ABC...</p></div>';

    try {
        // Usar fechas por defecto (último mes)
        const fechaFin = new Date();
        const fechaInicio = new Date();
        fechaInicio.setMonth(fechaInicio.getMonth() - 1);

        const response = await api.getReporteProductosTopIngresos({
            limit: 100,
            fecha_inicio: fechaInicio.toISOString().split('T')[0],
            fecha_fin: fechaFin.toISOString().split('T')[0]
        });

        if (!response.success) {
            throw new Error(response.message || 'Error al cargar reporte');
        }

        const productos = response.data || [];

        // Calcular clasificación ABC
        const totalIngresos = productos.reduce((sum, p) => sum + (p.total_ingresos || 0), 0);
        let acumulado = 0;

        const productosClasificados = productos.map(producto => {
            acumulado += (producto.total_ingresos || 0);
            const porcentajeAcumulado = (acumulado / totalIngresos) * 100;

            let clase = 'C';
            if (porcentajeAcumulado <= 80) clase = 'A';
            else if (porcentajeAcumulado <= 95) clase = 'B';

            return { ...producto, clase, porcentajeAcumulado };
        });

        const claseA = productosClasificados.filter(p => p.clase === 'A');
        const claseB = productosClasificados.filter(p => p.clase === 'B');
        const claseC = productosClasificados.filter(p => p.clase === 'C');

        const topProductos = productosClasificados.slice(0, 20);
        const tableRows = topProductos.map(producto => {
            const badgeClass = producto.clase === 'A' ? 'badge-success' :
                              producto.clase === 'B' ? 'badge-warning' : 'badge-secondary';

            return `
                <tr>
                    <td>${producto.nombre || 'N/A'}</td>
                    <td>${producto.categoria || 'N/A'}</td>
                    <td><span class="badge ${badgeClass}">Clase ${producto.clase}</span></td>
                    <td>${producto.porcentaje_total ? producto.porcentaje_total.toFixed(1) + '%' : 'N/A'}</td>
                    <td>${Utils.formatCurrency(producto.total_ingresos || 0)}</td>
                </tr>
            `;
        }).join('');

        container.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">
                        <i class="fas fa-chart-pie" style="color: var(--primary-blue);"></i>
                        Análisis ABC de Productos
                    </h3>
                    <button class="btn btn-sm btn-primary" onclick="window.print()">
                        <i class="fas fa-print"></i> Imprimir
                    </button>
                </div>
                <div class="card-content">
                    <p style="color: var(--gray-600); margin-bottom: 1.5rem;">
                        Clasificación de productos según su importancia en ventas:
                        <br>
                        <strong>Clase A:</strong> 80% de las ventas (productos críticos)
                        <br>
                        <strong>Clase B:</strong> 15% de las ventas (productos importantes)
                        <br>
                        <strong>Clase C:</strong> 5% de las ventas (productos complementarios)
                    </p>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; margin-bottom: 2rem;">
                        <div style="background: var(--success-100); padding: 1.5rem; border-radius: 8px; text-align: center;">
                            <h2 style="color: var(--success-green); margin: 0;">Clase A</h2>
                            <p style="font-size: 2rem; font-weight: 600; margin: 0.5rem 0;">${claseA.length}</p>
                            <p style="color: var(--gray-600); margin: 0;">Productos</p>
                        </div>
                        <div style="background: var(--warning-100); padding: 1.5rem; border-radius: 8px; text-align: center;">
                            <h2 style="color: var(--warning-yellow); margin: 0;">Clase B</h2>
                            <p style="font-size: 2rem; font-weight: 600; margin: 0.5rem 0;">${claseB.length}</p>
                            <p style="color: var(--gray-600); margin: 0;">Productos</p>
                        </div>
                        <div style="background: var(--gray-100); padding: 1.5rem; border-radius: 8px; text-align: center;">
                            <h2 style="color: var(--gray-600); margin: 0;">Clase C</h2>
                            <p style="font-size: 2rem; font-weight: 600; margin: 0.5rem 0;">${claseC.length}</p>
                            <p style="color: var(--gray-600); margin: 0;">Productos</p>
                        </div>
                    </div>
                    <div class="table-responsive">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Producto</th>
                                    <th>Categoría</th>
                                    <th>Clasificación</th>
                                    <th>% Ventas</th>
                                    <th>Ingresos</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${tableRows}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error cargando análisis ABC:', error);
        container.innerHTML = `
            <div class="card">
                <div class="card-content">
                    <div style="text-align: center; padding: 2rem; color: var(--error-red);">
                        <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                        <h3>Error al cargar el reporte</h3>
                        <p>${error.message}</p>
                    </div>
                </div>
            </div>
        `;
    }
}

// Mostrar búsqueda de factura
function showFacturaSearch() {
    try {
        console.log('showFacturaSearch llamado');
        const reportContent = document.getElementById('reportContent');

        if (!reportContent) {
            console.error('Elemento reportContent no encontrado');
            return;
        }

        reportContent.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">
                    <i class="fas fa-search"></i>
                    Buscar Factura
                </h3>
            </div>
            <div class="card-content">
                <div style="max-width: 600px; margin: 0 auto;">
                    <div class="form-group">
                        <label class="form-label">Número de Factura</label>
                        <input type="text" class="form-input" id="facturaNumero" placeholder="Ej: A-00000001">
                    </div>

                    <button class="btn btn-primary" onclick="searchFactura()" style="width: 100%;">
                        <i class="fas fa-search"></i> Buscar Factura
                    </button>
                </div>

                <div id="facturaResult" style="margin-top: 2rem;"></div>
            </div>
        </div>
    `;
    } catch (error) {
        console.error('Error en showFacturaSearch:', error);
        Utils.showToast('Error al mostrar búsqueda de factura', 'error');
    }
}

// Buscar factura
async function searchFactura() {
    try {
        const numeroFactura = document.getElementById('facturaNumero').value.trim();

        if (!numeroFactura) {
            Utils.showToast('Ingrese el número de la factura', 'error');
            return;
        }

        const resultContainer = document.getElementById('facturaResult');
        if (!resultContainer) {
            console.error('Elemento facturaResult no encontrado');
            return;
        }

        resultContainer.innerHTML = '<div class="loading"><div class="spinner"></div><p>Buscando factura...</p></div>';

        const response = await api.getReporteFactura(numeroFactura);

        if (!response.success) {
            resultContainer.innerHTML = `
                <div style="background: var(--error-100); padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem; border-left: 4px solid var(--error-red);">
                    <i class="fas fa-exclamation-circle" style="color: var(--error-red); margin-right: 0.5rem;"></i>
                    <strong>Error:</strong> ${response.message || 'No se encontró la factura'}
                </div>
            `;
            return;
        }

        const factura = response.data;
        const detalles = factura.detalles || [];

        const productosHTML = detalles.map(detalle => `
            <tr>
                <td>${detalle.producto?.nombre || 'N/A'}</td>
                <td>${detalle.cantidad}</td>
                <td>${Utils.formatCurrency(detalle.precio_unitario)}</td>
                <td>${Utils.formatCurrency(detalle.subtotal)}</td>
            </tr>
        `).join('');

        resultContainer.innerHTML = `
            <div class="card" style="background: var(--gray-50);">
                <div class="card-header">
                    <h3 class="card-title">Factura ${factura.numero_factura}</h3>
                    <button class="btn btn-sm btn-primary" onclick="window.print()">
                        <i class="fas fa-print"></i> Imprimir
                    </button>
                </div>
                <div class="card-content">
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; margin-bottom: 1.5rem;">
                        <div>
                            <p style="color: var(--gray-600); margin: 0;">Cliente</p>
                            <p style="font-weight: 600; margin: 0.25rem 0 0 0;">${factura.cliente?.nombre_completo || 'N/A'}</p>
                            <p style="font-size: 0.875rem; color: var(--gray-600); margin: 0;">NIT: ${factura.cliente?.nit || 'CF'}</p>
                        </div>
                        <div>
                            <p style="color: var(--gray-600); margin: 0;">Fecha</p>
                            <p style="font-weight: 600; margin: 0.25rem 0 0 0;">${new Date(factura.fecha_emision).toLocaleDateString('es-GT')}</p>
                        </div>
                        <div>
                            <p style="color: var(--gray-600); margin: 0;">Cajero</p>
                            <p style="font-weight: 600; margin: 0.25rem 0 0 0;">${factura.usuario?.nombre_completo || 'N/A'}</p>
                        </div>
                        <div>
                            <p style="color: var(--gray-600); margin: 0;">Total</p>
                            <p style="font-weight: 600; font-size: 1.5rem; color: var(--success-green); margin: 0.25rem 0 0 0;">
                                ${Utils.formatCurrency(factura.total)}
                            </p>
                        </div>
                    </div>

                    <h4 style="margin: 1.5rem 0 1rem 0;">Productos</h4>
                    <div class="table-responsive">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Producto</th>
                                    <th>Cantidad</th>
                                    <th>Precio Unit.</th>
                                    <th>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${productosHTML}
                            </tbody>
                        </table>
                    </div>

                    <div style="text-align: right; margin-top: 1.5rem; padding-top: 1.5rem; border-top: 2px solid var(--gray-300);">
                        <p style="margin: 0.5rem 0;"><strong>Subtotal:</strong> ${Utils.formatCurrency(factura.subtotal)}</p>
                        <p style="margin: 0.5rem 0;"><strong>Descuento:</strong> ${Utils.formatCurrency(factura.descuento)}</p>
                        <p style="margin: 0.5rem 0; font-size: 1.25rem; color: var(--success-green);">
                            <strong>Total:</strong> ${Utils.formatCurrency(factura.total)}
                        </p>
                    </div>
                </div>
            </div>
        `;

        Utils.showToast('Factura encontrada', 'success');
    } catch (error) {
        console.error('Error en searchFactura:', error);
        const resultContainer = document.getElementById('facturaResult');
        if (resultContainer) {
            resultContainer.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: var(--error-red);">
                    <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                    <h3>Error al buscar la factura</h3>
                    <p>${error.message}</p>
                </div>
            `;
        }
        Utils.showToast('Error al buscar la factura', 'error');
    }
}

// Función helper para solicitar reposición
function solicitarReposicion(productoId) {
    Utils.showToast('Funcionalidad de solicitud de reposición en desarrollo', 'info');
}

// Hacer funciones disponibles globalmente
if (typeof window !== 'undefined') {
    window.showReport = showReport;
    window.showFacturaSearch = showFacturaSearch;
    window.searchFactura = searchFactura;
    window.solicitarReposicion = solicitarReposicion;

    // Debug: verificar que las funciones están disponibles
    console.log('Funciones de reportes cargadas:', {
        showReport: typeof window.showReport,
        showFacturaSearch: typeof window.showFacturaSearch,
        searchFactura: typeof window.searchFactura
    });
}

// Configurar event listeners para las tarjetas de reportes
function setupReportCardListeners() {
    // Event listeners para tarjetas con data-report-url (navegar a otra página)
    document.querySelectorAll('.report-card[data-report-url]').forEach(card => {
        card.addEventListener('click', function() {
            const url = this.dataset.reportUrl;
            if (url) {
                window.location.href = url;
            }
        });
    });

    // Event listeners para tarjetas con data-report-action (mostrar reporte en la página)
    document.querySelectorAll('.report-card[data-report-action]').forEach(card => {
        card.addEventListener('click', function() {
            const action = this.dataset.reportAction;
            if (action === 'factura-search') {
                showFacturaSearch();
            } else {
                showReport(action);
            }
        });
    });

    // Event listener para botón de logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            if (typeof logout === 'function') {
                logout();
            } else {
                window.location.href = '/frontend/pages/public/login.html';
            }
        });
    }
}

// Inicializar página
document.addEventListener('DOMContentLoaded', () => {
    loadUserData();
    setupReportCardListeners();
});
