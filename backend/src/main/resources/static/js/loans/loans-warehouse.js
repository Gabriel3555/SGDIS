// Warehouse-specific loan functions

// Update search label based on selected type
document.addEventListener('DOMContentLoaded', function() {
    const searchTypeRadios = document.querySelectorAll('input[name="searchType"]');
    const itemSearchLabel = document.getElementById('itemSearchLabel');
    const itemSearchInput = document.getElementById('itemSearchInput');
    
    if (searchTypeRadios.length > 0 && itemSearchLabel && itemSearchInput) {
        searchTypeRadios.forEach(radio => {
            radio.addEventListener('change', function() {
                if (this.value === 'plate') {
                    itemSearchLabel.textContent = 'Número de Placa *';
                    itemSearchInput.placeholder = 'Ingrese el número de placa';
                } else {
                    itemSearchLabel.textContent = 'Número de Serie *';
                    itemSearchInput.placeholder = 'Ingrese el número de serie';
                }
                // Clear previous search results
                document.getElementById('itemSearchResult').innerHTML = '';
                document.getElementById('selectedItemId').value = '';
            });
        });
    }
});

// Search item by plate or serial
async function searchItemForLoan() {
    const searchInput = document.getElementById('itemSearchInput');
    const searchType = document.querySelector('input[name="searchType"]:checked')?.value || 'plate';
    const resultDiv = document.getElementById('itemSearchResult');
    const itemIdInput = document.getElementById('selectedItemId');
    
    if (!searchInput || !resultDiv || !itemIdInput) return;
    
    const searchValue = searchInput.value.trim();
    if (!searchValue) {
        resultDiv.innerHTML = `
            <div class="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p class="text-sm text-yellow-800">Por favor ingrese un ${searchType === 'plate' ? 'número de placa' : 'número de serie'}</p>
            </div>
        `;
        return;
    }
    
    // Show loading
    resultDiv.innerHTML = `
        <div class="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p class="text-sm text-blue-800">
                <i class="fas fa-spinner fa-spin mr-2"></i>Buscando item...
            </p>
        </div>
    `;
    
    try {
        const token = localStorage.getItem('jwt');
        if (!token) {
            throw new Error('No authentication token found');
        }
        
        const endpoint = searchType === 'plate' 
            ? `/api/v1/items/licence-plate/${encodeURIComponent(searchValue)}`
            : `/api/v1/items/serial/${encodeURIComponent(searchValue)}`;
        
        const response = await fetch(endpoint, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const item = await response.json();
            const itemId = item.itemId || item.id;
            
            if (!itemId) {
                throw new Error('Item sin ID válido');
            }
            
            // For ADMIN_INSTITUTION, validate that the item belongs to their institution
            const path = window.location.pathname || '';
            const isAdminInstitutionPage = path.includes('/admin_institution/loans');
            
            if (isAdminInstitutionPage) {
                try {
                    // Get current user info
                    const userResponse = await fetch('/api/v1/users/me', {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });
                    
                    if (userResponse.ok) {
                        const userData = await userResponse.json();
                        const userInstitutionId = userData.institution?.id || userData.institutionId;
                        
                        if (userInstitutionId) {
                            // Get inventory to check institution
                            const inventoryId = item.inventoryId || item.inventory?.id;
                            if (inventoryId) {
                                const inventoryResponse = await fetch(`/api/v1/inventory/${inventoryId}`, {
                                    headers: {
                                        'Authorization': `Bearer ${token}`,
                                        'Content-Type': 'application/json'
                                    }
                                });
                                
                                if (inventoryResponse.ok) {
                                    const inventory = await inventoryResponse.json();
                                    const itemInstitutionId = inventory.institutionId || inventory.institution?.id;
                                    
                                    if (itemInstitutionId && userInstitutionId.toString() !== itemInstitutionId.toString()) {
                                        const institutionName = inventory.institutionName || inventory.institution?.name || 'otra institución';
                                        resultDiv.innerHTML = `
                                            <div class="p-3 bg-red-50 border border-red-200 rounded-lg">
                                                <p class="text-sm text-red-800 font-medium mb-1">
                                                    <i class="fas fa-exclamation-circle mr-2"></i>Item no pertenece a tu institución
                                                </p>
                                                <p class="text-xs text-red-700">Este item pertenece a ${institutionName}. Solo puedes prestar items de tu institución.</p>
                                            </div>
                                        `;
                                        itemIdInput.value = '';
                                        return;
                                    }
                                }
                            }
                        }
                    }
                } catch (validationError) {
                    console.error('Error validating item institution:', validationError);
                    // Continue with loan check even if validation fails (backend will also validate)
                }
            }
            
            // Check if item has an active loan
            const loanResponse = await fetch(`/api/v1/loan/item/${itemId}/last`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            let isAvailable = true;
            if (loanResponse.ok) {
                const lastLoan = await loanResponse.json();
                if (lastLoan && lastLoan.returned === false) {
                    isAvailable = false;
                }
            }
            
            if (!isAvailable) {
                resultDiv.innerHTML = `
                    <div class="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p class="text-sm text-red-800 font-medium mb-1">
                            <i class="fas fa-exclamation-circle mr-2"></i>Item no disponible
                        </p>
                        <p class="text-xs text-red-700">Este item tiene un préstamo activo y debe ser devuelto primero.</p>
                    </div>
                `;
                itemIdInput.value = '';
                return;
            }
            
            // Item found and available
            itemIdInput.value = itemId;
            resultDiv.innerHTML = `
                <div class="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p class="text-sm text-green-800 font-medium mb-1">
                        <i class="fas fa-check-circle mr-2"></i>Item encontrado
                    </p>
                    <p class="text-xs text-green-700">
                        <strong>Nombre:</strong> ${item.productName || 'Sin nombre'}<br>
                        <strong>Placa:</strong> ${item.licencePlateNumber || 'N/A'}<br>
                        <strong>Serie:</strong> ${item.serial || 'N/A'}
                    </p>
                </div>
            `;
        } else if (response.status === 404) {
            resultDiv.innerHTML = `
                <div class="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p class="text-sm text-red-800">
                        <i class="fas fa-times-circle mr-2"></i>No se encontró un item con ${searchType === 'plate' ? 'ese número de placa' : 'ese número de serie'}
                    </p>
                </div>
            `;
            itemIdInput.value = '';
        } else {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Error al buscar el item');
        }
    } catch (error) {
        console.error('Error searching item:', error);
        resultDiv.innerHTML = `
            <div class="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p class="text-sm text-red-800">
                    <i class="fas fa-exclamation-circle mr-2"></i>${error.message || 'Error al buscar el item'}
                </p>
            </div>
        `;
        itemIdInput.value = '';
    }
}

// Load users for responsible selection (using CustomSelect)
async function loadUsersForLoan() {
    const responsibleSelectContainer = document.getElementById('newLoanResponsibleSelect');
    const usersLoading = document.getElementById('usersLoading');

    if (!responsibleSelectContainer) return;

    // Show loading
    if (usersLoading) usersLoading.style.display = 'block';
    
    // Get CustomSelect class (from users-modals.js)
    const CustomSelectClass = window.CustomSelect || (typeof CustomSelect !== 'undefined' ? CustomSelect : null);
    
    if (!CustomSelectClass) {
        console.error('CustomSelect class not found');
        if (usersLoading) usersLoading.style.display = 'none';
        return;
    }

    try {
        const token = localStorage.getItem('jwt');
        if (!token) {
            throw new Error('No authentication token found');
        }

        // Get current user to exclude from list
        let currentUserId = null;
        try {
            const currentUserResponse = await fetch('/api/v1/users/me', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            if (currentUserResponse.ok) {
                const currentUser = await currentUserResponse.json();
                currentUserId = currentUser.id;
            }
        } catch (userError) {
            console.warn('Could not get current user info:', userError);
        }

        // Fetch all users from institution endpoint - load all pages
        let allUsers = [];
        let page = 0;
        let hasMore = true;
        const pageSize = 1000;

        while (hasMore) {
            const response = await fetch(`/api/v1/users/institution?page=${page}&size=${pageSize}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                let errorMessage = 'Error al cargar los usuarios';
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorData.detail || errorData.error || errorMessage;
                    
                    if (response.status === 404) {
                        errorMessage = 'No tienes una institución asignada. Contacta a un administrador.';
                    }
                } catch (parseError) {
                    const errorText = await response.text();
                    if (errorText) {
                        errorMessage = errorText;
                    }
                }
                throw new Error(errorMessage);
            }

            const data = await response.json();
            const users = data.users || (Array.isArray(data) ? data : []);
            
            if (users.length > 0) {
                allUsers = allUsers.concat(users);
                hasMore = !data.last && users.length === pageSize;
                page++;
            } else {
                hasMore = false;
            }
        }

        // Filter out current user
        if (currentUserId) {
            allUsers = allUsers.filter(user => user.id !== currentUserId);
        }

        // Sort users by full name
        allUsers.sort((a, b) => {
            const nameA = (a.fullName || `${a.name || ''} ${a.lastName || ''}`.trim() || a.email || '').toLowerCase();
            const nameB = (b.fullName || `${b.name || ''} ${b.lastName || ''}`.trim() || b.email || '').toLowerCase();
            return nameA.localeCompare(nameB);
        });

        // Prepare options for CustomSelect
        const userOptions = allUsers.map(user => ({
            value: user.id.toString(),
            label: user.fullName || `${user.name || ''} ${user.lastName || ''}`.trim() || user.email || `Usuario #${user.id}`
        }));

        // Initialize or update CustomSelect
        // Wait a bit to ensure modal is visible and DOM is ready
        await new Promise(resolve => setTimeout(resolve, 200));
        
        const selectContainer = document.getElementById('newLoanResponsibleSelect');
        if (!selectContainer) {
            console.error('Select container not found');
            if (usersLoading) usersLoading.style.display = 'none';
            return;
        }
        
        // Verify all required elements exist
        const trigger = selectContainer.querySelector('.custom-select-trigger');
        const dropdown = selectContainer.querySelector('.custom-select-dropdown');
        const searchInput = selectContainer.querySelector('.custom-select-search');
        const optionsContainer = selectContainer.querySelector('.custom-select-options');
        const textElement = selectContainer.querySelector('.custom-select-text');
        
        if (!trigger || !dropdown || !searchInput || !optionsContainer || !textElement) {
            console.error('Required CustomSelect elements not found:', {
                trigger: !!trigger,
                dropdown: !!dropdown,
                searchInput: !!searchInput,
                optionsContainer: !!optionsContainer,
                textElement: !!textElement
            });
            console.error('Container HTML:', selectContainer.outerHTML.substring(0, 500));
            if (usersLoading) usersLoading.style.display = 'none';
            return;
        }
        
        // Destroy existing instance if it exists but is broken
        if (window.newLoanResponsibleSelect) {
            try {
                // Check if it's still valid
                if (!window.newLoanResponsibleSelect.container || 
                    typeof window.newLoanResponsibleSelect.setOptions !== 'function') {
                    window.newLoanResponsibleSelect = null;
                }
            } catch (e) {
                window.newLoanResponsibleSelect = null;
            }
        }
        
        if (!window.newLoanResponsibleSelect) {
            try {
                window.newLoanResponsibleSelect = new CustomSelectClass('newLoanResponsibleSelect', {
                    placeholder: allUsers.length === 0 ? 'No hay usuarios disponibles' : 'Seleccionar responsable...',
                    onChange: (option) => {
                        const hiddenInput = document.getElementById('newLoanResponsibleId');
                        if (hiddenInput) {
                            hiddenInput.value = option.value;
                        }
                    }
                });
                
                // Verify initialization
                if (!window.newLoanResponsibleSelect) {
                    throw new Error('CustomSelect instance is null after initialization');
                }
                
                // Wait a bit for init to complete
                await new Promise(resolve => setTimeout(resolve, 50));
                
                // Verify setOptions exists
                if (typeof window.newLoanResponsibleSelect.setOptions !== 'function') {
                    console.error('setOptions not found. Instance:', window.newLoanResponsibleSelect);
                    console.error('Prototype methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(window.newLoanResponsibleSelect)));
                    throw new Error('setOptions method not available on CustomSelect instance');
                }
            } catch (error) {
                console.error('Error initializing CustomSelect:', error);
                console.error('Error stack:', error.stack);
                console.error('Container element:', selectContainer);
                console.error('CustomSelectClass:', CustomSelectClass);
                if (usersLoading) usersLoading.style.display = 'none';
                if (window.showErrorToast) {
                    window.showErrorToast('Error', 'No se pudo inicializar el selector de usuarios: ' + error.message);
                }
                return;
            }
        }

        // Set options - verify instance exists and has setOptions method
        if (window.newLoanResponsibleSelect) {
            if (typeof window.newLoanResponsibleSelect.setOptions === 'function') {
                try {
                    if (userOptions.length === 0) {
                        window.newLoanResponsibleSelect.setOptions([
                            { value: '', label: 'No hay usuarios disponibles en tu institución', disabled: true }
                        ]);
                    } else {
                        window.newLoanResponsibleSelect.setOptions(userOptions);
                    }
                } catch (error) {
                    console.error('Error setting options:', error);
                    console.error('Error stack:', error.stack);
                }
            } else {
                console.error('setOptions is not a function');
                console.error('Instance:', window.newLoanResponsibleSelect);
                console.error('Available methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(window.newLoanResponsibleSelect)));
            }
        } else {
            console.error('CustomSelect instance is null');
        }
    } catch (error) {
        console.error('Error loading users:', error);
        if (window.newLoanResponsibleSelect && typeof window.newLoanResponsibleSelect.setOptions === 'function') {
            window.newLoanResponsibleSelect.setOptions([
                { value: '', label: error.message || 'Error al cargar usuarios', disabled: true }
            ]);
        }
        if (window.showErrorToast) {
            window.showErrorToast('Error', error.message || 'No se pudieron cargar los usuarios de tu institución');
        }
    } finally {
        if (usersLoading) usersLoading.style.display = 'none';
    }
}

// Show new loan modal
async function showNewLoanModal() {
    const modal = document.getElementById('newLoanModal');
    if (!modal) {
        if (window.showErrorToast) {
            window.showErrorToast(
                'Error', 
                'El modal de préstamo no está disponible. Por favor, recarga la página.',
                true,
                4000
            );
        }
        return;
    }
    
    // Show modal first
    modal.classList.remove('hidden');
    
    // Show info notification
    if (window.showInfoToast) {
        window.showInfoToast(
            'Realizar Préstamo', 
            'Busca un item por placa o serie y selecciona un responsable para crear el préstamo.',
            true,
            3000
        );
    }
    
    // Wait a bit for modal to be visible
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Load users for responsible selection (this will initialize CustomSelect)
    await loadUsersForLoan();
    
    // Reset form
    const form = document.getElementById('newLoanForm');
    if (form) {
        form.reset();
        // Reset to plate search by default
        const plateRadio = document.querySelector('input[name="searchType"][value="plate"]');
        if (plateRadio) plateRadio.checked = true;
        const itemSearchLabel = document.getElementById('itemSearchLabel');
        const itemSearchInput = document.getElementById('itemSearchInput');
        if (itemSearchLabel) itemSearchLabel.textContent = 'Número de Placa *';
        if (itemSearchInput) itemSearchInput.placeholder = 'Ingrese el número de placa';
    }
    
    // Clear search results
    const resultDiv = document.getElementById('itemSearchResult');
    if (resultDiv) resultDiv.innerHTML = '';
    const itemIdInput = document.getElementById('selectedItemId');
    if (itemIdInput) itemIdInput.value = '';
    
    // Reset CustomSelect if it exists
    if (window.newLoanResponsibleSelect) {
        const hiddenInput = document.getElementById('newLoanResponsibleId');
        if (hiddenInput) hiddenInput.value = '';
        const textElement = document.querySelector('#newLoanResponsibleSelect .custom-select-text');
        if (textElement) {
            textElement.textContent = 'Seleccionar responsable...';
            textElement.classList.add('custom-select-placeholder');
        }
    }
    
    // Setup automatic search on input (with debounce)
    const itemSearchInput = document.getElementById('itemSearchInput');
    if (itemSearchInput) {
        let searchTimeout;
        
        // Remove existing event listeners by cloning the element
        const newInput = itemSearchInput.cloneNode(true);
        itemSearchInput.parentNode.replaceChild(newInput, itemSearchInput);
        
        // Add event listener for automatic search on input
        newInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            const value = e.target.value.trim();
            
            if (value.length >= 3) { // Only search if at least 3 characters
                searchTimeout = setTimeout(() => {
                    searchItemForLoan();
                }, 500); // Debounce: wait 500ms after user stops typing
            } else if (value.length === 0) {
                // Clear results if input is empty
                const resultDiv = document.getElementById('itemSearchResult');
                const itemIdInput = document.getElementById('selectedItemId');
                if (resultDiv) resultDiv.innerHTML = '';
                if (itemIdInput) itemIdInput.value = '';
            }
        });
        
        // Also allow Enter key to search immediately
        newInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                clearTimeout(searchTimeout);
                searchItemForLoan();
            }
        });
    }
}

