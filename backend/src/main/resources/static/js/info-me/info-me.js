// Load user profile information
async function loadUserProfile() {
    showLoadingState();
    
    // Safety timeout: if loading takes more than 10 seconds, show error
    let safetyTimeout = setTimeout(() => {
        const loadingState = document.getElementById('loadingState');
        const profileContent = document.getElementById('profileContent');
        if (loadingState) loadingState.style.display = 'none';
        if (profileContent) profileContent.style.display = 'block';
        showErrorState('La carga del perfil está tomando demasiado tiempo. Por favor, recarga la página.');
    }, 10000);

    try {
        const token = localStorage.getItem('jwt');
        if (!token) {
            window.location.href = '/';
            return;
        }
        
        const response = await fetch('/api/v1/users/me', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            credentials: 'include' // Include cookies if needed
        });

        if (response.ok) {
            const userData = await response.json();
            
            // Check if we're on a role-specific page first
            const currentPath = window.location.pathname || '';
            const isRoleSpecificPage = currentPath.includes('/admin_institution/info-me') || 
                                      currentPath.includes('/warehouse/info-me') || 
                                      currentPath.includes('/superadmin/info-me') ||
                                      currentPath.includes('/admin_regional/info-me');
            
            // For role-specific pages, don't modify the sidebar - it's already correct in the HTML
            // Only modify sidebar for generic /info-me page
            if (!isRoleSpecificPage) {
                // Don't call loadSidebarNavigation for USER role - user-sidebar.js handles it
                if (userData.role !== 'USER') {
                    loadSidebarNavigation(userData.role);
                }
                rewriteAdminRegionalSidebarLinks(userData.role);
                // Only call rewriteAdminInstitutionSidebarLinks for ADMIN_INSTITUTION role
                if (userData.role === 'ADMIN_INSTITUTION') {
                    rewriteAdminInstitutionSidebarLinks(userData.role);
                }
            }
            
            // Populate profile data
            try {
                populateUserProfile(userData);
            } catch (error) {
                // Don't stop execution if there's an error populating profile
            }
            
            // Update header info
            try {
                updateHeaderInfo(userData);
            } catch (error) {
                // Don't stop execution if there's an error updating header
            }
            
            // Clear safety timeout since we got a successful response
            clearTimeout(safetyTimeout);
            
            // Always hide loading state and show profile content - this MUST execute
            try {
                hideLoadingState();
            } catch (error) {
                // Try to show profile content anyway - manual fallback
                const loadingState = document.getElementById('loadingState');
                const profileContent = document.getElementById('profileContent');
                const errorState = document.getElementById('errorState');
                
                if (loadingState) {
                    loadingState.style.display = 'none';
                }
                if (profileContent) {
                    profileContent.style.display = 'block';
                }
                if (errorState) {
                    errorState.style.display = 'none';
                }
            }
        } else if (response.status === 401 || response.status === 403) {
            // Token expired, invalid, or insufficient permissions
            // For 401 (Unauthorized), logout
            // For 403 (Forbidden), might be a role mismatch - show error but don't logout immediately
            if (response.status === 401) {
                localStorage.removeItem('jwt');
                window.location.href = '/';
            } else if (response.status === 403) {
                // 403 Forbidden - might be role mismatch, show error
                throw new Error('No tienes permisos para acceder a esta página. Verifica tu rol de usuario.');
            }
        } else {
            // For other errors, show error state but don't logout
            throw new Error(`Error al cargar la información del perfil: ${response.status}`);
        }
    } catch (error) {
        // Clear safety timeout on error
        clearTimeout(safetyTimeout);
        
        // Always hide loading state on error
        const loadingState = document.getElementById('loadingState');
        const profileContent = document.getElementById('profileContent');
        if (loadingState) loadingState.style.display = 'none';
        if (profileContent) profileContent.style.display = 'block';
        
        // Only show error state, don't logout unless it's a 401 error
        // The 401 error is already handled above
        if (!error.message || !error.message.includes('401')) {
            showErrorState(error.message || 'Error al cargar la información del perfil');
        }
    }
}

