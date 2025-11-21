// Estado global de la cotización
let cotizacionState = {
    cliente: {},
    productos: [],
    subtotal: 0,
    iva: 0,
    total: 0
};

// Productos de ejemplo
const productosEjemplo = [
    {
        id: 1,
        nombre: "Pintura Base Agua Blanca",
        marca: "Sherwin Williams",
        categoria: "pinturas",
        precio: 125.00,
        unidad: "Galón",
        color: "Blanco",
        descripcion: "Pintura de alta calidad base agua"
    },
    {
        id: 2,
        nombre: "Solvente Limpiador",
        marca: "Comex",
        categoria: "solventes",
        precio: 35.50,
        unidad: "1/4 Galón",
        descripcion: "Solvente para limpieza de herramientas"
    },
    {
        id: 3,
        nombre: "Brocha Professional 4\"",
        marca: "Purdy",
        categoria: "accesorios",
        precio: 85.00,
        unidad: "Pieza",
        descripcion: "Brocha profesional para acabados finos"
    },
    {
        id: 4,
        nombre: "Rodillo Antigoteo 9\"",
        marca: "Wooster",
        categoria: "accesorios",
        precio: 45.00,
        unidad: "Pieza",
        descripcion: "Rodillo de alta absorción"
    },
    {
        id: 5,
        nombre: "Pintura Base Aceite Azul",
        marca: "Benjamin Moore",
        categoria: "pinturas",
        precio: 180.00,
        unidad: "Galón",
        color: "Azul Marino",
        descripcion: "Pintura durable para exteriores"
    }
];

// Inicializar página
document.addEventListener('DOMContentLoaded', function() {
    cargarProductos();
    configurarEventos();
});

function cargarProductos(filtroCategoria = '', busqueda = '') {
    const grid = document.getElementById('productosGrid');
    let productos = productosEjemplo;

    // Aplicar filtros
    if (filtroCategoria) {
        productos = productos.filter(p => p.categoria === filtroCategoria);
    }
    if (busqueda) {
        productos = productos.filter(p =>
            p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
            p.marca.toLowerCase().includes(busqueda.toLowerCase())
        );
    }

    grid.innerHTML = productos.map(producto => `
        <div class="producto-card" data-producto-id="${producto.id}">
            <h4>${producto.nombre}</h4>
            <p><strong>Marca:</strong> ${producto.marca}</p>
            ${producto.color ? `<p><strong>Color:</strong> ${producto.color}</p>` : ''}
            <p><strong>Precio:</strong> Q ${producto.precio.toFixed(2)} / ${producto.unidad}</p>
            <p class="text-muted">${producto.descripcion}</p>
            <div style="margin-top: 1rem;">
                <label>Cantidad:</label>
                <input type="number" min="1" value="1" class="cantidad-input form-input"
                       data-producto-id="${producto.id}">
                <button type="button" class="btn btn-sm btn-primary"
                        onclick="agregarProducto(${producto.id})">
                    <i class="fas fa-plus"></i> Agregar
                </button>
            </div>
        </div>
    `).join('');
}

function configurarEventos() {
    // Filtros
    document.getElementById('categoria_filter').addEventListener('change', function() {
        const categoria = this.value;
        const busqueda = document.getElementById('buscar_producto').value;
        cargarProductos(categoria, busqueda);
    });

    document.getElementById('buscar_producto').addEventListener('input', function() {
        const busqueda = this.value;
        const categoria = document.getElementById('categoria_filter').value;
        cargarProductos(categoria, busqueda);
    });
}

function agregarProducto(productoId) {
    const producto = productosEjemplo.find(p => p.id === productoId);
    const cantidadInput = document.querySelector(`input[data-producto-id="${productoId}"]`);
    const cantidad = parseInt(cantidadInput.value);

    // Verificar si ya existe el producto
    const existeIndex = cotizacionState.productos.findIndex(p => p.id === productoId);

    if (existeIndex > -1) {
        cotizacionState.productos[existeIndex].cantidad += cantidad;
        cotizacionState.productos[existeIndex].subtotal = cotizacionState.productos[existeIndex].precio * cotizacionState.productos[existeIndex].cantidad;
    } else {
        cotizacionState.productos.push({
            ...producto,
            cantidad: cantidad,
            subtotal: producto.precio * cantidad
        });
    }

    actualizarVistaProductos();
    calcularTotales();
}

function removerProducto(productoId) {
    cotizacionState.productos = cotizacionState.productos.filter(p => p.id !== productoId);
    actualizarVistaProductos();
    calcularTotales();
}

