// Admin Institution Loans Report functionality
// Simplified version - only loans reports, PDF export only, no images

let userInstitutionId = null;
let userRegionalId = null;
let userInstitutionName = null;
let userRegionalName = null;
let inventories = {};
let currentReportData = [];

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('Admin Institution Loans Reports page DOMContentLoaded - Initializing...');
    showEmptyState();
    loadUserInfoAndInventories();
    setupEventListeners();
    setupDateInputs();
});

// Also try if DOM is already loaded (for dynamic navigation)
if (document.readyState !== 'loading') {
    console.log('Admin Institution Loans Reports page - DOM already loaded, initializing...');
    setTimeout(function() {
        showEmptyState();
        loadUserInfoAndInventories();
        setupEventListeners();
        setupDateInputs();
    }, 200);
}

// Setup date inputs to default values
function setupDateInputs() {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    document.getElementById('startDate').valueAsDate = firstDay;
    document.getElementById('endDate').valueAsDate = lastDay;
}

// Load user info and inventories
async function loadUserInfoAndInventories() {
    try {
        const token = localStorage.getItem('jwt');
        if (!token) {
            throw new Error('No authentication token found');
        }

        const headers = { 'Content-Type': 'application/json' };
        headers['Authorization'] = `Bearer ${token}`;

        // Get current user info
        const userResponse = await fetch('/api/v1/users/me', {
            method: 'GET',
            headers: headers
        });

        if (!userResponse.ok) {
            throw new Error('Failed to load user info');
        }

        const userData = await userResponse.json();
        userInstitutionName = userData.institution;

        // Try to get institution ID for reference (optional, not required for loading inventories)
        try {
            const institutionsResponse = await fetch('/api/v1/institutions', {
                method: 'GET',
                headers: headers
            });

            if (institutionsResponse.ok) {
                const institutions = await institutionsResponse.json();
                const institution = institutions.find(inst => 
                    inst.name === userInstitutionName || 
                    inst.nombre === userInstitutionName
                );
                
                if (institution) {
                    userInstitutionId = institution.institutionId || institution.id;
                    userRegionalId = institution.regionalId || institution.regional?.id;

                    // Get regional name (optional)
                    if (userRegionalId) {
                        try {
                            const regionalsResponse = await fetch('/api/v1/regional', {
                                method: 'GET',
                                headers: headers
                            });

                            if (regionalsResponse.ok) {
                                const regionals = await regionalsResponse.json();
                                const regional = regionals.find(reg => reg.id === userRegionalId);
                                if (regional) {
                                    userRegionalName = regional.name || regional.nombre;
                                }
                            }
                        } catch (regionalError) {
                            console.warn('Could not load regional name:', regionalError);
                            // Continue without regional name
                        }
                    }
                }
            }
        } catch (institutionError) {
            console.warn('Could not load institution details:', institutionError);
            // Continue without institution ID - we can still load inventories
        }

        // Load inventories for the user's institution
        // This endpoint automatically uses the current user's institution from the token
        await loadInventories(userInstitutionId);
    } catch (error) {
        console.error('Error loading user info and inventories:', error);
        const errorMessage = error.message || 'Error desconocido';
        showReportErrorToast('Error', `Error al cargar información del usuario: ${errorMessage}`);
        
        // Try to load inventories anyway (might still work)
        try {
            await loadInventories(null);
        } catch (inventoryError) {
            console.error('Also failed to load inventories:', inventoryError);
        }
    }
}

// Setup event listeners
function setupEventListeners() {
    // Generate report button
    const generateBtn = document.getElementById('generateReportBtn');
    if (generateBtn) generateBtn.addEventListener('click', generateReport);

    // Clear filters button
    const clearBtn = document.getElementById('clearFiltersBtn');
    if (clearBtn) clearBtn.addEventListener('click', clearFilters);

    // Export PDF button
    const exportPdfBtn = document.getElementById('exportPdfBtn');
    if (exportPdfBtn) exportPdfBtn.addEventListener('click', exportToPDF);
}

