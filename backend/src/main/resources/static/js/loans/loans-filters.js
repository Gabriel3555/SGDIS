function filterLoans() {
    if (!loansData.loans || !Array.isArray(loansData.loans)) {
        return;
    }

    let filtered = [...loansData.loans];

    // Filter by search term
    if (loansData.searchTerm && loansData.searchTerm.trim() !== '') {
        const searchLower = loansData.searchTerm.toLowerCase().trim();

        filtered = filtered.filter(loan => {
            let matches = false;

            // Search in responsible name
            if (loan.responsibleName && loan.responsibleName.toLowerCase().includes(searchLower)) {
                matches = true;
            }

            // Search in lender name
            if (loan.lenderName && loan.lenderName.toLowerCase().includes(searchLower)) {
                matches = true;
            }

            // Search in item ID
            if (loan.itemId && loan.itemId.toString().includes(searchLower)) {
                matches = true;
            }

            return matches;
        });
    }

    loansData.filteredLoans = filtered;
    loansData.currentPage = 1;
    updateLoansTable();
    updatePagination();
}

// Setup search input listener
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('loansSearch');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            loansData.searchTerm = e.target.value;
            applySearchFilter();
        });
    }
});

window.filterLoans = filterLoans;

