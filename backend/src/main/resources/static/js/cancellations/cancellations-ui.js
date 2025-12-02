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
        await loadCurrentUserInfo();
        await loadCancellations();
        cancellationsData.isLoading = false;
        hideLoadingState();
        updateCancellationsUI();
    } catch (error) {
        console.error('Error loading cancellations data:', error);
        cancellationsData.isLoading = false;
        hideLoadingState();
        showErrorState('Error al cargar los datos de cancelaciones: ' + error.message);
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
            cancellationsData.userRole = userData.role;
            updateUserInfoDisplay(userData);
        } else {
            throw new Error('Failed to load user info');
        }
    } catch (error) {
        console.error('Error loading current user info:', error);
        updateUserInfoDisplay({
            fullName: 'Super Admin',
            role: 'SUPERADMIN',
            email: 'admin@sena.edu.co'
        });
        cancellationsData.userRole = 'SUPERADMIN';
    }
}

/**
 * Load cancellations
 */
async function loadCancellations() {
    try {
        const pageData = await fetchAllCancellations(
            cancellationsData.currentPage,
            cancellationsData.pageSize
        );

        console.log('Cancellations page data:', pageData);
        
        cancellationsData.cancellations = pageData.content || [];
        cancellationsData.totalPages = pageData.totalPages || 0;
        cancellationsData.totalElements = pageData.totalElements || 0;

        console.log('Loaded cancellations:', cancellationsData.cancellations.length);

        // Apply filters
        filterCancellations();
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
            const requesterName = cancellation.requester?.fullName || '';
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
                    <p class="text-sm text-blue-600 dark:text-blue-400 font-medium mb-1">Total Cancelaciones</p>
                    <p class="text-3xl font-bold text-blue-800 dark:text-blue-300">${total}</p>
                </div>
                <div class="w-12 h-12 bg-blue-500 dark:bg-blue-600 rounded-full flex items-center justify-center">
                    <i class="fas fa-list text-white text-xl"></i>
                </div>
            </div>
            <p class="text-xs text-blue-600 dark:text-blue-400">Todas las cancelaciones</p>
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
            <p class="text-xs text-green-600 dark:text-green-400">Cancelaciones aprobadas</p>
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
            <p class="text-xs text-red-600 dark:text-red-400">Cancelaciones rechazadas</p>
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
            <div class="flex items-center justify-center py-12">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00AF00]"></div>
            </div>
        `;
        return;
    }

    if (!cancellationsData.filteredCancellations || cancellationsData.filteredCancellations.length === 0) {
        container.innerHTML = `
            <div class="text-center py-12">
                <i class="fas fa-inbox text-4xl text-gray-400 dark:text-gray-500 mb-4"></i>
                <p class="text-gray-600 dark:text-gray-400 text-lg">No se encontraron cancelaciones</p>
                <p class="text-sm text-gray-500 dark:text-gray-500 mt-2">Intenta ajustar los filtros de búsqueda</p>
            </div>
        `;
        return;
    }

    let tableHtml = `
        <div class="overflow-x-auto">
            <table class="w-full">
                <thead>
                    <tr class="border-b border-gray-200 dark:border-gray-700">
                        <th class="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">ID</th>
                        <th class="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Solicitante</th>
                        <th class="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Items</th>
                        <th class="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Razón</th>
                        <th class="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Fecha Solicitud</th>
                        <th class="text-center py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Estado</th>
                        <th class="text-center py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Acciones</th>
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

        const requesterName = cancellation.requester?.fullName || 'N/A';
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
        if (!cancellation.approved && !cancellation.refusedAt) {
            // Pending cancellation - show accept/refuse buttons
            actionsHtml = `
                <div class="flex items-center justify-center gap-2">
                    <button onclick="openAcceptCancellationModal(${cancellation.id})" 
                        class="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1">
                        <i class="fas fa-check"></i>
                        <span>Aprobar</span>
                    </button>
                    <button onclick="openRefuseCancellationModal(${cancellation.id})" 
                        class="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1">
                        <i class="fas fa-times"></i>
                        <span>Rechazar</span>
                    </button>
                </div>
            `;
        } else {
            // Already processed - show download buttons if available
            actionsHtml = `
                <div class="flex items-center justify-center gap-2">
                    ${cancellation.urlFormat ? `
                        <button onclick="downloadCancellationFormat(${cancellation.id})" 
                            class="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
                            title="Descargar formato">
                            <i class="fas fa-download"></i>
                        </button>
                    ` : ''}
                    ${cancellation.urlCorrectedExample ? `
                        <button onclick="downloadCancellationFormatExample(${cancellation.id})" 
                            class="px-3 py-1.5 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
                            title="Descargar ejemplo">
                            <i class="fas fa-file-pdf"></i>
                        </button>
                    ` : ''}
                    <span class="text-xs text-gray-500 dark:text-gray-400">Procesada</span>
                </div>
            `;
        }

        tableHtml += `
            <tr class="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <td class="py-3 px-4 text-sm text-gray-800 dark:text-gray-200">#${cancellation.id}</td>
                <td class="py-3 px-4 text-sm text-gray-800 dark:text-gray-200">${requesterName}</td>
                <td class="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">${itemsText}</td>
                <td class="py-3 px-4 text-sm text-gray-600 dark:text-gray-400" title="${reason}">${truncatedReason}</td>
                <td class="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">${requestDate}</td>
                <td class="py-3 px-4 text-center">
                    <span class="px-3 py-1 rounded-full text-xs font-semibold ${statusColor}">
                        ${statusText}
                    </span>
                </td>
                <td class="py-3 px-4 text-center">
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

    if (totalPages <= 1) {
        container.innerHTML = `
            <div class="text-sm text-gray-600 dark:text-gray-400">
                Mostrando ${cancellationsData.filteredCancellations.length} de ${totalElements} cancelaciones
            </div>
            <div></div>
        `;
        return;
    }

    let paginationHtml = `
        <div class="text-sm text-gray-600 dark:text-gray-400">
            Mostrando página ${currentPage + 1} de ${totalPages} (${totalElements} cancelaciones)
        </div>
        <div class="flex gap-2">
    `;

    // Previous button
    paginationHtml += `
        <button onclick="changeCancellationPage(${currentPage - 1})" 
            ${currentPage === 0 ? 'disabled' : ''}
            class="px-3 py-2 rounded-lg ${currentPage === 0 
                ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed' 
                : 'bg-[#00AF00] hover:bg-[#008800] text-white'} transition-colors">
            <i class="fas fa-chevron-left"></i>
        </button>
    `;

    // Page numbers
    for (let i = 0; i < totalPages; i++) {
        if (i === 0 || i === totalPages - 1 || (i >= currentPage - 1 && i <= currentPage + 1)) {
            paginationHtml += `
                <button onclick="changeCancellationPage(${i})" 
                    class="px-3 py-2 rounded-lg ${i === currentPage 
                        ? 'bg-[#00AF00] text-white' 
                        : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'} transition-colors">
                    ${i + 1}
                </button>
            `;
        } else if (i === currentPage - 2 || i === currentPage + 2) {
            paginationHtml += `<span class="px-3 py-2 text-gray-400">...</span>`;
        }
    }

    // Next button
    paginationHtml += `
        <button onclick="changeCancellationPage(${currentPage + 1})" 
            ${currentPage >= totalPages - 1 ? 'disabled' : ''}
            class="px-3 py-2 rounded-lg ${currentPage >= totalPages - 1 
                ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed' 
                : 'bg-[#00AF00] hover:bg-[#008800] text-white'} transition-colors">
            <i class="fas fa-chevron-right"></i>
        </button>
    `;

    paginationHtml += `</div>`;
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
        headerUserRole.textContent = userData.role || '';
    }
    if (headerUserAvatar) {
        const avatarUrl = userData.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.fullName || 'User')}&background=00AF00&color=fff&size=128`;
        headerUserAvatar.innerHTML = `<img src="${avatarUrl}" alt="Avatar" class="w-10 h-10 rounded-full object-cover">`;
    }
}

