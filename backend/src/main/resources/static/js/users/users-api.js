async function loadUsersData() {
    if (usersData.isLoading) return;

    usersData.isLoading = true;
    showLoadingState();

    try {
        await loadCurrentUserInfo();
        // Reset to page 0 when loading fresh data
        await loadUsers(0);
        updateUsersUI();

    } catch (error) {
        console.error('Error loading users data:', error);
        showErrorState('Error al cargar los datos de usuarios: ' + error.message);
        updateUsersUI();
    } finally {
        usersData.isLoading = false;
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
            // Store current user ID and role globally
            if (window.usersData) {
                window.usersData.currentLoggedInUserId = userData.id;
                window.usersData.currentLoggedInUserRole = userData.role;
            }
            updateUserInfoDisplay(userData);
        } else {
            throw new Error('Failed to load user info');
        }
    } catch (error) {
        console.error('Error loading current user info:', error);
        updateUserInfoDisplay({
            fullName: 'Super Admin',
            role: 'SUPERADMIN',
            email: 'admin@sena.edu.co'
        });
    }
}

async function loadUsers(page = 0) {
    try {
        const token = localStorage.getItem('jwt');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        // Check if filters are active
        const hasFilters = usersData.searchTerm || usersData.selectedRole !== 'all' || usersData.selectedStatus !== 'all';
        
        let url;
        if (hasFilters) {
            // Load all users for filtering (set a large page size)
            url = `/api/v1/users?page=0&size=1000`;
        } else {
            // Use pagination
            url = `/api/v1/users?page=${page}&size=${usersData.itemsPerPage}`;
        }

        const response = await fetch(url, {
            method: 'GET',
            headers: headers
        });

        if (response.ok) {
            const pagedResponse = await response.json();
            
            // Update users data with paginated response
            usersData.users = Array.isArray(pagedResponse.users) ? pagedResponse.users : [];
            
            if (hasFilters) {
                // Will be filtered by filterUsers function
                usersData.filteredUsers = [...usersData.users];
                usersData.totalPages = 0;
                usersData.totalUsers = usersData.users.length;
            } else {
                // Direct backend pagination
                usersData.filteredUsers = [...usersData.users];
                usersData.totalPages = pagedResponse.totalPages || 0;
                usersData.totalUsers = pagedResponse.totalUsers || 0;
                usersData.backendPage = pagedResponse.currentPage || 0;
                usersData.currentPage = (pagedResponse.currentPage || 0) + 1; // Convert to 1-indexed for UI
            }
        } else {
            throw new Error('Failed to load users');
        }
    } catch (error) {
        console.error('Error loading users:', error);
        usersData.users = [];
        usersData.filteredUsers = [];
        usersData.totalPages = 0;
        usersData.totalUsers = 0;
    }
}

// Flag to prevent multiple simultaneous delete operations
window.isDeletingUser = false;

// Function to restore delete button state
function restoreDeleteButton(deleteButton, cancelButton) {
    if (deleteButton) {
        deleteButton.disabled = false;
        deleteButton.classList.remove('opacity-50', 'cursor-not-allowed');
        deleteButton.innerHTML = 'Eliminar Usuario';
    }
    if (cancelButton) {
        cancelButton.disabled = false;
        cancelButton.classList.remove('opacity-50', 'cursor-not-allowed');
    }
}

