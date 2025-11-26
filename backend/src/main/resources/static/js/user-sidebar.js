// User Sidebar Configuration
// This script dynamically updates the sidebar based on user role
// For USER role, it shows only allowed menu items

let sidebarObserver = null;
let isUpdatingSidebar = false;
let userSidebarData = null;
let sidebarCheckInterval = null;
let isUserRole = false;

// Execute immediately to prevent other scripts from modifying sidebar
(function() {
    'use strict';
    
    // Check if we're on a user route or info-me (which can be accessed by users)
    const path = window.location.pathname;
    const isUserRoute = path.includes('/user/') || 
                       path.includes('/dashboard/user') || 
                       path === '/info-me' ||
                       path.includes('/info-me');
    
    if (isUserRoute) {
        // Hide sidebar immediately to prevent flash of admin options
        function addHideStyle() {
            if (document.head) {
                // Check if style already exists (might have been added by inline script)
                if (!document.getElementById('user-sidebar-hide-style') && !document.getElementById('hide-sidebar-immediate')) {
                    const style = document.createElement('style');
                    style.id = 'user-sidebar-hide-style';
                    style.textContent = `
                        nav.flex-1.px-4.py-4.overflow-y-auto {
                            visibility: hidden !important;
                            opacity: 0 !important;
                            transition: opacity 0.2s ease-in-out;
                        }
                        nav.flex-1.px-4.py-4.overflow-y-auto.user-sidebar-ready {
                            visibility: visible !important;
                            opacity: 1 !important;
                        }
                    `;
                    document.head.appendChild(style);
                }
            } else {
                // Retry if head not ready
                setTimeout(addHideStyle, 0);
            }
        }
        
        // Try to add style immediately
        addHideStyle();
        
        // Also hide sidebar nav directly if it exists - use multiple attempts
        function hideSidebarNav(attempts = 0) {
            const sidebarNav = document.querySelector('nav.flex-1.px-4.py-4.overflow-y-auto');
            if (sidebarNav) {
                sidebarNav.style.visibility = 'hidden';
                sidebarNav.style.opacity = '0';
                sidebarNav.style.display = 'none';
                // Re-show it but keep it hidden via visibility
                setTimeout(() => {
                    sidebarNav.style.display = '';
                }, 0);
            } else if (attempts < 50) {
                // Retry more aggressively
                setTimeout(() => hideSidebarNav(attempts + 1), 0);
            }
        }
        // Try multiple times immediately
        hideSidebarNav();
        setTimeout(() => hideSidebarNav(), 0);
        setTimeout(() => hideSidebarNav(), 1);
        
        // Start checking immediately
        checkAndUpdateSidebar();
        
        // Set up aggressive checking interval
        sidebarCheckInterval = setInterval(() => {
            if (isUserRole) {
                checkAndUpdateSidebar();
            }
        }, 100);
    }
})();

// Quick check and update function
function checkAndUpdateSidebar() {
    const sidebarNav = document.querySelector('nav.flex-1.px-4.py-4.overflow-y-auto');
    if (!sidebarNav) {
        return;
    }

    // Check if sidebar has admin links (indicating it needs to be fixed)
    const hasAdminLinks = sidebarNav.querySelector('a[href*="/superadmin/"]') || 
                         sidebarNav.querySelector('a[href*="/admin_regional/"]') ||
                         sidebarNav.querySelector('a[href*="/admin_institution/"]') ||
                         sidebarNav.querySelector('a[href*="/admininstitution/"]');

    // If we have user data and see admin links, fix it immediately
    if (hasAdminLinks && userSidebarData) {
        updateSidebarForUser(userSidebarData);
    }
}

// Load user sidebar navigation based on role
async function loadUserSidebarNavigation() {
    // Execute immediately, don't wait
    initializeUserSidebar();
}

