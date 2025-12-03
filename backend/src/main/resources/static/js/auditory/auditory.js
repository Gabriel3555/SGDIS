// Auditoría data state
let auditoryData = {
    currentPage: 0,
    pageSize: 6,
    totalPages: 0,
    totalAuditories: 0,
    isLoading: false,
    isSuperadmin: false,
    regionalsLoaded: false,
    filters: {
        regionalId: null,
        institutionId: null,
        performerId: null
    }
};

// CustomSelect instances for filters
let auditoryRegionalCustomSelect = null;
let auditoryInstitutionCustomSelect = null;
let auditoryUserCustomSelect = null;

// Load auditories from API
async function loadAuditories(page = 0) {
    try {
        const token = localStorage.getItem('jwt');
        if (!token) {
            throw new Error('No authentication token found');
        }

        auditoryData.isLoading = true;
        showLoadingState();

        // Determine endpoint based on user role
        let endpoint = `/api/v1/auditories?page=${page}&size=${auditoryData.pageSize}`;
        
        try {
            const userResponse = await fetch('/api/v1/users/me', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (userResponse.ok) {
                const userData = await userResponse.json();
                const currentRole = userData.role || '';
                const institutionId = userData.institution?.id || userData.institutionId;
                
                // Check if user is SUPERADMIN
                auditoryData.isSuperadmin = currentRole === 'SUPERADMIN';
                
                // Update table header based on role
                updateTableHeader();
                
                // Show/hide filters and load filter options for Superadmin
                if (auditoryData.isSuperadmin) {
                    showFilters();
                    // Initialize CustomSelects first, then load options
                    setTimeout(() => {
                        initializeAuditoryCustomSelects();
                        loadFilterOptions();
                    }, 100);
                    
                    // Build endpoint with filters for SUPERADMIN
                    const params = new URLSearchParams();
                    params.append('page', page);
                    params.append('size', auditoryData.pageSize);
                    
                    if (auditoryData.filters.regionalId) {
                        params.append('regionalId', auditoryData.filters.regionalId);
                    }
                    if (auditoryData.filters.institutionId) {
                        params.append('institutionId', auditoryData.filters.institutionId);
                    }
                    if (auditoryData.filters.performerId) {
                        params.append('performerId', auditoryData.filters.performerId);
                    }
                    
                    endpoint = `/api/v1/auditories?${params.toString()}`;
                } else {
                    hideFilters();
                    
                    if (currentRole === 'ADMIN_INSTITUTION') {
                        // Use institution endpoint for ADMIN_INSTITUTION (gets institution from current user)
                        endpoint = `/api/v1/auditories/institution?page=${page}&size=${auditoryData.pageSize}`;
                    } else if (currentRole === 'ADMIN_REGIONAL') {
                        // For ADMIN_REGIONAL, use regional endpoint
                        const regionalId = userData.institution?.regional?.id || userData.regional?.id || userData.regionalId;
                        if (regionalId) {
                            endpoint = `/api/v1/auditories/regional/${regionalId}?page=${page}&size=${auditoryData.pageSize}`;
                        }
                    }
                }
            }
        } catch (userError) {
            console.error('Error checking user role:', userError);
            // Continue with default endpoint if user check fails
        }

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

// Update table header based on user role
function updateTableHeader() {
    const header = document.getElementById('auditoryTableHeader');
    if (!header) return;
    
    if (auditoryData.isSuperadmin) {
        // Add Regional and Centro columns for Superadmin
        header.innerHTML = `
            <th class="text-left py-3 px-4 font-semibold text-gray-700">Fecha/Hora</th>
            <th class="text-left py-3 px-4 font-semibold text-gray-700">Usuario</th>
            <th class="text-left py-3 px-4 font-semibold text-gray-700">Acción</th>
            <th class="text-left py-3 px-4 font-semibold text-gray-700">Institution</th>
            <th class="text-left py-3 px-4 font-semibold text-gray-700">Regional</th>
        `;
    } else {
        // Standard columns for other roles
        header.innerHTML = `
            <th class="text-left py-3 px-4 font-semibold text-gray-700">Fecha/Hora</th>
            <th class="text-left py-3 px-4 font-semibold text-gray-700">Usuario</th>
            <th class="text-left py-3 px-4 font-semibold text-gray-700">Acción</th>
        `;
    }
}

// Display auditories in table
function displayAuditories(auditories) {
    const tbody = document.getElementById('auditoryTableBody');
    
    if (!tbody) return;
    
    const colspan = auditoryData.isSuperadmin ? 5 : 3;
    
    if (auditories.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="${colspan}" class="py-8 text-center text-gray-500">
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
        
        const regionalName = escapeHtml(auditory.regionalName || '-');
        const institutionName = escapeHtml(auditory.institutionName || '-');
        
        if (auditoryData.isSuperadmin) {
            return `
                <tr class="border-b border-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800">
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
                    <td class="py-3 px-4 text-gray-700 dark:text-gray-300">${institutionName}</td>
                    <td class="py-3 px-4 text-gray-700 dark:text-gray-300">${regionalName}</td>
                </tr>
            `;
        } else {
            return `
                <tr class="border-b border-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800">
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
        }
    }).join('');
}

// Update pagination controls
function updatePagination() {
    const container = document.getElementById('paginationContainer');
    if (!container) return;

    const totalPages = auditoryData.totalPages || 0;
    const currentPage = auditoryData.currentPage;
    const totalElements = auditoryData.totalAuditories || 0;

    // Calculate start and end items (convert to 1-indexed for display)
    const currentPage1Indexed = currentPage + 1;
    const startItem = totalElements > 0 ? (currentPage * auditoryData.pageSize) + 1 : 0;
    const endItem = Math.min((currentPage + 1) * auditoryData.pageSize, totalElements);

    let paginationHtml = `
        <div class="text-sm text-gray-600">
            Mostrando ${startItem}-${endItem} de ${totalElements} registro${totalElements !== 1 ? 's' : ''}
        </div>
        <div class="flex items-center gap-2 ml-auto">
    `;

    if (auditoryData && totalPages > 0) {
        // Previous button
        paginationHtml += `
            <button onclick="changePage(${currentPage})" ${
            currentPage === 0 ? 'disabled' : ''
        } class="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                <i class="fas fa-chevron-left"></i>
            </button>
        `;

        // Page numbers - show up to 5 pages (1-indexed for display)
        const maxVisiblePages = 5;
        let startPage = Math.max(1, currentPage1Indexed - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        // Show page numbers
        for (let i = startPage; i <= endPage; i++) {
            const pageIndex = i - 1; // Convert to 0-indexed for function call
            paginationHtml += `
                <button onclick="changePage(${pageIndex})" class="px-3 py-2 border ${
                currentPage === pageIndex
                    ? 'bg-[#00AF00] text-white border-[#00AF00]'
                    : 'border-gray-300 text-gray-700'
            } rounded-lg hover:bg-gray-50 transition-colors">
                    ${i}
                </button>
            `;
        }

        // Next button
        paginationHtml += `
            <button onclick="changePage(${currentPage + 1})" ${
            currentPage >= totalPages - 1 ? 'disabled' : ''
        } class="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                <i class="fas fa-chevron-right"></i>
            </button>
        `;
    }

    paginationHtml += `</div>`;

    container.innerHTML = paginationHtml;
}

// Navigation function
function changePage(page) {
    if (page >= 0 && page < auditoryData.totalPages) {
        auditoryData.currentPage = page;
        loadAuditories(page);
    }
}

// Navigation functions (keep for backward compatibility)
function previousPage() {
    if (auditoryData.currentPage > 0) {
        changePage(auditoryData.currentPage - 1);
    }
}

function nextPage() {
    if (auditoryData.currentPage < auditoryData.totalPages - 1) {
        changePage(auditoryData.currentPage + 1);
    }
}

// Show loading state
function showLoadingState() {
    const tbody = document.getElementById('auditoryTableBody');
    const refreshIcon = document.getElementById('refreshIcon');
    const refreshText = document.getElementById('refreshText');
    
    if (tbody) {
        const colspan = auditoryData.isSuperadmin ? 5 : 3;
        tbody.innerHTML = `
            <tr>
                <td colspan="${colspan}" class="py-8 text-center">
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
        const colspan = auditoryData.isSuperadmin ? 5 : 3;
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

// Show filters section
function showFilters() {
    const filtersSection = document.getElementById('filtersSection');
    if (filtersSection) {
        filtersSection.style.display = 'block';
    }
}

// Hide filters section
function hideFilters() {
    const filtersSection = document.getElementById('filtersSection');
    if (filtersSection) {
        filtersSection.style.display = 'none';
    }
}

// Initialize CustomSelects for filters
function initializeAuditoryCustomSelects() {
    // Initialize Regional CustomSelect
    const regionalContainer = document.getElementById('auditoryRegionalFilterSelect');
    if (regionalContainer && !auditoryRegionalCustomSelect) {
        try {
            auditoryRegionalCustomSelect = new CustomSelect('auditoryRegionalFilterSelect', {
                placeholder: 'Todas las regionales',
                searchable: true,
                onChange: (option) => {
                    const value = option ? option.value : '';
                    const hiddenInput = document.getElementById('filterRegional');
                    if (hiddenInput) {
                        hiddenInput.value = value || '';
                    }
                    onRegionalChange();
                }
            });
        } catch (error) {
            console.error('Error initializing regional CustomSelect:', error);
        }
    }

    // Initialize Institution CustomSelect
    const institutionContainer = document.getElementById('auditoryInstitutionFilterSelect');
    if (institutionContainer && !auditoryInstitutionCustomSelect) {
        try {
            auditoryInstitutionCustomSelect = new CustomSelect('auditoryInstitutionFilterSelect', {
                placeholder: 'Todos los centros',
                searchable: true,
                onChange: (option) => {
                    const value = option ? option.value : '';
                    const hiddenInput = document.getElementById('filterInstitution');
                    if (hiddenInput) {
                        hiddenInput.value = value || '';
                    }
                    onInstitutionChange();
                }
            });
        } catch (error) {
            console.error('Error initializing institution CustomSelect:', error);
        }
    }

    // Initialize User CustomSelect
    const userContainer = document.getElementById('auditoryUserFilterSelect');
    if (userContainer && !auditoryUserCustomSelect) {
        try {
            auditoryUserCustomSelect = new CustomSelect('auditoryUserFilterSelect', {
                placeholder: 'Todos los usuarios',
                searchable: true,
                onChange: (option) => {
                    const value = option ? option.value : '';
                    const hiddenInput = document.getElementById('filterUser');
                    if (hiddenInput) {
                        hiddenInput.value = value || '';
                    }
                    applyFilters();
                }
            });
        } catch (error) {
            console.error('Error initializing user CustomSelect:', error);
        }
    }
}

// Load filter options
async function loadFilterOptions() {
    const token = localStorage.getItem('jwt');
    if (!token) return;

    // Initialize CustomSelects first
    initializeAuditoryCustomSelects();

    // Prevent multiple loads for regionals
    if (auditoryData.regionalsLoaded) {
        return;
    }

    try {
        // Load Regionals
        const regionalsResponse = await fetch('/api/v1/regional', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        if (regionalsResponse.ok) {
            const regionals = await regionalsResponse.json();
            if (auditoryRegionalCustomSelect) {
                // Build options array
                const options = [
                    { value: '', label: 'Todas las regionales' },
                    ...regionals.map(regional => ({
                        value: regional.id.toString(),
                        label: regional.name
                    }))
                ];
                
                // Update CustomSelect options
                auditoryRegionalCustomSelect.setOptions(options);
            }
        }

        // Load all users initially
        await loadUsers();
        
        // Mark regionals as loaded
        auditoryData.regionalsLoaded = true;
    } catch (error) {
        console.error('Error loading filter options:', error);
        auditoryData.regionalsLoaded = false; // Allow retry on error
    }
}

// Load institutions by regional
async function loadInstitutionsByRegional(regionalId) {
    const token = localStorage.getItem('jwt');
    if (!token) return;

    if (!auditoryInstitutionCustomSelect) return;

    if (!regionalId || regionalId === '') {
        // Reset to default if no regional selected
        auditoryInstitutionCustomSelect.setOptions([{ value: '', label: 'Todos los centros' }]);
        auditoryInstitutionCustomSelect.setValue('');
        return;
    }

    try {
        const institutionsResponse = await fetch(`/api/v1/institutions/institutionsByRegionalId/${regionalId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (institutionsResponse.ok) {
            const institutions = await institutionsResponse.json();
            // Build options array
            const options = [
                { value: '', label: 'Todos los centros' },
                ...institutions.map(institution => ({
                    value: institution.id.toString(),
                    label: institution.name
                }))
            ];
            
            // Update CustomSelect options
            auditoryInstitutionCustomSelect.setOptions(options);
            // Reset selection
            auditoryInstitutionCustomSelect.clear();
        }
    } catch (error) {
        console.error('Error loading institutions by regional:', error);
    }
}

// Load users based on filters
async function loadUsers(regionalId = null, institutionId = null) {
    const token = localStorage.getItem('jwt');
    if (!token) {
        console.warn('No token found, skipping user load');
        return;
    }

    if (!auditoryUserCustomSelect) {
        // Element not found, probably not on auditory page - silently return
        return;
    }

    try {
        let users = [];
        let institutionNames = [];
        
        // Get institution names to filter by
        if (institutionId && institutionId !== '') {
            // Get the selected institution name from CustomSelect
            if (auditoryInstitutionCustomSelect) {
                const selectedOption = auditoryInstitutionCustomSelect.options.find(opt => opt.value === institutionId.toString());
                if (selectedOption && selectedOption.label !== 'Todos los centros') {
                    institutionNames = [selectedOption.label];
                }
            }
        } else if (regionalId && regionalId !== '') {
            // Get all institution names for the selected regional
            try {
                const institutionsResponse = await fetch(`/api/v1/institutions/institutionsByRegionalId/${regionalId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                if (institutionsResponse.ok) {
                    const institutions = await institutionsResponse.json();
                    institutionNames = institutions.map(inst => inst.name);
                }
            } catch (instError) {
                // Silently handle institution fetch errors
                console.warn('Error loading institutions for filter:', instError);
            }
        }
        
        // Load all users
        const usersResponse = await fetch('/api/v1/users?page=0&size=10000', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (usersResponse.ok) {
            const usersData = await usersResponse.json();
            if (usersData.users) {
                if (institutionNames.length > 0) {
                    // Filter users by institution name
                    users = usersData.users.filter(user => 
                        user.institution && institutionNames.includes(user.institution)
                    );
                } else {
                    // Load all users
                    users = usersData.users;
                }
            }
        } else {
            console.warn('Failed to load users:', usersResponse.status, usersResponse.statusText);
        }

        // Build options array
        const options = [
            { value: '', label: 'Todos los usuarios' },
            ...users.map(user => ({
                value: user.id.toString(),
                label: user.fullName || user.email
            }))
        ];
        
        // Update CustomSelect options
        auditoryUserCustomSelect.setOptions(options);
        // Reset selection
        auditoryUserCustomSelect.clear();
    } catch (error) {
        // Only log if it's not a network/CORS error to avoid console spam
        if (error.name !== "TypeError" || !error.message.includes("Load failed")) {
            console.error('Error loading users:', error);
        }
    }
}

// Handle regional change
async function onRegionalChange() {
    const hiddenInput = document.getElementById('filterRegional');
    const regionalId = hiddenInput && hiddenInput.value && hiddenInput.value !== '' ? hiddenInput.value : null;
    
    // Clear institution selection
    if (auditoryInstitutionCustomSelect) {
        auditoryInstitutionCustomSelect.clear();
    }
    
    // Load institutions for selected regional
    await loadInstitutionsByRegional(regionalId);
    
    // Update users based on regional
    await loadUsers(regionalId, null);
    
    // Update filters and reload auditories
    applyFilters();
}

// Handle institution change
async function onInstitutionChange() {
    const regionalHiddenInput = document.getElementById('filterRegional');
    const institutionHiddenInput = document.getElementById('filterInstitution');
    
    const regionalId = regionalHiddenInput && regionalHiddenInput.value && regionalHiddenInput.value !== '' ? regionalHiddenInput.value : null;
    const institutionId = institutionHiddenInput && institutionHiddenInput.value && institutionHiddenInput.value !== '' ? institutionHiddenInput.value : null;
    
    // Update users based on institution
    await loadUsers(regionalId, institutionId);
    
    // Update filters and reload auditories
    applyFilters();
}

// Apply filters
function applyFilters() {
    const regionalHiddenInput = document.getElementById('filterRegional');
    const institutionHiddenInput = document.getElementById('filterInstitution');
    const userHiddenInput = document.getElementById('filterUser');

    // Get values and convert to numbers, or null if empty
    const regionalValue = regionalHiddenInput && regionalHiddenInput.value && regionalHiddenInput.value !== '' ? parseInt(regionalHiddenInput.value) : null;
    const institutionValue = institutionHiddenInput && institutionHiddenInput.value && institutionHiddenInput.value !== '' ? parseInt(institutionHiddenInput.value) : null;
    const userValue = userHiddenInput && userHiddenInput.value && userHiddenInput.value !== '' ? parseInt(userHiddenInput.value) : null;

    // Update filters
    auditoryData.filters.regionalId = regionalValue;
    auditoryData.filters.institutionId = institutionValue;
    auditoryData.filters.performerId = userValue;

    // Reset to first page when filters change
    auditoryData.currentPage = 0;
    loadAuditories(0);
}

// Export functions globally
window.changePage = changePage;
window.previousPage = previousPage;
window.nextPage = nextPage;
window.loadAuditories = loadAuditories;
window.applyFilters = applyFilters;
window.onRegionalChange = onRegionalChange;
window.onInstitutionChange = onInstitutionChange;

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Initialize CustomSelects with a small delay to ensure DOM is ready
    setTimeout(() => {
        if (auditoryData.isSuperadmin) {
            initializeAuditoryCustomSelects();
        }
    }, 100);
    
    loadAuditories(0);
});

