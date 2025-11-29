// Cancellations Forms - Handle ask cancellation form

const askCancellationData = {
    selectedItems: [],
    regionals: [],
    institutions: [],
    inventories: [],
    items: []
};

/**
 * Open ask cancellation modal
 */
function openAskCancellationModal() {
    // Reset form
    askCancellationData.selectedItems = [];
    document.getElementById('askCancellationSelectedRegionalId').value = '';
    document.getElementById('askCancellationSelectedInstitutionId').value = '';
    document.getElementById('askCancellationSelectedInventoryId').value = '';
    document.getElementById('askCancellationReason').value = '';
    
    // Reset selects
    updateSelectText('askCancellationRegionalSelect', 'Seleccione una regional');
    updateSelectText('askCancellationInstitutionSelect', 'Seleccione una institución');
    updateSelectText('askCancellationInventorySelect', 'Seleccione un inventario');
    
    // Clear items container
    const itemsContainer = document.getElementById('askCancellationItemsContainer');
    if (itemsContainer) {
        itemsContainer.innerHTML = '<p class="text-gray-500 dark:text-gray-400 text-sm">Seleccione un inventario primero para ver los items disponibles</p>';
    }
    
    // Show modal
    document.getElementById('askCancellationModal').classList.remove('hidden');
    
    // Load regionals
    loadRegionalsForCancellation();
}

/**
 * Close ask cancellation modal
 */
function closeAskCancellationModal() {
    document.getElementById('askCancellationModal').classList.add('hidden');
}

/**
 * Update select text
 */
function updateSelectText(selectId, text) {
    const select = document.getElementById(selectId);
    if (select) {
        const textElement = select.querySelector('.custom-select-text');
        if (textElement) {
            textElement.textContent = text;
        }
    }
}

/**
 * Load regionals for cancellation form
 */
async function loadRegionalsForCancellation() {
    try {
        const token = localStorage.getItem('jwt');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch('/api/v1/regional', {
            method: 'GET',
            headers: headers
        });

        if (response.ok) {
            const data = await response.json();
            askCancellationData.regionals = Array.isArray(data) ? data : [];
            populateRegionalSelectForCancellation();
        } else {
            console.error('Failed to load regionals');
            askCancellationData.regionals = [];
        }
    } catch (error) {
        console.error('Error loading regionals:', error);
        askCancellationData.regionals = [];
    }
}

/**
 * Populate regional select
 */
function populateRegionalSelectForCancellation() {
    const optionsContainer = document.getElementById('askCancellationRegionalOptions');
    if (!optionsContainer) return;

    // Clear existing options
    optionsContainer.innerHTML = '';

    // Add placeholder option
    const placeholderOption = document.createElement('div');
    placeholderOption.className = 'custom-select-option';
    placeholderOption.dataset.value = '';
    placeholderOption.textContent = 'Seleccione una regional';
    optionsContainer.appendChild(placeholderOption);

    // Add regional options
    const regionalOptions = askCancellationData.regionals.map(regional => ({
        value: regional.id.toString(),
        label: regional.name || `Regional ${regional.id}`
    }));

    // Use CustomSelect if available
    if (typeof CustomSelect !== 'undefined') {
        try {
            const customSelect = new CustomSelect('askCancellationRegionalSelect', {
                onChange: async (option) => {
                    const value = option.value;
                    const hiddenInput = document.getElementById('askCancellationSelectedRegionalId');
                    if (hiddenInput) {
                        hiddenInput.value = value;
                    }
                    if (value) {
                        await loadInstitutionsForCancellation(value);
                    }
                }
            });
            customSelect.setOptions(regionalOptions);
            return;
        } catch (e) {
            console.warn('Could not initialize CustomSelect for regionals, using fallback', e);
        }
    }

    // Fallback: manual setup (only if CustomSelect failed)
    if (typeof CustomSelect === 'undefined') {
        askCancellationData.regionals.forEach(regional => {
            const option = document.createElement('div');
            option.className = 'custom-select-option';
            option.dataset.value = regional.id;
            option.textContent = regional.name || `Regional ${regional.id}`;
            optionsContainer.appendChild(option);
        });

        // Setup select handler - wait a bit for DOM to be ready
        setTimeout(() => {
            setupCustomSelect('askCancellationRegionalSelect', 'askCancellationSelectedRegionalId', async (regionalId) => {
                if (regionalId) {
                    await loadInstitutionsForCancellation(regionalId);
                }
            });
        }, 100);
    }
}

