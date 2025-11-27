// Auditoría data state for warehouse
let auditoryDataWarehouse = {
    currentPage: 0,
    pageSize: 6,
    totalPages: 0,
    totalAuditories: 0,
    isLoading: false
};

// Load auditories from API for warehouse
async function loadAuditories(page = 0) {
    try {
        const token = localStorage.getItem('jwt');
        if (!token) {
            throw new Error('No authentication token found');
        }

        auditoryDataWarehouse.isLoading = true;
        showLoadingState();

        // Use warehouse-specific endpoint
        const endpoint = `/api/v1/auditories/warehouse?page=${page}&size=${auditoryDataWarehouse.pageSize}`;

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
        
        auditoryDataWarehouse.currentPage = data.currentPage;
        auditoryDataWarehouse.totalPages = data.totalPages;
        auditoryDataWarehouse.totalAuditories = data.totalAuditories;
        
        displayAuditories(data.auditories);
        updatePagination();
        
    } catch (error) {
        console.error('Error loading auditories:', error);
        showErrorState('Error al cargar los registros de auditoría: ' + error.message);
    } finally {
        auditoryDataWarehouse.isLoading = false;
        hideLoadingState();
    }
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

// Display auditories in table (warehouse - no institution column)
function displayAuditories(auditories) {
    const tbody = document.getElementById('auditoryTableBody');
    
    if (!tbody) return;
    
    const colspan = 3; // Fecha/Hora, Usuario, Acción
    
    if (auditories.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="${colspan}" class="py-8 text-center text-gray-500 dark:text-gray-400">
                    No hay registros de auditoría disponibles
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
    loadAuditories(apiPage);
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

