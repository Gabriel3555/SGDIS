// Transfers UI Functions

function updateTransfersUI() {
    if (!window.transfersData) return;
    
    updateTransfersStats();
    updateTransfersSearchAndFilters();
    updateTransfersViewModeButtons();
    
    if (window.transfersData.viewMode === 'cards') {
        updateTransfersCards();
    } else {
        updateTransfersTable();
    }
    
    updateTransfersPagination();
}

async function updateTransfersStats() {
    const container = document.getElementById('transferStatsContainer');
    if (!container || !window.transfersData) {
        return;
    }
    
    // Show loading state
    container.innerHTML = `
        <div class="stat-card animate-pulse">
            <div class="flex items-start justify-between mb-3">
                <div>
                    <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-2"></div>
                    <div class="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                </div>
                <div class="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
            </div>
        </div>
    `;
    
    try {
        // Check if user is superadmin or warehouse
        const isSuperAdmin = (window.currentUserRole && window.currentUserRole.toUpperCase() === 'SUPERADMIN') || 
                             (window.location.pathname && window.location.pathname.includes('/superadmin'));
        const isWarehouse = (window.currentUserRole && window.currentUserRole.toUpperCase() === 'WAREHOUSE') ||
                           (window.location.pathname && window.location.pathname.includes('/warehouse'));
        
        let totalTransfers, pendingTransfers, approvedTransfers, rejectedTransfers;
        
        if (isSuperAdmin && window.fetchTransferStatistics) {
            // Fetch statistics from API for superadmin
            const stats = await window.fetchTransferStatistics();
            totalTransfers = stats.totalTransfers || 0;
            pendingTransfers = stats.pendingTransfers || 0;
            approvedTransfers = stats.approvedTransfers || 0;
            rejectedTransfers = stats.rejectedTransfers || 0;
        } else if (isWarehouse && window.transfersData) {
            // For warehouse, use all regional transfers for accurate statistics
            const transfers = window.transfersData.allRegionalTransfers || window.transfersData.transfers || [];
            // Use totalElements if available for total count
            totalTransfers = window.transfersData.totalRegionalTransfers || window.transfersData.totalElements || 0;
            pendingTransfers = 0;
            approvedTransfers = 0;
            rejectedTransfers = 0;
            
            if (transfers.length > 0) {
                pendingTransfers = transfers.filter(t => t.status === 'PENDING').length;
                approvedTransfers = transfers.filter(t => t.status === 'APPROVED').length;
                rejectedTransfers = transfers.filter(t => t.status === 'REJECTED').length;
            }
            
            // Ensure values are numbers
            totalTransfers = totalTransfers || 0;
            pendingTransfers = pendingTransfers || 0;
            approvedTransfers = approvedTransfers || 0;
            rejectedTransfers = rejectedTransfers || 0;
        } else {
            // Calculate from loaded transfers for other users
            const transfers = window.transfersData.transfers || [];
            totalTransfers = transfers.length || 0;
            pendingTransfers = transfers.filter(t => t.status === 'PENDING').length || 0;
            approvedTransfers = transfers.filter(t => t.status === 'APPROVED').length || 0;
            rejectedTransfers = transfers.filter(t => t.status === 'REJECTED').length || 0;
        }
        
        // Ensure all values are numbers (default to 0)
        totalTransfers = totalTransfers || 0;
        pendingTransfers = pendingTransfers || 0;
        approvedTransfers = approvedTransfers || 0;
        rejectedTransfers = rejectedTransfers || 0;
        
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
    } catch (error) {
        console.error('Error updating transfer stats:', error);
    }
}

