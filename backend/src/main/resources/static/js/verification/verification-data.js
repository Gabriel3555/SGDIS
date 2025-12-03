let verificationData = {
    verifications: [],
    filteredVerifications: [],
    inventories: [],
    regionals: [],
    institutions: [],
    currentPage: 1,
    itemsPerPage: 6,
    totalPages: 0,
    totalElements: 0,
    searchTerm: '',
    selectedInventory: 'all',
    selectedStatus: 'all',
    selectedRegional: '',
    selectedInstitution: '',
    isLoading: false,
    currentVerificationId: null,
    verificationType: 'serial', // 'serial' or 'plate'
    useBackendPagination: false // Flag to indicate if using backend pagination
};

function getStatusText(status) {
    switch(status) {
        case 'PENDING': return 'Pendiente';
        case 'IN_PROGRESS': return 'En Progreso';
        case 'COMPLETED': return 'Completada';
        case 'VERIFIED': return 'Verificada';
        case 'REJECTED': return 'Rechazada';
        default: return status || 'Sin estado';
    }
}

function getStatusColor(status) {
    switch(status) {
        case 'PENDING': return 'bg-yellow-100 text-yellow-800';
        case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800';
        case 'COMPLETED': return 'bg-green-100 text-green-800';
        case 'VERIFIED': return 'bg-green-100 text-green-800';
        case 'REJECTED': return 'bg-red-100 text-red-800';
        default: return 'bg-gray-100 text-gray-800';
    }
}

async function setRegionalFilter(regionalId) {
    verificationData.selectedRegional = regionalId || '';
    verificationData.selectedInstitution = ''; // Reset institution when regional changes
    verificationData.selectedInventory = 'all'; // Reset inventory filter
    
    // Clear institution custom select if available
    if (window.verificationInstitutionCustomSelect) {
        window.verificationInstitutionCustomSelect.clear();
    }
    
    // Load institutions for selected regional
    if (regionalId) {
        if (window.loadInstitutionsByRegional) {
            await window.loadInstitutionsByRegional(regionalId);
        }
    } else {
        verificationData.institutions = [];
    }
    
    // Reload inventories based on new institution filter (empty now)
    if (window.loadInventories) {
        await window.loadInventories();
    }
    
    // Update filters UI - prefer populateVerificationCustomSelects to avoid regenerating HTML
    if (typeof populateVerificationCustomSelects === 'function') {
        // If custom selects are already initialized, just populate them
        populateVerificationCustomSelects();
    } else if (typeof updateFilters === 'function') {
        // Only regenerate HTML if custom selects are not initialized
        updateFilters();
    }
    
    // Reload verifications
    verificationData.currentPage = 1;
    if (verificationData.useBackendPagination) {
        if (window.loadVerificationsFromBackend) {
            await window.loadVerificationsFromBackend(0);
        }
    } else {
        if (window.loadLatestVerifications) {
            await window.loadLatestVerifications();
        }
        filterVerifications();
    }
}

async function setInstitutionFilter(institutionId) {
    verificationData.selectedInstitution = institutionId || '';
    verificationData.selectedInventory = 'all'; // Reset inventory filter
    
    // Reload inventories based on selected institution
    if (window.loadInventories) {
        await window.loadInventories();
    }
    
    // Update filters UI - prefer populateVerificationCustomSelects to avoid regenerating HTML
    if (typeof populateVerificationCustomSelects === 'function') {
        // If custom selects are already initialized, just populate them
        populateVerificationCustomSelects();
    } else if (typeof updateFilters === 'function') {
        // Only regenerate HTML if custom selects are not initialized
        updateFilters();
    }
    
    // Reload verifications
    verificationData.currentPage = 1;
    if (verificationData.useBackendPagination) {
        if (window.loadVerificationsFromBackend) {
            await window.loadVerificationsFromBackend(0);
        }
    } else {
        if (window.loadLatestVerifications) {
            await window.loadLatestVerifications();
        }
        filterVerifications();
    }
}

async function setInventoryFilter(inventoryId) {
    verificationData.selectedInventory = inventoryId;
    verificationData.currentPage = 1;
    
    if (verificationData.useBackendPagination) {
        // Reload from backend with new filter
        if (window.loadVerificationsFromBackend) {
            await window.loadVerificationsFromBackend(0);
        }
    } else {
        filterVerifications();
    }
}

async function setStatusFilter(status) {
    verificationData.selectedStatus = status;
    verificationData.currentPage = 1;
    
    // Status filter is client-side only (backend doesn't support it)
    filterVerifications();
}

function applySearchFilter() {
    // Search filter is client-side only
    filterVerifications();
}

async function changePage(page) {
    if (verificationData.useBackendPagination) {
        // Backend pagination: load data from backend
        if (page >= 1) {
            verificationData.currentPage = page;
            if (window.loadVerificationsFromBackend) {
                await window.loadVerificationsFromBackend(page - 1); // Convert to 0-indexed
            }
        }
    } else {
        // Client-side pagination: use filtered data
        if (page >= 1 && page <= Math.ceil(verificationData.filteredVerifications.length / verificationData.itemsPerPage)) {
            verificationData.currentPage = page;
            updateVerificationTable();
            updatePagination();
        }
    }
}

window.verificationData = verificationData;
window.setRegionalFilter = setRegionalFilter;
window.setInstitutionFilter = setInstitutionFilter;
window.setInventoryFilter = setInventoryFilter;
window.setStatusFilter = setStatusFilter;
window.changePage = changePage;
window.applySearchFilter = applySearchFilter;
window.getStatusText = getStatusText;
window.getStatusColor = getStatusColor;
window.showLoadingState = showLoadingState;
window.hideLoadingState = hideLoadingState;

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
    showErrorToast('Error', message);
}

