// Loans Admin Regional - Specific functionality for ADMIN_REGIONAL role
// This file handles loading and displaying loans for the admin regional's regional

let currentUserRegionalIdForLoans = null;
let loansDataAdminRegional = {
    loans: [],
    allLoans: [], // Store all loans from API before filtering and pagination
    filteredLoans: [],
    currentPage: 0,
    pageSize: 10,
    totalPages: 0,
    totalElements: 0,
    filters: {
        status: 'all',
        searchTerm: ''
    }
};

/**
 * Load current user info to get regional ID
 */
async function loadCurrentUserInfoForLoans() {
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

            currentUserRegionalIdForLoans = userRegionalId;

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
                        updateLoansWelcomeMessage(regional.name);
                        window.currentUserRegional = regional;
                    }
                }
            } catch (error) {
                console.error('Error fetching regional info:', error);
                // Continue even if we can't get the regional name
            }

            return currentUserRegionalIdForLoans;
        } else {
            throw new Error('Failed to load user info');
        }
    } catch (error) {
        console.error('Error loading current user info for loans:', error);
        showError('Error al cargar la información del usuario: ' + error.message);
        return null;
    }
}

/**
 * Update welcome message with regional name
 */
function updateLoansWelcomeMessage(regionalName) {
    const welcomeMessage = document.getElementById('loansWelcomeMessage');
    if (welcomeMessage && regionalName) {
        welcomeMessage.textContent = `Administración de préstamos de la regional: ${regionalName}`;
    }
}

/**
 * Load loans for the admin regional's regional
 */
