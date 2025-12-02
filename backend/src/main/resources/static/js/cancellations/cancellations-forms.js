// Cancellations Forms - Handle ask cancellation form

const askCancellationData = {
    selectedItems: [],
    selectedItemsByPlate: [], // Items seleccionados por placa (con toda la info del item)
    currentMode: 'inventory', // 'inventory' or 'plate'
    regionals: [],
    institutions: [],
    inventories: [],
    items: []
};

/**
 * Switch cancellation mode
 */
function switchCancellationMode(mode) {
    askCancellationData.currentMode = mode;
    
    const inventoryModeContent = document.getElementById('inventoryModeContent');
    const plateModeContent = document.getElementById('plateModeContent');
    const modeInventoryBtn = document.getElementById('modeInventoryBtn');
    const modePlateBtn = document.getElementById('modePlateBtn');
    
    if (mode === 'inventory') {
        if (inventoryModeContent) inventoryModeContent.classList.remove('hidden');
        if (plateModeContent) plateModeContent.classList.add('hidden');
        if (modeInventoryBtn) {
            modeInventoryBtn.classList.remove('bg-gray-200', 'dark:bg-gray-600', 'text-gray-700', 'dark:text-gray-300');
            modeInventoryBtn.classList.add('bg-[#00AF00]', 'text-white');
        }
        if (modePlateBtn) {
            modePlateBtn.classList.remove('bg-[#00AF00]', 'text-white');
            modePlateBtn.classList.add('bg-gray-200', 'dark:bg-gray-600', 'text-gray-700', 'dark:text-gray-300');
        }
    } else {
        if (inventoryModeContent) inventoryModeContent.classList.add('hidden');
        if (plateModeContent) plateModeContent.classList.remove('hidden');
        if (modeInventoryBtn) {
            modeInventoryBtn.classList.remove('bg-[#00AF00]', 'text-white');
            modeInventoryBtn.classList.add('bg-gray-200', 'dark:bg-gray-600', 'text-gray-700', 'dark:text-gray-300');
        }
        if (modePlateBtn) {
            modePlateBtn.classList.remove('bg-gray-200', 'dark:bg-gray-600', 'text-gray-700', 'dark:text-gray-300');
            modePlateBtn.classList.add('bg-[#00AF00]', 'text-white');
        }
    }
    
    updateSelectedItemsDisplay();
}

/**
 * Search item by plate and add to selection
 */
async function searchItemByPlate() {
    const plateInput = document.getElementById('plateSearchInput');
    if (!plateInput) return;
    
    const licencePlate = plateInput.value.trim();
    if (!licencePlate) {
        if (typeof showToast === 'function') {
            showToast('Por favor ingrese un número de placa', 'error');
        } else {
            alert('Por favor ingrese un número de placa');
        }
        return;
    }
    
    try {
        const token = localStorage.getItem('jwt');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        
        const response = await fetch(`/api/v1/items/licence-plate/${encodeURIComponent(licencePlate)}`, {
            method: 'GET',
            headers: headers
        });
        
        if (response.ok) {
            const item = await response.json();
            const itemId = item.itemId || item.id;
            
            // Check if item is already selected
            if (askCancellationData.selectedItems.includes(itemId)) {
                if (typeof showToast === 'function') {
                    showToast('Este item ya está seleccionado', 'warning');
                } else {
                    alert('Este item ya está seleccionado');
                }
                plateInput.value = '';
                return;
            }
            
            // Add item to selection
            askCancellationData.selectedItems.push(itemId);
            askCancellationData.selectedItemsByPlate.push(item);
            
            // Clear input
            plateInput.value = '';
            plateInput.focus();
            
            // Update display
            updateSelectedItemsDisplay();
            
            if (typeof showToast === 'function') {
                showToast('Item agregado correctamente', 'success');
            }
        } else if (response.status === 404) {
            if (typeof showToast === 'function') {
                showToast('No se encontró un item con esa placa', 'error');
            } else {
                alert('No se encontró un item con esa placa');
            }
        } else if (response.status === 401 || response.status === 403) {
            const errorMsg = 'No estás autenticado. Por favor, inicia sesión nuevamente.';
            if (typeof showToast === 'function') {
                showToast(errorMsg, 'error');
            } else {
                alert(errorMsg);
            }
            // Optionally redirect to login
            // window.location.href = '/login';
        } else {
            let errorMsg = 'Error al buscar el item';
            try {
                const errorData = await response.json();
                errorMsg = errorData.message || errorData.error || errorMsg;
            } catch (e) {
                // If response is not JSON, use default message
            }
            throw new Error(errorMsg);
        }
    } catch (error) {
        console.error('Error searching item by plate:', error);
        if (typeof showToast === 'function') {
            showToast('Error al buscar el item: ' + error.message, 'error');
        } else {
            alert('Error al buscar el item: ' + error.message);
        }
    }
}

