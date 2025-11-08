function showDeleteInventoryModal(inventoryId) {
    inventoryData.currentInventoryId = inventoryId;

    const inventory = inventoryData.inventories.find(i => i && i.id == inventoryId);

    if (!inventory) {
        showErrorToast('Inventario no encontrado', 'El inventario que intenta eliminar no existe o ya fue eliminado.');
        return;
    }

    const message = document.getElementById('deleteInventoryMessage');
    const inventoryName = inventory.name || 'Inventario sin nombre';

    if (message) {
        message.textContent = `¿Está seguro de que desea eliminar el inventario "${inventoryName}"? Esta acción no se puede deshacer.`;
    }

    const modal = document.getElementById('deleteInventoryModal');
    if (modal) {
        modal.classList.remove('hidden');
    }
}

function closeDeleteInventoryModal() {
    const modal = document.getElementById('deleteInventoryModal');
    if (modal) {
        modal.classList.add('hidden');
    }

    inventoryData.currentInventoryId = null;
}

async function confirmDeleteInventory() {
    const inventoryId = inventoryData.currentInventoryId;
    if (inventoryId) {
        await window.deleteInventory(inventoryId);
        closeDeleteInventoryModal();
    }
}

window.confirmDeleteInventory = confirmDeleteInventory;
window.showDeleteInventoryModal = showDeleteInventoryModal;
window.closeDeleteInventoryModal = closeDeleteInventoryModal;