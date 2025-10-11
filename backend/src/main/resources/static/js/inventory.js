// Inventory management data
let inventoryData = {
    inventories: [],
    filteredInventories: [],
    currentPage: 1,
    itemsPerPage: 6,
    searchTerm: '',
    selectedStatus: 'all',
    isLoading: false
};

// Initialize inventory page when DOM loads
document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on the inventory page by multiple methods
    const isInventoryPage =
        window.location.pathname.includes('/inventory') ||
        window.location.pathname.includes('inventory.html') ||
        document.querySelector('#inventoryStatsContainer') !== null ||
        document.querySelector('#inventoryCardsContainer') !== null ||
        document.querySelector('#newInventoryModal') !== null;

    if (isInventoryPage) {
        // Small delay to ensure all elements are rendered
        setTimeout(() => {
            initializeInventoryPage();
        }, 100);
    }
});

// Initialize inventory page
function initializeInventoryPage() {
    loadInventoryData();
    setupEventListeners();
}

// Setup event listeners
function setupEventListeners() {
    // Search input
    const searchInput = document.getElementById('inventorySearch');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            inventoryData.searchTerm = e.target.value;
            inventoryData.currentPage = 1;
            filterInventories();
        });
    }

    // New inventory form
    const newInventoryForm = document.getElementById('newInventoryForm');
    if (newInventoryForm) {
        newInventoryForm.addEventListener('submit', handleNewInventorySubmit);
    }
}

// Load all inventory data
async function loadInventoryData() {
    if (inventoryData.isLoading) return;

    inventoryData.isLoading = true;
    showLoadingState();

    try {
        // Load current user info
        await loadCurrentUserInfo();

        // Load all inventories
        await loadInventories();

        // Update UI
        updateInventoryUI();

    } catch (error) {
        console.error('Error loading inventory data:', error);
        showErrorState('Error al cargar los datos de inventarios: ' + error.message);
        // Still update UI even if there's an error to show empty state
        updateInventoryUI();
    } finally {
        inventoryData.isLoading = false;
        hideLoadingState();
    }
}

// Load current user information
async function loadCurrentUserInfo() {
    try {
        const token = localStorage.getItem('jwt');
        if (!token) {
            throw new Error('No authentication token found');
        }

        const response = await fetch('/api/v1/users/me', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const userData = await response.json();
            updateUserInfoDisplay(userData);
        } else {
            throw new Error('Failed to load user info');
        }
    } catch (error) {
        console.error('Error loading current user info:', error);
        // Set default values consistent with admin dashboard
        updateUserInfoDisplay({
            fullName: 'Super Admin',
            role: 'ADMIN',
            email: 'admin@sena.edu.co'
        });
    }
}

// Update user info display in header only
function updateUserInfoDisplay(userData) {
    const headerUserName = document.getElementById('headerUserName');
    const headerUserRole = document.getElementById('headerUserRole');
    const headerUserAvatar = document.getElementById('headerUserAvatar');

    if (headerUserName) headerUserName.textContent = userData.fullName || 'Super Admin';
    if (headerUserRole) headerUserRole.textContent = userData.role || 'ADMIN';
    if (headerUserAvatar) headerUserAvatar.textContent = (userData.fullName || 'Super Admin').charAt(0).toUpperCase();
}

// Load inventories list
async function loadInventories() {
    try {
        const token = localStorage.getItem('jwt');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch('/api/v1/inventory', {
            method: 'GET',
            headers: headers
        });

        if (response.ok) {
            inventoryData.inventories = await response.json();
            inventoryData.filteredInventories = [...inventoryData.inventories];
        } else {
            throw new Error('Failed to load inventories');
        }
    } catch (error) {
        console.error('Error loading inventories:', error);
        // Set empty array if API fails
        inventoryData.inventories = [];
        inventoryData.filteredInventories = [];
    }
}

// Filter inventories based on search term and location
function filterInventories() {
    let filtered = [...inventoryData.inventories];

    // Filter by search term
    if (inventoryData.searchTerm) {
        const searchLower = inventoryData.searchTerm.toLowerCase();
        filtered = filtered.filter(inventory =>
            (inventory.name && inventory.name.toLowerCase().includes(searchLower)) ||
            (inventory.location && inventory.location.toLowerCase().includes(searchLower)) ||
            (inventory.uuid && inventory.uuid.toString().toLowerCase().includes(searchLower))
        );
    }

    // Filter by location (for now, we'll use 'all' as the only option since we don't have status field)
    if (inventoryData.selectedStatus !== 'all') {
        // For future use when status field is added
        filtered = filtered.filter(inventory => inventory.location === inventoryData.selectedStatus);
    }

    inventoryData.filteredInventories = filtered;
    inventoryData.currentPage = 1;
    updateInventoryUI();
}

