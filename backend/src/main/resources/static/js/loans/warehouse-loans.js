// Warehouse Loans - Simplified version without regional/institution
// Data storage
let loansData = {
    loans: [],
    filteredLoans: [],
    inventories: [],
    currentPage: 1,
    itemsPerPage: 6,
    searchTerm: '',
    selectedInventory: 'all',
    isLoading: false
};

// Immediately override itemsPerPage in window.loansData if it exists (from loans-data.js)
// This ensures warehouse always uses 6 items per page
if (typeof window !== 'undefined' && window.loansData) {
    window.loansData.itemsPerPage = 6;
    window.loansData.currentPage = 1;
}

let userInstitutionId = null;
let userRegionalId = null;

// Loan form data
const loanFormData = {
    inventories: [],
    items: [],
    users: [],
    selectedInventory: null,
    selectedItem: null,
    selectedResponsible: null
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('Warehouse Loans page DOMContentLoaded - Initializing...');
    // Ensure selectedInventory is set to 'all' by default
    loansData.selectedInventory = 'all';
    
    // Override itemsPerPage to 6 for warehouse (loans-data.js sets it to 10)
    if (window.loansData) {
        window.loansData.itemsPerPage = 6;
    }
    loansData.itemsPerPage = 6;
    
    loadUserInfo();
    initializeCustomSelects();
    // Don't load loans automatically - wait for user to select and confirm
    setTimeout(() => {
        loadInventories();
        showInitialState();
    }, 100);
});

// Load user info to get institution
async function loadUserInfo() {
    try {
        const token = localStorage.getItem('jwt');
        if (!token) {
            throw new Error('No authentication token found');
        }

        const headers = { 'Content-Type': 'application/json' };
        headers['Authorization'] = `Bearer ${token}`;

        const userResponse = await fetch('/api/v1/users/me', {
            method: 'GET',
            headers: headers
        });

        if (!userResponse.ok) {
            throw new Error('Failed to load user info');
        }

        const userData = await userResponse.json();
        const userInstitutionName = userData.institution;

        // Get all institutions to find the one matching the user's institution
        const institutionsResponse = await fetch('/api/v1/institutions', {
            method: 'GET',
            headers: headers
        });

        if (institutionsResponse.ok) {
            const institutions = await institutionsResponse.json();
            const institution = institutions.find(inst => 
                inst.name === userInstitutionName || 
                inst.nombre === userInstitutionName
            );
            
            if (institution) {
                userInstitutionId = institution.institutionId || institution.id;
                userRegionalId = institution.regionalId || institution.regional?.id;
                console.log('Found institution:', institution.name, 'ID:', userInstitutionId, 'Regional ID:', userRegionalId);
            }
        }
    } catch (error) {
        console.error('Error loading user info:', error);
    }
}

// Show initial state (empty, waiting for user selection)
function showInitialState() {
    const container = document.getElementById('loansTableContainer');
    if (!container) return;
    
    container.innerHTML = `
        <div class="text-center py-12">
            <div class="w-20 h-20 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <i class="fas fa-filter text-purple-600 dark:text-purple-400 text-3xl"></i>
            </div>
            <h3 class="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">Seleccione un inventario</h3>
            <p class="text-gray-600 dark:text-gray-400 text-center max-w-md mx-auto">
                Por favor seleccione un inventario del filtro y haga clic en "Buscar Préstamos" para ver los préstamos
            </p>
        </div>
    `;
    
    // Clear stats
    const statsContainer = document.getElementById('loansStatsContainer');
    if (statsContainer) {
        statsContainer.innerHTML = '';
    }
    
    // Clear pagination
    const paginationContainer = document.getElementById('paginationContainer');
    if (paginationContainer) {
        paginationContainer.innerHTML = '';
    }
}

// Handle load loans button click
async function handleLoadLoans() {
    const selectedInventoryId = document.getElementById('selectedInventoryId').value;
    
    if (!selectedInventoryId || selectedInventoryId === '') {
        if (window.showErrorToast) {
            window.showErrorToast('Error', 'Por favor seleccione un inventario');
        }
        return;
    }
    
    // Set the selected inventory
    loansData.selectedInventory = selectedInventoryId === 'all' ? 'all' : selectedInventoryId;
    
    // Load loans
    await loadLoansData();
}

