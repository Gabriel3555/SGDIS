function handleNewInventoryPhotoChange(event) {
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
            const imagePreview = document.getElementById('newInventoryImagePreview');
            if (imagePreview) {
                imagePreview.innerHTML = `<img src="${e.target.result}" alt="Preview" class="w-full h-full object-cover rounded-lg">`;
                imagePreview.classList.add('has-image');
            }
        };
        reader.readAsDataURL(file);
    }
}

window.uploadInventoryPhotoById = async function(file, inventoryId) {
    try {
        const token = localStorage.getItem('jwt');
        const formData = new FormData();
        formData.append('file', file);

        const headers = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(`/api/v1/inventory/${inventoryId}/image`, {
            method: 'POST',
            headers: headers,
            body: formData
        });

        if (response.ok) {
            return await response.text();
        } else {
            const errorText = await response.text();
            
            // Si el error es por inventario inactivo, mostrar con showErrorToast
            if (errorText && (errorText.includes("inactivo") || errorText.includes("está inactivo"))) {
                if (typeof showErrorToast === 'function') {
                    showErrorToast("Inventario inactivo", errorText);
                }
                throw new Error(errorText);
            }
            
            const errorMessage = `Error al subir la imagen para el inventario ${inventoryId}: ${response.status} - ${errorText}`;

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

window.changeInventoryPhoto = function(inventoryId) {
    const numericInventoryId = typeof inventoryId === 'string' ? parseInt(inventoryId, 10) : inventoryId;
    const inventory = inventoryData.inventories.find(i => i && i.id === numericInventoryId);

    if (inventory) {
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
                    await uploadInventoryPhotoById(file, inventory.id);

                    try {
                        await loadInventoryData();
                    } catch (reloadError) {
                        console.error('Error reloading inventory data:', reloadError);
                    }

                    showSuccessToast('Imagen actualizada', 'Imagen de inventario actualizada exitosamente');
                } catch (error) {
                    // Si el error es por inventario inactivo, ya se mostró el toast arriba
                    if (error.message && (error.message.includes("inactivo") || error.message.includes("está inactivo"))) {
                        // El error ya fue mostrado en uploadInventoryPhotoById
                        return;
                    }
                    
                    if (error.message && !error.message.includes('Failed to fetch') &&
                        !error.message.includes('NetworkError') &&
                        !error.message.includes('401') &&
                        !error.message.includes('403')) {
                        showErrorToast('Error al actualizar la imagen', error.message);
                    }
                }
            }
        };
        input.click();
    }
}

window.handleNewInventoryPhotoChange = handleNewInventoryPhotoChange;

