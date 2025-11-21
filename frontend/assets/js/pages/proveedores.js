// Estado global
let proveedores = [];
let proveedoresFiltrados = [];
let paginaActual = 1;
let registrosPorPagina = 10;
let productosTemp = [];

// Proveedores de ejemplo
const proveedoresEjemplo = [
    {
        id: 1,
        codigo: 'PROV-001',
        nombre_empresa: 'Pinturas Sherwin Williams Guatemala',
        nombre_contacto: 'Carlos Méndez',
        telefono: '2234-5678',
        email: 'carlos.mendez@sherwin.com.gt',
        direccion: '12 Calle 1-25, Zona 10, Ciudad de Guatemala',
        ciudad: 'Ciudad de Guatemala',
        pais: 'Guatemala',
        nit: '12345678-9',
        categoria: 'pinturas',
        estado: 'activo',
        calificacion: 5,
        dias_credito: 30,
        fecha_registro: new Date('2024-01-15'),
        ultimo_pedido: new Date('2024-11-10'),
        productos: ['Pintura Base Agua', 'Pintura Base Aceite', 'Primers', 'Barnices'],
        notas: 'Proveedor principal de pinturas premium. Excelente calidad y servicio.'
    },
    {
        id: 2,
        codigo: 'PROV-002',
        nombre_empresa: 'Distribuidora Comex S.A.',
        nombre_contacto: 'María González',
        telefono: '2456-7890',
        email: 'maria.gonzalez@comex.com.gt',
        direccion: 'Av. Petapa 45-67, Zona 12, Ciudad de Guatemala',
        ciudad: 'Ciudad de Guatemala',
        pais: 'Guatemala',
        nit: '87654321-0',
        categoria: 'pinturas',
        estado: 'activo',
        calificacion: 4,
        dias_credito: 45,
        fecha_registro: new Date('2024-02-20'),
        ultimo_pedido: new Date('2024-11-08'),
        productos: ['Pinturas Vinílicas', 'Esmaltes', 'Impermeabilizantes', 'Selladores'],
        notas: 'Buen surtido de productos. Precios competitivos.'
    },
    {
        id: 3,
        codigo: 'PROV-003',
        nombre_empresa: 'Solventes Industriales López',
        nombre_contacto: 'Roberto López',
        telefono: '2567-8901',
        email: 'ventas@solventeslopez.com',
        direccion: 'Boulevard Liberación 23-45, Villa Nueva',
        ciudad: 'Villa Nueva',
        pais: 'Guatemala',
        nit: '11223344-5',
        categoria: 'solventes',
        estado: 'activo',
        calificacion: 4,
        dias_credito: 15,
        fecha_registro: new Date('2024-03-10'),
        ultimo_pedido: new Date('2024-11-05'),
        productos: ['Aguarrás', 'Thinner', 'Solvente Universal', 'Alcohol'],
        notas: 'Especialistas en solventes. Entrega rápida.'
    },
    {
        id: 4,
        codigo: 'PROV-004',
        nombre_empresa: 'Accesorios Profesionales S.A.',
        nombre_contacto: 'Ana Rodríguez',
        telefono: '2678-9012',
        email: 'ana@accesoriospro.com',
        direccion: 'Calzada Roosevelt 67-89, Zona 11',
        ciudad: 'Mixco',
        pais: 'Guatemala',
        nit: '55667788-9',
        categoria: 'accesorios',
        estado: 'suspendido',
        calificacion: 2,
        dias_credito: 0,
        fecha_registro: new Date('2024-04-05'),
        ultimo_pedido: new Date('2024-09-15'),
        productos: ['Brochas', 'Rodillos', 'Bandejas', 'Espátulas'],
        notas: 'Suspendido por retrasos en entregas. Evaluar reactivación.'
    },
    {
        id: 5,
        codigo: 'PROV-005',
        nombre_empresa: 'Herramientas Industriales GT',
        nombre_contacto: 'Luis Morales',
        telefono: '2789-0123',
        email: 'luis@herramientasgt.com',
        direccion: 'Anillo Periférico 12-34, Zona 8',
        ciudad: 'Ciudad de Guatemala',
        pais: 'Guatemala',
        nit: '99887766-5',
        categoria: 'herramientas',
        estado: 'activo',
        calificacion: 5,
        dias_credito: 60,
        fecha_registro: new Date('2024-05-20'),
        ultimo_pedido: new Date('2024-11-12'),
        productos: ['Compresores', 'Pistolas de Pintura', 'Lijadoras', 'Equipos de Protección'],
        notas: 'Excelente para herramientas profesionales. Servicio técnico incluido.'
    }
];

