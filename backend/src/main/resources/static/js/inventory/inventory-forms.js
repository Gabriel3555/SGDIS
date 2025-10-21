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
        showErrorToast('Error', 'No se ha seleccionado un inventario para editar');
        return;
    }

    const name = document.getElementById('editInventoryName').value;
    const location = document.getElementById('editInventoryLocation').value;

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
        const updateData = {
            name: name.trim(),
            location: location.trim()
        };

        const result = await updateInventory(inventoryData.currentInventoryId, updateData);

        showSuccessToast('Inventario actualizado', 'Inventario actualizado exitosamente');
        closeEditInventoryModal();
        await loadInventoryData();

    } catch (error) {
        console.error('Error updating inventory:', error);
        showErrorToast('Error al actualizar inventario', error.message || 'Inténtalo de nuevo.');
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
        showErrorToast('Error', 'No se ha seleccionado un inventario para asignar');
        return;
    }

    const userId = document.getElementById('assignUserId').value;
    const assignmentType = document.getElementById('assignmentType').value;

    if (!userId) {
        showErrorToast('Usuario requerido', 'Por favor selecciona un usuario para la asignación');
        return;
    }

    try {
        const assignmentData = {
            inventoryId: inventoryData.currentInventoryId,
            userId: parseInt(userId),
            assignmentType: assignmentType
        };

        const result = await assignInventory(assignmentData);

        showSuccessToast('Inventario asignado', 'Inventario asignado exitosamente');
        closeAssignInventoryModal();
        await loadInventoryData();

    } catch (error) {
        console.error('Error assigning inventory:', error);
        showErrorToast('Error al asignar inventario', error.message || 'Inténtalo de nuevo.');
    }
}

async function handleAssignManagerSubmit(e) {
    e.preventDefault();

    if (!inventoryData.currentInventoryId) {
        showErrorToast('Error', 'No se ha seleccionado un inventario para asignar gerente');
        return;
    }

    const managerId = document.getElementById('managerId').value;

    if (!managerId) {
        showErrorToast('Gerente requerido', 'Por favor selecciona un gerente para la asignación');
        return;
    }

    try {
        const managerData = {
            inventoryId: inventoryData.currentInventoryId,
            managerId: parseInt(managerId)
        };

        const result = await assignManager(managerData);

        showSuccessToast('Gerente asignado', 'Gerente asignado exitosamente');
        closeAssignManagerModal();
        await loadInventoryData();

    } catch (error) {
        console.error('Error assigning manager:', error);
        showErrorToast('Error al asignar gerente', error.message || 'Inténtalo de nuevo.');
    }
}

window.editInventory = editInventory;
window.viewInventory = viewInventory;
window.showInventoryAssignment = showInventoryAssignment;
window.showInventoryManagerAssignment = showInventoryManagerAssignment;
window.confirmDeleteInventory = confirmDeleteInventory;