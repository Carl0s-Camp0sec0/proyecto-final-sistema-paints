        // Variables globales
        let permissions = {
            manager: {
                reports: true,
                inventory: true,
                approve_sales: true,
                delete: false
            },
            cashier: {
                sales: true,
                view_products: true,
                customers: true,
                edit_inventory: false
            },
            digitizer: {
                add_products: true,
                edit_products: true,
                basic_reports: true,
                delete_products: false
            }
        };

        // Actualizar permiso
        function updatePermission(role, permission, enabled) {
            if (permissions[role]) {
                permissions[role][permission] = enabled;
                
                // Simular guardado
                setTimeout(() => {
                    const action = enabled ? 'habilitado' : 'deshabilitado';
                    alert(`✅ Permiso "${permission}" ${action} para el rol "${role}"`);
                    
                    // Agregar al registro de auditoría (simulado)
                    logAuditChange(role, permission, enabled);
                }, 500);
            }
        }

        // Registrar cambio en auditoría
        function logAuditChange(role, permission, enabled) {
            console.log(`Audit: ${role} - ${permission} - ${enabled ? 'enabled' : 'disabled'}`);
        }

        // Crear nuevo rol
        function createRole() {
            const roleName = prompt('Ingrese el nombre del nuevo rol:');
            if (roleName) {
                alert(`🆕 Nuevo rol "${roleName}" creado exitosamente`);
            }
        }

        // Asignar rol
        function assignRole() {
            alert('👤 Función de asignación de roles en desarrollo');
        }

        // Editar rol de usuario
        function editUserRole(userId) {
            const roles = ['Administrador', 'Gerente', 'Cajero', 'Digitador'];
            const selectedRole = prompt(`Seleccione el nuevo rol para el usuario ${userId}:\n${roles.join('\n')}`);
            
            if (selectedRole && roles.includes(selectedRole)) {
                alert(`✅ Rol "${selectedRole}" asignado al usuario ${userId}`);
            }
        }

        // Exportar permisos
        function exportPermissions() {
            alert('📊 Exportando configuración de permisos...');
            
            // Simular descarga
            setTimeout(() => {
                alert('✅ Archivo de permisos descargado exitosamente');
            }, 1500);
        }

        // Inicializar página
        document.addEventListener('DOMContentLoaded', function() {
            console.log('Gestión de permisos inicializada');
        });
    </script>
