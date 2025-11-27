// Transfers User-Specific Functions

// Initialize user transfers data
let transfersUserData = {
    transfers: [],
    userInventories: [],
    currentPage: 0,
    pageSize: 10,
    totalPages: 0,
    totalElements: 0,
    viewMode: 'table', // 'table' or 'cards'
    currentTransferId: null,
    filters: {
        status: 'all',
        inventoryId: '',
        searchTerm: ''
    }
};

// Export globally
window.transfersUserData = transfersUserData;

/**
 * Loads all user inventories (owner, managed, signatory)
 */
async function loadUserInventoriesForTransfers() {
    try {
        const token = localStorage.getItem('jwt');
        if (!token) {
            throw new Error('No authentication token found');
        }

        const headers = { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };

        // Load all three types of inventories in parallel
        const [ownedResponse, managedResponse, signatoryResponse] = await Promise.all([
            fetch('/api/v1/users/me/inventories/owner', {
                method: 'GET',
                headers: headers
            }),
            fetch('/api/v1/users/me/inventories', {
                method: 'GET',
                headers: headers
            }),
            fetch('/api/v1/users/me/inventories/signatory', {
                method: 'GET',
                headers: headers
            })
        ]);

        if (ownedResponse.status === 401 || managedResponse.status === 401 || signatoryResponse.status === 401) {
            localStorage.removeItem('jwt');
            window.location.href = '/';
            return [];
        }

        const ownedInventories = ownedResponse.ok ? await ownedResponse.json() : [];
        const managedInventories = managedResponse.ok ? await managedResponse.json() : [];
        const signatoryInventories = signatoryResponse.ok ? await signatoryResponse.json() : [];

        // Combine all inventories and remove duplicates by ID
        const allInventoriesMap = new Map();
        
        [...ownedInventories, ...managedInventories, ...signatoryInventories].forEach(inv => {
            if (inv && inv.id) {
                allInventoriesMap.set(inv.id, inv);
            }
        });

        window.transfersUserData.userInventories = Array.from(allInventoriesMap.values());
        return window.transfersUserData.userInventories;
    } catch (error) {
        console.error('Error loading user inventories:', error);
        return [];
    }
}

/**
 * Loads transfers for all user inventories
 */
async function loadUserTransfersData() {
    if (!window.transfersUserData) {
        window.transfersUserData = transfersUserData;
    }

    const container = document.getElementById('transferTableContainer');
    const statsContainer = document.getElementById('transferStatsContainer');
    
    // Show loading state
    if (container) {
        container.innerHTML = `
            <div class="animate-pulse space-y-4">
                <div class="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                <div class="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                <div class="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
            </div>
        `;
    }

    try {
        // Load user inventories first
        const inventories = await loadUserInventoriesForTransfers();
        
        if (!inventories || inventories.length === 0) {
            if (container) {
                container.innerHTML = `
                    <div class="text-center py-12">
                        <i class="fas fa-info-circle text-blue-500 dark:text-blue-400 text-4xl mb-4"></i>
                        <p class="text-gray-600 dark:text-gray-400 text-lg mb-2">No tienes inventarios asignados</p>
                        <p class="text-gray-500 dark:text-gray-500 text-sm">Contacta a un administrador para que te asigne inventarios</p>
                    </div>
                `;
            }
            // Clear stats
            if (statsContainer) {
                statsContainer.innerHTML = '';
            }
            return;
        }

        // Load transfers for all inventories
        const allTransfers = [];
        const inventoryIds = inventories.map(inv => inv.id);
        
        for (const inventoryId of inventoryIds) {
            try {
                const transfers = await window.fetchTransfersByInventory(inventoryId);
                if (Array.isArray(transfers)) {
                // Note: Transfer data already includes inventory names from API
                    allTransfers.push(...transfers);
                }
            } catch (error) {
                console.error(`Error loading transfers for inventory ${inventoryId}:`, error);
            }
        }

        // Apply filters
        let filteredTransfers = allTransfers;
        
        // Filter by status
        if (window.transfersUserData.filters.status && window.transfersUserData.filters.status !== 'all') {
            filteredTransfers = filteredTransfers.filter(t => t.status === window.transfersUserData.filters.status);
        }
        
        // Filter by inventory
        if (window.transfersUserData.filters.inventoryId) {
            const inventoryId = parseInt(window.transfersUserData.filters.inventoryId);
            filteredTransfers = filteredTransfers.filter(t => 
                t.sourceInventoryId === inventoryId ||
                t.destinationInventoryId === inventoryId
            );
        }
        
        // Filter by search term
        if (window.transfersUserData.filters.searchTerm) {
            const searchTerm = window.transfersUserData.filters.searchTerm.toLowerCase();
            filteredTransfers = filteredTransfers.filter(t => 
                (t.sourceInventoryName && t.sourceInventoryName.toLowerCase().includes(searchTerm)) ||
                (t.destinationInventoryName && t.destinationInventoryName.toLowerCase().includes(searchTerm)) ||
                (t.itemName && t.itemName.toLowerCase().includes(searchTerm)) ||
                (t.status && t.status.toLowerCase().includes(searchTerm)) ||
                (t.details && t.details.toLowerCase().includes(searchTerm))
            );
        }

        // Sort by requested date (newest first)
        filteredTransfers.sort((a, b) => {
            const dateA = new Date(a.requestedAt || 0);
            const dateB = new Date(b.requestedAt || 0);
            return dateB - dateA;
        });

        // Update transfers data
        window.transfersUserData.transfers = filteredTransfers;
        window.transfersUserData.totalElements = filteredTransfers.length;
        window.transfersUserData.totalPages = Math.ceil(filteredTransfers.length / window.transfersUserData.pageSize);
        
        // Update UI
        updateUserTransfersUI();
    } catch (error) {
        console.error("Error loading user transfers:", error);
        if (container) {
            container.innerHTML = `
                <div class="text-center py-12">
                    <i class="fas fa-exclamation-triangle text-red-500 text-4xl mb-4"></i>
                    <p class="text-red-600 dark:text-red-400 mb-2">Error al cargar las transferencias</p>
                    <button onclick="loadUserTransfersData()" 
                        class="mt-4 bg-[#00AF00] hover:bg-[#008800] text-white font-semibold py-2 px-4 rounded-xl transition-colors">
                        Reintentar
                    </button>
                </div>
            `;
        }
    }
}

