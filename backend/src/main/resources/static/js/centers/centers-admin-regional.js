// Centers Admin Regional - Specific functionality for ADMIN_REGIONAL role
// This file handles loading and displaying centers (institutions) for the admin regional's regional

let centersData = [];
let filteredCentersData = [];
let currentUserRegionalId = null;
let citiesData = [];
let currentEditingCenterId = null;
let currentPage = 1;
const itemsPerPage = 6;
let allCities = [];

/**
 * Load current user info to get regional ID
 */
async function loadCurrentUserInfoForCenters() {
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
                        updateCentersWelcomeMessage(regional.name);
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
function updateCentersWelcomeMessage(regionalName) {
    const welcomeMessage = document.getElementById('centersWelcomeMessage');
    if (welcomeMessage && regionalName) {
        welcomeMessage.textContent = `Administración de centros de la regional: ${regionalName}`;
    }
}

/**
 * Load centers (institutions) for the admin regional's regional
 */
async function loadCentersForAdminRegional() {
    try {
        // First, get the user's regional ID
        if (!currentUserRegionalId) {
            const regionalId = await loadCurrentUserInfoForCenters();
            if (!regionalId) {
                return;
            }
        }

        const token = localStorage.getItem('jwt');
        if (!token) {
            throw new Error('No authentication token found');
        }

        // Load centers from the regional
        const response = await fetch(`/api/v1/institutions/institutionsByRegionalId/${currentUserRegionalId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            centersData = await response.json();
            // Extract unique cities from centers data
            extractCitiesFromCenters();
            populateCityFilter();
            applyFilters();
        } else {
            throw new Error('Error al cargar los centros');
        }
    } catch (error) {
        console.error('Error loading centers:', error);
        showError('Error al cargar los centros: ' + error.message);
        renderCenters(); // Render empty state
    }
}

/**
 * Extract unique cities from centers data
 */
function extractCitiesFromCenters() {
    const citySet = new Set();
    centersData.forEach(center => {
        if (center.cityName) {
            citySet.add(center.cityName);
        }
    });
    allCities = Array.from(citySet).sort();
}

/**
 * Populate city filter dropdown
 */
function populateCityFilter() {
    const cityFilter = document.getElementById('cityFilter');
    if (!cityFilter) return;

    // Clear existing options except the first one
    while (cityFilter.options.length > 1) {
        cityFilter.remove(1);
    }

    // Add city options
    allCities.forEach(city => {
        const option = document.createElement('option');
        option.value = city;
        option.textContent = city;
        cityFilter.appendChild(option);
    });
}

/**
 * Apply filters and search
 */
function applyFilters() {
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase().trim() || '';
    const selectedCity = document.getElementById('cityFilter')?.value || '';

    // Filter centers
    filteredCentersData = centersData.filter(center => {
        const matchesSearch = !searchTerm || 
            (center.name && center.name.toLowerCase().includes(searchTerm)) ||
            (center.codeInstitution && center.codeInstitution.toLowerCase().includes(searchTerm));
        
        const matchesCity = !selectedCity || center.cityName === selectedCity;

        return matchesSearch && matchesCity;
    });

    // Reset to first page when filters change
    currentPage = 1;
    
    // Render filtered and paginated centers
    renderCenters();
    updatePagination();
}

/**
 * Render centers in the table with pagination
 */
function renderCenters() {
    const container = document.getElementById('centersTableContainer');
    if (!container) return;

    if (filteredCentersData.length === 0) {
        container.innerHTML = `
            <div class="text-center py-12 text-gray-500 dark:text-gray-400">
                <i class="fas fa-building text-4xl mb-4"></i>
                <p class="text-lg font-semibold mb-2">No se encontraron centros</p>
                <p class="text-sm">Intenta ajustar los filtros de búsqueda</p>
            </div>
        `;
        return;
    }

    // Calculate pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedCenters = filteredCentersData.slice(startIndex, endIndex);

    let html = `
        <div class="overflow-x-auto">
            <table class="w-full">
                <thead>
                    <tr class="border-b border-gray-200 dark:border-gray-700">
                        <th class="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Nombre</th>
                        <th class="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Código</th>
                        <th class="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Ciudad</th>
                        <th class="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Acciones</th>
                    </tr>
                </thead>
                <tbody>
    `;

    paginatedCenters.forEach(center => {
        html += `
            <tr class="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <td class="py-3 px-4 text-gray-700 dark:text-gray-300 font-medium">${center.name || '-'}</td>
                <td class="py-3 px-4 text-gray-700 dark:text-gray-300">${center.codeInstitution || '-'}</td>
                <td class="py-3 px-4 text-gray-700 dark:text-gray-300">${center.cityName || '-'}</td>
                <td class="py-3 px-4 text-right">
                    <button onclick="showEditCenterModal(${center.id})" class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors" title="Editar centro">
                        <i class="fas fa-edit"></i>
                    </button>
                </td>
            </tr>
        `;
    });

    html += `
                </tbody>
            </table>
        </div>
    `;

    container.innerHTML = html;
}

/**
 * Update pagination controls
 */
function updatePagination() {
    const totalItems = filteredCentersData.length;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
    
    // Update pagination info
    const paginationInfo = document.getElementById('paginationInfo');
    if (paginationInfo) {
        if (totalItems === 0) {
            paginationInfo.textContent = 'No hay centros para mostrar';
        } else {
            paginationInfo.textContent = `Mostrando ${startIndex + 1} - ${endIndex} de ${totalItems} centros`;
        }
    }

    // Update pagination buttons
    const prevBtn = document.getElementById('prevPageBtn');
    const nextBtn = document.getElementById('nextPageBtn');
    
    if (prevBtn) {
        prevBtn.disabled = currentPage === 1;
    }
    
    if (nextBtn) {
        nextBtn.disabled = endIndex >= totalItems;
    }
}

/**
 * Change page
 */
function changePage(direction) {
    const totalPages = Math.ceil(filteredCentersData.length / itemsPerPage);
    const newPage = currentPage + direction;
    
    if (newPage >= 1 && newPage <= totalPages) {
        currentPage = newPage;
        renderCenters();
        updatePagination();
        
        // Scroll to top of table
        const container = document.getElementById('centersTableContainer');
        if (container) {
            container.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
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
 * Show success message
 */
function showSuccess(message) {
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2';
    toast.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <span>${message}</span>
    `;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

/**
 * Initialize centers page for admin regional
 */
function initializeAdminRegionalCenters() {
    // Check if we're on admin_regional centers page
    const path = window.location.pathname || '';
    const isAdminRegionalPage = path.includes('/admin_regional/centers');
    
    if (isAdminRegionalPage) {
        // Load centers when page is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                loadCentersForAdminRegional();
            });
        } else {
            loadCentersForAdminRegional();
        }
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAdminRegionalCenters);
} else {
    initializeAdminRegionalCenters();
}

// Setup filter event listeners
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('searchInput');
    const cityFilter = document.getElementById('cityFilter');
    
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            applyFilters();
        });
    }
    
    if (cityFilter) {
        cityFilter.addEventListener('change', function() {
            applyFilters();
        });
    }
});