function updateTransfersSearchAndFilters() {
    const container = document.getElementById('searchFilterContainer');
    if (!container) return;
    
    const currentSearchTerm = window.transfersData?.filters?.searchTerm || '';
    const currentStatusFilter = window.transfersData?.filters?.status || 'all';
    const currentInventoryId = window.transfersData?.currentInventoryId || '';
    
    // Check if user is super admin
    const isSuperAdmin = (window.currentUserRole && window.currentUserRole.toUpperCase() === 'SUPERADMIN') || 
                         (window.location.pathname && window.location.pathname.includes('/superadmin'));
    
    // Get selected regional and institution
    const selectedRegional = (window.inventoryData || window.transfersData)?.selectedRegional || '';
    const selectedInstitution = (window.inventoryData || window.transfersData)?.selectedInstitution || '';
    
    // Build filter dropdowns HTML
    let filterDropdowns = '';
    
    if (isSuperAdmin) {
        // Super admin gets regional and institution filters
        filterDropdowns = `
            <div class="relative" style="min-width: 180px; flex-shrink: 0;">
                <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Regional</label>
                <div class="custom-select-container">
                    <div class="custom-select" id="transferRegionalSelect">
                        <div class="custom-select-trigger">
                            <span class="custom-select-text">Todas las regionales</span>
                            <i class="fas fa-chevron-down custom-select-arrow"></i>
                        </div>
                        <div class="custom-select-dropdown">
                            <input type="text" class="custom-select-search" placeholder="Buscar regional...">
                            <div class="custom-select-options" id="transferRegionalOptions">
                                <div class="custom-select-option" data-value="">Todas las regionales</div>
                            </div>
                        </div>
                    </div>
                    <input type="hidden" id="transferRegionalFilter" value="">
                </div>
            </div>
            <div class="relative" style="min-width: 180px; flex-shrink: 0;">
                <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Institución</label>
                <div class="custom-select-container">
                    <div class="custom-select ${!selectedRegional ? 'custom-select-disabled' : ''}" id="transferInstitutionSelect">
                        <div class="custom-select-trigger">
                            <span class="custom-select-text">Todas las instituciones</span>
                            <i class="fas fa-chevron-down custom-select-arrow"></i>
                        </div>
                        <div class="custom-select-dropdown">
                            <input type="text" class="custom-select-search" placeholder="Buscar institución...">
                            <div class="custom-select-options" id="transferInstitutionOptions">
                                <div class="custom-select-option" data-value="">Todas las instituciones</div>
                            </div>
                        </div>
                    </div>
                    <input type="hidden" id="transferInstitutionFilter" value="">
                </div>
            </div>
        `;
    }
    
    // Inventory selector (for all users)
    filterDropdowns += `
        <div class="relative" style="min-width: 180px; flex-shrink: 0;">
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Inventario</label>
            <div class="custom-select-container">
                <div class="custom-select" id="transferInventorySelect">
                    <div class="custom-select-trigger">
                        <span class="custom-select-text">Seleccionar inventario...</span>
                        <i class="fas fa-chevron-down custom-select-arrow"></i>
                    </div>
                    <div class="custom-select-dropdown">
                        <input type="text" class="custom-select-search" placeholder="Buscar inventario...">
                        <div class="custom-select-options" id="transferInventoryOptions">
                            <div class="custom-select-option" data-value="">Seleccionar inventario...</div>
                        </div>
                    </div>
                </div>
                <input type="hidden" id="transferInventoryFilter" value="">
            </div>
        </div>
    `;
    
    container.innerHTML = `
        <div class="flex gap-2 items-end w-full flex-nowrap overflow-x-visible" style="overflow-x: visible !important;">
            <div class="relative flex-1" style="min-width: 250px;">
                <i class="fas fa-search absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500"></i>
                <input type="text" id="transferSearchInput" value="${currentSearchTerm}" 
                    placeholder="Buscar por item, origen, destino..." 
                    class="w-full pl-12 pr-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00AF00] transition-all bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" 
                    style="height: 56px; font-size: 0.9375rem;"
                    onkeyup="handleTransferSearch(event)">
            </div>
            <button onclick="handleTransferSearchButton()" 
                class="px-4 border-2 border-[#00AF00] text-white rounded-xl hover:bg-[#008800] transition-colors bg-[#00AF00] focus:outline-none focus:ring-2 focus:ring-[#00AF00] flex items-center justify-center font-medium shadow-sm hover:shadow-md" 
                style="height: 56px; min-width: 56px; flex-shrink: 0;" 
                title="Buscar">
                <i class="fas fa-search"></i>
            </button>
            ${filterDropdowns}
            <div class="relative" style="min-width: 180px; flex-shrink: 0;">
                <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Estado</label>
                <div class="custom-select-container">
                    <div class="custom-select" id="transferStatusSelect">
                        <div class="custom-select-trigger">
                            <span class="custom-select-text">${currentStatusFilter === 'all' ? 'Todos los estados' : currentStatusFilter === 'PENDING' ? 'Pendiente' : currentStatusFilter === 'APPROVED' ? 'Aprobada' : currentStatusFilter === 'REJECTED' ? 'Rechazada' : 'Todos los estados'}</span>
                            <i class="fas fa-chevron-down custom-select-arrow"></i>
                        </div>
                        <div class="custom-select-dropdown">
                            <input type="text" class="custom-select-search" placeholder="Buscar estado...">
                            <div class="custom-select-options" id="transferStatusOptions">
                                <div class="custom-select-option ${currentStatusFilter === 'all' ? 'selected' : ''}" data-value="all">Todos los estados</div>
                                <div class="custom-select-option ${currentStatusFilter === 'PENDING' ? 'selected' : ''}" data-value="PENDING">Pendiente</div>
                                <div class="custom-select-option ${currentStatusFilter === 'APPROVED' ? 'selected' : ''}" data-value="APPROVED">Aprobada</div>
                                <div class="custom-select-option ${currentStatusFilter === 'REJECTED' ? 'selected' : ''}" data-value="REJECTED">Rechazada</div>
                            </div>
                        </div>
                    </div>
                    <input type="hidden" id="transferStatusFilter" value="${currentStatusFilter}">
                </div>
            </div>
        </div>
    `;
    
    // Initialize CustomSelect components
    setTimeout(() => {
        if (isSuperAdmin) {
            // Initialize regional select
            if (typeof CustomSelect !== 'undefined' && document.getElementById('transferRegionalSelect')) {
                window.transferRegionalSelect = new CustomSelect('transferRegionalSelect', {
                    onSelect: (value) => {
                        handleTransferRegionalFilterChange(value);
                    }
                });
            }
            
            // Initialize institution select
            if (typeof CustomSelect !== 'undefined' && document.getElementById('transferInstitutionSelect')) {
                window.transferInstitutionSelect = new CustomSelect('transferInstitutionSelect', {
                    onSelect: (value) => {
                        handleTransferInstitutionFilterChange(value);
                    }
                });
                if (!selectedRegional && window.transferInstitutionSelect && typeof window.transferInstitutionSelect.setDisabled === 'function') {
                    window.transferInstitutionSelect.setDisabled(true);
                }
            }
        }
        
        // Initialize inventory select
        if (typeof CustomSelect !== 'undefined' && document.getElementById('transferInventorySelect')) {
            window.transferInventorySelect = new CustomSelect('transferInventorySelect', {
                onSelect: (value) => {
                    handleTransferInventorySelectionChange(value);
                }
            });
        }
        
        // Initialize status select
        if (typeof CustomSelect !== 'undefined' && document.getElementById('transferStatusSelect')) {
            window.transferStatusSelect = new CustomSelect('transferStatusSelect', {
                onSelect: (value) => {
                    handleTransferStatusFilterChange(value);
                }
            });
        }
        
        // Load filters data
        if (isSuperAdmin) {
            // Load regionals and institutions
            if (window.loadRegionalsForTransferFilter) {
                window.loadRegionalsForTransferFilter();
            }
            if (selectedRegional && window.loadInstitutionsForTransferFilter) {
                window.loadInstitutionsForTransferFilter(selectedRegional);
            }
        }
        
        // Load inventories for selector
        if (window.loadInventoriesForTransferFilter) {
            window.loadInventoriesForTransferFilter();
        }
    }, 100);
}

