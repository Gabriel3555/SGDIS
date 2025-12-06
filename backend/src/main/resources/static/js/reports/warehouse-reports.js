// Warehouse Reports functionality

let userInstitutionId = null;
let userRegionalId = null;
let userInstitutionName = null;
let userRegionalName = null;
let inventories = {};
let currentReportData = [];
let currentReportType = 'general';
let currentReportFilters = {};

// Store chart instances for PDF export
let chartInstances = {
    mostMoved: null,
    mostExpensive: null,
    mostVerified: null
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    loadUserInfoAndInventories();
    setupEventListeners();
    setupDateInputs();
});

// Also try if DOM is already loaded (for dynamic navigation)
if (document.readyState !== 'loading') {
    setTimeout(function() {
        loadUserInfoAndInventories();
        setupEventListeners();
        setupDateInputs();
    }, 200);
}

// Setup date inputs to default values - removed (no date filters)
function setupDateInputs() {
    // No date filters - removed
}

// Load user info and inventories
async function loadUserInfoAndInventories() {
    try {
        const token = localStorage.getItem('jwt');
        if (!token) {
            throw new Error('No authentication token found');
        }

        const headers = { 'Content-Type': 'application/json' };
        headers['Authorization'] = `Bearer ${token}`;

        // Get current user info
        const userResponse = await fetch('/api/v1/users/me', {
            method: 'GET',
            headers: headers
        });

        if (!userResponse.ok) {
            throw new Error('Failed to load user info');
        }

        const userData = await userResponse.json();
        userInstitutionName = userData.institution;

        // Get all institutions to find the one matching the user's institution
        const institutionsResponse = await fetch('/api/v1/institutions', {
            method: 'GET',
            headers: headers
        });

        if (institutionsResponse.ok) {
            const institutions = await institutionsResponse.json();
            const institution = institutions.find(inst => inst.name === userInstitutionName);
            
            if (institution) {
                userInstitutionId = institution.institutionId || institution.id;
                userRegionalId = institution.regionalId;

                // Get regional name
                if (userRegionalId) {
                    const regionalsResponse = await fetch('/api/v1/regional', {
                        method: 'GET',
                        headers: headers
                    });

                    if (regionalsResponse.ok) {
                        const regionals = await regionalsResponse.json();
                        const regional = regionals.find(reg => reg.id === userRegionalId);
                        if (regional) {
                            userRegionalName = regional.name;
                        }
                    }
                }

                // Load inventories for the user's institution
                await loadInventories(userInstitutionId);
            }
        }
    } catch (error) {
        console.error('Error loading user info and inventories:', error);
        showReportErrorToast('Error', 'Error al cargar información del usuario');
    }
}

// Setup event listeners
function setupEventListeners() {
    // Inventory dropdown
    const inventorySelect = document.getElementById('inventorySelect');
    if (inventorySelect) {
        inventorySelect.addEventListener('change', function() {
            // Inventory changed, no need to reload
            // For warehouse, button is always enabled (inventory is optional)
        });
    }

    // Generate report button
    const generateBtn = document.getElementById('generateReportBtn');
    if (generateBtn) generateBtn.addEventListener('click', generateReport);

    // Clear filters button
    const clearBtn = document.getElementById('clearFiltersBtn');
    if (clearBtn) clearBtn.addEventListener('click', clearFilters);
    
    // For warehouse reports, enable button once inventories are loaded
    // (inventory selection is optional, so button can be enabled after initial load)
    setTimeout(() => {
        const generateBtn = document.getElementById('generateReportBtn');
        if (generateBtn && document.getElementById('inventorySelect') && document.getElementById('inventorySelect').options.length > 1) {
            generateBtn.disabled = false;
        }
    }, 1000);

    // Export buttons - only PDF
    const exportPdfBtn = document.getElementById('exportPdfBtn');
    if (exportPdfBtn) exportPdfBtn.addEventListener('click', exportToPDF);
}

// Load inventories for the user's institution
async function loadInventories(institutionId) {
    if (!institutionId) {
        document.getElementById('inventorySelect').innerHTML = '<option value="">Cargando inventarios...</option>';
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
            document.getElementById('inventorySelect').innerHTML = '<option value="">Error al cargar inventarios...</option>';
        }
    } catch (error) {
        console.error('Error loading inventories:', error);
        showReportErrorToast('Error', 'Error de conexión al cargar inventarios');
    }
}

// OLD FUNCTION - NOT USED IN WAREHOUSE
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
        // Enable button even if no inventories (user can still generate report)
        const generateBtn = document.getElementById('generateReportBtn');
        if (generateBtn) generateBtn.disabled = false;
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
    
    // Enable button once inventories are loaded (inventory selection is optional)
    const generateBtn = document.getElementById('generateReportBtn');
    if (generateBtn) generateBtn.disabled = false;
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
    // Report type is always 'general', no need to reset it
    document.getElementById('inventorySelect').value = '';
    
    // No date filters - removed
    
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
    // Wait for user info to be loaded if not already loaded
    if (!userInstitutionId || !userRegionalId) {
        await loadUserInfoAndInventories();
        if (!userInstitutionId || !userRegionalId) {
            showReportErrorToast('Error', 'No se pudo cargar la información del usuario. Por favor recargue la página.');
            return;
        }
    }

    // Always use 'general' report type
    const reportType = 'general';
    const inventoryId = document.getElementById('inventorySelect').value;
    // No date filters - removed

    // Show loading state
    document.getElementById('reportLoadingState').classList.remove('hidden');
    document.getElementById('reportResultsSection').classList.add('hidden');
    document.getElementById('reportEmptyState').classList.add('hidden');

    currentReportType = reportType;
    currentReportFilters = {
        regionalId: userRegionalId,
        institutionId: userInstitutionId,
        inventoryId
    };

    try {
        // Always generate general report without date filters
        const data = await fetchGeneralReport(userRegionalId, userInstitutionId, inventoryId);

        currentReportData = data || [];
        console.log('Final data to display, type:', typeof currentReportData, 'isArray:', Array.isArray(currentReportData), 'length:', Array.isArray(currentReportData) ? currentReportData.length : 'N/A');
        console.log('Calling displayReport with currentReportType:', currentReportType);
        displayReport(currentReportData);
    } catch (error) {
        console.error('Error generating report:', error);
        showReportErrorToast('Error', 'Error al generar el reporte: ' + (error.message || 'Error desconocido'));
        document.getElementById('reportLoadingState').classList.add('hidden');
        document.getElementById('reportEmptyState').classList.remove('hidden');
    }
}

// Fetch items report
async function fetchItemsReport(regionalId, institutionId, inventoryId) {
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
        
        // No date filtering - return all items
        return items;
    } else {
        throw new Error('Error al cargar items');
    }
}

// Fetch users report
async function fetchUsersReport(regionalId, institutionId) {
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
        // Ensure users is always an array
        let users = [];
        if (Array.isArray(data)) {
            users = data;
        } else if (data && Array.isArray(data.content)) {
            users = data.content;
        } else if (data && data.content) {
            users = Array.isArray(data.content) ? data.content : [];
        }
        
        // Filter by institution if provided
        if (institutionId && Array.isArray(users)) {
            users = users.filter(user => user.institutionId === parseInt(institutionId));
        }
        
        // Filter by date if provided
        // No date filtering - return all users
        
        return users;
    } else {
        throw new Error('Error al cargar usuarios');
    }
}

