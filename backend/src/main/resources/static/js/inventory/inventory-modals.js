function showNewInventoryModal() {
    const modal = document.getElementById('newInventoryModal');
    if (modal) {
        modal.classList.remove('hidden');
        // Focus on first input
        setTimeout(() => {
            const nameInput = document.getElementById('newInventoryName');
            if (nameInput) nameInput.focus();
        }, 100);
    }
}

function closeNewInventoryModal() {
    const modal = document.getElementById('newInventoryModal');
    if (modal) {
        modal.classList.add('hidden');
    }

    const form = document.getElementById('newInventoryForm');
    if (form) {
        form.reset();
    }
}

function showViewInventoryModal(inventoryId) {
    const numericInventoryId = typeof inventoryId === 'string' ? parseInt(inventoryId, 10) : inventoryId;
    const inventory = inventoryData.inventories.find(i => i && i.id === numericInventoryId);

    if (inventory) {
        const content = document.getElementById('viewInventoryContent');
        const name = inventory.name || 'Inventario sin nombre';
        const location = inventory.location || 'Sin ubicación';

        if (content) {
            content.innerHTML = `
                <div class="text-center mb-6">
                    <div class="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                        <i class="fas fa-boxes"></i>
                    </div>
                    <h3 class="text-xl font-semibold text-gray-800">${name}</h3>
                    <p class="text-gray-600">${location}</p>
                </div>

                <div class="space-y-3">
                    <div class="flex justify-between">
                        <span class="text-gray-600">ID:</span>
                        <span class="font-semibold">${inventory.id}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-600">Nombre:</span>
                        <span class="font-semibold">${name}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-600">Ubicación:</span>
                        <span class="font-semibold">${getLocationText(location)}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-600">UUID:</span>
                        <span class="font-semibold">${inventory.uuid || 'No asignado'}</span>
                    </div>
                    ${inventory.managerName ? `
                    <div class="flex justify-between">
                        <span class="text-gray-600">Gerente:</span>
                        <span class="font-semibold">${inventory.managerName}</span>
                    </div>
                    ` : ''}
                    ${inventory.managerEmail ? `
                    <div class="flex justify-between">
                        <span class="text-gray-600">Email del gerente:</span>
                        <span class="font-semibold">${inventory.managerEmail}</span>
                    </div>
                    ` : ''}
                    <div class="flex justify-between">
                        <span class="text-gray-600">Estado:</span>
                        <span class="font-semibold text-green-600">Activo</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-600">Fecha de creación:</span>
                        <span class="font-semibold">${formatDate(inventory.createdAt)}</span>
                    </div>
                    ${inventory.updatedAt ? `
                    <div class="flex justify-between">
                        <span class="text-gray-600">Última actualización:</span>
                        <span class="font-semibold">${formatDate(inventory.updatedAt)}</span>
                    </div>
                    ` : ''}
                </div>
            `;
        }

        const modal = document.getElementById('viewInventoryModal');
        if (modal) {
            modal.classList.remove('hidden');
        }
    }
}

