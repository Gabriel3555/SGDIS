function filterLoans() {
    if (!loansData.loans || !Array.isArray(loansData.loans) || loansData.loans.length === 0) {
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

            // Search in loan details
            if (loan.detailsLend && loan.detailsLend.toLowerCase().includes(searchLower)) {
                matches = true;
            }

            if (loan.detailsReturn && loan.detailsReturn.toLowerCase().includes(searchLower)) {
                matches = true;
            }

            return matches;
        });
    }

    loansData.filteredLoans = filtered;
    loansData.currentPage = 1;
    
    // Update UI - use window to ensure functions are available
    
    // For USER role, also filter loans made
    if (loansData.userRole === 'USER' && loansData.loansMade) {
        let filteredMade = [...loansData.loansMade];
        
        if (loansData.searchTerm && loansData.searchTerm.trim() !== '') {
            const searchLower = loansData.searchTerm.toLowerCase().trim();
            filteredMade = filteredMade.filter(loan => {
                let matches = false;
                if (loan.responsibleName && loan.responsibleName.toLowerCase().includes(searchLower)) matches = true;
                if (loan.lenderName && loan.lenderName.toLowerCase().includes(searchLower)) matches = true;
                if (loan.itemId && loan.itemId.toString().includes(searchLower)) matches = true;
                if (loan.detailsLend && loan.detailsLend.toLowerCase().includes(searchLower)) matches = true;
                if (loan.detailsReturn && loan.detailsReturn.toLowerCase().includes(searchLower)) matches = true;
                return matches;
            });
        }
        
        loansData.filteredLoansMade = filteredMade;
    }
    
    // Check if user is USER role and use appropriate UI update
    if (loansData.userRole === 'USER') {
        if (typeof window.updateUserLoansUI === 'function') {
            window.updateUserLoansUI();
        } else if (typeof window.updateLoansUI === 'function') {
            window.updateLoansUI();
        }
    } else {
        if (typeof window.updateLoansTable === 'function') {
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
            window.updateLoansUI();
        }
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

