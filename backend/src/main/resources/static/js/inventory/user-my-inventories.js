// User My Inventories - Load and display user's inventories
let allInventories = [];
let ownedInventories = [];
let managedInventories = [];
let signatoryInventories = [];
let currentFilter = 'all';
let currentUserRole = null;
let currentPage = 0;
let pageSize = 6;
let totalPages = 0;
let sortBy = 'name'; // 'name', 'location', 'status'
let sortOrder = 'asc'; // 'asc', 'desc'
let viewMode = 'cards'; // 'cards', 'table'

// Create a minimal inventoryData object for modals compatibility
// This is needed because inventory-modals.js expects inventoryData to exist
if (typeof window.inventoryData === 'undefined') {
    window.inventoryData = {
        currentInventoryId: null,
        inventories: allInventories // Will be updated when inventories are loaded
    };
}

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

        // Update inventoryData for modals compatibility
        if (window.inventoryData) {
            window.inventoryData.inventories = allInventories;
        }

        // Update stats
        updateStats();

        // Display inventories
        currentPage = 0; // Reset to first page when data loads
        displayInventories();
        updatePagination();
        updateViewModeButtons();

        loadingState.style.display = 'none';
        
        if (allInventories.length === 0) {
            emptyState.style.display = 'block';
            inventoriesContainer.style.display = 'none';
        } else {
            inventoriesContainer.style.display = viewMode === 'table' ? 'block' : 'grid';
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

    currentPage = 0; // Reset to first page when filter changes
    displayInventories();
}

// Sort inventories
function sortInventories(inventories) {
    const sorted = [...inventories];
    
    sorted.sort((a, b) => {
        let aValue, bValue;
        
        switch (sortBy) {
            case 'name':
                aValue = (a.name || '').toLowerCase();
                bValue = (b.name || '').toLowerCase();
                break;
            case 'location':
                aValue = (a.location || '').toLowerCase();
                bValue = (b.location || '').toLowerCase();
                break;
            case 'status':
                aValue = a.status ? 1 : 0;
                bValue = b.status ? 1 : 0;
                break;
            default:
                aValue = (a.name || '').toLowerCase();
                bValue = (b.name || '').toLowerCase();
        }
        
        if (sortBy === 'status') {
            return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
        } else {
            if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        }
    });
    
    return sorted;
}

// Change page
function changePage(page) {
    if (page < 0) return;
    const maxPage = Math.max(0, totalPages - 1);
    if (page > maxPage) return;
    
    currentPage = page;
    displayInventories();
    updatePagination();
}

// Set sort
function setSort(field) {
    if (sortBy === field) {
        sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
        sortBy = field;
        sortOrder = 'asc';
    }
    currentPage = 0; // Reset to first page when sorting changes
    displayInventories();
    updateSortButtons();
}

// Set view mode
function setViewMode(mode) {
    viewMode = mode;
    currentPage = 0; // Reset to first page when view changes
    displayInventories();
    updateViewModeButtons();
    updatePagination();
}

// Update sort buttons
function updateSortButtons() {
    const buttons = document.querySelectorAll('[data-sort]');
    buttons.forEach(btn => {
        const field = btn.getAttribute('data-sort');
        const icon = btn.querySelector('i');
        if (field === sortBy) {
            btn.classList.add('active');
            if (icon) {
                icon.className = sortOrder === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down';
            }
        } else {
            btn.classList.remove('active');
            if (icon) {
                icon.className = 'fas fa-sort';
            }
        }
    });
}