// Populate user profile with data
function populateUserProfile(userData) {
    // Profile Avatar
    const profileAvatar = document.getElementById('profileAvatar');
    if (profileAvatar) {
        if (userData.imgUrl) {
            profileAvatar.src = userData.imgUrl + '?t=' + new Date().getTime();
        } else {
            // Create a default avatar with user initials
            const initials = (userData.fullName || 'U').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
            profileAvatar.src = `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='150' height='150'><rect width='150' height='150' fill='%2339A900'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-size='60' fill='white' font-family='Arial'>${initials}</text></svg>`;
        }
        profileAvatar.alt = userData.fullName || 'Usuario';
    }

    // Profile Full Name (Header)
    const profileFullName = document.getElementById('profileFullName');
    if (profileFullName) {
        profileFullName.textContent = userData.fullName || 'Sin nombre';
    }

    // Profile Job Title (Header)
    const profileJobTitle = document.getElementById('profileJobTitle');
    if (profileJobTitle) {
        profileJobTitle.textContent = userData.jobTitle || 'Sin cargo';
    }

    // Status Badge
    const profileStatusBadge = document.getElementById('profileStatusBadge');
    if (profileStatusBadge) {
        const isActive = userData.status === true;
        profileStatusBadge.className = `status-badge ${isActive ? 'status-active' : 'status-inactive'}`;
        profileStatusBadge.innerHTML = `
            <i class="fas fa-circle text-xs"></i>
            <span>${isActive ? 'Activo' : 'Inactivo'}</span>
        `;
    }

    // Role Badge
    const profileRoleBadge = document.getElementById('profileRoleBadge');
    if (profileRoleBadge) {
        const roleText = getRoleDisplayName(userData.role);
        const roleColor = getRoleColor(userData.role);
        profileRoleBadge.className = `px-3 py-1.5 rounded-full text-sm font-semibold flex items-center justify-center gap-1.5 ${roleColor}`;
        profileRoleBadge.innerHTML = `
            <i class="fas fa-user-shield"></i>
            <span>${roleText}</span>
        `;
    }

    // Personal Information
    const profileId = document.getElementById('profileId');
    if (profileId) profileId.textContent = userData.id || 'N/A';
    
    const profileFullNameInfo = document.getElementById('profileFullNameInfo');
    if (profileFullNameInfo) profileFullNameInfo.textContent = userData.fullName || 'Sin nombre';
    
    const profileEmail = document.getElementById('profileEmail');
    if (profileEmail) profileEmail.textContent = userData.email || 'Sin correo';
    
    const profileJobTitleInfo = document.getElementById('profileJobTitleInfo');
    if (profileJobTitleInfo) profileJobTitleInfo.textContent = userData.jobTitle || 'Sin cargo';

    // Work Information
    const profileDepartment = document.getElementById('profileDepartment');
    if (profileDepartment) profileDepartment.textContent = userData.laborDepartment || 'Sin departamento';
    
    const profileRoleInfo = document.getElementById('profileRoleInfo');
    if (profileRoleInfo) profileRoleInfo.textContent = getRoleDisplayName(userData.role);
    
    // Load institution and regional information
    let institutionName = userData.institution || 'Sin institución';
    let regionalName = 'Sin regional';
    
    // Set institution name initially
    const profileInstitution = document.getElementById('profileInstitution');
    if (profileInstitution) profileInstitution.textContent = institutionName;
    
    const profileRegional = document.getElementById('profileRegional');
    if (profileRegional) profileRegional.textContent = regionalName;
    
    // Fetch regional information if institution exists
    if (userData.institution) {
        loadInstitutionAndRegionalInfo(userData.institution).then(({ institution, regional }) => {
            const profileInstitutionEl = document.getElementById('profileInstitution');
            if (institution && profileInstitutionEl) {
                profileInstitutionEl.textContent = institution.name || institutionName;
            }
            const profileRegionalEl = document.getElementById('profileRegional');
            if (regional && profileRegionalEl) {
                profileRegionalEl.textContent = regional.name || regionalName;
            }
        }).catch(error => {
            // Silently handle error
        });
    }
}

