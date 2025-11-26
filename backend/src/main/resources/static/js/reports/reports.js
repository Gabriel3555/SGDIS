// Reports functionality

let regionals = [];
let institutions = {};
let inventories = {};
let currentReportData = [];
let currentReportType = 'items';
let currentReportFilters = {};

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('Reports page DOMContentLoaded - Initializing...');
    if (typeof window.loadRegionals === 'function') {
        window.loadRegionals();
    }
    setupEventListeners();
    setupDateInputs();
});

// Also try if DOM is already loaded (for dynamic navigation)
if (document.readyState !== 'loading') {
    console.log('Reports page - DOM already loaded, initializing...');
    setTimeout(function() {
        if (typeof window.loadRegionals === 'function') {
            window.loadRegionals();
        }
        setupEventListeners();
        setupDateInputs();
    }, 200);
}

// Setup date inputs to default values
function setupDateInputs() {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    document.getElementById('startDate').valueAsDate = firstDay;
    document.getElementById('endDate').valueAsDate = lastDay;
}

// Setup event listeners
function setupEventListeners() {
    // Dropdowns
    const regionalSelect = document.getElementById('regionalSelect');
    if (!regionalSelect) {
        console.error('regionalSelect not found in setupEventListeners');
        return;
    }
    
    regionalSelect.addEventListener('change', function() {
        const regionalId = this.value;
        loadInstitutions(regionalId);
        resetDropdowns(['institution', 'inventory']);
    });

    const institutionSelect = document.getElementById('institutionSelect');
    if (institutionSelect) {
        institutionSelect.addEventListener('change', function() {
            const institutionId = this.value;
            loadInventories(institutionId);
            resetDropdowns(['inventory']);
        });
    }

    // Generate report button
    const generateBtn = document.getElementById('generateReportBtn');
    if (generateBtn) generateBtn.addEventListener('click', generateReport);

    // Clear filters button
    const clearBtn = document.getElementById('clearFiltersBtn');
    if (clearBtn) clearBtn.addEventListener('click', clearFilters);

    // Export buttons
    const exportPdfBtn = document.getElementById('exportPdfBtn');
    if (exportPdfBtn) exportPdfBtn.addEventListener('click', exportToPDF);
    
    const exportExcelBtn = document.getElementById('exportExcelBtn');
    if (exportExcelBtn) exportExcelBtn.addEventListener('click', exportToExcel);
}

// Load all regionals - make it globally accessible
window.loadRegionals = async function loadRegionals() {
    console.log('=== loadRegionals() called ===');
    
    // Verify element exists
    const selectElement = document.getElementById('regionalSelect');
    if (!selectElement) {
        console.error('ERROR: regionalSelect element not found!');
        setTimeout(window.loadRegionals, 500);
        return;
    }
    console.log('✓ regionalSelect element found');
    
    try {
        const token = localStorage.getItem('jwt');
        if (!token) {
            console.error('ERROR: No authentication token found');
            alert('Error: No se encontró el token de autenticación. Por favor inicia sesión nuevamente.');
            return;
        }
        console.log('✓ Authentication token found');

        const headers = { 'Content-Type': 'application/json' };
        headers['Authorization'] = `Bearer ${token}`;

        console.log('Fetching regionales from /api/v1/regional...');
        const response = await fetch('/api/v1/regional', {
            method: 'GET',
            headers: headers
        });
        
        console.log('Response status:', response.status, response.statusText);

        if (response.ok) {
            const data = await response.json();
            console.log('Response data:', data);
            
            if (!data || !Array.isArray(data)) {
                console.error('ERROR: Invalid response format:', data);
                alert('Error: Formato de respuesta inválido al cargar regionales');
                return;
            }
            
            regionals = data;
            console.log(`✓ Loaded ${regionals.length} regionals:`, regionals);
            
            populateRegionalDropdown();
            
            if (regionals.length === 0) {
                console.warn('WARNING: No regionals found');
                alert('Información: No se encontraron regionales en el sistema');
            } else {
                console.log('✓ Regionales loaded successfully');
            }
        } else {
            const errorText = await response.text().catch(() => 'Error desconocido');
            console.error('ERROR loading regionals:', response.status, errorText);
            
            let errorMsg = `No se pudieron cargar las regionales (${response.status})`;
            if (response.status === 401) {
                errorMsg = 'Sesión expirada. Por favor inicia sesión nuevamente.';
            } else if (response.status === 403) {
                errorMsg = 'No tienes permisos para ver las regionales';
            }
            alert('Error: ' + errorMsg);
        }
    } catch (error) {
        console.error('EXCEPTION loading regionals:', error);
        alert('Error de conexión al cargar regionales: ' + error.message);
    }
}

// Populate regional dropdown
function populateRegionalDropdown() {
    console.log('=== populateRegionalDropdown() called ===');
    
    const select = document.getElementById('regionalSelect');
    
    if (!select) {
        console.error('ERROR: Regional select element not found in populateRegionalDropdown');
        return;
    }
    
    console.log('✓ Clearing and populating dropdown...');
    select.innerHTML = '<option value="">Todas las regionales</option>';
    
    if (!regionals || regionals.length === 0) {
        console.warn('WARNING: No regionals to populate');
        return;
    }
    
    console.log(`Populating ${regionals.length} regionals...`);
    let added = 0;
    regionals.forEach((regional, index) => {
        if (!regional || !regional.id) {
            console.warn(`WARNING: Invalid regional data at index ${index}:`, regional);
            return;
        }
        
        const option = document.createElement('option');
        option.value = regional.id;
        option.textContent = regional.name || regional.nombre || 'Sin nombre';
        select.appendChild(option);
        added++;
        console.log(`  ✓ Added regional: ${option.textContent} (ID: ${option.value})`);
    });
    
    console.log(`✓ Successfully populated ${added} regionals in dropdown`);
    console.log('Dropdown now has', select.options.length, 'options');
}

// Load institutions for a regional
async function loadInstitutions(regionalId) {
    if (!regionalId) {
        document.getElementById('institutionSelect').disabled = true;
        document.getElementById('institutionSelect').innerHTML = '<option value="">Primero seleccione una regional...</option>';
        return;
    }

    try {
        const token = localStorage.getItem('jwt');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(`/api/v1/institutions/institutionsByRegionalId/${regionalId}`, {
            method: 'GET',
            headers: headers
        });

        if (response.ok) {
            const institutionsList = await response.json();
            if (!institutionsList || institutionsList.length === 0) {
                // No institutions found for this regional - show empty dropdown
                populateInstitutionDropdown([]);
                showReportErrorToast('Información', 'No se encontraron instituciones para esta regional');
            } else {
                institutions[regionalId] = institutionsList;
                populateInstitutionDropdown(institutionsList);
            }
        } else {
            const errorText = await response.text().catch(() => 'Error desconocido');
            console.error('Error loading institutions:', response.status, errorText);
            showReportErrorToast('Error', `No se pudieron cargar las instituciones (${response.status})`);
            // Reset institution dropdown
            document.getElementById('institutionSelect').disabled = true;
            document.getElementById('institutionSelect').innerHTML = '<option value="">Error al cargar instituciones...</option>';
        }
    } catch (error) {
        console.error('Error loading institutions:', error);
        showReportErrorToast('Error', 'Error de conexión al cargar instituciones');
    }
}

// Populate institution dropdown
function populateInstitutionDropdown(institutionsList) {
    const select = document.getElementById('institutionSelect');
    
    if (!institutionsList || institutionsList.length === 0) {
        select.disabled = false;
        select.className = select.className.replace('bg-gray-50', 'bg-white').replace('cursor-not-allowed', 'cursor-pointer');
        select.innerHTML = '<option value="">No hay instituciones disponibles</option>';
        return;
    }
    
    select.disabled = false;
    select.className = select.className.replace('bg-gray-50', 'bg-white').replace('cursor-not-allowed', 'cursor-pointer');
    select.innerHTML = '<option value="">Todos los centros</option>';
    
    institutionsList.forEach(institution => {
        const option = document.createElement('option');
        option.value = institution.id;
        option.textContent = institution.name || institution.nombre || 'Sin nombre';
        select.appendChild(option);
    });
}

// Load inventories for an institution
async function loadInventories(institutionId) {
    if (!institutionId) {
        document.getElementById('inventorySelect').disabled = true;
        document.getElementById('inventorySelect').innerHTML = '<option value="">Primero seleccione un centro...</option>';
        return;
    }

    try {
        const token = localStorage.getItem('jwt');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(`/api/v1/inventory/institutionAdminInventories/${institutionId}?page=0&size=1000`, {
            method: 'GET',
            headers: headers
        });

        if (response.ok) {
            const data = await response.json();
            const inventoriesList = data.content || [];
            inventories[institutionId] = inventoriesList;
            populateInventoryDropdown(inventoriesList);
        } else {
            const errorText = await response.text().catch(() => 'Error desconocido');
            console.error('Error loading inventories:', response.status, errorText);
            showReportErrorToast('Error', `No se pudieron cargar los inventarios (${response.status})`);
            // Reset inventory dropdown
            document.getElementById('inventorySelect').disabled = true;
            document.getElementById('inventorySelect').innerHTML = '<option value="">Error al cargar inventarios...</option>';
        }
    } catch (error) {
        console.error('Error loading inventories:', error);
        showReportErrorToast('Error', 'Error de conexión al cargar inventarios');
    }
}

