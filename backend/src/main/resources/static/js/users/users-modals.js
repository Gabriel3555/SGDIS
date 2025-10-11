// Modal management functions for users

// Modal functions
function showNewUserModal() {
    const modal = document.getElementById('newUserModal');
    if (modal) {
        modal.classList.remove('hidden');
    }
}

function closeNewUserModal() {
    const modal = document.getElementById('newUserModal');
    if (modal) {
        modal.classList.add('hidden');
    }

    // Reset form
    const form = document.getElementById('newUserForm');
    if (form) {
        form.reset();
        // Reset image preview
        const imagePreview = document.getElementById('newUserImagePreview');
        if (imagePreview) {
            imagePreview.innerHTML = '<i class="fas fa-user"></i>';
        }
    }
}

// View User Modal functions
function showViewUserModal(userId) {
    // Convert userId to number if it's a string
    const numericUserId = typeof userId === 'string' ? parseInt(userId, 10) : userId;
    const user = usersData.users.find(u => u && u.id === numericUserId);

    if (user) {
        const content = document.getElementById('viewUserContent');
        const fullName = user.fullName || 'Usuario sin nombre';
        const email = user.email || 'Sin email';
        const initials = fullName.charAt(0).toUpperCase();

        if (content) {
            content.innerHTML = `
            <div class="text-center mb-6">
                <div class="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                    ${initials}
                </div>
                <h3 class="text-xl font-semibold text-gray-800">${fullName}</h3>
                <p class="text-gray-600">${email}</p>
            </div>

                <div class="space-y-3">
                    <div class="flex justify-between">
                        <span class="text-gray-600">ID:</span>
                        <span class="font-semibold">${user.id}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-600">Nombre:</span>
                        <span class="font-semibold">${fullName}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-600">Email:</span>
                        <span class="font-semibold">${email}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-600">Rol:</span>
                        <span class="font-semibold">${getRoleText(user.role)}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-600">Estado:</span>
                        <span class="font-semibold ${user.status !== false ? 'text-green-600' : 'text-red-600'}">
                            ${user.status !== false ? 'Activo' : 'Inactivo'}
                        </span>
                    </div>
                    ${user.jobTitle ? `
                    <div class="flex justify-between">
                        <span class="text-gray-600">Cargo:</span>
                        <span class="font-semibold">${user.jobTitle}</span>
                    </div>
                    ` : ''}
                    ${user.laborDepartment ? `
                    <div class="flex justify-between">
                        <span class="text-gray-600">Departamento:</span>
                        <span class="font-semibold">${user.laborDepartment}</span>
                    </div>
                    ` : ''}
                </div>
            `;
        }

        const modal = document.getElementById('viewUserModal');

        if (modal) {
            modal.classList.remove('hidden');
        } else {
            console.error('Modal element not found!');
        }
    } else {
        console.error('User not found with ID:', userId);
    }
}