// Load loans data
async function loadLoansData() {
    if (loansData.isLoading) {
        console.log('Already loading, skipping...');
        return;
    }

    console.log('Starting loadLoansData');
    loansData.isLoading = true;
    showLoadingState();

    try {
        await loadLoans();
    } catch (error) {
        console.error('Error loading loans data:', error);
        showErrorState('Error al cargar los datos de préstamos: ' + error.message);
        loansData.loans = [];
        loansData.filteredLoans = [];
        updateLoansUI();
    } finally {
        loansData.isLoading = false;
        hideLoadingState();
    }
}

// Load inventories for the user's institution
async function loadInventories() {
    if (!userInstitutionId) {
        await loadUserInfo();
    }
    
    if (!userInstitutionId) {
        console.error('No institution ID available');
        return;
    }

    try {
        const token = localStorage.getItem('jwt');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(`/api/v1/inventory/institutionAdminInventories/${userInstitutionId}?page=0&size=1000`, {
            method: 'GET',
            headers: headers
        });

        if (response.ok) {
            const data = await response.json();
            loansData.inventories = data.content || [];
            populateInventorySelect();
        } else {
            console.error('Failed to load inventories');
        }
    } catch (error) {
        console.error('Error loading inventories:', error);
    }
}

// Load loans
async function loadLoans() {
    try {
        const token = localStorage.getItem('jwt');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const params = new URLSearchParams();
        // Always filter by institution to get all loans from user's institution
        if (userInstitutionId) {
            params.append('institutionId', userInstitutionId.toString());
        }
        // Only add inventoryId filter if a specific inventory is selected (not 'all')
        if (loansData.selectedInventory && loansData.selectedInventory !== 'all' && loansData.selectedInventory !== null) {
            params.append('inventoryId', loansData.selectedInventory);
        }
        // If selectedInventory is 'all' or not set, don't add inventoryId - this loads all inventories

        let endpoint = '/api/v1/loan/filter';
        const paramsString = params.toString();
        if (paramsString) {
            endpoint += `?${paramsString}`;
        }
        
        console.log('Loading loans from:', endpoint);
        console.log('Selected inventory:', loansData.selectedInventory);
        const response = await fetch(endpoint, {
            method: 'GET',
            headers: headers
        });

        if (response.ok) {
            const loans = await response.json();
            loansData.loans = Array.isArray(loans) ? loans : [];
            console.log('Loaded loans:', loansData.loans.length, 'from all inventories');
            
            loansData.filteredLoans = [...loansData.loans];
            loansData.currentPage = 1; // Reset to first page when loading new data
            filterLoans();
        } else {
            const errorText = await response.text();
            console.error('Failed to load loans:', response.status, errorText);
            loansData.loans = [];
            loansData.filteredLoans = [];
            throw new Error(`Failed to load loans: ${response.status} - ${errorText}`);
        }
    } catch (error) {
        console.error('Error loading loans:', error);
        throw error;
    }
}

// Wrapper function for loadLoans that also updates UI
async function loadLoansWrapper() {
    await loadLoansData();
}

// Populate inventory select
function populateInventorySelect() {
    const options = document.getElementById('inventoryOptions');
    if (!options) return;

    options.innerHTML = '';
    
    // Add "All" option
    const allOption = document.createElement('div');
    allOption.className = 'custom-select-option';
    allOption.setAttribute('data-value', 'all');
    allOption.textContent = 'Todos los inventarios';
    allOption.onclick = () => {
        document.getElementById('selectedInventoryId').value = 'all';
        document.querySelector('#inventorySelect .custom-select-text').textContent = 'Todos los inventarios';
        document.getElementById('inventorySelect').classList.remove('open');
        // Don't load loans automatically - user must click button
    };
    options.appendChild(allOption);
    
    loansData.inventories.forEach(inventory => {
        const option = document.createElement('div');
        option.className = 'custom-select-option';
        option.setAttribute('data-value', inventory.id);
        option.textContent = inventory.name;
        option.onclick = () => {
            document.getElementById('selectedInventoryId').value = inventory.id;
            document.querySelector('#inventorySelect .custom-select-text').textContent = inventory.name;
            document.getElementById('inventorySelect').classList.remove('open');
            // Don't load loans automatically - user must click button
        };
        options.appendChild(option);
    });
}

