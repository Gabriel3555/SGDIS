// Helper function to create image with loading spinner
function createImageWithSpinner(
  imgUrl,
  alt,
  className,
  size = "w-8 h-8",
  shape = "rounded-full"
) {
  if (!imgUrl) {
    return null;
  }

  const uniqueId = "img-" + Math.random().toString(36).substr(2, 9);
  return `
        <div class="relative ${size} ${shape} overflow-hidden" id="img-container-${uniqueId}">
            <div class="absolute inset-0 flex items-center justify-center bg-gray-100" id="spinner-${uniqueId}">
                <div class="image-loading-spinner"></div>
            </div>
            <img src="${imgUrl}" alt="${alt}" class="${className} opacity-0 transition-opacity duration-300" 
                 id="img-${uniqueId}"
                 onload="(function() { const img = document.getElementById('img-${uniqueId}'); const spinner = document.getElementById('spinner-${uniqueId}'); if (img) img.classList.remove('opacity-0'); if (spinner) spinner.style.display='none'; })();"
                 onerror="(function() { const spinner = document.getElementById('spinner-${uniqueId}'); const container = document.getElementById('img-container-${uniqueId}'); if (spinner) spinner.style.display='none'; if (container) container.innerHTML='<div class=\\'w-full h-full bg-gray-200 flex items-center justify-center text-gray-400\\'><i class=\\'fas fa-user\\'></i></div>'; })();">
        </div>
    `;
}

function updateUsersUI() {
  updateUserStats();
  // Only update filters if they don't exist yet (to prevent constant recreation)
  const container = document.getElementById("searchFilterContainer");
  const hasFilters = container && container.querySelector('#userRegionalFilter');
  if (!hasFilters) {
    updateSearchAndFilters();
  }
  updateViewModeButtons();
  const viewMode = (window.usersData || usersData)?.viewMode || "table";
  if (viewMode === "table") {
    updateUsersTable();
  } else {
    updateUsersCards();
  }
  updatePagination();
}

function updateUserStats() {
  const container = document.getElementById("userStatsContainer");
  if (!container) return;

  if (!window.usersData) {
    return;
  }

  const currentRole = window.usersData ? window.usersData.currentLoggedInUserRole : '';
  const isAdminInstitution = currentRole === 'ADMIN_INSTITUTION';
  const isAdminRegional = currentRole === 'ADMIN_REGIONAL' || 
                         (window.location.pathname && window.location.pathname.includes('/admin_regional'));
  const isWarehouse = currentRole === 'WAREHOUSE' ||
                     (window.location.pathname && window.location.pathname.includes('/warehouse'));
  const isSuperAdmin = currentRole === 'SUPERADMIN';

  // Use statistics from endpoint if available (for SUPERADMIN), otherwise calculate from current page
  // Exclude SUPERADMIN users from statistics
  let totalUsers, adminInstitutionCount, adminRegionalCount, warehouseCount, userCount;

  if (isSuperAdmin && window.usersData.statistics) {
    // Use total statistics from endpoint (excluding SUPERADMIN)
    const stats = window.usersData.statistics;
    totalUsers = (stats.totalUsers || 0) - (stats.superadminCount || 0);
    adminInstitutionCount = stats.adminInstitutionCount || 0;
    adminRegionalCount = stats.adminRegionalCount || 0;
    warehouseCount = stats.warehouseCount || 0;
    userCount = stats.userCount || 0;
  } else {
    // Fallback to local calculation from current page data (excluding SUPERADMIN)
    if (!window.usersData.users) {
      return;
    }
    const usersWithoutSuperAdmin = window.usersData.users.filter(
      (u) => u && u.role !== "SUPERADMIN"
    );
    totalUsers = usersWithoutSuperAdmin.length;
    adminInstitutionCount = usersWithoutSuperAdmin.filter(
      (u) => u && u.role === "ADMIN_INSTITUTION"
    ).length;
    adminRegionalCount = usersWithoutSuperAdmin.filter(
      (u) => u && u.role === "ADMIN_REGIONAL"
    ).length;
    warehouseCount = usersWithoutSuperAdmin.filter(
      (u) => u && u.role === "WAREHOUSE"
    ).length;
    userCount = usersWithoutSuperAdmin.filter(
      (u) => u && u.role === "USER"
    ).length;
  }
  
  container.innerHTML = `

        ${!isAdminInstitution && !isWarehouse ? `<div class="stat-card">
            <div class="flex items-start justify-between mb-3">
                <div>
                    <p class="text-gray-600 text-sm font-medium mb-1">Admin Institución</p>
                    <h3 class="text-3xl font-bold text-gray-800">${adminInstitutionCount}</h3>
                </div>
                <div class="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <i class="fas fa-building text-purple-600 text-xl"></i>
                </div>
            </div>
            <p class="text-purple-600 text-sm font-medium">Administradores de institución</p>
        </div>` : ''}

        ${!isAdminInstitution && !isWarehouse ? `<div class="stat-card">
            <div class="flex items-start justify-between mb-3">
                <div>
                    <p class="text-gray-600 text-sm font-medium mb-1">Admin Regional</p>
                    <h3 class="text-3xl font-bold text-gray-800">${adminRegionalCount}</h3>
                </div>
                <div class="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                    <i class="fas fa-map-marker-alt text-orange-600 text-xl"></i>
                </div>
            </div>
            <p class="text-orange-600 text-sm font-medium">Administradores regionales</p>
        </div>` : ''}

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
                    <i class="fas fa-users text-[#00AF00] text-xl"></i>
                </div>
            </div>
            <p class="text-[#00AF00] text-sm font-medium">Usuarios del sistema</p>
        </div>
    `;
}

