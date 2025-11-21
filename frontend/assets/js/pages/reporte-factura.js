/**
 * Reporte de Búsqueda de Facturas
 * Implementa el Reporte 7: Búsqueda de facturas por número
 */

// Variables globales
let facturaActual = null;

// Verificar autenticación al cargar
document.addEventListener('DOMContentLoaded', function() {
    // Verificar si el usuario está autenticado
    if (!auth.isAuthenticated()) {
        window.location.href = '/frontend/pages/public/login.html';
        return;
    }

    // Verificar permisos (solo Admin y Gerente pueden ver reportes)
    if (!auth.hasPermission([CONFIG.ROLES.ADMIN, CONFIG.ROLES.GERENTE, CONFIG.ROLES.VENDEDOR])) {
        Utils.showToast('No tienes permisos para acceder a los reportes', 'error');
        setTimeout(() => {
            window.location.href = '/frontend/pages/admin/dashboard.html';
        }, 2000);
        return;
    }

    // Inicializar la página
    inicializarEventos();

    // Permitir buscar con Enter
    document.getElementById('inputNumeroFactura').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            buscarFactura();
        }
    });
});

/**
 * Inicializa los eventos de la página
 */
function inicializarEventos() {
    const btnBuscar = document.getElementById('btnBuscarFactura');
    const btnExportar = document.getElementById('btnExportarPDF');

    if (btnBuscar) {
        btnBuscar.addEventListener('click', buscarFactura);
    }

    if (btnExportar) {
        btnExportar.addEventListener('click', exportarPDF);
    }
}

/**
 * Busca una factura por su número
 */
async function buscarFactura() {
    const inputNumero = document.getElementById('inputNumeroFactura');
    const numeroFactura = inputNumero.value.trim();

    if (!numeroFactura) {
        Utils.showToast('Por favor ingresa un número de factura', 'warning');
        return;
    }

    // Mostrar loading
    const btnBuscar = document.getElementById('btnBuscarFactura');
    const textoOriginal = btnBuscar.innerHTML;
    btnBuscar.disabled = true;
    btnBuscar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Buscando...';

    // Ocultar resultados previos
    document.getElementById('resultadoFactura').style.display = 'none';
    document.getElementById('mensajeNoEncontrado').style.display = 'none';

    try {
        const response = await api.get(`/reportes/factura/${encodeURIComponent(numeroFactura)}`);

        if (response.success && response.data) {
            facturaActual = response.data;
            mostrarFactura(response.data);
        } else {
            mostrarNoEncontrado();
        }
    } catch (error) {
        console.error('Error al buscar factura:', error);

        if (error.status === 404) {
            mostrarNoEncontrado();
        } else {
            Utils.showToast('Error al buscar la factura', 'error');
        }
    } finally {
        btnBuscar.disabled = false;
        btnBuscar.innerHTML = textoOriginal;
    }
}

/**
 * Muestra los detalles de la factura encontrada
 */
