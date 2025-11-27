// Transfers Modals Functions

async function loadTransfersData() {
    if (!window.transfersData) {
        console.error("Transfers data not initialized");
        return;
    }
    
    // Check if user is superadmin
    const isSuperAdmin = (window.currentUserRole && window.currentUserRole.toUpperCase() === 'SUPERADMIN') || 
                         (window.location.pathname && window.location.pathname.includes('/superadmin'));
    
    // If superadmin, load all transfers with pagination
    if (isSuperAdmin) {
        await loadAllTransfersForSuperAdmin();
        return;
    }
    
    // Try to get inventory ID from multiple sources
    const urlParams = new URLSearchParams(window.location.search);
    let inventoryId = urlParams.get('inventoryId') || 
                      window.transfersData.currentInventoryId ||
                      (window.inventoryData && window.inventoryData.currentInventoryId) ||
                      (window.itemsData && window.itemsData.currentInventoryId);
    
    // Convert to number if it's a string
    if (inventoryId) {
        inventoryId = typeof inventoryId === 'string' ? parseInt(inventoryId, 10) : inventoryId;
        if (isNaN(inventoryId)) {
            inventoryId = null;
        }
    }
    
    if (!inventoryId) {
        // Check for inventories with pending transfers
        await checkPendingTransfers();
        return;
    }
    
    window.transfersData.currentInventoryId = inventoryId;
    
    const container = document.getElementById('transferTableContainer');
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
        const transfers = await window.fetchTransfersByInventory(inventoryId);
        
        // Update transfers data
        window.transfersData.transfers = Array.isArray(transfers) ? transfers : [];
        window.transfersData.totalElements = window.transfersData.transfers.length;
        window.transfersData.totalPages = Math.ceil(window.transfersData.totalElements / window.transfersData.pageSize);
        
        // Update UI
        if (window.updateTransfersUI) {
            window.updateTransfersUI();
        }
    } catch (error) {
        console.error("Error loading transfers:", error);
        if (container) {
            container.innerHTML = `
                <div class="text-center py-12">
                    <i class="fas fa-exclamation-triangle text-red-500 text-4xl mb-4"></i>
                    <p class="text-red-600 dark:text-red-400">Error al cargar las transferencias</p>
                    <button onclick="loadTransfersData()" 
                        class="mt-4 bg-[#00AF00] hover:bg-[#008800] text-white font-semibold py-2 px-4 rounded-xl transition-colors">
                        Reintentar
                    </button>
                </div>
            `;
        }
        if (window.showErrorToast) {
            window.showErrorToast(
                "Error",
                "No se pudieron cargar las transferencias"
            );
        }
    }
}

/**
 * Loads all transfers for superadmin with pagination
 */
async function loadAllTransfersForSuperAdmin() {
    const container = document.getElementById('transferTableContainer');
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
        const page = window.transfersData.currentPage || 0;
        const size = window.transfersData.pageSize || 6;
        
        const response = await window.fetchAllTransfers(page, size);
        
        // Update transfers data
        window.transfersData.transfers = Array.isArray(response.content) ? response.content : [];
        window.transfersData.totalElements = response.totalElements || 0;
        window.transfersData.totalPages = response.totalPages || 0;
        window.transfersData.currentPage = response.number || 0;
        
        // Update UI
        if (window.updateTransfersUI) {
            window.updateTransfersUI();
        }
    } catch (error) {
        console.error("Error loading all transfers:", error);
        if (container) {
            container.innerHTML = `
                <div class="text-center py-12">
                    <i class="fas fa-exclamation-triangle text-red-500 text-4xl mb-4"></i>
                    <p class="text-red-600 dark:text-red-400">Error al cargar las transferencias</p>
                    <button onclick="loadTransfersData()" 
                        class="mt-4 bg-[#00AF00] hover:bg-[#008800] text-white font-semibold py-2 px-4 rounded-xl transition-colors">
                        Reintentar
                    </button>
                </div>
            `;
        }
        if (window.showErrorToast) {
            window.showErrorToast(
                "Error",
                "No se pudieron cargar las transferencias"
            );
        }
    }
}

/**
 * Checks for inventories with pending transfers and displays them
 */
