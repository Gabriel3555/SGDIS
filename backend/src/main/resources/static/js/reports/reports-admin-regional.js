// Reports Admin Regional - Specific functionality for ADMIN_REGIONAL role
// This file handles loading and displaying reports for the admin regional's regional

let currentUserRegionalIdForReports = null;
let currentUserRegionalNameForReports = null;

/**
 * Load current user info to get regional ID
 */
async function loadCurrentUserInfoForReports() {
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

            currentUserRegionalIdForReports = userRegionalId;

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
                        currentUserRegionalNameForReports = regional.name;
                        updateReportsWelcomeMessage(regional.name);
                    }
                }
            } catch (error) {
                console.error('Error fetching regional info:', error);
                // Continue even if we can't get the regional name
            }

            return currentUserRegionalIdForReports;
        } else {
            throw new Error('Failed to load user info');
        }
    } catch (error) {
        console.error('Error loading current user info for reports:', error);
        showError('Error al cargar la información del usuario: ' + error.message);
        return null;
    }
}

/**
 * Update welcome message with regional name
 */
function updateReportsWelcomeMessage(regionalName) {
    const welcomeMessage = document.getElementById('reportsWelcomeMessage');
    if (welcomeMessage && regionalName) {
        welcomeMessage.textContent = `Genere y exporte reportes detallados de la regional: ${regionalName}`;
    }
}

/**
 * Initialize reports for admin regional
 */
async function initializeAdminRegionalReports() {
    // Check if we're on admin_regional reports page
    const path = window.location.pathname || '';
    const isAdminRegionalPage = path.includes('/admin_regional/reports');
    
    if (!isAdminRegionalPage) {
        return;
    }

    try {
        // Load current user info to get regional ID
        const regionalId = await loadCurrentUserInfoForReports();
        if (!regionalId) {
            console.error('Could not load regional ID for admin regional');
            return;
        }

        // Override loadRegionals to pre-select the regional
        const originalLoadRegionals = window.loadRegionals;
        window.loadRegionals = async function() {
            // Call original function first
            if (originalLoadRegionals) {
                await originalLoadRegionals();
            }
            
            // Then pre-select and disable the regional dropdown
            const regionalSelect = document.getElementById('regionalSelect');
            if (regionalSelect && currentUserRegionalIdForReports) {
                regionalSelect.value = currentUserRegionalIdForReports;
                regionalSelect.disabled = true;
                regionalSelect.className = regionalSelect.className.replace('bg-white', 'bg-gray-50').replace('cursor-pointer', 'cursor-not-allowed');
                
                // Load institutions for this regional
                if (typeof window.loadInstitutions === 'function') {
                    await window.loadInstitutions(currentUserRegionalIdForReports);
                } else if (typeof loadInstitutions === 'function') {
                    await loadInstitutions(currentUserRegionalIdForReports);
                }
            }
        };

        // Override generateReport to ensure regional filter is always set
        const originalGenerateReport = window.generateReport;
        if (originalGenerateReport) {
            window.generateReport = async function() {
                // Ensure regional is set
                const regionalSelect = document.getElementById('regionalSelect');
                if (regionalSelect && !regionalSelect.value && currentUserRegionalIdForReports) {
                    regionalSelect.value = currentUserRegionalIdForReports;
                }
                
                // Call original function
                return await originalGenerateReport();
            };
        }

        // Initialize date inputs
        setupDateInputsForAdminRegional();

        // Load regionals (which will now pre-select the user's regional)
        if (typeof window.loadRegionals === 'function') {
            await window.loadRegionals();
        }
    } catch (error) {
        console.error('Error initializing admin regional reports:', error);
        showError('Error al inicializar los reportes: ' + error.message);
    }
}

/**
 * Setup date inputs to default values
 */
function setupDateInputsForAdminRegional() {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    
    if (startDateInput) {
        startDateInput.valueAsDate = firstDay;
    }
    if (endDateInput) {
        endDateInput.valueAsDate = lastDay;
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

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAdminRegionalReports);
} else {
    // DOM already loaded, initialize after a short delay to ensure other scripts are loaded
    setTimeout(initializeAdminRegionalReports, 500);
}

// Export functions
window.initializeAdminRegionalReports = initializeAdminRegionalReports;
window.loadCurrentUserInfoForReports = loadCurrentUserInfoForReports;

