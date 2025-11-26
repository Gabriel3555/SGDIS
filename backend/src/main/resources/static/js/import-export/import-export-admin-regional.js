// Import/Export Admin Regional - Specific functionality for ADMIN_REGIONAL role
// This file handles loading and displaying import/export for the admin regional's regional
// Note: This version does NOT have regional dropdowns - it automatically loads institutions from the user's regional

let currentUserRegionalIdForImportExport = null;
let institutionsForImportExport = [];

/**
 * Load current user info to get regional ID
 */
async function loadCurrentUserInfoForImportExport() {
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

            currentUserRegionalIdForImportExport = userRegionalId;

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
                        updateImportExportWelcomeMessage(regional.name);
                    }
                }
            } catch (error) {
                console.error('Error fetching regional info:', error);
                // Continue even if we can't get the regional name
            }

            return currentUserRegionalIdForImportExport;
        } else {
            throw new Error('Failed to load user info');
        }
    } catch (error) {
        console.error('Error loading current user info for import-export:', error);
        showError('Error al cargar la información del usuario: ' + error.message);
        return null;
    }
}

/**
 * Update welcome message with regional name
 */
function updateImportExportWelcomeMessage(regionalName) {
    const welcomeMessage = document.getElementById('importExportWelcomeMessage');
    if (welcomeMessage && regionalName) {
        welcomeMessage.textContent = `Gestione la importación y exportación de items desde archivos Excel de la regional: ${regionalName}`;
    }
}

/**
 * Load institutions for the admin regional's regional
 */
async function loadInstitutionsForAdminRegional() {
    try {
        if (!currentUserRegionalIdForImportExport) {
            const regionalId = await loadCurrentUserInfoForImportExport();
            if (!regionalId) {
                return;
            }
        }

        const token = localStorage.getItem('jwt');
        if (!token) {
            throw new Error('No authentication token found');
        }

        const response = await fetch(`/api/v1/institutions/institutionsByRegionalId/${currentUserRegionalIdForImportExport}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            institutionsForImportExport = await response.json();
            
            // Populate institution dropdowns (both import and export)
            populateInstitutionDropdownsForAdminRegional();
        } else {
            throw new Error('Error al cargar las instituciones');
        }
    } catch (error) {
        console.error('Error loading institutions:', error);
        showError('Error al cargar las instituciones: ' + error.message);
        
        // Show error in dropdowns
        const importSelect = document.getElementById('importInstitutionSelect');
        const exportSelect = document.getElementById('exportInstitutionSelect');
        if (importSelect) {
            importSelect.innerHTML = '<option value="">Error al cargar centros...</option>';
        }
        if (exportSelect) {
            exportSelect.innerHTML = '<option value="">Error al cargar centros...</option>';
        }
    }
}

/**
 * Populate institution dropdowns for admin regional
 */
function populateInstitutionDropdownsForAdminRegional() {
    const importSelect = document.getElementById('importInstitutionSelect');
    const exportSelect = document.getElementById('exportInstitutionSelect');

    if (!importSelect || !exportSelect) {
        console.error('Institution select elements not found');
        return;
    }

    // Clear and populate import dropdown
    importSelect.innerHTML = '<option value="">Seleccionar centro...</option>';
    if (institutionsForImportExport && institutionsForImportExport.length > 0) {
        institutionsForImportExport.forEach(institution => {
            const option = document.createElement('option');
            option.value = institution.id || institution.institutionId;
            option.textContent = institution.name;
            importSelect.appendChild(option);
        });
        importSelect.disabled = false;
        importSelect.classList.remove('bg-gray-50', 'cursor-not-allowed');
        importSelect.classList.add('bg-white', 'dark:bg-gray-800', 'cursor-pointer');
    } else {
        importSelect.innerHTML = '<option value="">No hay centros disponibles</option>';
    }

    // Clear and populate export dropdown
    exportSelect.innerHTML = '<option value="">Seleccionar centro...</option>';
    if (institutionsForImportExport && institutionsForImportExport.length > 0) {
        institutionsForImportExport.forEach(institution => {
            const option = document.createElement('option');
            option.value = institution.id || institution.institutionId;
            option.textContent = institution.name;
            exportSelect.appendChild(option);
        });
        exportSelect.disabled = false;
        exportSelect.classList.remove('bg-gray-50', 'cursor-not-allowed');
        exportSelect.classList.add('bg-white', 'dark:bg-gray-800', 'cursor-pointer');
    } else {
        exportSelect.innerHTML = '<option value="">No hay centros disponibles</option>';
    }
}

/**
 * Initialize import-export for admin regional
 */
async function initializeAdminRegionalImportExport() {
    // Check if we're on admin_regional import-export page
    const path = window.location.pathname || '';
    const isAdminRegionalPage = path.includes('/admin_regional/import-export');
    
    if (!isAdminRegionalPage) {
        return;
    }

    try {
        // Override loadRegionals to do nothing (we don't need regional dropdowns)
        const originalLoadRegionals = window.loadRegionals;
        window.loadRegionals = async function() {
            // Don't load regionals - we'll load institutions directly
            console.log('Admin Regional: Skipping regional loading, loading institutions directly');
        };

        // Override loadInstitutionsForImport to use our regional
        const originalLoadInstitutionsForImport = window.loadInstitutionsForImport;
        window.loadInstitutionsForImport = async function(regionalId) {
            // Ignore regionalId parameter and use our regional
            await loadInstitutionsForAdminRegional();
        };

        // Override loadInstitutionsForExport to use our regional
        const originalLoadInstitutionsForExport = window.loadInstitutionsForExport;
        window.loadInstitutionsForExport = async function(regionalId) {
            // Ignore regionalId parameter and use our regional
            await loadInstitutionsForAdminRegional();
        };

        // Load current user info and institutions
        await loadCurrentUserInfoForImportExport();
        await loadInstitutionsForAdminRegional();

        // Setup event listeners for institution dropdowns
        const importInstitutionSelect = document.getElementById('importInstitutionSelect');
        const exportInstitutionSelect = document.getElementById('exportInstitutionSelect');

        if (importInstitutionSelect) {
            importInstitutionSelect.addEventListener('change', function() {
                const institutionId = this.value;
                if (typeof window.loadInventoriesForImport === 'function') {
                    window.loadInventoriesForImport(institutionId);
                }
                if (typeof window.resetImportDropdowns === 'function') {
                    window.resetImportDropdowns(['inventory']);
                }
                if (typeof window.updateImportButtonState === 'function') {
                    window.updateImportButtonState();
                }
            });
        }

        if (exportInstitutionSelect) {
            exportInstitutionSelect.addEventListener('change', function() {
                const institutionId = this.value;
                if (typeof window.loadInventoriesForExport === 'function') {
                    window.loadInventoriesForExport(institutionId);
                }
                if (typeof window.resetExportDropdowns === 'function') {
                    window.resetExportDropdowns(['inventory']);
                }
                if (typeof window.updateExportButtonState === 'function') {
                    window.updateExportButtonState();
                }
            });
        }

    } catch (error) {
        console.error('Error initializing admin regional import-export:', error);
        showError('Error al inicializar importar/exportar: ' + error.message);
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
    document.addEventListener('DOMContentLoaded', initializeAdminRegionalImportExport);
} else {
    // DOM already loaded, initialize after a short delay to ensure other scripts are loaded
    setTimeout(initializeAdminRegionalImportExport, 500);
}

// Export functions
window.initializeAdminRegionalImportExport = initializeAdminRegionalImportExport;
window.loadInstitutionsForAdminRegional = loadInstitutionsForAdminRegional;