async function initializeUserSidebar() {
    try {
        const token = localStorage.getItem('jwt');
        if (!token) {
            // If no token, show sidebar for non-user roles
            const sidebarNav = document.querySelector('nav.flex-1.px-4.py-4.overflow-y-auto');
            if (sidebarNav) {
                sidebarNav.classList.add('user-sidebar-ready');
            }
            return;
        }

        const response = await fetch('/api/v1/users/me', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            // If request fails, show sidebar for non-user roles
            const sidebarNav = document.querySelector('nav.flex-1.px-4.py-4.overflow-y-auto');
            if (sidebarNav) {
                sidebarNav.classList.add('user-sidebar-ready');
            }
            return;
        }

        const userData = await response.json();
        const userRole = userData.role;

        // Only modify sidebar for USER role
        if (userRole === 'USER') {
            isUserRole = true;
            userSidebarData = userData;
            
            // Override loadSidebarNavigation if it exists (from info-me.js)
            if (typeof window.loadSidebarNavigation === 'function') {
                const originalLoadSidebarNavigation = window.loadSidebarNavigation;
                window.loadSidebarNavigation = function(role) {
                    // If it's USER role, use our custom sidebar
                    if (role === 'USER') {
                        updateSidebarForUser(userSidebarData);
                    } else {
                        // For other roles, use original function and show sidebar
                        const sidebarNav = document.querySelector('nav.flex-1.px-4.py-4.overflow-y-auto');
                        if (sidebarNav) {
                            sidebarNav.classList.add('user-sidebar-ready');
                        }
                        return originalLoadSidebarNavigation.call(this, role);
                    }
                };
            }
            
            // Update sidebar immediately - don't wait
            updateSidebarForUser(userData).catch(err => {
                console.error('Error updating sidebar:', err);
            });
            setupSidebarObserver();
            
            // Intercept navigation to update sidebar before page change
            interceptNavigation();
            
            // Also update after a delay to catch any late modifications
            setTimeout(() => {
                if (isUserRole && userSidebarData) {
                    updateSidebarForUser(userSidebarData);
                }
            }, 100);
        } else {
            // For non-USER roles, show sidebar immediately
            const sidebarNav = document.querySelector('nav.flex-1.px-4.py-4.overflow-y-auto');
            if (sidebarNav) {
                sidebarNav.classList.add('user-sidebar-ready');
            }
        }
    } catch (error) {
        console.error('Error loading user sidebar navigation:', error);
        // On error, show sidebar for non-user roles
        const sidebarNav = document.querySelector('nav.flex-1.px-4.py-4.overflow-y-auto');
        if (sidebarNav) {
            sidebarNav.classList.add('user-sidebar-ready');
        }
    }
}

// Intercept navigation clicks to update sidebar immediately
function interceptNavigation() {
    // Override handleSidebarClick if it exists
    const originalHandleSidebarClick = window.handleSidebarClick;
    if (originalHandleSidebarClick) {
        window.handleSidebarClick = function(event, link) {
            // Update sidebar immediately before navigation
            if (userSidebarData) {
                updateSidebarForUser(userSidebarData);
            }
            // Call original function
            return originalHandleSidebarClick.call(this, event, link);
        };
    }

    // Also intercept all sidebar link clicks
    document.addEventListener('click', function(e) {
        const link = e.target.closest('a.sidebar-item');
        if (link && isUserRole) {
            // Update sidebar immediately
            if (userSidebarData) {
                updateSidebarForUser(userSidebarData);
            }
        }
    }, true); // Use capture phase to intercept early
}

// Override loadSidebarNavigation immediately to prevent it from modifying sidebar for USER role
(function() {
    'use strict';
    
    // Store original function if it exists
    const originalLoadSidebarNavigation = window.loadSidebarNavigation;
    
    // Override it immediately
    window.loadSidebarNavigation = function(role) {
        // If USER role, don't let the original function modify sidebar
        // Our script will handle it
        if (role === 'USER') {
            // Just return, don't modify sidebar
            // Our updateSidebarForUser will be called separately
            return;
        }
        
        // For other roles, use original function if it exists
        if (originalLoadSidebarNavigation) {
            return originalLoadSidebarNavigation.call(this, role);
        }
    };
})();

