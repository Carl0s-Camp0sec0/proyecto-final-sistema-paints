/**
 * Reporte de Ingresos de Inventario
 * Implementa el Reporte 8: Historial de entradas de productos al inventario
 */

// Variables globales
let ingresosData = [];
let sucursales = [];

// Verificar autenticación al cargar
document.addEventListener('DOMContentLoaded', function() {
    // Verificar si el usuario está autenticado
    if (!auth.isAuthenticated()) {
        window.location.href = '/frontend/pages/public/login.html';
        return;
    }

    // Verificar permisos (solo Admin y Gerente pueden ver reportes)
    if (!auth.hasPermission([CONFIG.ROLES.ADMIN, CONFIG.ROLES.GERENTE])) {
        Utils.showToast('No tienes permisos para acceder a los reportes', 'error');
        setTimeout(() => {
            window.location.href = '/frontend/pages/admin/dashboard.html';
        }, 2000);
        return;
    }

    // Inicializar la página
    inicializarPagina();
});

/**
 * Inicializa la página
 */
async function inicializarPagina() {
    inicializarEventos();
    establecerFechasPorDefecto();
    await cargarSucursales();
    await cargarIngresos();
}

/**
 * Inicializa los eventos de la página
 */
function inicializarEventos() {
    const btnAplicarFiltros = document.getElementById('btnAplicarFiltros');
    const btnLimpiarFiltros = document.getElementById('btnLimpiarFiltros');
    const btnExportarPDF = document.getElementById('btnExportarPDF');

    if (btnAplicarFiltros) {
        btnAplicarFiltros.addEventListener('click', aplicarFiltros);
    }

    if (btnLimpiarFiltros) {
        btnLimpiarFiltros.addEventListener('click', limpiarFiltros);
    }

    if (btnExportarPDF) {
        btnExportarPDF.addEventListener('click', exportarPDF);
    }
}

/**
 * Establece las fechas por defecto (último mes)
 */
function establecerFechasPorDefecto() {
    const hoy = new Date();
    const haceUnMes = new Date();
    haceUnMes.setMonth(haceUnMes.getMonth() - 1);

    document.getElementById('inputFechaInicio').valueAsDate = haceUnMes;
    document.getElementById('inputFechaFin').valueAsDate = hoy;
}

/**
 * Carga las sucursales disponibles
 */