// Load inventories for the user's institution
async function loadInventories(institutionId) {
    const select = document.getElementById('inventorySelect');
    
    try {
        const token = localStorage.getItem('jwt');
        if (!token || token === 'undefined' || token === 'null' || token.trim() === '') {
            throw new Error('No hay token de autenticación disponible');
        }

        const headers = { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };

        // Use endpoint without ID to automatically get inventories from current user's institution
        // Try using authenticatedFetch first (which handles token refresh), then fallback to regular fetch
        let response;
        
        if (window.authenticatedFetch && typeof window.authenticatedFetch === 'function') {
            // Use authenticatedFetch which handles token refresh automatically
            try {
                response = await window.authenticatedFetch('/api/v1/inventory/institutionAdminInventories?page=0&size=1000', {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' }
                });
            } catch (authFetchError) {
                console.warn('authenticatedFetch failed, trying regular fetch:', authFetchError);
                // Fallback to regular fetch
                response = await fetch('/api/v1/inventory/institutionAdminInventories?page=0&size=1000', {
                    method: 'GET',
                    headers: headers
                });
            }
        } else {
            // Use regular fetch
            response = await fetch('/api/v1/inventory/institutionAdminInventories?page=0&size=1000', {
                method: 'GET',
                headers: headers
            });
        }

        if (response.ok) {
            const data = await response.json();
            const inventoriesList = data.content || data || [];
            if (institutionId) {
                inventories[institutionId] = inventoriesList;
            }
            populateInventoryDropdown(inventoriesList);
        } else {
            const errorText = await response.text().catch(() => 'Error desconocido');
            console.error('Error loading inventories:', response.status, errorText);
            showReportErrorToast('Error', `No se pudieron cargar los inventarios (${response.status})`);
            if (select) {
                select.innerHTML = '<option value="">Error al cargar inventarios...</option>';
            }
        }
    } catch (error) {
        console.error('Error loading inventories:', error);
        const errorMessage = error.message || 'Error desconocido';
        showReportErrorToast('Error', `Error de conexión al cargar inventarios: ${errorMessage}`);
        if (select) {
            select.innerHTML = '<option value="">Error al cargar inventarios...</option>';
        }
    }
}

// Populate inventory dropdown
function populateInventoryDropdown(inventoriesList) {
    const select = document.getElementById('inventorySelect');
    
    if (!inventoriesList || inventoriesList.length === 0) {
        select.innerHTML = '<option value="">No hay inventarios disponibles</option>';
        // Enable button even if no inventories (user can still generate report)
        const generateBtn = document.getElementById('generateReportBtn');
        if (generateBtn) generateBtn.disabled = false;
        return;
    }
    
    select.innerHTML = '<option value="">Todos los inventarios</option>';
    
    inventoriesList.forEach(inventory => {
        const option = document.createElement('option');
        option.value = inventory.id;
        option.textContent = inventory.name || 'Sin nombre';
        select.appendChild(option);
    });
    
    // Enable button once inventories are loaded (inventory selection is optional)
    const generateBtn = document.getElementById('generateReportBtn');
    if (generateBtn) generateBtn.disabled = false;
}

// Clear all filters
function clearFilters() {
    document.getElementById('inventorySelect').value = '';
    
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    document.getElementById('startDate').valueAsDate = firstDay;
    document.getElementById('endDate').valueAsDate = lastDay;
    
    hideReportResults();
}

// Hide report results
function hideReportResults() {
    const resultsSection = document.getElementById('reportResultsSection');
    const emptyState = document.getElementById('reportEmptyState');
    const loadingState = document.getElementById('reportLoadingState');
    
    if (resultsSection) resultsSection.classList.add('hidden');
    if (emptyState) emptyState.classList.remove('hidden');
    if (loadingState) loadingState.classList.add('hidden');
}

// Show empty state initially
function showEmptyState() {
    hideReportResults();
}

