        let currentContentType = 'mensaje';
        let selectedClients = new Set();

        document.addEventListener('DOMContentLoaded', function() {
            document.getElementById('promotionForm').addEventListener('submit', handleFormSubmit);
            updateSelectedCount();
        });

        function switchTab(tabName) {
            document.querySelectorAll('.tab-header').forEach(el => el.classList.remove('active'));
            document.querySelectorAll('.tab-pane').forEach(el => el.classList.remove('active'));
            
            document.querySelector(`#tab-${tabName}`).classList.add('active');
            
            const tabHeaders = document.querySelectorAll('.tab-header');
            const tabNames = ['lista', 'nueva', 'plantillas', 'reportes'];
            const index = tabNames.indexOf(tabName);
            if (index !== -1) {
                tabHeaders[index].classList.add('active');
            }
        }

        function selectContentType(type) {
            currentContentType = type;
            
            document.querySelectorAll('.content-type').forEach(el => el.classList.remove('selected'));
            document.querySelector(`#type-${type}`).classList.add('selected');
            
            document.querySelectorAll('.content-editor').forEach(el => el.style.display = 'none');
            if (document.querySelector(`#content-${type}`)) {
                document.querySelector(`#content-${type}`).style.display = 'block';
            }
        }

        function updateSelectedClients() {
            selectedClients.clear();
            document.querySelectorAll('#clientList input[type="checkbox"]:checked').forEach(cb => {
                selectedClients.add(parseInt(cb.value));
            });
            updateSelectedCount();
        }

        function updateSelectedCount() {
            document.getElementById('selectedCount').textContent = `${selectedClients.size} clientes seleccionados`;
        }

        function selectAllClients() {
            document.querySelectorAll('#clientList input[type="checkbox"]').forEach(cb => {
                cb.checked = true;
            });
            updateSelectedClients();
        }

        function clearSelection() {
            document.querySelectorAll('#clientList input[type="checkbox"]').forEach(cb => {
                cb.checked = false;
            });
            updateSelectedClients();
        }

        function handleImageUpload(input) {
            const file = input.files[0];
            if (!file) return;

            if (file.size > 5 * 1024 * 1024) {
                alert('La imagen es demasiado grande (máx. 5MB)');
                return;
            }

            const reader = new FileReader();
            reader.onload = function(e) {
                document.getElementById('previewImg').src = e.target.result;
                document.getElementById('imagePreview').style.display = 'block';
            };
            reader.readAsDataURL(file);
        }

        function handlePdfUpload(input) {
            const file = input.files[0];
            if (!file) return;

            if (file.size > 10 * 1024 * 1024) {
                alert('El archivo PDF es demasiado grande (máx. 10MB)');
                return;
            }

            document.getElementById('pdfFileName').textContent = file.name;
            document.getElementById('pdfFileSize').textContent = `(${(file.size / 1024 / 1024).toFixed(2)} MB)`;
            document.getElementById('pdfPreview').style.display = 'block';
        }

        function showPreview() {
            const titulo = document.getElementById('promotionTitle').value || 'Promoción sin título';
            const tipo = currentContentType;
            let contenido = '';

            switch(tipo) {
                case 'mensaje':
                    const mensaje = document.getElementById('messageContent').value || 'Sin mensaje';
                    contenido = `<div style="line-height: 1.6; color: var(--gray-700);">${mensaje.replace(/\n/g, '<br>')}</div>`;
                    break;
                case 'imagen':
                    const img = document.getElementById('previewImg');
                    if (img.src && img.src !== window.location.href) {
                        contenido = `
                            <div style="text-align: center; margin-bottom: 1rem;">
                                <img src="${img.src}" style="max-width: 100%; height: auto; border-radius: var(--border-radius);">
                            </div>
                        `;
                    } else {
                        contenido = '<div style="text-align: center; padding: 2rem; color: var(--gray-500);">No se ha seleccionado imagen</div>';
                    }
                    break;
                case 'pdf':
                    const pdfName = document.getElementById('pdfFileName').textContent;
                    if (pdfName !== 'Archivo seleccionado') {
                        contenido = `
                            <div style="background: var(--gray-50); padding: 2rem; border-radius: var(--border-radius); text-align: center;">
                                <i class="fas fa-file-pdf" style="font-size: 4rem; color: var(--error-red); margin-bottom: 1rem;"></i>
                                <h4>${pdfName}</h4>
                                <button class="btn btn-primary">
                                    <i class="fas fa-download"></i> Descargar PDF
                                </button>
                            </div>
                        `;
                    } else {
                        contenido = '<div style="text-align: center; padding: 2rem; color: var(--gray-500);">No se ha seleccionado PDF</div>';
                    }
                    break;
            }

            document.getElementById('emailPreview').innerHTML = `
                <h2 style="color: var(--primary-blue); margin-bottom: 1rem; text-align: center;">
                    <i class="fas fa-paint-brush"></i> ${titulo}
                </h2>
                <div style="margin-bottom: 2rem;">${contenido}</div>
                <hr style="margin: 2rem 0; border: none; border-top: 1px solid var(--gray-200);">
                <div style="font-size: 0.875rem; color: var(--gray-600); text-align: center;">
                    <p>Sistema Paints - Tu tienda de pinturas de confianza</p>
                    <p><a href="#" style="color: var(--primary-blue);">Ver en navegador</a> | <a href="#" style="color: var(--gray-500);">Cancelar suscripción</a></p>
                </div>
            `;

            document.getElementById('previewModal').style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }

        function closePreview() {
            document.getElementById('previewModal').style.display = 'none';
            document.body.style.overflow = 'auto';
        }

        function sendFromPreview() {
            closePreview();
            handleFormSubmit(new Event('submit'));
        }

        function handleFormSubmit(e) {
            e.preventDefault();

            if (selectedClients.size === 0) {
                alert('Debe seleccionar al menos un destinatario');
                return;
            }

            const titulo = document.getElementById('promotionTitle').value;
            if (!titulo.trim()) {
                alert('El título es obligatorio');
                return;
            }

            alert('Simulando envío de promoción...');
            
            setTimeout(() => {
                alert(`✅ Promoción enviada exitosamente a ${selectedClients.size} clientes`);
                
                const enviadasElement = document.getElementById('promocionesEnviadas');
                enviadasElement.textContent = parseInt(enviadasElement.textContent) + 1;
                
                resetForm();
                setTimeout(() => switchTab('lista'), 1000);
            }, 2000);
        }

        function resetForm() {
            document.getElementById('promotionForm').reset();
            clearSelection();
            selectContentType('mensaje');
            
            document.getElementById('imagePreview').style.display = 'none';
            document.getElementById('pdfPreview').style.display = 'none';
            document.getElementById('previewImg').src = '';
            document.getElementById('pdfFileName').textContent = 'Archivo seleccionado';
        }

        function saveDraft() {
            const titulo = document.getElementById('promotionTitle').value;
            if (!titulo.trim()) {
                alert('El título es obligatorio para guardar');
                return;
            }
            alert('💾 Borrador guardado exitosamente');
        }

        function filterPromotions() {
            alert('Filtros aplicados');
        }
    </script>