/**
 * Updates the UI for user transfers
 */
function updateUserTransfersUI() {
    if (!window.transfersUserData) return;
    
    updateUserTransfersStats();
    updateUserTransfersFilters();
    updateUserTransfersViewModeButtons();
    
    if (window.transfersUserData.viewMode === 'cards') {
        updateUserTransfersCards();
    } else {
        updateUserTransfersTable();
    }
    
    updateUserTransfersPagination();
}

/**
 * Updates transfer statistics for user
 */
function updateUserTransfersStats() {
    const container = document.getElementById('transferStatsContainer');
    if (!container || !window.transfersUserData) {
        return;
    }
    
    const transfers = window.transfersUserData.transfers || [];
    
    const totalTransfers = transfers.length;
    const pendingTransfers = transfers.filter(t => t.status === 'PENDING').length;
    const approvedTransfers = transfers.filter(t => t.status === 'APPROVED').length;
    const rejectedTransfers = transfers.filter(t => t.status === 'REJECTED').length;
    
    container.innerHTML = `
        <div class="stat-card">
            <div class="flex items-start justify-between gap-3 mb-3">
                <div class="min-w-0 flex-1">
                    <p class="text-gray-600 dark:text-gray-400 text-sm font-medium mb-1">Total Transferencias</p>
                    <h3 class="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100 truncate">${totalTransfers}</h3>
                </div>
                <div class="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                    <i class="fas fa-exchange-alt text-blue-600 dark:text-blue-400 text-lg sm:text-xl"></i>
                </div>
            </div>
            <p class="text-blue-600 dark:text-blue-400 text-sm font-medium">Transferencias registradas</p>
        </div>

        <div class="stat-card">
            <div class="flex items-start justify-between gap-3 mb-3">
                <div class="min-w-0 flex-1">
                    <p class="text-gray-600 dark:text-gray-400 text-sm font-medium mb-1">Pendientes</p>
                    <h3 class="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100 truncate">${pendingTransfers}</h3>
                </div>
                <div class="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                    <i class="fas fa-clock text-yellow-600 dark:text-yellow-400 text-lg sm:text-xl"></i>
                </div>
            </div>
            <p class="text-yellow-600 dark:text-yellow-400 text-sm font-medium">Esperando aprobación</p>
        </div>

        <div class="stat-card">
            <div class="flex items-start justify-between gap-3 mb-3">
                <div class="min-w-0 flex-1">
                    <p class="text-gray-600 dark:text-gray-400 text-sm font-medium mb-1">Aprobadas</p>
                    <h3 class="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100 truncate">${approvedTransfers}</h3>
                </div>
                <div class="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                    <i class="fas fa-check-circle text-green-600 dark:text-green-400 text-lg sm:text-xl"></i>
                </div>
            </div>
            <p class="text-green-600 dark:text-green-400 text-sm font-medium">Transferencias completadas</p>
        </div>

        <div class="stat-card">
            <div class="flex items-start justify-between gap-3 mb-3">
                <div class="min-w-0 flex-1">
                    <p class="text-gray-600 dark:text-gray-400 text-sm font-medium mb-1">Rechazadas</p>
                    <h3 class="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100 truncate">${rejectedTransfers}</h3>
                </div>
                <div class="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                    <i class="fas fa-times-circle text-red-600 dark:text-red-400 text-lg sm:text-xl"></i>
                </div>
            </div>
            <p class="text-red-600 dark:text-red-400 text-sm font-medium">Transferencias rechazadas</p>
        </div>
    `;
}