// Fetch loans report
async function fetchLoansReport(regionalId, institutionId, inventoryId) {
    const token = localStorage.getItem('jwt');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    // Build endpoint with filters
    const params = new URLSearchParams();
    if (institutionId) {
        params.append('institutionId', institutionId.toString());
    }
    if (inventoryId) {
        params.append('inventoryId', inventoryId.toString());
    }

    let endpoint = '/api/v1/loan/filter';
    const paramsString = params.toString();
    if (paramsString) {
        endpoint += `?${paramsString}`;
    }

    console.log('Fetching loans from:', endpoint);

    const response = await fetch(endpoint, {
        method: 'GET',
        headers: headers
    });

    if (!response.ok) {
        const errorText = await response.text().catch(() => 'Error desconocido');
        console.error('Error fetching loans:', response.status, errorText);
        throw new Error(`Error al cargar préstamos: ${response.status} - ${errorText}`);
    }

    let loans = await response.json();
    if (!Array.isArray(loans)) {
        console.warn('Loans response is not an array:', loans);
        loans = [];
    }

    console.log(`Loaded ${loans.length} loans from API`);
    
    // No date filtering - return all loans
    
    // Fetch item names for all unique item IDs
    const uniqueItemIds = [...new Set(loans.map(loan => loan.itemId).filter(id => id != null))];
    console.log('Unique item IDs to fetch:', uniqueItemIds);
    const itemNamesMap = await fetchItemNames(uniqueItemIds, headers);
    console.log('Item names map:', itemNamesMap);
    
    // Map loan data to expected format for display
    const mappedLoans = loans.map(loan => {
        const itemId = loan.itemId;
        const itemName = itemNamesMap[itemId] || `Item #${itemId || 'N/A'}`;
        
        const mappedLoan = {
            id: loan.id,
            userName: loan.responsibleName || 'N/A',
            itemName: itemName,
            loanDate: loan.lendAt,
            returnDate: loan.returnAt || null,
            status: (loan.returned === true || loan.returned === 'true') ? 'Devuelto' : 'Prestado',
            responsibleName: loan.responsibleName || 'N/A',
            lenderName: loan.lenderName || 'N/A',
            itemId: loan.itemId,
            detailsLend: loan.detailsLend,
            detailsReturn: loan.detailsReturn,
            returned: (loan.returned === true || loan.returned === 'true')
        };
        return mappedLoan;
    });
    
    console.log('Mapped loans:', mappedLoans);
    return mappedLoans;
}

// Fetch item names for given item IDs
async function fetchItemNames(itemIds, headers) {
    if (!itemIds || itemIds.length === 0) {
        return {};
    }

    const itemNamesMap = {};
    
    // Initialize with item IDs as fallback
    itemIds.forEach(id => {
        itemNamesMap[id] = `Item #${id}`;
    });
    
    // Try to get all items for the institution
    try {
        const allItemsResponse = await fetch(`/api/v1/items?page=0&size=10000`, {
            method: 'GET',
            headers: headers
        });

        if (allItemsResponse.ok) {
            const itemsData = await allItemsResponse.json();
            const items = Array.isArray(itemsData) ? itemsData : (itemsData.content || []);
            
            items.forEach(item => {
                if (item.id && itemIds.includes(item.id)) {
                    const name = item.productName || item.name || item.licencePlateNumber;
                    if (name) {
                        itemNamesMap[item.id] = name;
                    }
                }
            });
        }
    } catch (error) {
        console.warn('Error fetching item names:', error);
        // Continue with item IDs as fallback
    }

    return itemNamesMap;
}

// Fetch verifications report
async function fetchVerificationsReport(regionalId, institutionId, inventoryId) {
    const token = localStorage.getItem('jwt');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
        let allVerifications = [];
        
        // For warehouse role, we need to get verifications from inventories
        // Get all inventories for the institution
        let inventoriesToCheck = [];
        
        if (inventoryId) {
            // Specific inventory selected
            inventoriesToCheck = [{ id: inventoryId }];
        } else if (institutionId) {
            // Get all inventories for the institution
            const inventoriesResponse = await fetch(`/api/v1/inventory/institutionAdminInventories/${institutionId}?page=0&size=1000`, {
                method: 'GET',
                headers: headers
            });
            
            if (inventoriesResponse.ok) {
                const inventoriesData = await inventoriesResponse.json();
                inventoriesToCheck = inventoriesData.content || [];
            } else {
                throw new Error('Error al cargar inventarios');
            }
        } else {
            // No filters - return empty array
            return [];
        }
        
        // Get all items from the inventories
        const allItems = [];
        for (const inv of inventoriesToCheck) {
            try {
                const itemsResponse = await fetch(`/api/v1/items/inventory/${inv.id}?page=0&size=10000`, {
                    method: 'GET',
                    headers: headers
                });
                
                if (itemsResponse.ok) {
                    const itemsData = await itemsResponse.json();
                    const items = itemsData.content || itemsData || [];
                    allItems.push(...items);
                }
            } catch (error) {
                console.warn(`Error loading items for inventory ${inv.id}:`, error);
            }
        }
        
        // Get verifications for each item
        for (const item of allItems) {
            if (!item.id) continue;
            
            try {
                const verificationsResponse = await fetch(`/api/v1/items/${item.id}/verifications?page=0&size=10000`, {
                    method: 'GET',
                    headers: headers
                });
                
                if (verificationsResponse.ok) {
                    const verificationsData = await verificationsResponse.json();
                    let itemVerifications = [];
                    
                    if (verificationsData.content) {
                        itemVerifications = verificationsData.content;
                    } else if (Array.isArray(verificationsData)) {
                        itemVerifications = verificationsData;
                    }
                    
                    // Transform to match expected format
                    const transformedVerifications = itemVerifications.map(v => ({
                        id: v.id,
                        itemId: v.itemId || item.id,
                        itemLicencePlateNumber: v.itemLicencePlateNumber || item.licencePlateNumber || item.productName,
                        userId: v.userId,
                        userFullName: v.userFullName,
                        userEmail: v.userEmail,
                        photoUrl: v.photoUrl,
                        createdAt: v.createdAt
                    }));
                    
                    allVerifications.push(...transformedVerifications);
                }
            } catch (error) {
                console.warn(`Error loading verifications for item ${item.id}:`, error);
            }
        }
        
        // Remove duplicates (same verification ID)
        const uniqueVerifications = [];
        const seenIds = new Set();
        for (const v of allVerifications) {
            if (v.id && !seenIds.has(v.id)) {
                seenIds.add(v.id);
                uniqueVerifications.push(v);
            }
        }
        
        // Sort by date (most recent first)
        uniqueVerifications.sort((a, b) => {
            const dateA = new Date(a.createdAt || 0);
            const dateB = new Date(b.createdAt || 0);
            return dateB - dateA;
        });
        
        // No date filtering - return all verifications
        return uniqueVerifications;
    } catch (error) {
        console.error('Error fetching verifications:', error);
        throw new Error('Error al cargar verificaciones: ' + (error.message || 'Error desconocido'));
    }
}

// Fetch inventory report
async function fetchInventoryReport(regionalId, institutionId, inventoryId) {
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
            
            // Get statistics for this inventory
            try {
                const statsResponse = await fetch(`/api/v1/inventory/${inventoryId}/statistics`, {
                    method: 'GET',
                    headers: headers
                });
                if (statsResponse.ok) {
                    const stats = await statsResponse.json();
                    inventory.quantityItems = stats.totalItems || 0;
                    inventory.totalPrice = stats.totalValue || 0;
                }
            } catch (error) {
                console.error('Error fetching inventory statistics:', error);
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
        
        // If no date filter, return all inventories
        // Note: InventoryResponse doesn't have createdAt field, so we skip date filtering
        // but we can still enrich with statistics
        
        // Enrich inventories with statistics if needed
        if (inventories.length > 0 && inventories.length <= 100) {
            // Only enrich if reasonable number of inventories (to avoid too many requests)
            const enrichedInventories = await Promise.all(inventories.map(async (inv) => {
                try {
                    const statsResponse = await fetch(`/api/v1/inventory/${inv.id}/statistics`, {
                        method: 'GET',
                        headers: headers
                    });
                    if (statsResponse.ok) {
                        const stats = await statsResponse.json();
                        inv.quantityItems = stats.totalItems || inv.quantityItems || 0;
                        inv.totalPrice = stats.totalValue || inv.totalPrice || 0;
                    }
                } catch (error) {
                    // If statistics fail, use existing values
                    console.error(`Error fetching statistics for inventory ${inv.id}:`, error);
                }
                return inv;
            }));
            return enrichedInventories;
        }
        
        return inventories;
    } else {
        throw new Error('Error al cargar inventarios');
    }
}

