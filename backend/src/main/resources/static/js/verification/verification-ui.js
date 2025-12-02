function updateVerificationUI() {
    updateStatsCards();
    updateFilters();
    updateVerificationTable();
    updatePagination();
}

function updateUserInfoDisplay(userData) {
    const headerUserName = document.getElementById('headerUserName');
    const headerUserRole = document.getElementById('headerUserRole');
    const headerUserAvatar = document.getElementById('headerUserAvatar');

    if (headerUserName) {
        headerUserName.textContent = userData.fullName || 'Usuario';
    }

    if (headerUserRole) {
        const roleText = {
            'SUPERADMIN': 'Super Administrador',
            'ADMIN_INSTITUTIONAL': 'Admin Institucional',
            'ADMIN_INSTITUTION': 'Admin Institucional',
            'ADMIN_REGIONAL': 'Admin Regional',
            'WAREHOUSE': 'Almacén',
            'USER': 'Usuario'
        }[userData.role] || userData.role || 'Usuario';
        headerUserRole.textContent = roleText;
    }

    if (headerUserAvatar) {
        if (userData.imgUrl || userData.profilePhotoUrl || userData.profileImageUrl) {
            const imgUrl = userData.imgUrl || userData.profilePhotoUrl || userData.profileImageUrl;
            
            // Try to use createImageWithSpinner from dashboard.js if available
            if (typeof createImageWithSpinner === 'function') {
                const spinnerHtml = createImageWithSpinner(
                    imgUrl,
                    userData.fullName || 'Usuario',
                    'w-full h-full object-cover',
                    'w-full h-full',
                    'rounded-full'
                );
                if (spinnerHtml) {
                    headerUserAvatar.innerHTML = spinnerHtml;
                } else {
                    const initials = (userData.fullName || 'U').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                    headerUserAvatar.textContent = initials;
                    headerUserAvatar.style.backgroundImage = 'none';
                }
            } else {
                // Fallback: use background image approach
                headerUserAvatar.style.backgroundImage = `url(${imgUrl})`;
                headerUserAvatar.style.backgroundSize = 'cover';
                headerUserAvatar.style.backgroundPosition = 'center';
                headerUserAvatar.textContent = '';
            }
        } else {
            const initials = (userData.fullName || 'U').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
            headerUserAvatar.textContent = initials;
            headerUserAvatar.style.backgroundImage = 'none';
        }
    }
}

function updateStatsCards() {
    const container = document.getElementById('verificationStatsContainer');
    if (!container) return;

    // Check if user is admin regional and has statistics from endpoint
    const isAdminRegional = (window.currentUserRole && window.currentUserRole.toUpperCase() === 'ADMIN_REGIONAL') || 
                           (window.location.pathname && window.location.pathname.includes('/admin_regional'));
    
    let total, completed, withEvidence;
    
    if (isAdminRegional && window.verificationData && window.verificationData.statistics) {
        // Use total statistics from endpoint
        const stats = window.verificationData.statistics;
        total = stats.totalVerifications || 0;
        completed = stats.completedVerifications || 0;
        withEvidence = stats.withEvidence || 0;
    } else {
        // Fallback to local calculation from current page data
        total = verificationData.verifications.length;
        completed = verificationData.verifications.filter(v => {
            const status = v.status || '';
            const hasPhoto = v.photoUrl && v.photoUrl.trim() !== '';
            return status === 'COMPLETED' || status === 'VERIFIED' || hasPhoto;
        }).length;
        withEvidence = verificationData.verifications.filter(v => {
            return v.hasEvidence || (v.photoUrl && v.photoUrl.trim() !== '');
        }).length;
    }

    container.innerHTML = `
        <div class="stat-card">
            <div class="flex items-start justify-between mb-3">
                <div>
                    <p class="text-sm text-gray-600 mb-1">Total Verificaciones</p>
                    <h3 class="text-3xl font-bold text-gray-800">${total}</h3>
                </div>
                <div class="w-12 h-12 bg-gradient-to-br from-[#00AF00] to-[#008800] rounded-full flex items-center justify-center">
                    <i class="fas fa-clipboard-check text-white text-xl"></i>
                </div>
            </div>
            <p class="text-xs text-gray-500">Todas las verificaciones</p>
        </div>

        <div class="stat-card">
            <div class="flex items-start justify-between mb-3">
                <div>
                    <p class="text-sm text-gray-600 mb-1">Completadas</p>
                    <h3 class="text-3xl font-bold text-gray-800">${completed}</h3>
                </div>
                <div class="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
                    <i class="fas fa-check-circle text-white text-xl"></i>
                </div>
            </div>
            <p class="text-xs text-gray-500">Verificaciones completadas</p>
        </div>

        <div class="stat-card">
            <div class="flex items-start justify-between mb-3">
                <div>
                    <p class="text-sm text-gray-600 mb-1">Con Evidencia</p>
                    <h3 class="text-3xl font-bold text-gray-800">${withEvidence}</h3>
                </div>
                <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                    <i class="fas fa-file-alt text-white text-xl"></i>
                </div>
            </div>
            <p class="text-xs text-gray-500">Con archivos adjuntos</p>
        </div>
    `;
}

