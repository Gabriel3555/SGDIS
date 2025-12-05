// Cancellations User UI Functions - Only for USER role (no approve/refuse buttons)

/**
 * Load cancellations data for user
 */
window.loadCancellationsData = async function loadCancellationsData() {
    if (cancellationsData.isLoading) {
        return;
    }

    cancellationsData.isLoading = true;
    if (typeof showLoadingState === 'function') {
        showLoadingState();
    }

    try {
        cancellationsData.userRole = 'USER';
        
        if (typeof loadCurrentUserInfo === 'function') {
            await loadCurrentUserInfo();
        }
        
        // Ensure pageSize is set to 6
        if (cancellationsData.pageSize !== 6) {
            cancellationsData.pageSize = 6;
        }
        
        // Check if user can request cancellations (must be owner or signatory, not just manager)
        await checkUserCanRequestCancellations();
        
        await loadCancellations();
        
        // Ensure filters are synced with select values
        if (typeof syncFilterValues === 'function') {
            syncFilterValues();
        }
        
        cancellationsData.isLoading = false;
        if (typeof hideLoadingState === 'function') {
            hideLoadingState();
        }
        updateCancellationsUI();
    } catch (error) {
        console.error('Error loading cancellations data:', error);
        cancellationsData.isLoading = false;
        if (typeof hideLoadingState === 'function') {
            hideLoadingState();
        }
        if (typeof showErrorState === 'function') {
            showErrorState('Error al cargar los datos de las bajas: ' + error.message);
        }
        cancellationsData.cancellations = [];
        cancellationsData.filteredCancellations = [];
        updateCancellationsUI();
    }
};

/**
 * Load cancellations for user
 */
async function loadCancellations() {
    try {
        // Load all cancellations in batches and filter by requester
        let allCancellations = [];
        let currentPage = 0;
        let hasMore = true;
        
        while (hasMore && currentPage < 50) {
            const pageData = await fetchUserCancellations(
                currentPage,
                100 // Load 100 at a time
            );
            
            if (pageData.content && pageData.content.length > 0) {
                allCancellations = allCancellations.concat(pageData.content);
                hasMore = !pageData.last && pageData.content.length === 100;
                currentPage++;
            } else {
                hasMore = false;
            }
        }
        
        cancellationsData.cancellations = allCancellations;

        // Load statistics for user
        const statistics = await fetchUserCancellationStatistics();
        if (statistics) {
            cancellationsData.statistics = statistics;
        }

        // Sync filter values from selects to ensure they're up to date
        if (typeof syncFilterValues === 'function') {
            syncFilterValues();
        }
        
        // Apply filters after updating options
        if (typeof filterCancellations === 'function') {
            filterCancellations();
        }
    } catch (error) {
        console.error('Error loading cancellations:', error);
        cancellationsData.cancellations = [];
        cancellationsData.filteredCancellations = [];
    }
}

/**
 * Update cancellations table for user (without approve/refuse buttons)
 */
