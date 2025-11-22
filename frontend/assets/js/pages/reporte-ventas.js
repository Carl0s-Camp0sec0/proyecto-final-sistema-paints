/* ======================================================
   REPORTE DE VENTAS - Sistema Paints
   Reportes: 1) Ventas por período y medios de pago
             2) Productos que más dinero generan
   ====================================================== */

// Verificar autenticación
if (!auth.isAuthenticated()) {
    window.location.href = '/frontend/pages/public/login.html';
}

// Verificar permisos (solo Gerente y Admin)
if (!auth.hasPermission([CONFIG.ROLES.ADMIN, CONFIG.ROLES.GERENTE])) {
    Utils.showToast('No tienes permisos para acceder a reportes', 'error');
    window.location.href = '/frontend/pages/admin/dashboard.html';
}

// Variables globales
let datosReporte = null;

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    inicializarReporte();
    configurarEventos();
    configurarFechasPorDefecto();
});

/* ==================== INICIALIZACIÓN ==================== */

function inicializarReporte() {
    cargarDatosUsuario();
    cargarSucursales();
    cargarUsuarios();
}

function cargarDatosUsuario() {
    document.getElementById('userAvatar').textContent = auth.getUserInitials();
    document.getElementById('userName').textContent = auth.user.nombre_completo;
    document.getElementById('userRole').textContent = auth.user.rol;
}

async function cargarSucursales() {
    try {
        const response = await api.get('/sistema/sucursales');

        // Validar respuesta
        if (!response || !response.success || !response.data || !response.data.sucursales) {
            console.error('Error: Respuesta inválida del servidor');
            return;
        }

        const sucursales = response.data.sucursales;

        // Validar que sucursales sea un array
        if (!Array.isArray(sucursales)) {
            console.error('Error: Sucursales no es un array');
            return;
        }

        const select = document.getElementById('sucursalSelect');
        select.innerHTML = '<option value="">Todas las Sucursales</option>';

        sucursales.forEach(sucursal => {
            const option = document.createElement('option');
            option.value = sucursal.id;
            option.textContent = sucursal.nombre;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error al cargar sucursales:', error);
    }
}

async function cargarUsuarios() {
    try {
        // Nota: Necesitarías un endpoint para obtener usuarios
        // Por ahora dejamos las opciones hardcoded del HTML
    } catch (error) {
        console.error('Error al cargar usuarios:', error);
    }
}

function configurarEventos() {
    // Evento del selector de período
    document.getElementById('periodoSelect').addEventListener('change', configurarFechas);

    // Evento del botón generar reporte
    const generarBtn = document.getElementById('generarReporteBtn');
    if (generarBtn) {
        generarBtn.addEventListener('click', generarReporte);
    }

    // Evento del botón limpiar filtros
    const limpiarBtn = document.getElementById('limpiarFiltrosBtn');
    if (limpiarBtn) {
        limpiarBtn.addEventListener('click', limpiarFiltros);
    }

    // Evento del botón exportar
    const exportarBtn = document.getElementById('exportarBtn');
    if (exportarBtn) {
        exportarBtn.addEventListener('click', exportarReporte);
    }

    // Evento del botón imprimir
    const imprimirBtn = document.getElementById('imprimirBtn');
    if (imprimirBtn) {
        imprimirBtn.addEventListener('click', imprimirReporte);
    }

    // Evento del botón logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            if (typeof logout === 'function') {
                logout();
            } else if (typeof auth !== 'undefined' && typeof auth.logout === 'function') {
                auth.logout();
            }
        });
    }
}

function configurarFechasPorDefecto() {
    // Configurar período "Este Mes" por defecto
    const hoy = new Date();
    const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

    document.getElementById('fechaInicio').valueAsDate = primerDia;
    document.getElementById('fechaFinal').valueAsDate = hoy;

    // Generar reporte automáticamente al cargar la página
    setTimeout(() => {
        generarReporte();
    }, 500);
}