// Function to load institution and regional information
async function loadInstitutionAndRegionalInfo(institutionName) {
    try {
        const token = localStorage.getItem('jwt');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        // Get all institutions to find the one matching the name
        const institutionsResponse = await fetch('/api/v1/institutions', {
            method: 'GET',
            headers: headers
        });

        if (institutionsResponse.ok) {
            const institutions = await institutionsResponse.json();
            const institution = institutions.find(inst => inst.name === institutionName);
            
            if (institution && institution.regionalId) {
                // Get all regionals to find the one matching the regionalId
                const regionalsResponse = await fetch('/api/v1/regional', {
                    method: 'GET',
                    headers: headers
                });

                if (regionalsResponse.ok) {
                    const regionals = await regionalsResponse.json();
                    const regional = regionals.find(reg => reg.id === institution.regionalId);
                    return { institution, regional: regional || null };
                }
            }
        }
        return { institution: null, regional: null };
    } catch (error) {
        return { institution: null, regional: null };
    }
}

// Update header information
function updateHeaderInfo(userData) {
    const headerUserName = document.getElementById('headerUserName');
    const headerUserRole = document.getElementById('headerUserRole');
    const headerUserAvatar = document.getElementById('headerUserAvatar');

    if (headerUserName) headerUserName.textContent = userData.fullName || 'Usuario';
    if (headerUserRole) headerUserRole.textContent = getRoleDisplayName(userData.role);

    if (headerUserAvatar) {
        // Try multiple image URL fields
        const imgUrl = userData.imgUrl || userData.profilePhotoUrl || userData.profileImageUrl;
        
        // Ensure the container has the correct class
        headerUserAvatar.className = 'user-avatar';
        
        if (imgUrl) {
            // Try to use createImageWithSpinner from dashboard.js if available
            if (typeof createImageWithSpinner === 'function') {
                const spinnerHtml = createImageWithSpinner(
                    imgUrl,
                    userData.fullName || 'Usuario',
                    'w-full h-full object-cover',
                    'w-full h-full',
                    'rounded-full'
                );
                if (spinnerHtml) {
                    // Clear any existing styles that might interfere
                    headerUserAvatar.style.backgroundImage = '';
                    headerUserAvatar.style.backgroundSize = '';
                    headerUserAvatar.style.backgroundPosition = '';
                    headerUserAvatar.style.backgroundRepeat = '';
                    headerUserAvatar.innerHTML = spinnerHtml;
                } else {
                    // Fallback to initials if createImageWithSpinner returns null
                    const initials = (userData.fullName || 'Usuario').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                    headerUserAvatar.textContent = initials;
                    headerUserAvatar.style.backgroundImage = '';
                }
            } else {
                // Fallback: use background image approach
                headerUserAvatar.style.backgroundImage = `url(${imgUrl})`;
                headerUserAvatar.style.backgroundSize = 'cover';
                headerUserAvatar.style.backgroundPosition = 'center';
                headerUserAvatar.style.backgroundRepeat = 'no-repeat';
                headerUserAvatar.textContent = '';
            }
        } else {
            // No image URL - show initials
            const initials = (userData.fullName || 'Usuario').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
            headerUserAvatar.textContent = initials;
            headerUserAvatar.style.backgroundImage = '';
        }
    }
}

function resolveAdminInstitutionBasePath() {
    const path = window.location.pathname || '';
    if (path.includes('/admin_institution')) {
        return '/admin_institution';
    }
    return '/admininstitution';
}

