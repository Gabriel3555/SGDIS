let loansData = {
    loans: [],
    filteredLoans: [],
    loansMade: [], // Loans where user is the lender
    filteredLoansMade: [],
    regionals: [],
    institutions: [],
    inventories: [],
    userInventoriesWithPermission: [], // For USER role: list of inventory IDs where user is owner or signatory
    currentPage: 1,
    itemsPerPage: 10,
    searchTerm: '',
    selectedRegional: 'all',
    selectedInstitution: 'all',
    selectedInventory: 'all',
    isLoading: false,
    userRole: null, // Store current user role
    canCreateLoans: false // Whether user can create loans
};

function getLoanStatusText(returned) {
    return returned === true ? 'Devuelto' : 'Prestado';
}

function getLoanStatusColor(returned) {
    return returned === true 
        ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' 
        : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400';
}

async function setRegionalFilter(regionalId) {
    loansData.selectedRegional = regionalId;
    loansData.selectedInstitution = 'all';
    loansData.selectedInventory = 'all';
    loansData.currentPage = 1;
    
    // Reset institution and inventory selects
    document.getElementById('selectedInstitutionId').value = 'all';
    document.querySelector('#institutionSelect .custom-select-text').textContent = 'Todas las instituciones';
    document.getElementById('selectedInventoryId').value = 'all';
    document.querySelector('#inventorySelect .custom-select-text').textContent = 'Todos los inventarios';
    
    await loadInstitutions(regionalId);
    await loadLoans();
}

async function setInstitutionFilter(institutionId) {
    loansData.selectedInstitution = institutionId;
    loansData.selectedInventory = 'all';
    loansData.currentPage = 1;
    
    // Reset inventory select
    document.getElementById('selectedInventoryId').value = 'all';
    document.querySelector('#inventorySelect .custom-select-text').textContent = 'Todos los inventarios';
    
    await loadInventories(loansData.selectedRegional, institutionId);
    await loadLoans();
}

async function setInventoryFilter(inventoryId) {
    loansData.selectedInventory = inventoryId;
    loansData.currentPage = 1;
    await loadLoans();
}

function applySearchFilter() {
    filterLoans();
}

function changePage(page) {
    // Check if we're on warehouse page and use 6 items per page
    const isWarehouse = window.location.pathname && window.location.pathname.includes('/warehouse');
    const itemsPerPage = isWarehouse ? 6 : loansData.itemsPerPage;
    
    if (page >= 1 && page <= Math.ceil(loansData.filteredLoans.length / itemsPerPage)) {
        loansData.currentPage = page;
        updateLoansTable();
        updatePagination();
    }
}

window.loansData = loansData;
window.setRegionalFilter = setRegionalFilter;
window.setInstitutionFilter = setInstitutionFilter;
window.setInventoryFilter = setInventoryFilter;
window.changePage = changePage;
window.applySearchFilter = applySearchFilter;
window.getLoanStatusText = getLoanStatusText;
window.getLoanStatusColor = getLoanStatusColor;