function updateTransfersViewModeButtons() {
    const container = document.getElementById('viewModeButtonsContainer');
    if (!container) return;
    
    const viewMode = window.transfersData ? window.transfersData.viewMode : 'table';
    const isTableActive = viewMode === 'table';
    const isCardsActive = viewMode === 'cards';
    
    container.innerHTML = `
        <div class="flex items-center gap-2 mb-4">
            <button onclick="setTransfersViewMode('table')" 
                class="flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                    isTableActive
                        ? "bg-[#00AF00] text-white shadow-md"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }">
                <i class="fas fa-table"></i>
                <span class="hidden sm:inline">Tabla</span>
            </button>
            <button onclick="setTransfersViewMode('cards')" 
                class="flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                    isCardsActive
                        ? "bg-[#00AF00] text-white shadow-md"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }">
                <i class="fas fa-th"></i>
                <span class="hidden sm:inline">Cards</span>
            </button>
        </div>
    `;
}

function updateTransfersTable() {
    const container = document.getElementById('transferTableContainer');
    if (!container || !window.transfersData) return;
    
    const transfers = window.transfersData.transfers || [];
    const filteredTransfers = filterTransfers(transfers);
    
    if (filteredTransfers.length === 0) {
        container.innerHTML = `
            <div class="text-center py-12">
                <i class="fas fa-exchange-alt text-gray-300 dark:text-gray-600 text-5xl mb-4"></i>
                <p class="text-gray-500 dark:text-gray-400 text-lg">No hay transferencias registradas</p>
                <button onclick="showNewTransferModal()" 
                    class="mt-4 bg-[#00AF00] hover:bg-[#008800] text-white font-semibold py-2 px-4 rounded-xl transition-colors">
                    <i class="fas fa-plus mr-2"></i>
                    Nueva Transferencia
                </button>
            </div>
        `;
        return;
    }
    
    let tableHtml = `
        <div class="overflow-x-auto">
            <table class="w-full">
                <thead>
                    <tr class="border-b border-gray-200 dark:border-gray-700">
                        <th class="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Item</th>
                        <th class="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Origen</th>
                        <th class="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Destino</th>
                        <th class="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Estado</th>
                        <th class="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Solicitado por</th>
                        <th class="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Fecha</th>
                        <th class="text-center py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Acciones</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    filteredTransfers.forEach(transfer => {
        const statusBadge = getTransferStatusBadge(transfer.status);
        const requestedDate = transfer.requestedAt 
            ? new Date(transfer.requestedAt).toLocaleDateString('es-ES')
            : 'N/A';
        
        tableHtml += `
            <tr class="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <td class="py-3 px-4">
                    <div class="font-medium text-gray-900 dark:text-gray-100">${transfer.itemName || 'N/A'}</div>
                    <div class="text-xs text-gray-500 dark:text-gray-400">ID: ${transfer.itemId || 'N/A'}</div>
                </td>
                <td class="py-3 px-4">
                    <div class="text-sm text-gray-900 dark:text-gray-100">${transfer.sourceInventoryName || 'N/A'}</div>
                    <div class="text-xs text-gray-500 dark:text-gray-400">ID: ${transfer.sourceInventoryId || 'N/A'}</div>
                </td>
                <td class="py-3 px-4">
                    <div class="text-sm text-gray-900 dark:text-gray-100">${transfer.destinationInventoryName || 'N/A'}</div>
                    <div class="text-xs text-gray-500 dark:text-gray-400">ID: ${transfer.destinationInventoryId || 'N/A'}</div>
                </td>
                <td class="py-3 px-4">
                    ${statusBadge}
                </td>
                <td class="py-3 px-4">
                    <div class="text-sm text-gray-900 dark:text-gray-100">${transfer.requestedByName || 'N/A'}</div>
                </td>
                <td class="py-3 px-4">
                    <div class="text-sm text-gray-900 dark:text-gray-100">${requestedDate}</div>
                </td>
                <td class="py-3 px-4">
                    <div class="flex items-center justify-center gap-2">
                        <button onclick="showViewTransferModal(${transfer.id})" 
                            class="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors" 
                            title="Ver detalles">
                            <i class="fas fa-eye"></i>
                        </button>
                        ${transfer.status === 'PENDING' ? `
                            <button onclick="showApproveTransferModal(${transfer.id})" 
                                class="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors" 
                                title="Aprobar">
                                <i class="fas fa-check"></i>
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `;
    });
    
    tableHtml += `
                </tbody>
            </table>
        </div>
    `;
    
    container.innerHTML = tableHtml;
}