function actualizarVistaProductos() {
    const container = document.getElementById('productosSeleccionados');

    if (cotizacionState.productos.length === 0) {
        container.innerHTML = '<p class="text-muted">No hay productos seleccionados</p>';
        return;
    }

    container.innerHTML = cotizacionState.productos.map(producto => `
        <div class="item-seleccionado">
            <div>
                <strong>${producto.nombre}</strong><br>
                <small>${producto.marca} - Q ${producto.precio.toFixed(2)}/${producto.unidad}</small>
            </div>
            <div style="text-align: right;">
                <div>Cantidad: ${producto.cantidad}</div>
                <div><strong>Q ${producto.subtotal.toFixed(2)}</strong></div>
                <button class="btn btn-danger btn-sm" onclick="removerProducto(${producto.id})" style="margin-top: 0.5rem;">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function calcularTotales() {
    cotizacionState.subtotal = cotizacionState.productos.reduce((sum, p) => sum + p.subtotal, 0);
    cotizacionState.iva = cotizacionState.subtotal * 0.12;
    cotizacionState.total = cotizacionState.subtotal + cotizacionState.iva;

    document.getElementById('subtotal').textContent = `Q ${cotizacionState.subtotal.toFixed(2)}`;
    document.getElementById('iva').textContent = `Q ${cotizacionState.iva.toFixed(2)}`;
    document.getElementById('total').textContent = `Q ${cotizacionState.total.toFixed(2)}`;
}

function generarCotizacionPDF() {
    // Validar datos del cliente
    const nombre = document.getElementById('cliente_nombre').value.trim();
    const telefono = document.getElementById('cliente_telefono').value.trim();

    if (!nombre || !telefono) {
        alert('Por favor complete los datos del cliente (nombre y teléfono son obligatorios)');
        return;
    }

    if (cotizacionState.productos.length === 0) {
        alert('Por favor seleccione al menos un producto');
        return;
    }

    // Crear PDF
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Header del PDF
    doc.setFillColor(37, 99, 235);
    doc.rect(0, 0, 210, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.text('PAINTS', 20, 25);
    doc.setFontSize(12);
    doc.text('Sistema de Gestión para Cadena de Pinturas', 20, 32);

    // Información de la cotización
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(18);
    doc.text('COTIZACIÓN', 140, 60);

    const fecha = new Date().toLocaleDateString('es-GT');
    doc.setFontSize(10);
    doc.text(`Fecha: ${fecha}`, 140, 70);
    doc.text(`Cotización No: COT-${Date.now()}`, 140, 75);

    // Datos del cliente
    doc.setFontSize(14);
    doc.text('DATOS DEL CLIENTE', 20, 60);
    doc.setFontSize(10);
    doc.text(`Nombre: ${document.getElementById('cliente_nombre').value}`, 20, 70);
    const empresa = document.getElementById('cliente_empresa').value;
    if (empresa) doc.text(`Empresa: ${empresa}`, 20, 75);
    doc.text(`Teléfono: ${document.getElementById('cliente_telefono').value}`, 20, 80);
    const email = document.getElementById('cliente_email').value;
    if (email) doc.text(`Email: ${email}`, 20, 85);

    // Tabla de productos
    const tableData = cotizacionState.productos.map(producto => [
        producto.nombre,
        producto.marca,
        `Q ${producto.precio.toFixed(2)}`,
        producto.cantidad.toString(),
        `Q ${producto.subtotal.toFixed(2)}`
    ]);

    doc.autoTable({
        head: [['Producto', 'Marca', 'Precio Unit.', 'Cantidad', 'Subtotal']],
        body: tableData,
        startY: 100,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [37, 99, 235] }
    });

    // Totales
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.text(`Subtotal: Q ${cotizacionState.subtotal.toFixed(2)}`, 140, finalY);
    doc.text(`IVA (12%): Q ${cotizacionState.iva.toFixed(2)}`, 140, finalY + 5);
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text(`TOTAL: Q ${cotizacionState.total.toFixed(2)}`, 140, finalY + 15);

    // Footer
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.text('Esta cotización es válida por 15 días a partir de la fecha de emisión', 20, 280);
    doc.text('Gracias por preferirnos - PAINTS', 20, 285);

    // Descargar PDF
    const nombreArchivo = `cotizacion_${nombre.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
    doc.save(nombreArchivo);
}

function enviarCotizacion() {
    alert('Funcionalidad de envío por email será implementada próximamente');
}

function limpiarCotizacion() {
    if (confirm('¿Está seguro que desea limpiar toda la cotización?')) {
        document.getElementById('cliente_nombre').value = '';
        document.getElementById('cliente_empresa').value = '';
        document.getElementById('cliente_telefono').value = '';
        document.getElementById('cliente_email').value = '';
        cotizacionState = {
            cliente: {},
            productos: [],
            subtotal: 0,
            iva: 0,
            total: 0
        };
        actualizarVistaProductos();
        calcularTotales();
    }
}
