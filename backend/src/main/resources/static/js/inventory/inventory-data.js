let inventoryData = {
    inventories: [],
    filteredInventories: [],
    currentPage: 1,
    itemsPerPage: 6,
    searchTerm: '',
    selectedLocation: 'all',
    selectedStatus: 'all',
    selectedRegional: '', // For super admin filter
    selectedInstitution: '', // For super admin filter
    isLoading: false,
    currentInventoryId: null,
    viewMode: 'table', // 'table' or 'cards'
    inventoryScope: 'global',
    serverPagination: null,
    serverPageSize: 50
};

function getLocationText(location) {
    switch(location) {
        case 'BLOQUE_A': return 'Bloque A';
        case 'BLOQUE_B': return 'Bloque B';
        case 'BLOQUE_C': return 'Bloque C';
        case 'OFICINA_PRINCIPAL': return 'Oficina Principal';
        case 'SALA_SERVIDORES': return 'Sala de Servidores';
        case 'AUDITORIO': return 'Auditorio';
        default: return location || 'Sin ubicación';
    }
}

function setLocationFilter(location) {
    inventoryData.selectedLocation = location;
    inventoryData.currentPage = 1;
    filterInventories();
}

function setStatusFilter(status) {
    inventoryData.selectedStatus = status;
    inventoryData.currentPage = 1;
    filterInventories();
}

function applySearchFilter() {
    filterInventories();
}

function changePage(page) {
    if (page >= 1 && page <= Math.ceil(inventoryData.filteredInventories.length / inventoryData.itemsPerPage)) {
        inventoryData.currentPage = page;
        updateInventoryCards();
        updatePagination();
    }
}

function setViewMode(mode) {
    if (inventoryData) {
        inventoryData.viewMode = mode;
        updateInventoryUI();
    }
}

window.inventoryData = inventoryData;
window.setLocationFilter = setLocationFilter;
window.setStatusFilter = setStatusFilter;
window.setViewMode = setViewMode;
window.changePage = changePage;
window.applySearchFilter = applySearchFilter;
window.getLocationText = getLocationText;
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