// Update view mode buttons
function updateViewModeButtons() {
    const cardsBtn = document.getElementById('viewModeCards');
    const tableBtn = document.getElementById('viewModeTable');
    
    if (cardsBtn) {
        if (viewMode === 'cards') {
            cardsBtn.classList.add('active');
            cardsBtn.classList.remove('bg-gray-200', 'dark:bg-gray-600');
            cardsBtn.classList.add('bg-[#00AF00]', 'text-white');
        } else {
            cardsBtn.classList.remove('active', 'bg-[#00AF00]', 'text-white');
            cardsBtn.classList.add('bg-gray-200', 'dark:bg-gray-600');
        }
    }
    
    if (tableBtn) {
        if (viewMode === 'table') {
            tableBtn.classList.add('active');
            tableBtn.classList.remove('bg-gray-200', 'dark:bg-gray-600');
            tableBtn.classList.add('bg-[#00AF00]', 'text-white');
        } else {
            tableBtn.classList.remove('active', 'bg-[#00AF00]', 'text-white');
            tableBtn.classList.add('bg-gray-200', 'dark:bg-gray-600');
        }
    }
}

// Update pagination
function updatePagination() {
    const container = document.getElementById('paginationContainer');
    if (!container) return;
    
    // Calculate filtered count
    let filteredCount = 0;
    switch (currentFilter) {
        case 'manager':
            filteredCount = allInventories.filter(inv => inv.roles.includes('manager') && !inv.roles.includes('owner')).length;
            break;
        case 'signatory':
            filteredCount = allInventories.filter(inv => inv.roles.includes('signatory') && !inv.roles.includes('owner') && !inv.roles.includes('manager')).length;
            break;
        default:
            filteredCount = allInventories.length;
    }
    
    const startItem = currentPage * pageSize + 1;
    const endItem = Math.min((currentPage + 1) * pageSize, filteredCount);
    
    let paginationHtml = `
        <div class="text-sm text-gray-600 dark:text-gray-400">
            Mostrando ${startItem}-${endItem} de ${filteredCount} inventarios
        </div>
        <div class="flex gap-2">
    `;
    
    // Previous button
    const prevDisabled = currentPage === 0;
    paginationHtml += `
        <button onclick="changePage(${currentPage - 1})" 
                ${prevDisabled ? 'disabled' : ''}
                class="px-4 py-2 rounded-xl transition-colors ${
                    prevDisabled 
                        ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed' 
                        : 'bg-[#00AF00] hover:bg-[#008800] text-white'
                }">
            <i class="fas fa-chevron-left"></i>
        </button>
    `;
    
    // Page numbers
    const maxPagesToShow = 5;
    let startPage = Math.max(0, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages - 1, startPage + maxPagesToShow - 1);
    
    if (endPage - startPage < maxPagesToShow - 1) {
        startPage = Math.max(0, endPage - maxPagesToShow + 1);
    }
    
    if (startPage > 0) {
        paginationHtml += `
            <button onclick="changePage(0)" class="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300">1</button>
        `;
        if (startPage > 1) {
            paginationHtml += `<span class="px-2 text-gray-500">...</span>`;
        }
    }
    
    for (let i = startPage; i <= endPage; i++) {
        const isActive = i === currentPage;
        paginationHtml += `
            <button onclick="changePage(${i})" 
                    class="px-4 py-2 rounded-xl transition-colors ${
                        isActive 
                            ? 'bg-[#00AF00] text-white' 
                            : 'border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }">
                ${i + 1}
            </button>
        `;
    }
    
    if (endPage < totalPages - 1) {
        if (endPage < totalPages - 2) {
            paginationHtml += `<span class="px-2 text-gray-500">...</span>`;
        }
        paginationHtml += `
            <button onclick="changePage(${totalPages - 1})" class="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300">${totalPages}</button>
        `;
    }
    
    // Next button
    const nextDisabled = currentPage >= totalPages - 1;
    paginationHtml += `
        <button onclick="changePage(${currentPage + 1})" 
                ${nextDisabled ? 'disabled' : ''}
                class="px-4 py-2 rounded-xl transition-colors ${
                    nextDisabled 
                        ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed' 
                        : 'bg-[#00AF00] hover:bg-[#008800] text-white'
                }">
            <i class="fas fa-chevron-right"></i>
        </button>
    `;
    
    paginationHtml += '</div>';
    container.innerHTML = paginationHtml;
}

