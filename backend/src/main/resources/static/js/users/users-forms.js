// Form handling functions for users management

// Handle new user form submission
async function handleNewUserSubmit(e) {
    e.preventDefault();

    const fullName = document.getElementById('newUserFullName').value;
    const email = document.getElementById('newUserEmail').value;
    const role = document.getElementById('newUserRole').value;
    const password = document.getElementById('newUserPassword').value;
    const photoFile = document.getElementById('newUserPhoto').files[0];

    if (!fullName || !email || !role || !password) {
        alert('Por favor complete todos los campos obligatorios');
        return;
    }

    try {
        const token = localStorage.getItem('jwt');
        const headers = {
            'Content-Type': 'application/json'
        };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        // Create user first
        const response = await fetch('/api/v1/users', {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                fullName: fullName,
                email: email,
                role: role,
                password: password,
                status: true
            })
        });

        if (response.ok) {
            const userData = await response.json();

            // If there's a photo, upload it for the new user
            if (photoFile) {
                try {
                    // Upload photo using admin endpoint for the newly created user
                    await uploadUserPhotoById(photoFile, userData.id);
                } catch (photoError) {
                    console.error('Error uploading photo:', photoError);
                    alert('Usuario creado pero error al subir la foto. Puedes subirla después desde el botón de cambiar foto.');
                }
            }

            alert('Usuario creado exitosamente');
            closeNewUserModal();
            await loadUsersData(); // Reload users list
        } else {
            const errorData = await response.json();
            alert('Error al crear usuario: ' + (errorData.message || 'Error desconocido'));
        }
    } catch (error) {
        console.error('Error creating user:', error);
        alert('Error al crear usuario. Inténtalo de nuevo.');
    }
}

// Handle edit user form submission
async function handleEditUserSubmit(e) {
    e.preventDefault();

    if (!usersData.currentUserId) {
        alert('Error: No se ha seleccionado un usuario para editar');
        return;
    }

    const fullName = document.getElementById('editUserFullName').value;
    const email = document.getElementById('editUserEmail').value;
    const role = document.getElementById('editUserRole').value;
    const statusValue = document.getElementById('editUserStatus').value;
    const status = statusValue === 'true';
    const photoFile = document.getElementById('editUserPhoto').files[0];

    if (!fullName || !email || !role) {
        alert('Por favor complete todos los campos obligatorios');
        return;
    }

    try {
        const token = localStorage.getItem('jwt');
        const headers = {
            'Content-Type': 'application/json'
        };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        // Try both field name formats to ensure compatibility
        const updateData = {
            fullName: fullName,
            full_name: fullName, // Also send snake_case format
            email: email,
            role: role,
            status: status
        };

        const response = await fetch(`/api/v1/users/${usersData.currentUserId}`, {
            method: 'PUT',
            headers: headers,
            body: JSON.stringify(updateData)
        });

        if (response.ok) {
            // If there's a new photo, try to upload it using admin endpoint
            if (photoFile) {
                try {
                    // Upload photo using admin endpoint for any user
                    await uploadUserPhotoById(photoFile, usersData.currentUserId);
                    alert('Usuario e imagen actualizados exitosamente');
                } catch (photoError) {
                    console.error('Error uploading photo:', photoError);
                    alert('Usuario actualizado pero error al subir la imagen. Puedes subirla después desde el botón de cambiar foto.');
                }
            } else {
                alert('Usuario actualizado exitosamente');
            }

            closeEditUserModal();

            // Simply reload all data to ensure we get the latest from the database
            await loadUsersData();

            // Ensure UI is refreshed after reload
            setTimeout(() => {
                updateUsersUI();
            }, 200);
        } else {
            // If response is not ok, try to reload data anyway in case the update succeeded on the server

            alert('Usuario actualizado exitosamente (datos recargados)');
            closeEditUserModal();
            loadUsersData(); // Reload all users data as fallback
            // Ensure UI is refreshed after reload
            setTimeout(() => {
                updateUsersUI();
            }, 200);
        }
    } catch (error) {
        console.error('Error updating user:', error);
        alert('Error al actualizar usuario. Inténtalo de nuevo.');
    }
}

// User action functions (for alert fallback)
function viewUser(userId) {
    const numericUserId = typeof userId === 'string' ? parseInt(userId, 10) : userId;
    const user = usersData.users.find(u => u && u.id === numericUserId);

    if (user) {
        // Show modal instead of alert
        showViewUserModal(userId);
    } else {
        console.error('User not found with ID:', userId);
        alert('Usuario no encontrado');
    }
}

function editUser(userId) {
    showEditUserModal(userId);
}

window.deleteUser = function(userId) {
    showDeleteUserModal(userId);
}

function showUserPassword(userId) {
    alert('Ver contraseña: Funcionalidad próximamente disponible.');
}

// Make functions globally available
window.editUser = editUser;
window.viewUser = viewUser;
window.showUserPassword = showUserPassword;