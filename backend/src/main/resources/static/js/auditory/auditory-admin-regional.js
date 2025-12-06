// Auditoría Admin Regional - Specific functionality for ADMIN_REGIONAL role
// This file handles loading and displaying audit logs for the admin regional's regional

let currentUserRegionalIdForAuditory = null;
let auditoryDataAdminRegional = {
    allAuditories: [], // Store all auditories for client-side filtering
    filteredAuditories: [], // Filtered auditories
    institutions: [], // Store institutions for filtering
    currentPage: 0,
    pageSize: 6,
    totalPages: 0,
    totalAuditories: 0,
    isLoading: false,
    filters: {
        searchTerm: '',
        institutionId: 'all'
    }
};
let auditoryInstitutionCustomSelectAdminRegional = null;

/**
 * Load current user info to get regional ID
 */
async function loadCurrentUserInfoForAuditory() {
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

            currentUserRegionalIdForAuditory = userRegionalId;

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
                        updateAuditoryWelcomeMessage(regional.name);
                    }
                }
            } catch (error) {
                console.error('Error fetching regional info:', error);
                // Continue even if we can't get the regional name
            }

            return currentUserRegionalIdForAuditory;
        } else {
            throw new Error('Failed to load user info');
        }
    } catch (error) {
        console.error('Error loading current user info for auditory:', error);
        showError('Error al cargar la información del usuario: ' + error.message);
        return null;
    }
}

/**
 * Update welcome message with regional name
 */
function updateAuditoryWelcomeMessage(regionalName) {
    const welcomeMessage = document.getElementById('auditoryWelcomeMessage');
    if (welcomeMessage && regionalName) {
        welcomeMessage.textContent = `Historial de acciones realizadas en la regional: ${regionalName}`;
    }
}

/**
 * Load institutions for the admin regional's regional
 */