async function checkPendingTransfers() {
    const container = document.getElementById('transferTableContainer');
    const statsContainer = document.getElementById('transferStatsContainer');
    
    // Show loading state
    if (container) {
        container.innerHTML = `
            <div class="text-center py-12">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00AF00] mx-auto mb-4"></div>
                <p class="text-gray-600 dark:text-gray-400">Buscando transferencias pendientes...</p>
            </div>
        `;
    }
    
    try {
        // Get available inventories
        const inventories = await window.fetchInventoriesForTransfers(0, 100);
        let inventoriesList = [];
        
        if (Array.isArray(inventories)) {
            inventoriesList = inventories;
        } else if (inventories && Array.isArray(inventories.content)) {
            inventoriesList = inventories.content;
        }
        
        if (inventoriesList.length === 0) {
            // No inventories available
            if (container) {
                container.innerHTML = `
                    <div class="text-center py-12">
                        <i class="fas fa-info-circle text-blue-500 dark:text-blue-400 text-4xl mb-4"></i>
                        <p class="text-gray-600 dark:text-gray-400 text-lg mb-2">No hay inventarios disponibles</p>
                        <p class="text-gray-500 dark:text-gray-500 text-sm">Selecciona un inventario del filtro para ver sus transferencias</p>
                    </div>
                `;
            }
            updateEmptyStats();
            return;
        }
        
        // Check each inventory for pending transfers
        const inventoriesWithPending = [];
        const pendingTransfersMap = new Map(); // Map to store pending transfers by inventory
        
        for (const inventory of inventoriesList) {
            try {
                const transfers = await window.fetchTransfersByInventory(inventory.id);
                const pendingTransfers = Array.isArray(transfers) 
                    ? transfers.filter(t => t.status === 'PENDING')
                    : [];
                
                if (pendingTransfers.length > 0) {
                    inventoriesWithPending.push({
                        id: inventory.id,
                        name: inventory.name || `Inventario ${inventory.id}`,
                        location: inventory.location || 'N/A',
                        pendingCount: pendingTransfers.length,
                        pendingTransfers: pendingTransfers
                    });
                    pendingTransfersMap.set(inventory.id, pendingTransfers);
                }
            } catch (error) {
                // Silently skip inventories that fail to load transfers
            }
        }
        
        // Display results
        if (inventoriesWithPending.length > 0) {
            // Show inventories with pending transfers
            if (container) {
                let html = `
                    <div class="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-200 dark:border-yellow-800 rounded-xl p-6 mb-6">
                        <div class="flex items-center gap-3 mb-4">
                            <i class="fas fa-exclamation-triangle text-yellow-600 dark:text-yellow-400 text-2xl"></i>
                            <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-100">
                                Inventarios con Transferencias Pendientes
                            </h3>
                        </div>
                        <div class="space-y-3">
                `;
                
                inventoriesWithPending.forEach(inv => {
                    const firstPending = inv.pendingTransfers[0];
                    html += `
                        <div class="bg-white dark:bg-gray-800 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800 shadow-sm">
                            <div class="flex items-center justify-between">
                                <div class="flex-1">
                                    <h4 class="font-semibold text-gray-800 dark:text-gray-100 mb-1">${inv.name}</h4>
                                    <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                        <i class="fas fa-map-marker-alt mr-1"></i>
                                        ${inv.location}
                                    </p>
                                    <div class="flex items-center gap-4">
                                        <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300">
                                            <i class="fas fa-clock mr-1"></i>
                                            ${inv.pendingCount} ${inv.pendingCount === 1 ? 'transferencia pendiente' : 'transferencias pendientes'}
                                        </span>
                                        ${firstPending ? `
                                            <span class="text-sm text-gray-600 dark:text-gray-400">
                                                Item: ${firstPending.itemName || `ID: ${firstPending.itemId}`}
                                            </span>
                                        ` : ''}
                                    </div>
                                </div>
                                <div class="flex gap-2 ml-4">
                                    <button onclick="viewInventoryTransfers(${inv.id})" 
                                        class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
                                        <i class="fas fa-eye"></i>
                                        Ver Transferencias
                                    </button>
                                    ${firstPending ? `
                                        <button onclick="showApproveTransferModal(${firstPending.id})" 
                                            class="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
                                            <i class="fas fa-check-circle"></i>
                                            Aprobar
                                        </button>
                                    ` : ''}
                                </div>
                            </div>
                        </div>
                    `;
                });
                
                html += `
                        </div>
                    </div>
                    <div class="text-center py-8 border-t border-gray-200 dark:border-gray-700 mt-6">
                        <p class="text-gray-600 dark:text-gray-400 mb-4">O selecciona un inventario del filtro para ver todas sus transferencias</p>
                    </div>
                `;
                
                container.innerHTML = html;
            }
            
            // Update stats with total pending count
            const totalPending = inventoriesWithPending.reduce((sum, inv) => sum + inv.pendingCount, 0);
            if (statsContainer) {
                statsContainer.innerHTML = `
                    <div class="stat-card">
                        <div class="flex items-start justify-between gap-3 mb-3">
                            <div class="min-w-0 flex-1">
                                <p class="text-gray-600 dark:text-gray-400 text-sm font-medium mb-1">Inventarios con Pendientes</p>
                                <h3 class="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100 truncate">${inventoriesWithPending.length}</h3>
                            </div>
                            <div class="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                                <i class="fas fa-boxes text-yellow-600 dark:text-yellow-400 text-lg sm:text-xl"></i>
                            </div>
                        </div>
                        <p class="text-yellow-600 dark:text-yellow-400 text-sm font-medium">Inventarios con transferencias pendientes</p>
                    </div>
                    <div class="stat-card">
                        <div class="flex items-start justify-between gap-3 mb-3">
                            <div class="min-w-0 flex-1">
                                <p class="text-gray-600 dark:text-gray-400 text-sm font-medium mb-1">Total Pendientes</p>
                                <h3 class="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100 truncate">${totalPending}</h3>
                            </div>
                            <div class="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                                <i class="fas fa-clock text-yellow-600 dark:text-yellow-400 text-lg sm:text-xl"></i>
                            </div>
                        </div>
                        <p class="text-yellow-600 dark:text-yellow-400 text-sm font-medium">Transferencias esperando aprobación</p>
                    </div>
                    <div class="stat-card">
                        <div class="flex items-start justify-between gap-3 mb-3">
                            <div class="min-w-0 flex-1">
                                <p class="text-gray-600 dark:text-gray-400 text-sm font-medium mb-1">Aprobadas</p>
                                <h3 class="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100 truncate">-</h3>
                            </div>
                            <div class="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                                <i class="fas fa-check-circle text-green-600 dark:text-green-400 text-lg sm:text-xl"></i>
                            </div>
                        </div>
                        <p class="text-green-600 dark:text-green-400 text-sm font-medium">Selecciona un inventario</p>
                    </div>
                    <div class="stat-card">
                        <div class="flex items-start justify-between gap-3 mb-3">
                            <div class="min-w-0 flex-1">
                                <p class="text-gray-600 dark:text-gray-400 text-sm font-medium mb-1">Rechazadas</p>
                                <h3 class="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100 truncate">-</h3>
                            </div>
                            <div class="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                                <i class="fas fa-times-circle text-red-600 dark:text-red-400 text-lg sm:text-xl"></i>
                            </div>
                        </div>
                        <p class="text-red-600 dark:text-red-400 text-sm font-medium">Selecciona un inventario</p>
                    </div>
                `;
            }
        } else {
            // No pending transfers found
            if (container) {
                container.innerHTML = `
                    <div class="text-center py-12">
                        <i class="fas fa-check-circle text-green-500 dark:text-green-400 text-4xl mb-4"></i>
                        <p class="text-gray-600 dark:text-gray-400 text-lg mb-2">No hay transferencias pendientes</p>
                        <p class="text-gray-500 dark:text-gray-500 text-sm mb-4">Todos los inventarios están al día</p>
                        <p class="text-gray-500 dark:text-gray-500 text-sm">Selecciona un inventario del filtro para ver todas sus transferencias</p>
                    </div>
                `;
            }
            updateEmptyStats();
        }
    } catch (error) {
        console.error("Error checking pending transfers:", error);
        if (container) {
            container.innerHTML = `
                <div class="text-center py-12">
                    <i class="fas fa-info-circle text-blue-500 dark:text-blue-400 text-4xl mb-4"></i>
                    <p class="text-gray-600 dark:text-gray-400 text-lg mb-2">Selecciona un inventario para ver sus transferencias</p>
                    <p class="text-gray-500 dark:text-gray-500 text-sm">Puedes acceder desde el módulo de inventarios</p>
                </div>
            `;
        }
        updateEmptyStats();
    }
}

