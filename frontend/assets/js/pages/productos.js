        // Verificar autenticación y permisos
        if (!auth.isAuthenticated()) {
            window.location.href = '/frontend/pages/public/login.html';
        }

        if (!auth.hasPermission([CONFIG.ROLES.ADMIN, CONFIG.ROLES.DIGITADOR])) {
            Utils.showToast('No tienes permisos para gestionar productos', 'error');
            window.location.href = '/frontend/pages/admin/dashboard.html';
        }

        // Variables globales
        let currentProducts = [];
        let currentPage = 1;
        let totalPages = 1;
        let currentView = 'grid';

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
                const response = await api.getCategorias();
                if (response.success) {
                    // Para filtros
                    const categoryFilter = document.getElementById('categoryFilter');
                    const categoryOptions = response.data.map(cat => 
                        `<option value="${cat.id}">${cat.nombre}</option>`
                    ).join('');
                    categoryFilter.innerHTML = '<option value="">Todas las Categorías</option>' + categoryOptions;

                    // Para formulario
                    const productCategory = document.getElementById('productCategory');
                    productCategory.innerHTML = '<option value="">Seleccionar Categoría</option>' + categoryOptions;
                }
            } catch (error) {
                console.error('Error loading categories:', error);
            }
        }

        // Cargar productos
        async function loadProducts(page = 1) {
            try {
                currentPage = page;
                const searchTerm = document.getElementById('searchInput').value;
                const categoryId = document.getElementById('categoryFilter').value;
                const stockFilter = document.getElementById('stockFilter').value;
                const sortBy = document.getElementById('sortFilter').value;

                const params = {
                    page: currentPage,
                    limit: 12
                };

                if (searchTerm) params.buscar = searchTerm;
                if (categoryId) params.categoria_id = categoryId;
                if (stockFilter) params.stock_filter = stockFilter;
                if (sortBy) params.orden = sortBy;

                // Mostrar loading
                if (currentView === 'grid') {
                    document.getElementById('productsGrid').innerHTML = '<div class="loading"><div class="spinner"></div></div>';
                } else {
                    document.getElementById('productsTableBody').innerHTML = '<tr><td colspan="7" style="text-align: center;"><div class="spinner"></div></td></tr>';
                }

                const response = await api.getProductos(params);
                
                if (response.success) {
                    currentProducts = response.data;
                    displayProducts(response.data);
                    updateStats(response.data);
                    
                    if (response.pagination) {
                        totalPages = response.pagination.pages;
                        displayPagination();
                    }
                } else {
                    throw new Error(response.message);
                }

            } catch (error) {
                console.error('Error loading products:', error);
                displayError('Error cargando productos');
            }
        }

        // Mostrar productos en grid
        function displayProductsGrid(products) {
            const container = document.getElementById('productsGrid');
            
            if (!products || products.length === 0) {
                container.innerHTML = `
                    <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: var(--gray-500);">
                        <i class="fas fa-box" style="font-size: 4rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                        <h3>No se encontraron productos</h3>
                        <p>Intenta ajustar los filtros de búsqueda</p>
                    </div>
                `;
                return;
            }

            const productsHTML = products.map(product => {
                const stockStatus = getStockStatus(product.stock_actual || 0, product.stock_minimo || 5);
                return `
                    <div class="product-card">
                        <div class="product-image">
                            <i class="fas fa-${getProductIcon(product.tipo)}"></i>
                        </div>
                        <div class="product-content">
                            <span class="product-category">${product.categoria?.nombre || 'Sin categoría'}</span>
                            <h3 style="margin: 0.5rem 0; font-size: 1.125rem; font-weight: 600;">${product.nombre}</h3>
                            <p style="margin: 0.5rem 0; color: var(--gray-600); font-size: 0.875rem;">${product.marca || 'Sin marca'}</p>
                            <div style="margin: 0.75rem 0;">
                                <span style="font-size: 1.5rem; font-weight: 700; color: var(--primary-blue);">
                                    ${Utils.formatCurrency(product.precio_base)}
                                </span>
                                ${product.porcentaje_descuento > 0 ? `
                                    <span style="margin-left: 0.5rem; padding: 0.25rem 0.5rem; background: var(--error-red); color: white; border-radius: 4px; font-size: 0.75rem;">
                                        -${product.porcentaje_descuento}%
                                    </span>
                                ` : ''}
                            </div>
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                                <span style="font-size: 0.875rem; color: var(--gray-600);">Stock: ${product.stock_actual || 0}</span>
                                <span class="stock-badge stock-${stockStatus.class}">${stockStatus.text}</span>
                            </div>
                            <div class="product-actions">
                                <button class="btn btn-sm btn-secondary" onclick="viewProductDetails(${product.id})" title="Ver detalles">
                                    <i class="fas fa-eye"></i>
                                </button>
                                <button class="btn btn-sm btn-primary" onclick="editProduct(${product.id})" title="Editar">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn btn-sm btn-danger" onclick="deleteProduct(${product.id}, '${product.nombre.replace(/'/g, "\\'")}')" title="Eliminar">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');

            container.innerHTML = productsHTML;
        }

        // Mostrar productos en tabla
        function displayProductsTable(products) {
            const tbody = document.getElementById('productsTableBody');
            
            if (!products || products.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="7" style="text-align: center; padding: 2rem; color: var(--gray-500);">
                            No se encontraron productos
                        </td>
                    </tr>
                `;
                return;
            }

            const productsHTML = products.map(product => {
                const stockStatus = getStockStatus(product.stock_actual || 0, product.stock_minimo || 5);
                return `
                    <tr>
                        <td>
                            <div style="display: flex; align-items: center; gap: 0.75rem;">
                                <div style="width: 40px; height: 40px; background: var(--primary-blue); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white;">
                                    <i class="fas fa-${getProductIcon(product.tipo)}"></i>
                                </div>
                                <div>
                                    <div style="font-weight: 600;">${product.nombre}</div>
                                    <div style="font-size: 0.875rem; color: var(--gray-600);">${product.codigo}</div>
                                </div>
                            </div>
                        </td>
                        <td>${product.categoria?.nombre || 'Sin categoría'}</td>
                        <td>${product.marca || 'Sin marca'}</td>
                        <td>
                            <div style="font-weight: 600; color: var(--primary-blue);">
                                ${Utils.formatCurrency(product.precio_base)}
                            </div>
                            ${product.porcentaje_descuento > 0 ? `
                                <div style="font-size: 0.75rem; color: var(--error-red);">
                                    -${product.porcentaje_descuento}%
                                </div>
                            ` : ''}
                        </td>
                        <td style="font-weight: 600;">${product.stock_actual || 0}</td>
                        <td>
                            <span class="stock-badge stock-${stockStatus.class}">${stockStatus.text}</span>
                        </td>
                        <td>
                            <div style="display: flex; gap: 0.25rem;">
                                <button class="btn btn-sm btn-secondary" onclick="viewProductDetails(${product.id})" title="Ver">
                                    <i class="fas fa-eye"></i>
                                </button>
                                <button class="btn btn-sm btn-primary" onclick="editProduct(${product.id})" title="Editar">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn btn-sm btn-danger" onclick="deleteProduct(${product.id}, '${product.nombre.replace(/'/g, "\\'")}')" title="Eliminar">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');

            tbody.innerHTML = productsHTML;
        }

        // Función principal para mostrar productos
        function displayProducts(products) {
            if (currentView === 'grid') {
                displayProductsGrid(products);
            } else {
                displayProductsTable(products);
            }
        }

        // Obtener estado del stock
        function getStockStatus(current, minimum) {
            if (current === 0) {
                return { class: 'out', text: 'Agotado' };
            } else if (current <= minimum) {
                return { class: 'low', text: 'Stock Bajo' };
            } else {
                return { class: 'good', text: 'En Stock' };
            }
        }

        // Obtener icono según tipo de producto
        function getProductIcon(type) {
            const icons = {
                'pintura': 'paint-brush',
                'accesorio': 'tools',
                'solvente': 'flask',
                'barniz': 'tint'
            };
            return icons[type] || 'box';
        }

        // Actualizar estadísticas
        function updateStats(products) {
            const total = products.length;
            let inStock = 0;
            let lowStock = 0;
            let outOfStock = 0;

            products.forEach(product => {
                const current = product.stock_actual || 0;
                const minimum = product.stock_minimo || 5;
                
                if (current === 0) {
                    outOfStock++;
                } else if (current <= minimum) {
                    lowStock++;
                } else {
                    inStock++;
                }
            });

            document.getElementById('totalProducts').textContent = total;
            document.getElementById('inStockProducts').textContent = inStock;
            document.getElementById('lowStockProducts').textContent = lowStock;
            document.getElementById('outOfStockProducts').textContent = outOfStock;
        }

        // Mostrar error
        function displayError(message) {
            if (currentView === 'grid') {
                document.getElementById('productsGrid').innerHTML = `
                    <div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: var(--error-red);">
                        <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                        <h3>Error</h3>
                        <p>${message}</p>
                    </div>
                `;
            } else {
                document.getElementById('productsTableBody').innerHTML = `
                    <tr>
                        <td colspan="7" style="text-align: center; padding: 2rem; color: var(--error-red);">
                            Error: ${message}
                        </td>
                    </tr>
                `;
            }
        }

        // Cambiar vista
        function toggleView(view) {
            currentView = view;
            
            // Actualizar botones
            document.getElementById('gridViewBtn').classList.toggle('active', view === 'grid');
            document.getElementById('tableViewBtn').classList.toggle('active', view === 'table');
            
            // Mostrar/ocultar vistas
            document.getElementById('productsGrid').classList.toggle('hidden', view !== 'grid');
            document.getElementById('productsTable').classList.toggle('active', view === 'table');
            
            // Mostrar productos en la nueva vista
            displayProducts(currentProducts);
        }

        // Mostrar modal agregar producto
        function showAddProductModal() {
            document.getElementById('modalTitle').textContent = 'Nuevo Producto';
            document.getElementById('productForm').reset();
            document.getElementById('productId').value = '';
            document.getElementById('productModal').classList.add('active');
        }

        // Cerrar modal producto
        function closeProductModal() {
            document.getElementById('productModal').classList.remove('active');
        }

        // Manejar cambio de tipo de producto
        function handleProductTypeChange() {
            const type = document.getElementById('productType').value;
            const specificFields = document.getElementById('specificFields');
            
            let fieldsHTML = '';
            
            switch (type) {
                case 'pintura':
                case 'barniz':
                    fieldsHTML = `
                        <h5 style="margin: 1rem 0 0.5rem 0; color: var(--secondary-blue);">Información Específica de ${type.charAt(0).toUpperCase() + type.slice(1)}</h5>
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Color</label>
                                <input type="text" class="form-input" id="productColor" placeholder="Ej: Blanco, Azul marino">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Unidad de Medida *</label>
                                <select class="form-select" id="productUnit" required>
                                    <option value="">Seleccionar</option>
                                    <option value="1/32">1/32 galón</option>
                                    <option value="1/16">1/16 galón</option>
                                    <option value="1/8">1/8 galón</option>
                                    <option value="1/4">1/4 galón</option>
                                    <option value="1/2">1/2 galón</option>
                                    <option value="1">1 galón</option>
                                    ${type === 'pintura' ? '<option value="cubeta">1 cubeta</option>' : ''}
                                </select>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Duración (años)</label>
                                <input type="number" class="form-input" id="productDuration" min="0" step="0.1" placeholder="5">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Cobertura (m²)</label>
                                <input type="number" class="form-input" id="productCoverage" min="0" step="0.1" placeholder="10">
                            </div>
                        </div>
                    `;
                    break;
                case 'solvente':
                    fieldsHTML = `
                        <h5 style="margin: 1rem 0 0.5rem 0; color: var(--secondary-blue);">Información Específica de Solvente</h5>
                        <div class="form-group">
                            <label class="form-label">Unidad de Medida *</label>
                            <select class="form-select" id="productUnit" required>
                                <option value="">Seleccionar</option>
                                <option value="1/32">1/32 galón</option>
                                <option value="1/16">1/16 galón</option>
                                <option value="1/8">1/8 galón</option>
                                <option value="1/4">1/4 galón</option>
                                <option value="1/2">1/2 galón</option>
                            </select>
                        </div>
                    `;
                    break;
                case 'accesorio':
                    fieldsHTML = `
                        <h5 style="margin: 1rem 0 0.5rem 0; color: var(--secondary-blue);">Información Específica de Accesorio</h5>
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Tamaño/Medida</label>
                                <input type="text" class="form-input" id="productSize" placeholder="Ej: 4 pulgadas, Grande, Mediano">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Material</label>
                                <input type="text" class="form-input" id="productMaterial" placeholder="Ej: Nylon, Madera, Plástico">
                            </div>
                        </div>
                        <input type="hidden" id="productUnit" value="unidad">
                    `;
                    break;
            }
            
            specificFields.innerHTML = fieldsHTML;
        }

        // Mostrar paginación
        function displayPagination() {
            const container = document.getElementById('paginationContainer');
            
            if (totalPages <= 1) {
                container.innerHTML = '';
                return;
            }

            let paginationHTML = '<div style="display: flex; justify-content: center; gap: 0.5rem;">';
            
            // Botón anterior
            if (currentPage > 1) {
                paginationHTML += `<button class="btn btn-secondary" onclick="loadProducts(${currentPage - 1})">Anterior</button>`;
            }
            
            // Números de página
            for (let i = Math.max(1, currentPage - 2); i <= Math.min(totalPages, currentPage + 2); i++) {
                const activeClass = i === currentPage ? 'btn-primary' : 'btn-secondary';
                paginationHTML += `<button class="btn ${activeClass}" onclick="loadProducts(${i})">${i}</button>`;
            }
            
            // Botón siguiente
            if (currentPage < totalPages) {
                paginationHTML += `<button class="btn btn-secondary" onclick="loadProducts(${currentPage + 1})">Siguiente</button>`;
            }

            paginationHTML += '</div>';
            container.innerHTML = paginationHTML;
        }

        // Aplicar filtros
        function applyFilters() {
            loadProducts(1);
        }

        // Limpiar filtros
        function clearFilters() {
            document.getElementById('searchInput').value = '';
            document.getElementById('categoryFilter').value = '';
            document.getElementById('stockFilter').value = '';
            document.getElementById('sortFilter').value = 'nombre';
            loadProducts(1);
        }

        // Manejar envío del formulario
        document.getElementById('productForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const isEdit = !!document.getElementById('productId').value;
            
            try {
                const formData = {
                    nombre: document.getElementById('productName').value,
                    codigo: document.getElementById('productCode').value,
                    categoria_id: parseInt(document.getElementById('productCategory').value),
                    marca: document.getElementById('productBrand').value || null,
                    tipo: document.getElementById('productType').value,
                    descripcion: document.getElementById('productDescription').value || null,
                    precio_base: parseFloat(document.getElementById('productPrice').value),
                    porcentaje_descuento: parseFloat(document.getElementById('productDiscount').value) || 0,
                    stock_actual: parseInt(document.getElementById('productStock').value),
                    stock_minimo: parseInt(document.getElementById('productMinStock').value),
                    activo: document.getElementById('productActive').checked
                };

                // Agregar campos específicos según el tipo
                const type = document.getElementById('productType').value;
                if (['pintura', 'barniz'].includes(type)) {
                    formData.color = document.getElementById('productColor').value || null;
                    formData.unidad_medida = document.getElementById('productUnit').value;
                    formData.tiempo_duracion_anos = parseFloat(document.getElementById('productDuration').value) || null;
                    formData.cobertura_metros_cuadrados = parseFloat(document.getElementById('productCoverage').value) || null;
                } else if (type === 'solvente') {
                    formData.unidad_medida = document.getElementById('productUnit').value;
                } else if (type === 'accesorio') {
                    formData.tamano = document.getElementById('productSize').value || null;
                    formData.material = document.getElementById('productMaterial').value || null;
                    formData.unidad_medida = 'unidad';
                }

                let response;
                if (isEdit) {
                    response = await api.updateProducto(document.getElementById('productId').value, formData);
                } else {
                    response = await api.createProducto(formData);
                }

                if (response.success) {
                    Utils.showToast(isEdit ? 'Producto actualizado exitosamente' : 'Producto creado exitosamente', 'success');
                    closeProductModal();
                    loadProducts(currentPage);
                } else {
                    Utils.showToast(response.message || 'Error al guardar el producto', 'error');
                }

            } catch (error) {
                console.error('Error saving product:', error);
                Utils.showToast('Error al guardar el producto', 'error');
            }
        });

        // Ver detalles del producto
        async function viewProductDetails(productId) {
            try {
                const response = await api.getProducto(productId);
                
                if (response.success) {
                    const product = response.data;
                    const stockStatus = getStockStatus(product.stock_actual || 0, product.stock_minimo || 5);
                    
                    const detailsHTML = `
                        <div class="product-details">
                            <div class="detail-item">
                                <div class="detail-label">Nombre</div>
                                <div class="detail-value">${product.nombre}</div>
                            </div>
                            <div class="detail-item">
                                <div class="detail-label">Código</div>
                                <div class="detail-value">${product.codigo}</div>
                            </div>
                            <div class="detail-item">
                                <div class="detail-label">Categoría</div>
                                <div class="detail-value">${product.categoria?.nombre || 'Sin categoría'}</div>
                            </div>
                            <div class="detail-item">
                                <div class="detail-label">Marca</div>
                                <div class="detail-value">${product.marca || 'Sin marca'}</div>
                            </div>
                            <div class="detail-item">
                                <div class="detail-label">Tipo</div>
                                <div class="detail-value">${product.tipo?.charAt(0).toUpperCase() + product.tipo?.slice(1) || 'No especificado'}</div>
                            </div>
                            <div class="detail-item">
                                <div class="detail-label">Precio Base</div>
                                <div class="detail-value">${Utils.formatCurrency(product.precio_base)}</div>
                            </div>
                            ${product.porcentaje_descuento > 0 ? `
                            <div class="detail-item">
                                <div class="detail-label">Descuento</div>
                                <div class="detail-value">${product.porcentaje_descuento}%</div>
                            </div>
                            ` : ''}
                            <div class="detail-item">
                                <div class="detail-label">Stock Actual</div>
                                <div class="detail-value">
                                    ${product.stock_actual || 0} 
                                    <span class="stock-badge stock-${stockStatus.class}">${stockStatus.text}</span>
                                </div>
                            </div>
                            <div class="detail-item">
                                <div class="detail-label">Stock Mínimo</div>
                                <div class="detail-value">${product.stock_minimo || 0}</div>
                            </div>
                            ${product.unidad_medida ? `
                            <div class="detail-item">
                                <div class="detail-label">Unidad de Medida</div>
                                <div class="detail-value">${product.unidad_medida}</div>
                            </div>
                            ` : ''}
                            ${product.color ? `
                            <div class="detail-item">
                                <div class="detail-label">Color</div>
                                <div class="detail-value">${product.color}</div>
                            </div>
                            ` : ''}
                            ${product.tiempo_duracion_anos ? `
                            <div class="detail-item">
                                <div class="detail-label">Duración</div>
                                <div class="detail-value">${product.tiempo_duracion_anos} años</div>
                            </div>
                            ` : ''}
                            ${product.cobertura_metros_cuadrados ? `
                            <div class="detail-item">
                                <div class="detail-label">Cobertura</div>
                                <div class="detail-value">${product.cobertura_metros_cuadrados} m²</div>
                            </div>
                            ` : ''}
                            <div class="detail-item">
                                <div class="detail-label">Estado</div>
                                <div class="detail-value">
                                    <span class="stock-badge ${product.activo ? 'stock-good' : 'stock-out'}">
                                        ${product.activo ? 'Activo' : 'Inactivo'}
                                    </span>
                                </div>
                            </div>
                        </div>
                        ${product.descripcion ? `
                        <div style="margin-top: 1.5rem;">
                            <h4>Descripción</h4>
                            <p style="background: var(--gray-50); padding: 1rem; border-radius: var(--border-radius); margin-top: 0.5rem;">
                                ${product.descripcion}
                            </p>
                        </div>
                        ` : ''}
                    `;
                    
                    document.getElementById('productDetailsContent').innerHTML = detailsHTML;
                    document.getElementById('detailsModal').classList.add('active');
                } else {
                    Utils.showToast('Error cargando detalles del producto', 'error');
                }
                
            } catch (error) {
                console.error('Error loading product details:', error);
                Utils.showToast('Error cargando detalles del producto', 'error');
            }
        }

        // Cerrar modal detalles
        function closeDetailsModal() {
            document.getElementById('detailsModal').classList.remove('active');
        }

        // Editar producto
        async function editProduct(productId) {
            try {
                const response = await api.getProducto(productId);
                
                if (response.success) {
                    const product = response.data;
                    
                    // Llenar formulario
                    document.getElementById('modalTitle').textContent = 'Editar Producto';
                    document.getElementById('productId').value = product.id;
                    document.getElementById('productName').value = product.nombre;
                    document.getElementById('productCode').value = product.codigo;
                    document.getElementById('productCategory').value = product.categoria_id || '';
                    document.getElementById('productBrand').value = product.marca || '';
                    document.getElementById('productType').value = product.tipo || '';
                    document.getElementById('productDescription').value = product.descripcion || '';
                    document.getElementById('productPrice').value = product.precio_base;
                    document.getElementById('productDiscount').value = product.porcentaje_descuento || 0;
                    document.getElementById('productStock').value = product.stock_actual || 0;
                    document.getElementById('productMinStock').value = product.stock_minimo || 0;
                    document.getElementById('productActive').checked = product.activo;
                    
                    // Generar campos específicos y llenarlos
                    handleProductTypeChange();
                    
                    setTimeout(() => {
                        if (document.getElementById('productColor')) {
                            document.getElementById('productColor').value = product.color || '';
                        }
                        if (document.getElementById('productUnit')) {
                            document.getElementById('productUnit').value = product.unidad_medida || '';
                        }
                        if (document.getElementById('productDuration')) {
                            document.getElementById('productDuration').value = product.tiempo_duracion_anos || '';
                        }
                        if (document.getElementById('productCoverage')) {
                            document.getElementById('productCoverage').value = product.cobertura_metros_cuadrados || '';
                        }
                        if (document.getElementById('productSize')) {
                            document.getElementById('productSize').value = product.tamano || '';
                        }
                        if (document.getElementById('productMaterial')) {
                            document.getElementById('productMaterial').value = product.material || '';
                        }
                    }, 100);
                    
                    document.getElementById('productModal').classList.add('active');
                } else {
                    Utils.showToast('Error cargando datos del producto', 'error');
                }
                
            } catch (error) {
                console.error('Error loading product for edit:', error);
                Utils.showToast('Error cargando datos del producto', 'error');
            }
        }

        // Eliminar producto
        async function deleteProduct(productId, productName) {
            const confirmed = await Utils.confirm(
                `¿Estás seguro de que deseas eliminar el producto "${productName}"?`,
                'Esta acción no se puede deshacer'
            );
            
            if (confirmed) {
                try {
                    const response = await api.deleteProducto(productId);
                    
                    if (response.success) {
                        Utils.showToast('Producto eliminado exitosamente', 'success');
                        loadProducts(currentPage);
                    } else {
                        Utils.showToast(response.message || 'Error eliminando el producto', 'error');
                    }
                    
                } catch (error) {
                    console.error('Error deleting product:', error);
                    Utils.showToast('Error eliminando el producto', 'error');
                }
            }
        }

        // Configurar event listeners
        function setupEventListeners() {
            // Búsqueda con debounce
            const searchInput = document.getElementById('searchInput');
            searchInput.addEventListener('input', Utils.debounce(() => {
                loadProducts(1);
            }, 300));

            // Filtros
            ['categoryFilter', 'stockFilter', 'sortFilter'].forEach(filterId => {
                document.getElementById(filterId).addEventListener('change', () => {
                    loadProducts(1);
                });
            });

            // Cerrar modales al hacer click fuera
            document.addEventListener('click', (e) => {
                if (e.target.classList.contains('modal-overlay')) {
                    closeProductModal();
                    closeDetailsModal();
                }
            });
        }

        // Hacer funciones disponibles globalmente
        window.toggleView = toggleView;
        window.showAddProductModal = showAddProductModal;
        window.closeProductModal = closeProductModal;
        window.closeDetailsModal = closeDetailsModal;
        window.handleProductTypeChange = handleProductTypeChange;
        window.viewProductDetails = viewProductDetails;
        window.editProduct = editProduct;
        window.deleteProduct = deleteProduct;
        window.applyFilters = applyFilters;
        window.clearFilters = clearFilters;
        window.loadProducts = loadProducts;

        // Inicializar página
        document.addEventListener('DOMContentLoaded', async () => {
            loadUserData();
            setupEventListeners();
            await loadCategories();
            await loadProducts();
        });
    </script>