async function loadInstitutionsForAuditoryAdminRegional() {
    try {
        if (!currentUserRegionalIdForAuditory) {
            const regionalId = await loadCurrentUserInfoForAuditory();
            if (!regionalId) {
                return;
            }
        }

        const token = localStorage.getItem('jwt');
        if (!token) {
            throw new Error('No authentication token found');
        }

        const response = await fetch(`/api/v1/institutions/institutionsByRegionalId/${currentUserRegionalIdForAuditory}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const institutions = await response.json();
            auditoryDataAdminRegional.institutions = institutions || [];
            
            // Update institution filter dropdown
            updateInstitutionFilterForAdminRegional();
        } else {
            console.error('Error loading institutions for auditory');
        }
    } catch (error) {
        console.error('Error loading institutions for auditory:', error);
    }
}

/**
 * Update institution filter dropdown
 */
function updateInstitutionFilterForAdminRegional() {
    if (!auditoryInstitutionCustomSelectAdminRegional) {
        initializeInstitutionCustomSelectForAdminRegional();
    } else {
        const institutionOptions = [
            { value: 'all', label: 'Todos los Centros' },
            ...auditoryDataAdminRegional.institutions.map(inst => ({
                value: (inst.id || inst.institutionId || '').toString(),
                label: inst.name || 'Sin nombre'
            }))
        ];
        auditoryInstitutionCustomSelectAdminRegional.setOptions(institutionOptions);
    }
}

/**
 * Initialize institution custom select
 */
function initializeInstitutionCustomSelectForAdminRegional() {
    const container = document.getElementById('auditoryInstitutionFilterAdminRegionalSelect');
    if (!container) {
        console.warn('Institution filter container not found');
        return;
    }

    // Get CustomSelect class
    const CustomSelectClass = window.CustomSelect || (typeof CustomSelect !== 'undefined' ? CustomSelect : null);
    if (!CustomSelectClass) {
        console.error('CustomSelect class not found');
        return;
    }

    const institutionOptions = [
        { value: 'all', label: 'Todos los Centros' },
        ...auditoryDataAdminRegional.institutions.map(inst => ({
            value: (inst.id || inst.institutionId || '').toString(),
            label: inst.name || 'Sin nombre'
        }))
    ];

    auditoryInstitutionCustomSelectAdminRegional = new CustomSelectClass('auditoryInstitutionFilterAdminRegionalSelect', {
        placeholder: 'Todos los Centros',
        onChange: (option) => {
            const value = option.value || 'all';
            const hiddenInput = document.getElementById('auditoryInstitutionFilterAdminRegional');
            if (hiddenInput) {
                hiddenInput.value = value;
            }
            auditoryDataAdminRegional.filters.institutionId = value;
            auditoryDataAdminRegional.currentPage = 0; // Reset to first page
            filterAuditoriesForAdminRegional();
        }
    });

    auditoryInstitutionCustomSelectAdminRegional.setOptions(institutionOptions);
}

/**
 * Load auditories for the admin regional's regional
 */
async function loadAuditoriesForAdminRegional(page = 0) {
    try {
        // First, get the user's regional ID
        if (!currentUserRegionalIdForAuditory) {
            const regionalId = await loadCurrentUserInfoForAuditory();
            if (!regionalId) {
                return;
            }
        }

        const token = localStorage.getItem('jwt');
        if (!token) {
            throw new Error('No authentication token found');
        }

        // Show loading state
        auditoryDataAdminRegional.isLoading = true;
        showLoadingStateForAdminRegional();

        // Load all auditories from the regional (for client-side filtering)
        // Use a large page size to get all records
        const response = await fetch(`/api/v1/auditories/regional/${currentUserRegionalIdForAuditory}?page=0&size=10000`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            
            // Store all auditories
            auditoryDataAdminRegional.allAuditories = data.auditories || [];
            
            // Load institutions to get cities
            await loadInstitutionsForAuditoryAdminRegional();
            
            // Apply filters and paginate
            filterAuditoriesForAdminRegional();
        } else {
            throw new Error('Error al cargar los registros de auditoría');
        }
    } catch (error) {
        console.error('Error loading auditories:', error);
        showError('Error al cargar los registros de auditoría: ' + error.message);
        const tbody = document.getElementById('auditoryTableBody');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="py-8 text-center text-red-500">
                        <i class="fas fa-exclamation-triangle text-2xl mb-2"></i>
                        <p>Error al cargar los registros: ${error.message}</p>
                        <button onclick="loadAuditoriesForAdminRegional()" 
                            class="mt-4 bg-[#00AF00] hover:bg-[#008800] text-white font-semibold py-2 px-4 rounded-xl transition-colors">
                            Reintentar
                        </button>
                    </td>
                </tr>
            `;
        }
    } finally {
        auditoryDataAdminRegional.isLoading = false;
        hideLoadingStateForAdminRegional();
    }
}

/**
 * Filter auditories based on search term and institution
 */
function filterAuditoriesForAdminRegional() {
    let filtered = [...auditoryDataAdminRegional.allAuditories];
    
    // Filter by search term
    const searchTerm = auditoryDataAdminRegional.filters.searchTerm.toLowerCase().trim();
    if (searchTerm) {
        filtered = filtered.filter(auditory => {
            const performerName = (auditory.performerName || '').toLowerCase();
            const performerEmail = (auditory.performerEmail || '').toLowerCase();
            const action = (auditory.action || '').toLowerCase();
            const institutionName = (auditory.institutionName || '').toLowerCase();
            
            return performerName.includes(searchTerm) ||
                   performerEmail.includes(searchTerm) ||
                   action.includes(searchTerm) ||
                   institutionName.includes(searchTerm);
        });
    }
    
    // Filter by institution
    const institutionFilter = auditoryDataAdminRegional.filters.institutionId;
    if (institutionFilter && institutionFilter !== 'all') {
        // Find the selected institution
        const selectedInstitution = auditoryDataAdminRegional.institutions.find(inst => {
            const instId = (inst.id || inst.institutionId || '').toString();
            return instId === institutionFilter.toString();
        });
        
        if (selectedInstitution) {
            const institutionName = selectedInstitution.name;
            // Filter auditories by institution name
            filtered = filtered.filter(auditory => {
                return auditory.institutionName === institutionName;
            });
        }
    }
    
    // Store filtered auditories
    auditoryDataAdminRegional.filteredAuditories = filtered;
    
    // Update pagination
    auditoryDataAdminRegional.totalAuditories = filtered.length;
    auditoryDataAdminRegional.totalPages = Math.ceil(filtered.length / auditoryDataAdminRegional.pageSize);
    
    // Reset to first page if current page is out of bounds
    if (auditoryDataAdminRegional.currentPage >= auditoryDataAdminRegional.totalPages) {
        auditoryDataAdminRegional.currentPage = 0;
    }
    
    // Get paginated data
    const startIndex = auditoryDataAdminRegional.currentPage * auditoryDataAdminRegional.pageSize;
    const endIndex = startIndex + auditoryDataAdminRegional.pageSize;
    const paginatedAuditories = filtered.slice(startIndex, endIndex);
    
    // Display paginated auditories
    displayAuditoriesForAdminRegional(paginatedAuditories);
    updatePaginationForAdminRegional();
}

