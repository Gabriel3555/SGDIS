// Items UI Functions

// Helper function to create image with loading spinner
function createItemImageWithSpinner(imgUrl, alt, className, size = "w-24 h-24", shape = "rounded-lg", itemId = null) {
    if (!imgUrl) {
        const uniqueId = "img-placeholder-" + Math.random().toString(36).substr(2, 9);
        const clickable = itemId ? `cursor-pointer hover:bg-gray-300 transition-colors` : '';
        const onClick = itemId ? `onclick="handleItemImageUploadClick(${itemId}, '${uniqueId}')"` : '';
        return `<div class="${size} ${shape} bg-gray-200 flex items-center justify-center text-gray-400 ${clickable}" id="${uniqueId}" ${onClick} title="${itemId ? 'Haz clic para subir imágenes' : ''}">
            <i class="fas fa-box text-2xl"></i>
            ${itemId ? '<input type="file" accept="image/*" multiple id="file-input-' + uniqueId + '" style="display: none;" onchange="handleItemImageFileSelect(event, ' + itemId + ', \'' + uniqueId + '\')">' : ''}
        </div>`;
    }

    const uniqueId = "img-" + Math.random().toString(36).substr(2, 9);
    const clickable = itemId ? `cursor-pointer hover:opacity-80 transition-opacity` : '';
    const onClick = itemId ? `onclick="handleItemImageUploadClick(${itemId}, '${uniqueId}')"` : '';
    const errorHandler = itemId 
        ? `onerror="handleItemImageError('${uniqueId}', ${itemId})"`
        : `onerror="handleItemImageError('${uniqueId}', null)"`;
    return `
        <div class="relative ${size} ${shape} overflow-hidden ${clickable}" id="img-container-${uniqueId}" ${onClick} title="${itemId ? 'Haz clic para subir imágenes' : ''}">
            <div class="absolute inset-0 flex items-center justify-center bg-gray-100" id="spinner-${uniqueId}">
                <div class="image-loading-spinner"></div>
            </div>
            <img src="${imgUrl}" alt="${alt}" class="${className} opacity-0 transition-opacity duration-300" 
                 id="img-${uniqueId}"
                 onload="(function() { const img = document.getElementById('img-${uniqueId}'); const spinner = document.getElementById('spinner-${uniqueId}'); if (img) img.classList.remove('opacity-0'); if (spinner) spinner.style.display='none'; })();"
                 ${errorHandler}>
            ${itemId ? '<input type="file" accept="image/*" multiple id="file-input-' + uniqueId + '" style="display: none;" onchange="handleItemImageFileSelect(event, ' + itemId + ', \'' + uniqueId + '\')">' : ''}
        </div>
    `;
}

function updateItemsUI() {
    if (!window.itemsData) return;
    
    updateItemsStats();
    updateItemsSearchAndFilters();
    updateItemsViewModeButtons();
    
    if (window.itemsData.viewMode === 'list') {
        updateItemsList();
    } else {
        updateItemsCards();
    }
    
    updateItemsPagination();
}