// Filter loans
function filterLoans() {
    console.log('filterLoans called');
    
    if (!loansData.loans || !Array.isArray(loansData.loans) || loansData.loans.length === 0) {
        loansData.filteredLoans = [];
        updateLoansUI();
        return;
    }

    let filtered = [...loansData.loans];

    // Filter by search term
    if (loansData.searchTerm && loansData.searchTerm.trim() !== '') {
        const searchLower = loansData.searchTerm.toLowerCase().trim();
        filtered = filtered.filter(loan => {
            let matches = false;
            if (loan.responsibleName && loan.responsibleName.toLowerCase().includes(searchLower)) {
                matches = true;
            }
            if (loan.lenderName && loan.lenderName.toLowerCase().includes(searchLower)) {
                matches = true;
            }
            if (loan.itemId && loan.itemId.toString().includes(searchLower)) {
                matches = true;
            }
            return matches;
        });
    }

    loansData.filteredLoans = filtered;
    loansData.currentPage = 1;
    updateLoansUI();
}

// Update loans UI
function updateLoansUI() {
    updateLoansStats();
    updateLoansTable();
    updatePagination();
}

// Update loans stats
function updateLoansStats() {
    const statsContainer = document.getElementById('loansStatsContainer');
    if (!statsContainer) return;

    const totalLoans = loansData.loans.length;
    const activeLoans = loansData.loans.filter(loan => !loan.returned).length;
    const returnedLoans = loansData.loans.filter(loan => loan.returned === true).length;
    const filteredLoans = loansData.filteredLoans.length;

    statsContainer.innerHTML = `
        <div class="stat-card bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-800">
            <div class="flex items-start justify-between mb-3">
                <div>
                    <p class="text-sm text-blue-600 dark:text-blue-400 font-medium mb-1">Total Préstamos</p>
                    <p class="text-3xl font-bold text-blue-800 dark:text-blue-300">${totalLoans}</p>
                </div>
                <div class="w-12 h-12 bg-blue-500 dark:bg-blue-600 rounded-full flex items-center justify-center">
                    <i class="fas fa-list text-white text-xl"></i>
                </div>
            </div>
            <p class="text-xs text-blue-600 dark:text-blue-400">Todos los préstamos registrados</p>
        </div>

        <div class="stat-card bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border border-yellow-200 dark:border-yellow-800">
            <div class="flex items-start justify-between mb-3">
                <div>
                    <p class="text-sm text-yellow-600 dark:text-yellow-400 font-medium mb-1">Préstamos Activos</p>
                    <p class="text-3xl font-bold text-yellow-800 dark:text-yellow-300">${activeLoans}</p>
                </div>
                <div class="w-12 h-12 bg-yellow-500 dark:bg-yellow-600 rounded-full flex items-center justify-center">
                    <i class="fas fa-clock text-white text-xl"></i>
                </div>
            </div>
            <p class="text-xs text-yellow-600 dark:text-yellow-400">Items actualmente prestados</p>
        </div>

        <div class="stat-card bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border border-green-200 dark:border-green-800">
            <div class="flex items-start justify-between mb-3">
                <div>
                    <p class="text-sm text-green-600 dark:text-green-400 font-medium mb-1">Préstamos Devueltos</p>
                    <p class="text-3xl font-bold text-green-800 dark:text-green-300">${returnedLoans}</p>
                </div>
                <div class="w-12 h-12 bg-green-500 dark:bg-green-600 rounded-full flex items-center justify-center">
                    <i class="fas fa-check-circle text-white text-xl"></i>
                </div>
            </div>
            <p class="text-xs text-green-600 dark:text-green-400">Items devueltos</p>
        </div>

        <div class="stat-card bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border border-purple-200 dark:border-purple-800">
            <div class="flex items-start justify-between mb-3">
                <div>
                    <p class="text-sm text-purple-600 dark:text-purple-400 font-medium mb-1">Filtrados</p>
                    <p class="text-3xl font-bold text-purple-800 dark:text-purple-300">${filteredLoans}</p>
                </div>
                <div class="w-12 h-12 bg-purple-500 dark:bg-purple-600 rounded-full flex items-center justify-center">
                    <i class="fas fa-filter text-white text-xl"></i>
                </div>
            </div>
            <p class="text-xs text-purple-600 dark:text-purple-400">Préstamos mostrados</p>
        </div>
    `;
}

