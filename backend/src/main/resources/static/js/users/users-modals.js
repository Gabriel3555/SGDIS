async function showNewUserModal() {
     const modal = document.getElementById('newUserModal');
     if (modal) {
         modal.classList.remove('hidden');
     }

     // Get current user info to check role and institution
     const currentRole = window.usersData ? window.usersData.currentLoggedInUserRole : '';
     const isAdminInstitution = currentRole === 'ADMIN_INSTITUTION';
     
     // Hide/disable regional and institution selectors for ADMIN_INSTITUTION
     const regionalSelect = document.getElementById('newUserRegionalSelect');
     const institutionSelect = document.getElementById('newUserInstitutionSelect');
     
     if (isAdminInstitution) {
         // Hide regional and institution selectors by finding their parent divs in the grid
         const grid = document.querySelector('#newUserModal .grid');
         if (grid) {
             const gridDivs = grid.querySelectorAll('div');
             gridDivs.forEach(div => {
                 if (div.contains(regionalSelect)) {
                     div.style.display = 'none';
                 }
                 if (div.contains(institutionSelect)) {
                     div.style.display = 'none';
                 }
             });
         }
         
         // Get current user's institution info
         try {
             const token = localStorage.getItem('jwt');
             const headers = { 'Content-Type': 'application/json' };
             if (token) headers['Authorization'] = `Bearer ${token}`;
             
             const response = await fetch('/api/v1/users/me', {
                 method: 'GET',
                 headers: headers
             });
             
             if (response.ok) {
                 const currentUser = await response.json();
                 // Store current user's institution name for later use
                 window.currentUserInstitutionName = currentUser.institution;
                 
                 // Get institution ID from institutions list
                 const institutionsResponse = await fetch('/api/v1/institutions', {
                     method: 'GET',
                     headers: headers
                 });
                 
                 if (institutionsResponse.ok) {
                     const institutions = await institutionsResponse.json();
                     const institution = institutions.find(inst => inst.name === currentUser.institution);
                     if (institution) {
                         // Store institution ID for form submission (GetAllInstitutionResponse uses institutionId, InstitutionResponse uses id)
                         window.currentUserInstitutionId = institution.institutionId || institution.id;
                         if (!window.currentUserInstitutionId) {
                             console.error('Could not find institution ID in response:', institution);
                         }
                     } else {
                         console.error('Could not find institution with name:', currentUser.institution);
                     }
                 }
             }
         } catch (error) {
             console.error('Error loading current user institution:', error);
         }
     } else {
         // Show regional and institution selectors for other roles
         const grid = document.querySelector('#newUserModal .grid');
         if (grid) {
             const gridDivs = grid.querySelectorAll('div');
             gridDivs.forEach(div => {
                 if (div.contains(regionalSelect) || div.contains(institutionSelect)) {
                     div.style.display = '';
                 }
             });
         }
     }

     // Initialize custom selects if not already done
     if (!window.roleSelect || !window.regionalSelect || !window.institutionSelect || !window.jobTitleSelect) {
         initializeCustomSelects();
     } else {
         // Update role options based on current user role
         updateRoleOptionsForCurrentUser();
     }

     // Load regionals only if not ADMIN_INSTITUTION
     if (!isAdminInstitution) {
         await loadRegionalsForNewUser();
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
    const laborDepartmentInput = document.getElementById('newUserLaborDepartment');
    if (window.jobTitleSelect) {
        window.jobTitleSelect.clear();
    }
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
     
     // Reset display of regional and institution fields
     const regionalSelect = document.getElementById('newUserRegionalSelect');
     const institutionSelect = document.getElementById('newUserInstitutionSelect');
     const grid = document.querySelector('#newUserModal .grid');
     if (grid) {
         const gridDivs = grid.querySelectorAll('div');
         gridDivs.forEach(div => {
             if (div.contains(regionalSelect) || div.contains(institutionSelect)) {
                 div.style.display = '';
             }
         });
     }
     
     // Clear stored institution info
     window.currentUserInstitutionId = null;
     window.currentUserInstitutionName = null;
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
                
                <!-- Action buttons for Admin Regional -->
                ${(() => {
                    const currentRole = window.currentUserRole || window.usersData?.currentLoggedInUserRole || '';
                    const isAdminRegional = currentRole === 'ADMIN_REGIONAL' || 
                                          (window.location.pathname && window.location.pathname.includes('/admin_regional'));
                    if (isAdminRegional) {
                        return `
                            <div class="mt-6 pt-6 border-t border-gray-200">
                                <h4 class="text-sm font-semibold text-gray-700 mb-3">Acciones</h4>
                                <div class="grid grid-cols-2 gap-2">
                                    <button onclick="showUserLoansModal('${user.id}')" class="flex items-center justify-center gap-2 px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg transition-colors">
                                        <i class="fas fa-hand-holding"></i>
                                        <span class="text-sm font-medium">Ver Préstamos</span>
                                    </button>
                                    <button onclick="showUserInventoriesModal('${user.id}', 'owner')" class="flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors">
                                        <i class="fas fa-crown"></i>
                                        <span class="text-sm font-medium">Owner</span>
                                    </button>
                                    <button onclick="showUserInventoriesModal('${user.id}', 'signatory')" class="flex items-center justify-center gap-2 px-4 py-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg transition-colors">
                                        <i class="fas fa-signature"></i>
                                        <span class="text-sm font-medium">Signatory</span>
                                    </button>
                                    <button onclick="showUserInventoriesModal('${user.id}', 'manager')" class="flex items-center justify-center gap-2 px-4 py-2 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-lg transition-colors">
                                        <i class="fas fa-user-cog"></i>
                                        <span class="text-sm font-medium">Manager</span>
                                    </button>
                                </div>
                            </div>
                        `;
                    }
                    return '';
                })()}
            `;
        }

        const modal = document.getElementById('viewUserModal');

        if (modal) {
            // Setup handlers if not already done
            setupViewUserModalHandlers();
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

// Setup modal close handlers (only once)
let viewUserModalHandlersSetup = false;
function setupViewUserModalHandlers() {
    if (viewUserModalHandlersSetup) return;
    
    const viewUserModal = document.getElementById('viewUserModal');
    if (viewUserModal) {
        // Close modal when clicking outside of it
        viewUserModal.addEventListener('click', function(e) {
            // Close modal if clicking on the backdrop (not on the modal content)
            if (e.target === viewUserModal) {
                closeViewUserModal();
            }
        });
        
        viewUserModalHandlersSetup = true;
    }
    
    // Close modal on Escape key (global listener)
    if (!window.viewUserModalEscapeHandler) {
        window.viewUserModalEscapeHandler = function(e) {
            if (e.key === 'Escape') {
                const modal = document.getElementById('viewUserModal');
                if (modal && !modal.classList.contains('hidden')) {
                    closeViewUserModal();
                }
            }
        };
        document.addEventListener('keydown', window.viewUserModalEscapeHandler);
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
        const laborDepartmentInput = document.getElementById('editUserLaborDepartment');
        const statusSelect = document.getElementById('editUserStatus');

        if (fullNameInput) fullNameInput.value = user.fullName || '';
        if (emailInput) emailInput.value = user.email || '';
        // Set job title using CustomSelect
        if (window.editJobTitleSelect && user.jobTitle) {
            window.editJobTitleSelect.setValue(user.jobTitle);
        } else if (window.editJobTitleSelect) {
            window.editJobTitleSelect.clear();
        }
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
        
        // Initialize job title select
        initializeJobTitleSelectForEdit();
        
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
    const laborDepartmentInput = document.getElementById('editUserLaborDepartment');
    if (window.editJobTitleSelect) {
        window.editJobTitleSelect.clear();
    }
    if (laborDepartmentInput) laborDepartmentInput.value = '';

    usersData.currentUserId = null;
}

// Store loans data globally for filtering
let userLoansData = {
    allLoans: [],
    currentFilter: 'all'
};

async function showUserLoansModal(userId) {
    const numericUserId = typeof userId === 'string' ? parseInt(userId, 10) : userId;
    
    // Get user from local data first
    let user = usersData.users.find(u => u && u.id === numericUserId);
    
    // If user not found in local data, fetch from API
    if (!user) {
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
                showErrorToast('Error', 'No se pudo cargar la información del usuario');
                return;
            }
        } catch (error) {
            console.error('Error fetching user details:', error);
            showErrorToast('Error', 'Error al cargar la información del usuario');
            return;
        }
    }

    if (!user) {
        showErrorToast('Error', 'Usuario no encontrado');
        return;
    }

    // Update modal title with user name
    const userNameElement = document.getElementById('userLoansUserName');
    if (userNameElement) {
        userNameElement.textContent = user.fullName || user.email || 'Usuario';
    }

    // Show loading state
    const loadingElement = document.getElementById('userLoansLoading');
    const contentElement = document.getElementById('userLoansContent');
    const statsElement = document.getElementById('userLoansStats');
    const filtersElement = document.getElementById('userLoansFilters');
    const loansListElement = document.getElementById('userLoansList');
    const loansEmptyElement = document.getElementById('userLoansEmpty');

    if (loadingElement) loadingElement.style.display = 'block';
    if (contentElement) contentElement.style.display = 'none';
    if (statsElement) statsElement.style.display = 'none';
    if (filtersElement) filtersElement.style.display = 'none';

    // Open modal
    const modal = document.getElementById('userLoansModal');
    if (modal) {
        modal.classList.remove('hidden');
    }

    // Load loans
    try {
        const token = localStorage.getItem('jwt');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(`/api/v1/users/${numericUserId}/loans`, {
            method: 'GET',
            headers: headers
        });

        let loans = [];
        if (response.ok) {
            loans = await response.json();
        } else if (response.status === 404) {
            console.warn('Loans endpoint not found, trying alternative...');
            loans = [];
        } else if (response.status === 403) {
            // Permission denied - show friendly message
            if (loadingElement) {
                loadingElement.innerHTML = `
                    <i class="fas fa-lock text-3xl text-yellow-500 mb-4"></i>
                    <p class="text-yellow-600 font-medium">No tienes permisos para ver los préstamos de este usuario</p>
                    <p class="text-gray-500 text-sm mt-2">Contacta al administrador si necesitas acceso</p>
                `;
            }
            return;
        } else {
            throw new Error('Error al cargar los préstamos');
        }

        // Store loans globally
        userLoansData.allLoans = loans;
        userLoansData.currentFilter = 'all';

        // Display loans with statistics
        displayUserLoans(loans, loadingElement, contentElement, statsElement, filtersElement, loansListElement, loansEmptyElement);
    } catch (error) {
        console.error('Error loading user loans:', error);
        showErrorToast('Error', 'Error al cargar los préstamos del usuario');
        if (loadingElement) {
            loadingElement.innerHTML = `
                <i class="fas fa-exclamation-triangle text-3xl text-red-500 mb-4"></i>
                <p class="text-red-600">Error al cargar los préstamos</p>
                <button onclick="showUserLoansModal('${numericUserId}')" class="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors">
                    Reintentar
                </button>
            `;
        }
    }
}

function displayUserLoans(loans, loadingElement, contentElement, statsElement, filtersElement, loansListElement, loansEmptyElement) {
    if (loadingElement) loadingElement.style.display = 'none';
    if (contentElement) contentElement.style.display = 'block';

    // Calculate statistics
    const totalLoans = loans.length;
    const activeLoans = loans.filter(loan => !loan.returned).length;
    const returnedLoans = loans.filter(loan => loan.returned === true).length;

    // Update statistics
    if (statsElement) {
        document.getElementById('totalLoansCount').textContent = totalLoans;
        document.getElementById('activeLoansCount').textContent = activeLoans;
        document.getElementById('returnedLoansCount').textContent = returnedLoans;
        statsElement.style.display = 'grid';
    }

    // Show filters if there are loans
    if (filtersElement && totalLoans > 0) {
        filtersElement.style.display = 'flex';
        // Reset filter buttons
        document.getElementById('filterAll').className = 'px-4 py-2 rounded-lg font-medium transition-colors bg-purple-600 text-white';
        document.getElementById('filterActive').className = 'px-4 py-2 rounded-lg font-medium transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200';
        document.getElementById('filterReturned').className = 'px-4 py-2 rounded-lg font-medium transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200';
    }

    // Filter loans based on current filter
    let filteredLoans = loans;
    if (userLoansData.currentFilter === 'active') {
        filteredLoans = loans.filter(loan => !loan.returned);
    } else if (userLoansData.currentFilter === 'returned') {
        filteredLoans = loans.filter(loan => loan.returned === true);
    }

    if (!filteredLoans || filteredLoans.length === 0) {
        if (loansListElement) loansListElement.style.display = 'none';
        if (loansEmptyElement) {
            loansEmptyElement.style.display = 'block';
            const emptyMessage = userLoansData.currentFilter === 'all' 
                ? 'Este usuario no tiene préstamos registrados'
                : userLoansData.currentFilter === 'active'
                ? 'Este usuario no tiene préstamos activos'
                : 'Este usuario no tiene préstamos devueltos';
            loansEmptyElement.querySelector('p').textContent = emptyMessage;
        }
        return;
    }

    if (loansListElement) loansListElement.style.display = 'block';
    if (loansEmptyElement) loansEmptyElement.style.display = 'none';

    loansListElement.innerHTML = filteredLoans.map(loan => {
        const lendDate = loan.lendAt ? new Date(loan.lendAt).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }) : 'Fecha no disponible';

        const returnDate = loan.returnAt ? new Date(loan.returnAt).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }) : null;

        const isReturned = loan.returned === true;
        const statusBadge = isReturned 
            ? '<span class="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold"><i class="fas fa-check-circle mr-1"></i>Devuelto</span>'
            : '<span class="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold"><i class="fas fa-clock mr-1"></i>Prestado</span>';

        // Calculate duration if returned
        let durationInfo = '';
        if (isReturned && loan.lendAt && loan.returnAt) {
            const lendDateObj = new Date(loan.lendAt);
            const returnDateObj = new Date(loan.returnAt);
            const diffTime = Math.abs(returnDateObj - lendDateObj);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            durationInfo = `<div class="text-xs text-gray-500 mt-1">
                <i class="fas fa-hourglass-half"></i> Duración: ${diffDays} día${diffDays !== 1 ? 's' : ''}
            </div>`;
        } else if (!isReturned && loan.lendAt) {
            const lendDateObj = new Date(loan.lendAt);
            const now = new Date();
            const diffTime = Math.abs(now - lendDateObj);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            durationInfo = `<div class="text-xs text-yellow-600 mt-1">
                <i class="fas fa-hourglass-half"></i> Prestado hace: ${diffDays} día${diffDays !== 1 ? 's' : ''}
            </div>`;
        }

        return `
            <div class="loan-card border ${isReturned ? 'border-green-200' : 'border-yellow-200'} rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
                <div class="flex items-start justify-between mb-3">
                    <div class="flex-1">
                        <div class="flex items-center gap-3 mb-2">
                            <i class="fas fa-box text-purple-600 text-xl"></i>
                            <div class="flex-1">
                                <h4 class="font-bold text-gray-800">Item #${loan.itemId || 'N/A'}</h4>
                                <p class="text-sm text-gray-600">Prestado por: ${loan.lenderName || 'N/A'}</p>
                                ${durationInfo}
                            </div>
                        </div>
                        ${loan.detailsLend ? `
                            <div class="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-600">
                                <i class="fas fa-info-circle text-gray-400 mr-1"></i>
                                <strong>Detalles del préstamo:</strong> ${loan.detailsLend}
                            </div>
                        ` : ''}
                        ${isReturned && loan.detailsReturn ? `
                            <div class="mt-2 p-2 bg-green-50 rounded text-sm text-gray-600">
                                <i class="fas fa-check-circle text-green-600 mr-1"></i>
                                <strong>Detalles de devolución:</strong> ${loan.detailsReturn}
                            </div>
                        ` : ''}
                    </div>
                    ${statusBadge}
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm pt-3 border-t border-gray-200">
                    <div class="flex items-center gap-2 text-gray-600">
                        <i class="fas fa-calendar-alt text-gray-400"></i>
                        <span><strong>Fecha de préstamo:</strong> ${lendDate}</span>
                    </div>
                    ${returnDate ? `
                        <div class="flex items-center gap-2 text-gray-600">
                            <i class="fas fa-calendar-check text-gray-400"></i>
                            <span><strong>Fecha de devolución:</strong> ${returnDate}</span>
                        </div>
                    ` : '<div class="text-gray-400 text-xs">Pendiente de devolución</div>'}
                </div>
            </div>
        `;
    }).join('');
}

function filterUserLoans(filter) {
    userLoansData.currentFilter = filter;
    
    // Update filter buttons
    document.getElementById('filterAll').className = filter === 'all' 
        ? 'px-4 py-2 rounded-lg font-medium transition-colors bg-purple-600 text-white'
        : 'px-4 py-2 rounded-lg font-medium transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200';
    
    document.getElementById('filterActive').className = filter === 'active'
        ? 'px-4 py-2 rounded-lg font-medium transition-colors bg-purple-600 text-white'
        : 'px-4 py-2 rounded-lg font-medium transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200';
    
    document.getElementById('filterReturned').className = filter === 'returned'
        ? 'px-4 py-2 rounded-lg font-medium transition-colors bg-purple-600 text-white'
        : 'px-4 py-2 rounded-lg font-medium transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200';

    // Re-display loans with new filter
    const loadingElement = document.getElementById('userLoansLoading');
    const contentElement = document.getElementById('userLoansContent');
    const statsElement = document.getElementById('userLoansStats');
    const filtersElement = document.getElementById('userLoansFilters');
    const loansListElement = document.getElementById('userLoansList');
    const loansEmptyElement = document.getElementById('userLoansEmpty');

    displayUserLoans(
        userLoansData.allLoans,
        loadingElement,
        contentElement,
        statsElement,
        filtersElement,
        loansListElement,
        loansEmptyElement
    );
}

function closeUserLoansModal() {
    const modal = document.getElementById('userLoansModal');
    if (modal) {
        modal.classList.add('hidden');
    }
    
    // Reset filter state
    userLoansData.currentFilter = 'all';
    userLoansData.allLoans = [];
}

window.showNewUserModal = showNewUserModal;
window.closeNewUserModal = closeNewUserModal;
window.showViewUserModal = showViewUserModal;
window.closeViewUserModal = closeViewUserModal;
window.showEditUserModal = showEditUserModal;
window.closeEditUserModal = closeEditUserModal;
window.showDeleteUserModal = showDeleteUserModal;
window.closeDeleteUserModal = closeDeleteUserModal;
window.showUserLoansModal = showUserLoansModal;

// User Inventories Modal Functions
async function showUserInventoriesModal(userId, type) {
    const numericUserId = typeof userId === 'string' ? parseInt(userId, 10) : userId;
    
    // Get user from local data first
    let user = usersData.users.find(u => u && u.id === numericUserId);
    
    // If user not found in local data, fetch from API
    if (!user) {
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
                showErrorToast('Error', 'No se pudo cargar la información del usuario');
                return;
            }
        } catch (error) {
            console.error('Error fetching user details:', error);
            showErrorToast('Error', 'Error al cargar la información del usuario');
            return;
        }
    }

    if (!user) {
        showErrorToast('Error', 'Usuario no encontrado');
        return;
    }

    // Update modal title based on type
    const titleElement = document.getElementById('userInventoriesTitle');
    const userNameElement = document.getElementById('userInventoriesUserName');
    const iconElement = document.getElementById('userInventoriesIcon');
    
    let title = '';
    let iconClass = '';
    let iconColor = '';
    const userName = user.fullName || user.email || 'Usuario';
    
    if (type === 'owner') {
        title = `Inventario de ${userName}`;
        iconClass = 'fa-crown';
        iconColor = 'text-blue-600';
    } else if (type === 'signatory') {
        title = 'Inventarios como Signatory';
        iconClass = 'fa-signature';
        iconColor = 'text-green-600';
    } else if (type === 'manager') {
        title = 'Inventarios como Manager';
        iconClass = 'fa-user-cog';
        iconColor = 'text-orange-600';
    }
    
    if (titleElement) titleElement.textContent = title;
    if (userNameElement) userNameElement.textContent = userName;
    if (iconElement) {
        iconElement.className = `fas ${iconClass} ${iconColor} text-3xl`;
    }

    // Show loading state
    const loadingElement = document.getElementById('userInventoriesLoading');
    const contentElement = document.getElementById('userInventoriesContent');
    const inventoriesListElement = document.getElementById('userInventoriesList');
    const inventoriesEmptyElement = document.getElementById('userInventoriesEmpty');

    if (loadingElement) loadingElement.style.display = 'block';
    if (contentElement) contentElement.style.display = 'none';
    if (inventoriesEmptyElement) inventoriesEmptyElement.style.display = 'none';

    // Open modal
    const modal = document.getElementById('userInventoriesModal');
    if (modal) {
        modal.classList.remove('hidden');
    }

    // Load inventories
    try {
        const token = localStorage.getItem('jwt');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        let endpoint = '';
        if (type === 'owner') {
            endpoint = `/api/v1/users/${numericUserId}/inventories/owner`;
        } else if (type === 'signatory') {
            endpoint = `/api/v1/users/${numericUserId}/inventories/signatory`;
        } else if (type === 'manager') {
            endpoint = `/api/v1/inventory/managed/${numericUserId}`;
        }

        const response = await fetch(endpoint, {
            method: 'GET',
            headers: headers
        });

        let inventories = [];
        if (response.ok) {
            inventories = await response.json();
        } else if (response.status === 404) {
            inventories = [];
        } else if (response.status === 403) {
            // Permission denied - show friendly message
            if (loadingElement) {
                loadingElement.innerHTML = `
                    <i class="fas fa-lock text-3xl text-yellow-500 mb-4"></i>
                    <p class="text-yellow-600 font-medium">No tienes permisos para ver los inventarios de este usuario</p>
                    <p class="text-gray-500 text-sm mt-2">Contacta al administrador si necesitas acceso</p>
                `;
            }
            return;
        } else {
            throw new Error('Error al cargar los inventarios');
        }

        // Display inventories
        displayUserInventories(inventories, loadingElement, contentElement, inventoriesListElement, inventoriesEmptyElement, type);
    } catch (error) {
        console.error('Error loading user inventories:', error);
        showErrorToast('Error', 'Error al cargar los inventarios del usuario');
        if (loadingElement) {
            loadingElement.innerHTML = `
                <i class="fas fa-exclamation-triangle text-3xl text-red-500 mb-4"></i>
                <p class="text-red-600">Error al cargar los inventarios</p>
                <button onclick="showUserInventoriesModal('${numericUserId}', '${type}')" class="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                    Reintentar
                </button>
            `;
        }
    }
}

function displayUserInventories(inventories, loadingElement, contentElement, inventoriesListElement, inventoriesEmptyElement, type) {
    if (loadingElement) loadingElement.style.display = 'none';
    if (contentElement) contentElement.style.display = 'block';

    if (!inventories || inventories.length === 0) {
        if (inventoriesEmptyElement) inventoriesEmptyElement.style.display = 'block';
        if (inventoriesListElement) inventoriesListElement.innerHTML = '';
        return;
    }

    if (inventoriesEmptyElement) inventoriesEmptyElement.style.display = 'none';

    // Si es Owner, hacer el inventario más grande ya que solo se puede poseer uno
    const isOwner = type === 'owner';
    const cardClasses = isOwner 
        ? 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-2xl p-6 hover:shadow-xl transition-all duration-300' 
        : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 hover:shadow-lg transition-all duration-300';

    let inventoriesHtml = '';
    inventories.forEach(inventory => {
        const statusColor = inventory.status 
            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' 
            : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400';
        const statusText = inventory.status ? 'Activo' : 'Inactivo';
        const totalPrice = inventory.totalPrice ? `$${inventory.totalPrice.toLocaleString('es-ES')}` : '$0';
        const location = inventory.location || 'Sin ubicación';
        const name = inventory.name || 'Sin nombre';
        const institution = inventory.institutionName || 'Sin institución';
        const quantityItems = inventory.quantityItems || 0;
        const uuid = inventory.uuid ? inventory.uuid.toString() : 'N/A';

        inventoriesHtml += `
            <div class="${cardClasses}">
                <div class="flex items-start justify-between mb-3">
                    <div class="flex items-center gap-3 flex-1 min-w-0">
                        <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700 rounded-xl flex items-center justify-center text-white text-xl font-bold shadow-lg flex-shrink-0">
                            <i class="fas fa-box"></i>
                        </div>
                        <div class="flex-1 min-w-0">
                            <h3 class="text-lg font-bold text-gray-800 dark:text-gray-100 mb-1 truncate">${name}</h3>
                            <p class="text-xs text-gray-500 dark:text-gray-400">ID: ${inventory.id}</p>
                        </div>
                    </div>
                    <span class="px-3 py-1 rounded-full text-xs font-semibold ${statusColor} flex-shrink-0 ml-2">
                        ${statusText}
                    </span>
                </div>

                <div class="space-y-2">
                    <div class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                        <i class="fas fa-map-marker-alt text-blue-500 dark:text-blue-400 w-4"></i>
                        <span class="truncate">${location}</span>
                    </div>
                    <div class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                        <i class="fas fa-building text-blue-500 dark:text-blue-400 w-4"></i>
                        <span class="truncate">${institution}</span>
                    </div>
                    <div class="grid grid-cols-2 gap-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                        <div class="flex items-center gap-2">
                            <div class="w-9 h-9 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                                <i class="fas fa-cubes text-green-600 dark:text-green-400 text-sm"></i>
                            </div>
                            <div class="min-w-0">
                                <p class="text-xs text-gray-500 dark:text-gray-400">Items</p>
                                <p class="text-base font-bold text-gray-800 dark:text-gray-100">${quantityItems}</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-2">
                            <div class="w-9 h-9 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                                <i class="fas fa-dollar-sign text-emerald-600 dark:text-emerald-400 text-sm"></i>
                            </div>
                            <div class="min-w-0">
                                <p class="text-xs text-gray-500 dark:text-gray-400">Valor Total</p>
                                <p class="text-base font-bold text-gray-800 dark:text-gray-100 truncate">${totalPrice}</p>
                            </div>
                        </div>
                    </div>
                    ${uuid !== 'N/A' ? `
                    <div class="pt-2 border-t border-gray-200 dark:border-gray-700">
                        <div class="flex items-center gap-2">
                            <i class="fas fa-fingerprint text-gray-400 dark:text-gray-500 text-xs w-4"></i>
                            <p class="text-xs font-mono text-gray-500 dark:text-gray-400 truncate" title="${uuid}">${uuid}</p>
                        </div>
                    </div>
                    ` : ''}
                </div>
            </div>
        `;
    });

    if (inventoriesListElement) {
        inventoriesListElement.innerHTML = inventoriesHtml;
    }
}

function closeUserInventoriesModal() {
    const modal = document.getElementById('userInventoriesModal');
    if (modal) {
        modal.classList.add('hidden');
        // Reset content
        const loadingElement = document.getElementById('userInventoriesLoading');
        const contentElement = document.getElementById('userInventoriesContent');
        const inventoriesListElement = document.getElementById('userInventoriesList');
        const inventoriesEmptyElement = document.getElementById('userInventoriesEmpty');
        
        if (loadingElement) {
            loadingElement.style.display = 'block';
            loadingElement.innerHTML = `
                <i class="fas fa-spinner fa-spin text-3xl text-blue-600 mb-4"></i>
                <p class="text-gray-600">Cargando inventarios...</p>
            `;
        }
        if (contentElement) contentElement.style.display = 'none';
        if (inventoriesListElement) inventoriesListElement.innerHTML = '';
        if (inventoriesEmptyElement) inventoriesEmptyElement.style.display = 'none';
    }
}

window.showUserInventoriesModal = showUserInventoriesModal;
window.closeUserInventoriesModal = closeUserInventoriesModal;
window.closeUserLoansModal = closeUserLoansModal;
window.filterUserLoans = filterUserLoans;

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
        
        const isOpen = this.container.classList.contains('open') || this.container.classList.contains('active');

        // Close all other selects
        document.querySelectorAll('.custom-select.open, .custom-select.active').forEach(select => {
            if (select !== this.container) {
                select.classList.remove('open');
                select.classList.remove('active');
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
        this.container.classList.add('active');
        
        // Add class to parent container to increase z-index
        const container = this.container.closest('.custom-select-container');
        if (container) {
            container.classList.add('select-open');
        }
        
        // Position dropdown using absolute positioning relative to container
        // Use setTimeout to ensure dropdown is rendered first
        setTimeout(() => {
            if (this.dropdown && this.trigger) {
                // Reset positioning styles to use CSS defaults
                this.dropdown.style.position = 'absolute';
                this.dropdown.style.top = '';
                this.dropdown.style.bottom = '';
                this.dropdown.style.left = '';
                this.dropdown.style.right = '';
                this.dropdown.style.width = '';
                
                const triggerRect = this.trigger.getBoundingClientRect();
                const containerRect = this.container.getBoundingClientRect();
                const viewportHeight = window.innerHeight;
                const spaceBelow = viewportHeight - triggerRect.bottom;
                const spaceAbove = triggerRect.top;
                const dropdownHeight = 250; // Approximate max height of dropdown
                
                // Always check if we're in the filter section (bottom half of viewport)
                // If trigger is in bottom 40% of viewport, prefer opening upward
                const isInBottomHalf = triggerRect.top > (viewportHeight * 0.6);
                
                // Calculate if should open upward
                const shouldOpenUp = (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) || 
                                    (isInBottomHalf && spaceAbove > dropdownHeight);
                
                if (shouldOpenUp) {
                    this.container.classList.add('dropdown-up');
                    // Position above trigger using bottom
                    this.dropdown.style.top = 'auto';
                    this.dropdown.style.bottom = '100%';
                    this.dropdown.style.marginTop = '0';
                    this.dropdown.style.marginBottom = '4px';
                } else {
                    this.container.classList.remove('dropdown-up');
                    // Position below trigger (CSS default)
                    this.dropdown.style.top = '100%';
                    this.dropdown.style.bottom = 'auto';
                    this.dropdown.style.marginTop = '4px';
                    this.dropdown.style.marginBottom = '0';
                }
                
                // Ensure dropdown matches trigger width
                this.dropdown.style.width = '100%';
                this.dropdown.style.minWidth = `${triggerRect.width}px`;
            }
        }, 10);
        
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
        this.container.classList.remove('active');
        
        // Remove class from parent container to restore z-index
        const container = this.container.closest('.custom-select-container');
        if (container) {
            container.classList.remove('select-open');
        }
        
        // Reset dropdown positioning
        if (this.dropdown) {
            this.dropdown.style.top = '';
            this.dropdown.style.bottom = '';
            this.dropdown.style.left = '';
            this.dropdown.style.width = '';
            this.dropdown.style.right = '';
            this.dropdown.style.minWidth = '';
            this.dropdown.style.marginTop = '';
            this.dropdown.style.marginBottom = '';
            this.dropdown.style.position = '';
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

// Update role options based on current user role
function updateRoleOptionsForCurrentUser() {
    const currentRole = window.usersData ? window.usersData.currentLoggedInUserRole : '';
    const isAdminInstitution = currentRole === 'ADMIN_INSTITUTION';
    
    let roleOptions = [
        { value: 'SUPERADMIN', label: 'Super Admin' },
        { value: 'ADMIN_INSTITUTION', label: 'Admin Institución' },
        { value: 'ADMIN_REGIONAL', label: 'Admin Regional' },
        { value: 'WAREHOUSE', label: 'Admin Almacén' },
        { value: 'USER', label: 'Usuario' }
    ];
    
    // Filter out restricted roles for ADMIN_INSTITUTION
    if (isAdminInstitution) {
        roleOptions = roleOptions.filter(option => 
            option.value !== 'SUPERADMIN' && 
            option.value !== 'ADMIN_REGIONAL' && 
            option.value !== 'ADMIN_INSTITUTION'
        );
    }
    
    if (window.roleSelect) {
        window.roleSelect.setOptions(roleOptions);
    }
}

// Initialize custom selects for new user modal
function initializeCustomSelects() {
    // Role select - will be filtered based on current user role
    const currentRole = window.usersData ? window.usersData.currentLoggedInUserRole : '';
    const isAdminInstitution = currentRole === 'ADMIN_INSTITUTION';
    
    let roleOptions = [
        { value: 'SUPERADMIN', label: 'Super Admin' },
        { value: 'ADMIN_INSTITUTION', label: 'Admin Institución' },
        { value: 'ADMIN_REGIONAL', label: 'Admin Regional' },
        { value: 'WAREHOUSE', label: 'Admin Almacén' },
        { value: 'USER', label: 'Usuario' }
    ];
    
    // Filter out restricted roles for ADMIN_INSTITUTION
    if (isAdminInstitution) {
        roleOptions = roleOptions.filter(option => 
            option.value !== 'SUPERADMIN' && 
            option.value !== 'ADMIN_REGIONAL' && 
            option.value !== 'ADMIN_INSTITUTION'
        );
    }
    
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

    // Job Title select
    const jobTitleOptions = [
        { value: 'directivo', label: 'Directivo' },
        { value: 'coordinador', label: 'Coordinador' },
        { value: 'instructor', label: 'Instructor' },
        { value: 'profesional', label: 'Profesional / Administrativo' },
        { value: 'asistencial', label: 'Asistencial / Apoyo' },
        { value: 'aprendiz', label: 'Aprendiz' },
        { value: 'externo', label: 'Externo / Empresario' }
    ];
    
    window.jobTitleSelect = new CustomSelect('newUserJobTitleSelect', {
        placeholder: 'Seleccionar cargo',
        onChange: function(option) {
            // Clear error highlighting
            const trigger = document.getElementById('newUserJobTitleSelect')?.querySelector('.custom-select-trigger');
            if (trigger) {
                trigger.classList.remove('border-red-500');
            }
        }
    });
    window.jobTitleSelect.setOptions(jobTitleOptions);
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

// Initialize job title select for edit user modal
function initializeJobTitleSelectForEdit() {
    const jobTitleOptions = [
        { value: 'directivo', label: 'Directivo' },
        { value: 'coordinador', label: 'Coordinador' },
        { value: 'instructor', label: 'Instructor' },
        { value: 'profesional', label: 'Profesional / Administrativo' },
        { value: 'asistencial', label: 'Asistencial / Apoyo' },
        { value: 'aprendiz', label: 'Aprendiz' },
        { value: 'externo', label: 'Externo / Empresario' }
    ];
    
    if (!window.editJobTitleSelect) {
        window.editJobTitleSelect = new CustomSelect('editUserJobTitleSelect', {
            placeholder: 'Seleccionar cargo',
            onChange: function(option) {
                // Clear error highlighting
                const trigger = document.getElementById('editUserJobTitleSelect')?.querySelector('.custom-select-trigger');
                if (trigger) {
                    trigger.classList.remove('border-red-500');
                }
            }
        });
    }
    window.editJobTitleSelect.setOptions(jobTitleOptions);
}