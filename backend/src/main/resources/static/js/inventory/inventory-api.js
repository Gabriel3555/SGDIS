const DEFAULT_INSTITUTION_PAGE_SIZE = 10;
const DEFAULT_ADMIN_REGIONAL_PAGE_SIZE = 6;

async function loadInventoryData() {
    if (inventoryData.isLoading) return;

    inventoryData.isLoading = true;
    showLoadingState();

    try {
        await loadCurrentUserInfo();
        // Load statistics for SUPERADMIN
        await loadInventoryStatistics();
        await loadInventories();
        updateInventoryUI();

    } catch (error) {
        console.error('Error loading inventory data:', error);

        let errorMessage = 'Error al cargar los datos de inventarios: ' + error.message;

        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            errorMessage = 'Error de conexión. Verifica tu conexión a internet e intenta nuevamente.';
        } else if (error.message.includes('401')) {
            errorMessage = 'Sesión expirada. Por favor inicia sesión nuevamente.';
        } else if (error.message.includes('403')) {
            errorMessage = 'No tienes permisos para ver los inventarios.';
        } else if (error.message.includes('404')) {
            errorMessage = 'Servicio de inventarios no encontrado. Contacta al administrador.';
        } else if (error.message.includes('500')) {
            errorMessage = 'Error interno del servidor. Inténtalo más tarde.';
        }

        showErrorState(errorMessage);
        updateInventoryUI();
    } finally {
        inventoryData.isLoading = false;
        hideLoadingState();
    }
}

async function loadCurrentUserInfo() {
    try {
        const token = localStorage.getItem('jwt');
        if (!token) {
            throw new Error('No authentication token found');
        }

        const response = await fetch('/api/v1/users/me', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const userData = await response.json();
            window.currentUserData = userData;
            window.currentUserRole = userData.role;
            if (typeof updateUserInfoDisplay === 'function') {
                updateUserInfoDisplay(userData);
            }
            
            // If super admin or admin_regional, trigger filter update to show filters
            if (userData.role && (userData.role.toUpperCase() === 'SUPERADMIN' || userData.role.toUpperCase() === 'ADMIN_REGIONAL')) {
                // Small delay to ensure UI is ready
                setTimeout(() => {
                    if (typeof updateSearchAndFilters === 'function') {
                        updateSearchAndFilters();
                    }
                }, 200);
            }
        } else {
            throw new Error('Failed to load user info');
        }
    } catch (error) {
        console.error('Error loading current user info:', error);
        // Check if we're on superadmin path
        const path = window.location.pathname || '';
        if (path.includes('/superadmin')) {
            window.currentUserRole = 'SUPERADMIN';
        }
        if (typeof updateUserInfoDisplay === 'function') {
            updateUserInfoDisplay({
                fullName: 'Super Admin',
                role: 'ADMIN',
                email: 'admin@sena.edu.co'
            });
        }
    }
}

function shouldUseInstitutionInventories() {
    const role = (window.currentUserRole || '').toUpperCase();
    if (role === 'ADMIN_INSTITUTION' || role === 'WAREHOUSE') {
        return true;
    }

    const path = window.location.pathname || '';
    return path.includes('/admin_institution') || path.includes('/admininstitution') || path.includes('/warehouse');
}

function buildInventoryEndpoint(page = 0, size = DEFAULT_INSTITUTION_PAGE_SIZE) {
    if (shouldUseInstitutionInventories()) {
        const params = new URLSearchParams({
            page: page.toString(),
            size: size.toString()
        });
        return `/api/v1/inventory/institutionAdminInventories?${params.toString()}`;
    }
    
    // Check if we're admin_regional
    const isAdminRegional = (window.currentUserRole && window.currentUserRole.toUpperCase() === 'ADMIN_REGIONAL') || 
                           (window.location.pathname && window.location.pathname.includes('/admin_regional'));
    
    if (isAdminRegional) {
        // Use window.inventoryData to ensure we get the latest values
        // Safely get inventoryData - check if we're in items page context
        const data = window.inventoryData || (typeof inventoryData !== 'undefined' ? inventoryData : {});
        const selectedInstitution = data.selectedInstitution;
        
        // Get the regional ID from the current user
        const currentUser = window.currentUserData || {};
        const userRegionalId = currentUser.institution?.regional?.id || currentUser.regional?.id;
        
        // Use default size of 6 for admin regional if size is not explicitly provided
        const pageSize = size === DEFAULT_INSTITUTION_PAGE_SIZE ? DEFAULT_ADMIN_REGIONAL_PAGE_SIZE : size;
        
        if (selectedInstitution && userRegionalId) {
            // Filter by both regional and institution
            const params = new URLSearchParams({
                page: page.toString(),
                size: pageSize.toString()
            });
            const endpoint = `/api/v1/inventory/regional/${userRegionalId}/institution/${selectedInstitution}?${params.toString()}`;
            return endpoint;
        } else {
            // Use the regional admin inventories endpoint (all inventories of the regional)
            const params = new URLSearchParams({
                page: page.toString(),
                size: pageSize.toString()
            });
            return `/api/v1/inventory/regionalAdminInventories?${params.toString()}`;
        }
    }
    
    // Check if we have regional/institution filters for super admin
    const isSuperAdmin = (window.currentUserRole && window.currentUserRole.toUpperCase() === 'SUPERADMIN') || 
                         (window.location.pathname && window.location.pathname.includes('/superadmin'));
    
    if (isSuperAdmin) {
        // Use window.inventoryData to ensure we get the latest values
        // Safely get inventoryData - check if we're in items page context
        const data = window.inventoryData || (typeof inventoryData !== 'undefined' ? inventoryData : {});
        const selectedRegional = data.selectedRegional;
        const selectedInstitution = data.selectedInstitution;
        
        // Use default size of 6 for superadmin if size is not explicitly provided
        const pageSize = size === DEFAULT_INSTITUTION_PAGE_SIZE ? DEFAULT_ADMIN_REGIONAL_PAGE_SIZE : size;
        
        if (selectedRegional && selectedInstitution) {
            // Filter by both regional and institution
            const params = new URLSearchParams({
                page: page.toString(),
                size: pageSize.toString()
            });
            const endpoint = `/api/v1/inventory/regional/${selectedRegional}/institution/${selectedInstitution}?${params.toString()}`;
            return endpoint;
        } else if (selectedRegional) {
            // Filter by regional only
            const params = new URLSearchParams({
                page: page.toString(),
                size: pageSize.toString()
            });
            const endpoint = `/api/v1/inventory/regionalAdminInventories/${selectedRegional}?${params.toString()}`;
            return endpoint;
        }
    }
    
    // Default endpoint with pagination - use 6 for superadmin
    const isSuperAdminDefault = (window.currentUserRole && window.currentUserRole.toUpperCase() === 'SUPERADMIN') || 
                                (window.location.pathname && window.location.pathname.includes('/superadmin'));
    const defaultPageSize = isSuperAdminDefault ? DEFAULT_ADMIN_REGIONAL_PAGE_SIZE : size;
    const params = new URLSearchParams({
        page: page.toString(),
        size: defaultPageSize.toString()
    });
    const endpoint = `/api/v1/inventory?${params.toString()}`;
    return endpoint;
}