// Update loans table
function updateLoansTable() {
    const container = document.getElementById('loansTableContainer');
    if (!container) {
        console.warn('loansTableContainer not found');
        return;
    }

    if (loansData.isLoading) {
        container.innerHTML = `
            <div class="flex items-center justify-center py-12">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00AF00]"></div>
            </div>
        `;
        return;
    }

    if (!loansData.filteredLoans || loansData.filteredLoans.length === 0) {
        container.innerHTML = `
            <div class="text-center py-12">
                <i class="fas fa-inbox text-4xl text-gray-400 dark:text-gray-500 mb-4"></i>
                <p class="text-gray-600 dark:text-gray-400 text-lg">No se encontraron préstamos</p>
                <p class="text-sm text-gray-500 dark:text-gray-500 mt-2">Intenta ajustar los filtros de búsqueda</p>
            </div>
        `;
        return;
    }

    // Calculate pagination indices - ensure currentPage is valid
    if (!loansData.currentPage || loansData.currentPage < 1) {
        loansData.currentPage = 1;
    }
    
    const startIndex = (loansData.currentPage - 1) * loansData.itemsPerPage;
    const endIndex = startIndex + loansData.itemsPerPage;
    
    // Slice the filtered loans to show only items for current page
    let currentLoans = loansData.filteredLoans.slice(startIndex, endIndex);
    
    // Safety check: ensure we never show more than itemsPerPage items
    if (currentLoans.length > loansData.itemsPerPage) {
        currentLoans = currentLoans.slice(0, loansData.itemsPerPage);
    }

    let tableHtml = `
        <div class="mb-4">
            <h2 class="text-xl font-bold text-gray-800 dark:text-gray-100">Préstamos del Sistema</h2>
        </div>
        <div class="overflow-x-auto">
            <table class="w-full">
                <thead>
                    <tr class="border-b border-gray-200 dark:border-gray-700">
                        <th class="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">ID</th>
                        <th class="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Item ID</th>
                        <th class="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Responsable</th>
                        <th class="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Prestador</th>
                        <th class="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Fecha Préstamo</th>
                        <th class="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Fecha Devolución</th>
                        <th class="text-center py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Estado</th>
                        <th class="text-center py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Acciones</th>
                    </tr>
                </thead>
                <tbody>
    `;

    currentLoans.forEach(loan => {
        const lendDate = loan.lendAt ? new Date(loan.lendAt).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }) : 'N/A';

        const returnDate = loan.returnAt ? new Date(loan.returnAt).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }) : '-';

        const statusText = loan.returned === true ? 'Devuelto' : 'Prestado';
        const statusColor = loan.returned === true 
            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' 
            : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400';

        const returnButton = !loan.returned ? `
            <button onclick="handleReturnItemClick(${loan.id})" 
                class="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1">
                <i class="fas fa-undo"></i>
                <span>Devolver</span>
            </button>
        ` : `
            <span class="text-xs text-gray-500 dark:text-gray-400">Devuelto</span>
        `;

        tableHtml += `
            <tr class="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <td class="py-3 px-4 text-sm text-gray-800 dark:text-gray-200">${loan.id || 'N/A'}</td>
                <td class="py-3 px-4 text-sm text-gray-800 dark:text-gray-200">${loan.itemId || 'N/A'}</td>
                <td class="py-3 px-4 text-sm text-gray-800 dark:text-gray-200">${loan.responsibleName || 'N/A'}</td>
                <td class="py-3 px-4 text-sm text-gray-800 dark:text-gray-200">${loan.lenderName || 'N/A'}</td>
                <td class="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">${lendDate}</td>
                <td class="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">${returnDate}</td>
                <td class="py-3 px-4 text-center">
                    <span class="px-3 py-1 rounded-full text-xs font-semibold ${statusColor}">
                        ${statusText}
                    </span>
                </td>
                <td class="py-3 px-4 text-center">
                    ${returnButton}
                </td>
            </tr>
        `;
    });

    tableHtml += `
                </tbody>
            </table>
        </div>
    `;

    container.innerHTML = tableHtml;
}

