// Transfers Admin Regional - Specific functionality for ADMIN_REGIONAL role
// This file handles loading and displaying transfers for the admin regional's regional

let currentUserRegionalId = null;
let transfersDataAdminRegional = {
    allTransfers: [], // Store all transfers for client-side filtering
    filteredTransfers: [], // Filtered transfers
    inventories: [], // Store inventories for origin/destination filters
    users: [], // Store users for requester filter
    currentPage: 0,
    pageSize: 6,
    totalPages: 0,
    totalElements: 0,
    viewMode: 'table',
    filters: {
        status: 'all',
        searchTerm: '',
        originInventoryId: 'all',
        destinationInventoryId: 'all',
        requestedById: 'all'
    }
};
let transferOriginCustomSelectAdminRegional = null;
let transferDestinationCustomSelectAdminRegional = null;
let transferRequesterCustomSelectAdminRegional = null;
let transferStatusCustomSelectAdminRegional = null;

/**
 * Load current user info to get regional ID
 */
async function loadCurrentUserInfoForTransfers() {
    try {
        const token = localStorage.getItem('jwt');
        if (!token) {
            throw new Error('No authentication token found');
        }

        const response = await fetch('/api/v1/users/me', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const userData = await response.json();
            
            // Store user data globally
            window.currentUserData = userData;
            
            // Get institution name (it's a string, not an object)
            const institutionName = userData.institution;
            
            if (!institutionName) {
                throw new Error('Usuario no tiene una institución asignada');
            }

            // Fetch all institutions to find the user's institution
            const institutionsResponse = await fetch('/api/v1/institutions', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!institutionsResponse.ok) {
                throw new Error('Error al cargar las instituciones');
            }

            const institutions = await institutionsResponse.json();
            const userInstitution = institutions.find(inst => inst.name === institutionName);

            if (!userInstitution) {
                throw new Error('Institución del usuario no encontrada: ' + institutionName);
            }

            // Get regional ID from the institution
            const userRegionalId = userInstitution.regionalId;

            if (!userRegionalId) {
                throw new Error('La institución no tiene una regional asignada');
            }

            currentUserRegionalId = userRegionalId;

            // Fetch regional information to get the name
            try {
                const regionalsResponse = await fetch('/api/v1/regional', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (regionalsResponse.ok) {
                    const regionals = await regionalsResponse.json();
                    const regional = regionals.find(reg => reg.id === userRegionalId);
                    if (regional) {
                        updateTransfersWelcomeMessage(regional.name);
                        window.currentUserRegional = regional;
                    }
                }
            } catch (error) {
                console.error('Error fetching regional info:', error);
                // Continue even if we can't get the regional name
            }

            return currentUserRegionalId;
        } else {
            throw new Error('Failed to load user info');
        }
    } catch (error) {
        console.error('Error loading current user info:', error);
        showError('Error al cargar la información del usuario: ' + error.message);
        return null;
    }
}

/**
 * Update welcome message with regional name
 */
function updateTransfersWelcomeMessage(regionalName) {
    const welcomeMessage = document.getElementById('transferWelcomeMessage');
    if (welcomeMessage && regionalName) {
        welcomeMessage.textContent = `Administración de transferencias de la regional: ${regionalName}`;
    }
}

/**
 * Load inventories for the admin regional's regional
 */
async function loadInventoriesForTransfersAdminRegional() {
    try {
        if (!currentUserRegionalId) {
            const regionalId = await loadCurrentUserInfoForTransfers();
            if (!regionalId) {
                return;
            }
        }

        const token = localStorage.getItem('jwt');
        if (!token) {
            throw new Error('No authentication token found');
        }

        const response = await fetch(`/api/v1/inventory/regionalAdminInventories?page=0&size=10000`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            transfersDataAdminRegional.inventories = Array.isArray(data.content) ? data.content : [];
            
            // Update filter dropdowns only if CustomSelects are already initialized
            // Otherwise, they will be initialized when updateTransfersSearchAndFiltersForAdminRegional is called
            if (transferOriginCustomSelectAdminRegional || transferDestinationCustomSelectAdminRegional) {
                updateInventoryFiltersForAdminRegional();
            }
        } else {
            console.error('Error loading inventories for transfers');
        }
    } catch (error) {
        console.error('Error loading inventories for transfers:', error);
    }
}

/**
 * Load users for the admin regional's regional
 */
async function loadUsersForTransfersAdminRegional() {
    try {
        if (!currentUserRegionalId) {
            const regionalId = await loadCurrentUserInfoForTransfers();
            if (!regionalId) {
                return;
            }
        }

        const token = localStorage.getItem('jwt');
        if (!token) {
            throw new Error('No authentication token found');
        }

        // Load users from the regional (assuming there's an endpoint for this)
        // For now, we'll extract unique users from the transfers
        const uniqueUsers = new Map();
        transfersDataAdminRegional.allTransfers.forEach(transfer => {
            if (transfer.requestedById && transfer.requestedByName) {
                if (!uniqueUsers.has(transfer.requestedById)) {
                    uniqueUsers.set(transfer.requestedById, {
                        id: transfer.requestedById,
                        name: transfer.requestedByName
                    });
                }
            }
        });
        transfersDataAdminRegional.users = Array.from(uniqueUsers.values());
        
        // Update requester filter dropdown only if CustomSelect is already initialized
        // Otherwise, it will be initialized when updateTransfersSearchAndFiltersForAdminRegional is called
        if (transferRequesterCustomSelectAdminRegional) {
            updateRequesterFilterForAdminRegional();
        }
    } catch (error) {
        console.error('Error loading users for transfers:', error);
    }
}

/**
 * Update inventory filters dropdowns
 */
function updateInventoryFiltersForAdminRegional() {
    const inventoryOptions = [
        { value: 'all', label: 'Todos los Inventarios' },
        ...transfersDataAdminRegional.inventories.map(inv => ({
            value: (inv.id || '').toString(),
            label: inv.name || 'Sin nombre'
        }))
    ];

    // Only update if CustomSelects are already initialized
    if (transferOriginCustomSelectAdminRegional) {
        transferOriginCustomSelectAdminRegional.setOptions(inventoryOptions);
    }
    if (transferDestinationCustomSelectAdminRegional) {
        transferDestinationCustomSelectAdminRegional.setOptions(inventoryOptions);
    }
}

/**
 * Update requester filter dropdown
 */
function updateRequesterFilterForAdminRegional() {
    const requesterOptions = [
        { value: 'all', label: 'Todos los Usuarios' },
        ...transfersDataAdminRegional.users.map(user => ({
            value: user.id.toString(),
            label: user.name
        }))
    ];

    // Only update if CustomSelect is already initialized
    if (transferRequesterCustomSelectAdminRegional) {
        transferRequesterCustomSelectAdminRegional.setOptions(requesterOptions);
    }
}

/**
 * Load transfers for the admin regional's regional
 */
async function loadTransfersForAdminRegional(page = 0) {
    try {
        // First, get the user's regional ID
        if (!currentUserRegionalId) {
            const regionalId = await loadCurrentUserInfoForTransfers();
            if (!regionalId) {
                return;
            }
        }

        const token = localStorage.getItem('jwt');
        if (!token) {
            throw new Error('No authentication token found');
        }

        // Show loading state
        const container = document.getElementById('transferTableContainer');
        if (container) {
            container.innerHTML = `
                <div class="animate-pulse space-y-4">
                    <div class="h-32 bg-gray-200 rounded-xl"></div>
                    <div class="h-32 bg-gray-200 rounded-xl"></div>
                    <div class="h-32 bg-gray-200 rounded-xl"></div>
                </div>
            `;
        }

        // Load all transfers from the regional (for client-side filtering)
        const response = await fetch(`/api/v1/transfers/regional/${currentUserRegionalId}?page=0&size=10000`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            
            // Store all transfers
            transfersDataAdminRegional.allTransfers = Array.isArray(data.content) ? data.content : [];
            
            // Load inventories and users for filters first (before generating HTML)
            await loadInventoriesForTransfersAdminRegional();
            await loadUsersForTransfersAdminRegional();
            
            // Then update UI (this will generate HTML and initialize CustomSelects with the loaded data)
            updateTransfersUIForAdminRegional();
            
            // Apply filters and paginate
            filterTransfersForAdminRegional();
        } else {
            throw new Error('Error al cargar las transferencias');
        }
    } catch (error) {
        console.error('Error loading transfers:', error);
        showError('Error al cargar las transferencias: ' + error.message);
        const container = document.getElementById('transferTableContainer');
        if (container) {
            container.innerHTML = `
                <div class="text-center py-12 text-gray-500">
                    <i class="fas fa-exclamation-triangle text-4xl mb-4"></i>
                    <p class="text-lg font-semibold mb-2">Error al cargar las transferencias</p>
                    <p class="text-sm">${error.message}</p>
                    <button onclick="loadTransfersForAdminRegional()" 
                        class="mt-4 bg-[#00AF00] hover:bg-[#008800] text-white font-semibold py-2 px-4 rounded-xl transition-colors">
                        Reintentar
                    </button>
                </div>
            `;
        }
    }
}

/**
 * Update transfers UI for admin regional
 */
function updateTransfersUIForAdminRegional() {
    // Update search and filters first (this will generate HTML and initialize CustomSelects)
    updateTransfersSearchAndFiltersForAdminRegional();
    
    // Update stats
    if (window.updateTransfersStats) {
        window.updateTransfersStats();
    }
    
    // Update table/cards
    if (window.transfersData && window.transfersData.viewMode === 'cards') {
        if (window.updateTransfersCards) {
            window.updateTransfersCards();
        }
    } else {
        if (window.updateTransfersTable) {
            window.updateTransfersTable();
        }
    }
    
    // Update pagination
    if (window.updateTransfersPagination) {
        window.updateTransfersPagination();
    }
    
    // Update view mode buttons
    if (window.updateTransfersViewModeButtons) {
        window.updateTransfersViewModeButtons();
    }
}

/**
 * Update search and filters for admin regional
 */
function updateTransfersSearchAndFiltersForAdminRegional() {
    const container = document.getElementById('searchFilterContainer');
    if (!container) return;
    
    const currentSearchTerm = transfersDataAdminRegional.filters.searchTerm || '';
    const currentStatusFilter = transfersDataAdminRegional.filters.status || 'all';
    const currentOriginFilter = transfersDataAdminRegional.filters.originInventoryId || 'all';
    const currentDestinationFilter = transfersDataAdminRegional.filters.destinationInventoryId || 'all';
    const currentRequesterFilter = transfersDataAdminRegional.filters.requestedById || 'all';
    
    // Check if CustomSelect containers already exist
    const existingOriginContainer = document.getElementById('transferOriginFilterAdminRegionalSelect');
    const existingDestinationContainer = document.getElementById('transferDestinationFilterAdminRegionalSelect');
    const existingRequesterContainer = document.getElementById('transferRequesterFilterAdminRegionalSelect');
    const existingStatusContainer = document.getElementById('transferStatusFilterAdminRegionalSelect');
    
    // If CustomSelects are already initialized, just update values without regenerating HTML
    if (existingOriginContainer && existingDestinationContainer && existingRequesterContainer && existingStatusContainer &&
        (transferOriginCustomSelectAdminRegional || transferDestinationCustomSelectAdminRegional || 
         transferRequesterCustomSelectAdminRegional || transferStatusCustomSelectAdminRegional)) {
        // Just update the search input value
        const searchInput = document.getElementById('transferSearchAdminRegional');
        if (searchInput) searchInput.value = currentSearchTerm;
        
        // Don't update CustomSelect values if dropdowns are open (to prevent closing them)
        // The values are already stored in transfersDataAdminRegional.filters
        return;
    }
    
    container.innerHTML = `
        <!-- Search Bar -->
        <div class="flex-1">
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Buscar</label>
            <div class="relative">
                <input type="text" 
                       id="transferSearchAdminRegional"
                       placeholder="Buscar por origen, destino, estado..." 
                       value="${currentSearchTerm}"
                       class="w-full px-4 py-3 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                       style="height: 56px;">
                <i class="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
            </div>
        </div>

        <!-- Origin Filter -->
        <div class="relative" style="min-width: 200px; flex-shrink: 0;">
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Origen</label>
            <div class="custom-select-container">
                <div class="custom-select" id="transferOriginFilterAdminRegionalSelect">
                    <div class="custom-select-trigger" style="padding: 0.75rem 1rem; height: 56px; display: flex; align-items: center;">
                        <span class="custom-select-text custom-select-placeholder">Todos los Orígenes</span>
                        <i class="fas fa-chevron-down custom-select-arrow"></i>
                    </div>
                    <div class="custom-select-dropdown">
                        <input type="text" class="custom-select-search" placeholder="Buscar inventario...">
                        <div class="custom-select-options" id="transferOriginFilterAdminRegionalOptions">
                            <!-- Options loaded dynamically -->
                        </div>
                    </div>
                </div>
                <input type="hidden" id="transferOriginFilterAdminRegional" value="all">
            </div>
        </div>

        <!-- Destination Filter -->
        <div class="relative" style="min-width: 200px; flex-shrink: 0;">
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Destino</label>
            <div class="custom-select-container">
                <div class="custom-select" id="transferDestinationFilterAdminRegionalSelect">
                    <div class="custom-select-trigger" style="padding: 0.75rem 1rem; height: 56px; display: flex; align-items: center;">
                        <span class="custom-select-text custom-select-placeholder">Todos los Destinos</span>
                        <i class="fas fa-chevron-down custom-select-arrow"></i>
                    </div>
                    <div class="custom-select-dropdown">
                        <input type="text" class="custom-select-search" placeholder="Buscar inventario...">
                        <div class="custom-select-options" id="transferDestinationFilterAdminRegionalOptions">
                            <!-- Options loaded dynamically -->
                        </div>
                    </div>
                </div>
                <input type="hidden" id="transferDestinationFilterAdminRegional" value="all">
            </div>
        </div>

        <!-- Requester Filter -->
        <div class="relative" style="min-width: 200px; flex-shrink: 0;">
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Solicitado por</label>
            <div class="custom-select-container">
                <div class="custom-select" id="transferRequesterFilterAdminRegionalSelect">
                    <div class="custom-select-trigger" style="padding: 0.75rem 1rem; height: 56px; display: flex; align-items: center;">
                        <span class="custom-select-text custom-select-placeholder">Todos los Usuarios</span>
                        <i class="fas fa-chevron-down custom-select-arrow"></i>
                    </div>
                    <div class="custom-select-dropdown">
                        <input type="text" class="custom-select-search" placeholder="Buscar usuario...">
                        <div class="custom-select-options" id="transferRequesterFilterAdminRegionalOptions">
                            <!-- Options loaded dynamically -->
                        </div>
                    </div>
                </div>
                <input type="hidden" id="transferRequesterFilterAdminRegional" value="all">
            </div>
        </div>

        <!-- Status Filter -->
        <div class="relative" style="min-width: 180px; flex-shrink: 0;">
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Estado</label>
            <div class="custom-select-container">
                <div class="custom-select" id="transferStatusFilterAdminRegionalSelect">
                    <div class="custom-select-trigger" style="padding: 0.75rem 1rem; height: 56px; display: flex; align-items: center;">
                        <span class="custom-select-text custom-select-placeholder">Todos los estados</span>
                        <i class="fas fa-chevron-down custom-select-arrow"></i>
                    </div>
                    <div class="custom-select-dropdown">
                        <input type="text" class="custom-select-search" placeholder="Buscar estado...">
                        <div class="custom-select-options" id="transferStatusFilterAdminRegionalOptions">
                            <!-- Options loaded dynamically -->
                        </div>
                    </div>
                </div>
                <input type="hidden" id="transferStatusFilterAdminRegional" value="all">
            </div>
        </div>
    `;
    
    // Initialize CustomSelect components
    initializeTransferFiltersForAdminRegional();
    
    // Setup search event listener
    const searchInput = document.getElementById('transferSearchAdminRegional');
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                transfersDataAdminRegional.filters.searchTerm = e.target.value;
                transfersDataAdminRegional.currentPage = 0;
                filterTransfersForAdminRegional();
            }, 300);
        });
    }
}