function configurarFechas() {
    const periodo = document.getElementById('periodoSelect').value;
    const hoy = new Date();
    let fechaInicio, fechaFinal;

    switch(periodo) {
        case 'today':
            fechaInicio = fechaFinal = hoy;
            break;

        case 'week':
            fechaInicio = new Date(hoy);
            fechaInicio.setDate(hoy.getDate() - 7);
            fechaFinal = hoy;
            break;

        case 'month':
            fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
            fechaFinal = hoy;
            break;

        case 'quarter':
            const quarter = Math.floor(hoy.getMonth() / 3);
            fechaInicio = new Date(hoy.getFullYear(), quarter * 3, 1);
            fechaFinal = hoy;
            break;

        case 'year':
            fechaInicio = new Date(hoy.getFullYear(), 0, 1);
            fechaFinal = hoy;
            break;

        case 'custom':
            // No hacer nada, el usuario seleccionará manualmente
            return;

        default:
            return;
    }

    document.getElementById('fechaInicio').valueAsDate = fechaInicio;
    document.getElementById('fechaFinal').valueAsDate = fechaFinal;
}

/* ==================== GENERAR REPORTE ==================== */

async function generarReporte() {
    // Obtener filtros
    const filtros = obtenerFiltros();

    // Validar
    if (!validarFiltros(filtros)) {
        return;
    }

    try {
        // Mostrar loading
        mostrarLoading(true);

        // Llamar al endpoint de ventas por período
        const response = await api.get('/reportes/ventas/periodo', filtros);

        if (!response.success) {
            throw new Error(response.message || 'Error al generar reporte');
        }

        // Guardar datos
        datosReporte = response.data;

        // Mostrar datos
        mostrarEstadisticas(datosReporte.resumen);
        await cargarTopProductos(filtros);
        mostrarTablaVentasSucursal(datosReporte.ventas_por_sucursal);

        Utils.showToast('Reporte generado exitosamente', 'success');

    } catch (error) {
        console.error('Error al generar reporte:', error);

        // Mostrar mensaje de error más descriptivo
        let errorMessage = 'Error al generar el reporte';
        if (error.message) {
            errorMessage += ': ' + error.message;
        }
        if (error.response && error.response.data && error.response.data.message) {
            errorMessage = error.response.data.message;
        }

        Utils.showToast(errorMessage, 'error');

        // Mostrar estado vacío en caso de error
        mostrarEstadisticas({
            total_general: 0,
            numero_facturas: 0,
            venta_promedio: 0,
            facturas_anuladas: 0
        });
    } finally {
        mostrarLoading(false);
    }
}

function obtenerFiltros() {
    const filtros = {
        fecha_inicio: document.getElementById('fechaInicio').value,
        fecha_fin: document.getElementById('fechaFinal').value
    };

    // Solo agregar filtros opcionales si tienen valor
    const sucursalId = document.getElementById('sucursalSelect').value;
    if (sucursalId && sucursalId !== '') {
        filtros.sucursal_id = sucursalId;
    }

    const metodoPago = document.getElementById('metodoPagoSelect').value;
    if (metodoPago && metodoPago !== '') {
        filtros.metodo_pago = metodoPago;
    }

    const usuarioId = document.getElementById('usuarioSelect').value;
    if (usuarioId && usuarioId !== '') {
        filtros.usuario_id = usuarioId;
    }

    return filtros;
}

function validarFiltros(filtros) {
    if (!filtros.fecha_inicio || !filtros.fecha_fin) {
        Utils.showToast('Debes seleccionar las fechas de inicio y fin', 'warning');
        return false;
    }

    if (new Date(filtros.fecha_inicio) > new Date(filtros.fecha_fin)) {
        Utils.showToast('La fecha de inicio no puede ser mayor a la fecha final', 'warning');
        return false;
    }

    return true;
}

async function cargarTopProductos(filtros) {
    try {
        const response = await api.get('/reportes/productos/top-ingresos', {
            ...filtros,
            limit: 10
        });

        if (response.success) {
            mostrarTablaTopProductos(response.data.productos);
        }
    } catch (error) {
        console.error('Error al cargar top productos:', error);
    }
}

/* ==================== MOSTRAR DATOS ==================== */

