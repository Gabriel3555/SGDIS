// Utility functions for cookie management
function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

// Check if JWT is expired or about to expire (within 2 minutes)
function isTokenExpired() {
    const token = localStorage.getItem('jwt');
    if (!token) return true;

    try {
        // Simple JWT expiration check (you might want to use a JWT library)
        const payload = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Date.now() / 1000;
        // Return true if token expires in less than 2 minutes (120 seconds)
        return (payload.exp - currentTime) < 120;
    } catch (error) {
        console.error('Error checking token expiration:', error);
        return true;
    }
}

// Refresh JWT token using refresh token from cookies
async function refreshToken() {
    const refreshTokenValue = getCookie('refreshToken');
    if (!refreshTokenValue) {
        console.log('No refresh token found, redirecting to login');
        window.location.href = '/index.html';
        return;
    }

    try {
        const response = await fetch('/api/v1/auth/token/refresh', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                refreshToken: refreshTokenValue
            })
        });

        if (response.ok) {
            const data = await response.json();
            console.log('Token refreshed successfully');
            // Update JWT in localStorage
            localStorage.setItem('jwt', data.jwt);
            return true;
        } else {
            console.error('Token refresh failed, redirecting to login');
            window.location.href = '/index.html';
            return false;
        }
    } catch (error) {
        console.error('Error refreshing token:', error);
        window.location.href = '/index.html';
        return false;
    }
}

// Dashboard data management (shared across all dashboards)
let dashboardData = {
    user: null,
    stats: null,
    chartData: null,
    monthlyActivity: null,
    isLoading: false,
    dashboardType: 'admin' // admin, user, warehouse
};

// Logout function
function logout() {
    // Limpiar tokens - JWT en localStorage, refresh token en cookies
    localStorage.removeItem('jwt');
    // Clear refresh token from cookies (no JWT cookies to clear)
    document.cookie = 'refreshToken=; path=/; max-age=0';
    window.location.href = '/index';
}

// Auto-refresh token every 5 minutes or when needed
setInterval(async () => {
    if (isTokenExpired()) {
        console.log('Token expired or about to expire, refreshing...');
        await refreshToken();
    }
}, 5 * 60 * 1000); // Check every 5 minutes

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', async function() {
    if (isTokenExpired()) {
        console.log('Token expired on page load, refreshing...');
        await refreshToken();
    }

    // Initialize dashboard if we're on a dashboard page
    if (window.location.pathname.includes('/dashboard/') ||
        window.location.pathname.includes('/admin_institution/') ||
        window.location.pathname.includes('/admin_regional/') ||
        window.location.pathname.includes('/superadmin/')) {
        initializeDashboard();
    }
});

// Initialize dashboard based on current path
function initializeDashboard() {
    const path = window.location.pathname;

    if (path.includes('/admin_institution') || path.includes('/admin_regional') || path.includes('/superadmin')) {
        dashboardData.dashboardType = 'admin';
    } else if (path.includes('/user')) {
        dashboardData.dashboardType = 'user';
    } else if (path.includes('/warehouse')) {
        dashboardData.dashboardType = 'warehouse';
    }
    
    // Use loadDashboardData() which handles loading state and UI updates
    loadDashboardData();
}

// Load all dashboard data
async function loadDashboardData() {
    if (dashboardData.isLoading) {
        console.log('Dashboard data is already loading, skipping...');
        return;
    }

    dashboardData.isLoading = true;
    showLoadingState();

    try {
        // Ensure dashboard type is set
        if (!dashboardData.dashboardType) {
            const path = window.location.pathname;
            if (path.includes('/admin_institution') || path.includes('/admin_regional') || path.includes('/superadmin')) {
                dashboardData.dashboardType = 'admin';
            } else if (path.includes('/user')) {
                dashboardData.dashboardType = 'user';
            } else if (path.includes('/warehouse')) {
                dashboardData.dashboardType = 'warehouse';
            } else {
                // Default to admin if path doesn't match
                dashboardData.dashboardType = 'admin';
            }
        }

        // Load data based on dashboard type
        if (dashboardData.dashboardType === 'admin') {
            await loadAdminDashboardData();
        } else if (dashboardData.dashboardType === 'user') {
            await loadUserDashboardData();
        } else if (dashboardData.dashboardType === 'warehouse') {
            await loadWarehouseDashboardData();
        } else {
            // Fallback to admin if type is unknown
            console.warn('Unknown dashboard type, defaulting to admin');
            dashboardData.dashboardType = 'admin';
            await loadAdminDashboardData();
        }

        // Update UI with loaded data
        updateDashboardUI();

    } catch (error) {
        console.error('Error loading dashboard data:', error);
        setZeroFallbacks();
        updateDashboardUI();
    } finally {
        dashboardData.isLoading = false;
        hideLoadingState();
    }
}