// Update pagination
function updatePagination() {
    const container = document.getElementById('paginationContainer');
    if (!container) return;

    const totalPages = Math.ceil(loansData.filteredLoans.length / loansData.itemsPerPage);
    const currentPage = loansData.currentPage;
    const totalLoans = loansData.filteredLoans.length;

    // Calculate items being shown on current page
    // For page 1 with 6 items per page: startItem = 1, endItem = 6
    // For page 2 with 6 items per page and 7 total: startItem = 7, endItem = 7
    const startItem = totalLoans > 0 ? (currentPage - 1) * loansData.itemsPerPage + 1 : 0;
    const endItem = Math.min(currentPage * loansData.itemsPerPage, totalLoans);
    
    let paginationHtml = `
        <div class="text-sm text-gray-600 dark:text-gray-400">
            Mostrando ${startItem}-${endItem} de ${totalLoans} préstamo(s)
        </div>
        <div class="flex items-center gap-2 ml-auto">
    `;

    if (totalPages > 0) {
        // Previous button
        paginationHtml += `
            <button onclick="changePage(${currentPage - 1})" 
                ${currentPage === 1 ? 'disabled' : ''}
                class="px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                <i class="fas fa-chevron-left"></i>
            </button>
        `;

        // Page numbers - show max 5 pages
        const maxVisiblePages = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            paginationHtml += `
                <button onclick="changePage(${i})" 
                    class="px-3 py-2 border ${
                        currentPage === i
                            ? 'bg-[#00AF00] text-white border-[#00AF00]'
                            : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
                    } rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    ${i}
                </button>
            `;
        }

        // Next button
        paginationHtml += `
            <button onclick="changePage(${currentPage + 1})" 
                ${currentPage === totalPages ? 'disabled' : ''}
                class="px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                <i class="fas fa-chevron-right"></i>
            </button>
        `;
    }

    paginationHtml += `</div>`;
    container.innerHTML = paginationHtml;
}

// Change page
function changePage(page) {
    if (page >= 1 && page <= Math.ceil(loansData.filteredLoans.length / loansData.itemsPerPage)) {
        loansData.currentPage = page;
        updateLoansTable();
        updatePagination();
    }
}

// Initialize loan form
async function initializeLoanForm() {
    try {
        await loadInventoriesForLoan();
        await loadUsersForLoan();
    } catch (error) {
        console.error('Error initializing loan form:', error);
        if (window.showErrorToast) {
            window.showErrorToast('Error', 'Error al inicializar el formulario de préstamos');
        }
    }
}

// Load inventories for loan form
async function loadInventoriesForLoan() {
    if (!userInstitutionId) {
        await loadUserInfo();
    }
    
    if (!userInstitutionId) {
        console.error('No institution ID available');
        return;
    }

    try {
        const token = localStorage.getItem('jwt');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(`/api/v1/inventory/institutionAdminInventories/${userInstitutionId}?page=0&size=1000`, {
            method: 'GET',
            headers: headers
        });

        if (response.ok) {
            const data = await response.json();
            loanFormData.inventories = data.content || [];
            populateInventorySelectForLoan();
        } else {
            console.error('Failed to load inventories');
        }
    } catch (error) {
        console.error('Error loading inventories:', error);
    }
}

// Load items based on inventory
async function loadItemsForLoan(inventoryId) {
    try {
        if (!inventoryId || inventoryId === 'all') {
            loanFormData.items = [];
            populateItemSelectForLoan();
            return;
        }

        const token = localStorage.getItem('jwt');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(`/api/v1/items/inventory/${inventoryId}?page=0&size=1000`, {
            method: 'GET',
            headers: headers
        });

        if (response.ok) {
            const data = await response.json();
            loanFormData.items = data.content || data || [];
            populateItemSelectForLoan();
        } else {
            console.error('Failed to load items');
            loanFormData.items = [];
            populateItemSelectForLoan();
        }
    } catch (error) {
        console.error('Error loading items:', error);
        loanFormData.items = [];
        populateItemSelectForLoan();
    }
}

