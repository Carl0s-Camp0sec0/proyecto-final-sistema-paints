/* ======================================================
   REPORTE DE PRODUCTOS - Sistema Paints
   Reportes: 2) Productos que más dinero generan
             3) Productos más vendidos por cantidad
             5) Productos con menos ventas
   ====================================================== */

// Verificar autenticación
if (!auth.isAuthenticated()) {
    window.location.href = '/frontend/pages/public/login.html';
}

// Verificar permisos (solo Gerente y Admin)
if (!auth.hasPermission([CONFIG.ROLES.ADMIN, CONFIG.ROLES.GERENTE])) {
    Utils.showToast('No tienes permisos para acceder a reportes', 'error');
    window.location.href = '/frontend/pages/admin/dashboard.html';
}

// Variables globales
let datosReporte = null;
let datosProductosCompleto = null;
let datosTopProductos = [];
let datosMenosVendidos = [];
let filtrosActuales = {};

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    inicializarReporte();
    configurarEventos();
});

/* ==================== INICIALIZACIÓN ==================== */

function inicializarReporte() {
    cargarDatosUsuario();
    cargarFiltros();

    // Cargar reporte automáticamente después de un breve delay
    setTimeout(() => {
        generarReporte();
    }, 500);
}

function cargarDatosUsuario() {
    const userAvatar = document.querySelector('.user-avatar');
    const userName = document.querySelector('.user-info div:first-child');

    if (userAvatar) userAvatar.textContent = auth.getUserInitials();
    if (userName) userName.textContent = auth.user.nombre_completo;
}

async function cargarFiltros() {
    try {
        // Cargar categorías
        const categoriasResponse = await api.get('/sistema/categorias');

        if (categoriasResponse && categoriasResponse.success && categoriasResponse.data && categoriasResponse.data.categorias) {
            const categorias = categoriasResponse.data.categorias;

            if (Array.isArray(categorias)) {
                const selectCategoria = document.getElementById('selectCategoria');
                if (selectCategoria) {
                    selectCategoria.innerHTML = '<option value="">Todas las Categorías</option>';
                    categorias.forEach(cat => {
                        const option = document.createElement('option');
                        option.value = cat.id;
                        option.textContent = cat.nombre;
                        selectCategoria.appendChild(option);
                    });
                }
            }
        }

        // Cargar marcas (desde productos)
        await cargarMarcas();

    } catch (error) {
        console.error('Error al cargar filtros:', error);
    }
}

async function cargarMarcas() {
    try {
        // Obtener marcas únicas desde productos
        const response = await api.get('/productos/marcas');

        if (response && response.success && response.data) {
            const marcas = response.data.marcas || [];
            const selectMarca = document.getElementById('selectMarca');

            if (selectMarca) {
                selectMarca.innerHTML = '<option value="">Todas las Marcas</option>';
                marcas.forEach(marca => {
                    const option = document.createElement('option');
                    option.value = marca;
                    option.textContent = marca;
                    selectMarca.appendChild(option);
                });
            }
        }
    } catch (error) {
        console.error('Error al cargar marcas:', error);
    }
}

function configurarEventos() {
    // Botón aplicar filtros
    const btnAplicar = document.getElementById('btnAplicarFiltros');
    if (btnAplicar) {
        btnAplicar.addEventListener('click', generarReporte);
    }

    // Botón limpiar filtros
    const btnLimpiar = document.getElementById('btnLimpiarFiltros');
    if (btnLimpiar) {
        btnLimpiar.addEventListener('click', limpiarFiltros);
    }

    // Botón exportar PDF
    const btnExportarPDF = document.getElementById('btnExportarPDF');
    if (btnExportarPDF) {
        btnExportarPDF.addEventListener('click', exportarPDF);
    }

    // Botón exportar Excel
    const btnExportarExcel = document.getElementById('btnExportarExcel');
    if (btnExportarExcel) {
        btnExportarExcel.addEventListener('click', exportarExcel);
    }

    // Campo de búsqueda - búsqueda en tiempo real
    const inputBuscar = document.getElementById('inputBuscar');
    if (inputBuscar) {
        inputBuscar.addEventListener('input', aplicarBusquedaLocal);
    }

    // Evento del botón logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            logout();
        });
    }
}

/* ==================== GENERAR REPORTE ==================== */

