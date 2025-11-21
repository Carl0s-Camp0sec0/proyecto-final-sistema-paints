/* ======================================================
   REPORTE DE PRODUCTOS - Sistema Paints
   Reportes: 3) Productos más vendidos por cantidad
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

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    inicializarReporte();
    cargarEstadisticasIniciales();
});

/* ==================== INICIALIZACIÓN ==================== */

function inicializarReporte() {
    cargarDatosUsuario();
    cargarFiltros();
}

function cargarDatosUsuario() {
    document.getElementById('userAvatar').textContent = auth.getUserInitials();
    document.getElementById('userName').textContent = auth.user.nombre_completo;
    document.getElementById('userRole').textContent = auth.user.rol;
}

async function cargarFiltros() {
    try {
        // Cargar categorías
        const categoriasResponse = await api.get('/sistema/categorias');
        const categorias = categoriasResponse.data.categorias;

        const categoriaSelect = document.querySelector('select.form-select');
        if (categoriaSelect) {
            categorias.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat.id;
                option.textContent = cat.nombre;
                categoriaSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error al cargar filtros:', error);
    }
}

async function cargarEstadisticasIniciales() {
    try {
        // Cargar estadísticas del mes actual
        const hoy = new Date();
        const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

        const filtros = {
            fecha_inicio: primerDia.toISOString().split('T')[0],
            fecha_fin: hoy.toISOString().split('T')[0]
        };

        // Cargar top productos
        await cargarTopProductos(filtros);
        await cargarProductosMenosVendidos(filtros);

    } catch (error) {
        console.error('Error al cargar estadísticas:', error);
    }
}

/* ==================== GENERAR REPORTE ==================== */

async function generarReporte() {
    try {
        mostrarLoading(true);

        const hoy = new Date();
        const hace30Dias = new Date();
        hace30Dias.setDate(hoy.getDate() - 30);

        const filtros = {
            fecha_inicio: hace30Dias.toISOString().split('T')[0],
            fecha_fin: hoy.toISOString().split('T')[0]
        };

        // Cargar reportes
        await Promise.all([
            cargarTopProductos(filtros),
            cargarProductosMenosVendidos(filtros),
            cargarAnalisisPorCategoria(filtros)
        ]);

        Utils.showToast('Reporte generado exitosamente', 'success');

    } catch (error) {
        console.error('Error al generar reporte:', error);
        Utils.showToast('Error al generar el reporte: ' + error.message, 'error');
    } finally {
        mostrarLoading(false);
    }
}

async function cargarTopProductos(filtros) {
    try {
        const response = await api.get('/reportes/productos/top-cantidad', {
            ...filtros,
            limit: 5
        });

        if (response.success) {
            mostrarTopProductos(response.data.productos);
            actualizarEstadisticasTop(response.data.productos);
        }
    } catch (error) {
        console.error('Error al cargar top productos:', error);
    }
}

async function cargarProductosMenosVendidos(filtros) {
    try {
        const response = await api.get('/reportes/productos/menos-vendidos', {
            ...filtros,
            limit: 5
        });

        if (response.success) {
            mostrarProductosMenosVendidos(response.data.productos);
        }
    } catch (error) {
        console.error('Error al cargar productos menos vendidos:', error);
    }
}

async function cargarAnalisisPorCategoria(filtros) {
    try {
        // Obtener top productos por ingreso para análisis de categorías
        const response = await api.get('/reportes/productos/top-ingresos', {
            ...filtros,
            limit: 100 // Obtener más productos para análisis
        });

        if (response.success) {
            const productosPorCategoria = agruparPorCategoria(response.data.productos);
            mostrarAnalisisCategoria(productosPorCategoria);
        }
    } catch (error) {
        console.error('Error al cargar análisis por categoría:', error);
    }
}

/* ==================== MOSTRAR DATOS ==================== */

function mostrarTopProductos(productos) {
    const tbody = document.querySelector('.card:nth-child(1) tbody');

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
    const tbody = document.querySelector('.card:nth-child(2) tbody');

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
                <td style="color: ${alertColor};">${producto.cantidad_vendida}</td>
                <td>${producto.dias_sin_venta || 0} días</td>
            </tr>
        `;
    }).join('');
}

function agruparPorCategoria(productos) {
    const categorias = {};

    productos.forEach(producto => {
        const cat = producto.categoria;
        if (!categorias[cat]) {
            categorias[cat] = {
                total_productos: 0,
                total_ventas: 0,
                total_ingresos: 0,
                productos: []
            };
        }

        categorias[cat].total_productos++;
        categorias[cat].total_ventas += producto.cantidad_vendida;
        categorias[cat].total_ingresos += producto.total_vendido;
        categorias[cat].productos.push(producto);
    });

    return categorias;
}

function mostrarAnalisisCategoria(categoriasPorProducto) {
    const tbody = document.querySelector('.card:nth-of-type(3) tbody');

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
        const rotacion = cat.total_ventas / cat.total_productos;
        const nivelRotacion = rotacion > 20 ? 'Alta' : rotacion > 5 ? 'Media' : 'Baja';
        const colorRotacion = rotacion > 20 ? 'var(--success-green)' : rotacion > 5 ? 'var(--warning-yellow)' : 'var(--error-red)';

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
                            <div style="width: ${Math.min(porcentaje, 100)}%; height: 100%; background: ${colorRotacion}; border-radius: 4px;"></div>
                        </div>
                        <span>${nivelRotacion}</span>
                    </div>
                </td>
                <td>${porcentaje.toFixed(1)}%</td>
            </tr>
        `;
    }).join('');
}