// Setup MutationObserver to watch for sidebar changes
function setupSidebarObserver() {
    const sidebarNav = document.querySelector('nav.flex-1.px-4.py-4.overflow-y-auto');
    if (!sidebarNav) {
        // Retry after a short delay if sidebar not found
        setTimeout(setupSidebarObserver, 100);
        return;
    }

    // Disconnect existing observer if any
    if (sidebarObserver) {
        sidebarObserver.disconnect();
    }

    // Create observer to watch for changes in sidebar
    sidebarObserver = new MutationObserver((mutations) => {
        // Only react if we're not currently updating
        if (!isUpdatingSidebar && isUserRole) {
            // Check if sidebar content changed
            const hasContentChange = mutations.some(mutation => 
                mutation.type === 'childList' || 
                mutation.type === 'attributes' ||
                (mutation.type === 'characterData' && mutation.target.parentElement === sidebarNav)
            );

            if (hasContentChange && userSidebarData) {
                // Check if admin links appeared
                const hasAdminLinks = sidebarNav.querySelector('a[href*="/superadmin/"]') || 
                                     sidebarNav.querySelector('a[href*="/admin_regional/"]') ||
                                     sidebarNav.querySelector('a[href*="/admin_institution/"]') ||
                                     sidebarNav.querySelector('a[href*="/admininstitution/"]');
                
                if (hasAdminLinks) {
                    // Update immediately, no debounce
                    updateSidebarForUser(userSidebarData);
                }
            }
        }
    });

    // Start observing with aggressive settings
    sidebarObserver.observe(sidebarNav, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'href', 'onclick', 'style']
    });
}

