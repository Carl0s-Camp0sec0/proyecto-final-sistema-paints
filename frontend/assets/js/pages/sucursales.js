let editandoSucursal = null;

// Inicializar página
document.addEventListener('DOMContentLoaded', function() {
    console.log('Página de sucursales cargada correctamente');
    configurarEventos();
});

// Configurar event listeners
function configurarEventos() {
    document.getElementById('formSucursal').addEventListener('submit', guardarSucursal);
}

// Abrir modal sucursal
function abrirModalSucursal() {
    editandoSucursal = null;
    document.getElementById('modalSucursalTitle').textContent = 'Nueva Sucursal';
    document.getElementById('formSucursal').reset();
    document.getElementById('sucursalId').value = '';
    document.getElementById('modalSucursal').style.display = 'block';
}

// Ver detalles de sucursal
function verDetallesSucursal(sucursalId) {
    alert(`Ver detalles de sucursal ${sucursalId} (en desarrollo)`);
}

// Editar sucursal
function editarSucursal(sucursalId) {
    alert(`Editando sucursal ${sucursalId} (en desarrollo)`);
}

// Ver inventario de sucursal
function verInventarioSucursal(sucursalId) {
    window.location.href = `/frontend/pages/productos/inventario.html?sucursal=${sucursalId}`;
}

// Sincronizar inventarios
function sincronizarInventarios() {
    if (confirm('¿Está seguro de que desea sincronizar los inventarios de todas las sucursales?')) {
        alert('Sincronización de inventarios iniciada (simulación)');
    }
}

// Ver mapa de sucursales
function verMapaSucursales() {
    window.location.href = '/frontend/pages/public/tiendas.html';
}

// Guardar sucursal
function guardarSucursal(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const sucursalData = {
        nombre: formData.get('nombre'),
        codigo: formData.get('codigo'),
        descripcion: formData.get('descripcion'),
        direccion: formData.get('direccion'),
        telefono: formData.get('telefono'),
        email: formData.get('email'),
        horario_apertura: formData.get('horario_apertura'),
        horario_cierre: formData.get('horario_cierre'),
        gerente_id: formData.get('gerente_id'),
        numero_empleados: parseInt(formData.get('numero_empleados')),
        tipo: formData.get('tipo'),
        activa: formData.get('activa') === 'true'
    };

    console.log('Datos de la sucursal:', sucursalData);
    alert(editandoSucursal ? 'Sucursal actualizada correctamente' : 'Sucursal creada correctamente');
    cerrarModal('modalSucursal');
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