function mostrarEstadisticas(resumen) {
    document.getElementById('totalFacturado').textContent = Utils.formatCurrency(resumen.total_general || 0);
    document.getElementById('numeroFacturas').textContent = resumen.numero_facturas || 0;
    document.getElementById('ventaPromedio').textContent = Utils.formatCurrency(resumen.venta_promedio || 0);
    document.getElementById('facturasAnuladas').textContent = resumen.facturas_anuladas || 0;

    // Mostrar mensaje si no hay ventas
    if (!resumen.numero_facturas || resumen.numero_facturas === 0) {
        Utils.showToast('No hay ventas en el período seleccionado', 'info');
    }
}

function mostrarTablaTopProductos(productos) {
    const tbody = document.getElementById('topProductosVendidos');

    if (!productos || productos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem; color: var(--gray-500);">No hay datos para mostrar</td></tr>';
        return;
    }

    tbody.innerHTML = productos.map((producto, index) => `
        <tr>
            <td>${index + 1}</td>
            <td>
                <strong>${producto.nombre}</strong><br>
                <small class="text-muted">${producto.marca || 'Sin marca'}</small>
            </td>
            <td>${producto.categoria}</td>
            <td>${producto.cantidad_vendida} ${producto.unidad_medida}</td>
            <td><strong>${Utils.formatCurrency(producto.total_vendido)}</strong></td>
            <td>${producto.porcentaje.toFixed(1)}%</td>
        </tr>
    `).join('');
}

function mostrarTablaVentasSucursal(ventasSucursal) {
    const tbody = document.getElementById('ventasPorSucursal');

    if (!ventasSucursal || ventasSucursal.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem; color: var(--gray-500);">No hay datos para mostrar</td></tr>';
        return;
    }

    // Calcular total general para porcentajes
    const totalGeneral = ventasSucursal.reduce((sum, v) => sum + parseFloat(v.total_vendido || 0), 0);

    tbody.innerHTML = ventasSucursal.map(venta => {
        const total = parseFloat(venta.total_vendido || 0);
        const porcentaje = totalGeneral > 0 ? (total / totalGeneral * 100) : 0;
        const promedio = parseFloat(venta.venta_promedio || 0);

        return `
            <tr>
                <td>
                    <strong>${venta['sucursal.nombre'] || 'Sucursal'}</strong><br>
                    <small class="text-muted">Regional</small>
                </td>
                <td>${venta.cantidad_facturas || 0}</td>
                <td><strong>${Utils.formatCurrency(total)}</strong></td>
                <td>${Utils.formatCurrency(promedio)}</td>
                <td>${porcentaje.toFixed(1)}%</td>
                <td><span style="color: var(--success-green);"><i class="fas fa-arrow-up"></i> +12%</span></td>
            </tr>
        `;
    }).join('');
}

/* ==================== EXPORTACIONES ==================== */