/**
 * Remove item from plate selection
 */
function removeItemFromPlateSelection(itemId) {
    const index = askCancellationData.selectedItems.indexOf(itemId);
    if (index > -1) {
        askCancellationData.selectedItems.splice(index, 1);
    }
    
    const plateIndex = askCancellationData.selectedItemsByPlate.findIndex(item => (item.itemId || item.id) === itemId);
    if (plateIndex > -1) {
        askCancellationData.selectedItemsByPlate.splice(plateIndex, 1);
    }
    
    updateSelectedItemsDisplay();
}

/**
 * Update selected items display for both modes
 */
function updateSelectedItemsDisplay() {
    const count = askCancellationData.selectedItems.length;
    const plateCountElement = document.getElementById('plateSelectedCount');
    if (plateCountElement) {
        plateCountElement.textContent = count;
    }
    
    // Update plate mode display
    const plateContainer = document.getElementById('plateSelectedItemsContainer');
    if (plateContainer && askCancellationData.currentMode === 'plate') {
        if (askCancellationData.selectedItemsByPlate.length === 0) {
            plateContainer.innerHTML = '<p class="text-gray-500 dark:text-gray-400 text-sm text-center py-8">Busque items por placa para agregarlos a la lista</p>';
        } else {
            let html = '<div class="space-y-2">';
            askCancellationData.selectedItemsByPlate.forEach(item => {
                const itemId = item.itemId || item.id;
                const itemName = item.productName || item.wareHouseDescription || `Item #${itemId}`;
                const licencePlate = item.licencePlateNumber || 'N/A';
                
                html += `
                    <div class="flex items-center gap-3 p-3 border-2 border-[#00AF00] bg-green-50 dark:bg-green-900/20 rounded-xl">
                        <div class="flex-1">
                            <div class="font-medium text-gray-800 dark:text-gray-200">${itemName}</div>
                            <div class="text-sm text-gray-500 dark:text-gray-400">Placa: ${licencePlate}</div>
                        </div>
                        <button onclick="removeItemFromPlateSelection(${itemId})" 
                                class="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-medium transition-colors">
                            <i class="fas fa-times"></i> Quitar
                        </button>
                    </div>
                `;
            });
            html += '</div>';
            plateContainer.innerHTML = html;
        }
    }
    
    // Update inventory mode display if needed
    if (askCancellationData.currentMode === 'inventory') {
        populateItemsForCancellation();
    }
}

/**
 * Open ask cancellation modal
 */
function openAskCancellationModal() {
    // Reset form
    askCancellationData.selectedItems = [];
    askCancellationData.selectedItemsByPlate = [];
    askCancellationData.currentMode = 'inventory';
    askCancellationData.regionals = [];
    askCancellationData.institutions = [];
    askCancellationData.inventories = [];
    askCancellationData.items = [];
    
    const regionalIdInput = document.getElementById('askCancellationSelectedRegionalId');
    const institutionIdInput = document.getElementById('askCancellationSelectedInstitutionId');
    const inventoryIdInput = document.getElementById('askCancellationSelectedInventoryId');
    const reasonTextarea = document.getElementById('askCancellationReason');
    
    if (regionalIdInput) regionalIdInput.value = '';
    if (institutionIdInput) institutionIdInput.value = '';
    if (inventoryIdInput) inventoryIdInput.value = '';
    if (reasonTextarea) reasonTextarea.value = '';
    
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
    const modal = document.getElementById('askCancellationModal');
    if (modal) {
        modal.classList.remove('hidden');
    }
    
    // Reset mode to inventory
    switchCancellationMode('inventory');
    
    // Clear plate search input
    const plateInput = document.getElementById('plateSearchInput');
    if (plateInput) {
        plateInput.value = '';
    }
    
    // Load regionals after a short delay to ensure DOM is ready
    setTimeout(() => {
        loadRegionalsForCancellation();
    }, 100);
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
            console.error('Failed to load regionals:', response.status, response.statusText);
            askCancellationData.regionals = [];
            populateRegionalSelectForCancellation();
        }
    } catch (error) {
        console.error('Error loading regionals:', error);
        askCancellationData.regionals = [];
        populateRegionalSelectForCancellation();
    }
}

