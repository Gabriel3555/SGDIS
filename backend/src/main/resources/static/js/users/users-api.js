async function loadUsersData() {
    if (usersData.isLoading) return;

    usersData.isLoading = true;
    showLoadingState();

    try {
        await loadCurrentUserInfo();
        // Load statistics for SUPERADMIN
        await loadUserStatistics();
        // Update welcome message based on role
        updateUsersWelcomeMessage();
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

function updateUsersWelcomeMessage() {
    const welcomeMessage = document.getElementById('usersWelcomeMessage');
    if (!welcomeMessage) return;
    
    const currentRole = window.currentUserRole || usersData.currentLoggedInUserRole || '';
    const isAdminRegional = currentRole === 'ADMIN_REGIONAL' || 
                           (window.location.pathname && window.location.pathname.includes('/admin_regional'));
    const isAdminInstitution = currentRole === 'ADMIN_INSTITUTION';
    
    if (isAdminRegional) {
        welcomeMessage.textContent = 'Administración de usuarios de la regional';
    } else if (isAdminInstitution) {
        welcomeMessage.textContent = 'Administración de usuarios de la institución';
    } else {
        welcomeMessage.textContent = 'Administración de usuarios del sistema';
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

        // Check if current user is ADMIN_INSTITUTION or ADMIN_REGIONAL
        const currentRole = usersData.currentLoggedInUserRole || '';
        const isAdminInstitution = currentRole === 'ADMIN_INSTITUTION';
        const isAdminRegional = currentRole === 'ADMIN_REGIONAL' || 
                                (window.location.pathname && window.location.pathname.includes('/admin_regional'));
        
        // Check if filters are active (including regional and institution for super admin)
        const isSuperAdmin = (usersData.currentLoggedInUserRole && usersData.currentLoggedInUserRole.toUpperCase() === 'SUPERADMIN') ||
                             (window.location.pathname && window.location.pathname.includes('/superadmin'));
        const hasFilters = usersData.searchTerm || 
                          usersData.selectedRole !== 'all' || 
                          usersData.selectedStatus !== 'all' ||
                          (isSuperAdmin && (usersData.selectedRegional || usersData.selectedInstitution));
        
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
        } else if (isAdminRegional) {
            // Use regional endpoint for ADMIN_REGIONAL
            if (hasFilters) {
                // Load all users for filtering (set a large page size)
                url = `/api/v1/users/regional?page=0&size=1000`;
            } else {
                // Use pagination
                url = `/api/v1/users/regional?page=${page}&size=${usersData.itemsPerPage}`;
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
            
            // Validate regionals is an array
            if (!Array.isArray(regionals)) {
                console.error('Invalid regionals response:', regionals);
                return;
            }
            
            const currentRegional = (window.usersData || usersData)?.selectedRegional || '';
            
            // Use CustomSelect if available and ready
            if (window.filterRegionalSelect && typeof window.filterRegionalSelect.setOptions === 'function') {
                const options = [
                    { value: '', label: 'Todas las regionales' },
                    ...regionals.map(regional => ({
                        value: regional.id.toString(),
                        label: regional.name
                    }))
                ];
                window.filterRegionalSelect.setOptions(options);
                if (currentRegional) {
                    setTimeout(() => {
                        if (window.filterRegionalSelect && typeof window.filterRegionalSelect.setValue === 'function') {
                            window.filterRegionalSelect.setValue(currentRegional);
                        }
                    }, 50);
                }
            } else {
                // CustomSelect not ready yet, wait and retry
                const retryLoadRegionals = (retries = 0, maxRetries = 15) => {
                    if (window.filterRegionalSelect && typeof window.filterRegionalSelect.setOptions === 'function') {
                        const options = [
                            { value: '', label: 'Todas las regionales' },
                            ...regionals.map(regional => ({
                                value: regional.id.toString(),
                                label: regional.name
                            }))
                        ];
                        window.filterRegionalSelect.setOptions(options);
                        if (currentRegional) {
                            setTimeout(() => {
                                if (window.filterRegionalSelect && typeof window.filterRegionalSelect.setValue === 'function') {
                                    window.filterRegionalSelect.setValue(currentRegional);
                                }
                            }, 50);
                        }
                    } else if (retries < maxRetries) {
                        // Not ready yet, retry after a short delay
                        setTimeout(() => retryLoadRegionals(retries + 1, maxRetries), 100);
                    } else {
                        // Max retries reached - silently fail
                    }
                };
                
                retryLoadRegionals();
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

            // Validate institutions is an array
            if (!Array.isArray(institutions)) {
                console.error('Invalid institutions response:', institutions);
                if (window.filterInstitutionSelect && typeof window.filterInstitutionSelect.setOptions === 'function') {
                    window.filterInstitutionSelect.setOptions([
                        { value: '', label: 'Error al cargar instituciones', disabled: true }
                    ]);
                }
                return;
            }

            // Use CustomSelect if available and ready
            const currentInstitution = (window.usersData || usersData)?.selectedInstitution || '';
            const loadInstitutionsToCustomSelect = () => {
                if (window.filterInstitutionSelect && typeof window.filterInstitutionSelect.setOptions === 'function') {
                    if (institutions && institutions.length > 0) {
                        const options = [
                            { value: '', label: 'Todas las instituciones' },
                            ...institutions.map(institution => ({
                                value: institution.id.toString(),
                                label: institution.name || `Institución ${institution.id}`
                            }))
                        ];
                        window.filterInstitutionSelect.setOptions(options);
                        if (currentInstitution) {
                            setTimeout(() => {
                                if (window.filterInstitutionSelect && typeof window.filterInstitutionSelect.setValue === 'function') {
                                    window.filterInstitutionSelect.setValue(currentInstitution);
                                }
                            }, 50);
                        } else {
                            // Clear selection if no current institution
                            window.filterInstitutionSelect.clear();
                        }
                    } else {
                        window.filterInstitutionSelect.setOptions([
                            { value: '', label: 'No hay instituciones disponibles', disabled: true }
                        ]);
                        window.filterInstitutionSelect.clear();
                    }
                    return true;
                }
                return false;
            };

            // Try to load immediately
            if (!loadInstitutionsToCustomSelect()) {
                // Wait and retry if CustomSelect is not ready yet
                const retryLoadInstitutions = (retries = 0, maxRetries = 15) => {
                    if (loadInstitutionsToCustomSelect()) {
                        return; // Success
                    } else if (retries < maxRetries) {
                        setTimeout(() => retryLoadInstitutions(retries + 1, maxRetries), 100);
                    }
                };
                retryLoadInstitutions();
            }
        } else {
            const errorText = await response.text();
            console.error('Error loading institutions:', response.status, errorText);
            if (window.filterInstitutionSelect && typeof window.filterInstitutionSelect.setOptions === 'function') {
                window.filterInstitutionSelect.setOptions([
                    { value: '', label: 'Error al cargar instituciones', disabled: true }
                ]);
                window.filterInstitutionSelect.clear();
            }
        }
    } catch (error) {
        console.error('Error loading institutions:', error);
        if (window.filterInstitutionSelect && typeof window.filterInstitutionSelect.setOptions === 'function') {
            window.filterInstitutionSelect.setOptions([
                { value: '', label: 'Error al cargar instituciones', disabled: true }
            ]);
            window.filterInstitutionSelect.clear();
        }
    }
}

// Handle regional filter change for users
async function handleUserRegionalFilterChange(regionalId) {
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
    
    // Reset institution dropdown using CustomSelect
    if (window.filterInstitutionSelect && typeof window.filterInstitutionSelect.setOptions === 'function') {
        if (!regionalId) {
            // If no regional selected, disable and clear
            window.filterInstitutionSelect.setOptions([
                { value: '', label: 'Todas las instituciones', disabled: true }
            ]);
            if (typeof window.filterInstitutionSelect.clear === 'function') {
                window.filterInstitutionSelect.clear();
            }
        } else {
            // Clear current selection while loading new institutions
            if (typeof window.filterInstitutionSelect.clear === 'function') {
                window.filterInstitutionSelect.clear();
            }
        }
    }
    
    // Load institutions for the selected regional BEFORE reloading users
    if (regionalId) {
        // Wait a bit to ensure DOM is ready
        await new Promise(resolve => setTimeout(resolve, 100));
        await loadInstitutionsForUserFilter(regionalId);
        // Wait a bit more to ensure institutions are added
        await new Promise(resolve => setTimeout(resolve, 150));
    } else {
        // Clear institutions if no regional selected
        if (window.filterInstitutionSelect && typeof window.filterInstitutionSelect.setOptions === 'function') {
            window.filterInstitutionSelect.setOptions([
                { value: '', label: 'Todas las instituciones', disabled: true }
            ]);
            if (typeof window.filterInstitutionSelect.clear === 'function') {
                window.filterInstitutionSelect.clear();
            }
        }
    }
    
    // Trigger filter - filterUsers will handle loading and filtering
    window.usersData.currentPage = 0;
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
    // Ensure usersData exists
    if (!window.usersData) {
        window.usersData = usersData || {};
    }
    // Also ensure local usersData is synced
    if (usersData && usersData !== window.usersData) {
        usersData.selectedInstitution = institutionId || '';
    }
    
    window.usersData.selectedInstitution = institutionId || '';
    
    // Trigger filter - filterUsers will handle loading and filtering
    window.usersData.currentPage = 0;
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
window.updateUsersWelcomeMessage = updateUsersWelcomeMessage;