// Close new loan modal
function closeNewLoanModal() {
    const modal = document.getElementById('newLoanModal');
    if (modal) {
        modal.classList.add('hidden');
    }
    const form = document.getElementById('newLoanForm');
    if (form) {
        form.reset();
    }
    const resultDiv = document.getElementById('itemSearchResult');
    if (resultDiv) resultDiv.innerHTML = '';
    const itemIdInput = document.getElementById('selectedItemId');
    if (itemIdInput) itemIdInput.value = '';
    
    // Reset CustomSelect if it exists
    if (window.newLoanResponsibleSelect) {
        const hiddenInput = document.getElementById('newLoanResponsibleId');
        if (hiddenInput) hiddenInput.value = '';
        const textElement = document.querySelector('#newLoanResponsibleSelect .custom-select-text');
        if (textElement) {
            textElement.textContent = 'Seleccionar responsable...';
            textElement.classList.add('custom-select-placeholder');
        }
        // Close dropdown if open
        if (window.newLoanResponsibleSelect.close) {
            window.newLoanResponsibleSelect.close();
        }
    }
}

// Handle new loan form submission
async function handleNewLoanSubmit(e) {
    e.preventDefault();
    
    const itemId = document.getElementById('selectedItemId')?.value;
    const responsibleId = document.getElementById('newLoanResponsibleId')?.value;
    const details = document.getElementById('newLoanDetails')?.value?.trim();
    
    if (!itemId || !responsibleId) {
        if (window.showErrorToast) {
            window.showErrorToast(
                'Error de Validación', 
                'Por favor busque un item y seleccione un responsable antes de crear el préstamo.',
                true,
                4000
            );
        } else {
            alert('Por favor busque un item y seleccione un responsable');
        }
        return;
    }
    
    const submitButton = e.target.querySelector('button[type="submit"]');
    if (submitButton && submitButton.disabled) {
        return; // Already processing
    }
    
    // Disable submit button
    if (submitButton) {
        const originalText = submitButton.innerHTML;
        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Creando...';
    }
    
    try {
        // Show processing notification
        if (window.showInfoToast) {
            window.showInfoToast('Procesando', 'Creando el préstamo...', true, 2000);
        }
        
        const token = localStorage.getItem('jwt');
        if (!token) {
            throw new Error('No authentication token found');
        }
        
        const response = await fetch('/api/v1/loan/lend', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                itemId: parseInt(itemId, 10),
                responsibleId: parseInt(responsibleId, 10),
                details: details || ''
            })
        });
        
        if (!response.ok) {
            let errorMessage = 'Error al crear el préstamo';
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorData.detail || errorData.error || errorMessage;
                
                if (errorMessage.includes('cannot be lent') || errorMessage.includes('not been returned')) {
                    errorMessage = 'Este item no puede ser prestado porque tiene un préstamo activo. Debe ser devuelto primero.';
                }
            } catch (parseError) {
                const errorText = await response.text();
                if (errorText) {
                    errorMessage = errorText;
                }
            }
            throw new Error(errorMessage);
        }
        
        const result = await response.json();
        
        if (window.showSuccessToast) {
            window.showSuccessToast(
                'Préstamo Creado Exitosamente', 
                result.message || 'El préstamo se ha creado exitosamente. El item ha sido asignado al responsable.',
                true,
                5000
            );
        }
        
        closeNewLoanModal();
        
        // Reload loans
        const isWarehouse = window.location.pathname && window.location.pathname.includes('/warehouse/loans');
        if (isWarehouse) {
            await loadAllLoansForWarehouse();
            updateLoansSearchAndFiltersForWarehouse();
        } else if (typeof loadLoans === 'function') {
            await loadLoans();
        } else if (typeof window.loadLoans === 'function') {
            await window.loadLoans();
        }
    } catch (error) {
        console.error('Error creating loan:', error);
        if (window.showErrorToast) {
            window.showErrorToast(
                'Error al Crear Préstamo', 
                error.message || 'No se pudo crear el préstamo. Por favor, verifica los datos e intenta nuevamente.',
                true,
                5000
            );
        } else {
            alert(error.message || 'No se pudo crear el préstamo');
        }
    } finally {
        // Re-enable submit button
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.innerHTML = '<i class="fas fa-hand-holding mr-2"></i>Crear Préstamo';
        }
    }
}

