async function loadUsersData() {
    if (usersData.isLoading) return;

    usersData.isLoading = true;
    showLoadingState();

    try {
        await loadCurrentUserInfo();
        // Load statistics for SUPERADMIN
        await loadUserStatistics();
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
            // Also store in window for easy access
            window.currentUserRole = userData.role;
            // Call updateUserInfoDisplay if available (may not be available on items page)
            if (typeof updateUserInfoDisplay === 'function') {
                updateUserInfoDisplay(userData);
            } else if (window.updateUserInfoDisplay) {
                window.updateUserInfoDisplay(userData);
            }
            
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
            if (window.usersData) {
                window.usersData.currentLoggedInUserRole = 'SUPERADMIN';
            }
        }
        // Call updateUserInfoDisplay if available (may not be available on items page)
        if (typeof updateUserInfoDisplay === 'function') {
            updateUserInfoDisplay({
                fullName: 'Super Admin',
                role: 'SUPERADMIN',
                email: 'admin@sena.edu.co'
            });
        } else if (window.updateUserInfoDisplay) {
            window.updateUserInfoDisplay({
                fullName: 'Super Admin',
                role: 'SUPERADMIN',
                email: 'admin@sena.edu.co'
            });
        }
    }
}

async function loadUsers(page = 0) {
    try {
        const token = localStorage.getItem('jwt');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        // Check if current user is ADMIN_INSTITUTION
        const currentRole = usersData.currentLoggedInUserRole || '';
        const isAdminInstitution = currentRole === 'ADMIN_INSTITUTION';
        
        // Check if filters are active (including regional and institution for super admin)
        const isSuperAdmin = (usersData.currentLoggedInUserRole && usersData.currentLoggedInUserRole.toUpperCase() === 'SUPERADMIN') ||
                             (window.location.pathname && window.location.pathname.includes('/superadmin'));
        const hasFilters = usersData.searchTerm || 
                          usersData.selectedRole !== 'all' || 
                          usersData.selectedStatus !== 'all' ||
                          (isSuperAdmin && (usersData.selectedRegional || usersData.selectedInstitution));
        
        console.log('loadUsers - hasFilters:', hasFilters, {
            searchTerm: usersData.searchTerm,
            selectedRole: usersData.selectedRole,
            selectedStatus: usersData.selectedStatus,
            selectedRegional: usersData.selectedRegional,
            selectedInstitution: usersData.selectedInstitution,
            isSuperAdmin: isSuperAdmin
        });
        
        let url;
        if (isAdminInstitution) {
            // Use institution endpoint for ADMIN_INSTITUTION
            if (hasFilters) {
                // Load all users for filtering (set a large page size)
                url = `/api/v1/users/institution?page=0&size=1000`;
            } else {
                // Use pagination
                url = `/api/v1/users/institution?page=${page}&size=${usersData.itemsPerPage}`;
            }
        } else {
            // Use regular endpoint for other roles
            if (hasFilters) {
                // Load all users for filtering (set a large page size)
                url = `/api/v1/users?page=0&size=1000`;
            } else {
                // Use pagination
                url = `/api/v1/users?page=${page}&size=${usersData.itemsPerPage}`;
            }
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

// Load regionals for filter dropdown (super admin only)
async function loadRegionalsForUserFilter() {
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
            const select = document.getElementById('userRegionalFilter');
            if (select) {
                // Clear existing options except the first one
                while (select.options.length > 1) {
                    select.remove(1);
                }
                
                // Add regional options
                const currentRegional = (window.usersData || usersData)?.selectedRegional || '';
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
async function loadInstitutionsForUserFilter(regionalId) {
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
                    const currentInstitution = (window.usersData || usersData)?.selectedInstitution || '';
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
            let select = document.getElementById('userInstitutionFilter');
            let attempts = 0;
            const maxAttempts = 5;
            
            while (!select && attempts < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, 100));
                select = document.getElementById('userInstitutionFilter');
                attempts++;
                console.log(`Attempt ${attempts} to find userInstitutionFilter select`);
            }
            
            console.log('Institution select element:', select);
            
            if (select) {
                addInstitutionsToSelect(select);
            } else {
                console.error('Institution filter select not found in DOM after', maxAttempts, 'attempts');
                // Try one more time after a longer delay
                setTimeout(() => {
                    const retrySelect = document.getElementById('userInstitutionFilter');
                    if (retrySelect) {
                        console.log('Found select on final retry, adding institutions');
                        addInstitutionsToSelect(retrySelect);
                    } else {
                        console.error('Could not find userInstitutionFilter select even after final retry');
                    }
                }, 500);
            }
        } else {
            const errorText = await response.text();
            console.error('Error loading institutions:', response.status, errorText);
            const select = document.getElementById('userInstitutionFilter');
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
        const select = document.getElementById('userInstitutionFilter');
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

// Handle regional filter change for users
async function handleUserRegionalFilterChange(regionalId) {
    console.log('User regional filter changed to:', regionalId);
    
    // Ensure usersData exists
    if (!window.usersData) {
        window.usersData = usersData || {};
    }
    // Also ensure local usersData is synced
    if (usersData && usersData !== window.usersData) {
        usersData.selectedRegional = regionalId || '';
        usersData.selectedInstitution = '';
    }
    
    window.usersData.selectedRegional = regionalId || '';
    
    // Clear institution selection when regional changes
    window.usersData.selectedInstitution = '';
    
    console.log('Updated usersData.selectedRegional:', window.usersData.selectedRegional);
    
    // Reset institution dropdown
    const institutionSelect = document.getElementById('userInstitutionFilter');
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
    
    // Load institutions for the selected regional BEFORE reloading users
    if (regionalId) {
        console.log('Loading institutions for regional:', regionalId);
        // Wait a bit to ensure DOM is ready
        await new Promise(resolve => setTimeout(resolve, 100));
        await loadInstitutionsForUserFilter(regionalId);
        // Wait a bit more to ensure institutions are added
        await new Promise(resolve => setTimeout(resolve, 100));
    } else {
        // Clear institutions if no regional selected
        const institutionSelect = document.getElementById('userInstitutionFilter');
        if (institutionSelect) {
            institutionSelect.disabled = true;
            while (institutionSelect.options.length > 1) {
                institutionSelect.remove(1);
            }
            institutionSelect.value = '';
        }
    }
    
    // Trigger filter - filterUsers will handle loading and filtering
    window.usersData.currentPage = 1;
    console.log('Applying regional filter:', regionalId);
    if (typeof filterUsers === 'function') {
        await filterUsers();
    } else {
        // Fallback: reload users
        await loadUsers(0);
        // Update UI but preserve filters
        if (typeof updateUserStats === 'function') {
            updateUserStats();
        }
        if (typeof updateViewModeButtons === 'function') {
            updateViewModeButtons();
        }
        const viewMode = window.usersData?.viewMode || "table";
        if (viewMode === "table") {
            if (typeof updateUsersTable === 'function') {
                updateUsersTable();
            }
        } else {
            if (typeof updateUsersCards === 'function') {
                updateUsersCards();
            }
        }
        if (typeof updatePagination === 'function') {
            updatePagination();
        }
    }
}

// Handle institution filter change for users
async function handleUserInstitutionFilterChange(institutionId) {
    console.log('User institution filter changed to:', institutionId);
    
    // Ensure usersData exists
    if (!window.usersData) {
        window.usersData = usersData || {};
    }
    // Also ensure local usersData is synced
    if (usersData && usersData !== window.usersData) {
        usersData.selectedInstitution = institutionId || '';
    }
    
    window.usersData.selectedInstitution = institutionId || '';
    
    console.log('Updated usersData.selectedInstitution:', window.usersData.selectedInstitution);
    
    // Trigger filter - filterUsers will handle loading and filtering
    window.usersData.currentPage = 1;
    console.log('Applying institution filter:', institutionId);
    if (typeof filterUsers === 'function') {
        await filterUsers();
    } else {
        // Fallback: reload users
        await loadUsers(0);
        // Update UI but preserve filters
        if (typeof updateUserStats === 'function') {
            updateUserStats();
        }
        if (typeof updateViewModeButtons === 'function') {
            updateViewModeButtons();
        }
        const viewMode = window.usersData?.viewMode || "table";
        if (viewMode === "table") {
            if (typeof updateUsersTable === 'function') {
                updateUsersTable();
            }
        } else {
            if (typeof updateUsersCards === 'function') {
                updateUsersCards();
            }
        }
        if (typeof updatePagination === 'function') {
            updatePagination();
        }
    }
}

// Export functions
window.loadRegionalsForUserFilter = loadRegionalsForUserFilter;
window.loadInstitutionsForUserFilter = loadInstitutionsForUserFilter;
window.handleUserRegionalFilterChange = handleUserRegionalFilterChange;
window.handleUserInstitutionFilterChange = handleUserInstitutionFilterChange;

// Function to load user statistics (only for SUPERADMIN)
async function loadUserStatistics() {
    try {
        const token = localStorage.getItem('jwt');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        // Check if current user is SUPERADMIN
        // Safely get usersData - check if we're in items page context
        const usersDataRef = window.usersData || (typeof usersData !== 'undefined' ? usersData : {});
        const currentRole = usersDataRef.currentLoggedInUserRole || '';
        if (currentRole !== 'SUPERADMIN') {
            // For non-SUPERADMIN users, return null to use local calculation
            return null;
        }

        const response = await fetch('/api/v1/users/statistics', {
            method: 'GET',
            headers: headers
        });

        if (response.ok) {
            const statistics = await response.json();
            // Store statistics in usersData
            if (window.usersData) {
                window.usersData.statistics = statistics;
            }
            return statistics;
        } else {
            console.warn('Failed to load user statistics, falling back to local calculation');
            return null;
        }
    } catch (error) {
        console.error('Error loading user statistics:', error);
        return null;
    }
}

window.loadUserStatistics = loadUserStatistics;
window.loadUsersData = loadUsersData;
window.loadUsers = loadUsers;
window.loadCurrentUserInfo = loadCurrentUserInfo;