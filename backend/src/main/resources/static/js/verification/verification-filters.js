function filterVerifications() {
    const searchTerm = document.getElementById('verificationSearch')?.value.toLowerCase() || '';
    
    // If using backend pagination, apply client-side filters (status, search) to the already paginated data
    // Inventory filter is handled by backend
    let verificationsToFilter = verificationData.verifications;
    
    verificationData.filteredVerifications = verificationsToFilter.filter(verification => {
        // Search filter (client-side)
        const matchesSearch = !searchTerm || 
            (verification.serialNumber && verification.serialNumber.toLowerCase().includes(searchTerm)) ||
            (verification.licensePlate && verification.licensePlate.toLowerCase().includes(searchTerm)) ||
            (verification.itemName && verification.itemName.toLowerCase().includes(searchTerm)) ||
            (verification.inventoryName && verification.inventoryName.toLowerCase().includes(searchTerm));

        // Status filter (client-side, backend doesn't support it)
        const matchesStatus = verificationData.selectedStatus === 'all' || 
            verification.status === verificationData.selectedStatus;

        // Inventory filter (only for client-side pagination, backend handles it)
        const matchesInventory = verificationData.useBackendPagination || 
            verificationData.selectedInventory === 'all' || 
            verification.inventoryId == verificationData.selectedInventory;

        return matchesSearch && matchesStatus && matchesInventory;
    });

    // Only reset page for client-side pagination
    if (!verificationData.useBackendPagination) {
        verificationData.currentPage = 1;
    }
    
    updateVerificationTable();
    updatePagination();
}

// Setup search input listener
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('verificationSearch');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            filterVerifications();
        });
    }
});

window.filterVerifications = filterVerifications;