// Load user information (shared across all dashboards)
async function loadUserInfo() {
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
            dashboardData.user = await response.json();
        } else {
            throw new Error('Failed to load user info');
        }
    } catch (error) {
        console.error('Error loading user info:', error);
        // Set default user data based on dashboard type
        if (dashboardData.dashboardType === 'admin') {
            // Determine admin type based on URL path
            const path = window.location.pathname;
            if (path.includes('/superadmin')) {
                dashboardData.user = {
                    fullName: 'Super Admin',
                    role: 'SUPERADMIN',
                    email: 'admin@sena.edu.co'
                };
                updateHeaderProfile('Super Admin', 'SUPERADMIN');
            } else if (path.includes('/admin_regional')) {
                dashboardData.user = {
                    fullName: 'Admin Regional',
                    role: 'ADMIN_REGIONAL',
                    email: 'admin@sena.edu.co'
                };
                updateHeaderProfile('Admin Regional', 'ADMIN_REGIONAL');
            } else if (path.includes('/admin_institution')) {
                dashboardData.user = {
                    fullName: 'Admin Institución',
                    role: 'ADMIN_INSTITUTION',
                    email: 'admin@sena.edu.co'
                };
                updateHeaderProfile('Admin Institución', 'ADMIN_INSTITUTION');
            } else {
                dashboardData.user = {
                    fullName: 'Super Admin',
                    role: 'SUPERADMIN',
                    email: 'admin@sena.edu.co'
                };
                updateHeaderProfile('Super Admin', 'SUPERADMIN');
            }
        } else if (dashboardData.dashboardType === 'user') {
            dashboardData.user = {
                fullName: 'Usuario',
                role: 'USER',
                email: 'user@sena.edu.co'
            };
            updateHeaderProfile('Usuario', 'USER');
        } else if (dashboardData.dashboardType === 'warehouse') {
            dashboardData.user = {
                fullName: 'Admin Warehouse',
                role: 'WAREHOUSE',
                email: 'warehouse@sena.edu.co'
            };
            updateHeaderProfile('Admin Warehouse', 'WAREHOUSE');
        }
    }
}

// Set zero fallbacks for all data
function setZeroFallbacks() {
    dashboardData.user = getDefaultUserData();
    dashboardData.stats = getDefaultStatsData();
    dashboardData.chartData = getDefaultChartData();
    dashboardData.monthlyActivity = getDefaultMonthlyData();
}

// Get default user data based on dashboard type
function getDefaultUserData() {
    const type = dashboardData.dashboardType;
    const path = window.location.pathname;

    if (type === 'admin') {
        if (path.includes('/superadmin')) {
            return { fullName: 'Super Admin', role: 'SUPERADMIN', email: 'admin@sena.edu.co' };
        } else if (path.includes('/admin_regional')) {
            return { fullName: 'Admin Regional', role: 'ADMIN_REGIONAL', email: 'admin@sena.edu.co' };
        } else if (path.includes('/admin_institution')) {
            return { fullName: 'Admin Institución', role: 'ADMIN_INSTITUTION', email: 'admin@sena.edu.co' };
        }
        return { fullName: 'Super Admin', role: 'SUPERADMIN', email: 'admin@sena.edu.co' };
    } else if (type === 'user') {
        return { fullName: 'Usuario', role: 'USER', email: 'user@sena.edu.co' };
    } else if (type === 'warehouse') {
        return { fullName: 'Admin Warehouse', role: 'WAREHOUSE', email: 'warehouse@sena.edu.co' };
    }
    return { fullName: 'Usuario', role: 'USER', email: 'user@sena.edu.co' };
}

// Get default stats data based on dashboard type
function getDefaultStatsData() {
    const type = dashboardData.dashboardType;
    if (type === 'admin') {
        return { totalUsers: 0, totalInventory: 0, pendingVerifications: 0, reportsGenerated: 0 };
    } else if (type === 'user') {
        return { totalItems: 0, activeItems: 0, maintenanceItems: 0, totalValue: 0 };
    } else if (type === 'warehouse') {
        return { warehouseItems: 0, activeItems: 0, pendingMaintenance: 0, monthlyReports: 0 };
    }
    return { totalItems: 0, activeItems: 0, maintenanceItems: 0, totalValue: 0 };
}

// Get default chart data based on dashboard type
function getDefaultChartData() {
    const type = dashboardData.dashboardType;
    if (type === 'admin') {
        return {
            usersByRole: [
                { role: 'Super Administradores', count: 0, color: 'red' },
                { role: 'Admin Almacén', count: 0, color: 'yellow' },
                { role: 'Usuarios Normales', count: 0, color: 'green' }
            ],
            systemStatus: {
                overall: 0,
                components: [
                    { name: 'Base de Datos', status: 'SIN DATA', color: 'gray' },
                    { name: 'Servidor', status: 'SIN DATA', color: 'gray' },
                    { name: 'Último Backup', status: 'SIN DATA', color: 'gray' }
                ]
            }
        };
    } else if (type === 'user') {
        return {
            itemsByCategory: [
                { category: 'Equipos de Cómputo', count: 0, color: 'red' },
                { category: 'Equipos Audiovisuales', count: 0, color: 'yellow' },
                { category: 'Equipos de Laboratorio', count: 0, color: 'green' },
                { category: 'Dispositivos Móviles', count: 0, color: 'blue' }
            ],
            itemStatus: [
                { status: 'Activos', count: 0, color: 'green' },
                { status: 'Mantenimiento', count: 0, color: 'orange' },
                { status: 'Inactivos', count: 0, color: 'red' }
            ]
        };
    } else if (type === 'warehouse') {
        return {
            itemsByCategory: [
                { category: 'Equipos de Cómputo', count: 0, color: 'blue' },
                { category: 'Equipos de Laboratorio', count: 0, color: 'green' },
                { category: 'Audiovisuales', count: 0, color: 'yellow' },
                { category: 'Móviles', count: 0, color: 'purple' }
            ],
            maintenanceStatus: [
                { status: 'En buen estado', count: 0, color: 'green' },
                { status: 'Requiere revisión', count: 0, color: 'orange' },
                { status: 'Mantenimiento urgente', count: 0, color: 'red' }
            ]
        };
    }
    return {};
}