function actualizarEstadisticasTop(productos) {
    if (!productos || productos.length === 0) return;

    const topProducto = productos[0];

    // Actualizar card de "Más Vendido"
    const masVendidoCard = document.querySelectorAll('.card .card-content')[1];
    if (masVendidoCard) {
        const h2 = masVendidoCard.querySelector('h2');
        const small = masVendidoCard.querySelector('small');
        if (h2) h2.textContent = topProducto.cantidad_vendida;
        if (small) small.textContent = topProducto.nombre;
    }
}

/* ==================== LISTADO COMPLETO ==================== */

async function cargarListadoCompleto() {
    try {
        const tbody = document.querySelector('.card:last-child tbody');
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 2rem;">Cargando...</td></tr>';

        // Por ahora mostrar datos de ejemplo
        // En producción, esto vendría de un endpoint
        const productosEjemplo = [
            {
                nombre: 'Pintura Látex Premium Blanca',
                marca: 'Sherwin-Williams',
                categoria: 'Pinturas',
                precio: 360,
                stock: 145,
                ventas30d: 48,
                ultima_venta: 'Hoy',
                activo: true
            },
            {
                nombre: 'Comex Vinimex Color Base',
                marca: 'Comex',
                categoria: 'Pinturas',
                precio: 280,
                stock: 89,
                ventas30d: 32,
                ultima_venta: 'Ayer',
                activo: true
            },
            {
                nombre: 'Brocha Professional 3"',
                marca: 'Premium Tools',
                categoria: 'Accesorios',
                precio: 90,
                stock: 267,
                ventas30d: 18,
                ultima_venta: '2 días',
                activo: true
            },
            {
                nombre: 'Barniz Marina Transparente',
                marca: 'Speciality',
                categoria: 'Barnices',
                precio: 168,
                stock: 12,
                ventas30d: 0,
                ultima_venta: '45 días',
                activo: false
            }
        ];

        tbody.innerHTML = productosEjemplo.map(producto => `
            <tr>
                <td>
                    <strong>${producto.nombre}</strong><br>
                    <small class="text-muted">${producto.marca}</small>
                </td>
                <td>${producto.categoria}</td>
                <td><strong>${Utils.formatCurrency(producto.precio)}</strong></td>
                <td>${producto.stock}</td>
                <td><span style="color: ${producto.ventas30d > 20 ? 'var(--success-green)' : producto.ventas30d > 0 ? 'var(--warning-yellow)' : 'var(--error-red)'}; font-weight: bold;">${producto.ventas30d}</span></td>
                <td>${producto.ultima_venta}</td>
                <td><span class="status-badge ${producto.activo ? 'status-activo' : 'status-pendiente'}">${producto.activo ? 'Activo' : 'Revisar'}</span></td>
                <td>
                    <button class="btn-action btn-view" title="Ver detalle">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            </tr>
        `).join('');

    } catch (error) {
        console.error('Error al cargar listado completo:', error);
    }
}

