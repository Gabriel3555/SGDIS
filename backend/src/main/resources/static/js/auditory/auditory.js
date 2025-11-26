// Auditoría data state
let auditoryData = {
    currentPage: 0,
    pageSize: 10,
    totalPages: 0,
    totalAuditories: 0,
    isLoading: false
};

// Load auditories from API
async function loadAuditories(page = 0) {
    try {
        const token = localStorage.getItem('jwt');
        if (!token) {
            throw new Error('No authentication token found');
        }

        auditoryData.isLoading = true;
        showLoadingState();

        const response = await fetch(`/api/v1/auditories?page=${page}&size=${auditoryData.pageSize}`, {
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
        
        auditoryData.currentPage = data.currentPage;
        auditoryData.totalPages = data.totalPages;
        auditoryData.totalAuditories = data.totalAuditories;
        
        displayAuditories(data.auditories);
        updatePagination();
        
    } catch (error) {
        console.error('Error loading auditories:', error);
        showErrorState('Error al cargar los registros de auditoría: ' + error.message);
    } finally {
        auditoryData.isLoading = false;
        hideLoadingState();
    }
}

// Display auditories in table
function displayAuditories(auditories) {
    const tbody = document.getElementById('auditoryTableBody');
    
    if (!tbody) return;
    
    if (auditories.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="py-8 text-center text-gray-500">
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
        
        return `
            <tr class="border-b border-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800">
                <td class="py-3 px-4 text-gray-700 dark:text-gray-300">${formattedDate}</td>
                <td class="py-3 px-4 text-gray-700 dark:text-gray-300">${escapeHtml(auditory.action || 'N/A')}</td>
                <td class="py-3 px-4 text-gray-700 dark:text-gray-300">
                    ${auditory.performerName ? escapeHtml(auditory.performerName) : 'N/A'}
                    ${auditory.performerEmail ? `<br><span class="text-xs text-gray-500">${escapeHtml(auditory.performerEmail)}</span>` : ''}
                </td>
                <td class="py-3 px-4 text-gray-700 dark:text-gray-300">${auditory.institutionName ? escapeHtml(auditory.institutionName) : 'N/A'}</td>
                <td class="py-3 px-4 text-gray-700 dark:text-gray-300">${auditory.regionalName ? escapeHtml(auditory.regionalName) : 'N/A'}</td>
            </tr>
        `;
    }).join('');
}

// Update pagination controls
function updatePagination() {
    const paginationInfo = document.getElementById('paginationInfo');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    if (paginationInfo) {
        const start = (auditoryData.currentPage * auditoryData.pageSize) + 1;
        const end = Math.min((auditoryData.currentPage + 1) * auditoryData.pageSize, auditoryData.totalAuditories);
        paginationInfo.textContent = `Mostrando ${start}-${end} de ${auditoryData.totalAuditories} registros`;
    }
    
    if (prevBtn) {
        prevBtn.disabled = auditoryData.currentPage === 0;
    }
    
    if (nextBtn) {
        nextBtn.disabled = auditoryData.currentPage >= auditoryData.totalPages - 1;
    }
}

// Navigation functions
function previousPage() {
    if (auditoryData.currentPage > 0) {
        auditoryData.currentPage--;
        loadAuditories(auditoryData.currentPage);
    }
}

function nextPage() {
    if (auditoryData.currentPage < auditoryData.totalPages - 1) {
        auditoryData.currentPage++;
        loadAuditories(auditoryData.currentPage);
    }
}

// Show loading state
function showLoadingState() {
    const tbody = document.getElementById('auditoryTableBody');
    const refreshIcon = document.getElementById('refreshIcon');
    const refreshText = document.getElementById('refreshText');
    
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="py-8 text-center">
                    <div class="flex flex-col items-center gap-2">
                        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                        <span class="text-gray-500">Cargando registros...</span>
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
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="py-8 text-center text-red-500">
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

