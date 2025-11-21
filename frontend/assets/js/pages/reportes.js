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
function showStockMinimoReport(container) {
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
                <div style="background: var(--warning-100); padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem; border-left: 4px solid var(--warning-yellow);">
                    <i class="fas fa-info-circle" style="color: var(--warning-yellow); margin-right: 0.5rem;"></i>
                    <strong>Información:</strong> Esta funcionalidad requiere integración con el backend.
                    Actualmente mostrando datos de ejemplo.
                </div>
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
                            <tr>
                                <td>Pintura Latex Blanco 5 Gal</td>
                                <td>Pinturas</td>
                                <td style="color: var(--error-red); font-weight: 600;">2</td>
                                <td>10</td>
                                <td><span class="badge badge-danger">Crítico</span></td>
                                <td><button class="btn btn-sm btn-primary">Solicitar</button></td>
                            </tr>
                            <tr>
                                <td>Thinner Estándar 1 Gal</td>
                                <td>Solventes</td>
                                <td style="color: var(--warning-yellow); font-weight: 600;">8</td>
                                <td>15</td>
                                <td><span class="badge badge-warning">Bajo</span></td>
                                <td><button class="btn btn-sm btn-primary">Solicitar</button></td>
                            </tr>
                            <tr>
                                <td>Brocha 3 pulgadas</td>
                                <td>Herramientas</td>
                                <td style="color: var(--error-red); font-weight: 600;">0</td>
                                <td>20</td>
                                <td><span class="badge badge-danger">Agotado</span></td>
                                <td><button class="btn btn-sm btn-primary">Solicitar</button></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}

// Reporte de Productos Más Vendidos
function showMasVendidosReport(container) {
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
                    Top 10 productos con mayor volumen de ventas en el último mes.
                </p>
                <div style="background: var(--info-100); padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem; border-left: 4px solid var(--info-color);">
                    <i class="fas fa-info-circle" style="color: var(--info-color); margin-right: 0.5rem;"></i>
                    <strong>Información:</strong> Esta funcionalidad requiere integración con el backend.
                    Actualmente mostrando datos de ejemplo.
                </div>
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
                            <tr>
                                <td>1</td>
                                <td>Pintura Latex Blanco 5 Gal</td>
                                <td>Pinturas</td>
                                <td>156</td>
                                <td>Q 93,600.00</td>
                                <td>29.8%</td>
                            </tr>
                            <tr>
                                <td>2</td>
                                <td>Esmalte Sintético Rojo 1 Gal</td>
                                <td>Pinturas</td>
                                <td>98</td>
                                <td>Q 58,800.00</td>
                                <td>18.7%</td>
                            </tr>
                            <tr>
                                <td>3</td>
                                <td>Thinner Estándar 1 Gal</td>
                                <td>Solventes</td>
                                <td>78</td>
                                <td>Q 23,400.00</td>
                                <td>7.5%</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}