/**
 * Updates filters UI for user transfers
 */
function updateUserTransfersFilters() {
    const container = document.getElementById('searchFilterContainer');
    if (!container || !window.transfersUserData) {
        return;
    }

    const inventories = window.transfersUserData.userInventories || [];
    
    container.innerHTML = `
        <div class="flex flex-col sm:flex-row gap-4 flex-1">
            <select id="transferStatusFilter" 
                onchange="handleUserTransferStatusFilterChange(this.value)"
                class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#00AF00]">
                <option value="all">Todos los estados</option>
                <option value="PENDING" ${window.transfersUserData.filters.status === 'PENDING' ? 'selected' : ''}>Pendientes</option>
                <option value="APPROVED" ${window.transfersUserData.filters.status === 'APPROVED' ? 'selected' : ''}>Aprobadas</option>
                <option value="REJECTED" ${window.transfersUserData.filters.status === 'REJECTED' ? 'selected' : ''}>Rechazadas</option>
            </select>
            
            <select id="transferInventoryFilter" 
                onchange="handleUserTransferInventoryFilterChange(this.value)"
                class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#00AF00]">
                <option value="">Todos los inventarios</option>
                ${inventories.map(inv => `
                    <option value="${inv.id}" ${window.transfersUserData.filters.inventoryId === inv.id.toString() ? 'selected' : ''}>
                        ${inv.name || `Inventario ${inv.id}`}
                    </option>
                `).join('')}
            </select>
        </div>
    `;
}

/**
 * Updates view mode buttons
 */
function updateUserTransfersViewModeButtons() {
    const container = document.getElementById('viewModeButtonsContainer');
    if (!container || !window.transfersUserData) {
        return;
    }

    container.innerHTML = `
        <div class="flex gap-2 mb-4">
            <button onclick="setUserTransfersViewMode('table')"
                class="px-4 py-2 rounded-xl transition-colors ${window.transfersUserData.viewMode === 'table' 
                    ? 'bg-[#00AF00] text-white' 
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'}">
                <i class="fas fa-table mr-2"></i>
                Tabla
            </button>
            <button onclick="setUserTransfersViewMode('cards')"
                class="px-4 py-2 rounded-xl transition-colors ${window.transfersUserData.viewMode === 'cards' 
                    ? 'bg-[#00AF00] text-white' 
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'}">
                <i class="fas fa-th-large mr-2"></i>
                Tarjetas
            </button>
        </div>
    `;
}

/**
 * Updates transfers table view
 */