// Display inventories based on current filter
function displayInventories() {
    const container = document.getElementById('inventoriesContainer');
    
    let filteredInventories = [];
    
    switch (currentFilter) {
        case 'manager':
            filteredInventories = allInventories.filter(inv => inv.roles.includes('manager') && !inv.roles.includes('owner'));
            break;
        case 'signatory':
            filteredInventories = allInventories.filter(inv => inv.roles.includes('signatory') && !inv.roles.includes('owner') && !inv.roles.includes('manager'));
            break;
        default:
            filteredInventories = allInventories;
    }

    // Apply sorting
    filteredInventories = sortInventories(filteredInventories);
    
    // Calculate pagination
    totalPages = Math.ceil(filteredInventories.length / pageSize);
    if (currentPage >= totalPages && totalPages > 0) {
        currentPage = totalPages - 1;
    }
    
    // Get paginated inventories
    const startIndex = currentPage * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedInventories = filteredInventories.slice(startIndex, endIndex);

    if (filteredInventories.length === 0) {
        container.innerHTML = `
            <div class="col-span-full text-center py-12">
                <i class="fas fa-inbox text-6xl text-gray-400 mb-4"></i>
                <h3 class="text-xl font-semibold text-gray-800 mb-2">No hay inventarios</h3>
                <p class="text-gray-600">No tienes inventarios con este rol.</p>
            </div>
        `;
        updatePagination();
        return;
    }

    if (viewMode === 'table') {
        displayInventoriesTable(paginatedInventories, filteredInventories.length);
        container.style.display = 'block';
    } else {
        displayInventoriesCards(paginatedInventories);
        container.style.display = 'grid';
    }
    
    updatePagination();
}