// Load sidebar navigation based on user role
function loadSidebarNavigation(role) {
    // Get base path based on role
    let basePath = '';
    let showAllMenuItems = false;
    
    switch (role) {
        case 'SUPERADMIN':
            basePath = '/superadmin';
            showAllMenuItems = true;
            break;
        case 'ADMIN_REGIONAL':
            basePath = '/admin_regional';
            showAllMenuItems = true;
            break;
        case 'ADMIN_INSTITUTION':
            basePath = resolveAdminInstitutionBasePath();
            showAllMenuItems = true;
            break;
        case 'WAREHOUSE':
            basePath = '/warehouse';
            showAllMenuItems = false;
            break;
        case 'USER':
            basePath = '/user';
            showAllMenuItems = false;
            break;
        default:
            basePath = '/user';
            showAllMenuItems = false;
    }

    // Configure navigation links
    const navDashboard = document.getElementById('navDashboard');
    const navInventory = document.getElementById('navInventory');
    const navUsers = document.getElementById('navUsers');
    const navVerification = document.getElementById('navVerification');
    const navReports = document.getElementById('navReports');
    const navNotifications = document.getElementById('navNotifications');
    const navImportExport = document.getElementById('navImportExport');
    const navSettings = document.getElementById('navSettings');
    const navInfoMe = document.getElementById('navInfoMe');

    // Set Dashboard link
    if (navDashboard) {
        navDashboard.href = `${basePath}/dashboard`;
        navDashboard.onclick = (e) => handleSidebarClick(e, `${basePath}/dashboard`);
    }

    // Set Inventory link
    if (navInventory) {
        navInventory.href = `${basePath}/inventory`;
        navInventory.onclick = (e) => handleSidebarClick(e, `${basePath}/inventory`);
    }

    // Show/hide menu items based on role
    if (showAllMenuItems) {
        // Admin roles see all menu items
        if (navUsers) {
            navUsers.style.display = 'flex';
            navUsers.href = `${basePath}/users`;
            navUsers.onclick = (e) => handleSidebarClick(e, `${basePath}/users`);
        }
        if (navVerification) {
            navVerification.style.display = 'flex';
            navVerification.href = `${basePath}/verification`;
            navVerification.onclick = (e) => handleSidebarClick(e, `${basePath}/verification`);
        }
        if (navReports) {
            navReports.style.display = 'flex';
            navReports.href = `${basePath}/reports`;
            navReports.onclick = (e) => handleSidebarClick(e, `${basePath}/reports`);
        }
        if (navNotifications) {
            navNotifications.style.display = 'flex';
            navNotifications.href = `${basePath}/notifications`;
            navNotifications.onclick = (e) => handleSidebarClick(e, `${basePath}/notifications`);
        }
        if (navImportExport) {
            navImportExport.style.display = 'flex';
            navImportExport.href = `${basePath}/import-export`;
            navImportExport.onclick = (e) => handleSidebarClick(e, `${basePath}/import-export`);
        }
        if (navSettings) {
            navSettings.style.display = 'flex';
            navSettings.href = `${basePath}/settings`;
            navSettings.onclick = (e) => handleSidebarClick(e, `${basePath}/settings`);
        }
    }
    
    // Update info-me link based on role
    // Only update if the link doesn't already have the correct path
    if (navInfoMe) {
        const currentHref = navInfoMe.getAttribute('href') || navInfoMe.href;
        const currentPath = window.location.pathname || '';
        
        // Check if we're on a dashboard page (not info-me page)
        const isDashboardPage = currentPath.includes('/dashboard');
        
        // Only update if:
        // 1. The link points to generic /info-me, OR
        // 2. We're on a dashboard page and the link doesn't match the role's path
        const needsUpdate = currentHref === '/info-me' || 
                           (isDashboardPage && !currentHref.includes(`${basePath}/info-me`) && 
                            (role === 'ADMIN_INSTITUTION' || role === 'ADMIN_REGIONAL' || role === 'WAREHOUSE' || role === 'SUPERADMIN'));
        
        if (needsUpdate) {
            if (role === 'ADMIN_INSTITUTION' || role === 'ADMIN_REGIONAL' || role === 'WAREHOUSE' || role === 'SUPERADMIN') {
                navInfoMe.href = `${basePath}/info-me`;
                navInfoMe.setAttribute('onclick', `handleSidebarClick(event, '${basePath}/info-me')`);
            } else {
                navInfoMe.href = '/info-me';
                navInfoMe.setAttribute('onclick', 'handleSidebarClick(event, \'/info-me\')');
            }
        }
    }
    
    // Regular users (including WAREHOUSE) only see basic menu items (Dashboard, Inventory, Profile)
    // Admin menu items are already hidden by default in HTML
}