function closeViewInventoryModal() {
    const modal = document.getElementById('viewInventoryModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

function showEditInventoryModal(inventoryId) {
    const numericInventoryId = typeof inventoryId === 'string' ? parseInt(inventoryId, 10) : inventoryId;
    const inventory = inventoryData.inventories.find(i => i && i.id === numericInventoryId);

    if (inventory) {
        inventoryData.currentInventoryId = inventoryId;

        const nameInput = document.getElementById('editInventoryName');
        const locationInput = document.getElementById('editInventoryLocation');

        if (nameInput) nameInput.value = inventory.name || '';
        if (locationInput) locationInput.value = inventory.location || '';

        const modal = document.getElementById('editInventoryModal');
        if (modal) {
            modal.classList.remove('hidden');
            // Focus on first input
            setTimeout(() => {
                if (nameInput) nameInput.focus();
            }, 100);
        }
    }
}

function closeEditInventoryModal() {
    const modal = document.getElementById('editInventoryModal');
    if (modal) {
        modal.classList.add('hidden');
    }

    const form = document.getElementById('editInventoryForm');
    if (form) {
        form.reset();
    }

    inventoryData.currentInventoryId = null;
}

function showDeleteInventoryModal(inventoryId) {
    const numericInventoryId = typeof inventoryId === 'string' ? parseInt(inventoryId, 10) : inventoryId;
    const inventory = inventoryData.inventories.find(i => i && i.id === numericInventoryId);

    if (!inventory) {
        showErrorToast('Inventario no encontrado', 'El inventario que intenta eliminar no existe o ya fue eliminado.');
        return;
    }

    inventoryData.currentInventoryId = inventoryId;

    const message = document.getElementById('deleteInventoryMessage');
    const name = inventory.name || 'Inventario sin nombre';
    const location = inventory.location || 'Sin ubicación';

    if (message) {
        message.textContent = `¿Está seguro de que desea eliminar el inventario "${name}" ubicado en "${getLocationText(location)}"? Esta acción no se puede deshacer.`;
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

function showAssignInventoryModal(inventoryId) {
    const numericInventoryId = typeof inventoryId === 'string' ? parseInt(inventoryId, 10) : inventoryId;
    const inventory = inventoryData.inventories.find(i => i && i.id === numericInventoryId);

    if (inventory) {
        inventoryData.currentInventoryId = inventoryId;

        const modalHtml = `
            <div id="assignInventoryModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div class="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
                    <div class="flex items-center justify-between mb-6">
                        <h2 class="text-2xl font-bold text-gray-800">Asignar Inventario</h2>
                        <button onclick="closeAssignInventoryModal()" class="text-gray-400 hover:text-gray-600">
                            <i class="fas fa-times text-2xl"></i>
                        </button>
                    </div>

                    <form id="assignInventoryForm" class="space-y-4">
                        <div class="text-center mb-4">
                            <p class="text-gray-600">Asignando: <strong>${inventory.name}</strong></p>
                            <p class="text-sm text-gray-500">${getLocationText(inventory.location)}</p>
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Usuario *</label>
                            <select id="assignUserId" class="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500" required>
                                <option value="">Seleccionar usuario...</option>
                                <!-- Users will be loaded dynamically -->
                            </select>
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Tipo de asignación *</label>
                            <select id="assignmentType" class="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500" required>
                                <option value="RESPONSIBLE">Responsable</option>
                                <option value="OBSERVER">Observador</option>
                                <option value="MAINTAINER">Mantenedor</option>
                            </select>
                        </div>

                        <div class="flex gap-3 pt-4">
                            <button type="button" onclick="closeAssignInventoryModal()" class="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors">
                                Cancelar
                            </button>
                            <button type="submit" class="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors">
                                Asignar
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        // Remove existing modal if any
        const existingModal = document.getElementById('assignInventoryModal');
        if (existingModal) {
            existingModal.remove();
        }

        document.body.insertAdjacentHTML('beforeend', modalHtml);

        const form = document.getElementById('assignInventoryForm');
        if (form) {
            form.addEventListener('submit', handleAssignInventorySubmit);
        }

        // Load users for assignment
        loadUsersForAssignment();
    }
}

function closeAssignInventoryModal() {
    const modal = document.getElementById('assignInventoryModal');
    if (modal) {
        modal.remove();
    }
    inventoryData.currentInventoryId = null;
}

function showAssignManagerModal(inventoryId) {
    const numericInventoryId = typeof inventoryId === 'string' ? parseInt(inventoryId, 10) : inventoryId;
    const inventory = inventoryData.inventories.find(i => i && i.id === numericInventoryId);

    if (inventory) {
        inventoryData.currentInventoryId = inventoryId;

        const modalHtml = `
            <div id="assignManagerModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div class="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
                    <div class="flex items-center justify-between mb-6">
                        <h2 class="text-2xl font-bold text-gray-800">Asignar Gerente</h2>
                        <button onclick="closeAssignManagerModal()" class="text-gray-400 hover:text-gray-600">
                            <i class="fas fa-times text-2xl"></i>
                        </button>
                    </div>

                    <form id="assignManagerForm" class="space-y-4">
                        <div class="text-center mb-4">
                            <p class="text-gray-600">Asignando gerente para: <strong>${inventory.name}</strong></p>
                            <p class="text-sm text-gray-500">${getLocationText(inventory.location)}</p>
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Gerente *</label>
                            <select id="managerId" class="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500" required>
                                <option value="">Seleccionar gerente...</option>
                                <!-- Managers will be loaded dynamically -->
                            </select>
                        </div>

                        <div class="flex gap-3 pt-4">
                            <button type="button" onclick="closeAssignManagerModal()" class="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors">
                                Cancelar
                            </button>
                            <button type="submit" class="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors">
                                Asignar Gerente
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        // Remove existing modal if any
        const existingModal = document.getElementById('assignManagerModal');
        if (existingModal) {
            existingModal.remove();
        }

        document.body.insertAdjacentHTML('beforeend', modalHtml);

        const form = document.getElementById('assignManagerForm');
        if (form) {
            form.addEventListener('submit', handleAssignManagerSubmit);
        }

        // Load managers for assignment
        loadManagersForAssignment();
    }
}

function closeAssignManagerModal() {
    const modal = document.getElementById('assignManagerModal');
    if (modal) {
        modal.remove();
    }
    inventoryData.currentInventoryId = null;
}

// Helper function to load users for assignment dropdown
async function loadUsersForAssignment() {
    try {
        const token = localStorage.getItem('jwt');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch('/api/v1/users', {
            method: 'GET',
            headers: headers
        });

        if (response.ok) {
            const users = await response.json();
            const userSelect = document.getElementById('assignUserId');

            if (userSelect) {
                userSelect.innerHTML = '<option value="">Seleccionar usuario...</option>';
                users.forEach(user => {
                    if (user && user.status !== false) {
                        const option = document.createElement('option');
                        option.value = user.id;
                        option.textContent = `${user.fullName} (${user.email})`;
                        userSelect.appendChild(option);
                    }
                });
            }
        }
    } catch (error) {
        console.error('Error loading users for assignment:', error);
    }
}

// Helper function to load managers for assignment dropdown
async function loadManagersForAssignment() {
    try {
        const token = localStorage.getItem('jwt');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch('/api/v1/users', {
            method: 'GET',
            headers: headers
        });

        if (response.ok) {
            const users = await response.json();
            const managerSelect = document.getElementById('managerId');

            if (managerSelect) {
                managerSelect.innerHTML = '<option value="">Seleccionar gerente...</option>';
                users.forEach(user => {
                    if (user && user.status !== false && (user.role === 'ADMIN' || user.role === 'WAREHOUSE')) {
                        const option = document.createElement('option');
                        option.value = user.id;
                        option.textContent = `${user.fullName} (${user.email})`;
                        managerSelect.appendChild(option);
                    }
                });
            }
        }
    } catch (error) {
        console.error('Error loading managers for assignment:', error);
    }
}

// Helper function to format dates
function formatDate(dateString) {
    if (!dateString) return 'No disponible';

    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-CO', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        return dateString;
    }
}

window.showNewInventoryModal = showNewInventoryModal;
window.closeNewInventoryModal = closeNewInventoryModal;
window.showViewInventoryModal = showViewInventoryModal;
window.closeViewInventoryModal = closeViewInventoryModal;
window.showEditInventoryModal = showEditInventoryModal;
window.closeEditInventoryModal = closeEditInventoryModal;
window.showDeleteInventoryModal = showDeleteInventoryModal;
window.closeDeleteInventoryModal = closeDeleteInventoryModal;
window.showAssignInventoryModal = showAssignInventoryModal;
window.closeAssignInventoryModal = closeAssignInventoryModal;
window.showAssignManagerModal = showAssignManagerModal;
window.closeAssignManagerModal = closeAssignManagerModal;