let usersData = {
    users: [],
    filteredUsers: [],
    currentPage: 1,
    itemsPerPage: 5,
    searchTerm: '',
    selectedRole: 'all',
    selectedStatus: 'all',
    isLoading: false,
    currentUserId: null,
    viewMode: 'table' // 'table' or 'cards'
};

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

function applySearchFilter() {
    filterUsers();
}

function changePage(page) {
    if (page >= 1 && page <= Math.ceil(usersData.filteredUsers.length / usersData.itemsPerPage)) {
        usersData.currentPage = page;
        updateUsersTable();
        updatePagination();
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