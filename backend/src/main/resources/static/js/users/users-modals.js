async function showNewUserModal() {
     const modal = document.getElementById('newUserModal');
     if (modal) {
         modal.classList.remove('hidden');
     }

     // Initialize custom selects if not already done
     if (!window.regionalSelect || !window.institutionSelect) {
         initializeCustomSelects();
     }

     // Load regionals
     await loadRegionalsForNewUser();
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
         // Clear custom selects
         if (window.regionalSelect) {
             window.regionalSelect.clear();
         }
         if (window.institutionSelect) {
             window.institutionSelect.clear();
         }
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

// Custom Select Component
class CustomSelect {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;

        this.trigger = this.container.querySelector('.custom-select-trigger');
        this.dropdown = this.container.querySelector('.custom-select-dropdown');
        this.searchInput = this.container.querySelector('.custom-select-search');
        this.optionsContainer = this.container.querySelector('.custom-select-options');
        this.textElement = this.container.querySelector('.custom-select-text');
        this.hiddenInput = this.container.querySelector('input[type="hidden"]');

        this.options = [];
        this.filteredOptions = [];
        this.selectedValue = '';
        this.selectedText = '';
        this.placeholder = options.placeholder || 'Seleccionar...';
        this.searchable = options.searchable !== false;
        this.onChange = options.onChange || null;

        this.init();
    }

    init() {
        // Set initial placeholder
        this.textElement.textContent = this.placeholder;
        this.textElement.classList.add('custom-select-placeholder');

        // Event listeners
        this.trigger.addEventListener('click', () => this.toggle());
        this.searchInput.addEventListener('input', (e) => this.filterOptions(e.target.value));
        this.searchInput.addEventListener('keydown', (e) => this.handleKeydown(e));

        // Close on outside click
        document.addEventListener('click', (e) => {
            if (!this.container.contains(e.target)) {
                this.close();
            }
        });
    }

    setOptions(options) {
        this.options = options;
        this.filteredOptions = [...options];
        this.renderOptions();
    }

    renderOptions() {
        this.optionsContainer.innerHTML = '';

        if (this.filteredOptions.length === 0) {
            const noResults = document.createElement('div');
            noResults.className = 'custom-select-option disabled';
            noResults.textContent = 'No se encontraron resultados';
            this.optionsContainer.appendChild(noResults);
            return;
        }

        this.filteredOptions.forEach(option => {
            const optionElement = document.createElement('div');
            optionElement.className = 'custom-select-option';
            optionElement.textContent = option.label;
            optionElement.dataset.value = option.value;

            if (option.value === this.selectedValue) {
                optionElement.classList.add('selected');
            }

            optionElement.addEventListener('click', () => this.selectOption(option));
            this.optionsContainer.appendChild(optionElement);
        });
    }

    filterOptions(searchTerm) {
        if (!searchTerm.trim()) {
            this.filteredOptions = [...this.options];
        } else {
            this.filteredOptions = this.options.filter(option =>
                option.label.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        this.renderOptions();
    }

    selectOption(option) {
        this.selectedValue = option.value;
        this.selectedText = option.label;

        this.textElement.textContent = option.label;
        this.textElement.classList.remove('custom-select-placeholder');

        if (this.hiddenInput) {
            this.hiddenInput.value = option.value;
        }

        this.close();

        if (this.onChange) {
            this.onChange(option);
        }
    }

    toggle() {
        const isOpen = this.container.classList.contains('open');

        // Close all other selects
        document.querySelectorAll('.custom-select.open').forEach(select => {
            if (select !== this.container) {
                select.classList.remove('open');
            }
        });

        if (isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    open() {
        this.container.classList.add('open');
        if (this.searchable && this.searchInput) {
            this.searchInput.focus();
        }
    }

    close() {
        this.container.classList.remove('open');
        if (this.searchInput) {
            this.searchInput.value = '';
            this.filterOptions('');
        }
    }

    handleKeydown(e) {
        if (e.key === 'Escape') {
            this.close();
        } else if (e.key === 'Enter') {
            e.preventDefault();
            const firstOption = this.optionsContainer.querySelector('.custom-select-option:not(.disabled)');
            if (firstOption) {
                const value = firstOption.dataset.value;
                const option = this.options.find(opt => opt.value === value);
                if (option) {
                    this.selectOption(option);
                }
            }
        }
    }

    getValue() {
        return this.selectedValue;
    }

    setValue(value) {
        const option = this.options.find(opt => opt.value === value);
        if (option) {
            this.selectOption(option);
        }
    }

    clear() {
        this.selectedValue = '';
        this.selectedText = '';
        this.textElement.textContent = this.placeholder;
        this.textElement.classList.add('custom-select-placeholder');

        if (this.hiddenInput) {
            this.hiddenInput.value = '';
        }

        this.renderOptions();
    }
}

// Initialize custom selects for new user modal
function initializeCustomSelects() {
    window.regionalSelect = new CustomSelect('newUserRegionalSelect', {
        placeholder: 'Seleccionar regional',
        onChange: function(option) {
            // Clear error highlighting
            const trigger = document.getElementById('newUserRegionalSelect')?.querySelector('.custom-select-trigger');
            if (trigger) {
                trigger.classList.remove('border-red-500');
            }
            
            // Clear institution when regional changes
            if (window.institutionSelect) {
                window.institutionSelect.clear();
            }
            // Load institutions for selected regional
            loadInstitutionsByRegional(option.value);
        }
    });

    window.institutionSelect = new CustomSelect('newUserInstitutionSelect', {
        placeholder: 'Seleccionar institución',
        onChange: function(option) {
            // Clear error highlighting
            const trigger = document.getElementById('newUserInstitutionSelect')?.querySelector('.custom-select-trigger');
            if (trigger) {
                trigger.classList.remove('border-red-500');
            }
        }
    });
}

window.initializeCustomSelects = initializeCustomSelects;

async function showDeleteUserModal(userId) {
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
        if (user.role === 'SUPERADMIN' || user.role === 'ADMIN_INSTITUTION' || user.role === 'ADMIN_REGIONAL') {
            message.textContent = `No se puede eliminar el usuario "${fullName}" porque es un administrador del sistema. Contacte al soporte técnico si necesita ayuda.`;
            setTimeout(() => {
                const deleteBtn = document.getElementById('deleteUserButton');
                if (deleteBtn) {
                    deleteBtn.style.display = 'none';
                }
            }, 100);
        } else {
            // Check if user has managed inventories (both owned and managed)
            try {
                const token = localStorage.getItem('jwt');
                const headers = { 'Content-Type': 'application/json' };
                if (token) headers['Authorization'] = `Bearer ${token}`;

                const response = await fetch(`/api/v1/users/${numericUserId}/inventories`, {
                    method: 'GET',
                    headers: headers
                });

                if (response.ok) {
                    const inventories = await response.json();
                    if (inventories && inventories.length > 0) {
                        message.innerHTML = `
                            <div class="space-y-2">
                                <p><strong>No se puede eliminar el usuario "${fullName}"</strong></p>
                                <p class="text-sm">Este usuario tiene <strong>${inventories.length} inventario(s)</strong> asignado(s) como propietario o gestor:</p>
                                <ul class="text-sm list-disc list-inside max-h-32 overflow-y-auto bg-yellow-50 p-2 rounded">
                                    ${inventories.slice(0, 5).map(inv => `<li>${inv.name || 'Inventario sin nombre'}</li>`).join('')}
                                    ${inventories.length > 5 ? `<li class="font-semibold">... y ${inventories.length - 5} más</li>` : ''}
                                </ul>
                                <p class="text-sm text-yellow-800">Por favor, transfiere la propiedad y gestión de todos los inventarios a otro usuario antes de eliminarlo.</p>
                            </div>
                        `;
                        setTimeout(() => {
                            const deleteBtn = document.getElementById('deleteUserButton');
                            if (deleteBtn) {
                                deleteBtn.style.display = 'none';
                            }
                        }, 100);
                    } else {
                        // No inventories, can delete
                        message.textContent = `¿Está seguro de que desea eliminar al usuario "${fullName}" (${email})? Esta acción no se puede deshacer.`;
                        setTimeout(() => {
                            const deleteBtn = document.getElementById('deleteUserButton');
                            if (deleteBtn) {
                                deleteBtn.style.display = '';
                                deleteBtn.disabled = false;
                            }
                        }, 100);
                    }
                } else {
                    // If API call fails, show warning but allow deletion
                    message.textContent = `¿Está seguro de que desea eliminar al usuario "${fullName}" (${email})? Esta acción no se puede deshacer.`;
                    setTimeout(() => {
                        const deleteBtn = document.getElementById('deleteUserButton');
                        if (deleteBtn) {
                            deleteBtn.style.display = '';
                            deleteBtn.disabled = false;
                        }
                    }, 100);
                }
            } catch (error) {
                console.error('Error checking user inventories:', error);
                // If error occurs, show default message and allow deletion attempt
                message.textContent = `¿Está seguro de que desea eliminar al usuario "${fullName}" (${email})? Esta acción no se puede deshacer.`;
                setTimeout(() => {
                    const deleteBtn = document.getElementById('deleteUserButton');
                    if (deleteBtn) {
                        deleteBtn.style.display = '';
                        deleteBtn.disabled = false;
                    }
                }, 100);
            }
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

    // Restore the delete button to its default state
    const deleteBtn = document.getElementById('deleteUserButton');
    const cancelBtn = document.querySelector('#deleteUserModalActions button:first-child');
    
    if (deleteBtn) {
        deleteBtn.style.display = '';
        deleteBtn.disabled = false;
        deleteBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        deleteBtn.innerHTML = 'Eliminar Usuario';
    }
    
    if (cancelBtn) {
        cancelBtn.disabled = false;
        cancelBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    }

    // Reset the message
    const message = document.getElementById('deleteUserMessage');
    if (message) {
        message.textContent = 'Esta acción no se puede deshacer.';
        message.innerHTML = 'Esta acción no se puede deshacer.';
    }

    // Reset delete flag if modal is being closed
    if (window.isDeletingUser !== undefined) {
        window.isDeletingUser = false;
    }

    usersData.currentUserId = null;
}