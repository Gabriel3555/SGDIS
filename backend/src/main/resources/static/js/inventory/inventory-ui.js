// Helper function to create image with loading spinner
function createImageWithSpinner(
  imgUrl,
  alt,
  className,
  size = "w-10 h-10",
  shape = "rounded-lg"
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
                 onerror="(function() { const spinner = document.getElementById('spinner-${uniqueId}'); const container = document.getElementById('img-container-${uniqueId}'); if (spinner) spinner.style.display='none'; if (container) container.innerHTML='<div class=\\'w-full h-full bg-gray-200 flex items-center justify-center text-gray-400\\'><i class=\\'fas fa-box\\'></i></div>'; })();">
        </div>
    `;
}

function updateInventoryUI() {
  // Ensure window.inventoryData is available
  if (!window.inventoryData && inventoryData) {
    window.inventoryData = inventoryData;
  }
  
  // Ensure filteredInventories exists
  if (window.inventoryData && (!window.inventoryData.filteredInventories || !Array.isArray(window.inventoryData.filteredInventories))) {
    window.inventoryData.filteredInventories = window.inventoryData.inventories ? [...window.inventoryData.inventories] : [];
  }
  
  updateInventoryStats();
  updateSearchAndFilters();
  updateViewModeButtons();
  const viewMode = (window.inventoryData || inventoryData)?.viewMode || "table";
  if (viewMode === "table") {
    updateInventoryTable();
  } else {
    updateInventoryCards();
  }
  updatePagination();
}

async function updateInventoryStats() {
  const container = document.getElementById("inventoryStatsContainer");
  if (!container) return;

  if (!window.inventoryData) {
    return;
  }

  const currentRole = window.currentUserRole || '';
  const isSuperAdmin = currentRole === 'SUPERADMIN';

  // Use statistics from endpoint if available (for SUPERADMIN), otherwise calculate from current page
  let totalInventories, activeInventories, inactiveInventories, totalItems, totalValue;

  if (isSuperAdmin && window.inventoryData.statistics) {
    // Use total statistics from endpoint
    const stats = window.inventoryData.statistics;
    totalInventories = stats.totalInventories || 0;
    activeInventories = stats.activeInventories || 0;
    inactiveInventories = stats.inactiveInventories || 0;
    totalItems = stats.totalItems || 0;
    totalValue = stats.totalValue || 0;
  } else {
    // Fallback to local calculation from current page data
    if (!window.inventoryData.inventories) {
      return;
    }
    
    totalInventories = window.inventoryData.inventories.length;
    activeInventories = window.inventoryData.inventories.filter(
      (i) => i && i.status !== false
    ).length;
    inactiveInventories = totalInventories - activeInventories;

    // Calculate total value and total items of all inventories
    totalValue = 0;
    totalItems = 0;
    try {
      const token = localStorage.getItem('jwt');
      if (token && totalInventories > 0) {
        // Fetch statistics for each inventory to get its total value and total items
        const statisticsPromises = window.inventoryData.inventories.map(async (inventory) => {
          try {
            const response = await fetch(`/api/v1/inventory/${inventory.id}/statistics`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });
            if (response.ok) {
              const stats = await response.json();
              return {
                totalValue: stats.totalValue || 0,
                totalItems: stats.totalItems || 0
              };
            }
            return { totalValue: 0, totalItems: 0 };
          } catch (error) {
            console.error(`Error fetching statistics for inventory ${inventory.id}:`, error);
            return { totalValue: 0, totalItems: 0 };
          }
        });
        
        const statistics = await Promise.all(statisticsPromises);
        totalValue = statistics.reduce((sum, stat) => sum + (stat.totalValue || 0), 0);
        totalItems = statistics.reduce((sum, stat) => sum + (stat.totalItems || 0), 0);
      }
    } catch (error) {
      console.error('Error calculating total value and items:', error);
    }
  }

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

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
                    <p class="text-gray-600 text-sm font-medium mb-1">Total Items</p>
                    <h3 class="text-3xl font-bold text-gray-800">${totalItems.toLocaleString('es-CO')}</h3>
                </div>
                <div class="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                    <i class="fas fa-cubes text-orange-600 text-xl"></i>
                </div>
            </div>
            <p class="text-orange-600 text-sm font-medium">Items en todos los inventarios</p>
        </div>

        <div class="stat-card">
            <div class="flex items-start justify-between mb-3">
                <div>
                    <p class="text-gray-600 text-sm font-medium mb-1">Valor Total</p>
                    <h3 class="text-2xl font-bold text-gray-800">${formatCurrency(totalValue)}</h3>
                </div>
                <div class="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <i class="fas fa-dollar-sign text-purple-600 text-xl"></i>
                </div>
            </div>
            <p class="text-purple-600 text-sm font-medium">Valor de todos los inventarios</p>
        </div>
    `;
}

/**
 * Initialize CustomSelects for inventory filters (regional and institution)
 */