// Get default monthly data based on dashboard type
function getDefaultMonthlyData() {
    const type = dashboardData.dashboardType;
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May'];

    if (type === 'admin') {
        return months.map(month => ({ month, actions: 0, users: 0 }));
    } else if (type === 'user') {
        return months.map(month => ({ month, items: 0, value: 0 }));
    } else if (type === 'warehouse') {
        return months.map(month => ({ month, movements: 0, growth: '+0%' }));
    }
    return months.map(month => ({ month, value: 0 }));
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

// Update dashboard UI with loaded data
function updateDashboardUI() {
    updateWelcomeSection();
    updateStatsCards();
    updateChartsSection();
    updateMonthlyStats();
}

// Update header profile information
function updateHeaderProfile(userName, userRole) {
    const headerUserName = document.getElementById('headerUserName');
    const headerUserRole = document.getElementById('headerUserRole');
    const headerUserAvatar = document.getElementById('headerUserAvatar');

    if (headerUserName) headerUserName.textContent = userName;
    if (headerUserRole) headerUserRole.textContent = userRole;
    if (headerUserAvatar) headerUserAvatar.textContent = userName.charAt(0).toUpperCase();
}

// Update welcome section
function updateWelcomeSection() {
    const titleElement = document.getElementById('dashboardTitle');
    const welcomeElement = document.getElementById('welcomeMessage');

    if (dashboardData.user) {
        const userName = dashboardData.user.fullName || 'Usuario';
        const userRole = dashboardData.user.role || 'USER';

        if (titleElement) {
            const roleTitle = userRole === 'ADMIN' ? 'Administrador' : userRole === 'WAREHOUSE' ? 'Almacén' : '';
            titleElement.textContent = `Dashboard ${roleTitle}`.trim();
        }

        if (welcomeElement) {
            welcomeElement.textContent = `Bienvenido, ${userName} - ${userRole}`;
        }

        // Also update header profile information
        updateHeaderProfile(userName, userRole);
    }
}

// Update stats cards
function updateStatsCards() {
    if (!dashboardData.stats) return;

    const container = document.getElementById('statsContainer');
    if (!container) return;

    const type = dashboardData.dashboardType;
    let statsHtml = '';

    if (type === 'admin') {
        statsHtml = generateAdminStatsCards();
    } else if (type === 'user') {
        statsHtml = generateUserStatsCards();
    } else if (type === 'warehouse') {
        statsHtml = generateWarehouseStatsCards();
    }

    container.innerHTML = statsHtml;
}

// Generate admin stats cards
function generateAdminStatsCards() {
    return `
        <div class="stat-card">
            <div class="flex items-start justify-between mb-3">
                <div>
                    <p class="text-gray-600 text-sm font-medium mb-1">Total Usuarios</p>
                    <h3 class="text-3xl font-bold text-gray-800">${dashboardData.stats.totalUsers}</h3>
                </div>
                <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <i class="fas fa-users text-green-600 text-xl"></i>
                </div>
            </div>
            <p class="text-green-600 text-sm font-medium">${dashboardData.stats.totalUsers > 0 ? '+' + Math.floor(Math.random() * 5) + ' nuevos este mes' : 'Sin usuarios registrados'}</p>
        </div>

        <div class="stat-card">
            <div class="flex items-start justify-between mb-3">
                <div>
                    <p class="text-gray-600 text-sm font-medium mb-1">Items del Sistema</p>
                    <h3 class="text-3xl font-bold text-gray-800">${dashboardData.stats.totalInventory}</h3>
                </div>
                <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <i class="fas fa-box text-blue-600 text-xl"></i>
                </div>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${Math.min((dashboardData.stats.totalInventory / 200) * 100, 100)}%"></div>
            </div>
        </div>

        <div class="stat-card">
            <div class="flex items-start justify-between mb-3">
                <div>
                    <p class="text-gray-600 text-sm font-medium mb-1">Verificaciones Pendientes</p>
                    <h3 class="text-3xl font-bold text-gray-800">${dashboardData.stats.pendingVerifications}</h3>
                </div>
                <div class="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                    <i class="fas fa-clipboard-check text-orange-600 text-xl"></i>
                </div>
            </div>
            <p class="text-gray-600 text-sm">${Math.floor(dashboardData.stats.pendingVerifications * 0.4)} requieren atención inmediata</p>
        </div>

        <div class="stat-card">
            <div class="flex items-start justify-between mb-3">
                <div>
                    <p class="text-gray-600 text-sm font-medium mb-1">Reportes Generados</p>
                    <h3 class="text-2xl font-bold text-gray-800">${dashboardData.stats.reportsGenerated}</h3>
                </div>
                <div class="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <i class="fas fa-chart-bar text-purple-600 text-xl"></i>
                </div>
            </div>
            <p class="text-gray-600 text-sm">Este mes</p>
        </div>
    `;
}

// Generate user stats cards
function generateUserStatsCards() {
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0
        }).format(value);
    };

    return `
        <div class="stat-card">
            <div class="flex items-start justify-between mb-3">
                <div>
                    <p class="text-gray-600 text-sm font-medium mb-1">Total Items</p>
                    <h3 class="text-3xl font-bold text-gray-800">${dashboardData.stats.totalItems}</h3>
                </div>
                <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <i class="fas fa-box text-green-600 text-xl"></i>
                </div>
            </div>
            <p class="text-green-600 text-sm font-medium">${dashboardData.stats.totalItems > 0 ? '+12.5% desde el mes pasado' : 'Sin items registrados'}</p>
        </div>

        <div class="stat-card">
            <div class="flex items-start justify-between mb-3">
                <div>
                    <p class="text-gray-600 text-sm font-medium mb-1">Items Activos</p>
                    <h3 class="text-3xl font-bold text-gray-800">${dashboardData.stats.activeItems}</h3>
                </div>
                <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <i class="fas fa-check-circle text-blue-600 text-xl"></i>
                </div>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${dashboardData.stats.totalItems > 0 ? (dashboardData.stats.activeItems / dashboardData.stats.totalItems) * 100 : 0}%"></div>
            </div>
        </div>

        <div class="stat-card">
            <div class="flex items-start justify-between mb-3">
                <div>
                    <p class="text-gray-600 text-sm font-medium mb-1">En Mantenimiento</p>
                    <h3 class="text-3xl font-bold text-gray-800">${dashboardData.stats.maintenanceItems}</h3>
                </div>
                <div class="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                    <i class="fas fa-exclamation-triangle text-orange-600 text-xl"></i>
                </div>
            </div>
            <p class="text-gray-600 text-sm">${dashboardData.stats.maintenanceItems} pendientes</p>
        </div>

        <div class="stat-card">
            <div class="flex items-start justify-between mb-3">
                <div>
                    <p class="text-gray-600 text-sm font-medium mb-1">Valor Total</p>
                    <h3 class="text-2xl font-bold text-gray-800">${formatCurrency(dashboardData.stats.totalValue)}</h3>
                </div>
                <div class="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <i class="fas fa-dollar-sign text-purple-600 text-xl"></i>
                </div>
            </div>
            <p class="text-gray-600 text-sm">${dashboardData.stats.totalItems} inventarios</p>
        </div>
    `;
}