/**
 * Display auditories in table
 */
function displayAuditoriesForAdminRegional(auditories) {
    const tbody = document.getElementById('auditoryTableBody');
    
    if (!tbody) return;
    
    if (auditories.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="py-8 text-center text-gray-500 dark:text-gray-400">
                    No hay registros de auditoría disponibles
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = auditories.map(auditory => {
        const date = new Date(auditory.date);
        const formattedDate = date.toLocaleString('es-CO', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            timeZone: 'America/Bogota'
        }) + ' (GMT-5)';
        
        const performerName = auditory.performerName || 'N/A';
        const avatarHtml = createUserAvatarForAdminRegional(auditory.performerImgUrl, performerName, 'w-10 h-10');
        
        return `
            <tr class="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                <td class="py-3 px-4 text-gray-700 dark:text-gray-300">${formattedDate}</td>
                <td class="py-3 px-4">
                    <div class="flex items-center gap-3">
                        ${avatarHtml}
                        <div class="flex flex-col">
                            <span class="text-gray-700 dark:text-gray-300 font-medium">${escapeHtml(performerName)}</span>
                            ${auditory.performerEmail ? `<span class="text-xs text-gray-500 dark:text-gray-400">${escapeHtml(auditory.performerEmail)}</span>` : ''}
                        </div>
                    </div>
                </td>
                <td class="py-3 px-4 text-gray-700 dark:text-gray-300">${escapeHtml(auditory.action || 'N/A')}</td>
                <td class="py-3 px-4 text-gray-700 dark:text-gray-300">${auditory.institutionName ? escapeHtml(auditory.institutionName) : 'N/A'}</td>
            </tr>
        `;
    }).join('');
}

/**
 * Helper function to create avatar HTML
 */