/* ==================== EXPORTACIONES ==================== */

async function exportarReporte() {
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
        doc.text(`Generado: ${new Date().toLocaleDateString('es-GT')}`, 20, 50);
        doc.text(`Usuario: ${auth.user.nombre_completo}`, 20, 55);

        // Top 5 Más Vendidos
        let y = 70;
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('TOP 5 PRODUCTOS MÁS VENDIDOS (30 DÍAS)', 20, y);
        y += 5;

        const tbody1 = document.querySelector('.card:nth-child(1) tbody');
        const rows1 = tbody1.querySelectorAll('tr');
        const tableData1 = [];

        rows1.forEach(row => {
            const cells = row.querySelectorAll('td');
            if (cells.length > 0) {
                tableData1.push([
                    cells[0].textContent.trim(),
                    cells[1].querySelector('strong')?.textContent.trim() || '',
                    cells[2].querySelector('strong')?.textContent.trim() || '',
                    cells[3].querySelector('strong')?.textContent.trim() || ''
                ]);
            }
        });

        doc.autoTable({
            startY: y,
            head: [['#', 'Producto', 'Vendidos', 'Ingresos']],
            body: tableData1,
            styles: { fontSize: 9 },
            headStyles: { fillColor: [37, 99, 235] },
            margin: { left: 20, right: 20 }
        });

        // Top 5 Menos Vendidos
        y = doc.lastAutoTable.finalY + 15;
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('TOP 5 PRODUCTOS MENOS VENDIDOS (30 DÍAS)', 20, y);
        y += 5;

        const tbody2 = document.querySelector('.card:nth-child(2) tbody');
        const rows2 = tbody2.querySelectorAll('tr');
        const tableData2 = [];

        rows2.forEach(row => {
            const cells = row.querySelectorAll('td');
            if (cells.length > 0) {
                tableData2.push([
                    cells[0].textContent.trim(),
                    cells[1].querySelector('strong')?.textContent.trim() || '',
                    cells[2].textContent.trim(),
                    cells[3].textContent.trim()
                ]);
            }
        });

        doc.autoTable({
            startY: y,
            head: [['#', 'Producto', 'Vendidos', 'Días sin venta']],
            body: tableData2,
            styles: { fontSize: 9 },
            headStyles: { fillColor: [37, 99, 235] },
            margin: { left: 20, right: 20 }
        });

        // Footer
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
        Utils.showToast('Reporte exportado exitosamente', 'success');

    } catch (error) {
        console.error('Error al exportar PDF:', error);
        Utils.showToast('Error al exportar el reporte', 'error');
    }
}

/* ==================== UTILIDADES ==================== */

function mostrarLoading(mostrar) {
    const btn = document.querySelector('button[onclick="generarReporte()"]');
    if (btn) {
        btn.disabled = mostrar;
        btn.innerHTML = mostrar
            ? '<i class="fas fa-spinner fa-spin"></i> Generando...'
            : '<i class="fas fa-filter"></i> Aplicar Filtros';
    }
}

function logout() {
    auth.logout();
}

// Exportar funciones globalmente
window.generarReporte = generarReporte;
window.exportarReporte = exportarReporte;
window.logout = logout;
