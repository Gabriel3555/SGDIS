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
                <label class="block text-sm font-medium text-gray-700 mb-2">Nombre del Producto *</label>
                <input type="text" id="newItemProductName" class="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00AF00]" placeholder="Nombre del producto" required>
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">ID IR</label>
                <input type="text" id="newItemIrId" class="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00AF00]" placeholder="ID de IR">
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">ID IV</label>
                <input type="text" id="newItemIvId" class="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00AF00]" placeholder="ID de IV">
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Placa</label>
                <input type="text" id="newItemLicencePlateNumber" class="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00AF00]" placeholder="Número de placa">
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Número Consecutivo</label>
                <input type="text" id="newItemConsecutiveNumber" class="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00AF00]" placeholder="Número consecutivo">
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Descripción SKU</label>
                <input type="text" id="newItemSkuDescription" class="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00AF00]" placeholder="Descripción del SKU">
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Marca</label>
                <input type="text" id="newItemBrand" class="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00AF00]" placeholder="Marca del producto">
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Serial</label>
                <input type="text" id="newItemSerial" class="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00AF00]" placeholder="Número de serie">
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Modelo</label>
                <input type="text" id="newItemModel" class="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00AF00]" placeholder="Modelo del producto">
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Fecha de Adquisición</label>
                <input type="date" id="newItemAcquisitionDate" class="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00AF00]">
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Valor de Adquisición</label>
                <input type="number" step="0.01" min="0.1" id="newItemAcquisitionValue" class="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00AF00]" placeholder="0.00">
            </div>
            
            <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 mb-2">Descripción del Almacén</label>
                <textarea id="newItemWareHouseDescription" rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00AF00]" placeholder="Descripción del almacén"></textarea>
            </div>
            
            <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 mb-2">Descripción del Elemento</label>
                <textarea id="newItemDescriptionElement" rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00AF00]" placeholder="Descripción del elemento"></textarea>
            </div>
            
            <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 mb-2">Observaciones</label>
                <textarea id="newItemObservations" rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00AF00]" placeholder="Observaciones adicionales"></textarea>
            </div>
            
            <div class="md:col-span-2">
                <label class="flex items-center gap-2">
                    <input type="checkbox" id="newItemStatus" class="w-4 h-4 text-[#00AF00] border-gray-300 rounded focus:ring-[#00AF00]" checked>
                    <span class="text-sm font-medium text-gray-700">Activo</span>
                </label>
            </div>
        </div>
        
        <div class="flex gap-3 pt-4">
            <button type="button" onclick="closeNewItemModal()" class="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors">
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
        const status = document.getElementById('newItemStatus')?.checked ?? true;
        
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

function populateEditItemForm() {
    const form = document.getElementById('editItemForm');
    if (!form || !window.itemsData || !window.itemsData.currentItemId) return;
    
    // Find item in current items list
    const item = window.itemsData.items.find(i => i.id === window.itemsData.currentItemId);
    if (!item) return;
    
    // Extract values from item, handling different possible structures
    const irId = item.irId || '';
    const ivId = item.ivId || '';
    const productName = item.productName || '';
    const wareHouseDescription = item.wareHouseDescription || '';
    const licencePlateNumber = item.licencePlateNumber || '';
    const consecutiveNumber = item.consecutiveNumber || '';
    const skuDescription = item.skuDescription || '';
    const descriptionElement = item.descriptionElement || '';
    const brand = item.brand || item.attributes?.BRAND || '';
    const serial = item.serial || item.attributes?.SERIAL || '';
    const model = item.model || item.attributes?.MODEL || '';
    const observations = item.observations || item.attributes?.OBSERVATIONS || '';
    const acquisitionDate = item.acquisitionDate ? new Date(item.acquisitionDate).toISOString().split('T')[0] : '';
    const acquisitionValue = item.acquisitionValue || '';
    const status = item.status ?? true;
    
    form.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Nombre del Producto *</label>
                <input type="text" id="editItemProductName" class="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00AF00]" value="${productName}" required>
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">ID IR</label>
                <input type="text" id="editItemIrId" class="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00AF00]" value="${irId}">
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">ID IV</label>
                <input type="text" id="editItemIvId" class="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00AF00]" value="${ivId}">
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Placa</label>
                <input type="text" id="editItemLicencePlateNumber" class="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00AF00]" value="${licencePlateNumber}">
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Número Consecutivo</label>
                <input type="text" id="editItemConsecutiveNumber" class="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00AF00]" value="${consecutiveNumber}">
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Descripción SKU</label>
                <input type="text" id="editItemSkuDescription" class="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00AF00]" value="${skuDescription}">
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Marca</label>
                <input type="text" id="editItemBrand" class="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00AF00]" value="${brand}">
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Serial</label>
                <input type="text" id="editItemSerial" class="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00AF00]" value="${serial}">
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Modelo</label>
                <input type="text" id="editItemModel" class="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00AF00]" value="${model}">
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Fecha de Adquisición</label>
                <input type="date" id="editItemAcquisitionDate" class="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00AF00]" value="${acquisitionDate}">
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Valor de Adquisición</label>
                <input type="number" step="0.01" min="0.1" id="editItemAcquisitionValue" class="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00AF00]" value="${acquisitionValue}">
            </div>
            
            <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 mb-2">Descripción del Almacén</label>
                <textarea id="editItemWareHouseDescription" rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00AF00]">${wareHouseDescription}</textarea>
            </div>
            
            <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 mb-2">Descripción del Elemento</label>
                <textarea id="editItemDescriptionElement" rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00AF00]">${descriptionElement}</textarea>
            </div>
            
            <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 mb-2">Observaciones</label>
                <textarea id="editItemObservations" rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00AF00]">${observations}</textarea>
            </div>
            
            <div class="md:col-span-2">
                <label class="flex items-center gap-2">
                    <input type="checkbox" id="editItemStatus" class="w-4 h-4 text-[#00AF00] border-gray-300 rounded focus:ring-[#00AF00]" ${status ? 'checked' : ''}>
                    <span class="text-sm font-medium text-gray-700">Activo</span>
                </label>
            </div>
        </div>
        
        <div class="flex gap-3 pt-4">
            <button type="button" onclick="closeEditItemModal()" class="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors">
                Cancelar
            </button>
            <button type="submit" class="flex-1 px-4 py-2 bg-[#00AF00] hover:bg-[#008800] text-white rounded-xl transition-colors">
                Actualizar Item
            </button>
        </div>
    `;
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
            category: '',
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
window.showEditItemModal = function(itemId) {
    if (originalShowEditItemModal) originalShowEditItemModal(itemId);
    setTimeout(() => populateEditItemForm(), 100);
};

// Export functions
window.populateNewItemForm = populateNewItemForm;
window.populateEditItemForm = populateEditItemForm;
window.handleNewItemSubmit = handleNewItemSubmit;
window.handleEditItemSubmit = handleEditItemSubmit;

