function updateUsersUI() {
    updateUserStats();
    updateSearchAndFilters();
    updateUsersTable();
    updatePagination();

}

function updateUserStats() {
    const container = document.getElementById('userStatsContainer');
    if (!container) return;

    if (!window.usersData || !window.usersData.users) {
        return;
    }
    const totalUsers = window.usersData.users.length;
    const adminCount = window.usersData.users.filter(u => u && u.role === 'ADMIN').length;
    const warehouseCount = window.usersData.users.filter(u => u && u.role === 'WAREHOUSE').length;
    const userCount = window.usersData.users.filter(u => u && u.role === 'USER').length;
    const activeCount = window.usersData.users.filter(u => u && u.status === true).length;
    const inactiveCount = window.usersData.users.filter(u => u && u.status === false).length;

    container.innerHTML = `
        <div class="stat-card">
            <div class="flex items-start justify-between mb-3">
                <div>
                    <p class="text-gray-600 text-sm font-medium mb-1">Super Admin</p>
                    <h3 class="text-3xl font-bold text-gray-800">${adminCount}</h3>
                </div>
                <div class="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                    <i class="fas fa-user-shield text-red-600 text-xl"></i>
                </div>
            </div>
            <p class="text-red-600 text-sm font-medium">Administradores del sistema</p>
        </div>

        <div class="stat-card">
            <div class="flex items-start justify-between mb-3">
                <div>
                    <p class="text-gray-600 text-sm font-medium mb-1">Almacén</p>
                    <h3 class="text-3xl font-bold text-gray-800">${warehouseCount}</h3>
                </div>
                <div class="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                    <i class="fas fa-warehouse text-yellow-600 text-xl"></i>
                </div>
            </div>
            <p class="text-yellow-600 text-sm font-medium">Administradores de almacén</p>
        </div>

        <div class="stat-card">
            <div class="flex items-start justify-between mb-3">
                <div>
                    <p class="text-gray-600 text-sm font-medium mb-1">Usuarios</p>
                    <h3 class="text-3xl font-bold text-gray-800">${userCount}</h3>
                </div>
                <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <i class="fas fa-users text-green-600 text-xl"></i>
                </div>
            </div>
            <p class="text-green-600 text-sm font-medium">Usuarios del sistema</p>
        </div>

        <div class="stat-card">
            <div class="flex items-start justify-between mb-3">
                <div>
                    <p class="text-gray-600 text-sm font-medium mb-1">Activos</p>
                    <h3 class="text-3xl font-bold text-gray-800">${activeCount}</h3>
                </div>
                <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <i class="fas fa-user-check text-blue-600 text-xl"></i>
                </div>
            </div>
            <p class="text-blue-600 text-sm font-medium">Usuarios activos</p>
        </div>

        <div class="stat-card">
            <div class="flex items-start justify-between mb-3">
                <div>
                    <p class="text-gray-600 text-sm font-medium mb-1">Inactivos</p>
                    <h3 class="text-3xl font-bold text-gray-800">${inactiveCount}</h3>
                </div>
                <div class="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                    <i class="fas fa-user-times text-gray-600 text-xl"></i>
                </div>
            </div>
            <p class="text-gray-600 text-sm font-medium">Usuarios inactivos</p>
        </div>
    `;
}