// Setup form handler
document.addEventListener('DOMContentLoaded', function() {
    const newLoanForm = document.getElementById('newLoanForm');
    if (newLoanForm) {
        newLoanForm.addEventListener('submit', handleNewLoanSubmit);
    }
    
    // Allow Enter key to search item
    const itemSearchInput = document.getElementById('itemSearchInput');
    if (itemSearchInput) {
        itemSearchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                searchItemForLoan();
            }
        });
    }
});

// Warehouse loans filters data
let loansWarehouseFilters = {
    searchTerm: '',
    status: 'all',
    responsibleId: 'all',
    inventoryId: 'all',
    allLoans: [],
    filteredLoans: [],
    inventories: [],
    users: []
};

// Load users from institution for filters
async function loadUsersForFilters() {
    try {
        const token = localStorage.getItem('jwt');
        if (!token) {
            throw new Error('No authentication token found');
        }

        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        // Fetch all users from institution endpoint - load all pages
        let allUsers = [];
        let page = 0;
        let hasMore = true;
        const pageSize = 1000;

        while (hasMore) {
            const response = await fetch(`/api/v1/users/institution?page=${page}&size=${pageSize}`, {
                headers: headers
            });

            if (!response.ok) {
                console.error('Error loading users for filters:', response.status);
                break;
            }

            const data = await response.json();
            const users = data.users || (Array.isArray(data) ? data : []);
            
            if (users.length > 0) {
                allUsers = allUsers.concat(users);
                hasMore = !data.last && users.length === pageSize;
                page++;
            } else {
                hasMore = false;
            }
        }

        // Sort users by full name
        allUsers.sort((a, b) => {
            const nameA = (a.fullName || `${a.name || ''} ${a.lastName || ''}`.trim() || a.email || '').toLowerCase();
            const nameB = (b.fullName || `${b.name || ''} ${b.lastName || ''}`.trim() || b.email || '').toLowerCase();
            return nameA.localeCompare(nameB);
        });

        loansWarehouseFilters.users = allUsers;
        console.log('Users loaded for filters:', allUsers.length);
    } catch (error) {
        console.error('Error loading users for filters:', error);
        loansWarehouseFilters.users = [];
    }
}

