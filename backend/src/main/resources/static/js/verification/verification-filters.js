function filterVerifications() {
    const searchTerm = document.getElementById('verificationSearch')?.value.toLowerCase() || '';
    
    verificationData.filteredVerifications = verificationData.verifications.filter(verification => {
        // Search filter
        const matchesSearch = !searchTerm || 
            (verification.serialNumber && verification.serialNumber.toLowerCase().includes(searchTerm)) ||
            (verification.licensePlate && verification.licensePlate.toLowerCase().includes(searchTerm)) ||
            (verification.itemName && verification.itemName.toLowerCase().includes(searchTerm)) ||
            (verification.inventoryName && verification.inventoryName.toLowerCase().includes(searchTerm));

        // Inventory filter
        const matchesInventory = verificationData.selectedInventory === 'all' || 
            verification.inventoryId == verificationData.selectedInventory;

        // Status filter
        const matchesStatus = verificationData.selectedStatus === 'all' || 
            verification.status === verificationData.selectedStatus;

        return matchesSearch && matchesInventory && matchesStatus;
    });

    verificationData.currentPage = 1;
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

