// Warehouse-specific transfers functionality

let warehouseTransfersData = {
    userInstitutionId: null,
    userRegionalId: null,
    userInstitutionName: null,
    userRegionalName: null
};

/**
 * Load current user info to get institution and regional IDs
 */
async function loadCurrentUserInfoForWarehouseTransfers() {
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

            // Get institution and regional IDs
            warehouseTransfersData.userInstitutionId = userInstitution.institutionId || userInstitution.id;
            warehouseTransfersData.userRegionalId = userInstitution.regionalId || userInstitution.regional?.id;
            warehouseTransfersData.userInstitutionName = userInstitution.name;

            if (!warehouseTransfersData.userRegionalId) {
                throw new Error('La institución no tiene una regional asignada');
            }

            // Fetch regional information to get the name
            const regionalResponse = await fetch(`/api/v1/regional/${warehouseTransfersData.userRegionalId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (regionalResponse.ok) {
                const regionalData = await regionalResponse.json();
                warehouseTransfersData.userRegionalName = regionalData.name || 'Regional';
            } else {
                warehouseTransfersData.userRegionalName = 'Regional';
            }

            return warehouseTransfersData;
        } else {
            throw new Error('Failed to load user info');
        }
    } catch (error) {
        console.error('Error loading user info for warehouse transfers:', error);
        throw error;
    }
}

/**
 * Load transfers for warehouse (only from regional)
 */
async function loadWarehouseTransfers(page = 0, size = 6) {
    try {
        if (!warehouseTransfersData.userRegionalId) {
            await loadCurrentUserInfoForWarehouseTransfers();
        }

        const token = localStorage.getItem('jwt');
        const headers = {
            'Content-Type': 'application/json'
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        // Use regional endpoint to get transfers from warehouse's regional
        const response = await fetch(
            `/api/v1/transfers/regional/${warehouseTransfersData.userRegionalId}?page=${page}&size=${size}`,
            {
                method: 'GET',
                headers: headers
            }
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error loading warehouse transfers:', error);
        throw error;
    }
}

/**
 * Override loadTransfersData for warehouse
 */
async function loadWarehouseTransfersData() {
    try {
        // Load user info first
        await loadCurrentUserInfoForWarehouseTransfers();
        
        // Initialize transfers data if not exists
        if (!window.transfersData) {
            window.transfersData = {
                transfers: [],
                currentInventoryId: null,
                currentPage: 0,
                pageSize: 6,
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

        // Load transfers from regional
        const page = window.transfersData.currentPage || 0;
        const size = window.transfersData.pageSize || 6;
        
        const transfersPage = await loadWarehouseTransfers(page, size);
        
        window.transfersData.transfers = transfersPage.content || [];
        window.transfersData.totalPages = transfersPage.totalPages || 0;
        window.transfersData.totalElements = transfersPage.totalElements || 0;
        window.transfersData.currentPage = transfersPage.number || 0;

        // Store total for statistics
        window.transfersData.totalRegionalTransfers = transfersPage.totalElements || 0;
        
        // Load all transfers for statistics calculation (warehouse needs accurate stats from regional)
        if (warehouseTransfersData.userRegionalId) {
            try {
                // Load all transfers from regional (use large page size to get all) for accurate statistics
                const allTransfersPage = await loadWarehouseTransfers(0, 10000);
                const allRegionalTransfers = allTransfersPage.content || [];
                window.transfersData.allRegionalTransfers = allRegionalTransfers;
                // Update total if we got more accurate count
                if (allTransfersPage.totalElements) {
                    window.transfersData.totalRegionalTransfers = allTransfersPage.totalElements;
                }
            } catch (error) {
                console.error('Error loading all transfers for statistics:', error);
                // Use page transfers as fallback
                window.transfersData.allRegionalTransfers = transfersPage.content || [];
            }
        } else {
            // Fallback if no regional ID
            window.transfersData.allRegionalTransfers = transfersPage.content || [];
        }

        // Update UI components
        if (window.updateTransfersStats) {
            await window.updateTransfersStats();
        }
        
        // Only initialize filters and view mode buttons if containers are empty
        const searchFilterContainer = document.getElementById('searchFilterContainer');
        const viewModeButtonsContainer = document.getElementById('viewModeButtonsContainer');
        
        if (searchFilterContainer && (!searchFilterContainer.innerHTML.trim() || searchFilterContainer.children.length === 0)) {
            if (window.updateTransfersSearchAndFilters) {
                window.updateTransfersSearchAndFilters();
            }
        }
        
        if (viewModeButtonsContainer && (!viewModeButtonsContainer.innerHTML.trim() || viewModeButtonsContainer.children.length === 0)) {
            if (window.updateTransfersViewModeButtons) {
                window.updateTransfersViewModeButtons();
            }
        }
        
        // Update table/cards and pagination - respect the current viewMode
        const viewMode = window.transfersData?.viewMode || 'table';
        if (viewMode === 'cards') {
            if (window.updateTransfersCards) {
                window.updateTransfersCards();
            }
        } else {
            if (window.updateTransfersTable) {
                window.updateTransfersTable();
            }
        }
        
        if (window.updateTransfersPagination) {
            window.updateTransfersPagination();
        }
        
        // Update view mode buttons to ensure they reflect the current state
        if (window.updateTransfersViewModeButtons) {
            window.updateTransfersViewModeButtons();
        }
    } catch (error) {
        console.error('Error loading warehouse transfers data:', error);
        const container = document.getElementById('transferTableContainer');
        if (container) {
            container.innerHTML = `
                <div class="text-center py-12">
                    <i class="fas fa-exclamation-triangle text-yellow-500 text-4xl mb-4"></i>
                    <p class="text-gray-600 text-lg mb-2">Error al cargar las transferencias</p>
                    <p class="text-gray-500 text-sm">${error.message}</p>
                </div>
            `;
        }
    }
}

/**
 * Filter inventories to show only those from warehouse's regional
 */
async function loadInventoriesForWarehouseTransfer() {
    try {
        if (!warehouseTransfersData.userRegionalId) {
            await loadCurrentUserInfoForWarehouseTransfers();
        }
        
        if (!warehouseTransfersData.userRegionalId) {
            throw new Error('No se pudo obtener el ID de la regional del usuario Warehouse.');
        }

        const token = localStorage.getItem('jwt');
        const headers = {
            'Content-Type': 'application/json'
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        // Load all inventories from the regional (all institutions in the regional)
        let allInventories = [];
        let page = 0;
        const size = 100;
        let hasMore = true;

        while (hasMore) {
            const currentEndpoint = `/api/v1/inventory/regionalAdminInventories/${warehouseTransfersData.userRegionalId}?page=${page}&size=${size}`;
            
            const response = await fetch(currentEndpoint, {
                method: 'GET',
                headers: headers
            });

            if (response.ok) {
                const data = await response.json();
                const inventories = data.content || [];
                allInventories = allInventories.concat(inventories);
                
                hasMore = !data.last && inventories.length === size;
                page++;
            } else {
                let errorMessage = `Error al cargar inventarios: ${response.statusText}`;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorData.detail || errorMessage;
                } catch (e) {
                    // Ignore parse error
                }
                console.error('Error loading inventories from regional:', errorMessage);
                hasMore = false;
            }
        }

        return allInventories;
    } catch (error) {
        console.error('Error loading inventories for warehouse transfer:', error);
        // Fallback: try the endpoint that uses current user's regional
        try {
            const token = localStorage.getItem('jwt');
            const headers = {
                'Content-Type': 'application/json'
            };
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            let allInventories = [];
            let page = 0;
            const size = 100;
            let hasMore = true;

            while (hasMore) {
                const currentFallbackEndpoint = `/api/v1/inventory/regionalAdminInventories?page=${page}&size=${size}`;
                
                const response = await fetch(currentFallbackEndpoint, {
                    method: 'GET',
                    headers: headers
                });

                if (response.ok) {
                    const data = await response.json();
                    const inventories = data.content || [];
                    allInventories = allInventories.concat(inventories);
                    
                    hasMore = !data.last && inventories.length === size;
                    page++;
                } else {
                    hasMore = false;
                }
            }

            return allInventories;
        } catch (fallbackError) {
            console.error('Error in fallback loading inventories:', fallbackError);
            return [];
        }
    }
}

/**
 * Override requestTransfer to show auto-approval message for warehouse
 */
async function requestTransferForWarehouse(transferData) {
    try {
        const token = localStorage.getItem('jwt');
        const headers = {
            'Content-Type': 'application/json'
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch('/api/v1/transfers/request', {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(transferData),
        });

        if (!response.ok) {
            let errorMessage = 'Error al solicitar la transferencia';
            try {
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    const errorData = await response.json();
                    errorMessage =
                        errorData.message ||
                        errorData.detail ||
                        errorData.error ||
                        errorMessage;
                } else {
                    const errorText = await response.text();
                    errorMessage = errorText || errorMessage;
                }
            } catch (parseError) {
                // Error al parsear respuesta
            }
            throw new Error(errorMessage);
        }

        const result = await response.json();
        
        // Show success message indicating auto-approval
        if (window.showSuccessToast) {
            window.showSuccessToast(
                'Transferencia Aprobada Automáticamente',
                'La transferencia ha sido creada y aprobada automáticamente por el sistema.'
            );
        }

        return result;
    } catch (error) {
        throw error;
    }
}

// Initialize immediately (before other scripts) if we're on warehouse transfers page
(function() {
    const isWarehouseTransfers = window.location.pathname && 
                                 window.location.pathname.includes('/warehouse/transfers');
    
    if (isWarehouseTransfers) {
        // Override loadTransfersData immediately
        window.loadTransfersData = loadWarehouseTransfersData;
        
        // Override requestTransfer for warehouse
        window.requestTransfer = async function(transferData) {
            return await requestTransferForWarehouse(transferData);
        };
    }
})();

// Also initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on warehouse transfers page
    const isWarehouseTransfers = window.location.pathname && 
                                 window.location.pathname.includes('/warehouse/transfers');
    
    if (isWarehouseTransfers) {
        // Ensure overrides are set
        window.loadTransfersData = loadWarehouseTransfersData;
        window.requestTransfer = async function(transferData) {
            return await requestTransferForWarehouse(transferData);
        };
        
        // Load user info on page load
        loadCurrentUserInfoForWarehouseTransfers().then(() => {
            // Update welcome message
            const welcomeMessage = document.getElementById('transferWelcomeMessage');
            if (welcomeMessage && warehouseTransfersData.userRegionalName) {
                welcomeMessage.textContent = 
                    `Transferencias de la regional ${warehouseTransfersData.userRegionalName} - Aprobación automática`;
            }
        }).catch(error => {
            console.error('Error initializing warehouse transfers:', error);
        });
    }
});

// Export functions
window.loadCurrentUserInfoForWarehouseTransfers = loadCurrentUserInfoForWarehouseTransfers;
window.loadWarehouseTransfers = loadWarehouseTransfers;
window.loadWarehouseTransfersData = loadWarehouseTransfersData;
window.loadInventoriesForWarehouseTransfer = loadInventoriesForWarehouseTransfer;

