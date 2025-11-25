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

// Fetch general report
async function fetchGeneralReport(regionalId, institutionId, startDate, endDate) {
    // General report combines multiple data types
    const [items, users, loans, verifications, inventories] = await Promise.all([
        fetchItemsReport(regionalId, institutionId, null, startDate, endDate).catch(() => []),
        fetchUsersReport(regionalId, institutionId, startDate, endDate).catch(() => []),
        fetchLoansReport(regionalId, institutionId, null, startDate, endDate).catch(() => []),
        fetchVerificationsReport(regionalId, institutionId, null, startDate, endDate).catch(() => []),
        fetchInventoryReport(regionalId, institutionId, startDate, endDate).catch(() => [])
    ]);

    return {
        items: items || [],
        users: users || [],
        loans: loans || [],
        verifications: verifications || [],
        inventories: inventories || []
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
function displayGeneralReport(data) {
    // Show statistics cards
    const statsContainer = document.getElementById('reportStats');
    statsContainer.innerHTML = `
        <div class="stat-card p-4 border border-gray-200 dark:border-gray-600 rounded-xl">
            <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-medium text-gray-600 dark:text-gray-400">Items</span>
                <i class="fas fa-box text-blue-500"></i>
            </div>
            <div class="text-2xl font-bold text-gray-800 dark:text-gray-100">${data.items?.length || 0}</div>
        </div>
        <div class="stat-card p-4 border border-gray-200 dark:border-gray-600 rounded-xl">
            <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-medium text-gray-600 dark:text-gray-400">Usuarios</span>
                <i class="fas fa-users text-green-500"></i>
            </div>
            <div class="text-2xl font-bold text-gray-800 dark:text-gray-100">${data.users?.length || 0}</div>
        </div>
        <div class="stat-card p-4 border border-gray-200 dark:border-gray-600 rounded-xl">
            <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-medium text-gray-600 dark:text-gray-400">Préstamos</span>
                <i class="fas fa-hand-holding text-purple-500"></i>
            </div>
            <div class="text-2xl font-bold text-gray-800 dark:text-gray-100">${data.loans?.length || 0}</div>
        </div>
        <div class="stat-card p-4 border border-gray-200 dark:border-gray-600 rounded-xl">
            <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-medium text-gray-600 dark:text-gray-400">Verificaciones</span>
                <i class="fas fa-clipboard-check text-orange-500"></i>
            </div>
            <div class="text-2xl font-bold text-gray-800 dark:text-gray-100">${data.verifications?.length || 0}</div>
        </div>
    `;

    // Display a summary table
    const tableHeader = document.getElementById('reportTableHeader');
    const tableBody = document.getElementById('reportTableBody');
    
    tableHeader.innerHTML = '<tr><th class="px-4 py-3 text-left">Categoría</th><th class="px-4 py-3 text-left">Cantidad</th></tr>';
    tableBody.innerHTML = `
        <tr class="bg-white dark:bg-gray-800"><td class="px-4 py-3">Items</td><td class="px-4 py-3">${data.items?.length || 0}</td></tr>
        <tr class="bg-gray-50 dark:bg-gray-700/50"><td class="px-4 py-3">Usuarios</td><td class="px-4 py-3">${data.users?.length || 0}</td></tr>
        <tr class="bg-white dark:bg-gray-800"><td class="px-4 py-3">Préstamos</td><td class="px-4 py-3">${data.loans?.length || 0}</td></tr>
        <tr class="bg-gray-50 dark:bg-gray-700/50"><td class="px-4 py-3">Verificaciones</td><td class="px-4 py-3">${data.verifications?.length || 0}</td></tr>
        <tr class="bg-white dark:bg-gray-800"><td class="px-4 py-3">Inventarios</td><td class="px-4 py-3">${data.inventories?.length || 0}</td></tr>
    `;
    
    document.getElementById('reportRowCount').textContent = 'Resumen general';
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

    // Header with gradient background effect (simulated with rectangles)
    doc.setFillColor(0, 175, 0); // SENA green
    doc.rect(0, 0, doc.internal.pageSize.getWidth(), 45, 'F');
    
    // Add white text on green background
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('SGDIS', 14, 20);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Sistema de Gestión de Inventario SENA', 14, 28);
    
    doc.setFontSize(10);
    doc.text(reportTypeNames[currentReportType] || 'Reporte', 14, 36);

    // Reset text color to black
    doc.setTextColor(0, 0, 0);
    
    // Subtitle section
    let yPos = 55;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Filtros Aplicados:', 14, yPos);
    yPos += 7;
    
    doc.setFont('helvetica', 'normal');
    const regionalName = document.getElementById('regionalSelect').selectedOptions[0]?.text || 'Todas las regionales';
    const institutionName = document.getElementById('institutionSelect').selectedOptions[0]?.text || 'Todos los centros';
    const startDate = document.getElementById('startDate').value || 'No especificada';
    const endDate = document.getElementById('endDate').value || 'No especificada';
    
    doc.setFontSize(10);
    doc.text(`Regional: ${regionalName}`, 14, yPos);
    yPos += 6;
    doc.text(`Centro: ${institutionName}`, 14, yPos);
    yPos += 6;
    doc.text(`Fecha inicio: ${startDate || 'No especificada'}`, 14, yPos);
    yPos += 6;
    doc.text(`Fecha fin: ${endDate || 'No especificada'}`, 14, yPos);
    yPos += 6;
    doc.text(`Generado el: ${new Date().toLocaleDateString('es-ES', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })}`, 14, yPos);
    
    yPos += 10;

    if (currentReportType === 'general') {
        // General report
        const data = currentReportData;
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Resumen General', 14, yPos);
        yPos += 8;

        const summaryData = [
            ['Categoría', 'Cantidad'],
            ['Items', (data.items?.length || 0).toString()],
            ['Usuarios', (data.users?.length || 0).toString()],
            ['Préstamos', (data.loans?.length || 0).toString()],
            ['Verificaciones', (data.verifications?.length || 0).toString()],
            ['Inventarios', (data.inventories?.length || 0).toString()]
        ];

        doc.autoTable({
            startY: yPos,
            head: [summaryData[0]],
            body: summaryData.slice(1),
            theme: 'striped',
            headStyles: { 
                fillColor: [0, 175, 0],
                textColor: [255, 255, 255],
                fontStyle: 'bold'
            },
            alternateRowStyles: {
                fillColor: [245, 247, 250]
            },
            styles: {
                fontSize: 10,
                cellPadding: 3
            },
            margin: { left: 14, right: 14 }
        });
    } else {
        // Table report
        const headers = getHeadersForReportType(currentReportType);
        const tableData = currentReportData.map(item => 
            headers.map(header => formatValue(getValueForField(item, header.field), header.type))
        );

        doc.autoTable({
            startY: yPos,
            head: [headers.map(h => h.label)],
            body: tableData,
            theme: 'striped',
            headStyles: { 
                fillColor: [0, 175, 0],
                textColor: [255, 255, 255],
                fontStyle: 'bold'
            },
            alternateRowStyles: {
                fillColor: [245, 247, 250]
            },
            styles: { 
                fontSize: 8,
                cellPadding: 2
            },
            margin: { left: 14, right: 14 },
            overflow: 'linebreak'
        });
    }

    // Footer on each page
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text(
            `Página ${i} de ${pageCount} - SGDIS Sistema de Gestión de Inventario SENA`,
            doc.internal.pageSize.getWidth() / 2,
            doc.internal.pageSize.getHeight() - 10,
            { align: 'center' }
        );
        
        // Footer line
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.5);
        doc.line(14, doc.internal.pageSize.getHeight() - 15, doc.internal.pageSize.getWidth() - 14, doc.internal.pageSize.getHeight() - 15);
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

