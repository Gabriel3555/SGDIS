// Verification Admin Regional - Specific functionality for ADMIN_REGIONAL role
// This file handles loading and displaying verifications for the admin regional's regional

let currentUserRegionalId = null;
let verificationDataAdminRegional = {
    verifications: [],
    filteredVerifications: [],
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
            
            // Update UI
            updateVerificationUIForAdminRegional();
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
 * Update verification UI for admin regional
 */
function updateVerificationUIForAdminRegional() {
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

/**
 * Update search and filters for admin regional (simplified version)
 */
function updateVerificationSearchAndFiltersForAdminRegional() {
    const container = document.getElementById('searchFilterContainer');
    if (!container) return;
    
    const currentSearchTerm = verificationDataAdminRegional.filters.searchTerm || '';
    const currentStatusFilter = verificationDataAdminRegional.filters.status || 'all';
    
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
window.handleVerificationSearchForAdminRegional = handleVerificationSearchForAdminRegional;
window.handleVerificationStatusFilterForAdminRegional = handleVerificationStatusFilterForAdminRegional;
window.initializeAdminRegionalVerifications = initializeAdminRegionalVerifications;