async function generarReporte() {
    try {
        mostrarLoading(true);

        // Obtener filtros
        filtrosActuales = obtenerFiltros();

        // Obtener rango de fechas (últimos 30 días por defecto)
        const hoy = new Date();
        const hace30Dias = new Date();
        hace30Dias.setDate(hoy.getDate() - 30);

        const filtrosConFechas = {
            ...filtrosActuales,
            fecha_inicio: hace30Dias.toISOString().split('T')[0],
            fecha_fin: hoy.toISOString().split('T')[0]
        };

        // Cargar todos los reportes en paralelo
        await Promise.all([
            cargarTopProductos(filtrosConFechas),
            cargarProductosMenosVendidos(filtrosConFechas),
            cargarAnalisisPorCategoria(filtrosConFechas)
        ]);

        // Calcular estadísticas generales localmente después de cargar los datos
        calcularEstadisticasGenerales();

        Utils.showToast('Reporte generado exitosamente', 'success');

    } catch (error) {
        console.error('Error al generar reporte:', error);

        let errorMessage = 'Error al generar el reporte';
        if (error.message) {
            errorMessage += ': ' + error.message;
        }

        Utils.showToast(errorMessage, 'error');

        // Mostrar estado vacío
        mostrarEstadisticas({
            total_productos: 0,
            producto_mas_vendido: { nombre: 'N/A', cantidad: 0 },
            productos_activos: 0,
            sin_movimiento: 0
        });

    } finally {
        mostrarLoading(false);
    }
}

function obtenerFiltros() {
    const filtros = {};

    // Filtros que se envían al backend (solo categoría y marca son soportados)
    const categoriaId = document.getElementById('selectCategoria')?.value;
    if (categoriaId && categoriaId !== '') {
        filtros.categoria_id = categoriaId;
    }

    const marca = document.getElementById('selectMarca')?.value;
    if (marca && marca !== '') {
        filtros.marca = marca;
    }

    return filtros;
}

function obtenerFiltrosLocales() {
    // Filtros que se aplican localmente
    const filtros = {};

    const estado = document.getElementById('selectEstado')?.value;
    if (estado && estado !== '') {
        filtros.estado = estado;
    }

    const rotacion = document.getElementById('selectRotacion')?.value;
    if (rotacion && rotacion !== '') {
        filtros.rotacion = rotacion;
    }

    const rangoPrecio = document.getElementById('selectRangoPrecio')?.value;
    if (rangoPrecio && rangoPrecio !== '') {
        filtros.rango_precio = rangoPrecio;
    }

    return filtros;
}

function aplicarFiltrosLocales(productos) {
    if (!productos || productos.length === 0) {
        return productos;
    }

    let productosFiltrados = [...productos];
    const filtrosLocales = obtenerFiltrosLocales();

    // Filtro de rotación (basado en cantidad vendida en 30 días)
    if (filtrosLocales.rotacion) {
        productosFiltrados = productosFiltrados.filter(p => {
            const cantidad = p.cantidad_vendida || 0;
            const ventasMensuales = cantidad; // Ya es de 30 días

            switch (filtrosLocales.rotacion) {
                case 'alta':
                    return ventasMensuales > 20;
                case 'media':
                    return ventasMensuales >= 5 && ventasMensuales <= 20;
                case 'baja':
                    return ventasMensuales > 0 && ventasMensuales < 5;
                case 'sin_movimiento':
                    return ventasMensuales === 0;
                default:
                    return true;
            }
        });
    }

    // Filtro de rango de precio (basado en precio promedio = total_vendido / cantidad_vendida)
    if (filtrosLocales.rango_precio) {
        productosFiltrados = productosFiltrados.filter(p => {
            const precioPromedio = p.cantidad_vendida > 0
                ? p.total_vendido / p.cantidad_vendida
                : 0;

            switch (filtrosLocales.rango_precio) {
                case 'alto':
                    return precioPromedio > 500;
                case 'medio':
                    return precioPromedio >= 100 && precioPromedio <= 500;
                case 'bajo':
                    return precioPromedio < 100;
                default:
                    return true;
            }
        });
    }

    // Filtro de estado (activo si tiene ventas, inactivo si no)
    if (filtrosLocales.estado) {
        productosFiltrados = productosFiltrados.filter(p => {
            const tieneVentas = (p.cantidad_vendida || 0) > 0;

            switch (filtrosLocales.estado) {
                case 'activo':
                    return tieneVentas;
                case 'inactivo':
                case 'descontinuado':
                    return !tieneVentas;
                default:
                    return true;
            }
        });
    }

    return productosFiltrados;
}

