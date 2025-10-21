function updateInventoryUI() {
    updateInventoryStats();
    updateSearchAndFilters();
    updateInventoryCards();
    updatePagination();
}

function updateInventoryStats() {
    const container = document.getElementById('inventoryStatsContainer');
    if (!container) return;

    if (!window.inventoryData || !window.inventoryData.inventories) {
        return;
    }

    const totalInventories = window.inventoryData.inventories.length;
    const uniqueLocations = getUniqueLocationsCount();
    const inventoriesWithUUID = getInventoriesWithUUIDCount();
    const activeInventories = window.inventoryData.inventories.filter(i => i && i.status !== false).length;

    container.innerHTML = `
        <div class="stat-card">
            <div class="flex items-start justify-between mb-3">
                <div>
                    <p class="text-gray-600 text-sm font-medium mb-1">Total Inventarios</p>
                    <h3 class="text-3xl font-bold text-gray-800">${totalInventories}</h3>
                </div>
                <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <i class="fas fa-boxes text-blue-600 text-xl"></i>
                </div>
            </div>
            <p class="text-blue-600 text-sm font-medium">Inventarios registrados</p>
        </div>

        <div class="stat-card">
            <div class="flex items-start justify-between mb-3">
                <div>
                    <p class="text-gray-600 text-sm font-medium mb-1">Ubicaciones</p>
                    <h3 class="text-3xl font-bold text-gray-800">${uniqueLocations}</h3>
                </div>
                <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <i class="fas fa-map-marker-alt text-green-600 text-xl"></i>
                </div>
            </div>
            <p class="text-green-600 text-sm font-medium">Ubicaciones diferentes</p>
        </div>

        <div class="stat-card">
            <div class="flex items-start justify-between mb-3">
                <div>
                    <p class="text-gray-600 text-sm font-medium mb-1">Con UUID</p>
                    <h3 class="text-3xl font-bold text-gray-800">${inventoriesWithUUID}</h3>
                </div>
                <div class="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <i class="fas fa-hashtag text-purple-600 text-xl"></i>
                </div>
            </div>
            <p class="text-purple-600 text-sm font-medium">Inventarios con identificador</p>
        </div>

        <div class="stat-card">
            <div class="flex items-start justify-between mb-3">
                <div>
                    <p class="text-gray-600 text-sm font-medium mb-1">Activos</p>
                    <h3 class="text-3xl font-bold text-gray-800">${activeInventories}</h3>
                </div>
                <div class="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                    <i class="fas fa-check-circle text-emerald-600 text-xl"></i>
                </div>
            </div>
            <p class="text-emerald-600 text-sm font-medium">Inventarios activos</p>
        </div>

        <div class="stat-card">
            <div class="flex items-start justify-between mb-3">
                <div>
                    <p class="text-gray-600 text-sm font-medium mb-1">Estado API</p>
                    <h3 class="text-3xl font-bold text-gray-800">Activo</h3>
                </div>
                <div class="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                    <i class="fas fa-plug text-orange-600 text-xl"></i>
                </div>
            </div>
            <p class="text-orange-600 text-sm font-medium">API respondiendo</p>
        </div>
    `;
}

// Helper functions for stats
function getUniqueLocationsCount() {
    if (!inventoryData.inventories || !Array.isArray(inventoryData.inventories)) {
        return 0;
    }

    const locations = new Set();
    inventoryData.inventories.forEach(inventory => {
        if (inventory.location) {
            locations.add(inventory.location);
        }
    });
    return locations.size;
}

function getInventoriesWithUUIDCount() {
    if (!inventoryData.inventories || !Array.isArray(inventoryData.inventories)) {
        return 0;
    }

    return inventoryData.inventories.filter(inventory => inventory.uuid).length;
}

