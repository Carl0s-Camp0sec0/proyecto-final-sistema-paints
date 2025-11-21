// Inicializar página
document.addEventListener('DOMContentLoaded', function() {
    console.log('Página de auditoría cargada correctamente');
    configurarEventos();
    configurarFechasPorDefecto();
});

// Configurar event listeners
function configurarEventos() {
    const filtros = ['filtroTipoEvento', 'filtroUsuario', 'filtroSucursal', 'filtroSeveridad'];
    filtros.forEach(filtro => {
        const elemento = document.getElementById(filtro);
        if (elemento) {
            elemento.addEventListener('change', aplicarFiltrosAuditoria);
        }
    });

    document.getElementById('fechaDesde').addEventListener('change', aplicarFiltrosAuditoria);
    document.getElementById('fechaHasta').addEventListener('change', aplicarFiltrosAuditoria);
}

// Configurar fechas por defecto (últimas 24 horas)
function configurarFechasPorDefecto() {
    const ahora = new Date();
    const ayer = new Date(ahora.getTime() - 24 * 60 * 60 * 1000);

    document.getElementById('fechaHasta').value = ahora.toISOString().slice(0, 16);
    document.getElementById('fechaDesde').value = ayer.toISOString().slice(0, 16);
}

// Aplicar filtros de auditoría
function aplicarFiltrosAuditoria() {
    const filtros = {
        tipoEvento: document.getElementById('filtroTipoEvento').value,
        usuario: document.getElementById('filtroUsuario').value,
        sucursal: document.getElementById('filtroSucursal').value,
        fechaDesde: document.getElementById('fechaDesde').value,
        fechaHasta: document.getElementById('fechaHasta').value,
        severidad: document.getElementById('filtroSeveridad').value
    };

    console.log('Aplicando filtros de auditoría:', filtros);
    alert('Filtros aplicados (simulación)');
}

// Limpiar filtros
function limpiarFiltrosAuditoria() {
    document.getElementById('filtroTipoEvento').value = '';
    document.getElementById('filtroUsuario').value = '';
    document.getElementById('filtroSucursal').value = '';
    document.getElementById('filtroSeveridad').value = '';
    configurarFechasPorDefecto();

    console.log('Filtros de auditoría limpiados');
}

// Ver detalle de evento de auditoría
function verDetalleAuditoria(eventoId) {
    const content = document.getElementById('detalleAuditoriaContent');

    const eventos = {
        1: {
            id: 1,
            tipo: 'VENTA',
            fecha: '17/11/2024 14:30:25',
            usuario: 'Carlos López',
            accion: 'Factura Creada',
            ip: '192.168.1.45',
            severidad: 'INFO',
            detalles: {
                factura: 'A00001234',
                total: 'Q 1,250.00',
                cliente: 'María García',
                productos: '2 productos',
                metodo_pago: 'Tarjeta de crédito'
            }
        },
        2: {
            id: 2,
            tipo: 'INVENTARIO',
            fecha: '17/11/2024 14:28:15',
            usuario: 'Sistema',
            accion: 'Alerta de Stock Bajo',
            ip: 'Sistema',
            severidad: 'WARNING',
            detalles: {
                producto: 'Pintura Látex Blanca 1 Galón',
                stock_actual: '3 unidades',
                stock_minimo: '10 unidades',
                sucursal: 'Pradera Chimaltenango'
            }
        }
    };

    const evento = eventos[eventoId] || eventos[1];

    content.innerHTML = `
        <div style="margin-bottom: 2rem;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
                <div>
                    <h4 style="margin-bottom: 1rem; color: var(--gray-700);">Información del Evento</h4>
                    <div style="background: var(--gray-50); padding: 1rem; border-radius: 8px;">
                        <p><strong>ID del Evento:</strong> #${evento.id.toString().padStart(6, '0')}</p>
                        <p><strong>Tipo:</strong> <span class="badge badge-primary">${evento.tipo}</span></p>
                        <p><strong>Fecha y Hora:</strong> ${evento.fecha}</p>
                        <p><strong>Acción:</strong> ${evento.accion}</p>
                        <p><strong>Severidad:</strong> <span class="status-badge status-completado">${evento.severidad}</span></p>
                    </div>
                </div>

                <div>
                    <h4 style="margin-bottom: 1rem; color: var(--gray-700);">Usuario y Ubicación</h4>
                    <div style="background: var(--gray-50); padding: 1rem; border-radius: 8px;">
                        <p><strong>Usuario:</strong> ${evento.usuario}</p>
                        <p><strong>Dirección IP:</strong> <code>${evento.ip}</code></p>
                        <p><strong>User Agent:</strong> Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36</p>
                        <p><strong>Navegador:</strong> Chrome 118.0.0.0</p>
                    </div>
                </div>
            </div>
        </div>

        <div style="margin-bottom: 2rem;">
            <h4 style="margin-bottom: 1rem; color: var(--gray-700);">Detalles Específicos</h4>
            <div style="background: var(--primary-50); padding: 1rem; border-radius: 8px; border-left: 4px solid var(--primary-blue);">
                ${Object.entries(evento.detalles).map(([key, value]) =>
                    `<p><strong>${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:</strong> ${value}</p>`
                ).join('')}
            </div>
        </div>

        <div style="margin-bottom: 2rem;">
            <h4 style="margin-bottom: 1rem; color: var(--gray-700);">Datos Técnicos</h4>
            <div style="background: var(--gray-50); padding: 1rem; border-radius: 8px;">
                <p><strong>Hash SHA-256:</strong> <code style="word-break: break-all;">e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855</code></p>
                <p><strong>Timestamp Unix:</strong> 1700231425</p>
                <p><strong>Tamaño del Log:</strong> 1.2 KB</p>
                <p><strong>Estado de Verificación:</strong> <span class="status-badge status-completado">Verificado</span></p>
            </div>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 1rem; margin-top: 2rem;">
            <button class="btn btn-secondary" onclick="cerrarModal('modalDetalleAuditoria')">
                Cerrar
            </button>
            <button class="btn btn-primary" onclick="exportarEvento(${evento.id})">
                <i class="fas fa-download"></i>
                Exportar Evento
            </button>
        </div>
    `;

    document.getElementById('modalDetalleAuditoria').style.display = 'block';
}

// Funciones de acción
function generarReporteAuditoria() {
    alert('Generando reporte de auditoría... (en desarrollo)');
}

function exportarLogs() {
    if (confirm('¿Desea exportar todos los logs de auditoría?')) {
        alert('Exportando logs de auditoría... (en desarrollo)');
    }
}

function limpiarLogsAntiguos() {
    if (confirm('¿Está seguro de que desea eliminar los logs antiguos? Esta acción no se puede deshacer.')) {
        alert('Limpiando logs antiguos... (en desarrollo)');
    }
}

function exportarEvento(eventoId) {
    alert(`Exportando evento ${eventoId}... (en desarrollo)`);
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