// Load inventories from institution for filters
async function loadInventoriesForFilters() {
    try {
        // Use authenticatedFetch if available to handle token refresh automatically
        const fetchFunction = (typeof authenticatedFetch !== 'undefined' && typeof authenticatedFetch === 'function') 
            ? authenticatedFetch 
            : fetch;

        const token = localStorage.getItem('jwt');
        if (!token) {
            console.warn('No authentication token found for loading inventories');
            loansWarehouseFilters.inventories = [];
            return;
        }

        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        // Get current user info to get institution ID
        let userResponse;
        try {
            userResponse = await fetchFunction('/api/v1/users/me', {
                method: 'GET',
                headers: headers
            });
        } catch (userError) {
            console.error('Error fetching user info for inventories:', userError);
            loansWarehouseFilters.inventories = [];
            return;
        }
        
        let institutionId = null;
        if (userResponse && userResponse.ok) {
            try {
                const userData = await userResponse.json();
                institutionId = userData.institutionId || (userData.institution && userData.institution.id);
            } catch (parseError) {
                console.error('Error parsing user data for inventories:', parseError);
            }
        }

        // Load all inventories from institution
        // Use endpoint with institution ID if available, otherwise use endpoint without ID (backend will filter by user's institution)
        let allInventories = [];
        let page = 0;
        let hasMore = true;
        const pageSize = 1000;

        while (hasMore) {
            const endpoint = institutionId 
                ? `/api/v1/inventory/institutionAdminInventories/${institutionId}?page=${page}&size=${pageSize}`
                : `/api/v1/inventory/institutionAdminInventories?page=${page}&size=${pageSize}`;
            
            let response;
            try {
                response = await fetchFunction(endpoint, {
                    method: 'GET',
                    headers: headers
                });
            } catch (fetchError) {
                console.error('Network error loading inventories:', fetchError);
                // If it's a CORS error or network error, try without institution ID
                if (institutionId && (fetchError.message.includes('CORS') || fetchError.message.includes('Failed to fetch'))) {
                    console.log('Retrying without institution ID due to network error...');
                    const fallbackEndpoint = `/api/v1/inventory/institutionAdminInventories?page=${page}&size=${pageSize}`;
                    try {
                        response = await fetchFunction(fallbackEndpoint, {
                            method: 'GET',
                            headers: headers
                        });
                    } catch (e) {
                        console.error('Fallback endpoint also failed:', e);
                        break;
                    }
                } else {
                    break;
                }
            }

            if (!response.ok) {
                console.error('Error loading inventories for filters:', response.status, response.statusText);
                // If 404 or 403, try without institution ID
                if ((response.status === 404 || response.status === 403) && institutionId) {
                    console.log('Retrying without institution ID...');
                    const fallbackEndpoint = `/api/v1/inventory/institutionAdminInventories?page=${page}&size=${pageSize}`;
                    try {
                        response = await fetch(fallbackEndpoint, {
                            method: 'GET',
                            headers: headers
                        });
                        if (!response.ok) {
                            break;
                        }
                    } catch (e) {
                        break;
                    }
                } else {
                    break;
                }
            }

            let data;
            try {
                data = await response.json();
            } catch (parseError) {
                console.error('Error parsing inventories response:', parseError);
                break;
            }
            
            const inventories = data.content || (Array.isArray(data) ? data : []);
            
            if (inventories.length > 0) {
                allInventories = allInventories.concat(inventories);
                hasMore = !data.last && inventories.length === pageSize;
                page++;
            } else {
                hasMore = false;
            }
        }

        // Filter by institution ID to be sure
        if (institutionId) {
            allInventories = allInventories.filter(inv => {
                const invInstitutionId = inv.institutionId || (inv.institution && inv.institution.id);
                return invInstitutionId && invInstitutionId.toString() === institutionId.toString();
            });
        }

        // Sort inventories by name
        allInventories.sort((a, b) => {
            const nameA = (a.name || `Inventario ${a.id}`).toLowerCase();
            const nameB = (b.name || `Inventario ${b.id}`).toLowerCase();
            return nameA.localeCompare(nameB);
        });

        loansWarehouseFilters.inventories = allInventories;
        console.log('Inventories loaded for filters:', allInventories.length);
    } catch (error) {
        console.error('Error loading inventories for filters:', error);
        loansWarehouseFilters.inventories = [];
    }
}