/**
 * Initialize CustomSelect components for filters
 */
function initializeTransferFiltersForAdminRegional() {
    const CustomSelectClass = window.CustomSelect || (typeof CustomSelect !== 'undefined' ? CustomSelect : null);
    if (!CustomSelectClass) {
        console.error('CustomSelect class not found');
        return;
    }

    const inventoryOptions = [
        { value: 'all', label: 'Todos los Inventarios' },
        ...transfersDataAdminRegional.inventories.map(inv => ({
            value: (inv.id || '').toString(),
            label: inv.name || 'Sin nombre'
        }))
    ];

    // Origin filter
    transferOriginCustomSelectAdminRegional = new CustomSelectClass('transferOriginFilterAdminRegionalSelect', {
        placeholder: 'Todos los Orígenes',
        onChange: (option) => {
            const value = option.value || 'all';
            const hiddenInput = document.getElementById('transferOriginFilterAdminRegional');
            if (hiddenInput) hiddenInput.value = value;
            transfersDataAdminRegional.filters.originInventoryId = value;
            transfersDataAdminRegional.currentPage = 0;
            filterTransfersForAdminRegional();
        }
    });
    transferOriginCustomSelectAdminRegional.setOptions(inventoryOptions);

    // Destination filter
    transferDestinationCustomSelectAdminRegional = new CustomSelectClass('transferDestinationFilterAdminRegionalSelect', {
        placeholder: 'Todos los Destinos',
        onChange: (option) => {
            const value = option.value || 'all';
            const hiddenInput = document.getElementById('transferDestinationFilterAdminRegional');
            if (hiddenInput) hiddenInput.value = value;
            transfersDataAdminRegional.filters.destinationInventoryId = value;
            transfersDataAdminRegional.currentPage = 0;
            filterTransfersForAdminRegional();
        }
    });
    transferDestinationCustomSelectAdminRegional.setOptions(inventoryOptions);

    // Requester filter
    const requesterOptions = [
        { value: 'all', label: 'Todos los Usuarios' },
        ...transfersDataAdminRegional.users.map(user => ({
            value: user.id.toString(),
            label: user.name
        }))
    ];

    transferRequesterCustomSelectAdminRegional = new CustomSelectClass('transferRequesterFilterAdminRegionalSelect', {
        placeholder: 'Todos los Usuarios',
        onChange: (option) => {
            const value = option.value || 'all';
            const hiddenInput = document.getElementById('transferRequesterFilterAdminRegional');
            if (hiddenInput) hiddenInput.value = value;
            transfersDataAdminRegional.filters.requestedById = value;
            transfersDataAdminRegional.currentPage = 0;
            filterTransfersForAdminRegional();
        }
    });
    transferRequesterCustomSelectAdminRegional.setOptions(requesterOptions);

    // Status filter
    const statusOptions = [
        { value: 'all', label: 'Todos los estados' },
        { value: 'PENDING', label: 'Pendientes' },
        { value: 'APPROVED', label: 'Aprobadas' },
        { value: 'REJECTED', label: 'Rechazadas' }
    ];

    transferStatusCustomSelectAdminRegional = new CustomSelectClass('transferStatusFilterAdminRegionalSelect', {
        placeholder: 'Todos los estados',
        onChange: (option) => {
            const value = option.value || 'all';
            const hiddenInput = document.getElementById('transferStatusFilterAdminRegional');
            if (hiddenInput) hiddenInput.value = value;
            transfersDataAdminRegional.filters.status = value;
            transfersDataAdminRegional.currentPage = 0;
            filterTransfersForAdminRegional();
        }
    });
    
    // Set initial value
    const currentStatus = transfersDataAdminRegional.filters.status || 'all';
    transferStatusCustomSelectAdminRegional.setOptions(statusOptions);
    if (currentStatus !== 'all') {
        const selectedOption = statusOptions.find(opt => opt.value === currentStatus);
        if (selectedOption) {
            transferStatusCustomSelectAdminRegional.setValue(selectedOption.value);
        }
    }
}

