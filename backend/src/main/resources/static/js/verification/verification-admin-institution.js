// Verification Admin Institution - Specific functionality for ADMIN_INSTITUTION role
// This file handles loading and displaying verifications for the admin institution's institution

let currentUserInstitutionId = null;
// Make it globally accessible for batch verification validation
window.currentUserInstitutionId = currentUserInstitutionId;
let verificationDataAdminInstitution = {
    verifications: [],
    filteredVerifications: [],
    inventories: [],
    currentPage: 0,
    pageSize: 6,
    totalPages: 0,
    totalElements: 0,
    currentVerificationId: null, // For upload evidence modal
    filters: {
        status: 'all',
        searchTerm: '',
        inventoryId: 'all'
    }
};

// Make it globally accessible
window.verificationDataAdminInstitution = verificationDataAdminInstitution;

/**
 * Load current user info to get institution ID from token/user
 */
async function loadCurrentUserInfoForVerifications() {
    try {
        const token = localStorage.getItem('jwt');
        if (!token) {
            throw new Error('No authentication token found');
        }

        // Get user info to get institution name
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

            // Get institution ID directly from user data (now included in UserResponse)
            if (userData.institutionId) {
                currentUserInstitutionId = userData.institutionId;
                window.currentUserInstitutionId = currentUserInstitutionId;
            } else {
                // Fallback: if institutionId is not available, try to get it from institutions list
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

                    if (userInstitution && userInstitution.id) {
                        currentUserInstitutionId = userInstitution.id;
                        window.currentUserInstitutionId = currentUserInstitutionId;
                        window.currentUserInstitution = userInstitution;
                    }
                }
            }
            
            // Update welcome message with institution name
            updateVerificationWelcomeMessage(institutionName);

            // Return a marker that we'll use the current endpoint
            return 'current';
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
function updateVerificationWelcomeMessage(institutionName) {
    const welcomeMessage = document.getElementById('verificationWelcomeMessage');
    if (welcomeMessage && institutionName) {
        welcomeMessage.textContent = `Administración de verificaciones de la institución: ${institutionName}`;
    }
}

/**
 * Load verifications for the admin institution's institution
 */
async function loadVerificationsForAdminInstitution(page = 0) {
    try {
        // First, get the user's info (to get institution name for welcome message)
        if (currentUserInstitutionId === null) {
            const result = await loadCurrentUserInfoForVerifications();
            if (!result) {
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

        // Load verifications from the current user's institution (backend gets it from token)
        const response = await fetch(`/api/v1/verifications/institution/current?page=${page}&size=${verificationDataAdminInstitution.pageSize}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            
            // Transform the response to match frontend expectations (same as fetchAllVerifications)
            let verifications = Array.isArray(data.content) ? data.content : [];
            verifications = verifications.map(v => ({
                id: v.id || v.verificationId,
                itemId: v.itemId,
                licensePlate: v.itemLicencePlateNumber || v.licencePlateNumber || v.licensePlate,
                itemName: v.itemName,
                inventoryId: v.inventoryId,
                inventoryName: v.inventoryName,
                status: v.status || 'PENDING',
                hasEvidence: v.photoUrl && v.photoUrl.length > 0,
                verificationDate: v.verifiedAt || v.createdAt || v.verificationDate,
                createdAt: v.createdAt || v.verifiedAt,
                photoUrl: v.photoUrl || null,
                photoUrls: v.photoUrl ? [v.photoUrl] : [],
                userId: v.userId,
                userFullName: v.userFullName,
                userEmail: v.userEmail,
                // Keep original fields for compatibility
                itemLicencePlateNumber: v.itemLicencePlateNumber,
                serialNumber: v.serialNumber || null
            }));
            
            // Update verifications data
            verificationDataAdminInstitution.verifications = verifications;
            verificationDataAdminInstitution.totalElements = data.totalElements || 0;
            verificationDataAdminInstitution.totalPages = data.totalPages || 0;
            verificationDataAdminInstitution.currentPage = data.number || 0;
            
            // Apply filters
            filterVerificationsForAdminInstitution();
            
            // Update window.verificationData for compatibility with existing UI functions
            if (!window.verificationData) {
                window.verificationData = {};
            }
            window.verificationData.verifications = verificationDataAdminInstitution.verifications;
            window.verificationData.filteredVerifications = verificationDataAdminInstitution.filteredVerifications;
            window.verificationData.totalElements = verificationDataAdminInstitution.totalElements;
            window.verificationData.currentPage = verificationDataAdminInstitution.currentPage;
            window.verificationData.itemsPerPage = verificationDataAdminInstitution.pageSize;
            window.verificationData.searchTerm = verificationDataAdminInstitution.filters.searchTerm;
            window.verificationData.selectedStatus = verificationDataAdminInstitution.filters.status;
            
            // Load inventories for filter (must complete before updating UI)
            await loadInventoriesForAdminInstitution();
            
            // Update UI (inventories should be loaded by now)
            await updateVerificationUIForAdminInstitution();
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
                    <button onclick="loadVerificationsForAdminInstitution()" 
                        class="mt-4 bg-[#00AF00] hover:bg-[#008800] text-white font-semibold py-2 px-4 rounded-xl transition-colors">
                        Reintentar
                    </button>
                </div>
            `;
        }
    }
}

/**
 * Filter verifications for admin institution
 */
function filterVerificationsForAdminInstitution() {
    let filtered = [...verificationDataAdminInstitution.verifications];
    
    // Filter by inventory
    const inventoryFilter = verificationDataAdminInstitution.filters.inventoryId;
    if (inventoryFilter && inventoryFilter !== 'all') {
        filtered = filtered.filter(v => {
            const inventoryId = v.inventoryId || v.item?.inventory?.id || v.item?.inventoryId;
            return inventoryId && (inventoryId.toString() === inventoryFilter.toString() || inventoryId === parseInt(inventoryFilter));
        });
    }
    
    // Filter by status
    const statusFilter = verificationDataAdminInstitution.filters.status;
    if (statusFilter && statusFilter !== 'all') {
        filtered = filtered.filter(v => {
            const verificationStatus = v.status || '';
            return verificationStatus.toUpperCase() === statusFilter.toUpperCase();
        });
    }
    
    // Filter by search term
    const searchTerm = (verificationDataAdminInstitution.filters.searchTerm || '').toLowerCase();
    if (searchTerm) {
        filtered = filtered.filter(v => {
            const itemName = (v.itemName || v.item?.productName || '').toLowerCase();
            const serialNumber = (v.serialNumber || v.item?.serialNumber || '').toLowerCase();
            const licencePlate = (v.licensePlate || v.itemLicencePlateNumber || v.item?.licencePlateNumber || '').toLowerCase();
            const inventoryName = (v.inventoryName || v.item?.inventory?.name || '').toLowerCase();
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
    verificationDataAdminInstitution.filteredVerifications = filtered;
    
    // Update window.verificationData for compatibility with existing UI functions
    if (!window.verificationData) {
        window.verificationData = {};
    }
    window.verificationData.filteredVerifications = filtered;
    window.verificationData.verifications = verificationDataAdminInstitution.verifications;
    
    // Update pagination
    verificationDataAdminInstitution.totalPages = Math.ceil(filtered.length / verificationDataAdminInstitution.pageSize);
    verificationDataAdminInstitution.currentPage = 0; // Reset to first page after filtering
    
    // Update table if function is available
    if (typeof updateVerificationTable === 'function') {
        updateVerificationTable();
    } else if (typeof window.updateVerificationTable === 'function') {
        window.updateVerificationTable();
    }
    
    // Update pagination if function is available
    if (typeof updatePagination === 'function') {
        updatePagination();
    } else if (typeof window.updatePagination === 'function') {
        window.updatePagination();
    }
}

/**
 * Load inventories for admin institution filter
 */
async function loadInventoriesForAdminInstitution() {
    try {
        const token = localStorage.getItem('jwt');
        if (!token) {
            console.warn('No token found for loading inventories');
            verificationDataAdminInstitution.inventories = [];
            return;
        }

        const response = await fetch('/api/v1/inventory/institutionAdminInventories?page=0&size=1000', {
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
            verificationDataAdminInstitution.inventories = inventories;
            
            // Also update window.verificationData for compatibility
            if (window.verificationData) {
                window.verificationData.inventories = inventories;
            }
        } else {
            const errorText = await response.text();
            console.error('Failed to load inventories for admin institution. Status:', response.status, 'Error:', errorText);
            verificationDataAdminInstitution.inventories = [];
            if (window.verificationData) {
                window.verificationData.inventories = [];
            }
        }
    } catch (error) {
        console.error('Error loading inventories for admin institution:', error);
        verificationDataAdminInstitution.inventories = [];
        if (window.verificationData) {
            window.verificationData.inventories = [];
        }
    }
}

/**
 * Load verification statistics for admin institution
 */
async function loadVerificationStatisticsForAdminInstitution() {
    try {
        const token = localStorage.getItem('jwt');
        if (!token) {
            return null;
        }

        const response = await fetch('/api/v1/verifications/institution/statistics', {
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
            if (verificationDataAdminInstitution) {
                verificationDataAdminInstitution.statistics = statistics;
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
 * Update verification UI for admin institution
 */
async function updateVerificationUIForAdminInstitution() {
    // Load statistics first (for ADMIN_INSTITUTION, this will use the institution endpoint)
    await loadVerificationStatisticsForAdminInstitution();
    
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
    
    // Update search and filters (simplified for admin institution)
    updateVerificationSearchAndFiltersForAdminInstitution();
}

// Custom Select instance for admin institution inventory filter
let verificationInventoryCustomSelectAdminInstitution = null;
// Flag to prevent infinite loops during initialization
let isInitializingInventoryFilter = false;

/**
 * Update search and filters for admin institution (simplified version)
 */
function updateVerificationSearchAndFiltersForAdminInstitution() {
    const container = document.getElementById('searchFilterContainer');
    if (!container) {
        console.warn('searchFilterContainer not found');
        return;
    }
    
    const currentSearchTerm = verificationDataAdminInstitution.filters.searchTerm || '';
    const currentStatusFilter = verificationDataAdminInstitution.filters.status || 'all';
    const currentInventoryFilter = verificationDataAdminInstitution.filters.inventoryId || 'all';
    
    // Build inventory options - check both verificationDataAdminInstitution and window.verificationData
    let inventories = verificationDataAdminInstitution.inventories || [];
    if (inventories.length === 0 && window.verificationData && window.verificationData.inventories) {
        inventories = window.verificationData.inventories;
        console.log('Using inventories from window.verificationData');
    }
    
    console.log('Updating filters with inventories:', inventories.length);
    
    // Check if the container already has the filters (to avoid regenerating unnecessarily)
    const existingInventorySelect = document.getElementById('verificationInventoryFilterAdminInstitutionSelect');
    const existingSearchInput = document.getElementById('verificationSearchAdminInstitution');
    
    // Only regenerate HTML if it doesn't exist or if inventories changed
    const needsRegeneration = !existingInventorySelect || !existingSearchInput;
    
    if (!needsRegeneration && verificationInventoryCustomSelectAdminInstitution) {
        // Just update the options without regenerating HTML
        const options = [
            { value: 'all', label: 'Todos los Inventarios' },
            ...inventories.map(inv => ({
                value: (inv.id || inv.inventoryId).toString(),
                label: inv.name || inv.inventoryName || `Inventario ${inv.id || inv.inventoryId}`
            }))
        ];
        
        isInitializingInventoryFilter = true;
        verificationInventoryCustomSelectAdminInstitution.setOptions(options);
        
        // Update selected value if needed
        if (currentInventoryFilter && currentInventoryFilter !== 'all') {
            verificationInventoryCustomSelectAdminInstitution.setValue(currentInventoryFilter.toString());
        } else {
            verificationInventoryCustomSelectAdminInstitution.setValue('all');
        }
        
        setTimeout(() => {
            isInitializingInventoryFilter = false;
        }, 100);
        
        return;
    }
    
    // Reset custom select instance since HTML will be regenerated
    verificationInventoryCustomSelectAdminInstitution = null;
    
    container.innerHTML = `
        <div class="relative flex-1" style="min-width: 200px;">
            <label class="block text-xs font-medium text-gray-600 mb-1.5">Buscar</label>
            <div class="relative">
                <i class="fas fa-search absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                <input type="text" 
                    id="verificationSearchAdminInstitution"
                    placeholder="Buscar por ítem, serial, placa, inventario..." 
                    value="${currentSearchTerm}"
                    onkeyup="handleVerificationSearchForAdminInstitution(event)"
                    class="w-full pl-11 pr-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00AF00] bg-white text-gray-900 transition-all"
                    style="height: 56px; font-size: 0.9375rem;">
            </div>
        </div>
        <div class="relative" style="min-width: 200px; flex-shrink: 0;">
            <label class="block text-xs font-medium text-gray-600 mb-1.5">Filtrar por Inventario</label>
            <div class="custom-select-container">
                <div class="custom-select" id="verificationInventoryFilterAdminInstitutionSelect">
                    <div class="custom-select-trigger" style="padding: 0.75rem 1rem; height: 56px; display: flex; align-items: center;">
                        <span class="custom-select-text custom-select-placeholder">Todos los Inventarios</span>
                        <i class="fas fa-chevron-down custom-select-arrow"></i>
                    </div>
                    <div class="custom-select-dropdown">
                        <input type="text" class="custom-select-search" placeholder="Buscar inventario...">
                        <div class="custom-select-options" id="verificationInventoryFilterAdminInstitutionOptions">
                            <!-- Options loaded dynamically -->
                        </div>
                    </div>
                </div>
                <input type="hidden" id="verificationInventoryFilterAdminInstitution" value="${currentInventoryFilter}">
            </div>
        </div>
        <div class="relative" style="min-width: 180px; flex-shrink: 0;">
            <label class="block text-xs font-medium text-gray-600 mb-1.5">Estado</label>
            <select id="verificationStatusFilterAdminInstitution" 
                onchange="handleVerificationStatusFilterForAdminInstitution(this.value)" 
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
        initializeInventoryCustomSelectForAdminInstitution(inventories, currentInventoryFilter);
    }, 50);
}

/**
 * Initialize Custom Select for inventory filter (Admin Institution)
 */
function initializeInventoryCustomSelectForAdminInstitution(inventories, currentInventoryFilter) {
    // Check if CustomSelect is available
    if (typeof CustomSelect === 'undefined' && typeof window.CustomSelect === 'undefined') {
        console.warn('CustomSelect class not available, falling back to regular select');
        return;
    }
    
    const CustomSelectClass = window.CustomSelect || CustomSelect;
    const inventorySelect = document.getElementById('verificationInventoryFilterAdminInstitutionSelect');
    
    if (!inventorySelect) {
        console.warn('Inventory select container not found');
        return;
    }
    
    // Initialize Custom Select if not already initialized
    if (!verificationInventoryCustomSelectAdminInstitution) {
        verificationInventoryCustomSelectAdminInstitution = new CustomSelectClass('verificationInventoryFilterAdminInstitutionSelect', {
            placeholder: 'Todos los Inventarios',
            onChange: (option) => {
                // Don't trigger filter change during initialization
                if (isInitializingInventoryFilter) {
                    return;
                }
                const value = option.value || 'all';
                const hiddenInput = document.getElementById('verificationInventoryFilterAdminInstitution');
                if (hiddenInput) {
                    hiddenInput.value = value;
                }
                handleVerificationInventoryFilterForAdminInstitution(value);
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
    verificationInventoryCustomSelectAdminInstitution.setOptions(options);
    
    // Set selected value without triggering onChange
    if (currentInventoryFilter && currentInventoryFilter !== 'all') {
        const selectedOption = options.find(opt => opt.value === currentInventoryFilter.toString());
        if (selectedOption) {
            // Use setValue instead of selectOption to avoid triggering onChange
            verificationInventoryCustomSelectAdminInstitution.setValue(selectedOption.value);
        }
    } else {
        // Select "all" option
        const allOption = options.find(opt => opt.value === 'all');
        if (allOption) {
            verificationInventoryCustomSelectAdminInstitution.setValue('all');
        }
    }
    
    // Reset flag after initialization
    setTimeout(() => {
        isInitializingInventoryFilter = false;
    }, 100);
}

/**
 * Handle search for admin institution
 */
function handleVerificationSearchForAdminInstitution(event) {
    if (event.key === 'Enter' || event.type === 'input') {
        const searchTerm = event.target.value.trim();
        verificationDataAdminInstitution.filters.searchTerm = searchTerm;
        filterVerificationsForAdminInstitution();
        updateVerificationUIForAdminInstitution();
    }
}

/**
 * Handle inventory filter change for admin institution
 */
async function handleVerificationInventoryFilterForAdminInstitution(inventoryId) {
    verificationDataAdminInstitution.filters.inventoryId = inventoryId;
    
    // Reload verifications with inventory filter
    if (inventoryId && inventoryId !== 'all') {
        // Load verifications filtered by inventory
        await loadVerificationsForAdminInstitutionByInventory(inventoryId);
    } else {
        // Load all verifications for institution
        await loadVerificationsForAdminInstitution(0);
    }
}

/**
 * Load verifications filtered by inventory for admin institution
 * Uses the institution endpoint and filters by inventory on the client side
 */
async function loadVerificationsForAdminInstitutionByInventory(inventoryId) {
    // Instead of using the general endpoint (which requires superadmin permissions),
    // we load all verifications from the institution and filter by inventory on the client side
    // First, ensure we have loaded user info
    if (currentUserInstitutionId === null) {
        const result = await loadCurrentUserInfoForVerifications();
        if (!result) {
            showError('No se pudo obtener la información de la institución');
            return;
        }
    }
    
    // Load all verifications from institution (with a larger page size to get all data)
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

        // Load verifications from current user's institution (use a large page size to get all verifications)
        const response = await fetch(`/api/v1/verifications/institution/current?page=0&size=1000`, {
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
            verificationDataAdminInstitution.verifications = filteredByInventory;
            verificationDataAdminInstitution.totalElements = filteredByInventory.length;
            verificationDataAdminInstitution.totalPages = Math.ceil(filteredByInventory.length / verificationDataAdminInstitution.pageSize);
            verificationDataAdminInstitution.currentPage = 0;
            
            // Apply other filters (status, search)
            filterVerificationsForAdminInstitution();
            
            // Update window.verificationData for compatibility
            if (!window.verificationData) {
                window.verificationData = {};
            }
            window.verificationData.verifications = verificationDataAdminInstitution.verifications;
            window.verificationData.filteredVerifications = verificationDataAdminInstitution.filteredVerifications;
            window.verificationData.totalElements = verificationDataAdminInstitution.totalElements;
            window.verificationData.currentPage = verificationDataAdminInstitution.currentPage;
            window.verificationData.itemsPerPage = verificationDataAdminInstitution.pageSize;
            window.verificationData.searchTerm = verificationDataAdminInstitution.filters.searchTerm;
            window.verificationData.selectedStatus = verificationDataAdminInstitution.filters.status;
            
            // Update UI
            await updateVerificationUIForAdminInstitution();
        } else {
            throw new Error('Error al cargar las verificaciones');
        }
    } catch (error) {
        console.error('Error loading verifications by inventory:', error);
        showError('Error al cargar las verificaciones: ' + error.message);
    }
}

/**
 * Handle status filter change for admin institution
 */
async function handleVerificationStatusFilterForAdminInstitution(status) {
    verificationDataAdminInstitution.filters.status = status;
    filterVerificationsForAdminInstitution();
    // updateVerificationUIForAdminInstitution is async but we don't need to wait for it
    updateVerificationUIForAdminInstitution().catch(err => console.error('Error updating UI:', err));
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
 * Initialize verification page for admin institution
 */
function initializeAdminInstitutionVerifications() {
    // Check if we're on admin_institution verification page
    const path = window.location.pathname || '';
    const isAdminInstitutionPage = path.includes('/admin_institution/verification') || path.includes('/admininstitution/verification');
    
    if (isAdminInstitutionPage) {
        // Override loadVerificationData function
        window.loadVerificationData = loadVerificationsForAdminInstitution;
        
        // Load verifications when page is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                loadVerificationsForAdminInstitution();
            });
        } else {
            loadVerificationsForAdminInstitution();
        }
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAdminInstitutionVerifications);
} else {
    initializeAdminInstitutionVerifications();
}

// Export functions
window.loadVerificationsForAdminInstitution = loadVerificationsForAdminInstitution;
window.loadVerificationStatisticsForAdminInstitution = loadVerificationStatisticsForAdminInstitution;
window.loadInventoriesForAdminInstitution = loadInventoriesForAdminInstitution;
window.handleVerificationSearchForAdminInstitution = handleVerificationSearchForAdminInstitution;
window.handleVerificationInventoryFilterForAdminInstitution = handleVerificationInventoryFilterForAdminInstitution;
window.handleVerificationStatusFilterForAdminInstitution = handleVerificationStatusFilterForAdminInstitution;
window.initializeAdminInstitutionVerifications = initializeAdminInstitutionVerifications;