async function cargarSucursales() {
    try {
        const response = await api.get('/sistema/sucursales');

        if (response.success && response.data) {
            sucursales = response.data;
            const select = document.getElementById('selectSucursal');

            sucursales.forEach(sucursal => {
                const option = document.createElement('option');
                option.value = sucursal.id;
                option.textContent = sucursal.nombre;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error al cargar sucursales:', error);
    }
}

/**
 * Carga los ingresos de inventario
 */
async function cargarIngresos(filtros = {}) {
    try {
        // Obtener filtros de fecha
        const fechaInicio = document.getElementById('inputFechaInicio').value;
        const fechaFin = document.getElementById('inputFechaFin').value;

        if (fechaInicio) filtros.fecha_inicio = fechaInicio;
        if (fechaFin) filtros.fecha_fin = fechaFin;

        const response = await api.get('/reportes/inventario/ingresos', filtros);

        if (response.success && response.data) {
            ingresosData = response.data.ingresos || [];

            // Calcular estadísticas adicionales
            const estadisticas = response.data.estadisticas || {};
            estadisticas.total_productos = calcularTotalProductos(ingresosData);
            estadisticas.total_unidades = calcularTotalUnidades(ingresosData);
            estadisticas.valor_total = estadisticas.total_monto || 0;

            actualizarEstadisticas(estadisticas);
            mostrarIngresos(ingresosData);
        }
    } catch (error) {
        console.error('Error al cargar ingresos:', error);
        Utils.showToast('Error al cargar los ingresos', 'error');

        // Mostrar mensaje de error en la tabla
        const tbody = document.getElementById('tablaIngresos');
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 2rem; color: var(--error-red);">
                    <i class="fas fa-exclamation-triangle"></i> Error al cargar los ingresos
                </td>
            </tr>
        `;
    }
}

/**
 * Calcula el total de productos diferentes en los ingresos
 */
function calcularTotalProductos(ingresos) {
    const productosUnicos = new Set();
    ingresos.forEach(ingreso => {
        if (ingreso.productos) {
            ingreso.productos.forEach(prod => {
                productosUnicos.add(prod.producto_id);
            });
        }
    });
    return productosUnicos.size;
}

/**
 * Calcula el total de unidades ingresadas
 */
function calcularTotalUnidades(ingresos) {
    let totalUnidades = 0;
    ingresos.forEach(ingreso => {
        if (ingreso.productos) {
            ingreso.productos.forEach(prod => {
                totalUnidades += parseInt(prod.cantidad) || 0;
            });
        }
    });
    return totalUnidades;
}

/**
 * Actualiza las estadísticas del dashboard
 */
function actualizarEstadisticas(estadisticas) {
    document.getElementById('estadisticaTotalIngresos').textContent =
        estadisticas.total_ingresos?.toString() || '0';

    document.getElementById('estadisticaTotalProductos').textContent =
        estadisticas.total_productos?.toString() || '0';

    document.getElementById('estadisticaTotalUnidades').textContent =
        estadisticas.total_unidades?.toString() || '0';

    document.getElementById('estadisticaValorTotal').textContent =
        Utils.formatCurrency(estadisticas.valor_total || 0);
}

/**
 * Muestra los ingresos en la tabla
 */
function mostrarIngresos(ingresos) {
    const tbody = document.getElementById('tablaIngresos');

    if (!ingresos || ingresos.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 2rem; color: var(--gray-500);">
                    <i class="fas fa-inbox"></i> No se encontraron ingresos para el período seleccionado
                </td>
            </tr>
        `;
        return;
    }

    let html = '';
    ingresos.forEach(ingreso => {
        const fecha = Utils.formatDate(ingreso.fecha);
        const producto = ingreso.producto?.nombre || 'Producto desconocido';
        const sucursal = ingreso.sucursal?.nombre || 'N/A';
        const cantidad = parseInt(ingreso.cantidad) || 0;
        const costoUnitario = parseFloat(ingreso.costo_unitario) || 0;
        const costoTotal = parseFloat(ingreso.costo_total) || (cantidad * costoUnitario);
        const proveedor = ingreso.proveedor?.nombre || 'Sin especificar';
        const responsable = ingreso.usuario?.nombre || 'N/A';

        html += `
            <tr>
                <td>${fecha}</td>
                <td>
                    <strong>${producto}</strong><br>
                    <small class="text-muted">${ingreso.producto?.codigo || ''}</small>
                </td>
                <td>${sucursal}</td>
                <td><strong>${cantidad}</strong></td>
                <td>${Utils.formatCurrency(costoUnitario)}</td>
                <td><strong>${Utils.formatCurrency(costoTotal)}</strong></td>
                <td>${proveedor}</td>
                <td>${responsable}</td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
}

/**
 * Aplica los filtros seleccionados
 */
async function aplicarFiltros() {
    const filtros = {};

    // Filtro de sucursal
    const sucursalId = document.getElementById('selectSucursal').value;
    if (sucursalId) {
        filtros.sucursal_id = sucursalId;
    }

    // Filtro de producto
    const producto = document.getElementById('inputProducto').value.trim();
    if (producto) {
        filtros.producto = producto;
    }

    await cargarIngresos(filtros);
}

/**
 * Limpia todos los filtros
 */
function limpiarFiltros() {
    establecerFechasPorDefecto();
    document.getElementById('selectSucursal').value = '';
    document.getElementById('inputProducto').value = '';
    cargarIngresos();
}

/**
 * Exporta el reporte a PDF
 */
async function exportarPDF() {
    if (!ingresosData || ingresosData.length === 0) {
        Utils.showToast('No hay datos para exportar', 'warning');
        return;
    }

    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('l', 'mm', 'a4'); // Landscape para más espacio

        // Configuración de colores
        const primaryColor = [79, 70, 229]; // Índigo
        const grayColor = [107, 114, 128];

        // Encabezado
        doc.setFillColor(...primaryColor);
        doc.rect(0, 0, 297, 35, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(20);
        doc.setFont(undefined, 'bold');
        doc.text('Sistema Paints', 15, 15);

        doc.setFontSize(12);
        doc.setFont(undefined, 'normal');
        doc.text('Reporte de Ingresos de Inventario', 15, 25);

        // Fecha del reporte
        const fechaInicio = document.getElementById('inputFechaInicio').value;
        const fechaFin = document.getElementById('inputFechaFin').value;
        doc.setFontSize(10);
        doc.text(`Período: ${Utils.formatDate(fechaInicio)} - ${Utils.formatDate(fechaFin)}`, 200, 15);
        doc.text(`Generado: ${Utils.formatDate(new Date())}`, 200, 22);

        // Estadísticas resumidas
        let y = 45;
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text('Resumen', 15, y);

        y += 8;
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');

        const estadisticaTotalIngresos = document.getElementById('estadisticaTotalIngresos').textContent;
        const estadisticaTotalProductos = document.getElementById('estadisticaTotalProductos').textContent;
        const estadisticaTotalUnidades = document.getElementById('estadisticaTotalUnidades').textContent;
        const estadisticaValorTotal = document.getElementById('estadisticaValorTotal').textContent;

        doc.text(`Total de Ingresos: ${estadisticaTotalIngresos}`, 15, y);
        doc.text(`Productos Diferentes: ${estadisticaTotalProductos}`, 80, y);
        doc.text(`Total Unidades: ${estadisticaTotalUnidades}`, 145, y);
        doc.text(`Valor Total: ${estadisticaValorTotal}`, 210, y);

        // Tabla de ingresos
        y += 10;
        const ingresosTableData = ingresosData.map(ingreso => [
            Utils.formatDate(ingreso.fecha),
            ingreso.producto?.nombre || 'N/A',
            ingreso.sucursal?.nombre || 'N/A',
            (ingreso.cantidad || 0).toString(),
            Utils.formatCurrency(ingreso.costo_unitario || 0),
            Utils.formatCurrency(ingreso.costo_total || 0),
            ingreso.proveedor?.nombre || 'N/A'
        ]);

        doc.autoTable({
            startY: y,
            head: [['Fecha', 'Producto', 'Sucursal', 'Cant.', 'Costo Unit.', 'Costo Total', 'Proveedor']],
            body: ingresosTableData,
            theme: 'grid',
            headStyles: {
                fillColor: primaryColor,
                fontSize: 9,
                fontStyle: 'bold'
            },
            styles: {
                fontSize: 8,
                cellPadding: 2
            },
            columnStyles: {
                0: { cellWidth: 25 },
                1: { cellWidth: 60 },
                2: { cellWidth: 45 },
                3: { halign: 'center', cellWidth: 18 },
                4: { halign: 'right', cellWidth: 28 },
                5: { halign: 'right', cellWidth: 28 },
                6: { cellWidth: 50 }
            }
        });

        // Pie de página
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(...grayColor);
            doc.text(
                `Sistema Paints - Universidad UMES | Página ${i} de ${pageCount}`,
                148.5,
                205,
                { align: 'center' }
            );
        }

        // Guardar PDF
        doc.save(`Reporte_Ingresos_Inventario_${new Date().getTime()}.pdf`);
        Utils.showToast('PDF generado exitosamente', 'success');

    } catch (error) {
        console.error('Error al generar PDF:', error);
        Utils.showToast('Error al generar el PDF', 'error');
    }
}

/**
 * Función para cerrar sesión
 */
function logout() {
    auth.logout();
}