// Rewrite sidebar links for admin_regional if needed
function rewriteAdminRegionalSidebarLinks(userRole) {
    if (userRole !== 'ADMIN_REGIONAL') {
        return;
    }

    const links = document.querySelectorAll("a.sidebar-item");
    links.forEach((link) => {
        const href = link.getAttribute("href");
        if (href && href.startsWith("/superadmin")) {
            link.setAttribute("href", href.replace("/superadmin", "/admin_regional"));
            const onclickValue = link.getAttribute("onclick");
            if (onclickValue && onclickValue.includes("'/superadmin")) {
                link.setAttribute(
                    "onclick",
                    onclickValue.replace(/'\/superadmin/g, "'/admin_regional")
                );
            }
        }
    });
}

// Rewrite sidebar links for admin_institution if needed
function rewriteAdminInstitutionSidebarLinks(userRole) {
    if (userRole !== 'ADMIN_INSTITUTION') {
        return;
    }

    function replaceSidebarForAdminInstitution() {
        const basePath = resolveAdminInstitutionBasePath();
        const nav = document.querySelector('nav.flex-1.px-4.py-4.overflow-y-auto');
        
        if (!nav) {
            return false;
        }

        // Check if we're on a role-specific page - if so, don't replace the sidebar
        const currentPath = window.location.pathname || '';
        if (currentPath.includes('/admin_institution/info-me') || 
            currentPath.includes('/warehouse/info-me') ||
            currentPath.includes('/superadmin/info-me') ||
            currentPath.includes('/admin_regional/info-me')) {
            return true; // Don't replace sidebar on role-specific pages
        }
        
        // Check if sidebar already has admin_institution links - if so, don't replace it
        const firstLink = nav.querySelector('a.sidebar-item');
        if (firstLink && (firstLink.href.includes('/admin_institution') || firstLink.href.includes('/admininstitution'))) {
            // Sidebar already has correct links, just update the info-me link if needed
            // Only update if the link points to generic /info-me, not if it already has the correct path
            const infoMeLink = nav.querySelector('a#navInfoMe, a[href="/info-me"]');
            if (infoMeLink) {
                // Check if link already has the correct path
                const currentHref = infoMeLink.getAttribute('href') || infoMeLink.href;
                const isGenericInfoMe = currentHref === '/info-me' || currentHref.endsWith('/info-me') && !currentHref.includes('/admin_institution/info-me') && !currentHref.includes('/warehouse/info-me') && !currentHref.includes('/superadmin/info-me') && !currentHref.includes('/admin_regional/info-me');
                
                if (isGenericInfoMe) {
                    const adminInfoMePath = `${basePath}/info-me`;
                    infoMeLink.href = adminInfoMePath;
                    infoMeLink.setAttribute('onclick', `handleSidebarClick(event, '${adminInfoMePath}')`);
                    // Also update onclick if it exists as a property
                    if (infoMeLink.onclick) {
                        infoMeLink.onclick = (e) => handleSidebarClick(e, adminInfoMePath);
                    }
                }
            }
            return true; // Sidebar already correct, don't replace
        }

        // Build complete admin_institution sidebar HTML
        const sidebarCurrentPath = window.location.pathname;
        const sidebarHTML = `
            <a href="${basePath}/dashboard"
                class="sidebar-item flex items-center gap-3 hover:bg-green-50 mb-2 ${sidebarCurrentPath === `${basePath}/dashboard` ? 'active' : ''}"
                onclick="handleSidebarClick(event, '${basePath}/dashboard')">
                <i class="fas fa-chart-line text-lg"></i>
                <span class="font-medium">Dashboard</span>
            </a>
            <a href="${basePath}/inventory" class="sidebar-item flex items-center gap-3 hover:bg-green-50 mb-2 ${sidebarCurrentPath === `${basePath}/inventory` ? 'active' : ''}"
                onclick="handleSidebarClick(event, '${basePath}/inventory')">
                <i class="fas fa-boxes text-lg"></i>
                <span class="font-medium">Inventario</span>
            </a>
            <a href="${basePath}/users" class="sidebar-item flex items-center gap-3 hover:bg-green-50 mb-2 ${sidebarCurrentPath === `${basePath}/users` ? 'active' : ''}"
                onclick="handleSidebarClick(event, '${basePath}/users')">
                <i class="fas fa-users text-lg"></i>
                <span class="font-medium">Usuarios</span>
            </a>
            <a href="${basePath}/transfers" class="sidebar-item flex items-center gap-3 hover:bg-green-50 mb-2 ${sidebarCurrentPath === `${basePath}/transfers` ? 'active' : ''}"
                onclick="handleSidebarClick(event, '${basePath}/transfers')">
                <i class="fas fa-exchange-alt text-lg"></i>
                <span class="font-medium">Transferencias</span>
            </a>
            <a href="${basePath}/verification"
                class="sidebar-item flex items-center gap-3 hover:bg-green-50 mb-2 ${sidebarCurrentPath === `${basePath}/verification` ? 'active' : ''}"
                onclick="handleSidebarClick(event, '${basePath}/verification')">
                <i class="fas fa-clipboard-check text-lg"></i>
                <span class="font-medium">Verificación</span>
            </a>
            <a href="${basePath}/loans" class="sidebar-item flex items-center gap-3 hover:bg-green-50 mb-2 ${sidebarCurrentPath === `${basePath}/loans` ? 'active' : ''}"
                onclick="handleSidebarClick(event, '${basePath}/loans')">
                <i class="fas fa-hand-holding text-lg"></i>
                <span class="font-medium">Préstamos</span>
            </a>
            <a href="${basePath}/reports" class="sidebar-item flex items-center gap-3 hover:bg-green-50 mb-2 ${sidebarCurrentPath === `${basePath}/reports` ? 'active' : ''}"
                onclick="handleSidebarClick(event, '${basePath}/reports')">
                <i class="fas fa-chart-bar text-lg"></i>
                <span class="font-medium">Reportes</span>
            </a>
            <a href="${basePath}/auditory" class="sidebar-item flex items-center gap-3 hover:bg-green-50 mb-2 ${sidebarCurrentPath === `${basePath}/auditory` ? 'active' : ''}"
                onclick="handleSidebarClick(event, '${basePath}/auditory')">
                <i class="fas fa-clipboard-list text-lg"></i>
                <span class="font-medium">Auditoría</span>
            </a>
            <a href="${basePath}/notifications" class="sidebar-item flex items-center gap-3 hover:bg-green-50 mb-2 ${sidebarCurrentPath === `${basePath}/notifications` ? 'active' : ''}"
                onclick="handleSidebarClick(event, '${basePath}/notifications')">
                <i class="fas fa-bell text-lg"></i>
                <span class="font-medium">Notificaciones</span>
            </a>
            <a href="${basePath}/import-export" class="sidebar-item flex items-center gap-3 hover:bg-green-50 mb-2 ${sidebarCurrentPath === `${basePath}/import-export` ? 'active' : ''}"
                onclick="handleSidebarClick(event, '${basePath}/import-export')">
                <i class="fas fa-file-import text-lg"></i>
                <span class="font-medium">Importar/Exportar</span>
            </a>
            <a href="${basePath}/settings" class="sidebar-item flex items-center gap-3 hover:bg-green-50 mb-2 ${sidebarCurrentPath === `${basePath}/settings` ? 'active' : ''}"
                onclick="handleSidebarClick(event, '${basePath}/settings')">
                <i class="fas fa-sliders-h text-lg"></i>
                <span class="font-medium">Configuración</span>
            </a>
            <a href="${basePath}/info-me" class="sidebar-item flex items-center gap-3 hover:bg-green-50 mb-2 ${sidebarCurrentPath === `${basePath}/info-me` || sidebarCurrentPath === '/info-me' ? 'active' : ''}"
                onclick="handleSidebarClick(event, '${basePath}/info-me')">
                <i class="fas fa-user-circle text-lg"></i>
                <span class="font-medium">Mi Perfil</span>
            </a>`;

        nav.innerHTML = sidebarHTML;
        return true;
    }

    // Try to replace immediately
    if (!replaceSidebarForAdminInstitution()) {
        // If nav doesn't exist yet, wait for it
        const observer = new MutationObserver(function(mutations, obs) {
            if (replaceSidebarForAdminInstitution()) {
                obs.disconnect();
            }
        });
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        // Also try on DOMContentLoaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', replaceSidebarForAdminInstitution);
        }
    }
}

