let usersData = {
    users: [],
    filteredUsers: [],
    currentPage: 1,
    itemsPerPage: 6,
    searchTerm: '',
    selectedRole: 'all',
    selectedStatus: 'all',
    isLoading: false,
    currentUserId: null,
    viewMode: 'table', // 'table' or 'cards'
    totalPages: 0,
    totalUsers: 0,
    backendPage: 0 // Backend uses 0-indexed pages
};

function getRoleText(role) {
    switch(role) {
        case 'SUPERADMIN': return 'Super Admin';
        case 'ADMIN_INSTITUTION': return 'Admin Institución';
        case 'ADMIN_REGIONAL': return 'Admin Regional';
        case 'WAREHOUSE': return 'Almacén';
        case 'USER': return 'Usuario Normal';
        default: return role;
    }
}

function setRoleFilter(role) {
    usersData.selectedRole = role;
    usersData.currentPage = 1;
    filterUsers();
}

function setStatusFilter(status) {
    usersData.selectedStatus = status;
    usersData.currentPage = 1;
    filterUsers();
}

function applySearchFilter() {
    filterUsers();
}

async function changePage(page) {
    // Check if we have filters active
    const hasFilters = usersData.searchTerm || usersData.selectedRole !== 'all' || usersData.selectedStatus !== 'all';
    
    if (hasFilters) {
        // Local pagination for filtered results
        const totalPages = Math.ceil(usersData.filteredUsers.length / usersData.itemsPerPage);
        if (page < 1 || page > totalPages) {
            return;
        }
        usersData.currentPage = page;
        updateUsersUI();
    } else {
        // Backend pagination
        // Validate page number
        if (page < 1 || (usersData.totalPages > 0 && page > usersData.totalPages)) {
            return;
        }
        
        // Convert to 0-indexed for backend
        const backendPage = page - 1;
        
        // Show loading state
        showLoadingState();
        
        try {
            // Load users for the new page
            await loadUsers(backendPage);
            // Update UI with new data
            updateUsersUI();
        } catch (error) {
            console.error('Error changing page:', error);
            showErrorToast('Error', 'Error al cambiar de página');
        } finally {
            hideLoadingState();
        }
    }
}

function setViewMode(mode) {
    if (usersData) {
        usersData.viewMode = mode;
        updateUsersUI();
    }
}

window.usersData = usersData;
window.setRoleFilter = setRoleFilter;
window.setStatusFilter = setStatusFilter;
window.setViewMode = setViewMode;
window.changePage = changePage;
window.applySearchFilter = applySearchFilter;
window.getRoleText = getRoleText;

function showLoadingState() {
    const refreshIcon = document.getElementById('refreshIcon');
    const refreshText = document.getElementById('refreshText');

    if (refreshIcon) refreshIcon.classList.add('animate-spin');
    if (refreshText) refreshText.textContent = 'Cargando...';
}

function hideLoadingState() {
    const refreshIcon = document.getElementById('refreshIcon');
    const refreshText = document.getElementById('refreshText');

    if (refreshIcon) refreshIcon.classList.remove('animate-spin');
    if (refreshText) refreshText.textContent = 'Actualizar';
}

function showErrorState(message) {
    showErrorToast('Error', message);
}