function updateFilters() {
    const container = document.getElementById('searchFilterContainer');
    if (!container) return;

    // Check if user is superadmin
    const isSuperAdmin = (window.currentUserRole && window.currentUserRole.toUpperCase() === 'SUPERADMIN') || 
                         (window.location.pathname && window.location.pathname.includes('/superadmin'));

    const inventoryOptions = verificationData.inventories && verificationData.inventories.length > 0
        ? verificationData.inventories.map(inv => 
            `<option value="${inv.id}">${inv.name || `Inventario ${inv.id}`}</option>`
          ).join('')
        : '<option value="">No hay inventarios disponibles</option>';

    const currentSearchValue = verificationData.searchTerm || '';
    const currentInventoryValue = verificationData.selectedInventory || 'all';
    const currentRegionalValue = verificationData.selectedRegional || '';
    const currentInstitutionValue = verificationData.selectedInstitution || '';

    // Build regional options
    const regionalOptions = verificationData.regionals && verificationData.regionals.length > 0
        ? verificationData.regionals.map(regional => 
            `<option value="${regional.id}" ${currentRegionalValue === regional.id.toString() ? 'selected' : ''}>${regional.name}</option>`
          ).join('')
        : '<option value="">Cargando regionales...</option>';

    // Build institution options
    const institutionOptions = verificationData.institutions && verificationData.institutions.length > 0
        ? verificationData.institutions.map(institution => 
            `<option value="${institution.institutionId || institution.id}" ${currentInstitutionValue === (institution.institutionId || institution.id).toString() ? 'selected' : ''}>${institution.name}</option>`
          ).join('')
        : '<option value="">Seleccione una regional primero</option>';

    let filtersHTML = `
        <div class="flex-1">
            <label class="block text-sm font-medium text-gray-700 mb-2">Buscar</label>
            <input 
                type="text" 
                id="verificationSearch"
                placeholder="Buscar por placa, serie, item o inventario..."
                value="${currentSearchValue}"
                oninput="applySearchFilter()"
                class="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00AF00]"
            />
        </div>
    `;

    // Add regional and institution filters for superadmin
    if (isSuperAdmin) {
        filtersHTML += `
            <div class="flex-1">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Filtrar por Regional</label>
                <div class="custom-select-container">
                    <div class="custom-select" id="verificationRegionalFilterSelect">
                        <div class="custom-select-trigger" style="padding: 0.75rem 1rem; height: 56px; display: flex; align-items: center;">
                            <span class="custom-select-text custom-select-placeholder">Todas las regionales</span>
                            <i class="fas fa-chevron-down custom-select-arrow"></i>
                        </div>
                        <div class="custom-select-dropdown">
                            <input type="text" class="custom-select-search" placeholder="Buscar regional...">
                            <div class="custom-select-options" id="verificationRegionalFilterOptions">
                                <!-- Options loaded dynamically -->
                            </div>
                        </div>
                    </div>
                    <input type="hidden" id="regionalFilter" value="${currentRegionalValue}">
                </div>
            </div>
            <div class="flex-1">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Filtrar por Centro</label>
                <div class="custom-select-container">
                    <div class="custom-select" id="verificationInstitutionFilterSelect">
                        <div class="custom-select-trigger" style="padding: 0.75rem 1rem; height: 56px; display: flex; align-items: center;">
                            <span class="custom-select-text custom-select-placeholder">Todos los centros</span>
                            <i class="fas fa-chevron-down custom-select-arrow"></i>
                        </div>
                        <div class="custom-select-dropdown">
                            <input type="text" class="custom-select-search" placeholder="Buscar centro...">
                            <div class="custom-select-options" id="verificationInstitutionFilterOptions">
                                <!-- Options loaded dynamically -->
                            </div>
                        </div>
                    </div>
                    <input type="hidden" id="institutionFilter" value="${currentInstitutionValue}">
                </div>
            </div>
        `;
    }

    filtersHTML += `
        <div class="flex-1">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Filtrar por Inventario</label>
            <div class="custom-select-container">
                <div class="custom-select" id="verificationInventoryFilterSelect">
                    <div class="custom-select-trigger" style="padding: 0.75rem 1rem; height: 56px; display: flex; align-items: center;">
                        <span class="custom-select-text custom-select-placeholder">Todos los Inventarios</span>
                        <i class="fas fa-chevron-down custom-select-arrow"></i>
                    </div>
                    <div class="custom-select-dropdown">
                        <input type="text" class="custom-select-search" placeholder="Buscar inventario...">
                        <div class="custom-select-options" id="verificationInventoryFilterOptions">
                            <!-- Options loaded dynamically -->
                        </div>
                    </div>
                </div>
                <input type="hidden" id="inventoryFilter" value="${currentInventoryValue}">
            </div>
        </div>
    `;

    container.innerHTML = filtersHTML;

    // Reset custom select instances since HTML was regenerated
    verificationRegionalCustomSelect = null;
    verificationInstitutionCustomSelect = null;
    verificationInventoryCustomSelect = null;

    // Initialize Custom Selects after HTML is inserted
    setTimeout(() => {
        initializeVerificationCustomSelects();
    }, 50);
}

