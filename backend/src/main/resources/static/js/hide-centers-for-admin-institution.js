// Function to hide "Centros" sidebar item for ADMIN_INSTITUTION role
(function() {
    'use strict';

    function hideCentersForAdminInstitution() {
        const path = window.location.pathname || "";
        const isAdminInstitutionPath = path.includes("/admininstitution") || path.includes("/admin_institution");
        
        // Check user role from window or fetch it
        let userRole = window.currentUserRole || 
                      (window.currentUserData && window.currentUserData.role) ||
                      null;
        
        // If we have the role and it's ADMIN_INSTITUTION, or if we're on admin_institution path
        if (isAdminInstitutionPath || (userRole && userRole.toUpperCase() === 'ADMIN_INSTITUTION')) {
            // Find all sidebar links that contain "Centros"
            const sidebarLinks = document.querySelectorAll('a.sidebar-item');
            
            sidebarLinks.forEach((link) => {
                const href = link.getAttribute('href') || '';
                const linkText = link.textContent.trim().toLowerCase();
                const spanText = link.querySelector('span.font-medium');
                const spanTextContent = spanText ? spanText.textContent.trim().toLowerCase() : '';
                
                // Hide if it's the Centros link
                if (href.includes('/centers') || 
                    linkText === 'centros' || 
                    spanTextContent === 'centros' ||
                    (href.includes('centers') && linkText.includes('centro'))) {
                    link.style.display = 'none';
                    link.style.visibility = 'hidden';
                    link.setAttribute('hidden', 'true');
                }
            });
        }
    }

    // Execute immediately
    hideCentersForAdminInstitution();

    // Execute when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', hideCentersForAdminInstitution);
    } else {
        hideCentersForAdminInstitution();
    }

    // Execute after a short delay to catch dynamically loaded content
    setTimeout(hideCentersForAdminInstitution, 100);
    setTimeout(hideCentersForAdminInstitution, 500);
    setTimeout(hideCentersForAdminInstitution, 1000);

    // Execute after user info is loaded
    window.addEventListener('load', function() {
        setTimeout(hideCentersForAdminInstitution, 100);
    });

    // Watch for role changes
    let lastRole = null;
    setInterval(function() {
        const currentRole = window.currentUserRole || 
                           (window.currentUserData && window.currentUserData.role);
        if (currentRole !== lastRole) {
            lastRole = currentRole;
            setTimeout(hideCentersForAdminInstitution, 100);
        }
    }, 500);

    // Export function globally
    window.hideCentersForAdminInstitution = hideCentersForAdminInstitution;
})();

