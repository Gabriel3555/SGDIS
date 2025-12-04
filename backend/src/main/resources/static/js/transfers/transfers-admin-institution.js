// Transfers Admin Institution - Specific functionality for ADMIN_INSTITUTION role
// This file handles loading and displaying transfers for the admin institution's institution

let currentUserInstitutionId = null;
let transfersDataAdminInstitution = {
    allTransfers: [], // Store all transfers for client-side filtering
    filteredTransfers: [], // Filtered transfers
    inventories: [], // Store inventories for origin/destination filters
    users: [], // Store users for requester filter
    currentPage: 0,
    pageSize: 6,
    totalPages: 0,
    totalElements: 0,
    viewMode: 'table', // Default to table view
    filters: {
        status: 'all',
        searchTerm: '',
        originInventoryId: 'all',
        destinationInventoryId: 'all',
        requestedById: 'all'
    }
};
let transferOriginCustomSelectAdminInstitution = null;
let transferDestinationCustomSelectAdminInstitution = null;
let transferRequesterCustomSelectAdminInstitution = null;
let transferStatusCustomSelectAdminInstitution = null;

/**
 * Load current user info to get institution ID
 */
async function loadCurrentUserInfoForTransfersAdminInstitution() {
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
            
            // Get institution ID from user
            if (!userData.institutionId) {
                // If institutionId is not directly available, try to get it from institution name
                const institutionName = userData.institution;
                if (institutionName) {
                    // Fetch all institutions to find the user's institution
                    const institutionsResponse = await fetch('/api/v1/institutions', {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });

                    if (institutionsResponse.ok) {
                        const institutions = await institutionsResponse.json();
                        const userInstitution = institutions.find(inst => inst.name === institutionName);
                        if (userInstitution) {
                            currentUserInstitutionId = userInstitution.id;
                            window.currentUserInstitution = userInstitution;
                        }
                    }
                }
            } else {
                currentUserInstitutionId = userData.institutionId;
            }

            if (!currentUserInstitutionId) {
                throw new Error('Usuario no tiene una institución asignada');
            }

            return currentUserInstitutionId;
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
 * Update welcome message with institution name
 */
function updateTransfersWelcomeMessageAdminInstitution(institutionName) {
    const welcomeMessage = document.getElementById('transferWelcomeMessage');
    if (welcomeMessage && institutionName) {
        welcomeMessage.textContent = `Administración de transferencias de la institución: ${institutionName}`;
    }
}

/**
 * Load inventories for the admin institution's institution
 */
async function loadInventoriesForTransfersAdminInstitution() {
    try {
        if (!currentUserInstitutionId) {
            const institutionId = await loadCurrentUserInfoForTransfersAdminInstitution();
            if (!institutionId) {
                if (window.showErrorToast) {
                    window.showErrorToast('Error', 'No se pudo obtener la información de la institución.');
                }
                return;
            }
        }

        const token = localStorage.getItem('jwt');
        if (!token) {
            throw new Error('No authentication token found');
        }

        // Load all inventories using pagination (more reliable than requesting 10000 at once)
        let allInventories = [];
        let pageNum = 0;
        let hasMore = true;
        const pageSize = 100; // Reasonable page size

        while (hasMore) {
            const response = await fetch(`/api/v1/inventory/institutionAdminInventories?page=${pageNum}&size=${pageSize}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                const inventories = Array.isArray(data.content) ? data.content : [];
                allInventories = allInventories.concat(inventories);
                
                // Check if there are more pages
                hasMore = !data.last && inventories.length === pageSize;
                pageNum++;
            } else {
                // Handle error response
                const errorText = await response.text();
                let errorMessage = 'Error al cargar los inventarios';
                
                try {
                    const errorJson = JSON.parse(errorText);
                    errorMessage = errorJson.message || errorJson.error || errorMessage;
                } catch (e) {
                    errorMessage = errorText || errorMessage;
                }
                
                if (window.showErrorToast) {
                    window.showErrorToast(
                        'Error al Cargar Inventarios', 
                        errorMessage + (response.status === 404 ? ' No se encontró la institución del usuario.' : ''),
                        true,
                        5000
                    );
                }
                
                console.error('Error loading inventories:', response.status, errorMessage);
                hasMore = false;
            }
        }
        
        transfersDataAdminInstitution.inventories = allInventories;
        
        // Update filter dropdowns only if CustomSelects are already initialized
        if (transferOriginCustomSelectAdminInstitution || transferDestinationCustomSelectAdminInstitution) {
            updateInventoryFiltersForAdminInstitution();
        }
    } catch (error) {
        console.error('Error loading inventories for transfers:', error);
        if (window.showErrorToast) {
            window.showErrorToast(
                'Error al Cargar Inventarios', 
                error.message || 'No se pudieron cargar los inventarios. Por favor, intenta nuevamente.',
                true,
                5000
            );
        }
    }
}

/**
 * Load users for the admin institution's institution
 */
async function loadUsersForTransfersAdminInstitution() {
    try {
        // Extract unique users from the transfers
        const uniqueUsers = new Map();
        transfersDataAdminInstitution.allTransfers.forEach(transfer => {
            if (transfer.requestedById && transfer.requestedByName) {
                if (!uniqueUsers.has(transfer.requestedById)) {
                    uniqueUsers.set(transfer.requestedById, {
                        id: transfer.requestedById,
                        name: transfer.requestedByName
                    });
                }
            }
        });
        transfersDataAdminInstitution.users = Array.from(uniqueUsers.values());
        
        // Update requester filter dropdown only if CustomSelect is already initialized
        if (transferRequesterCustomSelectAdminInstitution) {
            updateRequesterFilterForAdminInstitution();
        }
    } catch (error) {
        console.error('Error loading users for transfers:', error);
    }
}

/**
 * Update inventory filters dropdowns
 */
function updateInventoryFiltersForAdminInstitution() {
    const inventoryOptions = [
        { value: 'all', label: 'Todos los Inventarios' },
        ...transfersDataAdminInstitution.inventories.map(inv => ({
            value: (inv.id || '').toString(),
            label: inv.name || 'Sin nombre'
        }))
    ];

    // Only update if CustomSelects are already initialized
    if (transferOriginCustomSelectAdminInstitution) {
        transferOriginCustomSelectAdminInstitution.setOptions(inventoryOptions);
    }
    if (transferDestinationCustomSelectAdminInstitution) {
        transferDestinationCustomSelectAdminInstitution.setOptions(inventoryOptions);
    }
}

/**
 * Update requester filter dropdown
 */
function updateRequesterFilterForAdminInstitution() {
    const requesterOptions = [
        { value: 'all', label: 'Todos los Usuarios' },
        ...transfersDataAdminInstitution.users.map(user => ({
            value: user.id.toString(),
            label: user.name
        }))
    ];

    // Only update if CustomSelect is already initialized
    if (transferRequesterCustomSelectAdminInstitution) {
        transferRequesterCustomSelectAdminInstitution.setOptions(requesterOptions);
    }
}

/**
 * Load transfers for the admin institution's institution
 */
async function loadTransfersForAdminInstitution(page = 0) {
    try {
        // First, get the user's institution ID
        if (!currentUserInstitutionId) {
            const institutionId = await loadCurrentUserInfoForTransfersAdminInstitution();
            if (!institutionId) {
                if (window.showErrorToast) {
                    window.showErrorToast('Error', 'No se pudo obtener la información de la institución.');
                }
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
                    <div class="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                    <div class="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                    <div class="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                </div>
            `;
        }

        // Load all transfers from the institution (for client-side filtering)
        // Use the institution recent endpoint and get all pages
        let allTransfers = [];
        let pageNum = 0;
        let hasMore = true;
        const pageSize = 100;

        while (hasMore) {
            const response = await fetch(`/api/v1/transfers/institution/recent?page=${pageNum}&size=${pageSize}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                const transfers = Array.isArray(data.content) ? data.content : [];
                allTransfers = allTransfers.concat(transfers);
                
                hasMore = !data.last && transfers.length === pageSize;
                pageNum++;
            } else {
                hasMore = false;
            }
        }
        
        // Store all transfers
        transfersDataAdminInstitution.allTransfers = allTransfers;
        
        // Load inventories and users for filters first (before generating HTML)
        await loadInventoriesForTransfersAdminInstitution();
        await loadUsersForTransfersAdminInstitution();
        
        // Then update UI (this will generate HTML and initialize CustomSelects with the loaded data)
        updateTransfersUIForAdminInstitution();
        
        // Apply filters and paginate
        filterTransfersForAdminInstitution();
    } catch (error) {
        console.error('Error loading transfers:', error);
        if (window.showErrorToast) {
            window.showErrorToast(
                'Error al Cargar Transferencias', 
                error.message || 'No se pudieron cargar las transferencias. Por favor, intenta nuevamente.',
                true,
                5000
            );
        }
        const container = document.getElementById('transferTableContainer');
        if (container) {
            container.innerHTML = `
                <div class="text-center py-12 text-gray-500 dark:text-gray-400">
                    <i class="fas fa-exclamation-triangle text-4xl mb-4"></i>
                    <p class="text-lg font-semibold mb-2">Error al cargar las transferencias</p>
                    <p class="text-sm">${error.message}</p>
                    <button onclick="loadTransfersForAdminInstitution()" 
                        class="mt-4 bg-[#00AF00] hover:bg-[#008800] text-white font-semibold py-2 px-4 rounded-xl transition-colors">
                        Reintentar
                    </button>
                </div>
            `;
        }
    }
}

/**
 * Update transfers UI for admin institution
 */
function updateTransfersUIForAdminInstitution() {
    // Update search and filters first (this will generate HTML and initialize CustomSelects)
    updateTransfersSearchAndFiltersForAdminInstitution();
    
    // Update stats
    if (window.updateTransfersStats) {
        window.updateTransfersStats();
    }
    
    // Update table (always use table view for admin institution)
    if (window.updateTransfersTable) {
        window.updateTransfersTable();
    }
    
    // Update pagination
    if (window.updateTransfersPagination) {
        window.updateTransfersPagination();
    }
    
    // Update view mode buttons (but force table view)
    if (window.updateTransfersViewModeButtons) {
        window.updateTransfersViewModeButtons();
    }
}

/**
 * Update search and filters for admin institution
 */
function updateTransfersSearchAndFiltersForAdminInstitution() {
    const container = document.getElementById('searchFilterContainer');
    if (!container) return;
    
    const currentSearchTerm = transfersDataAdminInstitution.filters.searchTerm || '';
    const currentStatusFilter = transfersDataAdminInstitution.filters.status || 'all';
    const currentOriginFilter = transfersDataAdminInstitution.filters.originInventoryId || 'all';
    const currentDestinationFilter = transfersDataAdminInstitution.filters.destinationInventoryId || 'all';
    const currentRequesterFilter = transfersDataAdminInstitution.filters.requestedById || 'all';
    
    // Check if CustomSelect containers already exist
    const existingOriginContainer = document.getElementById('transferOriginFilterAdminInstitutionSelect');
    const existingDestinationContainer = document.getElementById('transferDestinationFilterAdminInstitutionSelect');
    const existingRequesterContainer = document.getElementById('transferRequesterFilterAdminInstitutionSelect');
    const existingStatusContainer = document.getElementById('transferStatusFilterAdminInstitutionSelect');
    
    if (existingOriginContainer && existingDestinationContainer && existingRequesterContainer && existingStatusContainer) {
        // Just update the values without regenerating HTML
        const searchInput = document.getElementById('transferSearchAdminInstitution');
        if (searchInput) searchInput.value = currentSearchTerm;
        return;
    }
    
    container.innerHTML = `
        <!-- Search Bar -->
        <div class="flex-1">
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Buscar</label>
            <div class="relative">
                <input type="text" 
                       id="transferSearchAdminInstitution"
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
                <div class="custom-select" id="transferOriginFilterAdminInstitutionSelect">
                    <div class="custom-select-trigger" style="padding: 0.75rem 1rem; height: 56px; display: flex; align-items: center;">
                        <span class="custom-select-text custom-select-placeholder">Todos los Orígenes</span>
                        <i class="fas fa-chevron-down custom-select-arrow"></i>
                    </div>
                    <div class="custom-select-dropdown">
                        <input type="text" class="custom-select-search" placeholder="Buscar inventario...">
                        <div class="custom-select-options" id="transferOriginFilterAdminInstitutionOptions">
                            <!-- Options loaded dynamically -->
                        </div>
                    </div>
                </div>
                <input type="hidden" id="transferOriginFilterAdminInstitution" value="all">
            </div>
        </div>

        <!-- Destination Filter -->
        <div class="relative" style="min-width: 200px; flex-shrink: 0;">
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Destino</label>
            <div class="custom-select-container">
                <div class="custom-select" id="transferDestinationFilterAdminInstitutionSelect">
                    <div class="custom-select-trigger" style="padding: 0.75rem 1rem; height: 56px; display: flex; align-items: center;">
                        <span class="custom-select-text custom-select-placeholder">Todos los Destinos</span>
                        <i class="fas fa-chevron-down custom-select-arrow"></i>
                    </div>
                    <div class="custom-select-dropdown">
                        <input type="text" class="custom-select-search" placeholder="Buscar inventario...">
                        <div class="custom-select-options" id="transferDestinationFilterAdminInstitutionOptions">
                            <!-- Options loaded dynamically -->
                        </div>
                    </div>
                </div>
                <input type="hidden" id="transferDestinationFilterAdminInstitution" value="all">
            </div>
        </div>

        <!-- Requester Filter -->
        <div class="relative" style="min-width: 200px; flex-shrink: 0;">
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Solicitado por</label>
            <div class="custom-select-container">
                <div class="custom-select" id="transferRequesterFilterAdminInstitutionSelect">
                    <div class="custom-select-trigger" style="padding: 0.75rem 1rem; height: 56px; display: flex; align-items: center;">
                        <span class="custom-select-text custom-select-placeholder">Todos los Usuarios</span>
                        <i class="fas fa-chevron-down custom-select-arrow"></i>
                    </div>
                    <div class="custom-select-dropdown">
                        <input type="text" class="custom-select-search" placeholder="Buscar usuario...">
                        <div class="custom-select-options" id="transferRequesterFilterAdminInstitutionOptions">
                            <!-- Options loaded dynamically -->
                        </div>
                    </div>
                </div>
                <input type="hidden" id="transferRequesterFilterAdminInstitution" value="all">
            </div>
        </div>

        <!-- Status Filter -->
        <div class="relative" style="min-width: 200px; flex-shrink: 0;">
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Estado</label>
            <div class="custom-select-container">
                <div class="custom-select" id="transferStatusFilterAdminInstitutionSelect">
                    <div class="custom-select-trigger" style="padding: 0.75rem 1rem; height: 56px; display: flex; align-items: center;">
                        <span class="custom-select-text custom-select-placeholder">Todos los estados</span>
                        <i class="fas fa-chevron-down custom-select-arrow"></i>
                    </div>
                    <div class="custom-select-dropdown">
                        <input type="text" class="custom-select-search" placeholder="Buscar estado...">
                        <div class="custom-select-options" id="transferStatusFilterAdminInstitutionOptions">
                            <!-- Options loaded dynamically -->
                        </div>
                    </div>
                </div>
                <input type="hidden" id="transferStatusFilterAdminInstitution" value="all">
            </div>
        </div>
    `;
    
    // Initialize CustomSelects after a short delay to ensure DOM is ready
    setTimeout(() => {
        initializeTransferFiltersForAdminInstitution();
        
        // Set up search input listener
        const searchInput = document.getElementById('transferSearchAdminInstitution');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchInput.searchTimeout);
                searchInput.searchTimeout = setTimeout(() => {
                    handleTransferSearchForAdminInstitution(e);
                }, 300);
            });
        }
    }, 100);
}

/**
 * Initialize CustomSelect components for filters
 */
function initializeTransferFiltersForAdminInstitution() {
    const CustomSelectClass = window.CustomSelect || (typeof CustomSelect !== 'undefined' ? CustomSelect : null);
    if (!CustomSelectClass) {
        console.error('CustomSelect class not found. Please ensure centers.js or custom-select.js is loaded before transfers-forms.js');
        // Retry after a short delay
        setTimeout(() => {
            if (window.CustomSelect || typeof CustomSelect !== 'undefined') {
                initializeTransferFiltersForAdminInstitution();
            }
        }, 500);
        return;
    }

    const inventoryOptions = [
        { value: 'all', label: 'Todos los Inventarios' },
        ...transfersDataAdminInstitution.inventories.map(inv => ({
            value: (inv.id || '').toString(),
            label: inv.name || 'Sin nombre'
        }))
    ];

    // Origin filter
    transferOriginCustomSelectAdminInstitution = new CustomSelectClass('transferOriginFilterAdminInstitutionSelect', {
        placeholder: 'Todos los Orígenes',
        onChange: (option) => {
            const value = option.value || 'all';
            const hiddenInput = document.getElementById('transferOriginFilterAdminInstitution');
            if (hiddenInput) hiddenInput.value = value;
            transfersDataAdminInstitution.filters.originInventoryId = value;
            transfersDataAdminInstitution.currentPage = 0;
            filterTransfersForAdminInstitution();
        }
    });
    transferOriginCustomSelectAdminInstitution.setOptions(inventoryOptions);

    // Destination filter
    transferDestinationCustomSelectAdminInstitution = new CustomSelectClass('transferDestinationFilterAdminInstitutionSelect', {
        placeholder: 'Todos los Destinos',
        onChange: (option) => {
            const value = option.value || 'all';
            const hiddenInput = document.getElementById('transferDestinationFilterAdminInstitution');
            if (hiddenInput) hiddenInput.value = value;
            transfersDataAdminInstitution.filters.destinationInventoryId = value;
            transfersDataAdminInstitution.currentPage = 0;
            filterTransfersForAdminInstitution();
        }
    });
    transferDestinationCustomSelectAdminInstitution.setOptions(inventoryOptions);

    // Requester filter
    const requesterOptions = [
        { value: 'all', label: 'Todos los Usuarios' },
        ...transfersDataAdminInstitution.users.map(user => ({
            value: user.id.toString(),
            label: user.name
        }))
    ];

    transferRequesterCustomSelectAdminInstitution = new CustomSelectClass('transferRequesterFilterAdminInstitutionSelect', {
        placeholder: 'Todos los Usuarios',
        onChange: (option) => {
            const value = option.value || 'all';
            const hiddenInput = document.getElementById('transferRequesterFilterAdminInstitution');
            if (hiddenInput) hiddenInput.value = value;
            transfersDataAdminInstitution.filters.requestedById = value;
            transfersDataAdminInstitution.currentPage = 0;
            filterTransfersForAdminInstitution();
        }
    });
    transferRequesterCustomSelectAdminInstitution.setOptions(requesterOptions);

    // Status filter
    const statusOptions = [
        { value: 'all', label: 'Todos los estados' },
        { value: 'PENDING', label: 'Pendientes' },
        { value: 'APPROVED', label: 'Aprobadas' },
        { value: 'REJECTED', label: 'Rechazadas' }
    ];

    // Set initial value before creating CustomSelect to prevent onChange from firing
    const currentStatus = transfersDataAdminInstitution.filters.status || 'all';
    const hiddenInput = document.getElementById('transferStatusFilterAdminInstitution');
    if (hiddenInput) {
        hiddenInput.value = currentStatus;
    }
    
    transferStatusCustomSelectAdminInstitution = new CustomSelectClass('transferStatusFilterAdminInstitutionSelect', {
        placeholder: 'Todos los estados',
        onChange: (option) => {
            const value = option.value || 'all';
            const hiddenInput = document.getElementById('transferStatusFilterAdminInstitution');
            if (hiddenInput) hiddenInput.value = value;
            transfersDataAdminInstitution.filters.status = value;
            transfersDataAdminInstitution.currentPage = 0;
            filterTransfersForAdminInstitution();
        }
    });
    
    // Set options and initial value after creation
    transferStatusCustomSelectAdminInstitution.setOptions(statusOptions);
    if (currentStatus !== 'all') {
        const selectedOption = statusOptions.find(opt => opt.value === currentStatus);
        if (selectedOption) {
            // Use setTimeout to set value after CustomSelect is fully initialized
            setTimeout(() => {
                if (transferStatusCustomSelectAdminInstitution) {
                    transferStatusCustomSelectAdminInstitution.setValue(selectedOption.value, false); // false to prevent onChange
                }
            }, 100);
        }
    } else {
        // Ensure 'all' is selected
        setTimeout(() => {
            if (transferStatusCustomSelectAdminInstitution) {
                transferStatusCustomSelectAdminInstitution.setValue('all', false); // false to prevent onChange
            }
        }, 100);
    }
}

/**
 * Handle search for admin institution
 */
function handleTransferSearchForAdminInstitution(event) {
    if (event.key === 'Enter' || event.type === 'input') {
        const searchTerm = event.target.value.trim();
        transfersDataAdminInstitution.filters.searchTerm = searchTerm;
        transfersDataAdminInstitution.currentPage = 0;
        filterTransfersForAdminInstitution();
        
        // Show search notification
        if (window.showInfoToast) {
            const count = transfersDataAdminInstitution.filteredTransfers?.length || 0;
            if (searchTerm) {
                window.showInfoToast(
                    'Búsqueda Realizada', 
                    `Se encontraron ${count} transferencia${count !== 1 ? 's' : ''} con "${searchTerm}".`,
                    true,
                    3000
                );
            } else {
                window.showInfoToast('Búsqueda Limpiada', `Mostrando todas las transferencias (${count} total).`, true, 2000);
            }
        }
    }
}

/**
 * Filter transfers for admin institution
 */
function filterTransfersForAdminInstitution() {
    let filtered = [...transfersDataAdminInstitution.allTransfers];
    
    // Filter by status
    const statusFilter = transfersDataAdminInstitution.filters.status;
    if (statusFilter && statusFilter !== 'all') {
        filtered = filtered.filter(t => {
            const transferStatus = t.status || t.approvalStatus || '';
            return transferStatus.toUpperCase() === statusFilter.toUpperCase();
        });
    }
    
    // Filter by origin inventory
    const originFilter = transfersDataAdminInstitution.filters.originInventoryId;
    if (originFilter && originFilter !== 'all') {
        filtered = filtered.filter(t => {
            const sourceInventoryId = (t.sourceInventoryId || '').toString();
            return sourceInventoryId === originFilter.toString();
        });
    }
    
    // Filter by destination inventory
    const destinationFilter = transfersDataAdminInstitution.filters.destinationInventoryId;
    if (destinationFilter && destinationFilter !== 'all') {
        filtered = filtered.filter(t => {
            const destinationInventoryId = (t.destinationInventoryId || t.inventory?.id || '').toString();
            return destinationInventoryId === destinationFilter.toString();
        });
    }
    
    // Filter by requester
    const requesterFilter = transfersDataAdminInstitution.filters.requestedById;
    if (requesterFilter && requesterFilter !== 'all') {
        filtered = filtered.filter(t => {
            const requestedById = (t.requestedById || '').toString();
            return requestedById === requesterFilter.toString();
        });
    }
    
    // Filter by search term
    const searchTerm = (transfersDataAdminInstitution.filters.searchTerm || '').toLowerCase();
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
    transfersDataAdminInstitution.filteredTransfers = filtered;
    
    // Update pagination
    transfersDataAdminInstitution.totalElements = filtered.length;
    transfersDataAdminInstitution.totalPages = Math.ceil(filtered.length / transfersDataAdminInstitution.pageSize);
    
    // Reset to first page if current page is out of bounds
    if (transfersDataAdminInstitution.currentPage >= transfersDataAdminInstitution.totalPages) {
        transfersDataAdminInstitution.currentPage = 0;
    }
    
    // Update window.transfersData for compatibility with updateTransfersTable
    if (!window.transfersData) {
        window.transfersData = {};
    }
    
    // Get paginated transfers for current page
    const startIndex = transfersDataAdminInstitution.currentPage * transfersDataAdminInstitution.pageSize;
    const endIndex = startIndex + transfersDataAdminInstitution.pageSize;
    const paginatedTransfers = filtered.slice(startIndex, endIndex);
    
    window.transfersData.transfers = paginatedTransfers;
    window.transfersData.totalElements = transfersDataAdminInstitution.totalElements;
    window.transfersData.totalPages = transfersDataAdminInstitution.totalPages;
    window.transfersData.currentPage = transfersDataAdminInstitution.currentPage;
    window.transfersData.pageSize = transfersDataAdminInstitution.pageSize;
    window.transfersData.viewMode = 'table'; // Force table view
    window.transfersData.filters = transfersDataAdminInstitution.filters;
    
    // Update UI
    updateTransfersUIForAdminInstitution();
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
 * Initialize transfers page for admin institution
 */
function initializeAdminInstitutionTransfers() {
    // Check if we're on admin_institution transfers page
    const path = window.location.pathname || '';
    const isAdminInstitutionPage = path.includes('/admin_institution/transfers') || path.includes('/admininstitution/transfers');
    
    if (isAdminInstitutionPage) {
        // Override loadTransfersData function
        window.loadTransfersData = loadTransfersForAdminInstitution;
        
        // Load transfers when page is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                loadTransfersForAdminInstitution();
            });
        } else {
            loadTransfersForAdminInstitution();
        }
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAdminInstitutionTransfers);
} else {
    initializeAdminInstitutionTransfers();
}

// Export functions and data
window.loadTransfersForAdminInstitution = loadTransfersForAdminInstitution;
window.handleTransferSearchForAdminInstitution = handleTransferSearchForAdminInstitution;
window.initializeAdminInstitutionTransfers = initializeAdminInstitutionTransfers;
window.filterTransfersForAdminInstitution = filterTransfersForAdminInstitution;
window.transfersDataAdminInstitution = transfersDataAdminInstitution;

