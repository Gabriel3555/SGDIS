// User My Inventories - Load and display user's inventories
let allInventories = [];
let ownedInventories = [];
let managedInventories = [];
let signatoryInventories = [];
let currentFilter = 'all';
let currentUserRole = null;

// Load current user role
async function loadCurrentUserRole() {
    try {
        const token = localStorage.getItem('jwt');
        if (!token) {
            return null;
        }

        const response = await fetch('/api/v1/users/me', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const userData = await response.json();
            currentUserRole = userData.role;
            return currentUserRole;
        }
    } catch (error) {
        console.error('Error loading user role:', error);
    }
    return null;
}

// Load all user inventories
async function loadMyInventories() {
    const loadingState = document.getElementById('loadingState');
    const inventoriesContainer = document.getElementById('inventoriesContainer');
    const emptyState = document.getElementById('emptyState');

    try {
        loadingState.style.display = 'block';
        inventoriesContainer.style.display = 'none';
        emptyState.style.display = 'none';

        const token = localStorage.getItem('jwt');
        if (!token) {
            window.location.href = '/';
            return;
        }

        // Load user role first
        await loadCurrentUserRole();

        // Load all three types of inventories in parallel
        const [ownedResponse, managedResponse, signatoryResponse] = await Promise.all([
            fetch('/api/v1/users/me/inventories/owner', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }),
            fetch('/api/v1/users/me/inventories', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }),
            fetch('/api/v1/users/me/inventories/signatory', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            })
        ]);

        if (ownedResponse.status === 401 || managedResponse.status === 401 || signatoryResponse.status === 401) {
            localStorage.removeItem('jwt');
            window.location.href = '/';
            return;
        }

        ownedInventories = ownedResponse.ok ? await ownedResponse.json() : [];
        managedInventories = managedResponse.ok ? await managedResponse.json() : [];
        signatoryInventories = signatoryResponse.ok ? await signatoryResponse.json() : [];

        // Combine all inventories and mark roles
        const inventoryMap = new Map();

        // Add owned inventories
        ownedInventories.forEach(inv => {
            if (!inventoryMap.has(inv.id)) {
                inventoryMap.set(inv.id, {
                    ...inv,
                    roles: ['owner']
                });
            } else {
                inventoryMap.get(inv.id).roles.push('owner');
            }
        });

        // Add managed inventories (includes owner + manager)
        managedInventories.forEach(inv => {
            if (!inventoryMap.has(inv.id)) {
                inventoryMap.set(inv.id, {
                    ...inv,
                    roles: ['manager']
                });
            } else {
                const existing = inventoryMap.get(inv.id);
                if (!existing.roles.includes('manager')) {
                    existing.roles.push('manager');
                }
            }
        });

        // Add signatory inventories
        signatoryInventories.forEach(inv => {
            if (!inventoryMap.has(inv.id)) {
                inventoryMap.set(inv.id, {
                    ...inv,
                    roles: ['signatory']
                });
            } else {
                const existing = inventoryMap.get(inv.id);
                if (!existing.roles.includes('signatory')) {
                    existing.roles.push('signatory');
                }
            }
        });

        allInventories = Array.from(inventoryMap.values());

        // Update stats
        updateStats();

        // Display inventories
        displayInventories();

        loadingState.style.display = 'none';
        
        if (allInventories.length === 0) {
            emptyState.style.display = 'block';
        } else {
            inventoriesContainer.style.display = 'grid';
        }

    } catch (error) {
        console.error('Error loading inventories:', error);
        loadingState.style.display = 'none';
        emptyState.style.display = 'block';
        emptyState.innerHTML = `
            <i class="fas fa-exclamation-triangle text-6xl text-red-400 mb-4"></i>
            <h3 class="text-xl font-semibold text-gray-800 mb-2">Error al cargar inventarios</h3>
            <p class="text-gray-600 mb-4">${error.message}</p>
            <button onclick="loadMyInventories()" class="px-6 py-3 bg-sena-verde hover:bg-sena-verde-oscuro text-white rounded-xl transition-colors">
                <i class="fas fa-redo mr-2"></i>
                Reintentar
            </button>
        `;
    }
}