// Update sidebar for USER role
async function updateSidebarForUser(userData) {
    const sidebarNav = document.querySelector('nav.flex-1.px-4.py-4.overflow-y-auto');
    if (!sidebarNav) {
        return;
    }

    // Set flag to prevent observer from triggering during update
    isUpdatingSidebar = true;

    // Get current page path to set active item
    const currentPath = window.location.pathname;
    
    // Check if user is owner or signatory
    let isOwner = false;
    let isSignatory = false;

    try {
        const token = localStorage.getItem('jwt');
        if (token) {
            // Check if user is owner
            const ownerResponse = await fetch('/api/v1/users/me/inventories/owner', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (ownerResponse.ok) {
                const ownedInventories = await ownerResponse.json();
                isOwner = ownedInventories && ownedInventories.length > 0;
            }

            // Check if user is signatory
            const signatoryResponse = await fetch('/api/v1/users/me/inventories/signatory', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (signatoryResponse.ok) {
                const signatoryInventories = await signatoryResponse.json();
                isSignatory = signatoryInventories && signatoryInventories.length > 0;
            }
        }
    } catch (error) {
        console.error('Error checking user permissions:', error);
    }

    // Build sidebar HTML for USER role
    let sidebarHTML = `
        <a href="/user/dashboard" class="sidebar-item flex items-center gap-3 hover:bg-green-50 mb-2 ${currentPath === '/user/dashboard' || currentPath === '/dashboard/user' ? 'active' : ''}"
            onclick="handleSidebarClick(event, '/user/dashboard')">
            <i class="fas fa-chart-line text-lg"></i>
            <span class="font-medium">Dashboard</span>
        </a>
        <a href="/user/my-inventories" class="sidebar-item flex items-center gap-3 hover:bg-green-50 mb-2 ${currentPath === '/user/my-inventories' ? 'active' : ''}"
            onclick="handleSidebarClick(event, '/user/my-inventories')">
            <i class="fas fa-boxes text-lg"></i>
            <span class="font-medium">Mis Inventarios</span>
        </a>
        <a href="/user/notifications" class="sidebar-item flex items-center gap-3 hover:bg-green-50 mb-2 ${currentPath === '/user/notifications' ? 'active' : ''}"
            onclick="handleSidebarClick(event, '/user/notifications')">
            <i class="fas fa-bell text-lg"></i>
            <span class="font-medium">Notificaciones</span>
        </a>`;

    // Show loans if user is owner or signatory
    if (isOwner || isSignatory) {
        sidebarHTML += `
        <a href="/user/loans" class="sidebar-item flex items-center gap-3 hover:bg-green-50 mb-2 ${currentPath === '/user/loans' ? 'active' : ''}"
            onclick="handleSidebarClick(event, '/user/loans')">
            <i class="fas fa-hand-holding text-lg"></i>
            <span class="font-medium">Préstamos</span>
        </a>`;
    }

    sidebarHTML += `
        <a href="/user/verification" class="sidebar-item flex items-center gap-3 hover:bg-green-50 mb-2 ${currentPath === '/user/verification' ? 'active' : ''}"
            onclick="handleSidebarClick(event, '/user/verification')">
            <i class="fas fa-clipboard-check text-lg"></i>
            <span class="font-medium">Verificación</span>
        </a>`;

    // Show transfers only if user is owner
    if (isOwner) {
        sidebarHTML += `
        <a href="/user/transfers" class="sidebar-item flex items-center gap-3 hover:bg-green-50 mb-2 ${currentPath === '/user/transfers' ? 'active' : ''}"
            onclick="handleSidebarClick(event, '/user/transfers')">
            <i class="fas fa-exchange-alt text-lg"></i>
            <span class="font-medium">Transferencias</span>
        </a>`;
    }

    sidebarHTML += `
        <a href="/info-me" class="sidebar-item flex items-center gap-3 hover:bg-green-50 mb-2 ${currentPath === '/info-me' ? 'active' : ''}"
            onclick="handleSidebarClick(event, '/info-me')">
            <i class="fas fa-user-circle text-lg"></i>
            <span class="font-medium">Mi Perfil</span>
        </a>`;

    // Replace sidebar content
    sidebarNav.innerHTML = sidebarHTML;
    
    // Show sidebar now that it's been updated
    sidebarNav.classList.add('user-sidebar-ready');

    // Reset flag after a short delay
    setTimeout(() => {
        isUpdatingSidebar = false;
    }, 200);
}

// Initialize immediately and multiple times to catch all scenarios
(function() {
    // Execute immediately - don't wait
    loadUserSidebarNavigation();
    
    // Also on DOMContentLoaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            loadUserSidebarNavigation();
        });
    } else {
        // DOM already ready, execute again
        loadUserSidebarNavigation();
    }
    
    // Also on window load
    window.addEventListener('load', () => {
        setTimeout(() => {
            if (isUserRole && userSidebarData) {
                updateSidebarForUser(userSidebarData);
            } else if (!isUserRole) {
                // For non-user roles, ensure sidebar is visible
                const sidebarNav = document.querySelector('nav.flex-1.px-4.py-4.overflow-y-auto');
                if (sidebarNav) {
                    sidebarNav.classList.add('user-sidebar-ready');
                }
            }
        }, 50);
    });
    
    // Also on every navigation (for SPA-like behavior)
    let lastUrl = location.href;
    new MutationObserver(() => {
        const url = location.href;
        if (url !== lastUrl) {
            lastUrl = url;
            if (isUserRole && userSidebarData) {
                // Hide sidebar during navigation
                const sidebarNav = document.querySelector('nav.flex-1.px-4.py-4.overflow-y-auto');
                if (sidebarNav) {
                    sidebarNav.classList.remove('user-sidebar-ready');
                }
                setTimeout(() => {
                    updateSidebarForUser(userSidebarData);
                }, 50);
            }
        }
    }).observe(document, {subtree: true, childList: true});
})();