/* ==================== CARGAR DATOS ==================== */

function calcularEstadisticasGenerales() {
    // Calcular estadísticas a partir de los datos ya cargados
    if (!datosProductosCompleto || datosProductosCompleto.length === 0) {
        mostrarEstadisticas({
            total_productos: 0,
            producto_mas_vendido: { nombre: 'N/A', cantidad: 0 },
            productos_activos: 0,
            sin_movimiento: 0
        });
        return;
    }

    // Total de productos únicos
    const total_productos = datosProductosCompleto.length;

    // Producto más vendido
    let producto_mas_vendido = { nombre: 'N/A', cantidad: 0 };
    if (datosProductosCompleto.length > 0) {
        const masVendido = datosProductosCompleto[0];
        producto_mas_vendido = {
            nombre: masVendido.nombre,
            cantidad: masVendido.cantidad_vendida || 0
        };
    }

    // Productos activos (todos los que tienen ventas son activos)
    const productos_activos = datosProductosCompleto.filter(p => (p.cantidad_vendida || 0) > 0).length;

    // Productos sin movimiento (menos de 2 ventas en 30 días)
    const sin_movimiento = datosProductosCompleto.filter(p => (p.cantidad_vendida || 0) < 2).length;

    mostrarEstadisticas({
        total_productos,
        producto_mas_vendido,
        productos_activos,
        sin_movimiento
    });
}

async function cargarTopProductos(filtros) {
    try {
        // Reporte 3: Productos más vendidos por cantidad
        const response = await api.get('/reportes/productos/top-cantidad', {
            ...filtros,
            limit: 5
        });

        if (response && response.success) {
            datosTopProductos = response.data.productos || [];
            mostrarTopProductos(datosTopProductos);
        }
    } catch (error) {
        console.error('Error al cargar top productos:', error);
        datosTopProductos = [];
        mostrarTopProductos([]);
    }
}

async function cargarProductosMenosVendidos(filtros) {
    try {
        // Reporte 5: Productos con menos ventas
        const response = await api.get('/reportes/productos/menos-vendidos', {
            ...filtros,
            limit: 5
        });

        if (response && response.success) {
            datosMenosVendidos = response.data.productos || [];
            mostrarProductosMenosVendidos(datosMenosVendidos);
        }
    } catch (error) {
        console.error('Error al cargar productos menos vendidos:', error);
        datosMenosVendidos = [];
        mostrarProductosMenosVendidos([]);
    }
}

async function cargarAnalisisPorCategoria(filtros) {
    try {
        // Obtener top productos por ingreso para análisis de categorías
        const response = await api.get('/reportes/productos/top-ingresos', {
            ...filtros,
            limit: 100
        });

        if (response && response.success) {
            // Guardar para búsqueda local y cálculo de estadísticas
            datosProductosCompleto = response.data.productos || [];

            // Aplicar filtros locales (rotación, precio, estado)
            const productosFiltrados = aplicarFiltrosLocales(datosProductosCompleto);

            const productosPorCategoria = agruparPorCategoria(productosFiltrados);
            mostrarAnalisisCategoria(productosPorCategoria);
        }
    } catch (error) {
        console.error('Error al cargar análisis por categoría:', error);
        datosProductosCompleto = [];
        mostrarAnalisisCategoria({});
    }
}

/* ==================== MOSTRAR DATOS ==================== */

function mostrarEstadisticas(stats) {
    // Actualizar estadísticas en las cards
    document.getElementById('estadisticaTotalProductos').textContent = stats.total_productos || 0;

    const masVendidoCantidad = document.getElementById('estadisticaMasVendidoCantidad');
    const masVendidoNombre = document.getElementById('estadisticaMasVendidoNombre');
    if (stats.producto_mas_vendido) {
        masVendidoCantidad.textContent = stats.producto_mas_vendido.cantidad || 0;
        masVendidoNombre.textContent = stats.producto_mas_vendido.nombre || 'N/A';
    } else {
        masVendidoCantidad.textContent = '0';
        masVendidoNombre.textContent = 'N/A';
    }

    document.getElementById('estadisticaProductosActivos').textContent = stats.productos_activos || 0;
    document.getElementById('estadisticaSinMovimiento').textContent = stats.sin_movimiento || 0;
}