// Update statistics
function updateStats() {
    const totalCount = allInventories.length;
    
    // Count unique inventories where user is owner
    const ownerCount = allInventories.filter(inv => inv.roles && inv.roles.includes('owner')).length;
    
    // Count unique inventories where user is manager, but NOT owner (to avoid duplicates)
    const managerCount = allInventories.filter(inv => {
        const roles = inv.roles || [];
        const isManager = roles.includes('manager');
        const isOwner = roles.includes('owner');
        // Count if user is manager, but not owner
        return isManager && !isOwner;
    }).length;
    
    // Count unique inventories where user is signatory, but NOT owner (to avoid duplicates)
    const signatoryCount = allInventories.filter(inv => {
        const roles = inv.roles || [];
        const isSignatory = roles.includes('signatory');
        const isOwner = roles.includes('owner');
        // Count if user is signatory, but not owner
        return isSignatory && !isOwner;
    }).length;

    document.getElementById('totalCount').textContent = totalCount;
    document.getElementById('ownerCount').textContent = ownerCount;
    document.getElementById('managerCount').textContent = managerCount;
    document.getElementById('signatoryCount').textContent = signatoryCount;
}

// Filter inventories by role
function filterInventories(filter) {
    currentFilter = filter;

    // Update active tab
    document.querySelectorAll('.filter-tab').forEach(btn => {
        btn.classList.remove('active');
    });

    const activeBtn = document.getElementById(`filter${filter.charAt(0).toUpperCase() + filter.slice(1)}`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }

    displayInventories();
}