// Generate report
async function generateReport() {
    // Wait for user info to be loaded if not already loaded
    if (!userInstitutionId) {
        console.log('Waiting for user info to load...');
        await loadUserInfoAndInventories();
        if (!userInstitutionId) {
            showReportErrorToast('Error', 'No se pudo cargar la información del usuario. Por favor recargue la página.');
            return;
        }
    }

    console.log('Generating report with:', {
        institutionId: userInstitutionId,
        institutionName: userInstitutionName
    });

    const inventorySelect = document.getElementById('inventorySelect');
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    
    if (!inventorySelect || !startDateInput || !endDateInput) {
        showReportErrorToast('Error', 'No se encontraron los elementos del formulario. Por favor recargue la página.');
        return;
    }

    const inventoryId = inventorySelect.value || null;
    const startDate = startDateInput.value;
    const endDate = endDateInput.value;

    console.log('Report filters:', { inventoryId, startDate, endDate });

    // Show loading state
    const loadingState = document.getElementById('reportLoadingState');
    const resultsSection = document.getElementById('reportResultsSection');
    const emptyState = document.getElementById('reportEmptyState');
    
    if (loadingState) loadingState.classList.remove('hidden');
    if (resultsSection) resultsSection.classList.add('hidden');
    if (emptyState) emptyState.classList.add('hidden');

    try {
        const data = await fetchLoansReport(userInstitutionId, inventoryId, startDate, endDate);
        console.log('Report data received:', data.length, 'loans');
        currentReportData = data || [];
        displayReport(data || []);
    } catch (error) {
        console.error('Error generating report:', error);
        const errorMessage = error.message || 'Error desconocido al generar el reporte';
        showReportErrorToast('Error', 'Error al generar el reporte: ' + errorMessage);
        if (loadingState) loadingState.classList.add('hidden');
        if (emptyState) emptyState.classList.remove('hidden');
    }
}

// Fetch loans report using filter endpoint
async function fetchLoansReport(institutionId, inventoryId, startDate, endDate) {
    const token = localStorage.getItem('jwt');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    // Build endpoint with filters
    const params = new URLSearchParams();
    if (institutionId) {
        params.append('institutionId', institutionId.toString());
    }
    if (inventoryId) {
        params.append('inventoryId', inventoryId.toString());
    }

    let endpoint = '/api/v1/loan/filter';
    const paramsString = params.toString();
    if (paramsString) {
        endpoint += `?${paramsString}`;
    }

    console.log('Fetching loans from:', endpoint);

    const response = await fetch(endpoint, {
        method: 'GET',
        headers: headers
    });

    if (!response.ok) {
        const errorText = await response.text().catch(() => 'Error desconocido');
        console.error('Error fetching loans:', response.status, errorText);
        throw new Error(`Error al cargar préstamos: ${response.status} - ${errorText}`);
    }

    let loans = await response.json();
    if (!Array.isArray(loans)) {
        console.warn('Loans response is not an array:', loans);
        loans = [];
    }

    console.log(`Loaded ${loans.length} loans from API`);
    
    // Debug: log first loan to see structure
    if (loans.length > 0) {
        console.log('Sample loan:', loans[0]);
    }
    
    // Filter by date if provided
    if (startDate || endDate) {
        loans = loans.filter(loan => {
            const loanDate = loan.lendAt;
            if (!loanDate) return false;
            try {
                const date = new Date(loanDate);
                if (isNaN(date.getTime())) return false;
                
                if (startDate) {
                    const startDateObj = new Date(startDate);
                    startDateObj.setHours(0, 0, 0, 0);
                    if (date < startDateObj) return false;
                }
                if (endDate) {
                    const endDateObj = new Date(endDate);
                    endDateObj.setHours(23, 59, 59, 999);
                    if (date > endDateObj) return false;
                }
                return true;
            } catch (e) {
                console.warn('Error parsing loan date:', loanDate, e);
                return false;
            }
        });
        console.log(`Filtered to ${loans.length} loans by date range`);
    }
    
    // Fetch item names for all unique item IDs
    const uniqueItemIds = [...new Set(loans.map(loan => loan.itemId).filter(id => id != null))];
    const itemNamesMap = await fetchItemNames(uniqueItemIds, headers);
    
    // Map loan data to expected format for display
    return loans.map(loan => {
        const itemId = loan.itemId;
        const itemName = itemNamesMap[itemId] || `Item #${itemId || 'N/A'}`;
        
        return {
            id: loan.id,
            userName: loan.responsibleName || 'N/A',
            itemName: itemName,
            loanDate: loan.lendAt,
            returnDate: loan.returnAt || null,
            status: (loan.returned === true || loan.returned === 'true') ? 'Devuelto' : 'Prestado',
            responsibleName: loan.responsibleName || 'N/A',
            lenderName: loan.lenderName || 'N/A',
            itemId: loan.itemId,
            detailsLend: loan.detailsLend,
            detailsReturn: loan.detailsReturn,
            returned: (loan.returned === true || loan.returned === 'true')
        };
    });
}

