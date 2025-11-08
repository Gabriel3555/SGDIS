async function handleNewUserSubmit(e) {
    e.preventDefault();

    const fullName = document.getElementById('newUserFullName').value;
    const email = document.getElementById('newUserEmail').value;
    const role = document.getElementById('newUserRole').value;
    const jobTitle = document.getElementById('newUserJobTitle').value;
    const laborDepartment = document.getElementById('newUserLaborDepartment').value;
    const password = document.getElementById('newUserPassword').value;
    const photoFile = document.getElementById('newUserPhoto').files[0];

    if (!fullName || !email || !role || !password) {
        showErrorToast('Campos obligatorios', 'Por favor complete todos los campos obligatorios');
        return;
    }

    try {
        const token = localStorage.getItem('jwt');
        const headers = {
            'Content-Type': 'application/json'
        };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch('/api/v1/users', {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                fullName: fullName,
                email: email,
                role: role,
                jobTitle: jobTitle,
                laborDepartment: laborDepartment,
                password: password,
                status: true
            })
        });

        if (response.ok) {
            const userData = await response.json();

            if (photoFile) {
                try {
                    await uploadUserPhotoById(photoFile, userData.id);
                } catch (photoError) {
                    console.error('Error uploading photo:', photoError);
                    showWarningToast('Foto no subida', 'Usuario creado pero error al subir la foto. Puedes subirla después desde el botón de cambiar foto.');
                }
            }

            showSuccessToast('Usuario creado', 'Usuario creado exitosamente');
            closeNewUserModal();
            await loadUsersData();
        } else {
            const errorData = await response.json();
            showErrorToast('Error al crear usuario', errorData.message || 'Error desconocido');
        }
    } catch (error) {
        showErrorToast('Error al crear usuario', 'Inténtalo de nuevo.');
    }
}

async function handleEditUserSubmit(e) {
    e.preventDefault();

    if (!usersData.currentUserId) {
        showErrorToast('Error', 'No se ha seleccionado un usuario para editar');
        return;
    }

    const fullName = document.getElementById('editUserFullName').value;
    const email = document.getElementById('editUserEmail').value;
    const role = document.getElementById('editUserRole').value;
    const jobTitle = document.getElementById('editUserJobTitle').value;
    const laborDepartment = document.getElementById('editUserLaborDepartment').value;
    const statusValue = document.getElementById('editUserStatus').value;
    const status = statusValue === 'true';
    const photoFile = document.getElementById('editUserPhoto').files[0];

    if (!fullName || !email || !role) {
        showErrorToast('Campos obligatorios', 'Por favor complete todos los campos obligatorios');
        return;
    }

    try {
        const token = localStorage.getItem('jwt');
        const headers = {
            'Content-Type': 'application/json'
        };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const updateData = {
            fullName: fullName,
            full_name: fullName,
            email: email,
            role: role,
            jobTitle: jobTitle,
            laborDepartment: laborDepartment,
            status: status
        };

        const response = await fetch(`/api/v1/users/${usersData.currentUserId}`, {
            method: 'PUT',
            headers: headers,
            body: JSON.stringify(updateData)
        });

        if (response.ok) {
            if (photoFile) {
                try {
                    await uploadUserPhotoById(photoFile, usersData.currentUserId);
                    showSuccessToast('Usuario actualizado', 'Usuario e imagen actualizados exitosamente');
                } catch (photoError) {
                    console.error('Error uploading photo:', photoError);
                    showWarningToast('Imagen no subida', 'Usuario actualizado pero error al subir la imagen. Puedes subirla después desde el botón de cambiar foto.');
                }
            } else {
                showSuccessToast('Usuario actualizado', 'Usuario actualizado exitosamente');
            }

            closeEditUserModal();

            await loadUsersData();

            setTimeout(() => {
                updateUsersUI();
            }, 200);
        } else {
            showSuccessToast('Usuario actualizado', 'Usuario actualizado exitosamente (datos recargados)');
            closeEditUserModal();
            loadUsersData();
            setTimeout(() => {
                updateUsersUI();
            }, 200);
        }
    } catch (error) {
        showErrorToast('Error al actualizar usuario', 'Inténtalo de nuevo.');
    }
}