function mostrarFactura(factura) {
    // Mostrar contenedor de resultado
    document.getElementById('resultadoFactura').style.display = 'block';
    document.getElementById('mensajeNoEncontrado').style.display = 'none';

    // Información general de la factura
    document.getElementById('infoNumeroFactura').textContent = factura.numero_factura || 'N/A';
    document.getElementById('infoFecha').textContent = Utils.formatDate(factura.fecha);
    document.getElementById('infoTotal').textContent = Utils.formatCurrency(factura.total || 0);

    // Estado de la factura
    const estadoBadge = document.getElementById('infoEstado');
    const estado = factura.estado || 'Completada';
    estadoBadge.innerHTML = `<span class="status-badge status-activo">${estado}</span>`;

    // Información del cliente
    document.getElementById('clienteNombre').textContent = factura.cliente?.nombre || 'N/A';
    document.getElementById('clienteNit').textContent = factura.cliente?.nit || 'CF';
    document.getElementById('clienteTelefono').textContent = factura.cliente?.telefono || 'N/A';
    document.getElementById('clienteDireccion').textContent = factura.cliente?.direccion || 'N/A';

    // Información de venta
    document.getElementById('ventaSucursal').textContent = factura.sucursal?.nombre || 'N/A';
    document.getElementById('ventaResponsable').textContent = factura.usuario?.nombre || 'N/A';

    // Productos
    mostrarProductos(factura.productos || []);

    // Métodos de pago
    mostrarMetodosPago(factura.metodos_pago || []);

    // Scroll al resultado
    document.getElementById('resultadoFactura').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * Muestra la lista de productos de la factura
 */
function mostrarProductos(productos) {
    const tbody = document.getElementById('tablaProductos');

    if (!productos || productos.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 2rem; color: var(--gray-500);">
                    No hay productos registrados
                </td>
            </tr>
        `;
        return;
    }

    let html = '';
    productos.forEach(item => {
        const precioUnitario = parseFloat(item.precio_unitario) || 0;
        const cantidad = parseInt(item.cantidad) || 0;
        const descuento = parseFloat(item.descuento) || 0;
        const subtotal = parseFloat(item.subtotal) || 0;

        html += `
            <tr>
                <td>
                    <strong>${item.producto?.nombre || 'Producto desconocido'}</strong><br>
                    <small class="text-muted">${item.producto?.codigo || ''}</small>
                </td>
                <td>${cantidad}</td>
                <td>${Utils.formatCurrency(precioUnitario)}</td>
                <td>${Utils.formatCurrency(descuento)}</td>
                <td><strong>${Utils.formatCurrency(subtotal)}</strong></td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
}

/**
 * Muestra los métodos de pago de la factura
 */
function mostrarMetodosPago(metodosPago) {
    const tbody = document.getElementById('tablaMetodosPago');

    if (!metodosPago || metodosPago.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="3" style="text-align: center; padding: 2rem; color: var(--gray-500);">
                    No hay métodos de pago registrados
                </td>
            </tr>
        `;
        return;
    }

    let html = '';
    metodosPago.forEach(metodo => {
        const tipoMetodo = metodo.tipo_metodo_pago || metodo.metodo_pago?.tipo || 'No especificado';
        const monto = parseFloat(metodo.monto) || 0;
        const referencia = metodo.referencia || '-';

        // Icono según el método de pago
        let icono = 'fas fa-dollar-sign';
        if (tipoMetodo.toLowerCase().includes('tarjeta')) {
            icono = 'fas fa-credit-card';
        } else if (tipoMetodo.toLowerCase().includes('cheque')) {
            icono = 'fas fa-money-check';
        } else if (tipoMetodo.toLowerCase().includes('transferencia')) {
            icono = 'fas fa-exchange-alt';
        }

        html += `
            <tr>
                <td>
                    <i class="${icono}" style="color: var(--primary-blue); margin-right: 0.5rem;"></i>
                    ${tipoMetodo}
                </td>
                <td><strong>${Utils.formatCurrency(monto)}</strong></td>
                <td>${referencia}</td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
}

/**
 * Muestra el mensaje de factura no encontrada
 */
function mostrarNoEncontrado() {
    document.getElementById('resultadoFactura').style.display = 'none';
    document.getElementById('mensajeNoEncontrado').style.display = 'block';
    facturaActual = null;
}

/**
 * Exporta la factura a PDF
 */
async function exportarPDF() {
    if (!facturaActual) {
        Utils.showToast('No hay factura para exportar', 'warning');
        return;
    }

    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Configuración de colores
        const primaryColor = [79, 70, 229]; // Índigo
        const grayColor = [107, 114, 128];
        const successColor = [16, 185, 129];

        // Encabezado
        doc.setFillColor(...primaryColor);
        doc.rect(0, 0, 210, 40, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont(undefined, 'bold');
        doc.text('Sistema Paints', 20, 20);

        doc.setFontSize(12);
        doc.setFont(undefined, 'normal');
        doc.text('Factura de Venta', 20, 30);

        // Información de la factura
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text(`Factura: ${facturaActual.numero_factura}`, 20, 55);

        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(...grayColor);
        doc.text(`Fecha: ${Utils.formatDate(facturaActual.fecha)}`, 20, 62);

        // Total destacado
        doc.setFillColor(...successColor);
        doc.roundedRect(150, 50, 40, 15, 2, 2, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text('TOTAL', 170, 58, { align: 'center' });
        doc.setFontSize(10);
        doc.text(Utils.formatCurrency(facturaActual.total || 0), 170, 63, { align: 'center' });

        // Información del cliente
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text('Datos del Cliente', 20, 80);

        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        let y = 88;
        doc.text(`Nombre: ${facturaActual.cliente?.nombre || 'N/A'}`, 20, y);
        y += 6;
        doc.text(`NIT: ${facturaActual.cliente?.nit || 'CF'}`, 20, y);
        y += 6;
        doc.text(`Teléfono: ${facturaActual.cliente?.telefono || 'N/A'}`, 20, y);
        y += 6;
        doc.text(`Dirección: ${facturaActual.cliente?.direccion || 'N/A'}`, 20, y);

        // Información de venta
        y += 12;
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text('Información de Venta', 20, y);
        y += 8;

        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text(`Sucursal: ${facturaActual.sucursal?.nombre || 'N/A'}`, 20, y);
        y += 6;
        doc.text(`Responsable: ${facturaActual.usuario?.nombre || 'N/A'}`, 20, y);

        // Tabla de productos
        y += 10;
        const productosData = (facturaActual.productos || []).map(item => [
            item.producto?.nombre || 'Producto desconocido',
            item.cantidad?.toString() || '0',
            Utils.formatCurrency(item.precio_unitario || 0),
            Utils.formatCurrency(item.descuento || 0),
            Utils.formatCurrency(item.subtotal || 0)
        ]);

        doc.autoTable({
            startY: y,
            head: [['Producto', 'Cant.', 'Precio Unit.', 'Descuento', 'Subtotal']],
            body: productosData,
            theme: 'grid',
            headStyles: {
                fillColor: primaryColor,
                fontSize: 10,
                fontStyle: 'bold'
            },
            styles: {
                fontSize: 9,
                cellPadding: 3
            },
            columnStyles: {
                0: { cellWidth: 70 },
                1: { halign: 'center', cellWidth: 20 },
                2: { halign: 'right', cellWidth: 30 },
                3: { halign: 'right', cellWidth: 30 },
                4: { halign: 'right', cellWidth: 30 }
            }
        });

        // Tabla de métodos de pago
        y = doc.lastAutoTable.finalY + 10;

        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text('Métodos de Pago', 20, y);
        y += 5;

        const metodosPagoData = (facturaActual.metodos_pago || []).map(metodo => [
            metodo.tipo_metodo_pago || metodo.metodo_pago?.tipo || 'No especificado',
            Utils.formatCurrency(metodo.monto || 0),
            metodo.referencia || '-'
        ]);

        doc.autoTable({
            startY: y,
            head: [['Método de Pago', 'Monto', 'Referencia']],
            body: metodosPagoData,
            theme: 'grid',
            headStyles: {
                fillColor: primaryColor,
                fontSize: 10,
                fontStyle: 'bold'
            },
            styles: {
                fontSize: 9,
                cellPadding: 3
            },
            columnStyles: {
                0: { cellWidth: 80 },
                1: { halign: 'right', cellWidth: 40 },
                2: { cellWidth: 60 }
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
                105,
                285,
                { align: 'center' }
            );
        }

        // Guardar PDF
        doc.save(`Factura_${facturaActual.numero_factura}_${new Date().getTime()}.pdf`);
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