// Reporte de Análisis ABC
function showAnalisisABCReport(container) {
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
                <div style="background: var(--info-100); padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem; border-left: 4px solid var(--info-color);">
                    <i class="fas fa-info-circle" style="color: var(--info-color); margin-right: 0.5rem;"></i>
                    <strong>Información:</strong> Esta funcionalidad requiere integración con el backend.
                    Actualmente mostrando datos de ejemplo.
                </div>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; margin-bottom: 2rem;">
                    <div style="background: var(--success-100); padding: 1.5rem; border-radius: 8px; text-align: center;">
                        <h2 style="color: var(--success-green); margin: 0;">Clase A</h2>
                        <p style="font-size: 2rem; font-weight: 600; margin: 0.5rem 0;">25</p>
                        <p style="color: var(--gray-600); margin: 0;">Productos</p>
                    </div>
                    <div style="background: var(--warning-100); padding: 1.5rem; border-radius: 8px; text-align: center;">
                        <h2 style="color: var(--warning-yellow); margin: 0;">Clase B</h2>
                        <p style="font-size: 2rem; font-weight: 600; margin: 0.5rem 0;">45</p>
                        <p style="color: var(--gray-600); margin: 0;">Productos</p>
                    </div>
                    <div style="background: var(--gray-100); padding: 1.5rem; border-radius: 8px; text-align: center;">
                        <h2 style="color: var(--gray-600); margin: 0;">Clase C</h2>
                        <p style="font-size: 2rem; font-weight: 600; margin: 0.5rem 0;">130</p>
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
                            <tr>
                                <td>Pintura Latex Blanco 5 Gal</td>
                                <td>Pinturas</td>
                                <td><span class="badge badge-success">Clase A</span></td>
                                <td>29.8%</td>
                                <td>Q 93,600.00</td>
                            </tr>
                            <tr>
                                <td>Esmalte Sintético Rojo 1 Gal</td>
                                <td>Pinturas</td>
                                <td><span class="badge badge-success">Clase A</span></td>
                                <td>18.7%</td>
                                <td>Q 58,800.00</td>
                            </tr>
                            <tr>
                                <td>Thinner Estándar 1 Gal</td>
                                <td>Solventes</td>
                                <td><span class="badge badge-warning">Clase B</span></td>
                                <td>7.5%</td>
                                <td>Q 23,400.00</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
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
                        <div style="display: flex; gap: 1rem;">
                            <select class="form-input" id="facturaSerie" style="flex: 0 0 100px;">
                                <option value="A">Serie A</option>
                                <option value="B">Serie B</option>
                                <option value="C">Serie C</option>
                            </select>
                            <input type="number" class="form-input" id="facturaCorrelativo"
                                   placeholder="Correlativo" style="flex: 1;">
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Fecha (opcional)</label>
                        <input type="date" class="form-input" id="facturaFecha">
                    </div>

                    <div class="form-group">
                        <label class="form-label">Cliente NIT (opcional)</label>
                        <input type="text" class="form-input" id="facturaClienteNit" placeholder="NIT del cliente">
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
function searchFactura() {
    try {
        console.log('searchFactura llamado');
        const serie = document.getElementById('facturaSerie').value;
        const correlativo = document.getElementById('facturaCorrelativo').value;
        const fecha = document.getElementById('facturaFecha').value;
        const clienteNit = document.getElementById('facturaClienteNit').value;

        if (!correlativo) {
            Utils.showToast('Ingrese el correlativo de la factura', 'error');
            return;
        }

        const resultContainer = document.getElementById('facturaResult');

        if (!resultContainer) {
            console.error('Elemento facturaResult no encontrado');
            return;
        }

    // Simulación de búsqueda
    resultContainer.innerHTML = `
        <div style="background: var(--info-100); padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem; border-left: 4px solid var(--info-color);">
            <i class="fas fa-info-circle" style="color: var(--info-color); margin-right: 0.5rem;"></i>
            <strong>Información:</strong> Esta funcionalidad requiere integración con el backend.
            Actualmente mostrando datos de ejemplo para la factura ${serie}-${correlativo}.
        </div>

        <div class="card" style="background: var(--gray-50);">
            <div class="card-header">
                <h3 class="card-title">Factura ${serie}-${correlativo.padStart(8, '0')}</h3>
                <button class="btn btn-sm btn-primary" onclick="window.print()">
                    <i class="fas fa-print"></i> Imprimir
                </button>
            </div>
            <div class="card-content">
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; margin-bottom: 1.5rem;">
                    <div>
                        <p style="color: var(--gray-600); margin: 0;">Cliente</p>
                        <p style="font-weight: 600; margin: 0.25rem 0 0 0;">Juan Pérez González</p>
                        <p style="font-size: 0.875rem; color: var(--gray-600); margin: 0;">NIT: 12345678-9</p>
                    </div>
                    <div>
                        <p style="color: var(--gray-600); margin: 0;">Fecha</p>
                        <p style="font-weight: 600; margin: 0.25rem 0 0 0;">15/01/2025</p>
                    </div>
                    <div>
                        <p style="color: var(--gray-600); margin: 0;">Cajero</p>
                        <p style="font-weight: 600; margin: 0.25rem 0 0 0;">María López</p>
                    </div>
                    <div>
                        <p style="color: var(--gray-600); margin: 0;">Total</p>
                        <p style="font-weight: 600; font-size: 1.5rem; color: var(--success-green); margin: 0.25rem 0 0 0;">
                            Q 1,850.00
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
                            <tr>
                                <td>Pintura Latex Blanco 5 Gal</td>
                                <td>2</td>
                                <td>Q 600.00</td>
                                <td>Q 1,200.00</td>
                            </tr>
                            <tr>
                                <td>Thinner Estándar 1 Gal</td>
                                <td>3</td>
                                <td>Q 150.00</td>
                                <td>Q 450.00</td>
                            </tr>
                            <tr>
                                <td>Brocha 3 pulgadas</td>
                                <td>4</td>
                                <td>Q 50.00</td>
                                <td>Q 200.00</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div style="text-align: right; margin-top: 1.5rem; padding-top: 1.5rem; border-top: 2px solid var(--gray-300);">
                    <p style="margin: 0.5rem 0;"><strong>Subtotal:</strong> Q 1,650.00</p>
                    <p style="margin: 0.5rem 0;"><strong>IVA (12%):</strong> Q 200.00</p>
                    <p style="margin: 0.5rem 0; font-size: 1.25rem; color: var(--success-green);">
                        <strong>Total:</strong> Q 1,850.00
                    </p>
                </div>
            </div>
        </div>
    `;

        Utils.showToast('Factura encontrada (ejemplo)', 'success');
    } catch (error) {
        console.error('Error en searchFactura:', error);
        Utils.showToast('Error al buscar la factura', 'error');
    }
}

// Hacer funciones disponibles globalmente
if (typeof window !== 'undefined') {
    window.showReport = showReport;
    window.showFacturaSearch = showFacturaSearch;
    window.searchFactura = searchFactura;

    // Debug: verificar que las funciones están disponibles
    console.log('Funciones de reportes cargadas:', {
        showReport: typeof window.showReport,
        showFacturaSearch: typeof window.showFacturaSearch,
        searchFactura: typeof window.searchFactura
    });
}

// Inicializar página
document.addEventListener('DOMContentLoaded', () => {
    loadUserData();
});
