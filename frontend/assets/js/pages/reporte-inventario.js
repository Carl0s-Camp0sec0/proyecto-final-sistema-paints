/* ======================================================
   REPORTE DE INVENTARIO - Sistema Paints
   Reportes: 4) Inventario actual general
             6) Productos sin stock
             9) Productos bajo stock mínimo
            10) Inventario por tienda
   ====================================================== */

// Verificar autenticación
if (!auth.isAuthenticated()) {
    window.location.href = '/frontend/pages/public/login.html';
}

// Verificar permisos
if (!auth.hasPermission([CONFIG.ROLES.ADMIN, CONFIG.ROLES.GERENTE, CONFIG.ROLES.DIGITADOR])) {
    Utils.showToast('No tienes permisos para acceder a reportes de inventario', 'error');
    window.location.href = '/frontend/pages/admin/dashboard.html';
}

// Variables globales
let datosInventario = null;
let filtrosActuales = {};

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    inicializarReporte();
    cargarReporteCompleto();
});

/* ==================== INICIALIZACIÓN ==================== */

function inicializarReporte() {
    cargarDatosUsuario();
    cargarFiltros();
    configurarEventos();
}

function cargarDatosUsuario() {
    const userAvatar = document.querySelector('.user-avatar');
    const userName = document.querySelector('.user-info div:first-child');

    if (userAvatar) userAvatar.textContent = auth.getUserInitials();
    if (userName) userName.textContent = auth.user.nombre_completo;
}

async function cargarFiltros() {
    try {
        // Cargar sucursales
        const sucursalesResponse = await api.get('/sistema/sucursales');

        // Validar respuesta de sucursales
        if (sucursalesResponse && sucursalesResponse.success && sucursalesResponse.data && sucursalesResponse.data.sucursales) {
            const sucursales = sucursalesResponse.data.sucursales;

            // Validar que sea un array
            if (Array.isArray(sucursales)) {
                const sucursalSelects = document.querySelectorAll('select.form-select');
                if (sucursalSelects.length > 0) {
                    sucursalSelects[0].innerHTML = '<option value="">Todas las Sucursales</option>';
                    sucursales.forEach(suc => {
                        const option = document.createElement('option');
                        option.value = suc.id;
                        option.textContent = suc.nombre;
                        sucursalSelects[0].appendChild(option);
                    });
                }
            }
        } else {
            console.error('Error: Respuesta inválida al cargar sucursales');
        }

        // Cargar categorías
        const categoriasResponse = await api.get('/sistema/categorias');

        // Validar respuesta de categorías
        if (categoriasResponse && categoriasResponse.success && categoriasResponse.data && categoriasResponse.data.categorias) {
            const categorias = categoriasResponse.data.categorias;

            // Validar que sea un array
            if (Array.isArray(categorias)) {
                const sucursalSelects = document.querySelectorAll('select.form-select');
                if (sucursalSelects.length > 1) {
                    sucursalSelects[1].innerHTML = '<option value="">Todas las Categorías</option>';
                    categorias.forEach(cat => {
                        const option = document.createElement('option');
                        option.value = cat.id;
                        option.textContent = cat.nombre;
                        sucursalSelects[1].appendChild(option);
                    });
                }
            }
        } else {
            console.error('Error: Respuesta inválida al cargar categorías');
        }

    } catch (error) {
        console.error('Error al cargar filtros:', error);
    }
}

function configurarEventos() {
    // Botón aplicar filtros
    const btnAplicar = document.querySelector('.btn-primary');
    if (btnAplicar) {
        btnAplicar.addEventListener('click', aplicarFiltros);
    }

    // Botón exportar
    const btnExportar = document.querySelector('.btn-secondary');
    if (btnExportar) {
        btnExportar.addEventListener('click', exportarReporte);
    }
}

/* ==================== CARGAR DATOS ==================== */

async function cargarReporteCompleto() {
    try {
        mostrarLoading(true);

        // Cargar todos los reportes en paralelo
        await Promise.all([
            cargarInventarioGeneral(),
            cargarAlertasCriticas(),
            cargarInventarioDetallado()
        ]);

        Utils.showToast('Reporte cargado exitosamente', 'success');

    } catch (error) {
        console.error('Error al cargar reporte:', error);
        Utils.showToast('Error al cargar el reporte: ' + error.message, 'error');
    } finally {
        mostrarLoading(false);
    }
}

async function cargarInventarioGeneral(filtros = {}) {
    try {
        // Reporte 4: Inventario actual general
        const response = await api.get('/reportes/inventario/general', filtros);

        if (response.success) {
            const { estadisticas, productos } = response.data;
            datosInventario = productos;

            // Actualizar estadísticas
            actualizarEstadisticas(estadisticas);
        }
    } catch (error) {
        console.error('Error al cargar inventario general:', error);
    }
}

