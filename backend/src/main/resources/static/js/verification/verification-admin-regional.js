// Verification Admin Regional - Specific functionality for ADMIN_REGIONAL role
// This file handles loading and displaying verifications for the admin regional's regional

let currentUserRegionalId = null;
let verificationDataAdminRegional = {
    verifications: [],
    filteredVerifications: [],
    inventories: [], // Filtered inventories for the dropdown
    allInventories: [], // All inventories for filtering verifications
    institutions: [],
    currentPage: 0,
    pageSize: 6,
    totalPages: 0,
    totalElements: 0,
    filters: {
        status: 'all',
        searchTerm: '',
        institutionId: 'all',
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
            
            // Transform the response to match frontend expectations
            let verifications = Array.isArray(data.content) ? data.content : [];
            verifications = verifications.map(v => ({
                id: v.id || v.verificationId,
                itemId: v.itemId,
                licensePlate: v.itemLicencePlateNumber || v.licencePlateNumber || v.licensePlate || null,
                serialNumber: v.serialNumber || null,
                itemName: v.itemName || '-',
                inventoryId: v.inventoryId,
                inventoryName: v.inventoryName || '-',
                status: v.status || 'PENDING',
                hasEvidence: v.photoUrl && v.photoUrl.length > 0,
                verificationDate: v.verifiedAt || v.createdAt || v.verificationDate || null,
                createdAt: v.createdAt || v.verifiedAt,
                photoUrl: v.photoUrl || null,
                photoUrls: v.photoUrl ? [v.photoUrl] : [],
                userId: v.userId,
                userFullName: v.userFullName,
                userEmail: v.userEmail,
                // Keep original fields for compatibility
                itemLicencePlateNumber: v.itemLicencePlateNumber,
                item: v.item || null
            }));
            
            // Update verifications data
            verificationDataAdminRegional.verifications = verifications;
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
            
            // Load institutions for filter (must complete before updating UI)
            await loadInstitutionsForAdminRegional();
            
            // Load all inventories for the regional (needed for filtering, but won't show in filter until center is selected)
            await loadAllInventoriesForAdminRegional();
            
            // Update UI
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
    
    console.log('Filtering verifications. Total:', filtered.length);
    console.log('Current filters:', verificationDataAdminRegional.filters);
    
    // Create a map of inventoryId to institutionId from all loaded inventories
    const inventoryToInstitutionMap = new Map();
    const allInventories = verificationDataAdminRegional.allInventories || [];
    
    allInventories.forEach(inv => {
        const invId = inv.id || inv.inventoryId;
        const instId = inv.institutionId || inv.institution?.id;
        if (invId && instId) {
            inventoryToInstitutionMap.set(invId.toString(), instId.toString());
        }
    });
    
    console.log('Inventory to Institution map:', Array.from(inventoryToInstitutionMap.entries()));
    
    // Filter by institution
    const institutionFilter = verificationDataAdminRegional.filters.institutionId;
    if (institutionFilter && institutionFilter !== 'all') {
        console.log('Filtering by institution:', institutionFilter);
        const beforeCount = filtered.length;
        filtered = filtered.filter(v => {
            // Get inventory ID from verification
            const vInventoryId = v.inventoryId || v.item?.inventoryId || v.item?.inventory?.id;
            
            if (!vInventoryId) {
                console.log('Verification has no inventoryId:', v);
                return false;
            }
            
            // Get institution ID from the map
            const vInstitutionId = inventoryToInstitutionMap.get(vInventoryId.toString());
            
            if (!vInstitutionId) {
                console.log('No institution found for inventory:', {
                    verificationId: v.id,
                    inventoryId: vInventoryId,
                    availableInventories: Array.from(inventoryToInstitutionMap.keys())
                });
                return false;
            }
            
            const matches = vInstitutionId.toString() === institutionFilter.toString();
            
            if (!matches) {
                console.log('Verification institution ID mismatch:', {
                    verificationId: v.id,
                    verificationInstitutionId: vInstitutionId,
                    filterInstitutionId: institutionFilter
                });
            }
            
            return matches;
        });
        console.log('After institution filter:', filtered.length, '(removed', beforeCount - filtered.length, ')');
    }
    
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
    
    // Also update window.verificationData for compatibility with existing UI functions
    if (window.verificationData) {
        window.verificationData.filteredVerifications = filtered;
        window.verificationData.verifications = verificationDataAdminRegional.verifications;
    }
    
    // Update pagination
    verificationDataAdminRegional.totalPages = Math.ceil(filtered.length / verificationDataAdminRegional.pageSize);
    verificationDataAdminRegional.currentPage = 0; // Reset to first page after filtering
    
    console.log('Filtered verifications count:', filtered.length);
    console.log('Filtered verifications:', filtered);
}

/**
 * Load institutions for admin regional filter
 */
async function loadInstitutionsForAdminRegional() {
    try {
        // First, ensure we have the regional ID
        if (!currentUserRegionalId) {
            const regionalId = await loadCurrentUserInfoForVerifications();
            if (!regionalId) {
                console.warn('No regional ID available for loading institutions');
                verificationDataAdminRegional.institutions = [];
                return;
            }
        }

        const token = localStorage.getItem('jwt');
        if (!token) {
            console.warn('No token found for loading institutions');
            verificationDataAdminRegional.institutions = [];
            return;
        }

        // Load institutions for the regional
        const response = await fetch(`/api/v1/institutions/institutionsByRegionalId/${currentUserRegionalId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const institutions = await response.json();
            console.log('Loaded institutions count for regional', currentUserRegionalId, ':', institutions.length);
            
            // Ensure institutions is an array
            if (!Array.isArray(institutions)) {
                console.warn('Institutions is not an array, converting:', institutions);
                verificationDataAdminRegional.institutions = [];
            } else {
                verificationDataAdminRegional.institutions = institutions;
            }
            
            console.log('Institutions saved to verificationDataAdminRegional:', verificationDataAdminRegional.institutions.length);
        } else {
            const errorText = await response.text();
            console.error('Failed to load institutions for admin regional. Status:', response.status, 'Error:', errorText);
            verificationDataAdminRegional.institutions = [];
        }
    } catch (error) {
        console.error('Error loading institutions for admin regional:', error);
        verificationDataAdminRegional.institutions = [];
    }
}

/**
 * Load all inventories for admin regional (for filtering purposes, not for display)
 */
async function loadAllInventoriesForAdminRegional() {
    try {
        // First, ensure we have the regional ID
        if (!currentUserRegionalId) {
            const regionalId = await loadCurrentUserInfoForVerifications();
            if (!regionalId) {
                console.warn('No regional ID available for loading all inventories');
                verificationDataAdminRegional.allInventories = [];
                return;
            }
        }

        const token = localStorage.getItem('jwt');
        if (!token) {
            console.warn('No token found for loading all inventories');
            verificationDataAdminRegional.allInventories = [];
            return;
        }

        // Use the endpoint with explicit regionalId to get all inventories
        const response = await fetch(`/api/v1/inventory/regionalAdminInventories/${currentUserRegionalId}?page=0&size=10000`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            
            // Handle paginated response (Page object) or direct array
            let inventories = [];
            if (Array.isArray(data)) {
                inventories = data;
            } else if (data && Array.isArray(data.content)) {
                inventories = data.content;
            } else if (data && typeof data === 'object' && data.content) {
                inventories = Array.isArray(data.content) ? data.content : [];
            }
            
            // Ensure inventories is an array
            if (!Array.isArray(inventories)) {
                console.warn('Inventories is not an array, converting:', inventories);
                inventories = [];
            }
            
            verificationDataAdminRegional.allInventories = inventories;
            console.log('Loaded all inventories for filtering:', inventories.length);
        } else {
            const errorText = await response.text();
            console.error('Failed to load all inventories. Status:', response.status, 'Error:', errorText);
            verificationDataAdminRegional.allInventories = [];
        }
    } catch (error) {
        console.error('Error loading all inventories:', error);
        verificationDataAdminRegional.allInventories = [];
    }
}

/**
 * Load inventories for admin regional filter
 * Only loads inventories if an institution is selected
 */
async function loadInventoriesForAdminRegional() {
    try {
        // Check if an institution is selected
        const selectedInstitutionId = verificationDataAdminRegional.filters.institutionId;
        if (!selectedInstitutionId || selectedInstitutionId === 'all') {
            console.log('No institution selected, clearing inventories');
            verificationDataAdminRegional.inventories = [];
            if (window.verificationData) {
                window.verificationData.inventories = [];
            }
            return;
        }

        // First, ensure we have the regional ID
        if (!currentUserRegionalId) {
            const regionalId = await loadCurrentUserInfoForVerifications();
            if (!regionalId) {
                console.warn('No regional ID available for loading inventories');
                verificationDataAdminRegional.inventories = [];
                return;
            }
        }

        const token = localStorage.getItem('jwt');
        if (!token) {
            console.warn('No token found for loading inventories');
            verificationDataAdminRegional.inventories = [];
            return;
        }

        // Use the endpoint with explicit regionalId to ensure we get all inventories
        const response = await fetch(`/api/v1/inventory/regionalAdminInventories/${currentUserRegionalId}?page=0&size=10000`, {
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
            
            console.log('Loaded inventories count for regional', currentUserRegionalId, ':', inventories.length);
            
            // Ensure inventories is an array
            if (!Array.isArray(inventories)) {
                console.warn('Inventories is not an array, converting:', inventories);
                inventories = [];
            }
            
            // Filter inventories by selected institution
            inventories = inventories.filter(inv => {
                const invInstitutionId = inv.institutionId || inv.institution?.id || 
                                       (inv.institution && inv.institution.id ? inv.institution.id.toString() : null);
                return invInstitutionId && invInstitutionId.toString() === selectedInstitutionId.toString();
            });
            console.log('Filtered inventories by institution', selectedInstitutionId, ':', inventories.length);
            
            verificationDataAdminRegional.inventories = inventories;
            
            // Also update window.verificationData for compatibility
            if (window.verificationData) {
                window.verificationData.inventories = inventories;
            }
            
            console.log('Inventories saved to verificationDataAdminRegional:', verificationDataAdminRegional.inventories.length);
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
    
    // Update search and filters FIRST to ensure they're set up before table updates
    // This prevents other functions from regenerating the filter HTML
    updateVerificationSearchAndFiltersForAdminRegional();
    
    // Small delay to ensure filters are rendered before table update
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Update table
    if (window.updateVerificationTable) {
        window.updateVerificationTable();
    }
    
    // Update pagination
    if (window.updatePagination) {
        window.updatePagination();
    }
    
    // Re-update filters after table update to ensure they persist
    // Use a small delay to avoid race conditions
    setTimeout(() => {
        updateVerificationSearchAndFiltersForAdminRegional();
    }, 100);
}

// Custom Select instances for admin regional filters
let verificationInstitutionCustomSelectAdminRegional = null;
let verificationInventoryCustomSelectAdminRegional = null;
// Flags to prevent infinite loops during initialization
let isInitializingInstitutionFilter = false;
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
    const currentInstitutionFilter = verificationDataAdminRegional.filters.institutionId || 'all';
    const currentInventoryFilter = verificationDataAdminRegional.filters.inventoryId || 'all';
    
    // Build institution options
    let institutions = verificationDataAdminRegional.institutions || [];
    if (!Array.isArray(institutions)) {
        institutions = [];
    }
    
    // Build inventory options - check both verificationDataAdminRegional and window.verificationData
    let inventories = verificationDataAdminRegional.inventories || [];
    if (inventories.length === 0 && window.verificationData && window.verificationData.inventories) {
        inventories = window.verificationData.inventories;
        console.log('Using inventories from window.verificationData:', inventories.length);
    }
    
    // Ensure inventories is an array
    if (!Array.isArray(inventories)) {
        console.warn('Inventories is not an array, converting:', inventories);
        inventories = [];
    }
    
    console.log('Updating filters with institutions:', institutions.length, 'and inventories:', inventories.length);
    
    // Check if the container already has the filters (to avoid regenerating unnecessarily)
    const existingInventorySelect = document.getElementById('verificationInventoryFilterAdminRegionalSelect');
    const existingInstitutionSelect = document.getElementById('verificationInstitutionFilterAdminRegionalSelect');
    const existingSearchInput = document.getElementById('verificationSearchAdminRegional');
    
    // Only regenerate HTML if it doesn't exist
    const needsRegeneration = !existingInventorySelect || !existingInstitutionSelect || !existingSearchInput;
    
    if (!needsRegeneration && verificationInventoryCustomSelectAdminRegional && verificationInstitutionCustomSelectAdminRegional) {
        // Just update the options without regenerating HTML
        
        // Update institution filter options
        const institutionOptions = [
            { value: 'all', label: 'Todos los Centros' },
            ...institutions.map(inst => ({
                value: (inst.id || inst.institutionId).toString(),
                label: inst.name || `Centro ${inst.id || inst.institutionId}`
            }))
        ];
        
        isInitializingInstitutionFilter = true;
        try {
            verificationInstitutionCustomSelectAdminRegional.setOptions(institutionOptions);
            if (currentInstitutionFilter && currentInstitutionFilter !== 'all') {
                verificationInstitutionCustomSelectAdminRegional.setValue(currentInstitutionFilter.toString());
            } else {
                verificationInstitutionCustomSelectAdminRegional.setValue('all');
            }
        } catch (error) {
            console.error('Error updating institution options:', error);
        }
        setTimeout(() => {
            isInitializingInstitutionFilter = false;
        }, 100);
        
        // Update inventory filter options
        // Check if a center is selected
        const hasSelectedCenter = currentInstitutionFilter && currentInstitutionFilter !== 'all';
        
        if (hasSelectedCenter && inventories.length > 0) {
            const inventoryOptions = [
                { value: 'all', label: 'Todos los Inventarios' },
                ...inventories.map(inv => ({
                    value: (inv.id || inv.inventoryId).toString(),
                    label: inv.name || inv.inventoryName || `Inventario ${inv.id || inv.inventoryId}`
                }))
            ];
            
            console.log('Updating existing CustomSelect with', inventoryOptions.length, 'options');
            
            isInitializingInventoryFilter = true;
            
            try {
                verificationInventoryCustomSelectAdminRegional.setOptions(inventoryOptions);
                verificationInventoryCustomSelectAdminRegional.setDisabled(false);
                console.log('Options updated successfully');
            } catch (error) {
                console.error('Error updating options:', error);
            }
            
            // Update selected value if needed
            if (currentInventoryFilter && currentInventoryFilter !== 'all') {
                verificationInventoryCustomSelectAdminRegional.setValue(currentInventoryFilter.toString());
            } else {
                verificationInventoryCustomSelectAdminRegional.setValue('all');
            }
        } else {
            // No center selected or no inventories, disable and show placeholder
            const emptyOptions = [
                { value: 'all', label: 'Seleccione un centro primero' }
            ];
            
            isInitializingInventoryFilter = true;
            
            try {
                verificationInventoryCustomSelectAdminRegional.setOptions(emptyOptions);
                verificationInventoryCustomSelectAdminRegional.setDisabled(true);
                verificationInventoryCustomSelectAdminRegional.setValue('all');
            } catch (error) {
                console.error('Error updating inventory options:', error);
            }
        }
        
        setTimeout(() => {
            isInitializingInventoryFilter = false;
        }, 100);
        
        return;
    }
    
    // Reset custom select instances since HTML will be regenerated
    verificationInventoryCustomSelectAdminRegional = null;
    verificationInstitutionCustomSelectAdminRegional = null;
    
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
            <label class="block text-xs font-medium text-gray-600 mb-1.5">Filtrar por Centro</label>
            <div class="custom-select-container">
                <div class="custom-select" id="verificationInstitutionFilterAdminRegionalSelect">
                    <div class="custom-select-trigger" style="padding: 0.75rem 1rem; height: 56px; display: flex; align-items: center;">
                        <span class="custom-select-text custom-select-placeholder">Todos los Centros</span>
                        <i class="fas fa-chevron-down custom-select-arrow"></i>
                    </div>
                    <div class="custom-select-dropdown">
                        <input type="text" class="custom-select-search" placeholder="Buscar centro...">
                        <div class="custom-select-options" id="verificationInstitutionFilterAdminRegionalOptions">
                            <!-- Options loaded dynamically -->
                        </div>
                    </div>
                </div>
                <input type="hidden" id="verificationInstitutionFilterAdminRegional" value="${currentInstitutionFilter}">
            </div>
        </div>
        <div class="relative" style="min-width: 200px; flex-shrink: 0;">
            <label class="block text-xs font-medium text-gray-600 mb-1.5">Filtrar por Inventario</label>
            <div class="custom-select-container">
                <div class="custom-select" id="verificationInventoryFilterAdminRegionalSelect">
                    <div class="custom-select-trigger" style="padding: 0.75rem 1rem; height: 56px; display: flex; align-items: center;">
                        <span class="custom-select-text custom-select-placeholder">${currentInstitutionFilter && currentInstitutionFilter !== 'all' ? 'Todos los Inventarios' : 'Seleccione un centro primero'}</span>
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
    
    // Initialize Custom Selects after HTML is inserted
    // Ensure data is available and DOM is ready before initializing
    setTimeout(() => {
        // Initialize Institution Custom Select
        let finalInstitutions = verificationDataAdminRegional.institutions || [];
        if (!Array.isArray(finalInstitutions)) {
            finalInstitutions = [];
        }
        initializeInstitutionCustomSelectForAdminRegional(finalInstitutions, currentInstitutionFilter);
        
        // Initialize Inventory Custom Select
        let finalInventories = verificationDataAdminRegional.inventories || [];
        if (finalInventories.length === 0 && window.verificationData && window.verificationData.inventories) {
            finalInventories = window.verificationData.inventories;
            console.log('Retrying with inventories from window.verificationData:', finalInventories.length);
        }
        
        if (!Array.isArray(finalInventories)) {
            finalInventories = [];
        }
        
        console.log('Initializing CustomSelect with final inventories:', finalInventories.length);
        initializeInventoryCustomSelectForAdminRegional(finalInventories, currentInventoryFilter);
    }, 100);
}

/**
 * Initialize Custom Select for institution filter (Admin Regional)
 */
function initializeInstitutionCustomSelectForAdminRegional(institutions, currentInstitutionFilter) {
    // Check if CustomSelect is available
    if (typeof CustomSelect === 'undefined' && typeof window.CustomSelect === 'undefined') {
        console.warn('CustomSelect class not available, falling back to regular select');
        return;
    }
    
    const CustomSelectClass = window.CustomSelect || CustomSelect;
    const institutionSelect = document.getElementById('verificationInstitutionFilterAdminRegionalSelect');
    
    if (!institutionSelect) {
        console.warn('Institution select container not found');
        return;
    }
    
    // Validate institutions parameter
    if (!Array.isArray(institutions)) {
        console.warn('Institutions is not an array:', institutions);
        institutions = [];
    }
    
    console.log('Initializing Institution CustomSelect with', institutions.length, 'institutions');
    
    // Initialize Custom Select if not already initialized
    if (!verificationInstitutionCustomSelectAdminRegional) {
        verificationInstitutionCustomSelectAdminRegional = new CustomSelectClass('verificationInstitutionFilterAdminRegionalSelect', {
            placeholder: 'Todos los Centros',
            onChange: (option) => {
                // Don't trigger filter change during initialization
                if (isInitializingInstitutionFilter) {
                    return;
                }
                const value = option.value || 'all';
                const hiddenInput = document.getElementById('verificationInstitutionFilterAdminRegional');
                if (hiddenInput) {
                    hiddenInput.value = value;
                }
                handleVerificationInstitutionFilterForAdminRegional(value);
            }
        });
    }
    
    // Build options array - always include "all" option
    const options = [
        { value: 'all', label: 'Todos los Centros' },
        ...institutions.map(inst => ({
            value: (inst.id || inst.institutionId).toString(),
            label: inst.name || `Centro ${inst.id || inst.institutionId}`
        }))
    ];
    
    console.log('Setting Institution CustomSelect options. Total options:', options.length);
    
    // Verify CustomSelect instance has setOptions method
    if (!verificationInstitutionCustomSelectAdminRegional || typeof verificationInstitutionCustomSelectAdminRegional.setOptions !== 'function') {
        console.error('Institution CustomSelect instance or setOptions method not available');
        return;
    }
    
    // Set flag to prevent onChange during initialization
    isInitializingInstitutionFilter = true;
    
    // Set options
    try {
        verificationInstitutionCustomSelectAdminRegional.setOptions(options);
        console.log('Institution options set successfully');
    } catch (error) {
        console.error('Error setting institution options:', error);
    }
    
    // Set selected value without triggering onChange
    if (currentInstitutionFilter && currentInstitutionFilter !== 'all') {
        const selectedOption = options.find(opt => opt.value === currentInstitutionFilter.toString());
        if (selectedOption) {
            verificationInstitutionCustomSelectAdminRegional.setValue(selectedOption.value);
        }
    } else {
        const allOption = options.find(opt => opt.value === 'all');
        if (allOption) {
            verificationInstitutionCustomSelectAdminRegional.setValue('all');
        }
    }
    
    // Reset flag after initialization
    setTimeout(() => {
        isInitializingInstitutionFilter = false;
        if (verificationInstitutionCustomSelectAdminRegional.options && verificationInstitutionCustomSelectAdminRegional.options.length > 0) {
            console.log('Institution CustomSelect initialized successfully with', verificationInstitutionCustomSelectAdminRegional.options.length, 'options');
        } else {
            console.error('Institution CustomSelect options are empty after initialization');
        }
    }, 100);
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
    
    // Validate inventories parameter
    if (!Array.isArray(inventories)) {
        console.warn('Inventories is not an array:', inventories);
        inventories = [];
    }
    
    console.log('Initializing CustomSelect with', inventories.length, 'inventories');
    console.log('Inventories data:', inventories);
    
    // Initialize Custom Select if not already initialized
    if (!verificationInventoryCustomSelectAdminRegional) {
        verificationInventoryCustomSelectAdminRegional = new CustomSelectClass('verificationInventoryFilterAdminRegionalSelect', {
            placeholder: 'Seleccione un centro primero',
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
    
    // Check if a center is selected
    const selectedInstitutionId = verificationDataAdminRegional.filters.institutionId;
    const hasSelectedCenter = selectedInstitutionId && selectedInstitutionId !== 'all';
    
    // Verify CustomSelect instance has setOptions method
    if (!verificationInventoryCustomSelectAdminRegional || typeof verificationInventoryCustomSelectAdminRegional.setOptions !== 'function') {
        console.error('CustomSelect instance or setOptions method not available');
        return;
    }
    
    // Set flag to prevent onChange during initialization
    isInitializingInventoryFilter = true;
    
    if (hasSelectedCenter && inventories.length > 0) {
        // Build options array - always include "all" option
        const options = [
            { value: 'all', label: 'Todos los Inventarios' },
            ...inventories.map(inv => ({
                value: (inv.id || inv.inventoryId).toString(),
                label: inv.name || inv.inventoryName || `Inventario ${inv.id || inv.inventoryId}`
            }))
        ];
        
        console.log('Setting CustomSelect options. Total options:', options.length);
        
        // Set options and enable
        try {
            verificationInventoryCustomSelectAdminRegional.setOptions(options);
            verificationInventoryCustomSelectAdminRegional.setDisabled(false);
            console.log('Options set successfully. CustomSelect options count:', verificationInventoryCustomSelectAdminRegional.options?.length || 0);
        } catch (error) {
            console.error('Error setting options:', error);
        }
        
        // Set selected value without triggering onChange
        if (currentInventoryFilter && currentInventoryFilter !== 'all') {
            const selectedOption = options.find(opt => opt.value === currentInventoryFilter.toString());
            if (selectedOption) {
                verificationInventoryCustomSelectAdminRegional.setValue(selectedOption.value);
            }
        } else {
            const allOption = options.find(opt => opt.value === 'all');
            if (allOption) {
                verificationInventoryCustomSelectAdminRegional.setValue('all');
            }
        }
    } else {
        // No center selected, disable and show placeholder
        const emptyOptions = [
            { value: 'all', label: 'Seleccione un centro primero' }
        ];
        
        try {
            verificationInventoryCustomSelectAdminRegional.setOptions(emptyOptions);
            verificationInventoryCustomSelectAdminRegional.setDisabled(true);
            verificationInventoryCustomSelectAdminRegional.setValue('all');
            console.log('Inventory filter disabled - no center selected');
        } catch (error) {
            console.error('Error setting empty options:', error);
        }
    }
    
    // Reset flag after initialization
    setTimeout(() => {
        isInitializingInventoryFilter = false;
        // Verify options were set correctly
        if (verificationInventoryCustomSelectAdminRegional.options && verificationInventoryCustomSelectAdminRegional.options.length > 0) {
            console.log('CustomSelect initialized successfully with', verificationInventoryCustomSelectAdminRegional.options.length, 'options');
        }
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
 * Handle institution filter change for admin regional
 */
async function handleVerificationInstitutionFilterForAdminRegional(institutionId) {
    verificationDataAdminRegional.filters.institutionId = institutionId;
    // Reset inventory filter when institution changes
    verificationDataAdminRegional.filters.inventoryId = 'all';
    
    // Check if a center is selected
    const hasSelectedCenter = institutionId && institutionId !== 'all';
    
    if (hasSelectedCenter) {
        // Reload inventories filtered by institution
        await loadInventoriesForAdminRegional();
        
        // Update inventory filter options
        if (verificationInventoryCustomSelectAdminRegional) {
            const inventories = verificationDataAdminRegional.inventories || [];
            
            if (inventories.length > 0) {
                const options = [
                    { value: 'all', label: 'Todos los Inventarios' },
                    ...inventories.map(inv => ({
                        value: (inv.id || inv.inventoryId).toString(),
                        label: inv.name || inv.inventoryName || `Inventario ${inv.id || inv.inventoryId}`
                    }))
                ];
                
                isInitializingInventoryFilter = true;
                verificationInventoryCustomSelectAdminRegional.setOptions(options);
                verificationInventoryCustomSelectAdminRegional.setDisabled(false);
                verificationInventoryCustomSelectAdminRegional.setValue('all');
                setTimeout(() => {
                    isInitializingInventoryFilter = false;
                }, 100);
            } else {
                // No inventories found for this center
                const emptyOptions = [
                    { value: 'all', label: 'No hay inventarios disponibles' }
                ];
                
                isInitializingInventoryFilter = true;
                verificationInventoryCustomSelectAdminRegional.setOptions(emptyOptions);
                verificationInventoryCustomSelectAdminRegional.setDisabled(true);
                verificationInventoryCustomSelectAdminRegional.setValue('all');
                setTimeout(() => {
                    isInitializingInventoryFilter = false;
                }, 100);
            }
        }
    } else {
        // No center selected, clear inventories and disable filter
        verificationDataAdminRegional.inventories = [];
        
        if (verificationInventoryCustomSelectAdminRegional) {
            const emptyOptions = [
                { value: 'all', label: 'Seleccione un centro primero' }
            ];
            
            isInitializingInventoryFilter = true;
            verificationInventoryCustomSelectAdminRegional.setOptions(emptyOptions);
            verificationInventoryCustomSelectAdminRegional.setDisabled(true);
            verificationInventoryCustomSelectAdminRegional.setValue('all');
            setTimeout(() => {
                isInitializingInventoryFilter = false;
            }, 100);
        }
    }
    
    // Filter verifications
    filterVerificationsForAdminRegional();
    updateVerificationUIForAdminRegional();
}

/**
 * Handle inventory filter change for admin regional
 */
async function handleVerificationInventoryFilterForAdminRegional(inventoryId) {
    verificationDataAdminRegional.filters.inventoryId = inventoryId;
    
    // Filter verifications
    filterVerificationsForAdminRegional();
    updateVerificationUIForAdminRegional();
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
            
            // Transform the response to match frontend expectations
            allVerifications = allVerifications.map(v => ({
                id: v.id || v.verificationId,
                itemId: v.itemId,
                licensePlate: v.itemLicencePlateNumber || v.licencePlateNumber || v.licensePlate || null,
                serialNumber: v.serialNumber || null,
                itemName: v.itemName || '-',
                inventoryId: v.inventoryId,
                inventoryName: v.inventoryName || '-',
                status: v.status || 'PENDING',
                hasEvidence: v.photoUrl && v.photoUrl.length > 0,
                verificationDate: v.verifiedAt || v.createdAt || v.verificationDate || null,
                createdAt: v.createdAt || v.verifiedAt,
                photoUrl: v.photoUrl || null,
                photoUrls: v.photoUrl ? [v.photoUrl] : [],
                userId: v.userId,
                userFullName: v.userFullName,
                userEmail: v.userEmail,
                // Keep original fields for compatibility
                itemLicencePlateNumber: v.itemLicencePlateNumber,
                item: v.item || null
            }));
            
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
window.loadInstitutionsForAdminRegional = loadInstitutionsForAdminRegional;
window.handleVerificationSearchForAdminRegional = handleVerificationSearchForAdminRegional;
window.handleVerificationInstitutionFilterForAdminRegional = handleVerificationInstitutionFilterForAdminRegional;
window.handleVerificationInventoryFilterForAdminRegional = handleVerificationInventoryFilterForAdminRegional;
window.handleVerificationStatusFilterForAdminRegional = handleVerificationStatusFilterForAdminRegional;
window.initializeAdminRegionalVerifications = initializeAdminRegionalVerifications;