function updateInventoryScopeMessage(scope = 'global') {
    const welcomeMessage = document.getElementById('inventoryWelcomeMessage');
    if (!welcomeMessage) {
        return;
    }

    if (scope === 'institution') {
        welcomeMessage.textContent = 'Inventarios asociados a tu institución.';
    } else if (scope === 'regional') {
        welcomeMessage.textContent = 'Administración y control de inventarios de la regional';
    } else {
        welcomeMessage.textContent = 'Administración y control de inventarios del sistema';
    }
}

async function loadInventories(options = {}) {
    try {
        const token = localStorage.getItem('jwt');
        const headers = { 'Content-Type': 'application/json' };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const page = typeof options.page === 'number' ? options.page : 0;
        const isAdminRegional = (window.currentUserRole && window.currentUserRole.toUpperCase() === 'ADMIN_REGIONAL') || 
                               (window.location.pathname && window.location.pathname.includes('/admin_regional'));
        const isSuperAdmin = (window.currentUserRole && window.currentUserRole.toUpperCase() === 'SUPERADMIN') || 
                            (window.location.pathname && window.location.pathname.includes('/superadmin'));
        // Use default size of 6 for admin regional and superadmin, otherwise use the configured size or default
        const defaultSize = (isAdminRegional || isSuperAdmin) ? DEFAULT_ADMIN_REGIONAL_PAGE_SIZE : DEFAULT_INSTITUTION_PAGE_SIZE;
        
        // For admin regional and superadmin, always use 6 unless explicitly overridden
        let size;
        if (isAdminRegional || isSuperAdmin) {
            size = typeof options.size === 'number' ? options.size : DEFAULT_ADMIN_REGIONAL_PAGE_SIZE;
        } else {
            size = typeof options.size === 'number' ? options.size : (inventoryData?.serverPageSize || defaultSize);
        }
        
        const useInstitutionScope = shouldUseInstitutionInventories();
        const endpoint = buildInventoryEndpoint(page, size);

        if (inventoryData) {
            // For admin regional and superadmin, ensure serverPageSize is 6
            if (isAdminRegional || isSuperAdmin) {
                inventoryData.serverPageSize = DEFAULT_ADMIN_REGIONAL_PAGE_SIZE;
            } else {
                inventoryData.serverPageSize = size;
            }
        }

        const response = await fetch(endpoint, {
            method: 'GET',
            headers: headers
        });

        if (response.ok) {
            const payload = await response.json();
            let inventories = [];

            if (Array.isArray(payload)) {
                inventories = payload;
                if (inventoryData) {
                    inventoryData.serverPagination = null;
                    inventoryData.inventoryScope = useInstitutionScope ? 'institution' : (isAdminRegional ? 'regional' : 'global');
                }
            } else if (payload && Array.isArray(payload.content)) {
                inventories = payload.content;
                if (inventoryData) {
                    inventoryData.serverPagination = {
                        page: payload.number ?? page,
                        size: payload.size ?? size,
                        totalPages: payload.totalPages ?? 1,
                        totalElements: payload.totalElements ?? payload.content.length
                    };
                    inventoryData.inventoryScope = useInstitutionScope ? 'institution' : (isAdminRegional ? 'regional' : 'global');
                    // Update currentPage to match server page (convert from 0-based to 1-based)
                    inventoryData.currentPage = (payload.number ?? page) + 1;
                }
            } else {
                inventories = [];
                if (inventoryData) {
                    inventoryData.serverPagination = null;
                    inventoryData.inventoryScope = useInstitutionScope ? 'institution' : (isAdminRegional ? 'regional' : 'global');
                    inventoryData.currentPage = 1;
                }
            }

            updateInventoryScopeMessage(inventoryData?.inventoryScope);

            // Ensure we're using window.inventoryData for consistency
            if (!window.inventoryData) {
                window.inventoryData = inventoryData;
            }
            const data = window.inventoryData;
            data.inventories = Array.isArray(inventories) ? inventories : [];
            data.filteredInventories = [...data.inventories];
            
            // Also update the local inventoryData reference
            if (inventoryData && inventoryData !== data) {
                inventoryData.inventories = data.inventories;
                inventoryData.filteredInventories = data.filteredInventories;
                if (inventoryData.serverPagination) {
                    inventoryData.currentPage = (inventoryData.serverPagination.page || 0) + 1;
                }
            }
            
            // If super admin, ensure filters are updated after loading inventories
            const isSuperAdmin = (window.currentUserRole && window.currentUserRole.toUpperCase() === 'SUPERADMIN') || 
                                 (window.location.pathname && window.location.pathname.includes('/superadmin'));
            if (isSuperAdmin && typeof updateSearchAndFilters === 'function') {
                setTimeout(() => {
                    updateSearchAndFilters();
                }, 100);
            }

            if (inventoryData.inventories.length === 0) {
                const scopeMessage = useInstitutionScope
                    ? 'Tu institución aún no tiene inventarios registrados. Usa "Nuevo Inventario" para crear el primero.'
                    : 'No hay inventarios registrados en el sistema. Crea el primero usando el botón "Nuevo Inventario".';
                showInfoToast('Información', scopeMessage);
            }
        } else {
            const errorText = await response.text();

            if (response.status === 401) {
                showErrorToast('Sesión expirada', 'Tu sesión ha expirado. Por favor inicia sesión nuevamente.');
                setTimeout(() => {
                    window.location.href = '/';
                }, 3000);
            } else if (response.status === 403) {
                showErrorToast('Acceso denegado', 'No tienes permisos para ver los inventarios.');
            } else if (response.status === 404) {
                throw new Error('No se encontró información de la institución asociada al usuario.');
            } else {
                throw new Error(errorText || `Failed to load inventories: ${response.status} ${response.statusText}`);
            }
        }
    } catch (error) {
        console.error('Error loading inventories:', error);

        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            showErrorToast('Error de conexión', 'No se pudo conectar con el servidor. Verifica tu conexión a internet.');
        } else {
            showErrorToast('Error', 'Error al cargar los inventarios: ' + error.message);
        }

        if (inventoryData) {
            inventoryData.inventories = [];
            inventoryData.filteredInventories = [];
            inventoryData.serverPagination = null;
        }
    }
}

