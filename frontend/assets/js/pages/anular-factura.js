// Variables globales
let facturaSeleccionada = null;

// Datos de facturas de ejemplo
const facturasMuestra = {
    'A1234': {
        id: 1234,
        serie: 'A',
        numero: 1234,
        fecha_creacion: '2024-11-17T10:30:00',
        estado: 'activa',
        total: 1250,
        cliente: { nombre: 'María García', email: 'maria.garcia@email.com', telefono: '+502 1234 5678' },
        sucursal: { nombre: 'Pradera Chimaltenango' },
        usuario: { nombre: 'Admin Usuario' },
        metodo_pago: 'Tarjeta',
        detalles: [
            { producto: { nombre: 'Pintura Latex Blanca 1 Galón', categoria: { nombre: 'Pinturas' } }, cantidad: 2, unidad_medida: { nombre: 'galones' }, precio_unitario: 350, subtotal: 700 },
            { producto: { nombre: 'Brocha 3 pulgadas', categoria: { nombre: 'Accesorios' } }, cantidad: 1, unidad_medida: { nombre: 'unidad' }, precio_unitario: 85, subtotal: 85 }
        ]
    },
    'A1235': {
        id: 1235,
        serie: 'A',
        numero: 1235,
        fecha_creacion: '2024-11-17T11:15:00',
        estado: 'anulada',
        total: 850,
        cliente: { nombre: 'Juan Pérez', email: 'juan.perez@email.com' },
        sucursal: { nombre: 'Pradera Escuintla' },
        metodo_pago: 'Efectivo',
        fecha_anulacion: '2024-11-17T15:30:00',
        motivo_anulacion: 'Solicitud del cliente'
    }
};

// Inicializar página
document.addEventListener('DOMContentLoaded', function() {
    console.log('Página de anulación cargada correctamente');
    configurarEventos();
});

// Configurar event listeners
function configurarEventos() {
    document.getElementById('formAnulacion').addEventListener('submit', procesarAnulacion);

    document.getElementById('numeroFactura').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            buscarFactura();
        }
    });

    document.getElementById('numeroFactura').addEventListener('input', function() {
        const valor = this.value.toUpperCase();
        const serieSelect = document.getElementById('serieFactura');

        if (valor.match(/^[A-Z]/)) {
            const serie = valor.charAt(0);
            if (serie === 'A' || serie === 'B') {
                serieSelect.value = serie;
            }
        }
    });
}

// Buscar factura
function buscarFactura() {
    const numeroInput = document.getElementById('numeroFactura').value.trim();
    const serie = document.getElementById('serieFactura').value;

    if (!numeroInput) {
        alert('Por favor, ingrese el número de factura');
        return;
    }

    limpiarResultados();

    let numeroCompleto = numeroInput;
    let serieFactura = serie;

    if (numeroInput.match(/^[A-Z]/)) {
        serieFactura = numeroInput.charAt(0);
        numeroCompleto = numeroInput.substring(1);
    } else if (serie) {
        numeroCompleto = serie + numeroInput;
    }

    // Buscar en datos de muestra
    const factura = facturasMuestra[numeroCompleto.toUpperCase()];

    if (factura) {
        mostrarFacturaEncontrada(factura);
    } else {
        alert('Factura no encontrada. Intente con A1234 o A1235 para la demostración.');
    }
}

