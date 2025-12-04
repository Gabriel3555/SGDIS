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
        
        // Check if we're in admin institution mode (client-side pagination)
        const isAdminInstitution = (window.currentUserRole && window.currentUserRole.toUpperCase() === 'ADMIN_INSTITUTION') ||
                                  (window.location.pathname && (window.location.pathname.includes('/admin_institution/transfers') || window.location.pathname.includes('/admininstitution/transfers')));
        
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
        } else if (isAdminInstitution && window.transfersDataAdminInstitution) {
            // For admin institution, update the current page and re-filter (client-side pagination)
            window.transfersDataAdminInstitution.currentPage = page;
            
            // Update window.transfersData for compatibility
            if (window.transfersData) {
                window.transfersData.currentPage = page;
            }
            
            // Re-filter to update pagination (this will slice the filtered transfers correctly)
            if (window.filterTransfersForAdminInstitution) {
                window.filterTransfersForAdminInstitution();
            } else {
                // Fallback: just update UI
                if (window.updateTransfersTable) {
                    window.updateTransfersTable();
                }
                if (window.updateTransfersPagination) {
                    window.updateTransfersPagination();
                }
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

