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
            'ADMIN_REGIONAL': 'Admin Regional',
            'WAREHOUSE': 'Almacén',
            'USER': 'Usuario'
        }[userData.role] || userData.role;
        headerUserRole.textContent = roleText;
    }

    if (headerUserAvatar) {
        if (userData.profilePhotoUrl) {
            headerUserAvatar.style.backgroundImage = `url(${userData.profilePhotoUrl})`;
            headerUserAvatar.style.backgroundSize = 'cover';
            headerUserAvatar.style.backgroundPosition = 'center';
            headerUserAvatar.textContent = '';
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

    const total = verificationData.verifications.length;
    const completed = verificationData.verifications.filter(v => v.status === 'COMPLETED' || v.status === 'VERIFIED').length;
    const withEvidence = verificationData.verifications.filter(v => v.hasEvidence).length;

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

    const inventoryOptions = verificationData.inventories && verificationData.inventories.length > 0
        ? verificationData.inventories.map(inv => 
            `<option value="${inv.id}">${inv.name || `Inventario ${inv.id}`}</option>`
          ).join('')
        : '<option value="">No hay inventarios disponibles</option>';

    const currentSearchValue = verificationData.searchTerm || '';
    const currentInventoryValue = verificationData.selectedInventory || 'all';

    container.innerHTML = `
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
        <div class="flex-1">
            <label class="block text-sm font-medium text-gray-700 mb-2">Filtrar por Inventario</label>
            <select id="inventoryFilter" onchange="setInventoryFilter(this.value)"
                class="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00AF00]">
                <option value="all" ${currentInventoryValue === 'all' ? 'selected' : ''}>Todos los Inventarios</option>
                ${inventoryOptions}
            </select>
        </div>
    `;
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

