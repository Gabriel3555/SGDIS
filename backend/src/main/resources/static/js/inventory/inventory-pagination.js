// Pagination functionality for inventory module
// This handles the pagination logic and UI updates

function updatePagination() {
    const container = document.getElementById('paginationContainer');
    if (!container) return;

    if (!inventoryData) {
        return;
    }

    const totalPages = Math.ceil(inventoryData.filteredInventories.length / inventoryData.itemsPerPage);
    const startItem = (inventoryData.currentPage - 1) * inventoryData.itemsPerPage + 1;
    const endItem = Math.min(inventoryData.currentPage * inventoryData.itemsPerPage, inventoryData.filteredInventories.length);

    let paginationHtml = `
        <div class="flex items-center justify-between w-full">
            <div class="text-sm text-gray-600">
                Mostrando ${startItem}-${endItem} de ${inventoryData.filteredInventories.length} inventarios
            </div>
            <div class="flex items-center gap-2">
    `;

    if (totalPages > 1) {
        // Previous button
        paginationHtml += `
            <button onclick="changePage(${inventoryData.currentPage - 1})"
                    ${inventoryData.currentPage === 1 ? 'disabled' : ''}
                    class="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                <i class="fas fa-chevron-left"></i>
            </button>
        `;

        // Page numbers
        const maxVisiblePages = 5;
        let startPage = Math.max(1, inventoryData.currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            paginationHtml += `
                <button onclick="changePage(${i})"
                        class="px-3 py-2 border ${inventoryData.currentPage === i ? 'bg-[#00AF00] text-white border-[#00AF00]' : 'border-gray-300 text-gray-700'} rounded-lg hover:bg-gray-50 transition-colors">
                    ${i}
                </button>
            `;
        }

        // Next button
        paginationHtml += `
            <button onclick="changePage(${inventoryData.currentPage + 1})"
                    ${inventoryData.currentPage === totalPages ? 'disabled' : ''}
                    class="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                <i class="fas fa-chevron-right"></i>
            </button>
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