// Custom Select instances for verification filters
let verificationRegionalCustomSelect = null;
let verificationInstitutionCustomSelect = null;
let verificationInventoryCustomSelect = null;

function initializeVerificationCustomSelects() {
    if (typeof CustomSelect === 'undefined') {
        console.warn('CustomSelect class not available for verification filters');
        return;
    }

    // Initialize Regional Filter Custom Select (only for superadmin)
    const isSuperAdmin = (window.currentUserRole && window.currentUserRole.toUpperCase() === 'SUPERADMIN') || 
                         (window.location.pathname && window.location.pathname.includes('/superadmin'));
    
    if (isSuperAdmin) {
        const regionalSelect = document.getElementById('verificationRegionalFilterSelect');
        if (regionalSelect && !verificationRegionalCustomSelect) {
            verificationRegionalCustomSelect = new CustomSelect('verificationRegionalFilterSelect', {
                placeholder: 'Todas las regionales',
                onChange: (option) => {
                    const value = option.value || '';
                    document.getElementById('regionalFilter').value = value;
                    setRegionalFilter(value);
                }
            });
        }

        const institutionSelect = document.getElementById('verificationInstitutionFilterSelect');
        if (institutionSelect && !verificationInstitutionCustomSelect) {
            verificationInstitutionCustomSelect = new CustomSelect('verificationInstitutionFilterSelect', {
                placeholder: 'Todos los centros',
                disabled: !verificationData.selectedRegional,
                onChange: (option) => {
                    const value = option.value || '';
                    document.getElementById('institutionFilter').value = value;
                    setInstitutionFilter(value);
                }
            });
        }
    }

    // Initialize Inventory Filter Custom Select
    const inventorySelect = document.getElementById('verificationInventoryFilterSelect');
    if (inventorySelect && !verificationInventoryCustomSelect) {
        verificationInventoryCustomSelect = new CustomSelect('verificationInventoryFilterSelect', {
            placeholder: 'Todos los Inventarios',
            disabled: isSuperAdmin && !verificationData.selectedInstitution,
            onChange: (option) => {
                const value = option.value || '';
                document.getElementById('inventoryFilter').value = value;
                setInventoryFilter(value);
            }
        });
    }

    // Populate custom selects with options
    populateVerificationCustomSelects();
}