function createUserAvatarForAdminRegional(imgUrl, fullName, size = 'w-10 h-10') {
    const initials = (fullName || 'U').charAt(0).toUpperCase();
    const escapedInitials = escapeHtml(initials);
    
    if (imgUrl) {
        const uniqueId = 'avatar-' + Math.random().toString(36).substr(2, 9);
        const escapedImgUrl = escapeHtml(imgUrl);
        const escapedFullName = escapeHtml(fullName || 'Usuario');
        
        return `
            <div class="relative ${size} rounded-full overflow-hidden flex-shrink-0" id="avatar-container-${uniqueId}">
                <div class="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-700" id="avatar-spinner-${uniqueId}">
                    <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                </div>
                <img src="${escapedImgUrl}" alt="${escapedFullName}" 
                     class="w-full h-full object-cover opacity-0 transition-opacity duration-300" 
                     id="avatar-img-${uniqueId}"
                     onload="(function() { const img = document.getElementById('avatar-img-${uniqueId}'); const spinner = document.getElementById('avatar-spinner-${uniqueId}'); if (img) img.classList.remove('opacity-0'); if (spinner) spinner.style.display='none'; })();"
                     onerror="(function() { const spinner = document.getElementById('avatar-spinner-${uniqueId}'); const container = document.getElementById('avatar-container-${uniqueId}'); if (spinner) spinner.style.display='none'; container.innerHTML='<div class=\\'w-full h-full bg-[#00AF00] rounded-full flex items-center justify-center text-white text-sm font-bold\\'>${escapedInitials}</div>'; })();">
            </div>
        `;
    } else {
        return `
            <div class="${size} bg-[#00AF00] rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                ${escapedInitials}
            </div>
        `;
    }
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Update pagination controls
 */
function updatePaginationForAdminRegional() {
    const paginationInfo = document.getElementById('paginationInfo');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    if (paginationInfo) {
        const start = (auditoryDataAdminRegional.currentPage * auditoryDataAdminRegional.pageSize) + 1;
        const end = Math.min((auditoryDataAdminRegional.currentPage + 1) * auditoryDataAdminRegional.pageSize, auditoryDataAdminRegional.totalAuditories);
        paginationInfo.textContent = `Mostrando ${start}-${end} de ${auditoryDataAdminRegional.totalAuditories} registros`;
    }
    
    if (prevBtn) {
        prevBtn.disabled = auditoryDataAdminRegional.currentPage === 0;
    }
    
    if (nextBtn) {
        nextBtn.disabled = auditoryDataAdminRegional.currentPage >= auditoryDataAdminRegional.totalPages - 1;
    }
}

/**
 * Navigation functions
 */
function previousPageForAdminRegional() {
    if (auditoryDataAdminRegional.currentPage > 0) {
        auditoryDataAdminRegional.currentPage--;
        filterAuditoriesForAdminRegional();
    }
}

function nextPageForAdminRegional() {
    if (auditoryDataAdminRegional.currentPage < auditoryDataAdminRegional.totalPages - 1) {
        auditoryDataAdminRegional.currentPage++;
        filterAuditoriesForAdminRegional();
    }
}

/**
 * Setup search and filter event listeners
 */
function setupSearchAndFiltersForAdminRegional() {
    // Search input
    const searchInput = document.getElementById('auditorySearchAdminRegional');
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                auditoryDataAdminRegional.filters.searchTerm = e.target.value;
                auditoryDataAdminRegional.currentPage = 0; // Reset to first page
                filterAuditoriesForAdminRegional();
            }, 300); // Debounce search
        });
    }
}

/**
 * Show loading state
 */
function showLoadingStateForAdminRegional() {
    const tbody = document.getElementById('auditoryTableBody');
    const refreshIcon = document.getElementById('refreshIcon');
    const refreshText = document.getElementById('refreshText');
    
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="py-8 text-center">
                    <div class="flex flex-col items-center gap-2">
                        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                        <span class="text-gray-500 dark:text-gray-400">Cargando registros...</span>
                    </div>
                </td>
            </tr>
        `;
    }
    
    if (refreshIcon) {
        refreshIcon.classList.add('animate-spin');
    }
    
    if (refreshText) {
        refreshText.textContent = 'Cargando...';
    }
}

/**
 * Hide loading state
 */
function hideLoadingStateForAdminRegional() {
    const refreshIcon = document.getElementById('refreshIcon');
    const refreshText = document.getElementById('refreshText');
    
    if (refreshIcon) {
        refreshIcon.classList.remove('animate-spin');
    }
    
    if (refreshText) {
        refreshText.textContent = 'Actualizar';
    }
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
 * Initialize auditory page for admin regional
 */
function initializeAdminRegionalAuditory() {
    // Check if we're on admin_regional auditory page
    const path = window.location.pathname || '';
    const isAdminRegionalPage = path.includes('/admin_regional/auditory');
    
    if (isAdminRegionalPage) {
        // Override loadAuditories function
        window.loadAuditories = loadAuditoriesForAdminRegional;
        
        // Setup search and filters
        setupSearchAndFiltersForAdminRegional();
        
        // Load auditories when page is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                loadAuditoriesForAdminRegional();
            });
        } else {
            loadAuditoriesForAdminRegional();
        }
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAdminRegionalAuditory);
} else {
    initializeAdminRegionalAuditory();
}

// Export functions
window.loadAuditoriesForAdminRegional = loadAuditoriesForAdminRegional;
window.previousPageForAdminRegional = previousPageForAdminRegional;
window.nextPageForAdminRegional = nextPageForAdminRegional;
window.initializeAdminRegionalAuditory = initializeAdminRegionalAuditory;