async function createInventory(inventoryDataToCreate) {
    try {
        const token = localStorage.getItem('jwt');
        const headers = {
            'Content-Type': 'application/json'
        };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch('/api/v1/inventory', {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(inventoryDataToCreate)
        });

        if (response.ok) {
            const newInventory = await response.json();
            return newInventory;
        } else if (response.status === 400) {
            const errorData = await response.json();
            throw new Error(errorData.detail || errorData.message || 'Datos de inventario inválidos');
        } else if (response.status === 401) {
            throw new Error('Sesión expirada. Por favor inicia sesión nuevamente.');
        } else if (response.status === 403) {
            throw new Error('No tienes permisos para crear inventarios.');
        } else if (response.status === 409) {
            const errorData = await response.json();
            const errorMessage = errorData.detail || errorData.message || 'Este propietario ya tiene un inventario asignado';
            throw new Error(errorMessage);
        } else {
            let errorMessage = 'Error al crear el inventario';
            try {
                const errorData = await response.json();
                errorMessage = errorData.detail || errorData.message || errorMessage;
            } catch (parseError) {
                // Response was not JSON
            }
            throw new Error(errorMessage);
        }
    } catch (error) {
        if (error.message && error.message.includes('Failed to fetch')) {
            throw new Error('Error de conexión. Verifica tu conexión a internet.');
        }
        throw error;
    }
}

async function updateInventory(inventoryId, updateData) {
    try {
        const token = localStorage.getItem('jwt');
        const headers = {
            'Content-Type': 'application/json'
        };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(`/api/v1/inventory/${inventoryId}`, {
            method: 'PUT',
            headers: headers,
            body: JSON.stringify(updateData)
        });

        if (response.ok) {
            const updatedInventory = await response.json();
            return updatedInventory;
        } else if (response.status === 404) {
            throw new Error('Inventario no encontrado');
        } else if (response.status === 400) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Datos de actualización inválidos');
        } else if (response.status === 401) {
            throw new Error('Sesión expirada. Por favor inicia sesión nuevamente.');
        } else if (response.status === 403) {
            throw new Error('No tienes permisos para actualizar este inventario.');
        } else {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error al actualizar el inventario');
        }
    } catch (error) {
        if (error.message && error.message.includes('Failed to fetch')) {
            throw new Error('Error de conexión. Verifica tu conexión a internet.');
        }
        throw error;
    }
}

async function updateInventoryInstitution(inventoryId, institutionData) {
    try {
        const token = localStorage.getItem('jwt');
        const headers = {
            'Content-Type': 'application/json'
        };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const payload = (institutionData && typeof institutionData === 'object' && institutionData.institutionId !== undefined)
            ? institutionData
            : { institutionId: institutionData };

        const response = await fetch(`/api/v1/inventory/${inventoryId}/institution`, {
            method: 'PATCH',
            headers: headers,
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            return await response.json();
        } else if (response.status === 404) {
            throw new Error('Inventario o institución no encontrado');
        } else if (response.status === 400) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Datos de actualización de institución inválidos');
        } else if (response.status === 401) {
            throw new Error('Sesión expirada. Por favor inicia sesión nuevamente.');
        } else if (response.status === 403) {
            throw new Error('No tienes permisos para actualizar la institución de este inventario.');
        } else {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error al actualizar la institución del inventario');
        }
    } catch (error) {
        if (error.message && error.message.includes('Failed to fetch')) {
            throw new Error('Error de conexión. Verifica tu conexión a internet.');
        }
        throw error;
    }
}

async function deleteInventoryFromApi(inventoryId) {
    try {
        const token = localStorage.getItem('jwt');
        const headers = {
            'Content-Type': 'application/json'
        };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(`/api/v1/inventory/${inventoryId}`, {
            method: 'DELETE',
            headers: headers
        });

        if (response.ok) {
            const deletedInventory = await response.json();
            return deletedInventory;
        } else if (response.status === 404) {
            throw new Error('Inventario no encontrado');
        } else if (response.status === 400) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'No se puede eliminar este inventario');
        } else if (response.status === 401) {
            throw new Error('Sesión expirada. Por favor inicia sesión nuevamente.');
        } else if (response.status === 403) {
            throw new Error('No tienes permisos para eliminar este inventario.');
        } else if (response.status === 500) {
            throw new Error('No se puede eliminar este inventario porque contiene items asociados. Transfiere o elimina los items primero.');
        } else {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error al eliminar el inventario');
        }
    } catch (error) {
        if (error.message && error.message.includes('Failed to fetch')) {
            throw new Error('Error de conexión. Verifica tu conexión a internet.');
        }
        throw error;
    }
}

async function getInventoryById(inventoryId) {
    try {
        const token = localStorage.getItem('jwt');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(`/api/v1/inventory/${inventoryId}`, {
            method: 'GET',
            headers: headers
        });

        if (response.ok) {
            const inventory = await response.json();
            return inventory;
        } else if (response.status === 404) {
            throw new Error('Inventario no encontrado');
        } else if (response.status === 401) {
            throw new Error('Sesión expirada. Por favor inicia sesión nuevamente.');
        } else if (response.status === 403) {
            throw new Error('No tienes permisos para ver este inventario.');
        } else {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error al obtener el inventario');
        }
    } catch (error) {
        if (error.message && error.message.includes('Failed to fetch')) {
            throw new Error('Error de conexión. Verifica tu conexión a internet.');
        }
        throw error;
    }
}