function updateSearchAndFilters() {
    const container = document.getElementById('searchFilterContainer');
    if (!container) return;

    const existingInput = document.getElementById('filterUserSearch');
    const currentSearchTerm = window.usersData ? window.usersData.searchTerm : '';

    if (existingInput && existingInput.value === currentSearchTerm) {
        return;
    }

    container.innerHTML = `
        <div class="relative flex-1">
            <i class="fas fa-search absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
            <input type="text" id="filterUserSearch" value="${currentSearchTerm}" placeholder="Buscar por nombre, email o rol..." class="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-all">
        </div>
        <div class="flex gap-2 flex-wrap">
            <button onclick="handleSearchButton()" class="px-4 py-3 border border-green-600 text-white rounded-xl hover:bg-green-700 transition-colors bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500" title="Buscar">
                <i class="fas fa-search"></i> Buscar
            </button>
            <div class="relative">
                <select onchange="setRoleFilter(this.value)" class="appearance-none w-full px-4 py-3 pr-10 border-2 border-gray-200 text-gray-700 rounded-xl hover:border-green-400 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20 bg-white transition-all duration-200 shadow-sm hover:shadow-md">
                    <option value="all" ${window.usersData && window.usersData.selectedRole === 'all' ? 'selected' : ''}>Todos los roles</option>
                    <option value="ADMIN" ${window.usersData && window.usersData.selectedRole === 'ADMIN' ? 'selected' : ''}>Super Admin</option>
                    <option value="WAREHOUSE" ${window.usersData && window.usersData.selectedRole === 'WAREHOUSE' ? 'selected' : ''}>Almacén</option>
                    <option value="USER" ${window.usersData && window.usersData.selectedRole === 'USER' ? 'selected' : ''}>Usuario</option>
                </select>
                <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <i class="fas fa-chevron-down text-green-500 text-sm"></i>
                </div>
            </div>
            <div class="relative">
                <select onchange="setStatusFilter(this.value)" class="appearance-none w-full px-4 py-3 pr-10 border-2 border-gray-200 text-gray-700 rounded-xl hover:border-green-400 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20 bg-white transition-all duration-200 shadow-sm hover:shadow-md">
                    <option value="all" ${window.usersData && window.usersData.selectedStatus === 'all' ? 'selected' : ''}>Todos los estados</option>
                    <option value="active" ${window.usersData && window.usersData.selectedStatus === 'active' ? 'selected' : ''}>Activos</option>
                    <option value="inactive" ${window.usersData && window.usersData.selectedStatus === 'inactive' ? 'selected' : ''}>Inactivos</option>
                </select>
                <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <i class="fas fa-chevron-down text-green-500 text-sm"></i>
                </div>
            </div>
        </div>
    `;

    const filterSearchInput = document.getElementById('filterUserSearch');
    if (filterSearchInput && !filterSearchInput._filterSearchListeners) {
        setupSearchInputListeners(filterSearchInput, 'filter');
    }
}

function setupSearchInputs() {
    if (typeof window.filterUsers !== 'function') {
        return;
    }

    if (!window.usersData) {
        return;
    }

    if (window._searchInputsInitialized) {
        return;
    }

    const headerSearchInput = document.getElementById('userSearch');
    if (headerSearchInput) {
        setupSearchInputListeners(headerSearchInput, 'header');
    }

    const filterSearchInput = document.getElementById('filterUserSearch');
    if (filterSearchInput) {
        setupSearchInputListeners(filterSearchInput, 'filter');
    }

    window._searchInputsInitialized = true;
}

function setupSearchInputListeners(searchInput, inputType) {
    if (!window.usersData) {
        return;
    }

    if (searchInput.value !== window.usersData.searchTerm) {
        searchInput.value = window.usersData.searchTerm || '';
    }

    const listenerKey = `_${inputType}SearchListeners`;

    if (!searchInput[listenerKey]) {
        searchInput.addEventListener('input', function(e) {
            handleSearchInput(e, inputType);
        });

        searchInput.addEventListener('keyup', function(e) {
            handleSearchKeyup(e, inputType);
        });

        searchInput.addEventListener('keypress', function(e) {
            handleSearchKeypress(e, inputType);
        });

        searchInput[listenerKey] = true;
    }
}

function handleSearchInput(e, inputType) {
    try {
        const searchValue = e.target.value.trim();

        // Update the data model immediately
        if (window.usersData) {
            window.usersData.searchTerm = searchValue;
            window.usersData.currentPage = 1;
        }

        // Sync the other search input
        syncSearchInputs(e.target.id, searchValue);

        // Apply filter immediately for real-time search
        try {
            if (typeof window.filterUsers === 'function' && window.usersData) {
                window.filterUsers();
            }
        } catch (filterError) {
        }
    } catch (error) {
    }
}