async function updateItemsStats() {
    const container = document.getElementById('itemsStatsContainer');
    if (!container || !window.itemsData || !window.itemsData.currentInventoryId) {
        return;
    }
    
    // Show loading state
    container.innerHTML = `
        <div class="stat-card">
            <div class="flex items-start justify-between mb-3">
                <div>
                    <p class="text-gray-600 text-sm font-medium mb-1">Cargando...</p>
                    <h3 class="text-3xl font-bold text-gray-800">-</h3>
                </div>
            </div>
        </div>
    `;
    
    try {
        const statistics = await window.fetchInventoryStatistics(window.itemsData.currentInventoryId);
        
        const totalItems = statistics.totalItems || 0;
        const totalValue = statistics.totalValue || 0;
        
        container.innerHTML = `
            <div class="stat-card">
                <div class="flex items-start justify-between gap-3 mb-3">
                    <div class="min-w-0 flex-1">
                        <p class="text-gray-600 text-sm font-medium mb-1">Total Items</p>
                        <h3 class="text-2xl sm:text-3xl font-bold text-gray-800 truncate">${totalItems}</h3>
                    </div>
                    <div class="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <i class="fas fa-cubes text-blue-600 text-lg sm:text-xl"></i>
                    </div>
                </div>
                <p class="text-blue-600 text-sm font-medium">Items en el inventario</p>
            </div>

            <div class="stat-card">
                <div class="flex items-start justify-between gap-3 mb-3">
                    <div class="min-w-0 flex-1">
                        <p class="text-gray-600 text-sm font-medium mb-1">Valor Total</p>
                        <h3 class="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 break-all" title="$${totalValue.toLocaleString('es-ES', {minimumFractionDigits: 0, maximumFractionDigits: 0})}">$${totalValue.toLocaleString('es-ES', {minimumFractionDigits: 0, maximumFractionDigits: 0})}</h3>
                    </div>
                    <div class="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <i class="fas fa-dollar-sign text-emerald-600 text-lg sm:text-xl"></i>
                    </div>
                </div>
                <p class="text-emerald-600 text-sm font-medium">Valor de adquisición</p>
            </div>
        `;
    } catch (error) {
        console.error('Error loading statistics:', error);
        // Show error state
        container.innerHTML = `
            <div class="stat-card">
                <div class="flex items-start justify-between mb-3">
                    <div>
                        <p class="text-red-600 text-sm font-medium mb-1">Error al cargar estadísticas</p>
                        <h3 class="text-3xl font-bold text-gray-800">-</h3>
                    </div>
                </div>
            </div>
        `;
    }
}

function updateItemsSearchAndFilters() {
    const container = document.getElementById('searchFilterContainer');
    if (!container) return;
    
    container.innerHTML = `
        <div class="flex-1 relative">
            <i class="fas fa-search absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
            <input type="text" id="itemSearch" 
                   placeholder="Buscar items por nombre, placa..." 
                   class="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00AF00] focus:border-[#00AF00] transition-all duration-200">
        </div>
        <button onclick="handleItemSearch()" class="px-4 py-3 border border-[#00AF00] text-white rounded-xl hover:bg-[#008800] transition-colors bg-[#00AF00] focus:outline-none focus:ring-2 focus:ring-[#00AF00]" title="Buscar">
            <i class="fas fa-search"></i>
            Buscar
        </button>
    `;
    
    // Add event listeners
    const searchInput = document.getElementById('itemSearch');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                handleItemSearch();
            }
        });
    }
}

function handleItemSearch() {
    const searchInput = document.getElementById('itemSearch');
    if (!searchInput || !window.itemsData) return;
    
    const searchTerm = searchInput.value.trim().toLowerCase();
    window.itemsData.searchTerm = searchTerm;
    
    // Filter items locally if we have them all loaded
    // Otherwise, reload from API with search
    if (window.itemsData.items && window.itemsData.items.length > 0) {
        filterItems();
    } else {
        loadItemsData();
    }
}

function filterItems() {
    if (!window.itemsData) return;
    
    const searchTerm = window.itemsData.searchTerm || '';
    const allItems = window.itemsData.items || [];
    
    if (!searchTerm) {
        // No search term, show all items
        updateItemsUI();
        return;
    }
    
    // Filter items
    const filteredItems = allItems.filter(item => {
        const productName = (item.productName || '').toLowerCase();
        const licencePlateNumber = (item.licencePlateNumber || '').toLowerCase();
        
        return productName.includes(searchTerm) || 
               licencePlateNumber.includes(searchTerm);
    });
    
    // Temporarily replace items for display
    const originalItems = window.itemsData.items;
    window.itemsData.items = filteredItems;
    
    updateItemsViewModeButtons();
    if (window.itemsData.viewMode === 'list') {
        updateItemsList();
    } else {
        updateItemsCards();
    }
    
    // Restore original items
    window.itemsData.items = originalItems;
}