// Fetch item names for given item IDs
async function fetchItemNames(itemIds, headers) {
    if (!itemIds || itemIds.length === 0) {
        return {};
    }

    const itemNamesMap = {};
    
    // Initialize with item IDs as fallback
    itemIds.forEach(id => {
        itemNamesMap[id] = `Item #${id}`;
    });
    
    // Try to get all items for the institution
    try {
        const allItemsResponse = await fetch(`/api/v1/items?page=0&size=10000`, {
            method: 'GET',
            headers: headers
        });

        if (allItemsResponse.ok) {
            const itemsData = await allItemsResponse.json();
            const items = Array.isArray(itemsData) ? itemsData : (itemsData.content || []);
            
            items.forEach(item => {
                if (item.id && itemIds.includes(item.id)) {
                    const name = item.productName || item.name || item.licencePlateNumber;
                    if (name) {
                        itemNamesMap[item.id] = name;
                    }
                }
            });
        }
    } catch (error) {
        console.warn('Error fetching item names:', error);
        // Continue with item IDs as fallback
    }

    return itemNamesMap;
}

// Display report
function displayReport(data) {
    const loadingState = document.getElementById('reportLoadingState');
    const emptyState = document.getElementById('reportEmptyState');
    const resultsSection = document.getElementById('reportResultsSection');
    const reportTitle = document.getElementById('reportTitle');
    const reportSubtitle = document.getElementById('reportSubtitle');
    
    if (loadingState) loadingState.classList.add('hidden');
    
    // Check if data is empty
    if (!data || !Array.isArray(data) || data.length === 0) {
        console.log('No data to display, showing empty state');
        if (emptyState) emptyState.classList.remove('hidden');
        if (resultsSection) resultsSection.classList.add('hidden');
        return;
    }

    console.log('Displaying report with', data.length, 'loans');
    
    if (emptyState) emptyState.classList.add('hidden');
    if (resultsSection) resultsSection.classList.remove('hidden');

    // Update title
    if (reportTitle) reportTitle.textContent = 'Reporte de Préstamos';
    
    const institutionName = userInstitutionName || 'Institución';
    if (reportSubtitle) reportSubtitle.textContent = institutionName;

    // Generate statistics
    generateStatistics(data);

    // Generate table
    displayLoansTable(data);
}

// Generate statistics
function generateStatistics(data) {
    if (!Array.isArray(data) || data.length === 0) return;

    const statsContainer = document.getElementById('reportStats');
    if (!statsContainer) {
        console.error('reportStats container not found');
        return;
    }
    
    const totalLoans = data.length;
    const returnedLoans = data.filter(loan => loan.returned === true || loan.returned === 'true').length;
    const activeLoans = totalLoans - returnedLoans;

    const statsHTML = `
        <div class="stat-card p-4 border border-gray-200 dark:border-gray-600 rounded-xl">
            <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Préstamos</span>
                <i class="fas fa-hand-holding text-blue-500"></i>
            </div>
            <div class="text-2xl font-bold text-gray-800 dark:text-gray-100">${totalLoans}</div>
        </div>
        <div class="stat-card p-4 border border-gray-200 dark:border-gray-600 rounded-xl">
            <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-medium text-gray-600 dark:text-gray-400">Activos</span>
                <i class="fas fa-clock text-orange-500"></i>
            </div>
            <div class="text-2xl font-bold text-gray-800 dark:text-gray-100">${activeLoans}</div>
        </div>
        <div class="stat-card p-4 border border-gray-200 dark:border-gray-600 rounded-xl">
            <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-medium text-gray-600 dark:text-gray-400">Devueltos</span>
                <i class="fas fa-check-circle text-green-500"></i>
            </div>
            <div class="text-2xl font-bold text-gray-800 dark:text-gray-100">${returnedLoans}</div>
        </div>
        <div class="stat-card p-4 border border-gray-200 dark:border-gray-600 rounded-xl">
            <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-medium text-gray-600 dark:text-gray-400">Porcentaje Devuelto</span>
                <i class="fas fa-percentage text-purple-500"></i>
            </div>
            <div class="text-2xl font-bold text-gray-800 dark:text-gray-100">${totalLoans > 0 ? Math.round((returnedLoans / totalLoans) * 100) : 0}%</div>
        </div>
    `;

    statsContainer.innerHTML = statsHTML;
}

