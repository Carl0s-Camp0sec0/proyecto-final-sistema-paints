let editandoCliente = null;

// Inicializar página
document.addEventListener('DOMContentLoaded', function() {
    console.log('Página de clientes cargada correctamente');
    configurarEventos();
});

// Configurar event listeners
function configurarEventos() {
    document.getElementById('formCliente').addEventListener('submit', guardarCliente);

    document.getElementById('clienteTipo').addEventListener('change', function() {
        const infoFiscal = document.getElementById('infoFiscal');
        infoFiscal.style.display = this.value === 'empresa' ? 'block' : 'none';
    });

    document.getElementById('buscarCliente').addEventListener('input', debounce(aplicarFiltros, 500));

    const filtros = ['filtroEstado', 'filtroTipo', 'filtroPromociones'];
    filtros.forEach(filtro => {
        const elemento = document.getElementById(filtro);
        if (elemento) {
            elemento.addEventListener('change', aplicarFiltros);
        }
    });
}

// Abrir modal cliente
function abrirModalCliente() {
    editandoCliente = null;
    document.getElementById('modalClienteTitle').textContent = 'Nuevo Cliente';
    document.getElementById('formCliente').reset();
    document.getElementById('clienteId').value = '';
    document.getElementById('infoFiscal').style.display = 'none';
    document.getElementById('modalCliente').style.display = 'block';
}

// Aplicar filtros
function aplicarFiltros() {
    console.log('Aplicando filtros...');
    alert('Filtros aplicados (simulación)');
}

// Limpiar filtros
function limpiarFiltros() {
    document.getElementById('buscarCliente').value = '';
    document.getElementById('filtroEstado').value = '';
    document.getElementById('filtroTipo').value = '';
    document.getElementById('filtroPromociones').value = '';
    console.log('Filtros limpiados');
}

// Guardar cliente
function guardarCliente(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const clienteData = {
        nombre: formData.get('nombre'),
        tipo: formData.get('tipo'),
        email: formData.get('email'),
        telefono: formData.get('telefono'),
        direccion: formData.get('direccion'),
        nit: formData.get('nit'),
        nombre_comercial: formData.get('nombre_comercial'),
        direccion_fiscal: formData.get('direccion_fiscal'),
        suscrito_promociones: formData.has('suscrito_promociones'),
        activo: formData.get('activo') === 'true'
    };

    console.log('Datos del cliente:', clienteData);
    alert(editandoCliente ? 'Cliente actualizado correctamente' : 'Cliente creado correctamente');
    cerrarModal('modalCliente');
}

// Funciones adicionales
function editarCliente(clienteId) {
    alert(`Editando cliente ${clienteId} (en desarrollo)`);
}

function verHistorialCliente(clienteId) {
    alert(`Ver historial del cliente ${clienteId} (en desarrollo)`);
}

function cambiarEstadoCliente(clienteId, nuevoEstado) {
    const accion = nuevoEstado ? 'activar' : 'desactivar';
    if (confirm(`¿Está seguro de que desea ${accion} este cliente?`)) {
        alert(`Cliente ${nuevoEstado ? 'activado' : 'desactivado'} correctamente`);
    }
}

function exportarClientes() {
    alert('Función de exportar en desarrollo');
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
