// Configurar event listeners
document.addEventListener('DOMContentLoaded', function() {
    console.log('Página de facturas cargada correctamente');

    // Configurar filtros
    const filtros = ['filtroNumero', 'filtroCliente', 'filtroEstado', 'fechaDesde', 'fechaHasta', 'filtroSucursal'];
    filtros.forEach(filtro => {
        const elemento = document.getElementById(filtro);
        if (elemento) {
            elemento.addEventListener('change', debounce(aplicarFiltros, 500));
        }
    });
});

// Aplicar filtros
function aplicarFiltros() {
    console.log('Aplicando filtros...');
    // En una implementación real, aquí se haría la consulta al backend
    alert('Filtros aplicados (simulación)');
}

// Limpiar filtros
function limpiarFiltros() {
    const filtros = ['filtroNumero', 'filtroCliente', 'filtroEstado', 'fechaDesde', 'fechaHasta', 'filtroSucursal'];
    filtros.forEach(filtro => {
        const elemento = document.getElementById(filtro);
        if (elemento) {
            elemento.value = '';
        }
    });
    console.log('Filtros limpiados');
}

// Ver detalle de factura
function verDetalleFactura(facturaId) {
    const content = document.getElementById('detalleFacturaContent');

    content.innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 2rem;">
            <div>
                <h4>Información de la Factura</h4>
                <p><strong>Número:</strong> A${facturaId.toString().padStart(8, '0')}</p>
                <p><strong>Fecha:</strong> 17 Nov 2024, 10:30</p>
                <p><strong>Estado:</strong> <span class="status-badge status-activo">Activa</span></p>
                <p><strong>Método de Pago:</strong> Tarjeta</p>
                <p><strong>Sucursal:</strong> Pradera Chimaltenango</p>
            </div>
            <div>
                <h4>Información del Cliente</h4>
                <p><strong>Nombre:</strong> María García</p>
                <p><strong>Email:</strong> maria.garcia@email.com</p>
                <p><strong>Teléfono:</strong> +502 1234 5678</p>
                <p><strong>Dirección:</strong> Ciudad de Guatemala</p>
            </div>
        </div>

        <h4>Productos</h4>
        <div class="table-container">
            <table class="table">
                <thead>
                    <tr>
                        <th>Producto</th>
                        <th>Cantidad</th>
                        <th>Precio Unit.</th>
                        <th>Subtotal</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Pintura Latex Blanca 1 Galón</td>
                        <td>2 galones</td>
                        <td>Q 350</td>
                        <td>Q 700</td>
                    </tr>
                    <tr>
                        <td>Brocha 3 pulgadas</td>
                        <td>1 unidad</td>
                        <td>Q 85</td>
                        <td>Q 85</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div style="text-align: right; margin-top: 1rem; border-top: 1px solid var(--gray-200); padding-top: 1rem;">
            <p style="font-size: 1.2rem;"><strong>Total: Q 1,250</strong></p>
        </div>

        <div style="margin-top: 2rem; display: flex; gap: 1rem; justify-content: flex-end;">
            <button class="btn btn-secondary" onclick="cerrarModal('modalDetalleFactura')">Cerrar</button>
            <button class="btn btn-primary" onclick="imprimirFactura(${facturaId})">
                <i class="fas fa-print"></i>
                Imprimir
            </button>
        </div>
    `;

    document.getElementById('modalDetalleFactura').style.display = 'block';
}

// Funciones de acción
function nuevaFactura() {
    window.location.href = '/frontend/pages/ventas/pos.html';
}

function exportarFacturas() {
    alert('Función de exportar en desarrollo');
}

function anularFactura(facturaId) {
    if (confirm('¿Está seguro de que desea anular esta factura?')) {
        alert(`Factura ${facturaId} anulada (simulación)`);
    }
}

function imprimirFactura(facturaId) {
    alert(`Imprimiendo factura ${facturaId} (simulación)`);
}

// Utilidades
function cerrarModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function logout() {
    if (confirm('¿Está seguro de que desea cerrar sesión?')) {
        window.location.href = '/frontend/pages/public/login.html';
    }
}