async function exportarReporte() {
    if (!datosReporte) {
        Utils.showToast('Primero debes generar el reporte', 'warning');
        return;
    }

    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Header con logo
        doc.setFillColor(37, 99, 235);
        doc.rect(0, 0, 210, 40, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont(undefined, 'bold');
        doc.text('PAINTS', 20, 20);

        doc.setFontSize(12);
        doc.setFont(undefined, 'normal');
        doc.text('Sistema de Gestión para Cadena de Pinturas', 20, 28);
        doc.text('Reporte de Ventas', 20, 35);

        // Reset color de texto
        doc.setTextColor(0, 0, 0);

        // Información del reporte
        doc.setFontSize(10);
        const filtros = obtenerFiltros();
        doc.text(`Período: ${filtros.fecha_inicio} al ${filtros.fecha_fin}`, 20, 50);
        doc.text(`Generado: ${new Date().toLocaleDateString('es-GT')}`, 20, 55);
        doc.text(`Usuario: ${auth.user.nombre_completo}`, 20, 60);

        // Resumen de ventas
        let y = 75;
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('RESUMEN DE VENTAS', 20, y);

        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        y += 10;

        const resumen = datosReporte.resumen;
        doc.text(`Total Facturado: ${Utils.formatCurrency(resumen.total_general)}`, 30, y);
        y += 6;
        doc.text(`  - Efectivo: ${Utils.formatCurrency(resumen.total_efectivo)}`, 30, y);
        y += 6;
        doc.text(`  - Cheque: ${Utils.formatCurrency(resumen.total_cheque)}`, 30, y);
        y += 6;
        doc.text(`  - Tarjeta: ${Utils.formatCurrency(resumen.total_tarjeta)}`, 30, y);
        y += 6;
        doc.text(`  - Transferencia: ${Utils.formatCurrency(resumen.total_transferencia)}`, 30, y);
        y += 10;
        doc.text(`Número de Facturas: ${resumen.numero_facturas}`, 30, y);
        y += 6;
        doc.text(`Venta Promedio: ${Utils.formatCurrency(resumen.venta_promedio)}`, 30, y);
        y += 6;
        doc.text(`Facturas Anuladas: ${resumen.facturas_anuladas}`, 30, y);

        // Top 10 Productos (tabla)
        y += 15;
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text('TOP 10 PRODUCTOS MÁS VENDIDOS', 20, y);
        y += 5;

        // Obtener datos de la tabla
        const tbody = document.getElementById('topProductosVendidos');
        const rows = tbody.querySelectorAll('tr');
        const tableData = [];

        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            if (cells.length > 0) {
                tableData.push([
                    cells[0].textContent.trim(),
                    cells[1].querySelector('strong')?.textContent.trim() || '',
                    cells[2].textContent.trim(),
                    cells[3].textContent.trim(),
                    cells[4].querySelector('strong')?.textContent.trim() || '',
                    cells[5].textContent.trim()
                ]);
            }
        });

        doc.autoTable({
            startY: y,
            head: [['#', 'Producto', 'Categoría', 'Cantidad', 'Total', '%']],
            body: tableData,
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

        // Descargar
        const nombreArchivo = `reporte_ventas_${filtros.fecha_inicio}_${filtros.fecha_fin}.pdf`;
        doc.save(nombreArchivo);

        Utils.showToast('Reporte exportado exitosamente', 'success');

    } catch (error) {
        console.error('Error al exportar PDF:', error);
        Utils.showToast('Error al exportar el reporte', 'error');
    }
}

async function imprimirReporte() {
    if (!datosReporte) {
        Utils.showToast('Primero debes generar el reporte', 'warning');
        return;
    }

    window.print();
}

/* ==================== UTILIDADES ==================== */

function limpiarFiltros() {
    document.getElementById('periodoSelect').value = 'month';
    document.getElementById('sucursalSelect').value = '';
    document.getElementById('metodoPagoSelect').value = '';
    document.getElementById('usuarioSelect').value = '';
    configurarFechasPorDefecto();

    // Limpiar datos
    datosReporte = null;

    // Limpiar estadísticas
    document.getElementById('totalFacturado').textContent = 'Q 0.00';
    document.getElementById('numeroFacturas').textContent = '0';
    document.getElementById('ventaPromedio').textContent = 'Q 0.00';
    document.getElementById('facturasAnuladas').textContent = '0';

    // Limpiar tablas
    document.getElementById('topProductosVendidos').innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem; color: var(--gray-500);">Genera un reporte para ver los datos</td></tr>';
    document.getElementById('ventasPorSucursal').innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem; color: var(--gray-500);">Genera un reporte para ver los datos</td></tr>';

    Utils.showToast('Filtros limpiados', 'info');
}

function mostrarLoading(mostrar) {
    // Aquí podrías agregar un spinner de loading
    const btn = document.querySelector('button[onclick="generarReporte()"]');
    if (btn) {
        btn.disabled = mostrar;
        btn.innerHTML = mostrar
            ? '<i class="fas fa-spinner fa-spin"></i> Generando...'
            : '<i class="fas fa-chart-line"></i> Generar Reporte';
    }
}

function logout() {
    auth.logout();
}

// Exportar funciones globalmente
window.generarReporte = generarReporte;
window.exportarReporte = exportarReporte;
window.imprimirReporte = imprimirReporte;
window.configurarFechas = configurarFechas;
window.limpiarFiltros = limpiarFiltros;
window.logout = logout;
