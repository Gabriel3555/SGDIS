// Transfers Filters Functions

/**
 * Builds the inventory endpoint with filters and pagination
 * Similar to buildInventoryEndpoint in inventory-api.js
 */
function buildInventoryEndpointForTransfers(page = 0, size = 50) {
    // Check if we should use institution inventories
    const role = (window.currentUserRole || '').toUpperCase();
    const path = window.location.pathname || '';
    const shouldUseInstitution = role === 'ADMIN_INSTITUTION' || role === 'WAREHOUSE' ||
                                 path.includes('/admin_institution') || path.includes('/admininstitution') || path.includes('/warehouse');
    
    if (shouldUseInstitution) {
        const params = new URLSearchParams({
            page: page.toString(),
            size: size.toString()
        });
        return `/api/v1/inventory/institutionAdminInventories?${params.toString()}`;
    }
    
    // Check if we have regional/institution filters for super admin
    const isSuperAdmin = (window.currentUserRole && window.currentUserRole.toUpperCase() === 'SUPERADMIN') || 
                         path.includes('/superadmin');
    
    if (isSuperAdmin) {
        // Use window.inventoryData or transfersData to get filter values
        const data = window.inventoryData || window.transfersData || {};
        const selectedRegional = data.selectedRegional;
        const selectedInstitution = data.selectedInstitution;
        
        if (selectedRegional && selectedInstitution) {
            // Filter by both regional and institution
            const params = new URLSearchParams({
                page: page.toString(),
                size: size.toString()
            });
            return `/api/v1/inventory/regional/${selectedRegional}/institution/${selectedInstitution}?${params.toString()}`;
        } else if (selectedRegional) {
            // Filter by regional only
            const params = new URLSearchParams({
                page: page.toString(),
                size: size.toString()
            });
            return `/api/v1/inventory/regionalAdminInventories/${selectedRegional}?${params.toString()}`;
        }
    }
    
    // Default endpoint with pagination
    const params = new URLSearchParams({
        page: page.toString(),
        size: size.toString()
    });
    return `/api/v1/inventory?${params.toString()}`;
}

/**
 * Fetches inventories with filters and pagination
 */