function updateTransfersCards() {
    const container = document.getElementById('transferTableContainer');
    if (!container || !window.transfersData) return;
    
    const transfers = window.transfersData.transfers || [];
    const filteredTransfers = filterTransfers(transfers);
    
    if (filteredTransfers.length === 0) {
        container.innerHTML = `
            <div class="text-center py-12">
                <i class="fas fa-exchange-alt text-gray-300 dark:text-gray-600 text-5xl mb-4"></i>
                <p class="text-gray-500 dark:text-gray-400 text-lg">No hay transferencias registradas</p>
                <button onclick="showNewTransferModal()" 
                    class="mt-4 bg-[#00AF00] hover:bg-[#008800] text-white font-semibold py-2 px-4 rounded-xl transition-colors">
                    <i class="fas fa-plus mr-2"></i>
                    Nueva Transferencia
                </button>
            </div>
        `;
        return;
    }
    
    let cardsHtml = '<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">';
    
    filteredTransfers.forEach(transfer => {
        const statusBadge = getTransferStatusBadge(transfer.status);
        const requestedDate = transfer.requestedAt 
            ? new Date(transfer.requestedAt).toLocaleDateString('es-ES')
            : 'N/A';
        
        cardsHtml += `
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-shadow p-6">
                <div class="flex items-start justify-between mb-4">
                    <div class="flex-1">
                        <h3 class="font-semibold text-gray-800 dark:text-gray-100 mb-1">${transfer.itemName || 'N/A'}</h3>
                        <p class="text-xs text-gray-500 dark:text-gray-400">ID Item: ${transfer.itemId || 'N/A'}</p>
                    </div>
                    ${statusBadge}
                </div>
                <div class="space-y-3 mb-4">
                    <div>
                        <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Origen</p>
                        <p class="text-sm font-medium text-gray-900 dark:text-gray-100">${transfer.sourceInventoryName || 'N/A'}</p>
                    </div>
                    <div>
                        <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Destino</p>
                        <p class="text-sm font-medium text-gray-900 dark:text-gray-100">${transfer.destinationInventoryName || 'N/A'}</p>
                    </div>
                    <div>
                        <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Solicitado por</p>
                        <p class="text-sm font-medium text-gray-900 dark:text-gray-100">${transfer.requestedByName || 'N/A'}</p>
                    </div>
                    <div>
                        <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Fecha</p>
                        <p class="text-sm font-medium text-gray-900 dark:text-gray-100">${requestedDate}</p>
                    </div>
                </div>
                <div class="flex gap-2">
                    <button onclick="showViewTransferModal(${transfer.id})" 
                        class="flex-1 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm transition-colors">
                        <i class="fas fa-eye mr-1"></i>
                        Ver
                    </button>
                    ${transfer.status === 'PENDING' ? `
                        <button onclick="showApproveTransferModal(${transfer.id})" 
                            class="flex-1 px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm transition-colors">
                            <i class="fas fa-check mr-1"></i>
                            Aprobar
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    });
    
    cardsHtml += '</div>';
    container.innerHTML = cardsHtml;
}

