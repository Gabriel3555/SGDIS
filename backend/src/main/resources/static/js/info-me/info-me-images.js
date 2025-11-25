// Handle profile photo change
async function changeProfilePhoto(event) {
    // Prevent event propagation if event is provided
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    
    console.log('changeProfilePhoto called');
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.style.display = 'none';
    
    input.onchange = async function(e) {
        const file = e.target.files[0];
        if (!file) {
            console.log('No file selected');
            return;
        }
        
        console.log('File selected:', file.name, file.type, file.size);
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
            if (typeof showErrorToast === 'function') {
                showErrorToast('Archivo inválido', 'Por favor selecciona un archivo de imagen válido');
            } else {
                alert('Por favor selecciona un archivo de imagen válido');
            }
            return;
        }

        // Validate file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            if (typeof showErrorToast === 'function') {
                showErrorToast('Imagen muy grande', 'La imagen no debe superar los 2MB');
            } else {
                alert('La imagen no debe superar los 2MB');
            }
            return;
        }

        try {
            // Show loading state
            const profileAvatar = document.getElementById('profileAvatar');
            if (!profileAvatar) {
                console.error('Profile avatar element not found');
                if (typeof showErrorToast === 'function') {
                    showErrorToast('Error', 'No se encontró el elemento de la foto de perfil');
                } else {
                    alert('Error: No se encontró el elemento de la foto de perfil');
                }
                return;
            }
            
            const originalSrc = profileAvatar.src;
            
            // Show loading indicator
            profileAvatar.style.opacity = '0.5';
            profileAvatar.style.filter = 'blur(2px)';
            
            console.log('Uploading photo...');
            // Upload photo
            const imageUrl = await uploadCurrentUserPhoto(file);
            console.log('Upload response:', imageUrl);
            
            if (imageUrl && imageUrl.trim() !== '') {
                // Update profile avatar immediately with cache busting
                const timestamp = new Date().getTime();
                const fullImageUrl = imageUrl.startsWith('http') ? imageUrl : imageUrl;
                profileAvatar.src = fullImageUrl + (fullImageUrl.includes('?') ? '&' : '?') + 't=' + timestamp;
                profileAvatar.style.opacity = '1';
                profileAvatar.style.filter = 'none';
                
                // Update header avatar
                const headerUserAvatar = document.getElementById('headerUserAvatar');
                if (headerUserAvatar) {
                    const uniqueId = 'img-' + Math.random().toString(36).substr(2, 9);
                    headerUserAvatar.innerHTML = `
                        <div class="relative w-full h-full rounded-full overflow-hidden" id="img-container-${uniqueId}">
                            <div class="absolute inset-0 flex items-center justify-center bg-gray-100" id="spinner-${uniqueId}">
                                <div class="image-loading-spinner"></div>
                            </div>
                            <img src="${fullImageUrl}?t=${timestamp}" alt="Avatar" class="w-full h-full object-cover opacity-0 transition-opacity duration-300" 
                                 id="img-${uniqueId}"
                                 onload="(function() { const img = document.getElementById('img-${uniqueId}'); const spinner = document.getElementById('spinner-${uniqueId}'); if (img) img.classList.remove('opacity-0'); if (spinner) spinner.style.display='none'; })();"
                                 onerror="(function() { const spinner = document.getElementById('spinner-${uniqueId}'); const container = document.getElementById('img-container-${uniqueId}'); if (spinner) spinner.style.display='none'; if (container) container.innerHTML='<div class=\\'w-full h-full bg-gray-200 flex items-center justify-center text-gray-400\\'><i class=\\'fas fa-user\\'></i></div>'; })();">
                        </div>
                    `;
                }
                
                // Reload user profile to get fresh data
                if (typeof loadUserProfile === 'function') {
                    await loadUserProfile();
                }
                
                // Mostrar notificación de éxito con el sistema de toasts
                if (typeof showSuccessToast === 'function') {
                    showSuccessToast('Foto actualizada', 'Foto de perfil actualizada exitosamente');
                } else {
                    alert('Foto de perfil actualizada exitosamente');
                }
            } else {
                profileAvatar.src = originalSrc;
                profileAvatar.style.opacity = '1';
                profileAvatar.style.filter = 'none';
                if (typeof showErrorToast === 'function') {
                    showErrorToast('Error', 'No se recibió la URL de la imagen');
                } else {
                    alert('Error al actualizar la foto de perfil: No se recibió la URL de la imagen');
                }
            }
        } catch (error) {
            console.error('Error updating profile photo:', error);
            const profileAvatar = document.getElementById('profileAvatar');
            if (profileAvatar) {
                profileAvatar.style.opacity = '1';
                profileAvatar.style.filter = 'none';
            }
            if (typeof showErrorToast === 'function') {
                showErrorToast('Error', error.message || 'Error desconocido al actualizar la foto');
            } else {
                alert('Error al actualizar la foto: ' + (error.message || 'Error desconocido'));
            }
        } finally {
            // Clean up input element
            document.body.removeChild(input);
        }
    };
    
    // Add input to body temporarily
    document.body.appendChild(input);
    
    // Trigger file picker
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

        console.log('Sending request to /api/v1/users/me/image');
        const response = await fetch('/api/v1/users/me/image', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
                // Note: Don't set Content-Type header, let browser set it with boundary for FormData
            },
            body: formData
        });

        console.log('Response status:', response.status, response.statusText);

        if (response.ok) {
            const imageUrl = await response.text();
            console.log('Image URL received:', imageUrl);
            // Ensure the URL is properly formatted
            if (imageUrl && imageUrl.trim()) {
                return imageUrl.trim();
            } else {
                throw new Error('La respuesta del servidor está vacía');
            }
        } else if (response.status === 401) {
            // Token expired, try to refresh
            console.log('Token expired, attempting refresh...');
            if (typeof refreshToken === 'function') {
                const refreshed = await refreshToken();
                if (refreshed) {
                    // Retry with new token
                    const newToken = localStorage.getItem('jwt');
                    const retryResponse = await fetch('/api/v1/users/me/image', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${newToken}`
                        },
                        body: formData
                    });
                    if (retryResponse.ok) {
                        const imageUrl = await retryResponse.text();
                        return imageUrl.trim();
                    }
                }
            }
            throw new Error('Sesión expirada. Por favor inicia sesión nuevamente.');
        } else if (response.status === 403) {
            throw new Error('No tienes permisos para actualizar la foto.');
        } else {
            const errorText = await response.text();
            console.error('Error response:', errorText);
            throw new Error(errorText || `Error al subir la imagen (${response.status})`);
        }
    } catch (error) {
        console.error('Upload error:', error);
        if (error.message && error.message.includes('Failed to fetch')) {
            throw new Error('Error de conexión. Verifica tu conexión a internet.');
        }
        throw error;
    }
}

// Make functions available globally
window.changeProfilePhoto = changeProfilePhoto;
window.uploadCurrentUserPhoto = uploadCurrentUserPhoto;

// Ensure function is available when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        console.log('DOM loaded, changeProfilePhoto available:', typeof window.changeProfilePhoto);
    });
} else {
    console.log('DOM already loaded, changeProfilePhoto available:', typeof window.changeProfilePhoto);
}

