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
        
        // Check if we're in warehouse mode (client-side pagination)
        const isWarehouse = (window.currentUserRole && window.currentUserRole.toUpperCase() === 'WAREHOUSE') ||
                           (window.location.pathname && window.location.pathname.includes('/warehouse'));
        
        if (isWarehouse && transfersData.allRegionalTransfers) {
            // For warehouse, just update UI without reloading data (client-side pagination)
            if (window.updateTransfersTable) {
                window.updateTransfersTable();
            }
            if (window.updateTransfersCards) {
                window.updateTransfersCards();
            }
            if (window.updateTransfersPagination) {
                window.updateTransfersPagination();
            }
        } else {
            // For other roles, reload data from server
            if (window.loadTransfersData) {
                window.loadTransfersData();
            }
        }
    }
}

window.setTransfersViewMode = setTransfersViewMode;
window.changeTransfersPage = changeTransfersPage;

