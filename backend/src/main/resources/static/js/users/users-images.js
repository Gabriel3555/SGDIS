// Image handling functions for users management

// Image handling functions
function handleNewUserPhotoChange(event) {
    const file = event.target.files[0];
    if (file) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Por favor selecciona un archivo de imagen válido');
            return;
        }

        // Validate file size (2MB max)
        if (file.size > 2 * 1024 * 1024) {
            alert('La imagen no debe superar los 2MB');
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            const imagePreview = document.getElementById('newUserImagePreview');
            if (imagePreview) {
                imagePreview.innerHTML = `<img src="${e.target.result}" alt="Preview" class="w-full h-full object-cover">`;
            }
        };
        reader.readAsDataURL(file);
    }
}

function handleEditUserPhotoChange(event) {
    const file = event.target.files[0];
    if (file) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Por favor selecciona un archivo de imagen válido');
            return;
        }

        // Validate file size (2MB max)
        if (file.size > 2 * 1024 * 1024) {
            alert('La imagen no debe superar los 2MB');
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            const currentImage = document.getElementById('editUserCurrentImage');
            const imageIcon = document.getElementById('editUserImageIcon');
            const imagePreview = document.getElementById('editUserImagePreview');

            if (currentImage && imageIcon && imagePreview) {
                currentImage.src = e.target.result;
                currentImage.style.display = 'block';
                imageIcon.style.display = 'none';
                imagePreview.classList.add('has-image');
            }
        };
        reader.readAsDataURL(file);
    }
}

// Upload photo for current user
window.uploadUserPhoto = async function(file, email) {
    try {
        const token = localStorage.getItem('jwt');
        const formData = new FormData();
        formData.append('file', file);

        const headers = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(`/api/v1/users/me/image`, {
            method: 'POST',
            headers: headers,
            body: formData
        });

        if (response.ok) {
            return await response.text();
        } else {
            const errorText = await response.text();
            const errorMessage = `Error al subir la imagen: ${response.status} - ${errorText}`;
            console.error('Upload error:', errorMessage);

            // Don't throw error for authentication issues
            if (response.status === 401 || response.status === 403) {
                console.warn('Authentication issue - user may need to login again');
                return; // Return without throwing
            }

            throw new Error(errorMessage);
        }
    } catch (error) {
        console.error('Error uploading image:', error);

        // Don't throw for network errors
        if (error.message && error.message.includes('Failed to fetch')) {
            console.warn('Network error - possibly temporary');
            return; // Return without throwing
        }

        throw error;
    }
}

// Upload photo for any user (admin function)
window.uploadUserPhotoById = async function(file, userId) {
    try {
        const token = localStorage.getItem('jwt');
        const formData = new FormData();
        formData.append('file', file);

        const headers = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(`/api/v1/users/${userId}/image`, {
            method: 'POST',
            headers: headers,
            body: formData
        });

        if (response.ok) {
            return await response.text();
        } else {
            const errorText = await response.text();
            const errorMessage = `Error al subir la imagen para el usuario ${userId}: ${response.status} - ${errorText}`;
            console.error('Upload error:', errorMessage);

            // Don't throw error for authentication issues that might redirect to login
            if (response.status === 401 || response.status === 403) {
                console.warn('Authentication issue - user may need to login again');
                // Don't show alert or throw error, just log and return
                return;
            }

            // For other errors, throw but don't show alert immediately
            throw new Error(errorMessage);
        }
    } catch (error) {
        console.error('Error uploading user image by ID:', error);

        // Don't throw for network errors that might be temporary
        if (error.message && error.message.includes('Failed to fetch')) {
            console.warn('Network error - possibly temporary');
            return; // Return without throwing
        }

        throw error;
    }
}

// Make changeUserPhoto globally available
window.changeUserPhoto = function(userId) {
    const numericUserId = typeof userId === 'string' ? parseInt(userId, 10) : userId;
    const user = usersData.users.find(u => u && u.id === numericUserId);

    if (user) {
        // Create a temporary input for file selection
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async function(e) {
            const file = e.target.files[0];
            if (file) {
                // Validate file
                if (!file.type.startsWith('image/')) {
                    alert('Por favor selecciona un archivo de imagen válido');
                    return;
                }

                if (file.size > 2 * 1024 * 1024) {
                    alert('La imagen no debe superar los 2MB');
                    return;
                }

                try {
                    // Upload image using admin endpoint
                    await uploadUserPhotoById(file, user.id);

                    // Reload users data to show updated image
                    try {
                        await loadUsersData();
                    } catch (reloadError) {
                        console.warn('Could not reload users data:', reloadError);
                    }

                    // Also reload current user info to update header avatar if it was the current user's photo
                    try {
                        await loadCurrentUserInfo();
                    } catch (infoError) {
                        console.warn('Could not reload current user info:', infoError);
                    }

                    alert('Foto de perfil actualizada exitosamente');
                } catch (error) {
                    console.error('Error uploading photo:', error);
                    // Don't show alert for authentication errors that might redirect to login
                    if (error.message && !error.message.includes('Failed to fetch') &&
                        !error.message.includes('NetworkError') &&
                        !error.message.includes('401') &&
                        !error.message.includes('403')) {
                        alert('Error al actualizar la foto: ' + error.message);
                    }
                }
            }
        };
        input.click();
    }
}

// Make functions globally available
window.handleNewUserPhotoChange = handleNewUserPhotoChange;
window.handleEditUserPhotoChange = handleEditUserPhotoChange;
window.uploadUserPhotoById = uploadUserPhotoById;