function updateSearchAndFilters() {
  const container = document.getElementById("searchFilterContainer");
  if (!container) return;

  // Check if user is super admin
  const path = window.location.pathname || '';
  const isSuperAdmin = (window.currentUserRole && window.currentUserRole.toUpperCase() === 'SUPERADMIN') || 
                       path.includes('/superadmin');

  const existingInput = document.getElementById("filterUserSearch");
  const currentSearchTerm = window.usersData ? window.usersData.searchTerm : "";

  // For super admin, check if filters already exist and institutions are loaded
  if (isSuperAdmin) {
    const existingRegionalSelect = document.getElementById('filterRegionalSelect');
    const existingInstitutionSelect = document.getElementById('filterInstitutionSelect');
    // If filters exist, don't recreate them to prevent interruption
    if (existingRegionalSelect && existingInstitutionSelect) {
      // Just update the search input if needed
      if (existingInput && existingInput.value !== currentSearchTerm) {
        existingInput.value = currentSearchTerm;
      }
      // Update selected values if they changed
      const currentRegional = window.usersData?.selectedRegional || '';
      const currentInstitution = window.usersData?.selectedInstitution || '';
      if (window.filterRegionalSelect && currentRegional) {
        window.filterRegionalSelect.setValue(currentRegional);
      }
      if (window.filterInstitutionSelect && currentInstitution) {
        window.filterInstitutionSelect.setValue(currentInstitution);
      }
      return;
    }
  }

  if (existingInput && existingInput.value === currentSearchTerm && !isSuperAdmin) {
    return;
  }

  // Build regional and institution filters HTML for super admin
  let regionalInstitutionFilters = '';
  if (isSuperAdmin) {
    const selectedRegional = window.usersData?.selectedRegional || '';
    const selectedInstitution = window.usersData?.selectedInstitution || '';
    
    regionalInstitutionFilters = `
      <div class="custom-select-container" style="min-width: 180px; flex-shrink: 0;">
        <div class="custom-select" id="filterRegionalSelect">
          <div class="custom-select-trigger" style="padding: 0.75rem 1rem; height: 56px; display: flex; align-items: center;">
            <span class="custom-select-text">Todas las regionales</span>
            <i class="fas fa-chevron-down custom-select-arrow"></i>
          </div>
          <div class="custom-select-dropdown">
            <input type="text" class="custom-select-search" placeholder="Buscar regional...">
            <div class="custom-select-options" id="filterRegionalOptions">
              <!-- Options loaded dynamically -->
            </div>
          </div>
        </div>
        <input type="hidden" id="userRegionalFilter" name="regional">
      </div>
      <div class="custom-select-container" style="min-width: 180px; flex-shrink: 0;">
        <div class="custom-select" id="filterInstitutionSelect">
          <div class="custom-select-trigger" style="padding: 0.75rem 1rem; height: 56px; display: flex; align-items: center;">
            <span class="custom-select-text">Todas las instituciones</span>
            <i class="fas fa-chevron-down custom-select-arrow"></i>
          </div>
          <div class="custom-select-dropdown">
            <input type="text" class="custom-select-search" placeholder="Buscar institución...">
            <div class="custom-select-options" id="filterInstitutionOptions">
              <!-- Options loaded dynamically -->
            </div>
          </div>
        </div>
        <input type="hidden" id="userInstitutionFilter" name="institution">
      </div>
    `;
  }

  container.innerHTML = `
        <div class="flex gap-2 items-end w-full flex-nowrap overflow-x-visible" style="overflow-x: visible !important;">
            <div class="relative flex-1" style="min-width: 250px;">
                <i class="fas fa-search absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500"></i>
                <input type="text" id="filterUserSearch" value="${currentSearchTerm}" placeholder="Buscar por nombre, email o rol..." class="w-full pl-12 pr-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00AF00] transition-all bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" style="height: 56px; font-size: 0.9375rem;">
            </div>
            <button onclick="handleSearchButton()" class="px-4 border-2 border-[#00AF00] text-white rounded-xl hover:bg-[#008800] transition-colors bg-[#00AF00] focus:outline-none focus:ring-2 focus:ring-[#00AF00] flex items-center justify-center font-medium shadow-sm hover:shadow-md" style="height: 56px; min-width: 56px; flex-shrink: 0;" title="Buscar">
                <i class="fas fa-search"></i>
            </button>
            ${regionalInstitutionFilters}
            <div class="custom-select-container" style="min-width: 180px; flex-shrink: 0;">
                <div class="custom-select" id="filterRoleSelect">
                    <div class="custom-select-trigger" style="padding: 0.75rem 1rem; height: 56px; display: flex; align-items: center;">
                        <span class="custom-select-text">Todos los roles</span>
                        <i class="fas fa-chevron-down custom-select-arrow"></i>
                    </div>
                    <div class="custom-select-dropdown">
                        <input type="text" class="custom-select-search" placeholder="Buscar rol...">
                        <div class="custom-select-options" id="filterRoleOptions">
                            <!-- Options loaded dynamically -->
                        </div>
                    </div>
                </div>
                <input type="hidden" id="filterRole" name="role">
            </div>
            <div class="custom-select-container" style="min-width: 180px; flex-shrink: 0;">
                <div class="custom-select" id="filterStatusSelect">
                    <div class="custom-select-trigger" style="padding: 0.75rem 1rem; height: 56px; display: flex; align-items: center;">
                        <span class="custom-select-text">Todos los estados</span>
                        <i class="fas fa-chevron-down custom-select-arrow"></i>
                    </div>
                    <div class="custom-select-dropdown">
                        <input type="text" class="custom-select-search" placeholder="Buscar estado...">
                        <div class="custom-select-options" id="filterStatusOptions">
                            <!-- Options loaded dynamically -->
                        </div>
                    </div>
                </div>
                <input type="hidden" id="filterStatus" name="status">
            </div>
        </div>
    `;

  // Initialize CustomSelects for filters first (with delay to ensure DOM and scripts are ready)
  setTimeout(() => {
    initializeFilterSelects();
    
    // Load regionals and institutions after CustomSelects are initialized
    const isSuperAdmin = (window.usersData?.currentLoggedInUserRole && window.usersData.currentLoggedInUserRole.toUpperCase() === 'SUPERADMIN') ||
                         (window.location.pathname && window.location.pathname.includes('/superadmin'));
    
    if (isSuperAdmin) {
      // Wait a bit more to ensure CustomSelects are fully ready
      // Use a function to check if CustomSelects are ready before loading data
      const waitForCustomSelects = (retries = 0, maxRetries = 10) => {
        const regionalReady = window.filterRegionalSelect && typeof window.filterRegionalSelect.setOptions === 'function';
        const institutionReady = window.filterInstitutionSelect && typeof window.filterInstitutionSelect.setOptions === 'function';
        
        if (regionalReady && institutionReady) {
          // Both are ready, load the data
          loadRegionalsForUserFilter();
          const selectedRegional = window.usersData?.selectedRegional || '';
          if (selectedRegional) {
            loadInstitutionsForUserFilter(selectedRegional);
          }
        } else if (retries < maxRetries) {
          // Not ready yet, retry after a short delay
          setTimeout(() => waitForCustomSelects(retries + 1, maxRetries), 100);
        } else {
          // Max retries reached, try to load anyway (might work if only one is needed)
          if (regionalReady) {
            loadRegionalsForUserFilter();
          }
        }
      };
      
      waitForCustomSelects();
    }
  }, 100);

  const filterSearchInput = document.getElementById("filterUserSearch");
  if (filterSearchInput && !filterSearchInput._filterSearchListeners) {
    setupSearchInputListeners(filterSearchInput, "filter");
  }
}