// Load users for responsible selection
async function loadUsersForLoan() {
    try {
        const token = localStorage.getItem('jwt');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch('/api/v1/users?page=0&size=1000', {
            method: 'GET',
            headers: headers
        });

        if (response.ok) {
            const data = await response.json();
            loanFormData.users = Array.isArray(data) ? data : (data.content || data.users || []);
            populateResponsibleSelectForLoan();
        } else {
            console.error('Failed to load users');
        }
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

// Populate inventory select for loan form
function populateInventorySelectForLoan() {
    const select = document.getElementById('loanInventorySelect');
    if (!select) return;

    const optionsContainer = select.querySelector('.custom-select-options');
    if (!optionsContainer) return;
    
    optionsContainer.innerHTML = '';
    
    loanFormData.inventories.forEach(inventory => {
        const option = document.createElement('div');
        option.className = 'custom-select-option';
        option.setAttribute('data-value', inventory.id);
        option.textContent = inventory.name;
        option.onclick = async () => {
            document.getElementById('loanSelectedInventoryId').value = inventory.id;
            document.querySelector('#loanInventorySelect .custom-select-text').textContent = inventory.name;
            document.getElementById('loanInventorySelect').classList.remove('open');
            loanFormData.selectedInventory = inventory.id;
            
            // Reset item select
            loanFormData.selectedItem = null;
            document.getElementById('loanSelectedItemId').value = '';
            document.querySelector('#loanItemSelect .custom-select-text').textContent = 'Seleccione un item';
            
            await loadItemsForLoan(inventory.id);
        };
        optionsContainer.appendChild(option);
    });
}

// Populate item select
function populateItemSelectForLoan() {
    const select = document.getElementById('loanItemSelect');
    if (!select) return;

    const optionsContainer = select.querySelector('.custom-select-options');
    if (!optionsContainer) return;
    
    optionsContainer.innerHTML = '';
    
    if (loanFormData.items.length === 0) {
        const noItemsOption = document.createElement('div');
        noItemsOption.className = 'custom-select-option text-gray-500';
        noItemsOption.textContent = 'No hay items disponibles';
        noItemsOption.style.cursor = 'not-allowed';
        optionsContainer.appendChild(noItemsOption);
        return;
    }
    
    loanFormData.items.forEach(item => {
        const option = document.createElement('div');
        option.className = 'custom-select-option';
        option.setAttribute('data-value', item.id);
        const itemText = item.productName || item.name || `Item #${item.id}`;
        const itemCode = item.code || item.licensePlate || '';
        option.textContent = itemCode ? `${itemText} (${itemCode})` : itemText;
        option.onclick = () => {
            document.getElementById('loanSelectedItemId').value = item.id;
            document.querySelector('#loanItemSelect .custom-select-text').textContent = itemCode ? `${itemText} (${itemCode})` : itemText;
            document.getElementById('loanItemSelect').classList.remove('open');
            loanFormData.selectedItem = item.id;
        };
        optionsContainer.appendChild(option);
    });
}

// Populate responsible select
function populateResponsibleSelectForLoan() {
    const select = document.getElementById('loanResponsibleSelect');
    if (!select) return;

    const optionsContainer = select.querySelector('.custom-select-options');
    if (!optionsContainer) return;
    
    optionsContainer.innerHTML = '';
    
    loanFormData.users.forEach(user => {
        const option = document.createElement('div');
        option.className = 'custom-select-option';
        option.setAttribute('data-value', user.id);
        option.textContent = user.fullName || user.name || `Usuario #${user.id}`;
        option.onclick = () => {
            document.getElementById('loanSelectedResponsibleId').value = user.id;
            document.querySelector('#loanResponsibleSelect .custom-select-text').textContent = user.fullName || user.name || `Usuario #${user.id}`;
            document.getElementById('loanResponsibleSelect').classList.remove('open');
            loanFormData.selectedResponsible = user.id;
        };
        optionsContainer.appendChild(option);
    });
}

// Handle lending an item
async function handleLendItem() {
    const itemId = document.getElementById('loanSelectedItemId').value;
    const responsibleId = document.getElementById('loanSelectedResponsibleId').value;
    const details = document.getElementById('loanDetails').value || '';

    // Validation
    if (!itemId) {
        if (window.showErrorToast) {
            window.showErrorToast('Error', 'Por favor seleccione un item');
        }
        return;
    }

    if (!responsibleId) {
        if (window.showErrorToast) {
            window.showErrorToast('Error', 'Por favor seleccione un responsable');
        }
        return;
    }

    try {
        const token = localStorage.getItem('jwt');
        if (!token) {
            if (window.showErrorToast) {
                window.showErrorToast('Error', 'No hay sesión activa');
            }
            return;
        }

        const response = await fetch('/api/v1/loan/lend', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                itemId: parseInt(itemId),
                responsibleId: parseInt(responsibleId),
                details: details
            })
        });

        if (response.ok) {
            const result = await response.json();
            if (window.showSuccessToast) {
                window.showSuccessToast('Éxito', result.message || 'Item prestado exitosamente');
            }
            
            // Reset form
            resetLoanForm();
            
            // Close modal
            closeLendItemModal();
            
            // Reload loans data if already loaded
            if (loansData.loans.length > 0 || loansData.selectedInventory) {
                loadLoansData();
            }
        } else {
            let errorMessage = 'Error al prestar el item';
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorData.detail || errorData.error || errorMessage;
            } catch (e) {
                const errorText = await response.text();
                errorMessage = errorText || errorMessage;
            }
            if (window.showErrorToast) {
                window.showErrorToast('Error', errorMessage);
            }
        }
    } catch (error) {
        console.error('Error lending item:', error);
        if (window.showErrorToast) {
            window.showErrorToast('Error', 'Error al prestar el item: ' + error.message);
        }
    }
}