function updateSearchAndFilters() {
    const container = document.getElementById('searchFilterContainer');
    if (!container) return;

    const existingInput = document.getElementById('inventorySearch');
    const currentSearchTerm = window.inventoryData ? window.inventoryData.searchTerm : '';

    if (existingInput && existingInput.value === currentSearchTerm) {
        return;
    }

    container.innerHTML = `
        <div class="relative flex-1">
            <i class="fas fa-search absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
            <input type="text" id="inventorySearch" value="${currentSearchTerm}" placeholder="Buscar inventarios por nombre, ubicación o UUID..." class="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-all">
        </div>
        <div class="flex gap-2 flex-wrap">
            <div class="relative">
                <select onchange="setLocationFilter(this.value)" class="appearance-none w-full px-4 py-3 pr-10 border-2 border-gray-200 text-gray-700 rounded-xl hover:border-green-400 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20 bg-white transition-all duration-200 shadow-sm hover:shadow-md">
                    <option value="all">Todas las ubicaciones</option>
                    ${getLocationFilterOptions()}
                </select>
                <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <i class="fas fa-chevron-down text-green-500 text-sm"></i>
                </div>
            </div>
            <div class="relative">
                <select onchange="setStatusFilter(this.value)" class="appearance-none w-full px-4 py-3 pr-10 border-2 border-gray-200 text-gray-700 rounded-xl hover:border-green-400 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20 bg-white transition-all duration-200 shadow-sm hover:shadow-md">
                    <option value="all">Todos los estados</option>
                    <option value="active">Activos</option>
                    <option value="inactive">Inactivos</option>
                </select>
                <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <i class="fas fa-chevron-down text-green-500 text-sm"></i>
                </div>
            </div>
        </div>
    `;

    const searchInput = document.getElementById('inventorySearch');
    if (searchInput && !searchInput._searchListeners) {
        setupInventorySearchInputListeners(searchInput);
    }
}

function setupInventorySearchInputListeners(searchInput) {
    if (!window.inventoryData) {
        return;
    }

    if (searchInput.value !== window.inventoryData.searchTerm) {
        searchInput.value = window.inventoryData.searchTerm || '';
    }

    if (!searchInput._searchListeners) {
        searchInput.addEventListener('input', function(e) {
            handleInventorySearchInput(e);
        });

        searchInput.addEventListener('keyup', function(e) {
            handleInventorySearchKeyup(e);
        });

        searchInput.addEventListener('keypress', function(e) {
            handleInventorySearchKeypress(e);
        });

        searchInput._searchListeners = true;
    }
}

function handleInventorySearchInput(e) {
    try {
        const searchValue = e.target.value.trim();

        // Update the data model immediately
        if (window.inventoryData) {
            window.inventoryData.searchTerm = searchValue;
            window.inventoryData.currentPage = 1;
        }

        // Apply filter immediately for real-time search
        try {
            if (typeof window.filterInventories === 'function' && window.inventoryData) {
                window.filterInventories();
            }
        } catch (filterError) {
            console.error('Error in filterInventories:', filterError);
        }
    } catch (error) {
        console.error('Error in handleInventorySearchInput:', error);
    }
}

function handleInventorySearchKeyup(e) {
    if (e.key === 'Escape') {
        e.target.value = '';
        if (window.inventoryData) {
            window.inventoryData.searchTerm = '';
            window.inventoryData.currentPage = 1;
        }

        if (typeof window.filterInventories === 'function' && window.inventoryData) {
            window.filterInventories();
        }
    }
}

function handleInventorySearchKeypress(e) {
    if (e.key === 'Enter') {
        e.preventDefault();

        // Apply current search term
        if (typeof window.filterInventories === 'function' && window.inventoryData) {
            window.filterInventories();
        }
    }
}