function mostrarTopProductos(productos) {
    const tbody = document.getElementById('tablaTopProductos');

    if (!productos || productos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 2rem; color: var(--gray-500);">No hay datos para mostrar</td></tr>';
        return;
    }

    const medallas = ['🥇', '🥈', '🥉', '4', '5'];

    tbody.innerHTML = productos.slice(0, 5).map((producto, index) => `
        <tr>
            <td>${medallas[index]}</td>
            <td>
                <strong>${producto.nombre}</strong><br>
                <small class="text-muted">${producto.marca || 'Sin marca'}</small>
            </td>
            <td><strong>${producto.cantidad_vendida}</strong></td>
            <td><strong>${Utils.formatCurrency(producto.total_vendido)}</strong></td>
        </tr>
    `).join('');
}

function mostrarProductosMenosVendidos(productos) {
    const tbody = document.getElementById('tablaProductosMenosVendidos');

    if (!productos || productos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 2rem; color: var(--gray-500);">No hay datos para mostrar</td></tr>';
        return;
    }

    tbody.innerHTML = productos.slice(0, 5).map((producto, index) => {
        const alertIcon = index === 0 ? '⚠️' : index === 1 ? '⚠️' : (index + 1);
        const alertColor = index < 2 ? 'var(--error-red)' : index < 3 ? 'var(--warning-yellow)' : 'inherit';

        return `
            <tr>
                <td style="color: ${alertColor};">${alertIcon}</td>
                <td>
                    <strong>${producto.nombre}</strong><br>
                    <small class="text-muted">${producto.marca || 'Sin marca'}</small>
                </td>
                <td style="color: ${alertColor};">${producto.cantidad_vendida || 0}</td>
                <td>${producto.dias_sin_venta || 0} días</td>
            </tr>
        `;
    }).join('');
}

function agruparPorCategoria(productos) {
    const categorias = {};

    productos.forEach(producto => {
        const cat = producto.categoria || 'Sin categoría';
        if (!categorias[cat]) {
            categorias[cat] = {
                total_productos: 0,
                total_ventas: 0,
                total_ingresos: 0,
                productos: []
            };
        }

        categorias[cat].total_productos++;
        categorias[cat].total_ventas += producto.cantidad_vendida || 0;
        categorias[cat].total_ingresos += producto.total_vendido || 0;
        categorias[cat].productos.push(producto);
    });

    return categorias;
}

function mostrarAnalisisCategoria(categoriasPorProducto) {
    const tbody = document.getElementById('tablaAnalisisCategoria');

    if (!categoriasPorProducto || Object.keys(categoriasPorProducto).length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 2rem; color: var(--gray-500);">No hay datos para mostrar</td></tr>';
        return;
    }

    const categoriasArray = Object.entries(categoriasPorProducto).map(([nombre, datos]) => ({
        nombre,
        ...datos
    }));

    // Ordenar por ingresos
    categoriasArray.sort((a, b) => b.total_ingresos - a.total_ingresos);

    // Calcular total general
    const totalGeneral = categoriasArray.reduce((sum, cat) => sum + cat.total_ingresos, 0);

    tbody.innerHTML = categoriasArray.map(cat => {
        const porcentaje = totalGeneral > 0 ? (cat.total_ingresos / totalGeneral * 100) : 0;
        const rotacion = cat.total_productos > 0 ? cat.total_ventas / cat.total_productos : 0;
        const nivelRotacion = rotacion > 20 ? 'Alta' : rotacion > 5 ? 'Media' : 'Baja';
        const colorRotacion = rotacion > 20 ? 'var(--success-green)' : rotacion > 5 ? 'var(--warning-yellow)' : 'var(--error-red)';
        const anchoRotacion = rotacion > 20 ? 85 : rotacion > 5 ? 55 : 25;

        return `
            <tr>
                <td><strong>${cat.nombre}</strong></td>
                <td>${cat.total_productos}</td>
                <td>${cat.productos.length}</td>
                <td>${cat.total_ventas}</td>
                <td><strong>${Utils.formatCurrency(cat.total_ingresos)}</strong></td>
                <td>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <div style="width: 100px; height: 8px; background: var(--gray-200); border-radius: 4px;">
                            <div style="width: ${anchoRotacion}%; height: 100%; background: ${colorRotacion}; border-radius: 4px;"></div>
                        </div>
                        <span>${nivelRotacion}</span>
                    </div>
                </td>
                <td>${porcentaje.toFixed(1)}%</td>
            </tr>
        `;
    }).join('');
}

