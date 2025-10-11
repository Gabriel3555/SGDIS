// Main users management module - coordinates all sub-modules

// Initialize users page when DOM loads
document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on the users page by multiple methods
    const isUsersPage =
        window.location.pathname.includes('/users') ||
        window.location.pathname.includes('users.html') ||
        document.querySelector('#userStatsContainer') !== null ||
        document.querySelector('#usersTableContainer') !== null ||
        document.querySelector('#newUserModal') !== null;

    if (isUsersPage) {
        // Small delay to ensure all elements are rendered
        setTimeout(() => {
            initializeUsersPage();
        }, 100);
    }
});

// Initialize users page
function initializeUsersPage() {
    loadUsersData();
    setupEventListeners();
}

// Setup event listeners
function setupEventListeners() {
    // Search input
    const searchInput = document.getElementById('userSearch');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            usersData.searchTerm = e.target.value;
            usersData.currentPage = 1;
            filterUsers();
        });
    }

    // New user form
    const newUserForm = document.getElementById('newUserForm');
    if (newUserForm) {
        newUserForm.addEventListener('submit', handleNewUserSubmit);
    }

    // Edit user form
    const editUserForm = document.getElementById('editUserForm');
    if (editUserForm) {
        editUserForm.addEventListener('submit', handleEditUserSubmit);
    }

    // New user photo input
    const newUserPhoto = document.getElementById('newUserPhoto');
    if (newUserPhoto) {
        newUserPhoto.addEventListener('change', function(e) {
            handleNewUserPhotoChange(e);
        });
    }

    // Edit user photo input
    const editUserPhoto = document.getElementById('editUserPhoto');
    if (editUserPhoto) {
        editUserPhoto.addEventListener('change', function(e) {
            handleEditUserPhotoChange(e);
        });
    }
}