async function cargarAlertasCriticas(filtros = {}) {
    try {
        // Reportes 6 y 9: Productos sin stock y bajo stock mínimo
        const [sinStock, stockBajo] = await Promise.all([
            api.get('/reportes/inventario/sin-stock', filtros),
            api.get('/reportes/inventario/stock-bajo', filtros)
        ]);

        if (sinStock.success && stockBajo.success) {
            // Combinar alertas
            const alertas = [];

            // Primero productos agotados (prioridad alta)
            const agotados = stockBajo.data.productos.filter(p => p.estado === 'agotado');
            alertas.push(...agotados.slice(0, 5));

            // Luego productos con stock bajo
            const bajos = stockBajo.data.productos.filter(p => p.estado === 'bajo');
            alertas.push(...bajos.slice(0, Math.max(0, 5 - alertas.length)));

            mostrarAlertasCriticas(alertas);
        }
    } catch (error) {
        console.error('Error al cargar alertas críticas:', error);
    }
}

async function cargarInventarioDetallado(filtros = {}) {
    try {
        const response = await api.get('/reportes/inventario/general', filtros);

        if (response.success) {
            mostrarInventarioDetallado(response.data.productos);
        }
    } catch (error) {
        console.error('Error al cargar inventario detallado:', error);
    }
}

/* ==================== MOSTRAR DATOS ==================== */

function actualizarEstadisticas(estadisticas) {
    const cards = document.querySelectorAll('.card .card-content h2');

    if (cards.length >= 4) {
        cards[0].textContent = estadisticas.total_productos || 0;
        cards[1].textContent = Utils.formatCurrency(estadisticas.valor_total || 0);
        cards[2].textContent = estadisticas.stock_bajo || 0;
        cards[3].textContent = estadisticas.agotados || 0;
    }
}