function updateCancellationsTable() {
    const container = document.getElementById('cancellationsTableContainer');
    if (!container) return;

    if (cancellationsData.isLoading) {
        container.innerHTML = `
            <div class="flex flex-col items-center justify-center py-16">
                <div class="relative">
                    <div class="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 dark:border-gray-700"></div>
                    <div class="animate-spin rounded-full h-16 w-16 border-t-4 border-[#00AF00] absolute top-0 left-0"></div>
                </div>
                <p class="mt-4 text-gray-600 dark:text-gray-400 font-medium">Cargando solicitudes de baja...</p>
            </div>
        `;
        return;
    }

    if (!cancellationsData.filteredCancellations || cancellationsData.filteredCancellations.length === 0) {
        container.innerHTML = `
            <div class="text-center py-16">
                <div class="w-24 h-24 mx-auto mb-6 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                    <i class="fas fa-inbox text-5xl text-gray-400 dark:text-gray-500"></i>
                </div>
                <h3 class="text-xl font-bold text-gray-700 dark:text-gray-300 mb-2">No se encontraron bajas</h3>
                <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">Intenta ajustar los filtros de búsqueda o crear una nueva solicitud</p>
                <button onclick="openAskCancellationModal()" 
                        class="mt-4 px-6 py-2 bg-gradient-to-r from-[#00AF00] to-[#008800] text-white rounded-lg hover:shadow-lg transition-all duration-200 transform hover:scale-105">
                    <i class="fas fa-plus mr-2"></i>Nueva Solicitud
                </button>
            </div>
        `;
        return;
    }

    // Ensure filteredCancellations is set
    if (!cancellationsData.filteredCancellations || cancellationsData.filteredCancellations.length === 0) {
        cancellationsData.filteredCancellations = cancellationsData.cancellations || [];
    }
    
    // Apply client-side pagination to filtered cancellations
    const startIndex = cancellationsData.currentPage * cancellationsData.pageSize;
    const endIndex = startIndex + cancellationsData.pageSize;
    const paginatedCancellations = cancellationsData.filteredCancellations.slice(startIndex, endIndex);
    
    // Update totalPages based on filtered results
    const filteredLength = cancellationsData.filteredCancellations.length;
    cancellationsData.totalPages = Math.ceil(filteredLength / cancellationsData.pageSize);
    cancellationsData.totalElements = filteredLength;

    let tableHtml = `
        <div class="overflow-x-auto">
            <table class="w-full">
                <thead>
                    <tr class="border-b-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                        <th class="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                            <i class="fas fa-user mr-2 text-[#00AF00]"></i>Solicitante
                        </th>
                        <th class="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                            <i class="fas fa-boxes mr-2 text-[#00AF00]"></i>Items
                        </th>
                        <th class="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                            <i class="fas fa-comment-alt mr-2 text-[#00AF00]"></i>Razón
                        </th>
                        <th class="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                            <i class="fas fa-calendar mr-2 text-[#00AF00]"></i>Fecha Solicitud
                        </th>
                        <th class="text-center py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                            <i class="fas fa-info-circle mr-2 text-[#00AF00]"></i>Estado
                        </th>
                        <th class="text-center py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                            <i class="fas fa-cog mr-2 text-[#00AF00]"></i>Acciones
                        </th>
                    </tr>
                </thead>
                <tbody>
    `;

    paginatedCancellations.forEach(cancellation => {
        const requestDate = cancellation.requestedAt ? new Date(cancellation.requestedAt).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }) : 'N/A';

        const requesterName = cancellation.requesterFullName || cancellation.requester?.fullName || 'N/A';
        const itemsCount = cancellation.items?.length || 0;
        const itemsText = itemsCount > 0 
            ? `${itemsCount} item${itemsCount > 1 ? 's' : ''}`
            : 'Ninguno';
        
        const reason = cancellation.reason || 'Sin razón especificada';
        const truncatedReason = reason.length > 50 ? reason.substring(0, 50) + '...' : reason;

        // Determine status
        let statusText, statusColor;
        if (cancellation.approved === true) {
            statusText = 'Aprobada';
            statusColor = 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400';
        } else if (cancellation.refusedAt !== null) {
            statusText = 'Rechazada';
            statusColor = 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400';
        } else {
            statusText = 'Pendiente';
            statusColor = 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400';
        }

        // Action buttons - Only show view details (no approve/refuse for users)
        let actionsHtml = '';
        
        // Botón de ver detalles (siempre visible)
        actionsHtml = `
            <div class="flex items-center justify-center gap-2 flex-wrap">
                <button onclick="openCancellationDetailsModal(${cancellation.id})" 
                    class="group relative px-3 py-2 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white rounded-lg text-xs font-semibold transition-all duration-200 transform hover:scale-105 active:scale-95 flex items-center gap-1.5 shadow-md hover:shadow-lg"
                    title="Ver detalles de la baja">
                    <i class="fas fa-eye"></i>
                    <span class="hidden sm:inline">Ver</span>
                </button>
            </div>
        `;

        // Status icon
        let statusIcon = '';
        if (cancellation.approved === true) {
            statusIcon = '<i class="fas fa-check-circle mr-1"></i>';
        } else if (cancellation.refusedAt !== null) {
            statusIcon = '<i class="fas fa-times-circle mr-1"></i>';
        } else {
            statusIcon = '<i class="fas fa-clock mr-1"></i>';
        }

        tableHtml += `
            <tr class="border-b border-gray-100 dark:border-gray-800 hover:bg-gradient-to-r hover:from-gray-50 hover:to-transparent dark:hover:from-gray-800/50 dark:hover:to-transparent transition-all duration-200 group">
                <td class="py-4 px-4">
                    <div class="flex items-center gap-2">
                        <div class="w-8 h-8 rounded-full bg-gradient-to-br from-[#00AF00] to-[#008800] flex items-center justify-center text-white text-xs font-bold">
                            ${requesterName.charAt(0).toUpperCase()}
                        </div>
                        <span class="text-sm font-medium text-gray-800 dark:text-gray-200">${requesterName}</span>
                    </div>
                </td>
                <td class="py-4 px-4">
                    <div class="flex items-center gap-2">
                        <span class="px-2.5 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg text-xs font-semibold">
                            <i class="fas fa-boxes mr-1"></i>${itemsCount}
                        </span>
                    </div>
                </td>
                <td class="py-4 px-4">
                    <div class="max-w-xs">
                        <p class="text-sm text-gray-700 dark:text-gray-300 truncate" title="${reason}">
                            ${truncatedReason}
                        </p>
                    </div>
                </td>
                <td class="py-4 px-4">
                    <div class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <i class="fas fa-calendar-alt text-[#00AF00]"></i>
                        <span>${requestDate}</span>
                    </div>
                </td>
                <td class="py-4 px-4 text-center">
                    <span class="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold ${statusColor} shadow-sm">
                        ${statusIcon}${statusText}
                    </span>
                </td>
                <td class="py-4 px-4">
                    ${actionsHtml}
                </td>
            </tr>
        `;
    });

    tableHtml += `
                </tbody>
            </table>
        </div>
    `;

    container.innerHTML = tableHtml;
}

