// Static functionality for all pages - handles sidebar and header based on user role
let currentUser = null;
let sidebarInitialized = false;

// Initialize static functionality when DOM loads
document.addEventListener('DOMContentLoaded', function() {
    initializeStaticSidebar();
});

// Initialize static sidebar - static version without animations
async function initializeStaticSidebar() {
    try {
        // Load user data
        await loadCurrentUser();

        // Create static sidebar only once
        if (!sidebarInitialized) {
            createStaticSidebar();
            sidebarInitialized = true;
        }

        // Update interface elements
        updateUserInterface();
    } catch (error) {
        // Create sidebar anyway with default user
        currentUser = {
            fullName: 'Usuario',
            role: 'USER',
            email: 'user@sena.edu.co'
        };
        if (!sidebarInitialized) {
            createStaticSidebar();
            sidebarInitialized = true;
        }
        updateUserInterface();
    }
}

// Create static sidebar - static version without animations
function createStaticSidebar() {
    const body = document.body;
    const userRole = currentUser ? currentUser.role : 'USER';

    // Check if sidebar already exists
    let existingSidebar = document.getElementById('sidebar');
    let existingOverlay = document.getElementById('overlay');

    // Define sidebar items based on role
    const sidebarItems = getSidebarItemsForRole(userRole);

    if (existingSidebar) {
        // Update existing sidebar content instead of recreating
        const sidebarNav = existingSidebar.querySelector('nav');
        if (sidebarNav) {
            sidebarNav.innerHTML = sidebarItems.map(item => `
                <a href="${item.link || '#'}" class="sidebar-item flex items-center gap-3 hover:bg-green-50 mb-2" onclick="handleSidebarClick(event, '${item.link || '#'}')">
                    <i class="fas ${item.icon} text-lg"></i>
                    <span class="font-medium">${item.text}</span>
                </a>
            `).join('');
        }
        return;
    }

    // Create overlay for mobile (only if doesn't exist)
    if (!existingOverlay) {
        const overlay = document.createElement('div');
        overlay.className = 'overlay';
        overlay.id = 'overlay';
        overlay.style.cssText = `
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            z-index: 999;
        `;

        // Add overlay click handler
        overlay.addEventListener('click', function() {
            closeSidebar();
        });

        body.insertBefore(overlay, body.firstChild);
    }

    // Create sidebar
    const sidebar = document.createElement('aside');
    sidebar.className = 'sidebar fixed left-0 top-0 h-screen w-64';
    sidebar.id = 'sidebar';
    sidebar.style.cssText = `
        background: white;
        box-shadow: 4px 0 20px rgba(0, 0, 0, 0.1);
        z-index: 1000;
        width: 280px;
        position: fixed;
        left: 0;
        top: 0;
        height: 100vh;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
    `;

    // Sidebar header
    const sidebarHeader = document.createElement('div');
    sidebarHeader.className = 'p-6 border-b border-gray-200';
    sidebarHeader.innerHTML = `
        <div class="flex items-center gap-2">
            <div class="w-12 h-12 bg-white rounded-lg flex items-center justify-center overflow-hidden">
                <img src="/svg/logoSena.png" alt="Logo SENA" class="w-full h-full object-cover">
            </div>
            <div class="text-gray-800">
                <div class="font-bold text-lg">SGDIS</div>
                <div class="text-xs opacity-70">Inventario</div>
            </div>
        </div>
    `;

    // Sidebar navigation with scroll
    const sidebarNav = document.createElement('nav');
    sidebarNav.className = 'flex-1 px-4 py-4 overflow-y-auto';
    sidebarNav.innerHTML = sidebarItems.map(item => `
        <a href="${item.link || '#'}" class="sidebar-item flex items-center gap-3 hover:bg-green-50 mb-2" onclick="handleSidebarClick(event, '${item.link || '#'}')">
            <i class="fas ${item.icon} text-lg"></i>
            <span class="font-medium">${item.text}</span>
        </a>
    `).join('');

    // Sidebar user profile (fixed at bottom)
    const sidebarProfile = document.createElement('div');
    sidebarProfile.className = 'p-4 border-t border-gray-200 mt-auto';
    sidebarProfile.innerHTML = `
        <div class="flex items-center gap-3 mb-4">
            <div class="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-bold">
                ${currentUser.fullName ? currentUser.fullName.charAt(0).toUpperCase() : 'U'}
            </div>
            <div class="text-gray-800">
                <div class="font-semibold text-sm" id="sidebarUserName">${currentUser.fullName || 'Usuario'}</div>
                <div class="text-xs opacity-70" id="sidebarUserRole">${currentUser.role || 'USER'}</div>
            </div>
        </div>
        <button onclick="logout()" class="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-xl">
            <i class="fas fa-sign-out-alt text-lg"></i>
            <span>Cerrar Sesión</span>
        </button>
    `;

    // Assemble sidebar
    sidebar.appendChild(sidebarHeader);
    sidebar.appendChild(sidebarNav);
    sidebar.appendChild(sidebarProfile);

    // Add to body
    body.insertBefore(sidebar, body.firstChild);

    // Adjust main content margin
    adjustMainContentMargin();
}