/**
 * Updates stats to show empty state
 */
function updateEmptyStats() {
    const statsContainer = document.getElementById('transferStatsContainer');
    if (statsContainer) {
        statsContainer.innerHTML = `
            <div class="stat-card">
                <div class="flex items-start justify-between gap-3 mb-3">
                    <div class="min-w-0 flex-1">
                        <p class="text-gray-600 dark:text-gray-400 text-sm font-medium mb-1">Total Transferencias</p>
                        <h3 class="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100 truncate">-</h3>
                    </div>
                    <div class="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                        <i class="fas fa-exchange-alt text-blue-600 dark:text-blue-400 text-lg sm:text-xl"></i>
                    </div>
                </div>
                <p class="text-blue-600 dark:text-blue-400 text-sm font-medium">Selecciona un inventario</p>
            </div>
            <div class="stat-card">
                <div class="flex items-start justify-between gap-3 mb-3">
                    <div class="min-w-0 flex-1">
                        <p class="text-gray-600 dark:text-gray-400 text-sm font-medium mb-1">Pendientes</p>
                        <h3 class="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100 truncate">-</h3>
                    </div>
                    <div class="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                        <i class="fas fa-clock text-yellow-600 dark:text-yellow-400 text-lg sm:text-xl"></i>
                    </div>
                </div>
                <p class="text-yellow-600 dark:text-yellow-400 text-sm font-medium">Selecciona un inventario</p>
            </div>
            <div class="stat-card">
                <div class="flex items-start justify-between gap-3 mb-3">
                    <div class="min-w-0 flex-1">
                        <p class="text-gray-600 dark:text-gray-400 text-sm font-medium mb-1">Aprobadas</p>
                        <h3 class="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100 truncate">-</h3>
                    </div>
                    <div class="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                        <i class="fas fa-check-circle text-green-600 dark:text-green-400 text-lg sm:text-xl"></i>
                    </div>
                </div>
                <p class="text-green-600 dark:text-green-400 text-sm font-medium">Selecciona un inventario</p>
            </div>
            <div class="stat-card">
                <div class="flex items-start justify-between gap-3 mb-3">
                    <div class="min-w-0 flex-1">
                        <p class="text-gray-600 dark:text-gray-400 text-sm font-medium mb-1">Rechazadas</p>
                        <h3 class="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100 truncate">-</h3>
                    </div>
                    <div class="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                        <i class="fas fa-times-circle text-red-600 dark:text-red-400 text-lg sm:text-xl"></i>
                    </div>
                </div>
                <p class="text-red-600 dark:text-red-400 text-sm font-medium">Selecciona un inventario</p>
            </div>
        `;
    }
}