// Load all loans for client-side filtering
async function loadAllLoansForWarehouse() {
    try {
        // Use authenticatedFetch if available to handle token refresh automatically
        const fetchFunction = (typeof authenticatedFetch !== 'undefined' && typeof authenticatedFetch === 'function') 
            ? authenticatedFetch 
            : fetch;

        const token = localStorage.getItem('jwt');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        // Get current user info to get institution ID
        let userResponse;
        try {
            userResponse = await fetchFunction('/api/v1/users/me', {
                method: 'GET',
                headers: headers
            });
        } catch (userError) {
            console.error('Error fetching user info:', userError);
            loansWarehouseFilters.allLoans = [];
            loansWarehouseFilters.filteredLoans = [];
            return;
        }
        
        let institutionId = null;
        if (userResponse && userResponse.ok) {
            try {
                const userData = await userResponse.json();
                institutionId = userData.institutionId || (userData.institution && userData.institution.id);
            } catch (parseError) {
                console.error('Error parsing user data:', parseError);
            }
        }

        // Load users and inventories in parallel (with error handling)
        try {
            await Promise.all([
                loadUsersForFilters().catch(err => {
                    console.error('Error loading users for filters:', err);
                    loansWarehouseFilters.users = [];
                }),
                loadInventoriesForFilters().catch(err => {
                    console.error('Error loading inventories for filters:', err);
                    loansWarehouseFilters.inventories = [];
                })
            ]);
        } catch (parallelError) {
            console.error('Error loading filter data:', parallelError);
        }

        const params = new URLSearchParams();
        if (institutionId) {
            params.append('institutionId', institutionId.toString());
        }

        let endpoint = '/api/v1/loan/filter';
        const paramsString = params.toString();
        if (paramsString) {
            endpoint += `?${paramsString}`;
        }

        let response;
        try {
            response = await fetchFunction(endpoint, {
                method: 'GET',
                headers: headers
            });
        } catch (fetchError) {
            console.error('Network error loading loans:', fetchError);
            // Try alternative endpoint without filter
            console.log('Trying alternative endpoint...');
            try {
                const altEndpoint = institutionId 
                    ? `/api/v1/loan?institutionId=${institutionId}`
                    : '/api/v1/loan';
                response = await fetchFunction(altEndpoint, {
                    method: 'GET',
                    headers: headers
                });
            } catch (altError) {
                console.error('Alternative endpoint also failed:', altError);
                loansWarehouseFilters.allLoans = [];
                loansWarehouseFilters.filteredLoans = [];
                // Still update UI with empty data
                filterLoansForWarehouse();
                updateLoansSearchAndFiltersForWarehouse();
                return;
            }
        }

        if (response && response.ok) {
            let loans;
            try {
                const data = await response.json();
                // Handle both array and paginated response
                loans = Array.isArray(data) ? data : (data.content || data.loans || []);
            } catch (parseError) {
                console.error('Error parsing loans response:', parseError);
                loans = [];
            }
            
            loansWarehouseFilters.allLoans = Array.isArray(loans) ? loans : [];
            
            // Update window.loansData for compatibility
            if (window.loansData) {
                window.loansData.loans = loansWarehouseFilters.allLoans;
                window.loansData.filteredLoans = loansWarehouseFilters.allLoans;
            }
            
            filterLoansForWarehouse();
            
            // Update filters UI after data is loaded
            updateLoansSearchAndFiltersForWarehouse();
        } else {
            const status = response ? response.status : 'unknown';
            const statusText = response ? response.statusText : 'Network error';
            console.error('Error loading loans:', status, statusText);
            loansWarehouseFilters.allLoans = [];
            loansWarehouseFilters.filteredLoans = [];
            // Still update UI with empty data
            filterLoansForWarehouse();
            updateLoansSearchAndFiltersForWarehouse();
        }
    } catch (error) {
        console.error('Error loading loans:', error);
        loansWarehouseFilters.allLoans = [];
        loansWarehouseFilters.filteredLoans = [];
        // Still update UI with empty data
        filterLoansForWarehouse();
        updateLoansSearchAndFiltersForWarehouse();
    }
}