function syncSearchInputs(changedInputId, searchValue) {
    try {
        setTimeout(() => {
            if (changedInputId === 'userSearch') {
                const filterInput = document.getElementById('filterUserSearch');
                if (filterInput && filterInput.value !== searchValue) {
                    if (document.activeElement !== filterInput) {
                        filterInput.value = searchValue;
                    }
                }
            } else if (changedInputId === 'filterUserSearch') {
                const headerInput = document.getElementById('userSearch');
                if (headerInput && headerInput.value !== searchValue) {
                    if (document.activeElement !== headerInput) {
                        headerInput.value = searchValue;
                    }
                }
            }
        }, 5);
    } catch (error) {
    }
}

function handleSearchKeyup(e, inputType) {
    if (e.key === 'Escape') {
        e.target.value = '';
        if (window.usersData) {
            window.usersData.searchTerm = '';
            window.usersData.currentPage = 1;
        }

        // Sync the other search input
        syncSearchInputs(e.target.id, '');

        if (typeof window.filterUsers === 'function' && window.usersData) {
            window.filterUsers();
        }
    }
}

function handleSearchKeypress(e, inputType) {
    if (e.key === 'Enter') {
        e.preventDefault();

        // Apply current search term
        if (typeof window.filterUsers === 'function' && window.usersData) {
            window.filterUsers();
        }
    }
}

function handleSearchButton() {
    let searchInput = document.getElementById('userSearch');
    let inputType = 'header';

    if (!searchInput || !searchInput.value.trim()) {
        searchInput = document.getElementById('filterUserSearch');
        inputType = 'filter';
    }

    if (searchInput) {
        const searchValue = searchInput.value.trim();

        const finalSearchValue = searchValue || (window.usersData ? window.usersData.searchTerm : '') || '';

        // Update the data model
        if (window.usersData) {
            window.usersData.searchTerm = finalSearchValue;
            window.usersData.currentPage = 1;
        }

        syncSearchInputs(searchInput.id, finalSearchValue);

        // Apply filter immediately
        if (typeof window.filterUsers === 'function' && window.usersData) {
            window.filterUsers();
        }
    }
}