// Populate inventory dropdown
function populateInventoryDropdown(inventoriesList) {
    const select = document.getElementById('inventorySelect');
    
    if (!inventoriesList || inventoriesList.length === 0) {
        select.disabled = false;
        select.className = select.className.replace('bg-gray-50', 'bg-white').replace('cursor-not-allowed', 'cursor-pointer');
        select.innerHTML = '<option value="">No hay inventarios disponibles</option>';
        return;
    }
    
    select.disabled = false;
    select.className = select.className.replace('bg-gray-50', 'bg-white').replace('cursor-not-allowed', 'cursor-pointer');
    select.innerHTML = '<option value="">Todos los inventarios del centro</option>';
    
    inventoriesList.forEach(inventory => {
        const option = document.createElement('option');
        option.value = inventory.id;
        option.textContent = inventory.name || 'Sin nombre';
        select.appendChild(option);
    });
}

// Reset dropdowns
function resetDropdowns(types) {
    if (types.includes('institution')) {
        document.getElementById('institutionSelect').disabled = true;
        document.getElementById('institutionSelect').className = document.getElementById('institutionSelect').className.replace('bg-white', 'bg-gray-50').replace('cursor-pointer', 'cursor-not-allowed');
        document.getElementById('institutionSelect').innerHTML = '<option value="">Primero seleccione una regional...</option>';
    }
    if (types.includes('inventory')) {
        document.getElementById('inventorySelect').disabled = true;
        document.getElementById('inventorySelect').className = document.getElementById('inventorySelect').className.replace('bg-white', 'bg-gray-50').replace('cursor-pointer', 'cursor-not-allowed');
        document.getElementById('inventorySelect').innerHTML = '<option value="">Primero seleccione un centro...</option>';
    }
}

// Clear all filters
function clearFilters() {
    document.getElementById('reportTypeSelect').value = 'items';
    document.getElementById('regionalSelect').value = '';
    document.getElementById('institutionSelect').value = '';
    document.getElementById('inventorySelect').value = '';
    
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    document.getElementById('startDate').valueAsDate = firstDay;
    document.getElementById('endDate').valueAsDate = lastDay;
    
    resetDropdowns(['institution', 'inventory']);
    hideReportResults();
}

// Hide report results
function hideReportResults() {
    document.getElementById('reportResultsSection').classList.add('hidden');
    document.getElementById('reportEmptyState').classList.remove('hidden');
    document.getElementById('reportLoadingState').classList.add('hidden');
    const chartsContainer = document.getElementById('chartsContainer');
    if (chartsContainer) {
        chartsContainer.classList.add('hidden');
    }
    // Destroy charts when hiding results
    if (chartInstances.mostMoved) {
        chartInstances.mostMoved.destroy();
        chartInstances.mostMoved = null;
    }
    if (chartInstances.mostExpensive) {
        chartInstances.mostExpensive.destroy();
        chartInstances.mostExpensive = null;
    }
    if (chartInstances.mostVerified) {
        chartInstances.mostVerified.destroy();
        chartInstances.mostVerified = null;
    }
}

// Generate report
async function generateReport() {
    const reportType = document.getElementById('reportTypeSelect').value;
    const regionalId = document.getElementById('regionalSelect').value;
    const institutionId = document.getElementById('institutionSelect').value;
    const inventoryId = document.getElementById('inventorySelect').value;
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;

    // Show loading state
    document.getElementById('reportLoadingState').classList.remove('hidden');
    document.getElementById('reportResultsSection').classList.add('hidden');
    document.getElementById('reportEmptyState').classList.add('hidden');

    currentReportType = reportType;
    currentReportFilters = {
        regionalId,
        institutionId,
        inventoryId,
        startDate,
        endDate
    };

    try {
        let data = [];
        
        switch (reportType) {
            case 'items':
                data = await fetchItemsReport(regionalId, institutionId, inventoryId, startDate, endDate);
                break;
            case 'users':
                data = await fetchUsersReport(regionalId, institutionId, startDate, endDate);
                break;
            case 'loans':
                data = await fetchLoansReport(regionalId, institutionId, inventoryId, startDate, endDate);
                break;
            case 'verifications':
                data = await fetchVerificationsReport(regionalId, institutionId, inventoryId, startDate, endDate);
                break;
            case 'inventory':
                data = await fetchInventoryReport(regionalId, institutionId, inventoryId, startDate, endDate);
                break;
            case 'general':
                data = await fetchGeneralReport(regionalId, institutionId, startDate, endDate);
                break;
        }

        currentReportData = data || [];
        displayReport(data || []);
    } catch (error) {
        console.error('Error generating report:', error);
        showReportErrorToast('Error', 'Error al generar el reporte: ' + error.message);
        document.getElementById('reportLoadingState').classList.add('hidden');
        document.getElementById('reportEmptyState').classList.remove('hidden');
    }
}

// Fetch items report
async function fetchItemsReport(regionalId, institutionId, inventoryId, startDate, endDate) {
    const token = localStorage.getItem('jwt');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    let endpoint = '/api/v1/items?page=0&size=10000';
    const params = new URLSearchParams();

    if (inventoryId) {
        // Specific inventory selected
        endpoint = `/api/v1/items/inventory/${inventoryId}?page=0&size=10000`;
    } else if (institutionId) {
        // No specific inventory selected - get all inventories for this institution
        const inventoriesResponse = await fetch(`/api/v1/inventory/institutionAdminInventories/${institutionId}?page=0&size=1000`, {
            method: 'GET',
            headers: headers
        });
        if (inventoriesResponse.ok) {
            const inventoriesData = await inventoriesResponse.json();
            const inventoriesList = inventoriesData.content || [];
            
            if (inventoriesList.length === 0) {
                return [];
            }
            
            // Fetch items from all inventories of the institution
            const allItems = [];
            for (const inv of inventoriesList) {
                const itemsResponse = await fetch(`/api/v1/items/inventory/${inv.id}?page=0&size=10000`, {
                    method: 'GET',
                    headers: headers
                });
                if (itemsResponse.ok) {
                    const itemsData = await itemsResponse.json();
                    allItems.push(...(itemsData.content || []));
                }
            }
            return allItems;
        } else {
            throw new Error('Error al cargar inventarios de la institución');
        }
    } else if (regionalId) {
        // Similar logic for regional
        const response = await fetch(`/api/v1/inventory/regionalAdminInventories/${regionalId}?page=0&size=1000`, {
            method: 'GET',
            headers: headers
        });
        if (response.ok) {
            const data = await response.json();
            const inventoriesList = data.content || [];
            const allItems = [];
            for (const inv of inventoriesList) {
                const itemsResponse = await fetch(`/api/v1/items/inventory/${inv.id}?page=0&size=10000`, {
                    method: 'GET',
                    headers: headers
                });
                if (itemsResponse.ok) {
                    const itemsData = await itemsResponse.json();
                    allItems.push(...(itemsData.content || []));
                }
            }
            return allItems;
        }
    }

    const response = await fetch(endpoint, {
        method: 'GET',
        headers: headers
    });

    if (response.ok) {
        const data = await response.json();
        let items = data.content || data || [];
        
        // Filter by date if provided
        if (startDate || endDate) {
            items = items.filter(item => {
                const itemDate = item.createdAt || item.registrationDate;
                if (!itemDate) return false;
                const date = new Date(itemDate);
                if (startDate && date < new Date(startDate)) return false;
                if (endDate && date > new Date(endDate)) return false;
                return true;
            });
        }
        
        return items;
    } else {
        throw new Error('Error al cargar items');
    }
}

// Fetch users report
async function fetchUsersReport(regionalId, institutionId, startDate, endDate) {
    const token = localStorage.getItem('jwt');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    let endpoint = '/api/v1/users?page=0&size=10000';
    const response = await fetch(endpoint, {
        method: 'GET',
        headers: headers
    });

    if (response.ok) {
        const data = await response.json();
        let users = data.content || data || [];
        
        // Filter by institution if provided
        if (institutionId) {
            users = users.filter(user => user.institutionId === parseInt(institutionId));
        }
        
        // Filter by date if provided
        if (startDate || endDate) {
            users = users.filter(user => {
                const userDate = user.createdAt || user.registrationDate;
                if (!userDate) return false;
                const date = new Date(userDate);
                if (startDate && date < new Date(startDate)) return false;
                if (endDate && date > new Date(endDate)) return false;
                return true;
            });
        }
        
        return users;
    } else {
        throw new Error('Error al cargar usuarios');
    }
}

