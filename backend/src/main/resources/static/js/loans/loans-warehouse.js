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
        
        console.log('Checking CustomSelect elements:', {
            trigger: !!trigger,
            dropdown: !!dropdown,
            searchInput: !!searchInput,
            optionsContainer: !!optionsContainer,
            textElement: !!textElement,
            container: !!selectContainer
        });
        
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
                    console.log('Existing CustomSelect instance is invalid, recreating...');
                    window.newLoanResponsibleSelect = null;
                }
            } catch (e) {
                console.log('Existing CustomSelect instance is broken, recreating...');
                window.newLoanResponsibleSelect = null;
            }
        }
        
        if (!window.newLoanResponsibleSelect) {
            try {
                console.log('Initializing CustomSelect with class:', CustomSelectClass);
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
                
                console.log('CustomSelect initialized successfully');
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
                    console.log('Options set successfully:', userOptions.length);
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
    if (!modal) return;
    
    // Show modal first
    modal.classList.remove('hidden');
    
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
            window.showErrorToast('Error', 'Por favor busque un item y seleccione un responsable');
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
            window.showSuccessToast('Préstamo creado', 'El préstamo se ha creado exitosamente');
        }
        
        closeNewLoanModal();
        
        // Reload loans
        if (typeof loadLoans === 'function') {
            await loadLoans();
        } else if (typeof window.loadLoans === 'function') {
            await window.loadLoans();
        }
    } catch (error) {
        console.error('Error creating loan:', error);
        if (window.showErrorToast) {
            window.showErrorToast('Error', error.message || 'No se pudo crear el préstamo');
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

// Expose functions globally
window.showNewLoanModal = showNewLoanModal;
window.closeNewLoanModal = closeNewLoanModal;
window.searchItemForLoan = searchItemForLoan;
window.loadUsersForLoan = loadUsersForLoan;

