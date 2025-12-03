// Cancellations UI Functions

/**
 * Load cancellations data
 */
async function loadCancellationsData() {
    if (cancellationsData.isLoading) {
        return;
    }

    cancellationsData.isLoading = true;
    showLoadingState();

    try {
        // Detect role from URL first (warehouse view or admin_institution view)
        if (window.location.pathname.includes('/warehouse/')) {
            cancellationsData.userRole = 'WAREHOUSE';
        } else if (window.location.pathname.includes('/admin_institution/')) {
            cancellationsData.userRole = 'ADMIN_INSTITUTION';
        }
        
        await loadCurrentUserInfo();
        
        // Ensure userRole is set before loading cancellations
        if (!cancellationsData.userRole) {
            cancellationsData.userRole = window.currentUserRole || 
                                        window.usersData?.currentLoggedInUserRole || 
                                        (window.location.pathname.includes('/warehouse/') ? 'WAREHOUSE' : 'SUPERADMIN');
        }
        
        await loadCancellations();
        cancellationsData.isLoading = false;
        hideLoadingState();
        updateCancellationsUI();
    } catch (error) {
        console.error('Error loading cancellations data:', error);
        cancellationsData.isLoading = false;
        hideLoadingState();
        showErrorState('Error al cargar los datos de las bajas: ' + error.message);
        cancellationsData.cancellations = [];
        cancellationsData.filteredCancellations = [];
        updateCancellationsUI();
    }
}

/**
 * Load current user info
 */
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
            cancellationsData.userRole = userData.role || 'SUPERADMIN';
            updateUserInfoDisplay(userData);
        } else {
            throw new Error('Failed to load user info');
        }
    } catch (error) {
        console.error('Error loading current user info:', error);
        // Try to get role from window if available
        const fallbackRole = window.currentUserRole || window.usersData?.currentLoggedInUserRole || 'SUPERADMIN';
        updateUserInfoDisplay({
            fullName: 'Super Admin',
            role: fallbackRole,
            email: 'admin@sena.edu.co'
        });
        cancellationsData.userRole = fallbackRole;
    }
}

/**
 * Load cancellations
 */
async function loadCancellations() {
    try {
        // Ensure userRole is set, default to WAREHOUSE if in warehouse view
        const userRole = cancellationsData.userRole || 
                        (window.location.pathname.includes('/warehouse/') ? 'WAREHOUSE' : 'SUPERADMIN');
        
        const pageData = await fetchAllCancellations(
            cancellationsData.currentPage,
            cancellationsData.pageSize,
            userRole
        );
        
        cancellationsData.cancellations = pageData.content || [];
        cancellationsData.totalPages = pageData.totalPages || 0;
        cancellationsData.totalElements = pageData.totalElements || 0;

        // Apply filters
        filterCancellations();
        
        // Update requester filter options after loading cancellations
        updateRequesterFilterOptions();
    } catch (error) {
        console.error('Error loading cancellations:', error);
        cancellationsData.cancellations = [];
        cancellationsData.filteredCancellations = [];
        cancellationsData.totalPages = 0;
        cancellationsData.totalElements = 0;
    }
}

/**
 * Filter cancellations based on current filters
 */
function filterCancellations() {
    let filtered = [...cancellationsData.cancellations];

    // Apply status filter
    if (cancellationsData.filters.status !== 'all') {
        filtered = filtered.filter(cancellation => {
            if (cancellationsData.filters.status === 'pending') {
                return !cancellation.approved && !cancellation.refusedAt;
            } else if (cancellationsData.filters.status === 'approved') {
                return cancellation.approved === true;
            } else if (cancellationsData.filters.status === 'refused') {
                return cancellation.refusedAt !== null;
            }
            return true;
        });
    }

    // Apply search filter
    if (cancellationsData.filters.search) {
        const searchTerm = cancellationsData.filters.search.toLowerCase();
        filtered = filtered.filter(cancellation => {
            const requesterName = cancellation.requester?.fullName || cancellation.requesterFullName || '';
            const reason = cancellation.reason || '';
            const itemsText = (cancellation.items || [])
                .map(item => `${item.licencePlateNumber || ''} ${item.name || ''}`)
                .join(' ')
                .toLowerCase();
            
            return requesterName.toLowerCase().includes(searchTerm) ||
                   reason.toLowerCase().includes(searchTerm) ||
                   itemsText.includes(searchTerm);
        });
    }

    // Apply requester filter
    if (cancellationsData.filters.requester !== 'all') {
        filtered = filtered.filter(cancellation => {
            const requesterId = cancellation.requester?.id || cancellation.requesterId;
            return requesterId && requesterId.toString() === cancellationsData.filters.requester;
        });
    }

    // Apply date range filter
    if (cancellationsData.filters.dateRange !== 'all') {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        filtered = filtered.filter(cancellation => {
            if (!cancellation.requestedAt) return false;
            const requestDate = new Date(cancellation.requestedAt);
            requestDate.setHours(0, 0, 0, 0);
            
            switch (cancellationsData.filters.dateRange) {
                case 'today':
                    return requestDate.getTime() === today.getTime();
                case 'week':
                    const weekAgo = new Date(today);
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return requestDate >= weekAgo;
                case 'month':
                    const monthAgo = new Date(today);
                    monthAgo.setMonth(monthAgo.getMonth() - 1);
                    return requestDate >= monthAgo;
                case 'year':
                    const yearAgo = new Date(today);
                    yearAgo.setFullYear(yearAgo.getFullYear() - 1);
                    return requestDate >= yearAgo;
                default:
                    return true;
            }
        });
    }

    cancellationsData.filteredCancellations = filtered;
}

/**
 * Update cancellations UI
 */
function updateCancellationsUI() {
    updateCancellationsStats();
    updateCancellationsTable();
    updatePagination();
}

/**
 * Update cancellations stats
 */
