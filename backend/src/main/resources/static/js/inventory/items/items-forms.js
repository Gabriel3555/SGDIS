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

async function loadCategories() {
    try {
        const token = localStorage.getItem('jwt');
        const headers = {
            'Content-Type': 'application/json'
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        // Note: We need to add a GET endpoint for categories
        // For now, return empty array
        return [];
    } catch (error) {
        console.error('Error loading categories:', error);
        return [];
    }
}

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
                <label class="block text-sm font-medium text-gray-700 mb-2">Placa</label>
                <input type="text" id="newItemLicencePlateNumber" class="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00AF00]" placeholder="Número de placa">
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Número Consecutivo</label>
                <input type="text" id="newItemConsecutiveNumber" class="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00AF00]" placeholder="Número consecutivo">
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Categoría *</label>
                <input type="text" id="newItemCategory" class="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00AF00]" placeholder="Nombre de categoría" required>
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
                <input type="number" step="0.01" id="newItemAcquisitionValue" class="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00AF00]" placeholder="0.00">
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
    
    const productName = document.getElementById('newItemProductName')?.value;
    const category = document.getElementById('newItemCategory')?.value;
    
    if (!productName || !category) {
        if (window.showErrorToast) {
            window.showErrorToast('Error', 'Por favor complete los campos obligatorios');
        }
        return;
    }
    
    try {
        // Note: We need to get categoryId from category name
        // For now, we'll use a placeholder
        const itemData = {
            productName: productName,
            licencePlateNumber: document.getElementById('newItemLicencePlateNumber')?.value || null,
            consecutiveNumber: document.getElementById('newItemConsecutiveNumber')?.value || null,
            brand: document.getElementById('newItemBrand')?.value || null,
            serial: document.getElementById('newItemSerial')?.value || null,
            model: document.getElementById('newItemModel')?.value || null,
            wareHouseDescription: document.getElementById('newItemWareHouseDescription')?.value || null,
            descriptionElement: document.getElementById('newItemDescriptionElement')?.value || null,
            observations: document.getElementById('newItemObservations')?.value || null,
            acquisitionDate: document.getElementById('newItemAcquisitionDate')?.value || null,
            acquisitionValue: document.getElementById('newItemAcquisitionValue')?.value ? parseFloat(document.getElementById('newItemAcquisitionValue').value) : null,
            inventoryId: window.itemsData.currentInventoryId,
            categoryId: null // TODO: Get from category name
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
    
    // Similar to new item form but with values pre-filled
    form.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Nombre del Producto *</label>
                <input type="text" id="editItemProductName" class="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00AF00]" value="${item.productName || ''}" required>
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Placa</label>
                <input type="text" id="editItemLicencePlateNumber" class="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00AF00]" value="${item.licencePlateNumber || ''}">
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Número Consecutivo</label>
                <input type="text" id="editItemConsecutiveNumber" class="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00AF00]" value="${item.consecutiveNumber || ''}">
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Categoría *</label>
                <input type="text" id="editItemCategory" class="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00AF00]" value="${item.categoryName || ''}" required>
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Marca</label>
                <input type="text" id="editItemBrand" class="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00AF00]" value="${item.attributes?.BRAND || ''}">
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Serial</label>
                <input type="text" id="editItemSerial" class="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00AF00]" value="${item.attributes?.SERIAL || ''}">
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Modelo</label>
                <input type="text" id="editItemModel" class="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00AF00]" value="${item.attributes?.MODEL || ''}">
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Fecha de Adquisición</label>
                <input type="date" id="editItemAcquisitionDate" class="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00AF00]" value="${item.acquisitionDate ? new Date(item.acquisitionDate).toISOString().split('T')[0] : ''}">
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Valor de Adquisición</label>
                <input type="number" step="0.01" id="editItemAcquisitionValue" class="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00AF00]" value="${item.acquisitionValue || ''}">
            </div>
            
            <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 mb-2">Observaciones</label>
                <textarea id="editItemObservations" rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00AF00]" placeholder="Observaciones adicionales">${item.attributes?.OBSERVATIONS || ''}</textarea>
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
    
    const productName = document.getElementById('editItemProductName')?.value;
    const category = document.getElementById('editItemCategory')?.value;
    
    if (!productName || !category) {
        if (window.showErrorToast) {
            window.showErrorToast('Error', 'Por favor complete los campos obligatorios');
        }
        return;
    }
    
    try {
        const itemData = {
            itemId: window.itemsData.currentItemId,
            productName: productName,
            licencePlateNumber: document.getElementById('editItemLicencePlateNumber')?.value || null,
            consecutiveNumber: document.getElementById('editItemConsecutiveNumber')?.value || null,
            brand: document.getElementById('editItemBrand')?.value || null,
            serial: document.getElementById('editItemSerial')?.value || null,
            model: document.getElementById('editItemModel')?.value || null,
            observations: document.getElementById('editItemObservations')?.value || null,
            acquisitionDate: document.getElementById('editItemAcquisitionDate')?.value || null,
            acquisitionValue: document.getElementById('editItemAcquisitionValue')?.value ? parseFloat(document.getElementById('editItemAcquisitionValue').value) : null,
            category: category
        };
        
        const response = await window.updateItem(window.itemsData.currentItemId, itemData);
        
        if (window.showSuccessToast) {
            window.showSuccessToast('Item actualizado', 'El item se ha actualizado exitosamente');
        }
        
        closeEditItemModal();
        await loadItemsData();
    } catch (error) {
        console.error('Error updating item:', error);
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

