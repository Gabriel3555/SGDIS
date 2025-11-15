async function handleNewInventorySubmit(e) {
    e.preventDefault();

    const name = document.getElementById('newInventoryName').value;
    const location = document.getElementById('newInventoryLocation').value;

    if (!name || !location) {
        showErrorToast('Campos obligatorios', 'Por favor complete todos los campos obligatorios');
        return;
    }

    // Validate inventory name length
    if (name.length < 3) {
        showErrorToast('Nombre muy corto', 'El nombre del inventario debe tener al menos 3 caracteres');
        return;
    }

    if (name.length > 100) {
        showErrorToast('Nombre muy largo', 'El nombre del inventario no puede exceder 100 caracteres');
        return;
    }

    // Validate location
    if (location.length < 3) {
        showErrorToast('Ubicación muy corta', 'La ubicación debe tener al menos 3 caracteres');
        return;
    }

    if (location.length > 100) {
        showErrorToast('Ubicación muy larga', 'La ubicación no puede exceder 100 caracteres');
        return;
    }

    try {
        const inventoryDataToCreate = {
            name: name.trim(),
            location: location.trim()
        };

        const result = await createInventory(inventoryDataToCreate);

        // Upload image if selected
        const imageInput = document.getElementById('newInventoryPhoto');
        if (imageInput && imageInput.files && imageInput.files.length > 0) {
            try {
                await window.uploadInventoryPhotoById(imageInput.files[0], result.id);
            } catch (imageError) {
                console.error('Error uploading inventory image:', imageError);
                // Don't fail the whole operation if image upload fails
            }
        }

        showSuccessToast('Inventario creado', 'Inventario creado exitosamente');
        closeNewInventoryModal();
        await loadInventoryData();

    } catch (error) {
        console.error('Error creating inventory:', error);
        showErrorToast('Error al crear inventario', error.message || 'Inténtalo de nuevo.');
    }
}

async function handleEditInventorySubmit(e) {
    e.preventDefault();

    if (!inventoryData.currentInventoryId) {
        showEditErrorToast('No se ha seleccionado un inventario para editar');
        return;
    }

    const name = document.getElementById('editInventoryName').value;
    const location = document.getElementById('editInventoryLocation').value;

    if (!name || !location) {
        showEditErrorToast('Por favor complete todos los campos obligatorios');
        return;
    }

    // Validate inventory name length
    if (name.length < 3) {
        showEditErrorToast('El nombre del inventario debe tener al menos 3 caracteres');
        return;
    }

    if (name.length > 100) {
        showEditErrorToast('El nombre del inventario no puede exceder 100 caracteres');
        return;
    }

    // Validate location
    if (location.length < 3) {
        showEditErrorToast('La ubicación debe tener al menos 3 caracteres');
        return;
    }

    if (location.length > 100) {
        showEditErrorToast('La ubicación no puede exceder 100 caracteres');
        return;
    }

    try {
        const updateData = {
            name: name.trim(),
            location: location.trim()
        };

        const result = await updateInventory(inventoryData.currentInventoryId, updateData);

        showEditSuccessToast();
        closeEditInventoryModal();
        await loadInventoryData();

    } catch (error) {
        console.error('Error updating inventory:', error);
        
        let errorMessage = error.message || 'Inténtalo de nuevo.';
        
        // Customize error messages based on the error
        if (errorMessage.includes('401') || errorMessage.includes('expired')) {
            errorMessage = 'Sesión expirada. Por favor inicia sesión nuevamente.';
        } else if (errorMessage.includes('403') || errorMessage.includes('permission')) {
            errorMessage = 'No tienes permisos para actualizar este inventario.';
        } else if (errorMessage.includes('404')) {
            errorMessage = 'Inventario no encontrado. Puede que haya sido eliminado.';
        } else if (errorMessage.includes('400') && errorMessage.includes('validation')) {
            errorMessage = 'Los datos ingresados no son válidos. Verifica el formato.';
        }
        
        showEditErrorToast(errorMessage);
    }
}

function viewInventory(inventoryId) {
    const numericInventoryId = typeof inventoryId === 'string' ? parseInt(inventoryId, 10) : inventoryId;
    const inventory = inventoryData.inventories.find(i => i && i.id === numericInventoryId);

    if (inventory) {
        showViewInventoryModal(inventoryId);
    } else {
        showErrorToast('Inventario no encontrado', 'El inventario ya no existe en la lista. Puede que ya haya sido eliminado.');
    }
}

function editInventory(inventoryId) {
    showEditInventoryModal(inventoryId);
}

async function confirmDeleteInventory() {
    if (!inventoryData.currentInventoryId) {
        showErrorToast('Error', 'No se ha seleccionado un inventario para eliminar');
        return;
    }

    // Verificar que el inventario aún existe en la lista
    const currentInventory = inventoryData.inventories.find(i => i && i.id == inventoryData.currentInventoryId);
    if (!currentInventory) {
        showErrorToast('Inventario no encontrado', 'El inventario ya no existe en la lista. Puede que ya haya sido eliminado.');
        closeDeleteInventoryModal();
        return;
    }

    try {
        const result = await deleteInventory(inventoryData.currentInventoryId);

        showSuccessToast('Inventario eliminado', 'Inventario eliminado exitosamente');
        closeDeleteInventoryModal();
        await loadInventoryData();

    } catch (error) {
        console.error('Error deleting inventory:', error);

        if (error.message && error.message.includes('contiene items asociados')) {
            showErrorToast('No se puede eliminar', 'Este inventario contiene items asociados. Transfiere o elimina los items primero.');
        } else {
            showErrorToast('Error al eliminar inventario', error.message || 'Inténtalo de nuevo.');
        }
    }
}

