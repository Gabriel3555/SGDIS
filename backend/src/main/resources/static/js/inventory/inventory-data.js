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

async function changePage(page) {
    const data = window.inventoryData || inventoryData;
    if (!data) return;

    // Check if we're using server-side pagination
    const useServerPagination = data.serverPagination !== null && data.serverPagination !== undefined;
    
    if (useServerPagination) {
        // Server-side pagination: load data from server
        const serverPagination = data.serverPagination;
        const totalPages = serverPagination.totalPages || 1;
        
        if (page < 1 || page > totalPages) {
            return; // Invalid page
        }
        
        // Convert from 1-based (UI) to 0-based (API)
        const apiPage = page - 1;
        
        // Show loading state
        if (typeof showLoadingState === 'function') {
            showLoadingState();
        }
        
        try {
            // Load inventories for the requested page
            await loadInventories({ page: apiPage, size: serverPagination.size || data.serverPageSize || 50 });
            
            // Update UI
            if (typeof updateInventoryUI === 'function') {
                updateInventoryUI();
            } else {
                // Fallback to individual updates
                const viewMode = data.viewMode || 'table';
                if (viewMode === 'table' && typeof updateInventoryTable === 'function') {
                    updateInventoryTable();
                } else if (viewMode === 'cards' && typeof updateInventoryCards === 'function') {
                    updateInventoryCards();
                }
                if (typeof updatePagination === 'function') {
                    updatePagination();
                }
            }
        } catch (error) {
            console.error('Error loading page:', error);
            if (typeof showErrorToast === 'function') {
                showErrorToast('Error', 'No se pudo cargar la página solicitada.');
            }
        } finally {
            // Hide loading state
            if (typeof hideLoadingState === 'function') {
                hideLoadingState();
            }
        }
    } else {
        // Client-side pagination: use local data
        const totalPages = Math.ceil((data.filteredInventories?.length || 0) / (data.itemsPerPage || 6));
        if (page >= 1 && page <= totalPages) {
            data.currentPage = page;
            // Also update local inventoryData reference if different
            if (inventoryData && inventoryData !== data) {
                inventoryData.currentPage = page;
            }
            
            const viewMode = data.viewMode || 'table';
            if (viewMode === 'table' && typeof updateInventoryTable === 'function') {
                updateInventoryTable();
            } else if (viewMode === 'cards' && typeof updateInventoryCards === 'function') {
                updateInventoryCards();
            }
            if (typeof updatePagination === 'function') {
                updatePagination();
            }
        }
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