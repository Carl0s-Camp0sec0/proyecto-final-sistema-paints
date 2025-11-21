// Inicializar página
document.addEventListener('DOMContentLoaded', function() {
    console.log('Página de medios de pago cargada correctamente');
    configurarEventos();
});

// Configurar event listeners
function configurarEventos() {
    document.getElementById('formMedioPago').addEventListener('submit', guardarMedioPago);
}

// Abrir modal para configurar medio de pago
function configurarMedioPago(tipo) {
    document.getElementById('medioPagoTipo').value = tipo;

    // Configurar según el tipo
    const configuraciones = {
        'efectivo': {
            nombre: 'Efectivo',
            comision: 0,
            descripcion: 'Pago en efectivo en moneda nacional (GTQ)'
        },
        'debito': {
            nombre: 'Tarjeta de Débito',
            comision: 2.5,
            descripcion: 'Pagos con tarjetas de débito Visa y MasterCard'
        },
        'credito': {
            nombre: 'Tarjeta de Crédito',
            comision: 3.2,
            descripcion: 'Pagos con tarjetas de crédito Visa, MasterCard y AMEX'
        },
        'cheque': {
            nombre: 'Cheque',
            comision: 0,
            descripcion: 'Cheques certificados y de gerencia'
        },
        'transferencia': {
            nombre: 'Transferencia Bancaria',
            comision: 1.5,
            descripcion: 'Transferencias bancarias directas'
        },
        'mixto': {
            nombre: 'Pago Mixto',
            comision: 0,
            descripcion: 'Combinación de múltiples métodos de pago'
        }
    };

    const config = configuraciones[tipo] || {};

    document.getElementById('modalMedioPagoTitle').textContent = `Configurar ${config.nombre}`;
    document.getElementById('medioPagoNombre').value = config.nombre;
    document.getElementById('medioPagoComision').value = config.comision;
    document.getElementById('medioPagoDescripcion').value = config.descripcion;
    document.getElementById('medioPagoEstado').value = 'true';

    // Configuraciones específicas
    const configuracionesDiv = document.getElementById('configuracionesEspecificas');
    configuracionesDiv.innerHTML = '';

    if (tipo === 'credito' || tipo === 'debito') {
        configuracionesDiv.innerHTML = `
            <div style="border-top: 1px solid var(--gray-200); padding-top: 1.5rem; margin-top: 1.5rem;">
                <h5 style="margin-bottom: 1rem; color: var(--gray-700);">Configuración de Tarjetas</h5>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                    <div class="form-group">
                        <label class="form-label">Procesador de Pagos</label>
                        <select class="form-select" name="procesador">
                            <option value="credomatic">Credomatic</option>
                            <option value="banrural">Banrural</option>
                            <option value="bac">BAC</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Terminal ID</label>
                        <input type="text" class="form-input" name="terminal_id" placeholder="ID del terminal">
                    </div>
                </div>
            </div>
        `;
    }

    document.getElementById('modalMedioPago').style.display = 'block';
}

// Abrir modal para nuevo medio de pago
function abrirModalMedioPago() {
    document.getElementById('modalMedioPagoTitle').textContent = 'Nuevo Medio de Pago';
    document.getElementById('formMedioPago').reset();
    document.getElementById('configuracionesEspecificas').innerHTML = '';
    document.getElementById('modalMedioPago').style.display = 'block';
}

// Guardar configuración
function guardarMedioPago(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const medioPagoData = {
        tipo: formData.get('tipo'),
        nombre: formData.get('nombre'),
        comision: parseFloat(formData.get('comision')),
        descripcion: formData.get('descripcion'),
        activo: formData.get('activo') === 'true'
    };

    console.log('Configuración del medio de pago:', medioPagoData);
    alert('Configuración guardada correctamente');
    cerrarModal('modalMedioPago');
}

// Generar reporte
function generarReporte() {
    alert('Generando reporte de uso de medios de pago (en desarrollo)');
}

// Utilidades
function cerrarModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function logout() {
    if (confirm('¿Está seguro de que desea cerrar sesión?')) {
        window.location.href = '/frontend/pages/public/login.html';
    }
}