/**
 * Load institutions for cancellation form
 */
async function loadInstitutionsForCancellation(regionalId) {
    if (!regionalId) {
        askCancellationData.institutions = [];
        populateInstitutionSelectForCancellation();
        return;
    }

    try {
        const token = localStorage.getItem('jwt');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(`/api/v1/institutions/regional/${regionalId}`, {
            method: 'GET',
            headers: headers
        });

        if (response.ok) {
            const data = await response.json();
            askCancellationData.institutions = Array.isArray(data) ? data : [];
            populateInstitutionSelectForCancellation();
        } else {
            console.error('Failed to load institutions');
            askCancellationData.institutions = [];
            populateInstitutionSelectForCancellation();
        }
    } catch (error) {
        console.error('Error loading institutions:', error);
        askCancellationData.institutions = [];
        populateInstitutionSelectForCancellation();
    }
}

/**
 * Populate institution select
 */
function populateInstitutionSelectForCancellation() {
    const optionsContainer = document.getElementById('askCancellationInstitutionOptions');
    if (!optionsContainer) return;

    // Clear existing options
    optionsContainer.innerHTML = '';

    // Add placeholder option
    const placeholderOption = document.createElement('div');
    placeholderOption.className = 'custom-select-option';
    placeholderOption.dataset.value = '';
    placeholderOption.textContent = 'Seleccione una institución';
    optionsContainer.appendChild(placeholderOption);

    // Add institution options
    const institutionOptions = askCancellationData.institutions.map(institution => ({
        value: institution.id.toString(),
        label: institution.name || `Institución ${institution.id}`
    }));

    // Use CustomSelect if available
    if (typeof CustomSelect !== 'undefined') {
        try {
            const customSelect = new CustomSelect('askCancellationInstitutionSelect', {
                onChange: async (option) => {
                    const value = option.value;
                    const hiddenInput = document.getElementById('askCancellationSelectedInstitutionId');
                    if (hiddenInput) {
                        hiddenInput.value = value;
                    }
                    if (value) {
                        const regionalId = document.getElementById('askCancellationSelectedRegionalId').value;
                        await loadInventoriesForCancellation(regionalId, value);
                    }
                }
            });
            customSelect.setOptions(institutionOptions);
            return;
        } catch (e) {
            console.warn('Could not initialize CustomSelect for institutions, using fallback', e);
        }
    }

    // Fallback: manual setup (only if CustomSelect failed)
    if (typeof CustomSelect === 'undefined') {
        askCancellationData.institutions.forEach(institution => {
            const option = document.createElement('div');
            option.className = 'custom-select-option';
            option.dataset.value = institution.id;
            option.textContent = institution.name || `Institución ${institution.id}`;
            optionsContainer.appendChild(option);
        });

        // Setup select handler - wait a bit for DOM to be ready
        setTimeout(() => {
            setupCustomSelect('askCancellationInstitutionSelect', 'askCancellationSelectedInstitutionId', async (institutionId) => {
                if (institutionId) {
                    const regionalId = document.getElementById('askCancellationSelectedRegionalId').value;
                    await loadInventoriesForCancellation(regionalId, institutionId);
                }
            });
        }, 100);
    }
    
    // Reset inventory select (always)
    updateSelectText('askCancellationInventorySelect', 'Seleccione un inventario');
    document.getElementById('askCancellationSelectedInventoryId').value = '';
    askCancellationData.inventories = [];
    askCancellationData.items = [];
    const itemsContainer = document.getElementById('askCancellationItemsContainer');
    if (itemsContainer) {
        itemsContainer.innerHTML = '<p class="text-gray-500 dark:text-gray-400 text-sm">Seleccione un inventario primero para ver los items disponibles</p>';
    }
}

/**
 * Load inventories for cancellation form
 */
async function loadInventoriesForCancellation(regionalId, institutionId) {
    if (!institutionId) {
        askCancellationData.inventories = [];
        populateInventorySelectForCancellation();
        return;
    }

    try {
        const token = localStorage.getItem('jwt');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        // Build endpoint based on available filters
        let endpoint = '/api/v1/inventory?page=0&size=1000';
        if (regionalId && regionalId !== 'all' && institutionId && institutionId !== 'all') {
            endpoint = `/api/v1/inventory/regional/${regionalId}/institution/${institutionId}?page=0&size=1000`;
        } else if (institutionId && institutionId !== 'all') {
            endpoint = `/api/v1/inventory/institutionAdminInventories/${institutionId}?page=0&size=1000`;
        }

        const response = await fetch(endpoint, {
            method: 'GET',
            headers: headers
        });

        if (response.ok) {
            const data = await response.json();
            askCancellationData.inventories = Array.isArray(data) ? data : (data.content || []);
            populateInventorySelectForCancellation();
        } else {
            console.error('Failed to load inventories');
            askCancellationData.inventories = [];
            populateInventorySelectForCancellation();
        }
    } catch (error) {
        console.error('Error loading inventories:', error);
        askCancellationData.inventories = [];
        populateInventorySelectForCancellation();
    }
}