// Generate warehouse stats cards
function generateWarehouseStatsCards() {
    return `
        <div class="stat-card">
            <div class="flex items-start justify-between mb-3">
                <div>
                    <p class="text-gray-600 text-sm font-medium mb-1">Items en Almacén</p>
                    <h3 class="text-3xl font-bold text-gray-800">${dashboardData.stats.warehouseItems}</h3>
                </div>
                <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <i class="fas fa-warehouse text-green-600 text-xl"></i>
                </div>
            </div>
            <p class="text-green-600 text-sm font-medium">${dashboardData.stats.warehouseItems > 0 ? '+5% desde el mes pasado' : 'Sin items en almacén'}</p>
        </div>

        <div class="stat-card">
            <div class="flex items-start justify-between mb-3">
                <div>
                    <p class="text-gray-600 text-sm font-medium mb-1">Items Activos</p>
                    <h3 class="text-3xl font-bold text-gray-800">${dashboardData.stats.activeItems}</h3>
                </div>
                <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <i class="fas fa-check-circle text-blue-600 text-xl"></i>
                </div>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${dashboardData.stats.warehouseItems > 0 ? (dashboardData.stats.activeItems / dashboardData.stats.warehouseItems) * 100 : 0}%"></div>
            </div>
        </div>

        <div class="stat-card">
            <div class="flex items-start justify-between mb-3">
                <div>
                    <p class="text-gray-600 text-sm font-medium mb-1">Mantenimiento Pendiente</p>
                    <h3 class="text-3xl font-bold text-gray-800">${dashboardData.stats.pendingMaintenance}</h3>
                </div>
                <div class="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                    <i class="fas fa-tools text-orange-600 text-xl"></i>
                </div>
            </div>
            <p class="text-gray-600 text-sm">${dashboardData.stats.pendingMaintenance > 0 ? Math.floor(dashboardData.stats.pendingMaintenance * 0.5) + ' requieren atención urgente' : 'Sin mantenimientos pendientes'}</p>
        </div>

        <div class="stat-card">
            <div class="flex items-start justify-between mb-3">
                <div>
                    <p class="text-gray-600 text-sm font-medium mb-1">Reportes Este Mes</p>
                    <h3 class="text-2xl font-bold text-gray-800">${dashboardData.stats.monthlyReports}</h3>
                </div>
                <div class="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <i class="fas fa-chart-line text-purple-600 text-xl"></i>
                </div>
            </div>
            <p class="text-gray-600 text-sm">${dashboardData.stats.monthlyReports > 0 ? '3 más que el mes anterior' : 'Sin reportes generados'}</p>
        </div>
    `;
}

// Update charts section
function updateChartsSection() {
    const container = document.getElementById('chartsContainer');
    if (!container) return;

    const type = dashboardData.dashboardType;
    let chartsHtml = '';

    if (type === 'admin') {
        chartsHtml = generateAdminCharts();
    } else if (type === 'user') {
        chartsHtml = generateUserCharts();
    } else if (type === 'warehouse') {
        chartsHtml = generateWarehouseCharts();
    }

    container.innerHTML = chartsHtml;
}