/**
 * Update cancellations stats for user
 */
function updateCancellationsStats() {
    const statsContainer = document.getElementById('cancellationsStatsContainer');
    if (!statsContainer) return;

    let total, pending, approved, refused;
    
    if (cancellationsData.statistics) {
        // Use statistics from API
        total = cancellationsData.statistics.totalCancellations || 0;
        pending = cancellationsData.statistics.pendingCancellations || 0;
        approved = cancellationsData.statistics.approvedCancellations || 0;
        refused = cancellationsData.statistics.rejectedCancellations || 0;
    } else {
        // Calculate from cancellations data
        total = cancellationsData.cancellations.length;
        pending = cancellationsData.cancellations.filter(c => !c.approved && !c.refusedAt).length;
        approved = cancellationsData.cancellations.filter(c => c.approved === true).length;
        refused = cancellationsData.cancellations.filter(c => c.refusedAt !== null).length;
    }

    statsContainer.innerHTML = `
        <div class="stat-card bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-800">
            <div class="flex items-start justify-between mb-3">
                <div>
                    <p class="text-sm text-blue-600 dark:text-blue-400 font-medium mb-1">Total Bajas</p>
                    <p class="text-3xl font-bold text-blue-800 dark:text-blue-300">${total}</p>
                </div>
                <div class="w-12 h-12 bg-blue-500 dark:bg-blue-600 rounded-full flex items-center justify-center">
                    <i class="fas fa-list text-white text-xl"></i>
                </div>
            </div>
            <p class="text-xs text-blue-600 dark:text-blue-400">Todas las bajas</p>
        </div>

        <div class="stat-card bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border border-yellow-200 dark:border-yellow-800">
            <div class="flex items-start justify-between mb-3">
                <div>
                    <p class="text-sm text-yellow-600 dark:text-yellow-400 font-medium mb-1">Pendientes</p>
                    <p class="text-3xl font-bold text-yellow-800 dark:text-yellow-300">${pending}</p>
                </div>
                <div class="w-12 h-12 bg-yellow-500 dark:bg-yellow-600 rounded-full flex items-center justify-center">
                    <i class="fas fa-clock text-white text-xl"></i>
                </div>
            </div>
            <p class="text-xs text-yellow-600 dark:text-yellow-400">Esperando aprobación</p>
        </div>

        <div class="stat-card bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border border-green-200 dark:border-green-800">
            <div class="flex items-start justify-between mb-3">
                <div>
                    <p class="text-sm text-green-600 dark:text-green-400 font-medium mb-1">Aprobadas</p>
                    <p class="text-3xl font-bold text-green-800 dark:text-green-300">${approved}</p>
                </div>
                <div class="w-12 h-12 bg-green-500 dark:bg-green-600 rounded-full flex items-center justify-center">
                    <i class="fas fa-check-circle text-white text-xl"></i>
                </div>
            </div>
            <p class="text-xs text-green-600 dark:text-green-400">Bajas aprobadas</p>
        </div>

        <div class="stat-card bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border border-red-200 dark:border-red-800">
            <div class="flex items-start justify-between mb-3">
                <div>
                    <p class="text-sm text-red-600 dark:text-red-400 font-medium mb-1">Rechazadas</p>
                    <p class="text-3xl font-bold text-red-800 dark:text-red-300">${refused}</p>
                </div>
                <div class="w-12 h-12 bg-red-500 dark:bg-red-600 rounded-full flex items-center justify-center">
                    <i class="fas fa-times-circle text-white text-xl"></i>
                </div>
            </div>
            <p class="text-xs text-red-600 dark:text-red-400">Bajas rechazadas</p>
        </div>
    `;
}

