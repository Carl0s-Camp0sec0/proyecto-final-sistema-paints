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
let datosInventarioCompleto = null; // Para mantener todos los datos sin filtrar
let filtrosActuales = {};

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    inicializarReporte();
    configurarEventos();
});

/* ==================== INICIALIZACIÓN ==================== */

function inicializarReporte() {
    cargarDatosUsuario();
    cargarFiltros();

    // Cargar reporte automáticamente después de un breve delay
    setTimeout(() => {
        generarReporte();
    }, 500);
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

        if (sucursalesResponse && sucursalesResponse.success && sucursalesResponse.data && sucursalesResponse.data.sucursales) {
            const sucursales = sucursalesResponse.data.sucursales;

            if (Array.isArray(sucursales)) {
                const selectSucursal = document.getElementById('selectSucursal');
                if (selectSucursal) {
                    selectSucursal.innerHTML = '<option value="">Todas las Sucursales</option>';
                    sucursales.forEach(suc => {
                        const option = document.createElement('option');
                        option.value = suc.id;
                        option.textContent = suc.nombre;
                        selectSucursal.appendChild(option);
                    });
                }
            }
        }

        // Cargar categorías
        const categoriasResponse = await api.get('/sistema/categorias');

        if (categoriasResponse && categoriasResponse.success && categoriasResponse.data && categoriasResponse.data.categorias) {
            const categorias = categoriasResponse.data.categorias;

            if (Array.isArray(categorias)) {
                const selectCategoria = document.getElementById('selectCategoria');
                if (selectCategoria) {
                    selectCategoria.innerHTML = '<option value="">Todas las Categorías</option>';
                    categorias.forEach(cat => {
                        const option = document.createElement('option');
                        option.value = cat.id;
                        option.textContent = cat.nombre;
                        selectCategoria.appendChild(option);
                    });
                }
            }
        }

    } catch (error) {
        console.error('Error al cargar filtros:', error);
    }
}

function configurarEventos() {
    // Botón aplicar filtros
    const btnAplicar = document.getElementById('btnAplicarFiltros');
    if (btnAplicar) {
        btnAplicar.addEventListener('click', generarReporte);
    }

    // Botón exportar
    const btnExportar = document.getElementById('btnExportarPDF');
    if (btnExportar) {
        btnExportar.addEventListener('click', exportarReporte);
    }

    // Botón limpiar filtros
    const btnLimpiar = document.getElementById('btnLimpiarFiltros');
    if (btnLimpiar) {
        btnLimpiar.addEventListener('click', limpiarFiltros);
    }

    // Campo de búsqueda - búsqueda en tiempo real
    const inputBuscar = document.getElementById('inputBuscar');
    if (inputBuscar) {
        inputBuscar.addEventListener('input', aplicarBusquedaLocal);
    }

    // Evento del botón logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            logout();
        });
    }
}

/* ==================== GENERAR REPORTE ==================== */

async function generarReporte() {
    try {
        // Mostrar loading
        mostrarLoading(true);

        // Obtener filtros
        filtrosActuales = obtenerFiltros();

        // Cargar todos los reportes en paralelo
        await Promise.all([
            cargarInventarioGeneral(),
            cargarAlertasCriticas()
        ]);

        Utils.showToast('Reporte generado exitosamente', 'success');

    } catch (error) {
        console.error('Error al generar reporte:', error);

        let errorMessage = 'Error al generar el reporte';
        if (error.message) {
            errorMessage += ': ' + error.message;
        }

        Utils.showToast(errorMessage, 'error');

        // Mostrar estado vacío
        mostrarEstadisticas({
            total_productos: 0,
            valor_total: 0,
            stock_bajo: 0,
            agotados: 0
        });

    } finally {
        mostrarLoading(false);
    }
}

function obtenerFiltros() {
    const filtros = {};

    // Filtro de sucursal
    const sucursalId = document.getElementById('selectSucursal')?.value;
    if (sucursalId && sucursalId !== '') {
        filtros.sucursal_id = sucursalId;
    }

    // Filtro de categoría
    const categoriaId = document.getElementById('selectCategoria')?.value;
    if (categoriaId && categoriaId !== '') {
        filtros.categoria_id = categoriaId;
    }

    // Filtro de estado de stock
    const estadoStock = document.getElementById('selectEstadoStock')?.value;
    if (estadoStock && estadoStock !== '') {
        filtros.estado_stock = estadoStock;
    }

    return filtros;
}

/* ==================== CARGAR DATOS ==================== */

async function cargarInventarioGeneral() {
    try {
        // Reporte 4: Inventario actual general
        const response = await api.get('/reportes/inventario/general', filtrosActuales);

        if (!response.success) {
            throw new Error(response.message || 'Error al cargar inventario');
        }

        const { estadisticas, productos } = response.data;

        // Guardar datos completos
        datosInventarioCompleto = productos || [];
        datosInventario = [...datosInventarioCompleto];

        // Actualizar estadísticas
        actualizarEstadisticas(estadisticas);

        // Mostrar inventario detallado
        mostrarInventarioDetallado(datosInventario);

    } catch (error) {
        console.error('Error al cargar inventario general:', error);
        throw error;
    }
}

