// Transfers User-Specific Functions

// Initialize user transfers data
let transfersUserData = {
    transfers: [],
    userInventories: [],
    currentPage: 0,
    pageSize: 6,
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
 * Loads all inventories from the user's institution
 */
async function loadAllInventoriesFromUserInstitution() {
    try {
        const token = localStorage.getItem('jwt');
        if (!token) {
            throw new Error('No authentication token found');
        }

        // Use endpoint that automatically gets inventories from current user's institution
        const inventoriesResponse = await fetch('/api/v1/inventory/institutionAdminInventories?page=0&size=1000', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (inventoriesResponse.ok) {
            const data = await inventoriesResponse.json();
            return Array.isArray(data.content) ? data.content : (Array.isArray(data) ? data : []);
        } else {
            throw new Error('Error al cargar los inventarios de la institución');
        }
    } catch (error) {
        console.error('Error loading inventories from user institution:', error);
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

        // Load transfers for all inventories using the new endpoint
        const token = localStorage.getItem('jwt');
        const headers = { 
            'Content-Type': 'application/json'
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        let allTransfers = [];
        try {
            const response = await fetch('/api/v1/transfers/my-inventories', {
                method: 'GET',
                headers: headers
            });
            
            if (response.ok) {
                allTransfers = await response.json();
                if (!Array.isArray(allTransfers)) {
                    allTransfers = [];
                }
            } else {
                console.error('Error loading transfers from user inventories:', response.status);
            }
        } catch (error) {
            console.error('Error loading transfers from user inventories:', error);
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

        // Sort by ID descending (highest ID first, lowest ID last)
        filteredTransfers.sort((a, b) => {
            const idA = a.id || 0;
            const idB = b.id || 0;
            return idB - idA; // Descending order (highest first)
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
    const currentSearchTerm = window.transfersUserData.filters.searchTerm || '';
    
    container.innerHTML = `
        <div class="flex flex-col sm:flex-row gap-4 flex-1 items-end">
            <!-- Search Bar -->
            <div class="relative flex-1" style="min-width: 250px;">
                <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Buscar</label>
                <div class="relative">
                    <i class="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500"></i>
                    <input type="text" 
                           id="transferSearchUser"
                           placeholder="Buscar por origen, destino, estado..." 
                           value="${currentSearchTerm}"
                           class="w-full px-4 py-3 pl-10 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#00AF00]"
                           style="height: 56px;"
                           onkeyup="if(event.key === 'Enter') handleUserTransferSearch()">
                </div>
            </div>
            
            <!-- Status Filter -->
            <div class="relative" style="min-width: 180px; flex-shrink: 0;">
                <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Estado</label>
            <select id="transferStatusFilter" 
                onchange="handleUserTransferStatusFilterChange(this.value)"
                    class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#00AF00]"
                    style="height: 56px;">
                <option value="all">Todos los estados</option>
                <option value="PENDING" ${window.transfersUserData.filters.status === 'PENDING' ? 'selected' : ''}>Pendientes</option>
                <option value="APPROVED" ${window.transfersUserData.filters.status === 'APPROVED' ? 'selected' : ''}>Aprobadas</option>
                <option value="REJECTED" ${window.transfersUserData.filters.status === 'REJECTED' ? 'selected' : ''}>Rechazadas</option>
            </select>
            </div>
            
            <!-- Inventory Filter -->
            <div class="relative" style="min-width: 180px; flex-shrink: 0;">
                <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Inventario</label>
            <select id="transferInventoryFilter" 
                onchange="handleUserTransferInventoryFilterChange(this.value)"
                    class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#00AF00]"
                    style="height: 56px;">
                <option value="">Todos los inventarios</option>
                ${inventories.map(inv => `
                    <option value="${inv.id}" ${window.transfersUserData.filters.inventoryId === inv.id.toString() ? 'selected' : ''}>
                        ${inv.name || `Inventario ${inv.id}`}
                    </option>
                `).join('')}
            </select>
            </div>
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
 * Handles search input
 */
function handleUserTransferSearch() {
    if (!window.transfersUserData) return;
    const searchInput = document.getElementById('transferSearchUser');
    if (searchInput) {
        window.transfersUserData.filters.searchTerm = searchInput.value;
        window.transfersUserData.currentPage = 0;
        loadUserTransfersData();
    }
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
 * Shows new transfer modal with user-specific form
 */
async function showNewTransferModalUser() {
    const modal = document.getElementById('newTransferModal');
    if (!modal) return;
    
    modal.classList.remove('hidden');
    await populateUserNewTransferForm();
}

/**
 * Populates the new transfer form with dropdowns for user role
 */
async function populateUserNewTransferForm(itemId = null) {
    const form = document.getElementById('newTransferForm');
    if (!form) return;
    
    // Show loading state
    form.innerHTML = `
        <div class="space-y-4">
            <div class="flex items-center justify-center py-8">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00AF00]"></div>
            </div>
        </div>
    `;
    
    try {
        // Load all inventories from user's institution for destination dropdown
        const inventories = await loadAllInventoriesFromUserInstitution();
        
        // Build form with plate/serial input
        form.innerHTML = `
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Item a Transferir *</label>
                    <div class="flex gap-2">
                        <input type="text" 
                            id="newTransferItemPlateOrSerial" 
                            class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00AF00]"
                            placeholder="Placa o Serial del item"
                            required>
                        <button type="button" 
                            onclick="handleUserTransferItemSearch()"
                            class="px-4 py-2 bg-[#00AF00] hover:bg-[#008800] text-white rounded-xl transition-colors">
                            <i class="fas fa-search"></i>
                        </button>
                    </div>
                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Ingresa la placa o serial del item que deseas transferir</p>
                    <div id="newTransferItemInfo" class="hidden mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                        <p class="text-sm text-blue-800 dark:text-blue-300" id="newTransferItemInfoText"></p>
                    </div>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Inventario de Destino *</label>
                    <select id="newTransferDestinationInventoryId" 
                        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00AF00]"
                        required>
                        <option value="">Seleccionar inventario...</option>
                        ${inventories.map(inv => `
                            <option value="${inv.id}">
                                ${inv.name || `Inventario ${inv.id}`}
                            </option>
                        `).join('')}
                    </select>
                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Selecciona el inventario de destino</p>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Detalles / Observaciones</label>
                    <textarea id="newTransferDetails" 
                        rows="4" 
                        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00AF00]" 
                        placeholder="Detalles adicionales sobre la transferencia (opcional, máximo 500 caracteres)"
                        maxlength="500"></textarea>
                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Información adicional sobre la transferencia</p>
                </div>
                
                <input type="hidden" id="newTransferItemIdHidden" value="">
            </div>

            <div class="flex gap-3 pt-4">
                <button type="button" onclick="closeNewTransferModal()" 
                    class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    Cancelar
                </button>
                <button type="submit" id="userTransferSubmitBtn"
                    class="flex-1 px-4 py-2 bg-gray-400 hover:bg-gray-500 text-white rounded-xl transition-colors cursor-not-allowed" 
                    disabled>
                    Solicitar Transferencia
                </button>
            </div>
        `;
        
        // Add event listener to form
        const formElement = document.getElementById('newTransferForm');
        if (formElement) {
            // Remove existing listeners
            const newForm = formElement.cloneNode(true);
            formElement.parentNode.replaceChild(newForm, formElement);
            // Add our submit handler
            newForm.addEventListener('submit', handleUserNewTransferSubmit);
        }
        
        // Add automatic search with debounce and Enter key handler
        const plateInput = document.getElementById('newTransferItemPlateOrSerial');
        if (plateInput) {
            let debounceTimer;
            
            // Auto-search on input with debounce (500ms delay)
            plateInput.addEventListener('input', function(e) {
                const value = e.target.value.trim();
                
                // Clear previous timer
                clearTimeout(debounceTimer);
                
                // Clear item info if input is empty
                if (!value) {
                    const itemInfoDiv = document.getElementById('newTransferItemInfo');
                    const itemIdHidden = document.getElementById('newTransferItemIdHidden');
                    const submitButton = document.getElementById('userTransferSubmitBtn');
                    if (itemInfoDiv) {
                        itemInfoDiv.classList.add('hidden');
                        const itemInfoText = document.getElementById('newTransferItemInfoText');
                        if (itemInfoText) itemInfoText.textContent = '';
                    }
                    if (itemIdHidden) itemIdHidden.value = '';
                    if (submitButton) {
                        submitButton.disabled = true;
                        submitButton.className = 'flex-1 px-4 py-2 bg-gray-400 hover:bg-gray-500 text-white rounded-xl transition-colors cursor-not-allowed';
                    }
                    return;
                }
                
                // Only search if value has at least 3 characters (to avoid searching short numbers)
                // Also check if it's not just a number (numbers are usually IDs, not plates)
                const isOnlyNumbers = /^\d+$/.test(value);
                // For numbers, require at least 6 characters (to avoid searching IDs)
                // For text (plates with letters), require 3 characters
                const minLength = isOnlyNumbers ? 6 : 3;
                
                // Don't search if it's a very long number (likely an ID, not a plate)
                const maxLength = isOnlyNumbers ? 20 : 50;
                
                if (value.length >= minLength && value.length <= maxLength) {
                    // Show loading state
                    const itemInfoDiv = document.getElementById('newTransferItemInfo');
                    const itemInfoText = document.getElementById('newTransferItemInfoText');
                    if (itemInfoDiv && itemInfoText) {
                        itemInfoDiv.classList.remove('hidden');
                        itemInfoText.textContent = 'Buscando...';
                        itemInfoDiv.className = 'mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl';
                    }
                    
                    // Debounce: wait 500ms after user stops typing
                    debounceTimer = setTimeout(() => {
                        handleUserTransferItemSearch();
                    }, 500);
                } else if (value.length > 0) {
                    // Clear previous results if input is too short
                    const itemInfoDiv = document.getElementById('newTransferItemInfo');
                    if (itemInfoDiv) {
                        itemInfoDiv.classList.add('hidden');
                        const itemInfoText = document.getElementById('newTransferItemInfoText');
                        if (itemInfoText) itemInfoText.textContent = '';
                    }
                }
            });
            
            // Also allow Enter key to search immediately
            plateInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    clearTimeout(debounceTimer);
                    handleUserTransferItemSearch();
                }
            });
        }
    } catch (error) {
        console.error('Error populating user transfer form:', error);
        form.innerHTML = `
            <div class="space-y-4">
                <div class="text-center py-8">
                    <i class="fas fa-exclamation-triangle text-red-500 text-4xl mb-4"></i>
                    <p class="text-red-600 dark:text-red-400 mb-2">Error al cargar el formulario</p>
                    <button onclick="populateUserNewTransferForm()" 
                        class="mt-4 bg-[#00AF00] hover:bg-[#008800] text-white font-semibold py-2 px-4 rounded-xl transition-colors">
                        Reintentar
                    </button>
                </div>
            </div>
        `;
    }
}

/**
 * Loads all items from user inventories
 */
async function loadAllUserItems(inventories) {
    if (!inventories || inventories.length === 0) {
        return [];
    }
    
    const allItems = [];
    const token = localStorage.getItem('jwt');
    const headers = { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
    
    // Load items from all inventories in parallel
    const itemPromises = inventories.map(async (inventory) => {
        try {
            const response = await fetch(`/api/v1/items/inventory/${inventory.id}?page=0&size=1000`, {
                method: 'GET',
                headers: headers
            });
            
            if (response.ok) {
                const data = await response.json();
                const items = data.content || data || [];
                // Add inventory info to each item
                return items.map(item => ({
                    ...item,
                    inventoryId: inventory.id,
                    inventoryName: inventory.name
                }));
            }
            return [];
        } catch (error) {
            console.error(`Error loading items from inventory ${inventory.id}:`, error);
            return [];
        }
    });
    
    const itemsArrays = await Promise.all(itemPromises);
    itemsArrays.forEach(items => {
        allItems.push(...items);
    });
    
    return allItems;
}

/**
 * Searches for item by plate or serial and validates ownership
 */
async function handleUserTransferItemSearch() {
    const plateOrSerialInput = document.getElementById('newTransferItemPlateOrSerial');
    const itemInfoDiv = document.getElementById('newTransferItemInfo');
    const itemInfoText = document.getElementById('newTransferItemInfoText');
    
    if (!plateOrSerialInput) return;
    
    const plateOrSerial = plateOrSerialInput.value.trim();
    if (!plateOrSerial) {
        const showToast = window.showInventoryErrorToast || window.showErrorToast;
        if (typeof showToast === 'function') {
            showToast('Error', 'Por favor ingresa una placa o serial', true, 4000);
        }
        return;
    }
    
    // Show loading state
    if (itemInfoDiv && itemInfoText) {
        itemInfoDiv.classList.remove('hidden');
        itemInfoText.textContent = 'Buscando item...';
        itemInfoDiv.className = 'mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl';
    }
    
    try {
        const token = localStorage.getItem('jwt');
        if (!token) {
            throw new Error('No authentication token found');
        }
        
        let item = null;
        
        // Try to get item by licence plate first
        let response = await fetch(`/api/v1/items/licence-plate/${encodeURIComponent(plateOrSerial)}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            item = await response.json();
        } else if (response.status === 404 || response.status === 400) {
            // Try by serial if not found by plate
            response = await fetch(`/api/v1/items/serial/${encodeURIComponent(plateOrSerial)}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                item = await response.json();
            } else if (response.status === 404 || response.status === 400) {
                // Item not found - show toast instead of error
                const errorMessage = 'No se encontró un item con esa placa o serial';
                if (itemInfoDiv && itemInfoText) {
                    itemInfoText.innerHTML = `
                        <i class="fas fa-exclamation-circle text-yellow-600 dark:text-yellow-400 mr-2"></i>
                        ${errorMessage}
                    `;
                    itemInfoDiv.className = 'mt-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl';
                }
                // Show toast notification
                // Use available toast functions (check multiple sources)
                const showToast = window.showInventoryWarningToast || 
                                 window.showWarningToast || 
                                 (typeof showInventoryWarningToast !== 'undefined' ? showInventoryWarningToast : null) ||
                                 (typeof showWarningToast !== 'undefined' ? showWarningToast : null);
                if (typeof showToast === 'function') {
                    showToast('Item no encontrado', errorMessage, true, 4000);
                } else {
                    // Fallback: show in info div only
                    console.log('Toast functions not available, showing in info div only');
                }
                throw new Error(errorMessage);
            } else {
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.message || 'Error al buscar el item por serial';
                const showToast = window.showInventoryErrorToast || window.showErrorToast;
                if (typeof showToast === 'function') {
                    showToast('Error de búsqueda', errorMessage, true, 5000);
                }
                throw new Error(errorMessage);
            }
        } else {
            const errorData = await response.json().catch(() => ({}));
            const errorMessage = errorData.message || 'Error al buscar el item por placa';
            const showToast = window.showInventoryErrorToast || window.showErrorToast;
            if (typeof showToast === 'function') {
                showToast('Error de búsqueda', errorMessage, true, 5000);
            }
            throw new Error(errorMessage);
        }
        
        if (!item || !item.id) {
            const errorMessage = 'No se pudo obtener la información del item';
            const showToast = window.showInventoryErrorToast || window.showErrorToast;
            if (typeof showToast === 'function') {
                showToast('Error', errorMessage, true, 5000);
            }
            throw new Error(errorMessage);
        }
        
        // Verify that user is owner or signatory of the item's inventory
        const userInventories = await loadUserInventoriesForTransfers();
        const itemInventoryId = item.inventoryId || item.inventory?.id;
        
        if (!itemInventoryId) {
            const errorMessage = 'El item no tiene un inventario asignado';
            if (typeof showErrorToast === 'function') {
                showErrorToast('Error de validación', errorMessage, true, 5000);
            }
            throw new Error(errorMessage);
        }
        
        // Check if user is owner or signatory of this inventory
        const userOwnedInventories = await fetch('/api/v1/users/me/inventories/owner', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        }).then(r => r.ok ? r.json() : []);
        
        const userSignatoryInventories = await fetch('/api/v1/users/me/inventories/signatory', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        }).then(r => r.ok ? r.json() : []);
        
        const isOwner = userOwnedInventories.some(inv => inv.id === itemInventoryId);
        const isSignatory = userSignatoryInventories.some(inv => inv.id === itemInventoryId);
        
        if (!isOwner && !isSignatory) {
            const errorMessage = 'No tienes permisos para transferir items de este inventario. Debes ser propietario o firmante del inventario.';
            if (itemInfoDiv && itemInfoText) {
                itemInfoText.innerHTML = `
                    <i class="fas fa-exclamation-triangle text-red-600 dark:text-red-400 mr-2"></i>
                    ${errorMessage}
                `;
                itemInfoDiv.className = 'mt-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl';
            }
            if (typeof showErrorToast === 'function') {
                showErrorToast('Sin permisos', errorMessage, true, 6000);
            }
            throw new Error(errorMessage);
        }
        
        // Store item ID in a hidden field for later use
        const hiddenItemId = document.getElementById('newTransferItemIdHidden');
        if (hiddenItemId) {
            hiddenItemId.value = item.id;
        } else {
            // Create hidden input if it doesn't exist
            const form = document.getElementById('newTransferForm');
            if (form) {
                const hiddenInput = document.createElement('input');
                hiddenInput.type = 'hidden';
                hiddenInput.id = 'newTransferItemIdHidden';
                hiddenInput.value = item.id;
                form.appendChild(hiddenInput);
            }
        }
        
        // Show item info
        if (itemInfoDiv && itemInfoText) {
            const itemName = item.productName || `Item ${item.id}`;
            const inventoryName = item.inventoryName || item.inventory?.name || 'Inventario desconocido';
            itemInfoText.innerHTML = `
                <i class="fas fa-check-circle text-green-600 dark:text-green-400 mr-2"></i>
                <strong>${itemName}</strong> - Inventario: ${inventoryName}
            `;
            itemInfoDiv.className = 'mt-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl';
        }
        
        // Enable submit button
        const submitButton = document.getElementById('userTransferSubmitBtn');
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.className = 'flex-1 px-4 py-2 bg-[#00AF00] hover:bg-[#008800] text-white rounded-xl transition-colors';
        }
        
        const showToast = window.showInventorySuccessToast || window.showSuccessToast;
        if (typeof showToast === 'function') {
            showToast('Item encontrado', 'El item ha sido encontrado y verificado', true, 4000);
        }
    } catch (error) {
        // Only log unexpected errors, not expected ones (404, 400, permission errors)
        const isExpectedError = error.message && (
            error.message.includes('No se encontró') ||
            error.message.includes('not found') ||
            error.message.includes('permisos') ||
            error.message.includes('permission') ||
            error.message.includes('Bad Request')
        );
        
        if (!isExpectedError) {
            console.error('Error searching item:', error);
        }
        
        // Show user-friendly message in the info div
        if (itemInfoDiv && itemInfoText) {
            let errorMessage = error.message || 'Error al buscar el item';
            
            // Translate common error messages
            if (errorMessage.includes('No se encontró') || errorMessage.includes('not found')) {
                errorMessage = 'Item no encontrado con esa placa o serial';
            } else if (errorMessage.includes('permisos') || errorMessage.includes('permission')) {
                errorMessage = 'No tienes permisos para transferir items de este inventario';
            } else if (errorMessage.includes('Bad Request') || errorMessage.includes('inválido')) {
                errorMessage = 'Placa o serial inválido. Verifica el formato e intenta nuevamente';
            } else if (errorMessage.includes('No authentication token')) {
                errorMessage = 'Error de autenticación. Por favor, recarga la página';
            }
            
            // Determine toast type based on error
            const isWarning = errorMessage.includes('no encontrado') || errorMessage.includes('inválido');
            const toastType = isWarning ? 'warning' : 'error';
            
            itemInfoText.innerHTML = `
                <i class="fas fa-exclamation-circle ${isWarning ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'} mr-2"></i>
                ${errorMessage}
            `;
            itemInfoDiv.className = `mt-2 p-3 ${isWarning ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800' : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'} rounded-xl`;
            
            // Show toast notification (only if not already shown above)
            if (!errorMessage.includes('No se encontró un item con esa placa o serial')) {
                const showToast = toastType === 'warning' 
                    ? (window.showInventoryWarningToast || window.showWarningToast || (typeof showInventoryWarningToast !== 'undefined' ? showInventoryWarningToast : null))
                    : (window.showInventoryErrorToast || window.showErrorToast || (typeof showInventoryErrorToast !== 'undefined' ? showInventoryErrorToast : null));
                if (typeof showToast === 'function') {
                    const toastTitle = isWarning ? 'Item no encontrado' : 'Error de búsqueda';
                    showToast(toastTitle, errorMessage, true, isWarning ? 4000 : 5000);
                }
            }
        } else {
            // If info div doesn't exist, show toast anyway
            const showToast = isExpectedError 
                ? (window.showInventoryWarningToast || window.showWarningToast || (typeof showInventoryWarningToast !== 'undefined' ? showInventoryWarningToast : null))
                : (window.showInventoryErrorToast || window.showErrorToast || (typeof showInventoryErrorToast !== 'undefined' ? showInventoryErrorToast : null));
            if (typeof showToast === 'function') {
                const toastTitle = isExpectedError ? 'Item no encontrado' : 'Error de búsqueda';
                showToast(toastTitle, error.message || 'No se pudo buscar el item', true, isExpectedError ? 4000 : 5000);
            }
        }
        
        // Clear hidden item ID
        const hiddenItemId = document.getElementById('newTransferItemIdHidden');
        if (hiddenItemId) {
            hiddenItemId.value = '';
        }
        
        // Disable submit button
        const submitButton = document.getElementById('userTransferSubmitBtn');
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.className = 'flex-1 px-4 py-2 bg-gray-400 hover:bg-gray-500 text-white rounded-xl transition-colors cursor-not-allowed';
        }
    }
}

/**
 * Handles item selection change - updates destination inventory dropdown
 */
async function handleUserTransferItemChange(itemId) {
    const itemSelect = document.getElementById('newTransferItemId');
    const destinationSelect = document.getElementById('newTransferDestinationInventoryId');
    
    if (!itemSelect || !destinationSelect) return;
    
    const selectedOption = itemSelect.options[itemSelect.selectedIndex];
    const sourceInventoryId = selectedOption ? parseInt(selectedOption.getAttribute('data-inventory-id')) : null;
    
    if (!sourceInventoryId) {
        destinationSelect.disabled = true;
        destinationSelect.innerHTML = '<option value="">Primero selecciona un item</option>';
        return;
    }
    
    // Show loading state
    destinationSelect.disabled = true;
    destinationSelect.innerHTML = '<option value="">Cargando inventarios...</option>';
    
    try {
        const token = localStorage.getItem('jwt');
        const headers = { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };
        
        // For USER role, get user's center (institution) and filter inventories by it
        let userInstitutionId = null;
        const currentUserRole = window.currentUserRole || (window.currentUserData && window.currentUserData.role);
        
        if (currentUserRole && currentUserRole.toUpperCase() === 'USER') {
            // Get current user to get their institution ID
            try {
                const userResponse = await fetch('/api/v1/users/me', {
                    method: 'GET',
                    headers: headers
                });
                
                if (userResponse.ok) {
                    const currentUser = await userResponse.json();
                    const institutionName = currentUser.institution;
                    
                    if (institutionName) {
                        // Get institution ID from institutions list
                        const institutionsResponse = await fetch('/api/v1/institutions', {
                            method: 'GET',
                            headers: headers
                        });
                        
                        if (institutionsResponse.ok) {
                            const institutions = await institutionsResponse.json();
                            const institution = institutions.find(inst => inst.name === institutionName);
                            if (institution) {
                                userInstitutionId = institution.institutionId || institution.id;
                            }
                        }
                    }
                }
            } catch (error) {
                console.warn('Could not get user institution, will use all inventories:', error);
            }
        }
        
        // Load all inventories from user's institution (not just assigned ones)
        // For USER role, use institutionAdminInventories endpoint to get all institution inventories
        const endpoint = '/api/v1/inventory/institutionAdminInventories?page=0&size=1000';
        
        const response = await fetch(endpoint, {
            method: 'GET',
            headers: headers
        });
        
        if (response.ok) {
            const payload = await response.json();
            
            // Handle both array and paginated response formats
            let inventories = [];
            if (Array.isArray(payload)) {
                inventories = payload;
            } else if (payload && Array.isArray(payload.content)) {
                inventories = payload.content;
            }
            
            // For USER role, filter inventories to only show those from user's center
            if (currentUserRole && currentUserRole.toUpperCase() === 'USER' && userInstitutionId) {
                inventories = inventories.filter(inv => inv.institutionId === userInstitutionId);
            }
            
            // Filter out source inventory
            const availableInventories = inventories.filter(inv => inv.id !== sourceInventoryId);
            
            if (availableInventories.length === 0) {
                destinationSelect.disabled = true;
                destinationSelect.innerHTML = '<option value="">No hay inventarios de destino disponibles</option>';
                return;
            }
            
            destinationSelect.disabled = false;
            destinationSelect.innerHTML = `
                <option value="">Seleccionar inventario destino...</option>
                ${availableInventories.map(inv => `
                    <option value="${inv.id}">${inv.name || `Inventario ${inv.id}`}${inv.location ? ' - ' + inv.location : ''}</option>
                `).join('')}
            `;
        } else {
            throw new Error('Error al cargar inventarios');
        }
    } catch (error) {
        console.error('Error loading destination inventories:', error);
        destinationSelect.disabled = true;
        destinationSelect.innerHTML = '<option value="">Error al cargar inventarios</option>';
        
        if (window.showErrorToast) {
            window.showErrorToast('Error', 'No se pudieron cargar los inventarios de destino');
        }
    }
}

/**
 * Handles new transfer form submission for user
 */
async function handleUserNewTransferSubmit(event) {
    event.preventDefault();
    
    // Get item ID from hidden input (set by search function)
    const hiddenItemId = document.getElementById('newTransferItemIdHidden');
    const itemId = hiddenItemId?.value?.trim();
    const destinationInventoryId = document.getElementById('newTransferDestinationInventoryId')?.value?.trim();
    const details = document.getElementById('newTransferDetails')?.value?.trim() || '';
    
    if (!itemId || !destinationInventoryId) {
        if (window.showErrorToast) {
            window.showErrorToast('Error', 'Por favor busca un item y completa todos los campos requeridos');
        }
        return;
    }
    
    const submitButton = event.target.querySelector('button[type="submit"]');
    const originalButtonText = submitButton ? submitButton.innerHTML : '';
    
    try {
        if (submitButton) {
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Procesando...';
            submitButton.disabled = true;
        }
        
        // Verify again that user is owner or signatory of the item's inventory
        const token = localStorage.getItem('jwt');
        if (!token) {
            throw new Error('No authentication token found');
        }
        
        // Get item to verify inventory ownership
        const itemResponse = await fetch(`/api/v1/items/${itemId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (itemResponse.ok) {
            const item = await itemResponse.json();
            const itemInventoryId = item.inventoryId || item.inventory?.id;
            
            if (itemInventoryId) {
                // Check if user is owner or signatory
                const [ownedResponse, signatoryResponse] = await Promise.all([
                    fetch('/api/v1/users/me/inventories/owner', {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    }),
                    fetch('/api/v1/users/me/inventories/signatory', {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    })
                ]);
                
                const ownedInventories = ownedResponse.ok ? await ownedResponse.json() : [];
                const signatoryInventories = signatoryResponse.ok ? await signatoryResponse.json() : [];
                
                const isOwner = ownedInventories.some(inv => inv.id === itemInventoryId);
                const isSignatory = signatoryInventories.some(inv => inv.id === itemInventoryId);
                
                if (!isOwner && !isSignatory) {
                    throw new Error('No tienes permisos para transferir items de este inventario. Debes ser propietario o firmante del inventario.');
                }
            }
        }
        
        const transferData = {
            itemId: parseInt(itemId),
            destinationInventoryId: parseInt(destinationInventoryId),
            details: details
        };
        
        const response = await window.requestTransfer(transferData);
        
        if (window.showSuccessToast) {
            window.showSuccessToast('Transferencia Solicitada', response.message || 'La transferencia ha sido solicitada exitosamente');
        }
        
        closeNewTransferModal();
        
        // Reload transfers data
        if (window.loadUserTransfersData) {
            await window.loadUserTransfersData();
        }
    } catch (error) {
        // Only log unexpected errors
        const isExpectedError = error.message && (
            error.message.includes('Ya existe una transferencia pendiente') ||
            error.message.includes('transferencia pendiente') ||
            error.message.includes('already exists')
        );
        
        if (!isExpectedError) {
            console.error('Error requesting transfer:', error);
        }
        
        // Show toast notification
        const showToast = window.showInventoryErrorToast || window.showErrorToast || 
                         (typeof showInventoryErrorToast !== 'undefined' ? showInventoryErrorToast : null);
        if (typeof showToast === 'function') {
            let errorMessage = error.message || 'No se pudo solicitar la transferencia';
            let errorTitle = 'Error';
            
            // Customize message for common errors
            if (errorMessage.includes('Ya existe una transferencia pendiente')) {
                errorTitle = 'Transferencia Pendiente';
                errorMessage = 'Ya existe una transferencia pendiente para este ítem. Espera a que se procese la transferencia actual.';
            }
            
            showToast(errorTitle, errorMessage, true, 6000);
        } else {
            // Fallback: show alert if toast is not available
            alert(error.message || 'No se pudo solicitar la transferencia');
        }
    } finally {
        if (submitButton) {
            submitButton.innerHTML = originalButtonText;
            submitButton.disabled = false;
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
    
    // Clear form
    const form = document.getElementById('newTransferForm');
    if (form) {
        form.innerHTML = '';
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
    
    // Override showNewTransferModal for user role
    window.showNewTransferModal = showNewTransferModalUser;
    
    // Load transfers data
    loadUserTransfersData();
});

// Export functions globally
window.loadUserTransfersData = loadUserTransfersData;
window.updateUserTransfersUI = updateUserTransfersUI;
window.handleUserTransferSearch = handleUserTransferSearch;
window.handleUserTransferSearch = handleUserTransferSearch;
window.handleUserTransferStatusFilterChange = handleUserTransferStatusFilterChange;
window.handleUserTransferInventoryFilterChange = handleUserTransferInventoryFilterChange;
window.setUserTransfersViewMode = setUserTransfersViewMode;
window.changeUserTransfersPage = changeUserTransfersPage;
window.viewUserTransfer = viewUserTransfer;
window.showNewTransferModalUser = showNewTransferModalUser;
window.populateUserNewTransferForm = populateUserNewTransferForm;
window.handleUserTransferItemSearch = handleUserTransferItemSearch;
window.handleUserTransferItemChange = handleUserTransferItemChange;
window.handleUserNewTransferSubmit = handleUserNewTransferSubmit;
window.closeNewTransferModal = closeNewTransferModal;
window.closeViewTransferModal = closeViewTransferModal;
window.closeApproveTransferModal = closeApproveTransferModal;

