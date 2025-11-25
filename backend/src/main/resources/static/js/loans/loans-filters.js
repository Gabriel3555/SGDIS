function filterLoans() {
    console.log('filterLoans called');
    console.log('loansData.loans:', loansData.loans);
    console.log('loansData.searchTerm:', loansData.searchTerm);
    
    if (!loansData.loans || !Array.isArray(loansData.loans) || loansData.loans.length === 0) {
        console.log('No loans data, setting filteredLoans to empty');
        loansData.filteredLoans = [];
        // Update UI even if empty
        if (typeof window.updateLoansTable === 'function') {
            window.updateLoansTable();
        }
        if (typeof window.updatePagination === 'function') {
            window.updatePagination();
        }
        if (typeof window.updateLoansStats === 'function') {
            window.updateLoansStats();
        }
        return;
    }

    let filtered = [...loansData.loans];
    console.log('Starting with', filtered.length, 'loans');

    // Filter by search term
    if (loansData.searchTerm && loansData.searchTerm.trim() !== '') {
        const searchLower = loansData.searchTerm.toLowerCase().trim();
        console.log('Filtering by search term:', searchLower);

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
        console.log('After search filter:', filtered.length, 'loans');
    }

    loansData.filteredLoans = filtered;
    loansData.currentPage = 1;
    console.log('Final filteredLoans:', loansData.filteredLoans.length);
    console.log('filteredLoans content:', loansData.filteredLoans);
    
    // Update UI - use window to ensure functions are available
    console.log('Updating UI components...');
    if (typeof window.updateLoansTable === 'function') {
        console.log('Calling updateLoansTable');
        window.updateLoansTable();
    } else {
        console.warn('updateLoansTable function not available on window');
    }
    
    if (typeof window.updatePagination === 'function') {
        window.updatePagination();
    }
    
    if (typeof window.updateLoansStats === 'function') {
        window.updateLoansStats();
    }
    
    // Fallback: try updateLoansUI if individual functions don't work
    if (typeof window.updateLoansUI === 'function') {
        console.log('Also calling updateLoansUI as fallback');
        window.updateLoansUI();
    }
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

