// Items Forms Functions

// Initialize forms when modals are opened
document.addEventListener('DOMContentLoaded', function() {
    const newItemForm = document.getElementById('newItemForm');
    if (newItemForm) {
        newItemForm.addEventListener('submit', handleNewItemSubmit);
    }
    
    const editItemForm = document.getElementById('editItemForm');
    if (editItemForm) {
        editItemForm.addEventListener('submit', handleEditItemSubmit);
    }
});

function populateNewItemForm() {
    const form = document.getElementById('newItemForm');
    if (!form || !window.itemsData || !window.itemsData.currentInventoryId) return;
    
    form.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nombre del Producto *</label>
                <input type="text" id="newItemProductName" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00AF00]" placeholder="Nombre del producto" required>
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">ID IR</label>
                <input type="text" id="newItemIrId" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00AF00]" placeholder="ID de IR">
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">ID IV</label>
                <input type="text" id="newItemIvId" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00AF00]" placeholder="ID de IV">
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Placa</label>
                <input type="text" id="newItemLicencePlateNumber" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00AF00]" placeholder="Número de placa">
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Número Consecutivo</label>
                <input type="text" id="newItemConsecutiveNumber" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00AF00]" placeholder="Número consecutivo">
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Descripción SKU</label>
                <input type="text" id="newItemSkuDescription" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00AF00]" placeholder="Descripción del SKU">
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Marca</label>
                <input type="text" id="newItemBrand" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00AF00]" placeholder="Marca del producto">
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Serial</label>
                <input type="text" id="newItemSerial" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00AF00]" placeholder="Número de serie">
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Modelo</label>
                <input type="text" id="newItemModel" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00AF00]" placeholder="Modelo del producto">
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Fecha de Adquisición</label>
                <input type="date" id="newItemAcquisitionDate" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00AF00]">
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Valor de Adquisición</label>
                <input type="number" step="0.01" min="0.1" id="newItemAcquisitionValue" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00AF00]" placeholder="0.00">
            </div>
            
            <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Descripción del Almacén</label>
                <textarea id="newItemWareHouseDescription" rows="3" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00AF00]" placeholder="Descripción del almacén"></textarea>
            </div>
            
            <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Descripción del Elemento</label>
                <textarea id="newItemDescriptionElement" rows="3" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00AF00]" placeholder="Descripción del elemento"></textarea>
            </div>
            
            <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Observaciones</label>
                <textarea id="newItemObservations" rows="3" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00AF00]" placeholder="Observaciones adicionales"></textarea>
            </div>
        </div>
        
        <div class="flex gap-3 pt-4">
            <button type="button" onclick="closeNewItemModal()" class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                Cancelar
            </button>
            <button type="submit" class="flex-1 px-4 py-2 bg-[#00AF00] hover:bg-[#008800] text-white rounded-xl transition-colors">
                Crear Item
            </button>
        </div>
    `;
}

async function handleNewItemSubmit(e) {
    e.preventDefault();
    
    if (!window.itemsData || !window.itemsData.currentInventoryId) {
        if (window.showErrorToast) {
            window.showErrorToast('Error', 'No se ha seleccionado un inventario');
        }
        return;
    }
    
    const productName = document.getElementById('newItemProductName')?.value?.trim();
    
    if (!productName) {
        if (window.showErrorToast) {
            window.showErrorToast('Error', 'Por favor ingrese el nombre del producto');
        }
        return;
    }
    
    try {
        // Obtener valores del formulario
        const irId = document.getElementById('newItemIrId')?.value?.trim() || '';
        const ivId = document.getElementById('newItemIvId')?.value?.trim() || '';
        const licencePlateNumber = document.getElementById('newItemLicencePlateNumber')?.value?.trim() || '';
        const consecutiveNumber = document.getElementById('newItemConsecutiveNumber')?.value?.trim() || '';
        const skuDescription = document.getElementById('newItemSkuDescription')?.value?.trim() || '';
        const wareHouseDescription = document.getElementById('newItemWareHouseDescription')?.value?.trim() || '';
        const descriptionElement = document.getElementById('newItemDescriptionElement')?.value?.trim() || '';
        const brand = document.getElementById('newItemBrand')?.value?.trim() || '';
        const serial = document.getElementById('newItemSerial')?.value?.trim() || '';
        const model = document.getElementById('newItemModel')?.value?.trim() || '';
        const observations = document.getElementById('newItemObservations')?.value?.trim() || '';
        const acquisitionDate = document.getElementById('newItemAcquisitionDate')?.value || null;
        const acquisitionValueInput = document.getElementById('newItemAcquisitionValue')?.value;
        // Status siempre será true (activo) por defecto, ya que eliminamos el checkbox
        const status = true;
        
        // Validar y parsear acquisitionValue (debe ser al menos 0.1)
        let acquisitionValue = acquisitionValueInput ? parseFloat(acquisitionValueInput) : 0.1;
        if (acquisitionValue < 0.1) {
            acquisitionValue = 0.1;
        }
        
        // Construir objeto de datos según la API
        const itemData = {
            irId: irId,
            productName: productName,
            wareHouseDescription: wareHouseDescription,
            licencePlateNumber: licencePlateNumber,
            consecutiveNumber: consecutiveNumber,
            skuDescription: skuDescription,
            descriptionElement: descriptionElement,
            brand: brand,
            serial: serial,
            model: model,
            observations: observations,
            acquisitionDate: acquisitionDate,
            acquisitionValue: acquisitionValue,
            ivId: ivId,
            inventoryId: window.itemsData.currentInventoryId,
            categoryId: null,
            status: status
        };
        
        const response = await window.createItem(itemData);
        
        if (window.showSuccessToast) {
            window.showSuccessToast('Item creado', 'El item se ha creado exitosamente');
        }
        
        closeNewItemModal();
        await loadItemsData();
    } catch (error) {
        console.error('Error creating item:', error);
        if (window.showErrorToast) {
            window.showErrorToast('Error', error.message || 'No se pudo crear el item');
        }
    }
}

async function populateEditItemForm() {
    const form = document.getElementById('editItemForm');
    if (!form || !window.itemsData || !window.itemsData.currentItemId) return;
    
    // Show loading state
    form.innerHTML = `
        <div class="flex items-center justify-center py-8">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00AF00]"></div>
        </div>
    `;
    
    try {
        // Fetch complete item data from API
        let item = null;
        
        // NOTE: The endpoint GET /api/v1/items/{id} is currently returning 500 error
        // Using fallback method directly until backend is fixed
        // Try to get item from API first (only if endpoint is working)
        // Temporarily disabled to avoid 500 errors in console
        /*
        if (window.getItemById) {
            try {
                // Try with silent mode to avoid noisy error logs when fallback is available
                item = await window.getItemById(window.itemsData.currentItemId, true);
            } catch (apiError) {
                // Silently handle error, we have fallback strategies
                console.debug('Endpoint GET /api/v1/items/{id} not available, using fallback method');
                item = null;
            }
        }
        */
        
        // Use fallback method: try to find in current items list or fetch all items from inventory
        // This method works reliably and avoids 500 errors
        console.debug('Using fallback method to load item data');
        console.debug(`Looking for item with ID: ${window.itemsData.currentItemId}`);
        
        // First try current items list
        if (window.itemsData && window.itemsData.items) {
            console.debug(`Searching in current items list (${window.itemsData.items.length} items)`);
            item = window.itemsData.items.find(i => {
                const matches = i.id === window.itemsData.currentItemId || 
                               i.itemId === window.itemsData.currentItemId ||
                               String(i.id) === String(window.itemsData.currentItemId) ||
                               String(i.itemId) === String(window.itemsData.currentItemId);
                return matches;
            });
            
            if (item) {
                console.debug('Item found in current items list');
            } else {
                console.debug('Item not found in current items list');
            }
        }
        
        // If not found, try to fetch all items from inventory and find the specific one
        if (!item && window.itemsData && window.itemsData.currentInventoryId && window.fetchItemsByInventory) {
            try {
                console.debug(`Fetching all items from inventory ${window.itemsData.currentInventoryId}`);
                // Fetch all items from inventory (with a large page size)
                const response = await window.fetchItemsByInventory(
                    window.itemsData.currentInventoryId,
                    0,
                    1000 // Large page size to get all items
                );
                
                const allItems = response.content || response.items || response || [];
                
                // Ensure allItems is an array
                const itemsArray = Array.isArray(allItems) ? allItems : [];
                console.debug(`Fetched ${itemsArray.length} items from inventory`);
                
                item = itemsArray.find(i => {
                    // Try different ID field names
                    const matches = i.id === window.itemsData.currentItemId || 
                                   i.itemId === window.itemsData.currentItemId ||
                                   String(i.id) === String(window.itemsData.currentItemId) ||
                                   String(i.itemId) === String(window.itemsData.currentItemId);
                    return matches;
                });
                
                if (item) {
                    console.debug('Item found in inventory items list');
                } else {
                    console.warn(`Item with ID ${window.itemsData.currentItemId} not found in ${itemsArray.length} items`);
                }
            } catch (fetchError) {
                console.warn('Error fetching items from inventory:', fetchError);
            }
        }
        
        if (!item) {
            console.error('Item not found:', {
                currentItemId: window.itemsData.currentItemId,
                currentInventoryId: window.itemsData.currentInventoryId,
                itemsInList: window.itemsData.items?.length || 0,
                itemsData: window.itemsData
            });
            throw new Error(`No se pudo encontrar el item con ID ${window.itemsData.currentItemId}. Por favor, verifica que el item existe.`);
        }
        
        console.debug('Item found successfully:', item);
        
        // Extract values from item, handling different possible structures
        // Use direct properties first, then fallback to attributes if needed
        // Helper function to escape HTML
        const escapeHtml = (text) => {
            if (!text) return '';
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        };
        
        const irId = escapeHtml(String(item.irId || ''));
        const ivId = escapeHtml(String(item.ivId || ''));
        const productName = escapeHtml(String(item.productName || ''));
        const wareHouseDescription = escapeHtml(String(item.wareHouseDescription || ''));
        const licencePlateNumber = escapeHtml(String(item.licencePlateNumber || ''));
        const consecutiveNumber = escapeHtml(String(item.consecutiveNumber || ''));
        const skuDescription = escapeHtml(String(item.skuDescription || ''));
        const descriptionElement = escapeHtml(String(item.descriptionElement || ''));
        const brand = escapeHtml(String(item.brand || item.attributes?.BRAND || item.attributes?.brand || ''));
        const serial = escapeHtml(String(item.serial || item.attributes?.SERIAL || item.attributes?.serial || ''));
        const model = escapeHtml(String(item.model || item.attributes?.MODEL || item.attributes?.model || ''));
        const observations = escapeHtml(String(item.observations || item.attributes?.OBSERVATIONS || item.attributes?.observations || ''));
        
        // Format acquisition date for date input (YYYY-MM-DD)
        let acquisitionDate = '';
        if (item.acquisitionDate) {
            const date = new Date(item.acquisitionDate);
            if (!isNaN(date.getTime())) {
                acquisitionDate = date.toISOString().split('T')[0];
            }
        }
        
        const acquisitionValue = item.acquisitionValue || '';
        const status = item.status !== undefined ? item.status : true;
    
    form.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nombre del Producto *</label>
                <input type="text" id="editItemProductName" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00AF00]" value="${productName}" required>
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">ID IR</label>
                <input type="text" id="editItemIrId" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00AF00]" value="${irId}">
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">ID IV</label>
                <input type="text" id="editItemIvId" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00AF00]" value="${ivId}">
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Placa</label>
                <input type="text" id="editItemLicencePlateNumber" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00AF00]" value="${licencePlateNumber}">
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Número Consecutivo</label>
                <input type="text" id="editItemConsecutiveNumber" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00AF00]" value="${consecutiveNumber}">
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Descripción SKU</label>
                <input type="text" id="editItemSkuDescription" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00AF00]" value="${skuDescription}">
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Marca</label>
                <input type="text" id="editItemBrand" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00AF00]" value="${brand}">
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Serial</label>
                <input type="text" id="editItemSerial" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00AF00]" value="${serial}">
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Modelo</label>
                <input type="text" id="editItemModel" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00AF00]" value="${model}">
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Fecha de Adquisición</label>
                <input type="date" id="editItemAcquisitionDate" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00AF00]" value="${acquisitionDate}">
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Valor de Adquisición</label>
                <input type="number" step="0.01" min="0.1" id="editItemAcquisitionValue" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00AF00]" value="${acquisitionValue}">
            </div>
            
            <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Descripción del Almacén</label>
                <textarea id="editItemWareHouseDescription" rows="3" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00AF00]">${wareHouseDescription}</textarea>
            </div>
            
            <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Descripción del Elemento</label>
                <textarea id="editItemDescriptionElement" rows="3" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00AF00]">${descriptionElement}</textarea>
            </div>
            
            <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Observaciones</label>
                <textarea id="editItemObservations" rows="3" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00AF00]">${observations}</textarea>
            </div>
            
            <div class="md:col-span-2">
                <label class="flex items-center gap-2">
                    <input type="checkbox" id="editItemStatus" class="w-4 h-4 text-[#00AF00] border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded focus:ring-[#00AF00]" ${status ? 'checked' : ''}>
                    <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Activo</span>
                </label>
            </div>
        </div>
        
        <div class="flex gap-3 pt-4">
            <button type="button" onclick="closeEditItemModal()" class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                Cancelar
            </button>
            <button type="submit" class="flex-1 px-4 py-2 bg-[#00AF00] hover:bg-[#008800] text-white rounded-xl transition-colors">
                Actualizar Item
            </button>
        </div>
    `;
    } catch (error) {
        console.error('Error loading item for editing:', error);
        form.innerHTML = `
            <div class="text-center py-8">
                <i class="fas fa-exclamation-triangle text-red-500 text-4xl mb-4"></i>
                <p class="text-red-600 dark:text-red-400 mb-4">Error al cargar los datos del item</p>
                <p class="text-gray-600 dark:text-gray-400 text-sm mb-4">${error.message || 'No se pudieron cargar los datos del item'}</p>
                <button onclick="populateEditItemForm()" class="px-4 py-2 bg-[#00AF00] hover:bg-[#008800] text-white rounded-xl transition-colors">
                    <i class="fas fa-redo mr-2"></i>
                    Reintentar
                </button>
            </div>
        `;
        if (window.showErrorToast) {
            window.showErrorToast('Error', 'No se pudieron cargar los datos del item para editar');
        }
    }
}