// Fetch transfers report
async function fetchTransfersReport(regionalId, institutionId, inventoryId) {
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
                // No date filtering - return all transfers
                return transfers || [];
            }
        } catch (error) {
            console.error('Error loading transfers:', error);
        }
    } else {
        // Get transfers from all inventories in the institution/regional
        const inventories = await fetchInventoryReport(regionalId, institutionId, null).catch(() => []);
        const allTransfers = [];
        for (const inv of inventories) {
            try {
                const response = await fetch(`/api/v1/transfers/inventory/${inv.id}`, {
                    method: 'GET',
                    headers: headers
                });
                if (response.ok) {
                    let transfers = await response.json();
                    // No date filtering - return all transfers
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
async function fetchGeneralReport(regionalId, institutionId, inventoryId) {
    // General report combines multiple data types - no date filters, always show all data
    const [items, loans, verifications, inventories] = await Promise.all([
        fetchItemsReport(regionalId, institutionId, inventoryId).catch(() => []),
        fetchLoansReport(regionalId, institutionId, inventoryId).catch(() => []),
        fetchVerificationsReport(regionalId, institutionId, inventoryId).catch(() => []),
        fetchInventoryReport(regionalId, institutionId, inventoryId).catch(() => [])
    ]);

    // Get transfers
    const transfers = await fetchTransfersReport(regionalId, institutionId, inventoryId).catch(() => []);

    return {
        items: items || [],
        loans: loans || [],
        verifications: verifications || [],
        inventories: inventories || [],
        transfers: transfers || []
    };
}

// Display report
function displayReport(data) {
    document.getElementById('reportLoadingState').classList.add('hidden');
    
    // Check if data is empty
    let isEmpty = false;
    if (!data) {
        isEmpty = true;
    } else if (Array.isArray(data)) {
        isEmpty = data.length === 0;
    } else if (typeof data === 'object') {
        // For items report, check if items array is empty
        if (currentReportType === 'items' && data.items) {
            isEmpty = !data.items || data.items.length === 0;
        } else {
            isEmpty = Object.keys(data).length === 0;
        }
    }
    
    if (isEmpty) {
        document.getElementById('reportEmptyState').classList.remove('hidden');
        document.getElementById('reportResultsSection').classList.add('hidden');
        return;
    }

    document.getElementById('reportEmptyState').classList.add('hidden');
    document.getElementById('reportResultsSection').classList.remove('hidden');

    // Update title
    const reportTypeNames = {
        items: 'Reporte de Items',
        loans: 'Reporte de Préstamos',
        verifications: 'Reporte de Verificaciones',
        inventory: 'Reporte de Inventarios',
        general: 'Reporte General'
    };

    document.getElementById('reportTitle').textContent = reportTypeNames[currentReportType] || 'Reporte';
    
    const regionalName = userRegionalName || 'Regional';
    const institutionName = userInstitutionName || 'Institución';
    
    // Get inventory name if specific inventory is selected
    let inventoryName = '';
    const inventoryId = currentReportFilters.inventoryId;
    if (inventoryId) {
        const inventorySelect = document.getElementById('inventorySelect');
        if (inventorySelect) {
            const selectedOption = inventorySelect.options[inventorySelect.selectedIndex];
            if (selectedOption && selectedOption.value === inventoryId) {
                inventoryName = selectedOption.textContent;
            }
        }
    }
    
    let subtitle = `${regionalName} - ${institutionName}`;
    if (inventoryName && inventoryName !== 'Todos los inventarios') {
        subtitle += ` - ${inventoryName}`;
    }
    document.getElementById('reportSubtitle').textContent = subtitle;

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
    // Special handling for items report - show statistics instead of full table
    if (currentReportType === 'items') {
        displayItemsReport(data);
        return;
    }
    
    // Special handling for loans report - show statistics and table
    if (currentReportType === 'loans') {
        displayLoansReport(data);
        return;
    }
    
    // Special handling for inventory report - show statistics and table
    if (currentReportType === 'inventory') {
        displayInventoryReport(data);
        return;
    }
    
    // Special handling for verifications report - show statistics and table
    if (currentReportType === 'verifications') {
        displayVerificationsReport(data);
        return;
    }

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
    headers.forEach((header, colIndex) => {
        const th = document.createElement('th');
        th.textContent = header.label;
        th.className = 'py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap';
        // Remove padding classes and set inline styles for precise control
        th.style.paddingTop = '8px';
        th.style.paddingBottom = '8px';
        // Set specific width and padding for ID column (first column)
        if (colIndex === 0) {
            th.style.width = '40px';
            th.style.minWidth = '40px';
            th.style.maxWidth = '40px';
            th.style.paddingLeft = '8px';
            th.style.paddingRight = '2px';
        }
        // Other columns
        else {
            th.style.paddingLeft = '6px';
            th.style.paddingRight = '6px';
        }
        headerRow.appendChild(th);
    });
    tableHeader.appendChild(headerRow);

    // Create body rows
    data.forEach((item, index) => {
        const row = document.createElement('tr');
        row.className = index % 2 === 0 ? 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700' : 'bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-600';
        
        headers.forEach((header, colIndex) => {
            const td = document.createElement('td');
            const value = getValueForField(item, header.field);
            td.textContent = formatValue(value, header.type, header.field);
            td.className = 'py-2 text-sm text-gray-800 dark:text-gray-200';
            // Remove padding classes and set inline styles for precise control
            td.style.paddingTop = '6px';
            td.style.paddingBottom = '6px';
            // Set specific width and padding for ID column (first column)
            if (colIndex === 0) {
                td.style.width = '40px';
                td.style.minWidth = '40px';
                td.style.maxWidth = '40px';
                td.style.paddingLeft = '8px';
                td.style.paddingRight = '2px';
            }
            // Other columns
            else {
                td.style.paddingLeft = '6px';
                td.style.paddingRight = '6px';
            }
            row.appendChild(td);
        });
        
        tableBody.appendChild(row);
    });

    // Update row count
    document.getElementById('reportRowCount').textContent = `${data.length} ${data.length === 1 ? 'registro' : 'registros'}`;
}

// Display inventory report with statistics
function displayInventoryReport(data) {
    const inventories = Array.isArray(data) ? data : [];

    if (inventories.length === 0) {
        document.getElementById('reportEmptyState').classList.remove('hidden');
        document.getElementById('reportResultsSection').classList.add('hidden');
        return;
    }

    // Calculate statistics
    const totalInventories = inventories.length;
    const activeInventories = inventories.filter(inv => inv.status !== false).length;
    const inactiveInventories = totalInventories - activeInventories;
    
    const totalItems = inventories.reduce((sum, inv) => sum + (inv.quantityItems || 0), 0);
    const totalValue = inventories.reduce((sum, inv) => sum + (inv.totalPrice || 0), 0);
    
    // Get top 5 inventories by value
    const topInventoriesByValue = inventories
        .filter(inv => inv.totalPrice && inv.totalPrice > 0)
        .map(inv => ({
            id: inv.id,
            name: inv.name || `Inventario ${inv.id}`,
            value: inv.totalPrice
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);
    
    // Get top 5 inventories by items count
    const topInventoriesByItems = inventories
        .filter(inv => inv.quantityItems && inv.quantityItems > 0)
        .map(inv => ({
            id: inv.id,
            name: inv.name || `Inventario ${inv.id}`,
            items: inv.quantityItems
        }))
        .sort((a, b) => b.items - a.items)
        .slice(0, 5);

    // Generate statistics cards
    const statsContainer = document.getElementById('reportStats');
    statsContainer.innerHTML = `
        <div class="stat-card p-4 border border-gray-200 dark:border-gray-600 rounded-xl">
            <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Inventarios</span>
                <i class="fas fa-boxes text-blue-500"></i>
            </div>
            <div class="text-2xl font-bold text-gray-800 dark:text-gray-100">${totalInventories}</div>
        </div>
        <div class="stat-card p-4 border border-gray-200 dark:border-gray-600 rounded-xl">
            <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-medium text-gray-600 dark:text-gray-400">Inventarios Activos</span>
                <i class="fas fa-check-circle text-green-500"></i>
            </div>
            <div class="text-2xl font-bold text-gray-800 dark:text-gray-100">${activeInventories}</div>
        </div>
        <div class="stat-card p-4 border border-gray-200 dark:border-gray-600 rounded-xl">
            <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Items</span>
                <i class="fas fa-cubes text-purple-500"></i>
            </div>
            <div class="text-2xl font-bold text-gray-800 dark:text-gray-100">${totalItems.toLocaleString('es-CO')}</div>
        </div>
        <div class="stat-card p-4 border border-gray-200 dark:border-gray-600 rounded-xl">
            <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-medium text-gray-600 dark:text-gray-400">Valor Total</span>
                <i class="fas fa-dollar-sign text-orange-500"></i>
            </div>
            <div class="text-2xl font-bold text-gray-800 dark:text-gray-100">${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(totalValue)}</div>
        </div>
    `;

    // Generate table
    const headers = getHeadersForReportType('inventory');
    const tableHeader = document.getElementById('reportTableHeader');
    const tableBody = document.getElementById('reportTableBody');

    // Clear existing content
    tableHeader.innerHTML = '';
    tableBody.innerHTML = '';

    // Create header row
    const headerRow = document.createElement('tr');
    headers.forEach((header, colIndex) => {
        const th = document.createElement('th');
        th.textContent = header.label;
        th.className = 'py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap';
        // Remove padding classes and set inline styles for precise control
        th.style.paddingTop = '8px';
        th.style.paddingBottom = '8px';
        // Set specific width and padding for ID column (first column)
        if (colIndex === 0) {
            th.style.width = '40px';
            th.style.minWidth = '40px';
            th.style.maxWidth = '40px';
            th.style.paddingLeft = '8px';
            th.style.paddingRight = '2px';
        }
        // Other columns
        else {
            th.style.paddingLeft = '6px';
            th.style.paddingRight = '6px';
        }
        headerRow.appendChild(th);
    });
    tableHeader.appendChild(headerRow);

    // Create body rows
    inventories.forEach((inventory, index) => {
        const row = document.createElement('tr');
        row.className = index % 2 === 0 ? 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700' : 'bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-600';
        
        headers.forEach((header, colIndex) => {
            const td = document.createElement('td');
            const value = getValueForField(inventory, header.field);
            td.textContent = formatValue(value, header.type, header.field);
            td.className = 'py-2 text-sm text-gray-800 dark:text-gray-200';
            // Remove padding classes and set inline styles for precise control
            td.style.paddingTop = '6px';
            td.style.paddingBottom = '6px';
            // Set specific width and padding for ID column (first column)
            if (colIndex === 0) {
                td.style.width = '40px';
                td.style.minWidth = '40px';
                td.style.maxWidth = '40px';
                td.style.paddingLeft = '8px';
                td.style.paddingRight = '2px';
            }
            // Other columns
            else {
                td.style.paddingLeft = '6px';
                td.style.paddingRight = '6px';
            }
            row.appendChild(td);
        });
        
        tableBody.appendChild(row);
    });

    // Update row count
    document.getElementById('reportRowCount').textContent = `${inventories.length} ${inventories.length === 1 ? 'registro' : 'registros'}`;
}

// Display verifications report with statistics
function displayVerificationsReport(data) {
    const verifications = Array.isArray(data) ? data : [];

    if (verifications.length === 0) {
        document.getElementById('reportEmptyState').classList.remove('hidden');
        document.getElementById('reportResultsSection').classList.add('hidden');
        return;
    }

    // Calculate statistics
    const totalVerifications = verifications.length;
    const verificationsWithEvidence = verifications.filter(v => v.photoUrl && v.photoUrl.trim() !== '').length;
    const verificationsWithoutEvidence = totalVerifications - verificationsWithEvidence;
    
    // Get unique items verified
    const uniqueItems = new Set(verifications.map(v => v.itemId).filter(id => id != null));
    const uniqueUsers = new Set(verifications.map(v => v.userId).filter(id => id != null));
    
    // Get verifications by date (last 30 days, last 7 days, today)
    const now = new Date();
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const verificationsLast30Days = verifications.filter(v => {
        if (!v.createdAt) return false;
        const date = new Date(v.createdAt);
        return date >= last30Days;
    }).length;
    
    const verificationsLast7Days = verifications.filter(v => {
        if (!v.createdAt) return false;
        const date = new Date(v.createdAt);
        return date >= last7Days;
    }).length;
    
    const verificationsToday = verifications.filter(v => {
        if (!v.createdAt) return false;
        const date = new Date(v.createdAt);
        return date >= today;
    }).length;

    // Generate statistics cards
    const statsContainer = document.getElementById('reportStats');
    statsContainer.innerHTML = `
        <div class="stat-card p-4 border border-gray-200 dark:border-gray-600 rounded-xl">
            <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Verificaciones</span>
                <i class="fas fa-clipboard-check text-blue-500"></i>
            </div>
            <div class="text-2xl font-bold text-gray-800 dark:text-gray-100">${totalVerifications}</div>
        </div>
        <div class="stat-card p-4 border border-gray-200 dark:border-gray-600 rounded-xl">
            <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-medium text-gray-600 dark:text-gray-400">Con Evidencia</span>
                <i class="fas fa-camera text-green-500"></i>
            </div>
            <div class="text-2xl font-bold text-gray-800 dark:text-gray-100">${verificationsWithEvidence}</div>
        </div>
        <div class="stat-card p-4 border border-gray-200 dark:border-gray-600 rounded-xl">
            <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-medium text-gray-600 dark:text-gray-400">Items Únicos</span>
                <i class="fas fa-box text-purple-500"></i>
            </div>
            <div class="text-2xl font-bold text-gray-800 dark:text-gray-100">${uniqueItems.size}</div>
        </div>
        <div class="stat-card p-4 border border-gray-200 dark:border-gray-600 rounded-xl">
            <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-medium text-gray-600 dark:text-gray-400">Verificaciones Hoy</span>
                <i class="fas fa-calendar-day text-orange-500"></i>
            </div>
            <div class="text-2xl font-bold text-gray-800 dark:text-gray-100">${verificationsToday}</div>
        </div>
    `;

    // Generate table
    const headers = getHeadersForReportType('verifications');
    const tableHeader = document.getElementById('reportTableHeader');
    const tableBody = document.getElementById('reportTableBody');

    // Clear existing content
    tableHeader.innerHTML = '';
    tableBody.innerHTML = '';

    // Create header row
    const headerRow = document.createElement('tr');
    headers.forEach((header, colIndex) => {
        const th = document.createElement('th');
        th.textContent = header.label;
        th.className = 'text-left text-xs font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap';
        // Set consistent padding for alignment - MUST match td padding
        th.style.padding = '8px 12px';
        th.style.margin = '0';
        th.style.boxSizing = 'border-box';
        th.style.verticalAlign = 'middle';
        // Set specific width for Placa Item column (first column now)
        if (colIndex === 0) {
            th.style.width = '120px';
            th.style.minWidth = '120px';
            th.style.maxWidth = '120px';
        }
        headerRow.appendChild(th);
    });
    tableHeader.appendChild(headerRow);

    // Create body rows
    verifications.forEach((verification, index) => {
        const row = document.createElement('tr');
        row.className = index % 2 === 0 ? 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700' : 'bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-600';
        
        headers.forEach((header, colIndex) => {
            const td = document.createElement('td');
            const value = getValueForField(verification, header.field);
            td.textContent = formatValue(value, header.type, header.field);
            td.className = 'text-sm text-gray-800 dark:text-gray-200';
            // Set consistent padding matching the header EXACTLY for perfect alignment
            td.style.padding = '6px 12px';
            td.style.margin = '0';
            td.style.boxSizing = 'border-box';
            td.style.verticalAlign = 'middle';
            // Set specific width for Placa Item column (first column now) - MUST match th
            if (colIndex === 0) {
                td.style.width = '120px';
                td.style.minWidth = '120px';
                td.style.maxWidth = '120px';
            }
            row.appendChild(td);
        });
        
        tableBody.appendChild(row);
    });

    // Update row count
    document.getElementById('reportRowCount').textContent = `${verifications.length} ${verifications.length === 1 ? 'registro' : 'registros'}`;
}

// Display loans report with statistics
function displayLoansReport(data) {
    console.log('displayLoansReport called with data:', data);
    const loans = Array.isArray(data) ? data : [];

    console.log('Processed loans array length:', loans.length);

    if (loans.length === 0) {
        console.log('No loans data, showing empty state');
        document.getElementById('reportEmptyState').classList.remove('hidden');
        document.getElementById('reportResultsSection').classList.add('hidden');
        return;
    }

    // Show results section and hide empty state
    document.getElementById('reportEmptyState').classList.add('hidden');
    document.getElementById('reportResultsSection').classList.remove('hidden');

    // Generate statistics
    generateStatistics(loans);

    // Generate table
    const headers = getHeadersForReportType('loans');
    console.log('Loans headers:', headers);
    const tableHeader = document.getElementById('reportTableHeader');
    const tableBody = document.getElementById('reportTableBody');

    if (!tableHeader || !tableBody) {
        console.error('Table header or body not found!');
        return;
    }

    // Clear existing content
    tableHeader.innerHTML = '';
    tableBody.innerHTML = '';

    // Create header row
    const headerRow = document.createElement('tr');
    headers.forEach((header, colIndex) => {
        const th = document.createElement('th');
        th.textContent = header.label;
        th.className = 'py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap';
        th.style.padding = '8px 12px';
        headerRow.appendChild(th);
    });
    tableHeader.appendChild(headerRow);

    // Create body rows
    loans.forEach((loan, index) => {
        const row = document.createElement('tr');
        row.className = index % 2 === 0 
            ? 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700' 
            : 'bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-600';
        
        headers.forEach((header) => {
            const td = document.createElement('td');
            const value = getValueForField(loan, header.field);
            td.textContent = formatValue(value, header.type, header.field);
            td.className = 'py-2 text-sm text-gray-800 dark:text-gray-200';
            td.style.padding = '6px 12px';
            row.appendChild(td);
        });
        
        tableBody.appendChild(row);
    });

    // Update row count
    const rowCountElement = document.getElementById('reportRowCount');
    if (rowCountElement) {
        rowCountElement.textContent = `${loans.length} ${loans.length === 1 ? 'registro' : 'registros'}`;
    }

    console.log('Loans report displayed successfully');
}

// Display items report with statistics
function displayItemsReport(data) {
    // Handle both object format {items, loans, transfers} and array format
    let items, loans, transfers;
    
    if (Array.isArray(data)) {
        // If data is an array, treat it as items only
        items = data;
        loans = [];
        transfers = [];
    } else if (data && typeof data === 'object') {
        // If data is an object, extract items, loans, and transfers
        items = data.items || [];
        loans = data.loans || [];
        transfers = data.transfers || [];
    } else {
        items = [];
        loans = [];
        transfers = [];
    }

    if (items.length === 0) {
        document.getElementById('reportEmptyState').classList.remove('hidden');
        document.getElementById('reportResultsSection').classList.add('hidden');
        return;
    }

    // Calculate statistics
    const totalValue = items.reduce((sum, item) => sum + (item.acquisitionValue || 0), 0);
    const totalItems = items.length;

    // Calculate items on loan (items with active loans - not returned)
    const itemsOnLoan = new Set();
    loans.forEach(loan => {
        if (!loan.returned && loan.itemId) {
            itemsOnLoan.add(loan.itemId);
        }
    });
    const totalItemsOnLoan = itemsOnLoan.size;

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
                name: item?.name || item?.licencePlateNumber || item?.productName || `Item ${itemId}`,
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
            name: item.name || item.licencePlateNumber || item.productName || `Item ${item.id}`,
            value: item.acquisitionValue
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

    // Generate statistics cards
    const statsContainer = document.getElementById('reportStats');
    statsContainer.innerHTML = `
        <div class="stat-card p-4 border border-gray-200 dark:border-gray-600 rounded-xl">
            <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-medium text-gray-600 dark:text-gray-400">Cantidad Total de Items</span>
                <i class="fas fa-box text-blue-500"></i>
            </div>
            <div class="text-2xl font-bold text-gray-800 dark:text-gray-100">${totalItems}</div>
        </div>
        <div class="stat-card p-4 border border-gray-200 dark:border-gray-600 rounded-xl">
            <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-medium text-gray-600 dark:text-gray-400">Valor Total de Items</span>
                <i class="fas fa-dollar-sign text-green-500"></i>
            </div>
            <div class="text-2xl font-bold text-gray-800 dark:text-gray-100">${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(totalValue)}</div>
        </div>
        <div class="stat-card p-4 border border-gray-200 dark:border-gray-600 rounded-xl">
            <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Items en Préstamo</span>
                <i class="fas fa-hand-holding text-purple-500"></i>
            </div>
            <div class="text-2xl font-bold text-gray-800 dark:text-gray-100">${totalItemsOnLoan}</div>
        </div>
        <div class="stat-card p-4 border border-gray-200 dark:border-gray-600 rounded-xl">
            <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-medium text-gray-600 dark:text-gray-400">Items Más Movidos</span>
                <i class="fas fa-exchange-alt text-orange-500"></i>
            </div>
            <div class="text-2xl font-bold text-gray-800 dark:text-gray-100">${mostMovedItems.length > 0 ? mostMovedItems[0].count : 0}</div>
            <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">Máximo de transferencias</div>
        </div>
    `;

    // Display summary tables
    const tableHeader = document.getElementById('reportTableHeader');
    const tableBody = document.getElementById('reportTableBody');
    
    // Create header
    tableHeader.innerHTML = '<tr><th class="px-4 py-3 text-left">#</th><th class="px-4 py-3 text-left">Nombre</th><th class="px-4 py-3 text-left">Información</th></tr>';
    
    // Create tables for top items
    const summaryHTML = `
        <tr>
            <td colspan="3" class="px-4 py-3 font-bold text-gray-800 dark:text-gray-100 bg-orange-50 dark:bg-orange-900/20">
                Items Más Movidos (por transferencias)
            </td>
        </tr>
        ${mostMovedItems.length > 0 ? mostMovedItems.map((item, idx) => `
            <tr class="${idx % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700/50'}">
                <td class="px-4 py-3">${idx + 1}</td>
                <td class="px-4 py-3">${(item.name || '').length > 40 ? (item.name || '').substring(0, 40) + '...' : (item.name || '')}</td>
                <td class="px-4 py-3 font-semibold text-orange-600 dark:text-orange-400">${item.count} transferencia${item.count !== 1 ? 's' : ''}</td>
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
                <td class="px-4 py-3">${(item.name || '').length > 40 ? (item.name || '').substring(0, 40) + '...' : (item.name || '')}</td>
                <td class="px-4 py-3 font-semibold text-green-600 dark:text-green-400">${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(item.value)}</td>
            </tr>
        `).join('') : '<tr><td colspan="3" class="px-4 py-3 text-center text-gray-500">No hay datos disponibles</td></tr>'}
    `;
    
    tableBody.innerHTML = summaryHTML;
    
    document.getElementById('reportRowCount').textContent = `Total: ${totalItems} items`;
    
    // Store data for PDF export
    currentReportData = {
        items: items,
        loans: loans,
        transfers: transfers,
        stats: {
            totalItems,
            totalValue,
            totalItemsOnLoan,
            mostMovedItems,
            mostExpensiveItems
        }
    };
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
        loans: [
            { field: 'id', label: 'ID', type: 'number' },
            { field: 'userName', label: 'Responsable', type: 'string' },
            { field: 'itemName', label: 'Item', type: 'string' },
            { field: 'loanDate', label: 'Fecha Préstamo', type: 'date' },
            { field: 'returnDate', label: 'Fecha Devolución', type: 'date' },
            { field: 'status', label: 'Estado', type: 'string' }
        ],
        verifications: [
            { field: 'itemLicencePlateNumber', label: 'Placa Item', type: 'string' },
            { field: 'userFullName', label: 'Verificado Por', type: 'string' },
            { field: 'userEmail', label: 'Email Verificador', type: 'string' },
            { field: 'createdAt', label: 'Fecha Verificación', type: 'date' },
            { field: 'photoUrl', label: 'Tiene Evidencia', type: 'string' }
        ],
        inventory: [
            { field: 'id', label: 'ID', type: 'number' },
            { field: 'name', label: 'Nombre', type: 'string' },
            { field: 'location', label: 'Ubicación', type: 'string' },
            { field: 'owner.fullName', label: 'Propietario', type: 'string' },
            { field: 'institutionName', label: 'Institución', type: 'string' },
            { field: 'quantityItems', label: 'Cantidad Items', type: 'number' },
            { field: 'totalPrice', label: 'Valor Total', type: 'currency' },
            { field: 'status', label: 'Estado', type: 'boolean' }
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
function formatValue(value, type, fieldName) {
    if (value === null || value === undefined) return '-';
    
    // Special handling for photoUrl field
    if (fieldName === 'photoUrl') {
        return (value && value.trim() !== '') ? 'Sí' : 'No';
    }
    
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
    } else if (currentReportType === 'loans') {
        const totalLoans = data.length;
        const returnedLoans = data.filter(loan => loan.returned === true || loan.returned === 'true').length;
        const activeLoans = totalLoans - returnedLoans;
        const returnPercent = totalLoans > 0 ? Math.round((returnedLoans / totalLoans) * 100) : 0;
        
        statsHTML = `
            <div class="stat-card p-4 border border-gray-200 dark:border-gray-600 rounded-xl">
                <div class="flex items-center justify-between mb-2">
                    <span class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Préstamos</span>
                    <i class="fas fa-hand-holding text-blue-500"></i>
                </div>
                <div class="text-2xl font-bold text-gray-800 dark:text-gray-100">${totalLoans}</div>
            </div>
            <div class="stat-card p-4 border border-gray-200 dark:border-gray-600 rounded-xl">
                <div class="flex items-center justify-between mb-2">
                    <span class="text-sm font-medium text-gray-600 dark:text-gray-400">Activos</span>
                    <i class="fas fa-clock text-orange-500"></i>
                </div>
                <div class="text-2xl font-bold text-gray-800 dark:text-gray-100">${activeLoans}</div>
            </div>
            <div class="stat-card p-4 border border-gray-200 dark:border-gray-600 rounded-xl">
                <div class="flex items-center justify-between mb-2">
                    <span class="text-sm font-medium text-gray-600 dark:text-gray-400">Devueltos</span>
                    <i class="fas fa-check-circle text-green-500"></i>
                </div>
                <div class="text-2xl font-bold text-gray-800 dark:text-gray-100">${returnedLoans}</div>
            </div>
            <div class="stat-card p-4 border border-gray-200 dark:border-gray-600 rounded-xl">
                <div class="flex items-center justify-between mb-2">
                    <span class="text-sm font-medium text-gray-600 dark:text-gray-400">Porcentaje Devuelto</span>
                    <i class="fas fa-percentage text-purple-500"></i>
                </div>
                <div class="text-2xl font-bold text-gray-800 dark:text-gray-100">${returnPercent}%</div>
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
    try {
        if (!currentReportData) {
            showReportErrorToast('Error', 'No hay datos para exportar');
            return;
        }
        
        // Check if it's an empty array
        if (Array.isArray(currentReportData) && currentReportData.length === 0) {
            showReportErrorToast('Error', 'No hay datos para exportar');
            return;
        }
        
        // Check if it's an items report object with empty items
        if (currentReportType === 'items' && typeof currentReportData === 'object' && !Array.isArray(currentReportData)) {
            const items = currentReportData.items || [];
            if (items.length === 0) {
                showReportErrorToast('Error', 'No hay datos para exportar');
                return;
            }
        }

        // Check if jsPDF is available
        if (!window.jspdf || !window.jspdf.jsPDF) {
            showReportErrorToast('Error', 'La librería PDF no está disponible. Por favor recargue la página.');
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Report type names
        const reportTypeNames = {
            items: 'Reporte de Items',
            loans: 'Reporte de Préstamos',
            verifications: 'Reporte de Verificaciones',
            inventory: 'Reporte de Inventarios',
            general: 'Reporte General'
        };

        // Logo removed - no logo in PDF

        // Enhanced Header with gradient effect
        const pageWidth = doc.internal.pageSize.getWidth();
        const headerHeight = 60;
        
        // Main header background with gradient effect (dark green)
        doc.setFillColor(0, 140, 0); // Darker SENA green
        doc.rect(0, 0, pageWidth, headerHeight, 'F');
    
        // Accent bar at bottom of header
        doc.setFillColor(0, 175, 0); // Brighter green
        doc.rect(0, headerHeight - 5, pageWidth, 5, 'F');
        
        // Logo removed - no logo in PDF
        
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
        
        // Get inventory name to determine box height
        let inventoryName = '';
        const inventoryId = currentReportFilters.inventoryId;
        if (inventoryId) {
            const inventorySelect = document.getElementById('inventorySelect');
            if (inventorySelect) {
                const selectedOption = inventorySelect.options[inventorySelect.selectedIndex];
                if (selectedOption && selectedOption.value === inventoryId) {
                    inventoryName = selectedOption.textContent;
                }
            }
        }
        const hasInventory = inventoryName && inventoryName !== 'Todos los inventarios' && inventoryName !== 'Todos los inventarios del centro';
        const boxHeight = hasInventory ? 65 : 58; // Extra height if inventory is shown
        
        // Background box for filters
        doc.setFillColor(248, 250, 252); // Light gray background
        doc.roundedRect(14, yPos - 10, pageWidth - 28, boxHeight, 4, 4, 'F');
        
        // Border for filters box
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.8);
        doc.roundedRect(14, yPos - 10, pageWidth - 28, boxHeight, 4, 4);
        
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 140, 0); // Green for title
        doc.text('INFORMACION DEL REPORTE', 20, yPos);
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(40, 40, 40);
        
        const regionalName = userRegionalName || 'Regional';
        const institutionName = userInstitutionName || 'Institución';
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
        
        // Add inventory name if specific inventory is selected
        if (inventoryName && inventoryName !== 'Todos los inventarios' && inventoryName !== 'Todos los inventarios del centro') {
            yPos += 7;
            doc.text('Inventario:', 20, yPos);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(60, 60, 60);
            doc.text(inventoryName.length > 35 ? inventoryName.substring(0, 35) + '...' : inventoryName, 20 + 45, yPos);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(40, 40, 40);
        }
        
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
        } else if (currentReportType === 'items') {
            // Items report with statistics
            const data = currentReportData;
            const items = data.items || [];
            const loans = data.loans || [];
            const transfers = data.transfers || [];
            
            // Calculate statistics
            const totalValue = items.reduce((sum, item) => sum + (item.acquisitionValue || 0), 0);
            const totalItems = items.length;
            
            // Calculate items on loan
            const itemsOnLoan = new Set();
            loans.forEach(loan => {
                if (!loan.returned && loan.itemId) {
                    itemsOnLoan.add(loan.itemId);
                }
            });
            const totalItemsOnLoan = itemsOnLoan.size;
            
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
                        name: item?.name || item?.licencePlateNumber || item?.productName || `Item ${itemId}`,
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
                    name: item.name || item.licencePlateNumber || item.productName || `Item ${item.id}`,
                    value: item.acquisitionValue
                }))
                .sort((a, b) => b.value - a.value)
                .slice(0, 5);
            
            // Enhanced Statistics section with cards
            yPos += 10;
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(0, 140, 0);
            doc.text('ESTADISTICAS DE ITEMS', 14, yPos);
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
            doc.text('CANTIDAD TOTAL DE ITEMS', 20, yPos + 8);
            doc.setFontSize(22);
            doc.setFont('helvetica', 'bold');
            doc.text(totalItems.toString(), 20, yPos + 22);
            
            // Card 2: Total Value
            doc.setFillColor(34, 197, 94); // Green
            doc.roundedRect(14 + cardWidth + cardSpacing, yPos, cardWidth, cardHeight, 4, 4, 'F');
            doc.setDrawColor(20, 150, 70);
            doc.setLineWidth(0.5);
            doc.roundedRect(14 + cardWidth + cardSpacing, yPos, cardWidth, cardHeight, 4, 4);
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text('VALOR TOTAL DE ITEMS', 20 + cardWidth + cardSpacing, yPos + 8);
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            const valueText = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(totalValue);
            if (valueText.length > 28) {
                const mid = Math.floor(valueText.length / 2);
                doc.text(valueText.substring(0, mid), 20 + cardWidth + cardSpacing, yPos + 20);
                doc.text(valueText.substring(mid), 20 + cardWidth + cardSpacing, yPos + 26);
            } else {
                doc.text(valueText, 20 + cardWidth + cardSpacing, yPos + 22);
            }
            
            yPos += cardHeight + cardSpacing;
            
            // Card 3: Items on Loan
            doc.setFillColor(147, 51, 234); // Purple
            doc.roundedRect(14, yPos, cardWidth, cardHeight, 4, 4, 'F');
            doc.setDrawColor(100, 30, 180);
            doc.setLineWidth(0.5);
            doc.roundedRect(14, yPos, cardWidth, cardHeight, 4, 4);
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text('TOTAL ITEMS EN PRESTAMO', 20, yPos + 8);
            doc.setFontSize(22);
            doc.setFont('helvetica', 'bold');
            doc.text(totalItemsOnLoan.toString(), 20, yPos + 22);
            
            // Card 4: Most Moved Items
            doc.setFillColor(249, 115, 22); // Orange
            doc.roundedRect(14 + cardWidth + cardSpacing, yPos, cardWidth, cardHeight, 4, 4, 'F');
            doc.setDrawColor(200, 80, 10);
            doc.setLineWidth(0.5);
            doc.roundedRect(14 + cardWidth + cardSpacing, yPos, cardWidth, cardHeight, 4, 4);
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text('ITEMS MAS MOVIDOS', 20 + cardWidth + cardSpacing, yPos + 8);
            doc.setFontSize(22);
            doc.setFont('helvetica', 'bold');
            doc.text(mostMovedItems.length > 0 ? mostMovedItems[0].count.toString() : '0', 20 + cardWidth + cardSpacing, yPos + 22);
            
            doc.setTextColor(0, 0, 0); // Reset to black
            yPos += cardHeight + 18;

            // Always add a new page for tables section
            doc.addPage();
            yPos = 20;

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
            doc.setTextColor(249, 115, 22);
            doc.text('ITEMS MAS MOVIDOS', 14, yPos);
            doc.setTextColor(0, 0, 0);
            yPos += 10;

            if (mostMovedItems.length > 0) {
                const movedTableData = [
                    ['#', 'Nombre del Item', 'Transferencias'],
                    ...mostMovedItems.map((item, idx) => [
                        (idx + 1).toString(),
                        (item.name || '').length > 35 ? (item.name || '').substring(0, 35) + '...' : (item.name || ''),
                        item.count.toString() + ' trans.'
                    ])
                ];

                doc.autoTable({
                    startY: yPos,
                    head: [movedTableData[0]],
                    body: movedTableData.slice(1),
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
                yPos = doc.lastAutoTable.finalY + 15;
            } else {
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
                        (item.name || '').length > 35 ? (item.name || '').substring(0, 35) + '...' : (item.name || ''),
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
            } else {
                doc.setFontSize(10);
                doc.setFont('helvetica', 'italic');
                doc.setTextColor(140, 140, 140);
                doc.text('No hay datos disponibles', 20, yPos);
                doc.setTextColor(0, 0, 0);
            }
        } else if (currentReportType === 'verifications') {
            // Verifications report with statistics
            const verifications = Array.isArray(currentReportData) ? currentReportData : [];
            
            // Calculate statistics
            const totalVerifications = verifications.length;
            const verificationsWithEvidence = verifications.filter(v => v.photoUrl && v.photoUrl.trim() !== '').length;
            const verificationsWithoutEvidence = totalVerifications - verificationsWithEvidence;
            
            // Get unique items verified
            const uniqueItems = new Set(verifications.map(v => v.itemId).filter(id => id != null));
            
            // Get verifications by date (today)
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const verificationsToday = verifications.filter(v => {
                if (!v.createdAt) return false;
                const date = new Date(v.createdAt);
                return date >= today;
            }).length;
            
            // Enhanced Statistics section with cards
            yPos += 10;
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(0, 140, 0);
            doc.text('ESTADISTICAS DE VERIFICACIONES', 14, yPos);
            doc.setTextColor(0, 0, 0);
            yPos += 14;

            // Statistics cards in 2x2 grid
            const cardWidth = (pageWidth - 42) / 2;
            const cardHeight = 32;
            const cardSpacing = 10;
            
            // Card 1: Total Verifications
            doc.setFillColor(59, 130, 246); // Blue
            doc.roundedRect(14, yPos, cardWidth, cardHeight, 4, 4, 'F');
            doc.setDrawColor(40, 100, 200);
            doc.setLineWidth(0.5);
            doc.roundedRect(14, yPos, cardWidth, cardHeight, 4, 4);
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text('TOTAL VERIFICACIONES', 20, yPos + 8);
            doc.setFontSize(22);
            doc.setFont('helvetica', 'bold');
            doc.text(totalVerifications.toString(), 20, yPos + 22);
            
            // Card 2: With Evidence
            doc.setFillColor(34, 197, 94); // Green
            doc.roundedRect(14 + cardWidth + cardSpacing, yPos, cardWidth, cardHeight, 4, 4, 'F');
            doc.setDrawColor(20, 150, 70);
            doc.setLineWidth(0.5);
            doc.roundedRect(14 + cardWidth + cardSpacing, yPos, cardWidth, cardHeight, 4, 4);
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text('CON EVIDENCIA', 20 + cardWidth + cardSpacing, yPos + 8);
            doc.setFontSize(22);
            doc.setFont('helvetica', 'bold');
            doc.text(verificationsWithEvidence.toString(), 20 + cardWidth + cardSpacing, yPos + 22);
            
            yPos += cardHeight + cardSpacing;
            
            // Card 3: Unique Items
            doc.setFillColor(147, 51, 234); // Purple
            doc.roundedRect(14, yPos, cardWidth, cardHeight, 4, 4, 'F');
            doc.setDrawColor(100, 30, 180);
            doc.setLineWidth(0.5);
            doc.roundedRect(14, yPos, cardWidth, cardHeight, 4, 4);
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text('ITEMS UNICOS', 20, yPos + 8);
            doc.setFontSize(22);
            doc.setFont('helvetica', 'bold');
            doc.text(uniqueItems.size.toString(), 20, yPos + 22);
            
            // Card 4: Verifications Today
            doc.setFillColor(249, 115, 22); // Orange
            doc.roundedRect(14 + cardWidth + cardSpacing, yPos, cardWidth, cardHeight, 4, 4, 'F');
            doc.setDrawColor(200, 80, 10);
            doc.setLineWidth(0.5);
            doc.roundedRect(14 + cardWidth + cardSpacing, yPos, cardWidth, cardHeight, 4, 4);
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text('VERIFICACIONES HOY', 20 + cardWidth + cardSpacing, yPos + 8);
            doc.setFontSize(22);
            doc.setFont('helvetica', 'bold');
            doc.text(verificationsToday.toString(), 20 + cardWidth + cardSpacing, yPos + 22);
            
            doc.setTextColor(0, 0, 0); // Reset to black
            yPos += cardHeight + 18;

            // Check if we need a new page for table
            if (yPos > doc.internal.pageSize.getHeight() - 50) {
                doc.addPage();
                yPos = 20;
            }

            // Enhanced Table section
            yPos += 10;
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(0, 140, 0);
            doc.text('DETALLE DE REGISTROS', 14, yPos);
            doc.setTextColor(0, 0, 0);
            yPos += 12;

            const headers = getHeadersForReportType('verifications');
            const tableData = verifications.map(item => 
                headers.map(header => formatValue(getValueForField(item, header.field), header.type, header.field))
            );

            if (tableData.length > 0) {
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
            } else {
                doc.setFontSize(10);
                doc.setFont('helvetica', 'italic');
                doc.setTextColor(140, 140, 140);
                doc.text('No hay datos disponibles', 20, yPos);
                doc.setTextColor(0, 0, 0);
            }
        } else if (currentReportType === 'loans') {
            // Loans report with statistics
            const loans = Array.isArray(currentReportData) ? currentReportData : [];
            
            // Calculate statistics
            const totalLoans = loans.length;
            const returnedLoans = loans.filter(loan => loan.returned === true || loan.returned === 'true').length;
            const activeLoans = totalLoans - returnedLoans;
            const returnPercent = totalLoans > 0 ? Math.round((returnedLoans / totalLoans) * 100) : 0;
            
            // Enhanced Statistics section with cards
            yPos += 10;
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(0, 140, 0);
            doc.text('ESTADISTICAS DE PRESTAMOS', 14, yPos);
            doc.setTextColor(0, 0, 0);
            yPos += 14;

            // Statistics cards in 2x2 grid
            const cardWidth = (pageWidth - 42) / 2;
            const cardHeight = 32;
            const cardSpacing = 10;
            
            // Card 1: Total Loans
            doc.setFillColor(59, 130, 246); // Blue
            doc.roundedRect(14, yPos, cardWidth, cardHeight, 4, 4, 'F');
            doc.setDrawColor(40, 100, 200);
            doc.setLineWidth(0.5);
            doc.roundedRect(14, yPos, cardWidth, cardHeight, 4, 4);
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text('TOTAL PRESTAMOS', 20, yPos + 8);
            doc.setFontSize(22);
            doc.setFont('helvetica', 'bold');
            doc.text(totalLoans.toString(), 20, yPos + 22);
            
            // Card 2: Active Loans
            doc.setFillColor(249, 115, 22); // Orange
            doc.roundedRect(14 + cardWidth + cardSpacing, yPos, cardWidth, cardHeight, 4, 4, 'F');
            doc.setDrawColor(200, 80, 10);
            doc.setLineWidth(0.5);
            doc.roundedRect(14 + cardWidth + cardSpacing, yPos, cardWidth, cardHeight, 4, 4);
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text('PRESTAMOS ACTIVOS', 20 + cardWidth + cardSpacing, yPos + 8);
            doc.setFontSize(22);
            doc.setFont('helvetica', 'bold');
            doc.text(activeLoans.toString(), 20 + cardWidth + cardSpacing, yPos + 22);
            
            yPos += cardHeight + cardSpacing;
            
            // Card 3: Returned Loans
            doc.setFillColor(34, 197, 94); // Green
            doc.roundedRect(14, yPos, cardWidth, cardHeight, 4, 4, 'F');
            doc.setDrawColor(20, 150, 70);
            doc.setLineWidth(0.5);
            doc.roundedRect(14, yPos, cardWidth, cardHeight, 4, 4);
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text('DEVUELTOS', 20, yPos + 8);
            doc.setFontSize(22);
            doc.setFont('helvetica', 'bold');
            doc.text(returnedLoans.toString(), 20, yPos + 22);
            
            // Card 4: Return Percentage
            doc.setFillColor(147, 51, 234); // Purple
            doc.roundedRect(14 + cardWidth + cardSpacing, yPos, cardWidth, cardHeight, 4, 4, 'F');
            doc.setDrawColor(100, 30, 180);
            doc.setLineWidth(0.5);
            doc.roundedRect(14 + cardWidth + cardSpacing, yPos, cardWidth, cardHeight, 4, 4);
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text('PORCENTAJE DEVUELTO', 20 + cardWidth + cardSpacing, yPos + 8);
            doc.setFontSize(22);
            doc.setFont('helvetica', 'bold');
            doc.text(returnPercent + '%', 20 + cardWidth + cardSpacing, yPos + 22);
            
            doc.setTextColor(0, 0, 0); // Reset to black
            yPos += cardHeight + 18;

            // Check if we need a new page for table
            if (yPos > doc.internal.pageSize.getHeight() - 50) {
                doc.addPage();
                yPos = 20;
            }

            // Enhanced Table section
            yPos += 10;
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(0, 140, 0);
            doc.text('DETALLE DE PRESTAMOS', 14, yPos);
            doc.setTextColor(0, 0, 0);
            yPos += 12;

            const headers = getHeadersForReportType('loans');
            const tableData = loans.map(item => 
                headers.map(header => formatValue(getValueForField(item, header.field), header.type, header.field))
            );

            if (tableData.length > 0) {
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
            } else {
                doc.setFontSize(10);
                doc.setFont('helvetica', 'italic');
                doc.setTextColor(140, 140, 140);
                doc.text('No hay datos disponibles', 20, yPos);
                doc.setTextColor(0, 0, 0);
            }
        } else {
            // Enhanced Table report for other types
            const headers = getHeadersForReportType(currentReportType);
            const tableData = Array.isArray(currentReportData) ? currentReportData.map(item => 
                headers.map(header => formatValue(getValueForField(item, header.field), header.type, header.field))
            ) : [];

            // Section title
            yPos += 10; // Add space before the title
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(0, 140, 0);
            doc.text('DETALLE DE REGISTROS', 14, yPos);
            doc.setTextColor(0, 0, 0);
            yPos += 12;

            if (tableData.length > 0) {
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
    } catch (error) {
        console.error('Error exporting to PDF:', error);
        showReportErrorToast('Error', 'Error al exportar el PDF: ' + (error.message || 'Error desconocido'));
    }
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