// Display loans table
function displayLoansTable(data) {
    const headers = [
        { field: 'id', label: 'ID', type: 'number' },
        { field: 'userName', label: 'Responsable', type: 'string' },
        { field: 'itemName', label: 'Item', type: 'string' },
        { field: 'loanDate', label: 'Fecha Préstamo', type: 'date' },
        { field: 'returnDate', label: 'Fecha Devolución', type: 'date' },
        { field: 'status', label: 'Estado', type: 'string' }
    ];

    const tableHeader = document.getElementById('reportTableHeader');
    const tableBody = document.getElementById('reportTableBody');

    // Clear existing content
    tableHeader.innerHTML = '';
    tableBody.innerHTML = '';

    // Create header row
    const headerRow = document.createElement('tr');
    headers.forEach((header) => {
        const th = document.createElement('th');
        th.textContent = header.label;
        th.className = 'py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap';
        th.style.padding = '8px 12px';
        headerRow.appendChild(th);
    });
    tableHeader.appendChild(headerRow);

    // Create body rows
    data.forEach((loan, index) => {
        const row = document.createElement('tr');
        row.className = index % 2 === 0 
            ? 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700' 
            : 'bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-600';
        
        headers.forEach((header) => {
            const td = document.createElement('td');
            const value = getValueForField(loan, header.field);
            td.textContent = formatValue(value, header.type, header.field);
            td.className = 'py-2 text-sm text-gray-800 dark:text-gray-200';
            td.style.padding = '6px 12px';
            row.appendChild(td);
        });
        
        tableBody.appendChild(row);
    });

    // Update row count
    document.getElementById('reportRowCount').textContent = `${data.length} ${data.length === 1 ? 'registro' : 'registros'}`;
}

// Get value for field
function getValueForField(item, field) {
    return item[field];
}

// Format value based on type
function formatValue(value, type, fieldName) {
    if (value === null || value === undefined) return '-';
    
    switch (type) {
        case 'date':
            if (value) {
                const date = new Date(value);
                return date.toLocaleDateString('es-ES');
            }
            return '-';
        case 'currency':
            if (typeof value === 'number') {
                return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(value);
            }
            return value;
        case 'boolean':
            return value ? 'Activo' : 'Inactivo';
        default:
            return String(value);
    }
}