/* ==================== FILTROS Y BÚSQUEDA ==================== */

function aplicarBusquedaLocal() {
    const termino = document.getElementById('inputBuscar')?.value?.toLowerCase() || '';

    if (!datosProductosCompleto || datosProductosCompleto.length === 0) {
        return;
    }

    let productosFiltrados = [...datosProductosCompleto];

    // Aplicar filtros locales primero (rotación, precio, estado)
    productosFiltrados = aplicarFiltrosLocales(productosFiltrados);

    // Aplicar búsqueda por texto
    if (termino !== '') {
        productosFiltrados = productosFiltrados.filter(producto => {
            const nombre = (producto.nombre || '').toLowerCase();
            const marca = (producto.marca || '').toLowerCase();
            const categoria = (producto.categoria || '').toLowerCase();

            return nombre.includes(termino) ||
                   marca.includes(termino) ||
                   categoria.includes(termino);
        });
    }

    // Actualizar análisis por categoría con productos filtrados
    const productosPorCategoria = agruparPorCategoria(productosFiltrados);
    mostrarAnalisisCategoria(productosPorCategoria);

    // Recalcular estadísticas con productos filtrados
    if (termino !== '' || Object.keys(obtenerFiltrosLocales()).length > 0) {
        calcularEstadisticasConDatos(productosFiltrados);
    }
}

function calcularEstadisticasConDatos(productos) {
    // Calcular estadísticas a partir de los datos proporcionados
    if (!productos || productos.length === 0) {
        mostrarEstadisticas({
            total_productos: 0,
            producto_mas_vendido: { nombre: 'N/A', cantidad: 0 },
            productos_activos: 0,
            sin_movimiento: 0
        });
        return;
    }

    // Total de productos únicos
    const total_productos = productos.length;

    // Producto más vendido
    let producto_mas_vendido = { nombre: 'N/A', cantidad: 0 };
    if (productos.length > 0) {
        const masVendido = productos[0];
        producto_mas_vendido = {
            nombre: masVendido.nombre,
            cantidad: masVendido.cantidad_vendida || 0
        };
    }

    // Productos activos (todos los que tienen ventas son activos)
    const productos_activos = productos.filter(p => (p.cantidad_vendida || 0) > 0).length;

    // Productos sin movimiento (menos de 2 ventas en 30 días)
    const sin_movimiento = productos.filter(p => (p.cantidad_vendida || 0) < 2).length;

    mostrarEstadisticas({
        total_productos,
        producto_mas_vendido,
        productos_activos,
        sin_movimiento
    });
}

function limpiarFiltros() {
    // Limpiar selectores
    const selectCategoria = document.getElementById('selectCategoria');
    const selectMarca = document.getElementById('selectMarca');
    const selectEstado = document.getElementById('selectEstado');
    const selectRotacion = document.getElementById('selectRotacion');
    const selectRangoPrecio = document.getElementById('selectRangoPrecio');
    const inputBuscar = document.getElementById('inputBuscar');

    if (selectCategoria) selectCategoria.value = '';
    if (selectMarca) selectMarca.value = '';
    if (selectEstado) selectEstado.value = '';
    if (selectRotacion) selectRotacion.value = '';
    if (selectRangoPrecio) selectRangoPrecio.value = '';
    if (inputBuscar) inputBuscar.value = '';

    // Limpiar datos
    datosReporte = null;
    datosProductosCompleto = null;
    datosTopProductos = [];
    datosMenosVendidos = [];
    filtrosActuales = {};

    // Limpiar estadísticas
    document.getElementById('estadisticaTotalProductos').textContent = '0';
    document.getElementById('estadisticaMasVendidoCantidad').textContent = '0';
    document.getElementById('estadisticaMasVendidoNombre').textContent = 'N/A';
    document.getElementById('estadisticaProductosActivos').textContent = '0';
    document.getElementById('estadisticaSinMovimiento').textContent = '0';

    // Limpiar tablas
    document.getElementById('tablaTopProductos').innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 2rem; color: var(--gray-500);">Genera un reporte para ver los datos</td></tr>';
    document.getElementById('tablaProductosMenosVendidos').innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 2rem; color: var(--gray-500);">Genera un reporte para ver los datos</td></tr>';
    document.getElementById('tablaAnalisisCategoria').innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 2rem; color: var(--gray-500);">Genera un reporte para ver el análisis</td></tr>';

    Utils.showToast('Filtros limpiados. Genera un nuevo reporte para ver los datos.', 'info');
}

