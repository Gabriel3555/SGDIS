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
        profileRoleBadge.className = `px-3 py-1 rounded-full text-sm font-semibold ${roleColor}`;
        profileRoleBadge.innerHTML = `
            <i class="fas fa-user-shield mr-1"></i>
            <span>${roleText}</span>
        `;
    }

    // Personal Information
    document.getElementById('profileId').textContent = userData.id || 'N/A';
    document.getElementById('profileFullNameInfo').textContent = userData.fullName || 'Sin nombre';
    document.getElementById('profileEmail').textContent = userData.email || 'Sin correo';
    document.getElementById('profileJobTitleInfo').textContent = userData.jobTitle || 'Sin cargo';

    // Work Information
    document.getElementById('profileDepartment').textContent = userData.laborDepartment || 'Sin departamento';
    document.getElementById('profileRoleInfo').textContent = getRoleDisplayName(userData.role);
    document.getElementById('profileInstitution').textContent = userData.institution ? userData.institution.name || 'Sin institución' : 'Sin institución';
    document.getElementById('profileStatusInfo').textContent = userData.status ? 'Cuenta Activa' : 'Cuenta Inactiva';
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
            headerUserAvatar.innerHTML = `<img src="${userData.imgUrl}" alt="${userData.fullName || 'Usuario'}" class="w-full h-full object-cover rounded-full">`;
        } else {
            headerUserAvatar.textContent = (userData.fullName || 'Usuario').charAt(0).toUpperCase();
        }
    }
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
            basePath = '/admin_institution';
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
    const navMaintenance = document.getElementById('navMaintenance');
    const navNotifications = document.getElementById('navNotifications');
    const navAudit = document.getElementById('navAudit');
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
        if (navMaintenance) {
            navMaintenance.style.display = 'flex';
            navMaintenance.href = `${basePath}/maintenance`;
            navMaintenance.onclick = (e) => handleSidebarClick(e, `${basePath}/maintenance`);
        }
        if (navNotifications) {
            navNotifications.style.display = 'flex';
            navNotifications.href = `${basePath}/notifications`;
            navNotifications.onclick = (e) => handleSidebarClick(e, `${basePath}/notifications`);
        }
        if (navAudit) {
            navAudit.style.display = 'flex';
            navAudit.href = `${basePath}/audit`;
            navAudit.onclick = (e) => handleSidebarClick(e, `${basePath}/audit`);
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
    } else {
        // Regular users only see basic menu items
        if (navUsers) navUsers.style.display = 'none';
        if (navVerification) navVerification.style.display = 'none';
        if (navReports) navReports.style.display = 'none';
        if (navMaintenance) navMaintenance.style.display = 'none';
        if (navNotifications) navNotifications.style.display = 'none';
        if (navAudit) navAudit.style.display = 'none';
        if (navImportExport) navImportExport.style.display = 'none';
        if (navSettings) navSettings.style.display = 'none';
    }
}

// Get dashboard path based on role
function getDashboardPath(role) {
    switch (role) {
        case 'SUPERADMIN':
            return '/superadmin/dashboard';
        case 'ADMIN_REGIONAL':
            return '/admin-regional/dashboard';
        case 'ADMIN_INSTITUTION':
            return '/admin-institution/dashboard';
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

