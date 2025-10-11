// API interaction functions for users management

// Load all users data
async function loadUsersData() {
    if (usersData.isLoading) return;

    usersData.isLoading = true;
    showLoadingState();

    try {
        // Load current user info
        await loadCurrentUserInfo();

        // Load all users
        await loadUsers();

        // Update UI
        updateUsersUI();

    } catch (error) {
        console.error('Error loading users data:', error);
        showErrorState('Error al cargar los datos de usuarios: ' + error.message);
        // Still update UI even if there's an error to show empty state
        updateUsersUI();
    } finally {
        usersData.isLoading = false;
        hideLoadingState();
    }
}

// Load current user information
async function loadCurrentUserInfo() {
    try {
        const token = localStorage.getItem('jwt');
        if (!token) {
            throw new Error('No authentication token found');
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
            updateUserInfoDisplay(userData);
        } else {
            throw new Error('Failed to load user info');
        }
    } catch (error) {
        console.error('Error loading current user info:', error);
        // Set default values consistent with admin dashboard
        updateUserInfoDisplay({
            fullName: 'Super Admin',
            role: 'ADMIN',
            email: 'admin@sena.edu.co'
        });
    }
}

// Load users list
async function loadUsers() {
    try {
        const token = localStorage.getItem('jwt');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch('/api/v1/users', {
            method: 'GET',
            headers: headers
        });

        if (response.ok) {
            const users = await response.json();
            usersData.users = Array.isArray(users) ? users : [];
            usersData.filteredUsers = [...usersData.users];
        } else {
            throw new Error('Failed to load users');
        }
    } catch (error) {
        console.error('Error loading users:', error);
        // Set empty array if API fails
        usersData.users = [];
        usersData.filteredUsers = [];
    }
}

// Confirm delete user
async function confirmDeleteUser() {
    if (!usersData.currentUserId) {
        alert('Error: No se ha seleccionado un usuario para eliminar');
        return;
    }

    try {
        const token = localStorage.getItem('jwt');
        const headers = {
            'Content-Type': 'application/json'
        };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(`/api/v1/users/${usersData.currentUserId}`, {
            method: 'DELETE',
            headers: headers
        });

        if (response.ok) {
            alert('Usuario eliminado exitosamente');
            closeDeleteUserModal();
            await loadUsersData(); // Reload users list
        } else if (response.status === 500) {
            alert('No se puede eliminar este usuario porque está siendo utilizado en inventarios existentes. Transfiere la propiedad de los inventarios a otro usuario antes de eliminarlo.');
        } else {
            try {
                const errorData = await response.json();
                alert('Error al eliminar usuario: ' + (errorData.message || 'Error desconocido'));
            } catch {
                alert('Error al eliminar usuario. El usuario podría estar siendo utilizado en otros módulos del sistema.');
            }
        }
    } catch (error) {
        console.error('Error deleting user:', error);
        alert('Error al eliminar usuario. Inténtalo de nuevo.');
    }
}

// Make functions globally available
window.confirmDeleteUser = confirmDeleteUser;