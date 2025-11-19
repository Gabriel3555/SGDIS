async function showNewUserModal() {
     const modal = document.getElementById('newUserModal');
     if (modal) {
         modal.classList.remove('hidden');
     }

     // Initialize custom selects if not already done
     if (!window.roleSelect || !window.regionalSelect || !window.institutionSelect) {
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
        if (window.roleSelect) {
            window.roleSelect.clear();
        }
        if (window.regionalSelect) {
            window.regionalSelect.clear();
        }
        if (window.institutionSelect) {
            window.institutionSelect.clear();
        }
     }
 }

async function showViewUserModal(userId) {
    const numericUserId = typeof userId === 'string' ? parseInt(userId, 10) : userId;
    
    // Get user from local data first
    let user = usersData.users.find(u => u && u.id === numericUserId);
    
    // If user not found in local data or missing institution info, fetch from API
    if (!user || !user.institution) {
        try {
            const token = localStorage.getItem('jwt');
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const response = await fetch(`/api/v1/users/${numericUserId}`, {
                method: 'GET',
                headers: headers
            });

            if (response.ok) {
                user = await response.json();
            } else {
                // Fallback to local data if API fails
                if (!user) {
                    showErrorToast('Error', 'No se pudo cargar la información del usuario');
                    return;
                }
            }
        } catch (error) {
            console.error('Error fetching user details:', error);
            if (!user) {
                showErrorToast('Error', 'Error al cargar la información del usuario');
                return;
            }
        }
    }

    if (user) {
        const content = document.getElementById('viewUserContent');
        const fullName = user.fullName || 'Usuario sin nombre';
        const email = user.email || 'Sin email';
        const initials = fullName.charAt(0).toUpperCase();

        // Fetch institution and regional information
        let institutionName = user.institution || 'No asignada';
        let regionalName = 'No asignada';

        if (user.institution) {
            try {
                const token = localStorage.getItem('jwt');
                const headers = { 'Content-Type': 'application/json' };
                if (token) headers['Authorization'] = `Bearer ${token}`;

                // Get all institutions to find the one matching the name
                const institutionsResponse = await fetch('/api/v1/institutions', {
                    method: 'GET',
                    headers: headers
                });

                if (institutionsResponse.ok) {
                    const institutions = await institutionsResponse.json();
                    // Note: GetAllInstitutionResponse uses 'institutionId' not 'id'
                    const institution = institutions.find(inst => inst.name === user.institution);
                    
                    if (institution && institution.regionalId) {
                        // Get all regionals to find the one matching the regionalId
                        const regionalsResponse = await fetch('/api/v1/regional', {
                            method: 'GET',
                            headers: headers
                        });

                        if (regionalsResponse.ok) {
                            const regionals = await regionalsResponse.json();
                            const regional = regionals.find(reg => reg.id === institution.regionalId);
                            if (regional) {
                                regionalName = regional.name;
                            }
                        }
                    }
                }
            } catch (error) {
                console.error('Error fetching institution/regional info:', error);
                // Continue with default values
            }
        }

        if (content) {
            let profileDisplay;
            if (user.imgUrl) {
                profileDisplay = `<img src="${user.imgUrl}" alt="${fullName}" class="w-20 h-20 rounded-full object-cover border-2 border-gray-200 mx-auto mb-4">`;
            } else {
                profileDisplay = `<div class="w-20 h-20 bg-[#00AF00] rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">${initials}</div>`;
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
                        <span class="font-semibold ${user.status !== false ? 'text-[#00AF00]' : 'text-red-600'}">
                            ${user.status !== false ? 'Activo' : 'Inactivo'}
                        </span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-600">Institución:</span>
                        <span class="font-semibold">${institutionName}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-600">Regional:</span>
                        <span class="font-semibold">${regionalName}</span>
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

async function showEditUserModal(userId) {
    const numericUserId = typeof userId === 'string' ? parseInt(userId, 10) : userId;
    let user = usersData.users.find(u => u && u.id === numericUserId);
    
    // If user not found in local data or missing institution info, fetch from API
    if (!user || !user.institution) {
        try {
            const token = localStorage.getItem('jwt');
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const response = await fetch(`/api/v1/users/${numericUserId}`, {
                method: 'GET',
                headers: headers
            });

            if (response.ok) {
                user = await response.json();
            } else {
                if (!user) {
                    showErrorToast('Error', 'No se pudo cargar la información del usuario');
                    return;
                }
            }
        } catch (error) {
            console.error('Error fetching user details:', error);
            if (!user) {
                showErrorToast('Error', 'Error al cargar la información del usuario');
                return;
            }
        }
    }
    
    if (user) {
        usersData.currentUserId = userId;

        const fullNameInput = document.getElementById('editUserFullName');
        const emailInput = document.getElementById('editUserEmail');
        const jobTitleInput = document.getElementById('editUserJobTitle');
        const laborDepartmentInput = document.getElementById('editUserLaborDepartment');
        const statusSelect = document.getElementById('editUserStatus');

        if (fullNameInput) fullNameInput.value = user.fullName || '';
        if (emailInput) emailInput.value = user.email || '';
        if (jobTitleInput) jobTitleInput.value = user.jobTitle || '';
        if (laborDepartmentInput) laborDepartmentInput.value = user.laborDepartment || '';
        if (statusSelect) statusSelect.value = user.status !== false ? 'true' : 'false';
        
        // Initialize role select for edit modal
        const roleOptions = [
            { value: 'SUPERADMIN', label: 'Super Admin' },
            { value: 'ADMIN_INSTITUTION', label: 'Admin Institución' },
            { value: 'ADMIN_REGIONAL', label: 'Admin Regional' },
            { value: 'WAREHOUSE', label: 'Admin Almacén' },
            { value: 'USER', label: 'Usuario' }
        ];
        
        if (!window.editRoleSelect) {
            window.editRoleSelect = new CustomSelect('editUserRoleSelect', {
                placeholder: 'Seleccionar rol',
                onChange: function(option) {
                    // Clear error highlighting
                    const trigger = document.getElementById('editUserRoleSelect')?.querySelector('.custom-select-trigger');
                    if (trigger) {
                        trigger.classList.remove('border-red-500');
                    }
                }
            });
        }
        window.editRoleSelect.setOptions(roleOptions);
        
        // Set the selected role
        if (user.role) {
            window.editRoleSelect.setValue(user.role);
        }
        
        // Initialize regional and institution selects
        await loadRegionalsForEditUser();
        
        // Load institution if user has one
        if (user.institution) {
            try {
                const token = localStorage.getItem('jwt');
                const headers = { 'Content-Type': 'application/json' };
                if (token) headers['Authorization'] = `Bearer ${token}`;

                // Get all institutions to find the one matching the name
                const institutionsResponse = await fetch('/api/v1/institutions', {
                    method: 'GET',
                    headers: headers
                });

                if (institutionsResponse.ok) {
                    const institutions = await institutionsResponse.json();
                    const institution = institutions.find(inst => inst.name === user.institution);
                    
                    if (institution && institution.regionalId) {
                        // Set regional first
                        if (window.editRegionalSelect) {
                            window.editRegionalSelect.setValue(institution.regionalId.toString());
                            // Load institutions for that regional
                            const institutionSelect = await loadInstitutionsByRegionalForEdit(institution.regionalId.toString());
                            // Wait a bit for the CustomSelect to be ready
                            await new Promise(resolve => setTimeout(resolve, 100));
                            // Then set institution (GetAllInstitutionResponse uses 'institutionId' not 'id')
                            if (institutionSelect && institution.institutionId) {
                                // Set value with a small delay to ensure CustomSelect is ready
                                setTimeout(() => {
                                    if (institutionSelect && typeof institutionSelect.setValue === 'function') {
                                        institutionSelect.setValue(institution.institutionId.toString());
                                        // Also update the hidden input directly to ensure it's set
                                        const hiddenInput = document.getElementById('editUserInstitution');
                                        if (hiddenInput) {
                                            hiddenInput.value = institution.institutionId.toString();
                                        }
                                    }
                                }, 150);
                            }
                        }
                    }
                }
            } catch (error) {
                console.error('Error loading institution for edit:', error);
            }
        }
        
        // Check if editing own user
        const isEditingOwnUser = usersData.currentLoggedInUserId && usersData.currentLoggedInUserId === numericUserId;
        const currentLoggedInUserRole = usersData.currentLoggedInUserRole;
        const isAdmin = currentLoggedInUserRole === 'SUPERADMIN' || 
                       currentLoggedInUserRole === 'ADMIN_INSTITUTION' || 
                       currentLoggedInUserRole === 'ADMIN_REGIONAL';
        
        // Check if editing own user and is admin - disable role field
        const roleSelectContainer = document.getElementById('editUserRoleSelect');
        if (roleSelectContainer && isEditingOwnUser && isAdmin) {
            // Disable role select trigger
            const trigger = roleSelectContainer.querySelector('.custom-select-trigger');
            if (trigger) {
                trigger.style.pointerEvents = 'none';
                trigger.style.opacity = '0.6';
                trigger.style.cursor = 'not-allowed';
            }
            
            // Add warning message container if it doesn't exist
            let roleWarningContainer = document.getElementById('editUserRoleWarning');
            if (!roleWarningContainer) {
                roleWarningContainer = document.createElement('div');
                roleWarningContainer.id = 'editUserRoleWarning';
                roleWarningContainer.className = 'mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg';
                roleSelectContainer.parentElement.appendChild(roleWarningContainer);
            }
            
            // Show warning message
            roleWarningContainer.innerHTML = `
                <div class="flex items-start gap-2">
                    <i class="fas fa-exclamation-triangle text-yellow-600 mt-0.5"></i>
                    <p class="text-sm text-yellow-800">
                        <strong>Nota:</strong> No puedes cambiar tu propio rol. Si necesitas cambiar tu rol, solicita a otro administrador que lo haga.
                    </p>
                </div>
            `;
            roleWarningContainer.style.display = 'block';
        } else if (roleSelectContainer) {
            // Enable role select if not editing own user or not admin
            const trigger = roleSelectContainer.querySelector('.custom-select-trigger');
            if (trigger) {
                trigger.style.pointerEvents = '';
                trigger.style.opacity = '';
                trigger.style.cursor = '';
            }
            
            // Remove warning if exists
            const roleWarningContainer = document.getElementById('editUserRoleWarning');
            if (roleWarningContainer) {
                roleWarningContainer.style.display = 'none';
            }
        }
        
        // Check if editing own user and disable status field if trying to deactivate
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

    // Restore role select to enabled state
    const roleSelectContainer = document.getElementById('editUserRoleSelect');
    if (roleSelectContainer) {
        const trigger = roleSelectContainer.querySelector('.custom-select-trigger');
        if (trigger) {
            trigger.style.pointerEvents = '';
            trigger.style.opacity = '';
            trigger.style.cursor = '';
        }
    }
    
    // Clear role select
    if (window.editRoleSelect) {
        window.editRoleSelect.clear();
    }
    
    // Clear regional and institution selects
    if (window.editRegionalSelect) {
        window.editRegionalSelect.clear();
    }
    if (window.editInstitutionSelect) {
        window.editInstitutionSelect.clear();
    }
    
    // Hide role warning if exists
    const roleWarningContainer = document.getElementById('editUserRoleWarning');
    if (roleWarningContainer) {
        roleWarningContainer.style.display = 'none';
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
        if (!this.container) {
            console.error(`CustomSelect: Container with id "${containerId}" not found`);
            // Don't return undefined - throw error or create a dummy object
            throw new Error(`CustomSelect: Container with id "${containerId}" not found`);
        }

        this.trigger = this.container.querySelector('.custom-select-trigger');
        this.dropdown = this.container.querySelector('.custom-select-dropdown');
        this.searchInput = this.container.querySelector('.custom-select-search');
        this.optionsContainer = this.container.querySelector('.custom-select-options');
        this.textElement = this.container.querySelector('.custom-select-text');
        // Look for hidden input in container first, then in parent
        this.hiddenInput = this.container.querySelector('input[type="hidden"]') || 
                          this.container.parentElement?.querySelector('input[type="hidden"]');

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
        // Validate required elements
        if (!this.trigger || !this.dropdown || !this.searchInput || !this.optionsContainer || !this.textElement) {
            console.error('CustomSelect: Required elements not found', {
                trigger: !!this.trigger,
                dropdown: !!this.dropdown,
                searchInput: !!this.searchInput,
                optionsContainer: !!this.optionsContainer,
                textElement: !!this.textElement
            });
            return;
        }

        // Set initial placeholder
        this.textElement.textContent = this.placeholder;
        this.textElement.classList.add('custom-select-placeholder');

        // Event listeners
        if (this.trigger) {
            this.trigger.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                this.toggle();
            });
        }
        
        if (this.searchInput) {
            this.searchInput.addEventListener('input', (e) => this.filterOptions(e.target.value));
            this.searchInput.addEventListener('keydown', (e) => this.handleKeydown(e));
        }

        // Close on outside click - use a unique identifier to avoid conflicts
        this._outsideClickHandler = (e) => {
            if (!this.container.contains(e.target)) {
                this.close();
            }
        };
        document.addEventListener('click', this._outsideClickHandler);
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

        // Always update the hidden input, checking both locations
        if (this.hiddenInput) {
            this.hiddenInput.value = option.value;
        } else {
            // Fallback: try to find hidden input in parent container
            const container = this.container.closest('.custom-select-container');
            if (container) {
                const hiddenInput = container.querySelector('input[type="hidden"]');
                if (hiddenInput) {
                    hiddenInput.value = option.value;
                    this.hiddenInput = hiddenInput; // Cache it for future use
                }
            }
        }

        this.close();

        if (this.onChange) {
            this.onChange(option);
        }
    }

    toggle() {
        if (!this.container) return;
        
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
        if (!this.container) return;
        this.container.classList.add('open');
        
        // Add class to parent container to increase z-index
        const container = this.container.closest('.custom-select-container');
        if (container) {
            container.classList.add('select-open');
        }
        
        if (this.searchable && this.searchInput) {
            setTimeout(() => {
                if (this.searchInput) {
                    this.searchInput.focus();
                }
            }, 10);
        }
    }

    close() {
        this.container.classList.remove('open');
        
        // Remove class from parent container to restore z-index
        const container = this.container.closest('.custom-select-container');
        if (container) {
            container.classList.remove('select-open');
        }
        
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
        if (!value) return;
        
        // Convert value to string for comparison
        const stringValue = value.toString();
        const option = this.options.find(opt => opt.value === stringValue || opt.value.toString() === stringValue);
        
        if (option) {
            this.selectOption(option);
        } else {
            // If option not found, still update the hidden input and selected value
            // This can happen if setValue is called before options are loaded
            this.selectedValue = stringValue;
            if (this.hiddenInput) {
                this.hiddenInput.value = stringValue;
            }
            // Try to find and set the text if possible
            if (this.textElement) {
                // Try to find the label from the options or use the value
                const foundOption = this.options.find(opt => opt.value === stringValue || opt.value.toString() === stringValue);
                if (foundOption) {
                    this.textElement.textContent = foundOption.label;
                    this.textElement.classList.remove('custom-select-placeholder');
                }
            }
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
    // Role select
    const roleOptions = [
        { value: 'SUPERADMIN', label: 'Super Admin' },
        { value: 'ADMIN_INSTITUTION', label: 'Admin Institución' },
        { value: 'ADMIN_REGIONAL', label: 'Admin Regional' },
        { value: 'WAREHOUSE', label: 'Admin Almacén' },
        { value: 'USER', label: 'Usuario' }
    ];
    
    window.roleSelect = new CustomSelect('newUserRoleSelect', {
        placeholder: 'Seleccionar rol',
        onChange: function(option) {
            // Clear error highlighting
            const trigger = document.getElementById('newUserRoleSelect')?.querySelector('.custom-select-trigger');
            if (trigger) {
                trigger.classList.remove('border-red-500');
            }
        }
    });
    window.roleSelect.setOptions(roleOptions);

    // Regional select
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

    // Institution select
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
window.CustomSelect = CustomSelect;

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

// Function to load regionals for edit user modal
async function loadRegionalsForEditUser() {
    try {
        const token = localStorage.getItem('jwt');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch('/api/v1/regional', {
            method: 'GET',
            headers: headers
        });

        if (response.ok) {
            const regionals = await response.json();
            const options = regionals.map(regional => ({
                value: regional.id.toString(),
                label: regional.name
            }));

            if (!window.editRegionalSelect) {
                window.editRegionalSelect = new CustomSelect('editUserRegionalSelect', {
                    placeholder: 'Seleccionar regional',
                    onChange: function(option) {
                        // Clear error highlighting
                        const trigger = document.getElementById('editUserRegionalSelect')?.querySelector('.custom-select-trigger');
                        if (trigger) {
                            trigger.classList.remove('border-red-500');
                        }
                        
                        // Clear institution when regional changes
                        if (window.editInstitutionSelect) {
                            window.editInstitutionSelect.clear();
                        }
                        // Load institutions for selected regional
                        loadInstitutionsByRegionalForEdit(option.value);
                    }
                });
            }
            window.editRegionalSelect.setOptions(options);
        } else {
            showErrorToast('Error', 'No se pudieron cargar las regionales');
        }
    } catch (error) {
        console.error('Error loading regionals:', error);
        showErrorToast('Error', 'Error al cargar las regionales');
    }
}

// Function to load institutions by regional ID for edit user modal
async function loadInstitutionsByRegionalForEdit(regionalId) {
    try {
        const token = localStorage.getItem('jwt');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(`/api/v1/institutions/institutionsByRegionalId/${regionalId}`, {
            method: 'GET',
            headers: headers
        });

        if (response.ok) {
            const institutions = await response.json();
            const options = institutions.map(institution => ({
                value: institution.id.toString(),
                label: institution.name
            }));

            if (!window.editInstitutionSelect) {
                window.editInstitutionSelect = new CustomSelect('editUserInstitutionSelect', {
                    placeholder: 'Seleccionar institución',
                    onChange: function(option) {
                        // Clear error highlighting
                        const trigger = document.getElementById('editUserInstitutionSelect')?.querySelector('.custom-select-trigger');
                        if (trigger) {
                            trigger.classList.remove('border-red-500');
                        }
                    }
                });
            }
            window.editInstitutionSelect.setOptions(options);
            
            // Return the CustomSelect instance so we can use it after setting options
            return window.editInstitutionSelect;
        } else {
            showErrorToast('Error', 'No se pudieron cargar las instituciones');
        }
    } catch (error) {
        console.error('Error loading institutions:', error);
        showErrorToast('Error', 'Error al cargar las instituciones');
    }
}