async function confirmDeleteUser() {
    // Prevent multiple simultaneous delete operations
    if (window.isDeletingUser) {
        return;
    }

    if (!usersData.currentUserId) {
        showErrorToast('Error', 'No se ha seleccionado un usuario para eliminar');
        return;
    }

    // Get delete button and disable it immediately
    const deleteButton = document.getElementById('deleteUserButton');
    const cancelButton = document.querySelector('#deleteUserModalActions button:first-child');
    
    if (deleteButton) {
        deleteButton.disabled = true;
        deleteButton.classList.add('opacity-50', 'cursor-not-allowed');
        deleteButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Eliminando...';
    }
    if (cancelButton) {
        cancelButton.disabled = true;
        cancelButton.classList.add('opacity-50', 'cursor-not-allowed');
    }

    // Set flag to prevent multiple calls
    window.isDeletingUser = true;

    // Verificar que el usuario aún existe en la lista
    const currentUser = usersData.users.find(u => u && u.id == usersData.currentUserId);
    if (!currentUser) {
        window.isDeletingUser = false;
        restoreDeleteButton(deleteButton, cancelButton);
        showErrorToast('Usuario no encontrado', 'El usuario ya no existe en la lista. Puede que ya haya sido eliminado.');
        closeDeleteUserModal();
        return;
    }

    // Verificar que no sea un administrador
    if (currentUser.role === 'SUPERADMIN' || currentUser.role === 'ADMIN_INSTITUTION' || currentUser.role === 'ADMIN_REGIONAL') {
        window.isDeletingUser = false;
        restoreDeleteButton(deleteButton, cancelButton);
        showErrorToast('No permitido', 'No se puede eliminar un usuario administrador.');
        closeDeleteUserModal();
        return;
    }

    try {
        const token = localStorage.getItem('jwt');
        const headers = {
            'Content-Type': 'application/json'
        };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(`/api/v1/users/${usersData.currentUserId}`, {
            method: 'DELETE',
            headers: headers
        });

        if (response.ok) {
            showSuccessToast('Usuario eliminado', `Usuario ${currentUser.fullName || 'sin nombre'} eliminado exitosamente`);
            window.isDeletingUser = false; // Reset flag before closing modal
            closeDeleteUserModal();
            // Wait a bit before reloading to ensure DB transaction completes
            await new Promise(resolve => setTimeout(resolve, 500));
            await loadUsersData();
        } else if (response.status === 404) {
            window.isDeletingUser = false;
            restoreDeleteButton(deleteButton, cancelButton);
            showErrorToast('Usuario no encontrado', 'El usuario que intenta eliminar no existe o ya fue eliminado.');
            closeDeleteUserModal();
            await loadUsersData();
        } else if (response.status === 409) {
            // Conflict - user has assigned inventories
            window.isDeletingUser = false;
            restoreDeleteButton(deleteButton, cancelButton);
            let errorMessage = 'No se puede eliminar este usuario porque tiene inventarios asignados.';
            try {
                const errorData = await response.json();
                if (errorData.detail) {
                    errorMessage = errorData.detail;
                } else if (errorData.message) {
                    errorMessage = errorData.message;
                }
            } catch (parseError) {
                console.error('Error parsing conflict response:', parseError);
            }
            showWarningToast('Usuario con inventarios asignados', errorMessage, true, 8000);
            closeDeleteUserModal();
        } else if (response.status === 500) {
            // Internal server error - could be constraint violation
            window.isDeletingUser = false;
            restoreDeleteButton(deleteButton, cancelButton);
            let errorMessage = 'No se puede eliminar este usuario porque tiene recursos asignados en el sistema.';
            try {
                const errorData = await response.json();
                if (errorData.detail) {
                    // Extract user-friendly message from detail
                    const detail = errorData.detail;
                    if (detail.includes('foreign key constraint') || detail.includes('inventories')) {
                        errorMessage = 'No se puede eliminar este usuario porque tiene inventarios asignados. Por favor, transfiere la propiedad y gestión de todos los inventarios a otro usuario antes de eliminarlo.';
                    } else if (detail.includes('No se puede eliminar')) {
                        // Use the backend message if it's user-friendly
                        errorMessage = detail;
                    } else {
                        // Hide SQL errors, show generic message
                        errorMessage = 'No se puede eliminar este usuario porque tiene recursos asignados en el sistema. Transfiere todos los recursos a otro usuario antes de eliminarlo.';
                    }
                } else if (errorData.message) {
                    errorMessage = errorData.message;
                }
            } catch (parseError) {
                console.error('Error parsing error response:', parseError);
                errorMessage = 'No se puede eliminar este usuario porque tiene recursos asignados en el sistema (inventarios, items, etc.). Transfiere todos los recursos a otro usuario antes de eliminarlo.';
            }
            showErrorToast('Usuario con recursos asignados', errorMessage, true, 10000);
            closeDeleteUserModal();
        } else if (response.status === 403) {
            window.isDeletingUser = false;
            restoreDeleteButton(deleteButton, cancelButton);
            showErrorToast('Permisos insuficientes', 'No tienes permisos para eliminar este usuario.');
            closeDeleteUserModal();
        } else if (response.status === 401) {
            window.isDeletingUser = false;
            restoreDeleteButton(deleteButton, cancelButton);
            showErrorToast('Sesión expirada', 'Tu sesión ha expirado. Por favor inicia sesión nuevamente.');
            closeDeleteUserModal();
        } else {
            // Other errors
            window.isDeletingUser = false;
            restoreDeleteButton(deleteButton, cancelButton);
            let errorMessage = 'Error desconocido al eliminar el usuario';
            try {
                const errorData = await response.json();
                if (errorData.detail) {
                    // Check if it's a user-friendly message or SQL error
                    const detail = errorData.detail;
                    if (detail.includes('foreign key constraint') || detail.includes('SQL') || detail.includes('constraint')) {
                        errorMessage = 'No se puede eliminar este usuario porque tiene recursos asignados en el sistema. Transfiere todos los recursos a otro usuario antes de eliminarlo.';
                    } else {
                        errorMessage = detail;
                    }
                } else if (errorData.message) {
                    errorMessage = errorData.message;
                }
                console.error('Delete user error response:', errorData);
            } catch (parseError) {
                // Don't show raw error text to user
                console.error('Delete user error (text):', parseError);
                errorMessage = 'Error al eliminar el usuario. Por favor intenta nuevamente.';
            }
            showErrorToast('Error al eliminar usuario', errorMessage, true, 8000);
            closeDeleteUserModal();
        }
    } catch (error) {
        window.isDeletingUser = false;
        restoreDeleteButton(deleteButton, cancelButton);
        console.error('Error deleting user:', error);
        showErrorToast('Error de conexión', 'No se pudo conectar con el servidor. Inténtalo de nuevo.');
        closeDeleteUserModal();
    }
}