// Fetch loans report
async function fetchLoansReport(regionalId, institutionId, inventoryId, startDate, endDate) {
    // If no specific inventory, get loans from all inventories of the institution
    const token = localStorage.getItem('jwt');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    let endpoint = '/api/v1/loans?page=0&size=10000';
    const response = await fetch(endpoint, {
        method: 'GET',
        headers: headers
    });

    if (response.ok) {
        const data = await response.json();
        let loans = data.content || data || [];
        
        // Filter by date if provided
        if (startDate || endDate) {
            loans = loans.filter(loan => {
                const loanDate = loan.createdAt || loan.loanDate;
                if (!loanDate) return false;
                const date = new Date(loanDate);
                if (startDate && date < new Date(startDate)) return false;
                if (endDate && date > new Date(endDate)) return false;
                return true;
            });
        }
        
        return loans;
    } else {
        throw new Error('Error al cargar préstamos');
    }
}

// Fetch verifications report
async function fetchVerificationsReport(regionalId, institutionId, inventoryId, startDate, endDate) {
    const token = localStorage.getItem('jwt');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    let endpoint = '/api/v1/verification?page=0&size=10000';
    const response = await fetch(endpoint, {
        method: 'GET',
        headers: headers
    });

    if (response.ok) {
        const data = await response.json();
        let verifications = data.content || data || [];
        
        // Filter by date if provided
        if (startDate || endDate) {
            verifications = verifications.filter(verification => {
                const verDate = verification.createdAt || verification.verificationDate;
                if (!verDate) return false;
                const date = new Date(verDate);
                if (startDate && date < new Date(startDate)) return false;
                if (endDate && date > new Date(endDate)) return false;
                return true;
            });
        }
        
        return verifications;
    } else {
        throw new Error('Error al cargar verificaciones');
    }
}

// Fetch inventory report
async function fetchInventoryReport(regionalId, institutionId, inventoryId, startDate, endDate) {
    const token = localStorage.getItem('jwt');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    if (inventoryId) {
        // Specific inventory - get single inventory and return as array
        const response = await fetch(`/api/v1/inventory/${inventoryId}`, {
            method: 'GET',
            headers: headers
        });
        
        if (response.ok) {
            const inventory = await response.json();
            if (!inventory) return [];
            
            // Filter by date if provided
            const invDate = inventory.createdAt || inventory.registrationDate;
            if (startDate || endDate) {
                if (!invDate) return [];
                const date = new Date(invDate);
                if (startDate && date < new Date(startDate)) return [];
                if (endDate && date > new Date(endDate)) return [];
            }
            
            return [inventory];
        } else {
            throw new Error('Error al cargar el inventario');
        }
    }
    
    // No specific inventory - get all inventories based on filters
    let endpoint = '/api/v1/inventory?page=0&size=10000';
    
    if (institutionId) {
        // All inventories from institution
        endpoint = `/api/v1/inventory/institutionAdminInventories/${institutionId}?page=0&size=10000`;
    } else if (regionalId) {
        endpoint = `/api/v1/inventory/regionalAdminInventories/${regionalId}?page=0&size=10000`;
    }

    const response = await fetch(endpoint, {
        method: 'GET',
        headers: headers
    });

    if (response.ok) {
        const data = await response.json();
        let inventories = data.content || data || [];
        
        // Filter by date if provided
        if (startDate || endDate) {
            inventories = inventories.filter(inv => {
                const invDate = inv.createdAt || inv.registrationDate;
                if (!invDate) return false;
                const date = new Date(invDate);
                if (startDate && date < new Date(startDate)) return false;
                if (endDate && date > new Date(endDate)) return false;
                return true;
            });
        }
        
        return inventories;
    } else {
        throw new Error('Error al cargar inventarios');
    }
}

// Fetch transfers report
async function fetchTransfersReport(regionalId, institutionId, inventoryId, startDate, endDate) {
    const token = localStorage.getItem('jwt');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    // If specific inventory, get transfers for that inventory
    if (inventoryId) {
        try {
            const response = await fetch(`/api/v1/transfers/inventory/${inventoryId}`, {
                method: 'GET',
                headers: headers
            });
            if (response.ok) {
                let transfers = await response.json();
                // Filter by date if provided
                if (startDate || endDate) {
                    transfers = transfers.filter(transfer => {
                        const transferDate = transfer.requestDate || transfer.createdAt;
                        if (!transferDate) return false;
                        const date = new Date(transferDate);
                        if (startDate && date < new Date(startDate)) return false;
                        if (endDate && date > new Date(endDate)) return false;
                        return true;
                    });
                }
                return transfers || [];
            }
        } catch (error) {
            console.error('Error loading transfers:', error);
        }
    } else {
        // Get transfers from all inventories in the institution/regional
        const inventories = await fetchInventoryReport(regionalId, institutionId, null, startDate, endDate).catch(() => []);
        const allTransfers = [];
        for (const inv of inventories) {
            try {
                const response = await fetch(`/api/v1/transfers/inventory/${inv.id}`, {
                    method: 'GET',
                    headers: headers
                });
                if (response.ok) {
                    let transfers = await response.json();
                    // Filter by date if provided
                    if (startDate || endDate) {
                        transfers = transfers.filter(transfer => {
                            const transferDate = transfer.requestDate || transfer.createdAt;
                            if (!transferDate) return false;
                            const date = new Date(transferDate);
                            if (startDate && date < new Date(startDate)) return false;
                            if (endDate && date > new Date(endDate)) return false;
                            return true;
                        });
                    }
                    allTransfers.push(...(transfers || []));
                }
            } catch (error) {
                console.error(`Error loading transfers for inventory ${inv.id}:`, error);
            }
        }
        return allTransfers;
    }
    return [];
}

// Fetch general report
async function fetchGeneralReport(regionalId, institutionId, startDate, endDate) {
    // General report combines multiple data types
    const [items, users, loans, verifications, inventories] = await Promise.all([
        fetchItemsReport(regionalId, institutionId, null, startDate, endDate).catch(() => []),
        fetchUsersReport(regionalId, institutionId, startDate, endDate).catch(() => []),
        fetchLoansReport(regionalId, institutionId, null, startDate, endDate).catch(() => []),
        fetchVerificationsReport(regionalId, institutionId, null, startDate, endDate).catch(() => []),
        fetchInventoryReport(regionalId, institutionId, null, startDate, endDate).catch(() => [])
    ]);

    // Get transfers
    const inventoryId = document.getElementById('inventorySelect')?.value || null;
    const transfers = await fetchTransfersReport(regionalId, institutionId, inventoryId, startDate, endDate).catch(() => []);

    return {
        items: items || [],
        users: users || [],
        loans: loans || [],
        verifications: verifications || [],
        inventories: inventories || [],
        transfers: transfers || []
    };
}

// Display report
function displayReport(data) {
    document.getElementById('reportLoadingState').classList.add('hidden');
    
    if (!data || (Array.isArray(data) && data.length === 0) || 
        (typeof data === 'object' && !Array.isArray(data) && Object.keys(data).length === 0)) {
        document.getElementById('reportEmptyState').classList.remove('hidden');
        document.getElementById('reportResultsSection').classList.add('hidden');
        return;
    }

    document.getElementById('reportEmptyState').classList.add('hidden');
    document.getElementById('reportResultsSection').classList.remove('hidden');

    // Update title
    const reportTypeNames = {
        items: 'Reporte de Items',
        users: 'Reporte de Usuarios',
        loans: 'Reporte de Préstamos',
        verifications: 'Reporte de Verificaciones',
        inventory: 'Reporte de Inventarios',
        general: 'Reporte General'
    };

    document.getElementById('reportTitle').textContent = reportTypeNames[currentReportType] || 'Reporte';
    
    const regionalName = document.getElementById('regionalSelect').selectedOptions[0]?.text || 'Todas';
    const institutionName = document.getElementById('institutionSelect').selectedOptions[0]?.text || 'Todos';
    document.getElementById('reportSubtitle').textContent = `${regionalName} - ${institutionName}`;

    // Show/hide charts container based on report type
    const chartsContainer = document.getElementById('chartsContainer');
    if (chartsContainer) {
        if (currentReportType === 'general') {
            chartsContainer.classList.remove('hidden');
        } else {
            chartsContainer.classList.add('hidden');
        }
    }

    if (currentReportType === 'general') {
        displayGeneralReport(data);
    } else {
        displayTableReport(data);
    }
}

