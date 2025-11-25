let verificationData = {
    verifications: [],
    filteredVerifications: [],
    inventories: [],
    currentPage: 1,
    itemsPerPage: 10,
    searchTerm: '',
    selectedInventory: 'all',
    selectedStatus: 'all',
    isLoading: false,
    currentVerificationId: null,
    verificationType: 'serial' // 'serial' or 'plate'
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

function setInventoryFilter(inventoryId) {
    verificationData.selectedInventory = inventoryId;
    verificationData.currentPage = 1;
    filterVerifications();
}

function setStatusFilter(status) {
    verificationData.selectedStatus = status;
    verificationData.currentPage = 1;
    filterVerifications();
}

function applySearchFilter() {
    filterVerifications();
}

function changePage(page) {
    if (page >= 1 && page <= Math.ceil(verificationData.filteredVerifications.length / verificationData.itemsPerPage)) {
        verificationData.currentPage = page;
        updateVerificationTable();
        updatePagination();
    }
}

window.verificationData = verificationData;
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