async function assignInventory(assignmentData) {
    try {
        const token = localStorage.getItem('jwt');
        const headers = {
            'Content-Type': 'application/json'
        };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch('/api/v1/inventory/assignedInventory', {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(assignmentData)
        });

        if (response.ok) {
            const result = await response.json();
            return result;
        } else {
            // Try to parse error response
            let errorMessage = 'Error al asignar el inventario';
            try {
                const errorData = await response.json();
                // Check multiple possible fields for error message
                errorMessage = errorData.detail || errorData.message || errorData.error || errorMessage;
            } catch (parseError) {
                // If response is not JSON, use status text
                errorMessage = response.statusText || errorMessage;
            }

            // Handle specific status codes
            if (response.status === 400) {
                throw new Error(errorMessage || 'Datos de asignación inválidos');
            } else if (response.status === 401) {
                throw new Error('Sesión expirada. Por favor inicia sesión nuevamente.');
            } else if (response.status === 403) {
                throw new Error('No tienes permisos para asignar inventarios.');
            } else if (response.status === 409) {
                // Conflict - user already has inventory assigned
                throw new Error(errorMessage || 'Este usuario ya tiene un inventario asignado.');
            } else if (response.status === 500) {
                // Internal server error - check if it's a business rule violation
                if (errorMessage.includes('ya tiene un inventario') || errorMessage.includes('ya tiene un inventorio')) {
                    throw new Error('Este usuario ya tiene un inventario asignado.');
                }
                throw new Error(errorMessage || 'Ha ocurrido un error inesperado al asignar el inventario.');
            } else {
                throw new Error(errorMessage);
            }
        }
    } catch (error) {
        if (error.message && error.message.includes('Failed to fetch')) {
            throw new Error('Error de conexión. Verifica tu conexión a internet.');
        }
        throw error;
    }
}

async function assignManager(managerData) {
    try {
        const token = localStorage.getItem('jwt');
        const headers = {
            'Content-Type': 'application/json'
        };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch('/api/v1/inventory/assignManager', {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(managerData)
        });

        if (response.ok) {
            const result = await response.json();
            return result;
        } else if (response.status === 400) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Datos de asignación de manejador inválidos');
        } else if (response.status === 401) {
            throw new Error('Sesión expirada. Por favor inicia sesión nuevamente.');
        } else if (response.status === 403) {
            throw new Error('No tienes permisos para asignar manejadores.');
        } else {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error al asignar el manejador');
        }
    } catch (error) {
        console.error('Error assigning manager:', error);
        if (error.message && error.message.includes('Failed to fetch')) {
            throw new Error('Error de conexión. Verifica tu conexión a internet.');
        }
        throw error;
    }
}

async function assignSignatory(signatoryData) {
    try {
        const token = localStorage.getItem('jwt');
        const headers = {
            'Content-Type': 'application/json'
        };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch('/api/v1/inventory/assignSignatory', {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(signatoryData)
        });

        if (response.ok) {
            const result = await response.json();
            return result;
        } else if (response.status === 400) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Datos de asignación de firmante inválidos');
        } else if (response.status === 401) {
            throw new Error('Sesión expirada. Por favor inicia sesión nuevamente.');
        } else if (response.status === 403) {
            throw new Error('No tienes permisos para asignar firmantes.');
        } else {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error al asignar el firmante');
        }
    } catch (error) {
        console.error('Error assigning signatory:', error);
        if (error.message && error.message.includes('Failed to fetch')) {
            throw new Error('Error de conexión. Verifica tu conexión a internet.');
        }
        throw error;
    }
}

// Export functions
window.assignSignatory = assignSignatory;

async function confirmDeleteInventory() {
    if (!inventoryData.currentInventoryId) {
        showErrorToast('Error', 'No se ha seleccionado un inventario para eliminar');
        return;
    }

    try {
        const token = localStorage.getItem('jwt');
        const headers = {
            'Content-Type': 'application/json'
        };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(`/api/v1/inventory/${inventoryData.currentInventoryId}`, {
            method: 'DELETE',
            headers: headers
        });

        if (response.ok) {
            showSuccessToast('Inventario eliminado', 'Inventario eliminado exitosamente');
            closeDeleteInventoryModal();
            await loadInventoryData();
        } else if (response.status === 404) {
            showErrorToast('Inventario no encontrado', 'El inventario que intenta eliminar no existe o ya fue eliminado.');
            closeDeleteInventoryModal();
            await loadInventoryData(); // Recargar la lista para reflejar cambios
        } else if (response.status === 500) {
            showErrorToast('Inventario en uso', 'No se puede eliminar este inventario porque contiene items asociados. Transfiere la propiedad de los inventarios a otro usuario antes de eliminarlo.');
        } else if (response.status === 403) {
            showErrorToast('Permisos insuficientes', 'No tienes permisos para eliminar este inventario.');
        } else if (response.status === 401) {
            showErrorToast('Sesión expirada', 'Tu sesión ha expirado. Por favor inicia sesión nuevamente.');
        } else {
            try {
                const errorData = await response.json();
                showErrorToast('Error al eliminar inventario', errorData.message || 'Error desconocido');
            } catch {
                showErrorToast('Error al eliminar inventario', 'El inventario podría estar siendo utilizado en otros módulos del sistema.');
            }
        }
    } catch (error) {
        console.error('Error deleting inventory:', error);
        showErrorToast('Error al eliminar inventario', 'Inténtalo de nuevo.');
    }
}

