// Cancellations Data Management

const cancellationsData = {
    cancellations: [],
    filteredCancellations: [],
    isLoading: false,
    currentPage: 0,
    pageSize: 10, // Default, will be overridden to 6 for warehouse
    totalPages: 0,
    totalElements: 0,
    statistics: null, // Statistics from API (for warehouse)
    filters: {
        status: 'all',
        search: '',
        requester: 'all',
        dateRange: 'all' // 'all', 'today', 'week', 'month', 'custom'
    },
    userRole: null
};

// Set pageSize to 6 for warehouse
if (window.location.pathname && window.location.pathname.includes('/warehouse/')) {
    cancellationsData.pageSize = 6;
}

// Initialize cancellations data
function initCancellationsData() {
    cancellationsData.cancellations = [];
    cancellationsData.filteredCancellations = [];
    cancellationsData.isLoading = false;
    cancellationsData.currentPage = 0;
    cancellationsData.filters = {
        status: 'all',
        search: '',
        requester: 'all',
        dateRange: 'all'
    };
}

