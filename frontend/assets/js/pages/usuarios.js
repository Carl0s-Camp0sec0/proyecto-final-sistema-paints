// Verificar autenticación y permisos
if (!auth.isAuthenticated()) {
    window.location.href = '/frontend/pages/public/login.html';
}

if (!auth.hasPermission([CONFIG.ROLES.ADMIN])) {
    Utils.showToast('Solo los administradores pueden gestionar usuarios', 'error');
    window.location.href = '/frontend/pages/admin/dashboard.html';
}

// Variables globales
let currentUsers = [];
let currentPage = 1;
let totalPages = 1;

// Cargar datos del usuario
function loadUserData() {
    document.getElementById('userAvatar').textContent = auth.getUserInitials();
    document.getElementById('userName').textContent = auth.user.nombre_completo;
    document.getElementById('userRole').textContent = auth.user.rol;
    document.getElementById('sidebarRole').textContent = auth.user.rol;
    document.getElementById('sidebarEmail').textContent = auth.user.email;
}

// Cargar sucursales
async function loadBranches() {
    try {
        const response = await api.getSucursales();
        if (response.success) {
            const branchFilter = document.getElementById('branchFilter');
            const branchOptions = response.data.map(branch =>
                `<option value="${branch.id}">${branch.nombre}</option>`
            ).join('');
            branchFilter.innerHTML = '<option value="">Todas las Sucursales</option>' + branchOptions;

            const userBranch = document.getElementById('userBranch');
            userBranch.innerHTML = '<option value="">Seleccionar Sucursal</option>' + branchOptions;
        }
    } catch (error) {
        console.error('Error loading branches:', error);
    }
}

// Cargar usuarios
async function loadUsers(page = 1) {
    try {
        currentPage = page;
        const searchTerm = document.getElementById('searchInput').value;
        const roleFilter = document.getElementById('roleFilter').value;
        const branchFilter = document.getElementById('branchFilter').value;
        const statusFilter = document.getElementById('statusFilter').value;

        const params = {
            page: currentPage,
            limit: 12
        };

        if (searchTerm) params.buscar = searchTerm;
        if (roleFilter) params.rol = roleFilter;
        if (branchFilter) params.sucursal_id = branchFilter;
        if (statusFilter) params.activo = statusFilter;

        document.getElementById('usersContainer').innerHTML = '<div class="loading"><div class="spinner"></div></div>';

        const response = await api.getUsuarios(params);

        if (response.success) {
            currentUsers = response.data;
            displayUsers(response.data);
            updateStats(response.data);

            if (response.pagination) {
                totalPages = response.pagination.pages;
                displayPagination();
            }
        } else {
            throw new Error(response.message);
        }

    } catch (error) {
        console.error('Error loading users:', error);
        displayError('Error cargando usuarios');
    }
}

// Mostrar usuarios
function displayUsers(users) {
    const container = document.getElementById('usersContainer');

    if (!users || users.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: var(--gray-500);">
                <i class="fas fa-users" style="font-size: 4rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                <h3>No se encontraron usuarios</h3>
                <p>Intenta ajustar los filtros de búsqueda</p>
            </div>
        `;
        return;
    }

    const usersHTML = users.map(user => `
        <div class="user-card">
            <span class="status-badge status-${user.activo ? 'active' : 'inactive'}">
                ${user.activo ? 'Activo' : 'Inactivo'}
            </span>

            <div class="user-avatar" style="background: ${getRoleColor(user.rol)};">
                ${getUserInitials(user.nombre_completo)}
            </div>

            <div style="text-align: center;">
                <h3 style="margin: 0 0 0.5rem 0; font-size: 1.25rem; font-weight: 600;">${user.nombre_completo}</h3>

                <div style="margin-bottom: 1rem;">
                    <span class="role-badge role-${user.rol?.toLowerCase() || 'default'}">${user.rol || 'Sin rol'}</span>
                </div>

                <div class="user-info-item">
                    <i class="fas fa-envelope"></i>
                    <span>${user.email}</span>
                </div>

                ${user.telefono ? `
                <div class="user-info-item">
                    <i class="fas fa-phone"></i>
                    <span>${user.telefono}</span>
                </div>
                ` : ''}

                <div class="user-info-item">
                    <i class="fas fa-building"></i>
                    <span>${user.sucursal?.nombre || 'Sin sucursal'}</span>
                </div>

                <div class="user-info-item">
                    <i class="fas fa-calendar"></i>
                    <span>Desde ${Utils.formatDate(user.created_at)}</span>
                </div>
            </div>

            <div class="user-actions">
                <button class="btn btn-sm btn-secondary" onclick="viewUserDetails(${user.id})" title="Ver detalles">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-sm btn-primary" onclick="editUser(${user.id})" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                ${user.id !== auth.user.id ? `
                <button class="btn btn-sm ${user.activo ? 'btn-warning' : 'btn-success'}"
                        onclick="toggleUserStatus(${user.id}, ${user.activo})"
                        title="${user.activo ? 'Desactivar' : 'Activar'}">
                    <i class="fas fa-${user.activo ? 'ban' : 'check'}"></i>
                </button>
                ` : ''}
                ${user.id !== auth.user.id ? `
                <button class="btn btn-sm btn-danger" onclick="deleteUser(${user.id}, '${user.nombre_completo.replace(/'/g, "\\'")}') title="Eliminar">
                    <i class="fas fa-trash"></i>
                </button>
                ` : ''}
            </div>
        </div>
    `).join('');

    container.innerHTML = usersHTML;
}

