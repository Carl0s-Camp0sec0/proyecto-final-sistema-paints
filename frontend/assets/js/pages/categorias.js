// Verificar autenticación y permisos
if (!auth.isAuthenticated()) {
    window.location.href = '/frontend/pages/public/login.html';
}

if (!auth.hasPermission([CONFIG.ROLES.ADMIN, CONFIG.ROLES.DIGITADOR])) {
    Utils.showToast('No tienes permisos para gestionar categorías', 'error');
    window.location.href = '/frontend/pages/admin/dashboard.html';
}

// Variables globales
let currentCategories = [];

// Cargar datos del usuario
function loadUserData() {
    document.getElementById('userAvatar').textContent = auth.getUserInitials();
    document.getElementById('userName').textContent = auth.user.nombre_completo;
    document.getElementById('userRole').textContent = auth.user.rol;
    document.getElementById('sidebarRole').textContent = auth.user.rol;
    document.getElementById('sidebarEmail').textContent = auth.user.email;
}

// Cargar categorías
async function loadCategories() {
    try {
        document.getElementById('categoriesContainer').innerHTML = '<div class="loading"><div class="spinner"></div></div>';

        const response = await api.getCategorias();

        if (response.success) {
            currentCategories = response.data;
            displayCategories(response.data);
            updateStats(response.data);
        } else {
            throw new Error(response.message);
        }

    } catch (error) {
        console.error('Error loading categories:', error);
        displayError('Error cargando categorías');
    }
}

// Mostrar categorías
function displayCategories(categories) {
    const container = document.getElementById('categoriesContainer');

    if (!categories || categories.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: var(--gray-500);">
                <i class="fas fa-tags" style="font-size: 4rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                <h3>No hay categorías</h3>
                <p>Crea tu primera categoría para organizar los productos</p>
                <button class="btn btn-primary" onclick="showAddCategoryModal()" style="margin-top: 1rem;">
                    <i class="fas fa-plus"></i>
                    Nueva Categoría
                </button>
            </div>
        `;
        return;
    }

    const categoriesHTML = categories.map(category => `
        <div class="category-card">
            <div class="category-icon" style="background: ${category.color || '#3B82F6'};">
                <i class="${category.icono || 'fas fa-tag'}"></i>
            </div>
            <div style="text-align: center;">
                <h3 style="margin: 0 0 0.5rem 0; font-size: 1.25rem; font-weight: 600;">${category.nombre}</h3>
                ${category.descripcion ? `<p style="margin: 0 0 1rem 0; color: var(--gray-600); font-size: 0.875rem;">${category.descripcion}</p>` : ''}
                <div class="category-products">
                    <i class="fas fa-box"></i>
                    ${category.productos_count || 0} productos
                </div>
                <div style="margin-top: 1rem;">
                    <span class="stock-badge ${category.activo ? 'stock-good' : 'stock-out'}">
                        ${category.activo ? 'Activa' : 'Inactiva'}
                    </span>
                </div>
            </div>
            <div class="category-actions">
                <button class="btn btn-sm btn-primary" onclick="editCategory(${category.id})" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-secondary" onclick="viewCategoryProducts(${category.id})" title="Ver productos">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteCategory(${category.id}, '${category.nombre.replace(/'/g, "\\'")}') title="Eliminar">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');

    container.innerHTML = categoriesHTML;
}

// Actualizar estadísticas
function updateStats(categories) {
    const total = categories.length;
    const active = categories.filter(cat => cat.activo).length;
    const totalProducts = categories.reduce((sum, cat) => sum + (cat.productos_count || 0), 0);
    const avgProducts = total > 0 ? Math.round(totalProducts / total) : 0;

    document.getElementById('totalCategories').textContent = total;
    document.getElementById('activeCategories').textContent = active;
    document.getElementById('totalProducts').textContent = totalProducts;
    document.getElementById('avgProductsPerCategory').textContent = avgProducts;
}

