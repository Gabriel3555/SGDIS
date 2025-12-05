// User Inventory Items - Load and display items from an inventory
let currentInventoryId = null;
let currentPage = 0;
let pageSize = 6;
let totalPages = 0;
let inventoryInfo = null;
let userInventoryRole = null; // 'owner', 'manager', 'signatory', or null

// Make userInventoryRole globally accessible for modals
window.userInventoryRole = userInventoryRole;

// Get inventory ID from URL
function getInventoryIdFromUrl() {
    const path = window.location.pathname;
    const match = path.match(/\/user\/inventory\/(\d+)/);
    return match ? parseInt(match[1]) : null;
}

// Load inventory information and user role
async function loadInventoryInfo() {
    try {
        const token = localStorage.getItem('jwt');
        if (!token) {
            window.location.href = '/';
            return;
        }

        // Try to get inventory info from API
        const response = await fetch(`/api/v1/inventory/${currentInventoryId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            inventoryInfo = await response.json();
            const inventoryNameHeader = document.getElementById('inventoryNameHeader');
            if (inventoryNameHeader) {
                inventoryNameHeader.textContent = inventoryInfo.name || 'Items del Inventario';
            }
            // Also set it in itemsData for modals
            if (window.itemsData) {
                window.itemsData.currentInventoryId = currentInventoryId;
            }
        }

        // Check user role in this inventory
        await checkUserInventoryRole();
    } catch (error) {
        console.error('Error loading inventory info:', error);
    }
}

// Check user role in the current inventory
async function checkUserInventoryRole() {
    try {
        const token = localStorage.getItem('jwt');
        if (!token) {
            return;
        }

        // Check if user is owner
        const ownedResponse = await fetch('/api/v1/users/me/inventories/owner', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (ownedResponse.ok) {
            const ownedInventories = await ownedResponse.json();
            if (ownedInventories.some(inv => inv.id === currentInventoryId)) {
                userInventoryRole = 'owner';
                window.userInventoryRole = 'owner';
                return;
            }
        }

        // Check if user is signatory
        const signatoryResponse = await fetch('/api/v1/users/me/inventories/signatory', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (signatoryResponse.ok) {
            const signatoryInventories = await signatoryResponse.json();
            if (signatoryInventories.some(inv => inv.id === currentInventoryId)) {
                userInventoryRole = 'signatory';
                window.userInventoryRole = 'signatory';
                return;
            }
        }

        // Check if user is manager (but not owner)
        const managedResponse = await fetch('/api/v1/users/me/inventories', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (managedResponse.ok) {
            const managedInventories = await managedResponse.json();
            if (managedInventories.some(inv => inv.id === currentInventoryId)) {
                userInventoryRole = 'manager';
                window.userInventoryRole = 'manager';
                return;
            }
        }

        userInventoryRole = null;
        window.userInventoryRole = null;
    } catch (error) {
        console.error('Error checking user inventory role:', error);
        userInventoryRole = null;
    }
}

// Load items from inventory
async function loadItems(page = 0) {
    const loadingState = document.getElementById('loadingState');
    const itemsContainer = document.getElementById('itemsContainer');
    const emptyState = document.getElementById('emptyState');
    const paginationContainer = document.getElementById('paginationContainer');

    try {
        loadingState.style.display = 'block';
        itemsContainer.style.display = 'none';
        emptyState.style.display = 'none';
        paginationContainer.style.display = 'none';

        const token = localStorage.getItem('jwt');
        if (!token) {
            window.location.href = '/';
            return;
        }

        const response = await fetch(
            `/api/v1/items/inventory/${currentInventoryId}?page=${page}&size=${pageSize}`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (response.status === 401) {
            localStorage.removeItem('jwt');
            window.location.href = '/';
            return;
        }

        if (!response.ok) {
            throw new Error(`Error al cargar items: ${response.status}`);
        }

        const data = await response.json();
        const items = data.content || [];
        totalPages = data.totalPages || 0;
        currentPage = data.number || 0;

        // Initialize itemsData for modals to work
        if (!window.itemsData) {
            window.itemsData = {
                items: [],
                currentInventoryId: currentInventoryId,
                viewMode: 'cards'
            };
        }
        window.itemsData.items = items;
        window.itemsData.currentInventoryId = currentInventoryId;

        // Update stats (async, but we don't need to wait)
        updateStats(items).catch(err => console.error('Error updating stats:', err));

        // Display items
        if (items.length === 0) {
            emptyState.style.display = 'block';
            itemsContainer.style.display = 'none';
        } else {
            displayItems(items);
            itemsContainer.style.display = 'block';
            emptyState.style.display = 'none';
        }

        // Display pagination
        if (totalPages > 1) {
            displayPagination();
            paginationContainer.style.display = 'flex';
        } else {
            paginationContainer.style.display = 'none';
        }

        loadingState.style.display = 'none';

    } catch (error) {
        console.error('Error loading items:', error);
        loadingState.style.display = 'none';
        emptyState.style.display = 'block';
        emptyState.innerHTML = `
            <i class="fas fa-exclamation-triangle text-6xl text-red-400 mb-4"></i>
            <h3 class="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">Error al cargar items</h3>
            <p class="text-gray-600 dark:text-gray-400 mb-4">${error.message}</p>
            <button onclick="loadItems(${currentPage})" class="px-6 py-3 bg-sena-verde hover:bg-sena-verde-oscuro text-white rounded-xl transition-colors">
                <i class="fas fa-redo mr-2"></i>
                Reintentar
            </button>
        `;
    }
}

// Update statistics
async function updateStats(items) {
    try {
        const token = localStorage.getItem('jwt');
        if (!token) {
            return;
        }

        // Fetch statistics from API
        const response = await fetch(
            `/api/v1/items/inventory/${currentInventoryId}/statistics`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (response.ok) {
            const stats = await response.json();
            document.getElementById('totalItems').textContent = stats.totalItems || 0;
            document.getElementById('activeItems').textContent = stats.activeItems || 0;
            document.getElementById('inactiveItems').textContent = stats.inactiveItems || 0;
        } else {
            // Fallback to page stats if API fails
            const total = items.length;
            const active = items.filter(item => item.status).length;
            const inactive = items.filter(item => !item.status).length;
            document.getElementById('totalItems').textContent = total;
            document.getElementById('activeItems').textContent = active;
            document.getElementById('inactiveItems').textContent = inactive;
        }
    } catch (error) {
        console.error('Error loading statistics:', error);
        // Fallback to page stats
    const total = items.length;
    const active = items.filter(item => item.status).length;
    const inactive = items.filter(item => !item.status).length;
    document.getElementById('totalItems').textContent = total;
    document.getElementById('activeItems').textContent = active;
    document.getElementById('inactiveItems').textContent = inactive;
    }
}

// Helper function to create image with loading spinner (similar to items-ui.js)
function createItemImageWithSpinner(imgUrl, alt, className, size = "w-24 h-24", shape = "rounded-lg", itemId = null) {
    if (!imgUrl) {
        return `<div class="${size} ${shape} bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-400 dark:text-gray-500">
            <i class="fas fa-box text-2xl"></i>
        </div>`;
    }

    const uniqueId = "img-" + Math.random().toString(36).substr(2, 9);
    return `
        <div class="relative ${size} ${shape} overflow-hidden">
            <div class="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800" id="spinner-${uniqueId}">
                <div class="image-loading-spinner"></div>
            </div>
            <img src="${imgUrl}" alt="${alt}" class="${className} opacity-0 transition-opacity duration-300" 
                 id="img-${uniqueId}"
                 onload="(function() { const img = document.getElementById('img-${uniqueId}'); const spinner = document.getElementById('spinner-${uniqueId}'); if (img) img.classList.remove('opacity-0'); if (spinner) spinner.style.display='none'; })();"
                 onerror="this.src='../../svg/box.png'; document.getElementById('spinner-${uniqueId}').style.display='none';">
        </div>
    `;
}

// Display items with cards like admin view
function displayItems(items) {
    const container = document.getElementById('itemsContainer');

    if (items.length === 0) {
        container.innerHTML = `
            <div class="col-span-full text-center py-12">
                <i class="fas fa-inbox text-6xl text-gray-400 mb-4"></i>
                <h3 class="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">No hay items</h3>
                <p class="text-gray-600 dark:text-gray-400">Este inventario no tiene items registrados.</p>
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
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-shadow p-4 cursor-pointer border border-gray-200 dark:border-gray-700" onclick="if(window.showViewItemModal) { showViewItemModal(${item.id}); }">
                <div class="flex items-start gap-4 mb-4" onclick="event.stopPropagation()">
                    ${createItemImageWithSpinner(imageUrl, productName, 'w-full h-full object-cover', 'w-20 h-20', 'rounded-lg', item.id)}
                    <div class="flex-1">
                        <h3 class="font-semibold text-gray-800 dark:text-gray-100 mb-1">${escapeHtml(productName)}</h3>
                        <p class="text-xs text-gray-500 dark:text-gray-400">${escapeHtml(item.licencePlateNumber || 'N/A')}</p>
                    </div>
                </div>
                <div class="space-y-2 text-sm mb-4">
                    <div class="flex justify-between">
                        <span class="text-gray-600 dark:text-gray-400">Fecha de adquisición:</span>
                        <span class="font-medium text-gray-800 dark:text-gray-200">${acquisitionDate}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-600 dark:text-gray-400">Valor:</span>
                        <span class="font-medium text-gray-800 dark:text-gray-200">${acquisitionValue}</span>
                    </div>
                </div>
                <div class="flex flex-wrap gap-1.5 justify-start">
                    <button onclick="event.stopPropagation(); if(window.showViewItemModal) { showViewItemModal(${item.id}); }" class="px-2.5 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs transition-colors" title="Ver detalles">
                        <i class="fas fa-eye"></i>
                    </button>
                    ${(userInventoryRole === 'owner' || userInventoryRole === 'signatory') ? `
                    <button onclick="event.stopPropagation(); if(window.showLendItemModal) { showLendItemModal(${item.id}); }" class="px-2.5 py-1.5 bg-teal-500 hover:bg-teal-600 text-white rounded-lg text-xs transition-colors" title="Prestar Item">
                        <i class="fas fa-hand-holding"></i>
                    </button>
                    ` : ''}
                    <button onclick="event.stopPropagation(); if(window.showTransferItemModal) { showTransferItemModal(${item.id}); }" class="px-2.5 py-1.5 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-xs transition-colors" title="Transferir Item">
                        <i class="fas fa-exchange-alt"></i>
                    </button>
                    <button onclick="event.stopPropagation(); if(window.showItemTransferHistoryModal) { showItemTransferHistoryModal(${item.id}); }" class="px-2.5 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-xs transition-colors" title="Historial de Transferencias">
                        <i class="fas fa-history"></i>
                    </button>
                    <button onclick="event.stopPropagation(); if(window.showItemLoansHistoryModal) { showItemLoansHistoryModal(${item.id}); }" class="px-2.5 py-1.5 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg text-xs transition-colors" title="Historial de Préstamos">
                        <i class="fas fa-hand-holding"></i>
                    </button>
                </div>
            </div>
        `;
    });
    
    cardsHtml += '</div>';
    container.innerHTML = cardsHtml;
}

// Display pagination
function displayPagination() {
    const container = document.getElementById('paginationContainer');
    
    let paginationHTML = '';

    // Previous button
    paginationHTML += `
        <button onclick="changePage(${currentPage - 1})" 
            ${currentPage === 0 ? 'disabled' : ''}
            class="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 ${currentPage === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50 dark:hover:bg-gray-700'} text-gray-700 dark:text-gray-300">
            <i class="fas fa-chevron-left"></i>
        </button>
    `;

    // Page numbers
    const maxVisible = 5;
    let startPage = Math.max(0, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages - 1, startPage + maxVisible - 1);
    
    if (endPage - startPage < maxVisible - 1) {
        startPage = Math.max(0, endPage - maxVisible + 1);
    }

    if (startPage > 0) {
        paginationHTML += `
            <button onclick="changePage(0)" class="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300">1</button>
        `;
        if (startPage > 1) {
            paginationHTML += `<span class="px-2 text-gray-500">...</span>`;
        }
    }

    for (let i = startPage; i <= endPage; i++) {
        paginationHTML += `
            <button onclick="changePage(${i})" 
                class="px-4 py-2 rounded-lg border ${i === currentPage ? 'bg-sena-verde text-white border-sena-verde' : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'}">
                ${i + 1}
            </button>
        `;
    }

    if (endPage < totalPages - 1) {
        if (endPage < totalPages - 2) {
            paginationHTML += `<span class="px-2 text-gray-500">...</span>`;
        }
        paginationHTML += `
            <button onclick="changePage(${totalPages - 1})" class="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300">${totalPages}</button>
        `;
    }

    // Next button
    paginationHTML += `
        <button onclick="changePage(${currentPage + 1})" 
            ${currentPage >= totalPages - 1 ? 'disabled' : ''}
            class="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 ${currentPage >= totalPages - 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50 dark:hover:bg-gray-700'} text-gray-700 dark:text-gray-300">
            <i class="fas fa-chevron-right"></i>
        </button>
    `;

    container.innerHTML = paginationHTML;
}

// Change page
function changePage(page) {
    if (page >= 0 && page < totalPages) {
        currentPage = page;
        loadItems(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async function() {
    currentInventoryId = getInventoryIdFromUrl();
    
    if (!currentInventoryId) {
        alert('ID de inventario no válido');
        window.location.href = '/user/my-inventories';
        return;
    }

    // Load inventory info and check user role first
    await loadInventoryInfo();
    // Then load items (which will use userInventoryRole)
    loadItems(0);
});

