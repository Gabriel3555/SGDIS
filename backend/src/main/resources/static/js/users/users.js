document.addEventListener('DOMContentLoaded', function() {
    const isUsersPage =
        window.location.pathname.includes('/users') ||
        window.location.pathname.includes('users.html') ||
        document.querySelector('#userStatsContainer') !== null ||
        document.querySelector('#usersTableContainer') !== null ||
        document.querySelector('#newUserModal') !== null;

    if (isUsersPage) {
        setTimeout(() => {
            initializeUsersPage();
        }, 100);
    }
});

function initializeUsersPage() {
    loadUsersData();
    setupEventListeners();
}


function setupEventListeners() {
    const searchInput = document.getElementById('userSearch');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            usersData.searchTerm = e.target.value;
            usersData.currentPage = 1;
            filterUsers();
        });
    }

    const newUserForm = document.getElementById('newUserForm');
    if (newUserForm) {
        newUserForm.addEventListener('submit', handleNewUserSubmit);
    }

    const editUserForm = document.getElementById('editUserForm');
    if (editUserForm) {
        editUserForm.addEventListener('submit', handleEditUserSubmit);
    }

    const newUserPhoto = document.getElementById('newUserPhoto');
    if (newUserPhoto) {
        newUserPhoto.addEventListener('change', function(e) {
            handleNewUserPhotoChange(e);
        });
    }

    const editUserPhoto = document.getElementById('editUserPhoto');
    if (editUserPhoto) {
        editUserPhoto.addEventListener('change', function(e) {
            handleEditUserPhotoChange(e);
        });
    }
}
