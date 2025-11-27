// Transfers Main Initialization

// Initialize transfers page when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Initialize transfers data if not already initialized
    if (!window.transfersData) {
        window.transfersData = {
            transfers: [],
            currentInventoryId: null,
            currentPage: 0,
            pageSize: 6,
            totalPages: 0,
            totalElements: 0,
            viewMode: 'table',
            currentTransferId: null,
            filters: {
                status: 'all',
                sourceInventory: '',
                destinationInventory: '',
                itemId: null,
                searchTerm: ''
            }
        };
    }
    
    // Try to get inventory ID from multiple sources
    const urlParams = new URLSearchParams(window.location.search);
    let inventoryId = urlParams.get('inventoryId') || 
                      (window.inventoryData && window.inventoryData.currentInventoryId) ||
                      (window.itemsData && window.itemsData.currentInventoryId);
    
    // Convert to number if it's a string
    if (inventoryId) {
        inventoryId = typeof inventoryId === 'string' ? parseInt(inventoryId, 10) : inventoryId;
        if (!isNaN(inventoryId)) {
            window.transfersData.currentInventoryId = inventoryId;
        }
    }
    
    // Load transfers data (will handle the case when inventoryId is not available)
    if (window.loadTransfersData) {
        window.loadTransfersData();
    } else {
        // Show message to select inventory
        const container = document.getElementById('transferTableContainer');
        if (container) {
            container.innerHTML = `
                <div class="text-center py-12">
                    <i class="fas fa-info-circle text-blue-500 dark:text-blue-400 text-4xl mb-4"></i>
                    <p class="text-gray-600 dark:text-gray-400 text-lg mb-2">Selecciona un inventario para ver sus transferencias</p>
                    <p class="text-gray-500 dark:text-gray-500 text-sm">Puedes acceder desde el módulo de inventarios</p>
                </div>
            `;
        }
    }
});