window.confirmDeleteUser = confirmDeleteUser;

// Function to load regionals for new user modal
async function loadRegionalsForNewUser() {
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
            const options = regionals.map(regional => ({
                value: regional.id.toString(),
                label: regional.name
            }));

            if (window.regionalSelect) {
                window.regionalSelect.setOptions(options);
            }
        } else {
            showErrorToast('Error', 'No se pudieron cargar las regionales');
        }
    } catch (error) {
        console.error('Error loading regionals:', error);
        showErrorToast('Error', 'Error al cargar las regionales');
    }
}

// Function to load institutions by regional ID
async function loadInstitutionsByRegional(regionalId) {
    try {
        const token = localStorage.getItem('jwt');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(`/api/v1/institutions/institutionsByRegionalId/${regionalId}`, {
            method: 'GET',
            headers: headers
        });

        if (response.ok) {
            const institutions = await response.json();
            const options = institutions.map(institution => ({
                value: institution.id.toString(),
                label: institution.name
            }));

            if (window.institutionSelect) {
                window.institutionSelect.setOptions(options);
            }
        } else {
            showErrorToast('Error', 'No se pudieron cargar las instituciones');
        }
    } catch (error) {
        console.error('Error loading institutions:', error);
        showErrorToast('Error', 'Error al cargar las instituciones');
    }
}

window.loadRegionalsForNewUser = loadRegionalsForNewUser;
window.loadInstitutionsByRegional = loadInstitutionsByRegional;