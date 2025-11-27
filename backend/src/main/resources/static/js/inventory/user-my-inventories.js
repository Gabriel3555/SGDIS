// User My Inventories - Load and display user's inventories
let allInventories = [];
let ownedInventories = [];
let managedInventories = [];
let signatoryInventories = [];
let currentFilter = 'all';

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
    const ownerCount = ownedInventories.length;
    const managedCount = managedInventories.length + signatoryInventories.length;

    document.getElementById('totalCount').textContent = totalCount;
    document.getElementById('ownerCount').textContent = ownerCount;
    document.getElementById('managedCount').textContent = managedCount;
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
        const ownerClass = isOwner ? 'owner-card' : '';

        return `
            <div class="inventory-card ${ownerClass}" onclick="viewInventory('${uuid}')">
                <div class="flex items-start justify-between mb-4">
                    <div class="flex-1">
                        <div class="flex items-center gap-2 mb-2">
                            <h3 class="text-lg font-bold text-gray-800 dark:text-gray-100">${escapeHtml(inventory.name || 'Sin nombre')}</h3>
                        </div>
                        <div class="flex flex-wrap gap-2 mb-2">
                            ${roleBadges}
                        </div>
                    </div>
                    <div class="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-xl overflow-hidden flex-shrink-0 ml-4 shadow-md">
                        <img src="${imgUrl}" alt="${escapeHtml(inventory.name)}" 
                            class="inventory-image w-full h-full object-cover" 
                            onerror="this.src='../../svg/box.png'">
                    </div>
                </div>
                
                <div class="space-y-3 mb-4">
                    <div class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <i class="fas fa-map-marker-alt text-gray-400 dark:text-gray-500"></i>
                        <span class="font-medium">${escapeHtml(inventory.location || 'Sin ubicación')}</span>
                    </div>
                    ${inventory.ownerName ? `
                    <div class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <i class="fas fa-user text-gray-400 dark:text-gray-500"></i>
                        <span><strong>Propietario:</strong> ${escapeHtml(inventory.ownerName)}</span>
                    </div>
                    ` : ''}
                    <div class="flex items-center gap-2 text-sm">
                        <span class="status-badge ${statusClass}">
                            <i class="fas ${statusIcon}"></i>
                            ${statusText}
                        </span>
                    </div>
                </div>

                <div class="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                    <span class="text-xs text-gray-500 dark:text-gray-400 font-mono">${uuid.substring(0, 8)}...</span>
                    <button onclick="event.stopPropagation(); viewInventory('${uuid}')" 
                        class="btn-view px-5 py-2.5 bg-sena-verde hover:bg-sena-verde-oscuro text-white rounded-lg text-sm font-semibold relative z-10 shadow-md">
                        <i class="fas fa-eye mr-2"></i>
                        Ver Detalles
                    </button>
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

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    loadMyInventories();
    
    // Set initial active filter
    filterInventories('all');
});

// Refresh button (if you add one)
function refreshInventories() {
    loadMyInventories();
}