async function fetchInventoriesForTransfers(page = 0, size = 50) {
    try {
        const token = localStorage.getItem("jwt");
        const headers = {
            "Content-Type": "application/json",
        };
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }

        const endpoint = buildInventoryEndpointForTransfers(page, size);
        const response = await fetch(endpoint, {
            method: "GET",
            headers: headers,
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error fetching inventories for transfers:", error);
        throw error;
    }
}

/**
 * Handles regional filter change for transfers
 */
async function handleTransferRegionalFilterChange(regionalId) {
    if (!window.transfersData) {
        window.transfersData = {
            transfers: [],
            currentInventoryId: null,
            currentPage: 0,
            pageSize: 10,
            totalPages: 0,
            totalElements: 0,
            viewMode: 'table',
            currentTransferId: null,
            filters: {
                status: 'all',
                sourceInventory: '',
                destinationInventory: '',
                itemId: null,
                searchTerm: ''
            }
        };
    }
    
    // Sync with inventoryData if available
    if (window.inventoryData) {
        window.inventoryData.selectedRegional = regionalId || '';
        window.inventoryData.selectedInstitution = ''; // Clear institution when regional changes
    }
    
    // Store in transfersData as well
    if (!window.transfersData.filters) {
        window.transfersData.filters = {};
    }
    window.transfersData.selectedRegional = regionalId || '';
    window.transfersData.selectedInstitution = ''; // Clear institution
    
    // Clear institution dropdown
    if (window.transferInstitutionSelect) {
        if (!regionalId) {
            window.transferInstitutionSelect.disable();
        } else {
            window.transferInstitutionSelect.enable();
        }
        window.transferInstitutionSelect.clear();
        window.transferInstitutionSelect.setOptions([{ value: '', label: 'Todas las instituciones' }]);
    }
    
    // Load institutions for the selected regional
    if (regionalId && window.loadInstitutionsForTransferFilter) {
        await window.loadInstitutionsForTransferFilter(regionalId);
    }
    
    // Reload inventories for the selector
    if (window.loadInventoriesForTransferFilter) {
        await window.loadInventoriesForTransferFilter();
    }
    
    // Clear current inventory selection if it doesn't match the new filter
    window.transfersData.currentInventoryId = null;
    if (window.transferInventorySelect) {
        window.transferInventorySelect.clear();
    }
    
    // Clear transfers display
    const container = document.getElementById('transferTableContainer');
    if (container) {
        container.innerHTML = `
            <div class="text-center py-12">
                <i class="fas fa-info-circle text-blue-500 dark:text-blue-400 text-4xl mb-4"></i>
                <p class="text-gray-600 dark:text-gray-400 text-lg mb-2">Selecciona un inventario para ver sus transferencias</p>
            </div>
        `;
    }
    
    // Clear stats
    const statsContainer = document.getElementById('transferStatsContainer');
    if (statsContainer && window.updateTransfersStats) {
        window.updateTransfersStats();
    }
}

/**
 * Handles institution filter change for transfers
 */
async function handleTransferInstitutionFilterChange(institutionId) {
    if (!window.transfersData) {
        window.transfersData = {
            transfers: [],
            currentInventoryId: null,
            currentPage: 0,
            pageSize: 10,
            totalPages: 0,
            totalElements: 0,
            viewMode: 'table',
            currentTransferId: null,
            filters: {
                status: 'all',
                sourceInventory: '',
                destinationInventory: '',
                itemId: null,
                searchTerm: ''
            }
        };
    }
    
    // Sync with inventoryData if available
    if (window.inventoryData) {
        window.inventoryData.selectedInstitution = institutionId || '';
    }
    
    // Store in transfersData as well
    if (!window.transfersData.filters) {
        window.transfersData.filters = {};
    }
    window.transfersData.selectedInstitution = institutionId || '';
    
    // Reload inventories for the selector
    if (window.loadInventoriesForTransferFilter) {
        await window.loadInventoriesForTransferFilter();
    }
    
    // Clear current inventory selection if it doesn't match the new filter
    window.transfersData.currentInventoryId = null;
    if (window.transferInventorySelect) {
        window.transferInventorySelect.clear();
    }
    
    // Clear transfers display
    const container = document.getElementById('transferTableContainer');
    if (container) {
        container.innerHTML = `
            <div class="text-center py-12">
                <i class="fas fa-info-circle text-blue-500 dark:text-blue-400 text-4xl mb-4"></i>
                <p class="text-gray-600 dark:text-gray-400 text-lg mb-2">Selecciona un inventario para ver sus transferencias</p>
            </div>
        `;
    }
    
    // Clear stats
    const statsContainer = document.getElementById('transferStatsContainer');
    if (statsContainer && window.updateTransfersStats) {
        window.updateTransfersStats();
    }
}

/**
 * Handles inventory selection change
 */
async function handleTransferInventorySelectionChange(inventoryId) {
    if (!window.transfersData) return;
    
    window.transfersData.currentInventoryId = inventoryId ? parseInt(inventoryId, 10) : null;
    window.transfersData.currentPage = 0;
    
    // Load transfers for selected inventory
    if (inventoryId && window.loadTransfersData) {
        await window.loadTransfersData();
    } else {
        // Clear transfers display
        const container = document.getElementById('transferTableContainer');
        if (container) {
            container.innerHTML = `
                <div class="text-center py-12">
                    <i class="fas fa-info-circle text-blue-500 dark:text-blue-400 text-4xl mb-4"></i>
                    <p class="text-gray-600 dark:text-gray-400 text-lg mb-2">Selecciona un inventario para ver sus transferencias</p>
                </div>
            `;
        }
        
        // Clear stats
        const statsContainer = document.getElementById('transferStatsContainer');
        if (statsContainer && window.updateTransfersStats) {
            window.updateTransfersStats();
        }
    }
}

/**
 * Loads regionals for transfer filter dropdown (super admin only)
 */
async function loadRegionalsForTransferFilter() {
    try {
        const token = localStorage.getItem('jwt');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch('/api/v1/regional', {
            method: 'GET',
            headers: headers
        });

        if (response.ok) {
            const regionals = await response.json();
            const data = window.inventoryData || window.transfersData || {};
            const currentRegional = data.selectedRegional || '';
            
            if (window.transferRegionalSelect) {
                const options = [{ value: '', label: 'Todas las regionales' }];
                if (Array.isArray(regionals)) {
                    regionals.forEach(regional => {
                        options.push({
                            value: regional.id.toString(),
                            label: regional.name
                        });
                    });
                }
                window.transferRegionalSelect.setOptions(options);
                if (currentRegional) {
                    window.transferRegionalSelect.setValue(currentRegional.toString());
                }
            }
        }
    } catch (error) {
        // Silently handle error
    }
}

/**
 * Loads institutions for transfer filter dropdown (super admin only)
 */
async function loadInstitutionsForTransferFilter(regionalId) {
    try {
        if (!regionalId) {
            if (window.transferInstitutionSelect) {
                window.transferInstitutionSelect.disable();
                window.transferInstitutionSelect.clear();
                window.transferInstitutionSelect.setOptions([{ value: '', label: 'Todas las instituciones' }]);
            }
            return;
        }

        const token = localStorage.getItem('jwt');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(`/api/v1/institutions/institutionsByRegionalId/${regionalId}`, {
            method: 'GET',
            headers: headers
        });

        if (response.ok) {
            const institutions = await response.json();
            const data = window.inventoryData || window.transfersData || {};
            const currentInstitution = data.selectedInstitution || '';
            
            if (window.transferInstitutionSelect) {
                window.transferInstitutionSelect.enable();
                const options = [{ value: '', label: 'Todas las instituciones' }];
                if (Array.isArray(institutions)) {
                    institutions.forEach(institution => {
                        options.push({
                            value: institution.id.toString(),
                            label: institution.name
                        });
                    });
                }
                window.transferInstitutionSelect.setOptions(options);
                if (currentInstitution) {
                    window.transferInstitutionSelect.setValue(currentInstitution.toString());
                }
            }
        }
    } catch (error) {
        // Silently handle error
    }
}

/**
 * Loads inventories for transfer filter dropdown
 */
async function loadInventoriesForTransferFilter() {
    try {
        const token = localStorage.getItem('jwt');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        // Fetch first page with a reasonable size
        const endpoint = buildInventoryEndpointForTransfers(0, 100);
        const response = await fetch(endpoint, {
            method: 'GET',
            headers: headers
        });

        if (response.ok) {
            const payload = await response.json();
            let inventories = [];
            
            // Handle different response formats
            if (Array.isArray(payload)) {
                inventories = payload;
            } else if (payload && Array.isArray(payload.content)) {
                inventories = payload.content;
            }
            
            const currentInventoryId = window.transfersData?.currentInventoryId || '';
            
            if (window.transferInventorySelect) {
                const options = [{ value: '', label: 'Seleccionar inventario...' }];
                if (Array.isArray(inventories)) {
                    inventories.forEach(inventory => {
                        options.push({
                            value: inventory.id.toString(),
                            label: inventory.name || `Inventario ${inventory.id}`
                        });
                    });
                }
                window.transferInventorySelect.setOptions(options);
                if (currentInventoryId) {
                    window.transferInventorySelect.setValue(currentInventoryId.toString());
                }
            }
        }
    } catch (error) {
        // Silently handle error
    }
}

// Export functions globally
window.buildInventoryEndpointForTransfers = buildInventoryEndpointForTransfers;
window.fetchInventoriesForTransfers = fetchInventoriesForTransfers;
window.handleTransferRegionalFilterChange = handleTransferRegionalFilterChange;
window.handleTransferInstitutionFilterChange = handleTransferInstitutionFilterChange;
window.handleTransferInventorySelectionChange = handleTransferInventorySelectionChange;
window.loadRegionalsForTransferFilter = loadRegionalsForTransferFilter;
window.loadInstitutionsForTransferFilter = loadInstitutionsForTransferFilter;
window.loadInventoriesForTransferFilter = loadInventoriesForTransferFilter;