// Override updateCancellationsUI to use user-specific functions
const originalUpdateCancellationsUI = window.updateCancellationsUI;
window.updateCancellationsUI = function() {
    if (window.location.pathname.includes('/user/cancellations')) {
        updateCancellationsStats();
        updateCancellationsTable();
        if (typeof updatePagination === 'function') {
            updatePagination();
        }
    } else if (originalUpdateCancellationsUI) {
        originalUpdateCancellationsUI();
    }
};

// Make functions globally available
window.updateCancellationsStats = updateCancellationsStats;
window.updateCancellationsTable = updateCancellationsTable;
window.loadCancellations = loadCancellations;

/**
 * Check if user can request cancellations (must be owner or signatory, not just manager)
 */
async function checkUserCanRequestCancellations() {
    try {
        const token = localStorage.getItem('jwt');
        if (!token) return;

        const headers = { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };

        // Check if user has any inventories as owner or signatory
        const [ownedResponse, signatoryResponse] = await Promise.all([
            fetch('/api/v1/users/me/inventories/owner', {
                method: 'GET',
                headers: headers
            }),
            fetch('/api/v1/users/me/inventories/signatory', {
                method: 'GET',
                headers: headers
            })
        ]);

        if (ownedResponse.status === 401 || signatoryResponse.status === 401) {
            localStorage.removeItem('jwt');
            window.location.href = '/';
            return;
        }

        const ownedInventories = ownedResponse.ok ? await ownedResponse.json() : [];
        const signatoryInventories = signatoryResponse.ok ? await signatoryResponse.json() : [];

        // If user has no inventories as owner or signatory, hide the "Nueva Solicitud" button
        const hasOwnerOrSignatoryInventories = (ownedInventories && ownedInventories.length > 0) || 
                                               (signatoryInventories && signatoryInventories.length > 0);

        const newRequestButton = document.querySelector('button[onclick="openAskCancellationModal()"]');
        if (newRequestButton) {
            if (!hasOwnerOrSignatoryInventories) {
                newRequestButton.style.display = 'none';
            } else {
                newRequestButton.style.display = 'flex';
            }
        }
    } catch (error) {
        console.error('Error checking user cancellation permissions:', error);
    }
}