// Inicializar página
document.addEventListener('DOMContentLoaded', function() {
    proveedores = [...proveedoresEjemplo];
    aplicarFiltros();
    configurarEventos();
    actualizarEstadisticas();
});

function configurarEventos() {
    // Eventos principales
    document.getElementById('btnNuevoProveedor').addEventListener('click', () => abrirModalProveedor());
    document.getElementById('btnExportar').addEventListener('click', exportarProveedores);
    document.getElementById('btnAplicarFiltros').addEventListener('click', aplicarFiltros);
    document.getElementById('btnLimpiarFiltros').addEventListener('click', limpiarFiltros);
    document.getElementById('formProveedor').addEventListener('submit', guardarProveedor);
    document.getElementById('registrosPorPagina').addEventListener('change', function() {
        registrosPorPagina = parseInt(this.value);
        paginaActual = 1;
        mostrarProveedores();
        generarPaginacion();
    });

    // Filtros en tiempo real
    document.getElementById('filtroNombre').addEventListener('input', aplicarFiltros);
}

function aplicarFiltros() {
    const filtroNombre = document.getElementById('filtroNombre').value.toLowerCase();
    const filtroEstado = document.getElementById('filtroEstado').value;
    const filtroCategoria = document.getElementById('filtroCategoria').value;
    const filtroCalificacion = document.getElementById('filtroCalificacion').value;

    proveedoresFiltrados = proveedores.filter(proveedor => {
        // Filtro por nombre
        if (filtroNombre &&
            !proveedor.nombre_empresa.toLowerCase().includes(filtroNombre) &&
            !proveedor.nombre_contacto.toLowerCase().includes(filtroNombre) &&
            !proveedor.codigo.toLowerCase().includes(filtroNombre)) {
            return false;
        }

        // Filtro por estado
        if (filtroEstado && proveedor.estado !== filtroEstado) return false;

        // Filtro por categoría
        if (filtroCategoria && proveedor.categoria !== filtroCategoria) return false;

        // Filtro por calificación
        if (filtroCalificacion && proveedor.calificacion < parseInt(filtroCalificacion)) return false;

        return true;
    });

    paginaActual = 1;
    mostrarProveedores();
    generarPaginacion();
    actualizarEstadisticas();
}

function limpiarFiltros() {
    document.getElementById('filtroNombre').value = '';
    document.getElementById('filtroEstado').value = '';
    document.getElementById('filtroCategoria').value = '';
    document.getElementById('filtroCalificacion').value = '';
    aplicarFiltros();
}