/**
 * Populate inventory select
 */
function populateInventorySelectForCancellation() {
    const optionsContainer = document.getElementById('askCancellationInventoryOptions');
    if (!optionsContainer) return;

    // Clear existing options
    optionsContainer.innerHTML = '';

    // Add placeholder option
    const placeholderOption = document.createElement('div');
    placeholderOption.className = 'custom-select-option';
    placeholderOption.dataset.value = '';
    placeholderOption.textContent = 'Seleccione un inventario';
    optionsContainer.appendChild(placeholderOption);

    // Add inventory options
    const inventoryOptions = askCancellationData.inventories.map(inventory => ({
        value: inventory.id.toString(),
        label: inventory.name || `Inventario ${inventory.id}`
    }));

    // Use CustomSelect if available
    if (typeof CustomSelect !== 'undefined') {
        try {
            const customSelect = new CustomSelect('askCancellationInventorySelect', {
                onChange: async (option) => {
                    const value = option.value;
                    const hiddenInput = document.getElementById('askCancellationSelectedInventoryId');
                    if (hiddenInput) {
                        hiddenInput.value = value;
                    }
                    if (value) {
                        await loadItemsForCancellation(value);
                    }
                }
            });
            customSelect.setOptions(inventoryOptions);
            return;
        } catch (e) {
            console.warn('Could not initialize CustomSelect for inventories, using fallback', e);
        }
    }

    // Fallback: manual setup (only if CustomSelect failed)
    if (typeof CustomSelect === 'undefined') {
        askCancellationData.inventories.forEach(inventory => {
            const option = document.createElement('div');
            option.className = 'custom-select-option';
            option.dataset.value = inventory.id;
            option.textContent = inventory.name || `Inventario ${inventory.id}`;
            optionsContainer.appendChild(option);
        });

        // Setup select handler - wait a bit for DOM to be ready
        setTimeout(() => {
            setupCustomSelect('askCancellationInventorySelect', 'askCancellationSelectedInventoryId', async (inventoryId) => {
                if (inventoryId) {
                    await loadItemsForCancellation(inventoryId);
                }
            });
        }, 100);
    }
    
    // Clear items (always)
    askCancellationData.items = [];
    askCancellationData.selectedItems = [];
    const itemsContainer = document.getElementById('askCancellationItemsContainer');
    if (itemsContainer) {
        itemsContainer.innerHTML = '<p class="text-gray-500 dark:text-gray-400 text-sm">Seleccione un inventario primero para ver los items disponibles</p>';
    }
}

/**
 * Load items for cancellation form
 */
async function loadItemsForCancellation(inventoryId) {
    if (!inventoryId) {
        askCancellationData.items = [];
        populateItemsForCancellation();
        return;
    }

    try {
        const token = localStorage.getItem('jwt');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(`/api/v1/items/inventory/${inventoryId}?page=0&size=1000`, {
            method: 'GET',
            headers: headers
        });

        if (response.ok) {
            const data = await response.json();
            askCancellationData.items = Array.isArray(data) ? data : (data.content || []);
            populateItemsForCancellation();
        } else {
            console.error('Failed to load items');
            askCancellationData.items = [];
            populateItemsForCancellation();
        }
    } catch (error) {
        console.error('Error loading items:', error);
        askCancellationData.items = [];
        populateItemsForCancellation();
    }
}

/**
 * Populate items for selection
 */