function showInventoryAssignment(inventoryId) {
    const numericInventoryId = typeof inventoryId === 'string' ? parseInt(inventoryId, 10) : inventoryId;
    const inventory = inventoryData.inventories.find(i => i && i.id === numericInventoryId);

    if (inventory) {
        showAssignInventoryModal(inventoryId);
    } else {
        showErrorToast('Inventario no encontrado', 'Inventario no encontrado');
    }
}

function showInventoryManagerAssignment(inventoryId) {
    const numericInventoryId = typeof inventoryId === 'string' ? parseInt(inventoryId, 10) : inventoryId;
    const inventory = inventoryData.inventories.find(i => i && i.id === numericInventoryId);

    if (inventory) {
        showAssignManagerModal(inventoryId);
    } else {
        showErrorToast('Inventario no encontrado', 'Inventario no encontrado');
    }
}

async function handleAssignInventorySubmit(e) {
    e.preventDefault();

    if (!inventoryData.currentInventoryId) {
        showAssignErrorToast('No se ha seleccionado un inventario para asignar');
        return;
    }

    // Try to get value from CustomSelect first, then fallback to hidden input
    let userId = '';
    
    if (window.assignUserSelect && window.assignUserSelect.getValue) {
        userId = window.assignUserSelect.getValue();
    }
    
    // Fallback to hidden input if CustomSelect value is empty
    if (!userId) {
        const userIdElement = document.getElementById('assignUserId');
        if (userIdElement) {
            userId = userIdElement.value;
        }
    }

    if (!userId || userId.trim() === '') {
        showAssignErrorToast('Por favor selecciona un usuario para la asignación');
        return;
    }

    // Validate userId is a valid number
    const numericUserId = parseInt(userId);
    if (isNaN(numericUserId)) {
        showAssignErrorToast('ID de usuario inválido');
        return;
    }

    try {
        const assignmentData = {
            inventoryId: inventoryData.currentInventoryId,
            userId: numericUserId
        };

        const result = await assignInventory(assignmentData);

        showAssignSuccessToast();
        closeAssignInventoryModal();
        await loadInventoryData();

    } catch (error) {
        console.error('Error assigning inventory:', error);
        
        let errorMessage = error.message || 'Inténtalo de nuevo.';
        
        // Customize error messages based on the error
        if (errorMessage.includes('401') || errorMessage.includes('expired')) {
            errorMessage = 'Sesión expirada. Por favor inicia sesión nuevamente.';
        } else if (errorMessage.includes('403') || errorMessage.includes('permission')) {
            errorMessage = 'No tienes permisos para asignar este inventario.';
        } else if (errorMessage.includes('404')) {
            errorMessage = 'Usuario o inventario no encontrado.';
        } else if (errorMessage.includes('400') && errorMessage.includes('validation')) {
            errorMessage = 'Los datos de asignación no son válidos.';
        } else if (errorMessage.includes('ya tiene un inventario') || 
                   errorMessage.includes('ya tiene un inventorio') ||
                   errorMessage.includes('already assigned')) {
            errorMessage = 'Este usuario ya tiene un inventario asignado.';
        }
        
        showAssignErrorToast(errorMessage);
    }
}

async function handleAssignManagerSubmit(e) {
    e.preventDefault();

    if (!inventoryData.currentInventoryId) {
        showAssignManagerErrorToast('No se ha seleccionado un inventario para asignar gerente');
        return;
    }

    // Try to get value from CustomSelect first, then fallback to hidden input
    let managerId = '';
    
    if (window.managerSelect && window.managerSelect.getValue) {
        managerId = window.managerSelect.getValue();
    }
    
    // Fallback to hidden input if CustomSelect value is empty
    if (!managerId) {
        const managerIdElement = document.getElementById('managerId');
        if (managerIdElement) {
            managerId = managerIdElement.value;
        }
    }

    if (!managerId || managerId.trim() === '') {
        showAssignManagerErrorToast('Por favor selecciona un gerente para la asignación');
        return;
    }

    // Validate managerId is a valid number
    const numericManagerId = parseInt(managerId);
    if (isNaN(numericManagerId)) {
        showAssignManagerErrorToast('ID de gerente inválido');
        return;
    }

    try {
        const managerData = {
            inventoryId: inventoryData.currentInventoryId,
            managerId: numericManagerId
        };

        const result = await assignManager(managerData);

        showAssignManagerSuccessToast();
        closeAssignManagerModal();
        await loadInventoryData();

    } catch (error) {
        console.error('Error assigning manager:', error);
        
        let errorMessage = error.message || 'Inténtalo de nuevo.';
        
        // Customize error messages based on the error
        if (errorMessage.includes('401') || errorMessage.includes('expired')) {
            errorMessage = 'Sesión expirada. Por favor inicia sesión nuevamente.';
        } else if (errorMessage.includes('403') || errorMessage.includes('permission')) {
            errorMessage = 'No tienes permisos para asignar gerentes a este inventario.';
        } else if (errorMessage.includes('404')) {
            errorMessage = 'Gerente o inventario no encontrado.';
        } else if (errorMessage.includes('400') && errorMessage.includes('validation')) {
            errorMessage = 'Los datos de asignación no son válidos.';
        } else if (errorMessage.includes('already assigned')) {
            errorMessage = 'Este inventario ya tiene este gerente asignado.';
        }
        
        showAssignManagerErrorToast(errorMessage);
    }
}

window.editInventory = editInventory;
window.viewInventory = viewInventory;
window.showInventoryAssignment = showInventoryAssignment;
window.showInventoryManagerAssignment = showInventoryManagerAssignment;
window.confirmDeleteInventory = confirmDeleteInventory;