// Display inventories based on current filter
function displayInventories() {
    const container = document.getElementById('inventoriesContainer');
    
    let filteredInventories = [];
    
    switch (currentFilter) {
        case 'owner':
            filteredInventories = allInventories.filter(inv => inv.roles.includes('owner'));
            break;
        case 'manager':
            filteredInventories = allInventories.filter(inv => inv.roles.includes('manager') && !inv.roles.includes('owner'));
            break;
        case 'signatory':
            filteredInventories = allInventories.filter(inv => inv.roles.includes('signatory') && !inv.roles.includes('owner') && !inv.roles.includes('manager'));
            break;
        default:
            filteredInventories = allInventories;
    }

    if (filteredInventories.length === 0) {
        container.innerHTML = `
            <div class="col-span-full text-center py-12">
                <i class="fas fa-inbox text-6xl text-gray-400 mb-4"></i>
                <h3 class="text-xl font-semibold text-gray-800 mb-2">No hay inventarios</h3>
                <p class="text-gray-600">No tienes inventarios con este rol.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = filteredInventories.map(inventory => {
        const roles = inventory.roles || [];
        const roleBadges = roles.map(role => {
            if (role === 'owner') {
                return '<span class="role-badge role-owner"><i class="fas fa-crown"></i> Propietario</span>';
            } else if (role === 'manager') {
                return '<span class="role-badge role-manager"><i class="fas fa-user-tie"></i> Gestor</span>';
            } else if (role === 'signatory') {
                return '<span class="role-badge role-signatory"><i class="fas fa-signature"></i> Firmante</span>';
            }
            return '';
        }).join('');

        const statusClass = inventory.status ? 'status-active' : 'status-inactive';
        const statusText = inventory.status ? 'Activo' : 'Inactivo';
        const statusIcon = inventory.status ? 'fa-check-circle' : 'fa-times-circle';

        const imgUrl = inventory.imgUrl || '../../svg/box.png';
        const uuid = inventory.uuid || inventory.id;
        const isOwner = roles.includes('owner');
        const isManager = roles.includes('manager') && !isOwner;
        const isSignatory = roles.includes('signatory') && !isOwner;
        const ownerClass = isOwner ? 'owner-card' : '';
        
        // Show quit button only for USER role and when user is manager or signatory (not owner)
        // If user is both manager and signatory, show button for manager (primary role)
        const showQuitButton = currentUserRole === 'USER' && (isManager || isSignatory);
        const roleType = isManager ? 'manager' : 'signatory';
        const roleName = isManager ? 'Gestor' : 'Firmante';
        
        // Build quit buttons - show both if user has both roles
        let quitButtonHtml = '';
        if (showQuitButton) {
            if (isManager && isSignatory) {
                // User has both roles - show both buttons horizontally with consistent sizing
                quitButtonHtml = `
                    <div class="flex items-center gap-1.5">
                        <button onclick="event.stopPropagation(); quitRole('${inventory.id}', 'manager', '${escapeHtml(inventory.name || 'este inventario')}', 'Gestor')" 
                            class="flex items-center justify-center gap-1 px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-semibold shadow transition-all duration-200 relative z-10"
                            title="Renunciar como Gestor">
                            <i class="fas fa-user-tie"></i>
                            <span>Gestor</span>
                        </button>
                        <button onclick="event.stopPropagation(); quitRole('${inventory.id}', 'signatory', '${escapeHtml(inventory.name || 'este inventario')}', 'Firmante')" 
                            class="flex items-center justify-center gap-1 px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-semibold shadow transition-all duration-200 relative z-10"
                            title="Renunciar como Firmante">
                            <i class="fas fa-signature"></i>
                            <span>Firmante</span>
                        </button>
                    </div>
                `;
            } else {
                // User has only one role - same size as "Ver Detalles" button
                quitButtonHtml = `
                    <button onclick="event.stopPropagation(); quitRole('${inventory.id}', '${roleType}', '${escapeHtml(inventory.name || 'este inventario')}', '${roleName}')" 
                        class="flex items-center justify-center gap-1.5 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-semibold shadow transition-all duration-200 relative z-10 whitespace-nowrap"
                        title="Renunciar como ${roleName}">
                        <i class="fas fa-sign-out-alt text-xs"></i>
                        <span>Renunciar</span>
                    </button>
                `;
            }
        }

        return `
            <div class="inventory-card ${ownerClass}" onclick="viewInventory('${uuid}')">
                <div class="flex items-start justify-between mb-3">
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2 mb-1.5">
                            <h3 class="text-base font-bold text-gray-800 dark:text-gray-100 truncate">${escapeHtml(inventory.name || 'Sin nombre')}</h3>
                        </div>
                        <div class="flex flex-wrap gap-1.5 mb-1.5">
                            ${roleBadges}
                        </div>
                    </div>
                    <div class="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden flex-shrink-0 ml-3 shadow-sm">
                        <img src="${imgUrl}" alt="${escapeHtml(inventory.name)}" 
                            class="inventory-image w-full h-full object-cover" 
                            onerror="this.src='../../svg/box.png'">
                    </div>
                </div>
                
                <div class="space-y-2 mb-3">
                    <div class="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                        <i class="fas fa-map-marker-alt text-gray-400 dark:text-gray-500 text-xs"></i>
                        <span class="font-medium truncate">${escapeHtml(inventory.location || 'Sin ubicación')}</span>
                    </div>
                    ${inventory.ownerName ? `
                    <div class="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                        <i class="fas fa-user text-gray-400 dark:text-gray-500 text-xs"></i>
                        <span class="truncate"><strong>Propietario:</strong> ${escapeHtml(inventory.ownerName)}</span>
                    </div>
                    ` : ''}
                    <div class="flex items-center gap-1.5">
                        <span class="status-badge ${statusClass} text-xs">
                            <i class="fas ${statusIcon}"></i>
                            ${statusText}
                        </span>
                    </div>
                </div>

                <div class="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                    <span class="text-xs text-gray-500 dark:text-gray-400 font-mono">${uuid.substring(0, 8)}...</span>
                    <div class="flex items-center gap-1.5">
                        ${quitButtonHtml}
                        <button onclick="event.stopPropagation(); viewInventory('${uuid}')" 
                            class="flex items-center justify-center gap-1.5 px-4 py-2 bg-sena-verde hover:bg-sena-verde-oscuro text-white rounded-lg text-sm font-semibold relative z-10 shadow transition-all duration-200 whitespace-nowrap">
                            <i class="fas fa-eye text-xs"></i>
                            <span>Ver Detalles</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// View inventory details
function viewInventory(uuid) {
    // Find inventory by UUID
    const inventory = allInventories.find(inv => inv.uuid === uuid || inv.id.toString() === uuid);
    if (!inventory) {
        alert('Inventario no encontrado');
        return;
    }

    // Navigate to inventory items page
    window.location.href = `/user/inventory/${inventory.id}`;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Quit role (manager or signatory) from inventory
async function quitRole(inventoryId, role, inventoryName, roleDisplayName) {
    // Verify user role is USER
    if (currentUserRole !== 'USER') {
        // Try inventory toast first, then fallback
        if (typeof window.showInventoryErrorToast === 'function') {
            window.showInventoryErrorToast('Error', 'No tiene permisos para realizar esta acción');
        } else if (typeof showInventoryErrorToast === 'function') {
            showInventoryErrorToast('Error', 'No tiene permisos para realizar esta acción');
        } else if (typeof window.showErrorToast === 'function') {
            window.showErrorToast('Error', 'No tiene permisos para realizar esta acción');
        } else if (typeof showErrorToast === 'function') {
            showErrorToast('Error', 'No tiene permisos para realizar esta acción');
        } else {
            alert('No tiene permisos para realizar esta acción');
        }
        return;
    }

    // Show custom confirmation modal
    const confirmed = await showQuitConfirmationModal(inventoryName, roleDisplayName);
    if (!confirmed) {
        return;
    }

    // Find the button and show loading state
    // Use a more flexible selector to find buttons with this inventoryId
    const allButtons = document.querySelectorAll('button');
    const buttons = Array.from(allButtons).filter(btn => {
        const onclick = btn.getAttribute('onclick') || '';
        return onclick.includes(`quitRole('${inventoryId}'`) || onclick.includes(`quitRole("${inventoryId}"`);
    });
    
    buttons.forEach(btn => {
        const originalContent = btn.innerHTML;
        btn.disabled = true;
        btn.classList.add('opacity-75', 'cursor-not-allowed');
        btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i><span>Procesando...</span>';
        
        // Store original content for restoration
        btn.dataset.originalContent = originalContent;
    });

    try {
        const token = localStorage.getItem('jwt');
        if (!token) {
            // Try inventory toast first, then fallback
            if (typeof window.showInventoryErrorToast === 'function') {
                window.showInventoryErrorToast('Error', 'No se encontró el token de autenticación');
            } else if (typeof showInventoryErrorToast === 'function') {
                showInventoryErrorToast('Error', 'No se encontró el token de autenticación');
            } else if (typeof window.showErrorToast === 'function') {
                window.showErrorToast('Error', 'No se encontró el token de autenticación');
            } else if (typeof showErrorToast === 'function') {
                showErrorToast('Error', 'No se encontró el token de autenticación');
            } else {
                alert('No se encontró el token de autenticación');
            }
            restoreButtons(buttons);
            return;
        }

        const endpoint = role === 'manager' 
            ? `/api/v1/inventory/quitManager/${inventoryId}`
            : `/api/v1/inventory/quitSignatory/${inventoryId}`;

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const result = await response.json();
            const successMessage = result.message || `Ha renunciado exitosamente como ${roleDisplayName.toLowerCase()}`;
            // Try inventory toast first, then fallback
            if (typeof window.showInventorySuccessToast === 'function') {
                window.showInventorySuccessToast('Éxito', successMessage);
            } else if (typeof showInventorySuccessToast === 'function') {
                showInventorySuccessToast('Éxito', successMessage);
            } else if (typeof window.showSuccessToast === 'function') {
                window.showSuccessToast('Éxito', successMessage);
            } else if (typeof showSuccessToast === 'function') {
                showSuccessToast('Éxito', successMessage);
            } else {
                alert(successMessage);
            }
            // Reload inventories after a short delay
            setTimeout(async () => {
                await loadMyInventories();
            }, 500);
        } else {
            let errorMessage = 'Error al renunciar al rol';
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorData.error || errorMessage;
            } catch (e) {
                if (response.status === 500) {
                    errorMessage = 'Error interno del servidor. Por favor, contacte al administrador.';
                } else if (response.status === 404) {
                    errorMessage = 'No se encontró el inventario o no tiene este rol asignado.';
                } else if (response.status === 403) {
                    errorMessage = 'No tiene permisos para realizar esta acción.';
                }
            }
            // Try inventory toast first, then fallback
            if (typeof window.showInventoryErrorToast === 'function') {
                window.showInventoryErrorToast('Error', errorMessage);
            } else if (typeof showInventoryErrorToast === 'function') {
                showInventoryErrorToast('Error', errorMessage);
            } else if (typeof window.showErrorToast === 'function') {
                window.showErrorToast('Error', errorMessage);
            } else if (typeof showErrorToast === 'function') {
                showErrorToast('Error', errorMessage);
            } else {
                alert(errorMessage);
            }
            restoreButtons(buttons);
        }
    } catch (error) {
        console.error('Error quitting role:', error);
        const errorMsg = 'Error de conexión. Por favor, verifique su conexión e intente nuevamente.';
        // Try inventory toast first, then fallback
        if (typeof window.showInventoryErrorToast === 'function') {
            window.showInventoryErrorToast('Error', errorMsg);
        } else if (typeof showInventoryErrorToast === 'function') {
            showInventoryErrorToast('Error', errorMsg);
        } else if (typeof window.showErrorToast === 'function') {
            window.showErrorToast('Error', errorMsg);
        } else if (typeof showErrorToast === 'function') {
            showErrorToast('Error', errorMsg);
        } else {
            alert(errorMsg);
        }
        restoreButtons(buttons);
    }
}

// Restore button original state
function restoreButtons(buttons) {
    buttons.forEach(btn => {
        btn.disabled = false;
        btn.classList.remove('opacity-75', 'cursor-not-allowed');
        if (btn.dataset.originalContent) {
            btn.innerHTML = btn.dataset.originalContent;
            delete btn.dataset.originalContent;
        }
    });
}

// Show quit confirmation modal
function showQuitConfirmationModal(inventoryName, roleDisplayName) {
    return new Promise((resolve) => {
        // Create modal overlay
        const overlay = document.createElement('div');
        overlay.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        overlay.id = 'quitRoleModalOverlay';
        
        // Create modal
        const modal = document.createElement('div');
        modal.className = 'bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl transform transition-all';
        modal.innerHTML = `
            <div class="text-center mb-6">
                <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
                    <i class="fas fa-exclamation-triangle text-red-600 dark:text-red-400 text-2xl"></i>
                </div>
                <h3 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                    Confirmar Renuncia
                </h3>
                <p class="text-gray-600 dark:text-gray-400">
                    ¿Está seguro que desea renunciar como <strong class="text-gray-900 dark:text-gray-100">${escapeHtml(roleDisplayName)}</strong> del inventario <strong class="text-gray-900 dark:text-gray-100">${escapeHtml(inventoryName)}</strong>?
                </p>
                <p class="text-sm text-gray-500 dark:text-gray-500 mt-2">
                    Esta acción no se puede deshacer.
                </p>
            </div>
            <div class="flex gap-3">
                <button id="quitRoleCancel" 
                    class="flex-1 px-4 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-semibold">
                    Cancelar
                </button>
                <button id="quitRoleConfirm" 
                    class="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl transition-all font-semibold shadow-md hover:shadow-lg transform hover:scale-105">
                    <i class="fas fa-sign-out-alt mr-2"></i>
                    Sí, Renunciar
                </button>
            </div>
        `;
        
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        
        // Handle cancel
        document.getElementById('quitRoleCancel').addEventListener('click', () => {
            document.body.removeChild(overlay);
            resolve(false);
        });
        
        // Handle confirm
        document.getElementById('quitRoleConfirm').addEventListener('click', () => {
            document.body.removeChild(overlay);
            resolve(true);
        });
        
        // Handle overlay click
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                document.body.removeChild(overlay);
                resolve(false);
            }
        });
        
        // Handle ESC key
        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                document.body.removeChild(overlay);
                document.removeEventListener('keydown', handleEsc);
                resolve(false);
            }
        };
        document.addEventListener('keydown', handleEsc);
    });
}


// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async function() {
    // Load user role first
    await loadCurrentUserRole();
    // Then load inventories
    loadMyInventories();
    
    // Set initial active filter
    filterInventories('all');
});

// Refresh button (if you add one)
function refreshInventories() {
    loadMyInventories();
}