function populateItemsForCancellation() {
    const container = document.getElementById('askCancellationItemsContainer');
    if (!container) return;

    if (!askCancellationData.items || askCancellationData.items.length === 0) {
        container.innerHTML = '<p class="text-gray-500 dark:text-gray-400 text-sm">No hay items disponibles en este inventario</p>';
        return;
    }

    let html = '<div class="space-y-2">';
    askCancellationData.items.forEach(item => {
        const isSelected = askCancellationData.selectedItems.includes(item.id);
        const itemName = item.productName || item.wareHouseDescription || `Item #${item.id}`;
        const licencePlate = item.licencePlateNumber || 'N/A';
        
        html += `
            <label class="flex items-center gap-3 p-3 border-2 rounded-xl cursor-pointer transition-colors ${
                isSelected 
                    ? 'border-[#00AF00] bg-green-50 dark:bg-green-900/20' 
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
            }">
                <input type="checkbox" 
                       value="${item.id}" 
                       ${isSelected ? 'checked' : ''}
                       onchange="toggleCancellationItem(${item.id})"
                       class="w-5 h-5 text-[#00AF00] rounded focus:ring-[#00AF00]">
                <div class="flex-1">
                    <div class="font-medium text-gray-800 dark:text-gray-200">${itemName}</div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">Placa: ${licencePlate}</div>
                </div>
            </label>
        `;
    });
    html += '</div>';

    container.innerHTML = html;
}

/**
 * Toggle item selection
 */
function toggleCancellationItem(itemId) {
    const index = askCancellationData.selectedItems.indexOf(itemId);
    if (index > -1) {
        askCancellationData.selectedItems.splice(index, 1);
    } else {
        askCancellationData.selectedItems.push(itemId);
    }
    populateItemsForCancellation();
}

/**
 * Handle ask cancellation form submission
 */
async function handleAskCancellation() {
    const itemsIds = askCancellationData.selectedItems;
    const reason = document.getElementById('askCancellationReason').value.trim();

    // Validation
    if (itemsIds.length === 0) {
        if (typeof showToast === 'function') {
            showToast('Por favor seleccione al menos un item', 'error');
        } else {
            alert('Por favor seleccione al menos un item');
        }
        return;
    }

    if (!reason) {
        if (typeof showToast === 'function') {
            showToast('Por favor ingrese la razón de la cancelación', 'error');
        } else {
            alert('Por favor ingrese la razón de la cancelación');
        }
        return;
    }

    try {
        const response = await askForCancellation(itemsIds, reason);
        
        if (typeof showToast === 'function') {
            showToast('Solicitud de cancelación creada exitosamente', 'success');
        } else {
            alert('Solicitud de cancelación creada exitosamente');
        }

        closeAskCancellationModal();
        await loadCancellationsData();
    } catch (error) {
        console.error('Error asking for cancellation:', error);
        if (typeof showToast === 'function') {
            showToast(error.message || 'Error al crear la solicitud de cancelación', 'error');
        } else {
            alert(error.message || 'Error al crear la solicitud de cancelación');
        }
    }
}

// Setup custom select handler (using centers.js functionality if available)
function setupCustomSelect(selectId, hiddenInputId, onChange) {
    const select = document.getElementById(selectId);
    if (!select) return;

    // Initialize custom select using centers.js if available
    if (typeof CustomSelect !== 'undefined') {
        // Remove any existing event listeners by creating a new instance
        try {
            const customSelect = new CustomSelect(selectId, {
                onChange: (value, text) => {
                    const hiddenInput = document.getElementById(hiddenInputId);
                    if (hiddenInput) {
                        hiddenInput.value = value;
                    }
                    if (onChange && value) {
                        onChange(value);
                    }
                }
            });
            return;
        } catch (e) {
            console.warn('Could not initialize CustomSelect, using fallback');
        }
    }

    // Fallback: basic handler
    const options = select.querySelectorAll('.custom-select-option');
    const trigger = select.querySelector('.custom-select-trigger');
    const dropdown = select.querySelector('.custom-select-dropdown');
    const hiddenInput = document.getElementById(hiddenInputId);
    const textElement = select.querySelector('.custom-select-text');

    options.forEach(option => {
        option.addEventListener('click', () => {
            const value = option.dataset.value;
            if (hiddenInput) {
                hiddenInput.value = value;
            }
            if (textElement) {
                textElement.textContent = option.textContent;
                textElement.classList.remove('custom-select-placeholder');
            }
            if (dropdown) {
                dropdown.classList.remove('open');
            }
            if (onChange && value) {
                onChange(value);
            }
        });
    });

    if (trigger) {
        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            if (dropdown) {
                dropdown.classList.toggle('open');
            }
        });
    }
}

// Export functions
window.openAskCancellationModal = openAskCancellationModal;
window.closeAskCancellationModal = closeAskCancellationModal;
window.toggleCancellationItem = toggleCancellationItem;
window.handleAskCancellation = handleAskCancellation;

