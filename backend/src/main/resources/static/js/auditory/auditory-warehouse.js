// Auditoría data state for warehouse
let auditoryDataWarehouse = {
    currentPage: 0,
    pageSize: 6,
    totalPages: 0,
    totalAuditories: 0,
    isLoading: false,
    allAuditories: [], // Store all loaded auditories for client-side filtering
    filteredAuditories: [], // Store filtered auditories
    filters: {
        user: 'all',
        searchTerm: ''
    }
};

// Load all auditories from API for warehouse (for filtering)
async function loadAllAuditories() {
    try {
        const token = localStorage.getItem('jwt');
        if (!token) {
            throw new Error('No authentication token found');
        }

        auditoryDataWarehouse.isLoading = true;
        showLoadingState();

        // Load all auditories with a large page size
        const endpoint = `/api/v1/auditories/warehouse?page=0&size=10000`;

        const response = await fetch(endpoint, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        // Store all auditories for filtering
        auditoryDataWarehouse.allAuditories = data.auditories || [];
        auditoryDataWarehouse.totalAuditories = data.totalAuditories || auditoryDataWarehouse.allAuditories.length;
        
        // Update filter options
        updateFilterOptions();
        
        // Apply filters and display
        filterAuditories();
        
    } catch (error) {
        console.error('Error loading auditories:', error);
        showErrorState('Error al cargar los registros de auditoría: ' + error.message);
    } finally {
        auditoryDataWarehouse.isLoading = false;
        hideLoadingState();
    }
}

// Load auditories from API for warehouse (legacy function for compatibility)
async function loadAuditories(page = 0) {
    // Redirect to loadAllAuditories for filtering support
    await loadAllAuditories();
}

// Helper function to create avatar HTML
function createUserAvatar(imgUrl, fullName, size = 'w-10 h-10') {
    const initials = (fullName || 'U').charAt(0).toUpperCase();
    const escapedInitials = escapeHtml(initials);
    
    if (imgUrl) {
        const uniqueId = 'avatar-' + Math.random().toString(36).substr(2, 9);
        const escapedImgUrl = escapeHtml(imgUrl);
        const escapedFullName = escapeHtml(fullName || 'Usuario');
        
        return `
            <div class="relative ${size} rounded-full overflow-hidden flex-shrink-0" id="avatar-container-${uniqueId}">
                <div class="absolute inset-0 flex items-center justify-center bg-gray-100" id="avatar-spinner-${uniqueId}">
                    <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                </div>
                <img src="${escapedImgUrl}" alt="${escapedFullName}" 
                     class="w-full h-full object-cover opacity-0 transition-opacity duration-300" 
                     id="avatar-img-${uniqueId}"
                     onload="(function() { const img = document.getElementById('avatar-img-${uniqueId}'); const spinner = document.getElementById('avatar-spinner-${uniqueId}'); if (img) img.classList.remove('opacity-0'); if (spinner) spinner.style.display='none'; })();"
                     onerror="(function() { const spinner = document.getElementById('avatar-spinner-${uniqueId}'); const container = document.getElementById('avatar-container-${uniqueId}'); if (spinner) spinner.style.display='none'; container.innerHTML='<div class=\\'w-full h-full bg-[#00AF00] rounded-full flex items-center justify-center text-white text-sm font-bold\\'>${escapedInitials}</div>'; })();">
            </div>
        `;
    } else {
        return `
            <div class="${size} bg-[#00AF00] rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                ${escapedInitials}
            </div>
        `;
    }
}

// Filter auditories based on current filters
function filterAuditories() {
    const filters = auditoryDataWarehouse.filters;
    let filtered = [...auditoryDataWarehouse.allAuditories];
    
    // Filter by user
    if (filters.user !== 'all') {
        filtered = filtered.filter(auditory => {
            const performerEmail = auditory.performerEmail || '';
            return performerEmail === filters.user;
        });
    }
    
    // Filter by search term
    if (filters.searchTerm && filters.searchTerm.trim() !== '') {
        const searchLower = filters.searchTerm.toLowerCase().trim();
        filtered = filtered.filter(auditory => {
            const action = (auditory.action || '').toLowerCase();
            const performerName = (auditory.performerName || '').toLowerCase();
            const performerEmail = (auditory.performerEmail || '').toLowerCase();
            return action.includes(searchLower) || 
                   performerName.includes(searchLower) || 
                   performerEmail.includes(searchLower);
        });
    }
    
    // Store filtered results
    auditoryDataWarehouse.filteredAuditories = filtered;
    
    // Update pagination
    auditoryDataWarehouse.totalAuditories = filtered.length;
    auditoryDataWarehouse.totalPages = Math.ceil(filtered.length / auditoryDataWarehouse.pageSize);
    auditoryDataWarehouse.currentPage = 0; // Reset to first page after filtering
    
    // Display paginated results
    displayPaginatedAuditories();
}

// Display paginated auditories
function displayPaginatedAuditories() {
    const startIndex = auditoryDataWarehouse.currentPage * auditoryDataWarehouse.pageSize;
    const endIndex = startIndex + auditoryDataWarehouse.pageSize;
    const pageAuditories = auditoryDataWarehouse.filteredAuditories.slice(startIndex, endIndex);
    
    displayAuditories(pageAuditories);
    updatePagination();
}

// Display auditories in table (warehouse - no institution column)
function displayAuditories(auditories) {
    const tbody = document.getElementById('auditoryTableBody');
    
    if (!tbody) return;
    
    const colspan = 3; // Fecha/Hora, Usuario, Acción
    
    if (auditories.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="${colspan}" class="py-8 text-center text-gray-500 dark:text-gray-400">
                    No se encontraron registros de auditoría con los filtros aplicados
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = auditories.map(auditory => {
        const date = new Date(auditory.date);
        const formattedDate = date.toLocaleString('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        
        const performerName = auditory.performerName || 'N/A';
        const avatarHtml = createUserAvatar(auditory.performerImgUrl, performerName, 'w-10 h-10');
        
        return `
            <tr class="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                <td class="py-3 px-4 text-gray-700 dark:text-gray-300">${formattedDate}</td>
                <td class="py-3 px-4">
                    <div class="flex items-center gap-3">
                        ${avatarHtml}
                        <div class="flex flex-col">
                            <span class="text-gray-700 dark:text-gray-300 font-medium">${escapeHtml(performerName)}</span>
                            ${auditory.performerEmail ? `<span class="text-xs text-gray-500 dark:text-gray-400">${escapeHtml(auditory.performerEmail)}</span>` : ''}
                        </div>
                    </div>
                </td>
                <td class="py-3 px-4 text-gray-700 dark:text-gray-300">${escapeHtml(auditory.action || 'N/A')}</td>
            </tr>
        `;
    }).join('');
}

// Update filter options based on loaded auditories
function updateFilterOptions() {
    const allAuditories = auditoryDataWarehouse.allAuditories;
    
    // Extract unique users
    const uniqueUsers = new Map();
    allAuditories.forEach(auditory => {
        const email = auditory.performerEmail;
        const name = auditory.performerName || 'N/A';
        if (email && !uniqueUsers.has(email)) {
            uniqueUsers.set(email, name);
        }
    });
    
    // Update user filter select
    const userFilter = document.getElementById('auditoryUserFilter');
    if (userFilter) {
        const currentValue = userFilter.value;
        userFilter.innerHTML = '<option value="all">Todos los usuarios</option>';
        
        // Sort users by name
        const sortedUsers = Array.from(uniqueUsers.entries()).sort((a, b) => {
            return a[1].localeCompare(b[1]);
        });
        
        sortedUsers.forEach(([email, name]) => {
            const option = document.createElement('option');
            option.value = email;
            option.textContent = name;
            userFilter.appendChild(option);
        });
        
        // Restore previous selection if still valid
        if (currentValue && Array.from(uniqueUsers.keys()).includes(currentValue)) {
            userFilter.value = currentValue;
        }
    }
}

// Handle user filter change
function handleAuditoryUserFilterChange() {
    const userFilter = document.getElementById('auditoryUserFilter');
    if (userFilter) {
        auditoryDataWarehouse.filters.user = userFilter.value;
        filterAuditories();
    }
}

// Handle search input change
function handleAuditorySearchChange() {
    const searchInput = document.getElementById('auditorySearchInput');
    if (searchInput) {
        auditoryDataWarehouse.filters.searchTerm = searchInput.value;
        filterAuditories();
    }
}

// Update pagination controls
function updatePagination() {
    const container = document.getElementById('paginationContainer');
    if (!container) return;
    
    const totalPages = auditoryDataWarehouse.totalPages;
    const currentPage = auditoryDataWarehouse.currentPage;
    const currentPage1Based = currentPage + 1; // Convert to 1-based for display
    
    const start = (currentPage * auditoryDataWarehouse.pageSize) + 1;
    const end = Math.min((currentPage + 1) * auditoryDataWarehouse.pageSize, auditoryDataWarehouse.totalAuditories);
    
    let paginationHtml = `
        <div class="text-sm text-gray-600">
            Mostrando ${start}-${end} de ${auditoryDataWarehouse.totalAuditories} registros
        </div>
        <div class="flex items-center gap-2 ml-auto">
    `;
    
    if (totalPages > 0) {
        // Previous button
        paginationHtml += `
            <button onclick="changePage(${currentPage1Based - 1})" 
                ${currentPage1Based === 1 ? 'disabled' : ''} 
                class="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                <i class="fas fa-chevron-left"></i>
            </button>
        `;
        
        // Page numbers - show up to 5 pages around current
        const maxVisiblePages = 5;
        let startPage = Math.max(1, currentPage1Based - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
        
        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }
        
        for (let i = startPage; i <= endPage; i++) {
            paginationHtml += `
                <button onclick="changePage(${i})" 
                    class="px-3 py-2 border ${
                        currentPage1Based === i
                            ? 'bg-[#00AF00] text-white border-[#00AF00]'
                            : 'border-gray-300 text-gray-700'
                    } rounded-lg hover:bg-gray-50 transition-colors">
                    ${i}
                </button>
            `;
        }
        
        // Next button
        paginationHtml += `
            <button onclick="changePage(${currentPage1Based + 1})" 
                ${currentPage1Based === totalPages ? 'disabled' : ''} 
                class="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                <i class="fas fa-chevron-right"></i>
            </button>
        `;
    }
    
    paginationHtml += `</div>`;
    container.innerHTML = paginationHtml;
}

// Change page (1-based input, converts to 0-based for API)
function changePage(page) {
    const totalPages = auditoryDataWarehouse.totalPages;
    if (page < 1 || page > totalPages) {
        return; // Invalid page
    }
    
    // Convert from 1-based (UI) to 0-based (API)
    const apiPage = page - 1;
    auditoryDataWarehouse.currentPage = apiPage;
    displayPaginatedAuditories();
}

// Show loading state
function showLoadingState() {
    const tbody = document.getElementById('auditoryTableBody');
    const refreshIcon = document.getElementById('refreshIcon');
    const refreshText = document.getElementById('refreshText');
    
    if (tbody) {
        const colspan = 3; // Fecha/Hora, Usuario, Acción
        tbody.innerHTML = `
            <tr>
                <td colspan="${colspan}" class="py-8 text-center">
                    <div class="flex flex-col items-center gap-2">
                        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                        <span class="text-gray-500 dark:text-gray-400">Cargando registros...</span>
                    </div>
                </td>
            </tr>
        `;
    }
    
    if (refreshIcon) {
        refreshIcon.classList.add('animate-spin');
    }
    
    if (refreshText) {
        refreshText.textContent = 'Cargando...';
    }
}

// Hide loading state
function hideLoadingState() {
    const refreshIcon = document.getElementById('refreshIcon');
    const refreshText = document.getElementById('refreshText');
    
    if (refreshIcon) {
        refreshIcon.classList.remove('animate-spin');
    }
    
    if (refreshText) {
        refreshText.textContent = 'Actualizar';
    }
}

// Show error state
function showErrorState(message) {
    const tbody = document.getElementById('auditoryTableBody');
    
    if (tbody) {
        const colspan = 3; // Fecha/Hora, Usuario, Acción
        tbody.innerHTML = `
            <tr>
                <td colspan="${colspan}" class="py-8 text-center text-red-500">
                    <div class="flex flex-col items-center gap-2">
                        <i class="fas fa-exclamation-circle text-2xl"></i>
                        <span>${escapeHtml(message)}</span>
                    </div>
                </td>
            </tr>
        `;
    }
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    loadAuditories(0);
});

