async function handleNewUserSubmit(e) {
     e.preventDefault();

     const fullName = document.getElementById('newUserFullName')?.value?.trim();
     const email = document.getElementById('newUserEmail')?.value?.trim();
     // Get role from hidden input (CustomSelect)
    const roleInput = document.getElementById('newUserRole');
    const role = roleInput?.value || (window.roleSelect ? window.roleSelect.getValue() : '');
     const password = document.getElementById('newUserPassword')?.value?.trim();
     
     // Check if current user is ADMIN_INSTITUTION
     const currentRole = window.usersData ? window.usersData.currentLoggedInUserRole : '';
     const isAdminInstitution = currentRole === 'ADMIN_INSTITUTION';
     
     let institutionId;
     
     if (isAdminInstitution) {
         // Use the stored institution ID from current user
         institutionId = window.currentUserInstitutionId;
         if (!institutionId) {
             showErrorToast('Error', 'No se pudo obtener la información de la institución. Por favor recarga la página.');
             return;
         }
     } else {
         // For other roles, get institution from form
         const regionalInput = document.getElementById('newUserRegional');
         const institutionInput = document.getElementById('newUserInstitution');
         
         // Get values from hidden inputs, also check CustomSelect objects if available
         let regional = regionalInput?.value?.trim();
         let institution = institutionInput?.value?.trim();
         
         // Fallback: check CustomSelect objects directly
         if (!regional && window.regionalSelect) {
             regional = window.regionalSelect.getValue();
         }
         if (!institution && window.institutionSelect) {
             institution = window.institutionSelect.getValue();
         }
         
         // Validate required fields with specific error messages
         const missingFields = [];
         
         if (!fullName) missingFields.push('Nombre Completo');
         if (!email) missingFields.push('Email');
         if (!role || role === '') missingFields.push('Rol');
         if (!regional || regional === '') missingFields.push('Regional');
         if (!institution || institution === '') missingFields.push('Institución');
         if (!password) missingFields.push('Contraseña');

         if (missingFields.length > 0) {
             const fieldsList = missingFields.join(', ');
             showErrorToast('Campos obligatorios', `Por favor complete los siguientes campos: ${fieldsList}`);
             
             // Highlight missing fields visually
             if (!fullName) document.getElementById('newUserFullName')?.classList.add('border-red-500');
             if (!email) document.getElementById('newUserEmail')?.classList.add('border-red-500');
             if (!role) {
                const roleSelectTrigger = document.getElementById('newUserRoleSelect')?.querySelector('.custom-select-trigger');
                if (roleSelectTrigger) {
                    roleSelectTrigger.classList.add('border-red-500');
                }
            }
             if (!regional) {
                 const regionalSelect = document.getElementById('newUserRegionalSelect');
                 if (regionalSelect) {
                     regionalSelect.querySelector('.custom-select-trigger')?.classList.add('border-red-500');
                 }
             }
             if (!institution) {
                 const institutionSelect = document.getElementById('newUserInstitutionSelect');
                 if (institutionSelect) {
                     institutionSelect.querySelector('.custom-select-trigger')?.classList.add('border-red-500');
                 }
             }
             if (!password) document.getElementById('newUserPassword')?.classList.add('border-red-500');
             
             return;
         }
         
         // Remove error highlighting
         document.getElementById('newUserFullName')?.classList.remove('border-red-500');
         document.getElementById('newUserEmail')?.classList.remove('border-red-500');
         const roleSelectTrigger = document.getElementById('newUserRoleSelect')?.querySelector('.custom-select-trigger');
        if (roleSelectTrigger) {
            roleSelectTrigger.classList.remove('border-red-500');
        }
         document.getElementById('newUserRegionalSelect')?.querySelector('.custom-select-trigger')?.classList.remove('border-red-500');
         document.getElementById('newUserInstitutionSelect')?.querySelector('.custom-select-trigger')?.classList.remove('border-red-500');
         document.getElementById('newUserPassword')?.classList.remove('border-red-500');

        // Validate that institution is a valid number
        institutionId = parseInt(institution);
        if (isNaN(institutionId) || institutionId <= 0) {
            showErrorToast('Institución inválida', 'Por favor seleccione una institución válida');
            const institutionSelect = document.getElementById('newUserInstitutionSelect');
            if (institutionSelect) {
                institutionSelect.querySelector('.custom-select-trigger')?.classList.add('border-red-500');
            }
            return;
        }
     }
     
     // Validate required fields for ADMIN_INSTITUTION
     if (isAdminInstitution) {
         const missingFields = [];
         if (!fullName) missingFields.push('Nombre Completo');
         if (!email) missingFields.push('Email');
         if (!role || role === '') missingFields.push('Rol');
         if (!password) missingFields.push('Contraseña');
         
         if (missingFields.length > 0) {
             const fieldsList = missingFields.join(', ');
             showErrorToast('Campos obligatorios', `Por favor complete los siguientes campos: ${fieldsList}`);
             
             // Highlight missing fields visually
             if (!fullName) document.getElementById('newUserFullName')?.classList.add('border-red-500');
             if (!email) document.getElementById('newUserEmail')?.classList.add('border-red-500');
             if (!role) {
                const roleSelectTrigger = document.getElementById('newUserRoleSelect')?.querySelector('.custom-select-trigger');
                if (roleSelectTrigger) {
                    roleSelectTrigger.classList.add('border-red-500');
                }
            }
             if (!password) document.getElementById('newUserPassword')?.classList.add('border-red-500');
             
             return;
         }
         
         // Remove error highlighting
         document.getElementById('newUserFullName')?.classList.remove('border-red-500');
         document.getElementById('newUserEmail')?.classList.remove('border-red-500');
         const roleSelectTrigger = document.getElementById('newUserRoleSelect')?.querySelector('.custom-select-trigger');
        if (roleSelectTrigger) {
            roleSelectTrigger.classList.remove('border-red-500');
        }
         document.getElementById('newUserPassword')?.classList.remove('border-red-500');
     }
     
     // Get job title from hidden input (CustomSelect) or directly from CustomSelect
     const jobTitleInput = document.getElementById('newUserJobTitle');
     const jobTitle = jobTitleInput?.value?.trim() || (window.jobTitleSelect ? window.jobTitleSelect.getValue() : '');
     const laborDepartment = document.getElementById('newUserLaborDepartment')?.value?.trim();
     const photoFile = document.getElementById('newUserPhoto')?.files[0];

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
                jobTitle: jobTitle || null,
                laborDepartment: laborDepartment || null,
                password: password,
                status: true,
                institutionId: institutionId
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
            showErrorToast('Error al crear usuario', errorData.detail || 'Error desconocido');
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
    // Get role from hidden input (CustomSelect)
    const roleInput = document.getElementById('editUserRole');
    const role = roleInput?.value || (window.editRoleSelect ? window.editRoleSelect.getValue() : '');
    // Get job title from hidden input (CustomSelect) or directly from CustomSelect
    const jobTitleInput = document.getElementById('editUserJobTitle');
    const jobTitle = jobTitleInput?.value?.trim() || (window.editJobTitleSelect ? window.editJobTitleSelect.getValue() : '');
    const laborDepartment = document.getElementById('editUserLaborDepartment').value;
    const statusValue = document.getElementById('editUserStatus').value;
    const status = statusValue === 'true';
    const photoFile = document.getElementById('editUserPhoto').files[0];
    
    // Get institution from CustomSelect or hidden input
    let institutionId = null;
    
    // First try CustomSelect
    if (window.editInstitutionSelect) {
        const institutionValue = window.editInstitutionSelect.getValue();
        if (institutionValue) {
            institutionId = parseInt(institutionValue, 10);
        }
    }
    
    // Fallback to hidden input (this is the source of truth)
    const institutionInput = document.getElementById('editUserInstitution');
    if (institutionInput && institutionInput.value) {
        const parsedValue = parseInt(institutionInput.value, 10);
        if (!isNaN(parsedValue) && parsedValue > 0) {
            institutionId = parsedValue;
        }
    }
    
    // If still no value, try to get it from the CustomSelect's selectedValue directly
    if ((!institutionId || isNaN(institutionId)) && window.editInstitutionSelect) {
        const selectedValue = window.editInstitutionSelect.selectedValue;
        if (selectedValue) {
            const parsedValue = parseInt(selectedValue, 10);
            if (!isNaN(parsedValue) && parsedValue > 0) {
                institutionId = parsedValue;
            }
        }
    }

    // Validate required fields
    if (!fullName || !email || !role) {
        showErrorToast('Campos obligatorios', 'Por favor complete todos los campos obligatorios');
        return;
    }
    
    // Validate institution is selected
    if (!institutionId || isNaN(institutionId) || institutionId <= 0) {
        showErrorToast('Campo requerido', 'Por favor selecciona una institución');
        const institutionSelect = document.getElementById('editUserInstitutionSelect');
        if (institutionSelect) {
            const trigger = institutionSelect.querySelector('.custom-select-trigger');
            if (trigger) {
                trigger.classList.add('border-red-500');
            }
        }
        return;
    }
    
    // Prevent user from disabling their own status
    const isEditingOwnUser = usersData.currentLoggedInUserId && usersData.currentLoggedInUserId === usersData.currentUserId;
    if (isEditingOwnUser && !status) {
        showErrorToast('Acción no permitida', 'No puedes desactivar tu propio estado de usuario');
        return;
    }
    
    // Prevent admin from changing their own role
    const currentLoggedInUserRole = usersData.currentLoggedInUserRole;
    const isAdmin = currentLoggedInUserRole === 'SUPERADMIN' || 
                   currentLoggedInUserRole === 'ADMIN_INSTITUTION' || 
                   currentLoggedInUserRole === 'ADMIN_REGIONAL';
    
    if (isEditingOwnUser && isAdmin) {
        // Get the original user role from the users list
        const originalUser = usersData.users.find(u => u && u.id === usersData.currentUserId);
        // Get current role from CustomSelect or hidden input
        const currentRole = role || (window.editRoleSelect ? window.editRoleSelect.getValue() : '');
        if (originalUser && originalUser.role !== currentRole) {
            showErrorToast('Acción no permitida', 'No puedes cambiar tu propio rol. Solicita a otro administrador que lo haga.');
            return;
        }
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
            jobTitle: jobTitle || null,
            laborDepartment: laborDepartment || null,
            status: status,
            institutionId: institutionId
        };

        const response = await fetch(`/api/v1/users/${usersData.currentUserId}`, {
            method: 'PUT',
            headers: headers,
            body: JSON.stringify(updateData)
        });

        if (response.ok) {
            const updatedUser = await response.json();
            
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
            
            // Reload users data to reflect the changes
            await loadUsersData();
            
            setTimeout(() => {
                updateUsersUI();
            }, 200);
        } else {
            const errorData = await response.json();
            showErrorToast('Error al actualizar usuario', errorData.detail || errorData.message || 'Error del servidor');
            closeEditUserModal();
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

window.deleteUser = function (userId) {
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
                        <input type="password" id="newPassword" class="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00AF00]" placeholder="Ingrese la nueva contraseña" required>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Confirmar Nueva Contraseña *</label>
                        <input type="password" id="confirmPassword" class="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00AF00]" placeholder="Confirme la nueva contraseña" required>
                    </div>

                    <div class="flex gap-3 pt-4">
                        <button type="button" onclick="closeChangePasswordModal()" class="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors">
                            Cancelar
                        </button>
                        <button type="submit" class="flex-1 px-4 py-2 bg-[#00AF00] hover:bg-[#008800] text-white rounded-xl transition-colors">
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