function updateInventoryCards() {
    const container = document.getElementById('inventoryCardsContainer');
    if (!container) return;

    if (!window.inventoryData) {
        return;
    }

    const startIndex = (window.inventoryData.currentPage - 1) * window.inventoryData.itemsPerPage;
    const endIndex = startIndex + window.inventoryData.itemsPerPage;
    const paginatedInventories = window.inventoryData.filteredInventories.slice(startIndex, endIndex);

    let cardsHtml = `
        <div class="flex items-center gap-2 mb-4">
            <i class="fas fa-boxes text-green-600 text-xl"></i>
            <h2 class="text-xl font-bold text-gray-800">Inventarios del Sistema</h2>
            <span class="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">${window.inventoryData ? window.inventoryData.filteredInventories.length : 0} inventarios</span>
        </div>
    `;

    if (paginatedInventories.length === 0) {
        cardsHtml += `
            <div class="col-span-full text-center py-8">
                <i class="fas fa-box-open text-gray-300 text-4xl mb-4"></i>
                <p class="text-gray-500">No se encontraron inventarios</p>
                <p class="text-sm text-gray-400 mt-2">Intenta ajustar los filtros de búsqueda</p>
            </div>
        `;
    } else {
        paginatedInventories.forEach(inventory => {
            const locationText = getLocationText(inventory.location);
            const uuidDisplay = inventory.uuid ? inventory.uuid.toString().substring(0, 8) + '...' : 'No asignado';

            cardsHtml += `
                <div class="stat-card">
                    <div class="flex items-start justify-between mb-3">
                        <div>
                            <h3 class="font-bold text-lg text-gray-800 mb-1">${inventory.name || 'Sin nombre'}</h3>
                            <p class="text-gray-600 text-sm">${locationText}</p>
                        </div>
                        <span class="badge bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-semibold">Activo</span>
                    </div>

                    <div class="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <p class="text-gray-600 text-sm mb-1">ID</p>
                            <p class="font-bold text-xl text-gray-800">${inventory.id || 'N/A'}</p>
                        </div>
                        <div class="text-right">
                            <p class="text-gray-600 text-sm mb-1">UUID</p>
                            <p class="font-bold text-sm text-gray-800" title="${inventory.uuid || 'No asignado'}">${uuidDisplay}</p>
                        </div>
                    </div>

                    <div class="flex items-center justify-between pt-3 border-t border-gray-100">
                        <small class="text-gray-500">Inventario registrado</small>
                        <div class="flex gap-2">
                            <button onclick="viewInventory('${inventory.id}')" class="text-blue-600 hover:text-blue-800 transition-colors" title="Ver detalles">
                                <i class="fas fa-eye text-lg"></i>
                            </button>
                            <button onclick="editInventory('${inventory.id}')" class="text-yellow-600 hover:text-yellow-800 transition-colors" title="Editar inventario">
                                <i class="fas fa-edit text-lg"></i>
                            </button>
                            <button onclick="showInventoryAssignment('${inventory.id}')" class="text-indigo-600 hover:text-indigo-800 transition-colors" title="Asignar usuario">
                                <i class="fas fa-user-plus text-lg"></i>
                            </button>
                            <button onclick="showInventoryManagerAssignment('${inventory.id}')" class="text-purple-600 hover:text-purple-800 transition-colors" title="Asignar gerente">
                                <i class="fas fa-user-tie text-lg"></i>
                            </button>
                            <button onclick="deleteInventory('${inventory.id}')" class="text-red-600 hover:text-red-800 transition-colors" title="Eliminar inventario">
                                <i class="fas fa-trash text-lg"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });
    }

    container.innerHTML = cardsHtml;
}

function updateUserInfoDisplay(userData) {
    const headerUserName = document.getElementById('headerUserName');
    const headerUserRole = document.getElementById('headerUserRole');
    const headerUserAvatar = document.getElementById('headerUserAvatar');

    if (headerUserName) headerUserName.textContent = userData.fullName || 'Super Admin';
    if (headerUserRole) headerUserRole.textContent = userData.role || 'ADMIN';

    if (headerUserAvatar) {
        if (userData.imgUrl) {
            headerUserAvatar.innerHTML = `<img src="${userData.imgUrl}" alt="${userData.fullName || 'Usuario'}" class="w-full h-full object-cover rounded-full">`;
        } else {
            headerUserAvatar.textContent = (userData.fullName || 'Super Admin').charAt(0).toUpperCase();
        }
    }
}

// Initialize search inputs when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    function checkDependenciesAndInitialize() {
        if (typeof window.filterInventories === 'function' && window.inventoryData && document.readyState === 'complete') {
            if (!window._inventorySearchInputsInitialized) {
                const searchInput = document.getElementById('inventorySearch');
                if (searchInput) {
                    setupInventorySearchInputListeners(searchInput);
                }
                window._inventorySearchInputsInitialized = true;
            }
        } else {
            setTimeout(checkDependenciesAndInitialize, 50);
        }
    }

    setTimeout(checkDependenciesAndInitialize, 100);
});

window.updateInventoryUI = updateInventoryUI;
window.updateInventoryStats = updateInventoryStats;
window.updateSearchAndFilters = updateSearchAndFilters;
window.updateInventoryCards = updateInventoryCards;
window.updateUserInfoDisplay = updateUserInfoDisplay;
window.setupInventorySearchInputListeners = setupInventorySearchInputListeners;
window.handleInventorySearchInput = handleInventorySearchInput;
window.handleInventorySearchKeyup = handleInventorySearchKeyup;
window.handleInventorySearchKeypress = handleInventorySearchKeypress;