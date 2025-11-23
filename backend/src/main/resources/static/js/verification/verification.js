// Main verification script - Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('Verification module initialized');
    
    // Load verification data
    loadVerificationData();
    
    // Setup search functionality
    setupSearchListener();
});

function setupSearchListener() {
    const searchInput = document.getElementById('verificationSearch');
    if (searchInput) {
        // Debounce search input
        let searchTimeout;
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                filterVerifications();
            }, 300);
        });
    }
}

// Export main function
window.setupSearchListener = setupSearchListener;