/**
 * Populate regional select
 */
function populateRegionalSelectForCancellation() {
    const optionsContainer = document.getElementById('askCancellationRegionalOptions');
    if (!optionsContainer) {
        console.warn('askCancellationRegionalOptions container not found');
        return;
    }

    // Clear existing options
    optionsContainer.innerHTML = '';

    if (!askCancellationData.regionals || askCancellationData.regionals.length === 0) {
        const noDataOption = document.createElement('div');
        noDataOption.className = 'custom-select-option disabled';
        noDataOption.textContent = 'No hay regionales disponibles';
        optionsContainer.appendChild(noDataOption);
        return;
    }

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

    // Try to use CustomSelect if available (from centers.js or window)
    const CustomSelectClass = typeof CustomSelect !== 'undefined' ? CustomSelect : 
                              (typeof window.CustomSelect !== 'undefined' ? window.CustomSelect : null);

    if (CustomSelectClass) {
        try {
            // Verify container exists before initializing
            const container = document.getElementById('askCancellationRegionalSelect');
            if (!container) {
                console.error('Container askCancellationRegionalSelect not found');
                throw new Error('Container not found');
            }
            
            const customSelect = new CustomSelectClass('askCancellationRegionalSelect', {
                placeholder: 'Seleccione una regional',
                onChange: async (option) => {
                    const value = option.value;
                    const hiddenInput = document.getElementById('askCancellationSelectedRegionalId');
                    if (hiddenInput) {
                        hiddenInput.value = value;
                    }
                    if (value) {
                        await loadInstitutionsForCancellation(value);
                    } else {
                        // Reset institutions and inventories when regional is cleared
                        askCancellationData.institutions = [];
                        askCancellationData.inventories = [];
                        askCancellationData.items = [];
                        populateInstitutionSelectForCancellation();
                        populateInventorySelectForCancellation();
                    }
                }
            });
            
            // Verify customSelect was created successfully
            if (!customSelect || !customSelect.optionsContainer) {
                console.error('CustomSelect initialization failed - optionsContainer not found');
                throw new Error('CustomSelect initialization failed');
            }
            
            customSelect.setOptions(regionalOptions);
            
            // Verify options were rendered
            const renderedOptions = customSelect.optionsContainer.querySelectorAll('.custom-select-option');
            
            if (renderedOptions.length === 0) {
                console.warn('No options were rendered, using fallback');
                throw new Error('No options rendered');
            }
            
            return;
        } catch (e) {
            console.warn('Could not initialize CustomSelect for regionals, using fallback', e);
            console.error('CustomSelect error details:', e.message, e.stack);
        }
    }

    // Fallback: manual setup - add options directly to DOM
    askCancellationData.regionals.forEach(regional => {
        const option = document.createElement('div');
        option.className = 'custom-select-option';
        option.dataset.value = regional.id.toString();
        option.textContent = regional.name || `Regional ${regional.id}`;
        option.style.cursor = 'pointer';
        option.style.padding = '8px 12px';
        option.addEventListener('mouseenter', () => {
            option.style.backgroundColor = 'rgba(0, 175, 0, 0.1)';
        });
        option.addEventListener('mouseleave', () => {
            option.style.backgroundColor = '';
        });
        option.addEventListener('click', async () => {
            const value = option.dataset.value;
            const hiddenInput = document.getElementById('askCancellationSelectedRegionalId');
            const textElement = document.querySelector('#askCancellationRegionalSelect .custom-select-text');
            const dropdown = document.querySelector('#askCancellationRegionalSelect .custom-select-dropdown');
            
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
            
            if (value) {
                await loadInstitutionsForCancellation(value);
            } else {
                askCancellationData.institutions = [];
                askCancellationData.inventories = [];
                askCancellationData.items = [];
                populateInstitutionSelectForCancellation();
                populateInventorySelectForCancellation();
            }
        });
        optionsContainer.appendChild(option);
    });

    // Setup trigger click handler
    const selectContainer = document.getElementById('askCancellationRegionalSelect');
    const trigger = selectContainer?.querySelector('.custom-select-trigger');
    const dropdown = selectContainer?.querySelector('.custom-select-dropdown');
    
    if (trigger && dropdown && selectContainer) {
        // Remove any existing listeners by cloning
        const newTrigger = trigger.cloneNode(true);
        trigger.parentNode.replaceChild(newTrigger, trigger);
        
        newTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            
            // Toggle open class on the container (not just dropdown)
            selectContainer.classList.toggle('open');
            selectContainer.classList.toggle('active');
            
            // Also ensure dropdown is visible
            if (selectContainer.classList.contains('open')) {
                dropdown.style.display = 'block';
            } else {
                dropdown.style.display = 'none';
            }
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!selectContainer.contains(e.target)) {
                selectContainer.classList.remove('open');
                selectContainer.classList.remove('active');
                dropdown.style.display = 'none';
            }
        });
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

        const response = await fetch(`/api/v1/institutions/institutionsByRegionalId/${regionalId}`, {
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

    const selectedCount = askCancellationData.selectedItems.length;
    let html = `
        <div class="mb-3 flex items-center justify-between">
            <p class="text-sm font-medium text-gray-700 dark:text-gray-300">
                Items disponibles: <span class="text-[#00AF00]">${askCancellationData.items.length}</span>
            </p>
            <p class="text-sm font-medium text-gray-700 dark:text-gray-300">
                Seleccionados: <span class="text-[#00AF00]">${selectedCount}</span>
            </p>
        </div>
        <div class="space-y-2 max-h-[250px] overflow-y-auto">`;
    
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
                ${isSelected ? '<i class="fas fa-check-circle text-[#00AF00]"></i>' : ''}
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
    // Ensure itemId is a number
    const numericId = typeof itemId === 'string' ? parseInt(itemId, 10) : itemId;
    const index = askCancellationData.selectedItems.indexOf(numericId);
    if (index > -1) {
        askCancellationData.selectedItems.splice(index, 1);
    } else {
        askCancellationData.selectedItems.push(numericId);
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

    // Validate inventory mode requirements (only if in inventory mode)
    if (askCancellationData.currentMode === 'inventory') {
        const regionalId = document.getElementById('askCancellationSelectedRegionalId')?.value;
        const institutionId = document.getElementById('askCancellationSelectedInstitutionId')?.value;
        const inventoryId = document.getElementById('askCancellationSelectedInventoryId')?.value;
        
        if (!regionalId || !institutionId || !inventoryId) {
            if (typeof showToast === 'function') {
                showToast('Por favor complete todos los campos requeridos (Regional, Institución e Inventario)', 'error');
            } else {
                alert('Por favor complete todos los campos requeridos');
            }
            return;
        }
    }

    try {
        // Ensure all item IDs are numbers, not strings
        const numericItemsIds = itemsIds.map(id => {
            if (typeof id === 'string') {
                const parsed = parseInt(id, 10);
                if (isNaN(parsed)) {
                    throw new Error(`ID de item inválido: ${id}`);
                }
                return parsed;
            }
            return id;
        });
        
        // Deshabilitar botón mientras se procesa
        const submitBtn = document.querySelector('#askCancellationModal button[type="submit"]');
        const originalText = submitBtn ? submitBtn.innerHTML : '';
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Procesando...';
        }

        const response = await askForCancellation(numericItemsIds, reason);
        
        if (typeof showInventorySuccessToast === 'function') {
            showInventorySuccessToast('Solicitud creada', 'La solicitud de baja ha sido creada exitosamente');
        } else {
            alert('Solicitud de cancelación creada exitosamente');
        }

        closeAskCancellationModal();
        await loadCancellationsData();
    } catch (error) {
        console.error('Error asking for cancellation:', error);
        const errorMessage = error.message || 'Error al crear la solicitud de cancelación';
        
        // Usar el sistema de toast de inventory
        if (typeof showInventoryErrorToast === 'function') {
            showInventoryErrorToast('Error al solicitar baja', errorMessage);
        } else if (typeof showInventoryToast === 'function') {
            showInventoryToast({ tipo: 'error', titulo: 'Error al solicitar baja', descripcion: errorMessage });
        } else if (typeof showToast === 'function') {
            showToast(errorMessage, 'error');
        } else {
            alert(errorMessage);
        }
    } finally {
        // Rehabilitar botón
        const submitBtn = document.querySelector('#askCancellationModal button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-check mr-2"></i>Solicitar Cancelación';
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
window.switchCancellationMode = switchCancellationMode;
window.searchItemByPlate = searchItemByPlate;
window.removeItemFromPlateSelection = removeItemFromPlateSelection;

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        // Module loaded
    });
} else {
    // Module loaded
}

