// Items Modals Functions

async function loadItemsData() {
    if (!window.itemsData || !window.itemsData.currentInventoryId) {
        console.error('No inventory ID set for loading items');
        return;
    }
    
    const container = document.getElementById('itemsContainer');
    if (container) {
        container.innerHTML = `
            <div class="animate-pulse space-y-4">
                <div class="h-32 bg-gray-200 rounded-xl"></div>
                <div class="h-32 bg-gray-200 rounded-xl"></div>
                <div class="h-32 bg-gray-200 rounded-xl"></div>
            </div>
        `;
    }
    
    try {
        const { currentPage, pageSize, currentInventoryId } = window.itemsData;
        const response = await window.fetchItemsByInventory(currentInventoryId, currentPage, pageSize);
        
        // Update items data
        window.itemsData.items = response.content || [];
        window.itemsData.totalPages = response.totalPages || 0;
        window.itemsData.totalElements = response.totalElements || 0;
        
        // Update UI
        if (window.updateItemsUI) {
            window.updateItemsUI();
        }
    } catch (error) {
        console.error('Error loading items:', error);
        if (container) {
            container.innerHTML = `
                <div class="text-center py-12">
                    <i class="fas fa-exclamation-triangle text-red-500 text-4xl mb-4"></i>
                    <p class="text-red-600">Error al cargar los items</p>
                    <button onclick="loadItemsData()" class="mt-4 bg-[#00AF00] hover:bg-[#008800] text-white font-semibold py-2 px-4 rounded-xl transition-colors">
                        Reintentar
                    </button>
                </div>
            `;
        }
        if (window.showErrorToast) {
            window.showErrorToast('Error', 'No se pudieron cargar los items del inventario');
        }
    }
}

async function showViewItemModal(itemId) {
    const modal = document.getElementById('viewItemModal');
    if (!modal) return;
    
    const content = document.getElementById('viewItemContent');
    if (content) {
        content.innerHTML = `
            <div class="flex items-center justify-center py-8">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00AF00]"></div>
            </div>
        `;
    }
    
    modal.classList.remove('hidden');
    
    // Fetch item details (we'll need to get it from the items list or create a new endpoint)
    // For now, find it in the current items list
    if (window.itemsData && window.itemsData.items) {
        const item = window.itemsData.items.find(i => i.id === itemId);
        if (item) {
            populateViewItemModal(item);
        }
    }
}

function populateViewItemModal(item) {
    const content = document.getElementById('viewItemContent');
    if (!content) return;
    
    const imageUrl = item.urlImg || (item.attributes && item.attributes.IMAGE) || null;
    const productName = item.productName || 'Sin nombre';
    const acquisitionDate = item.acquisitionDate ? new Date(item.acquisitionDate).toLocaleDateString('es-ES') : 'N/A';
    const acquisitionValue = item.acquisitionValue ? `$${item.acquisitionValue.toLocaleString('es-ES')}` : 'N/A';
    const licencePlateNumber = item.licencePlateNumber || 'N/A';
    const location = item.location || 'N/A';
    const responsible = item.responsible || 'N/A';
    
    // Get attributes
    let attributesHtml = '';
    if (item.attributes && typeof item.attributes === 'object') {
        attributesHtml = '<div class="space-y-2">';
        for (const [key, value] of Object.entries(item.attributes)) {
            if (value) {
                attributesHtml += `
                    <div class="flex justify-between">
                        <span class="text-gray-600">${key}:</span>
                        <span class="font-medium">${value}</span>
                    </div>
                `;
            }
        }
        attributesHtml += '</div>';
    }
    
    const imageContainerId = "view-item-image-" + item.id;
    content.innerHTML = `
        <div class="flex justify-center mb-6">
            ${imageUrl ? `
                <div class="w-48 h-48 bg-gray-200 rounded-xl overflow-hidden cursor-pointer hover:opacity-80 transition-opacity relative" id="${imageContainerId}" onclick="handleItemImageUploadClick(${item.id}, '${imageContainerId}')" title="Haz clic para cambiar la imagen">
                    <img src="${imageUrl}" alt="${productName}" class="w-full h-full object-cover">
                    <input type="file" accept="image/*" id="file-input-${imageContainerId}" style="display: none;" onchange="handleItemImageFileSelect(event, ${item.id}, '${imageContainerId}')">
                </div>
            ` : `
                <div class="w-48 h-48 bg-gray-200 rounded-xl flex items-center justify-center text-gray-400 cursor-pointer hover:bg-gray-300 transition-colors" id="${imageContainerId}" onclick="handleItemImageUploadClick(${item.id}, '${imageContainerId}')" title="Haz clic para subir una imagen">
                    <i class="fas fa-box text-6xl"></i>
                    <input type="file" accept="image/*" id="file-input-${imageContainerId}" style="display: none;" onchange="handleItemImageFileSelect(event, ${item.id}, '${imageContainerId}')">
                </div>
            `}
        </div>
        
        <div class="bg-gray-50 rounded-xl p-6 space-y-4">
            <h3 class="text-lg font-semibold text-gray-800 mb-4">Información del Item</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Nombre del Producto</label>
                    <p class="text-gray-900 font-semibold">${productName}</p>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Placa</label>
                    <p class="text-gray-900">${licencePlateNumber}</p>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Ubicación</label>
                    <p class="text-gray-900">${location}</p>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Responsable</label>
                    <p class="text-gray-900">${responsible}</p>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Fecha de Adquisición</label>
                    <p class="text-gray-900">${acquisitionDate}</p>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Valor de Adquisición</label>
                    <p class="text-gray-900 font-semibold">${acquisitionValue}</p>
                </div>
            </div>
            ${attributesHtml ? `
                <div class="mt-4">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Atributos</label>
                    ${attributesHtml}
                </div>
            ` : ''}
        </div>
    `;
    
    // Store current item ID for edit modal
    if (window.itemsData) {
        window.itemsData.currentItemId = item.id;
    }
}