// Filter loans for warehouse
function filterLoansForWarehouse() {
    let filtered = [...loansWarehouseFilters.allLoans];

    // Filter by search term
    if (loansWarehouseFilters.searchTerm && loansWarehouseFilters.searchTerm.trim() !== '') {
        const searchLower = loansWarehouseFilters.searchTerm.toLowerCase().trim();
        filtered = filtered.filter(loan => {
            const plateNumber = (loan.item?.licencePlateNumber || '').toLowerCase();
            const serialNumber = (loan.item?.serialNumber || '').toLowerCase();
            const responsibleName = (loan.responsible?.fullName || loan.responsibleName || '').toLowerCase();
            const lenderName = (loan.lender?.fullName || loan.lenderName || '').toLowerCase();
            const inventoryName = (loan.item?.inventory?.name || '').toLowerCase();
            
            return plateNumber.includes(searchLower) ||
                   serialNumber.includes(searchLower) ||
                   responsibleName.includes(searchLower) ||
                   lenderName.includes(searchLower) ||
                   inventoryName.includes(searchLower);
        });
    }

    // Filter by status
    if (loansWarehouseFilters.status && loansWarehouseFilters.status !== 'all') {
        if (loansWarehouseFilters.status === 'active') {
            filtered = filtered.filter(loan => !loan.returned);
        } else if (loansWarehouseFilters.status === 'returned') {
            filtered = filtered.filter(loan => loan.returned === true);
        }
    }

    // Filter by responsible
    if (loansWarehouseFilters.responsibleId && loansWarehouseFilters.responsibleId !== 'all') {
        filtered = filtered.filter(loan => {
            const responsibleId = loan.responsible?.id || loan.responsibleId;
            return responsibleId && responsibleId.toString() === loansWarehouseFilters.responsibleId.toString();
        });
    }

    // Filter by inventory
    if (loansWarehouseFilters.inventoryId && loansWarehouseFilters.inventoryId !== 'all') {
        filtered = filtered.filter(loan => {
            const inventoryId = loan.item?.inventory?.id || loan.item?.inventoryId;
            return inventoryId && inventoryId.toString() === loansWarehouseFilters.inventoryId.toString();
        });
    }

    loansWarehouseFilters.filteredLoans = filtered;
    
    // Update window.loansData for compatibility
    if (window.loansData) {
        window.loansData.filteredLoans = filtered;
        window.loansData.currentPage = 1;
    }
    
    // Update UI
    if (typeof updateLoansTable === 'function') {
        updateLoansTable();
    }
    if (typeof updatePagination === 'function') {
        updatePagination();
    }
    if (typeof updateLoansStats === 'function') {
        updateLoansStats();
    }
}