/**
 * Handle search for admin regional (kept for backward compatibility)
 */
function handleTransferSearchForAdminRegional(event) {
    if (event.key === 'Enter' || event.type === 'input') {
        const searchTerm = event.target.value.trim();
        transfersDataAdminRegional.filters.searchTerm = searchTerm;
        transfersDataAdminRegional.currentPage = 0;
        filterTransfersForAdminRegional();
    }
}

/**
 * Handle status filter change for admin regional (kept for backward compatibility)
 */
function handleTransferStatusFilterForAdminRegional(status) {
    transfersDataAdminRegional.filters.status = status;
    transfersDataAdminRegional.currentPage = 0;
    filterTransfersForAdminRegional();
}

/**
 * Filter transfers for admin regional
 */
function filterTransfersForAdminRegional() {
    let filtered = [...transfersDataAdminRegional.allTransfers];
    
    // Filter by status
    const statusFilter = transfersDataAdminRegional.filters.status;
    if (statusFilter && statusFilter !== 'all') {
        filtered = filtered.filter(t => {
            const transferStatus = t.status || t.approvalStatus || '';
            return transferStatus.toUpperCase() === statusFilter.toUpperCase();
        });
    }
    
    // Filter by origin inventory
    const originFilter = transfersDataAdminRegional.filters.originInventoryId;
    if (originFilter && originFilter !== 'all') {
        filtered = filtered.filter(t => {
            const sourceInventoryId = (t.sourceInventoryId || '').toString();
            return sourceInventoryId === originFilter.toString();
        });
    }
    
    // Filter by destination inventory
    const destinationFilter = transfersDataAdminRegional.filters.destinationInventoryId;
    if (destinationFilter && destinationFilter !== 'all') {
        filtered = filtered.filter(t => {
            const destinationInventoryId = (t.destinationInventoryId || t.inventory?.id || '').toString();
            return destinationInventoryId === destinationFilter.toString();
        });
    }
    
    // Filter by requester
    const requesterFilter = transfersDataAdminRegional.filters.requestedById;
    if (requesterFilter && requesterFilter !== 'all') {
        filtered = filtered.filter(t => {
            const requestedById = (t.requestedById || '').toString();
            return requestedById === requesterFilter.toString();
        });
    }
    
    // Filter by search term
    const searchTerm = (transfersDataAdminRegional.filters.searchTerm || '').toLowerCase();
    if (searchTerm) {
        filtered = filtered.filter(t => {
            const sourceInventory = (t.sourceInventoryName || t.sourceInventory?.name || '').toLowerCase();
            const destinationInventory = (t.destinationInventoryName || t.inventory?.name || '').toLowerCase();
            const itemName = (t.itemName || t.item?.productName || '').toLowerCase();
            const status = (t.status || t.approvalStatus || '').toLowerCase();
            const details = (t.details || '').toLowerCase();
            const requesterName = (t.requestedByName || '').toLowerCase();
            
            return sourceInventory.includes(searchTerm) ||
                   destinationInventory.includes(searchTerm) ||
                   itemName.includes(searchTerm) ||
                   status.includes(searchTerm) ||
                   details.includes(searchTerm) ||
                   requesterName.includes(searchTerm);
        });
    }
    
    // Store filtered transfers
    transfersDataAdminRegional.filteredTransfers = filtered;
    
    // Update pagination
    transfersDataAdminRegional.totalElements = filtered.length;
    transfersDataAdminRegional.totalPages = Math.ceil(filtered.length / transfersDataAdminRegional.pageSize);
    
    // Reset to first page if current page is out of bounds
    if (transfersDataAdminRegional.currentPage >= transfersDataAdminRegional.totalPages) {
        transfersDataAdminRegional.currentPage = 0;
    }
    
    // Get paginated data
    const startIndex = transfersDataAdminRegional.currentPage * transfersDataAdminRegional.pageSize;
    const endIndex = startIndex + transfersDataAdminRegional.pageSize;
    const paginatedTransfers = filtered.slice(startIndex, endIndex);
    
    // Update window.transfersData for compatibility with existing UI functions
    if (!window.transfersData) {
        window.transfersData = {};
    }
    window.transfersData.transfers = paginatedTransfers;
    window.transfersData.totalElements = transfersDataAdminRegional.totalElements;
    window.transfersData.totalPages = transfersDataAdminRegional.totalPages;
    window.transfersData.currentPage = transfersDataAdminRegional.currentPage;
    window.transfersData.pageSize = transfersDataAdminRegional.pageSize;
    window.transfersData.viewMode = transfersDataAdminRegional.viewMode;
    window.transfersData.filters = transfersDataAdminRegional.filters;
    
    // Update UI
    updateTransfersUIForAdminRegional();
}