/**
 * Views transfers for a specific inventory
 */
async function viewInventoryTransfers(inventoryId) {
    if (!window.transfersData) return;
    
    window.transfersData.currentInventoryId = inventoryId;
    
    // Update inventory selector
    const inventorySelect = document.getElementById('transferInventoryFilter');
    if (inventorySelect) {
        inventorySelect.value = inventoryId.toString();
    }
    
    // Load transfers
    await loadTransfersData();
}

function showNewTransferModal(itemId = null) {
    const modal = document.getElementById('newTransferModal');
    if (!modal) return;
    
    modal.classList.remove('hidden');
    
    // Populate form
    if (window.populateNewTransferForm) {
        window.populateNewTransferForm(itemId);
    }
}

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
    
    // Clear transfer form selects
    if (window.newTransferRegionalSelect) {
        window.newTransferRegionalSelect.clear();
    }
    if (window.newTransferInstitutionSelect) {
        window.newTransferInstitutionSelect.clear();
        if (window.newTransferInstitutionSelect.setDisabled) {
            window.newTransferInstitutionSelect.setDisabled(true);
        }
    }
    if (window.newTransferInventorySelect) {
        window.newTransferInventorySelect.clear();
        if (window.newTransferInventorySelect.setDisabled) {
            window.newTransferInventorySelect.setDisabled(true);
        }
    }
}

function showViewTransferModal(transferId) {
    const modal = document.getElementById('viewTransferModal');
    if (!modal) return;
    
    const content = document.getElementById('viewTransferContent');
    if (content) {
        content.innerHTML = `
            <div class="flex items-center justify-center py-8">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00AF00]"></div>
            </div>
        `;
    }
    
    modal.classList.remove('hidden');
    
    // Find transfer in current data
    if (window.transfersData && window.transfersData.transfers) {
        const transfer = window.transfersData.transfers.find(t => t.id === transferId);
        if (transfer) {
            populateViewTransferModal(transfer);
        }
    }
}

