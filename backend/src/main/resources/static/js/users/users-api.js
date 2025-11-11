async function loadUsersData() {
    if (usersData.isLoading) return;

    usersData.isLoading = true;
    showLoadingState();

    try {
        await loadCurrentUserInfo();
        await loadUsers();
        updateUsersUI();

    } catch (error) {
        console.error('Error loading users data:', error);
        showErrorState('Error al cargar los datos de usuarios: ' + error.message);
        updateUsersUI();
    } finally {
        usersData.isLoading = false;
        hideLoadingState();
    }
}

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
            // Store current user ID globally
            if (window.usersData) {
                window.usersData.currentLoggedInUserId = userData.id;
            }
            updateUserInfoDisplay(userData);
        } else {
            throw new Error('Failed to load user info');
        }
    } catch (error) {
        console.error('Error loading current user info:', error);
        updateUserInfoDisplay({
            fullName: 'Super Admin',
            role: 'ADMIN',
            email: 'admin@sena.edu.co'
        });
    }
}

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
        usersData.users = [];
        usersData.filteredUsers = [];
    }
}

async function confirmDeleteUser() {
    if (!usersData.currentUserId) {
        showErrorToast('Error', 'No se ha seleccionado un usuario para eliminar');
        return;
    }

    // Verificar que el usuario aún existe en la lista
    const currentUser = usersData.users.find(u => u && u.id == usersData.currentUserId);
    if (!currentUser) {
        showErrorToast('Usuario no encontrado', 'El usuario ya no existe en la lista. Puede que ya haya sido eliminado.');
        closeDeleteUserModal();
        return;
    }

    // Verificar que no sea un administrador
    if (currentUser.role === 'ADMIN') {
        showErrorToast('No permitido', 'No se puede eliminar un usuario administrador.');
        closeDeleteUserModal();
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
            showSuccessToast('Usuario eliminado', 'Usuario eliminado exitosamente');
            closeDeleteUserModal();
            await loadUsersData();
        } else if (response.status === 404) {
            showErrorToast('Usuario no encontrado', 'El usuario que intenta eliminar no existe o ya fue eliminado.');
            closeDeleteUserModal();
            await loadUsersData(); // Recargar la lista para reflejar cambios
        } else if (response.status === 500) {
            showWarningToast('Usuario en uso', 'No se puede eliminar este usuario porque está siendo utilizado en inventarios existentes. Transfiere la propiedad de los inventarios a otro usuario antes de eliminarlo.');
        } else if (response.status === 403) {
            showErrorToast('Permisos insuficientes', 'No tienes permisos para eliminar este usuario.');
        } else if (response.status === 401) {
            showErrorToast('Sesión expirada', 'Tu sesión ha expirado. Por favor inicia sesión nuevamente.');
        } else {
            try {
                const errorData = await response.json();
                showErrorToast('Error al eliminar usuario', errorData.message || 'Error desconocido');
            } catch {
                showErrorToast('Error al eliminar usuario', 'El usuario podría estar siendo utilizado en otros módulos del sistema.');
            }
        }
    } catch (error) {
        console.error('Error deleting user:', error);
        showErrorToast('Error al eliminar usuario', 'Inténtalo de nuevo.');
    }
}

window.confirmDeleteUser = confirmDeleteUser;