/* ==================== EXPORTACIONES ==================== */

async function exportarPDF() {
    if (!datosProductosCompleto || datosProductosCompleto.length === 0) {
        Utils.showToast('Primero debes generar el reporte', 'warning');
        return;
    }

    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Header
        doc.setFillColor(37, 99, 235);
        doc.rect(0, 0, 210, 40, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont(undefined, 'bold');
        doc.text('PAINTS', 20, 20);

        doc.setFontSize(12);
        doc.setFont(undefined, 'normal');
        doc.text('Sistema de Gestión para Cadena de Pinturas', 20, 28);
        doc.text('Reporte de Productos', 20, 35);

        doc.setTextColor(0, 0, 0);

        // Información del reporte
        doc.setFontSize(10);
        doc.text(`Generado: ${new Date().toLocaleDateString('es-GT', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })}`, 20, 50);
        doc.text(`Usuario: ${auth.user.nombre_completo}`, 20, 55);
        doc.text('Período: Últimos 30 días', 20, 60);

        // Filtros aplicados
        let y = 65;
        if (Object.keys(filtrosActuales).length > 0) {
            doc.text('Filtros aplicados:', 20, y);
            y += 5;

            if (filtrosActuales.categoria_id) {
                const categoria = document.getElementById('selectCategoria');
                const categoriaNombre = categoria.options[categoria.selectedIndex]?.text;
                doc.text(`  - Categoría: ${categoriaNombre}`, 25, y);
                y += 5;
            }

            if (filtrosActuales.marca) {
                doc.text(`  - Marca: ${filtrosActuales.marca}`, 25, y);
                y += 5;
            }
        }

        // Estadísticas
        y += 10;
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('ESTADÍSTICAS GENERALES', 20, y);
        y += 5;

        const estadisticas = [
            ['Total Productos', document.getElementById('estadisticaTotalProductos').textContent],
            ['Más Vendido', `${document.getElementById('estadisticaMasVendidoCantidad').textContent} - ${document.getElementById('estadisticaMasVendidoNombre').textContent}`],
            ['Productos Activos', document.getElementById('estadisticaProductosActivos').textContent],
            ['Sin Movimiento (30d)', document.getElementById('estadisticaSinMovimiento').textContent]
        ];

        doc.autoTable({
            startY: y,
            head: [['Métrica', 'Valor']],
            body: estadisticas,
            styles: { fontSize: 10 },
            headStyles: { fillColor: [37, 99, 235] },
            margin: { left: 20, right: 20 }
        });

        // Top 5 Más Vendidos
        y = doc.lastAutoTable.finalY + 15;
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('TOP 5 PRODUCTOS MÁS VENDIDOS (30 DÍAS)', 20, y);
        y += 5;

        const tbody1 = document.getElementById('tablaTopProductos');
        const rows1 = tbody1.querySelectorAll('tr');
        const tableData1 = [];

        rows1.forEach(row => {
            const cells = row.querySelectorAll('td');
            if (cells.length >= 4 && !row.textContent.includes('No hay datos')) {
                const producto = cells[1].querySelector('strong')?.textContent.trim() || '';
                const marca = cells[1].querySelector('small')?.textContent.trim() || '';

                tableData1.push([
                    cells[0].textContent.trim(),
                    `${producto}\n${marca}`,
                    cells[2].textContent.trim(),
                    cells[3].textContent.trim()
                ]);
            }
        });

        if (tableData1.length > 0) {
            doc.autoTable({
                startY: y,
                head: [['#', 'Producto', 'Vendidos', 'Ingresos']],
                body: tableData1,
                styles: { fontSize: 9, cellPadding: 2 },
                headStyles: { fillColor: [37, 99, 235] },
                margin: { left: 20, right: 20 }
            });
        }

        // Top 5 Menos Vendidos
        y = doc.lastAutoTable.finalY + 15;
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('TOP 5 PRODUCTOS MENOS VENDIDOS (30 DÍAS)', 20, y);
        y += 5;

        const tbody2 = document.getElementById('tablaProductosMenosVendidos');
        const rows2 = tbody2.querySelectorAll('tr');
        const tableData2 = [];

        rows2.forEach(row => {
            const cells = row.querySelectorAll('td');
            if (cells.length >= 4 && !row.textContent.includes('No hay datos')) {
                const producto = cells[1].querySelector('strong')?.textContent.trim() || '';
                const marca = cells[1].querySelector('small')?.textContent.trim() || '';

                tableData2.push([
                    cells[0].textContent.trim(),
                    `${producto}\n${marca}`,
                    cells[2].textContent.trim(),
                    cells[3].textContent.trim()
                ]);
            }
        });

        if (tableData2.length > 0) {
            doc.autoTable({
                startY: y,
                head: [['#', 'Producto', 'Vendidos', 'Días sin venta']],
                body: tableData2,
                styles: { fontSize: 9, cellPadding: 2 },
                headStyles: { fillColor: [37, 99, 235] },
                margin: { left: 20, right: 20 }
            });
        }

        // Nueva página para análisis por categoría
        doc.addPage();
        y = 20;
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('ANÁLISIS POR CATEGORÍA', 20, y);
        y += 5;

        const tbody3 = document.getElementById('tablaAnalisisCategoria');
        const rows3 = tbody3.querySelectorAll('tr');
        const tableData3 = [];

        rows3.forEach(row => {
            const cells = row.querySelectorAll('td');
            if (cells.length >= 7 && !row.textContent.includes('No hay datos')) {
                tableData3.push([
                    cells[0].textContent.trim(),
                    cells[1].textContent.trim(),
                    cells[3].textContent.trim(),
                    cells[4].textContent.trim(),
                    cells[6].textContent.trim()
                ]);
            }
        });

        if (tableData3.length > 0) {
            doc.autoTable({
                startY: y,
                head: [['Categoría', 'Productos', 'Ventas', 'Ingresos', '% Total']],
                body: tableData3,
                styles: { fontSize: 9, cellPadding: 2 },
                headStyles: { fillColor: [37, 99, 235] },
                margin: { left: 20, right: 20 }
            });
        }

        // Footer en todas las páginas
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(128, 128, 128);
            doc.text(
                `Página ${i} de ${pageCount}`,
                doc.internal.pageSize.width / 2,
                doc.internal.pageSize.height - 10,
                { align: 'center' }
            );
            doc.text(
                'Sistema Paints - Reporte Confidencial',
                20,
                doc.internal.pageSize.height - 10
            );
        }

        doc.save(`reporte_productos_${new Date().getTime()}.pdf`);
        Utils.showToast('Reporte exportado en PDF exitosamente', 'success');

    } catch (error) {
        console.error('Error al exportar PDF:', error);
        Utils.showToast('Error al exportar el reporte: ' + error.message, 'error');
    }
}

