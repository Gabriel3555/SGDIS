function handleNewUserPhotoChange(event) {
    const file = event.target.files[0];
    if (file) {
        if (!file.type.startsWith('image/')) {
            showErrorToast('Archivo inválido', 'Por favor selecciona un archivo de imagen válido');
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            showErrorToast('Imagen muy grande', 'La imagen no debe superar los 2MB');
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
        if (!file.type.startsWith('image/')) {
            showErrorToast('Archivo inválido', 'Por favor selecciona un archivo de imagen válido');
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            showErrorToast('Imagen muy grande', 'La imagen no debe superar los 2MB');
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

            if (response.status === 401 || response.status === 403) {
                return;
            }

            throw new Error(errorMessage);
        }
    } catch (error) {
        if (error.message && error.message.includes('Failed to fetch')) {
            return;
        }

        throw error;
    }
}

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

            if (response.status === 401 || response.status === 403) {
                return;
            }

            throw new Error(errorMessage);
        }
    } catch (error) {
        if (error.message && error.message.includes('Failed to fetch')) {
            return;
        }

        throw error;
    }
}

window.changeUserPhoto = function(userId) {
    const numericUserId = typeof userId === 'string' ? parseInt(userId, 10) : userId;
    const user = usersData.users.find(u => u && u.id === numericUserId);

    if (user) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async function(e) {
            const file = e.target.files[0];
            if (file) {
                if (!file.type.startsWith('image/')) {
                    showErrorToast('Archivo inválido', 'Por favor selecciona un archivo de imagen válido');
                    return;
                }

                if (file.size > 2 * 1024 * 1024) {
                    showErrorToast('Imagen muy grande', 'La imagen no debe superar los 2MB');
                    return;
                }

                try {
                    await uploadUserPhotoById(file, user.id);

                    try {
                        await loadUsersData();
                    } catch (reloadError) {
                    }

                    try {
                        await loadCurrentUserInfo();
                    } catch (infoError) {
                    }

                    showSuccessToast('Foto actualizada', 'Foto de perfil actualizada exitosamente');
                } catch (error) {
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

window.handleNewUserPhotoChange = handleNewUserPhotoChange;
window.handleEditUserPhotoChange = handleEditUserPhotoChange;
window.uploadUserPhotoById = uploadUserPhotoById;