/**
 * Load cities for the current regional's department
 */
async function loadCitiesForRegional() {
    try {
        if (!window.currentUserRegional || !window.currentUserRegional.departamentId) {
            console.warn('No regional or department ID available');
            citiesData = [];
            populateCitySelect();
            return;
        }

        const response = await fetch(`/api/v1/departments/${window.currentUserRegional.departamentId}/cities`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            citiesData = await response.json();
            populateCitySelect();
        } else {
            throw new Error('Error al cargar las ciudades');
        }
    } catch (error) {
        console.error('Error loading cities:', error);
        citiesData = [];
        populateCitySelect();
    }
}

/**
 * Populate city select dropdown
 */
function populateCitySelect() {
    const citySelect = document.getElementById('editCenterCity');
    if (!citySelect) return;

    // Clear existing options except the first one
    while (citySelect.options.length > 1) {
        citySelect.remove(1);
    }

    // Add city options
    citiesData.forEach(city => {
        const option = document.createElement('option');
        option.value = city.id;
        option.textContent = city.city;
        citySelect.appendChild(option);
    });
}

/**
 * Show edit center modal
 */
async function showEditCenterModal(centerId) {
    const center = centersData.find(c => c.id === centerId);
    if (!center) {
        showError('Centro no encontrado');
        return;
    }

    currentEditingCenterId = centerId;
    const modal = document.getElementById('editCenterModal');
    if (!modal) {
        showError('Modal de edición no encontrado');
        return;
    }

    // Set form values
    document.getElementById('editCenterId').value = centerId;
    document.getElementById('editCenterName').value = center.name || '';
    document.getElementById('editCenterCode').value = center.codeInstitution || '';

    // Set regional (read-only)
    const regionalInput = document.getElementById('editCenterRegional');
    if (regionalInput && window.currentUserRegional) {
        regionalInput.value = window.currentUserRegional.name || 'N/A';
    }

    // Load cities and set selected city
    await loadCitiesForRegional();
    
    // Set selected city after a short delay to ensure select is populated
    setTimeout(() => {
        const citySelect = document.getElementById('editCenterCity');
        if (citySelect && center.cityId) {
            citySelect.value = center.cityId;
        }
    }, 100);

    // Show modal
    modal.classList.remove('hidden');
}