function updateTransfersPagination() {
    const container = document.getElementById('paginationContainer');
    if (!container || !window.transfersData) return;
    
    const { currentPage, totalPages, totalElements, pageSize } = window.transfersData;
    
    // Calculate start and end items (currentPage is 0-indexed)
    const startItem = totalElements > 0 ? (currentPage * pageSize) + 1 : 0;
    const endItem = Math.min((currentPage + 1) * pageSize, totalElements);
    
    let paginationHtml = `
        <div class="text-sm text-gray-600">
            Mostrando ${startItem}-${endItem} de ${totalElements} transferencia${totalElements !== 1 ? 's' : ''}
        </div>
        <div class="flex items-center gap-2 ml-auto">
    `;
    
    if (window.transfersData && totalPages > 0) {
        // Previous button (convert to 1-indexed for display, but use 0-indexed for function)
        paginationHtml += `
            <button onclick="changeTransfersPage(${currentPage - 1})" ${
            currentPage === 0 ? 'disabled' : ''
        } class="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                <i class="fas fa-chevron-left"></i>
            </button>
        `;
        
        // Page numbers - show up to 5 pages (1-indexed for display)
        const maxVisiblePages = 5;
        // Convert to 1-indexed for calculation
        const currentPage1Indexed = currentPage + 1;
        let startPage = Math.max(1, currentPage1Indexed - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
        
        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }
        
        // Show page numbers (convert back to 0-indexed for function call)
        for (let i = startPage; i <= endPage; i++) {
            const pageIndex = i - 1; // Convert to 0-indexed
            paginationHtml += `
                <button onclick="changeTransfersPage(${pageIndex})" class="px-3 py-2 border ${
                currentPage === pageIndex
                    ? 'bg-[#00AF00] text-white border-[#00AF00]'
                    : 'border-gray-300 text-gray-700'
            } rounded-lg hover:bg-gray-50 transition-colors">
                    ${i}
                </button>
            `;
        }
        
        // Next button
        paginationHtml += `
            <button onclick="changeTransfersPage(${currentPage + 1})" ${
            currentPage >= totalPages - 1 ? 'disabled' : ''
        } class="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                <i class="fas fa-chevron-right"></i>
            </button>
        `;
    }
    
    paginationHtml += `</div>`;
    container.innerHTML = paginationHtml;
}