/**
 * Show error message
 */
function showError(message) {
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2';
    toast.innerHTML = `
        <i class="fas fa-exclamation-circle"></i>
        <span>${message}</span>
    `;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.remove();
    }, 5000);
}

/**
 * Initialize transfers page for admin regional
 */
function initializeAdminRegionalTransfers() {
    // Check if we're on admin_regional transfers page
    const path = window.location.pathname || '';
    const isAdminRegionalPage = path.includes('/admin_regional/transfers');
    
    if (isAdminRegionalPage) {
        // Override loadTransfersData function
        window.loadTransfersData = loadTransfersForAdminRegional;
        
        // Load transfers when page is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                loadTransfersForAdminRegional();
            });
        } else {
            loadTransfersForAdminRegional();
        }
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAdminRegionalTransfers);
} else {
    initializeAdminRegionalTransfers();
}

// Export functions and data
window.loadTransfersForAdminRegional = loadTransfersForAdminRegional;
window.handleTransferSearchForAdminRegional = handleTransferSearchForAdminRegional;
window.handleTransferStatusFilterForAdminRegional = handleTransferStatusFilterForAdminRegional;
window.initializeAdminRegionalTransfers = initializeAdminRegionalTransfers;
window.transfersDataAdminRegional = transfersDataAdminRegional;