// Update search and filters HTML
function updateLoansSearchAndFiltersForWarehouse() {
    const container = document.getElementById('searchFilterContainer');
    if (!container) return;

    const currentSearchTerm = loansWarehouseFilters.searchTerm || '';
    const currentStatus = loansWarehouseFilters.status || 'all';
    const currentResponsibleId = loansWarehouseFilters.responsibleId || 'all';
    const currentInventoryId = loansWarehouseFilters.inventoryId || 'all';

    // Check if selects are already initialized
    const existingStatusSelect = document.getElementById('loanStatusFilterWarehouse');
    const existingResponsibleSelect = document.getElementById('loanResponsibleFilterWarehouse');
    const existingInventorySelect = document.getElementById('loanInventoryFilterWarehouse');

    if (existingStatusSelect && existingResponsibleSelect && existingInventorySelect) {
        // Just update the search input value
        const searchInput = document.getElementById('loanSearchInputWarehouse');
        if (searchInput) searchInput.value = currentSearchTerm;
        // Update select values
        if (existingStatusSelect) existingStatusSelect.value = currentStatus;
        if (existingResponsibleSelect) existingResponsibleSelect.value = currentResponsibleId;
        if (existingInventorySelect) existingInventorySelect.value = currentInventoryId;
        return; // Don't regenerate HTML
    }

    // Build status options
    const statusOptions = `
        <option value="all">Todos los estados</option>
        <option value="active">Préstamos Activos</option>
        <option value="returned">Préstamos Devueltos</option>
    `;

    // Build responsible options
    const responsibleOptions = `
        <option value="all">Todos los responsables</option>
        ${(loansWarehouseFilters.users || []).map(user => 
            `<option value="${user.id}">${user.fullName || `${user.name || ''} ${user.lastName || ''}`.trim() || `Usuario #${user.id}`}</option>`
        ).join('')}
    `;

    // Build inventory options
    const inventoryOptions = `
        <option value="all">Todos los inventarios</option>
        ${(loansWarehouseFilters.inventories || []).map(inv => 
            `<option value="${inv.id}">${inv.name || `Inventario ${inv.id}`}</option>`
        ).join('')}
    `;

    container.innerHTML = `
        <div class="relative flex-1" style="min-width: 200px;">
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Buscar</label>
            <div class="relative">
                <i class="fas fa-search absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                <input type="text" 
                    id="loanSearchInputWarehouse"
                    placeholder="Buscar por placa, serie, responsable..." 
                    value="${currentSearchTerm}"
                    onkeyup="handleLoanSearchForWarehouse(event)"
                    class="w-full pl-11 pr-4 py-2 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00AF00] bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all"
                    style="height: 56px; font-size: 0.9375rem;">
            </div>
        </div>
        <div class="relative" style="min-width: 180px; flex-shrink: 0;">
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Estado</label>
            <select 
                id="loanStatusFilterWarehouse"
                onchange="handleLoanStatusFilterChange(event)"
                class="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00AF00] bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all"
                style="height: 56px; font-size: 0.9375rem;">
                ${statusOptions}
            </select>
        </div>
        <div class="relative" style="min-width: 180px; flex-shrink: 0;">
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Responsable</label>
            <select 
                id="loanResponsibleFilterWarehouse"
                onchange="handleLoanResponsibleFilterChange(event)"
                class="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00AF00] bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all"
                style="height: 56px; font-size: 0.9375rem;">
                ${responsibleOptions}
            </select>
        </div>
        <div class="relative" style="min-width: 180px; flex-shrink: 0;">
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Inventario</label>
            <select 
                id="loanInventoryFilterWarehouse"
                onchange="handleLoanInventoryFilterChange(event)"
                class="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00AF00] bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all"
                style="height: 56px; font-size: 0.9375rem;">
                ${inventoryOptions}
            </select>
        </div>
    `;

    // Set initial values
    const statusSelect = document.getElementById('loanStatusFilterWarehouse');
    const responsibleSelect = document.getElementById('loanResponsibleFilterWarehouse');
    const inventorySelect = document.getElementById('loanInventoryFilterWarehouse');
    
    if (statusSelect) statusSelect.value = currentStatus;
    if (responsibleSelect) responsibleSelect.value = currentResponsibleId;
    if (inventorySelect) inventorySelect.value = currentInventoryId;
}