// Helper functions
function getTransferStatusBadge(status) {
    const badges = {
        'PENDING': '<span class="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300">Pendiente</span>',
        'APPROVED': '<span class="px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">Aprobada</span>',
        'REJECTED': '<span class="px-2 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300">Rechazada</span>'
    };
    return badges[status] || '<span class="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300">Desconocido</span>';
}

function filterTransfers(transfers) {
    if (!window.transfersData || !window.transfersData.filters) {
        return transfers;
    }
    
    let filtered = [...transfers];
    const { status, searchTerm } = window.transfersData.filters;
    
    // Filter by status
    if (status && status !== 'all') {
        filtered = filtered.filter(t => t.status === status);
    }
    
    // Filter by search term
    if (searchTerm && searchTerm.trim() !== '') {
        const term = searchTerm.toLowerCase();
        filtered = filtered.filter(t => 
            (t.itemName && t.itemName.toLowerCase().includes(term)) ||
            (t.sourceInventoryName && t.sourceInventoryName.toLowerCase().includes(term)) ||
            (t.destinationInventoryName && t.destinationInventoryName.toLowerCase().includes(term)) ||
            (t.requestedByName && t.requestedByName.toLowerCase().includes(term))
        );
    }
    
    return filtered;
}

// Event handlers
function handleTransferSearch(event) {
    if (event.key === 'Enter') {
        handleTransferSearchButton();
    }
}

async function handleTransferSearchButton() {
    const searchInput = document.getElementById('transferSearchInput');
    if (searchInput && window.transfersData) {
        window.transfersData.filters = window.transfersData.filters || {};
        window.transfersData.filters.searchTerm = searchInput.value.trim();
        window.transfersData.currentPage = 0; // Reset to first page
        
        // Reload transfers if we have a selected inventory
        if (window.transfersData.currentInventoryId && window.loadTransfersData) {
            await window.loadTransfersData();
        } else {
            updateTransfersUI();
        }
    }
}

async function handleTransferStatusFilterChange(event) {
    if (window.transfersData) {
        window.transfersData.filters = window.transfersData.filters || {};
        // Support both event object and direct value
        const statusValue = event?.target?.value || event?.value || event;
        window.transfersData.filters.status = statusValue;
        window.transfersData.currentPage = 0; // Reset to first page
        
        // Reload transfers if we have a selected inventory
        if (window.transfersData.currentInventoryId && window.loadTransfersData) {
            await window.loadTransfersData();
        } else {
            updateTransfersUI();
        }
    }
}

// Export functions globally
window.updateTransfersUI = updateTransfersUI;
window.updateTransfersPagination = updateTransfersPagination;
window.handleTransferSearch = handleTransferSearch;
window.handleTransferSearchButton = handleTransferSearchButton;
window.handleTransferStatusFilterChange = handleTransferStatusFilterChange;

