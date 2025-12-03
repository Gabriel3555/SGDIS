// Admin Institution Import/Export functionality
// Uses user's institution from token - no institution selector needed

let userInstitutionId = null;
let adminInstitutionInventories = [];

// Check if we're on admin_institution import-export page
const path = window.location.pathname || '';
const isAdminInstitutionPage = path.includes('/admin_institution/import-export');

// Override functions immediately to prevent errors from base script
if (isAdminInstitutionPage) {
    // Prevent base script from running on this page
    const originalDOMContentLoaded = document.addEventListener;
    
    // Override loadRegionals to do nothing
    window.loadRegionals = async function() {
        console.log('Admin Institution: Skipping regional loading');
        return;
    };
    
    // Override populateRegionalDropdowns to do nothing
    window.populateRegionalDropdowns = function() {
        console.log('Admin Institution: Skipping regional dropdown population');
        return;
    };
    
    // Override loadInstitutionsForImport to do nothing
    window.loadInstitutionsForImport = async function(regionalId) {
        console.log('Admin Institution: Skipping institution loading for import');
        return;
    };
    
    // Override loadInstitutionsForExport to do nothing
    window.loadInstitutionsForExport = async function(regionalId) {
        console.log('Admin Institution: Skipping institution loading for export');
        return;
    };
    
    // Override setupModeToggle to prevent errors
    window.setupModeToggle = function() {
        const importModeBtn = document.getElementById('importModeBtn');
        const exportModeBtn = document.getElementById('exportModeBtn');
        const importSection = document.getElementById('importSection');
        const exportSection = document.getElementById('exportSection');

        if (!importModeBtn || !exportModeBtn || !importSection || !exportSection) {
            console.log('Admin Institution: Mode toggle elements not found, skipping');
            return;
        }

        importModeBtn.addEventListener('click', function() {
            importModeBtn.classList.add('active');
            exportModeBtn.classList.remove('active');
            importSection.classList.remove('hidden');
            exportSection.classList.add('hidden');
            if (typeof window.closePreview === 'function') {
                window.closePreview();
            }
        });

        exportModeBtn.addEventListener('click', function() {
            exportModeBtn.classList.add('active');
            importModeBtn.classList.remove('active');
            exportSection.classList.remove('hidden');
            importSection.classList.add('hidden');
            if (typeof window.closePreview === 'function') {
                window.closePreview();
            }
            const inventoryId = document.getElementById('exportInventorySelect').value;
            if (inventoryId && typeof window.loadExportPreview === 'function') {
                window.loadExportPreview(inventoryId);
            } else if (typeof window.hideExportPreview === 'function') {
                window.hideExportPreview();
            }
        });
    };
    
    // Override setupEventListeners to skip institution selectors
    window.setupEventListeners = function() {
        console.log('Admin Institution: Setting up event listeners');
        
        // Only setup listeners for elements that exist
        // Import inventory dropdown
        const importInventorySelect = document.getElementById('importInventorySelect');
        if (importInventorySelect) {
            importInventorySelect.addEventListener('change', function() {
                console.log('Import inventory changed:', this.value);
                if (typeof window.updateImportButtonState === 'function') {
                    window.updateImportButtonState();
                }
            });
        }

        // Export inventory dropdown
        const exportInventorySelect = document.getElementById('exportInventorySelect');
        if (exportInventorySelect) {
            exportInventorySelect.addEventListener('change', function() {
                console.log('Export inventory changed:', this.value);
                if (typeof window.updateExportButtonState === 'function') {
                    window.updateExportButtonState();
                }
                const inventoryId = this.value;
                if (inventoryId && typeof window.loadExportPreview === 'function') {
                    window.loadExportPreview(inventoryId);
                } else if (typeof window.hideExportPreview === 'function') {
                    window.hideExportPreview();
                }
            });
        }

        // File input
        const importFileInput = document.getElementById('importFileInput');
        if (importFileInput) {
            console.log('Setting up file input listener');
            importFileInput.addEventListener('change', function(e) {
                console.log('File selected:', e.target.files[0]?.name);
                const file = e.target.files[0];
                if (file && typeof window.handleFileSelection === 'function') {
                    window.handleFileSelection(file);
                } else {
                    console.error('handleFileSelection function not found or no file selected');
                }
            });
        } else {
            console.error('importFileInput element not found');
        }

        // Drag and drop support
        const fileUploadArea = document.getElementById('fileUploadArea');
        if (fileUploadArea) {
            function preventDefaults(e) {
                e.preventDefault();
                e.stopPropagation();
            }

            function highlight(e) {
                fileUploadArea.classList.add('drag-over');
            }

            function unhighlight(e) {
                fileUploadArea.classList.remove('drag-over');
            }

            function handleDrop(e) {
                const dt = e.dataTransfer;
                const files = dt.files;
                if (files.length > 0) {
                    const file = files[0];
                    // Check if it's an Excel file
                    if (file.name.endsWith('.xls') || file.name.endsWith('.xlsx')) {
                        // Set the file input
                        const dataTransfer = new DataTransfer();
                        dataTransfer.items.add(file);
                        const currentFileInput = document.getElementById('importFileInput');
                        if (currentFileInput) {
                            currentFileInput.files = dataTransfer.files;
                            // Trigger change event
                            const changeEvent = new Event('change', { bubbles: true });
                            currentFileInput.dispatchEvent(changeEvent);
                        }
                    } else {
                        if (typeof window.showErrorToastLocal === 'function') {
                            window.showErrorToastLocal('Error', 'Por favor seleccione un archivo Excel (.xls o .xlsx)');
                        } else if (window.showInventoryErrorToast) {
                            window.showInventoryErrorToast('Error', 'Por favor seleccione un archivo Excel (.xls o .xlsx)');
                        } else {
                            alert('Error: Por favor seleccione un archivo Excel (.xls o .xlsx)');
                        }
                    }
                }
                unhighlight(e);
            }

            // Prevent default drag behaviors
            ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
                fileUploadArea.addEventListener(eventName, preventDefaults, false);
                document.body.addEventListener(eventName, preventDefaults, false);
            });

            // Highlight drop area when item is dragged over it
            ['dragenter', 'dragover'].forEach(eventName => {
                fileUploadArea.addEventListener(eventName, highlight, false);
            });

            ['dragleave', 'drop'].forEach(eventName => {
                fileUploadArea.addEventListener(eventName, unhighlight, false);
            });

            // Handle dropped files
            fileUploadArea.addEventListener('drop', handleDrop, false);
        }

        // Import button
        const importButton = document.getElementById('importButton');
        if (importButton && typeof window.handleImport === 'function') {
            importButton.addEventListener('click', window.handleImport);
        }

        // Export button
        const exportButton = document.getElementById('exportButton');
        if (exportButton && typeof window.handleExport === 'function') {
            exportButton.addEventListener('click', window.handleExport);
        }
    };
}