/**
 * Close edit center modal
 */
function closeEditCenterModal() {
    const modal = document.getElementById('editCenterModal');
    if (modal) {
        modal.classList.add('hidden');
    }
    currentEditingCenterId = null;
    
    // Reset form
    const form = document.getElementById('editCenterForm');
    if (form) {
        form.reset();
    }
}

/**
 * Handle update center form submission
 */
async function handleUpdateCenter(event) {
    event.preventDefault();

    if (!currentEditingCenterId) {
        showError('No se ha seleccionado un centro para editar');
        return;
    }

    const name = document.getElementById('editCenterName').value.trim();
    const code = document.getElementById('editCenterCode').value.trim();
    const cityId = document.getElementById('editCenterCity').value;

    // Validation
    if (!name) {
        showError('El nombre del centro es requerido');
        return;
    }

    if (!code) {
        showError('El código del centro es requerido');
        return;
    }

    if (!cityId) {
        showError('La ciudad es requerida');
        return;
    }

    try {
        const token = localStorage.getItem('jwt');
        if (!token) {
            throw new Error('No authentication token found');
        }

        const response = await fetch(`/api/v1/institutions/${currentEditingCenterId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: name,
                codeInstitution: code,
                regionalId: currentUserRegionalId, // Keep the same regional
                cityId: parseInt(cityId, 10)
            })
        });

        if (response.ok) {
            showSuccess('Centro actualizado exitosamente');
            closeEditCenterModal();
            await loadCentersForAdminRegional();
            // Filters and pagination will be updated by loadCentersForAdminRegional
        } else {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || errorData.detail || 'Error al actualizar el centro');
        }
    } catch (error) {
        console.error('Error updating center:', error);
        showError('Error al actualizar el centro: ' + error.message);
    }
}

// Export functions
window.loadCentersForAdminRegional = loadCentersForAdminRegional;
window.initializeAdminRegionalCenters = initializeAdminRegionalCenters;
window.showEditCenterModal = showEditCenterModal;
window.closeEditCenterModal = closeEditCenterModal;
window.handleUpdateCenter = handleUpdateCenter;
window.changePage = changePage;
window.applyFilters = applyFilters;