function updateItemsViewModeButtons() {
    const container = document.getElementById('viewModeButtonsContainer');
    if (!container) return;
    
    const viewMode = window.itemsData ? window.itemsData.viewMode : 'cards';
    const isCardsActive = viewMode === 'cards';
    const isListActive = viewMode === 'list';
    
    container.innerHTML = `
        <div class="flex items-center gap-2">
            <button onclick="setItemsViewMode('cards')" class="flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                isCardsActive
                    ? "bg-[#00AF00] text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }">
                <i class="fas fa-th"></i>
                <span class="hidden sm:inline">Cards</span>
            </button>
            <button onclick="setItemsViewMode('list')" class="flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                isListActive
                    ? "bg-[#00AF00] text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }">
                <i class="fas fa-list"></i>
                <span class="hidden sm:inline">Lista</span>
            </button>
        </div>
    `;
}

function updateItemsCards() {
    const container = document.getElementById('itemsContainer');
    if (!container || !window.itemsData) return;
    
    const items = window.itemsData.items || [];
    
    if (items.length === 0) {
        container.innerHTML = `
            <div class="text-center py-12">
                <i class="fas fa-box text-gray-300 text-5xl mb-4"></i>
                <p class="text-gray-500 text-lg">No hay items en este inventario</p>
                <button onclick="showNewItemModal()" class="mt-4 bg-[#00AF00] hover:bg-[#008800] text-white font-semibold py-2 px-4 rounded-xl transition-colors">
                    <i class="fas fa-plus mr-2"></i>
                    Agregar Primer Item
                </button>
            </div>
        `;
        return;
    }
    
    let cardsHtml = '<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">';
    
    items.forEach(item => {
        const imageUrl = item.urlImg || (item.attributes && item.attributes.IMAGE) || null;
        const productName = item.productName || 'Sin nombre';
        const acquisitionDate = item.acquisitionDate ? new Date(item.acquisitionDate).toLocaleDateString('es-ES') : 'N/A';
        const acquisitionValue = item.acquisitionValue ? `$${item.acquisitionValue.toLocaleString('es-ES')}` : 'N/A';
        
        cardsHtml += `
            <div class="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-4 cursor-pointer" onclick="showViewItemModal(${item.id})">
                <div class="flex items-start gap-4 mb-4" onclick="event.stopPropagation()">
                    ${createItemImageWithSpinner(imageUrl, productName, 'w-full h-full object-cover', 'w-20 h-20', 'rounded-lg', item.id)}
                    <div class="flex-1">
                        <h3 class="font-semibold text-gray-800 mb-1">${productName}</h3>
                    </div>
                </div>
                <div class="space-y-2 text-sm mb-4">
                    <div class="flex justify-between">
                        <span class="text-gray-600">Fecha de adquisición:</span>
                        <span class="font-medium">${acquisitionDate}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-600">Valor:</span>
                        <span class="font-medium">${acquisitionValue}</span>
                    </div>
                </div>
                <div class="flex flex-wrap gap-1.5 justify-start">
                    <button onclick="event.stopPropagation(); showViewItemModal(${item.id})" class="px-2.5 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs transition-colors" title="Ver detalles">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button onclick="event.stopPropagation(); showEditItemModal(${item.id})" class="px-2.5 py-1.5 bg-[#00AF00] hover:bg-[#008800] text-white rounded-lg text-xs transition-colors" title="Editar Item">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="event.stopPropagation(); showLendItemModal(${item.id})" class="px-2.5 py-1.5 bg-teal-500 hover:bg-teal-600 text-white rounded-lg text-xs transition-colors" title="Prestar Item">
                        <i class="fas fa-hand-holding"></i>
                    </button>
                    <button onclick="event.stopPropagation(); showTransferItemModal(${item.id})" class="px-2.5 py-1.5 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-xs transition-colors" title="Transferir Item">
                        <i class="fas fa-exchange-alt"></i>
                    </button>
                    <button onclick="event.stopPropagation(); showApproveTransferModal(${item.id})" class="px-2.5 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs transition-colors" title="Aprobar Transferencia">
                        <i class="fas fa-check-circle"></i>
                    </button>
                    <button onclick="event.stopPropagation(); showItemTransferHistoryModal(${item.id})" class="px-2.5 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-xs transition-colors" title="Historial de Transferencias">
                        <i class="fas fa-history"></i>
                    </button>
                    <button onclick="event.stopPropagation(); showItemLoansHistoryModal(${item.id})" class="px-2.5 py-1.5 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg text-xs transition-colors" title="Historial de Préstamos">
                        <i class="fas fa-hand-holding"></i>
                    </button>
                    <button onclick="event.stopPropagation(); showDeleteItemModal(${item.id})" class="px-2.5 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs transition-colors" title="Eliminar Item">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    });
    
    cardsHtml += '</div>';
    container.innerHTML = cardsHtml;
}

function updateItemsList() {
    const container = document.getElementById('itemsContainer');
    if (!container || !window.itemsData) return;
    
    const items = window.itemsData.items || [];
    
    if (items.length === 0) {
        container.innerHTML = `
            <div class="text-center py-12">
                <i class="fas fa-box text-gray-300 text-5xl mb-4"></i>
                <p class="text-gray-500 text-lg">No hay items en este inventario</p>
                <button onclick="showNewItemModal()" class="mt-4 bg-[#00AF00] hover:bg-[#008800] text-white font-semibold py-2 px-4 rounded-xl transition-colors">
                    <i class="fas fa-plus mr-2"></i>
                    Agregar Primer Item
                </button>
            </div>
        `;
        return;
    }
    
    let listHtml = `
        <div class="overflow-x-auto">
            <table class="w-full">
                <thead>
                    <tr class="border-b border-gray-200">
                        <th class="text-left py-3 px-4 text-sm font-semibold text-gray-700">Imagen</th>
                        <th class="text-left py-3 px-4 text-sm font-semibold text-gray-700">Nombre</th>
                        <th class="text-left py-3 px-4 text-sm font-semibold text-gray-700">Fecha Adquisición</th>
                        <th class="text-left py-3 px-4 text-sm font-semibold text-gray-700">Valor</th>
                        <th class="text-center py-3 px-4 text-sm font-semibold text-gray-700">Acciones</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    items.forEach(item => {
        const imageUrl = item.urlImg || (item.attributes && item.attributes.IMAGE) || null;
        const productName = item.productName || 'Sin nombre';
        const acquisitionDate = item.acquisitionDate ? new Date(item.acquisitionDate).toLocaleDateString('es-ES') : 'N/A';
        const acquisitionValue = item.acquisitionValue ? `$${item.acquisitionValue.toLocaleString('es-ES')}` : 'N/A';
        
        listHtml += `
            <tr class="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td class="py-3 px-4">
                    ${createItemImageWithSpinner(imageUrl, productName, 'w-full h-full object-cover', 'w-12 h-12', 'rounded', item.id)}
                </td>
                <td class="py-3 px-4">
                    <span class="font-medium text-gray-800">${productName}</span>
                </td>
                <td class="py-3 px-4">
                    <span class="text-gray-600">${acquisitionDate}</span>
                </td>
                <td class="py-3 px-4">
                    <span class="font-medium text-gray-800">${acquisitionValue}</span>
                </td>
                <td class="py-3 px-4">
                    <div class="flex items-center justify-center gap-2">
                        <button onclick="showViewItemModal(${item.id})" class="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm transition-colors">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button onclick="showEditItemModal(${item.id})" class="px-3 py-1 bg-[#00AF00] hover:bg-[#008800] text-white rounded-lg text-sm transition-colors" title="Editar Item">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="showLendItemModal(${item.id})" class="px-3 py-1 bg-teal-500 hover:bg-teal-600 text-white rounded-lg text-sm transition-colors" title="Prestar Item">
                            <i class="fas fa-hand-holding"></i>
                        </button>
                        <button onclick="showTransferItemModal(${item.id})" class="px-3 py-1 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm transition-colors" title="Transferir Item">
                            <i class="fas fa-exchange-alt"></i>
                        </button>
                        <button onclick="showApproveTransferModal(${item.id})" class="px-3 py-1 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm transition-colors" title="Aprobar Transferencia">
                            <i class="fas fa-check-circle"></i>
                        </button>
                        <button onclick="showItemTransferHistoryModal(${item.id})" class="px-3 py-1 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm transition-colors" title="Historial de Transferencias">
                            <i class="fas fa-history"></i>
                        </button>
                        <button onclick="showItemLoansHistoryModal(${item.id})" class="px-3 py-1 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg text-sm transition-colors" title="Historial de Préstamos">
                            <i class="fas fa-hand-holding"></i>
                        </button>
                        <button onclick="showDeleteItemModal(${item.id})" class="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm transition-colors" title="Eliminar Item">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });
    
    listHtml += `
                </tbody>
            </table>
        </div>
    `;
    
    container.innerHTML = listHtml;
}

function updateItemsPagination() {
    const container = document.getElementById('itemsPaginationContainer');
    if (!container || !window.itemsData) return;
    
    const { currentPage, totalPages, totalElements } = window.itemsData;
    const startItem = currentPage * window.itemsData.pageSize + 1;
    const endItem = Math.min((currentPage + 1) * window.itemsData.pageSize, totalElements);
    
    let paginationHtml = `
        <div class="text-sm text-gray-600 dark:text-gray-400">
            Mostrando ${startItem}-${endItem} de ${totalElements} items
        </div>
        <div class="flex gap-2">
    `;
    
    // Previous button
    const prevDisabled = currentPage === 0;
    paginationHtml += `
        <button onclick="changeItemsPage(${currentPage - 1})" 
                ${prevDisabled ? 'disabled' : ''}
                class="px-4 py-2 rounded-xl transition-colors ${
                    prevDisabled 
                        ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed' 
                        : 'bg-[#00AF00] hover:bg-[#008800] text-white'
                }">
            <i class="fas fa-chevron-left"></i>
        </button>
    `;
    
    // Page numbers
    const maxPagesToShow = 5;
    let startPage = Math.max(0, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages - 1, startPage + maxPagesToShow - 1);
    
    if (endPage - startPage < maxPagesToShow - 1) {
        startPage = Math.max(0, endPage - maxPagesToShow + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
        const isActive = i === currentPage;
        paginationHtml += `
            <button onclick="changeItemsPage(${i})" 
                    class="px-4 py-2 rounded-xl transition-colors ${
                        isActive 
                            ? 'bg-[#00AF00] text-white' 
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }">
                ${i + 1}
            </button>
        `;
    }
    
    // Next button
    const nextDisabled = currentPage >= totalPages - 1;
    paginationHtml += `
        <button onclick="changeItemsPage(${currentPage + 1})" 
                ${nextDisabled ? 'disabled' : ''}
                class="px-4 py-2 rounded-xl transition-colors ${
                    nextDisabled 
                        ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed' 
                        : 'bg-[#00AF00] hover:bg-[#008800] text-white'
                }">
            <i class="fas fa-chevron-right"></i>
        </button>
    `;
    
    paginationHtml += '</div>';
    container.innerHTML = paginationHtml;
}

// Handle image error
function handleItemImageError(uniqueId, itemId) {
    const spinner = document.getElementById(`spinner-${uniqueId}`);
    const container = document.getElementById(`img-container-${uniqueId}`);
    if (spinner) spinner.style.display = 'none';
    if (container) {
        const clickable = itemId ? 'cursor-pointer hover:bg-gray-300' : '';
        const onClick = itemId ? `onclick="handleItemImageUploadClick(${itemId}, '${uniqueId}')"` : '';
        const fileInput = itemId ? `<input type="file" accept="image/*" multiple id="file-input-${uniqueId}" style="display: none;" onchange="handleItemImageFileSelect(event, ${itemId}, '${uniqueId}')">` : '';
        container.innerHTML = `<div class="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400 ${clickable}" id="${uniqueId}" ${onClick}>
            <i class="fas fa-box"></i>
            ${fileInput}
        </div>`;
    }
}

// Handle image upload click
function handleItemImageUploadClick(itemId, containerId) {
    if (!itemId) return;
    
    const fileInput = document.getElementById(`file-input-${containerId}`);
    if (fileInput) {
        fileInput.click();
    }
}

// Handle file selection for item image upload (supports multiple files)
async function handleItemImageFileSelect(event, itemId, containerId) {
    const files = Array.from(event.target.files);
    if (!files || files.length === 0) return;
    
    // Validate all files
    const validFiles = [];
    for (const file of files) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
            if (window.showErrorToast) {
                window.showErrorToast('Error', `El archivo "${file.name}" no es una imagen válida`);
            }
            continue;
        }
        
        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            if (window.showErrorToast) {
                window.showErrorToast('Error', `La imagen "${file.name}" excede el tamaño máximo de 5MB`);
            }
            continue;
        }
        
        validFiles.push(file);
    }
    
    if (validFiles.length === 0) return;
    
    // Show loading state
    const container = document.getElementById(containerId) || document.getElementById(`img-container-${containerId}`);
    const isViewModal = containerId && containerId.startsWith('view-item-image-');
    
    if (container) {
        const originalContent = container.innerHTML;
        container.innerHTML = `
            <div class="w-full h-full flex items-center justify-center bg-gray-100">
                <div class="text-center">
                    <div class="image-loading-spinner mx-auto mb-2"></div>
                    <p class="text-sm text-gray-600">Subiendo ${validFiles.length} imagen(es)...</p>
                </div>
            </div>
        `;
        
        try {
            // Upload all valid images
            if (window.uploadItemImage) {
                let successCount = 0;
                let errorCount = 0;
                
                for (const file of validFiles) {
                    try {
                        await window.uploadItemImage(itemId, file);
                        successCount++;
                    } catch (error) {
                        console.error(`Error uploading image ${file.name}:`, error);
                        errorCount++;
                    }
                }
                
                // Show success/error messages
                if (successCount > 0) {
                    if (window.showSuccessToast) {
                        window.showSuccessToast(
                            'Éxito', 
                            `${successCount} imagen(es) subida(s) correctamente${errorCount > 0 ? `. ${errorCount} fallaron.` : ''}`
                        );
                    }
                }
                
                if (errorCount > 0 && successCount === 0) {
                    if (window.showErrorToast) {
                        window.showErrorToast('Error', 'No se pudieron subir las imágenes');
                    }
                }
                
                // If in view modal, reload the modal content
                if (isViewModal && window.itemsData && window.itemsData.items) {
                    const item = window.itemsData.items.find(i => i.id === itemId);
                    if (item && window.populateViewItemModal) {
                        // Reload modal with updated images
                        if (window.showViewItemModal) {
                            setTimeout(async () => {
                                await window.showViewItemModal(itemId);
                            }, 500);
                        }
                    }
                } else {
                    // Reload items to show updated images
                    if (window.loadItemsData) {
                        await window.loadItemsData();
                    }
                }
            } else {
                throw new Error('uploadItemImage function not available');
            }
        } catch (error) {
            console.error('Error uploading item images:', error);
            
            // Restore original content
            container.innerHTML = originalContent;
            
            // Show error message
            if (window.showErrorToast) {
                window.showErrorToast('Error', error.message || 'No se pudieron subir las imágenes');
            }
        }
    }
    
    // Reset file input to allow selecting the same files again
    event.target.value = '';
}

// Export functions globally
window.updateItemsUI = updateItemsUI;
window.updateItemsStats = updateItemsStats;
window.updateItemsSearchAndFilters = updateItemsSearchAndFilters;
window.updateItemsCards = updateItemsCards;
window.updateItemsList = updateItemsList;
window.updateItemsPagination = updateItemsPagination;
window.handleItemSearch = handleItemSearch;
window.filterItems = filterItems;
window.handleItemImageError = handleItemImageError;
window.handleItemImageUploadClick = handleItemImageUploadClick;
window.handleItemImageFileSelect = handleItemImageFileSelect;