// Export to PDF
async function exportToPDF() {
    try {
        if (!currentReportData || currentReportData.length === 0) {
            showReportErrorToast('Error', 'No hay datos para exportar');
            return;
        }

        // Check if jsPDF is available
        if (!window.jspdf || !window.jspdf.jsPDF) {
            showReportErrorToast('Error', 'La librería PDF no está disponible. Por favor recargue la página.');
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Enhanced Header
        const pageWidth = doc.internal.pageSize.getWidth();
        const headerHeight = 60;
        
        // Main header background
        doc.setFillColor(0, 140, 0);
        doc.rect(0, 0, pageWidth, headerHeight, 'F');
    
        // Accent bar at bottom of header
        doc.setFillColor(0, 175, 0);
        doc.rect(0, headerHeight - 5, pageWidth, 5, 'F');
        
        // Header text
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(28);
        doc.setFont('helvetica', 'bold');
        doc.text('SGDIS', 20, 28);
        
        doc.setFontSize(14);
        doc.setFont('helvetica', 'normal');
        doc.text('Sistema de Gestión de Inventario SENA', 20, 38);
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'italic');
        doc.text('Reporte de Préstamos', 20, 48);
        
        // Decorative line
        doc.setDrawColor(255, 255, 255);
        doc.setLineWidth(0.8);
        doc.line(20, 52, pageWidth - 20, 52);

        // Reset text color
        doc.setTextColor(0, 0, 0);
        
        // Filters section
        let yPos = headerHeight + 18;
        
        // Background box for filters
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(14, yPos - 10, pageWidth - 28, 48, 4, 4, 'F');
        
        // Border for filters box
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.8);
        doc.roundedRect(14, yPos - 10, pageWidth - 28, 48, 4, 4);
        
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 140, 0);
        doc.text('INFORMACION DEL REPORTE', 20, yPos);
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(40, 40, 40);
        
        const institutionName = userInstitutionName || 'Institución';
        const startDate = document.getElementById('startDate').value || 'No especificada';
        const endDate = document.getElementById('endDate').value || 'No especificada';
        const generatedDate = new Date().toLocaleDateString('es-ES', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        yPos += 7;
        doc.text('Centro:', 20, yPos);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(60, 60, 60);
        doc.text(institutionName.length > 45 ? institutionName.substring(0, 45) + '...' : institutionName, 20 + 40, yPos);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(40, 40, 40);
        
        yPos += 7;
        doc.text('Fecha inicio:', 20, yPos);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(60, 60, 60);
        doc.text(startDate || 'No especificada', 20 + 40, yPos);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(40, 40, 40);
        
        yPos += 7;
        doc.text('Fecha fin:', 20, yPos);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(60, 60, 60);
        doc.text(endDate || 'No especificada', 20 + 40, yPos);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(40, 40, 40);
        
        yPos += 7;
        doc.text('Generado el:', 20, yPos);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(60, 60, 60);
        doc.text(generatedDate, 20 + 40, yPos);
        doc.setFont('helvetica', 'normal');
        
        doc.setTextColor(0, 0, 0);
        yPos += 18;

        // Statistics section
        const totalLoans = currentReportData.length;
        const returnedLoans = currentReportData.filter(loan => loan.returned === true || loan.returned === 'true').length;
        const activeLoans = totalLoans - returnedLoans;

        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 140, 0);
        doc.text('ESTADISTICAS', 14, yPos);
        doc.setTextColor(0, 0, 0);
        yPos += 14;

        // Statistics cards in 2x2 grid
        const cardWidth = (pageWidth - 42) / 2;
        const cardHeight = 28;
        const cardSpacing = 10;
        
        // Card 1: Total Loans
        doc.setFillColor(59, 130, 246);
        doc.roundedRect(14, yPos, cardWidth, cardHeight, 4, 4, 'F');
        doc.setDrawColor(40, 100, 200);
        doc.setLineWidth(0.5);
        doc.roundedRect(14, yPos, cardWidth, cardHeight, 4, 4);
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('TOTAL PRESTAMOS', 20, yPos + 8);
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text(totalLoans.toString(), 20, yPos + 20);
        
        // Card 2: Active Loans
        doc.setFillColor(249, 115, 22);
        doc.roundedRect(14 + cardWidth + cardSpacing, yPos, cardWidth, cardHeight, 4, 4, 'F');
        doc.setDrawColor(200, 80, 10);
        doc.setLineWidth(0.5);
        doc.roundedRect(14 + cardWidth + cardSpacing, yPos, cardWidth, cardHeight, 4, 4);
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('PRESTAMOS ACTIVOS', 20 + cardWidth + cardSpacing, yPos + 8);
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text(activeLoans.toString(), 20 + cardWidth + cardSpacing, yPos + 20);
        
        yPos += cardHeight + cardSpacing;
        
        // Card 3: Returned Loans
        doc.setFillColor(34, 197, 94);
        doc.roundedRect(14, yPos, cardWidth, cardHeight, 4, 4, 'F');
        doc.setDrawColor(20, 150, 70);
        doc.setLineWidth(0.5);
        doc.roundedRect(14, yPos, cardWidth, cardHeight, 4, 4);
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('DEVUELTOS', 20, yPos + 8);
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text(returnedLoans.toString(), 20, yPos + 20);
        
        // Card 4: Return Percentage
        const returnPercent = totalLoans > 0 ? Math.round((returnedLoans / totalLoans) * 100) : 0;
        doc.setFillColor(147, 51, 234);
        doc.roundedRect(14 + cardWidth + cardSpacing, yPos, cardWidth, cardHeight, 4, 4, 'F');
        doc.setDrawColor(100, 30, 180);
        doc.setLineWidth(0.5);
        doc.roundedRect(14 + cardWidth + cardSpacing, yPos, cardWidth, cardHeight, 4, 4);
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('PORCENTAJE DEVUELTO', 20 + cardWidth + cardSpacing, yPos + 8);
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text(returnPercent + '%', 20 + cardWidth + cardSpacing, yPos + 20);
        
        doc.setTextColor(0, 0, 0);
        yPos += cardHeight + 18;

        // Table section
        if (currentReportData.length > 0) {
            // Check if we need a new page
            if (yPos > doc.internal.pageSize.getHeight() - 60) {
                doc.addPage();
                yPos = 20;
            }

            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(0, 140, 0);
            doc.text('DETALLE DE PRESTAMOS', 14, yPos);
            doc.setTextColor(0, 0, 0);
            yPos += 12;

            // Prepare table data
            const headers = ['ID', 'Responsable', 'Item', 'Fecha Préstamo', 'Fecha Devolución', 'Estado'];
            const tableData = currentReportData.map(loan => [
                loan.id?.toString() || '-',
                loan.userName || '-',
                loan.itemName || '-',
                loan.loanDate ? new Date(loan.loanDate).toLocaleDateString('es-ES') : '-',
                loan.returnDate ? new Date(loan.returnDate).toLocaleDateString('es-ES') : '-',
                loan.status || '-'
            ]);

            doc.autoTable({
                startY: yPos,
                head: [headers],
                body: tableData,
                theme: 'striped',
                headStyles: { 
                    fillColor: [0, 140, 0],
                    textColor: [255, 255, 255],
                    fontStyle: 'bold',
                    fontSize: 10,
                    cellPadding: 5,
                    halign: 'center'
                },
                bodyStyles: {
                    fontSize: 9,
                    cellPadding: 4,
                    halign: 'left'
                },
                alternateRowStyles: {
                    fillColor: [250, 250, 252]
                },
                styles: { 
                    fontSize: 9,
                    cellPadding: 3,
                    lineColor: [220, 220, 220],
                    lineWidth: 0.3
                },
                margin: { left: 14, right: 14 },
                overflow: 'linebreak'
            });
        }

        // Enhanced Footer on each page
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            const pageHeight = doc.internal.pageSize.getHeight();
            
            // Footer background
            doc.setFillColor(245, 247, 250);
            doc.rect(0, pageHeight - 20, pageWidth, 20, 'F');
            
            // Footer top line
            doc.setDrawColor(0, 140, 0);
            doc.setLineWidth(0.5);
            doc.line(0, pageHeight - 20, pageWidth, pageHeight - 20);
            
            // Footer text
            doc.setFontSize(8);
            doc.setTextColor(100, 100, 100);
            doc.setFont('helvetica', 'normal');
            doc.text(
                `Página ${i} de ${pageCount}`,
                pageWidth / 2,
                pageHeight - 12,
                { align: 'center' }
            );
            
            doc.setFontSize(7);
            doc.setTextColor(150, 150, 150);
            doc.text(
                'SGDIS - Sistema de Gestión de Inventario SENA',
                pageWidth / 2,
                pageHeight - 6,
                { align: 'center' }
            );
        }

        // Save PDF
        const fileName = `Reporte_de_Prestamos_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(fileName);
        
        showReportSuccessToast('Éxito', 'Reporte exportado a PDF correctamente');
    } catch (error) {
        console.error('Error exporting to PDF:', error);
        showReportErrorToast('Error', 'Error al exportar el PDF: ' + (error.message || 'Error desconocido'));
    }
}

// Toast helper functions
function showReportErrorToast(title, message) {
    console.log('Show error toast:', title, message);
    if (typeof window.showErrorToast === 'function') {
        window.showErrorToast(title, message);
    } else if (typeof window.showInventoryErrorToast === 'function') {
        window.showInventoryErrorToast(title, message);
    } else if (typeof window.showInventoryToast === 'function') {
        window.showInventoryToast({ tipo: 'error', titulo: title, descripcion: message });
    } else {
        console.error(`${title}: ${message}`);
        alert(`${title}: ${message}`);
    }
}

function showReportSuccessToast(title, message) {
    if (typeof window.showSuccessToast === 'function') {
        window.showSuccessToast(title, message);
    } else if (typeof window.showInventorySuccessToast === 'function') {
        window.showInventorySuccessToast(title, message);
    } else {
        alert(`${title}: ${message}`);
    }
}