/**
 * Modal functions
 */
function openAcceptCancellationModal(cancellationId) {
    document.getElementById('acceptCancellationId').value = cancellationId;
    document.getElementById('acceptComment').value = '';
    document.getElementById('acceptCancellationModal').classList.remove('hidden');
}

function closeAcceptCancellationModal() {
    document.getElementById('acceptCancellationModal').classList.add('hidden');
}

function openRefuseCancellationModal(cancellationId) {
    document.getElementById('refuseCancellationId').value = cancellationId;
    document.getElementById('refuseComment').value = '';
    document.getElementById('refuseCancellationModal').classList.remove('hidden');
}

function closeRefuseCancellationModal() {
    document.getElementById('refuseCancellationModal').classList.add('hidden');
}

/**
 * Handle accept cancellation
 */
async function handleAcceptCancellation() {
    const cancellationId = parseInt(document.getElementById('acceptCancellationId').value);
    const comment = document.getElementById('acceptComment').value.trim();

    if (!comment) {
        if (typeof showToast === 'function') {
            showToast('Por favor ingrese un comentario', 'error');
        } else {
            alert('Por favor ingrese un comentario');
        }
        return;
    }

    try {
        await acceptCancellation(cancellationId, comment);
        
        if (typeof showToast === 'function') {
            showToast('Cancelación aprobada exitosamente', 'success');
        } else {
            alert('Cancelación aprobada exitosamente');
        }

        closeAcceptCancellationModal();
        await loadCancellationsData();
    } catch (error) {
        console.error('Error accepting cancellation:', error);
        if (typeof showToast === 'function') {
            showToast(error.message || 'Error al aprobar la cancelación', 'error');
        } else {
            alert(error.message || 'Error al aprobar la cancelación');
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
        if (typeof showToast === 'function') {
            showToast('Por favor ingrese un comentario', 'error');
        } else {
            alert('Por favor ingrese un comentario');
        }
        return;
    }

    try {
        await refuseCancellation(cancellationId, comment);
        
        if (typeof showToast === 'function') {
            showToast('Cancelación rechazada exitosamente', 'success');
        } else {
            alert('Cancelación rechazada exitosamente');
        }

        closeRefuseCancellationModal();
        await loadCancellationsData();
    } catch (error) {
        console.error('Error refusing cancellation:', error);
        if (typeof showToast === 'function') {
            showToast(error.message || 'Error al rechazar la cancelación', 'error');
        } else {
            alert(error.message || 'Error al rechazar la cancelación');
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
                filterCancellations();
                updateCancellationsUI();
            }, 300);
        });
    }

    // Setup status filter
    const statusSelect = document.getElementById('statusSelect');
    if (statusSelect) {
        // This assumes you have a custom select component
        // You may need to adapt this to your select implementation
        document.getElementById('selectedStatus').addEventListener('change', function() {
            cancellationsData.filters.status = this.value;
            filterCancellations();
            updateCancellationsUI();
        });
    }

    // Load initial data
    loadCancellationsData();
});

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
window.askForCancellation = askForCancellation;