// Display inventories as cards
function displayInventoriesCards(inventories) {
    const container = document.getElementById('inventoriesContainer');
    container.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6';
    
    container.innerHTML = inventories.map(inventory => {
        const roles = inventory.roles || [];
        const isOwner = roles.includes('owner');
        
        // Si es propietario, solo mostrar badge de propietario (tiene todos los permisos)
        // Si no es propietario, mostrar los otros roles (Gestor, Firmante)
        const roleBadges = isOwner 
            ? '<span class="role-badge role-owner"><i class="fas fa-crown"></i> Propietario</span>'
            : roles.map(role => {
                if (role === 'manager') {
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

                <div class="flex items-center justify-end pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div class="flex items-center gap-1.5">
                        ${quitButtonHtml}
                        ${isOwner ? `
                        <button onclick="event.stopPropagation(); viewInventory('${uuid}')" 
                                class="flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-semibold relative z-10 shadow transition-all duration-200"
                                title="Ver Items">
                                <i class="fas fa-box"></i>
                        </button>
                            <button onclick="event.stopPropagation(); openAssignRoleModal('${inventory.id}')" 
                                class="flex items-center justify-center gap-1.5 px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-semibold relative z-10 shadow transition-all duration-200"
                                title="Añadir Firmantes y Manejadores">
                                <i class="fas fa-user-plus"></i>
                            </button>
                            <button onclick="event.stopPropagation(); openRemoveRoleModal('${inventory.id}')" 
                                class="flex items-center justify-center gap-1.5 px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-semibold relative z-10 shadow transition-all duration-200"
                                title="Quitar Firmantes y Manejadores">
                                <i class="fas fa-user-minus"></i>
                            </button>
                            <button onclick="event.stopPropagation(); openInventoryTree('${inventory.id}', '${escapeHtml(inventory.name || '')}', '${inventory.imgUrl || ''}')" 
                                class="flex items-center justify-center gap-1.5 px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-semibold relative z-10 shadow transition-all duration-200"
                                title="Ver Árbol de Jerarquía">
                                <i class="fas fa-sitemap"></i>
                            </button>
                        ` : isSignatory ? `
                            <button onclick="event.stopPropagation(); viewInventoryItems('${uuid}')" 
                                class="flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-semibold relative z-10 shadow transition-all duration-200"
                                title="Ver Items">
                                <i class="fas fa-box"></i>
                            </button>
                            <button onclick="event.stopPropagation(); openAssignRoleModal('${inventory.id}')" 
                                class="flex items-center justify-center gap-1.5 px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-semibold relative z-10 shadow transition-all duration-200"
                                title="Añadir Firmantes y Manejadores">
                                <i class="fas fa-user-plus"></i>
                            </button>
                            <button onclick="event.stopPropagation(); openRemoveRoleModal('${inventory.id}')" 
                                class="flex items-center justify-center gap-1.5 px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-semibold relative z-10 shadow transition-all duration-200"
                                title="Quitar Firmantes y Manejadores">
                                <i class="fas fa-user-minus"></i>
                            </button>
                            <button onclick="event.stopPropagation(); openInventoryTree('${inventory.id}', '${escapeHtml(inventory.name || '')}', '${inventory.imgUrl || ''}')" 
                                class="flex items-center justify-center gap-1.5 px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-semibold relative z-10 shadow transition-all duration-200"
                                title="Ver Árbol de Jerarquía">
                                <i class="fas fa-sitemap"></i>
                            </button>
                        ` : isManager ? `
                            <button onclick="event.stopPropagation(); viewInventoryItems('${uuid}')" 
                                class="flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-semibold relative z-10 shadow transition-all duration-200"
                                title="Ver Items">
                                <i class="fas fa-box"></i>
                            </button>
                            <button onclick="event.stopPropagation(); openInventoryTree('${inventory.id}', '${escapeHtml(inventory.name || '')}', '${inventory.imgUrl || ''}')" 
                                class="flex items-center justify-center gap-1.5 px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-semibold relative z-10 shadow transition-all duration-200"
                                title="Ver Árbol de Jerarquía">
                                <i class="fas fa-sitemap"></i>
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Display inventories as table
function displayInventoriesTable(inventories, totalCount) {
    const container = document.getElementById('inventoriesContainer');
    container.className = 'overflow-x-auto';
    
    let tableHtml = `
        <table class="w-full">
            <thead>
                <tr class="border-b-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <th class="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        <button onclick="setSort('name')" data-sort="name" class="flex items-center gap-2 hover:text-[#00AF00] transition-colors">
                            <i class="fas fa-sort"></i>
                            Nombre
                        </button>
                    </th>
                    <th class="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        <button onclick="setSort('location')" data-sort="location" class="flex items-center gap-2 hover:text-[#00AF00] transition-colors">
                            <i class="fas fa-sort"></i>
                            Ubicación
                        </button>
                    </th>
                    <th class="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        Roles
                    </th>
                    <th class="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        <button onclick="setSort('status')" data-sort="status" class="flex items-center gap-2 hover:text-[#00AF00] transition-colors">
                            <i class="fas fa-sort"></i>
                            Estado
                        </button>
                    </th>
                    <th class="text-center py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        Acciones
                    </th>
                </tr>
            </thead>
            <tbody>
    `;
    
    inventories.forEach(inventory => {
        const roles = inventory.roles || [];
        const isOwner = roles.includes('owner');
        
        const roleBadges = isOwner 
            ? '<span class="role-badge role-owner"><i class="fas fa-crown"></i> Propietario</span>'
            : roles.map(role => {
                if (role === 'manager') {
                    return '<span class="role-badge role-manager"><i class="fas fa-user-tie"></i> Gestor</span>';
                } else if (role === 'signatory') {
                    return '<span class="role-badge role-signatory"><i class="fas fa-signature"></i> Firmante</span>';
                }
                return '';
            }).filter(b => b).join(' ');

        const statusClass = inventory.status ? 'status-active' : 'status-inactive';
        const statusText = inventory.status ? 'Activo' : 'Inactivo';
        const statusIcon = inventory.status ? 'fa-check-circle' : 'fa-times-circle';
        const uuid = inventory.uuid || inventory.id;
        const isManager = roles.includes('manager') && !isOwner;
        const isSignatory = roles.includes('signatory') && !isOwner;
        
        const showQuitButton = currentUserRole === 'USER' && (isManager || isSignatory);
        const roleType = isManager ? 'manager' : 'signatory';
        const roleName = isManager ? 'Gestor' : 'Firmante';
        
        let quitButtonHtml = '';
        if (showQuitButton) {
            if (isManager && isSignatory) {
                quitButtonHtml = `
                    <div class="flex items-center gap-1.5">
                        <button onclick="event.stopPropagation(); quitRole('${inventory.id}', 'manager', '${escapeHtml(inventory.name || 'este inventario')}', 'Gestor')" 
                            class="flex items-center justify-center gap-1 px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-semibold shadow transition-all duration-200"
                            title="Renunciar como Gestor">
                            <i class="fas fa-user-tie"></i>
                            <span>Gestor</span>
                        </button>
                        <button onclick="event.stopPropagation(); quitRole('${inventory.id}', 'signatory', '${escapeHtml(inventory.name || 'este inventario')}', 'Firmante')" 
                            class="flex items-center justify-center gap-1 px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-semibold shadow transition-all duration-200"
                            title="Renunciar como Firmante">
                            <i class="fas fa-signature"></i>
                            <span>Firmante</span>
                        </button>
                    </div>
                `;
            } else {
                quitButtonHtml = `
                    <button onclick="event.stopPropagation(); quitRole('${inventory.id}', '${roleType}', '${escapeHtml(inventory.name || 'este inventario')}', '${roleName}')" 
                        class="flex items-center justify-center gap-1.5 px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-semibold shadow transition-all duration-200 whitespace-nowrap"
                        title="Renunciar como ${roleName}">
                        <i class="fas fa-sign-out-alt"></i>
                        <span>Renunciar</span>
                    </button>
                `;
            }
        }
        
        tableHtml += `
            <tr class="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <td class="py-4 px-4">
                    <div class="flex items-center gap-3">
                        <div class="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
                            <img src="${inventory.imgUrl || '../../svg/box.png'}" alt="${escapeHtml(inventory.name)}" 
                                class="w-full h-full object-cover" 
                                onerror="this.src='../../svg/box.png'">
                        </div>
                        <span class="font-semibold text-gray-800 dark:text-gray-200">${escapeHtml(inventory.name || 'Sin nombre')}</span>
                    </div>
                </td>
                <td class="py-4 px-4">
                    <span class="text-gray-700 dark:text-gray-300">${escapeHtml(inventory.location || 'Sin ubicación')}</span>
                </td>
                <td class="py-4 px-4">
                    <div class="flex flex-wrap gap-1.5">
                        ${roleBadges}
                    </div>
                </td>
                <td class="py-4 px-4">
                    <span class="status-badge ${statusClass} text-xs">
                        <i class="fas ${statusIcon}"></i>
                        ${statusText}
                    </span>
                </td>
                <td class="py-4 px-4">
                    <div class="flex items-center justify-center gap-2">
                        ${quitButtonHtml}
                        ${isOwner ? `
                            <button onclick="viewInventory('${uuid}')" 
                                class="flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-semibold shadow transition-all duration-200"
                                title="Ver Items">
                                <i class="fas fa-box"></i>
                            </button>
                            <button onclick="openAssignRoleModal('${inventory.id}')" 
                                class="flex items-center justify-center gap-1.5 px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-semibold shadow transition-all duration-200"
                                title="Añadir Firmantes y Manejadores">
                                <i class="fas fa-user-plus"></i>
                            </button>
                            <button onclick="openRemoveRoleModal('${inventory.id}')" 
                                class="flex items-center justify-center gap-1.5 px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-semibold shadow transition-all duration-200"
                                title="Quitar Firmantes y Manejadores">
                                <i class="fas fa-user-minus"></i>
                            </button>
                            <button onclick="openInventoryTree('${inventory.id}', '${escapeHtml(inventory.name || '')}', '${inventory.imgUrl || ''}')" 
                                class="flex items-center justify-center gap-1.5 px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-semibold shadow transition-all duration-200"
                                title="Ver Árbol de Jerarquía">
                                <i class="fas fa-sitemap"></i>
                            </button>
                        ` : isSignatory ? `
                            <button onclick="viewInventoryItems('${uuid}')" 
                                class="flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-semibold shadow transition-all duration-200"
                                title="Ver Items">
                                <i class="fas fa-box"></i>
                            </button>
                            <button onclick="openAssignRoleModal('${inventory.id}')" 
                                class="flex items-center justify-center gap-1.5 px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-semibold shadow transition-all duration-200"
                                title="Añadir Firmantes y Manejadores">
                                <i class="fas fa-user-plus"></i>
                            </button>
                            <button onclick="openRemoveRoleModal('${inventory.id}')" 
                                class="flex items-center justify-center gap-1.5 px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-semibold shadow transition-all duration-200"
                                title="Quitar Firmantes y Manejadores">
                                <i class="fas fa-user-minus"></i>
                            </button>
                            <button onclick="openInventoryTree('${inventory.id}', '${escapeHtml(inventory.name || '')}', '${inventory.imgUrl || ''}')" 
                                class="flex items-center justify-center gap-1.5 px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-semibold shadow transition-all duration-200"
                                title="Ver Árbol de Jerarquía">
                                <i class="fas fa-sitemap"></i>
                            </button>
                        ` : isManager ? `
                            <button onclick="viewInventoryItems('${uuid}')" 
                                class="flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-semibold shadow transition-all duration-200"
                                title="Ver Items">
                                <i class="fas fa-box"></i>
                            </button>
                            <button onclick="openInventoryTree('${inventory.id}', '${escapeHtml(inventory.name || '')}', '${inventory.imgUrl || ''}')" 
                                class="flex items-center justify-center gap-1.5 px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-semibold shadow transition-all duration-200"
                                title="Ver Árbol de Jerarquía">
                                <i class="fas fa-sitemap"></i>
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `;
    });
    
    tableHtml += `
            </tbody>
        </table>
    `;
    
    container.innerHTML = tableHtml;
    updateSortButtons();
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

// Make functions globally available
window.loadMyInventories = loadMyInventories;
window.filterInventories = filterInventories;
// Open assign role modal
function openAssignRoleModal(inventoryId) {
    if (typeof window.showAssignManagerModal === 'function') {
        window.showAssignManagerModal(inventoryId);
    } else if (typeof showAssignManagerModal === 'function') {
        showAssignManagerModal(inventoryId);
    } else {
        console.error('showAssignManagerModal function not found');
    }
}

// Open remove role modal
function openRemoveRoleModal(inventoryId) {
    if (typeof window.showRemoveRoleModal === 'function') {
        window.showRemoveRoleModal(inventoryId);
    } else if (typeof showRemoveRoleModal === 'function') {
        showRemoveRoleModal(inventoryId);
    } else {
        console.error('showRemoveRoleModal function not found');
    }
}

// Open inventory tree modal
function openInventoryTree(inventoryId, inventoryName, inventoryImgUrl) {
    if (typeof window.showInventoryTreeModal === 'function') {
        window.showInventoryTreeModal(inventoryId, inventoryName, inventoryImgUrl);
    } else if (typeof showInventoryTreeModal === 'function') {
        showInventoryTreeModal(inventoryId, inventoryName, inventoryImgUrl);
    } else {
        console.error('showInventoryTreeModal function not found');
    }
}

// Make functions globally available
window.loadMyInventories = loadMyInventories;
window.filterInventories = filterInventories;
window.viewInventory = viewInventory;
window.quitRole = quitRole;
window.changePage = changePage;
window.setSort = setSort;
window.setViewMode = setViewMode;
window.openAssignRoleModal = openAssignRoleModal;
window.openRemoveRoleModal = openRemoveRoleModal;
window.openInventoryTree = openInventoryTree;