// Display table report
function displayTableReport(data) {
    if (!Array.isArray(data) || data.length === 0) {
        document.getElementById('reportEmptyState').classList.remove('hidden');
        document.getElementById('reportResultsSection').classList.add('hidden');
        return;
    }

    // Generate statistics
    generateStatistics(data);

    // Generate table
    const headers = getHeadersForReportType(currentReportType);
    const tableHeader = document.getElementById('reportTableHeader');
    const tableBody = document.getElementById('reportTableBody');

    // Clear existing content
    tableHeader.innerHTML = '';
    tableBody.innerHTML = '';

    // Create header row
    const headerRow = document.createElement('tr');
    headers.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header.label;
        th.className = 'px-4 py-3 text-left';
        headerRow.appendChild(th);
    });
    tableHeader.appendChild(headerRow);

    // Create body rows
    data.forEach((item, index) => {
        const row = document.createElement('tr');
        row.className = index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700/50';
        
        headers.forEach(header => {
            const td = document.createElement('td');
            const value = getValueForField(item, header.field);
            td.textContent = formatValue(value, header.type);
            td.className = 'px-4 py-3';
            row.appendChild(td);
        });
        
        tableBody.appendChild(row);
    });

    // Update row count
    document.getElementById('reportRowCount').textContent = `${data.length} ${data.length === 1 ? 'registro' : 'registros'}`;
}

