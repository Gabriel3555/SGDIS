// Handle profile photo change
async function changeProfilePhoto() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = async function(e) {
        const file = e.target.files[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                alert('Por favor selecciona un archivo de imagen válido');
                return;
            }

            // Validate file size (max 2MB)
            if (file.size > 2 * 1024 * 1024) {
                alert('La imagen no debe superar los 2MB');
                return;
            }

            try {
                // Show loading state
                const profileAvatar = document.getElementById('profileAvatar');
                const originalSrc = profileAvatar.src;
                
                // Upload photo
                const imageUrl = await uploadCurrentUserPhoto(file);
                
                if (imageUrl) {
                    // Update profile avatar immediately
                    profileAvatar.src = imageUrl + '?t=' + new Date().getTime();
                    
                    // Update header avatar
                    const headerUserAvatar = document.getElementById('headerUserAvatar');
                    if (headerUserAvatar) {
                        headerUserAvatar.innerHTML = `<img src="${imageUrl}?t=${new Date().getTime()}" alt="Avatar" class="w-full h-full object-cover rounded-full">`;
                    }
                    
                    // Reload user profile to get fresh data
                    await loadUserProfile();
                    
                    alert('Foto de perfil actualizada exitosamente');
                } else {
                    profileAvatar.src = originalSrc;
                    alert('Error al actualizar la foto de perfil');
                }
            } catch (error) {
                console.error('Error updating profile photo:', error);
                alert('Error al actualizar la foto: ' + error.message);
            }
        }
    };
    
    input.click();
}

// Upload current user photo
async function uploadCurrentUserPhoto(file) {
    try {
        const token = localStorage.getItem('jwt');
        if (!token) {
            throw new Error('No se encontró el token de autenticación');
        }

        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/v1/users/me/image', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        if (response.ok) {
            const imageUrl = await response.text();
            return imageUrl;
        } else if (response.status === 401) {
            throw new Error('Sesión expirada. Por favor inicia sesión nuevamente.');
        } else if (response.status === 403) {
            throw new Error('No tienes permisos para actualizar la foto.');
        } else {
            const errorText = await response.text();
            throw new Error(errorText || 'Error al subir la imagen');
        }
    } catch (error) {
        if (error.message && error.message.includes('Failed to fetch')) {
            throw new Error('Error de conexión. Verifica tu conexión a internet.');
        }
        throw error;
    }
}

// Make functions available globally
window.changeProfilePhoto = changeProfilePhoto;
window.uploadCurrentUserPhoto = uploadCurrentUserPhoto;