// Mostrar error
function displayError(message) {
    document.getElementById('categoriesContainer').innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: var(--error-red);">
            <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 1rem;"></i>
            <h3>Error</h3>
            <p>${message}</p>
        </div>
    `;
}

// Filtrar categorías
function filterCategories() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const filtered = currentCategories.filter(category =>
        category.nombre.toLowerCase().includes(searchTerm) ||
        (category.descripcion && category.descripcion.toLowerCase().includes(searchTerm))
    );
    displayCategories(filtered);
}

// Mostrar modal agregar categoría
function showAddCategoryModal() {
    document.getElementById('modalTitle').textContent = 'Nueva Categoría';
    document.getElementById('categoryForm').reset();
    document.getElementById('categoryId').value = '';
    document.getElementById('categoryColor').value = '#3B82F6';

    // Resetear selector de color
    document.querySelectorAll('.color-option').forEach(option => {
        option.classList.remove('selected');
    });
    document.querySelector('.color-option[data-color="#3B82F6"]').classList.add('selected');

    document.getElementById('categoryModal').classList.add('active');
}

// Cerrar modal categoría
function closeCategoryModal() {
    document.getElementById('categoryModal').classList.remove('active');
}

// Editar categoría
async function editCategory(categoryId) {
    try {
        const response = await api.getCategoria(categoryId);

        if (response.success) {
            const category = response.data;

            document.getElementById('modalTitle').textContent = 'Editar Categoría';
            document.getElementById('categoryId').value = category.id;
            document.getElementById('categoryName').value = category.nombre;
            document.getElementById('categoryDescription').value = category.descripcion || '';
            document.getElementById('categoryIcon').value = category.icono || 'fas fa-tag';
            document.getElementById('categoryColor').value = category.color || '#3B82F6';
            document.getElementById('categoryActive').checked = category.activo;

            // Actualizar selector de color
            document.querySelectorAll('.color-option').forEach(option => {
                option.classList.remove('selected');
            });
            const selectedColor = document.querySelector(`.color-option[data-color="${category.color || '#3B82F6'}"]`);
            if (selectedColor) {
                selectedColor.classList.add('selected');
            }

            document.getElementById('categoryModal').classList.add('active');
        } else {
            Utils.showToast('Error cargando datos de la categoría', 'error');
        }

    } catch (error) {
        console.error('Error loading category for edit:', error);
        Utils.showToast('Error cargando datos de la categoría', 'error');
    }
}

// Ver productos de categoría
function viewCategoryProducts(categoryId) {
    window.location.href = `/frontend/pages/productos/productos.html?categoria=${categoryId}`;
}

// Eliminar categoría
async function deleteCategory(categoryId, categoryName) {
    const confirmed = await Utils.confirm(
        `¿Estás seguro de que deseas eliminar la categoría "${categoryName}"?`,
        'Esta acción afectará todos los productos de esta categoría'
    );

    if (confirmed) {
        try {
            const response = await api.deleteCategoria(categoryId);

            if (response.success) {
                Utils.showToast('Categoría eliminada exitosamente', 'success');
                loadCategories();
            } else {
                Utils.showToast(response.message || 'Error eliminando la categoría', 'error');
            }

        } catch (error) {
            console.error('Error deleting category:', error);
            Utils.showToast('Error eliminando la categoría', 'error');
        }
    }
}

// Configurar event listeners
function setupEventListeners() {
    // Búsqueda con debounce
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', Utils.debounce(filterCategories, 300));

    // Selector de color
    document.querySelectorAll('.color-option').forEach(option => {
        option.addEventListener('click', () => {
            document.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
            document.getElementById('categoryColor').value = option.dataset.color;
        });
    });

    // Cerrar modal al hacer click fuera
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-overlay')) {
            closeCategoryModal();
        }
    });
}

// Manejar envío del formulario
document.getElementById('categoryForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const isEdit = !!document.getElementById('categoryId').value;

    try {
        const formData = {
            nombre: document.getElementById('categoryName').value,
            descripcion: document.getElementById('categoryDescription').value || null,
            icono: document.getElementById('categoryIcon').value,
            color: document.getElementById('categoryColor').value,
            activo: document.getElementById('categoryActive').checked
        };

        let response;
        if (isEdit) {
            response = await api.updateCategoria(document.getElementById('categoryId').value, formData);
        } else {
            response = await api.createCategoria(formData);
        }

        if (response.success) {
            Utils.showToast(isEdit ? 'Categoría actualizada exitosamente' : 'Categoría creada exitosamente', 'success');
            closeCategoryModal();
            loadCategories();
        } else {
            Utils.showToast(response.message || 'Error al guardar la categoría', 'error');
        }

    } catch (error) {
        console.error('Error saving category:', error);
        Utils.showToast('Error al guardar la categoría', 'error');
    }
});

// Hacer funciones disponibles globalmente
window.showAddCategoryModal = showAddCategoryModal;
window.closeCategoryModal = closeCategoryModal;
window.editCategory = editCategory;
window.viewCategoryProducts = viewCategoryProducts;
window.deleteCategory = deleteCategory;

// Inicializar página
document.addEventListener('DOMContentLoaded', () => {
    loadUserData();
    setupEventListeners();
    loadCategories();
});