/**
 * Initialize import-export for admin institution
 */
async function initializeAdminInstitutionImportExport() {
    if (!isAdminInstitutionPage) {
        return;
    }

    try {

        // Load current user info to get institution
        await loadUserInstitution();
        
        // Load inventories for user's institution
        if (userInstitutionId) {
            await loadInventoriesForAdminInstitution();
        } else {
            console.error('No institution ID found for user');
            if (typeof window.showErrorToastLocal === 'function') {
                window.showErrorToastLocal('Error', 'No se pudo obtener la institución del usuario');
            } else if (window.showInventoryErrorToast) {
                window.showInventoryErrorToast('Error', 'No se pudo obtener la institución del usuario');
            } else {
                alert('Error: No se pudo obtener la institución del usuario');
            }
            populateInventoryDropdowns();
        }

        // Setup mode toggle (Import/Export switch)
        setupModeToggleForAdminInstitution();

        // Setup event listeners for file input and buttons
        setupEventListeners();

    } catch (error) {
        console.error('Error initializing admin institution import-export:', error);
        if (typeof window.showErrorToastLocal === 'function') {
            window.showErrorToastLocal('Error', 'Error al inicializar importar/exportar: ' + error.message);
        } else if (window.showInventoryErrorToast) {
            window.showInventoryErrorToast('Error', 'Error al inicializar importar/exportar: ' + error.message);
        } else {
            alert('Error: Error al inicializar importar/exportar: ' + error.message);
        }
    }
}

/**
 * Load user's institution from token
 */
async function loadUserInstitution() {
    try {
        const token = localStorage.getItem('jwt');
        if (!token) {
            throw new Error('No authentication token found');
        }

        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        // Get current user info
        const userResponse = await fetch('/api/v1/users/me', {
            method: 'GET',
            headers: headers
        });

        if (!userResponse.ok) {
            throw new Error('Failed to load user info');
        }

        const userData = await userResponse.json();
        const institutionName = userData.institution;

        if (!institutionName) {
            throw new Error('Usuario no tiene una institución asignada');
        }

        // Fetch all institutions to find the user's institution
        const institutionsResponse = await fetch('/api/v1/institutions', {
            method: 'GET',
            headers: headers
        });

        if (!institutionsResponse.ok) {
            throw new Error('Error al cargar las instituciones');
        }

        const institutions = await institutionsResponse.json();
        const userInstitution = institutions.find(inst => 
            inst.name === institutionName || 
            inst.nombre === institutionName
        );

        if (!userInstitution) {
            throw new Error('Institución del usuario no encontrada: ' + institutionName);
        }

        // Get institution ID
        userInstitutionId = userInstitution.institutionId || userInstitution.id;

        if (!userInstitutionId) {
            throw new Error('La institución no tiene un ID válido');
        }

        console.log('User institution ID:', userInstitutionId);
    } catch (error) {
        console.error('Error loading user institution:', error);
        throw error;
    }
}

/**
 * Load inventories for user's institution
 */
