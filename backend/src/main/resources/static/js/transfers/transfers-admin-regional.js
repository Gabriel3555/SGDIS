// Transfers Admin Regional - Specific functionality for ADMIN_REGIONAL role
// This file handles loading and displaying transfers for the admin regional's regional

let currentUserRegionalId = null;
let transfersDataAdminRegional = {
    transfers: [],
    currentPage: 0,
    pageSize: 6,
    totalPages: 0,
    totalElements: 0,
    viewMode: 'table',
    filters: {
        status: 'all',
        searchTerm: ''
    }
};

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

        // Load transfers from the regional
        const response = await fetch(`/api/v1/transfers/regional/${currentUserRegionalId}?page=${page}&size=${transfersDataAdminRegional.pageSize}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            
            // Update transfers data
            transfersDataAdminRegional.transfers = Array.isArray(data.content) ? data.content : [];
            transfersDataAdminRegional.totalElements = data.totalElements || 0;
            transfersDataAdminRegional.totalPages = data.totalPages || 0;
            transfersDataAdminRegional.currentPage = data.number || 0;
            
            // Update window.transfersData for compatibility with existing UI functions
            if (!window.transfersData) {
                window.transfersData = {};
            }
            window.transfersData.transfers = transfersDataAdminRegional.transfers;
            window.transfersData.totalElements = transfersDataAdminRegional.totalElements;
            window.transfersData.totalPages = transfersDataAdminRegional.totalPages;
            window.transfersData.currentPage = transfersDataAdminRegional.currentPage;
            window.transfersData.pageSize = transfersDataAdminRegional.pageSize;
            window.transfersData.viewMode = transfersDataAdminRegional.viewMode;
            window.transfersData.filters = transfersDataAdminRegional.filters;
            
            // Update UI
            updateTransfersUIForAdminRegional();
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
    
    // Update search and filters (simplified for admin regional)
    updateTransfersSearchAndFiltersForAdminRegional();
    
    // Update view mode buttons
    if (window.updateTransfersViewModeButtons) {
        window.updateTransfersViewModeButtons();
    }
}

/**
 * Update search and filters for admin regional (simplified version)
 */
function updateTransfersSearchAndFiltersForAdminRegional() {
    const container = document.getElementById('searchFilterContainer');
    if (!container) return;
    
    const currentSearchTerm = transfersDataAdminRegional.filters.searchTerm || '';
    const currentStatusFilter = transfersDataAdminRegional.filters.status || 'all';
    
    container.innerHTML = `
        <div class="relative flex-1" style="min-width: 200px;">
            <label class="block text-xs font-medium text-gray-600 mb-1.5">Buscar</label>
            <div class="relative">
                <i class="fas fa-search absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                <input type="text" 
                    id="transferSearchAdminRegional"
                    placeholder="Buscar por origen, destino, estado..." 
                    value="${currentSearchTerm}"
                    onkeyup="handleTransferSearchForAdminRegional(event)"
                    class="w-full pl-11 pr-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00AF00] bg-white text-gray-900 transition-all"
                    style="height: 56px; font-size: 0.9375rem;">
            </div>
        </div>
        <div class="relative" style="min-width: 180px; flex-shrink: 0;">
            <label class="block text-xs font-medium text-gray-600 mb-1.5">Estado</label>
            <select id="transferStatusFilterAdminRegional" 
                onchange="handleTransferStatusFilterForAdminRegional(this.value)" 
                class="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00AF00] bg-white text-gray-900 transition-all" 
                style="height: 56px; font-size: 0.9375rem;">
                <option value="all" ${currentStatusFilter === 'all' ? 'selected' : ''}>Todos los estados</option>
                <option value="PENDING" ${currentStatusFilter === 'PENDING' ? 'selected' : ''}>Pendientes</option>
                <option value="APPROVED" ${currentStatusFilter === 'APPROVED' ? 'selected' : ''}>Aprobadas</option>
                <option value="REJECTED" ${currentStatusFilter === 'REJECTED' ? 'selected' : ''}>Rechazadas</option>
            </select>
        </div>
    `;
}

/**
 * Handle search for admin regional
 */
function handleTransferSearchForAdminRegional(event) {
    if (event.key === 'Enter' || event.type === 'input') {
        const searchTerm = event.target.value.trim();
        transfersDataAdminRegional.filters.searchTerm = searchTerm;
        if (window.transfersData) {
            window.transfersData.filters = transfersDataAdminRegional.filters;
        }
        filterTransfersForAdminRegional();
    }
}

/**
 * Handle status filter change for admin regional
 */
function handleTransferStatusFilterForAdminRegional(status) {
    transfersDataAdminRegional.filters.status = status;
    if (window.transfersData) {
        window.transfersData.filters = transfersDataAdminRegional.filters;
    }
    filterTransfersForAdminRegional();
}

/**
 * Filter transfers for admin regional
 */
function filterTransfersForAdminRegional() {
    let filtered = [...transfersDataAdminRegional.transfers];
    
    // Filter by status
    const statusFilter = transfersDataAdminRegional.filters.status;
    if (statusFilter && statusFilter !== 'all') {
        filtered = filtered.filter(t => {
            const transferStatus = t.status || t.approvalStatus || '';
            return transferStatus.toUpperCase() === statusFilter.toUpperCase();
        });
    }
    
    // Filter by search term
    const searchTerm = (transfersDataAdminRegional.filters.searchTerm || '').toLowerCase();
    if (searchTerm) {
        filtered = filtered.filter(t => {
            const sourceInventory = (t.sourceInventory?.name || '').toLowerCase();
            const destinationInventory = (t.inventory?.name || '').toLowerCase();
            const itemName = (t.item?.productName || '').toLowerCase();
            const status = (t.status || t.approvalStatus || '').toLowerCase();
            const details = (t.details || '').toLowerCase();
            
            return sourceInventory.includes(searchTerm) ||
                   destinationInventory.includes(searchTerm) ||
                   itemName.includes(searchTerm) ||
                   status.includes(searchTerm) ||
                   details.includes(searchTerm);
        });
    }
    
    // Update filtered transfers
    if (window.transfersData) {
        window.transfersData.transfers = filtered;
    }
    
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

