// Users management data
let usersData = {
    users: [],
    filteredUsers: [],
    currentPage: 1,
    itemsPerPage: 5,
    searchTerm: '',
    selectedRole: 'all',
    selectedStatus: 'all',
    isLoading: false
};

// Initialize users page when DOM loads
document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on the users page by multiple methods
    const isUsersPage =
        window.location.pathname.includes('/users') ||
        window.location.pathname.includes('users.html') ||
        document.querySelector('#userStatsContainer') !== null ||
        document.querySelector('#usersTableContainer') !== null ||
        document.querySelector('#newUserModal') !== null;

    if (isUsersPage) {
        // Small delay to ensure all elements are rendered
        setTimeout(() => {
            initializeUsersPage();
        }, 100);
    }
});

// Initialize users page
function initializeUsersPage() {
    loadUsersData();
    setupEventListeners();
}

// Setup event listeners
function setupEventListeners() {
    // Search input
    const searchInput = document.getElementById('userSearch');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            usersData.searchTerm = e.target.value;
            usersData.currentPage = 1;
            filterUsers();
        });
    }


    // New user form
    const newUserForm = document.getElementById('newUserForm');
    if (newUserForm) {
        newUserForm.addEventListener('submit', handleNewUserSubmit);
    }

}


// Load all users data
async function loadUsersData() {
    if (usersData.isLoading) return;

    usersData.isLoading = true;
    showLoadingState();

    try {
        // Load current user info
        await loadCurrentUserInfo();

        // Load all users
        await loadUsers();

        // Update UI
        updateUsersUI();

    } catch (error) {
        console.error('Error loading users data:', error);
        showErrorState('Error al cargar los datos de usuarios: ' + error.message);
        // Still update UI even if there's an error to show empty state
        updateUsersUI();
    } finally {
        usersData.isLoading = false;
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
        // Set default values
        updateUserInfoDisplay({
            fullName: 'Super Admin',
            role: 'ADMIN',
            email: 'admin@sena.edu.co'
        });
    }
}

// Update user info display in sidebar and header
function updateUserInfoDisplay(userData) {
    const sidebarUserName = document.getElementById('sidebarUserName');
    const sidebarUserRole = document.getElementById('sidebarUserRole');
    const headerUserName = document.getElementById('headerUserName');
    const headerUserRole = document.getElementById('headerUserRole');
    const headerUserAvatar = document.getElementById('headerUserAvatar');

    if (sidebarUserName) sidebarUserName.textContent = userData.fullName || 'Super Admin';
    if (sidebarUserRole) sidebarUserRole.textContent = userData.role || 'ADMIN';
    if (headerUserName) headerUserName.textContent = userData.fullName || 'Super Admin';
    if (headerUserRole) headerUserRole.textContent = userData.role || 'ADMIN';
    if (headerUserAvatar) headerUserAvatar.textContent = (userData.fullName || 'Super Admin').charAt(0).toUpperCase();
}

// Load users list
async function loadUsers() {
    try {
        const token = localStorage.getItem('jwt');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch('/api/v1/users', {
            method: 'GET',
            headers: headers
        });

        if (response.ok) {
            usersData.users = await response.json();
            usersData.filteredUsers = [...usersData.users];
        } else {
            throw new Error('Failed to load users');
        }
    } catch (error) {
        console.error('Error loading users:', error);
        // Set empty array if API fails
        usersData.users = [];
        usersData.filteredUsers = [];
    }
}