async function cargarAlertasCriticas() {
    try {
        // Reportes 6 y 9: Productos sin stock y bajo stock mínimo
        const [sinStock, stockBajo] = await Promise.all([
            api.get('/reportes/inventario/sin-stock', filtrosActuales),
            api.get('/reportes/inventario/stock-bajo', filtrosActuales)
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
        // No lanzar error para no interrumpir la carga del reporte principal
    }
}

/* ==================== MOSTRAR DATOS ==================== */

function actualizarEstadisticas(estadisticas) {
    document.getElementById('estadisticaTotalProductos').textContent = estadisticas.total_productos || 0;
    document.getElementById('estadisticaValorTotal').textContent = Utils.formatCurrency(estadisticas.valor_total || 0);
    document.getElementById('estadisticaStockBajo').textContent = estadisticas.stock_bajo || 0;
    document.getElementById('estadisticaAgotados').textContent = estadisticas.agotados || 0;

    // Mostrar mensaje si no hay productos
    if (!estadisticas.total_productos || estadisticas.total_productos === 0) {
        Utils.showToast('No hay productos en inventario con los filtros seleccionados', 'info');
    }
}

function mostrarAlertasCriticas(alertas) {
    const tbody = document.getElementById('tablaAlertasCriticas');

    if (!alertas || alertas.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem; color: var(--success-green);">✅ No hay alertas críticas</td></tr>';
        return;
    }

    tbody.innerHTML = alertas.map(producto => {
        const esAgotado = producto.stock_actual === 0;
        const estadoBadge = esAgotado
            ? '<span class="status-badge status-inactivo">Agotado</span>'
            : '<span class="status-badge status-pendiente">Crítico</span>';

        const prioridadBadge = esAgotado
            ? '<span class="status-badge status-inactivo"><i class="fas fa-exclamation-circle"></i> Alta</span>'
            : '<span class="status-badge status-pendiente"><i class="fas fa-exclamation-triangle"></i> Media</span>';

        return `
            <tr>
                <td><strong>${producto.nombre}</strong></td>
                <td>${producto.sucursal || 'N/A'}</td>
                <td style="color: ${esAgotado ? 'var(--error-red)' : 'var(--warning-yellow)'}; font-weight: bold;">${producto.stock_actual}</td>
                <td>${producto.stock_minimo}</td>
                <td>${estadoBadge}</td>
                <td>${prioridadBadge}</td>
            </tr>
        `;
    }).join('');
}

function mostrarInventarioDetallado(productos) {
    const tbody = document.getElementById('tablaInventarioDetallado');

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
                <td>${producto.sucursal || 'N/A'}</td>
                <td><strong>${producto.stock_actual}</strong></td>
                <td>${producto.stock_minimo}</td>
                <td>${Utils.formatCurrency(producto.precio_unitario)}</td>
                <td><strong>${Utils.formatCurrency(producto.valor_inventario)}</strong></td>
                <td>${estadoBadge}</td>
            </tr>
        `;
    }).join('');
}

/* ==================== FILTROS Y BÚSQUEDA ==================== */

function aplicarBusquedaLocal() {
    const termino = document.getElementById('inputBuscar')?.value?.toLowerCase() || '';

    if (!datosInventarioCompleto) {
        return;
    }

    if (termino === '') {
        // Si no hay búsqueda, mostrar todos los datos
        datosInventario = [...datosInventarioCompleto];
    } else {
        // Filtrar por término de búsqueda
        datosInventario = datosInventarioCompleto.filter(producto => {
            const nombre = (producto.nombre || '').toLowerCase();
            const marca = (producto.marca || '').toLowerCase();
            const categoria = (producto.categoria || '').toLowerCase();

            return nombre.includes(termino) ||
                   marca.includes(termino) ||
                   categoria.includes(termino);
        });
    }

    // Actualizar tabla
    mostrarInventarioDetallado(datosInventario);
}

function limpiarFiltros() {
    // Limpiar selectores
    document.getElementById('selectSucursal').value = '';
    document.getElementById('selectCategoria').value = '';
    document.getElementById('selectEstadoStock').value = '';
    document.getElementById('inputBuscar').value = '';

    // Limpiar datos
    datosInventario = null;
    datosInventarioCompleto = null;
    filtrosActuales = {};

    // Limpiar estadísticas
    document.getElementById('estadisticaTotalProductos').textContent = '0';
    document.getElementById('estadisticaValorTotal').textContent = 'Q 0.00';
    document.getElementById('estadisticaStockBajo').textContent = '0';
    document.getElementById('estadisticaAgotados').textContent = '0';

    // Limpiar tablas
    document.getElementById('tablaAlertasCriticas').innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem; color: var(--gray-500);">Genera un reporte para ver las alertas</td></tr>';
    document.getElementById('tablaInventarioDetallado').innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 2rem; color: var(--gray-500);">Genera un reporte para ver el inventario</td></tr>';

    Utils.showToast('Filtros limpiados', 'info');
}

/* ==================== EXPORTACIONES ==================== */

async function exportarReporte() {
    if (!datosInventario) {
        Utils.showToast('Primero debes generar el reporte', 'warning');
        return;
    }

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
        doc.text(`Generado: ${new Date().toLocaleDateString('es-GT', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })}`, 20, 50);
        doc.text(`Usuario: ${auth.user.nombre_completo}`, 20, 55);

        // Filtros aplicados
        let y = 60;
        if (Object.keys(filtrosActuales).length > 0) {
            doc.text('Filtros aplicados:', 20, y);
            y += 5;

            if (filtrosActuales.sucursal_id) {
                const sucursal = document.getElementById('selectSucursal');
                const sucursalNombre = sucursal.options[sucursal.selectedIndex]?.text;
                doc.text(`  - Sucursal: ${sucursalNombre}`, 25, y);
                y += 5;
            }

            if (filtrosActuales.categoria_id) {
                const categoria = document.getElementById('selectCategoria');
                const categoriaNombre = categoria.options[categoria.selectedIndex]?.text;
                doc.text(`  - Categoría: ${categoriaNombre}`, 25, y);
                y += 5;
            }

            if (filtrosActuales.estado_stock) {
                doc.text(`  - Estado: ${filtrosActuales.estado_stock}`, 25, y);
                y += 5;
            }
        }

        // Estadísticas
        y += 10;
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('ESTADÍSTICAS DE INVENTARIO', 20, y);
        y += 5;

        const estadisticas = [
            ['Total Productos', document.getElementById('estadisticaTotalProductos').textContent],
            ['Valor Total', document.getElementById('estadisticaValorTotal').textContent],
            ['Stock Bajo', document.getElementById('estadisticaStockBajo').textContent],
            ['Agotados', document.getElementById('estadisticaAgotados').textContent]
        ];

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

        const tbodyAlertas = document.getElementById('tablaAlertasCriticas');
        const rowsAlertas = tbodyAlertas.querySelectorAll('tr');
        const tableDataAlertas = [];

        rowsAlertas.forEach(row => {
            const cells = row.querySelectorAll('td');
            if (cells.length >= 5 && !row.textContent.includes('No hay alertas')) {
                tableDataAlertas.push([
                    cells[0].textContent.trim(),
                    cells[1].textContent.trim(),
                    cells[2].textContent.trim(),
                    cells[3].textContent.trim(),
                    cells[4].textContent.trim()
                ]);
            }
        });

        if (tableDataAlertas.length > 0) {
            doc.autoTable({
                startY: y,
                head: [['Producto', 'Sucursal', 'Stock Actual', 'Stock Mínimo', 'Estado']],
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

        const tbodyInventario = document.getElementById('tablaInventarioDetallado');
        const rowsInventario = tbodyInventario.querySelectorAll('tr');
        const tableDataInventario = [];

        rowsInventario.forEach(row => {
            const cells = row.querySelectorAll('td');
            if (cells.length >= 7) {
                const producto = cells[0].querySelector('strong')?.textContent.trim() || '';
                const marca = cells[0].querySelector('small')?.textContent.trim() || '';

                tableDataInventario.push([
                    `${producto}\n${marca}`,
                    cells[1].textContent.trim(),
                    cells[2].textContent.trim(),
                    cells[3].textContent.trim(),
                    cells[5].textContent.trim(),
                    cells[6].textContent.trim()
                ]);
            }
        });

        doc.autoTable({
            startY: y,
            head: [['Producto', 'Categoría', 'Sucursal', 'Stock', 'P. Unit.', 'Valor']],
            body: tableDataInventario.slice(0, 30), // Máximo 30 productos por página
            styles: { fontSize: 8, cellPadding: 2 },
            headStyles: { fillColor: [37, 99, 235] },
            margin: { left: 20, right: 20 }
        });

        // Si hay más productos, agregarlos en páginas adicionales
        if (tableDataInventario.length > 30) {
            for (let i = 30; i < tableDataInventario.length; i += 35) {
                doc.addPage();
                doc.autoTable({
                    startY: 20,
                    head: [['Producto', 'Categoría', 'Sucursal', 'Stock', 'P. Unit.', 'Valor']],
                    body: tableDataInventario.slice(i, i + 35),
                    styles: { fontSize: 8, cellPadding: 2 },
                    headStyles: { fillColor: [37, 99, 235] },
                    margin: { left: 20, right: 20 }
                });
            }
        }

        // Footer en todas las páginas
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
        Utils.showToast('Error al exportar el reporte: ' + error.message, 'error');
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
    const btn = document.getElementById('btnAplicarFiltros');
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
window.generarReporte = generarReporte;
window.exportarReporte = exportarReporte;
window.limpiarFiltros = limpiarFiltros;
window.logout = logout;