// Update inventory UI
function updateInventoryUI() {
    updateInventoryStats();
    updateSearchAndFilters();
    updateInventoryCards();
    updatePagination();
}

// Update inventory statistics cards
function updateInventoryStats() {
    const container = document.getElementById('inventoryStatsContainer');
    if (!container) return;

    // Calculate stats from inventories data
    const totalInventories = inventoryData.inventories.length;
    const uniqueLocations = getUniqueLocationsCount();

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
                    <h3 class="text-3xl font-bold text-gray-800">${getInventoriesWithUUIDCount()}</h3>
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
                    <p class="text-gray-600 text-sm font-medium mb-1">Estado API</p>
                    <h3 class="text-3xl font-bold text-gray-800">Activo</h3>
                </div>
                <div class="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                    <i class="fas fa-plug text-orange-600 text-xl"></i>
                </div>
            </div>
            <p class="text-orange-600 text-sm font-medium">API respondiendo</p>
        </div>

        <div class="stat-card">
            <div class="flex items-start justify-between mb-3">
                <div>
                    <p class="text-gray-600 text-sm font-medium mb-1">Sistema</p>
                    <h3 class="text-3xl font-bold text-gray-800">Online</h3>
                </div>
                <div class="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
                    <i class="fas fa-check-circle text-teal-600 text-xl"></i>
                </div>
            </div>
            <p class="text-teal-600 text-sm font-medium">Sistema operativo</p>
        </div>
    `;
}

// Update search and filters section
function updateSearchAndFilters() {
    const container = document.getElementById('searchFilterContainer');
    if (!container) return;

    container.innerHTML = `
        <div class="relative flex-1">
            <i class="fas fa-search absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
            <input type="text" id="inventorySearch" value="${inventoryData.searchTerm}" placeholder="Buscar inventarios por nombre, ubicación o propietario..." class="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-all">
        </div>
        <div class="flex gap-2">
            <button onclick="setStatusFilter('all')" class="px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors ${inventoryData.selectedStatus === 'all' ? 'bg-green-600 text-white border-green-600' : ''}">
                Todas las ubicaciones
            </button>
        </div>
    `;

    // Re-add event listener to search input
    const searchInput = document.getElementById('inventorySearch');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            inventoryData.searchTerm = e.target.value;
            inventoryData.currentPage = 1;
            filterInventories();
        });
    }
}

// Update inventory cards
function updateInventoryCards() {
    const container = document.getElementById('inventoryCardsContainer');
    if (!container) return;

    const startIndex = (inventoryData.currentPage - 1) * inventoryData.itemsPerPage;
    const endIndex = startIndex + inventoryData.itemsPerPage;
    const paginatedInventories = inventoryData.filteredInventories.slice(startIndex, endIndex);

    let cardsHtml = ` `;

    if (paginatedInventories.length === 0) {
        cardsHtml += `
            <div class="col-span-full text-center py-8">
                <i class="fas fa-box-open text-gray-300 text-4xl mb-4"></i>
                <p class="text-gray-500">No se encontraron inventarios</p>
            </div>
        `;
    } else {
        paginatedInventories.forEach(inventory => {
            cardsHtml += `
                <div class="stat-card">
                    <div class="flex items-start justify-between mb-3">
                        <div>
                            <h3 class="font-bold text-lg text-gray-800 mb-1">${inventory.name || 'Sin nombre'}</h3>
                            <p class="text-gray-600 text-sm">${inventory.location || 'Sin ubicación'}</p>
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
                            <p class="font-bold text-sm text-gray-800">${inventory.uuid ? inventory.uuid.toString().substring(0, 8) + '...' : 'No asignado'}</p>
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

// Update pagination
function updatePagination() {
    const container = document.getElementById('paginationContainer');
    if (!container) return;

    const totalPages = Math.ceil(inventoryData.filteredInventories.length / inventoryData.itemsPerPage);
    const startItem = (inventoryData.currentPage - 1) * inventoryData.itemsPerPage + 1;
    const endItem = Math.min(inventoryData.currentPage * inventoryData.itemsPerPage, inventoryData.filteredInventories.length);

    let paginationHtml = `
        <div class="text-sm text-gray-600">
            Mostrando ${startItem}-${endItem} de ${inventoryData.filteredInventories.length} inventarios
        </div>
        <div class="flex items-center gap-2">
    `;

    // Previous button
    paginationHtml += `
        <button onclick="changePage(${inventoryData.currentPage - 1})" ${inventoryData.currentPage === 1 ? 'disabled' : ''} class="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
            <i class="fas fa-chevron-left"></i>
        </button>
    `;

    // Page numbers
    const maxVisiblePages = 5;
    let startPage = Math.max(1, inventoryData.currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
        paginationHtml += `
            <button onclick="changePage(${i})" class="px-3 py-2 border ${inventoryData.currentPage === i ? 'bg-green-600 text-white border-green-600' : 'border-gray-300 text-gray-700'} rounded-lg hover:bg-gray-50 transition-colors">
                ${i}
            </button>
        `;
    }

    // Next button
    paginationHtml += `
        <button onclick="changePage(${inventoryData.currentPage + 1})" ${inventoryData.currentPage === totalPages ? 'disabled' : ''} class="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
            <i class="fas fa-chevron-right"></i>
        </button>
    `;

    paginationHtml += `</div>`;
    container.innerHTML = paginationHtml;
}

// Helper functions
function getUniqueLocationsCount() {
    const locations = new Set();
    inventoryData.inventories.forEach(inventory => {
        if (inventory.location) {
            locations.add(inventory.location);
        }
    });
    return locations.size;
}

function getInventoriesWithUUIDCount() {
    return inventoryData.inventories.filter(inventory => inventory.uuid).length;
}

function setStatusFilter(status) {
    inventoryData.selectedStatus = status;
    inventoryData.currentPage = 1;
    filterInventories();
}

function changePage(page) {
    if (page >= 1 && page <= Math.ceil(inventoryData.filteredInventories.length / inventoryData.itemsPerPage)) {
        inventoryData.currentPage = page;
        updateInventoryCards();
        updatePagination();
    }
}

// Modal functions
function showNewInventoryModal() {
    const modal = document.getElementById('newInventoryModal');
    if (modal) {
        modal.classList.remove('hidden');
    }
}

function closeNewInventoryModal() {
    const modal = document.getElementById('newInventoryModal');
    if (modal) {
        modal.classList.add('hidden');
    }

    // Reset form
    const form = document.getElementById('newInventoryForm');
    if (form) {
        form.reset();
    }
}

// Handle new inventory form submission
async function handleNewInventorySubmit(e) {
    e.preventDefault();

    const name = document.getElementById('newInventoryName').value;
    const location = document.getElementById('newInventoryLocation').value;

    if (!name || !location) {
        alert('Por favor complete todos los campos obligatorios (nombre y ubicación)');
        return;
    }

    try {
        const token = localStorage.getItem('jwt');
        const headers = {
            'Content-Type': 'application/json'
        };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch('/api/v1/inventory', {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                name: name,
                location: location
            })
        });

        if (response.ok) {
            alert('Inventario creado exitosamente');
            closeNewInventoryModal();
            loadInventoryData(); // Reload inventories list
        } else {
            const errorData = await response.json();
            alert('Error al crear inventario: ' + (errorData.message || 'Error desconocido'));
        }
    } catch (error) {
        console.error('Error creating inventory:', error);
        alert('Error al crear inventario. Inténtalo de nuevo.');
    }
}