function updateUsersTable() {
    const container = document.getElementById('usersTableContainer');
    if (!container) return;

    if (!window.usersData) {
        return;
    }
    const startIndex = (window.usersData.currentPage - 1) * window.usersData.itemsPerPage;
    const endIndex = startIndex + window.usersData.itemsPerPage;
    const paginatedUsers = window.usersData.filteredUsers.slice(startIndex, endIndex);

    let usersTableHtml = `
        <div class="flex items-center gap-2 mb-4">
            <i class="fas fa-users text-green-600 text-xl"></i>
            <h2 class="text-xl font-bold text-gray-800">Usuarios del Sistema</h2>
            <span class="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">${window.usersData ? window.usersData.filteredUsers.length : 0} usuarios</span>
        </div>
    `;

    if (paginatedUsers.length === 0) {
        usersTableHtml += `
            <div class="text-center py-8">
                <i class="fas fa-users text-gray-300 text-4xl mb-4"></i>
                <p class="text-gray-500">No se encontraron usuarios</p>
            </div>
        `;
    } else {
        usersTableHtml += `
            <div class="overflow-x-auto">
                <table class="w-full">
                    <thead>
                        <tr class="border-b border-gray-200">
                            <th class="text-left py-3 px-4 text-sm font-semibold text-gray-700">Usuario</th>
                            <th class="text-left py-3 px-4 text-sm font-semibold text-gray-700">Rol</th>
                            <th class="text-left py-3 px-4 text-sm font-semibold text-gray-700">Estado</th>
                            <th class="text-left py-3 px-4 text-sm font-semibold text-gray-700">Contraseña</th>
                            <th class="text-center py-3 px-4 text-sm font-semibold text-gray-700">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        paginatedUsers.forEach(user => {
            const roleText = window.getRoleText ? window.getRoleText(user.role) : user.role;
            const statusText = user.status !== false ? 'Activo' : 'Inactivo';
            const statusColor = user.status !== false ? 'green' : 'red';
            const fullName = user.fullName || 'Usuario sin nombre';
            const email = user.email || 'Sin email';
            const initials = fullName.charAt(0).toUpperCase();
            const isAdmin = user.role === 'ADMIN';

            const profileImage = user.imgUrl ?
                `<img src="${user.imgUrl}" alt="${fullName}" class="w-8 h-8 rounded-full object-cover border-2 border-gray-200">` :
                `<div class="w-8 h-8 ${isAdmin ? 'bg-red-600' : 'bg-green-600'} rounded-full flex items-center justify-center text-white text-sm font-bold">${initials}</div>`;

            usersTableHtml += `
                <tr class="border-b border-gray-100 hover:bg-gray-50 transition-colors ${isAdmin ? 'bg-red-50' : ''}">
                    <td class="py-3 px-4">
                        <div class="flex items-center gap-3">
                            <button onclick="changeUserPhoto('${user.id}')" class="profile-image-btn ${user.imgUrl ? '' : 'no-image'}" title="Cambiar foto de perfil">
                                ${profileImage}
                                <div class="image-overlay">
                                    <i class="fas fa-camera text-white text-xs"></i>
                                </div>
                            </button>
                            <div>
                                <div class="font-semibold text-gray-800 ${isAdmin ? 'text-red-800' : ''}">${fullName}</div>
                                <div class="text-sm text-gray-500">${email}</div>
                            </div>
                        </div>
                    </td>
                    <td class="py-3 px-4">
                        <span class="px-2 py-1 ${isAdmin ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'} rounded-full text-xs font-medium">${roleText}</span>
                    </td>
                    <td class="py-3 px-4">
                        <span class="px-2 py-1 bg-${statusColor}-100 text-${statusColor}-700 rounded-full text-xs font-medium">${statusText}</span>
                    </td>
                    <td class="py-3 px-4">
                        <button onclick="showUserPassword('${user.id}')" class="text-green-600 hover:text-green-700 text-sm font-medium">
                            Cambiar contraseña
                        </button>
                    </td>
                    <td class="py-3 px-4">
                        <div class="flex items-center justify-center gap-2">
                            <button data-user-id="${user.id}" data-action="view" class="user-action-btn p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Ver">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button data-user-id="${user.id}" data-action="edit" class="user-action-btn p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors" title="Editar">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button data-user-id="${user.id}" data-action="delete" class="user-action-btn p-2 ${isAdmin ? 'text-gray-400 cursor-not-allowed opacity-50' : 'text-red-600 hover:bg-red-50'} rounded-lg transition-colors" title="Eliminar" ${isAdmin ? 'disabled' : ''} onclick="${isAdmin ? 'return false' : `deleteUser('${user.id}')`}">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });

        usersTableHtml += `
                    </tbody>
                </table>
            </div>
        `;
    }

    container.innerHTML = usersTableHtml;

    attachActionButtonListeners();
}

function updatePagination() {
    const container = document.getElementById('paginationContainer');
    if (!container) return;

    if (!window.usersData) {
        return;
    }
    const totalPages = Math.ceil(window.usersData.filteredUsers.length / window.usersData.itemsPerPage);
    const startItem = (window.usersData.currentPage - 1) * window.usersData.itemsPerPage + 1;
    const endItem = Math.min(window.usersData.currentPage * window.usersData.itemsPerPage, window.usersData.filteredUsers.length);

    let paginationHtml = `
        <div class="text-sm text-gray-600">
            Mostrando ${startItem}-${endItem} de ${window.usersData ? window.usersData.filteredUsers.length : 0} usuarios
        </div>
        <div class="flex items-center gap-2">
    `;

    if (window.usersData) {
        paginationHtml += `
            <button onclick="changePage(${window.usersData.currentPage - 1})" ${window.usersData.currentPage === 1 ? 'disabled' : ''} class="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                <i class="fas fa-chevron-left"></i>
            </button>
        `;

        const maxVisiblePages = 5;
        let startPage = Math.max(1, window.usersData.currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            paginationHtml += `
                <button onclick="changePage(${i})" class="px-3 py-2 border ${window.usersData.currentPage === i ? 'bg-green-600 text-white border-green-600' : 'border-gray-300 text-gray-700'} rounded-lg hover:bg-gray-50 transition-colors">
                    ${i}
                </button>
            `;
        }

        paginationHtml += `
            <button onclick="changePage(${window.usersData.currentPage + 1})" ${window.usersData.currentPage === totalPages ? 'disabled' : ''} class="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                <i class="fas fa-chevron-right"></i>
            </button>
        `;
    }

    paginationHtml += `</div>`;
    container.innerHTML = paginationHtml;
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

function attachActionButtonListeners() {
    const actionButtons = document.querySelectorAll('.user-action-btn');

    actionButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const userId = this.getAttribute('data-user-id');
            const action = this.getAttribute('data-action');

            switch(action) {
                case 'view':
                    viewUser(userId);
                    break;
                case 'edit':
                    editUser(userId);
                    break;
                case 'delete':
                    deleteUser(userId);
                    break;
                default:
            }
        });
    });
}