async function loadInventoriesForAdminInstitution() {
    if (!userInstitutionId) {
        console.error('No institution ID available');
        populateInventoryDropdowns();
        return;
    }

    try {
        const token = localStorage.getItem('jwt');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        // Fetch inventories for the user's institution
        const response = await fetch(`/api/v1/inventory/institutionAdminInventories/${userInstitutionId}?page=0&size=1000`, {
            method: 'GET',
            headers: headers
        });

        if (response.ok) {
            const data = await response.json();
            adminInstitutionInventories = Array.isArray(data) ? data : (data.content || []);
            populateInventoryDropdowns();
        } else {
            console.error('Error loading inventories:', response.status);
            if (typeof window.showErrorToastLocal === 'function') {
                window.showErrorToastLocal('Error', 'No se pudieron cargar los inventarios');
            } else if (window.showInventoryErrorToast) {
                window.showInventoryErrorToast('Error', 'No se pudieron cargar los inventarios');
            } else {
                alert('Error: No se pudieron cargar los inventarios');
            }
            populateInventoryDropdowns();
        }
    } catch (error) {
        console.error('Error loading inventories:', error);
        if (typeof window.showErrorToastLocal === 'function') {
            window.showErrorToastLocal('Error', 'Error al cargar los inventarios');
        } else if (window.showInventoryErrorToast) {
            window.showInventoryErrorToast('Error', 'Error al cargar los inventarios');
        } else {
            alert('Error: Error al cargar los inventarios');
        }
        populateInventoryDropdowns();
    }
}

/**
 * Populate inventory dropdowns
 */
function populateInventoryDropdowns() {
    const importSelect = document.getElementById('importInventorySelect');
    const exportSelect = document.getElementById('exportInventorySelect');

    if (!importSelect || !exportSelect) {
        console.error('Inventory select elements not found');
        return;
    }

    // Clear existing options
    importSelect.innerHTML = '<option value="">Seleccionar inventario...</option>';
    exportSelect.innerHTML = '<option value="">Seleccionar inventario...</option>';

    if (adminInstitutionInventories.length === 0) {
        importSelect.innerHTML = '<option value="">No hay inventarios disponibles</option>';
        exportSelect.innerHTML = '<option value="">No hay inventarios disponibles</option>';
        importSelect.disabled = true;
        exportSelect.disabled = true;
        return;
    }

    // Populate dropdowns
    adminInstitutionInventories.forEach(inventory => {
        const importOption = document.createElement('option');
        importOption.value = inventory.id || inventory.inventoryId;
        importOption.textContent = inventory.name;
        importSelect.appendChild(importOption);

        const exportOption = document.createElement('option');
        exportOption.value = inventory.id || inventory.inventoryId;
        exportOption.textContent = inventory.name;
        exportSelect.appendChild(exportOption);
    });

    // Enable dropdowns
    importSelect.disabled = false;
    exportSelect.disabled = false;
    importSelect.classList.remove('bg-gray-50', 'cursor-not-allowed');
    importSelect.classList.add('bg-white', 'dark:bg-gray-800', 'cursor-pointer');
    exportSelect.classList.remove('bg-gray-50', 'cursor-not-allowed');
    exportSelect.classList.add('bg-white', 'dark:bg-gray-800', 'cursor-pointer');
}

/**
 * Setup mode toggle (Import/Export switch) for admin institution
 */
function setupModeToggleForAdminInstitution() {
    const importModeBtn = document.getElementById('importModeBtn');
    const exportModeBtn = document.getElementById('exportModeBtn');
    const importSection = document.getElementById('importSection');
    const exportSection = document.getElementById('exportSection');

    if (!importModeBtn || !exportModeBtn || !importSection || !exportSection) {
        console.error('Mode toggle elements not found');
        return;
    }

    importModeBtn.addEventListener('click', function() {
        importModeBtn.classList.add('active');
        exportModeBtn.classList.remove('active');
        importSection.classList.remove('hidden');
        exportSection.classList.add('hidden');
        // Close preview when switching modes
        if (typeof window.closePreview === 'function') {
            window.closePreview();
        }
    });

    exportModeBtn.addEventListener('click', function() {
        exportModeBtn.classList.add('active');
        importModeBtn.classList.remove('active');
        exportSection.classList.remove('hidden');
        importSection.classList.add('hidden');
        // Close import preview when switching modes
        if (typeof window.closePreview === 'function') {
            window.closePreview();
        }
        // Check if there's a selected inventory and show preview
        const inventoryId = document.getElementById('exportInventorySelect').value;
        if (inventoryId && typeof window.loadExportPreview === 'function') {
            window.loadExportPreview(inventoryId);
        } else if (typeof window.hideExportPreview === 'function') {
            window.hideExportPreview();
        }
    });
}

// Toast functions - use the function from base script or global functions
// Don't redefine showErrorToastLocal to avoid conflicts

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAdminInstitutionImportExport);
} else {
    // DOM is already ready
    initializeAdminInstitutionImportExport();
}