async function handleEditItemSubmit(e) {
    e.preventDefault();
    
    if (!window.itemsData || !window.itemsData.currentItemId) {
        if (window.showErrorToast) {
            window.showErrorToast('Error', 'No se ha seleccionado un item');
        }
        return;
    }
    
    const productName = document.getElementById('editItemProductName')?.value?.trim();
    
    if (!productName) {
        if (window.showErrorToast) {
            window.showErrorToast('Error', 'Por favor ingrese el nombre del producto');
        }
        return;
    }
    
    try {
        // Obtener valores del formulario
        const irId = document.getElementById('editItemIrId')?.value?.trim() || '';
        const ivId = document.getElementById('editItemIvId')?.value?.trim() || '';
        const licencePlateNumber = document.getElementById('editItemLicencePlateNumber')?.value?.trim() || '';
        const consecutiveNumber = document.getElementById('editItemConsecutiveNumber')?.value?.trim() || '';
        const skuDescription = document.getElementById('editItemSkuDescription')?.value?.trim() || '';
        const wareHouseDescription = document.getElementById('editItemWareHouseDescription')?.value?.trim() || '';
        const descriptionElement = document.getElementById('editItemDescriptionElement')?.value?.trim() || '';
        const brand = document.getElementById('editItemBrand')?.value?.trim() || '';
        const serial = document.getElementById('editItemSerial')?.value?.trim() || '';
        const model = document.getElementById('editItemModel')?.value?.trim() || '';
        const observations = document.getElementById('editItemObservations')?.value?.trim() || '';
        const acquisitionDate = document.getElementById('editItemAcquisitionDate')?.value || null;
        const acquisitionValueInput = document.getElementById('editItemAcquisitionValue')?.value;
        const status = document.getElementById('editItemStatus')?.checked ?? true;
        
        // Validar y parsear acquisitionValue (debe ser al menos 0.1)
        let acquisitionValue = acquisitionValueInput ? parseFloat(acquisitionValueInput) : 0.1;
        if (acquisitionValue < 0.1) {
            acquisitionValue = 0.1;
        }
        
        // Construir objeto de datos según la API PUT
        // Schema: itemId, irId, productName, wareHouseDescription, licencePlateNumber,
        // consecutiveNumber, skuDescription, descriptionElement, brand, serial, model,
        // observations, acquisitionDate, acquisitionValue, ivId, status
        const itemData = {
            itemId: window.itemsData.currentItemId,
            irId: irId,
            productName: productName,
            wareHouseDescription: wareHouseDescription,
            licencePlateNumber: licencePlateNumber,
            consecutiveNumber: consecutiveNumber,
            skuDescription: skuDescription,
            descriptionElement: descriptionElement,
            brand: brand,
            serial: serial,
            model: model,
            observations: observations,
            acquisitionDate: acquisitionDate,
            acquisitionValue: acquisitionValue,
            ivId: ivId,
            status: status
        };
        
        const response = await window.updateItem(window.itemsData.currentItemId, itemData);
        
        if (window.showSuccessToast) {
            window.showSuccessToast('Item actualizado', 'El item se ha actualizado exitosamente');
        }
        
        closeEditItemModal();
        await loadItemsData();
    } catch (error) {
        if (window.showErrorToast) {
            window.showErrorToast('Error', error.message || 'No se pudo actualizar el item');
        }
    }
}

// Update form when modal is shown
const originalShowNewItemModal = window.showNewItemModal;
window.showNewItemModal = function() {
    if (originalShowNewItemModal) originalShowNewItemModal();
    populateNewItemForm();
};

const originalShowEditItemModal = window.showEditItemModal;
window.showEditItemModal = async function(itemId) {
    if (originalShowEditItemModal) originalShowEditItemModal(itemId);
    // Wait for modal to be visible, then populate form
    setTimeout(async () => {
        await populateEditItemForm();
    }, 100);
};

// Export functions
window.populateNewItemForm = populateNewItemForm;
window.populateEditItemForm = populateEditItemForm;
window.handleNewItemSubmit = handleNewItemSubmit;
window.handleEditItemSubmit = handleEditItemSubmit;

