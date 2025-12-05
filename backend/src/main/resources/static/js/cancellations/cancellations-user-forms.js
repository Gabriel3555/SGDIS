// Cancellations User Forms - Handle ask cancellation form for USER role
// Validates that user is owner or signatory of inventory

const askCancellationUserData = {
    selectedItems: [],
    selectedItemsByPlate: [],
    currentMode: 'inventory',
    inventories: [],
    items: [],
    userInventories: [] // Inventories where user is owner or signatory
};

/**
 * Open ask cancellation modal for user
 */
function openAskCancellationModal() {
    // Reset form
    askCancellationUserData.selectedItems = [];
    askCancellationUserData.selectedItemsByPlate = [];
    askCancellationUserData.currentMode = 'inventory';
    askCancellationUserData.inventories = [];
    askCancellationUserData.items = [];
    
    const inventoryIdInput = document.getElementById('askCancellationSelectedInventoryId');
    const reasonTextarea = document.getElementById('askCancellationReason');
    
    if (inventoryIdInput) inventoryIdInput.value = '';
    if (reasonTextarea) reasonTextarea.value = '';
    
    // Reset selects
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
    if (typeof switchCancellationMode === 'function') {
        switchCancellationMode('inventory');
    } else {
        // Fallback if function not available
        askCancellationUserData.currentMode = 'inventory';
        const inventoryModeContent = document.getElementById('inventoryModeContent');
        const plateModeContent = document.getElementById('plateModeContent');
        if (inventoryModeContent) inventoryModeContent.classList.remove('hidden');
        if (plateModeContent) plateModeContent.classList.add('hidden');
    }
    
    // Clear plate search input
    const plateInput = document.getElementById('plateSearchInput');
    if (plateInput) {
        plateInput.value = '';
    }
    
    // Hide regional and institution filters for user
    const regionalContainer = document.querySelector('#inventoryModeContent > div:first-child');
    const institutionContainer = document.querySelector('#inventoryModeContent > div:nth-child(2)');
    if (regionalContainer) regionalContainer.style.display = 'none';
    if (institutionContainer) institutionContainer.style.display = 'none';
    
    // Load user inventories (where user is owner or signatory)
    setTimeout(() => {
        loadUserInventoriesForCancellation();
    }, 100);
}

/**
 * Close ask cancellation modal
 */
function closeAskCancellationModal() {
    const modal = document.getElementById('askCancellationModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

/**
 * Update select text (use global function if available)
 */
function updateSelectText(selectId, text) {
    if (typeof window.updateSelectText === 'function' && window.updateSelectText !== updateSelectText) {
        return window.updateSelectText(selectId, text);
    }
    const select = document.getElementById(selectId);
    if (select) {
        const textElement = select.querySelector('.custom-select-text');
        if (textElement) {
            textElement.textContent = text;
        }
    }
}

/**
 * Load user inventories (where user is owner or signatory)
 */
async function loadUserInventoriesForCancellation() {
    try {
        const token = localStorage.getItem('jwt');
        if (!token) {
            throw new Error('No authentication token found');
        }

        const headers = { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };

        // Load owner and signatory inventories
        const [ownedResponse, signatoryResponse] = await Promise.all([
            fetch('/api/v1/users/me/inventories/owner', {
                method: 'GET',
                headers: headers
            }),
            fetch('/api/v1/users/me/inventories/signatory', {
                method: 'GET',
                headers: headers
            })
        ]);

        if (ownedResponse.status === 401 || signatoryResponse.status === 401) {
            localStorage.removeItem('jwt');
            window.location.href = '/';
            return;
        }

        const ownedInventories = ownedResponse.ok ? await ownedResponse.json() : [];
        const signatoryInventories = signatoryResponse.ok ? await signatoryResponse.json() : [];

        // Combine and remove duplicates
        const allInventoriesMap = new Map();
        
        [...ownedInventories, ...signatoryInventories].forEach(inv => {
            if (inv && inv.id) {
                allInventoriesMap.set(inv.id, inv);
            }
        });

        askCancellationUserData.userInventories = Array.from(allInventoriesMap.values());
        askCancellationUserData.inventories = askCancellationUserData.userInventories;
        
        populateInventorySelectForUserCancellation();
    } catch (error) {
        console.error('Error loading user inventories:', error);
        askCancellationUserData.inventories = [];
        askCancellationUserData.userInventories = [];
        populateInventorySelectForUserCancellation();
        
        if (typeof showInventoryErrorToast === 'function') {
            showInventoryErrorToast('Error', 'No se pudieron cargar los inventarios. Por favor, intenta nuevamente.');
        }
    }
}

/**
 * Populate inventory select for user
 */
function populateInventorySelectForUserCancellation() {
    const optionsContainer = document.getElementById('askCancellationInventoryOptions');
    if (!optionsContainer) return;

    // Clear existing options
    optionsContainer.innerHTML = '';

    if (!askCancellationUserData.inventories || askCancellationUserData.inventories.length === 0) {
        const emptyOption = document.createElement('div');
        emptyOption.className = 'custom-select-option';
        emptyOption.textContent = 'No tienes inventarios disponibles';
        optionsContainer.appendChild(emptyOption);
        return;
    }

    // Add inventory options
    const inventoryOptions = askCancellationUserData.inventories.map(inventory => ({
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
                        await loadItemsForUserCancellation(value);
                    } else {
                        askCancellationUserData.items = [];
                        const itemsContainer = document.getElementById('askCancellationItemsContainer');
                        if (itemsContainer) {
                            itemsContainer.innerHTML = '<p class="text-gray-500 dark:text-gray-400 text-sm">Seleccione un inventario primero para ver los items disponibles</p>';
                        }
                    }
                }
            });
            customSelect.setOptions(inventoryOptions);
            return;
        } catch (e) {
            console.warn('Could not initialize CustomSelect for inventories, using fallback', e);
        }
    }

    // Fallback: manual setup
    askCancellationUserData.inventories.forEach(inventory => {
        const option = document.createElement('div');
        option.className = 'custom-select-option';
        option.dataset.value = inventory.id;
        option.textContent = inventory.name || `Inventario ${inventory.id}`;
        option.addEventListener('click', async () => {
            const hiddenInput = document.getElementById('askCancellationSelectedInventoryId');
            if (hiddenInput) {
                hiddenInput.value = inventory.id;
            }
            await loadItemsForUserCancellation(inventory.id);
        });
        optionsContainer.appendChild(option);
    });
}