function populateVerificationCustomSelects() {
    const isSuperAdmin = (window.currentUserRole && window.currentUserRole.toUpperCase() === 'SUPERADMIN') || 
                         (window.location.pathname && window.location.pathname.includes('/superadmin'));

    // Populate Regional Filter
    if (isSuperAdmin && verificationRegionalCustomSelect) {
        const options = [
            { value: '', label: 'Todas las regionales' },
            ...(verificationData.regionals || []).map(regional => ({
                value: regional.id.toString(),
                label: regional.name
            }))
        ];
        verificationRegionalCustomSelect.setOptions(options);
        
        if (verificationData.selectedRegional) {
            const selectedOption = options.find(opt => opt.value === verificationData.selectedRegional.toString());
            if (selectedOption) {
                verificationRegionalCustomSelect.selectOption(selectedOption);
            }
        } else {
            verificationRegionalCustomSelect.clear();
        }
    }

    // Populate Institution Filter
    if (isSuperAdmin && verificationInstitutionCustomSelect) {
        if (!verificationData.selectedRegional) {
            verificationInstitutionCustomSelect.setDisabled(true);
            verificationInstitutionCustomSelect.setOptions([{ value: '', label: 'Todos los centros' }]);
            verificationInstitutionCustomSelect.clear();
        } else {
            verificationInstitutionCustomSelect.setDisabled(false);
            const options = [
                { value: '', label: 'Todos los centros' },
                ...(verificationData.institutions || []).map(institution => ({
                    value: (institution.institutionId || institution.id).toString(),
                    label: institution.name
                }))
            ];
            verificationInstitutionCustomSelect.setOptions(options);
            
            if (verificationData.selectedInstitution) {
                const selectedOption = options.find(opt => opt.value === verificationData.selectedInstitution.toString());
                if (selectedOption) {
                    verificationInstitutionCustomSelect.selectOption(selectedOption);
                }
            } else {
                verificationInstitutionCustomSelect.clear();
            }
        }
    }

    // Populate Inventory Filter
    if (verificationInventoryCustomSelect) {
        if (isSuperAdmin && !verificationData.selectedInstitution) {
            verificationInventoryCustomSelect.setDisabled(true);
        } else {
            verificationInventoryCustomSelect.setDisabled(false);
        }

        const options = [
            { value: 'all', label: 'Todos los Inventarios' },
            ...(verificationData.inventories || []).map(inv => ({
                value: inv.id.toString(),
                label: inv.name || `Inventario ${inv.id}`
            }))
        ];
        verificationInventoryCustomSelect.setOptions(options);
        
        if (verificationData.selectedInventory && verificationData.selectedInventory !== 'all') {
            const selectedOption = options.find(opt => opt.value === verificationData.selectedInventory.toString());
            if (selectedOption) {
                verificationInventoryCustomSelect.selectOption(selectedOption);
            }
        } else {
            // Select "all" option
            const allOption = options.find(opt => opt.value === 'all');
            if (allOption) {
                verificationInventoryCustomSelect.selectOption(allOption);
            }
        }
    }
}