function updateUserTransfersTable() {
    const container = document.getElementById('transferTableContainer');
    if (!container || !window.transfersUserData) {
        return;
    }

    const transfers = window.transfersUserData.transfers || [];
    const startIndex = window.transfersUserData.currentPage * window.transfersUserData.pageSize;
    const endIndex = Math.min(startIndex + window.transfersUserData.pageSize, transfers.length);
    const pageTransfers = transfers.slice(startIndex, endIndex);

    if (pageTransfers.length === 0) {
        container.innerHTML = `
            <div class="text-center py-12">
                <i class="fas fa-inbox text-gray-400 dark:text-gray-500 text-4xl mb-4"></i>
                <p class="text-gray-600 dark:text-gray-400 text-lg">No se encontraron transferencias</p>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="overflow-x-auto">
            <table class="w-full">
                <thead>
                    <tr class="border-b border-gray-200 dark:border-gray-700">
                        <th class="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Item</th>
                        <th class="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Origen</th>
                        <th class="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Destino</th>
                        <th class="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Estado</th>
                        <th class="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Fecha</th>
                        <th class="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${pageTransfers.map(transfer => `
                        <tr class="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                            <td class="py-3 px-4">
                                <div class="font-medium text-gray-800 dark:text-gray-200">
                                    ${transfer.itemName || 'N/A'}
                                </div>
                            </td>
                            <td class="py-3 px-4 text-gray-600 dark:text-gray-400">
                                ${transfer.sourceInventoryName || 'N/A'}
                            </td>
                            <td class="py-3 px-4 text-gray-600 dark:text-gray-400">
                                ${transfer.destinationInventoryName || 'N/A'}
                            </td>
                            <td class="py-3 px-4">
                                <span class="px-2 py-1 rounded-full text-xs font-medium ${
                                    transfer.status === 'APPROVED' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                    transfer.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                    'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                }">
                                    ${transfer.status === 'APPROVED' ? 'Aprobada' :
                                      transfer.status === 'PENDING' ? 'Pendiente' :
                                      'Rechazada'}
                                </span>
                            </td>
                            <td class="py-3 px-4 text-gray-600 dark:text-gray-400 text-sm">
                                ${transfer.requestedAt ? new Date(transfer.requestedAt).toLocaleDateString('es-ES') : 'N/A'}
                            </td>
                            <td class="py-3 px-4">
                                <button onclick="viewUserTransfer(${transfer.id})"
                                    class="text-[#00AF00] hover:text-[#008800] transition-colors">
                                    <i class="fas fa-eye"></i>
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

/**
 * Updates transfers cards view
 */
function updateUserTransfersCards() {
    const container = document.getElementById('transferTableContainer');
    if (!container || !window.transfersUserData) {
        return;
    }

    const transfers = window.transfersUserData.transfers || [];
    const startIndex = window.transfersUserData.currentPage * window.transfersUserData.pageSize;
    const endIndex = Math.min(startIndex + window.transfersUserData.pageSize, transfers.length);
    const pageTransfers = transfers.slice(startIndex, endIndex);

    if (pageTransfers.length === 0) {
        container.innerHTML = `
            <div class="text-center py-12">
                <i class="fas fa-inbox text-gray-400 dark:text-gray-500 text-4xl mb-4"></i>
                <p class="text-gray-600 dark:text-gray-400 text-lg">No se encontraron transferencias</p>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            ${pageTransfers.map(transfer => `
                <div class="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
                    <div class="flex items-start justify-between mb-3">
                        <div class="flex-1">
                            <h3 class="font-semibold text-gray-800 dark:text-gray-200 mb-1">
                                ${transfer.itemName || 'N/A'}
                            </h3>
                            <p class="text-sm text-gray-600 dark:text-gray-400">
                                ${transfer.sourceInventoryName || 'N/A'} → ${transfer.destinationInventoryName || 'N/A'}
                            </p>
                        </div>
                        <span class="px-2 py-1 rounded-full text-xs font-medium ${
                            transfer.status === 'APPROVED' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                            transfer.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                            'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        }">
                            ${transfer.status === 'APPROVED' ? 'Aprobada' :
                              transfer.status === 'PENDING' ? 'Pendiente' :
                              'Rechazada'}
                        </span>
                    </div>
                    <div class="text-xs text-gray-500 dark:text-gray-500 mb-3">
                        ${transfer.requestedAt ? new Date(transfer.requestedAt).toLocaleDateString('es-ES') : 'N/A'}
                    </div>
                    <button onclick="viewUserTransfer(${transfer.id})"
                        class="w-full bg-[#00AF00] hover:bg-[#008800] text-white font-semibold py-2 px-4 rounded-xl transition-colors">
                        Ver Detalles
                    </button>
                </div>
            `).join('')}
        </div>
    `;
}

/**
 * Updates pagination
 */
function updateUserTransfersPagination() {
    const container = document.getElementById('paginationContainer');
    if (!container || !window.transfersUserData) {
        return;
    }

    const { currentPage, totalPages, totalElements, pageSize } = window.transfersUserData;
    const startItem = currentPage * pageSize + 1;
    const endItem = Math.min((currentPage + 1) * pageSize, totalElements);

    container.innerHTML = `
        <div class="text-sm text-gray-600 dark:text-gray-400">
            Mostrando ${startItem}-${endItem} de ${totalElements} transferencias
        </div>
        <div class="flex gap-2">
            <button onclick="changeUserTransfersPage(${currentPage - 1})"
                ${currentPage === 0 ? 'disabled' : ''}
                class="px-3 py-2 rounded-xl ${currentPage === 0 
                    ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed' 
                    : 'bg-[#00AF00] hover:bg-[#008800] text-white'} transition-colors">
                <i class="fas fa-chevron-left"></i>
            </button>
            <span class="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-xl text-gray-700 dark:text-gray-300">
                ${currentPage + 1} / ${totalPages || 1}
            </span>
            <button onclick="changeUserTransfersPage(${currentPage + 1})"
                ${currentPage >= totalPages - 1 ? 'disabled' : ''}
                class="px-3 py-2 rounded-xl ${currentPage >= totalPages - 1 
                    ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed' 
                    : 'bg-[#00AF00] hover:bg-[#008800] text-white'} transition-colors">
                <i class="fas fa-chevron-right"></i>
            </button>
        </div>
    `;
}

/**
 * Handles status filter change
 */
function handleUserTransferStatusFilterChange(status) {
    if (!window.transfersUserData) return;
    window.transfersUserData.filters.status = status;
    window.transfersUserData.currentPage = 0;
    loadUserTransfersData();
}

/**
 * Handles inventory filter change
 */
function handleUserTransferInventoryFilterChange(inventoryId) {
    if (!window.transfersUserData) return;
    window.transfersUserData.filters.inventoryId = inventoryId;
    window.transfersUserData.currentPage = 0;
    loadUserTransfersData();
}

/**
 * Sets view mode
 */
function setUserTransfersViewMode(mode) {
    if (window.transfersUserData) {
        window.transfersUserData.viewMode = mode;
        updateUserTransfersUI();
    }
}

/**
 * Changes page
 */
function changeUserTransfersPage(page) {
    if (window.transfersUserData && page >= 0 && page < window.transfersUserData.totalPages) {
        window.transfersUserData.currentPage = page;
        updateUserTransfersUI();
    }
}

/**
 * Views a transfer
 */
function viewUserTransfer(transferId) {
    if (!window.transfersUserData) return;
    
    const transfer = window.transfersUserData.transfers.find(t => t.id === transferId);
    if (!transfer) return;

    // Use existing modal function if available
    if (window.showViewTransferModal) {
        // Temporarily add transfer to transfersData for the modal to find it
        if (!window.transfersData) {
            window.transfersData = { transfers: [] };
        }
        window.transfersData.transfers = [transfer];
        window.showViewTransferModal(transferId);
    } else if (window.populateViewTransferModal) {
        // Use populateViewTransferModal directly
        const modal = document.getElementById('viewTransferModal');
        if (modal) {
            modal.classList.remove('hidden');
            window.populateViewTransferModal(transfer);
        }
    } else {
        // Fallback: show basic info
        alert(`Transferencia #${transferId}\nItem: ${transfer.item?.name || 'N/A'}\nEstado: ${transfer.status || 'N/A'}`);
    }
}

/**
 * Shows new transfer modal - overrides global function for user view
 */
function showNewTransferModalUser() {
    // Use existing modal function from transfers-modals.js
    if (window.showNewTransferModal) {
        window.showNewTransferModal();
    } else {
        const modal = document.getElementById('newTransferModal');
        if (modal) {
            modal.classList.remove('hidden');
            if (window.populateNewTransferForm) {
                window.populateNewTransferForm();
            }
        }
    }
}

/**
 * Closes new transfer modal
 */
function closeNewTransferModal() {
    const modal = document.getElementById('newTransferModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

/**
 * Closes view transfer modal
 */
function closeViewTransferModal() {
    const modal = document.getElementById('viewTransferModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

/**
 * Closes approve transfer modal
 */
function closeApproveTransferModal() {
    const modal = document.getElementById('approveTransferModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Initialize transfers user data
    if (!window.transfersUserData) {
        window.transfersUserData = transfersUserData;
    }
    
    // Load transfers data
    loadUserTransfersData();
});

// Export functions globally
window.loadUserTransfersData = loadUserTransfersData;
window.updateUserTransfersUI = updateUserTransfersUI;
window.handleUserTransferStatusFilterChange = handleUserTransferStatusFilterChange;
window.handleUserTransferInventoryFilterChange = handleUserTransferInventoryFilterChange;
window.setUserTransfersViewMode = setUserTransfersViewMode;
window.changeUserTransfersPage = changeUserTransfersPage;
window.viewUserTransfer = viewUserTransfer;
// Note: showNewTransferModal is already defined globally in transfers-modals.js
// We keep the close functions here for consistency
window.closeNewTransferModal = closeNewTransferModal;
window.closeViewTransferModal = closeViewTransferModal;
window.closeApproveTransferModal = closeApproveTransferModal;

