const DEFAULT_INSTITUTION_PAGE_SIZE = 50;

async function loadInventoryData() {
    if (inventoryData.isLoading) return;

    inventoryData.isLoading = true;
    showLoadingState();

    try {
        await loadCurrentUserInfo();
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
            updateUserInfoDisplay(userData);
            
            // If super admin, trigger filter update to show regional/institution filters
            if (userData.role && userData.role.toUpperCase() === 'SUPERADMIN') {
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
        updateUserInfoDisplay({
            fullName: 'Super Admin',
            role: 'ADMIN',
            email: 'admin@sena.edu.co'
        });
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
    
    // Check if we have regional/institution filters for super admin
    const isSuperAdmin = (window.currentUserRole && window.currentUserRole.toUpperCase() === 'SUPERADMIN') || 
                         (window.location.pathname && window.location.pathname.includes('/superadmin'));
    
    if (isSuperAdmin) {
        // Use window.inventoryData to ensure we get the latest values
        const data = window.inventoryData || inventoryData || {};
        const selectedRegional = data.selectedRegional;
        const selectedInstitution = data.selectedInstitution;
        
        console.log('Building endpoint with filters - Regional:', selectedRegional, 'Institution:', selectedInstitution);
        
        if (selectedRegional && selectedInstitution) {
            // Filter by both regional and institution
            const params = new URLSearchParams({
                page: page.toString(),
                size: size.toString()
            });
            const endpoint = `/api/v1/inventory/regional/${selectedRegional}/institution/${selectedInstitution}?${params.toString()}`;
            console.log('Using endpoint:', endpoint);
            return endpoint;
        } else if (selectedRegional) {
            // Filter by regional only
            const params = new URLSearchParams({
                page: page.toString(),
                size: size.toString()
            });
            const endpoint = `/api/v1/inventory/regionalAdminInventories/${selectedRegional}?${params.toString()}`;
            console.log('Using endpoint:', endpoint);
            return endpoint;
        }
    }
    
    // Default endpoint with pagination
    const params = new URLSearchParams({
        page: page.toString(),
        size: size.toString()
    });
    const endpoint = `/api/v1/inventory?${params.toString()}`;
    console.log('Using default endpoint:', endpoint);
    return endpoint;
}

function updateInventoryScopeMessage(scope = 'global') {
    const welcomeMessage = document.getElementById('inventoryWelcomeMessage');
    if (!welcomeMessage) {
        return;
    }

    if (scope === 'institution') {
        welcomeMessage.textContent = 'Inventarios asociados a tu institución.';
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
        const size = typeof options.size === 'number' ? options.size : (inventoryData?.serverPageSize || DEFAULT_INSTITUTION_PAGE_SIZE);
        const useInstitutionScope = shouldUseInstitutionInventories();
        const endpoint = buildInventoryEndpoint(page, size);

        if (inventoryData) {
            inventoryData.serverPageSize = size;
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
                    inventoryData.inventoryScope = useInstitutionScope ? 'institution' : 'global';
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
                    inventoryData.inventoryScope = useInstitutionScope ? 'institution' : 'global';
                }
            } else {
                inventories = [];
                if (inventoryData) {
                    inventoryData.serverPagination = null;
                    inventoryData.inventoryScope = useInstitutionScope ? 'institution' : 'global';
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
            }
            
            console.log('Inventories loaded:', data.inventories.length);
            console.log('Filtered inventories:', data.filteredInventories.length);
            
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
            throw new Error(errorData.detail || errorData.message || 'Este propietario ya tiene un inventario asignado');
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
            const select = document.getElementById('regionalFilter');
            if (select) {
                // Clear existing options except the first one
                while (select.options.length > 1) {
                    select.remove(1);
                }
                
                // Add regional options
                const currentRegional = (window.inventoryData || inventoryData)?.selectedRegional || '';
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
        } else {
            console.error('Error loading regionals:', response.statusText);
        }
    } catch (error) {
        console.error('Error loading regionals:', error);
    }
}

// Load institutions for filter dropdown based on selected regional (super admin only)
async function loadInstitutionsForFilter(regionalId) {
    try {
        if (!regionalId) {
            console.error('No regional ID provided');
            return;
        }

        const token = localStorage.getItem('jwt');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        console.log('Loading institutions for regional:', regionalId);
        const response = await fetch(`/api/v1/institutions/institutionsByRegionalId/${regionalId}`, {
            method: 'GET',
            headers: headers
        });

        if (response.ok) {
            const institutions = await response.json();
            console.log('Institutions loaded:', institutions);
            
            // Function to add institutions to select
            const addInstitutionsToSelect = (selectElement) => {
                if (!selectElement) return false;
                
                // Clear existing options except the first one
                while (selectElement.options.length > 1) {
                    selectElement.remove(1);
                }
                
                // Enable the select
                selectElement.disabled = false;
                
                // Add institution options
                if (institutions && Array.isArray(institutions) && institutions.length > 0) {
                    const currentInstitution = (window.inventoryData || inventoryData)?.selectedInstitution || '';
                    institutions.forEach(institution => {
                        const option = document.createElement('option');
                        option.value = institution.id.toString();
                        option.textContent = institution.name || `Institución ${institution.id}`;
                        if (currentInstitution === institution.id.toString()) {
                            option.selected = true;
                        }
                        selectElement.appendChild(option);
                    });
                    console.log(`Added ${institutions.length} institutions to dropdown`);
                    return true;
                } else {
                    // No institutions found
                    const option = document.createElement('option');
                    option.value = '';
                    option.textContent = 'No hay instituciones disponibles';
                    option.disabled = true;
                    selectElement.appendChild(option);
                    console.log('No institutions found for this regional');
                    return true;
                }
            };
            
            // Try to find the select element with multiple retries
            let select = document.getElementById('institutionFilter');
            let attempts = 0;
            const maxAttempts = 5;
            
            while (!select && attempts < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, 100));
                select = document.getElementById('institutionFilter');
                attempts++;
                console.log(`Attempt ${attempts} to find institutionFilter select`);
            }
            
            console.log('Institution select element:', select);
            
            if (select) {
                addInstitutionsToSelect(select);
            } else {
                console.error('Institution filter select not found in DOM after', maxAttempts, 'attempts');
                // Try one more time after a longer delay
                setTimeout(() => {
                    const retrySelect = document.getElementById('institutionFilter');
                    if (retrySelect) {
                        console.log('Found select on final retry, adding institutions');
                        addInstitutionsToSelect(retrySelect);
                    } else {
                        console.error('Could not find institutionFilter select even after final retry');
                    }
                }, 500);
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
    console.log('Regional filter changed to:', regionalId);
    
    // Ensure inventoryData exists
    if (!window.inventoryData) {
        window.inventoryData = inventoryData || {};
    }
    
    window.inventoryData.selectedRegional = regionalId || '';
    
    // Clear institution selection when regional changes
    window.inventoryData.selectedInstitution = '';
    
    // Reset institution dropdown
    const institutionSelect = document.getElementById('institutionFilter');
    if (institutionSelect) {
        institutionSelect.disabled = !regionalId;
        // Clear options except the first one
        while (institutionSelect.options.length > 1) {
            institutionSelect.remove(1);
        }
        institutionSelect.value = '';
        
        if (!regionalId) {
            // If no regional selected, show placeholder
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'Todas las instituciones';
            institutionSelect.appendChild(option);
        }
    }
    
    // Load institutions for the selected regional BEFORE reloading inventories
    if (regionalId) {
        console.log('Loading institutions for regional:', regionalId);
        // Wait a bit to ensure DOM is ready
        await new Promise(resolve => setTimeout(resolve, 100));
        await loadInstitutionsForFilter(regionalId);
        // Wait a bit more to ensure institutions are added
        await new Promise(resolve => setTimeout(resolve, 100));
    } else {
        // Clear institutions if no regional selected
        const institutionSelect = document.getElementById('institutionFilter');
        if (institutionSelect) {
            institutionSelect.disabled = true;
            while (institutionSelect.options.length > 1) {
                institutionSelect.remove(1);
            }
            institutionSelect.value = '';
        }
    }
    
    // Reload inventories with new filter
    if (!window.inventoryData) {
        window.inventoryData = inventoryData || {};
    }
    window.inventoryData.currentPage = 1; // Use 1-based for UI
    console.log('Reloading inventories with regional filter:', regionalId);
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
    
    // DON'T call updateSearchAndFilters here as it will recreate the HTML and lose the institutions
    // Instead, just update the regional select value if needed
    const regionalSelect = document.getElementById('regionalFilter');
    if (regionalSelect && regionalId) {
        regionalSelect.value = regionalId;
    }
}

// Handle institution filter change
async function handleInstitutionFilterChange(institutionId) {
    console.log('Institution filter changed to:', institutionId);
    
    // Ensure inventoryData exists
    if (!window.inventoryData) {
        window.inventoryData = inventoryData || {};
    }
    
    window.inventoryData.selectedInstitution = institutionId || '';
    
    // Reload inventories with new filter
    window.inventoryData.currentPage = 1; // Use 1-based for UI
    console.log('Reloading inventories with institution filter:', institutionId);
    await loadInventories({ page: 0 });
    if (typeof updateInventoryUI === 'function') {
        updateInventoryUI();
    }
}

// Export functions
window.loadRegionalsForFilter = loadRegionalsForFilter;
window.loadInstitutionsForFilter = loadInstitutionsForFilter;
window.handleRegionalFilterChange = handleRegionalFilterChange;
window.handleInstitutionFilterChange = handleInstitutionFilterChange;