// Load current user information
async function loadCurrentUser() {
    try {
        const token = localStorage.getItem('jwt');

        if (!token) {
            currentUser = {
                fullName: 'Usuario',
                role: 'USER',
                email: 'user@sena.edu.co'
            };
            return;
        }

        const response = await fetch('/api/v1/users/me', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            currentUser = await response.json();
        } else {
            currentUser = {
                fullName: 'Usuario',
                role: 'USER',
                email: 'user@sena.edu.co'
            };
        }
    } catch (error) {
        currentUser = {
            fullName: 'Usuario',
            role: 'USER',
            email: 'user@sena.edu.co'
        };
    }
}

// Update user interface elements
function updateUserInterface() {
    if (!currentUser) return;

    // Update header user information
    updateHeaderUserInfo();

    // Update sidebar user information
    updateSidebarUserInfo();
}

// Update header user information
function updateHeaderUserInfo() {
    const headerUserName = document.getElementById('headerUserName');
    const headerUserRole = document.getElementById('headerUserRole');
    const headerUserAvatar = document.getElementById('headerUserAvatar');

    if (headerUserName) {
        headerUserName.textContent = currentUser.fullName || 'Usuario';
    }

    if (headerUserRole) {
        headerUserRole.textContent = currentUser.role || 'USER';
    }

    if (headerUserAvatar) {
        headerUserAvatar.textContent = (currentUser.fullName || 'Usuario').charAt(0).toUpperCase();
    }
}

// Update sidebar user information
function updateSidebarUserInfo() {
    const sidebarUserName = document.getElementById('sidebarUserName');
    const sidebarUserRole = document.getElementById('sidebarUserRole');

    if (sidebarUserName) {
        sidebarUserName.textContent = currentUser.fullName || 'Usuario';
    }

    if (sidebarUserRole) {
        sidebarUserRole.textContent = currentUser.role || 'USER';
    }
}

// Adjust main content margin
function adjustMainContentMargin() {
    const mainContent = document.querySelector('.main-content');

    if (mainContent) {
        mainContent.style.marginLeft = '280px';
    }
}

// Close sidebar function
function closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');

    if (sidebar) {
        sidebar.classList.add('-translate-x-full');
    }

    if (overlay) {
        overlay.style.display = 'none';
    }
}

// Handle sidebar click
function handleSidebarClick(event, link) {
    if (link === '#') {
        event.preventDefault();
        return;
    }

    // Close sidebar on mobile after click
    if (window.innerWidth <= 1024) {
        closeSidebar();
    }
}