// Filter users based on search term, role, and status
function filterUsers() {
    let filtered = [...usersData.users];

    // Filter by search term
    if (usersData.searchTerm) {
        const searchLower = usersData.searchTerm.toLowerCase();
        filtered = filtered.filter(user =>
            user.fullName.toLowerCase().includes(searchLower) ||
            user.email.toLowerCase().includes(searchLower) ||
            user.role.toLowerCase().includes(searchLower)
        );
    }

    // Filter by role
    if (usersData.selectedRole !== 'all') {
        filtered = filtered.filter(user => user.role === usersData.selectedRole);
    }

    // Filter by status
    if (usersData.selectedStatus !== 'all') {
        const status = usersData.selectedStatus === 'active';
        filtered = filtered.filter(user => user.active === status);
    }

    usersData.filteredUsers = filtered;
    usersData.currentPage = 1;
    updateUsersUI();
}

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
    const adminCount = usersData.users.filter(u => u.role === 'ADMIN').length;
    const warehouseCount = usersData.users.filter(u => u.role === 'WAREHOUSE').length;
    const userCount = usersData.users.filter(u => u.role === 'USER').length;
    const activeCount = usersData.users.filter(u => u.active !== false).length;
    const inactiveCount = usersData.users.filter(u => u.active === false).length;

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
            const statusText = user.active !== false ? 'Activo' : 'Inactivo';
            const statusColor = user.active !== false ? 'green' : 'red';

            usersTableHtml += `
                <tr class="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td class="py-3 px-4">
                        <div class="flex items-center gap-3">
                            <div class="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                                ${user.fullName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <div class="font-semibold text-gray-800">${user.fullName}</div>
                                <div class="text-sm text-gray-500">${user.email}</div>
                            </div>
                        </div>
                    </td>
                    <td class="py-3 px-4">
                        <span class="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">${roleText}</span>
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
                            <button onclick="viewUser('${user.id}')" class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Ver">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button onclick="editUser('${user.id}')" class="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors" title="Editar">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="deleteUser('${user.id}')" class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar">
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

// Helper functions
function getRoleText(role) {
    switch(role) {
        case 'ADMIN': return 'Super Admin';
        case 'WAREHOUSE': return 'Almacén';
        case 'USER': return 'Usuario';
        default: return role;
    }
}

function setRoleFilter(role) {
    usersData.selectedRole = role;
    usersData.currentPage = 1;
    filterUsers();
}

function setStatusFilter(status) {
    usersData.selectedStatus = status;
    usersData.currentPage = 1;
    filterUsers();
}

function changePage(page) {
    if (page >= 1 && page <= Math.ceil(usersData.filteredUsers.length / usersData.itemsPerPage)) {
        usersData.currentPage = page;
        updateUsersTable();
        updatePagination();
    }
}

// Modal functions
function showNewUserModal() {
    const modal = document.getElementById('newUserModal');
    if (modal) {
        modal.classList.remove('hidden');
    }
}

function closeNewUserModal() {
    const modal = document.getElementById('newUserModal');
    if (modal) {
        modal.classList.add('hidden');
    }

    // Reset form
    const form = document.getElementById('newUserForm');
    if (form) {
        form.reset();
    }
}

// Handle new user form submission
async function handleNewUserSubmit(e) {
    e.preventDefault();

    const name = document.getElementById('newUserName').value;
    const email = document.getElementById('newUserEmail').value;
    const role = document.getElementById('newUserRole').value;
    const password = document.getElementById('newUserPassword').value;

    if (!name || !email || !role || !password) {
        alert('Por favor complete todos los campos');
        return;
    }

    try {
        const token = localStorage.getItem('jwt');
        const headers = {
            'Content-Type': 'application/json'
        };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch('/api/v1/users', {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                fullName: name,
                email: email,
                role: role,
                password: password
            })
        });

        if (response.ok) {
            alert('Usuario creado exitosamente');
            closeNewUserModal();
            loadUsersData(); // Reload users list
        } else {
            const errorData = await response.json();
            alert('Error al crear usuario: ' + (errorData.message || 'Error desconocido'));
        }
    } catch (error) {
        console.error('Error creating user:', error);
        alert('Error al crear usuario. Inténtalo de nuevo.');
    }
}

// User action functions
function viewUser(userId) {
    const user = usersData.users.find(u => u.id === userId);
    if (user) {
        alert(`Ver usuario: ${user.fullName}\nEmail: ${user.email}\nRol: ${getRoleText(user.role)}\nEstado: ${user.active !== false ? 'Activo' : 'Inactivo'}`);
    }
}

function editUser(userId) {
    const user = usersData.users.find(u => u.id === userId);
    if (user) {
        alert(`Editar usuario: ${user.fullName}\n\nFuncionalidad de edición próximamente disponible.`);
    }
}

function deleteUser(userId) {
    const user = usersData.users.find(u => u.id === userId);
    if (user && confirm(`¿Está seguro de que desea eliminar al usuario ${user.fullName}?`)) {
        // Here you would implement the delete API call
        alert(`Eliminar usuario: ${user.fullName}\n\nFuncionalidad de eliminación próximamente disponible.`);
    }
}

function showUserPassword(userId) {
    alert('Ver contraseña: Funcionalidad próximamente disponible.');
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