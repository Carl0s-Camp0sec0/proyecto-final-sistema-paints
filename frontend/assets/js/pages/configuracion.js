// Inicializar página
document.addEventListener('DOMContentLoaded', function() {
    console.log('Página de configuración cargada correctamente');
    configurarEventos();
});

// Configurar event listeners
function configurarEventos() {
    // Event listeners para los formularios de cada tab
    document.getElementById('formGeneral').addEventListener('submit', function(e) {
        e.preventDefault();
        guardarConfiguracion('general');
    });

    document.getElementById('formEmpresa').addEventListener('submit', function(e) {
        e.preventDefault();
        guardarConfiguracion('empresa');
    });

    document.getElementById('formSistema').addEventListener('submit', function(e) {
        e.preventDefault();
        guardarConfiguracion('sistema');
    });

    document.getElementById('formNotificaciones').addEventListener('submit', function(e) {
        e.preventDefault();
        guardarConfiguracion('notificaciones');
    });

    document.getElementById('formSeguridad').addEventListener('submit', function(e) {
        e.preventDefault();
        guardarConfiguracion('seguridad');
    });
}

// Mostrar tab
function mostrarTab(tabName) {
    // Ocultar todos los tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });

    // Desactivar todos los botones
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Mostrar el tab seleccionado
    document.getElementById(`tab-${tabName}`).classList.add('active');
    event.target.classList.add('active');
}

// Guardar configuración específica
function guardarConfiguracion(tipo) {
    console.log(`Guardando configuración de ${tipo}...`);

    // Aquí iría la lógica para enviar al backend

    alert(`Configuración de ${tipo} guardada correctamente`);
}

// Guardar todas las configuraciones
function guardarConfiguraciones() {
    if (confirm('¿Está seguro de que desea guardar todas las configuraciones?')) {
        console.log('Guardando todas las configuraciones...');
        alert('Todas las configuraciones han sido guardadas correctamente');
    }
}

// Restaurar valores por defecto
function restaurarDefecto() {
    if (confirm('¿Está seguro de que desea restaurar los valores por defecto? Esta acción no se puede deshacer.')) {
        console.log('Restaurando configuraciones por defecto...');
        location.reload(); // Simular restauración
    }
}

// Exportar configuración
function exportarConfiguracion() {
    alert('Exportando configuración del sistema... (en desarrollo)');
}

// Probar configuración de email
function probarEmail() {
    alert('Enviando email de prueba... (en desarrollo)');
}

// Logout
function logout() {
    if (confirm('¿Está seguro de que desea cerrar sesión?')) {
        window.location.href = '/frontend/pages/public/login.html';
    }
}