// Display general report
async function displayGeneralReport(data) {
    const items = data.items || [];
    const verifications = data.verifications || [];
    const transfers = data.transfers || [];

    // Calculate total value
    const totalValue = items.reduce((sum, item) => sum + (item.acquisitionValue || 0), 0);
    
    // Calculate items with most transfers (most moved)
    const itemTransferCounts = {};
    transfers.forEach(transfer => {
        const itemId = transfer.itemId || transfer.item?.id;
        if (itemId) {
            itemTransferCounts[itemId] = (itemTransferCounts[itemId] || 0) + 1;
        }
    });

    // Get top 5 most moved items
    const mostMovedItems = Object.entries(itemTransferCounts)
        .map(([itemId, count]) => {
            const item = items.find(i => i.id === parseInt(itemId));
            return {
                id: itemId,
                name: item?.name || item?.licencePlateNumber || `Item ${itemId}`,
                count: count
            };
        })
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

    // Get top 5 most expensive items
    const mostExpensiveItems = items
        .filter(item => item.acquisitionValue && item.acquisitionValue > 0)
        .map(item => ({
            id: item.id,
            name: item.name || item.licencePlateNumber || `Item ${item.id}`,
            value: item.acquisitionValue
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

    // Calculate items with most verifications
    const itemVerificationCounts = {};
    verifications.forEach(verification => {
        const itemId = verification.itemId || verification.item?.id;
        if (itemId) {
            itemVerificationCounts[itemId] = (itemVerificationCounts[itemId] || 0) + 1;
        }
    });

    // Get top 5 most verified items
    const mostVerifiedItems = Object.entries(itemVerificationCounts)
        .map(([itemId, count]) => {
            const item = items.find(i => i.id === parseInt(itemId));
            return {
                id: itemId,
                name: item?.name || item?.licencePlateNumber || `Item ${itemId}`,
                count: count
            };
        })
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

    // Show statistics cards
    const statsContainer = document.getElementById('reportStats');
    statsContainer.innerHTML = `
        <div class="stat-card p-4 border border-gray-200 dark:border-gray-600 rounded-xl">
            <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Items</span>
                <i class="fas fa-box text-blue-500"></i>
            </div>
            <div class="text-2xl font-bold text-gray-800 dark:text-gray-100">${items.length}</div>
        </div>
        <div class="stat-card p-4 border border-gray-200 dark:border-gray-600 rounded-xl">
            <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-medium text-gray-600 dark:text-gray-400">Valor Total</span>
                <i class="fas fa-dollar-sign text-green-500"></i>
            </div>
            <div class="text-2xl font-bold text-gray-800 dark:text-gray-100">${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(totalValue)}</div>
        </div>
        <div class="stat-card p-4 border border-gray-200 dark:border-gray-600 rounded-xl">
            <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-medium text-gray-600 dark:text-gray-400">Transferencias</span>
                <i class="fas fa-exchange-alt text-purple-500"></i>
            </div>
            <div class="text-2xl font-bold text-gray-800 dark:text-gray-100">${transfers.length}</div>
        </div>
        <div class="stat-card p-4 border border-gray-200 dark:border-gray-600 rounded-xl">
            <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-medium text-gray-600 dark:text-gray-400">Verificaciones</span>
                <i class="fas fa-clipboard-check text-orange-500"></i>
            </div>
            <div class="text-2xl font-bold text-gray-800 dark:text-gray-100">${verifications.length}</div>
        </div>
    `;

    // Show/hide charts container
    const chartsContainer = document.getElementById('chartsContainer');
    if (chartsContainer) {
        chartsContainer.classList.remove('hidden');
    }

    // Create charts
    createGeneralReportCharts(mostMovedItems, mostExpensiveItems, mostVerifiedItems);

    // Display summary table with top items
    const tableHeader = document.getElementById('reportTableHeader');
    const tableBody = document.getElementById('reportTableBody');
    
    // Create header
    tableHeader.innerHTML = '<tr><th class="px-4 py-3 text-left">#</th><th class="px-4 py-3 text-left">Nombre</th><th class="px-4 py-3 text-left">Información</th></tr>';
    
    // Create tables for top items
    const summaryHTML = `
        <tr>
            <td colspan="3" class="px-4 py-3 font-bold text-gray-800 dark:text-gray-100 bg-purple-50 dark:bg-purple-900/20">
                Items Más Movidos (por transferencias)
            </td>
        </tr>
        ${mostMovedItems.length > 0 ? mostMovedItems.map((item, idx) => `
            <tr class="${idx % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700/50'}">
                <td class="px-4 py-3">${idx + 1}</td>
                <td class="px-4 py-3">${item.name.length > 40 ? item.name.substring(0, 40) + '...' : item.name}</td>
                <td class="px-4 py-3 font-semibold text-purple-600 dark:text-purple-400">${item.count} transferencia${item.count !== 1 ? 's' : ''}</td>
            </tr>
        `).join('') : '<tr><td colspan="3" class="px-4 py-3 text-center text-gray-500">No hay datos disponibles</td></tr>'}
        
        <tr>
            <td colspan="3" class="px-4 py-3 font-bold text-gray-800 dark:text-gray-100 bg-green-50 dark:bg-green-900/20 mt-4">
                Items Más Caros
            </td>
        </tr>
        ${mostExpensiveItems.length > 0 ? mostExpensiveItems.map((item, idx) => `
            <tr class="${idx % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700/50'}">
                <td class="px-4 py-3">${idx + 1}</td>
                <td class="px-4 py-3">${item.name.length > 40 ? item.name.substring(0, 40) + '...' : item.name}</td>
                <td class="px-4 py-3 font-semibold text-green-600 dark:text-green-400">${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(item.value)}</td>
            </tr>
        `).join('') : '<tr><td colspan="3" class="px-4 py-3 text-center text-gray-500">No hay datos disponibles</td></tr>'}
        
        <tr>
            <td colspan="3" class="px-4 py-3 font-bold text-gray-800 dark:text-gray-100 bg-orange-50 dark:bg-orange-900/20 mt-4">
                Items con Más Verificaciones
            </td>
        </tr>
        ${mostVerifiedItems.length > 0 ? mostVerifiedItems.map((item, idx) => `
            <tr class="${idx % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700/50'}">
                <td class="px-4 py-3">${idx + 1}</td>
                <td class="px-4 py-3">${item.name.length > 40 ? item.name.substring(0, 40) + '...' : item.name}</td>
                <td class="px-4 py-3 font-semibold text-orange-600 dark:text-orange-400">${item.count} verificación${item.count !== 1 ? 'es' : ''}</td>
            </tr>
        `).join('') : '<tr><td colspan="3" class="px-4 py-3 text-center text-gray-500">No hay datos disponibles</td></tr>'}
    `;
    
    tableBody.innerHTML = summaryHTML;
    
    document.getElementById('reportRowCount').textContent = `Total: ${items.length} items`;
}

// Store chart instances for PDF export
let chartInstances = {
    mostMoved: null,
    mostExpensive: null,
    mostVerified: null
};

// Create charts for general report
function createGeneralReportCharts(mostMovedItems, mostExpensiveItems, mostVerifiedItems) {
    // Destroy existing charts if they exist
    if (chartInstances.mostMoved) chartInstances.mostMoved.destroy();
    if (chartInstances.mostExpensive) chartInstances.mostExpensive.destroy();
    if (chartInstances.mostVerified) chartInstances.mostVerified.destroy();

    const isDark = document.documentElement.classList.contains('dark');
    const textColor = isDark ? '#e2e8f0' : '#1e293b';
    const gridColor = isDark ? '#334155' : '#e2e8f0';

    // Chart: Most Moved Items
    const mostMovedCtx = document.getElementById('mostMovedChart');
    if (mostMovedCtx) {
        chartInstances.mostMoved = new Chart(mostMovedCtx, {
            type: 'bar',
            data: {
                labels: mostMovedItems.length > 0 ? mostMovedItems.map(item => item.name.length > 15 ? item.name.substring(0, 15) + '...' : item.name) : ['No hay datos'],
                datasets: [{
                    label: 'Transferencias',
                    data: mostMovedItems.length > 0 ? mostMovedItems.map(item => item.count) : [0],
                    backgroundColor: 'rgba(147, 51, 234, 0.6)',
                    borderColor: 'rgba(147, 51, 234, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { color: textColor },
                        grid: { color: gridColor }
                    },
                    x: {
                        ticks: { color: textColor, maxRotation: 45, minRotation: 45 },
                        grid: { color: gridColor }
                    }
                }
            }
        });
    }

    // Chart: Most Expensive Items
    const mostExpensiveCtx = document.getElementById('mostExpensiveChart');
    if (mostExpensiveCtx) {
        chartInstances.mostExpensive = new Chart(mostExpensiveCtx, {
            type: 'bar',
            data: {
                labels: mostExpensiveItems.length > 0 ? mostExpensiveItems.map(item => item.name.length > 15 ? item.name.substring(0, 15) + '...' : item.name) : ['No hay datos'],
                datasets: [{
                    label: 'Valor (COP)',
                    data: mostExpensiveItems.length > 0 ? mostExpensiveItems.map(item => item.value) : [0],
                    backgroundColor: 'rgba(34, 197, 94, 0.6)',
                    borderColor: 'rgba(34, 197, 94, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(context.parsed.y);
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { 
                            color: textColor,
                            callback: function(value) {
                                return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', notation: 'compact' }).format(value);
                            }
                        },
                        grid: { color: gridColor }
                    },
                    x: {
                        ticks: { color: textColor, maxRotation: 45, minRotation: 45 },
                        grid: { color: gridColor }
                    }
                }
            }
        });
    }

    // Chart: Most Verified Items
    const mostVerifiedCtx = document.getElementById('mostVerifiedChart');
    if (mostVerifiedCtx) {
        chartInstances.mostVerified = new Chart(mostVerifiedCtx, {
            type: 'bar',
            data: {
                labels: mostVerifiedItems.length > 0 ? mostVerifiedItems.map(item => item.name.length > 20 ? item.name.substring(0, 20) + '...' : item.name) : ['No hay datos'],
                datasets: [{
                    label: 'Verificaciones',
                    data: mostVerifiedItems.length > 0 ? mostVerifiedItems.map(item => item.count) : [0],
                    backgroundColor: 'rgba(249, 115, 22, 0.6)',
                    borderColor: 'rgba(249, 115, 22, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { color: textColor },
                        grid: { color: gridColor }
                    },
                    x: {
                        ticks: { color: textColor, maxRotation: 45, minRotation: 45 },
                        grid: { color: gridColor }
                    }
                }
            }
        });
    }
}

// Get headers for report type
function getHeadersForReportType(reportType) {
    const headersMap = {
        items: [
            { field: 'licencePlateNumber', label: 'Placa', type: 'string' },
            { field: 'name', label: 'Nombre', type: 'string' },
            { field: 'category', label: 'Categoría', type: 'string' },
            { field: 'status', label: 'Estado', type: 'string' },
            { field: 'acquisitionValue', label: 'Valor', type: 'currency' },
            { field: 'createdAt', label: 'Fecha Registro', type: 'date' }
        ],
        users: [
            { field: 'fullName', label: 'Nombre Completo', type: 'string' },
            { field: 'email', label: 'Email', type: 'string' },
            { field: 'role', label: 'Rol', type: 'string' },
            { field: 'status', label: 'Estado', type: 'boolean' },
            { field: 'createdAt', label: 'Fecha Registro', type: 'date' }
        ],
        loans: [
            { field: 'id', label: 'ID', type: 'number' },
            { field: 'userName', label: 'Usuario', type: 'string' },
            { field: 'itemName', label: 'Item', type: 'string' },
            { field: 'loanDate', label: 'Fecha Préstamo', type: 'date' },
            { field: 'returnDate', label: 'Fecha Devolución', type: 'date' },
            { field: 'status', label: 'Estado', type: 'string' }
        ],
        verifications: [
            { field: 'id', label: 'ID', type: 'number' },
            { field: 'itemName', label: 'Item', type: 'string' },
            { field: 'verificationDate', label: 'Fecha Verificación', type: 'date' },
            { field: 'status', label: 'Estado', type: 'string' },
            { field: 'verifiedBy', label: 'Verificado Por', type: 'string' }
        ],
        inventory: [
            { field: 'name', label: 'Nombre', type: 'string' },
            { field: 'description', label: 'Descripción', type: 'string' },
            { field: 'ownerName', label: 'Propietario', type: 'string' },
            { field: 'createdAt', label: 'Fecha Creación', type: 'date' }
        ]
    };

    return headersMap[reportType] || [];
}

// Get value for field (supporting nested fields)
function getValueForField(item, field) {
    const parts = field.split('.');
    let value = item;
    for (const part of parts) {
        if (value && typeof value === 'object') {
            value = value[part];
        } else {
            return null;
        }
    }
    return value;
}

// Format value based on type
function formatValue(value, type) {
    if (value === null || value === undefined) return '-';
    
    switch (type) {
        case 'date':
            if (value) {
                const date = new Date(value);
                return date.toLocaleDateString('es-ES');
            }
            return '-';
        case 'currency':
            if (typeof value === 'number') {
                return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(value);
            }
            return value;
        case 'boolean':
            return value ? 'Activo' : 'Inactivo';
        default:
            return String(value);
    }
}

// Generate statistics
function generateStatistics(data) {
    if (!Array.isArray(data) || data.length === 0) return;

    const statsContainer = document.getElementById('reportStats');
    let statsHTML = '';

    if (currentReportType === 'items') {
        const totalValue = data.reduce((sum, item) => sum + (item.acquisitionValue || 0), 0);
        const activeCount = data.filter(item => item.status === 'ACTIVE').length;
        const inactiveCount = data.filter(item => item.status === 'INACTIVE').length;
        
        statsHTML = `
            <div class="stat-card p-4 border border-gray-200 dark:border-gray-600 rounded-xl">
                <div class="flex items-center justify-between mb-2">
                    <span class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Items</span>
                    <i class="fas fa-box text-blue-500"></i>
                </div>
                <div class="text-2xl font-bold text-gray-800 dark:text-gray-100">${data.length}</div>
            </div>
            <div class="stat-card p-4 border border-gray-200 dark:border-gray-600 rounded-xl">
                <div class="flex items-center justify-between mb-2">
                    <span class="text-sm font-medium text-gray-600 dark:text-gray-400">Valor Total</span>
                    <i class="fas fa-dollar-sign text-green-500"></i>
                </div>
                <div class="text-2xl font-bold text-gray-800 dark:text-gray-100">${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(totalValue)}</div>
            </div>
            <div class="stat-card p-4 border border-gray-200 dark:border-gray-600 rounded-xl">
                <div class="flex items-center justify-between mb-2">
                    <span class="text-sm font-medium text-gray-600 dark:text-gray-400">Activos</span>
                    <i class="fas fa-check-circle text-green-500"></i>
                </div>
                <div class="text-2xl font-bold text-gray-800 dark:text-gray-100">${activeCount}</div>
            </div>
            <div class="stat-card p-4 border border-gray-200 dark:border-gray-600 rounded-xl">
                <div class="flex items-center justify-between mb-2">
                    <span class="text-sm font-medium text-gray-600 dark:text-gray-400">Inactivos</span>
                    <i class="fas fa-times-circle text-red-500"></i>
                </div>
                <div class="text-2xl font-bold text-gray-800 dark:text-gray-100">${inactiveCount}</div>
            </div>
        `;
    } else {
        statsHTML = `
            <div class="stat-card p-4 border border-gray-200 dark:border-gray-600 rounded-xl col-span-4">
                <div class="flex items-center justify-between mb-2">
                    <span class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Registros</span>
                    <i class="fas fa-database text-purple-500"></i>
                </div>
                <div class="text-2xl font-bold text-gray-800 dark:text-gray-100">${data.length}</div>
            </div>
        `;
    }

    statsContainer.innerHTML = statsHTML;
}

// Export to PDF
async function exportToPDF() {
    if (!currentReportData || (Array.isArray(currentReportData) && currentReportData.length === 0)) {
        showReportErrorToast('Error', 'No hay datos para exportar');
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Report type names
    const reportTypeNames = {
        items: 'Reporte de Items',
        users: 'Reporte de Usuarios',
        loans: 'Reporte de Préstamos',
        verifications: 'Reporte de Verificaciones',
        inventory: 'Reporte de Inventarios',
        general: 'Reporte General'
    };

    // Load logo (optional - continue even if it fails)
    // Logo is loaded in memory only, not displayed on page
    let logoImageData = null;
    try {
        const logoUrl = window.location.origin + '/svg/box.png';
        const img = new Image();
        
        await new Promise((resolve) => {
            let resolved = false;
            const timeout = setTimeout(() => {
                if (!resolved) {
                    resolved = true;
                    resolve();
                }
            }, 1500);
            
            img.onload = () => {
                if (resolved) return;
                clearTimeout(timeout);
                try {
                    // Create a hidden canvas to convert the image (never added to DOM)
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width || 100;
                    canvas.height = img.height || 100;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);
                    logoImageData = canvas.toDataURL('image/png');
                    
                    // Clean up canvas immediately (remove reference)
                    canvas.width = 0;
                    canvas.height = 0;
                    canvas = null;
                    resolved = true;
                    resolve();
                } catch (e) {
                    console.warn('Error processing logo for PDF:', e);
                    resolved = true;
                    resolve();
                }
            };
            
            img.onerror = () => {
                if (resolved) return;
                clearTimeout(timeout);
                resolved = true;
                resolve();
            };
            
            // Try to load the image
            img.src = logoUrl;
            img.crossOrigin = 'anonymous';
        });
        
        // Add logo to PDF if loaded successfully
        if (logoImageData) {
            try {
                doc.addImage(logoImageData, 'PNG', doc.internal.pageSize.getWidth() - 32, 8, 22, 22);
            } catch (e) {
                console.warn('Could not add logo to PDF page:', e);
            }
        }
    } catch (error) {
        // Silently continue without logo
    }

    // Enhanced Header with gradient effect
    const pageWidth = doc.internal.pageSize.getWidth();
    const headerHeight = 60;
    
    // Main header background with gradient effect (dark green)
    doc.setFillColor(0, 140, 0); // Darker SENA green
    doc.rect(0, 0, pageWidth, headerHeight, 'F');
    
    // Accent bar at bottom of header
    doc.setFillColor(0, 175, 0); // Brighter green
    doc.rect(0, headerHeight - 5, pageWidth, 5, 'F');
    
    // Logo positioning (if available)
    if (logoImageData) {
        try {
            doc.addImage(logoImageData, 'PNG', pageWidth - 50, 10, 40, 40);
        } catch (e) {
            console.warn('Could not add logo to PDF page:', e);
        }
    }
    
    // Header text with better styling
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text('SGDIS', 20, 28);
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text('Sistema de Gestión de Inventario SENA', 20, 38);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'italic');
    doc.text(reportTypeNames[currentReportType] || 'Reporte', 20, 48);
    
    // Decorative line
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.8);
    doc.line(20, 52, pageWidth - 20, 52);

    // Reset text color
    doc.setTextColor(0, 0, 0);
    
    // Enhanced Filters section with box
    let yPos = headerHeight + 18;
    
    // Background box for filters
    doc.setFillColor(248, 250, 252); // Light gray background
    doc.roundedRect(14, yPos - 10, pageWidth - 28, 58, 4, 4, 'F');
    
    // Border for filters box
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.8);
    doc.roundedRect(14, yPos - 10, pageWidth - 28, 58, 4, 4);
    
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 140, 0); // Green for title
    doc.text('INFORMACION DEL REPORTE', 20, yPos);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(40, 40, 40);
    
    const regionalName = document.getElementById('regionalSelect').selectedOptions[0]?.text || 'Todas las regionales';
    const institutionName = document.getElementById('institutionSelect').selectedOptions[0]?.text || 'Todos los centros';
    const startDate = document.getElementById('startDate').value || 'No especificada';
    const endDate = document.getElementById('endDate').value || 'No especificada';
    const generatedDate = new Date().toLocaleDateString('es-ES', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    // Two column layout for filters
    yPos += 7;
    doc.text('Regional:', 20, yPos);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(60, 60, 60);
    doc.text(regionalName.length > 35 ? regionalName.substring(0, 35) + '...' : regionalName, 20 + 45, yPos);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(40, 40, 40);
    
    yPos += 7;
    doc.text('Centro:', 20, yPos);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(60, 60, 60);
    doc.text(institutionName.length > 35 ? institutionName.substring(0, 35) + '...' : institutionName, 20 + 45, yPos);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(40, 40, 40);
    
    yPos += 7;
    doc.text('Fecha inicio:', 20, yPos);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(60, 60, 60);
    doc.text(startDate || 'No especificada', 20 + 45, yPos);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(40, 40, 40);
    
    yPos += 7;
    doc.text('Fecha fin:', 20, yPos);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(60, 60, 60);
    doc.text(endDate || 'No especificada', 20 + 45, yPos);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(40, 40, 40);
    
    yPos += 7;
    doc.text('Generado el:', 20, yPos);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(60, 60, 60);
    doc.text(generatedDate, 20 + 45, yPos);
    doc.setFont('helvetica', 'normal');
    
    doc.setTextColor(0, 0, 0); // Reset to black
    yPos += 18;

    if (currentReportType === 'general') {
        // General report with statistics and charts
        const data = currentReportData;
        
        // Calculate statistics
        const items = data.items || [];
        const verifications = data.verifications || [];
        const transfers = data.transfers || [];
        const totalValue = items.reduce((sum, item) => sum + (item.acquisitionValue || 0), 0);
        
        // Calculate items with most transfers
        const itemTransferCounts = {};
        transfers.forEach(transfer => {
            const itemId = transfer.itemId || transfer.item?.id;
            if (itemId) {
                itemTransferCounts[itemId] = (itemTransferCounts[itemId] || 0) + 1;
            }
        });

        const mostMovedItems = Object.entries(itemTransferCounts)
            .map(([itemId, count]) => {
                const item = items.find(i => i.id === parseInt(itemId));
                return {
                    id: itemId,
                    name: item?.name || item?.licencePlateNumber || `Item ${itemId}`,
                    count: count
                };
            })
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        // Get top 5 most expensive items
        const mostExpensiveItems = items
            .filter(item => item.acquisitionValue && item.acquisitionValue > 0)
            .map(item => ({
                id: item.id,
                name: item.name || item.licencePlateNumber || `Item ${item.id}`,
                value: item.acquisitionValue
            }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);

        // Calculate items with most verifications
        const itemVerificationCounts = {};
        verifications.forEach(verification => {
            const itemId = verification.itemId || verification.item?.id;
            if (itemId) {
                itemVerificationCounts[itemId] = (itemVerificationCounts[itemId] || 0) + 1;
            }
        });

        const mostVerifiedItems = Object.entries(itemVerificationCounts)
            .map(([itemId, count]) => {
                const item = items.find(i => i.id === parseInt(itemId));
                return {
                    id: itemId,
                    name: item?.name || item?.licencePlateNumber || `Item ${itemId}`,
                    count: count
                };
            })
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        // Enhanced Statistics section with cards
        yPos += 10; // Bajar 10px más
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 140, 0);
        doc.text('ESTADISTICAS GENERALES', 14, yPos);
        doc.setTextColor(0, 0, 0);
        yPos += 14;

        // Statistics cards in 2x2 grid
        const cardWidth = (pageWidth - 42) / 2;
        const cardHeight = 32;
        const cardSpacing = 10;
        
        // Card 1: Total Items
        doc.setFillColor(59, 130, 246); // Blue
        doc.roundedRect(14, yPos, cardWidth, cardHeight, 4, 4, 'F');
        doc.setDrawColor(40, 100, 200);
        doc.setLineWidth(0.5);
        doc.roundedRect(14, yPos, cardWidth, cardHeight, 4, 4);
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('TOTAL DE ITEMS', 20, yPos + 8);
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text(items.length.toString(), 20, yPos + 22);
        
        // Card 2: Total Value
        doc.setFillColor(34, 197, 94); // Green
        doc.roundedRect(14 + cardWidth + cardSpacing, yPos, cardWidth, cardHeight, 4, 4, 'F');
        doc.setDrawColor(20, 150, 70);
        doc.setLineWidth(0.5);
        doc.roundedRect(14 + cardWidth + cardSpacing, yPos, cardWidth, cardHeight, 4, 4);
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('VALOR TOTAL', 20 + cardWidth + cardSpacing, yPos + 8);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        const valueText = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(totalValue);
        // Split value text if too long
        if (valueText.length > 28) {
            const mid = Math.floor(valueText.length / 2);
            doc.text(valueText.substring(0, mid), 20 + cardWidth + cardSpacing, yPos + 20);
            doc.text(valueText.substring(mid), 20 + cardWidth + cardSpacing, yPos + 26);
        } else {
            doc.text(valueText, 20 + cardWidth + cardSpacing, yPos + 22);
        }
        
        yPos += cardHeight + cardSpacing;
        
        // Card 3: Total Transfers
        doc.setFillColor(147, 51, 234); // Purple
        doc.roundedRect(14, yPos, cardWidth, cardHeight, 4, 4, 'F');
        doc.setDrawColor(100, 30, 180);
        doc.setLineWidth(0.5);
        doc.roundedRect(14, yPos, cardWidth, cardHeight, 4, 4);
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('TOTAL TRANSFERENCIAS', 20, yPos + 8);
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text(transfers.length.toString(), 20, yPos + 22);
        
        // Card 4: Total Verifications
        doc.setFillColor(249, 115, 22); // Orange
        doc.roundedRect(14 + cardWidth + cardSpacing, yPos, cardWidth, cardHeight, 4, 4, 'F');
        doc.setDrawColor(200, 80, 10);
        doc.setLineWidth(0.5);
        doc.roundedRect(14 + cardWidth + cardSpacing, yPos, cardWidth, cardHeight, 4, 4);
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('TOTAL VERIFICACIONES', 20 + cardWidth + cardSpacing, yPos + 8);
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text(verifications.length.toString(), 20 + cardWidth + cardSpacing, yPos + 22);
        
        doc.setTextColor(0, 0, 0); // Reset to black
        yPos += cardHeight + 18;

        // Enhanced Charts section - Nueva página
        // Check if we need a new page for charts section
        if (yPos > doc.internal.pageSize.getHeight() - 100) {
            doc.addPage();
            yPos = 20;
        } else {
            // Si hay espacio pero poco, también crear nueva página para mejor presentación
            doc.addPage();
            yPos = 20;
        }
        
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 140, 0);
        doc.text('ANALISIS VISUAL', 14, yPos);
        doc.setTextColor(0, 0, 0);
        yPos += 16;

        // Charts with more width and centered
        const chartWidth = (pageWidth - 50) / 2; // Más ancho (reducir márgenes)
        const chartHeight = 60; // Más alto para mejor visualización
        const chartSpacing = 12;
        const chartStartX = (pageWidth - (chartWidth * 2 + chartSpacing)) / 2; // Centrado

        // Chart 1: Most Moved Items (left side)
        if (chartInstances.mostMoved && mostMovedItems.length > 0) {
            try {
                // Chart box with border
                doc.setFillColor(250, 250, 252);
                doc.roundedRect(chartStartX, yPos - 5, chartWidth, chartHeight + 25, 4, 4, 'F');
                doc.setDrawColor(220, 220, 220);
                doc.setLineWidth(0.8);
                doc.roundedRect(chartStartX, yPos - 5, chartWidth, chartHeight + 25, 4, 4);
                
                const chartImage = chartInstances.mostMoved.toBase64Image('image/png', 1);
                doc.setFontSize(11);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(147, 51, 234);
                doc.text('ITEMS MAS MOVIDOS', chartStartX + 8, yPos);
                doc.setTextColor(0, 0, 0);
                
                doc.addImage(chartImage, 'PNG', chartStartX + 8, yPos + 6, chartWidth - 16, chartHeight);
            } catch (e) {
                console.warn('Error exporting most moved chart:', e);
            }
        }

        // Chart 2: Most Expensive Items (right side)
        if (chartInstances.mostExpensive && mostExpensiveItems.length > 0) {
            try {
                // Chart box with border
                doc.setFillColor(250, 250, 252);
                doc.roundedRect(chartStartX + chartWidth + chartSpacing, yPos - 5, chartWidth, chartHeight + 25, 4, 4, 'F');
                doc.setDrawColor(220, 220, 220);
                doc.setLineWidth(0.8);
                doc.roundedRect(chartStartX + chartWidth + chartSpacing, yPos - 5, chartWidth, chartHeight + 25, 4, 4);
                
                const chartImage = chartInstances.mostExpensive.toBase64Image('image/png', 1);
                doc.setFontSize(11);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(34, 197, 94);
                doc.text('ITEMS MAS CAROS', chartStartX + chartWidth + chartSpacing + 8, yPos);
                doc.setTextColor(0, 0, 0);
                
                doc.addImage(chartImage, 'PNG', chartStartX + chartWidth + chartSpacing + 8, yPos + 6, chartWidth - 16, chartHeight);
            } catch (e) {
                console.warn('Error exporting most expensive chart:', e);
            }
        }

        yPos += chartHeight + 40;

        // Chart 3: Most Verified Items (full width, centered)
        if (chartInstances.mostVerified && mostVerifiedItems.length > 0) {
            try {
                // Check if we need a new page
                if (yPos > doc.internal.pageSize.getHeight() - 90) {
                    doc.addPage();
                    yPos = 20;
                }
                
                // Chart box with border (full width but with margins for centering)
                const fullChartWidth = pageWidth - 30; // Más ancho, menos márgenes
                const fullChartStartX = (pageWidth - fullChartWidth) / 2; // Centrado
                
                doc.setFillColor(250, 250, 252);
                doc.roundedRect(fullChartStartX, yPos - 5, fullChartWidth, chartHeight + 25, 4, 4, 'F');
                doc.setDrawColor(220, 220, 220);
                doc.setLineWidth(0.8);
                doc.roundedRect(fullChartStartX, yPos - 5, fullChartWidth, chartHeight + 25, 4, 4);
                
                const chartImage = chartInstances.mostVerified.toBase64Image('image/png', 1);
                doc.setFontSize(11);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(249, 115, 22);
                doc.text('ITEMS CON MAS VERIFICACIONES', fullChartStartX + 10, yPos);
                doc.setTextColor(0, 0, 0);
                
                doc.addImage(chartImage, 'PNG', fullChartStartX + 10, yPos + 6, fullChartWidth - 20, chartHeight);
                yPos += chartHeight + 35;
            } catch (e) {
                console.warn('Error exporting most verified chart:', e);
            }
        }

        // Check if we need a new page for tables
        if (yPos > doc.internal.pageSize.getHeight() - 40) {
            doc.addPage();
            yPos = 20;
        }

        // Enhanced Top Items Tables section
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 140, 0);
        doc.text('DETALLE DE ITEMS DESTACADOS', 14, yPos);
        doc.setTextColor(0, 0, 0);
        yPos += 14;

        // Table 1: Most Moved Items
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(147, 51, 234);
        doc.text('ITEMS MAS MOVIDOS', 14, yPos);
        doc.setTextColor(0, 0, 0);
        yPos += 10;

        if (mostMovedItems.length > 0) {
            const movedTableData = [
                ['#', 'Nombre del Item', 'Transferencias'],
                ...mostMovedItems.map((item, idx) => [
                    (idx + 1).toString(),
                    item.name.length > 35 ? item.name.substring(0, 35) + '...' : item.name,
                    item.count.toString() + ' trans.'
                ])
            ];

            doc.autoTable({
                startY: yPos,
                head: [movedTableData[0]],
                body: movedTableData.slice(1),
                theme: 'striped',
                headStyles: { 
                    fillColor: [147, 51, 234],
                    textColor: [255, 255, 255],
                    fontStyle: 'bold',
                    fontSize: 10
                },
                bodyStyles: {
                    fontSize: 9,
                    cellPadding: 3
                },
                alternateRowStyles: {
                    fillColor: [250, 250, 252]
                },
                styles: {
                    cellPadding: 3,
                    lineColor: [220, 220, 220],
                    lineWidth: 0.3
                },
                margin: { left: 14, right: 14 }
            });
            yPos = doc.lastAutoTable.finalY + 15;
        } else {
            // Message when no data
            doc.setFontSize(10);
            doc.setFont('helvetica', 'italic');
            doc.setTextColor(140, 140, 140);
            doc.text('No hay datos disponibles', 20, yPos);
            doc.setTextColor(0, 0, 0);
            yPos += 12;
        }

        // Check if we need a new page
        if (yPos > doc.internal.pageSize.getHeight() - 50) {
            doc.addPage();
            yPos = 20;
        }

        // Table 2: Most Expensive Items
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(34, 197, 94);
        doc.text('ITEMS MAS CAROS', 14, yPos);
        doc.setTextColor(0, 0, 0);
        yPos += 10;

        if (mostExpensiveItems.length > 0) {
            const expensiveTableData = [
                ['#', 'Nombre del Item', 'Valor'],
                ...mostExpensiveItems.map((item, idx) => [
                    (idx + 1).toString(),
                    item.name.length > 35 ? item.name.substring(0, 35) + '...' : item.name,
                    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(item.value)
                ])
            ];

            doc.autoTable({
                startY: yPos,
                head: [expensiveTableData[0]],
                body: expensiveTableData.slice(1),
                theme: 'striped',
                headStyles: { 
                    fillColor: [34, 197, 94],
                    textColor: [255, 255, 255],
                    fontStyle: 'bold',
                    fontSize: 10
                },
                bodyStyles: {
                    fontSize: 9,
                    cellPadding: 3
                },
                alternateRowStyles: {
                    fillColor: [250, 250, 252]
                },
                styles: {
                    cellPadding: 3,
                    lineColor: [220, 220, 220],
                    lineWidth: 0.3
                },
                margin: { left: 14, right: 14 }
            });
            yPos = doc.lastAutoTable.finalY + 15;
        } else {
            // Message when no data
            doc.setFontSize(10);
            doc.setFont('helvetica', 'italic');
            doc.setTextColor(140, 140, 140);
            doc.text('No hay datos disponibles', 20, yPos);
            doc.setTextColor(0, 0, 0);
            yPos += 12;
        }

        // Check if we need a new page
        if (yPos > doc.internal.pageSize.getHeight() - 50) {
            doc.addPage();
            yPos = 20;
        }

        // Table 3: Most Verified Items
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(249, 115, 22);
        doc.text('ITEMS CON MAS VERIFICACIONES', 14, yPos);
        doc.setTextColor(0, 0, 0);
        yPos += 10;

        if (mostVerifiedItems.length > 0) {
            const verifiedTableData = [
                ['#', 'Nombre del Item', 'Verificaciones'],
                ...mostVerifiedItems.map((item, idx) => [
                    (idx + 1).toString(),
                    item.name.length > 35 ? item.name.substring(0, 35) + '...' : item.name,
                    item.count.toString() + ' verif.'
                ])
            ];

            doc.autoTable({
                startY: yPos,
                head: [verifiedTableData[0]],
                body: verifiedTableData.slice(1),
                theme: 'striped',
                headStyles: { 
                    fillColor: [249, 115, 22],
                    textColor: [255, 255, 255],
                    fontStyle: 'bold',
                    fontSize: 10
                },
                bodyStyles: {
                    fontSize: 9,
                    cellPadding: 3
                },
                alternateRowStyles: {
                    fillColor: [250, 250, 252]
                },
                styles: {
                    cellPadding: 3,
                    lineColor: [220, 220, 220],
                    lineWidth: 0.3
                },
                margin: { left: 14, right: 14 }
            });
        } else {
            // Message when no data
            doc.setFontSize(10);
            doc.setFont('helvetica', 'italic');
            doc.setTextColor(140, 140, 140);
            doc.text('No hay datos disponibles', 20, yPos);
            doc.setTextColor(0, 0, 0);
        }
    } else {
        // Enhanced Table report
        const headers = getHeadersForReportType(currentReportType);
        const tableData = currentReportData.map(item => 
            headers.map(header => formatValue(getValueForField(item, header.field), header.type))
        );

        // Section title
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 140, 0);
        doc.text('DETALLE DE REGISTROS', 14, yPos);
        doc.setTextColor(0, 0, 0);
        yPos += 12;

        doc.autoTable({
            startY: yPos,
            head: [headers.map(h => h.label)],
            body: tableData,
            theme: 'striped',
            headStyles: { 
                fillColor: [0, 140, 0],
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                fontSize: 10,
                cellPadding: 5,
                halign: 'center'
            },
            bodyStyles: {
                fontSize: 9,
                cellPadding: 4,
                halign: 'left'
            },
            alternateRowStyles: {
                fillColor: [250, 250, 252]
            },
            styles: { 
                fontSize: 9,
                cellPadding: 3,
                lineColor: [220, 220, 220],
                lineWidth: 0.3
            },
            margin: { left: 14, right: 14 },
            overflow: 'linebreak'
        });
    }

    // Enhanced Footer on each page
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        const pageHeight = doc.internal.pageSize.getHeight();
        
        // Footer background
        doc.setFillColor(245, 247, 250);
        doc.rect(0, pageHeight - 20, pageWidth, 20, 'F');
        
        // Footer top line
        doc.setDrawColor(0, 140, 0);
        doc.setLineWidth(0.5);
        doc.line(0, pageHeight - 20, pageWidth, pageHeight - 20);
        
        // Footer text
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.setFont('helvetica', 'normal');
        doc.text(
            `Página ${i} de ${pageCount}`,
            pageWidth / 2,
            pageHeight - 12,
            { align: 'center' }
        );
        
        doc.setFontSize(7);
        doc.setTextColor(150, 150, 150);
        doc.text(
            'SGDIS - Sistema de Gestión de Inventario SENA',
            pageWidth / 2,
            pageHeight - 6,
            { align: 'center' }
        );
    }

    // Save PDF
    const fileName = `${reportTypeNames[currentReportType] || 'Reporte'}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
    
    showReportSuccessToast('Éxito', 'Reporte exportado a PDF correctamente');
}

// Export to Excel
function exportToExcel() {
    if (!currentReportData || (Array.isArray(currentReportData) && currentReportData.length === 0)) {
        showReportErrorToast('Error', 'No hay datos para exportar');
        return;
    }

    const reportTypeNames = {
        items: 'Reporte de Items',
        users: 'Reporte de Usuarios',
        loans: 'Reporte de Préstamos',
        verifications: 'Reporte de Verificaciones',
        inventory: 'Reporte de Inventarios',
        general: 'Reporte General'
    };

    let wb = XLSX.utils.book_new();

    if (currentReportType === 'general') {
        // General report - multiple sheets
        const data = currentReportData;
        
        if (data.items && data.items.length > 0) {
            const headers = getHeadersForReportType('items');
            const wsData = [
                headers.map(h => h.label),
                ...data.items.map(item => headers.map(header => formatValue(getValueForField(item, header.field), header.type)))
            ];
            const ws = XLSX.utils.aoa_to_sheet(wsData);
            XLSX.utils.book_append_sheet(wb, ws, 'Items');
        }

        if (data.users && data.users.length > 0) {
            const headers = getHeadersForReportType('users');
            const wsData = [
                headers.map(h => h.label),
                ...data.users.map(item => headers.map(header => formatValue(getValueForField(item, header.field), header.type)))
            ];
            const ws = XLSX.utils.aoa_to_sheet(wsData);
            XLSX.utils.book_append_sheet(wb, ws, 'Usuarios');
        }

        if (data.loans && data.loans.length > 0) {
            const headers = getHeadersForReportType('loans');
            const wsData = [
                headers.map(h => h.label),
                ...data.loans.map(item => headers.map(header => formatValue(getValueForField(item, header.field), header.type)))
            ];
            const ws = XLSX.utils.aoa_to_sheet(wsData);
            XLSX.utils.book_append_sheet(wb, ws, 'Préstamos');
        }

        if (data.verifications && data.verifications.length > 0) {
            const headers = getHeadersForReportType('verifications');
            const wsData = [
                headers.map(h => h.label),
                ...data.verifications.map(item => headers.map(header => formatValue(getValueForField(item, header.field), header.type)))
            ];
            const ws = XLSX.utils.aoa_to_sheet(wsData);
            XLSX.utils.book_append_sheet(wb, ws, 'Verificaciones');
        }

        if (data.inventories && data.inventories.length > 0) {
            const headers = getHeadersForReportType('inventory');
            const wsData = [
                headers.map(h => h.label),
                ...data.inventories.map(item => headers.map(header => formatValue(getValueForField(item, header.field), header.type)))
            ];
            const ws = XLSX.utils.aoa_to_sheet(wsData);
            XLSX.utils.book_append_sheet(wb, ws, 'Inventarios');
        }
    } else {
        // Single sheet report
        const headers = getHeadersForReportType(currentReportType);
        const wsData = [
            headers.map(h => h.label),
            ...currentReportData.map(item => headers.map(header => formatValue(getValueForField(item, header.field), header.type)))
        ];
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        XLSX.utils.book_append_sheet(wb, ws, reportTypeNames[currentReportType] || 'Reporte');
    }

    // Save Excel file
    const fileName = `${reportTypeNames[currentReportType] || 'Reporte'}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
    
    showReportSuccessToast('Éxito', 'Reporte exportado a Excel correctamente');
}

// Toast helper functions (use global functions if available)
function showReportErrorToast(title, message) {
    console.log('Show error toast:', title, message);
    if (typeof window.showErrorToast === 'function') {
        window.showErrorToast(title, message);
    } else if (typeof window.showInventoryErrorToast === 'function') {
        window.showInventoryErrorToast(title, message);
    } else if (typeof window.showInventoryToast === 'function') {
        window.showInventoryToast({ tipo: 'error', titulo: title, descripcion: message });
    } else {
        console.error(`${title}: ${message}`);
        alert(`${title}: ${message}`);
    }
}

function showReportSuccessToast(title, message) {
    if (typeof window.showSuccessToast === 'function') {
        window.showSuccessToast(title, message);
    } else if (typeof window.showInventorySuccessToast === 'function') {
        window.showInventorySuccessToast(title, message);
    } else {
        alert(`${title}: ${message}`);
    }
}