function mostrarProveedores() {
    const tbody = document.getElementById('tablaBody');
    const estadoVacio = document.getElementById('estadoVacio');
    const tablaContainer = document.getElementById('tablaContainer');

    if (proveedoresFiltrados.length === 0) {
        tablaContainer.style.display = 'none';
        estadoVacio.style.display = 'block';
        return;
    }

    tablaContainer.style.display = 'block';
    estadoVacio.style.display = 'none';

    // Calcular índices para paginación
    const inicio = (paginaActual - 1) * registrosPorPagina;
    const fin = inicio + registrosPorPagina;
    const proveedoresPagina = proveedoresFiltrados.slice(inicio, fin);

    tbody.innerHTML = proveedoresPagina.map(proveedor => `
        <tr>
            <td><strong>${proveedor.codigo}</strong></td>
            <td>
                <div><strong>${proveedor.nombre_empresa}</strong></div>
                <small class="text-muted">${proveedor.nombre_contacto}</small>
            </td>
            <td>
                <div><i class="fas fa-phone"></i> ${proveedor.telefono}</div>
                <small><i class="fas fa-envelope"></i> ${proveedor.email}</small>
            </td>
            <td>
                <span class="badge-categoria categoria-${proveedor.categoria}">
                    ${obtenerNombreCategoria(proveedor.categoria)}
                </span>
            </td>
            <td>
                <span class="status-badge status-${proveedor.estado}">
                    ${obtenerNombreEstado(proveedor.estado)}
                </span>
            </td>
            <td>
                <div class="rating">
                    ${generarEstrellas(proveedor.calificacion)}
                </div>
            </td>
            <td>${proveedor.productos.length} productos</td>
            <td>${formatearFecha(proveedor.ultimo_pedido)}</td>
            <td class="actions-cell">
                <button class="btn-action btn-view" onclick="verDetalles(${proveedor.id})"
                        title="Ver detalles">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn-action btn-edit" onclick="editarProveedor(${proveedor.id})"
                        title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-action btn-orders" onclick="verPedidos(${proveedor.id})"
                        title="Ver pedidos">
                    <i class="fas fa-shopping-cart"></i>
                </button>
                <button class="btn-action btn-delete" onclick="eliminarProveedor(${proveedor.id})"
                        title="Eliminar">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function obtenerNombreCategoria(categoria) {
    const categorias = {
        pinturas: 'Pinturas',
        solventes: 'Solventes',
        accesorios: 'Accesorios',
        herramientas: 'Herramientas',
        materiales: 'Materiales'
    };
    return categorias[categoria] || categoria;
}

function obtenerNombreEstado(estado) {
    const estados = {
        activo: 'Activo',
        inactivo: 'Inactivo',
        suspendido: 'Suspendido'
    };
    return estados[estado] || estado;
}

function generarEstrellas(calificacion) {
    let html = '';
    for (let i = 1; i <= 5; i++) {
        html += i <= calificacion ?
            '<i class="fas fa-star"></i>' :
            '<i class="far fa-star"></i>';
    }
    return html;
}

function formatearFecha(fecha) {
    return new Date(fecha).toLocaleDateString('es-GT');
}

function generarPaginacion() {
    const paginacion = document.getElementById('paginacion');
    const totalPaginas = Math.ceil(proveedoresFiltrados.length / registrosPorPagina);

    if (totalPaginas <= 1) {
        paginacion.innerHTML = '';
        return;
    }

    let html = '';

    // Botón anterior
    if (paginaActual > 1) {
        html += `<button class="page-btn" onclick="cambiarPagina(${paginaActual - 1})">
            <i class="fas fa-chevron-left"></i>
        </button>`;
    }

    // Números de página
    for (let i = 1; i <= totalPaginas; i++) {
        html += `<button class="page-btn ${i === paginaActual ? 'active' : ''}"
                 onclick="cambiarPagina(${i})">${i}</button>`;
    }

    // Botón siguiente
    if (paginaActual < totalPaginas) {
        html += `<button class="page-btn" onclick="cambiarPagina(${paginaActual + 1})">
            <i class="fas fa-chevron-right"></i>
        </button>`;
    }

    paginacion.innerHTML = html;
}

function cambiarPagina(nuevaPagina) {
    paginaActual = nuevaPagina;
    mostrarProveedores();
    generarPaginacion();
}

function actualizarEstadisticas() {
    const total = proveedores.length;
    const activos = proveedores.filter(p => p.estado === 'activo').length;
    const inactivos = proveedores.filter(p => p.estado === 'inactivo').length;
    const pedidosPendientes = Math.floor(Math.random() * 15) + 5; // Simular

    document.getElementById('totalProveedores').textContent = total;
    document.getElementById('proveedoresActivos').textContent = activos;
    document.getElementById('proveedoresInactivos').textContent = inactivos;
    document.getElementById('pedidosPendientes').textContent = pedidosPendientes;
}

function abrirModalProveedor(id = null) {
    const modal = document.getElementById('modalProveedor');
    const titulo = document.getElementById('modalTitulo');
    const form = document.getElementById('formProveedor');

    productosTemp = [];

    if (id) {
        titulo.textContent = 'Editar Proveedor';
        const proveedor = proveedores.find(p => p.id === id);
        llenarFormulario(proveedor);
    } else {
        titulo.textContent = 'Nuevo Proveedor';
        form.reset();
        document.getElementById('proveedorId').value = '';
        generarNuevoCodigo();
    }

    actualizarProductosGrid();
    modal.style.display = 'block';
}

function llenarFormulario(proveedor) {
    document.getElementById('proveedorId').value = proveedor.id;
    document.getElementById('codigo').value = proveedor.codigo;
    document.getElementById('nombre_empresa').value = proveedor.nombre_empresa;
    document.getElementById('nombre_contacto').value = proveedor.nombre_contacto;
    document.getElementById('telefono').value = proveedor.telefono;
    document.getElementById('email').value = proveedor.email;
    document.getElementById('direccion').value = proveedor.direccion;
    document.getElementById('ciudad').value = proveedor.ciudad;
    document.getElementById('pais').value = proveedor.pais;
    document.getElementById('nit').value = proveedor.nit;
    document.getElementById('categoria').value = proveedor.categoria;
    document.getElementById('estado').value = proveedor.estado;
    document.getElementById('calificacion').value = proveedor.calificacion;
    document.getElementById('dias_credito').value = proveedor.dias_credito;
    document.getElementById('notas').value = proveedor.notas;

    productosTemp = [...proveedor.productos];
}

function generarNuevoCodigo() {
    const siguienteNumero = proveedores.length + 1;
    const codigo = `PROV-${siguienteNumero.toString().padStart(3, '0')}`;
    document.getElementById('codigo').value = codigo;
}

function agregarProducto() {
    const input = document.getElementById('nuevo_producto');
    const producto = input.value.trim();

    if (producto && !productosTemp.includes(producto)) {
        productosTemp.push(producto);
        input.value = '';
        actualizarProductosGrid();
    }
}

function eliminarProducto(index) {
    productosTemp.splice(index, 1);
    actualizarProductosGrid();
}

function actualizarProductosGrid() {
    const grid = document.getElementById('productosGrid');

    if (productosTemp.length === 0) {
        grid.innerHTML = '<p class="text-muted">No hay productos agregados</p>';
        return;
    }

    grid.innerHTML = productosTemp.map((producto, index) => `
        <div class="producto-item">
            <span>${producto}</span>
            <button type="button" onclick="eliminarProducto(${index})"
                    style="float: right; background: var(--error-red); color: white; border: none; border-radius: 4px; padding: 0.25rem 0.5rem; cursor: pointer;">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `).join('');
}

function guardarProveedor(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    const id = document.getElementById('proveedorId').value;

    data.productos = productosTemp;
    data.calificacion = parseInt(data.calificacion);
    data.dias_credito = parseInt(data.dias_credito) || 0;

    if (id) {
        // Actualizar proveedor existente
        const index = proveedores.findIndex(p => p.id === parseInt(id));
        proveedores[index] = { ...proveedores[index], ...data };
        mostrarMensaje('Proveedor actualizado correctamente', 'success');
    } else {
        // Nuevo proveedor
        const nuevoId = Math.max(...proveedores.map(p => p.id)) + 1;
        data.id = nuevoId;
        data.fecha_registro = new Date();
        data.ultimo_pedido = new Date();
        proveedores.push(data);
        mostrarMensaje('Proveedor creado correctamente', 'success');
    }

    cerrarModal();
    aplicarFiltros();
    actualizarEstadisticas();
}

function editarProveedor(id) {
    abrirModalProveedor(id);
}

function eliminarProveedor(id) {
    if (confirm('¿Está seguro que desea eliminar este proveedor?')) {
        const index = proveedores.findIndex(p => p.id === id);
        proveedores.splice(index, 1);
        aplicarFiltros();
        actualizarEstadisticas();
        mostrarMensaje('Proveedor eliminado correctamente', 'success');
    }
}

function verDetalles(id) {
    const proveedor = proveedores.find(p => p.id === id);
    const modal = document.getElementById('modalDetalles');
    const content = document.getElementById('detallesContent');

    content.innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
            <div>
                <h4>Información General</h4>
                <p><strong>Código:</strong> ${proveedor.codigo}</p>
                <p><strong>Empresa:</strong> ${proveedor.nombre_empresa}</p>
                <p><strong>Contacto:</strong> ${proveedor.nombre_contacto}</p>
                <p><strong>Teléfono:</strong> ${proveedor.telefono}</p>
                <p><strong>Email:</strong> ${proveedor.email}</p>
                <p><strong>Categoría:</strong> ${obtenerNombreCategoria(proveedor.categoria)}</p>
                <p><strong>Estado:</strong> <span class="status-badge status-${proveedor.estado}">${obtenerNombreEstado(proveedor.estado)}</span></p>
                <p><strong>Calificación:</strong> <span class="rating">${generarEstrellas(proveedor.calificacion)}</span></p>
            </div>
            <div>
                <h4>Información Comercial</h4>
                <p><strong>NIT:</strong> ${proveedor.nit}</p>
                <p><strong>Días de Crédito:</strong> ${proveedor.dias_credito}</p>
                <p><strong>Fecha de Registro:</strong> ${formatearFecha(proveedor.fecha_registro)}</p>
                <p><strong>Último Pedido:</strong> ${formatearFecha(proveedor.ultimo_pedido)}</p>
                <h4>Ubicación</h4>
                <p><strong>Dirección:</strong> ${proveedor.direccion}</p>
                <p><strong>Ciudad:</strong> ${proveedor.ciudad}</p>
                <p><strong>País:</strong> ${proveedor.pais}</p>
            </div>
        </div>
        <div style="margin-top: 2rem;">
            <h4>Productos Suministrados</h4>
            <div class="productos-grid">
                ${proveedor.productos.map(producto => `
                    <div class="producto-item">${producto}</div>
                `).join('')}
            </div>
        </div>
        ${proveedor.notas ? `
        <div style="margin-top: 2rem;">
            <h4>Notas Adicionales</h4>
            <p>${proveedor.notas}</p>
        </div>` : ''}
    `;

    modal.style.display = 'block';
}

function verPedidos(id) {
    // Funcionalidad para ver pedidos del proveedor
    alert('Funcionalidad de pedidos será implementada próximamente');
}

function exportarProveedores() {
    // Funcionalidad para exportar proveedores
    const csv = convertirACSV();
    descargarCSV(csv, 'proveedores.csv');
    mostrarMensaje('Proveedores exportados correctamente', 'success');
}

function convertirACSV() {
    const headers = ['Código', 'Empresa', 'Contacto', 'Teléfono', 'Email', 'Categoría', 'Estado', 'Calificación'];
    const rows = proveedoresFiltrados.map(p => [
        p.codigo,
        p.nombre_empresa,
        p.nombre_contacto,
        p.telefono,
        p.email,
        obtenerNombreCategoria(p.categoria),
        obtenerNombreEstado(p.estado),
        p.calificacion
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
}

function descargarCSV(csv, filename) {
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
}

function cerrarModal() {
    document.getElementById('modalProveedor').style.display = 'none';
}

function cerrarModalDetalles() {
    document.getElementById('modalDetalles').style.display = 'none';
}

function mostrarMensaje(mensaje, tipo = 'info') {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        top: 2rem;
        right: 2rem;
        padding: 1rem 2rem;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        animation: slideInRight 0.3s ease-out;
        background: ${tipo === 'success' ? 'var(--success-green)' :
                   tipo === 'error' ? 'var(--error-red)' : 'var(--info-color)'};
    `;
    toast.textContent = mensaje;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Cerrar modales al hacer clic fuera
window.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal')) {
        e.target.style.display = 'none';
    }
});

// Exportar funciones globales
window.abrirModalProveedor = abrirModalProveedor;
window.agregarProducto = agregarProducto;
window.eliminarProducto = eliminarProducto;
window.cambiarPagina = cambiarPagina;
window.verDetalles = verDetalles;
window.editarProveedor = editarProveedor;
window.eliminarProveedor = eliminarProveedor;
window.verPedidos = verPedidos;
window.cerrarModal = cerrarModal;
window.cerrarModalDetalles = cerrarModalDetalles;