// Get sidebar items based on user role
function getSidebarItemsForRole(role) {
    const allItems = {
        'ADMIN': [
            { text: 'Dashboard', icon: 'fa-chart-line', link: '/admin/dashboard' },
            { text: 'Inventario', icon: 'fa-boxes', link: '/admin/inventory' },
            { text: 'Usuarios', icon: 'fa-users', link: '/admin/users' },
            { text: 'Verificación', icon: 'fa-clipboard-check', link: '/admin/verification' },
            { text: 'Reportes', icon: 'fa-chart-bar', link: '/admin/reports' },
            { text: 'Mantenimiento', icon: 'fa-cogs', link: '/admin/maintenance' },
            { text: 'Notificaciones', icon: 'fa-bell', link: '/admin/notifications' },
            { text: 'Auditoría', icon: 'fa-search', link: '/admin/audit' },
            { text: 'Importar/Exportar', icon: 'fa-exchange-alt', link: '/admin/import-export' },
            { text: 'Configuración', icon: 'fa-sliders-h', link: '/admin/settings' }
        ],
        'WAREHOUSE': [
            { text: 'Dashboard', icon: 'fa-chart-line', link: '/warehouse/dashboard' },
            { text: 'Inventarios', icon: 'fa-boxes', link: '/warehouse/inventory' },
            { text: 'Verificación', icon: 'fa-clipboard-check', link: '/warehouse/verification' },
            { text: 'Reportes', icon: 'fa-chart-bar', link: '/warehouse/reports' },
            { text: 'Mantenimiento', icon: 'fa-cogs', link: '/warehouse/maintenance' },
            { text: 'Notificaciones', icon: 'fa-bell', link: '/warehouse/notifications' },
            { text: 'Importar/Exportar', icon: 'fa-exchange-alt', link: '/warehouse/import-export' }
        ],
        'USER': [
            { text: 'Dashboard', icon: 'fa-chart-line', link: '/user/dashboard' },
            { text: 'Inventarios', icon: 'fa-boxes', link: '/user/inventory' },
            { text: 'Verificación', icon: 'fa-clipboard-check', link: '/user/verification' },
            { text: 'Notificaciones', icon: 'fa-bell', link: '/user/notifications' }
        ]
    };

    return allItems[role] || allItems['USER'];
}


// Logout function
function logout() {
    localStorage.removeItem('jwt');
    window.location.href = '/';
}

// Setup mobile menu toggle
function setupMobileMenuToggle() {
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');

    if (menuToggle && sidebar && overlay) {
        menuToggle.addEventListener('click', function() {
            const isHidden = sidebar.classList.contains('-translate-x-full');

            if (isHidden) {
                sidebar.classList.remove('-translate-x-full');
                overlay.style.display = 'block';
            } else {
                sidebar.classList.add('-translate-x-full');
                overlay.style.display = 'none';
            }
        });
    }
}

// Initialize mobile menu toggle when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    setupMobileMenuToggle();
});

// Export functions for use by other scripts
window.StaticFunctions = {
    loadCurrentUser,
    updateUserInterface,
    logout,
    adjustMainContentMargin,
    handleSidebarClick,
    closeSidebar
};


// Export functions for use by other scripts
window.StaticFunctions = {
    loadCurrentUser,
    updateUserInterface,
    logout,
    adjustMainContentMargin,
    handleSidebarClick,
    closeSidebar
};


// Export functions for use by other scripts
window.StaticFunctions = {
    loadCurrentUser,
    updateUserInterface,
    logout,
    adjustMainContentMargin,
    handleSidebarClick,
    closeSidebar
};

// Export functions for use by other scripts
window.StaticFunctions = {
    loadCurrentUser,
    updateUserInterface,
    logout,
    adjustMainContentMargin,
    handleSidebarClick,
    closeSidebar
};

// Export functions for use by other scripts
window.StaticFunctions = {
    loadCurrentUser,
    updateUserInterface,
    logout,
    adjustMainContentMargin,
    handleSidebarClick,
    closeSidebar
};

// Export functions for use by other scripts
window.StaticFunctions = {
    loadCurrentUser,
    updateUserInterface,
    logout,
    adjustMainContentMargin,
    handleSidebarClick,
    closeSidebar
};

