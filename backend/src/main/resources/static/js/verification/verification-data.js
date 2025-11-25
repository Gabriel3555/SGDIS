let verificationData = {
    verifications: [],
    filteredVerifications: [],
    inventories: [],
    currentPage: 1,
    itemsPerPage: 10,
    searchTerm: '',
    selectedInventory: 'all',
    isLoading: false,
    currentVerificationId: null,
    verificationType: 'serial' // 'serial' or 'plate'
};

function setInventoryFilter(inventoryId) {
    verificationData.selectedInventory = inventoryId;
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
window.changePage = changePage;
window.applySearchFilter = applySearchFilter;
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