function updateCancellationsStats() {
    const statsContainer = document.getElementById('cancellationsStatsContainer');
    if (!statsContainer) return;

    const total = cancellationsData.cancellations.length;
    const pending = cancellationsData.cancellations.filter(c => !c.approved && !c.refusedAt).length;
    const approved = cancellationsData.cancellations.filter(c => c.approved === true).length;
    const refused = cancellationsData.cancellations.filter(c => c.refusedAt !== null).length;

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

/**
 * Update cancellations table
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

    cancellationsData.filteredCancellations.forEach(cancellation => {
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

        // Action buttons
        let actionsHtml = '';
        const isRejected = cancellation.refusedAt !== null;
        const isApproved = cancellation.approved === true;
        const isPending = !isApproved && !isRejected;
        
        // Botón de ver detalles (siempre visible)
        const viewDetailsButton = `
            <button onclick="openCancellationDetailsModal(${cancellation.id})" 
                class="group relative px-3 py-2 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white rounded-lg text-xs font-semibold transition-all duration-200 transform hover:scale-105 active:scale-95 flex items-center gap-1.5 shadow-md hover:shadow-lg"
                title="Ver detalles de la baja">
                <i class="fas fa-eye"></i>
                <span class="hidden sm:inline">Ver</span>
            </button>
        `;
        
        if (isPending) {
            // Pending cancellation - show accept/refuse buttons and upload format button
            actionsHtml = `
                <div class="flex items-center justify-center gap-2 flex-wrap">
                    ${viewDetailsButton}
                    <button onclick="openAcceptCancellationModal(${cancellation.id})" 
                        class="group relative px-3 py-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg text-xs font-semibold transition-all duration-200 transform hover:scale-105 active:scale-95 flex items-center gap-1.5 shadow-md hover:shadow-lg"
                        title="Aprobar esta baja">
                        <i class="fas fa-check-circle"></i>
                        <span>Aprobar</span>
                    </button>
                    <button onclick="openRefuseCancellationModal(${cancellation.id})" 
                        class="group relative px-3 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg text-xs font-semibold transition-all duration-200 transform hover:scale-105 active:scale-95 flex items-center gap-1.5 shadow-md hover:shadow-lg"
                        title="Rechazar esta baja">
                        <i class="fas fa-times-circle"></i>
                        <span>Rechazar</span>
                    </button>
                    <button onclick="openUploadFormatModal(${cancellation.id})" 
                        class="group relative px-3 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg text-xs font-semibold transition-all duration-200 transform hover:scale-105 active:scale-95 flex items-center gap-1.5 shadow-md hover:shadow-lg"
                        title="Subir formato GIL-F-011 (CONCEPTO TÉCNICO DE BIENES)">
                        <i class="fas fa-file-upload"></i>
                        <span class="hidden sm:inline">Formato</span>
                    </button>
                </div>
            `;
        } else if (isRejected) {
            // Rejected cancellation - show format and example buttons
            actionsHtml = `
                <div class="flex items-center justify-center gap-2 flex-wrap">
                    ${viewDetailsButton}
                    ${cancellation.urlFormat ? `
                        <button onclick="downloadCancellationFormat(${cancellation.id})" 
                            class="group relative px-3 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg text-xs font-semibold transition-all duration-200 transform hover:scale-105 active:scale-95 flex items-center gap-1.5 shadow-md hover:shadow-lg"
                            title="Descargar formato GIL-F-011">
                            <i class="fas fa-download"></i>
                            <span class="hidden sm:inline">Formato</span>
                        </button>
                    ` : `
                        <button onclick="openUploadFormatModal(${cancellation.id})" 
                            class="group relative px-3 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg text-xs font-semibold transition-all duration-200 transform hover:scale-105 active:scale-95 flex items-center gap-1.5 shadow-md hover:shadow-lg"
                            title="Subir formato GIL-F-011">
                            <i class="fas fa-upload"></i>
                            <span class="hidden sm:inline">Formato</span>
                        </button>
                    `}
                    ${cancellation.urlCorrectedExample ? `
                        <button onclick="downloadCancellationFormatExample(${cancellation.id})" 
                            class="group relative px-3 py-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-lg text-xs font-semibold transition-all duration-200 transform hover:scale-105 active:scale-95 flex items-center gap-1.5 shadow-md hover:shadow-lg"
                            title="Descargar ejemplo de formato">
                            <i class="fas fa-file-pdf"></i>
                            <span class="hidden sm:inline">Ejemplo</span>
                        </button>
                    ` : `
                        <button onclick="openUploadFormatExampleModal(${cancellation.id})" 
                            class="group relative px-3 py-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-lg text-xs font-semibold transition-all duration-200 transform hover:scale-105 active:scale-95 flex items-center gap-1.5 shadow-md hover:shadow-lg"
                            title="Subir ejemplo de formato corregido">
                            <i class="fas fa-file-upload"></i>
                            <span class="hidden sm:inline">Ejemplo</span>
                        </button>
                    `}
                </div>
            `;
        } else {
            // Approved cancellation - show only format button (no example button)
            actionsHtml = `
                <div class="flex items-center justify-center gap-2 flex-wrap">
                    ${viewDetailsButton}
                    ${cancellation.urlFormat ? `
                        <button onclick="downloadCancellationFormat(${cancellation.id})" 
                            class="group relative px-3 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg text-xs font-semibold transition-all duration-200 transform hover:scale-105 active:scale-95 flex items-center gap-1.5 shadow-md hover:shadow-lg"
                            title="Descargar formato GIL-F-011">
                            <i class="fas fa-download"></i>
                            <span class="hidden sm:inline">Formato</span>
                        </button>
                    ` : `
                        <button onclick="openUploadFormatModal(${cancellation.id})" 
                            class="group relative px-3 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg text-xs font-semibold transition-all duration-200 transform hover:scale-105 active:scale-95 flex items-center gap-1.5 shadow-md hover:shadow-lg"
                            title="Subir formato GIL-F-011">
                            <i class="fas fa-upload"></i>
                            <span class="hidden sm:inline">Formato</span>
                        </button>
                    `}
                </div>
            `;
        }

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
 * Update pagination
 */
function updatePagination() {
    const container = document.getElementById('paginationContainer');
    if (!container) return;

    const totalPages = cancellationsData.totalPages;
    const currentPage = cancellationsData.currentPage;
    const totalElements = cancellationsData.totalElements;

    // Calculate start and end items for current page
    const startItem = totalElements === 0 ? 0 : (currentPage * cancellationsData.pageSize) + 1;
    const endItem = Math.min((currentPage + 1) * cancellationsData.pageSize, totalElements);

    if (totalPages <= 1) {
        container.innerHTML = `
            <div class="text-sm text-gray-600 dark:text-gray-400">
                Mostrando ${startItem}-${endItem} de ${totalElements} baja${totalElements !== 1 ? 's' : ''}
            </div>
            <div></div>
        `;
        return;
    }

    let paginationHtml = `
        <div class="flex items-center justify-between w-full">
            <div class="text-sm text-gray-600 dark:text-gray-400">
                Mostrando ${startItem}-${endItem} de ${totalElements} baja${totalElements !== 1 ? 's' : ''}
            </div>
            <div class="flex items-center gap-2">
    `;

    // Previous button
    paginationHtml += `
        <button onclick="changeCancellationPage(${currentPage - 1})" 
            ${currentPage === 0 ? 'disabled' : ''}
            class="px-4 py-2 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium">
            <i class="fas fa-chevron-left"></i>
        </button>
    `;

    // Page numbers - show max 5 visible pages
    const maxVisiblePages = 5;
    let startPage = Math.max(0, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages - 1, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(0, endPage - maxVisiblePages + 1);
    }

    // Show first page if not in range
    if (startPage > 0) {
        paginationHtml += `
            <button onclick="changeCancellationPage(0)" 
                    class="px-4 py-2 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium">
                1
            </button>
        `;
        if (startPage > 1) {
            paginationHtml += `
                <span class="px-2 text-gray-500 dark:text-gray-400">...</span>
            `;
        }
    }

    // Show visible page numbers
    for (let i = startPage; i <= endPage; i++) {
        paginationHtml += `
            <button onclick="changeCancellationPage(${i})" 
                    class="px-4 py-2 border-2 ${i === currentPage 
                        ? 'bg-[#00AF00] text-white border-[#00AF00] dark:bg-[#00AF00] dark:border-[#00AF00]' 
                        : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'} rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium">
                ${i + 1}
            </button>
        `;
    }

    // Show last page if not in range
    if (endPage < totalPages - 1) {
        if (endPage < totalPages - 2) {
            paginationHtml += `
                <span class="px-2 text-gray-500 dark:text-gray-400">...</span>
            `;
        }
        paginationHtml += `
            <button onclick="changeCancellationPage(${totalPages - 1})" 
                    class="px-4 py-2 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium">
                ${totalPages}
            </button>
        `;
    }

    // Next button
    paginationHtml += `
        <button onclick="changeCancellationPage(${currentPage + 1})" 
            ${currentPage >= totalPages - 1 ? 'disabled' : ''}
            class="px-4 py-2 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium">
            <i class="fas fa-chevron-right"></i>
        </button>
    `;

    paginationHtml += `
            </div>
        </div>
    `;
    container.innerHTML = paginationHtml;
}

/**
 * Change cancellation page
 */
async function changeCancellationPage(page) {
    if (page < 0 || page >= cancellationsData.totalPages) {
        return;
    }

    cancellationsData.currentPage = page;
    await loadCancellations();
    updateCancellationsUI();
}

/**
 * Show loading state
 */
function showLoadingState() {
    const refreshIcon = document.getElementById('refreshIcon');
    if (refreshIcon) {
        refreshIcon.classList.add('fa-spin');
    }
}

/**
 * Hide loading state
 */
function hideLoadingState() {
    const refreshIcon = document.getElementById('refreshIcon');
    if (refreshIcon) {
        refreshIcon.classList.remove('fa-spin');
    }
}

/**
 * Show error state
 */
function showErrorState(message) {
    const container = document.getElementById('cancellationsTableContainer');
    if (container) {
        container.innerHTML = `
            <div class="text-center py-12">
                <i class="fas fa-exclamation-triangle text-4xl text-red-500 mb-4"></i>
                <p class="text-gray-600 dark:text-gray-400 text-lg">${message}</p>
            </div>
        `;
    }
}

/**
 * Update user info display
 */
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
            'ADMIN_REGIONAL': 'Administrador Regional',
            'ADMIN_INSTITUTION': 'Administrador Institucional',
            'ADMIN_INSTITUTIONAL': 'Administrador Institucional',
            'WAREHOUSE': 'Encargado de Almacén',
            'USER': 'Usuario'
        }[userData.role] || userData.role || '';
        headerUserRole.textContent = roleText;
    }
    if (headerUserAvatar) {
        const avatarUrl = userData.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.fullName || 'User')}&background=00AF00&color=fff&size=128`;
        headerUserAvatar.innerHTML = `<img src="${avatarUrl}" alt="Avatar" class="w-10 h-10 rounded-full object-cover">`;
    }
}

/**
 * Modal functions with smooth animations
 */
function openAcceptCancellationModal(cancellationId) {
    const modal = document.getElementById('acceptCancellationModal');
    document.getElementById('acceptCancellationId').value = cancellationId;
    document.getElementById('acceptComment').value = '';
    modal.classList.remove('hidden');
    // Trigger animation
    setTimeout(() => {
        const modalContent = modal.querySelector('div > div');
        if (modalContent) {
            modalContent.style.transform = 'scale(1)';
        }
    }, 10);
}

function closeAcceptCancellationModal() {
    const modal = document.getElementById('acceptCancellationModal');
    const modalContent = modal.querySelector('div > div');
    if (modalContent) {
        modalContent.style.transform = 'scale(0.95)';
    }
    setTimeout(() => {
        modal.classList.add('hidden');
    }, 200);
}

function openRefuseCancellationModal(cancellationId) {
    const modal = document.getElementById('refuseCancellationModal');
    document.getElementById('refuseCancellationId').value = cancellationId;
    document.getElementById('refuseComment').value = '';
    modal.classList.remove('hidden');
    // Trigger animation
    setTimeout(() => {
        const modalContent = modal.querySelector('div > div');
        if (modalContent) {
            modalContent.style.transform = 'scale(1)';
        }
    }, 10);
}

function closeRefuseCancellationModal() {
    const modal = document.getElementById('refuseCancellationModal');
    const modalContent = modal.querySelector('div > div');
    if (modalContent) {
        modalContent.style.transform = 'scale(0.95)';
    }
    setTimeout(() => {
        modal.classList.add('hidden');
    }, 200);
}

/**
 * Handle accept cancellation
 */
async function handleAcceptCancellation() {
    const cancellationId = parseInt(document.getElementById('acceptCancellationId').value);
    const comment = document.getElementById('acceptComment').value.trim();

    if (!comment) {
        if (typeof showInventoryErrorToast === 'function') {
            showInventoryErrorToast('Comentario requerido', 'Por favor ingrese un comentario para aprobar la cancelación');
        } else {
            alert('Por favor ingrese un comentario');
        }
        return;
    }

    // Deshabilitar botón mientras se procesa
    const submitBtn = document.querySelector('#acceptCancellationModal button[type="submit"]');
    const originalText = submitBtn ? submitBtn.innerHTML : '';
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Procesando...';
    }

    try {
        await acceptCancellation(cancellationId, comment);
        
        if (typeof showInventorySuccessToast === 'function') {
            showInventorySuccessToast('Baja aprobada', 'La cancelación ha sido aprobada exitosamente');
        } else {
            alert('Cancelación aprobada exitosamente');
        }

        closeAcceptCancellationModal();
        await loadCancellationsData();
    } catch (error) {
        console.error('Error accepting cancellation:', error);
        if (typeof showInventoryErrorToast === 'function') {
            showInventoryErrorToast('Error al aprobar', error.message || 'No se pudo aprobar la cancelación');
        } else {
            alert(error.message || 'Error al aprobar la cancelación');
        }
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    }
}

/**
 * Handle refuse cancellation
 */
async function handleRefuseCancellation() {
    const cancellationId = parseInt(document.getElementById('refuseCancellationId').value);
    const comment = document.getElementById('refuseComment').value.trim();

    if (!comment) {
        if (typeof showInventoryErrorToast === 'function') {
            showInventoryErrorToast('Comentario requerido', 'Por favor ingrese un comentario para rechazar la cancelación');
        } else {
            alert('Por favor ingrese un comentario');
        }
        return;
    }

    // Deshabilitar botón mientras se procesa
    const submitBtn = document.querySelector('#refuseCancellationModal button[type="submit"]');
    const originalText = submitBtn ? submitBtn.innerHTML : '';
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Procesando...';
    }

    try {
        await refuseCancellation(cancellationId, comment);
        
        if (typeof showInventorySuccessToast === 'function') {
            showInventorySuccessToast('Baja rechazada', 'La cancelación ha sido rechazada exitosamente');
        } else {
            alert('Cancelación rechazada exitosamente');
        }

        closeRefuseCancellationModal();
        await loadCancellationsData();
    } catch (error) {
        console.error('Error refusing cancellation:', error);
        if (typeof showInventoryErrorToast === 'function') {
            showInventoryErrorToast('Error al rechazar', error.message || 'No se pudo rechazar la cancelación');
        } else {
            alert(error.message || 'Error al rechazar la cancelación');
        }
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    }
}

// Setup search functionality
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('cancellationsSearch');
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                cancellationsData.filters.search = this.value;
                cancellationsData.currentPage = 0; // Reset to first page when searching
                filterCancellations();
                updateCancellationsUI();
            }, 300);
        });
    }

    // Setup status filter with CustomSelect
    setupStatusFilter();
    
    // Setup requester filter
    setupRequesterFilter();
    
    // Setup date range filter
    setupDateRangeFilter();

    // Load initial data
    loadCancellationsData();
});

// Store status filter CustomSelect instance
let statusFilterSelect = null;

/**
 * Setup status filter
 */
function setupStatusFilter() {
    const statusSelect = document.getElementById('statusSelect');
    if (!statusSelect) return;

    // Use CustomSelect if available
    if (typeof CustomSelect !== 'undefined') {
        try {
            // First, set up options from HTML
            const optionsContainer = document.getElementById('statusOptions');
            const options = [];
            if (optionsContainer) {
                optionsContainer.querySelectorAll('.custom-select-option').forEach(opt => {
                    const value = opt.dataset.value || 'all';
                    // Extract clean label text - get text after icon
                    let label = opt.textContent.trim();
                    // Remove icon text, keep only the actual text
                    const textMatch = label.match(/(?:Todos los estados|Pendientes|Aprobadas|Rechazadas)/);
                    if (textMatch) {
                        label = textMatch[0];
                    } else {
                        // Fallback: try to get text after removing common icon patterns
                        label = label.replace(/^[^\w]*/, '').trim();
                    }
                    options.push({ value, label: label || value });
                });
            }
            
            statusFilterSelect = new CustomSelect('statusSelect', {
                placeholder: 'Todos los estados',
                onChange: (option) => {
                    const value = option.value || option.dataset?.value || 'all';
                    cancellationsData.filters.status = value;
                    cancellationsData.currentPage = 0; // Reset to first page when filter changes
                    filterCancellations();
                    updateCancellationsUI();
                }
            });
            
            // Set options if available - this will replace the HTML options
            if (options.length > 0 && statusFilterSelect.setOptions) {
                statusFilterSelect.setOptions(options);
                // Set initial value to "all" after setting options
                setTimeout(() => {
                    if (statusFilterSelect && statusFilterSelect.setValue) {
                        statusFilterSelect.setValue('all');
                    }
                }, 200);
            } else {
                // If setOptions doesn't work, manually set the text and use fallback
                const textEl = document.querySelector('#statusSelect .custom-select-text');
                if (textEl) {
                    textEl.textContent = 'Todos los estados';
                    textEl.classList.remove('custom-select-placeholder');
                }
                // Use fallback handler to ensure clicks work
                setupStatusFilterFallback();
            }
        } catch (e) {
            console.warn('Could not initialize CustomSelect for status filter, using fallback', e);
            setupStatusFilterFallback();
        }
    } else {
        setupStatusFilterFallback();
    }
}

function setupStatusFilterFallback() {
    const statusSelect = document.getElementById('statusSelect');
    if (!statusSelect) return;
    
    const trigger = statusSelect.querySelector('.custom-select-trigger');
    const options = statusSelect.querySelectorAll('.custom-select-option');
    const textElement = statusSelect.querySelector('.custom-select-text');
    const dropdown = statusSelect.querySelector('.custom-select-dropdown');
    
    if (!trigger || !options || options.length === 0) {
        console.error('Status filter elements not found');
        return;
    }
    
    // Remove any existing event listeners by cloning
    const newTrigger = trigger.cloneNode(true);
    trigger.parentNode.replaceChild(newTrigger, trigger);
    
    // Add click handler to trigger
    newTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        statusSelect.classList.toggle('open');
    });
    
    // Add click handlers to options
    options.forEach(option => {
        // Remove existing listeners
        const newOption = option.cloneNode(true);
        option.parentNode.replaceChild(newOption, option);
        
        newOption.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            
            const value = newOption.dataset.value || 'all';
            cancellationsData.filters.status = value;
            
            // Update text
            const textContent = newOption.textContent.trim();
            const textEl = statusSelect.querySelector('.custom-select-text');
            if (textEl) {
                textEl.textContent = textContent;
            }
            
            // Close dropdown
            statusSelect.classList.remove('open');
            
            // Apply filter
            filterCancellations();
            updateCancellationsUI();
        });
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!statusSelect.contains(e.target)) {
            statusSelect.classList.remove('open');
        }
    });
}

// Store requester filter CustomSelect instance
let requesterFilterSelect = null;

/**
 * Setup requester filter
 */
function setupRequesterFilter() {
    const requesterSelect = document.getElementById('requesterSelect');
    if (!requesterSelect) return;

    // Use CustomSelect if available
    if (typeof CustomSelect !== 'undefined') {
        try {
            requesterFilterSelect = new CustomSelect('requesterSelect', {
                onChange: (option) => {
                    cancellationsData.filters.requester = option.value || 'all';
                    cancellationsData.currentPage = 0; // Reset to first page when filter changes
                    filterCancellations();
                    updateCancellationsUI();
                }
            });
            
            // Populate after data loads
            updateRequesterFilterOptions();
        } catch (e) {
            console.warn('Could not initialize CustomSelect for requester filter', e);
        }
    }
}

/**
 * Update requester filter options
 */
function updateRequesterFilterOptions() {
    const optionsContainer = document.getElementById('requesterOptions');
    if (!optionsContainer) return;

    // Get unique requesters
    const requestersMap = new Map();
    cancellationsData.cancellations.forEach(cancellation => {
        const requesterId = cancellation.requester?.id || cancellation.requesterId;
        const requesterName = cancellation.requester?.fullName || cancellation.requesterFullName || 'Desconocido';
        
        if (requesterId && !requestersMap.has(requesterId)) {
            requestersMap.set(requesterId, requesterName);
        }
    });

    // Create options array
    const options = [
        { value: 'all', label: 'Todos los solicitantes' }
    ];
    
    requestersMap.forEach((name, id) => {
        options.push({
            value: id.toString(),
            label: name
        });
    });

    // Update CustomSelect if available
    if (requesterFilterSelect && typeof requesterFilterSelect.setOptions === 'function') {
        requesterFilterSelect.setOptions(options);
    } else {
        // Fallback: update HTML directly
        optionsContainer.innerHTML = '';
        options.forEach(opt => {
            const option = document.createElement('div');
            option.className = 'custom-select-option';
            option.dataset.value = opt.value;
            if (opt.value === 'all') {
                option.innerHTML = `<i class="fas fa-users mr-2"></i>${opt.label}`;
            } else {
                option.innerHTML = `<i class="fas fa-user mr-2 text-[#00AF00]"></i>${opt.label}`;
            }
            optionsContainer.appendChild(option);
        });
    }
}

// Store date range filter CustomSelect instance
let dateRangeFilterSelect = null;

/**
 * Setup date range filter
 */
function setupDateRangeFilter() {
    const dateRangeSelect = document.getElementById('dateRangeSelect');
    if (!dateRangeSelect) return;

    // Use CustomSelect if available
    if (typeof CustomSelect !== 'undefined') {
        try {
            // First, set up options from HTML
            const optionsContainer = document.getElementById('dateRangeOptions');
            const options = [];
            if (optionsContainer) {
                optionsContainer.querySelectorAll('.custom-select-option').forEach(opt => {
                    const value = opt.dataset.value || 'all';
                    // Extract clean label text
                    let label = opt.textContent.trim();
                    // Remove icon text, keep only the actual text
                    const textMatch = label.match(/(?:Todos los períodos|Hoy|Última semana|Último mes|Último año)/);
                    if (textMatch) {
                        label = textMatch[0];
                    } else {
                        // Fallback: try to get text after removing common icon patterns
                        label = label.replace(/^[^\w]*/, '').trim();
                    }
                    options.push({ value, label: label || value });
                });
            }
            
            dateRangeFilterSelect = new CustomSelect('dateRangeSelect', {
                placeholder: 'Todos los períodos',
                onChange: (option) => {
                    const value = option.value || option.dataset?.value || 'all';
                    cancellationsData.filters.dateRange = value;
                    cancellationsData.currentPage = 0; // Reset to first page when filter changes
                    filterCancellations();
                    updateCancellationsUI();
                }
            });
            
            // Set options if available
            if (options.length > 0 && dateRangeFilterSelect.setOptions) {
                dateRangeFilterSelect.setOptions(options);
                // Set initial value to "all" to show "Todos los períodos"
                setTimeout(() => {
                    if (dateRangeFilterSelect && dateRangeFilterSelect.setValue) {
                        dateRangeFilterSelect.setValue('all');
                    }
                }, 150);
            } else {
                // If setOptions doesn't work, manually set the text to avoid "Seleccionar..."
                const textEl = document.querySelector('#dateRangeSelect .custom-select-text');
                if (textEl) {
                    textEl.textContent = 'Todos los períodos';
                    textEl.classList.remove('custom-select-placeholder');
                }
                // Try setting value directly
                setTimeout(() => {
                    if (dateRangeFilterSelect && dateRangeFilterSelect.setValue) {
                        dateRangeFilterSelect.setValue('all');
                    }
                }, 200);
            }
        } catch (e) {
            console.warn('Could not initialize CustomSelect for date range filter, using fallback', e);
            setupDateRangeFilterFallback();
        }
    } else {
        setupDateRangeFilterFallback();
    }
}

function setupDateRangeFilterFallback() {
    const dateRangeSelect = document.getElementById('dateRangeSelect');
    if (!dateRangeSelect) return;
    
    const trigger = dateRangeSelect.querySelector('.custom-select-trigger');
    const options = dateRangeSelect.querySelectorAll('.custom-select-option');
    const textElement = dateRangeSelect.querySelector('.custom-select-text');
    
    if (!trigger || !options || options.length === 0) {
        console.error('Date range filter elements not found');
        return;
    }
    
    // Remove any existing event listeners by cloning
    const newTrigger = trigger.cloneNode(true);
    trigger.parentNode.replaceChild(newTrigger, trigger);
    
    // Add click handler to trigger
    newTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        dateRangeSelect.classList.toggle('open');
    });
    
    // Add click handlers to options
    options.forEach(option => {
        // Remove existing listeners
        const newOption = option.cloneNode(true);
        option.parentNode.replaceChild(newOption, option);
        
        newOption.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            
            const value = newOption.dataset.value || 'all';
            cancellationsData.filters.dateRange = value;
            
            // Update text - remove icons from text content
            let textContent = newOption.textContent.trim();
            // Remove icon text if present
            textContent = textContent.replace(/^[^\w]*/, '').trim();
            if (textElement) {
                textElement.textContent = textContent;
            }
            
            // Close dropdown
            dateRangeSelect.classList.remove('open');
            
            // Apply filter
            filterCancellations();
            updateCancellationsUI();
        });
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!dateRangeSelect.contains(e.target)) {
            dateRangeSelect.classList.remove('open');
        }
    });
}

/**
 * Open upload format modal
 */
function openUploadFormatModal(cancellationId) {
    const modal = document.getElementById('uploadFormatModal');
    document.getElementById('uploadFormatCancellationId').value = cancellationId;
    document.getElementById('uploadFormatFile').value = '';
    modal.classList.remove('hidden');
    // Trigger animation
    setTimeout(() => {
        const modalContent = modal.querySelector('div > div');
        if (modalContent) {
            modalContent.style.transform = 'scale(1)';
        }
    }, 10);
}

/**
 * Close upload format modal
 */
function closeUploadFormatModal() {
    const modal = document.getElementById('uploadFormatModal');
    const modalContent = modal.querySelector('div > div');
    if (modalContent) {
        modalContent.style.transform = 'scale(0.95)';
    }
    setTimeout(() => {
        modal.classList.add('hidden');
        document.getElementById('uploadFormatFile').value = '';
    }, 200);
}

/**
 * Open upload format example modal
 */
function openUploadFormatExampleModal(cancellationId) {
    const modal = document.getElementById('uploadFormatExampleModal');
    document.getElementById('uploadFormatExampleCancellationId').value = cancellationId;
    document.getElementById('uploadFormatExampleFile').value = '';
    modal.classList.remove('hidden');
    // Trigger animation
    setTimeout(() => {
        const modalContent = modal.querySelector('div > div');
        if (modalContent) {
            modalContent.style.transform = 'scale(1)';
        }
    }, 10);
}

/**
 * Close upload format example modal
 */
function closeUploadFormatExampleModal() {
    const modal = document.getElementById('uploadFormatExampleModal');
    const modalContent = modal.querySelector('div > div');
    if (modalContent) {
        modalContent.style.transform = 'scale(0.95)';
    }
    setTimeout(() => {
        modal.classList.add('hidden');
        document.getElementById('uploadFormatExampleFile').value = '';
    }, 200);
}

/**
 * Handle upload format
 */
async function handleUploadFormat() {
    const cancellationId = parseInt(document.getElementById('uploadFormatCancellationId').value);
    const fileInput = document.getElementById('uploadFormatFile');
    const file = fileInput.files[0];

    if (!file) {
        if (typeof showInventoryErrorToast === 'function') {
            showInventoryErrorToast('Archivo requerido', 'Por favor seleccione un archivo para subir');
        } else {
            alert('Por favor seleccione un archivo');
        }
        return;
    }

    // Validar tamaño del archivo (máximo 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
        if (typeof showInventoryErrorToast === 'function') {
            showInventoryErrorToast('Archivo muy grande', 'El archivo no puede exceder 10MB');
        } else {
            alert('El archivo no puede exceder 10MB');
        }
        return;
    }

    // Deshabilitar botón mientras se procesa
    const submitBtn = document.querySelector('#uploadFormatModal button[type="submit"]');
    const originalText = submitBtn ? submitBtn.innerHTML : '';
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Subiendo...';
    }

    try {
        const message = await uploadCancellationFormat(cancellationId, file);
        
        if (typeof showInventorySuccessToast === 'function') {
            showInventorySuccessToast('Formato subido', 'El formato GIL-F-011 se ha subido correctamente');
        } else {
            alert(message || 'Formato subido correctamente');
        }

        closeUploadFormatModal();
        await loadCancellationsData();
    } catch (error) {
        console.error('Error uploading format:', error);
        if (typeof showInventoryErrorToast === 'function') {
            showInventoryErrorToast('Error al subir', error.message || 'No se pudo subir el formato');
        } else {
            alert(error.message || 'Error al subir el formato');
        }
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    }
}

/**
 * Handle upload format example
 */
async function handleUploadFormatExample() {
    const cancellationId = parseInt(document.getElementById('uploadFormatExampleCancellationId').value);
    const fileInput = document.getElementById('uploadFormatExampleFile');
    const file = fileInput.files[0];

    if (!file) {
        if (typeof showInventoryErrorToast === 'function') {
            showInventoryErrorToast('Archivo requerido', 'Por favor seleccione un archivo de ejemplo para subir');
        } else {
            alert('Por favor seleccione un archivo');
        }
        return;
    }

    // Validar tamaño del archivo (máximo 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
        if (typeof showInventoryErrorToast === 'function') {
            showInventoryErrorToast('Archivo muy grande', 'El archivo no puede exceder 10MB');
        } else {
            alert('El archivo no puede exceder 10MB');
        }
        return;
    }

    // Deshabilitar botón mientras se procesa
    const submitBtn = document.querySelector('#uploadFormatExampleModal button[type="submit"]');
    const originalText = submitBtn ? submitBtn.innerHTML : '';
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Subiendo...';
    }

    try {
        const message = await uploadCancellationFormatExample(cancellationId, file);
        
        if (typeof showInventorySuccessToast === 'function') {
            showInventorySuccessToast('Ejemplo subido', 'El formato de ejemplo se ha subido correctamente');
        } else {
            alert(message || 'Formato de ejemplo subido correctamente');
        }

        closeUploadFormatExampleModal();
        await loadCancellationsData();
    } catch (error) {
        console.error('Error uploading format example:', error);
        if (typeof showInventoryErrorToast === 'function') {
            showInventoryErrorToast('Error al subir', error.message || 'No se pudo subir el formato de ejemplo');
        } else {
            alert(error.message || 'Error al subir el formato de ejemplo');
        }
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    }
}

/**
 * Open cancellation details modal
 */
function openCancellationDetailsModal(cancellationId) {
    // Find the cancellation in the data
    const cancellation = cancellationsData.cancellations.find(c => c.id === cancellationId) ||
                        cancellationsData.filteredCancellations.find(c => c.id === cancellationId);
    
    if (!cancellation) {
        if (typeof showInventoryErrorToast === 'function') {
            showInventoryErrorToast('Error', 'No se pudo encontrar la información de la baja');
        } else {
            alert('No se pudo encontrar la información de la baja');
        }
        return;
    }

    // Populate modal with cancellation data
    populateCancellationDetailsModal(cancellation);
    
    // Show modal
    const modal = document.getElementById('cancellationDetailsModal');
    if (modal) {
        modal.classList.remove('hidden');
        // Trigger animation
        setTimeout(() => {
            const modalContent = modal.querySelector('div > div');
            if (modalContent) {
                modalContent.style.transform = 'scale(1)';
            }
        }, 10);
    }
}

/**
 * Populate cancellation details modal with data
 */
function populateCancellationDetailsModal(cancellation) {
    // Format dates
    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        const date = new Date(dateStr);
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const requesterName = cancellation.requesterFullName || cancellation.requester?.fullName || 'N/A';
    const requesterEmail = cancellation.requesterEmail || cancellation.requester?.email || 'N/A';
    const checkerName = cancellation.checkerFullName || cancellation.checker?.fullName || 'N/A';
    const checkerEmail = cancellation.checkerEmail || cancellation.checker?.email || 'N/A';
    
    // Determine status
    let statusText, statusColor, statusIcon;
    if (cancellation.approved === true) {
        statusText = 'Aprobada';
        statusColor = 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 border-green-300 dark:border-green-700';
        statusIcon = '<i class="fas fa-check-circle mr-2"></i>';
    } else if (cancellation.refusedAt !== null) {
        statusText = 'Rechazada';
        statusColor = 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 border-red-300 dark:border-red-700';
        statusIcon = '<i class="fas fa-times-circle mr-2"></i>';
    } else {
        statusText = 'Pendiente';
        statusColor = 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 border-yellow-300 dark:border-yellow-700';
        statusIcon = '<i class="fas fa-clock mr-2"></i>';
    }

    // Build items list
    const items = cancellation.items || [];
    let itemsHtml = '';
    if (items.length === 0) {
        itemsHtml = `
            <div class="text-center py-8 text-gray-500 dark:text-gray-400">
                <i class="fas fa-inbox text-4xl mb-3"></i>
                <p>No hay items asociados a esta baja</p>
            </div>
        `;
    } else {
        itemsHtml = '<div class="space-y-3">';
        items.forEach((item, index) => {
            const itemName = item.productName || item.displayName || `Item ${item.id || index + 1}`;
            const plateNumber = item.licencePlateNumber || 'Sin placa';
            itemsHtml += `
                <div class="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800/50 dark:to-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
                    <div class="flex items-center gap-4 flex-1">
                        <div class="w-10 h-10 bg-gradient-to-br from-[#00AF00] to-[#008800] rounded-lg flex items-center justify-center text-white font-bold">
                            ${index + 1}
                        </div>
                        <div class="flex-1">
                            <h4 class="font-semibold text-gray-800 dark:text-gray-200">${itemName}</h4>
                            <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                <i class="fas fa-tag mr-1 text-[#00AF00]"></i>
                                <span class="font-medium">Placa:</span> ${plateNumber}
                            </p>
                            ${item.id ? `<p class="text-xs text-gray-500 dark:text-gray-500 mt-1">ID: ${item.id}</p>` : ''}
                        </div>
                    </div>
                </div>
            `;
        });
        itemsHtml += '</div>';
    }

    // Build modal content
    const modalContent = `
        <div class="space-y-6">
            <!-- Status Badge -->
            <div class="flex items-center justify-center">
                <span class="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold ${statusColor} border-2">
                    ${statusIcon}${statusText}
                </span>
            </div>

            <!-- Request Information -->
            <div class="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-5 border border-blue-200 dark:border-blue-800">
                <h3 class="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center">
                    <i class="fas fa-info-circle mr-2 text-blue-600 dark:text-blue-400"></i>
                    Información de la Solicitud
                </h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">ID de la Baja</p>
                        <p class="font-semibold text-gray-800 dark:text-white">#${cancellation.id}</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">Fecha de Solicitud</p>
                        <p class="font-semibold text-gray-800 dark:text-white">${formatDate(cancellation.requestedAt)}</p>
                    </div>
                </div>
            </div>

            <!-- Requester Information -->
            <div class="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl p-5 border border-green-200 dark:border-green-800">
                <h3 class="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center">
                    <i class="fas fa-user mr-2 text-green-600 dark:text-green-400"></i>
                    Solicitante
                </h3>
                <div class="space-y-2">
                    <div>
                        <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">Nombre Completo</p>
                        <p class="font-semibold text-gray-800 dark:text-white">${requesterName}</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">Correo Electrónico</p>
                        <p class="font-semibold text-gray-800 dark:text-white">${requesterEmail}</p>
                    </div>
                </div>
            </div>

            <!-- Reason -->
            <div class="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl p-5 border border-purple-200 dark:border-purple-800">
                <h3 class="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center">
                    <i class="fas fa-comment-alt mr-2 text-purple-600 dark:text-purple-400"></i>
                    Razón de la Baja
                </h3>
                <p class="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                    ${cancellation.reason || 'Sin razón especificada'}
                </p>
            </div>

            <!-- Items -->
            <div class="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-xl p-5 border border-orange-200 dark:border-orange-800">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-lg font-bold text-gray-800 dark:text-white flex items-center">
                        <i class="fas fa-boxes mr-2 text-orange-600 dark:text-orange-400"></i>
                        Items de la Baja
                    </h3>
                    <span class="px-3 py-1 bg-orange-200 dark:bg-orange-900/50 text-orange-800 dark:text-orange-300 rounded-full text-sm font-semibold">
                        ${items.length} ${items.length === 1 ? 'item' : 'items'}
                    </span>
                </div>
                <div class="max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    ${itemsHtml}
                </div>
            </div>

            <!-- Review Information (if exists) -->
            ${(cancellation.checker || cancellation.checkerFullName || cancellation.approvedAt || cancellation.refusedAt) ? `
                <div class="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 rounded-xl p-5 border border-indigo-200 dark:border-indigo-800">
                    <h3 class="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center">
                        <i class="fas fa-user-check mr-2 text-indigo-600 dark:text-indigo-400"></i>
                        Información de Revisión
                    </h3>
                    <div class="space-y-3">
                        ${checkerName !== 'N/A' ? `
                            <div>
                                <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">Revisado Por</p>
                                <p class="font-semibold text-gray-800 dark:text-white">${checkerName}</p>
                                ${checkerEmail !== 'N/A' ? `<p class="text-sm text-gray-600 dark:text-gray-400 mt-1">${checkerEmail}</p>` : ''}
                            </div>
                        ` : ''}
                        ${cancellation.approvedAt ? `
                            <div>
                                <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">Fecha de Aprobación</p>
                                <p class="font-semibold text-green-700 dark:text-green-400">${formatDate(cancellation.approvedAt)}</p>
                            </div>
                        ` : ''}
                        ${cancellation.refusedAt ? `
                            <div>
                                <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">Fecha de Rechazo</p>
                                <p class="font-semibold text-red-700 dark:text-red-400">${formatDate(cancellation.refusedAt)}</p>
                            </div>
                        ` : ''}
                        ${cancellation.comment ? `
                            <div class="mt-4 pt-4 border-t border-indigo-200 dark:border-indigo-700">
                                <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">Comentario</p>
                                <p class="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap bg-white dark:bg-gray-800 p-3 rounded-lg border border-indigo-200 dark:border-indigo-700">
                                    ${cancellation.comment}
                                </p>
                            </div>
                        ` : ''}
                    </div>
                </div>
            ` : ''}
        </div>
    `;

    const modalBody = document.getElementById('cancellationDetailsModalBody');
    if (modalBody) {
        modalBody.innerHTML = modalContent;
    }
}

/**
 * Close cancellation details modal
 */
function closeCancellationDetailsModal() {
    const modal = document.getElementById('cancellationDetailsModal');
    if (modal) {
        const modalContent = modal.querySelector('div > div');
        if (modalContent) {
            modalContent.style.transform = 'scale(0.95)';
        }
        setTimeout(() => {
            modal.classList.add('hidden');
        }, 200);
    }
}

// Export functions to global scope
window.loadCancellationsData = loadCancellationsData;
window.changeCancellationPage = changeCancellationPage;
window.openAcceptCancellationModal = openAcceptCancellationModal;
window.closeAcceptCancellationModal = closeAcceptCancellationModal;
window.openRefuseCancellationModal = openRefuseCancellationModal;
window.closeRefuseCancellationModal = closeRefuseCancellationModal;
window.handleAcceptCancellation = handleAcceptCancellation;
window.handleRefuseCancellation = handleRefuseCancellation;
window.downloadCancellationFormat = downloadCancellationFormat;
window.downloadCancellationFormatExample = downloadCancellationFormatExample;
window.downloadFormatTemplate = downloadFormatTemplate;
window.askForCancellation = askForCancellation;
window.setupStatusFilter = setupStatusFilter;
window.setupRequesterFilter = setupRequesterFilter;
window.setupDateRangeFilter = setupDateRangeFilter;
window.updateRequesterFilterOptions = updateRequesterFilterOptions;
window.openUploadFormatModal = openUploadFormatModal;
window.closeUploadFormatModal = closeUploadFormatModal;
window.openUploadFormatExampleModal = openUploadFormatExampleModal;
window.closeUploadFormatExampleModal = closeUploadFormatExampleModal;
window.handleUploadFormat = handleUploadFormat;
window.handleUploadFormatExample = handleUploadFormatExample;
window.openCancellationDetailsModal = openCancellationDetailsModal;
window.closeCancellationDetailsModal = closeCancellationDetailsModal;