// Obtener color según rol
function getRoleColor(role) {
    const colors = {
        'Admin': '#EF4444',
        'Gerente': '#3B82F6',
        'Cajero': '#10B981',
        'Digitador': '#F59E0B'
    };
    return colors[role] || '#6B7280';
}

// Obtener iniciales del usuario
function getUserInitials(fullName) {
    if (!fullName) return 'U';
    return fullName.split(' ').map(name => name.charAt(0)).join('').substring(0, 2).toUpperCase();
}

// Actualizar estadísticas
function updateStats(users) {
    const total = users.length;
    const active = users.filter(user => user.activo).length;
    const admins = users.filter(user => user.rol === 'Admin').length;
    const employees = users.filter(user => ['Cajero', 'Digitador'].includes(user.rol)).length;
    const managers = users.filter(user => user.rol === 'Gerente').length;

    document.getElementById('totalUsers').textContent = total;
    document.getElementById('activeUsers').textContent = active;
    document.getElementById('adminUsers').textContent = admins;
    document.getElementById('employeeUsers').textContent = employees;
    document.getElementById('managerUsers').textContent = managers;
}

// Mostrar error
function displayError(message) {
    document.getElementById('usersContainer').innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: var(--error-red);">
            <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 1rem;"></i>
            <h3>Error</h3>
            <p>${message}</p>
        </div>
    `;
}

// Mostrar paginación
function displayPagination() {
    const container = document.getElementById('paginationContainer');

    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }

    let paginationHTML = '<div style="display: flex; justify-content: center; gap: 0.5rem;">';

    if (currentPage > 1) {
        paginationHTML += `<button class="btn btn-secondary" onclick="loadUsers(${currentPage - 1})">Anterior</button>`;
    }

    for (let i = Math.max(1, currentPage - 2); i <= Math.min(totalPages, currentPage + 2); i++) {
        const activeClass = i === currentPage ? 'btn-primary' : 'btn-secondary';
        paginationHTML += `<button class="btn ${activeClass}" onclick="loadUsers(${i})">${i}</button>`;
    }

    if (currentPage < totalPages) {
        paginationHTML += `<button class="btn btn-secondary" onclick="loadUsers(${currentPage + 1})">Siguiente</button>`;
    }

    paginationHTML += '</div>';
    container.innerHTML = paginationHTML;
}

// Otras funciones necesarias (agregar, editar, eliminar, etc.)
function showAddUserModal() {
    document.getElementById('modalTitle').textContent = 'Nuevo Usuario';
    document.getElementById('userForm').reset();
    document.getElementById('userId').value = '';
    document.getElementById('passwordHelp').style.display = 'none';
    document.getElementById('userPassword').required = true;
    document.getElementById('userModal').classList.add('active');
}

function closeUserModal() {
    document.getElementById('userModal').classList.remove('active');
}

function closeDetailsModal() {
    document.getElementById('detailsModal').classList.remove('active');
}

function togglePasswordVisibility(inputId) {
    const input = document.getElementById(inputId);
    const icon = input.nextElementSibling.querySelector('i');

    if (input.type === 'password') {
        input.type = 'text';
        icon.className = 'fas fa-eye-slash';
    } else {
        input.type = 'password';
        icon.className = 'fas fa-eye';
    }
}

function applyFilters() {
    loadUsers(1);
}

function clearFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('roleFilter').value = '';
    document.getElementById('branchFilter').value = '';
    document.getElementById('statusFilter').value = '';
    loadUsers(1);
}

// Implementar las funciones restantes...
function viewUserDetails(userId) {
    Utils.showToast('Función de detalles en desarrollo', 'info');
}

function editUser(userId) {
    Utils.showToast('Función de edición en desarrollo', 'info');
}

function toggleUserStatus(userId, currentStatus) {
    Utils.showToast('Función de cambio de estado en desarrollo', 'info');
}

function deleteUser(userId, userName) {
    Utils.showToast('Función de eliminación en desarrollo', 'info');
}

// Configurar event listeners
function setupEventListeners() {
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', Utils.debounce(() => {
        loadUsers(1);
    }, 300));

    ['roleFilter', 'branchFilter', 'statusFilter'].forEach(filterId => {
        document.getElementById(filterId).addEventListener('change', () => {
            loadUsers(1);
        });
    });

    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-overlay')) {
            closeUserModal();
            closeDetailsModal();
        }
    });
}

// Hacer funciones disponibles globalmente
window.showAddUserModal = showAddUserModal;
window.closeUserModal = closeUserModal;
window.closeDetailsModal = closeDetailsModal;
window.togglePasswordVisibility = togglePasswordVisibility;
window.viewUserDetails = viewUserDetails;
window.editUser = editUser;
window.toggleUserStatus = toggleUserStatus;
window.deleteUser = deleteUser;
window.applyFilters = applyFilters;
window.clearFilters = clearFilters;
window.loadUsers = loadUsers;

// Inicializar página
document.addEventListener('DOMContentLoaded', async () => {
    loadUserData();
    setupEventListeners();
    await loadBranches();
    await loadUsers();
});
