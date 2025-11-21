// Estado global del sistema de backup
let estadoBackup = {
    activo: false,
    ultimoBackup: new Date(Date.now() - 2 * 60 * 60 * 1000),
    progreso: 0,
    configuracion: {
        frecuencia: 6,
        retencion: 30
    }
};

// Historial de backups de ejemplo
const historialBackups = [
    {
        id: 1,
        fecha: new Date(Date.now() - 2 * 60 * 60 * 1000),
        tipo: 'incremental',
        estado: 'completado',
        tamaño: '45.2 MB',
        duracion: '2m 15s',
        ubicacion: 'Local + Nube'
    },
    {
        id: 2,
        fecha: new Date(Date.now() - 8 * 60 * 60 * 1000),
        tipo: 'incremental',
        estado: 'completado',
        tamaño: '32.8 MB',
        duracion: '1m 45s',
        ubicacion: 'Local + Nube'
    },
    {
        id: 3,
        fecha: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        tipo: 'completo',
        estado: 'completado',
        tamaño: '2.4 GB',
        duracion: '18m 45s',
        ubicacion: 'Local + Nube'
    }
];

// Inicializar página
document.addEventListener('DOMContentLoaded', function() {
    actualizarEstadoSistema();
    cargarHistorialBackups();
    configurarEventos();
});

function configurarEventos() {
    document.getElementById('btnBackupNow').addEventListener('click', ejecutarBackupManual);
    document.getElementById('btnConfiguracion').addEventListener('click', abrirConfiguracion);
    document.getElementById('formConfiguracion').addEventListener('submit', guardarConfiguracion);
}

function actualizarEstadoSistema() {
    const estadoTexto = document.getElementById('estadoTexto');
    const statusIndicator = document.getElementById('statusIndicator');
    const statusSection = document.getElementById('statusSection');

    const tiempoTranscurrido = Date.now() - estadoBackup.ultimoBackup;
    const horas = Math.floor(tiempoTranscurrido / (1000 * 60 * 60));

    if (estadoBackup.activo) {
        estadoTexto.textContent = 'Backup en progreso...';
        statusIndicator.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        statusSection.className = 'status-section status-warning';
    } else {
        estadoTexto.textContent = `Sistema operativo - Último backup: Hace ${horas} horas`;
        statusIndicator.innerHTML = '<i class="fas fa-check-circle"></i>';
        statusSection.className = 'status-section status-online';
    }
}