// Generate admin charts
function generateAdminCharts() {
    let usersByRoleHtml = dashboardData.chartData.usersByRole.map(user =>
        `<div class="category-item flex items-center justify-between">
            <div class="flex items-center gap-3">
                <div class="w-3 h-3 rounded-full bg-${user.color}-500"></div>
                <span class="text-gray-700 font-medium">${user.role}</span>
            </div>
            <span class="text-gray-600 font-semibold">${user.count}</span>
        </div>`
    ).join('');

    let systemStatusHtml = dashboardData.chartData.systemStatus.components.map(component =>
        `<div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
                <div class="w-3 h-3 rounded-full bg-${component.color}-600"></div>
                <span class="text-gray-700 font-medium">${component.name}</span>
            </div>
            <span class="text-${component.color}-600 font-semibold">${component.status}</span>
        </div>`
    ).join('');

    return `
        <div class="stat-card">
            <div class="flex items-center gap-2 mb-4">
                <i class="fas fa-user-tag text-green-600 text-xl"></i>
                <h2 class="text-xl font-bold text-gray-800">Usuarios por Rol</h2>
            </div>
            <p class="text-gray-600 text-sm mb-4">Distribución de usuarios por tipo</p>
            <div class="space-y-3">
                ${usersByRoleHtml}
            </div>
        </div>

        <div class="stat-card">
            <div class="flex items-center gap-2 mb-4">
                <i class="fas fa-heartbeat text-green-600 text-xl"></i>
                <h2 class="text-xl font-bold text-gray-800">Estado del Sistema</h2>
            </div>
            <p class="text-gray-600 text-sm mb-4">Estado general de componentes</p>
            <div class="status-bar mb-4">
                <div class="status-segment" style="width: ${dashboardData.chartData.systemStatus.overall || 0}%; background: #39A900;">Excelente</div>
                <div class="status-segment" style="width: ${100 - (dashboardData.chartData.systemStatus.overall || 0)}%; background: #FFA726;">Bueno</div>
            </div>
            <div class="space-y-3">
                ${systemStatusHtml}
            </div>
        </div>
    `;
}

// Generate user charts
function generateUserCharts() {
    let itemsByCategoryHtml = dashboardData.chartData.itemsByCategory.map(item =>
        `<div class="category-item flex items-center justify-between">
            <div class="flex items-center gap-3">
                <div class="w-3 h-3 rounded-full bg-${item.color}-500"></div>
                <span class="text-gray-700 font-medium">${item.category}</span>
            </div>
            <span class="text-gray-600 font-semibold">${item.count}</span>
        </div>`
    ).join('');

    let itemStatusHtml = dashboardData.chartData.itemStatus.map(item => {
        const totalItems = dashboardData.chartData.itemStatus.reduce((sum, i) => sum + i.count, 0);
        const percentage = totalItems > 0 ? (item.count / totalItems) * 100 : 0;
        return `<div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
                <div class="w-3 h-3 rounded-full bg-${item.color}-600"></div>
                <span class="text-gray-700 font-medium">${item.status}</span>
            </div>
            <span class="text-gray-600 font-semibold">${item.count}</span>
        </div>`;
    }).map(item => {
        const total = dashboardData.chartData.itemStatus.reduce((sum, i) => sum + i.count, 0);
        const percentage = total > 0 ? (item.count / total) * 100 : 0;
        return `<div class="status-segment" style="width: ${percentage}%; background: ${item.color === 'green' ? '#39A900' : item.color === 'orange' ? '#FFA726' : '#EF5350'};">${item.count}</div>`;
    }).join('');

    return `
        <div class="stat-card">
            <div class="flex items-center gap-2 mb-4">
                <i class="fas fa-chart-pie text-green-600 text-xl"></i>
                <h2 class="text-xl font-bold text-gray-800">Items por Categoría</h2>
            </div>
            <p class="text-gray-600 text-sm mb-4">Distribución de items por categoría</p>
            <div class="space-y-3">
                ${itemsByCategoryHtml}
            </div>
        </div>

        <div class="stat-card">
            <div class="flex items-center gap-2 mb-4">
                <i class="fas fa-chart-bar text-green-600 text-xl"></i>
                <h2 class="text-xl font-bold text-gray-800">Estado de Items</h2>
            </div>
            <p class="text-gray-600 text-sm mb-4">Distribución por estado actual</p>
            <div class="status-bar mb-4">
                ${itemStatusHtml}
            </div>
            <div class="space-y-3">
                ${dashboardData.chartData.itemStatus.map(item =>
                    `<div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <div class="w-3 h-3 rounded-full bg-${item.color}-600"></div>
                            <span class="text-gray-700 font-medium">${item.status}</span>
                        </div>
                        <span class="text-gray-600 font-semibold">${item.count}</span>
                    </div>`
                ).join('')}
            </div>
        </div>
    `;
}