async function loadLoansForAdminRegional(page = 0) {
    try {
        // First, get the user's regional ID
        if (!currentUserRegionalIdForLoans) {
            const regionalId = await loadCurrentUserInfoForLoans();
            if (!regionalId) {
                return;
            }
        }

        const token = localStorage.getItem('jwt');
        if (!token) {
            throw new Error('No authentication token found');
        }

        // Show loading state
        const refreshIcon = document.getElementById('refreshIcon');
        const refreshText = document.getElementById('refreshText');
        if (refreshIcon) refreshIcon.classList.add('animate-spin');
        if (refreshText) refreshText.textContent = 'Cargando...';

        const container = document.getElementById('loansTableContainer');
        if (container) {
            container.innerHTML = `
                <div class="animate-pulse space-y-4">
                    <div class="h-32 bg-gray-200 rounded-xl"></div>
                    <div class="h-32 bg-gray-200 rounded-xl"></div>
                    <div class="h-32 bg-gray-200 rounded-xl"></div>
                </div>
            `;
        }

        // Load loans from the regional using the filter endpoint
        const response = await fetch(`/api/v1/loan/filter?regionalId=${currentUserRegionalIdForLoans}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const loans = await response.json();
            
            // The filter endpoint returns a simple list, not paginated
            // Store all loans first
            const allLoans = Array.isArray(loans) ? loans : [];
            
            // Store all loans in the data structure (before filtering)
            loansDataAdminRegional.allLoans = allLoans;
            
            // Apply filters first (this will update filteredLoans)
            loansDataAdminRegional.loans = allLoans;
            filterLoansForAdminRegional();
            
            // Now apply pagination to the filtered results
            const filteredLoans = loansDataAdminRegional.filteredLoans || loansDataAdminRegional.loans;
            loansDataAdminRegional.totalElements = filteredLoans.length;
            loansDataAdminRegional.totalPages = Math.ceil(filteredLoans.length / loansDataAdminRegional.pageSize);
            loansDataAdminRegional.currentPage = page;
            
            // Apply pagination manually to filtered results
            const startIndex = page * loansDataAdminRegional.pageSize;
            const endIndex = startIndex + loansDataAdminRegional.pageSize;
            loansDataAdminRegional.loans = filteredLoans.slice(startIndex, endIndex);
            
            // Update window.loansData for compatibility with existing UI functions
            if (!window.loansData) {
                window.loansData = {};
            }
            window.loansData.loans = loansDataAdminRegional.loans;
            window.loansData.filteredLoans = loansDataAdminRegional.filteredLoans;
            window.loansData.totalElements = loansDataAdminRegional.totalElements;
            window.loansData.currentPage = loansDataAdminRegional.currentPage;
            window.loansData.itemsPerPage = loansDataAdminRegional.pageSize;
            window.loansData.searchTerm = loansDataAdminRegional.filters.searchTerm;
            window.loansData.selectedStatus = loansDataAdminRegional.filters.status;
            
            // Update UI
            updateLoansUIForAdminRegional();
        } else {
            throw new Error('Error al cargar los préstamos');
        }
    } catch (error) {
        console.error('Error loading loans:', error);
        showError('Error al cargar los préstamos: ' + error.message);
        const container = document.getElementById('loansTableContainer');
        if (container) {
            container.innerHTML = `
                <div class="text-center py-12 text-gray-500">
                    <i class="fas fa-exclamation-triangle text-4xl mb-4"></i>
                    <p class="text-lg font-semibold mb-2">Error al cargar los préstamos</p>
                    <p class="text-sm">${error.message}</p>
                    <button onclick="loadLoansForAdminRegional()" 
                        class="mt-4 bg-[#00AF00] hover:bg-[#008800] text-white font-semibold py-2 px-4 rounded-xl transition-colors">
                        Reintentar
                    </button>
                </div>
            `;
        }
    } finally {
        const refreshIcon = document.getElementById('refreshIcon');
        const refreshText = document.getElementById('refreshText');
        if (refreshIcon) refreshIcon.classList.remove('animate-spin');
        if (refreshText) refreshText.textContent = 'Actualizar';
    }
}

/**
 * Filter loans for admin regional
 */
function filterLoansForAdminRegional() {
    // Use allLoans if available, otherwise use loans
    const sourceLoans = loansDataAdminRegional.allLoans.length > 0 
        ? loansDataAdminRegional.allLoans 
        : loansDataAdminRegional.loans;
    let filtered = [...sourceLoans];
    
    // Filter by status
    const statusFilter = loansDataAdminRegional.filters.status;
    if (statusFilter && statusFilter !== 'all') {
        if (statusFilter === 'active') {
            filtered = filtered.filter(l => !l.returned);
        } else if (statusFilter === 'returned') {
            filtered = filtered.filter(l => l.returned === true);
        }
    }
    
    // Filter by search term
    const searchTerm = (loansDataAdminRegional.filters.searchTerm || '').toLowerCase();
    if (searchTerm) {
        filtered = filtered.filter(l => {
            const itemName = (l.item?.productName || '').toLowerCase();
            const serialNumber = (l.item?.serialNumber || '').toLowerCase();
            const licencePlate = (l.item?.licencePlateNumber || '').toLowerCase();
            const inventoryName = (l.item?.inventory?.name || '').toLowerCase();
            const lenderName = (l.lender?.fullName || '').toLowerCase();
            const responsibleName = (l.responsible?.fullName || '').toLowerCase();
            const detailsLend = (l.detailsLend || '').toLowerCase();
            
            return itemName.includes(searchTerm) ||
                   serialNumber.includes(searchTerm) ||
                   licencePlate.includes(searchTerm) ||
                   inventoryName.includes(searchTerm) ||
                   lenderName.includes(searchTerm) ||
                   responsibleName.includes(searchTerm) ||
                   detailsLend.includes(searchTerm);
        });
    }
    
    // Update filtered loans
    loansDataAdminRegional.filteredLoans = filtered;
    
    // Update pagination based on filtered results
    loansDataAdminRegional.totalElements = filtered.length;
    loansDataAdminRegional.totalPages = Math.ceil(filtered.length / loansDataAdminRegional.pageSize);
    
    // Apply pagination to filtered results
    const currentPage = loansDataAdminRegional.currentPage;
    const startIndex = currentPage * loansDataAdminRegional.pageSize;
    const endIndex = startIndex + loansDataAdminRegional.pageSize;
    loansDataAdminRegional.loans = filtered.slice(startIndex, endIndex);
    
    // If current page is beyond available pages, reset to first page
    if (currentPage >= loansDataAdminRegional.totalPages && loansDataAdminRegional.totalPages > 0) {
        loansDataAdminRegional.currentPage = 0;
        loansDataAdminRegional.loans = filtered.slice(0, loansDataAdminRegional.pageSize);
    }
}

/**
 * Update loans UI for admin regional
 */
function updateLoansUIForAdminRegional() {
    // Update stats
    if (window.updateLoansStats) {
        window.updateLoansStats();
    }
    
    // Update table
    if (window.updateLoansTable) {
        window.updateLoansTable();
    }
    
    // Update pagination
    if (window.updatePagination) {
        window.updatePagination();
    }
    
    // Update search and filters (simplified for admin regional)
    updateLoansSearchAndFiltersForAdminRegional();
}

/**
 * Update search and filters for admin regional (simplified version)
 */
function updateLoansSearchAndFiltersForAdminRegional() {
    const container = document.getElementById('searchFilterContainer');
    if (!container) return;
    
    const currentSearchTerm = loansDataAdminRegional.filters.searchTerm || '';
    const currentStatusFilter = loansDataAdminRegional.filters.status || 'all';
    
    container.innerHTML = `
        <div class="relative flex-1" style="min-width: 200px;">
            <label class="block text-xs font-medium text-gray-600 mb-1.5">Buscar</label>
            <div class="relative">
                <i class="fas fa-search absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                <input type="text" 
                    id="loansSearchAdminRegional"
                    placeholder="Buscar por ítem, serial, placa, responsable..." 
                    value="${currentSearchTerm}"
                    onkeyup="handleLoansSearchForAdminRegional(event)"
                    class="w-full pl-11 pr-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00AF00] bg-white text-gray-900 transition-all"
                    style="height: 56px; font-size: 0.9375rem;">
            </div>
        </div>
        <div class="relative" style="min-width: 180px; flex-shrink: 0;">
            <label class="block text-xs font-medium text-gray-600 mb-1.5">Estado</label>
            <select id="loansStatusFilterAdminRegional" 
                onchange="handleLoansStatusFilterForAdminRegional(this.value)" 
                class="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00AF00] bg-white text-gray-900 transition-all" 
                style="height: 56px; font-size: 0.9375rem;">
                <option value="all" ${currentStatusFilter === 'all' ? 'selected' : ''}>Todos los estados</option>
                <option value="active" ${currentStatusFilter === 'active' ? 'selected' : ''}>Préstamos Activos</option>
                <option value="returned" ${currentStatusFilter === 'returned' ? 'selected' : ''}>Préstamos Devueltos</option>
            </select>
        </div>
    `;
}

/**
 * Handle search for admin regional
 */
function handleLoansSearchForAdminRegional(event) {
    if (event.key === 'Enter' || event.type === 'input') {
        const searchTerm = event.target.value.trim();
        loansDataAdminRegional.filters.searchTerm = searchTerm;
        filterLoansForAdminRegional();
        updateLoansUIForAdminRegional();
    }
}

/**
 * Handle status filter change for admin regional
 */
function handleLoansStatusFilterForAdminRegional(status) {
    loansDataAdminRegional.filters.status = status;
    filterLoansForAdminRegional();
    updateLoansUIForAdminRegional();
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
 * Initialize loans page for admin regional
 */
function initializeAdminRegionalLoans() {
    // Check if we're on admin_regional loans page
    const path = window.location.pathname || '';
    const isAdminRegionalPage = path.includes('/admin_regional/loans');
    
    if (isAdminRegionalPage) {
        // Override loadLoansData function
        window.loadLoansData = loadLoansForAdminRegional;
        
        // Load loans when page is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                loadLoansForAdminRegional();
            });
        } else {
            loadLoansForAdminRegional();
        }
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAdminRegionalLoans);
} else {
    initializeAdminRegionalLoans();
}

// Export functions
window.loadLoansForAdminRegional = loadLoansForAdminRegional;
window.handleLoansSearchForAdminRegional = handleLoansSearchForAdminRegional;
window.handleLoansStatusFilterForAdminRegional = handleLoansStatusFilterForAdminRegional;
window.initializeAdminRegionalLoans = initializeAdminRegionalLoans;

