// Pagination functionality for inventory module
// This handles the pagination logic and UI updates

function updatePagination() {
    const container = document.getElementById('paginationContainer');
    if (!container) return;

    const data = window.inventoryData || inventoryData;
    if (!data) {
        return;
    }

    // Check if we're using server-side pagination
    const useServerPagination = data.serverPagination !== null && data.serverPagination !== undefined;
    
    let totalPages, totalItems, currentPage, startItem, endItem;
    
    if (useServerPagination) {
        // Use server pagination info
        const serverPagination = data.serverPagination;
        totalPages = serverPagination.totalPages || 1;
        totalItems = serverPagination.totalElements || 0;
        currentPage = (serverPagination.page || 0) + 1; // Convert from 0-based to 1-based
        const pageSize = serverPagination.size || data.serverPageSize || 50;
        startItem = (currentPage - 1) * pageSize + 1;
        endItem = Math.min(currentPage * pageSize, totalItems);
    } else {
        // Use client-side pagination
        totalPages = Math.ceil((data.filteredInventories?.length || 0) / (data.itemsPerPage || 6));
        totalItems = data.filteredInventories?.length || 0;
        currentPage = data.currentPage || 1;
        startItem = (currentPage - 1) * (data.itemsPerPage || 6) + 1;
        endItem = Math.min(currentPage * (data.itemsPerPage || 6), totalItems);
    }

    // Always show pagination controls if using server pagination or if there's more than one page
    const shouldShowPagination = useServerPagination || totalPages > 1;

    let paginationHtml = `
        <div class="flex items-center justify-between w-full">
            <div class="text-sm text-gray-600 dark:text-gray-400">
                Mostrando ${startItem}-${endItem} de ${totalItems} inventarios
            </div>
            <div class="flex items-center gap-2">
    `;

    if (shouldShowPagination) {
        // Previous button
        paginationHtml += `
            <button onclick="changePage(${currentPage - 1})"
                    ${currentPage === 1 ? 'disabled' : ''}
                    class="px-4 py-2 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium">
                <i class="fas fa-chevron-left"></i>
            </button>
        `;

        // Page numbers
        const maxVisiblePages = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        // Show first page if not in range
        if (startPage > 1) {
            paginationHtml += `
                <button onclick="changePage(1)"
                        class="px-4 py-2 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium">
                    1
                </button>
            `;
            if (startPage > 2) {
                paginationHtml += `
                    <span class="px-2 text-gray-500 dark:text-gray-400">...</span>
                `;
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            paginationHtml += `
                <button onclick="changePage(${i})"
                        class="px-4 py-2 border-2 ${currentPage === i ? 'bg-[#00AF00] text-white border-[#00AF00] dark:bg-[#00AF00] dark:border-[#00AF00]' : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'} rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium">
                    ${i}
                </button>
            `;
        }

        // Show last page if not in range
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                paginationHtml += `
                    <span class="px-2 text-gray-500 dark:text-gray-400">...</span>
                `;
            }
            paginationHtml += `
                <button onclick="changePage(${totalPages})"
                        class="px-4 py-2 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium">
                    ${totalPages}
                </button>
            `;
        }

        // Next button
        paginationHtml += `
            <button onclick="changePage(${currentPage + 1})"
                    ${currentPage === totalPages ? 'disabled' : ''}
                    class="px-4 py-2 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium">
                <i class="fas fa-chevron-right"></i>
            </button>
        `;
    } else {
        // Show message when no pagination is needed
        paginationHtml += `
            <span class="text-sm text-gray-500 dark:text-gray-400">No hay más páginas</span>
        `;
    }

    paginationHtml += `
            </div>
        </div>
    `;

    container.innerHTML = paginationHtml;
}

// Change items per page
function changeItemsPerPage(itemsPerPage) {
    if (inventoryData) {
        inventoryData.itemsPerPage = parseInt(itemsPerPage);
        inventoryData.currentPage = 1;
        updateInventoryTable();
        updatePagination();
    }
}

// Get pagination info
function getPaginationInfo() {
    if (!inventoryData) {
        return {
            currentPage: 1,
            totalPages: 1,
            totalItems: 0,
            itemsPerPage: 6,
            hasNextPage: false,
            hasPreviousPage: false
        };
    }

    const totalPages = Math.ceil(inventoryData.filteredInventories.length / inventoryData.itemsPerPage);

    return {
        currentPage: inventoryData.currentPage,
        totalPages: totalPages,
        totalItems: inventoryData.filteredInventories.length,
        itemsPerPage: inventoryData.itemsPerPage,
        hasNextPage: inventoryData.currentPage < totalPages,
        hasPreviousPage: inventoryData.currentPage > 1
    };
}

// Jump to specific page
function jumpToPage(page) {
    const info = getPaginationInfo();
    const targetPage = Math.max(1, Math.min(page, info.totalPages));

    if (inventoryData) {
        inventoryData.currentPage = targetPage;
        updateInventoryTable();
        updatePagination();
    }
}

// Get items for current page
function getCurrentPageItems() {
    if (!inventoryData) return [];

    const startIndex = (inventoryData.currentPage - 1) * inventoryData.itemsPerPage;
    const endIndex = startIndex + inventoryData.itemsPerPage;

    return inventoryData.filteredInventories.slice(startIndex, endIndex);
}

// Check if pagination is needed
function isPaginationNeeded() {
    if (!inventoryData) return false;
    return inventoryData.filteredInventories.length > inventoryData.itemsPerPage;
}

window.updatePagination = updatePagination;
window.changeItemsPerPage = changeItemsPerPage;
window.getPaginationInfo = getPaginationInfo;
window.jumpToPage = jumpToPage;
window.getCurrentPageItems = getCurrentPageItems;
window.isPaginationNeeded = isPaginationNeeded;