// Get dashboard path based on role
function getDashboardPath(role) {
    switch (role) {
        case 'SUPERADMIN':
            return '/superadmin/dashboard';
        case 'ADMIN_REGIONAL':
            return '/admin_regional/dashboard';
        case 'ADMIN_INSTITUTION':
            return `${resolveAdminInstitutionBasePath()}/dashboard`;
        case 'WAREHOUSE':
            return '/warehouse/dashboard';
        case 'USER':
            return '/user/dashboard';
        default:
            return '/user/dashboard';
    }
}

// Get role display name
function getRoleDisplayName(role) {
    const roleNames = {
        'SUPERADMIN': 'Super Administrador',
        'ADMIN_REGIONAL': 'Administrador Regional',
        'ADMIN_INSTITUTION': 'Administrador Institucional',
        'ADMIN_INSTITUTIONAL': 'Administrador Institucional',
        'WAREHOUSE': 'Encargado de Almacén',
        'USER': 'Usuario'
    };
    return roleNames[role] || role;
}

// Get role color
function getRoleColor(role) {
    const roleColors = {
        'SUPERADMIN': 'bg-purple-100 text-purple-800',
        'ADMIN_REGIONAL': 'bg-blue-100 text-blue-800',
        'ADMIN_INSTITUTION': 'bg-indigo-100 text-indigo-800',
        'WAREHOUSE': 'bg-yellow-100 text-yellow-800',
        'USER': 'bg-green-100 text-green-800'
    };
    return roleColors[role] || 'bg-gray-100 text-gray-800';
}

