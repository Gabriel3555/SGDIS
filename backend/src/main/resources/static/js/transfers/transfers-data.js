// Transfers Data Management
let transfersData = {
    transfers: [],
    currentInventoryId: null,
    currentPage: 0,
    pageSize: 6,
    totalPages: 0,
    totalElements: 0,
    viewMode: 'table', // 'table' or 'cards'
    currentTransferId: null,
    filters: {
        status: 'all',
        sourceInventory: '',
        destinationInventory: '',
        itemId: null
    }
};

// Export globally
window.transfersData = transfersData;

function setTransfersViewMode(mode) {
    if (transfersData) {
        transfersData.viewMode = mode;
        updateTransfersUI();
    }
}

function changeTransfersPage(page) {
    if (transfersData && page >= 0 && page < transfersData.totalPages) {
        transfersData.currentPage = page;
        if (window.loadTransfersData) {
            window.loadTransfersData();
        }
    }
}

window.setTransfersViewMode = setTransfersViewMode;
window.changeTransfersPage = changeTransfersPage;

