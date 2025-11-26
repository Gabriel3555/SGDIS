// Centers Admin Regional - Specific functionality for ADMIN_REGIONAL role
// This file handles loading and displaying centers (institutions) for the admin regional's regional

let centersData = [];
let currentUserRegionalId = null;

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
            renderCenters();
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
 * Render centers in the table
 */
function renderCenters() {
    const container = document.getElementById('centersTableContainer');
    if (!container) return;

    if (centersData.length === 0) {
        container.innerHTML = `
            <div class="text-center py-12 text-gray-500 dark:text-gray-400">
                <i class="fas fa-building text-4xl mb-4"></i>
                <p class="text-lg font-semibold mb-2">No hay centros registrados</p>
                <p class="text-sm">No se encontraron centros en tu regional</p>
            </div>
        `;
        return;
    }

    let html = `
        <div class="overflow-x-auto">
            <table class="w-full">
                <thead>
                    <tr class="border-b border-gray-200 dark:border-gray-700">
                        <th class="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">ID</th>
                        <th class="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Nombre</th>
                        <th class="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Código</th>
                        <th class="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Ciudad</th>
                    </tr>
                </thead>
                <tbody>
    `;

    centersData.forEach(center => {
        html += `
            <tr class="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <td class="py-3 px-4 text-gray-700 dark:text-gray-300">${center.id || '-'}</td>
                <td class="py-3 px-4 text-gray-700 dark:text-gray-300 font-medium">${center.name || '-'}</td>
                <td class="py-3 px-4 text-gray-700 dark:text-gray-300">${center.codeInstitution || '-'}</td>
                <td class="py-3 px-4 text-gray-700 dark:text-gray-300">${center.cityName || center.city?.city || '-'}</td>
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

// Export functions
window.loadCentersForAdminRegional = loadCentersForAdminRegional;
window.initializeAdminRegionalCenters = initializeAdminRegionalCenters;