function cargarHistorialBackups() {
    const tbody = document.getElementById('backupsTableBody');

    tbody.innerHTML = historialBackups.map(backup => `
        <tr>
            <td>
                <div>${formatearFecha(backup.fecha)}</div>
                <small style="color: var(--gray-500);">${formatearHora(backup.fecha)}</small>
            </td>
            <td>
                <span class="backup-type type-${backup.tipo}">
                    ${obtenerNombreTipo(backup.tipo)}
                </span>
            </td>
            <td>
                <span class="backup-status status-${backup.estado}">
                    ${obtenerNombreEstado(backup.estado)}
                </span>
            </td>
            <td><code style="background: var(--gray-100); padding: 0.25rem; border-radius: 4px;">${backup.tamaño}</code></td>
            <td>${backup.duracion}</td>
            <td>${backup.ubicacion}</td>
            <td>
                <button onclick="descargarBackup(${backup.id})" class="btn btn-sm" style="background: #0ea5e9; color: white;">
                    <i class="fas fa-download"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function obtenerNombreTipo(tipo) {
    const tipos = {
        completo: 'Completo',
        incremental: 'Incremental',
        diferencial: 'Diferencial'
    };
    return tipos[tipo] || tipo;
}

function obtenerNombreEstado(estado) {
    const estados = {
        completado: 'Completado',
        fallido: 'Fallido',
        'en-progreso': 'En Progreso'
    };
    return estados[estado] || estado;
}

function formatearFecha(fecha) {
    return new Date(fecha).toLocaleDateString('es-GT');
}

function formatearHora(fecha) {
    return new Date(fecha).toLocaleTimeString('es-GT', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

function ejecutarBackupManual() {
    if (estadoBackup.activo) {
        alert('Ya hay un backup en progreso');
        return;
    }

    const tipo = document.getElementById('tipoBackup').value;
    iniciarBackup(tipo);
}

function iniciarBackup(tipo) {
    estadoBackup.activo = true;
    document.getElementById('backupProgress').style.display = 'block';
    document.getElementById('floatingStatus').style.display = 'block';

    simularProgresoBackup(tipo);
}

function simularProgresoBackup(tipo) {
    const pasos = [
        'Inicializando backup...',
        'Preparando base de datos...',
        'Exportando tablas principales...',
        'Comprimiendo archivos...',
        'Backup completado'
    ];

    let paso = 0;
    const intervalo = setInterval(() => {
        if (paso < pasos.length) {
            const progreso = ((paso + 1) / pasos.length) * 100;
            document.getElementById('progressFill').style.width = progreso + '%';
            document.getElementById('progressText').textContent = pasos[paso];
            paso++;
        } else {
            clearInterval(intervalo);
            finalizarBackup(tipo);
        }
    }, 1500);
}

function finalizarBackup(tipo) {
    estadoBackup.activo = false;
    estadoBackup.ultimoBackup = new Date();

    document.getElementById('backupProgress').style.display = 'none';
    document.getElementById('floatingStatus').style.display = 'none';

    // Agregar al historial
    const nuevoBackup = {
        id: historialBackups.length + 1,
        fecha: new Date(),
        tipo: tipo,
        estado: 'completado',
        tamaño: '52.1 MB',
        duracion: '2m 30s',
        ubicacion: 'Local + Nube'
    };

    historialBackups.unshift(nuevoBackup);

    actualizarEstadoSistema();
    cargarHistorialBackups();
    alert(`Backup ${tipo} completado exitosamente`);
}

function abrirConfiguracion() {
    document.getElementById('modalConfiguracion').style.display = 'block';
}

function cerrarModalConfiguracion() {
    document.getElementById('modalConfiguracion').style.display = 'none';
}

function guardarConfiguracion(e) {
    e.preventDefault();

    estadoBackup.configuracion.frecuencia = parseInt(document.getElementById('frecuenciaBackup').value);
    estadoBackup.configuracion.retencion = parseInt(document.getElementById('retencionDias').value);

    localStorage.setItem('backupConfig', JSON.stringify(estadoBackup.configuracion));

    cerrarModalConfiguracion();
    alert('Configuración guardada correctamente');
}

function abrirLogs() {
    const modal = document.getElementById('modalLogs');
    const container = document.getElementById('logsContainer');

    container.innerHTML = `
        <div style="color: var(--success-green);">[12:45:32] Backup incremental completado exitosamente</div>
        <div style="color: #0ea5e9;">[12:45:30] Verificando integridad de archivos...</div>
        <div style="color: #0ea5e9;">[12:44:15] Comprimiendo archivos de base de datos...</div>
        <div style="color: #0ea5e9;">[12:43:01] Exportando tabla: productos (1,234 registros)</div>
        <div style="color: #0ea5e9;">[12:42:58] Inicializando backup incremental</div>
    `;

    modal.style.display = 'block';
}

function cerrarModalLogs() {
    document.getElementById('modalLogs').style.display = 'none';
}

function descargarBackup(id) {
    alert('Descargando backup... Esta funcionalidad estará disponible en la versión de producción.');
}

function actualizarHistorial() {
    cargarHistorialBackups();
    alert('Historial actualizado');
}

function limpiarHistorialAntiguo() {
    if (confirm('¿Eliminar backups anteriores a 30 días?')) {
        alert('Backups antiguos eliminados');
    }
}

function abrirRestauracion() {
    alert('Módulo de restauración - Esta funcionalidad estará disponible en la versión de producción.');
}

// Cerrar modales al hacer clic fuera
window.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal')) {
        e.target.style.display = 'none';
    }
});