// Handle returning an item
async function handleReturnItem(loanId) {
    const detailsReturn = document.getElementById('returnDetails').value || '';

    try {
        const token = localStorage.getItem('jwt');
        if (!token) {
            if (window.showErrorToast) {
                window.showErrorToast('Error', 'No hay sesión activa');
            }
            return;
        }

        const response = await fetch('/api/v1/loan/return', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                loanId: parseInt(loanId),
                detailsReturn: detailsReturn
            })
        });

        if (response.ok) {
            const result = await response.json();
            if (window.showSuccessToast) {
                window.showSuccessToast('Éxito', result.message || 'Item devuelto exitosamente');
            }
            
            // Close modal
            closeReturnItemModal();
            
            // Reload loans data if already loaded
            if (loansData.loans.length > 0 || loansData.selectedInventory) {
                loadLoansData();
            }
        } else {
            let errorMessage = 'Error al devolver el item';
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorData.detail || errorData.error || errorMessage;
            } catch (e) {
                const errorText = await response.text();
                errorMessage = errorText || errorMessage;
            }
            if (window.showErrorToast) {
                window.showErrorToast('Error', errorMessage);
            }
        }
    } catch (error) {
        console.error('Error returning item:', error);
        if (window.showErrorToast) {
            window.showErrorToast('Error', 'Error al devolver el item: ' + error.message);
        }
    }
}

// Reset loan form
function resetLoanForm() {
    loanFormData.selectedInventory = null;
    loanFormData.selectedItem = null;
    loanFormData.selectedResponsible = null;
    
    document.getElementById('loanSelectedInventoryId').value = '';
    document.querySelector('#loanInventorySelect .custom-select-text').textContent = 'Seleccione un inventario';
    document.getElementById('loanSelectedItemId').value = '';
    document.querySelector('#loanItemSelect .custom-select-text').textContent = 'Seleccione un item';
    document.getElementById('loanSelectedResponsibleId').value = '';
    document.querySelector('#loanResponsibleSelect .custom-select-text').textContent = 'Seleccione un responsable';
    document.getElementById('loanDetails').value = '';
}

// Open lend item modal
function openLendItemModal() {
    const modal = document.getElementById('lendItemModal');
    if (modal) {
        modal.classList.remove('hidden');
        resetLoanForm();
        initializeLoanForm();
        setTimeout(() => {
            initializeLoanSelects();
        }, 100);
    }
}

// Close lend item modal
function closeLendItemModal() {
    const modal = document.getElementById('lendItemModal');
    if (modal) {
        modal.classList.add('hidden');
        resetLoanForm();
    }
}

// Open return item modal
function openReturnItemModal(loanId) {
    const modal = document.getElementById('returnItemModal');
    if (modal) {
        modal.classList.remove('hidden');
        document.getElementById('returnLoanId').value = loanId;
        document.getElementById('returnDetails').value = '';
    }
}

// Close return item modal
function closeReturnItemModal() {
    const modal = document.getElementById('returnItemModal');
    if (modal) {
        modal.classList.add('hidden');
        document.getElementById('returnLoanId').value = '';
        document.getElementById('returnDetails').value = '';
    }
}

// Handle return item button click
function handleReturnItemClick(loanId) {
    openReturnItemModal(loanId);
}

// Submit return item
function submitReturnItem() {
    const loanId = document.getElementById('returnLoanId').value;
    if (!loanId) {
        if (window.showErrorToast) {
            window.showErrorToast('Error', 'ID de préstamo no válido');
        }
        return;
    }
    handleReturnItem(loanId);
}