function closeViewItemModal() {
    const modal = document.getElementById('viewItemModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

function showNewItemModal() {
    const modal = document.getElementById('newItemModal');
    if (modal) {
        modal.classList.remove('hidden');
    }
    // Form will be populated by items-forms.js
}

function closeNewItemModal() {
    const modal = document.getElementById('newItemModal');
    if (modal) {
        modal.classList.add('hidden');
    }
    const form = document.getElementById('newItemForm');
    if (form) {
        form.reset();
    }
}

function showEditItemModal(itemId) {
    const modal = document.getElementById('editItemModal');
    if (!modal) return;
    
    // Store current item ID
    if (window.itemsData) {
        window.itemsData.currentItemId = itemId;
    }
    
    modal.classList.remove('hidden');
    // Form will be populated by items-forms.js
}

function closeEditItemModal() {
    const modal = document.getElementById('editItemModal');
    if (modal) {
        modal.classList.add('hidden');
    }
    const form = document.getElementById('editItemForm');
    if (form) {
        form.reset();
    }
}

function showDeleteItemModal(itemId) {
    const modal = document.getElementById('deleteItemModal');
    if (!modal) return;
    
    // Store current item ID
    if (window.itemsData) {
        window.itemsData.currentItemId = itemId;
    }
    
    // Find item to show name
    if (window.itemsData && window.itemsData.items) {
        const item = window.itemsData.items.find(i => i.id === itemId);
        if (item) {
            const messageElement = document.getElementById('deleteItemMessage');
            if (messageElement) {
                messageElement.textContent = `¿Está seguro que desea eliminar el item "${item.productName || 'Sin nombre'}"? Esta acción no se puede deshacer.`;
            }
        }
    }
    
    modal.classList.remove('hidden');
}

function closeDeleteItemModal() {
    const modal = document.getElementById('deleteItemModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

async function confirmDeleteItem() {
    if (!window.itemsData || !window.itemsData.currentItemId) return;
    
    const itemId = window.itemsData.currentItemId;
    
    try {
        // Note: There's no delete endpoint in ItemController, so we'll need to add it
        // For now, we'll show an error
        if (window.showErrorToast) {
            window.showErrorToast('Error', 'La funcionalidad de eliminar items aún no está implementada');
        }
        closeDeleteItemModal();
    } catch (error) {
        console.error('Error deleting item:', error);
        if (window.showErrorToast) {
            window.showErrorToast('Error', 'No se pudo eliminar el item');
        }
    }
}

// Export functions globally
window.loadItemsData = loadItemsData;
window.showViewItemModal = showViewItemModal;
window.closeViewItemModal = closeViewItemModal;
window.showNewItemModal = showNewItemModal;
window.closeNewItemModal = closeNewItemModal;
window.showEditItemModal = showEditItemModal;
window.closeEditItemModal = closeEditItemModal;
window.showDeleteItemModal = showDeleteItemModal;
window.closeDeleteItemModal = closeDeleteItemModal;
window.confirmDeleteItem = confirmDeleteItem;