function resetSearchInputs() {
    window._searchInputsInitialized = false;

    const headerInput = document.getElementById('userSearch');
    const filterInput = document.getElementById('filterUserSearch');

    if (headerInput) {
        headerInput._headerSearchListeners = false;
    }
    if (filterInput) {
        filterInput._filterSearchListeners = false;
    }

    setupSearchInputs();
}

function checkSearchInputsStatus() {
    const headerInput = document.getElementById('userSearch');
    const filterInput = document.getElementById('filterUserSearch');

}

document.addEventListener('DOMContentLoaded', function() {
    function checkDependenciesAndInitialize() {
        if (typeof window.filterUsers === 'function' && window.usersData && document.readyState === 'complete') {
            if (!window._searchInputsInitialized) {
                setupSearchInputs();
            }
        } else {
            setTimeout(checkDependenciesAndInitialize, 50);
        }
    }

    setTimeout(checkDependenciesAndInitialize, 100);
});

window.setRoleFilter = setRoleFilter;
window.setStatusFilter = setStatusFilter;
window.changePage = changePage;
window.applySearchFilter = applySearchFilter;
window.handleSearchButton = handleSearchButton;
window.setupSearchInputs = setupSearchInputs;
window.setupSearchInputListeners = setupSearchInputListeners;
window.handleSearchInput = handleSearchInput;
window.handleSearchKeyup = handleSearchKeyup;
window.handleSearchKeypress = handleSearchKeypress;
window.syncSearchInputs = syncSearchInputs;
window.filterUsers = filterUsers;
window.resetSearchInputs = resetSearchInputs;
window.checkSearchInputsStatus = checkSearchInputsStatus;
window.updateUsersUI = updateUsersUI;
window.updateUsersTable = updateUsersTable;
window.updateUserStats = updateUserStats;
window.updatePagination = updatePagination;
window.updateSearchAndFilters = updateSearchAndFilters;
window.attachActionButtonListeners = attachActionButtonListeners;
window.getRoleText = getRoleText;

window.viewUser = function(userId) {
    if (typeof window.showViewUserModal === 'function') {
        window.showViewUserModal(userId);
    }
};

window.editUser = function(userId) {
    if (typeof window.showEditUserModal === 'function') {
        window.showEditUserModal(userId);
    }
};

window.deleteUser = function(userId) {
    if (typeof window.showDeleteUserModal === 'function') {
        window.showDeleteUserModal(userId);
    }
};

// showUserPassword is implemented in users-forms.js

// changeUserPhoto is implemented in users-images.js

// Modal placeholder functions
window.showNewUserModal = function() {
    // Placeholder - should be implemented in users-modals.js
};

window.closeNewUserModal = function() {
    // Placeholder - should be implemented in users-modals.js
};

window.closeViewUserModal = function() {
    // Placeholder - should be implemented in users-modals.js
};

window.closeEditUserModal = function() {
    // Placeholder - should be implemented in users-modals.js
};



// loadUsersData is implemented in users-api.js

window.logout = function() {
    // Placeholder - should be implemented in dashboard.js or auth
    if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('jwt');
    }
    window.location.href = '/';
};