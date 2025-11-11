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

    const form = document.getElementById('newUserForm');
    if (form) {
        form.reset();
        const imagePreview = document.getElementById('newUserImagePreview');
        if (imagePreview) {
            imagePreview.innerHTML = '<i class="fas fa-user"></i>';
        }
        // Clear job title and labor department fields
        const jobTitleInput = document.getElementById('newUserJobTitle');
        const laborDepartmentInput = document.getElementById('newUserLaborDepartment');
        if (jobTitleInput) jobTitleInput.value = '';
        if (laborDepartmentInput) laborDepartmentInput.value = '';
    }
}

function showViewUserModal(userId) {
    const numericUserId = typeof userId === 'string' ? parseInt(userId, 10) : userId;
    const user = usersData.users.find(u => u && u.id === numericUserId);

    if (user) {
        const content = document.getElementById('viewUserContent');
        const fullName = user.fullName || 'Usuario sin nombre';
        const email = user.email || 'Sin email';
        const initials = fullName.charAt(0).toUpperCase();

        if (content) {
            let profileDisplay;
            if (user.imgUrl) {
                profileDisplay = `<img src="${user.imgUrl}" alt="${fullName}" class="w-20 h-20 rounded-full object-cover border-2 border-gray-200 mx-auto mb-4">`;
            } else {
                profileDisplay = `<div class="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">${initials}</div>`;
            }

            content.innerHTML = `
            <div class="text-center mb-6">
                ${profileDisplay}
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
        }
    }
}

function closeViewUserModal() {
    const modal = document.getElementById('viewUserModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

function showEditUserModal(userId) {
    const numericUserId = typeof userId === 'string' ? parseInt(userId, 10) : userId;
    const user = usersData.users.find(u => u && u.id === numericUserId);
    if (user) {
        usersData.currentUserId = userId;

        const fullNameInput = document.getElementById('editUserFullName');
        const emailInput = document.getElementById('editUserEmail');
        const roleSelect = document.getElementById('editUserRole');
        const jobTitleInput = document.getElementById('editUserJobTitle');
        const laborDepartmentInput = document.getElementById('editUserLaborDepartment');
        const statusSelect = document.getElementById('editUserStatus');

        if (fullNameInput) fullNameInput.value = user.fullName || '';
        if (emailInput) emailInput.value = user.email || '';
        if (roleSelect) roleSelect.value = user.role || '';
        if (jobTitleInput) jobTitleInput.value = user.jobTitle || '';
        if (laborDepartmentInput) laborDepartmentInput.value = user.laborDepartment || '';
        if (statusSelect) statusSelect.value = user.status !== false ? 'true' : 'false';
        
        // Check if editing own user and disable status field if trying to deactivate
        const isEditingOwnUser = usersData.currentLoggedInUserId && usersData.currentLoggedInUserId === numericUserId;
        if (statusSelect && isEditingOwnUser) {
            // Add warning message container if it doesn't exist
            let warningContainer = document.getElementById('editUserStatusWarning');
            if (!warningContainer) {
                warningContainer = document.createElement('div');
                warningContainer.id = 'editUserStatusWarning';
                warningContainer.className = 'mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg';
                statusSelect.parentElement.appendChild(warningContainer);
            }
            
            // Show warning and disable inactive option
            warningContainer.innerHTML = `
                <div class="flex items-start gap-2">
                    <i class="fas fa-exclamation-triangle text-yellow-600 mt-0.5"></i>
                    <p class="text-sm text-yellow-800">
                        <strong>Nota:</strong> No puedes desactivar tu propio estado de usuario. Si necesitas desactivar esta cuenta, solicita a otro administrador que lo haga.
                    </p>
                </div>
            `;
            warningContainer.style.display = 'block';
            
            // Disable the "Inactivo" option
            const inactiveOption = statusSelect.querySelector('option[value="false"]');
            if (inactiveOption) {
                inactiveOption.disabled = true;
            }
        } else if (statusSelect) {
            // Remove warning if exists and enable all options
            const warningContainer = document.getElementById('editUserStatusWarning');
            if (warningContainer) {
                warningContainer.style.display = 'none';
            }
            const inactiveOption = statusSelect.querySelector('option[value="false"]');
            if (inactiveOption) {
                inactiveOption.disabled = false;
            }
        }

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

    const form = document.getElementById('editUserForm');
    if (form) {
        form.reset();
        const imagePreview = document.getElementById('editUserImagePreview');
        const currentImage = document.getElementById('editUserCurrentImage');
        const imageIcon = document.getElementById('editUserImageIcon');

        if (imagePreview && currentImage && imageIcon) {
            currentImage.style.display = 'none';
            imageIcon.style.display = 'block';
            imagePreview.classList.remove('has-image');
        }
    }

    // Clear job title and labor department fields
    const jobTitleInput = document.getElementById('editUserJobTitle');
    const laborDepartmentInput = document.getElementById('editUserLaborDepartment');
    if (jobTitleInput) jobTitleInput.value = '';
    if (laborDepartmentInput) laborDepartmentInput.value = '';

    usersData.currentUserId = null;
}

window.showNewUserModal = showNewUserModal;
window.closeNewUserModal = closeNewUserModal;
window.showViewUserModal = showViewUserModal;
window.closeViewUserModal = closeViewUserModal;
window.showEditUserModal = showEditUserModal;
window.closeEditUserModal = closeEditUserModal;
window.showDeleteUserModal = showDeleteUserModal;
window.closeDeleteUserModal = closeDeleteUserModal;

function showDeleteUserModal(userId) {
    const numericUserId = typeof userId === 'string' ? parseInt(userId, 10) : userId;
    const user = usersData.users.find(u => u && u.id === numericUserId);

    if (!user) {
        showErrorToast('Usuario no encontrado', 'El usuario que intenta eliminar no existe o ya fue eliminado.');
        return;
    }

    usersData.currentUserId = userId;

    const message = document.getElementById('deleteUserMessage');
    const fullName = user.fullName || 'Usuario sin nombre';
    const email = user.email || 'Sin email';

    if (message) {
        if (user.role === 'ADMIN') {
            message.textContent = `No se puede eliminar el usuario "${fullName}" porque es un administrador del sistema. Contacte al soporte técnico si necesita ayuda.`;
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

function closeDeleteUserModal() {
    const modal = document.getElementById('deleteUserModal');
    if (modal) {
        modal.classList.add('hidden');
    }

    const deleteBtn = document.querySelector('#deleteUserModal button:last-child');
    if (deleteBtn) {
        deleteBtn.disabled = false;
        deleteBtn.textContent = 'Eliminar Usuario';
        deleteBtn.classList.remove('bg-gray-400', 'cursor-not-allowed');
        deleteBtn.classList.add('bg-red-600', 'hover:bg-red-700');
    }

    usersData.currentUserId = null;
}