// Show loading state
function showLoadingState() {
    const loadingState = document.getElementById('loadingState');
    const profileContent = document.getElementById('profileContent');
    const errorState = document.getElementById('errorState');
    
    if (loadingState) loadingState.style.display = 'block';
    if (profileContent) profileContent.style.display = 'none';
    if (errorState) errorState.style.display = 'none';
}

// Hide loading state
function hideLoadingState() {
    const loadingState = document.getElementById('loadingState');
    const profileContent = document.getElementById('profileContent');
    const errorState = document.getElementById('errorState');
    
    if (loadingState) loadingState.style.display = 'none';
    if (profileContent) {
        profileContent.style.display = 'block';
    }
    if (errorState) errorState.style.display = 'none';
}

// Show error state
function showErrorState(message) {
    const loadingState = document.getElementById('loadingState');
    const profileContent = document.getElementById('profileContent');
    const errorState = document.getElementById('errorState');
    const errorMessage = document.getElementById('errorMessage');
    
    if (loadingState) loadingState.style.display = 'none';
    if (profileContent) profileContent.style.display = 'none';
    if (errorState) errorState.style.display = 'block';
    if (errorMessage) {
        errorMessage.textContent = message || 'Ha ocurrido un error al cargar tu perfil.';
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        initializeProfile();
    });
} else {
    // DOM already loaded
    initializeProfile();
}

function initializeProfile() {
    // Add a small delay to ensure all scripts are loaded
    setTimeout(function() {
        const loadingState = document.getElementById('loadingState');
        const profileContent = document.getElementById('profileContent');
        const errorState = document.getElementById('errorState');
        
        if (!loadingState || !profileContent) {
            if (errorState) {
                errorState.style.display = 'block';
                const errorMessage = document.getElementById('errorMessage');
                if (errorMessage) {
                    errorMessage.textContent = 'Error: Elementos del DOM no encontrados. Por favor, recarga la página.';
                }
            }
            return;
        }
        
        try {
            loadUserProfile();
        } catch (error) {
            // Ensure loading state is hidden even on error
            if (loadingState) loadingState.style.display = 'none';
            if (profileContent) profileContent.style.display = 'block';
            
            showErrorState('Error al inicializar el perfil: ' + error.message);
        }
    }, 100);
}