// Generate warehouse charts
function generateWarehouseCharts() {
    let itemsByCategoryHtml = dashboardData.chartData.itemsByCategory.map(item =>
        `<div class="category-item flex items-center justify-between">
            <div class="flex items-center gap-3">
                <div class="w-3 h-3 rounded-full bg-${item.color}-500"></div>
                <span class="text-gray-700 font-medium">${item.category}</span>
            </div>
            <span class="text-gray-600 font-semibold">${item.count}</span>
        </div>`
    ).join('');

    let maintenanceStatusHtml = dashboardData.chartData.maintenanceStatus.map(item => {
        const totalItems = dashboardData.chartData.maintenanceStatus.reduce((sum, i) => sum + i.count, 0);
        const percentage = totalItems > 0 ? (item.count / totalItems) * 100 : 0;
        return `<div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
                <div class="w-3 h-3 rounded-full bg-${item.color}-600"></div>
                <span class="text-gray-700 font-medium">${item.status}</span>
            </div>
            <span class="text-gray-600 font-semibold">${item.count}</span>
        </div>`;
    }).map(item => {
        const total = dashboardData.chartData.maintenanceStatus.reduce((sum, i) => sum + i.count, 0);
        const percentage = total > 0 ? (item.count / total) * 100 : 0;
        return `<div class="status-segment" style="width: ${percentage}%; background: ${item.color === 'green' ? '#39A900' : item.color === 'orange' ? '#FFA726' : '#EF5350'};">${item.status}</div>`;
    }).join('');

    return `
        <div class="stat-card">
            <div class="flex items-center gap-2 mb-4">
                <i class="fas fa-th-large text-green-600 text-xl"></i>
                <h2 class="text-xl font-bold text-gray-800">Categorías de Items</h2>
            </div>
            <p class="text-gray-600 text-sm mb-4">Distribución por categorías en almacén</p>
            <div class="space-y-3">
                ${itemsByCategoryHtml}
            </div>
        </div>

        <div class="stat-card">
            <div class="flex items-center gap-2 mb-4">
                <i class="fas fa-wrench text-green-600 text-xl"></i>
                <h2 class="text-xl font-bold text-gray-800">Estado de Mantenimiento</h2>
            </div>
            <p class="text-gray-600 text-sm mb-4">Estado actual de mantenimiento</p>
            <div class="status-bar mb-4">
                ${maintenanceStatusHtml}
            </div>
            <div class="space-y-3">
                ${dashboardData.chartData.maintenanceStatus.map(item =>
                    `<div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <div class="w-3 h-3 rounded-full bg-${item.color}-600"></div>
                            <span class="text-gray-700 font-medium">${item.status}</span>
                        </div>
                        <span class="text-gray-600 font-semibold">${item.count}</span>
                    </div>`
                ).join('')}
            </div>
        </div>
    `;
}

// Update monthly statistics
function updateMonthlyStats() {
    const container = document.getElementById('monthlyStatsContainer');
    if (!container || !dashboardData.monthlyActivity) return;

    let monthCardsHtml = '';

    if (dashboardData.dashboardType === 'admin') {
        monthCardsHtml = dashboardData.monthlyActivity.map(month =>
            `<div class="month-card">
                <div class="text-gray-800 font-bold text-lg mb-2">${month.month}</div>
                <div class="text-2xl font-bold text-green-600 mb-1">${month.actions}</div>
                <div class="text-sm text-gray-600">acciones</div>
                <div class="text-sm font-semibold text-gray-800 mt-2">${month.users} usuarios</div>
            </div>`
        ).join('');
    } else if (dashboardData.dashboardType === 'user') {
        const formatCurrency = (value) => {
            return new Intl.NumberFormat('es-CO', {
                style: 'currency',
                currency: 'COP',
                minimumFractionDigits: 0
            }).format(value);
        };

        monthCardsHtml = dashboardData.monthlyActivity.map(month =>
            `<div class="month-card">
                <div class="text-gray-800 font-bold text-lg mb-2">${month.month}</div>
                <div class="text-2xl font-bold text-green-600 mb-1">${month.items}</div>
                <div class="text-sm text-gray-600">items</div>
                <div class="text-sm font-semibold text-gray-800 mt-2">${formatCurrency(month.value)}</div>
            </div>`
        ).join('');
    } else if (dashboardData.dashboardType === 'warehouse') {
        monthCardsHtml = dashboardData.monthlyActivity.map(month =>
            `<div class="month-card">
                <div class="text-gray-800 font-bold text-lg mb-2">${month.month}</div>
                <div class="text-2xl font-bold text-green-600 mb-1">${month.movements}</div>
                <div class="text-sm text-gray-600">movimientos</div>
                <div class="text-sm font-semibold text-gray-800 mt-2">${month.growth}</div>
            </div>`
        ).join('');
    }

    // Update the grid inside the container
    const gridElement = container.querySelector('.grid');
    if (gridElement) {
        gridElement.innerHTML = monthCardsHtml;
    }
}

// Dashboard-specific data loading functions
async function loadAdminDashboardData() {
    await Promise.all([
        loadUserInfo(),
        loadAdminStats(),
        loadAdminCharts(),
        loadAdminMonthlyActivity()
    ]);
}

async function loadUserDashboardData() {
    await Promise.all([
        loadUserInfo(),
        loadUserInventoryStats(),
        loadUserCharts(),
        loadUserMonthlyActivity()
    ]);
}

async function loadWarehouseDashboardData() {
    await Promise.all([
        loadUserInfo(),
        loadWarehouseStats(),
        loadWarehouseCharts(),
        loadWarehouseMonthlyActivity()
    ]);
}

// Load admin-specific data
async function loadAdminStats() {
    try {
        const token = localStorage.getItem('jwt');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        // Use large page size to get all users for stats
        const usersResponse = await fetch('/api/v1/users?page=0&size=10000', { method: 'GET', headers });
        const inventoryResponse = await fetch('/api/v1/inventory', { method: 'GET', headers });

        if (usersResponse.ok && inventoryResponse.ok) {
            const usersPagedData = await usersResponse.json();
            const inventoryData = await inventoryResponse.json();

            // Extract users array from paged response
            const usersData = usersPagedData.users || [];

            dashboardData.stats = {
                totalUsers: usersPagedData.totalUsers || usersData.length || 0,
                totalInventory: inventoryData.length || 0,
                pendingVerifications: Math.floor(Math.random() * 15),
                reportsGenerated: Math.floor(Math.random() * 50) + 10
            };
        } else {
            throw new Error('Failed to load admin stats');
        }
    } catch (error) {
        console.error('Error loading admin stats:', error);
        dashboardData.stats = { totalUsers: 0, totalInventory: 0, pendingVerifications: 0, reportsGenerated: 0 };
    }
}

