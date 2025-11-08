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
            updateUserInfoDisplay(userData);
        } else {
            throw new Error('Failed to load user info');
        }
    } catch (error) {
        console.error('Error loading current user info:', error);
        updateUserInfoDisplay({
            fullName: 'Super Admin',
            role: 'ADMIN',
            email: 'admin@sena.edu.co'
        });
    }
}

async function loadInventories() {
    try {
        const token = localStorage.getItem('jwt');
        const headers = { 'Content-Type': 'application/json' };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch('/api/v1/inventory', {
            method: 'GET',
            headers: headers
        });

        if (response.ok) {
            const inventories = await response.json();

            inventoryData.inventories = Array.isArray(inventories) ? inventories : [];
            inventoryData.filteredInventories = [...inventoryData.inventories];

            if (inventoryData.inventories.length === 0) {
                showInfoToast('Información', 'No hay inventarios registrados en el sistema. Crea el primero usando el botón "Nuevo Inventario".');
            }
        } else {
            const errorText = await response.text();

            if (response.status === 401) {
                showErrorToast('Sesión expirada', 'Tu sesión ha expirado. Por favor inicia sesión nuevamente.');
                // Redirect to login page after a short delay
                setTimeout(() => {
                    window.location.href = '/';
                }, 3000);
            } else if (response.status === 403) {
                showErrorToast('Acceso denegado', 'No tienes permisos para ver los inventarios.');
            } else {
                throw new Error(`Failed to load inventories: ${response.status} ${response.statusText}`);
            }
        }
    } catch (error) {
        console.error('Error loading inventories:', error);

        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            showErrorToast('Error de conexión', 'No se pudo conectar con el servidor. Verifica tu conexión a internet.');
        } else {
            showErrorToast('Error', 'Error al cargar los inventarios: ' + error.message);
        }

        inventoryData.inventories = [];
        inventoryData.filteredInventories = [];
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
            throw new Error(errorData.message || 'Datos de inventario inválidos');
        } else if (response.status === 401) {
            throw new Error('Sesión expirada. Por favor inicia sesión nuevamente.');
        } else if (response.status === 403) {
            throw new Error('No tienes permisos para crear inventarios.');
        } else {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error al crear el inventario');
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

async function deleteInventory(inventoryId) {
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
        } else if (response.status === 400) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Datos de asignación inválidos');
        } else if (response.status === 401) {
            throw new Error('Sesión expirada. Por favor inicia sesión nuevamente.');
        } else if (response.status === 403) {
            throw new Error('No tienes permisos para asignar inventarios.');
        } else {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error al asignar el inventario');
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
            throw new Error(errorData.message || 'Datos de asignación de gerente inválidos');
        } else if (response.status === 401) {
            throw new Error('Sesión expirada. Por favor inicia sesión nuevamente.');
        } else if (response.status === 403) {
            throw new Error('No tienes permisos para asignar gerentes.');
        } else {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error al asignar el gerente');
        }
    } catch (error) {
        if (error.message && error.message.includes('Failed to fetch')) {
            throw new Error('Error de conexión. Verifica tu conexión a internet.');
        }
        throw error;
    }
}

window.loadInventoryData = loadInventoryData;
window.loadCurrentUserInfo = loadCurrentUserInfo;
window.loadInventories = loadInventories;
window.createInventory = createInventory;
window.updateInventory = updateInventory;
window.deleteInventory = deleteInventory;
window.getInventoryById = getInventoryById;
window.assignInventory = assignInventory;
window.assignManager = assignManager;