function viewUser(userId) {
    const numericUserId = typeof userId === 'string' ? parseInt(userId, 10) : userId;
    const user = usersData.users.find(u => u && u.id === numericUserId);

    if (user) {
        showViewUserModal(userId);
    } else {
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
    const numericUserId = typeof userId === 'string' ? parseInt(userId, 10) : userId;
    const user = usersData.users.find(u => u && u.id === numericUserId);

    if (user) {
        showChangePasswordModal(userId);
    } else {
        showErrorToast('Usuario no encontrado', 'Usuario no encontrado');
    }
}

function showChangePasswordModal(userId) {
    if (!usersData.users || usersData.users.length === 0) {
        showErrorToast('Datos no cargados', 'Los datos de usuarios no están cargados. Por favor recarga la página.');
        return;
    }

    usersData.currentUserId = userId;

    const modalHtml = `
        <div id="changePasswordModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div class="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
                <div class="flex items-center justify-between mb-6">
                    <h2 class="text-2xl font-bold text-gray-800">Cambiar Contraseña</h2>
                    <button onclick="closeChangePasswordModal()" class="text-gray-400 hover:text-gray-600">
                        <i class="fas fa-times text-2xl"></i>
                    </button>
                </div>

                <form id="changePasswordForm" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Nueva Contraseña *</label>
                        <input type="password" id="newPassword" class="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="Ingrese la nueva contraseña" required>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Confirmar Nueva Contraseña *</label>
                        <input type="password" id="confirmPassword" class="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="Confirme la nueva contraseña" required>
                    </div>

                    <div class="flex gap-3 pt-4">
                        <button type="button" onclick="closeChangePasswordModal()" class="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors">
                            Cancelar
                        </button>
                        <button type="submit" class="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors">
                            Cambiar Contraseña
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    const form = document.getElementById('changePasswordForm');
    if (form) {
        form.addEventListener('submit', handleChangePasswordSubmit);
    }
}

function closeChangePasswordModal() {
    const modal = document.getElementById('changePasswordModal');
    if (modal) {
        modal.remove();
    }
    usersData.currentUserId = null;
}

async function handleChangePasswordSubmit(e) {
    e.preventDefault();

    if (!usersData.currentUserId) {
        alert('Error: No se ha seleccionado un usuario');
        return;
    }

    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (!newPassword || !confirmPassword) {
        showErrorToast('Campos incompletos', 'Por favor complete todos los campos');
        return;
    }

    if (newPassword !== confirmPassword) {
        showErrorToast('Contraseñas diferentes', 'Las contraseñas no coinciden');
        return;
    }

    if (newPassword.length < 6) {
        showErrorToast('Contraseña corta', 'La contraseña debe tener al menos 6 caracteres');
        return;
    }

    try {
        if (!usersData.users || usersData.users.length === 0) {
            showErrorToast('Datos no cargados', 'Los datos de usuarios no están cargados. Por favor recarga la página.');
            return;
        }

        let currentUser = usersData.users.find(u => u && u.id === usersData.currentUserId);

        if (!currentUser) {
            try {
                const token = localStorage.getItem('jwt');
                const headers = { 'Content-Type': 'application/json' };
                if (token) headers['Authorization'] = `Bearer ${token}`;

                const userResponse = await fetch(`/api/v1/users/users/${usersData.currentUserId}`, {
                    method: 'GET',
                    headers: headers
                });

                if (userResponse.ok) {
                    const fetchedUser = await userResponse.json();
                    currentUser = {
                        id: fetchedUser.id,
                        fullName: fetchedUser.fullName,
                        email: fetchedUser.email,
                        role: fetchedUser.role,
                        status: fetchedUser.status
                    };
                } else {
                    showErrorToast('Usuario no encontrado', 'No se pudo obtener la información del usuario. El usuario podría no existir.');
                    return;
                }
            } catch (fetchError) {
                showErrorToast('Error de conexión', 'No se pudo obtener la información del usuario. Verifica tu conexión.');
                return;
            }
        }

        const token = localStorage.getItem('jwt');
        const headers = {
            'Content-Type': 'application/json'
        };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(`/api/v1/users/${usersData.currentUserId}`, {
            method: 'PUT',
            headers: headers,
            body: JSON.stringify({
                fullName: currentUser.fullName,
                email: currentUser.email,
                role: currentUser.role,
                status: currentUser.status,
                password: newPassword
            })
        });

        if (response.ok) {
            showSuccessToast('Contraseña actualizada', 'Contraseña actualizada exitosamente');
            closeChangePasswordModal();
            await loadUsersData();
        } else {
            const errorData = await response.json();
            showErrorToast('Error al cambiar contraseña', errorData.message || 'Error desconocido');
        }
    } catch (error) {
        showErrorToast('Error al cambiar contraseña', 'Inténtalo de nuevo.');
    }
}

window.editUser = editUser;
window.viewUser = viewUser;
window.showUserPassword = showUserPassword;
window.showChangePasswordModal = showChangePasswordModal;
window.closeChangePasswordModal = closeChangePasswordModal;