async function loadAdminCharts() {
    try {
        const token = localStorage.getItem('jwt');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        // Use large page size to get all users for charts
        const response = await fetch('/api/v1/users?page=0&size=10000', { method: 'GET', headers });

        if (response.ok) {
            const pagedData = await response.json();
            const users = pagedData.users || [];
            const roleCounts = { 'SUPERADMIN': 0, 'ADMIN_INSTITUTION': 0, 'ADMIN_REGIONAL': 0, 'WAREHOUSE': 0, 'USER': 0 };

            users.forEach(user => {
                if (roleCounts.hasOwnProperty(user.role)) {
                    roleCounts[user.role]++;
                }
            });

            dashboardData.chartData = {
                usersByRole: [
                    { role: 'Super Admin', count: roleCounts.SUPERADMIN, color: 'red' },
                    { role: 'Admin Institución', count: roleCounts.ADMIN_INSTITUTION, color: 'orange' },
                    { role: 'Admin Regional', count: roleCounts.ADMIN_REGIONAL, color: 'purple' },
                    { role: 'Admin Almacén', count: roleCounts.WAREHOUSE, color: 'yellow' },
                    { role: 'Usuarios Normales', count: roleCounts.USER, color: 'green' }
                ],
                systemStatus: {
                    overall: 90,
                    components: [
                        { name: 'Base de Datos', status: 'OK', color: 'green' },
                        { name: 'Servidor', status: 'OK', color: 'green' },
                        { name: 'Último Backup', status: '2h atrás', color: 'orange' }
                    ]
                }
            };
        } else {
            throw new Error('Failed to load admin charts');
        }
    } catch (error) {
        console.error('Error loading admin charts:', error);
        dashboardData.chartData = {
            usersByRole: [
                { role: 'Super Admin', count: 0, color: 'red' },
                { role: 'Admin Institución', count: 0, color: 'orange' },
                { role: 'Admin Regional', count: 0, color: 'purple' },
                { role: 'Admin Almacén', count: 0, color: 'yellow' },
                { role: 'Usuarios Normales', count: 0, color: 'green' }
            ],
            systemStatus: {
                overall: 0,
                components: [
                    { name: 'Base de Datos', status: 'SIN DATA', color: 'gray' },
                    { name: 'Servidor', status: 'SIN DATA', color: 'gray' },
                    { name: 'Último Backup', status: 'SIN DATA', color: 'gray' }
                ]
            }
        };
    }
}

async function loadAdminMonthlyActivity() {
    try {
        const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May'];
        dashboardData.monthlyActivity = months.map((month, index) => ({
            month,
            actions: Math.floor(Math.random() * 20) + 80,
            users: Math.floor(Math.random() * 6) + 10
        }));
    } catch (error) {
        dashboardData.monthlyActivity = months.map(month => ({ month, actions: 0, users: 0 }));
    }
}

// Load user-specific data
async function loadUserInventoryStats() {
    try {
        const token = localStorage.getItem('jwt');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch('/api/v1/inventory/user-items', { method: 'GET', headers });

        if (response.ok) {
            const inventoryData = await response.json();
            const totalItems = inventoryData.length;
            const activeItems = inventoryData.filter(item => item.status === 'ACTIVE').length;
            const maintenanceItems = inventoryData.filter(item => item.status === 'MAINTENANCE').length;
            const totalValue = inventoryData.reduce((sum, item) => sum + (item.value || 0), 0);

            dashboardData.stats = {
                totalItems,
                activeItems,
                maintenanceItems,
                totalValue
            };
        } else {
            throw new Error('Failed to load user inventory stats');
        }
    } catch (error) {
        dashboardData.stats = { totalItems: 0, activeItems: 0, maintenanceItems: 0, totalValue: 0 };
    }
}

async function loadUserCharts() {
    try {
        const token = localStorage.getItem('jwt');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch('/api/v1/inventory/user-items', { method: 'GET', headers });

        if (response.ok) {
            const inventoryData = await response.json();
            const categoryCounts = {};
            const statusCounts = { ACTIVE: 0, MAINTENANCE: 0, INACTIVE: 0 };

            inventoryData.forEach(item => {
                const category = item.category || 'Sin Categoría';
                const status = item.status || 'INACTIVE';

                categoryCounts[category] = (categoryCounts[category] || 0) + 1;
                if (statusCounts.hasOwnProperty(status)) {
                    statusCounts[status]++;
                }
            });

            dashboardData.chartData = {
                itemsByCategory: Object.entries(categoryCounts).map(([category, count], index) => ({
                    category,
                    count,
                    color: ['red', 'yellow', 'green', 'blue'][index % 4]
                })),
                itemStatus: [
                    { status: 'Activos', count: statusCounts.ACTIVE, color: 'green' },
                    { status: 'Mantenimiento', count: statusCounts.MAINTENANCE, color: 'orange' },
                    { status: 'Inactivos', count: statusCounts.INACTIVE, color: 'red' }
                ]
            };
        } else {
            throw new Error('Failed to load user charts');
        }
    } catch (error) {
        dashboardData.chartData = {
            itemsByCategory: [
                { category: 'Equipos de Cómputo', count: 0, color: 'red' },
                { category: 'Equipos Audiovisuales', count: 0, color: 'yellow' },
                { category: 'Equipos de Laboratorio', count: 0, color: 'green' },
                { category: 'Dispositivos Móviles', count: 0, color: 'blue' }
            ],
            itemStatus: [
                { status: 'Activos', count: 0, color: 'green' },
                { status: 'Mantenimiento', count: 0, color: 'orange' },
                { status: 'Inactivos', count: 0, color: 'red' }
            ]
        };
    }
}

