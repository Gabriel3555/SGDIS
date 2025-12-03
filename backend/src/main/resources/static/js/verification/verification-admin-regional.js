// Verification Admin Regional - Specific functionality for ADMIN_REGIONAL role
// This file handles loading and displaying verifications for the admin regional's regional

let currentUserRegionalId = null;
let verificationDataAdminRegional = {
    verifications: [],
    filteredVerifications: [],
    inventories: [],
    currentPage: 0,
    pageSize: 6,
    totalPages: 0,
    totalElements: 0,
    filters: {
        status: 'all',
        searchTerm: '',
        inventoryId: 'all'
    }
};

/**
 * Load current user info to get regional ID
 */
async function loadCurrentUserInfoForVerifications() {
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
                        updateVerificationWelcomeMessage(regional.name);
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
function updateVerificationWelcomeMessage(regionalName) {
    const welcomeMessage = document.getElementById('verificationWelcomeMessage');
    if (welcomeMessage && regionalName) {
        welcomeMessage.textContent = `Administración de verificaciones de la regional: ${regionalName}`;
    }
}

/**
 * Load verifications for the admin regional's regional
 */
async function loadVerificationsForAdminRegional(page = 0) {
    try {
        // First, get the user's regional ID
        if (!currentUserRegionalId) {
            const regionalId = await loadCurrentUserInfoForVerifications();
            if (!regionalId) {
                return;
            }
        }

        const token = localStorage.getItem('jwt');
        if (!token) {
            throw new Error('No authentication token found');
        }

        // Show loading state
        const container = document.getElementById('verificationTableContainer');
        if (container) {
            container.innerHTML = `
                <div class="animate-pulse space-y-4">
                    <div class="h-32 bg-gray-200 rounded-xl"></div>
                    <div class="h-32 bg-gray-200 rounded-xl"></div>
                    <div class="h-32 bg-gray-200 rounded-xl"></div>
                </div>
            `;
        }

        // Load verifications from the regional
        const response = await fetch(`/api/v1/verifications/regional/${currentUserRegionalId}?page=${page}&size=${verificationDataAdminRegional.pageSize}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            
            // Update verifications data
            verificationDataAdminRegional.verifications = Array.isArray(data.content) ? data.content : [];
            verificationDataAdminRegional.totalElements = data.totalElements || 0;
            verificationDataAdminRegional.totalPages = data.totalPages || 0;
            verificationDataAdminRegional.currentPage = data.number || 0;
            
            // Apply filters
            filterVerificationsForAdminRegional();
            
            // Update window.verificationData for compatibility with existing UI functions
            if (!window.verificationData) {
                window.verificationData = {};
            }
            window.verificationData.verifications = verificationDataAdminRegional.verifications;
            window.verificationData.filteredVerifications = verificationDataAdminRegional.filteredVerifications;
            window.verificationData.totalElements = verificationDataAdminRegional.totalElements;
            window.verificationData.currentPage = verificationDataAdminRegional.currentPage;
            window.verificationData.itemsPerPage = verificationDataAdminRegional.pageSize;
            window.verificationData.searchTerm = verificationDataAdminRegional.filters.searchTerm;
            window.verificationData.selectedStatus = verificationDataAdminRegional.filters.status;
            
            // Load inventories for filter (must complete before updating UI)
            await loadInventoriesForAdminRegional();
            
            // Update UI (inventories should be loaded by now)
            await updateVerificationUIForAdminRegional();
        } else {
            throw new Error('Error al cargar las verificaciones');
        }
    } catch (error) {
        console.error('Error loading verifications:', error);
        showError('Error al cargar las verificaciones: ' + error.message);
        const container = document.getElementById('verificationTableContainer');
        if (container) {
            container.innerHTML = `
                <div class="text-center py-12 text-gray-500">
                    <i class="fas fa-exclamation-triangle text-4xl mb-4"></i>
                    <p class="text-lg font-semibold mb-2">Error al cargar las verificaciones</p>
                    <p class="text-sm">${error.message}</p>
                    <button onclick="loadVerificationsForAdminRegional()" 
                        class="mt-4 bg-[#00AF00] hover:bg-[#008800] text-white font-semibold py-2 px-4 rounded-xl transition-colors">
                        Reintentar
                    </button>
                </div>
            `;
        }
    }
}

/**
 * Filter verifications for admin regional
 */
function filterVerificationsForAdminRegional() {
    let filtered = [...verificationDataAdminRegional.verifications];
    
    // Filter by inventory
    const inventoryFilter = verificationDataAdminRegional.filters.inventoryId;
    if (inventoryFilter && inventoryFilter !== 'all') {
        filtered = filtered.filter(v => {
            const inventoryId = v.inventoryId || v.item?.inventory?.id || v.item?.inventoryId;
            return inventoryId && (inventoryId.toString() === inventoryFilter.toString() || inventoryId === parseInt(inventoryFilter));
        });
    }
    
    // Filter by status
    const statusFilter = verificationDataAdminRegional.filters.status;
    if (statusFilter && statusFilter !== 'all') {
        filtered = filtered.filter(v => {
            const verificationStatus = v.status || '';
            return verificationStatus.toUpperCase() === statusFilter.toUpperCase();
        });
    }
    
    // Filter by search term
    const searchTerm = (verificationDataAdminRegional.filters.searchTerm || '').toLowerCase();
    if (searchTerm) {
        filtered = filtered.filter(v => {
            const itemName = (v.item?.productName || '').toLowerCase();
            const serialNumber = (v.item?.serialNumber || '').toLowerCase();
            const licencePlate = (v.item?.licencePlateNumber || '').toLowerCase();
            const inventoryName = (v.item?.inventory?.name || '').toLowerCase();
            const status = (v.status || '').toLowerCase();
            const verificationDate = (v.verificationDate || '').toLowerCase();
            
            return itemName.includes(searchTerm) ||
                   serialNumber.includes(searchTerm) ||
                   licencePlate.includes(searchTerm) ||
                   inventoryName.includes(searchTerm) ||
                   status.includes(searchTerm) ||
                   verificationDate.includes(searchTerm);
        });
    }
    
    // Update filtered verifications
    verificationDataAdminRegional.filteredVerifications = filtered;
    
    // Update pagination
    verificationDataAdminRegional.totalPages = Math.ceil(filtered.length / verificationDataAdminRegional.pageSize);
    verificationDataAdminRegional.currentPage = 0; // Reset to first page after filtering
}

/**
 * Load inventories for admin regional filter
 */
async function loadInventoriesForAdminRegional() {
    try {
        const token = localStorage.getItem('jwt');
        if (!token) {
            console.warn('No token found for loading inventories');
            verificationDataAdminRegional.inventories = [];
            return;
        }

        const response = await fetch('/api/v1/inventory/regionalAdminInventories?page=0&size=1000', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            console.log('Inventories response data:', data);
            
            // Handle paginated response (Page object) or direct array
            let inventories = [];
            if (Array.isArray(data)) {
                inventories = data;
            } else if (data && Array.isArray(data.content)) {
                // Spring Page response has 'content' property
                inventories = data.content;
            } else if (data && typeof data === 'object' && data.content) {
                inventories = Array.isArray(data.content) ? data.content : [];
            }
            
            console.log('Loaded inventories count:', inventories.length);
            verificationDataAdminRegional.inventories = inventories;
            
            // Also update window.verificationData for compatibility
            if (window.verificationData) {
                window.verificationData.inventories = inventories;
            }
        } else {
            const errorText = await response.text();
            console.error('Failed to load inventories for admin regional. Status:', response.status, 'Error:', errorText);
            verificationDataAdminRegional.inventories = [];
            if (window.verificationData) {
                window.verificationData.inventories = [];
            }
        }
    } catch (error) {
        console.error('Error loading inventories for admin regional:', error);
        verificationDataAdminRegional.inventories = [];
        if (window.verificationData) {
            window.verificationData.inventories = [];
        }
    }
}

/**
 * Load verification statistics for admin regional
 */
async function loadVerificationStatisticsForAdminRegional() {
    try {
        const token = localStorage.getItem('jwt');
        if (!token) {
            return null;
        }

        const response = await fetch('/api/v1/verifications/regional/statistics', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const statistics = await response.json();
            // Store statistics in verificationData
            if (window.verificationData) {
                window.verificationData.statistics = statistics;
            }
            if (verificationDataAdminRegional) {
                verificationDataAdminRegional.statistics = statistics;
            }
            return statistics;
        } else {
            console.warn('Failed to load verification statistics, falling back to local calculation');
            return null;
        }
    } catch (error) {
        console.error('Error loading verification statistics:', error);
        return null;
    }
}

/**
 * Update verification UI for admin regional
 */
async function updateVerificationUIForAdminRegional() {
    // Load statistics first (for ADMIN_REGIONAL, this will use the regional endpoint)
    await loadVerificationStatisticsForAdminRegional();
    
    // Update stats
    if (window.updateStatsCards) {
        window.updateStatsCards();
    }
    
    // Update table
    if (window.updateVerificationTable) {
        window.updateVerificationTable();
    }
    
    // Update pagination
    if (window.updatePagination) {
        window.updatePagination();
    }
    
    // Update search and filters (simplified for admin regional)
    updateVerificationSearchAndFiltersForAdminRegional();
}

// Custom Select instance for admin regional inventory filter
let verificationInventoryCustomSelectAdminRegional = null;
// Flag to prevent infinite loops during initialization
let isInitializingInventoryFilter = false;

/**
 * Update search and filters for admin regional (simplified version)
 */
function updateVerificationSearchAndFiltersForAdminRegional() {
    const container = document.getElementById('searchFilterContainer');
    if (!container) {
        console.warn('searchFilterContainer not found');
        return;
    }
    
    const currentSearchTerm = verificationDataAdminRegional.filters.searchTerm || '';
    const currentStatusFilter = verificationDataAdminRegional.filters.status || 'all';
    const currentInventoryFilter = verificationDataAdminRegional.filters.inventoryId || 'all';
    
    // Build inventory options - check both verificationDataAdminRegional and window.verificationData
    let inventories = verificationDataAdminRegional.inventories || [];
    if (inventories.length === 0 && window.verificationData && window.verificationData.inventories) {
        inventories = window.verificationData.inventories;
        console.log('Using inventories from window.verificationData');
    }
    
    console.log('Updating filters with inventories:', inventories.length);
    
    // Check if the container already has the filters (to avoid regenerating unnecessarily)
    const existingInventorySelect = document.getElementById('verificationInventoryFilterAdminRegionalSelect');
    const existingSearchInput = document.getElementById('verificationSearchAdminRegional');
    
    // Only regenerate HTML if it doesn't exist or if inventories changed
    const needsRegeneration = !existingInventorySelect || !existingSearchInput;
    
    if (!needsRegeneration && verificationInventoryCustomSelectAdminRegional) {
        // Just update the options without regenerating HTML
        const options = [
            { value: 'all', label: 'Todos los Inventarios' },
            ...inventories.map(inv => ({
                value: (inv.id || inv.inventoryId).toString(),
                label: inv.name || inv.inventoryName || `Inventario ${inv.id || inv.inventoryId}`
            }))
        ];
        
        isInitializingInventoryFilter = true;
        verificationInventoryCustomSelectAdminRegional.setOptions(options);
        
        // Update selected value if needed
        if (currentInventoryFilter && currentInventoryFilter !== 'all') {
            verificationInventoryCustomSelectAdminRegional.setValue(currentInventoryFilter.toString());
        } else {
            verificationInventoryCustomSelectAdminRegional.setValue('all');
        }
        
        setTimeout(() => {
            isInitializingInventoryFilter = false;
        }, 100);
        
        return;
    }
    
    // Reset custom select instance since HTML will be regenerated
    verificationInventoryCustomSelectAdminRegional = null;
    
    container.innerHTML = `
        <div class="relative flex-1" style="min-width: 200px;">
            <label class="block text-xs font-medium text-gray-600 mb-1.5">Buscar</label>
            <div class="relative">
                <i class="fas fa-search absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                <input type="text" 
                    id="verificationSearchAdminRegional"
                    placeholder="Buscar por ítem, serial, placa, inventario..." 
                    value="${currentSearchTerm}"
                    onkeyup="handleVerificationSearchForAdminRegional(event)"
                    class="w-full pl-11 pr-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00AF00] bg-white text-gray-900 transition-all"
                    style="height: 56px; font-size: 0.9375rem;">
            </div>
        </div>
        <div class="relative" style="min-width: 200px; flex-shrink: 0;">
            <label class="block text-xs font-medium text-gray-600 mb-1.5">Filtrar por Inventario</label>
            <div class="custom-select-container">
                <div class="custom-select" id="verificationInventoryFilterAdminRegionalSelect">
                    <div class="custom-select-trigger" style="padding: 0.75rem 1rem; height: 56px; display: flex; align-items: center;">
                        <span class="custom-select-text custom-select-placeholder">Todos los Inventarios</span>
                        <i class="fas fa-chevron-down custom-select-arrow"></i>
                    </div>
                    <div class="custom-select-dropdown">
                        <input type="text" class="custom-select-search" placeholder="Buscar inventario...">
                        <div class="custom-select-options" id="verificationInventoryFilterAdminRegionalOptions">
                            <!-- Options loaded dynamically -->
                        </div>
                    </div>
                </div>
                <input type="hidden" id="verificationInventoryFilterAdminRegional" value="${currentInventoryFilter}">
            </div>
        </div>
        <div class="relative" style="min-width: 180px; flex-shrink: 0;">
            <label class="block text-xs font-medium text-gray-600 mb-1.5">Estado</label>
            <select id="verificationStatusFilterAdminRegional" 
                onchange="handleVerificationStatusFilterForAdminRegional(this.value)" 
                class="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00AF00] bg-white text-gray-900 transition-all" 
                style="height: 56px; font-size: 0.9375rem;">
                <option value="all" ${currentStatusFilter === 'all' ? 'selected' : ''}>Todos los estados</option>
                <option value="PENDING" ${currentStatusFilter === 'PENDING' ? 'selected' : ''}>Pendientes</option>
                <option value="IN_PROGRESS" ${currentStatusFilter === 'IN_PROGRESS' ? 'selected' : ''}>En Progreso</option>
                <option value="COMPLETED" ${currentStatusFilter === 'COMPLETED' ? 'selected' : ''}>Completadas</option>
                <option value="VERIFIED" ${currentStatusFilter === 'VERIFIED' ? 'selected' : ''}>Verificadas</option>
                <option value="REJECTED" ${currentStatusFilter === 'REJECTED' ? 'selected' : ''}>Rechazadas</option>
            </select>
        </div>
    `;
    
    // Initialize Custom Select after HTML is inserted
    setTimeout(() => {
        initializeInventoryCustomSelectForAdminRegional(inventories, currentInventoryFilter);
    }, 50);
}

/**
 * Initialize Custom Select for inventory filter (Admin Regional)
 */
function initializeInventoryCustomSelectForAdminRegional(inventories, currentInventoryFilter) {
    // Check if CustomSelect is available
    if (typeof CustomSelect === 'undefined' && typeof window.CustomSelect === 'undefined') {
        console.warn('CustomSelect class not available, falling back to regular select');
        return;
    }
    
    const CustomSelectClass = window.CustomSelect || CustomSelect;
    const inventorySelect = document.getElementById('verificationInventoryFilterAdminRegionalSelect');
    
    if (!inventorySelect) {
        console.warn('Inventory select container not found');
        return;
    }
    
    // Initialize Custom Select if not already initialized
    if (!verificationInventoryCustomSelectAdminRegional) {
        verificationInventoryCustomSelectAdminRegional = new CustomSelectClass('verificationInventoryFilterAdminRegionalSelect', {
            placeholder: 'Todos los Inventarios',
            onChange: (option) => {
                // Don't trigger filter change during initialization
                if (isInitializingInventoryFilter) {
                    return;
                }
                const value = option.value || 'all';
                const hiddenInput = document.getElementById('verificationInventoryFilterAdminRegional');
                if (hiddenInput) {
                    hiddenInput.value = value;
                }
                handleVerificationInventoryFilterForAdminRegional(value);
            }
        });
    }
    
    // Build options array
    const options = [
        { value: 'all', label: 'Todos los Inventarios' },
        ...inventories.map(inv => ({
            value: (inv.id || inv.inventoryId).toString(),
            label: inv.name || inv.inventoryName || `Inventario ${inv.id || inv.inventoryId}`
        }))
    ];
    
    console.log('Setting CustomSelect options:', options.length);
    
    // Set flag to prevent onChange during initialization
    isInitializingInventoryFilter = true;
    
    // Set options
    verificationInventoryCustomSelectAdminRegional.setOptions(options);
    
    // Set selected value without triggering onChange
    if (currentInventoryFilter && currentInventoryFilter !== 'all') {
        const selectedOption = options.find(opt => opt.value === currentInventoryFilter.toString());
        if (selectedOption) {
            // Use setValue instead of selectOption to avoid triggering onChange
            verificationInventoryCustomSelectAdminRegional.setValue(selectedOption.value);
        }
    } else {
        // Select "all" option
        const allOption = options.find(opt => opt.value === 'all');
        if (allOption) {
            verificationInventoryCustomSelectAdminRegional.setValue('all');
        }
    }
    
    // Reset flag after initialization
    setTimeout(() => {
        isInitializingInventoryFilter = false;
    }, 100);
}

/**
 * Handle search for admin regional
 */
function handleVerificationSearchForAdminRegional(event) {
    if (event.key === 'Enter' || event.type === 'input') {
        const searchTerm = event.target.value.trim();
        verificationDataAdminRegional.filters.searchTerm = searchTerm;
        filterVerificationsForAdminRegional();
        updateVerificationUIForAdminRegional();
    }
}

/**
 * Handle inventory filter change for admin regional
 */
async function handleVerificationInventoryFilterForAdminRegional(inventoryId) {
    verificationDataAdminRegional.filters.inventoryId = inventoryId;
    
    // Reload verifications with inventory filter
    if (inventoryId && inventoryId !== 'all') {
        // Load verifications filtered by inventory
        await loadVerificationsForAdminRegionalByInventory(inventoryId);
    } else {
        // Load all verifications for regional
        await loadVerificationsForAdminRegional(0);
    }
}

/**
 * Load verifications filtered by inventory for admin regional
 * Uses the regional endpoint and filters by inventory on the client side
 */
async function loadVerificationsForAdminRegionalByInventory(inventoryId) {
    // Instead of using the general endpoint (which requires superadmin permissions),
    // we load all verifications from the regional and filter by inventory on the client side
    // First, ensure we have the regional ID
    if (!currentUserRegionalId) {
        const regionalId = await loadCurrentUserInfoForVerifications();
        if (!regionalId) {
            showError('No se pudo obtener la información de la regional');
            return;
        }
    }
    
    // Load all verifications from regional (with a larger page size to get all data)
    // Then filter by inventory on the client side
    try {
        const token = localStorage.getItem('jwt');
        if (!token) {
            throw new Error('No authentication token found');
        }

        // Show loading state
        const container = document.getElementById('verificationTableContainer');
        if (container) {
            container.innerHTML = `
                <div class="animate-pulse space-y-4">
                    <div class="h-32 bg-gray-200 rounded-xl"></div>
                    <div class="h-32 bg-gray-200 rounded-xl"></div>
                    <div class="h-32 bg-gray-200 rounded-xl"></div>
                </div>
            `;
        }

        // Load verifications from regional (use a large page size to get all verifications)
        const response = await fetch(`/api/v1/verifications/regional/${currentUserRegionalId}?page=0&size=1000`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            
            // Get all verifications (handle pagination if needed)
            let allVerifications = Array.isArray(data.content) ? data.content : [];
            
            // If there are more pages, we might need to load them, but for now we'll work with what we have
            // Filter by inventory on client side
            const filteredByInventory = allVerifications.filter(v => {
                const vInventoryId = v.inventoryId || v.item?.inventory?.id || v.item?.inventoryId;
                return vInventoryId && (vInventoryId.toString() === inventoryId.toString() || vInventoryId === parseInt(inventoryId));
            });
            
            // Update verifications data with filtered results
            verificationDataAdminRegional.verifications = filteredByInventory;
            verificationDataAdminRegional.totalElements = filteredByInventory.length;
            verificationDataAdminRegional.totalPages = Math.ceil(filteredByInventory.length / verificationDataAdminRegional.pageSize);
            verificationDataAdminRegional.currentPage = 0;
            
            // Apply other filters (status, search)
            filterVerificationsForAdminRegional();
            
            // Update window.verificationData for compatibility
            if (!window.verificationData) {
                window.verificationData = {};
            }
            window.verificationData.verifications = verificationDataAdminRegional.verifications;
            window.verificationData.filteredVerifications = verificationDataAdminRegional.filteredVerifications;
            window.verificationData.totalElements = verificationDataAdminRegional.totalElements;
            window.verificationData.currentPage = verificationDataAdminRegional.currentPage;
            window.verificationData.itemsPerPage = verificationDataAdminRegional.pageSize;
            window.verificationData.searchTerm = verificationDataAdminRegional.filters.searchTerm;
            window.verificationData.selectedStatus = verificationDataAdminRegional.filters.status;
            
            // Update UI
            await updateVerificationUIForAdminRegional();
        } else {
            throw new Error('Error al cargar las verificaciones');
        }
    } catch (error) {
        console.error('Error loading verifications by inventory:', error);
        showError('Error al cargar las verificaciones: ' + error.message);
    }
}

/**
 * Handle status filter change for admin regional
 */
function handleVerificationStatusFilterForAdminRegional(status) {
    verificationDataAdminRegional.filters.status = status;
    filterVerificationsForAdminRegional();
    updateVerificationUIForAdminRegional();
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
 * Initialize verification page for admin regional
 */
function initializeAdminRegionalVerifications() {
    // Check if we're on admin_regional verification page
    const path = window.location.pathname || '';
    const isAdminRegionalPage = path.includes('/admin_regional/verification');
    
    if (isAdminRegionalPage) {
        // Override loadVerificationData function
        window.loadVerificationData = loadVerificationsForAdminRegional;
        
        // Load verifications when page is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                loadVerificationsForAdminRegional();
            });
        } else {
            loadVerificationsForAdminRegional();
        }
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAdminRegionalVerifications);
} else {
    initializeAdminRegionalVerifications();
}

// Export functions
window.loadVerificationsForAdminRegional = loadVerificationsForAdminRegional;
window.loadVerificationStatisticsForAdminRegional = loadVerificationStatisticsForAdminRegional;
window.loadInventoriesForAdminRegional = loadInventoriesForAdminRegional;
window.handleVerificationSearchForAdminRegional = handleVerificationSearchForAdminRegional;
window.handleVerificationInventoryFilterForAdminRegional = handleVerificationInventoryFilterForAdminRegional;
window.handleVerificationStatusFilterForAdminRegional = handleVerificationStatusFilterForAdminRegional;
window.initializeAdminRegionalVerifications = initializeAdminRegionalVerifications;