function initializeInventoryFilterSelects() {
  // Check if CustomSelect is available
  if (typeof CustomSelect === 'undefined' && typeof window.CustomSelect === 'undefined') {
    setTimeout(initializeInventoryFilterSelects, 100);
    return;
  }

  const CustomSelectClass = window.CustomSelect || CustomSelect;

  // Regional filter select
  const regionalSelectContainer = document.getElementById("inventoryRegionalFilterSelect");
  if (regionalSelectContainer) {
    if (!window.inventoryRegionalFilterSelect) {
      try {
        window.inventoryRegionalFilterSelect = new CustomSelectClass("inventoryRegionalFilterSelect", {
          placeholder: "Todas las regionales",
          onChange: function (option) {
            if (typeof handleRegionalFilterChange === 'function') {
              handleRegionalFilterChange(option.value);
            }
          },
        });
        
        // Initialize with empty options - will be populated by loadRegionalsForFilter
        if (window.inventoryRegionalFilterSelect && typeof window.inventoryRegionalFilterSelect.setOptions === 'function') {
          window.inventoryRegionalFilterSelect.setOptions([
            { value: '', label: 'Todas las regionales' }
          ]);
        }
      } catch (error) {
        // Silently handle initialization errors
      }
    } else {
      // Already exists, verify it's still valid
      if (!window.inventoryRegionalFilterSelect.setOptions || typeof window.inventoryRegionalFilterSelect.setOptions !== 'function') {
        window.inventoryRegionalFilterSelect = null;
        // Retry initialization
        setTimeout(() => {
          const retryContainer = document.getElementById("inventoryRegionalFilterSelect");
          if (retryContainer && !window.inventoryRegionalFilterSelect) {
            try {
              window.inventoryRegionalFilterSelect = new CustomSelectClass("inventoryRegionalFilterSelect", {
                placeholder: "Todas las regionales",
                onChange: function (option) {
                  if (typeof handleRegionalFilterChange === 'function') {
                    handleRegionalFilterChange(option.value);
                  }
                },
              });
              if (window.inventoryRegionalFilterSelect && typeof window.inventoryRegionalFilterSelect.setOptions === 'function') {
                window.inventoryRegionalFilterSelect.setOptions([
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

  // Institution filter select - only initialize CustomSelect for superadmin, not for admin_regional
  const isAdminRegional = (window.currentUserRole && window.currentUserRole.toUpperCase() === 'ADMIN_REGIONAL') || 
                         (window.location.pathname && window.location.pathname.includes('/admin_regional'));
  
  if (!isAdminRegional) {
    // Only create CustomSelect for superadmin
    const institutionSelectContainer = document.getElementById("inventoryInstitutionFilterSelect");
    if (institutionSelectContainer) {
      if (!window.inventoryInstitutionFilterSelect) {
        try {
          const placeholder = "Todas las instituciones";
          
          // Verify the container has the required structure
          const trigger = institutionSelectContainer.querySelector(".custom-select-trigger");
          const textElement = institutionSelectContainer.querySelector(".custom-select-text");
          
          if (!trigger || !textElement) {
            console.warn('CustomSelect institution: Missing required elements', {
              hasTrigger: !!trigger,
              hasTextElement: !!textElement,
              containerHTML: institutionSelectContainer.innerHTML.substring(0, 200)
            });
            // Retry after a short delay
            setTimeout(() => {
              initializeInventoryFilterSelects();
            }, 200);
            return;
          }
          
          window.inventoryInstitutionFilterSelect = new CustomSelectClass("inventoryInstitutionFilterSelect", {
            placeholder: placeholder,
            onChange: function (option) {
              if (typeof handleInstitutionFilterChange === 'function') {
                handleInstitutionFilterChange(option.value);
              }
            },
          });
          
          // Verify initialization was successful
          if (!window.inventoryInstitutionFilterSelect || !window.inventoryInstitutionFilterSelect.container) {
            console.error('CustomSelect institution: Failed to initialize');
            return;
          }
          
          // Initialize with empty options - will be populated by loadInstitutionsForFilter
          if (window.inventoryInstitutionFilterSelect && typeof window.inventoryInstitutionFilterSelect.setOptions === 'function') {
            window.inventoryInstitutionFilterSelect.setOptions([
              { value: '', label: 'Todas las instituciones' }
            ]);
            // Ensure the select is enabled even if option is disabled
            if (typeof window.inventoryInstitutionFilterSelect.setDisabled === 'function') {
              window.inventoryInstitutionFilterSelect.setDisabled(false);
            }
          }
        } catch (error) {
          console.error('Error initializing institution CustomSelect:', error);
        }
      } else {
        // Already exists, verify it's still valid
        if (!window.inventoryInstitutionFilterSelect.container || !window.inventoryInstitutionFilterSelect.trigger) {
          console.warn('CustomSelect institution exists but is invalid, reinitializing...');
          window.inventoryInstitutionFilterSelect = null;
          setTimeout(() => {
            initializeInventoryFilterSelects();
          }, 100);
        }
      }
    } else {
      console.warn('CustomSelect institution: Container not found in DOM');
    }
  }
  
  // Load regionals and institutions after initialization
  // Note: isAdminRegional was already declared above in this function
  
  if (isAdminRegional) {
    // For admin_regional, load institutions from their regional automatically
    // UserResponse only contains institution name as string, so we need to fetch the full institution data
    loadRegionalInstitutionsForAdminRegional();
  } else if (window.loadRegionalsForFilter) {
    // For super admin, load regionals first
    window.loadRegionalsForFilter();
    const selectedRegional = window.inventoryData?.selectedRegional || '';
    if (selectedRegional && window.loadInstitutionsForFilter) {
      window.loadInstitutionsForFilter(selectedRegional);
    }
  }
}

// Helper function to load institutions for admin_regional
async function loadRegionalInstitutionsForAdminRegional() {
  try {
    const currentUser = window.currentUserData || {};
    const institutionName = currentUser.institution;
    
    if (!institutionName) {
      console.error('No institution name found in user data. Waiting for user data to load...');
      // Wait a bit and try again if user data is not loaded yet
      setTimeout(() => {
        const retryUser = window.currentUserData || {};
        const retryInstitutionName = retryUser.institution;
        if (retryInstitutionName) {
          loadRegionalInstitutionsForAdminRegional();
        } else {
          console.error('Institution name still not found after retry');
        }
      }, 500);
      return;
    }

    // Get token for API calls
    const token = localStorage.getItem('jwt');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    // Fetch all institutions to find the user's institution
    const institutionsResponse = await fetch('/api/v1/institutions', {
      method: 'GET',
      headers: headers
    });

    if (!institutionsResponse.ok) {
      console.error('Failed to fetch institutions');
      return;
    }

    const institutions = await institutionsResponse.json();
    const userInstitution = institutions.find(inst => inst.name === institutionName);

    if (!userInstitution) {
      console.error('User institution not found:', institutionName);
      return;
    }

    const userRegionalId = userInstitution.regionalId;

    if (!userRegionalId) {
      console.error('No regionalId found for user institution:', userInstitution);
      return;
    }

    // Fetch regional information and store it globally
    try {
      const regionalsResponse = await fetch('/api/v1/regional', {
        method: 'GET',
        headers: headers
      });

      if (regionalsResponse.ok) {
        const regionals = await regionalsResponse.json();
        const regional = regionals.find(reg => reg.id === userRegionalId);
        if (regional) {
          // Store regional info globally for console logging
          window.currentUserRegional = regional;
        }
      }
    } catch (error) {
      console.error('Error fetching regional info:', error);
    }

    // Small delay to ensure select element is created in DOM
    setTimeout(() => {
      const selectCheck = document.getElementById("inventoryInstitutionFilterSelect");
      
      if (window.loadInstitutionsForFilter) {
        window.loadInstitutionsForFilter(userRegionalId);
        
        // Add click listener to print regional and centers in console after dropdown is loaded
        setTimeout(() => {
          const institutionSelect = document.getElementById("inventoryInstitutionFilterSelect");
          if (institutionSelect) {
            // For native select, use click event
            if (institutionSelect.tagName === 'SELECT') {
              institutionSelect.addEventListener("click", (event) => {
                // Print regional in console
                if (window.currentUserRegional) {
                }
                
                // Print centers (institutions) in console
                if (window.currentUserInstitutions && Array.isArray(window.currentUserInstitutions) && window.currentUserInstitutions.length > 0) {
                  console.log('Tus Centros:', window.currentUserInstitutions);
                } else {
                  // Get from select options
                  const options = Array.from(institutionSelect.options).filter(opt => opt.value !== '');
                  if (options.length > 0) {
                    const centers = options.map(opt => ({ label: opt.textContent, value: opt.value }));
                  } else {
                  }
                }
              }, true);
            } else {
              // For CustomSelect
              const trigger = institutionSelect.querySelector(".custom-select-trigger");
              if (trigger) {
                trigger.addEventListener("click", (event) => {
                  if (window.currentUserRegional) {
                  }
                  if (window.currentUserInstitutions) {
                  }
                }, true);
              }
            }
          }
        }, 1000);
      } else {
        console.error('loadInstitutionsForFilter function not available');
      }
    }, 500);
  } catch (error) {
    console.error('Error loading regional institutions for admin_regional:', error);
  }
}

// Helper functions for stats
function updateSearchAndFilters() {
  // Only run on inventory page, not on items page
  const path = window.location.pathname || '';
  if (path.includes('/items')) {
    return; // Don't run on items page
  }
  
  const container = document.getElementById("searchFilterContainer");
  if (!container) return;

  // Check if user is super admin - check multiple ways to be sure
  const isSuperAdmin = (window.currentUserRole && window.currentUserRole.toUpperCase() === 'SUPERADMIN') || 
                       path.includes('/superadmin');

  const existingInput = document.getElementById("inventorySearch");
  const currentSearchTerm = window.inventoryData
    ? window.inventoryData.searchTerm
    : "";

  // Check if we're admin_regional
  const isAdminRegional = (window.currentUserRole && window.currentUserRole.toUpperCase() === 'ADMIN_REGIONAL') || 
                         (window.location.pathname && window.location.pathname.includes('/admin_regional'));

  // For super admin, check if filters already exist (CustomSelect)
  if (isSuperAdmin) {
    const existingRegionalSelect = document.getElementById('inventoryRegionalFilterSelect');
    const existingInstitutionSelect = document.getElementById('inventoryInstitutionFilterSelect');
    // If filters exist, don't recreate them
    if (existingRegionalSelect && existingInstitutionSelect) {
      // Just update the search input if needed
      if (existingInput && existingInput.value !== currentSearchTerm) {
        existingInput.value = currentSearchTerm;
      }
      // Update selected values if they changed (but don't trigger onChange)
      const currentRegional = window.inventoryData?.selectedRegional || '';
      const currentInstitution = window.inventoryData?.selectedInstitution || '';
      
      // Update regional filter value
      if (window.inventoryRegionalFilterSelect && typeof window.inventoryRegionalFilterSelect.setValue === 'function') {
        // Get the current displayed text
        const textElement = window.inventoryRegionalFilterSelect.container?.querySelector(".custom-select-text");
        const currentDisplayText = textElement?.textContent || '';
        
        // Temporarily disable onChange to prevent infinite loop
        const originalOnChange = window.inventoryRegionalFilterSelect.onChange;
        window.inventoryRegionalFilterSelect.onChange = null;
        try {
          // Only update if the value is different
          const currentValue = window.inventoryRegionalFilterSelect.getValue();
          if (String(currentValue) !== String(currentRegional || '')) {
            window.inventoryRegionalFilterSelect.setValue(currentRegional || '');
          } else if (currentRegional && textElement) {
            // Value is correct but verify text is correct
            const options = window.inventoryRegionalFilterSelect.options || [];
            const option = options.find(opt => String(opt.value) === String(currentRegional));
            if (option && option.label && currentDisplayText !== option.label) {
              // Fix the text if it's incorrect
              textElement.textContent = option.label;
              textElement.classList.remove("custom-select-placeholder");
              window.inventoryRegionalFilterSelect.selectedText = option.label;
            }
          }
        } catch (error) {
          console.error('Error setting regional filter value:', error);
        }
        window.inventoryRegionalFilterSelect.onChange = originalOnChange;
      }
      
      // Update institution filter value
      if (window.inventoryInstitutionFilterSelect && typeof window.inventoryInstitutionFilterSelect.setValue === 'function') {
        // CustomSelect for superadmin
        const originalOnChange = window.inventoryInstitutionFilterSelect.onChange;
        window.inventoryInstitutionFilterSelect.onChange = null;
        try {
          window.inventoryInstitutionFilterSelect.setValue(currentInstitution || '');
        } catch (error) {
          console.error('Error setting institution filter value:', error);
        }
        window.inventoryInstitutionFilterSelect.onChange = originalOnChange;
      } else {
        // Fallback to native select if CustomSelect is not available
        const institutionSelect = document.getElementById('inventoryInstitutionFilterSelect');
        if (institutionSelect && institutionSelect.tagName === 'SELECT') {
          institutionSelect.value = currentInstitution || '';
        }
      }
      return;
    }
  }

  // For admin_regional, check if filter already exists (CustomSelect)
  if (isAdminRegional) {
    const existingInstitutionSelect = document.getElementById('inventoryInstitutionFilterSelect');
    // If filter exists, don't recreate it
    if (existingInstitutionSelect) {
      // Just update the search input if needed
      if (existingInput && existingInput.value !== currentSearchTerm) {
        existingInput.value = currentSearchTerm;
      }
      // Update selected value if it changed (but don't trigger onChange)
      const currentInstitution = window.inventoryData?.selectedInstitution || '';
      if (currentInstitution) {
        // Check if it's a CustomSelect or native select
        if (window.inventoryInstitutionFilterSelect && typeof window.inventoryInstitutionFilterSelect.setValue === 'function') {
          // CustomSelect for superadmin
          const originalOnChange = window.inventoryInstitutionFilterSelect.onChange;
          window.inventoryInstitutionFilterSelect.onChange = null;
          window.inventoryInstitutionFilterSelect.setValue(currentInstitution);
          window.inventoryInstitutionFilterSelect.onChange = originalOnChange;
        } else if (existingInstitutionSelect && existingInstitutionSelect.tagName === 'SELECT') {
          // Native select for admin_regional
          existingInstitutionSelect.value = currentInstitution;
        }
      }
      return;
    }
  }

  // Only skip update if search term hasn't changed AND we're not super admin or admin_regional (to avoid re-rendering filters)
  if (!isSuperAdmin && !isAdminRegional && existingInput && existingInput.value === currentSearchTerm) {
    return;
  }

  // Build filter dropdowns HTML
  let filterDropdowns = '';
  
  if (isSuperAdmin) {
    // Super admin gets regional and institution filters using CustomSelect
    const selectedRegional = window.inventoryData?.selectedRegional || '';
    const selectedInstitution = window.inventoryData?.selectedInstitution || '';
    
    filterDropdowns = `
      <div class="custom-select-container" style="min-width: 180px; flex-shrink: 0;">
        <div class="custom-select" id="inventoryRegionalFilterSelect">
          <div class="custom-select-trigger" style="padding: 0.75rem 1rem; height: 56px; display: flex; align-items: center;">
            <span class="custom-select-text">Todas las regionales</span>
            <i class="fas fa-chevron-down custom-select-arrow"></i>
          </div>
          <div class="custom-select-dropdown">
            <input type="text" class="custom-select-search" placeholder="Buscar regional...">
            <div class="custom-select-options" id="inventoryRegionalFilterOptions">
              <!-- Options loaded dynamically -->
            </div>
          </div>
        </div>
        <input type="hidden" id="inventoryRegionalFilter" name="regional">
      </div>
      <div class="custom-select-container" style="min-width: 180px; flex-shrink: 0;">
        <div class="custom-select" id="inventoryInstitutionFilterSelect">
          <div class="custom-select-trigger" style="padding: 0.75rem 1rem; height: 56px; display: flex; align-items: center;">
            <span class="custom-select-text">Todas las instituciones</span>
            <i class="fas fa-chevron-down custom-select-arrow"></i>
          </div>
          <div class="custom-select-dropdown">
            <input type="text" class="custom-select-search" placeholder="Buscar institución...">
            <div class="custom-select-options" id="inventoryInstitutionFilterOptions">
              <!-- Options loaded dynamically -->
            </div>
          </div>
        </div>
        <input type="hidden" id="inventoryInstitutionFilter" name="institution">
      </div>
    `;
  } else if (isAdminRegional) {
    // Admin regional gets only institution filter (for their regional)
    // Use native select for better reliability
    const selectedInstitution = window.inventoryData?.selectedInstitution || '';
    
    filterDropdowns = `
      <div class="relative" style="min-width: 280px; flex-shrink: 0;">
        <select id="inventoryInstitutionFilterSelect" 
                onchange="if(typeof handleInstitutionFilterChange === 'function') handleInstitutionFilterChange(this.value)"
                class="w-full px-4 h-12 pr-10 border-2 border-gray-200 text-gray-700 rounded-xl hover:border-[#00AF00] focus:border-[#00AF00] focus:outline-none focus:ring-2 focus:ring-[#00AF00]/20 bg-white transition-all duration-200 shadow-sm hover:shadow-md appearance-none">
          <option value="">Todos los centros</option>
          <!-- Options loaded dynamically -->
        </select>
        <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <i class="fas fa-chevron-down text-[#00AF00] text-sm"></i>
        </div>
        <input type="hidden" id="inventoryInstitutionFilter" name="institution">
      </div>
    `;
  } else {
    // Other roles get location and status filters
    filterDropdowns = `
      <div class="relative">
        <select onchange="setLocationFilter(this.value)" class="appearance-none w-full px-4 py-3 pr-10 border-2 border-gray-200 text-gray-700 rounded-xl hover:border-[#00AF00] focus:border-[#00AF00] focus:outline-none focus:ring-2 focus:ring-[#00AF00]/20 bg-white transition-all duration-200 shadow-sm hover:shadow-md">
          <option value="all">Todas las ubicaciones</option>
          ${getLocationFilterOptions()}
        </select>
        <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <i class="fas fa-chevron-down text-[#00AF00] text-sm"></i>
        </div>
      </div>
      <div class="relative">
        <select onchange="setStatusFilter(this.value)" class="appearance-none w-full px-4 py-3 pr-10 border-2 border-gray-200 text-gray-700 rounded-xl hover:border-[#00AF00] focus:border-[#00AF00] focus:outline-none focus:ring-2 focus:ring-[#00AF00]/20 bg-white transition-all duration-200 shadow-sm hover:shadow-md">
          <option value="all">Todos los estados</option>
          <option value="active">Activos</option>
          <option value="inactive">Inactivos</option>
        </select>
        <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <i class="fas fa-chevron-down text-[#00AF00] text-sm"></i>
        </div>
      </div>
    `;
  }

  container.innerHTML = `
        <div class="relative flex-1" style="height: 48px;">
            <i class="fas fa-search absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 z-10 pointer-events-none"></i>
            <input type="text" id="inventorySearch" value="${currentSearchTerm}" placeholder="Buscar inventarios por nombre, ubicación o UUID..." class="w-full pl-12 pr-4 h-12 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00AF00] transition-all" oninput="handleInventorySearchInput(event)">
        </div>
        <div class="flex gap-2 flex-wrap items-end">
            ${filterDropdowns}
        </div>
    `;

  // Initialize CustomSelects for filters (super admin and admin_regional)
  if (isSuperAdmin || isAdminRegional) {
    setTimeout(() => {
      initializeInventoryFilterSelects();
    }, 100);
  }

  const searchInput = document.getElementById("inventorySearch");
  if (searchInput && !searchInput._searchListeners) {
    searchInput.addEventListener("keyup", function (e) {
      handleInventorySearchKeyup(e);
    });
    searchInput.addEventListener("keypress", function (e) {
      handleInventorySearchKeypress(e);
    });
    searchInput._searchListeners = true;
  }
}

function setupInventorySearchInputListeners(searchInput) {
  if (!window.inventoryData) {
    return;
  }

  if (searchInput.value !== window.inventoryData.searchTerm) {
    searchInput.value = window.inventoryData.searchTerm || "";
  }

  if (!searchInput._searchListeners) {
    searchInput.addEventListener("input", function (e) {
      handleInventorySearchInput(e);
    });

    searchInput.addEventListener("keyup", function (e) {
      handleInventorySearchKeyup(e);
    });

    searchInput.addEventListener("keypress", function (e) {
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
      if (
        typeof window.filterInventories === "function" &&
        window.inventoryData
      ) {
        window.filterInventories();
      }
    } catch (filterError) {
      console.error("Error in filterInventories:", filterError);
    }
  } catch (error) {
    console.error("Error in handleInventorySearchInput:", error);
  }
}

function handleInventorySearchKeyup(e) {
  if (e.key === "Escape") {
    e.target.value = "";
    if (window.inventoryData) {
      window.inventoryData.searchTerm = "";
      window.inventoryData.currentPage = 1;
    }

    if (
      typeof window.filterInventories === "function" &&
      window.inventoryData
    ) {
      window.filterInventories();
    }
  }
}

function handleInventorySearchKeypress(e) {
  if (e.key === "Enter") {
    e.preventDefault();

    // Apply current search term
    if (
      typeof window.filterInventories === "function" &&
      window.inventoryData
    ) {
      window.filterInventories();
    }
  }
}

function updateViewModeButtons() {
  const container = document.getElementById("viewModeButtonsContainer");
  if (!container) return;

  const isTableActive = inventoryData.viewMode === "table";
  const isCardsActive = inventoryData.viewMode === "cards";

  container.innerHTML = `
        <div class="flex items-center gap-2 mb-4">
            <i class="fas fa-boxes text-[#00AF00] text-xl"></i>
            <h2 class="text-xl font-bold text-gray-800">Inventarios del Sistema</h2>
            <span class="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">${
              inventoryData ? inventoryData.filteredInventories.length : 0
            } inventarios</span>
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

function updateInventoryTable() {
  const container = document.getElementById("inventoryTableContainer");
  if (!container) return;

  if (!window.inventoryData) {
    console.warn('inventoryData not available');
    return;
  }

  // Ensure filteredInventories exists and is an array
  if (!window.inventoryData.filteredInventories || !Array.isArray(window.inventoryData.filteredInventories)) {
    window.inventoryData.filteredInventories = window.inventoryData.inventories ? [...window.inventoryData.inventories] : [];
  }

  // Check if we're using server-side pagination
  const useServerPagination = window.inventoryData.serverPagination !== null && 
                               window.inventoryData.serverPagination !== undefined;
  
  let paginatedInventories;
  
  if (useServerPagination) {
    // For server-side pagination, use all inventories (they're already paginated from server)
    // But limit to 6 for admin regional if server returned more
    const isAdminRegional = (window.currentUserRole && window.currentUserRole.toUpperCase() === 'ADMIN_REGIONAL') || 
                           (window.location.pathname && window.location.pathname.includes('/admin_regional'));
    let allInventories = window.inventoryData.filteredInventories || [];
    
    if (isAdminRegional && allInventories.length > 6) {
      // Limit to 6 for admin regional if server returned more
      paginatedInventories = allInventories.slice(0, 6);
    } else {
      paginatedInventories = allInventories;
    }
  } else {
    // For client-side pagination, slice the array
    const startIndex =
      (window.inventoryData.currentPage - 1) * window.inventoryData.itemsPerPage;
    const endIndex = startIndex + window.inventoryData.itemsPerPage;
    paginatedInventories = window.inventoryData.filteredInventories.slice(
      startIndex,
      endIndex
    );
  }
  
  let inventoryTableHtml = ``;

  if (paginatedInventories.length === 0) {
    inventoryTableHtml += `
            <div class="text-center py-8">
                <i class="fas fa-box-open text-gray-300 text-4xl mb-4"></i>
                <p class="text-gray-500">No se encontraron inventarios</p>
                <p class="text-sm text-gray-400 mt-2">Intenta ajustar los filtros de búsqueda</p>
            </div>
        `;
  } else {
    inventoryTableHtml += `
            <div class="overflow-x-auto">
                <table class="w-full">
                    <thead>
                        <tr class="border-b border-gray-200 dark:border-gray-700">
                            <th class="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Inventario</th>
                            <th class="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Ubicación</th>
                            <th class="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Estado</th>
                            <th class="text-center py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Cantidad de Items</th>
                            <th class="text-center py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

    paginatedInventories.forEach((inventory) => {
      const locationText = getLocationText(inventory.location);
      const uuidDisplay = inventory.uuid
        ? inventory.uuid.toString().substring(0, 8) + "..."
        : "No asignado";
      const fullName = inventory.name || "Inventario sin nombre";
      const location = inventory.location || "Sin ubicación";

      const inventoryImage = inventory.imgUrl
        ? createImageWithSpinner(
            inventory.imgUrl,
            fullName,
            "w-full h-full object-cover border-2 border-gray-200",
            "w-10 h-10",
            "rounded-lg"
          )
        : `<div class="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white text-sm font-bold">
                    <i class="fas fa-box"></i>
                </div>`;

      inventoryTableHtml += `
                <tr class="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td class="py-3 px-4">
                        <div class="flex items-center gap-3">
                            <button onclick="changeInventoryPhoto('${
                              inventory.id
                            }')" class="profile-image-btn ${
        inventory.imgUrl ? "" : "no-image"
      }" title="Cambiar imagen del inventario">
                                ${inventoryImage}
                                <div class="image-overlay">
                                    <i class="fas fa-camera text-white text-xs"></i>
                                </div>
                            </button>
                            <div>
                                <div class="font-semibold text-gray-800 dark:text-gray-200">${fullName}</div>
                                <div class="text-sm text-gray-500 dark:text-gray-400">ID: ${
                                  inventory.id
                                }</div>
                            </div>
                        </div>
                    </td>
                    <td class="py-3 px-4">
                        <span class="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-xs font-medium">${locationText}</span>
                    </td>
                    <td class="py-3 px-4">
                        ${
                          inventory.status !== false
                            ? '<span class="status-badge-active px-2 py-1 bg-[#00AF00]/20 text-[#00AF00] dark:bg-green-900/30 dark:text-green-400 rounded-full text-xs font-medium">Activo</span>'
                            : '<span class="status-badge-inactive badge px-2 py-1 bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded-full text-xs font-semibold">Inactivo</span>'
                        }
                    </td>
                    <td class="py-3 px-4">
                        <div class="flex items-center justify-center gap-2">
                            <i class="fas fa-cubes text-blue-500 dark:text-blue-400 text-sm"></i>
                            <span class="text-sm font-semibold text-gray-800 dark:text-gray-200">${
                              inventory.quantityItems || 0
                            }</span>
                        </div>
                    </td>
                    <td class="py-3 px-4">
                        <div class="flex items-center justify-center gap-2">
                            <button onclick="if(typeof window.viewInventory === 'function') { window.viewInventory('${
                              inventory.id
                            }'); } else if(typeof viewInventory === 'function') { viewInventory('${
                              inventory.id
                            }'); }" class="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors" title="Ver detalles">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button onclick="if(typeof window.editInventory === 'function') { window.editInventory('${
                              inventory.id
                            }'); } else if(typeof editInventory === 'function') { editInventory('${
                              inventory.id
                            }'); }" class="p-2 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/30 rounded-lg transition-colors" title="Editar inventario">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="if(typeof window.showInventoryManagerAssignment === 'function') { window.showInventoryManagerAssignment('${
                              inventory.id
                            }'); } else if(typeof showInventoryManagerAssignment === 'function') { showInventoryManagerAssignment('${
                              inventory.id
                            }'); }" class="p-2 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-lg transition-colors" title="Asignar Rol">
                                <i class="fas fa-user-tie"></i>
                            </button>
                            <button onclick="if(typeof window.showInventoryTreeModal === 'function') { window.showInventoryTreeModal('${
                              inventory.id
                            }', '${(inventory.name || "").replace(
        /'/g,
        "\\'"
      )}', '${(inventory.imgUrl || "").replace(
        /'/g,
        "\\'"
      )}'); } else if(typeof showInventoryTreeModal === 'function') { showInventoryTreeModal('${
                              inventory.id
                            }', '${(inventory.name || "").replace(
        /'/g,
        "\\'"
      )}', '${(inventory.imgUrl || "").replace(
        /'/g,
        "\\'"
      )}'); }" class="p-2 text-[#00AF00] hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors" title="Ver jerarquía">
                                <i class="fas fa-sitemap text-[#00AF00]"></i>
                            </button>
                            <button onclick="if(typeof window.showDeleteInventoryModal === 'function') { window.showDeleteInventoryModal('${
                              inventory.id
                            }'); } else if(typeof showDeleteInventoryModal === 'function') { showDeleteInventoryModal('${
                              inventory.id
                            }'); }" class="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors" title="Eliminar inventario">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
    });

    inventoryTableHtml += `
                    </tbody>
                </table>
            </div>
        `;
  }

  container.innerHTML = inventoryTableHtml;
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

// Initialize search inputs when DOM is ready
document.addEventListener("DOMContentLoaded", function () {
  function checkDependenciesAndInitialize() {
    if (
      typeof window.filterInventories === "function" &&
      window.inventoryData &&
      document.readyState === "complete"
    ) {
      if (!window._inventorySearchInputsInitialized) {
        const searchInput = document.getElementById("inventorySearch");
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
window.updateInventoryTable = updateInventoryTable;
window.updateUserInfoDisplay = updateUserInfoDisplay;
window.setupInventorySearchInputListeners = setupInventorySearchInputListeners;
window.handleInventorySearchInput = handleInventorySearchInput;
window.handleInventorySearchKeyup = handleInventorySearchKeyup;
window.handleInventorySearchKeypress = handleInventorySearchKeypress;
window.loadRegionalInstitutionsForAdminRegional = loadRegionalInstitutionsForAdminRegional;
function updateInventoryCards() {
  const container = document.getElementById("inventoryTableContainer");
  if (!container) return;

  if (!window.inventoryData) {
    console.warn('inventoryData not available');
    return;
  }

  // Ensure filteredInventories exists and is an array
  if (!window.inventoryData.filteredInventories || !Array.isArray(window.inventoryData.filteredInventories)) {
    window.inventoryData.filteredInventories = window.inventoryData.inventories ? [...window.inventoryData.inventories] : [];
  }

  // Check if we're using server-side pagination
  const useServerPagination = window.inventoryData.serverPagination !== null && 
                               window.inventoryData.serverPagination !== undefined;
  
  let paginatedInventories;
  
  if (useServerPagination) {
    // For server-side pagination, use all inventories (they're already paginated from server)
    // But limit to 6 for admin regional and superadmin if server returned more
    const isAdminRegional = (window.currentUserRole && window.currentUserRole.toUpperCase() === 'ADMIN_REGIONAL') || 
                           (window.location.pathname && window.location.pathname.includes('/admin_regional'));
    const isSuperAdmin = (window.currentUserRole && window.currentUserRole.toUpperCase() === 'SUPERADMIN') || 
                        (window.location.pathname && window.location.pathname.includes('/superadmin'));
    let allInventories = window.inventoryData.filteredInventories || [];
    
    if ((isAdminRegional || isSuperAdmin) && allInventories.length > 6) {
      // Limit to 6 for admin regional and superadmin if server returned more
      paginatedInventories = allInventories.slice(0, 6);
    } else {
      paginatedInventories = allInventories;
    }
  } else {
    // For client-side pagination, slice the array
    const startIndex =
      (window.inventoryData.currentPage - 1) * window.inventoryData.itemsPerPage;
    const endIndex = startIndex + window.inventoryData.itemsPerPage;
    paginatedInventories = window.inventoryData.filteredInventories.slice(
      startIndex,
      endIndex
    );
  }
  
  let cardsHtml = ``;

  if (paginatedInventories.length === 0) {
    cardsHtml += `
            <div class="col-span-full text-center py-8">
                <i class="fas fa-box-open text-gray-300 text-4xl mb-4"></i>
                <p class="text-gray-500">No se encontraron inventarios</p>
                <p class="text-sm text-gray-400 mt-2">Intenta ajustar los filtros de búsqueda</p>
            </div>
        `;
  } else {
    cardsHtml += `<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">`;

    paginatedInventories.forEach((inventory) => {
      const locationText = getLocationText(inventory.location);
      const uuidDisplay = inventory.uuid
        ? inventory.uuid.toString().substring(0, 8) + "..."
        : "No asignado";

      const inventoryImage = inventory.imgUrl
        ? createImageWithSpinner(
            inventory.imgUrl,
            inventory.name || "Inventario",
            "w-full h-full object-cover border-2 border-gray-200",
            "w-16 h-16",
            "rounded-lg"
          )
        : `<div class="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center text-white text-xl font-bold">
                    <i class="fas fa-box"></i>
                </div>`;

      cardsHtml += `
                <div class="stat-card">
                    <div class="flex items-start justify-between mb-3">
                        <div class="flex items-center gap-3">
                            <button onclick="changeInventoryPhoto('${
                              inventory.id
                            }')" class="profile-image-btn ${
        inventory.imgUrl ? "" : "no-image"
      } inline-block" title="Cambiar imagen del inventario">
                                ${inventoryImage}
                                <div class="image-overlay">
                                    <i class="fas fa-camera text-white text-xs"></i>
                                </div>
                            </button>
                            <div>
                                <h3 class="font-bold text-lg text-gray-800 dark:text-gray-200 mb-1">${
                                  inventory.name || "Sin nombre"
                                }</h3>
                                <p class="text-gray-600 dark:text-gray-400 text-sm">${locationText}</p>
                            </div>
                        </div>
                        ${
                          inventory.status !== false
                            ? '<span class="status-badge-active badge bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 px-3 py-1 rounded-full text-xs font-semibold">Activo</span>'
                            : '<span class="status-badge-inactive badge bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 px-3 py-1 rounded-full text-xs font-semibold">Inactivo</span>'
                        }
                    </div>

                    <div class="grid grid-cols-3 gap-4 mb-4">
                        <div>
                            <p class="text-gray-600 dark:text-gray-400 text-sm mb-1">ID</p>
                            <p class="font-bold text-xl text-gray-800 dark:text-gray-200">${
                              inventory.id || "N/A"
                            }</p>
                        </div>
                        <div>
                            <p class="text-gray-600 dark:text-gray-400 text-sm mb-1">Items</p>
                            <div class="flex items-center gap-1">
                                <i class="fas fa-cubes text-blue-500 dark:text-blue-400 text-sm"></i>
                                <p class="font-bold text-xl text-gray-800 dark:text-gray-200">${
                                  inventory.quantityItems || 0
                                }</p>
                            </div>
                        </div>
                        <div class="text-right">
                            <p class="text-gray-600 dark:text-gray-400 text-sm mb-1">UUID</p>
                            <p class="font-bold text-sm text-gray-800 dark:text-gray-200" title="${
                              inventory.uuid || "No asignado"
                            }">${uuidDisplay}</p>
                        </div>
                    </div>

                    <div class="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
                        <small class="text-gray-500 dark:text-gray-400">Inventario registrado</small>
                        <div class="flex gap-2">
                            <button onclick="if(typeof window.viewInventory === 'function') { window.viewInventory('${
                              inventory.id
                            }'); } else if(typeof viewInventory === 'function') { viewInventory('${
                              inventory.id
                            }'); }" class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors" title="Ver detalles">
                                <i class="fas fa-eye text-lg"></i>
                            </button>
                            <button onclick="if(typeof window.editInventory === 'function') { window.editInventory('${
                              inventory.id
                            }'); } else if(typeof editInventory === 'function') { editInventory('${
                              inventory.id
                            }'); }" class="text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-300 transition-colors" title="Editar inventario">
                                <i class="fas fa-edit text-lg"></i>
                            </button>
                            <button onclick="if(typeof window.showInventoryManagerAssignment === 'function') { window.showInventoryManagerAssignment('${
                              inventory.id
                            }'); } else if(typeof showInventoryManagerAssignment === 'function') { showInventoryManagerAssignment('${
                              inventory.id
                            }'); }" class="text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 transition-colors" title="Asignar Rol">
                                <i class="fas fa-user-tie text-lg"></i>
                           </button>
                           <button onclick="if(typeof window.showInventoryTreeModal === 'function') { window.showInventoryTreeModal('${
                             inventory.id
                            }', '${(inventory.name || "").replace(
        /'/g,
        "\\'"
      )}', '${(inventory.imgUrl || "").replace(
        /'/g,
        "\\'"
      )}'); } else if(typeof showInventoryTreeModal === 'function') { showInventoryTreeModal('${
                             inventory.id
                            }', '${(inventory.name || "").replace(
        /'/g,
        "\\'"
      )}', '${(inventory.imgUrl || "").replace(
        /'/g,
        "\\'"
      )}'); }" class="text-[#00AF00] hover:text-green-800 dark:hover:text-green-600 transition-colors" title="Ver jerarquía">
                                <i class="fas fa-sitemap text-lg text-[#00AF00]"></i>
                           </button>
                           <button onclick="if(typeof window.showDeleteInventoryModal === 'function') { window.showDeleteInventoryModal('${
                             inventory.id
                           }'); } else if(typeof showDeleteInventoryModal === 'function') { showDeleteInventoryModal('${
                             inventory.id
                           }'); }" class="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors" title="Eliminar inventario">
                               <i class="fas fa-trash text-lg"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
    });

    cardsHtml += `</div>`;
  }

  container.innerHTML = cardsHtml;
}

window.updateInventoryUI = updateInventoryUI;
window.updateInventoryStats = updateInventoryStats;
window.updateSearchAndFilters = updateSearchAndFilters;
window.updateInventoryTable = updateInventoryTable;
window.updateInventoryCards = updateInventoryCards;
window.updateUserInfoDisplay = updateUserInfoDisplay;
window.setupInventorySearchInputListeners = setupInventorySearchInputListeners;
window.handleInventorySearchInput = handleInventorySearchInput;
window.handleInventorySearchKeyup = handleInventorySearchKeyup;
window.handleInventorySearchKeypress = handleInventorySearchKeypress;
window.updateViewModeButtons = updateViewModeButtons;
window.initializeInventoryFilterSelects = initializeInventoryFilterSelects;
// setViewMode is defined in inventory-data.js and exported there, no need to export again
