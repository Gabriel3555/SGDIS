// Load user profile information
async function loadUserProfile() {
    showLoadingState();

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
            }
        });

        if (response.ok) {
            const userData = await response.json();
            populateUserProfile(userData);
            updateHeaderInfo(userData);
            loadSidebarNavigation(userData.role);
            hideLoadingState();
        } else if (response.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('jwt');
            window.location.href = '/';
        } else {
            throw new Error('Error al cargar la información del perfil');
        }
    } catch (error) {
        console.error('Error loading user profile:', error);
        showErrorState(error.message);
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
            console.error('Error loading institution/regional info:', error);
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
        console.error('Error fetching institution/regional info:', error);
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
        if (userData.imgUrl) {
            const uniqueId = 'img-' + Math.random().toString(36).substr(2, 9);
            headerUserAvatar.innerHTML = `
                <div class="relative w-full h-full rounded-full overflow-hidden" id="img-container-${uniqueId}">
                    <div class="absolute inset-0 flex items-center justify-center bg-gray-100" id="spinner-${uniqueId}">
                        <div class="image-loading-spinner"></div>
                    </div>
                    <img src="${userData.imgUrl}" alt="${userData.fullName || 'Usuario'}" class="w-full h-full object-cover opacity-0 transition-opacity duration-300" 
                         id="img-${uniqueId}"
                         onload="(function() { const img = document.getElementById('img-${uniqueId}'); const spinner = document.getElementById('spinner-${uniqueId}'); if (img) img.classList.remove('opacity-0'); if (spinner) spinner.style.display='none'; })();"
                         onerror="(function() { const spinner = document.getElementById('spinner-${uniqueId}'); const container = document.getElementById('img-container-${uniqueId}'); if (spinner) spinner.style.display='none'; if (container) container.innerHTML='<div class=\\'w-full h-full bg-gray-200 flex items-center justify-center text-gray-400\\'><i class=\\'fas fa-user\\'></i></div>'; })();">
                </div>
            `;
        } else {
            headerUserAvatar.textContent = (userData.fullName || 'Usuario').charAt(0).toUpperCase();
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
    // Regular users (including WAREHOUSE) only see basic menu items (Dashboard, Inventory, Profile)
    // Admin menu items are already hidden by default in HTML
}

// Get dashboard path based on role
function getDashboardPath(role) {
    switch (role) {
        case 'SUPERADMIN':
            return '/superadmin/dashboard';
        case 'ADMIN_REGIONAL':
            return '/admin-regional/dashboard';
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
        'ADMIN_INSTITUTION': 'Administrador de Institución',
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
    document.getElementById('loadingState').style.display = 'block';
    document.getElementById('profileContent').style.display = 'none';
    document.getElementById('errorState').style.display = 'none';
}

// Hide loading state
function hideLoadingState() {
    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('profileContent').style.display = 'block';
    document.getElementById('errorState').style.display = 'none';
}

// Show error state
function showErrorState(message) {
    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('profileContent').style.display = 'none';
    document.getElementById('errorState').style.display = 'block';
    document.getElementById('errorMessage').textContent = message || 'Ha ocurrido un error al cargar tu perfil.';
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    loadUserProfile();
});