async function exportarExcel() {
    if (!datosProductosCompleto || datosProductosCompleto.length === 0) {
        Utils.showToast('Primero debes generar el reporte', 'warning');
        return;
    }

    try {
        // Crear libro de trabajo
        const wb = XLSX.utils.book_new();

        // Hoja 1: Estadísticas Generales
        const estadisticas = [
            ['REPORTE DE PRODUCTOS - SISTEMA PAINTS'],
            ['Generado:', new Date().toLocaleDateString('es-GT')],
            ['Usuario:', auth.user.nombre_completo],
            ['Período:', 'Últimos 30 días'],
            [],
            ['ESTADÍSTICAS GENERALES'],
            ['Total Productos', document.getElementById('estadisticaTotalProductos').textContent],
            ['Más Vendido (Cantidad)', document.getElementById('estadisticaMasVendidoCantidad').textContent],
            ['Más Vendido (Nombre)', document.getElementById('estadisticaMasVendidoNombre').textContent],
            ['Productos Activos', document.getElementById('estadisticaProductosActivos').textContent],
            ['Sin Movimiento (30d)', document.getElementById('estadisticaSinMovimiento').textContent]
        ];
        const wsEstadisticas = XLSX.utils.aoa_to_sheet(estadisticas);
        XLSX.utils.book_append_sheet(wb, wsEstadisticas, 'Estadísticas');

        // Hoja 2: Top 5 Más Vendidos
        if (datosTopProductos && datosTopProductos.length > 0) {
            const topData = [
                ['TOP 5 PRODUCTOS MÁS VENDIDOS (30 DÍAS)'],
                [],
                ['#', 'Producto', 'Marca', 'Categoría', 'Cantidad Vendida', 'Total Vendido']
            ];

            datosTopProductos.slice(0, 5).forEach((producto, index) => {
                topData.push([
                    index + 1,
                    producto.nombre,
                    producto.marca || 'Sin marca',
                    producto.categoria || 'Sin categoría',
                    producto.cantidad_vendida,
                    producto.total_vendido
                ]);
            });

            const wsTop = XLSX.utils.aoa_to_sheet(topData);
            XLSX.utils.book_append_sheet(wb, wsTop, 'Top Vendidos');
        }

        // Hoja 3: Menos Vendidos
        if (datosMenosVendidos && datosMenosVendidos.length > 0) {
            const menosData = [
                ['TOP 5 PRODUCTOS MENOS VENDIDOS (30 DÍAS)'],
                [],
                ['#', 'Producto', 'Marca', 'Categoría', 'Cantidad Vendida', 'Días sin Venta']
            ];

            datosMenosVendidos.slice(0, 5).forEach((producto, index) => {
                menosData.push([
                    index + 1,
                    producto.nombre,
                    producto.marca || 'Sin marca',
                    producto.categoria || 'Sin categoría',
                    producto.cantidad_vendida || 0,
                    producto.dias_sin_venta || 0
                ]);
            });

            const wsMenos = XLSX.utils.aoa_to_sheet(menosData);
            XLSX.utils.book_append_sheet(wb, wsMenos, 'Menos Vendidos');
        }

        // Hoja 4: Análisis por Categoría
        if (datosProductosCompleto && datosProductosCompleto.length > 0) {
            const categorias = agruparPorCategoria(datosProductosCompleto);
            const categoriasArray = Object.entries(categorias).map(([nombre, datos]) => ({
                nombre,
                ...datos
            }));
            categoriasArray.sort((a, b) => b.total_ingresos - a.total_ingresos);

            const totalGeneral = categoriasArray.reduce((sum, cat) => sum + cat.total_ingresos, 0);

            const categoriaData = [
                ['ANÁLISIS POR CATEGORÍA'],
                [],
                ['Categoría', 'Total Productos', 'Productos Activos', 'Ventas (30d)', 'Ingresos (30d)', '% del Total']
            ];

            categoriasArray.forEach(cat => {
                const porcentaje = totalGeneral > 0 ? (cat.total_ingresos / totalGeneral * 100) : 0;
                categoriaData.push([
                    cat.nombre,
                    cat.total_productos,
                    cat.productos.length,
                    cat.total_ventas,
                    cat.total_ingresos,
                    porcentaje.toFixed(1) + '%'
                ]);
            });

            const wsCategoria = XLSX.utils.aoa_to_sheet(categoriaData);
            XLSX.utils.book_append_sheet(wb, wsCategoria, 'Por Categoría');
        }

        // Hoja 5: Todos los Productos
        const todosData = [
            ['TODOS LOS PRODUCTOS'],
            [],
            ['Producto', 'Marca', 'Categoría', 'Cantidad Vendida', 'Total Vendido', 'Número Facturas']
        ];

        datosProductosCompleto.forEach(producto => {
            todosData.push([
                producto.nombre,
                producto.marca || 'Sin marca',
                producto.categoria || 'Sin categoría',
                producto.cantidad_vendida,
                producto.total_vendido,
                producto.numero_facturas || 0
            ]);
        });

        const wsTodos = XLSX.utils.aoa_to_sheet(todosData);
        XLSX.utils.book_append_sheet(wb, wsTodos, 'Todos los Productos');

        // Guardar archivo
        XLSX.writeFile(wb, `reporte_productos_${new Date().getTime()}.xlsx`);
        Utils.showToast('Reporte exportado en Excel exitosamente', 'success');

    } catch (error) {
        console.error('Error al exportar Excel:', error);
        Utils.showToast('Error al exportar el reporte: ' + error.message, 'error');
    }
}

/* ==================== UTILIDADES ==================== */

function mostrarLoading(mostrar) {
    const btn = document.getElementById('btnAplicarFiltros');
    if (btn) {
        btn.disabled = mostrar;
        btn.innerHTML = mostrar
            ? '<i class="fas fa-spinner fa-spin"></i> Cargando...'
            : '<i class="fas fa-filter"></i> Aplicar Filtros';
    }
}

function logout() {
    auth.logout();
}

// Exportar funciones globalmente
window.generarReporte = generarReporte;
window.exportarPDF = exportarPDF;
window.exportarExcel = exportarExcel;
window.limpiarFiltros = limpiarFiltros;
window.logout = logout;
