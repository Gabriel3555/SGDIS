// Users management data and state management
let usersData = {
    users: [],
    filteredUsers: [],
    currentPage: 1,
    itemsPerPage: 5,
    searchTerm: '',
    selectedRole: 'all',
    selectedStatus: 'all',
    isLoading: false,
    currentUserId: null // For tracking user being edited/deleted
};

// Helper functions for data management
function getRoleText(role) {
    switch(role) {
        case 'ADMIN': return 'Super Admin';
        case 'WAREHOUSE': return 'Almacén';
        case 'USER': return 'Usuario';
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

function changePage(page) {
    if (page >= 1 && page <= Math.ceil(usersData.filteredUsers.length / usersData.itemsPerPage)) {
        usersData.currentPage = page;
        updateUsersTable();
        updatePagination();
    }
}

// Make functions globally available
window.setRoleFilter = setRoleFilter;
window.setStatusFilter = setStatusFilter;
window.changePage = changePage;

// Show loading state
function showLoadingState() {
    const refreshIcon = document.getElementById('refreshIcon');
    const refreshText = document.getElementById('refreshText');

    if (refreshIcon) refreshIcon.classList.add('animate-spin');
    if (refreshText) refreshText.textContent = 'Cargando...';
}

// Hide loading state
function hideLoadingState() {
    const refreshIcon = document.getElementById('refreshIcon');
    const refreshText = document.getElementById('refreshText');

    if (refreshIcon) refreshIcon.classList.remove('animate-spin');
    if (refreshText) refreshText.textContent = 'Actualizar';
}

// Show error state
function showErrorState(message) {
    console.error(message);
    alert(message);
}