let editandoMarca = null;

// Inicializar página
document.addEventListener('DOMContentLoaded', function() {
    console.log('Página de marcas cargada correctamente');
    configurarEventos();
});

// Configurar event listeners
function configurarEventos() {
    document.getElementById('formMarca').addEventListener('submit', guardarMarca);
    document.getElementById('buscarMarca').addEventListener('input', debounce(aplicarFiltros, 500));

    const filtros = ['filtroEstado', 'filtroPais'];
    filtros.forEach(filtro => {
        const elemento = document.getElementById(filtro);
        if (elemento) {
            elemento.addEventListener('change', aplicarFiltros);
        }
    });
}

// Abrir modal marca
function abrirModalMarca() {
    editandoMarca = null;
    document.getElementById('modalMarcaTitle').textContent = 'Nueva Marca';
    document.getElementById('formMarca').reset();
    document.getElementById('marcaId').value = '';
    document.getElementById('modalMarca').style.display = 'block';
}

// Aplicar filtros
function aplicarFiltros() {
    console.log('Aplicando filtros...');
    alert('Filtros aplicados (simulación)');
}

// Limpiar filtros
function limpiarFiltros() {
    document.getElementById('buscarMarca').value = '';
    document.getElementById('filtroEstado').value = '';
    document.getElementById('filtroPais').value = '';
    console.log('Filtros limpiados');
}

// Guardar marca
function guardarMarca(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const marcaData = {
        nombre: formData.get('nombre'),
        descripcion: formData.get('descripcion'),
        pais: formData.get('pais'),
        sitio_web: formData.get('sitio_web'),
        activa: formData.get('activa') === 'true'
    };

    console.log('Datos de la marca:', marcaData);
    alert(editandoMarca ? 'Marca actualizada correctamente' : 'Marca creada correctamente');
    cerrarModal('modalMarca');
}

// Ver detalles de marca
function verDetallesMarca(marcaId) {
    alert(`Ver detalles de marca ${marcaId} (en desarrollo)`);
}

// Editar marca
function editarMarca(marcaId) {
    alert(`Editando marca ${marcaId} (en desarrollo)`);
}

// Cambiar estado de marca
function cambiarEstadoMarca(marcaId, nuevoEstado) {
    const accion = nuevoEstado ? 'activar' : 'desactivar';
    if (confirm(`¿Está seguro de que desea ${accion} esta marca?`)) {
        alert(`Marca ${nuevoEstado ? 'activada' : 'desactivada'} correctamente`);
    }
}

// Exportar marcas
function exportarMarcas() {
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

// Exponer funciones globalmente
window.abrirModalMarca = abrirModalMarca;
window.aplicarFiltros = aplicarFiltros;
window.limpiarFiltros = limpiarFiltros;
window.verDetallesMarca = verDetallesMarca;
window.editarMarca = editarMarca;
window.cambiarEstadoMarca = cambiarEstadoMarca;
window.exportarMarcas = exportarMarcas;
window.cerrarModal = cerrarModal;
window.logout = logout;
