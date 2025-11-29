// Cancellations Data Management

const cancellationsData = {
    cancellations: [],
    filteredCancellations: [],
    isLoading: false,
    currentPage: 0,
    pageSize: 10,
    totalPages: 0,
    totalElements: 0,
    filters: {
        status: 'all',
        search: ''
    },
    userRole: null
};

// Initialize cancellations data
function initCancellationsData() {
    cancellationsData.cancellations = [];
    cancellationsData.filteredCancellations = [];
    cancellationsData.isLoading = false;
    cancellationsData.currentPage = 0;
    cancellationsData.filters = {
        status: 'all',
        search: ''
    };
}