function closeViewUserModal() {
    const modal = document.getElementById('viewUserModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

// Edit User Modal functions
function showEditUserModal(userId) {
    const numericUserId = typeof userId === 'string' ? parseInt(userId, 10) : userId;
    const user = usersData.users.find(u => u && u.id === numericUserId);
    if (user) {
        usersData.currentUserId = userId;

        // Fill form with user data
        const fullNameInput = document.getElementById('editUserFullName');
        const emailInput = document.getElementById('editUserEmail');
        const roleSelect = document.getElementById('editUserRole');
        const statusSelect = document.getElementById('editUserStatus');

        if (fullNameInput) fullNameInput.value = user.fullName || '';
        if (emailInput) emailInput.value = user.email || '';
        if (roleSelect) roleSelect.value = user.role || '';
        if (statusSelect) statusSelect.value = user.status !== false ? 'true' : 'false';

        // Handle current user image
        const imagePreview = document.getElementById('editUserImagePreview');
        const currentImage = document.getElementById('editUserCurrentImage');
        const imageIcon = document.getElementById('editUserImageIcon');

        if (user.imgUrl && imagePreview && currentImage && imageIcon) {
            currentImage.src = user.imgUrl;
            currentImage.style.display = 'block';
            imageIcon.style.display = 'none';
            imagePreview.classList.add('has-image');
        } else if (imagePreview && currentImage && imageIcon) {
            currentImage.style.display = 'none';
            imageIcon.style.display = 'block';
            imagePreview.classList.remove('has-image');
        }

        const modal = document.getElementById('editUserModal');
        if (modal) {
            modal.classList.remove('hidden');
        }
    }
}

function closeEditUserModal() {
    const modal = document.getElementById('editUserModal');
    if (modal) {
        modal.classList.add('hidden');
    }

    // Reset form
    const form = document.getElementById('editUserForm');
    if (form) {
        form.reset();
        // Reset image preview
        const imagePreview = document.getElementById('editUserImagePreview');
        const currentImage = document.getElementById('editUserCurrentImage');
        const imageIcon = document.getElementById('editUserImageIcon');

        if (imagePreview && currentImage && imageIcon) {
            currentImage.style.display = 'none';
            imageIcon.style.display = 'block';
            imagePreview.classList.remove('has-image');
        }
    }

    usersData.currentUserId = null;
}

// Make functions globally available
window.showNewUserModal = showNewUserModal;
window.closeNewUserModal = closeNewUserModal;
window.showViewUserModal = showViewUserModal;
window.closeViewUserModal = closeViewUserModal;
window.showEditUserModal = showEditUserModal;
window.closeEditUserModal = closeEditUserModal;
window.showDeleteUserModal = showDeleteUserModal;
window.closeDeleteUserModal = closeDeleteUserModal;

// Delete User Modal functions
function showDeleteUserModal(userId) {
    const numericUserId = typeof userId === 'string' ? parseInt(userId, 10) : userId;
    const user = usersData.users.find(u => u && u.id === numericUserId);
    if (user) {
        usersData.currentUserId = userId;

        const message = document.getElementById('deleteUserMessage');
        const fullName = user.fullName || 'Usuario sin nombre';
        const email = user.email || 'Sin email';

        if (message) {
            // Check if user is an admin (admins usually can't be deleted due to system constraints)
            if (user.role === 'ADMIN') {
                message.textContent = `No se puede eliminar el usuario "${fullName}" porque es un administrador del sistema. Contacte al soporte técnico si necesita ayuda.`;
                // Disable the delete button for admins
                setTimeout(() => {
                    const deleteBtn = document.querySelector('#deleteUserModal button:last-child');
                    if (deleteBtn && !deleteBtn.disabled) {
                        deleteBtn.disabled = true;
                        deleteBtn.textContent = 'No permitido';
                        deleteBtn.classList.remove('bg-red-600', 'hover:bg-red-700');
                        deleteBtn.classList.add('bg-gray-400', 'cursor-not-allowed');
                    }
                }, 100);
            } else {
                message.textContent = `¿Está seguro de que desea eliminar al usuario "${fullName}" (${email})? Esta acción no se puede deshacer.`;
                // Re-enable the delete button for non-admins
                setTimeout(() => {
                    const deleteBtn = document.querySelector('#deleteUserModal button:last-child');
                    if (deleteBtn && deleteBtn.disabled) {
                        deleteBtn.disabled = false;
                        deleteBtn.textContent = 'Eliminar Usuario';
                        deleteBtn.classList.remove('bg-gray-400', 'cursor-not-allowed');
                        deleteBtn.classList.add('bg-red-600', 'hover:bg-red-700');
                    }
                }, 100);
            }
        }

        const modal = document.getElementById('deleteUserModal');
        if (modal) {
            modal.classList.remove('hidden');
        }
    }
}

function closeDeleteUserModal() {
    const modal = document.getElementById('deleteUserModal');
    if (modal) {
        modal.classList.add('hidden');
    }

    // Reset button state
    const deleteBtn = document.querySelector('#deleteUserModal button:last-child');
    if (deleteBtn) {
        deleteBtn.disabled = false;
        deleteBtn.textContent = 'Eliminar Usuario';
        deleteBtn.classList.remove('bg-gray-400', 'cursor-not-allowed');
        deleteBtn.classList.add('bg-red-600', 'hover:bg-red-700');
    }

    usersData.currentUserId = null;
}