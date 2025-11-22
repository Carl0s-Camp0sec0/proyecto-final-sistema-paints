// Variables globales
let tiendas = []; // Inicialmente vacío, se cargará desde el backend
let mapa;
let ubicacionUsuario = null;
let marcadorUsuario = null;
let marcadoresTiendas = [];
let permisosUbicacionSolicitados = false;

// Cargar sucursales desde el backend
async function cargarSucursales() {
    try {
        console.log('📍 Cargando sucursales desde el backend...');

        // Intentar obtener token (si hay sesión activa)
        const token = localStorage.getItem('token');
        const headers = {
            'Content-Type': 'application/json'
        };

        // Si hay token, agregarlo (aunque el endpoint podría ser público)
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${CONFIG.API_BASE_URL}/sistema/sucursales`, {
            headers
        });

        console.log('📡 Respuesta del servidor:', response.status, response.statusText);

        if (!response.ok) {
            throw new Error(`Error al cargar sucursales: ${response.status}`);
        }

        const data = await response.json();
        console.log('📦 Datos recibidos:', data);

        if (data.success && data.data && data.data.sucursales && Array.isArray(data.data.sucursales) && data.data.sucursales.length > 0) {
            // Transformar datos del backend al formato esperado
            tiendas = data.data.sucursales.map(sucursal => ({
                id: sucursal.id,
                nombre: sucursal.nombre,
                direccion: sucursal.direccion,
                lat: parseFloat(sucursal.latitud),
                lng: parseFloat(sucursal.longitud),
                telefono: sucursal.telefono || 'No disponible',
                email: sucursal.email || 'No disponible',
                horarios: {
                    lunes_viernes: sucursal.horario_apertura && sucursal.horario_cierre
                        ? `${sucursal.horario_apertura} - ${sucursal.horario_cierre}`
                        : "8:00 AM - 8:00 PM",
                    sabado: "8:00 AM - 6:00 PM",
                    domingo: "9:00 AM - 5:00 PM"
                },
                gerente: sucursal.gerente || "Por asignar",
                servicios: ["Ventas", "Asesoría", "Mezcla de colores"]
            }));

            console.log(`✅ ${tiendas.length} sucursales cargadas desde el backend`);
            console.log('🏪 Tiendas:', tiendas);
            return true;
        } else {
            console.warn('⚠️ No se encontraron sucursales en la respuesta');
            cargarSucursalesRespaldo();
            return false;
        }

    } catch (error) {
        console.error('❌ Error cargando sucursales:', error);
        showToast('Error al cargar sucursales. Usando datos de respaldo.', 'error');
        // Cargar datos de respaldo
        cargarSucursalesRespaldo();
        return false;
    }
}

// Datos de respaldo en caso de error
function cargarSucursalesRespaldo() {
    tiendas = [
        {
            id: 1,
            nombre: "Paints Pradera Chimaltenango",
            direccion: "Centro Comercial Pradera Chimaltenango, Local 205",
            lat: 14.6579,
            lng: -90.8172,
            telefono: "7849-1234",
            email: "chimaltenango@paints.com.gt",
            horarios: {
                lunes_viernes: "8:00 AM - 8:00 PM",
                sabado: "8:00 AM - 6:00 PM",
                domingo: "9:00 AM - 5:00 PM"
            },
            gerente: "María González",
            servicios: ["Ventas", "Asesoría", "Mezcla de colores", "Delivery"]
        }
    ];
}

// Inicializar página
document.addEventListener('DOMContentLoaded', async function() {
    // Primero cargar las sucursales desde el backend
    await cargarSucursales();

    // Luego inicializar el mapa y mostrar tiendas
    inicializarMapa();
    mostrarTiendas();
    configurarEventos();

    // Mostrar banner de ubicación después de un momento
    setTimeout(() => {
        if (!ubicacionUsuario && !permisosUbicacionSolicitados) {
            mostrarBannerUbicacion();
        }
    }, 2000);
});

function inicializarMapa() {
    // Centrar el mapa en Guatemala
    const centroGuatemala = [14.6349, -90.5069];
    mapa = L.map('mapa').setView(centroGuatemala, 8);

    // Agregar capa de tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(mapa);

    // Agregar marcadores de tiendas
    agregarMarcadoresTiendas();
}

function configurarEventos() {
    document.getElementById('btnUbicacion').addEventListener('click', mostrarModalPermisos);
    document.getElementById('btnMostrarTodas').addEventListener('click', mostrarTodasLasTiendas);
    document.getElementById('btnMasCercana').addEventListener('click', irATiendaMasCercana);

    // Modal events
    document.getElementById('btnPermitirUbicacion').addEventListener('click', obtenerUbicacion);
    document.getElementById('btnCancelarPermisos').addEventListener('click', cerrarModalPermisos);

    // Cerrar modal al hacer clic fuera
    document.getElementById('modalPermisos').addEventListener('click', function(e) {
        if (e.target === this) {
            cerrarModalPermisos();
        }
    });
}

function mostrarBannerUbicacion() {
    document.getElementById('locationBanner').classList.add('show');
}

function ocultarBannerUbicacion() {
    document.getElementById('locationBanner').classList.remove('show');
}

function mostrarModalPermisos() {
    permisosUbicacionSolicitados = true;
    ocultarBannerUbicacion();

    if (!navigator.geolocation) {
        mostrarError('La geolocalización no es compatible con este navegador');
        return;
    }

    document.getElementById('modalPermisos').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function cerrarModalPermisos() {
    document.getElementById('modalPermisos').style.display = 'none';
    document.body.style.overflow = 'auto';
    document.getElementById('instruccionesManual').style.display = 'none';
}

function obtenerUbicacion() {
    mostrarLoading(true);
    ocultarError();

    navigator.geolocation.getCurrentPosition(
        function(position) {
            mostrarLoading(false);
            cerrarModalPermisos();

            ubicacionUsuario = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };

            mostrarUbicacionActual();
            calcularDistancias();
            centrarMapaEnUsuario();
            mostrarTiendas();

            showToast('¡Ubicación detectada correctamente!', 'success');
        },
        function(error) {
            mostrarLoading(false);
            let mensaje;

            switch(error.code) {
                case error.PERMISSION_DENIED:
                    mensaje = "Permiso de geolocalización denegado";
                    document.getElementById('instruccionesManual').style.display = 'block';
                    break;
                case error.POSITION_UNAVAILABLE:
                    mensaje = "Información de ubicación no disponible";
                    break;
                case error.TIMEOUT:
                    mensaje = "Tiempo de espera agotado. Intenta de nuevo.";
                    break;
                default:
                    mensaje = "Error desconocido al obtener ubicación";
                    break;
            }

            showToast(mensaje, 'error');

            // No cerrar el modal en caso de error para que el usuario pueda ver las instrucciones
        },
        {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 300000
        }
    );
}

function calcularDistancia(lat1, lng1, lat2, lng2) {
    const R = 6371; // Radio de la Tierra en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

function calcularDistancias() {
    if (!ubicacionUsuario) return;

    tiendas.forEach(tienda => {
        tienda.distancia = calcularDistancia(
            ubicacionUsuario.lat,
            ubicacionUsuario.lng,
            tienda.lat,
            tienda.lng
        );
    });

    // Ordenar por distancia
    tiendas.sort((a, b) => (a.distancia || Infinity) - (b.distancia || Infinity));
}

function mostrarUbicacionActual() {
    const ubicacionDiv = document.getElementById('ubicacionActual');
    const ubicacionTexto = document.getElementById('ubicacionTexto');

    ubicacionTexto.textContent = `Tu ubicación detectada correctamente`;
    ubicacionDiv.style.display = 'block';
}

function centrarMapaEnUsuario() {
    if (!ubicacionUsuario) return;

    // Remover marcador anterior si existe
    if (marcadorUsuario) {
        mapa.removeLayer(marcadorUsuario);
    }

    // Crear icono personalizado para usuario
    const iconoUsuario = L.divIcon({
        className: 'custom-div-icon',
        html: '<div style="background-color: #e74c3c; color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; font-weight: bold; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"><i class="fas fa-user"></i></div>',
        iconSize: [30, 30],
        iconAnchor: [15, 15]
    });

    // Agregar nuevo marcador
    marcadorUsuario = L.marker([ubicacionUsuario.lat, ubicacionUsuario.lng], { icon: iconoUsuario })
        .addTo(mapa)
        .bindPopup('<strong><i class="fas fa-user"></i> Tu ubicación actual</strong>')
        .openPopup();

    // Centrar mapa
    mapa.setView([ubicacionUsuario.lat, ubicacionUsuario.lng], 10);
}

function agregarMarcadoresTiendas() {
    // Limpiar marcadores existentes
    marcadoresTiendas.forEach(marcador => mapa.removeLayer(marcador));
    marcadoresTiendas = [];

    tiendas.forEach((tienda, index) => {
        const esMasCercana = ubicacionUsuario && index === 0;
        const colorIcono = esMasCercana ? '#27ae60' : '#2980b9';

        const icono = L.divIcon({
            className: 'custom-div-icon',
            html: `<div style="background-color: ${colorIcono}; color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; font-weight: bold; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"><i class="fas fa-store"></i></div>`,
            iconSize: [30, 30],
            iconAnchor: [15, 15]
        });

        const marcador = L.marker([tienda.lat, tienda.lng], { icon: icono })
            .addTo(mapa)
            .bindPopup(`
                <div style="max-width: 280px;">
                    <h4>${tienda.nombre} ${esMasCercana ? '<i class="fas fa-star" style="color: gold;"></i>' : ''}</h4>
                    <p><i class="fas fa-map-marker-alt"></i> ${tienda.direccion}</p>
                    <p><i class="fas fa-phone"></i> ${tienda.telefono}</p>
                    <p><i class="fas fa-user-tie"></i> Gerente: ${tienda.gerente}</p>
                    ${tienda.distancia ? `<p><i class="fas fa-route"></i> <strong>${tienda.distancia.toFixed(2)} km</strong> de tu ubicación</p>` : ''}
                    <button onclick="abrirRuta(${tienda.lat}, ${tienda.lng})" class="ruta-btn">
                        <i class="fas fa-directions"></i> Cómo llegar
                    </button>
                </div>
            `);

        marcadoresTiendas.push(marcador);
    });
}

function mostrarTiendas() {
    const grid = document.getElementById('tiendasGrid');

    grid.innerHTML = tiendas.map((tienda, index) => {
        const esMasCercana = ubicacionUsuario && index === 0;
        return `
            <div class="tienda-card ${esMasCercana ? 'mas-cercana' : ''}">
                <div class="tienda-nombre">
                    ${tienda.nombre}
                    ${esMasCercana ? '<i class="fas fa-star" style="color: gold; margin-left: 0.5rem;" title="Tienda más cercana"></i>' : ''}
                </div>

                ${tienda.distancia ?
                    `<div class="distancia ${tienda.distancia < 10 ? 'cercana' : ''}">
                        <i class="fas fa-route"></i> ${tienda.distancia.toFixed(2)} km
                        ${esMasCercana ? ' - ¡Más cercana!' : ''}
                    </div>` : ''
                }

                <div class="contacto-info">
                    <div class="contacto-item">
                        <i class="fas fa-map-marker-alt" style="color: var(--primary-blue);"></i>
                        <span>${tienda.direccion}</span>
                    </div>
                    <div class="contacto-item">
                        <i class="fas fa-phone" style="color: var(--success-green);"></i>
                        <span>${tienda.telefono}</span>
                    </div>
                    <div class="contacto-item">
                        <i class="fas fa-envelope" style="color: var(--info-color);"></i>
                        <span>${tienda.email}</span>
                    </div>
                    <div class="contacto-item">
                        <i class="fas fa-user-tie" style="color: var(--warning-yellow);"></i>
                        <span>Gerente: ${tienda.gerente}</span>
                    </div>
                </div>

                <div class="horario-info">
                    <h5><i class="fas fa-clock"></i> Horarios</h5>
                    <div>Lunes a Viernes: ${tienda.horarios.lunes_viernes}</div>
                    <div>Sábado: ${tienda.horarios.sabado}</div>
                    <div>Domingo: ${tienda.horarios.domingo}</div>
                </div>

                <div style="display: flex; gap: 1rem; margin-top: 1.5rem;">
                    <button onclick="centrarEnTienda(${tienda.lat}, ${tienda.lng})" class="btn btn-primary btn-sm">
                        <i class="fas fa-map"></i> Ver en Mapa
                    </button>
                    <button onclick="abrirRuta(${tienda.lat}, ${tienda.lng})" class="btn btn-success btn-sm">
                        <i class="fas fa-directions"></i> Cómo Llegar
                    </button>
                </div>
            </div>
        `;
    }).join('');

    // Actualizar marcadores en el mapa
    agregarMarcadoresTiendas();
}

function mostrarTodasLasTiendas() {
    // Ajustar vista para mostrar todas las tiendas
    const group = new L.featureGroup(marcadoresTiendas);
    mapa.fitBounds(group.getBounds().pad(0.1));
}

function irATiendaMasCercana() {
    if (!ubicacionUsuario) {
        showToast('Primero debe permitir el acceso a su ubicación', 'warning');
        setTimeout(() => {
            mostrarModalPermisos();
        }, 1000);
        return;
    }

    const tiendaMasCercana = tiendas[0];
    centrarEnTienda(tiendaMasCercana.lat, tiendaMasCercana.lng);

    // Scroll al primer card
    const primerCard = document.querySelector('.tienda-card');
    primerCard.scrollIntoView({ behavior: 'smooth', block: 'center' });

    showToast(`Tienda más cercana: ${tiendaMasCercana.nombre} (${tiendaMasCercana.distancia.toFixed(2)} km)`, 'success');
}

function centrarEnTienda(lat, lng) {
    mapa.setView([lat, lng], 15);

    // Encontrar el marcador correspondiente y abrir popup
    marcadoresTiendas.forEach(marcador => {
        const marcadorLat = marcador.getLatLng().lat;
        const marcadorLng = marcador.getLatLng().lng;
        if (Math.abs(marcadorLat - lat) < 0.001 && Math.abs(marcadorLng - lng) < 0.001) {
            marcador.openPopup();
        }
    });
}

function abrirRuta(lat, lng) {
    // Abrir en Google Maps
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(url, '_blank');
}

function mostrarLoading(mostrar) {
    document.getElementById('loadingSpinner').style.display = mostrar ? 'block' : 'none';
}

function mostrarError(mensaje) {
    document.getElementById('errorTexto').textContent = mensaje;
    document.getElementById('errorMessage').style.display = 'block';
}

function ocultarError() {
    document.getElementById('errorMessage').style.display = 'none';
}

// Toast notifications
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#27ae60' : type === 'error' ? '#e74c3c' : type === 'warning' ? '#f39c12' : '#3498db'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 10001;
        animation: slideInRight 0.3s ease;
        max-width: 350px;
        font-weight: 500;
    `;
    toast.innerHTML = `<i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'times' : type === 'warning' ? 'exclamation-triangle' : 'info'}"></i> ${message}`;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// Agregar estilos de animación
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);
