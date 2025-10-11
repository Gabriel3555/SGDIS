// UI update functions for users management

// Update users UI
function updateUsersUI() {
    updateUserStats();
    updateSearchAndFilters();
    updateUsersTable();
    updatePagination();
}

// Update user statistics cards
function updateUserStats() {
    const container = document.getElementById('userStatsContainer');
    if (!container) return;

    // Calculate stats from users data
    const totalUsers = usersData.users.length;
    const adminCount = usersData.users.filter(u => u && u.role === 'ADMIN').length;
    const warehouseCount = usersData.users.filter(u => u && u.role === 'WAREHOUSE').length;
    const userCount = usersData.users.filter(u => u && u.role === 'USER').length;
    const activeCount = usersData.users.filter(u => u && u.status === true).length;
    const inactiveCount = usersData.users.filter(u => u && u.status === false).length;

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

// Update search and filters section
function updateSearchAndFilters() {
    const container = document.getElementById('searchFilterContainer');
    if (!container) return;

    container.innerHTML = `
        <div class="relative flex-1">
            <i class="fas fa-search absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
            <input type="text" id="userSearch" value="${usersData.searchTerm}" placeholder="Buscar usuarios por nombre, email o rol..." class="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-all">
        </div>
        <div class="flex gap-2">
            <button onclick="setRoleFilter('all')" class="px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors ${usersData.selectedRole === 'all' ? 'bg-green-600 text-white border-green-600' : ''}">
                Todos los roles
            </button>
            <button onclick="setStatusFilter('all')" class="px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors ${usersData.selectedStatus === 'all' ? 'bg-green-600 text-white border-green-600' : ''}">
                Todos los estados
            </button>
        </div>
    `;

    // Re-add event listener to search input
    const searchInput = document.getElementById('userSearch');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            usersData.searchTerm = e.target.value;
            usersData.currentPage = 1;
            filterUsers();
        });
    }
}

// Update users table
function updateUsersTable() {
    const container = document.getElementById('usersTableContainer');
    if (!container) return;

    const startIndex = (usersData.currentPage - 1) * usersData.itemsPerPage;
    const endIndex = startIndex + usersData.itemsPerPage;
    const paginatedUsers = usersData.filteredUsers.slice(startIndex, endIndex);

    let usersTableHtml = `
        <div class="flex items-center gap-2 mb-4">
            <i class="fas fa-users text-green-600 text-xl"></i>
            <h2 class="text-xl font-bold text-gray-800">Usuarios del Sistema</h2>
            <span class="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">${usersData.filteredUsers.length} usuarios</span>
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
            const roleText = getRoleText(user.role);
            const statusText = user.status !== false ? 'Activo' : 'Inactivo';
            const statusColor = user.status !== false ? 'green' : 'red';
            const fullName = user.fullName || 'Usuario sin nombre';
            const email = user.email || 'Sin email';
            const initials = fullName.charAt(0).toUpperCase();
            const isAdmin = user.role === 'ADMIN';

            // Determinar la imagen a mostrar
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
                            Ver contraseña
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

    // Attach event listeners to action buttons after rendering
    attachActionButtonListeners();
}

// Update pagination
function updatePagination() {
    const container = document.getElementById('paginationContainer');
    if (!container) return;

    const totalPages = Math.ceil(usersData.filteredUsers.length / usersData.itemsPerPage);
    const startItem = (usersData.currentPage - 1) * usersData.itemsPerPage + 1;
    const endItem = Math.min(usersData.currentPage * usersData.itemsPerPage, usersData.filteredUsers.length);

    let paginationHtml = `
        <div class="text-sm text-gray-600">
            Mostrando ${startItem}-${endItem} de ${usersData.filteredUsers.length} usuarios
        </div>
        <div class="flex items-center gap-2">
    `;

    // Previous button
    paginationHtml += `
        <button onclick="changePage(${usersData.currentPage - 1})" ${usersData.currentPage === 1 ? 'disabled' : ''} class="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
            <i class="fas fa-chevron-left"></i>
        </button>
    `;

    // Page numbers
    const maxVisiblePages = 5;
    let startPage = Math.max(1, usersData.currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
        paginationHtml += `
            <button onclick="changePage(${i})" class="px-3 py-2 border ${usersData.currentPage === i ? 'bg-green-600 text-white border-green-600' : 'border-gray-300 text-gray-700'} rounded-lg hover:bg-gray-50 transition-colors">
                ${i}
            </button>
        `;
    }

    // Next button
    paginationHtml += `
        <button onclick="changePage(${usersData.currentPage + 1})" ${usersData.currentPage === totalPages ? 'disabled' : ''} class="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
            <i class="fas fa-chevron-right"></i>
        </button>
    `;

    paginationHtml += `</div>`;
    container.innerHTML = paginationHtml;
}

// Update user info display in header only (removed sidebar references)
function updateUserInfoDisplay(userData) {
    const headerUserName = document.getElementById('headerUserName');
    const headerUserRole = document.getElementById('headerUserRole');
    const headerUserAvatar = document.getElementById('headerUserAvatar');

    if (headerUserName) headerUserName.textContent = userData.fullName || 'Super Admin';
    if (headerUserRole) headerUserRole.textContent = userData.role || 'ADMIN';

    if (headerUserAvatar) {
        if (userData.imgUrl) {
            // Si el usuario tiene foto de perfil, mostrarla
            headerUserAvatar.innerHTML = `<img src="${userData.imgUrl}" alt="${userData.fullName || 'Usuario'}" class="w-full h-full object-cover rounded-full">`;
        } else {
            // Si no tiene foto, mostrar la inicial
            headerUserAvatar.textContent = (userData.fullName || 'Super Admin').charAt(0).toUpperCase();
        }
    }
}

// Attach action button listeners after table is rendered
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
                    console.error('Unknown action:', action);
            }
        });
    });
}