// Mostrar factura encontrada
function mostrarFacturaEncontrada(factura) {
    facturaSeleccionada = factura;

    if (factura.estado !== 'activa') {
        mostrarFacturaNoAnulable(factura);
        return;
    }

    const container = document.getElementById('facturaEncontrada');
    const detalleDiv = document.getElementById('detalleFactura');

    detalleDiv.innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 2rem;">
            <div>
                <h4 style="margin-bottom: 1rem; color: var(--gray-700);">Información de la Factura</h4>
                <div style="background: var(--gray-50); padding: 1rem; border-radius: 8px;">
                    <p><strong>Número:</strong> ${factura.serie}${factura.numero.toString().padStart(8, '0')}</p>
                    <p><strong>Fecha:</strong> ${formatearFecha(factura.fecha_creacion)}</p>
                    <p><strong>Estado:</strong> ${obtenerBadgeEstado(factura.estado)}</p>
                    <p><strong>Total:</strong> <span style="color: var(--error-red); font-weight: bold; font-size: 1.2rem;">Q ${factura.total.toLocaleString()}</span></p>
                    <p><strong>Sucursal:</strong> ${factura.sucursal?.nombre || 'N/A'}</p>
                    <p><strong>Usuario:</strong> ${factura.usuario?.nombre || 'N/A'}</p>
                </div>
            </div>

            <div>
                <h4 style="margin-bottom: 1rem; color: var(--gray-700);">Cliente</h4>
                <div style="background: var(--gray-50); padding: 1rem; border-radius: 8px;">
                    <p><strong>Nombre:</strong> ${factura.cliente?.nombre || 'Consumidor Final'}</p>
                    <p><strong>Email:</strong> ${factura.cliente?.email || 'N/A'}</p>
                    <p><strong>Teléfono:</strong> ${factura.cliente?.telefono || 'N/A'}</p>
                    <p><strong>Método de pago:</strong> ${factura.metodo_pago || 'N/A'}</p>
                </div>
            </div>
        </div>

        <div>
            <h4 style="margin-bottom: 1rem; color: var(--gray-700);">Productos en la Factura</h4>
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
                        ${(factura.detalles || []).map(detalle => `
                            <tr>
                                <td>
                                    <strong>${detalle.producto?.nombre || 'Producto'}</strong><br>
                                    <small class="text-muted">${detalle.producto?.categoria?.nombre || ''}</small>
                                </td>
                                <td>${detalle.cantidad || 0} ${detalle.unidad_medida?.nombre || ''}</td>
                                <td>Q ${(detalle.precio_unitario || 0).toLocaleString()}</td>
                                <td>Q ${(detalle.subtotal || 0).toLocaleString()}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 2rem; padding-top: 1rem; border-top: 1px solid var(--gray-200);">
            <div style="display: flex; align-items: center; gap: 1rem;">
                <span style="color: var(--success-green);"><i class="fas fa-check-circle"></i> Factura válida para anulación</span>
            </div>
            <div style="display: flex; gap: 1rem;">
                <button class="btn btn-secondary" onclick="limpiarBusqueda()">
                    <i class="fas fa-search"></i>
                    Buscar Otra
                </button>
                <button class="btn btn-danger" onclick="iniciarProcesoAnulacion()" style="background: var(--error-red);">
                    <i class="fas fa-ban"></i>
                    Proceder con Anulación
                </button>
            </div>
        </div>
    `;

    container.style.display = 'block';
}

// Mostrar factura no anulable
function mostrarFacturaNoAnulable(factura) {
    const container = document.getElementById('facturaEncontrada');
    const detalleDiv = document.getElementById('detalleFactura');

    const mensajeEstado = {
        'anulada': 'Esta factura ya fue anulada anteriormente',
        'pagada': 'Esta factura está marcada como pagada',
        'cancelada': 'Esta factura fue cancelada'
    };

    detalleDiv.innerHTML = `
        <div style="text-align: center; padding: 2rem;">
            <div style="background: var(--error-100); border-radius: 50%; width: 80px; height: 80px; margin: 0 auto 1rem; display: flex; align-items: center; justify-content: center;">
                <i class="fas fa-ban" style="font-size: 2rem; color: var(--error-red);"></i>
            </div>
            <h4 style="color: var(--error-red); margin-bottom: 1rem;">No se puede anular esta factura</h4>
            <p style="color: var(--gray-600); margin-bottom: 2rem;">
                ${mensajeEstado[factura.estado] || 'Esta factura no está disponible para anulación'}
            </p>

            <div style="background: var(--gray-50); padding: 1rem; border-radius: 8px; margin-bottom: 2rem; text-align: left;">
                <h5>Información de la Factura:</h5>
                <p><strong>Número:</strong> ${factura.serie}${factura.numero.toString().padStart(8, '0')}</p>
                <p><strong>Estado:</strong> ${obtenerBadgeEstado(factura.estado)}</p>
                <p><strong>Fecha:</strong> ${formatearFecha(factura.fecha_creacion)}</p>
                <p><strong>Total:</strong> Q ${factura.total.toLocaleString()}</p>
                ${factura.fecha_anulacion ? `<p><strong>Fecha de anulación:</strong> ${formatearFecha(factura.fecha_anulacion)}</p>` : ''}
                ${factura.motivo_anulacion ? `<p><strong>Motivo:</strong> ${factura.motivo_anulacion}</p>` : ''}
            </div>

            <button class="btn btn-secondary" onclick="limpiarBusqueda()">
                <i class="fas fa-search"></i>
                Buscar Otra Factura
            </button>
        </div>
    `;

    container.style.display = 'block';
}

// Iniciar proceso de anulación
function iniciarProcesoAnulacion() {
    if (!facturaSeleccionada) {
        alert('No hay factura seleccionada');
        return;
    }

    document.getElementById('facturaIdAnular').value = facturaSeleccionada.id;
    document.getElementById('formularioAnulacion').style.display = 'block';

    document.getElementById('formularioAnulacion').scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });
}