// Export functions for use by other scripts
window.StaticFunctions = {
    loadCurrentUser,
    updateUserInterface,
    logout,
    adjustMainContentMargin,
    handleSidebarClick,
    closeSidebar
};

// Export functions for use by other scripts
window.StaticFunctions = {
    loadCurrentUser,
    updateUserInterface,
    logout,
    adjustMainContentMargin,
    handleSidebarClick,
    closeSidebar
};

// Export functions for use by other scripts
window.StaticFunctions = {
    loadCurrentUser,
    updateUserInterface,
    logout,
    adjustMainContentMargin,
    handleSidebarClick,
    closeSidebar
};

// Export functions for use by other scripts
window.StaticFunctions = {
    loadCurrentUser,
    updateUserInterface,
    logout,
    adjustMainContentMargin,
    handleSidebarClick,
    closeSidebar
};

// Export functions for use by other scripts
window.StaticFunctions = {
    loadCurrentUser,
    updateUserInterface,
    logout,
    adjustMainContentMargin,
    handleSidebarClick,
    closeSidebar
};

// Export functions for use by other scripts
window.StaticFunctions = {
    loadCurrentUser,
    updateUserInterface,
    logout,
    adjustMainContentMargin,
    handleSidebarClick,
    closeSidebar
};

// Export functions for use by other scripts
window.StaticFunctions = {
    loadCurrentUser,
    updateUserInterface,
    logout,
    adjustMainContentMargin,
    handleSidebarClick,
    closeSidebar
};


// Export functions for use by other scripts
window.StaticFunctions = {
    loadCurrentUser,
    updateUserInterface,
    logout,
    adjustMainContentMargin,
    handleSidebarClick,
    closeSidebar
};

// Export functions for use by other scripts
window.StaticFunctions = {
    loadCurrentUser,
    updateUserInterface,
    logout,
    adjustMainContentMargin,
    handleSidebarClick,
    closeSidebar
};

// Export functions for use by other scripts
window.StaticFunctions = {
    loadCurrentUser,
    updateUserInterface,
    logout,
    adjustMainContentMargin,
    handleSidebarClick,
    closeSidebar
};

// Export functions for use by other scripts
window.StaticFunctions = {
    loadCurrentUser,
    updateUserInterface,
    logout,
    adjustMainContentMargin,
    handleSidebarClick,
    closeSidebar
};

// Export functions for use by other scripts
window.StaticFunctions = {
    loadCurrentUser,
    updateUserInterface,
    logout,
    adjustMainContentMargin,
    handleSidebarClick,
    closeSidebar
};

// Export functions for use by other scripts
window.StaticFunctions = {
    loadCurrentUser,
    updateUserInterface,
    logout,
    adjustMainContentMargin,
    handleSidebarClick,
    closeSidebar
};

// Export functions for use by other scripts
window.StaticFunctions = {
    loadCurrentUser,
    updateUserInterface,
    logout,
    adjustMainContentMargin,
    handleSidebarClick,
    closeSidebar
};

// Export functions for use by other scripts
window.StaticFunctions = {
    loadCurrentUser,
    updateUserInterface,
    logout,
    adjustMainContentMargin,
    handleSidebarClick,
    closeSidebar
};

// Export functions for use by other scripts
window.StaticFunctions = {
    loadCurrentUser,
    updateUserInterface,
    logout,
    adjustMainContentMargin,
    handleSidebarClick,
    closeSidebar
};

// Export functions for use by other scripts
window.StaticFunctions = {
    loadCurrentUser,
    updateUserInterface,
    logout,
    adjustMainContentMargin,
    handleSidebarClick,
    closeSidebar
};

// Export functions for use by other scripts
window.StaticFunctions = {
    loadCurrentUser,
    updateUserInterface,
    logout,
    adjustMainContentMargin,
    handleSidebarClick,
    closeSidebar
};

// Export functions for use by other scripts
window.StaticFunctions = {
    loadCurrentUser,
    updateUserInterface,
    logout,
    adjustMainContentMargin,
    handleSidebarClick,
    closeSidebar
};