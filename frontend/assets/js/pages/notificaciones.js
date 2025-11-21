        // Estado global
        let notificaciones = [];
        let notificacionesFiltradas = [];
        let paginaActual = 1;
        const notificacionesPorPagina = 10;

        // Notificaciones de ejemplo
        const notificacionesEjemplo = [
            {
                id: 1,
                tipo: 'promocion',
                titulo: 'Nueva Promoción: 20% de descuento',
                mensaje: 'Aprovecha nuestra promoción especial en pinturas base agua. Válida hasta fin de mes.',
                fecha: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 horas atrás
                leida: false,
                importante: true,
                icono: 'fas fa-percentage'
            },
            {
                id: 2,
                tipo: 'factura',
                titulo: 'Factura generada',
                mensaje: 'Se ha generado la factura #FAC-001234 por un monto de Q 1,250.00',
                fecha: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 día atrás
                leida: true,
                importante: false,
                icono: 'fas fa-file-invoice-dollar'
            },
            {
                id: 3,
                tipo: 'inventario',
                titulo: 'Stock bajo: Pintura Blanca',
                mensaje: 'El producto "Pintura Base Agua Blanca" tiene stock bajo en la sucursal de Miraflores (5 unidades restantes).',
                fecha: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 horas atrás
                leida: false,
                importante: true,
                icono: 'fas fa-exclamation-triangle'
            },
            {
                id: 4,
                tipo: 'sistema',
                titulo: 'Actualización del sistema',
                mensaje: 'Se ha realizado una actualización del sistema. Nuevas funcionalidades disponibles.',
                fecha: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 días atrás
                leida: true,
                importante: false,
                icono: 'fas fa-sync-alt'
            },
            {
                id: 5,
                tipo: 'urgente',
                titulo: 'Problema de conectividad',
                mensaje: 'Se detectó un problema temporal de conectividad en la sucursal de Chimaltenango. El equipo técnico ya está trabajando.',
                fecha: new Date(Date.now() - 30 * 60 * 1000), // 30 minutos atrás
                leida: false,
                importante: true,
                icono: 'fas fa-wifi'
            },
            {
                id: 6,
                tipo: 'promocion',
                titulo: 'Nuevo producto disponible',
                mensaje: 'Ya tenemos disponible la nueva línea de barnices acrílicos. ¡Consúltalos en nuestro catálogo!',
                fecha: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 horas atrás
                leida: false,
                importante: false,
                icono: 'fas fa-star'
            }
        ];

        // Inicializar página
        document.addEventListener('DOMContentLoaded', function() {
            notificaciones = [...notificacionesEjemplo];
            aplicarFiltros();
            configurarEventos();
            actualizarEstadisticas();
        });

        function configurarEventos() {
            document.getElementById('btnMarcarTodasLeidas').addEventListener('click', marcarTodasComoLeidas);
            document.getElementById('btnConfiguracion').addEventListener('click', abrirConfiguracion);
            document.getElementById('btnAplicarFiltros').addEventListener('click', aplicarFiltros);

            // Filtros en tiempo real
            document.getElementById('filtroTipo').addEventListener('change', aplicarFiltros);
            document.getElementById('filtroEstado').addEventListener('change', aplicarFiltros);
            document.getElementById('filtroFecha').addEventListener('change', aplicarFiltros);
        }

        function aplicarFiltros() {
            const filtroTipo = document.getElementById('filtroTipo').value;
            const filtroEstado = document.getElementById('filtroEstado').value;
            const filtroFecha = document.getElementById('filtroFecha').value;

            notificacionesFiltradas = notificaciones.filter(notif => {
                // Filtro por tipo
                if (filtroTipo && notif.tipo !== filtroTipo) return false;

                // Filtro por estado
                if (filtroEstado === 'no-leida' && notif.leida) return false;
                if (filtroEstado === 'leida' && !notif.leida) return false;
                if (filtroEstado === 'importante' && !notif.importante) return false;

                // Filtro por fecha
                if (filtroFecha) {
                    const ahora = new Date();
                    const fechaNotif = new Date(notif.fecha);
                    
                    switch(filtroFecha) {
                        case 'hoy':
                            if (!esMismaFecha(fechaNotif, ahora)) return false;
                            break;
                        case 'ayer':
                            const ayer = new Date(ahora);
                            ayer.setDate(ayer.getDate() - 1);
                            if (!esMismaFecha(fechaNotif, ayer)) return false;
                            break;
                        case 'semana':
                            const inicioSemana = new Date(ahora);
                            inicioSemana.setDate(ahora.getDate() - 7);
                            if (fechaNotif < inicioSemana) return false;
                            break;
                        case 'mes':
                            const inicioMes = new Date(ahora);
                            inicioMes.setDate(ahora.getDate() - 30);
                            if (fechaNotif < inicioMes) return false;
                            break;
                    }
                }

                return true;
            });

            paginaActual = 1;
            mostrarNotificaciones();
            generarPaginacion();
        }

        function esMismaFecha(fecha1, fecha2) {
            return fecha1.toDateString() === fecha2.toDateString();
        }

        function mostrarNotificaciones() {
            const lista = document.getElementById('notificacionesList');
            
            if (notificacionesFiltradas.length === 0) {
                lista.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-bell-slash"></i>
                        <h3>No hay notificaciones</h3>
                        <p>No se encontraron notificaciones que coincidan con los filtros aplicados.</p>
                    </div>
                `;
                return;
            }

            // Calcular índices para paginación
            const inicio = (paginaActual - 1) * notificacionesPorPagina;
            const fin = inicio + notificacionesPorPagina;
            const notificacionesPagina = notificacionesFiltradas.slice(inicio, fin);

            lista.innerHTML = notificacionesPagina.map(notif => `
                <div class="notificacion-item ${!notif.leida ? 'no-leida' : ''} ${notif.importante ? 'importante' : ''}" 
                     data-id="${notif.id}">
                    <div class="notificacion-header">
                        <span class="notificacion-tipo tipo-${notif.tipo}">
                            <i class="${notif.icono}"></i>
                            ${obtenerNombreTipo(notif.tipo)}
                        </span>
                        <span class="notificacion-fecha">${formatearFecha(notif.fecha)}</span>
                    </div>
                    
                    <div class="notificacion-contenido">
                        <div class="notificacion-titulo">${notif.titulo}</div>
                        <div class="notificacion-mensaje">${notif.mensaje}</div>
                    </div>

                    <div class="notificacion-acciones">
                        ${!notif.leida ? 
                            `<button class="btn-accion btn-marcar-leida" onclick="marcarComoLeida(${notif.id})">
                                <i class="fas fa-check"></i> Marcar como leída
                            </button>` : 
                            `<span style="color: var(--success-color);"><i class="fas fa-check-circle"></i> Leída</span>`
                        }
                        <button class="btn-accion btn-ver-detalle" onclick="verDetalle(${notif.id})">
                            <i class="fas fa-eye"></i> Ver detalle
                        </button>
                        <button class="btn-accion btn-eliminar" onclick="eliminarNotificacion(${notif.id})">
                            <i class="fas fa-trash"></i> Eliminar
                        </button>
                    </div>
                </div>
            `).join('');
        }

        function obtenerNombreTipo(tipo) {
            const tipos = {
                promocion: 'Promoción',
                factura: 'Factura',
                inventario: 'Inventario',
                sistema: 'Sistema',
                urgente: 'Urgente'
            };
            return tipos[tipo] || tipo;
        }

        function formatearFecha(fecha) {
            const ahora = new Date();
            const diff = ahora - new Date(fecha);
            const minutos = Math.floor(diff / (1000 * 60));
            const horas = Math.floor(diff / (1000 * 60 * 60));
            const dias = Math.floor(diff / (1000 * 60 * 60 * 24));

            if (minutos < 1) return 'Ahora';
            if (minutos < 60) return `Hace ${minutos} min`;
            if (horas < 24) return `Hace ${horas} h`;
            if (dias < 7) return `Hace ${dias} días`;
            
            return new Date(fecha).toLocaleDateString('es-GT');
        }

        function generarPaginacion() {
            const paginacion = document.getElementById('paginacion');
            const totalPaginas = Math.ceil(notificacionesFiltradas.length / notificacionesPorPagina);

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
            mostrarNotificaciones();
            generarPaginacion();
        }

        function actualizarEstadisticas() {
            const total = notificaciones.length;
            const noLeidas = notificaciones.filter(n => !n.leida).length;
            const importantes = notificaciones.filter(n => n.importante).length;
            const hoy = notificaciones.filter(n => esMismaFecha(new Date(n.fecha), new Date())).length;

            document.getElementById('totalNotificaciones').textContent = total;
            document.getElementById('noLeidas').textContent = noLeidas;
            document.getElementById('importantes').textContent = importantes;
            document.getElementById('hoy').textContent = hoy;
        }

        function marcarComoLeida(id) {
            const notif = notificaciones.find(n => n.id === id);
            if (notif) {
                notif.leida = true;
                aplicarFiltros();
                actualizarEstadisticas();
                mostrarMensaje('Notificación marcada como leída', 'success');
            }
        }

        function marcarTodasComoLeidas() {
            if (confirm('¿Marcar todas las notificaciones como leídas?')) {
                notificaciones.forEach(notif => notif.leida = true);
                aplicarFiltros();
                actualizarEstadisticas();
                mostrarMensaje('Todas las notificaciones fueron marcadas como leídas', 'success');
            }
        }

        function eliminarNotificacion(id) {
            if (confirm('¿Eliminar esta notificación?')) {
                const index = notificaciones.findIndex(n => n.id === id);
                if (index > -1) {
                    notificaciones.splice(index, 1);
                    aplicarFiltros();
                    actualizarEstadisticas();
                    mostrarMensaje('Notificación eliminada', 'success');
                }
            }
        }

        function verDetalle(id) {
            const notif = notificaciones.find(n => n.id === id);
            if (notif) {
                alert(`Título: ${notif.titulo}\n\nMensaje: ${notif.mensaje}\n\nFecha: ${formatearFecha(notif.fecha)}\n\nTipo: ${obtenerNombreTipo(notif.tipo)}`);
            }
        }

        function actualizarNotificaciones() {
            // Simular actualización
            mostrarMensaje('Notificaciones actualizadas', 'info');
            aplicarFiltros();
        }

        function abrirConfiguracion() {
            document.getElementById('modalConfiguracion').style.display = 'block';
        }

        function cerrarConfiguracion() {
            document.getElementById('modalConfiguracion').style.display = 'none';
        }

        function guardarConfiguracion() {
            const config = {
                promociones: document.getElementById('notifPromociones').checked,
                facturas: document.getElementById('notifFacturas').checked,
                inventario: document.getElementById('notifInventario').checked,
                sistema: document.getElementById('notifSistema').checked,
                frecuenciaEmail: document.getElementById('frecuenciaEmail').value
            };

            // Guardar en localStorage
            localStorage.setItem('notificacionesConfig', JSON.stringify(config));
            mostrarMensaje('Configuración guardada', 'success');
            cerrarConfiguracion();
        }

        function mostrarMensaje(mensaje, tipo = 'info') {
            // Implementación simple de toast
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
                background: ${tipo === 'success' ? 'var(--success-color)' : 
                           tipo === 'error' ? 'var(--error-color)' : 'var(--info-color)'};
            `;
            toast.textContent = mensaje;
            
            document.body.appendChild(toast);
            
            setTimeout(() => {
                toast.style.animation = 'slideOutRight 0.3s ease-out';
                setTimeout(() => toast.remove(), 300);
            }, 3000);
        }

        // Cerrar modal al hacer clic fuera
        document.getElementById('modalConfiguracion').addEventListener('click', function(e) {
            if (e.target === this) {
                cerrarConfiguracion();
            }
        });

        // Cargar configuración guardada al inicializar
        window.addEventListener('load', function() {
            const configGuardada = localStorage.getItem('notificacionesConfig');
            if (configGuardada) {
                const config = JSON.parse(configGuardada);
                document.getElementById('notifPromociones').checked = config.promociones;
                document.getElementById('notifFacturas').checked = config.facturas;
                document.getElementById('notifInventario').checked = config.inventario;
                document.getElementById('notifSistema').checked = config.sistema;
                document.getElementById('frecuenciaEmail').value = config.frecuenciaEmail;
            }
        });
    </script>

    <style>
        @keyframes slideInRight {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }

        @keyframes slideOutRight {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
    </style>