// Handle filter changes
function handleLoanStatusFilterChange(event) {
    const value = event.target.value || 'all';
    loansWarehouseFilters.status = value;
    filterLoansForWarehouse();
}

function handleLoanResponsibleFilterChange(event) {
    const value = event.target.value || 'all';
    loansWarehouseFilters.responsibleId = value;
    filterLoansForWarehouse();
}

function handleLoanInventoryFilterChange(event) {
    const value = event.target.value || 'all';
    loansWarehouseFilters.inventoryId = value;
    filterLoansForWarehouse();
}

// Handle search input
function handleLoanSearchForWarehouse(event) {
    if (event.key === 'Enter' || event.type === 'input') {
        const searchInput = document.getElementById('loanSearchInputWarehouse');
        if (searchInput) {
            loansWarehouseFilters.searchTerm = searchInput.value.trim();
            filterLoansForWarehouse();
        }
    }
}

// Override loadLoans to use client-side filtering for warehouse
const originalLoadLoans = window.loadLoans;
window.loadLoans = async function() {
    const isWarehouse = (window.location.pathname && window.location.pathname.includes('/warehouse/loans')) ||
                        (window.currentUserRole && window.currentUserRole.toUpperCase() === 'WAREHOUSE' && 
                         window.location.pathname && window.location.pathname.includes('/loans'));
    if (isWarehouse) {
        await loadAllLoansForWarehouse();
        // updateLoansSearchAndFiltersForWarehouse is called inside loadAllLoansForWarehouse after data is loaded
    } else if (originalLoadLoans) {
        return originalLoadLoans();
    }
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    const isWarehouse = (window.location.pathname && window.location.pathname.includes('/warehouse/loans')) ||
                        (window.currentUserRole && window.currentUserRole.toUpperCase() === 'WAREHOUSE' && 
                         window.location.pathname && window.location.pathname.includes('/loans'));
    if (isWarehouse) {
        // Set itemsPerPage to 6 for warehouse
        if (window.loansData) {
            window.loansData.itemsPerPage = 6;
        }
        
        // Load loans and initialize filters
        // updateLoansSearchAndFiltersForWarehouse is called inside loadAllLoansForWarehouse after data is loaded
        setTimeout(() => {
            loadAllLoansForWarehouse();
        }, 200);
    }
});

// Expose functions globally
window.showNewLoanModal = showNewLoanModal;
window.closeNewLoanModal = closeNewLoanModal;
window.searchItemForLoan = searchItemForLoan;
window.loadUsersForLoan = loadUsersForLoan;
window.handleLoanSearchForWarehouse = handleLoanSearchForWarehouse;
window.filterLoansForWarehouse = filterLoansForWarehouse;
window.updateLoansSearchAndFiltersForWarehouse = updateLoansSearchAndFiltersForWarehouse;
window.handleLoanStatusFilterChange = handleLoanStatusFilterChange;
window.handleLoanResponsibleFilterChange = handleLoanResponsibleFilterChange;
window.handleLoanInventoryFilterChange = handleLoanInventoryFilterChange;