function updateVerificationTable() {
    const container = document.getElementById('verificationTableContainer');
    if (!container) return;

    if (verificationData.filteredVerifications.length === 0) {
        container.innerHTML = `
            <div class="text-center py-12">
                <i class="fas fa-clipboard-check text-gray-300 text-6xl mb-4"></i>
                <h3 class="text-xl font-semibold text-gray-700 mb-2">No hay verificaciones</h3>
                <p class="text-gray-500 mb-4">No se encontraron verificaciones con los filtros seleccionados.</p>
                <button onclick="showNewVerificationModal()" 
                    class="bg-[#00AF00] hover:bg-[#008800] text-white font-semibold py-2 px-6 rounded-xl transition-all duration-200">
                    <i class="fas fa-plus mr-2"></i>
                    Crear Primera Verificación
                </button>
            </div>
        `;
        return;
    }

    // If using backend pagination, use verifications directly (already paginated and sorted by backend)
    // Otherwise, slice the filtered verifications for client-side pagination
    let currentVerifications = verificationData.useBackendPagination
        ? verificationData.verifications // Backend already sorts by ID descending
        : verificationData.filteredVerifications.slice(
            (verificationData.currentPage - 1) * verificationData.itemsPerPage,
            verificationData.currentPage * verificationData.itemsPerPage
          );

    // Sort by ID descending (highest ID first) only for client-side pagination
    if (!verificationData.useBackendPagination) {
        currentVerifications = [...currentVerifications].sort((a, b) => {
            const aId = a.id || 0;
            const bId = b.id || 0;
            return bId - aId; // Descending order
        });
    }

    const sortedVerifications = currentVerifications;

    const tableRows = sortedVerifications.map(verification => {
        return `
            <tr class="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                <td class="px-6 py-4">
                    <div class="text-gray-800">${verification.licensePlate || verification.serialNumber || '-'}</div>
                    <div class="text-xs text-gray-500">${verification.licensePlate ? 'Placa' : (verification.serialNumber ? 'Serie' : '-')}</div>
                </td>
                <td class="px-6 py-4">
                    <div class="text-gray-800">${verification.itemName || '-'}</div>
                </td>
                <td class="px-6 py-4">
                    <div class="text-gray-800">${verification.inventoryName || '-'}</div>
                </td>
                <td class="px-6 py-4">
                    <div class="flex items-center gap-2">
                        ${verification.hasEvidence ? 
                            '<i class="fas fa-check-circle text-green-500"></i>' : 
                            '<i class="fas fa-times-circle text-gray-300"></i>'
                        }
                        <span class="text-sm text-gray-600">${verification.hasEvidence ? 'Sí' : 'No'}</span>
                    </div>
                </td>
                <td class="px-6 py-4">
                    <div class="text-sm text-gray-600">${verification.verificationDate ? new Date(verification.verificationDate).toLocaleDateString('es-ES') : '-'}</div>
                </td>
                <td class="px-6 py-4">
                    <div class="flex items-center gap-2">
                        <button onclick="showViewVerificationModal(${verification.id})" 
                            class="text-blue-600 hover:text-blue-800 transition-colors" title="Ver Detalles">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button onclick="showUploadEvidenceModal(${verification.id})" 
                            class="text-green-600 hover:text-green-800 transition-colors" title="Subir Evidencia">
                            <i class="fas fa-upload"></i>
                        </button>
                        ${verification.hasEvidence ? `
                            <button onclick="downloadEvidence(${verification.id})" 
                                class="text-purple-600 hover:text-purple-800 transition-colors" title="Descargar Evidencia">
                                <i class="fas fa-download"></i>
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    container.innerHTML = `
        <div class="overflow-x-auto">
            <table class="w-full">
                <thead>
                    <tr class="bg-gray-50 border-b border-gray-200">
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Identificador</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Inventario</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Evidencia</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableRows}
                </tbody>
            </table>
        </div>
    `;
}

window.updateVerificationUI = updateVerificationUI;
window.updateUserInfoDisplay = updateUserInfoDisplay;
window.updateStatsCards = updateStatsCards;
window.updateFilters = updateFilters;
window.updateVerificationTable = updateVerificationTable;
window.verificationRegionalCustomSelect = verificationRegionalCustomSelect;
window.verificationInstitutionCustomSelect = verificationInstitutionCustomSelect;
window.verificationInventoryCustomSelect = verificationInventoryCustomSelect;
window.populateVerificationCustomSelects = populateVerificationCustomSelects;
window.initializeVerificationCustomSelects = initializeVerificationCustomSelects;

