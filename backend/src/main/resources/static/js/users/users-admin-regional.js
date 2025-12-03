// Users Admin Regional - Specific functionality for ADMIN_REGIONAL role
// This file overrides or extends functionality specific to admin regional users page

/**
 * Update user statistics for admin regional
 * Shows only relevant stats: Total Usuarios, Admin Institución, Almacén, Usuarios
 * Excludes Super Admin and Admin Regional stat-cards
 */
function updateUserStatsForAdminRegional() {
  const container = document.getElementById("userStatsContainer");
  if (!container) return;

  if (!window.usersData) {
    return;
  }

  // Use statistics from endpoint if available, otherwise calculate from current page data
  let totalUsers, adminInstitutionCount, warehouseCount, userCount;

  if (window.usersData.statistics) {
    // Use total statistics from endpoint
    const stats = window.usersData.statistics;
    totalUsers = stats.totalUsers || 0;
    adminInstitutionCount = stats.adminInstitutionCount || 0;
    warehouseCount = stats.warehouseCount || 0;
    userCount = stats.userCount || 0;
  } else {
    // Fallback to local calculation from current page data
    if (!window.usersData.users || !Array.isArray(window.usersData.users)) {
      return;
    }

    adminInstitutionCount = window.usersData.users.filter(
      (u) => u && u.role === "ADMIN_INSTITUTION"
    ).length;
    warehouseCount = window.usersData.users.filter(
      (u) => u && u.role === "WAREHOUSE"
    ).length;
    userCount = window.usersData.users.filter(
      (u) => u && u.role === "USER"
    ).length;
    totalUsers = window.usersData.users.length;
  }
  
  container.innerHTML = `
        <div class="stat-card">
            <div class="flex items-start justify-between mb-3">
                <div>
                    <p class="text-gray-600 text-sm font-medium mb-1">Total Usuarios</p>
                    <h3 class="text-3xl font-bold text-gray-800">${totalUsers}</h3>
                </div>
                <div class="w-12 h-12 bg-blue-500 dark:bg-blue-600 rounded-lg flex items-center justify-center">
                    <i class="fas fa-users text-white text-xl"></i>
                </div>
            </div>
            <p class="text-blue-600 text-sm font-medium">Usuarios de la regional</p>
        </div>

        <div class="stat-card">
            <div class="flex items-start justify-between mb-3">
                <div>
                    <p class="text-gray-600 text-sm font-medium mb-1">Admin Institución</p>
                    <h3 class="text-3xl font-bold text-gray-800">${adminInstitutionCount}</h3>
                </div>
                <div class="w-12 h-12 bg-purple-500 dark:bg-purple-600 rounded-lg flex items-center justify-center">
                    <i class="fas fa-building text-white text-xl"></i>
                </div>
            </div>
            <p class="text-purple-600 text-sm font-medium">Administradores de institución</p>
        </div>

        <div class="stat-card">
            <div class="flex items-start justify-between mb-3">
                <div>
                    <p class="text-gray-600 text-sm font-medium mb-1">Almacén</p>
                    <h3 class="text-3xl font-bold text-gray-800">${warehouseCount}</h3>
                </div>
                <div class="w-12 h-12 bg-yellow-500 dark:bg-yellow-600 rounded-lg flex items-center justify-center">
                    <i class="fas fa-warehouse text-white text-xl"></i>
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
                <div class="w-12 h-12 bg-green-500 dark:bg-green-600 rounded-lg flex items-center justify-center">
                    <i class="fas fa-user text-white text-xl"></i>
                </div>
            </div>
            <p class="text-[#00AF00] text-sm font-medium">Usuarios del sistema</p>
        </div>
    `;
}

/**
 * Override updateUserStats if we're on admin_regional page
 */
function initializeAdminRegionalUsers() {
  // Check if we're on admin_regional users page
  const path = window.location.pathname || '';
  const isAdminRegionalPage = path.includes('/admin_regional/users');
  
  if (isAdminRegionalPage) {
    // Wait a bit for other scripts to load
    setTimeout(() => {
      // Override updateUserStats function
      if (typeof window.updateUserStats === 'function') {
        // Store original function for reference
        window.updateUserStatsOriginal = window.updateUserStats;
      }
      
      // Replace with admin regional version
      window.updateUserStats = updateUserStatsForAdminRegional;
      
      console.log('Admin Regional users page initialized - using custom stats function');
    }, 100);
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeAdminRegionalUsers);
} else {
  initializeAdminRegionalUsers();
}

// Export functions
window.updateUserStatsForAdminRegional = updateUserStatsForAdminRegional;
window.initializeAdminRegionalUsers = initializeAdminRegionalUsers;