function populateViewTransferModal(transfer) {
    const content = document.getElementById('viewTransferContent');
    if (!content) return;
    
    const statusBadge = getTransferStatusBadge(transfer.status);
    const requestedDate = transfer.requestedAt 
        ? new Date(transfer.requestedAt).toLocaleDateString('es-ES', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
        : 'N/A';
    const approvedDate = transfer.approvedAt 
        ? new Date(transfer.approvedAt).toLocaleDateString('es-ES', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
        : 'N/A';
    
    content.innerHTML = `
        <div class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Item</label>
                    <p class="text-gray-900 dark:text-gray-100 font-semibold">${transfer.itemName || 'N/A'}</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">ID: ${transfer.itemId || 'N/A'}</p>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Estado</label>
                    <div class="mt-1">${statusBadge}</div>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Inventario Origen</label>
                    <p class="text-gray-900 dark:text-gray-100">${transfer.sourceInventoryName || 'N/A'}</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">ID: ${transfer.sourceInventoryId || 'N/A'}</p>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Inventario Destino</label>
                    <p class="text-gray-900 dark:text-gray-100">${transfer.destinationInventoryName || 'N/A'}</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">ID: ${transfer.destinationInventoryId || 'N/A'}</p>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Solicitado por</label>
                    <p class="text-gray-900 dark:text-gray-100">${transfer.requestedByName || 'N/A'}</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">ID: ${transfer.requestedById || 'N/A'}</p>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Fecha de Solicitud</label>
                    <p class="text-gray-900 dark:text-gray-100">${requestedDate}</p>
                </div>
                
                ${transfer.approvedByName ? `
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Aprobado por</label>
                        <p class="text-gray-900 dark:text-gray-100">${transfer.approvedByName}</p>
                        <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">ID: ${transfer.approvedById || 'N/A'}</p>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Fecha de Aprobación</label>
                        <p class="text-gray-900 dark:text-gray-100">${approvedDate}</p>
                    </div>
                ` : ''}
            </div>
            
            ${transfer.details ? `
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Detalles</label>
                    <p class="text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">${transfer.details}</p>
                </div>
            ` : ''}
            
            ${transfer.approvalNotes ? `
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notas de Aprobación</label>
                    <p class="text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">${transfer.approvalNotes}</p>
                </div>
            ` : ''}
        </div>
    `;
}

function closeViewTransferModal() {
    const modal = document.getElementById('viewTransferModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

function showApproveTransferModal(transferId) {
    const modal = document.getElementById('approveTransferModal');
    if (!modal) return;
    
    if (window.transfersData) {
        window.transfersData.currentTransferId = transferId;
    }
    
    modal.classList.remove('hidden');
    
    // Populate form
    if (window.populateApproveTransferForm) {
        window.populateApproveTransferForm(transferId);
    }
}

function closeApproveTransferModal() {
    const modal = document.getElementById('approveTransferModal');
    if (modal) {
        modal.classList.add('hidden');
    }
    
    // Clear form
    const form = document.getElementById('approveTransferForm');
    if (form) {
        form.innerHTML = '';
    }
    
    if (window.transfersData) {
        window.transfersData.currentTransferId = null;
    }
}

// Helper function
function getTransferStatusBadge(status) {
    const badges = {
        'PENDING': '<span class="px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300">Pendiente</span>',
        'APPROVED': '<span class="px-3 py-1 rounded-full text-sm font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">Aprobada</span>',
        'REJECTED': '<span class="px-3 py-1 rounded-full text-sm font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300">Rechazada</span>'
    };
    return badges[status] || '<span class="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300">Desconocido</span>';
}

// Export functions globally
window.loadTransfersData = loadTransfersData;
window.checkPendingTransfers = checkPendingTransfers;
window.viewInventoryTransfers = viewInventoryTransfers;
window.showNewTransferModal = showNewTransferModal;
window.closeNewTransferModal = closeNewTransferModal;
window.showViewTransferModal = showViewTransferModal;
window.closeViewTransferModal = closeViewTransferModal;
window.showApproveTransferModal = showApproveTransferModal;
window.closeApproveTransferModal = closeApproveTransferModal;

