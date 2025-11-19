// Items Data Management
let itemsData = {
    items: [],
    currentInventoryId: null,
    currentPage: 0,
    pageSize: 6,
    totalPages: 0,
    totalElements: 0,
    viewMode: 'cards', // 'cards' or 'list'
    currentItemId: null
};

// Export globally
window.itemsData = itemsData;

function setItemsViewMode(mode) {
    if (itemsData) {
        itemsData.viewMode = mode;
        updateItemsUI();
    }
}

function changeItemsPage(page) {
    if (itemsData && page >= 0 && page < itemsData.totalPages) {
        itemsData.currentPage = page;
        loadItemsData();
    }
}

window.setItemsViewMode = setItemsViewMode;
window.changeItemsPage = changeItemsPage;