// Inventory action functions
function viewInventory(inventoryId) {
    const inventory = inventoryData.inventories.find(i => i.id === inventoryId);
    if (inventory) {
        alert(`Ver inventario: ${inventory.name}\nUbicación: ${inventory.location}\nID: ${inventory.id}\nUUID: ${inventory.uuid || 'No asignado'}`);
    }
}

function editInventory(inventoryId) {
    const inventory = inventoryData.inventories.find(i => i.id === inventoryId);
    if (inventory) {
        alert(`Editar inventario: ${inventory.name}\n\nFuncionalidad de edición próximamente disponible.`);
    }
}

function deleteInventory(inventoryId) {
    const inventory = inventoryData.inventories.find(i => i.id === inventoryId);
    if (inventory && confirm(`¿Está seguro de que desea eliminar el inventario ${inventory.name}?`)) {
        // Here you would implement the delete API call
        alert(`Eliminar inventario: ${inventory.name}\n\nFuncionalidad de eliminación próximamente disponible.`);
    }
}

// Show loading state
function showLoadingState() {
    const refreshIcon = document.getElementById('refreshIcon');
    const refreshText = document.getElementById('refreshText');

    if (refreshIcon) refreshIcon.classList.add('animate-spin');
    if (refreshText) refreshText.textContent = 'Cargando...';
}

// Hide loading state
function hideLoadingState() {
    const refreshIcon = document.getElementById('refreshIcon');
    const refreshText = document.getElementById('refreshText');

    if (refreshIcon) refreshIcon.classList.remove('animate-spin');
    if (refreshText) refreshText.textContent = 'Actualizar';
}

// Show error state
function showErrorState(message) {
    console.error(message);
    alert(message);
}