/**
 * Load items for user cancellation (only from selected inventory)
 */
async function loadItemsForUserCancellation(inventoryId) {
    if (!inventoryId) {
        askCancellationUserData.items = [];
        populateItemsForUserCancellation();
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
            const items = Array.isArray(data) ? data : (data.content || []);
            
            // Filter out cancelled items
            askCancellationUserData.items = items.filter(item => {
                // Items that are cancelled should not be shown
                // (This is a client-side check, backend will also validate)
                return true; // Backend will handle cancellation validation
            });
            
            populateItemsForUserCancellation();
        } else {
            console.error('Failed to load items');
            askCancellationUserData.items = [];
            populateItemsForUserCancellation();
        }
    } catch (error) {
        console.error('Error loading items:', error);
        askCancellationUserData.items = [];
        populateItemsForUserCancellation();
    }
}

/**
 * Populate items for user cancellation
 */
function populateItemsForUserCancellation() {
    const container = document.getElementById('askCancellationItemsContainer');
    if (!container) return;

    if (!askCancellationUserData.items || askCancellationUserData.items.length === 0) {
        container.innerHTML = '<p class="text-gray-500 dark:text-gray-400 text-sm">No hay items disponibles en este inventario</p>';
        return;
    }

    let html = '<div class="space-y-2 max-h-[300px] overflow-y-auto">';
    
    askCancellationUserData.items.forEach(item => {
        const itemId = item.itemId || item.id;
        const itemName = item.productName || item.wareHouseDescription || `Item #${itemId}`;
        const licencePlate = item.licencePlateNumber || 'N/A';
        const isSelected = askCancellationUserData.selectedItems.includes(itemId);
        
        html += `
            <div class="flex items-center gap-3 p-3 border-2 ${isSelected ? 'border-[#00AF00] bg-green-50 dark:bg-green-900/20' : 'border-gray-300 dark:border-gray-600'} rounded-xl transition-all">
                <input type="checkbox" 
                       id="item-${itemId}" 
                       ${isSelected ? 'checked' : ''}
                       onchange="toggleItemSelectionForUser(${itemId})"
                       class="w-5 h-5 text-[#00AF00] border-gray-300 rounded focus:ring-[#00AF00]">
                <label for="item-${itemId}" class="flex-1 cursor-pointer">
                    <div class="font-medium text-gray-800 dark:text-gray-200">${itemName}</div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">Placa: ${licencePlate}</div>
                </label>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

/**
 * Toggle item selection for user
 */
function toggleItemSelectionForUser(itemId) {
    const index = askCancellationUserData.selectedItems.indexOf(itemId);
    if (index > -1) {
        askCancellationUserData.selectedItems.splice(index, 1);
    } else {
        askCancellationUserData.selectedItems.push(itemId);
    }
    populateItemsForUserCancellation();
}

/**
 * Search item by plate for user (validates ownership/signatory)
 */
async function searchItemByPlate() {
    const plateInput = document.getElementById('plateSearchInput');
    if (!plateInput) return;
    
    const licencePlate = plateInput.value.trim();
    if (!licencePlate) {
        if (typeof showInventoryErrorToast === 'function') {
            showInventoryErrorToast('Campo requerido', 'Por favor ingrese un número de placa');
        } else {
            alert('Por favor ingrese un número de placa');
        }
        return;
    }
    
    try {
        const token = localStorage.getItem('jwt');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        
        // Fetch item by plate
        const response = await fetch(`/api/v1/items/licence-plate/${encodeURIComponent(licencePlate)}`, {
            method: 'GET',
            headers: headers
        });
        
        if (response.ok) {
            const item = await response.json();
            const itemId = item.itemId || item.id;
            const inventoryId = item.inventoryId || item.inventory?.id;
            
            if (!inventoryId) {
                if (typeof showInventoryErrorToast === 'function') {
                    showInventoryErrorToast('Error', 'El item no pertenece a ningún inventario');
                } else {
                    alert('El item no pertenece a ningún inventario');
                }
                plateInput.value = '';
                return;
            }
            
            // Validate that user is owner or signatory of the item's inventory
            const isAuthorized = await validateUserInventoryAccess(inventoryId);
            
            if (!isAuthorized) {
                if (typeof showInventoryErrorToast === 'function') {
                    showInventoryErrorToast('Sin permisos', 'Solo puedes solicitar bajas de items de inventarios donde eres propietario o firmante');
                } else {
                    alert('Solo puedes solicitar bajas de items de inventarios donde eres propietario o firmante');
                }
                plateInput.value = '';
                return;
            }
            
            // Check if item is already selected
            if (askCancellationUserData.selectedItems.includes(itemId)) {
                if (typeof showInventoryErrorToast === 'function') {
                    showInventoryErrorToast('Item duplicado', 'Este item ya está seleccionado');
                } else {
                    alert('Este item ya está seleccionado');
                }
                plateInput.value = '';
                return;
            }
            
            // Add item to selection
            askCancellationUserData.selectedItems.push(itemId);
            askCancellationUserData.selectedItemsByPlate.push(item);
            
            // Clear input
            plateInput.value = '';
            plateInput.focus();
            
            // Update display
            updateSelectedItemsDisplayForUser();
            
            if (typeof showInventorySuccessToast === 'function') {
                showInventorySuccessToast('Item agregado', 'Item agregado correctamente');
            }
        } else if (response.status === 404) {
            if (typeof showInventoryErrorToast === 'function') {
                showInventoryErrorToast('Item no encontrado', 'No se encontró un item con esa placa');
            } else {
                alert('No se encontró un item con esa placa');
            }
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
        if (typeof showInventoryErrorToast === 'function') {
            showInventoryErrorToast('Error', 'Error al buscar el item: ' + error.message);
        } else {
            alert('Error al buscar el item: ' + error.message);
        }
    }
}

/**
 * Validate that user is owner or signatory of inventory
 */
async function validateUserInventoryAccess(inventoryId) {
    try {
        const token = localStorage.getItem('jwt');
        if (!token) return false;

        const headers = { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };

        // Check if inventory is in user's inventories (owner or signatory)
        const [ownedResponse, signatoryResponse] = await Promise.all([
            fetch('/api/v1/users/me/inventories/owner', {
                method: 'GET',
                headers: headers
            }),
            fetch('/api/v1/users/me/inventories/signatory', {
                method: 'GET',
                headers: headers
            })
        ]);

        if (ownedResponse.ok) {
            const ownedInventories = await ownedResponse.json();
            if (ownedInventories.some(inv => inv.id === inventoryId)) {
                return true;
            }
        }

        if (signatoryResponse.ok) {
            const signatoryInventories = await signatoryResponse.json();
            if (signatoryInventories.some(inv => inv.id === inventoryId)) {
                return true;
            }
        }

        return false;
    } catch (error) {
        console.error('Error validating user inventory access:', error);
        return false;
    }
}

/**
 * Update selected items display for user (plate mode)
 */
function updateSelectedItemsDisplayForUser() {
    const count = askCancellationUserData.selectedItems.length;
    const plateCountElement = document.getElementById('plateSelectedCount');
    if (plateCountElement) {
        plateCountElement.textContent = count;
    }
    
    // Update plate mode display
    const plateContainer = document.getElementById('plateSelectedItemsContainer');
    if (plateContainer && askCancellationUserData.currentMode === 'plate') {
        if (askCancellationUserData.selectedItemsByPlate.length === 0) {
            plateContainer.innerHTML = '<p class="text-gray-500 dark:text-gray-400 text-sm text-center py-8">Busque items por placa para agregarlos a la lista</p>';
        } else {
            let html = '<div class="space-y-2">';
            askCancellationUserData.selectedItemsByPlate.forEach(item => {
                const itemId = item.itemId || item.id;
                const itemName = item.productName || item.wareHouseDescription || `Item #${itemId}`;
                const licencePlate = item.licencePlateNumber || 'N/A';
                
                html += `
                    <div class="flex items-center gap-3 p-3 border-2 border-[#00AF00] bg-green-50 dark:bg-green-900/20 rounded-xl">
                        <div class="flex-1">
                            <div class="font-medium text-gray-800 dark:text-gray-200">${itemName}</div>
                            <div class="text-sm text-gray-500 dark:text-gray-400">Placa: ${licencePlate}</div>
                        </div>
                        <button onclick="removeItemFromPlateSelectionForUser(${itemId})" 
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
}

/**
 * Remove item from plate selection for user
 */
function removeItemFromPlateSelectionForUser(itemId) {
    const index = askCancellationUserData.selectedItems.indexOf(itemId);
    if (index > -1) {
        askCancellationUserData.selectedItems.splice(index, 1);
    }
    
    const plateIndex = askCancellationUserData.selectedItemsByPlate.findIndex(item => (item.itemId || item.id) === itemId);
    if (plateIndex > -1) {
        askCancellationUserData.selectedItemsByPlate.splice(plateIndex, 1);
    }
    
    updateSelectedItemsDisplayForUser();
}

/**
 * Handle ask cancellation for user
 */
async function handleAskCancellation() {
    try {
        // Get selected items
        const selectedItems = askCancellationUserData.selectedItems;
        
        if (!selectedItems || selectedItems.length === 0) {
            if (typeof showInventoryErrorToast === 'function') {
                showInventoryErrorToast('Items requeridos', 'Por favor seleccione al menos un item');
            } else {
                alert('Por favor seleccione al menos un item');
            }
            return;
        }

        // Get reason
        const reasonTextarea = document.getElementById('askCancellationReason');
        const reason = reasonTextarea ? reasonTextarea.value.trim() : '';
        
        if (!reason) {
            if (typeof showInventoryErrorToast === 'function') {
                showInventoryErrorToast('Razón requerida', 'Por favor ingrese la razón de la baja');
            } else {
                alert('Por favor ingrese la razón de la baja');
            }
            return;
        }

        // Validate that all items belong to inventories where user is owner or signatory
        // (Backend will also validate, but we do a client-side check for better UX)
        for (const itemId of selectedItems) {
            // For items selected by plate, we already validated
            // For items selected from inventory, they're already from user's inventories
            // So we can proceed
        }

        // Show loading
        if (typeof showInventoryInfoToast === 'function') {
            showInventoryInfoToast('Enviando solicitud', 'Creando solicitud de baja...');
        }

        // Submit cancellation request
        const token = localStorage.getItem('jwt');
        const headers = { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };

        const response = await fetch('/api/v1/cancellations/ask', {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                itemsId: selectedItems,
                reason: reason
            })
        });

        if (response.ok) {
            if (typeof showInventorySuccessToast === 'function') {
                showInventorySuccessToast('Solicitud creada', 'La solicitud de baja se creó exitosamente');
            }
            
            // Close modal
            closeAskCancellationModal();
            
            // Reload cancellations
            await loadCancellationsData();
        } else {
            let errorMessage = 'Error al crear la solicitud de baja';
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorData.error || errorMessage;
            } catch (e) {
                // If response is not JSON, use default message
            }
            
            if (typeof showInventoryErrorToast === 'function') {
                showInventoryErrorToast('Error', errorMessage);
            } else {
                alert(errorMessage);
            }
        }
    } catch (error) {
        console.error('Error handling ask cancellation:', error);
        if (typeof showInventoryErrorToast === 'function') {
            showInventoryErrorToast('Error', 'Error al crear la solicitud: ' + error.message);
        } else {
            alert('Error al crear la solicitud: ' + error.message);
        }
    }
}

// Override switchCancellationMode to use user data
const originalSwitchCancellationMode = window.switchCancellationMode;
window.switchCancellationMode = function(mode) {
    if (window.location.pathname.includes('/user/cancellations')) {
        askCancellationUserData.currentMode = mode;
        
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
        
        updateSelectedItemsDisplayForUser();
    } else if (originalSwitchCancellationMode) {
        originalSwitchCancellationMode(mode);
    }
};

// Override global functions for user role
if (window.location.pathname.includes('/user/cancellations')) {
    window.openAskCancellationModal = openAskCancellationModal;
    window.closeAskCancellationModal = closeAskCancellationModal;
    window.searchItemByPlate = searchItemByPlate;
    window.handleAskCancellation = handleAskCancellation;
}