function setupSearchInputs() {
  if (typeof window.filterUsers !== "function") {
    return;
  }

  if (!window.usersData) {
    return;
  }

  if (window._searchInputsInitialized) {
    return;
  }

  const headerSearchInput = document.getElementById("userSearch");
  if (headerSearchInput) {
    setupSearchInputListeners(headerSearchInput, "header");
  }

  const filterSearchInput = document.getElementById("filterUserSearch");
  if (filterSearchInput) {
    setupSearchInputListeners(filterSearchInput, "filter");
  }

  window._searchInputsInitialized = true;
}

function setupSearchInputListeners(searchInput, inputType) {
  if (!window.usersData) {
    return;
  }

  if (searchInput.value !== window.usersData.searchTerm) {
    searchInput.value = window.usersData.searchTerm || "";
  }

  const listenerKey = `_${inputType}SearchListeners`;

  if (!searchInput[listenerKey]) {
    searchInput.addEventListener("input", function (e) {
      handleSearchInput(e, inputType);
    });

    searchInput.addEventListener("keyup", function (e) {
      handleSearchKeyup(e, inputType);
    });

    searchInput.addEventListener("keypress", function (e) {
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
      if (typeof window.filterUsers === "function" && window.usersData) {
        window.filterUsers();
      }
    } catch (filterError) {}
  } catch (error) {}
}

function syncSearchInputs(changedInputId, searchValue) {
  try {
    setTimeout(() => {
      if (changedInputId === "userSearch") {
        const filterInput = document.getElementById("filterUserSearch");
        if (filterInput && filterInput.value !== searchValue) {
          if (document.activeElement !== filterInput) {
            filterInput.value = searchValue;
          }
        }
      } else if (changedInputId === "filterUserSearch") {
        const headerInput = document.getElementById("userSearch");
        if (headerInput && headerInput.value !== searchValue) {
          if (document.activeElement !== headerInput) {
            headerInput.value = searchValue;
          }
        }
      }
    }, 5);
  } catch (error) {}
}

function handleSearchKeyup(e, inputType) {
  if (e.key === "Escape") {
    e.target.value = "";
    if (window.usersData) {
      window.usersData.searchTerm = "";
      window.usersData.currentPage = 1;
    }

    // Sync the other search input
    syncSearchInputs(e.target.id, "");

    if (typeof window.filterUsers === "function" && window.usersData) {
      window.filterUsers();
    }
  }
}

function handleSearchKeypress(e, inputType) {
  if (e.key === "Enter") {
    e.preventDefault();

    // Apply current search term
    if (typeof window.filterUsers === "function" && window.usersData) {
      window.filterUsers();
    }
  }
}

function handleSearchButton() {
  let searchInput = document.getElementById("userSearch");
  let inputType = "header";

  if (!searchInput || !searchInput.value.trim()) {
    searchInput = document.getElementById("filterUserSearch");
    inputType = "filter";
  }

  if (searchInput) {
    const searchValue = searchInput.value.trim();

    const finalSearchValue =
      searchValue ||
      (window.usersData ? window.usersData.searchTerm : "") ||
      "";

    // Update the data model
    if (window.usersData) {
      window.usersData.searchTerm = finalSearchValue;
      window.usersData.currentPage = 1;
    }

    syncSearchInputs(searchInput.id, finalSearchValue);

    // Apply filter immediately
    if (typeof window.filterUsers === "function" && window.usersData) {
      window.filterUsers();
    }
  }
}

function updateViewModeButtons() {
  const container = document.getElementById("viewModeButtonsContainer");
  if (!container) return;

  const isTableActive = usersData.viewMode === "table";
  const isCardsActive = usersData.viewMode === "cards";

  const currentRole = usersData ? usersData.currentLoggedInUserRole : '';
  const shouldHideCount = currentRole === 'SUPERADMIN' || currentRole === 'ADMIN_INSTITUTION';
  
  container.innerHTML = `
        <div class="flex items-center gap-2 mb-4">
            <i class="fas fa-users text-[#00AF00] text-xl"></i>
            <h2 class="text-xl font-bold text-gray-800">Usuarios del Sistema</h2>
            ${!shouldHideCount ? `<span class="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">${
              usersData ? usersData.filteredUsers.length : 0
            } usuarios</span>` : ''}
            <div class="flex items-center gap-2 ml-auto">
                <button onclick="setViewMode('table')" class="flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                  isTableActive
                    ? "bg-[#00AF00] text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }">
                    <i class="fas fa-list"></i>
                    <span class="hidden sm:inline">Lista</span>
                </button>
                <button onclick="setViewMode('cards')" class="flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                  isCardsActive
                    ? "bg-[#00AF00] text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }">
                    <i class="fas fa-th"></i>
                    <span class="hidden sm:inline">Cards</span>
                </button>
            </div>
        </div>
    `;
}

function updateUsersTable() {
  const container = document.getElementById("usersTableContainer");
  if (!container) return;

  if (!window.usersData) {
    return;
  }

  // Check if we have filters active (need local pagination)
  const hasFilters =
    window.usersData.searchTerm ||
    window.usersData.selectedRole !== "all" ||
    window.usersData.selectedStatus !== "all";

  // Get current user role and ID to filter out current user for SUPERADMIN, ADMIN_INSTITUTION, and WAREHOUSE
  const currentRole = window.usersData ? window.usersData.currentLoggedInUserRole : '';
  const currentUserId = window.usersData ? window.usersData.currentLoggedInUserId : null;
  const isSuperAdmin = (currentRole === 'SUPERADMIN') || 
                      (window.location.pathname && window.location.pathname.includes('/superadmin'));
  const isWarehouse = (currentRole === 'WAREHOUSE') ||
                     (window.location.pathname && window.location.pathname.includes('/warehouse'));
  const shouldExcludeCurrentUser = (currentRole === 'SUPERADMIN' || currentRole === 'ADMIN_INSTITUTION' || currentRole === 'WAREHOUSE') && currentUserId;

  // Filter out current user and SUPERADMIN users if needed
  let usersToDisplay = window.usersData.filteredUsers;
  
  // For superadmin, exclude all SUPERADMIN users
  if (isSuperAdmin) {
    usersToDisplay = usersToDisplay.filter(user => user && user.role !== 'SUPERADMIN');
  }
  
  // For warehouse, exclude all SUPERADMIN users (only in warehouse/users view)
  if (isWarehouse) {
    usersToDisplay = usersToDisplay.filter(user => user && user.role !== 'SUPERADMIN');
  }
  
  if (shouldExcludeCurrentUser) {
    usersToDisplay = usersToDisplay.filter(user => user && user.id !== currentUserId);
    // Limit to itemsPerPage to ensure consistent page size (especially for first page)
    if (!hasFilters && window.usersData.currentPage === 1) {
      usersToDisplay = usersToDisplay.slice(0, window.usersData.itemsPerPage);
    }
  }

  let paginatedUsers;
  if (hasFilters) {
    // Local pagination for filtered results
    const startIndex =
      (window.usersData.currentPage - 1) * window.usersData.itemsPerPage;
    const endIndex = startIndex + window.usersData.itemsPerPage;
    paginatedUsers = usersToDisplay.slice(startIndex, endIndex);
  } else {
    // Users are already paginated from backend
    paginatedUsers = usersToDisplay;
  }

  let usersTableHtml = ``;

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
                            <th class="text-center py-3 px-4 text-sm font-semibold text-gray-700">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

    paginatedUsers.forEach((user) => {
      const roleText = window.getRoleText
        ? window.getRoleText(user.role)
        : user.role;
      const statusText = user.status !== false ? "Activo" : "Inactivo";
      const statusColor = user.status !== false ? "green" : "red";
      const fullName = user.fullName || "Usuario sin nombre";
      const email = user.email || "Sin email";
      const initials = fullName.charAt(0).toUpperCase();
      const isAdmin =
        user.role === "SUPERADMIN" ||
        user.role === "ADMIN_INSTITUTION" ||
        user.role === "ADMIN_REGIONAL";
      const isCurrentUser =
        window.usersData && window.usersData.currentLoggedInUserId === user.id;

      // Build delete button HTML only if not warehouse
      const deleteButtonHtml = !isWarehouse ? `<button data-user-id="${user.id}" data-action="delete" class="user-action-btn p-2 ${
        isAdmin
          ? "text-gray-400 cursor-not-allowed opacity-50"
          : "text-red-600 hover:bg-red-50"
      } rounded-lg transition-colors" title="Eliminar" ${
        isAdmin ? "disabled" : ""
      } onclick="${isAdmin ? "return false" : `deleteUser('${user.id}')`}">
                                <i class="fas fa-trash"></i>
                            </button>` : '';

      // Build edit button HTML only if not warehouse
      const editButtonHtml = !isWarehouse ? `<button data-user-id="${user.id}" data-action="edit" class="user-action-btn p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors" title="Editar">
                                <i class="fas fa-edit"></i>
                            </button>` : '';

      const profileImage = user.imgUrl
        ? createImageWithSpinner(
            user.imgUrl,
            fullName,
            "w-full h-full object-cover border-2 border-gray-200",
            "w-8 h-8",
            "rounded-full"
          )
        : `<div class="w-8 h-8 ${
            isAdmin ? "bg-red-600" : "bg-[#00AF00]"
          } rounded-full flex items-center justify-center text-white text-sm font-bold">${initials}</div>`;

      usersTableHtml += `
                <tr class="border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                  isAdmin ? "bg-red-50" : ""
                }">
                    <td class="py-3 px-4">
                        <div class="flex items-center gap-3">
                            <button onclick="changeUserPhoto('${
                              user.id
                            }')" class="profile-image-btn ${
        user.imgUrl ? "" : "no-image"
      }" title="Cambiar foto de perfil">
                                ${profileImage}
                                <div class="image-overlay">
                                    <i class="fas fa-camera text-white text-xs"></i>
                                </div>
                            </button>
                            <div>
                                <div class="font-semibold text-gray-800 ${
                                  isAdmin ? "text-red-800" : ""
                                }">
                                    ${fullName}
                                    ${
                                      isCurrentUser
                                        ? '<span class="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">Tú</span>'
                                        : ""
                                    }
                                </div>
                                <div class="text-sm text-gray-500">${email}</div>
                            </div>
                        </div>
                    </td>
                    <td class="py-3 px-4">
                        <span class="px-2 py-1 ${
                          isAdmin
                            ? "bg-red-100 text-red-700"
                            : "bg-gray-100 text-gray-700"
                        } rounded-full text-xs font-medium">${roleText}</span>
                    </td>
                    <td class="py-3 px-4">
                        <span class="px-2 py-1 bg-${statusColor}-100 text-${statusColor}-700 rounded-full text-xs font-medium">${statusText}</span>
                    </td>
                    <td class="py-3 px-4">
                        <div class="flex items-center justify-center gap-2">
                            <button onclick="showUserPassword('${
                              user.id
                            }')" class="user-action-btn p-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors" title="Cambiar contraseña">
                                <i class="fas fa-lock"></i>
                            </button>
                            <button data-user-id="${
                              user.id
                            }" data-action="view" class="user-action-btn p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Ver">
                                <i class="fas fa-eye"></i>
                            </button>
                            ${editButtonHtml}
                            ${deleteButtonHtml}
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
  const container = document.getElementById("paginationContainer");
  if (!container) return;

  if (!window.usersData) {
    return;
  }

  // Use backend totalPages instead of calculating locally
  const totalPages = window.usersData.totalPages || 0;
  const totalUsers = window.usersData.totalUsers || 0;

  // Calculate items being shown on current page
  const startItem =
    (window.usersData.currentPage - 1) * window.usersData.itemsPerPage + 1;
  const endItem = Math.min(
    window.usersData.currentPage * window.usersData.itemsPerPage,
    totalUsers
  );

  let paginationHtml = `
        <div class="text-sm text-gray-600">
            Mostrando ${startItem}-${endItem} de ${totalUsers} usuarios
        </div>
        <div class="flex items-center gap-2 ml-auto">
    `;

  if (window.usersData && totalPages > 0) {
    paginationHtml += `
            <button onclick="changePage(${window.usersData.currentPage - 1})" ${
      window.usersData.currentPage === 1 ? "disabled" : ""
    } class="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                <i class="fas fa-chevron-left"></i>
            </button>
        `;

    const maxVisiblePages = 5;
    let startPage = Math.max(
      1,
      window.usersData.currentPage - Math.floor(maxVisiblePages / 2)
    );
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      paginationHtml += `
                <button onclick="changePage(${i})" class="px-3 py-2 border ${
        window.usersData.currentPage === i
          ? "bg-[#00AF00] text-white border-[#00AF00]"
          : "border-gray-300 text-gray-700"
      } rounded-lg hover:bg-gray-50 transition-colors">
                    ${i}
                </button>
            `;
    }

    paginationHtml += `
            <button onclick="changePage(${window.usersData.currentPage + 1})" ${
      window.usersData.currentPage === totalPages ? "disabled" : ""
    } class="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                <i class="fas fa-chevron-right"></i>
            </button>
        `;
  }

  paginationHtml += `</div>`;
  container.innerHTML = paginationHtml;
}

function updateUserInfoDisplay(userData) {
  const headerUserName = document.getElementById("headerUserName");
  const headerUserRole = document.getElementById("headerUserRole");
  const headerUserAvatar = document.getElementById("headerUserAvatar");

  if (headerUserName)
    headerUserName.textContent = userData.fullName || "Super Admin";
  if (headerUserRole) headerUserRole.textContent = userData.role || "ADMIN";

  if (headerUserAvatar) {
    if (userData.imgUrl) {
      const spinnerHtml = createImageWithSpinner(
        userData.imgUrl,
        userData.fullName || "Usuario",
        "w-full h-full object-cover",
        "w-full h-full",
        "rounded-full"
      );
      if (spinnerHtml) {
        headerUserAvatar.innerHTML = spinnerHtml;
      } else {
        headerUserAvatar.textContent = (userData.fullName || "Super Admin")
          .charAt(0)
          .toUpperCase();
      }
    } else {
      headerUserAvatar.textContent = (userData.fullName || "Super Admin")
        .charAt(0)
        .toUpperCase();
    }
  }
}

function attachActionButtonListeners() {
  const actionButtons = document.querySelectorAll(".user-action-btn");

  actionButtons.forEach((button) => {
    button.addEventListener("click", function (e) {
      e.preventDefault();
      const userId = this.getAttribute("data-user-id");
      const action = this.getAttribute("data-action");

      switch (action) {
        case "view":
          viewUser(userId);
          break;
        case "edit":
          editUser(userId);
          break;
        case "delete":
          deleteUser(userId);
          break;
        default:
      }
    });
  });
}

function resetSearchInputs() {
  window._searchInputsInitialized = false;

  const headerInput = document.getElementById("userSearch");
  const filterInput = document.getElementById("filterUserSearch");

  if (headerInput) {
    headerInput._headerSearchListeners = false;
  }
  if (filterInput) {
    filterInput._filterSearchListeners = false;
  }

  setupSearchInputs();
}

function checkSearchInputsStatus() {
  const headerInput = document.getElementById("userSearch");
  const filterInput = document.getElementById("filterUserSearch");
}

document.addEventListener("DOMContentLoaded", function () {
  function checkDependenciesAndInitialize() {
    if (
      typeof window.filterUsers === "function" &&
      window.usersData &&
      document.readyState === "complete"
    ) {
      if (!window._searchInputsInitialized) {
        setupSearchInputs();
      }
    } else {
      setTimeout(checkDependenciesAndInitialize, 50);
    }
  }

  setTimeout(checkDependenciesAndInitialize, 100);
});

// Initialize CustomSelects for role and status filters
function initializeFilterSelects() {
  // Check if CustomSelect is available
  if (
    typeof CustomSelect === "undefined" &&
    typeof window.CustomSelect === "undefined"
  ) {
    setTimeout(initializeFilterSelects, 100);
    return;
  }

  const CustomSelectClass = window.CustomSelect || CustomSelect;

  // Role filter select
  const roleSelectContainer = document.getElementById("filterRoleSelect");
  if (!roleSelectContainer) {
    return;
  }

  // Check if the container still exists in the DOM (might have been regenerated)
  const existingRoleSelect = window.filterRoleSelect;
  if (existingRoleSelect) {
    // Check if the container still exists and is the same element
    if (
      !existingRoleSelect.container ||
      !document.body.contains(existingRoleSelect.container)
    ) {
      window.filterRoleSelect = null;
    } else if (existingRoleSelect.container !== roleSelectContainer) {
      // Container was replaced with a new one
      window.filterRoleSelect = null;
    } else {
      // Check if trigger has event listeners
      const trigger = roleSelectContainer.querySelector(
        ".custom-select-trigger"
      );
      if (trigger && !trigger.hasAttribute("data-listener-attached")) {
        window.filterRoleSelect = null;
      }
    }
  }

  // Verify all required elements exist
  const roleTrigger = roleSelectContainer.querySelector(
    ".custom-select-trigger"
  );
  const roleSearchInput = roleSelectContainer.querySelector(
    ".custom-select-search"
  );
  const roleOptionsContainer = roleSelectContainer.querySelector(
    ".custom-select-options"
  );

  if (!roleTrigger || !roleSearchInput || !roleOptionsContainer) {
    return;
  }

  if (!window.filterRoleSelect) {
    const currentRole = window.usersData ? window.usersData.currentLoggedInUserRole : '';
    const isAdminInstitution = currentRole === 'ADMIN_INSTITUTION';
    const isAdminRegional = currentRole === 'ADMIN_REGIONAL' ||
                            (window.location.pathname && window.location.pathname.includes('/admin_regional'));
    const isWarehouse = currentRole === 'WAREHOUSE' ||
                       (window.location.pathname && window.location.pathname.includes('/warehouse'));
    
    // Build role options based on user role
    let roleOptions = [
      { value: "all", label: "Todos los roles" }
    ];
    
    if (isAdminRegional) {
      // Admin Regional can see Admin Institución, Almacenista, and Usuario
      roleOptions.push(
        { value: "ADMIN_INSTITUTION", label: "Admin Institución" },
        { value: "WAREHOUSE", label: "Almacenista" },
        { value: "USER", label: "Usuario" }
      );
    } else if (isAdminInstitution) {
      // Admin Institution can see limited roles
      roleOptions.push(
        { value: "WAREHOUSE", label: "Almacén" },
        { value: "USER", label: "Usuario" }
      );
    } else if (isWarehouse) {
      // Warehouse can only see Warehouse and User roles
      roleOptions.push(
        { value: "WAREHOUSE", label: "Almacén" },
        { value: "USER", label: "Usuario" }
      );
    } else {
      // Super Admin or other roles see all roles (except SUPERADMIN)
      roleOptions.push(
        { value: "ADMIN_INSTITUTION", label: "Admin Institución" },
        { value: "ADMIN_REGIONAL", label: "Admin Regional" },
        { value: "WAREHOUSE", label: "Almacén" },
        { value: "USER", label: "Usuario" }
      );
    }

    try {
      // Verify all required elements exist before creating CustomSelect
      const trigger = roleSelectContainer.querySelector(".custom-select-trigger");
      const dropdown = roleSelectContainer.querySelector(".custom-select-dropdown");
      const searchInput = roleSelectContainer.querySelector(".custom-select-search");
      const optionsContainer = roleSelectContainer.querySelector(".custom-select-options");
      const textElement = roleSelectContainer.querySelector(".custom-select-text");
      
      if (!trigger || !dropdown || !searchInput || !optionsContainer || !textElement) {
        console.error("filterRoleSelect: Required elements not found", {
          trigger: !!trigger,
          dropdown: !!dropdown,
          searchInput: !!searchInput,
          optionsContainer: !!optionsContainer,
          textElement: !!textElement
        });
        return;
      }

      window.filterRoleSelect = new CustomSelectClass("filterRoleSelect", {
        placeholder: "Todos los roles",
        onChange: function (option) {
          setRoleFilter(option.value);
        },
      });

      if (!window.filterRoleSelect || !window.filterRoleSelect.container) {
        console.error("filterRoleSelect: Failed to create CustomSelect instance");
        return;
      }

      // Verify the instance has the required methods
      if (!window.filterRoleSelect.setOptions) {
        console.error("filterRoleSelect: setOptions method not available");
        return;
      }

      // Set options immediately - CustomSelect should be ready after constructor
      if (window.filterRoleSelect && window.filterRoleSelect.setOptions) {
        window.filterRoleSelect.setOptions(roleOptions);
      } else {
        // If setOptions is not available, try again after a short delay
        setTimeout(() => {
          if (window.filterRoleSelect && window.filterRoleSelect.setOptions) {
            window.filterRoleSelect.setOptions(roleOptions);
          } else {
            console.error("filterRoleSelect: setOptions method still not available after delay");
          }
        }, 100);
      }

      // Mark trigger as having listener attached
      if (trigger) {
        trigger.setAttribute("data-listener-attached", "true");
      }
    } catch (error) {
      console.error("Error initializing filterRoleSelect:", error);
      return;
    }
  }

  // Set initial value if exists (with delay to ensure CustomSelect is fully initialized)
  setTimeout(() => {
    if (
      window.filterRoleSelect &&
      typeof window.filterRoleSelect.setValue === "function"
    ) {
      const selectedRole = window.usersData
        ? window.usersData.selectedRole || "all"
        : "all";
      window.filterRoleSelect.setValue(selectedRole);
    }
  }, 50);

  // Status filter select
  const statusSelectContainer = document.getElementById("filterStatusSelect");
  if (!statusSelectContainer) {
    return;
  }

  // Check if the container still exists in the DOM (might have been regenerated)
  const existingStatusSelect = window.filterStatusSelect;
  if (existingStatusSelect) {
    // Check if the container still exists and is the same element
    if (
      !existingStatusSelect.container ||
      !document.body.contains(existingStatusSelect.container)
    ) {
      window.filterStatusSelect = null;
    } else if (existingStatusSelect.container !== statusSelectContainer) {
      // Container was replaced with a new one
      window.filterStatusSelect = null;
    } else {
      // Check if trigger has event listeners
      const trigger = statusSelectContainer.querySelector(
        ".custom-select-trigger"
      );
      if (trigger && !trigger.hasAttribute("data-listener-attached")) {
        window.filterStatusSelect = null;
      }
    }
  }

  // Verify all required elements exist
  const statusTrigger = statusSelectContainer.querySelector(
    ".custom-select-trigger"
  );
  const statusSearchInput = statusSelectContainer.querySelector(
    ".custom-select-search"
  );
  const statusOptionsContainer = statusSelectContainer.querySelector(
    ".custom-select-options"
  );

  if (!statusTrigger || !statusSearchInput || !statusOptionsContainer) {
    return;
  }

  if (!window.filterStatusSelect) {
    const statusOptions = [
      { value: "all", label: "Todos los estados" },
      { value: "active", label: "Activos" },
      { value: "inactive", label: "Inactivos" },
    ];

    try {
      window.filterStatusSelect = new CustomSelectClass("filterStatusSelect", {
        placeholder: "Todos los estados",
        onChange: function (option) {
          setStatusFilter(option.value);
        },
      });

      if (!window.filterStatusSelect || !window.filterStatusSelect.container) {
        return;
      }

      if (window.filterStatusSelect && window.filterStatusSelect.setOptions) {
        window.filterStatusSelect.setOptions(statusOptions);
      } else {
        return;
      }

      // Mark trigger as having listener attached
      const trigger = statusSelectContainer.querySelector(
        ".custom-select-trigger"
      );
      if (trigger) {
        trigger.setAttribute("data-listener-attached", "true");
      }
    } catch (error) {
      console.error("Error initializing filterStatusSelect:", error);
      return;
    }
  }

  // Set initial value if exists (with delay to ensure CustomSelect is fully initialized)
  setTimeout(() => {
    if (
      window.filterStatusSelect &&
      typeof window.filterStatusSelect.setValue === "function"
    ) {
      const selectedStatus = window.usersData
        ? window.usersData.selectedStatus || "all"
        : "all";
      window.filterStatusSelect.setValue(selectedStatus);
    }
  }, 50);

  // Regional filter select (super admin only)
  const regionalSelectContainer = document.getElementById("filterRegionalSelect");
  if (regionalSelectContainer) {
    if (!window.filterRegionalSelect) {
      try {
        // Check if CustomSelectClass is available
        if (typeof CustomSelectClass === 'undefined' && typeof window.CustomSelect !== 'undefined') {
          window.CustomSelectClass = window.CustomSelect;
        }
        
        if (typeof CustomSelectClass === 'undefined') {
          return;
        }
        
        window.filterRegionalSelect = new CustomSelectClass("filterRegionalSelect", {
          placeholder: "Todas las regionales",
          onChange: function (option) {
            if (typeof handleUserRegionalFilterChange === 'function') {
              handleUserRegionalFilterChange(option.value);
            }
          },
        });
        
        // Initialize with empty options - will be populated by loadRegionalsForUserFilter
        if (window.filterRegionalSelect && typeof window.filterRegionalSelect.setOptions === 'function') {
          window.filterRegionalSelect.setOptions([
            { value: '', label: 'Todas las regionales' }
          ]);
        }
      } catch (error) {
        // Silently handle initialization errors
      }
    } else {
      // Already exists, verify it's still valid
      if (!window.filterRegionalSelect.setOptions || typeof window.filterRegionalSelect.setOptions !== 'function') {
        window.filterRegionalSelect = null;
        // Retry initialization
        setTimeout(() => {
          const retryContainer = document.getElementById("filterRegionalSelect");
          if (retryContainer && !window.filterRegionalSelect) {
            try {
              window.filterRegionalSelect = new CustomSelectClass("filterRegionalSelect", {
                placeholder: "Todas las regionales",
                onChange: function (option) {
                  if (typeof handleUserRegionalFilterChange === 'function') {
                    handleUserRegionalFilterChange(option.value);
                  }
                },
              });
              if (window.filterRegionalSelect && typeof window.filterRegionalSelect.setOptions === 'function') {
                window.filterRegionalSelect.setOptions([
                  { value: '', label: 'Todas las regionales' }
                ]);
              }
              } catch (error) {
              // Silently handle reinitialization errors
            }
          }
        }, 100);
      }
    }
  }

  // Institution filter select (super admin only)
  const institutionSelectContainer = document.getElementById("filterInstitutionSelect");
  if (institutionSelectContainer) {
    if (!window.filterInstitutionSelect) {
      try {
        // Check if CustomSelectClass is available
        if (typeof CustomSelectClass === 'undefined' && typeof window.CustomSelect !== 'undefined') {
          window.CustomSelectClass = window.CustomSelect;
        }
        
        if (typeof CustomSelectClass === 'undefined') {
          return;
        }
        
        window.filterInstitutionSelect = new CustomSelectClass("filterInstitutionSelect", {
          placeholder: "Todas las instituciones",
          onChange: function (option) {
            if (typeof handleUserInstitutionFilterChange === 'function') {
              handleUserInstitutionFilterChange(option.value);
            }
          },
        });
        
        // Initialize with empty options - will be populated by loadInstitutionsForUserFilter
        if (window.filterInstitutionSelect && typeof window.filterInstitutionSelect.setOptions === 'function') {
          window.filterInstitutionSelect.setOptions([
            { value: '', label: 'Todas las instituciones', disabled: true }
          ]);
        }
      } catch (error) {
        // Silently handle initialization errors
      }
    } else {
      // Already exists, verify it's still valid
      if (!window.filterInstitutionSelect.setOptions || typeof window.filterInstitutionSelect.setOptions !== 'function') {
        window.filterInstitutionSelect = null;
        // Retry initialization
        setTimeout(() => {
          const retryContainer = document.getElementById("filterInstitutionSelect");
          if (retryContainer && !window.filterInstitutionSelect) {
            try {
              window.filterInstitutionSelect = new CustomSelectClass("filterInstitutionSelect", {
                placeholder: "Todas las instituciones",
                onChange: function (option) {
                  if (typeof handleUserInstitutionFilterChange === 'function') {
                    handleUserInstitutionFilterChange(option.value);
                  }
                },
              });
              if (window.filterInstitutionSelect && typeof window.filterInstitutionSelect.setOptions === 'function') {
                window.filterInstitutionSelect.setOptions([
                  { value: '', label: 'Todas las instituciones', disabled: true }
                ]);
              }
              } catch (error) {
              // Silently handle reinitialization errors
            }
          }
        }, 100);
      }
    }
  }
}

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
function updateUsersCards() {
  const container = document.getElementById("usersTableContainer");
  if (!container) return;

  if (!window.usersData) {
    return;
  }

  // Check if we have filters active (need local pagination)
  const hasFilters =
    window.usersData.searchTerm ||
    window.usersData.selectedRole !== "all" ||
    window.usersData.selectedStatus !== "all";

  // Get current user role and ID to filter out current user for SUPERADMIN, ADMIN_INSTITUTION, and WAREHOUSE
  const currentRole = window.usersData ? window.usersData.currentLoggedInUserRole : '';
  const currentUserId = window.usersData ? window.usersData.currentLoggedInUserId : null;
  const isWarehouse = (currentRole === 'WAREHOUSE') ||
                     (window.location.pathname && window.location.pathname.includes('/warehouse'));
  const shouldExcludeCurrentUser = (currentRole === 'SUPERADMIN' || currentRole === 'ADMIN_INSTITUTION' || currentRole === 'WAREHOUSE') && currentUserId;

  // Filter out current user and SUPERADMIN users if needed
  let usersToDisplay = window.usersData.filteredUsers;
  
  // For warehouse, exclude all SUPERADMIN users (only in warehouse/users view)
  if (isWarehouse) {
    usersToDisplay = usersToDisplay.filter(user => user && user.role !== 'SUPERADMIN');
  }
  
  if (shouldExcludeCurrentUser) {
    usersToDisplay = usersToDisplay.filter(user => user && user.id !== currentUserId);
    // Limit to itemsPerPage to ensure consistent page size
    if (!hasFilters && window.usersData.currentPage === 1) {
      usersToDisplay = usersToDisplay.slice(0, window.usersData.itemsPerPage);
    }
  }

  let paginatedUsers;
  if (hasFilters) {
    // Local pagination for filtered results
    const startIndex =
      (window.usersData.currentPage - 1) * window.usersData.itemsPerPage;
    const endIndex = startIndex + window.usersData.itemsPerPage;
    paginatedUsers = usersToDisplay.slice(startIndex, endIndex);
  } else {
    // Users are already paginated from backend
    paginatedUsers = usersToDisplay;
  }

  let usersCardsHtml = ``;

  if (paginatedUsers.length === 0) {
    usersCardsHtml += `
            <div class="col-span-full text-center py-8">
                <i class="fas fa-users text-gray-300 text-4xl mb-4"></i>
                <p class="text-gray-500">No se encontraron usuarios</p>
                <p class="text-sm text-gray-400 mt-2">Intenta ajustar los filtros de búsqueda</p>
            </div>
        `;
  } else {
    usersCardsHtml += `<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">`;

    paginatedUsers.forEach((user) => {
      const roleText = window.getRoleText
        ? window.getRoleText(user.role)
        : user.role;
      const statusText = user.status !== false ? "Activo" : "Inactivo";
      const statusColor = user.status !== false ? "green" : "red";
      const fullName = user.fullName || "Usuario sin nombre";
      const email = user.email || "Sin email";
      const initials = fullName.charAt(0).toUpperCase();
      const isAdmin =
        user.role === "SUPERADMIN" ||
        user.role === "ADMIN_INSTITUTION" ||
        user.role === "ADMIN_REGIONAL";
      const isCurrentUser =
        window.usersData && window.usersData.currentLoggedInUserId === user.id;

      // Build delete button HTML only if not warehouse
      const deleteButtonHtmlCards = !isWarehouse ? `<button onclick="deleteUser('${user.id}')" class="${
        isAdmin
          ? "text-gray-400 cursor-not-allowed opacity-50"
          : "text-red-600 hover:bg-red-50"
      } p-2 rounded-lg transition-colors" title="Eliminar usuario" ${
        isAdmin ? "disabled" : ""
      }>
                            <i class="fas fa-trash"></i>
                        </button>` : '';

      // Build edit button HTML only if not warehouse (for cards)
      const editButtonHtmlCards = !isWarehouse ? `<button onclick="editUser('${user.id}')" class="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors" title="Editar usuario">
                            <i class="fas fa-edit"></i>
                        </button>` : '';

      const profileImage = user.imgUrl
        ? createImageWithSpinner(
            user.imgUrl,
            fullName,
            "w-full h-full object-cover border-2 border-gray-200 mx-auto",
            "w-16 h-16",
            "rounded-full"
          )
        : `<div class="w-16 h-16 ${
            isAdmin ? "bg-red-600" : "bg-[#00AF00]"
          } rounded-full flex items-center justify-center text-white text-xl font-bold mx-auto">${initials}</div>`;

      usersCardsHtml += `
                <div class="stat-card">
                    <div class="text-center mb-4">
                        <button onclick="changeUserPhoto('${
                          user.id
                        }')" class="profile-image-btn ${
        user.imgUrl ? "" : "no-image"
      } inline-block" title="Cambiar foto de perfil">
                            ${profileImage}
                            <div class="image-overlay">
                                <i class="fas fa-camera text-white text-xs"></i>
                            </div>
                        </button>
                        <h3 class="font-bold text-lg text-gray-800 mt-3 ${
                          isAdmin ? "text-red-800" : ""
                        }">
                            ${fullName}
                            ${
                              isCurrentUser
                                ? '<span class="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">Tú</span>'
                                : ""
                            }
                        </h3>
                        <p class="text-gray-600 text-sm">${email}</p>
                    </div>

                    <div class="space-y-3 mb-4">
                        <div class="flex justify-between items-center">
                            <span class="text-gray-600 text-sm">Rol:</span>
                            <span class="px-2 py-1 ${
                              isAdmin
                                ? "bg-red-100 text-red-700"
                                : "bg-gray-100 text-gray-700"
                            } rounded-full text-xs font-medium">${roleText}</span>
                        </div>
                        <div class="flex justify-between items-center">
                            <span class="text-gray-600 text-sm">Estado:</span>
                            <span class="px-2 py-1 bg-${statusColor}-100 text-${statusColor}-700 rounded-full text-xs font-medium">${statusText}</span>
                        </div>
                    </div>

                    <div class="flex items-center justify-center gap-2 pt-3 border-t border-gray-100">
                        <button onclick="showUserPassword('${
                          user.id
                        }')" class="p-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors" title="Cambiar contraseña">
                            <i class="fas fa-lock"></i>
                        </button>
                        <button onclick="viewUser('${
                          user.id
                        }')" class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Ver detalles">
                            <i class="fas fa-eye"></i>
                        </button>
                        ${editButtonHtmlCards}
                        ${deleteButtonHtmlCards}
                    </div>
                </div>
            `;
    });

    usersCardsHtml += `</div>`;
  }

  container.innerHTML = usersCardsHtml;
}

window.updateUsersUI = updateUsersUI;
window.updateUsersTable = updateUsersTable;
window.updateUsersCards = updateUsersCards;
window.updateUserStats = updateUserStats;
window.updatePagination = updatePagination;
window.updateSearchAndFilters = updateSearchAndFilters;
window.updateViewModeButtons = updateViewModeButtons;
window.attachActionButtonListeners = attachActionButtonListeners;
window.getRoleText = getRoleText;

window.viewUser = function (userId) {
  if (typeof window.showViewUserModal === "function") {
    window.showViewUserModal(userId);
  }
};

window.editUser = function (userId) {
  if (typeof window.showEditUserModal === "function") {
    window.showEditUserModal(userId);
  }
};

window.deleteUser = function (userId) {
  if (typeof window.showDeleteUserModal === "function") {
    window.showDeleteUserModal(userId);
  }
};

// showUserPassword is implemented in users-forms.js

// changeUserPhoto is implemented in users-images.js

// Modal placeholder functions
window.showNewUserModal = function () {
  // Placeholder - should be implemented in users-modals.js
};

window.closeNewUserModal = function () {
  // Placeholder - should be implemented in users-modals.js
};

window.closeViewUserModal = function () {
  // Placeholder - should be implemented in users-modals.js
};

window.closeEditUserModal = function () {
  // Placeholder - should be implemented in users-modals.js
};

// loadUsersData is implemented in users-api.js

window.logout = function () {
  // Placeholder - should be implemented in dashboard.js or auth
  if (typeof localStorage !== "undefined") {
    localStorage.removeItem("jwt");
  }
  window.location.href = "/";
};