// Initialize custom selects
function initializeCustomSelects() {
    // Inventory select
    const inventorySelect = document.getElementById('inventorySelect');
    if (inventorySelect) {
        inventorySelect.addEventListener('click', (e) => {
            e.stopPropagation();
            inventorySelect.classList.toggle('open');
        });
    }

    // Loan form selects
    initializeLoanSelects();

    // Close selects when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.custom-select')) {
            document.querySelectorAll('.custom-select').forEach(select => {
                select.classList.remove('open');
            });
        }
    });
}

// Initialize loan form selects
function initializeLoanSelects() {
    // Inventory select
    const inventorySelect = document.getElementById('loanInventorySelect');
    if (inventorySelect) {
        const trigger = inventorySelect.querySelector('.custom-select-trigger');
        if (trigger) {
            trigger.onclick = () => {
                inventorySelect.classList.toggle('open');
            };
        }
        const searchInput = inventorySelect.querySelector('.custom-select-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                filterSelectOptions(inventorySelect, e.target.value);
            });
        }
    }

    // Item select
    const itemSelect = document.getElementById('loanItemSelect');
    if (itemSelect) {
        const trigger = itemSelect.querySelector('.custom-select-trigger');
        if (trigger) {
            trigger.onclick = () => {
                itemSelect.classList.toggle('open');
            };
        }
        const searchInput = itemSelect.querySelector('.custom-select-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                filterSelectOptions(itemSelect, e.target.value);
            });
        }
    }

    // Responsible select
    const responsibleSelect = document.getElementById('loanResponsibleSelect');
    if (responsibleSelect) {
        const trigger = responsibleSelect.querySelector('.custom-select-trigger');
        if (trigger) {
            trigger.onclick = () => {
                responsibleSelect.classList.toggle('open');
            };
        }
        const searchInput = responsibleSelect.querySelector('.custom-select-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                filterSelectOptions(responsibleSelect, e.target.value);
            });
        }
    }
}

// Filter select options based on search term
function filterSelectOptions(selectElement, searchTerm) {
    const optionsContainer = selectElement.querySelector('.custom-select-options');
    if (!optionsContainer) return;

    const options = optionsContainer.querySelectorAll('.custom-select-option');
    const searchLower = searchTerm.toLowerCase();

    options.forEach(option => {
        const text = option.textContent.toLowerCase();
        if (text.includes(searchLower)) {
            option.style.display = '';
        } else {
            option.style.display = 'none';
        }
    });
}

// Setup search input listener
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('loansSearch');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            loansData.searchTerm = e.target.value;
            filterLoans();
        });
    }
});

// Loading state functions
function showLoadingState() {
    const refreshIcon = document.getElementById('refreshIcon');
    const refreshText = document.getElementById('refreshText');

    if (refreshIcon) refreshIcon.classList.add('animate-spin');
    if (refreshText) refreshText.textContent = 'Cargando...';
}

function hideLoadingState() {
    const refreshIcon = document.getElementById('refreshIcon');
    const refreshText = document.getElementById('refreshText');

    if (refreshIcon) refreshIcon.classList.remove('animate-spin');
    if (refreshText) refreshText.textContent = 'Actualizar';
}

function showErrorState(message) {
    if (window.showErrorToast) {
        window.showErrorToast('Error', message);
    }
}

// Export functions - ensure warehouse functions override any from loans-ui.js
window.loadLoansData = loadLoansData;
window.loadLoans = loadLoansWrapper;
window.handleLoadLoans = handleLoadLoans;
window.changePage = changePage;
window.filterLoans = filterLoans;
window.updateLoansTable = updateLoansTable; // Override the one from loans-ui.js
window.handleLendItem = handleLendItem;
window.handleReturnItem = handleReturnItem;
window.openLendItemModal = openLendItemModal;
window.closeLendItemModal = closeLendItemModal;
window.openReturnItemModal = openReturnItemModal;
window.closeReturnItemModal = closeReturnItemModal;
window.handleReturnItemClick = handleReturnItemClick;
window.submitReturnItem = submitReturnItem;
window.initializeLoanForm = initializeLoanForm;
window.initializeLoanSelects = initializeLoanSelects;

// Ensure itemsPerPage is 6 for warehouse (override loans-data.js which sets it to 10)
if (window.loansData) {
    window.loansData.itemsPerPage = 6;
    window.loansData.currentPage = 1;
}