// Procesar formulario de anulación
function procesarAnulacion(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const datosAnulacion = {
        facturaId: parseInt(formData.get('facturaId')),
        motivo: formData.get('motivo'),
        observaciones: formData.get('observaciones'),
        autorizacion: formData.get('autorizacion'),
        confirmar: formData.has('confirmar')
    };

    if (!datosAnulacion.confirmar) {
        alert('Debe confirmar que está de acuerdo con la anulación');
        return;
    }

    if (!datosAnulacion.motivo || !datosAnulacion.observaciones) {
        alert('Debe completar el motivo y las observaciones');
        return;
    }

    if (datosAnulacion.observaciones.length < 20) {
        alert('Las observaciones deben ser más detalladas (mínimo 20 caracteres)');
        return;
    }

    mostrarConfirmacionFinal(datosAnulacion);
}

// Mostrar confirmación final
function mostrarConfirmacionFinal(datosAnulacion) {
    const resumenDiv = document.getElementById('resumenAnulacion');

    resumenDiv.innerHTML = `
        <h5>Resumen de la Anulación:</h5>
        <p><strong>Factura:</strong> ${facturaSeleccionada.serie}${facturaSeleccionada.numero.toString().padStart(8, '0')}</p>
        <p><strong>Total:</strong> Q ${facturaSeleccionada.total.toLocaleString()}</p>
        <p><strong>Cliente:</strong> ${facturaSeleccionada.cliente?.nombre || 'Consumidor Final'}</p>
        <p><strong>Motivo:</strong> ${document.getElementById('motivoAnulacion').selectedOptions[0].text}</p>
        <p><strong>Observaciones:</strong> ${datosAnulacion.observaciones}</p>
        ${datosAnulacion.autorizacion ? `<p><strong>Autorización:</strong> ${datosAnulacion.autorizacion}</p>` : ''}
    `;

    document.getElementById('modalConfirmacionAnulacion').style.display = 'block';
}

// Confirmar anulación final
function confirmarAnulacionFinal() {
    cerrarModal('modalConfirmacionAnulacion');

    // Simular proceso de anulación
    setTimeout(() => {
        alert('¡Factura anulada correctamente!\n\nLa anulación ha sido registrada en auditoría y el stock ha sido reintegrado al inventario.');
        limpiarBusqueda();
    }, 1000);
}

// Funciones auxiliares
function limpiarBusqueda() {
    document.getElementById('numeroFactura').value = '';
    document.getElementById('serieFactura').value = '';
    limpiarResultados();
}

function limpiarResultados() {
    document.getElementById('facturaEncontrada').style.display = 'none';
    document.getElementById('formularioAnulacion').style.display = 'none';
    facturaSeleccionada = null;
}

function cancelarAnulacion() {
    if (confirm('¿Está seguro de que desea cancelar el proceso de anulación?')) {
        limpiarResultados();
    }
}

function verHistorialAnulaciones() {
    alert('Historial de anulaciones (en desarrollo)');
}

function obtenerBadgeEstado(estado) {
    const badges = {
        'activa': '<span class="status-badge status-activo">Activa</span>',
        'anulada': '<span class="status-badge status-inactivo">Anulada</span>',
        'pagada': '<span class="status-badge status-completado">Pagada</span>',
        'cancelada': '<span class="status-badge status-suspendido">Cancelada</span>'
    };
    return badges[estado] || `<span class="status-badge">${estado}</span>`;
}

function cerrarModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function formatearFecha(fecha) {
    return new Date(fecha).toLocaleString('es-GT', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function logout() {
    if (confirm('¿Está seguro de que desea cerrar sesión?')) {
        window.location.href = '/frontend/pages/public/login.html';
    }
}