function mostrarAlertasCriticas(alertas) {
    const tbody = document.querySelector('.card:nth-of-type(2) tbody');

    if (!alertas || alertas.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem; color: var(--success-green);">✅ No hay alertas críticas</td></tr>';
        return;
    }

    tbody.innerHTML = alertas.map(producto => {
        const esAgotado = producto.stock_actual === 0;
        const estadoBadge = esAgotado
            ? '<span class="status-badge status-inactivo">Agotado</span>'
            : '<span class="status-badge status-pendiente">Crítico</span>';

        const btnClass = esAgotado ? 'btn-primary' : 'btn-warning';
        const btnText = esAgotado ? '<i class="fas fa-plus"></i> Reabastecer' : '<i class="fas fa-exclamation-triangle"></i> Urgente';

        return `
            <tr>
                <td><strong>${producto.nombre}</strong></td>
                <td>${producto.sucursal || 'N/A'}</td>
                <td style="color: ${esAgotado ? 'var(--error-red)' : 'var(--warning-yellow)'}; font-weight: bold;">${producto.stock_actual}</td>
                <td>${producto.stock_minimo}</td>
                <td>${estadoBadge}</td>
                <td>
                    <button class="btn btn-sm ${btnClass}">
                        ${btnText}
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function mostrarInventarioDetallado(productos) {
    const tbody = document.querySelector('.card:last-child tbody');

    if (!productos || productos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 2rem; color: var(--gray-500);">No hay productos en inventario</td></tr>';
        return;
    }

    tbody.innerHTML = productos.map(producto => {
        const estado = determinarEstadoStock(producto.stock_actual, producto.stock_minimo);
        const estadoBadge = obtenerBadgeEstado(estado);

        return `
            <tr>
                <td>
                    <strong>${producto.nombre}</strong><br>
                    <small class="text-muted">${producto.marca || 'Sin marca'}</small>
                </td>
                <td>${producto.categoria}</td>
                <td><strong>${producto.stock_actual}</strong></td>
                <td>${producto.stock_minimo}</td>
                <td>${Utils.formatCurrency(producto.precio_unitario)}</td>
                <td><strong>${Utils.formatCurrency(producto.valor_inventario)}</strong></td>
                <td>${estadoBadge}</td>
                <td>
                    <button class="btn-action btn-view" title="Ver detalle">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

/* ==================== REPORTES ESPECÍFICOS ==================== */

async function cargarInventarioPorTienda() {
    try {
        mostrarLoading(true);

        // Reporte 10: Inventario por tienda
        const response = await api.get('/reportes/inventario/por-tienda', filtrosActuales);

        if (response.success) {
            mostrarInventarioPorTienda(response.data);
        }

    } catch (error) {
        console.error('Error al cargar inventario por tienda:', error);
        Utils.showToast('Error al cargar inventario por tienda', 'error');
    } finally {
        mostrarLoading(false);
    }
}

function mostrarInventarioPorTienda(datos) {
    // Crear modal o sección para mostrar inventario por tienda
    const { estadisticas_generales, sucursales } = datos;

    let html = `
        <div style="padding: 2rem; background: white; border-radius: 8px; margin: 2rem 0;">
            <h2>Inventario por Tienda</h2>

            <div style="margin: 2rem 0; padding: 1rem; background: var(--primary-50); border-radius: 8px;">
                <h3>Estadísticas Generales</h3>
                <p><strong>Total Sucursales:</strong> ${estadisticas_generales.total_sucursales}</p>
                <p><strong>Valor Total Sistema:</strong> ${Utils.formatCurrency(estadisticas_generales.valor_total_sistema)}</p>
                <p><strong>Stock Total Sistema:</strong> ${estadisticas_generales.stock_total_sistema} unidades</p>
            </div>
    `;

    sucursales.forEach(sucursal => {
        html += `
            <div style="margin: 2rem 0; border: 1px solid var(--gray-200); border-radius: 8px; overflow: hidden;">
                <div style="background: var(--gray-100); padding: 1rem;">
                    <h3>${sucursal.sucursal.nombre}</h3>
                    <p style="color: var(--gray-600);">${sucursal.sucursal.direccion}</p>
                </div>

                <div style="padding: 1rem; display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem;">
                    <div>
                        <p class="text-muted">Productos</p>
                        <h4>${sucursal.estadisticas.total_productos}</h4>
                    </div>
                    <div>
                        <p class="text-muted">Stock Total</p>
                        <h4>${sucursal.estadisticas.stock_total}</h4>
                    </div>
                    <div>
                        <p class="text-muted">Valor Total</p>
                        <h4>${Utils.formatCurrency(sucursal.estadisticas.valor_total)}</h4>
                    </div>
                </div>

                <table class="table" style="margin: 0;">
                    <thead>
                        <tr>
                            <th>Producto</th>
                            <th>Categoría</th>
                            <th>Stock</th>
                            <th>Valor</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${sucursal.productos.slice(0, 5).map(p => `
                            <tr>
                                <td><strong>${p.nombre}</strong><br><small>${p.marca || ''}</small></td>
                                <td>${p.categoria}</td>
                                <td>${p.stock_actual} ${p.unidad_medida}</td>
                                <td>${Utils.formatCurrency(p.valor_inventario)}</td>
                            </tr>
                        `).join('')}
                        ${sucursal.productos.length > 5 ? `
                            <tr>
                                <td colspan="4" style="text-align: center; color: var(--gray-500);">
                                    ... y ${sucursal.productos.length - 5} productos más
                                </td>
                            </tr>
                        ` : ''}
                    </tbody>
                </table>
            </div>
        `;
    });

    html += '</div>';

    // Mostrar en un modal o insertar en la página
    // Por ahora lo mostramos en la sección principal
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        mainContent.appendChild(tempDiv);
    }
}

/* ==================== FILTROS ==================== */

async function aplicarFiltros() {
    const selects = document.querySelectorAll('select.form-select');

    filtrosActuales = {};

    if (selects.length > 0 && selects[0].value) {
        filtrosActuales.sucursal_id = selects[0].value;
    }

    if (selects.length > 1 && selects[1].value) {
        filtrosActuales.categoria_id = selects[1].value;
    }

    // Recargar todos los reportes con filtros
    await cargarReporteCompleto();
}

/* ==================== EXPORTACIONES ==================== */

async function exportarReporte() {
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Header
        doc.setFillColor(37, 99, 235);
        doc.rect(0, 0, 210, 40, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont(undefined, 'bold');
        doc.text('PAINTS', 20, 20);

        doc.setFontSize(12);
        doc.setFont(undefined, 'normal');
        doc.text('Sistema de Gestión para Cadena de Pinturas', 20, 28);
        doc.text('Reporte de Inventario', 20, 35);

        doc.setTextColor(0, 0, 0);

        // Información del reporte
        doc.setFontSize(10);
        doc.text(`Generado: ${new Date().toLocaleDateString('es-GT')}`, 20, 50);
        doc.text(`Usuario: ${auth.user.nombre_completo}`, 20, 55);

        // Estadísticas
        let y = 70;
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('ESTADÍSTICAS DE INVENTARIO', 20, y);
        y += 10;

        const cards = document.querySelectorAll('.card .card-content');
        const estadisticas = [];

        cards.forEach((card, index) => {
            const label = card.querySelector('.text-muted')?.textContent || '';
            const value = card.querySelector('h2')?.textContent || '';
            if (label && value) {
                estadisticas.push([label, value]);
            }
        });

        doc.autoTable({
            startY: y,
            head: [['Métrica', 'Valor']],
            body: estadisticas,
            styles: { fontSize: 10 },
            headStyles: { fillColor: [37, 99, 235] },
            margin: { left: 20, right: 20 }
        });

        // Alertas Críticas
        y = doc.lastAutoTable.finalY + 15;
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('ALERTAS CRÍTICAS DE STOCK', 20, y);
        y += 5;

        const tbodyAlertas = document.querySelector('.card:nth-of-type(2) tbody');
        const rowsAlertas = tbodyAlertas.querySelectorAll('tr');
        const tableDataAlertas = [];

        rowsAlertas.forEach(row => {
            const cells = row.querySelectorAll('td');
            if (cells.length > 0 && !row.textContent.includes('No hay alertas')) {
                tableDataAlertas.push([
                    cells[0].textContent.trim(),
                    cells[1].textContent.trim(),
                    cells[2].textContent.trim(),
                    cells[3].textContent.trim()
                ]);
            }
        });

        if (tableDataAlertas.length > 0) {
            doc.autoTable({
                startY: y,
                head: [['Producto', 'Sucursal', 'Stock Actual', 'Stock Mínimo']],
                body: tableDataAlertas,
                styles: { fontSize: 9 },
                headStyles: { fillColor: [220, 38, 38] },
                margin: { left: 20, right: 20 }
            });
        } else {
            doc.setFontSize(10);
            doc.setFont(undefined, 'normal');
            doc.text('✅ No hay alertas críticas', 20, y + 10);
        }

        // Nueva página para inventario detallado
        doc.addPage();

        y = 20;
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('INVENTARIO DETALLADO', 20, y);
        y += 5;

        const tbodyInventario = document.querySelector('.card:last-child tbody');
        const rowsInventario = tbodyInventario.querySelectorAll('tr');
        const tableDataInventario = [];

        rowsInventario.forEach(row => {
            const cells = row.querySelectorAll('td');
            if (cells.length >= 6) {
                tableDataInventario.push([
                    cells[0].querySelector('strong')?.textContent.trim() || '',
                    cells[1].textContent.trim(),
                    cells[2].textContent.trim(),
                    cells[4].textContent.trim(),
                    cells[5].textContent.trim()
                ]);
            }
        });

        doc.autoTable({
            startY: y,
            head: [['Producto', 'Categoría', 'Stock', 'P. Unit.', 'Valor']],
            body: tableDataInventario.slice(0, 20), // Máximo 20 productos
            styles: { fontSize: 8 },
            headStyles: { fillColor: [37, 99, 235] },
            margin: { left: 20, right: 20 }
        });

        // Footer
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(128, 128, 128);
            doc.text(
                `Página ${i} de ${pageCount}`,
                doc.internal.pageSize.width / 2,
                doc.internal.pageSize.height - 10,
                { align: 'center' }
            );
            doc.text(
                'Sistema Paints - Reporte Confidencial',
                20,
                doc.internal.pageSize.height - 10
            );
        }

        doc.save(`reporte_inventario_${new Date().getTime()}.pdf`);
        Utils.showToast('Reporte exportado exitosamente', 'success');

    } catch (error) {
        console.error('Error al exportar PDF:', error);
        Utils.showToast('Error al exportar el reporte', 'error');
    }
}

/* ==================== UTILIDADES ==================== */

function determinarEstadoStock(stockActual, stockMinimo) {
    if (stockActual === 0) return 'agotado';
    if (stockActual <= stockMinimo) return 'bajo';
    return 'normal';
}

function obtenerBadgeEstado(estado) {
    const badges = {
        'normal': '<span class="status-badge status-activo">Normal</span>',
        'bajo': '<span class="status-badge status-pendiente">Bajo</span>',
        'agotado': '<span class="status-badge status-inactivo">Agotado</span>'
    };
    return badges[estado] || badges['normal'];
}

function mostrarLoading(mostrar) {
    const btn = document.querySelector('.btn-primary');
    if (btn) {
        btn.disabled = mostrar;
        btn.innerHTML = mostrar
            ? '<i class="fas fa-spinner fa-spin"></i> Cargando...'
            : '<i class="fas fa-filter"></i> Aplicar Filtros';
    }
}

function logout() {
    auth.logout();
}

// Exportar funciones globalmente
window.aplicarFiltros = aplicarFiltros;
window.exportarReporte = exportarReporte;
window.cargarInventarioPorTienda = cargarInventarioPorTienda;
window.logout = logout;