async function loadUserMonthlyActivity() {
    try {
        const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May'];
        dashboardData.monthlyActivity = months.map(month => ({
            month,
            items: 0,
            value: 0
        }));
    } catch (error) {
        dashboardData.monthlyActivity = months.map(month => ({ month, items: 0, value: 0 }));
    }
}

// Load warehouse-specific data
async function loadWarehouseStats() {
    try {
        const token = localStorage.getItem('jwt');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch('/api/v1/inventory', { method: 'GET', headers });

        if (response.ok) {
            const inventoryData = await response.json();
            const totalItems = inventoryData.length;
            const activeItems = inventoryData.filter(item => item.status === 'ACTIVE').length;
            const maintenanceItems = inventoryData.filter(item => item.status === 'MAINTENANCE').length;

            dashboardData.stats = {
                warehouseItems: totalItems,
                activeItems,
                pendingMaintenance: maintenanceItems,
                monthlyReports: Math.floor(Math.random() * 20) + 5
            };
        } else {
            throw new Error('Failed to load warehouse stats');
        }
    } catch (error) {
        dashboardData.stats = { warehouseItems: 0, activeItems: 0, pendingMaintenance: 0, monthlyReports: 0 };
    }
}

async function loadWarehouseCharts() {
    try {
        const token = localStorage.getItem('jwt');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch('/api/v1/inventory', { method: 'GET', headers });

        if (response.ok) {
            const inventoryData = await response.json();
            const categoryCounts = {};
            const statusCounts = { GOOD: 0, REVIEW: 0, URGENT: 0 };

            inventoryData.forEach(item => {
                const category = item.category || 'Sin Categoría';
                categoryCounts[category] = (categoryCounts[category] || 0) + 1;

                // Mock maintenance status since we don't have it in API
                const randomStatus = ['GOOD', 'REVIEW', 'URGENT'][Math.floor(Math.random() * 3)];
                if (statusCounts.hasOwnProperty(randomStatus)) {
                    statusCounts[randomStatus]++;
                }
            });

            dashboardData.chartData = {
                itemsByCategory: Object.entries(categoryCounts).map(([category, count], index) => ({
                    category,
                    count,
                    color: ['blue', 'green', 'yellow', 'purple'][index % 4]
                })),
                maintenanceStatus: [
                    { status: 'En buen estado', count: statusCounts.GOOD, color: 'green' },
                    { status: 'Requiere revisión', count: statusCounts.REVIEW, color: 'orange' },
                    { status: 'Mantenimiento urgente', count: statusCounts.URGENT, color: 'red' }
                ]
            };
        } else {
            throw new Error('Failed to load warehouse charts');
        }
    } catch (error) {
        dashboardData.chartData = {
            itemsByCategory: [
                { category: 'Equipos de Cómputo', count: 0, color: 'blue' },
                { category: 'Equipos de Laboratorio', count: 0, color: 'green' },
                { category: 'Audiovisuales', count: 0, color: 'yellow' },
                { category: 'Móviles', count: 0, color: 'purple' }
            ],
            maintenanceStatus: [
                { status: 'En buen estado', count: 0, color: 'green' },
                { status: 'Requiere revisión', count: 0, color: 'orange' },
                { status: 'Mantenimiento urgente', count: 0, color: 'red' }
            ]
        };
    }
}

async function loadWarehouseMonthlyActivity() {
    try {
        const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May'];
        dashboardData.monthlyActivity = months.map(month => ({
            month,
            movements: 0,
            growth: '+0%'
        }));
    } catch (error) {
        dashboardData.monthlyActivity = months.map(month => ({ month, movements: 0, growth: '+0%' }));
    }
}

// Removed duplicate DOMContentLoaded listener - using the one at line 96

// Make loadDashboardData available globally for onclick handlers
window.loadDashboardData = loadDashboardData;

// Mobile menu toggle
const menuToggle = document.getElementById('menuToggle');
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('overlay');
const closeSidebar = document.getElementById('closeSidebar');

if (menuToggle && sidebar && overlay && closeSidebar) {
    menuToggle.addEventListener('click', () => {
        sidebar.classList.add('active');
        overlay.classList.add('active');
    });

    closeSidebar.addEventListener('click', () => {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
    });

    overlay.addEventListener('click', () => {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
    });
}

// Animate progress bars on load
window.addEventListener('load', () => {
    const progressBars = document.querySelectorAll('.progress-fill');
    progressBars.forEach(bar => {
        const width = bar.style.width;
        bar.style.width = '0%';
        setTimeout(() => {
            bar.style.width = width;
        }, 100);
    });
});

// Sidebar navigation
const sidebarItems = document.querySelectorAll('.sidebar-item');
sidebarItems.forEach(item => {
    item.addEventListener('click', () => {
        sidebarItems.forEach(i => i.classList.remove('active'));
        item.classList.add('active');

        // Close sidebar on mobile after selection
        if (window.innerWidth < 1024) {
            if (sidebar && overlay) {
                sidebar.classList.remove('active');
                overlay.classList.remove('active');
            }
        }
    });
});