// Get signatories of an inventory
async function getInventorySignatories(inventoryId) {
    try {
        const token = localStorage.getItem('jwt');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(`/api/v1/inventory/${inventoryId}/signatories`, {
            method: 'GET',
            headers: headers
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || errorData.detail || 'Error al obtener firmantes');
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching signatories:', error);
        throw error;
    }
}

// Get managers of an inventory
async function getInventoryManagers(inventoryId) {
    try {
        const token = localStorage.getItem('jwt');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(`/api/v1/inventory/${inventoryId}/managers`, {
            method: 'GET',
            headers: headers
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || errorData.detail || 'Error al obtener manejadores');
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching managers:', error);
        throw error;
    }
}

// Delete signatory from inventory
async function deleteSignatory(deleteData) {
    try {
        const token = localStorage.getItem('jwt');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch('/api/v1/inventory/deleteSignatory', {
            method: 'DELETE',
            headers: headers,
            body: JSON.stringify(deleteData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || errorData.detail || 'Error al eliminar firmante');
        }

        return await response.json();
    } catch (error) {
        console.error('Error deleting signatory:', error);
        throw error;
    }
}

// Delete manager from inventory
async function deleteManager(deleteData) {
    try {
        const token = localStorage.getItem('jwt');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch('/api/v1/inventory/deleteManager', {
            method: 'DELETE',
            headers: headers,
            body: JSON.stringify(deleteData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || errorData.detail || 'Error al eliminar manejador');
        }

        return await response.json();
    } catch (error) {
        console.error('Error deleting manager:', error);
        throw error;
    }
}

window.confirmDeleteInventory = confirmDeleteInventory;
window.loadInventoryData = loadInventoryData;
window.loadCurrentUserInfo = loadCurrentUserInfo;
window.loadInventories = loadInventories;
window.createInventory = createInventory;
window.updateInventory = updateInventory;
window.updateInventoryInstitution = updateInventoryInstitution;
window.deleteInventory = deleteInventoryFromApi;
window.getInventoryById = getInventoryById;
window.assignInventory = assignInventory;
window.assignManager = assignManager;
window.assignSignatory = assignSignatory;
window.getInventorySignatories = getInventorySignatories;
window.getInventoryManagers = getInventoryManagers;
window.deleteSignatory = deleteSignatory;
window.deleteManager = deleteManager;

// Load regionals for filter dropdown (super admin only)
async function loadRegionalsForFilter() {
    // Only run on inventory page, not on items page
    const path = window.location.pathname || '';
    if (path.includes('/items')) {
        return; // Don't run on items page
    }
    
    try {
        const token = localStorage.getItem('jwt');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch('/api/v1/regional', {
            method: 'GET',
            headers: headers
        });

        if (response.ok) {
            const regionals = await response.json();
            
            // Use CustomSelect if available, otherwise fallback to native select
            if (window.inventoryRegionalFilterSelect && typeof window.inventoryRegionalFilterSelect.setOptions === 'function') {
                // Safely get inventoryData
                const inventoryDataRef = window.inventoryData || (typeof inventoryData !== 'undefined' ? inventoryData : null);
                const currentRegional = inventoryDataRef?.selectedRegional || '';
                
                const options = [
                    { value: '', label: 'Todas las regionales' },
                    ...regionals.map(regional => ({
                        value: regional.id.toString(),
                        label: regional.name
                    }))
                ];
                
                window.inventoryRegionalFilterSelect.setOptions(options);
                
                // Set current value if exists
                if (currentRegional) {
                    setTimeout(() => {
                        if (window.inventoryRegionalFilterSelect && typeof window.inventoryRegionalFilterSelect.setValue === 'function') {
                            window.inventoryRegionalFilterSelect.setValue(currentRegional);
                        }
                    }, 50);
                }
            } else {
                // Fallback to native select (for backward compatibility)
                const select = document.getElementById('regionalFilter');
                if (select) {
                    while (select.options.length > 1) {
                        select.remove(1);
                    }
                    const inventoryDataRef = window.inventoryData || (typeof inventoryData !== 'undefined' ? inventoryData : null);
                    const currentRegional = inventoryDataRef?.selectedRegional || '';
                    regionals.forEach(regional => {
                        const option = document.createElement('option');
                        option.value = regional.id.toString();
                        option.textContent = regional.name;
                        if (currentRegional === regional.id.toString()) {
                            option.selected = true;
                        }
                        select.appendChild(option);
                    });
                }
            }
        } else {
            console.error('Error loading regionals:', response.statusText);
        }
    } catch (error) {
        console.error('Error loading regionals:', error);
    }
}

// Helper function to populate native select with institutions
function populateSelectWithInstitutions(selectElement, institutions, currentInstitution) {
    
    // Clear existing options except the first one (which should be "Todos los centros")
    while (selectElement.options.length > 1) {
        selectElement.remove(1);
    }
    
    
    // Add institutions as options
    if (institutions && Array.isArray(institutions) && institutions.length > 0) {
        institutions.forEach((institution, index) => {
            const option = document.createElement('option');
            option.value = institution.id ? institution.id.toString() : '';
            option.textContent = institution.name || `Institución ${institution.id || index}`;
            selectElement.appendChild(option);
        });
        
    } else {
        console.warn('No institutions to add or institutions array is empty');
    }
    
    // Set current value if exists
    if (currentInstitution) {
        selectElement.value = currentInstitution;
    }
}

// Load institutions for filter dropdown based on selected regional (super admin only)
async function loadInstitutionsForFilter(regionalId) {
    // Only run on inventory page, not on items page
    const path = window.location.pathname || '';
    if (path.includes('/items')) {
        return; // Don't run on items page
    }
    
    try {
        if (!regionalId) {
            console.error('No regional ID provided');
            return;
        }

        const token = localStorage.getItem('jwt');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(`/api/v1/institutions/institutionsByRegionalId/${regionalId}`, {
            method: 'GET',
            headers: headers
        });

        if (response.ok) {
            const institutions = await response.json();
            
            // Safely get inventoryData
            const inventoryDataRef = window.inventoryData || (typeof inventoryData !== 'undefined' ? inventoryData : null);
            const currentInstitution = inventoryDataRef?.selectedInstitution || '';
            
            // Store institutions globally
            window.currentUserInstitutions = institutions;
            
            if (institutions && Array.isArray(institutions) && institutions.length > 0) {
                const isAdminRegional = (window.currentUserRole && window.currentUserRole.toUpperCase() === 'ADMIN_REGIONAL') || 
                                       (window.location.pathname && window.location.pathname.includes('/admin_regional'));
                
                // Check if it's a native select (admin_regional) or CustomSelect (superadmin)
                // IMPORTANT: Check native select FIRST before checking CustomSelect
                let institutionSelect = document.getElementById("inventoryInstitutionFilterSelect");
                
                // If not found, wait a bit and try again (select might not be created yet)
                if (!institutionSelect) {
                    setTimeout(() => {
                        institutionSelect = document.getElementById("inventoryInstitutionFilterSelect");
                        if (institutionSelect && institutionSelect.tagName === 'SELECT') {
                            populateSelectWithInstitutions(institutionSelect, institutions, currentInstitution);
                        } else {
                            console.error('Select still not found after retry or is not a SELECT element');
                        }
                    }, 500);
                    return;
                }
                
                // Check if it's a native select first (for admin_regional)
                if (institutionSelect && institutionSelect.tagName === 'SELECT') {
                    populateSelectWithInstitutions(institutionSelect, institutions, currentInstitution);
                } else if (window.inventoryInstitutionFilterSelect && typeof window.inventoryInstitutionFilterSelect.setOptions === 'function') {
                    // CustomSelect for superadmin
                    const defaultLabel = isAdminRegional ? 'Todos los centros' : 'Todas las instituciones';
                    
                    const options = [
                        { value: '', label: defaultLabel },
                        ...institutions.map(institution => ({
                            value: institution.id.toString(),
                            label: institution.name || `Institución ${institution.id}`
                        }))
                    ];
                    
                    window.inventoryInstitutionFilterSelect.setOptions(options);
                    
                    // Ensure the select is enabled
                    if (typeof window.inventoryInstitutionFilterSelect.setDisabled === 'function') {
                        window.inventoryInstitutionFilterSelect.setDisabled(false);
                    }
                    
                    // Verify trigger exists and has event listeners
                    if (window.inventoryInstitutionFilterSelect.trigger) {
                        console.log('CustomSelect trigger exists, verifying click handler');
                        // Re-verify the trigger has the click handler
                        const trigger = window.inventoryInstitutionFilterSelect.container?.querySelector(".custom-select-trigger");
                        if (trigger && trigger !== window.inventoryInstitutionFilterSelect.trigger) {
                            // Trigger was replaced, update reference
                            console.log('Trigger was replaced, updating reference');
                            window.inventoryInstitutionFilterSelect.trigger = trigger;
                            // Re-add event listener
                            trigger.addEventListener("click", (event) => {
                                event.preventDefault();
                                event.stopPropagation();
                                if (window.inventoryInstitutionFilterSelect.isDisabled) {
                                    return;
                                }
                                window.inventoryInstitutionFilterSelect.toggle();
                            });
                        }
                    } else {
                        console.warn('CustomSelect trigger not found after setOptions');
                        // Try to re-initialize
                        if (window.inventoryInstitutionFilterSelect.container) {
                            window.inventoryInstitutionFilterSelect.trigger = window.inventoryInstitutionFilterSelect.container.querySelector(".custom-select-trigger");
                            if (window.inventoryInstitutionFilterSelect.trigger) {
                                window.inventoryInstitutionFilterSelect.trigger.addEventListener("click", (event) => {
                                    event.preventDefault();
                                    event.stopPropagation();
                                    if (window.inventoryInstitutionFilterSelect.isDisabled) {
                                        return;
                                    }
                                    window.inventoryInstitutionFilterSelect.toggle();
                                });
                            }
                        }
                    }
                    
                    // Set current value if exists (but since we cleared it, this should be empty)
                    if (currentInstitution) {
                        setTimeout(() => {
                            if (window.inventoryInstitutionFilterSelect && typeof window.inventoryInstitutionFilterSelect.setValue === 'function') {
                                window.inventoryInstitutionFilterSelect.setValue(currentInstitution);
                            }
                        }, 50);
                    } else {
                        // Ensure the placeholder is shown
                        const textElement = window.inventoryInstitutionFilterSelect.container?.querySelector(".custom-select-text");
                        if (textElement) {
                            textElement.textContent = defaultLabel;
                            textElement.classList.add("custom-select-placeholder");
                        }
                    }
                } else {
                    // Try to initialize CustomSelect if it doesn't exist yet
                    const initFunction = window.initializeInventoryFilterSelects || (typeof initializeInventoryFilterSelects !== 'undefined' ? initializeInventoryFilterSelects : null);
                    
                    if (initFunction && typeof initFunction === 'function') {
                        try {
                            initFunction();
                            // Wait a bit for initialization to complete and try again
                            setTimeout(() => {
                                if (window.inventoryInstitutionFilterSelect && typeof window.inventoryInstitutionFilterSelect.setOptions === 'function') {
                                    const defaultLabel = isAdminRegional ? 'Todos los centros' : 'Todas las instituciones';
                                    const options = [
                                        { value: '', label: defaultLabel },
                                        ...institutions.map(institution => ({
                                            value: institution.id.toString(),
                                            label: institution.name || `Institución ${institution.id}`
                                        }))
                                    ];
                                    window.inventoryInstitutionFilterSelect.setOptions(options);
                                    
                                    if (currentInstitution) {
                                        setTimeout(() => {
                                            if (window.inventoryInstitutionFilterSelect && typeof window.inventoryInstitutionFilterSelect.setValue === 'function') {
                                                window.inventoryInstitutionFilterSelect.setValue(currentInstitution);
                                            }
                                        }, 50);
                                    }
                                } else {
                                    // Retry one more time after a longer delay
                                    setTimeout(() => {
                                        if (window.inventoryInstitutionFilterSelect && typeof window.inventoryInstitutionFilterSelect.setOptions === 'function') {
                                            const defaultLabel = isAdminRegional ? 'Todos los centros' : 'Todas las instituciones';
                                            const options = [
                                                { value: '', label: defaultLabel },
                                                ...institutions.map(institution => ({
                                                    value: institution.id.toString(),
                                                    label: institution.name || `Institución ${institution.id}`
                                                }))
                                            ];
                                            window.inventoryInstitutionFilterSelect.setOptions(options);
                                            
                                            if (currentInstitution) {
                                                if (window.inventoryInstitutionFilterSelect && typeof window.inventoryInstitutionFilterSelect.setValue === 'function') {
                                                    window.inventoryInstitutionFilterSelect.setValue(currentInstitution);
                                                }
                                            }
                                        } else {
                                            console.warn('CustomSelect still not available after initialization attempts. The select element may not be in the DOM yet.');
                                        }
                                    }, 500);
                                }
                            }, 200);
                        } catch (error) {
                            console.error('Error initializing CustomSelect:', error);
                        }
                    } else {
                        console.warn('initializeInventoryFilterSelects function not available. Waiting for DOM to be ready...');
                        // Wait a bit more and check if the element exists in the DOM
                        setTimeout(() => {
                            institutionSelect = document.getElementById("inventoryInstitutionFilterSelect");
                            if (institutionSelect) {
                                if (institutionSelect.tagName === 'SELECT') {
                                    populateSelectWithInstitutions(institutionSelect, institutions, currentInstitution);
                                } else if (window.inventoryInstitutionFilterSelect && typeof window.inventoryInstitutionFilterSelect.setOptions === 'function') {
                                    const defaultLabel = isAdminRegional ? 'Todos los centros' : 'Todas las instituciones';
                                    const options = [
                                        { value: '', label: defaultLabel },
                                        ...institutions.map(institution => ({
                                            value: institution.id.toString(),
                                            label: institution.name || `Institución ${institution.id}`
                                        }))
                                    ];
                                    window.inventoryInstitutionFilterSelect.setOptions(options);
                                    
                                    if (currentInstitution) {
                                        if (window.inventoryInstitutionFilterSelect && typeof window.inventoryInstitutionFilterSelect.setValue === 'function') {
                                            window.inventoryInstitutionFilterSelect.setValue(currentInstitution);
                                        }
                                    }
                                }
                            }
                        }, 500);
                    }
                }
            } else {
                // No institutions or empty array
                console.log('No institutions to add or array is empty');
                const isAdminRegional = (window.currentUserRole && window.currentUserRole.toUpperCase() === 'ADMIN_REGIONAL') || 
                                       (window.location.pathname && window.location.pathname.includes('/admin_regional'));
                
                // Handle empty institutions for native select
                const institutionSelect = document.getElementById("inventoryInstitutionFilterSelect");
                if (institutionSelect && institutionSelect.tagName === 'SELECT') {
                    // Native select - clear options except first one
                    while (institutionSelect.options.length > 1) {
                        institutionSelect.remove(1);
                    }
                    const noInstitutionsLabel = isAdminRegional ? 'No hay centros disponibles' : 'No hay instituciones disponibles';
                    const option = document.createElement('option');
                    option.value = '';
                    option.textContent = noInstitutionsLabel;
                    option.disabled = true;
                    institutionSelect.appendChild(option);
                } else if (window.inventoryInstitutionFilterSelect && typeof window.inventoryInstitutionFilterSelect.setOptions === 'function') {
                    // CustomSelect
                    const noInstitutionsLabel = isAdminRegional ? 'No hay centros disponibles' : 'No hay instituciones disponibles';
                    window.inventoryInstitutionFilterSelect.setOptions([
                        { value: '', label: noInstitutionsLabel, disabled: true }
                    ]);
                    if (typeof window.inventoryInstitutionFilterSelect.setDisabled === 'function') {
                        window.inventoryInstitutionFilterSelect.setDisabled(true);
                    }
                }
            }
        } else {
            const errorText = await response.text();
            console.error('Error loading institutions:', response.status, errorText);
            const select = document.getElementById('institutionFilter');
            if (select) {
                select.disabled = true;
                // Clear and add error message
                while (select.options.length > 1) {
                    select.remove(1);
                }
                const option = document.createElement('option');
                option.value = '';
                option.textContent = 'Error al cargar instituciones';
                select.appendChild(option);
            }
        }
    } catch (error) {
        console.error('Error loading institutions:', error);
        const select = document.getElementById('institutionFilter');
        if (select) {
            select.disabled = true;
            // Clear and add error message
            while (select.options.length > 1) {
                select.remove(1);
            }
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'Error al cargar instituciones';
            select.appendChild(option);
        }
    }
}

// Handle regional filter change
async function handleRegionalFilterChange(regionalId) {
    // Ensure inventoryData exists
    if (!window.inventoryData) {
        window.inventoryData = inventoryData || {};
    }
    
    // Prevent infinite loop: check if regional is already set to this value
    const currentRegional = window.inventoryData.selectedRegional || '';
    if (currentRegional === (regionalId || '')) {
        return; // Already set to this value, skip
    }
    
    window.inventoryData.selectedRegional = regionalId || '';
    
    // Clear institution selection when regional changes
    window.inventoryData.selectedInstitution = '';
    
    // Reset institution dropdown (CustomSelect or native select)
    if (window.inventoryInstitutionFilterSelect && typeof window.inventoryInstitutionFilterSelect.setOptions === 'function') {
        if (!regionalId) {
            window.inventoryInstitutionFilterSelect.setOptions([
                { value: '', label: 'Todas las instituciones', disabled: true }
            ]);
            // Clear the selection
            if (typeof window.inventoryInstitutionFilterSelect.setValue === 'function') {
                const originalOnChange = window.inventoryInstitutionFilterSelect.onChange;
                window.inventoryInstitutionFilterSelect.onChange = null;
                window.inventoryInstitutionFilterSelect.setValue('');
                window.inventoryInstitutionFilterSelect.onChange = originalOnChange;
            }
            // Disable the CustomSelect
            if (typeof window.inventoryInstitutionFilterSelect.setDisabled === 'function') {
                window.inventoryInstitutionFilterSelect.setDisabled(true);
            }
        } else {
            // Clear the current selection first
            if (typeof window.inventoryInstitutionFilterSelect.setValue === 'function') {
                const originalOnChange = window.inventoryInstitutionFilterSelect.onChange;
                window.inventoryInstitutionFilterSelect.onChange = null;
                window.inventoryInstitutionFilterSelect.setValue('');
                window.inventoryInstitutionFilterSelect.onChange = originalOnChange;
            }
            // Enable the CustomSelect - institutions will be loaded below
            if (typeof window.inventoryInstitutionFilterSelect.setDisabled === 'function') {
                window.inventoryInstitutionFilterSelect.setDisabled(false);
            }
        }
    } else {
        // Fallback to native select
        const institutionSelect = document.getElementById('inventoryInstitutionFilterSelect');
        if (institutionSelect && institutionSelect.tagName === 'SELECT') {
            institutionSelect.disabled = !regionalId;
            while (institutionSelect.options.length > 1) {
                institutionSelect.remove(1);
            }
            institutionSelect.value = '';
            
            if (!regionalId) {
                const option = document.createElement('option');
                option.value = '';
                option.textContent = 'Todas las instituciones';
                institutionSelect.appendChild(option);
            }
        }
    }
    
    // Load institutions for the selected regional BEFORE reloading inventories
    if (regionalId) {
        // Ensure the institution CustomSelect is initialized
        if (!window.inventoryInstitutionFilterSelect && typeof initializeInventoryFilterSelects === 'function') {
            initializeInventoryFilterSelects();
            // Wait for initialization
            await new Promise(resolve => setTimeout(resolve, 200));
        }
        
        // Wait a bit to ensure DOM is ready
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Load institutions for the selected regional
        await loadInstitutionsForFilter(regionalId);
        
        // Wait a bit more to ensure institutions are added and CustomSelect is updated
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Verify that institutions were loaded
        if (window.inventoryInstitutionFilterSelect) {
            const options = window.inventoryInstitutionFilterSelect.options || [];
            
            // If no options were loaded, try one more time
            if (options.length <= 1) {
                await loadInstitutionsForFilter(regionalId);
            }
        }
    } else {
        // Clear institutions if no regional selected
        if (window.inventoryInstitutionFilterSelect && typeof window.inventoryInstitutionFilterSelect.setOptions === 'function') {
            window.inventoryInstitutionFilterSelect.setOptions([
                { value: '', label: 'Todas las instituciones', disabled: true }
            ]);
            window.inventoryInstitutionFilterSelect.clear();
            if (typeof window.inventoryInstitutionFilterSelect.setDisabled === 'function') {
                window.inventoryInstitutionFilterSelect.setDisabled(true);
            }
        } else {
            // Fallback to native select
            const institutionSelect = document.getElementById('institutionFilter');
            if (institutionSelect) {
                institutionSelect.disabled = true;
                while (institutionSelect.options.length > 1) {
                    institutionSelect.remove(1);
                }
                institutionSelect.value = '';
            }
        }
    }
    
    // Reload inventories with new filter
    if (!window.inventoryData) {
        window.inventoryData = inventoryData || {};
    }
    window.inventoryData.currentPage = 1; // Use 1-based for UI
    await loadInventories({ page: 0 });
    
    // Update UI but preserve the institution dropdown
    if (typeof updateInventoryStats === 'function') {
        updateInventoryStats();
    }
    if (typeof updateViewModeButtons === 'function') {
        updateViewModeButtons();
    }
    const viewMode = window.inventoryData?.viewMode || "table";
    if (viewMode === "table") {
        if (typeof updateInventoryTable === 'function') {
            updateInventoryTable();
        }
    } else {
        if (typeof updateInventoryCards === 'function') {
            updateInventoryCards();
        }
    }
    if (typeof updatePagination === 'function') {
        updatePagination();
    }
    
    // Don't update the CustomSelect visual value here - it's already updated by selectOption
    // The onChange callback is called AFTER selectOption updates the text, so we don't need to update it again
    // However, we should verify the text is still correct after a short delay
    setTimeout(() => {
        if (window.inventoryRegionalFilterSelect && typeof window.inventoryRegionalFilterSelect.getValue === 'function') {
            const currentValue = window.inventoryRegionalFilterSelect.getValue();
            const expectedValue = regionalId || '';
            const currentText = window.inventoryRegionalFilterSelect.selectedText || '';
            
            // If value matches but we need to verify text is correct
            if (String(currentValue) === String(expectedValue) && expectedValue !== '') {
                // Find the option to get the correct label
                const options = window.inventoryRegionalFilterSelect.options || [];
                const option = options.find(opt => String(opt.value) === String(expectedValue));
                
                if (option && option.label) {
                    // Verify the text element shows the correct label
                    const textElement = window.inventoryRegionalFilterSelect.container?.querySelector(".custom-select-text");
                    if (textElement && textElement.textContent !== option.label) {
                        textElement.textContent = option.label;
                        textElement.classList.remove("custom-select-placeholder");
                        window.inventoryRegionalFilterSelect.selectedText = option.label;
                    }
                }
            }
        }
    }, 150);
    
    // DON'T call updateSearchAndFilters here as it will recreate the HTML and lose the institutions
    // Instead, just update the regional select value if needed (fallback for native select)
    const regionalSelect = document.getElementById('regionalFilter');
    if (regionalSelect && regionalId) {
        regionalSelect.value = regionalId;
    }
}

// Handle institution filter change
async function handleInstitutionFilterChange(institutionId) {
    // Ensure inventoryData exists
    if (!window.inventoryData) {
        window.inventoryData = inventoryData || {};
    }
    
    // Prevent infinite loop: check if institution is already set to this value
    const currentInstitution = window.inventoryData.selectedInstitution || '';
    if (currentInstitution === (institutionId || '')) {
        return; // Already set to this value, skip
    }
    
    window.inventoryData.selectedInstitution = institutionId || '';
    
    // Also update local inventoryData reference
    if (inventoryData && inventoryData !== window.inventoryData) {
        inventoryData.selectedInstitution = institutionId || '';
    }
    
    // Reload inventories with new filter
    window.inventoryData.currentPage = 1; // Use 1-based for UI
    await loadInventories({ page: 0 });
    
    // Update the CustomSelect visual value to reflect the selection
    if (window.inventoryInstitutionFilterSelect && typeof window.inventoryInstitutionFilterSelect.setValue === 'function') {
        // Temporarily disable onChange to prevent infinite loop
        const originalOnChange = window.inventoryInstitutionFilterSelect.onChange;
        window.inventoryInstitutionFilterSelect.onChange = null;
        try {
            window.inventoryInstitutionFilterSelect.setValue(institutionId || '');
        } catch (error) {
            console.error('Error setting institution filter value:', error);
        }
        window.inventoryInstitutionFilterSelect.onChange = originalOnChange;
    }
    
    // Update UI but don't call filterInventories as the server already filtered
    if (typeof updateInventoryStats === 'function') {
        updateInventoryStats();
    }
    if (typeof updateViewModeButtons === 'function') {
        updateViewModeButtons();
    }
    const viewMode = window.inventoryData?.viewMode || "table";
    if (viewMode === "table") {
        if (typeof updateInventoryTable === 'function') {
            updateInventoryTable();
        }
    } else {
        if (typeof updateInventoryCards === 'function') {
            updateInventoryCards();
        }
    }
    if (typeof updatePagination === 'function') {
        updatePagination();
    }
    
    // Update search and filters to sync the visual state (but don't recreate)
    if (typeof updateSearchAndFilters === 'function') {
        // This will update the visual state without recreating the selects
        updateSearchAndFilters();
    }
}

// Function to load inventory statistics (only for SUPERADMIN)
async function loadInventoryStatistics() {
    try {
        const token = localStorage.getItem('jwt');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        // Check if current user is SUPERADMIN
        const currentRole = window.currentUserRole || '';
        if (currentRole !== 'SUPERADMIN') {
            // For non-SUPERADMIN users, return null to use local calculation
            return null;
        }

        const response = await fetch('/api/v1/inventory/statistics', {
            method: 'GET',
            headers: headers
        });

        if (response.ok) {
            const statistics = await response.json();
            // Store statistics in inventoryData
            if (window.inventoryData) {
                window.inventoryData.statistics = statistics;
            }
            if (inventoryData && inventoryData !== window.inventoryData) {
                inventoryData.statistics = statistics;
            }
            return statistics;
        } else {
            console.warn('Failed to load inventory statistics, falling back to local calculation');
            return null;
        }
    } catch (error) {
        console.error('Error loading inventory statistics:', error);
        return null;
    }
}

// Export functions
window.loadRegionalsForFilter = loadRegionalsForFilter;
window.loadInstitutionsForFilter = loadInstitutionsForFilter;
window.handleRegionalFilterChange = handleRegionalFilterChange;
window.handleInstitutionFilterChange = handleInstitutionFilterChange;
window.loadInventoryStatistics = loadInventoryStatistics;
window.loadInventoryStatistics = loadInventoryStatistics;