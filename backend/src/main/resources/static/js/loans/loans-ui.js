function updateLoansUI() {
    // Check if user is USER role and show different UI
    if (loansData.userRole === 'USER') {
        updateUserLoansUI();
    } else {
        updateLoansStats();
        updateLoansTable();
        updatePagination();
    }
}

function updateLoansStats() {
    const statsContainer = document.getElementById('loansStatsContainer');
    if (!statsContainer) return;

    // Check if user is admin regional and has statistics from endpoint
    const isAdminRegional = (window.currentUserRole && window.currentUserRole.toUpperCase() === 'ADMIN_REGIONAL') || 
                           (window.location.pathname && window.location.pathname.includes('/admin_regional'));
    
    let totalLoans, activeLoans, returnedLoans;
    
    if (isAdminRegional && window.loansData && window.loansData.statistics) {
        // Use total statistics from endpoint
        const stats = window.loansData.statistics;
        totalLoans = stats.totalLoans || 0;
        activeLoans = stats.activeLoans || 0;
        returnedLoans = stats.returnedLoans || 0;
    } else {
        // Fallback to local calculation from current page data
        totalLoans = loansData.loans.length;
        activeLoans = loansData.loans.filter(loan => !loan.returned || loan.returned === null || loan.returned === false).length;
        returnedLoans = loansData.loans.filter(loan => loan.returned === true).length;
    }
    
    const filteredLoans = loansData.filteredLoans.length;

    statsContainer.innerHTML = `
        <div class="stat-card bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-800">
            <div class="flex items-start justify-between mb-3">
                <div>
                    <p class="text-sm text-blue-600 dark:text-blue-400 font-medium mb-1">Total Préstamos</p>
                    <p class="text-3xl font-bold text-blue-800 dark:text-blue-300">${totalLoans}</p>
                </div>
                <div class="w-12 h-12 bg-blue-500 dark:bg-blue-600 rounded-full flex items-center justify-center">
                    <i class="fas fa-list text-white text-xl"></i>
                </div>
            </div>
            <p class="text-xs text-blue-600 dark:text-blue-400">Todos los préstamos registrados</p>
        </div>

        <div class="stat-card bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border border-yellow-200 dark:border-yellow-800">
            <div class="flex items-start justify-between mb-3">
                <div>
                    <p class="text-sm text-yellow-600 dark:text-yellow-400 font-medium mb-1">Préstamos Activos</p>
                    <p class="text-3xl font-bold text-yellow-800 dark:text-yellow-300">${activeLoans}</p>
                </div>
                <div class="w-12 h-12 bg-yellow-500 dark:bg-yellow-600 rounded-full flex items-center justify-center">
                    <i class="fas fa-clock text-white text-xl"></i>
                </div>
            </div>
            <p class="text-xs text-yellow-600 dark:text-yellow-400">Items actualmente prestados</p>
        </div>

        <div class="stat-card bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border border-green-200 dark:border-green-800">
            <div class="flex items-start justify-between mb-3">
                <div>
                    <p class="text-sm text-green-600 dark:text-green-400 font-medium mb-1">Préstamos Devueltos</p>
                    <p class="text-3xl font-bold text-green-800 dark:text-green-300">${returnedLoans}</p>
                </div>
                <div class="w-12 h-12 bg-green-500 dark:bg-green-600 rounded-full flex items-center justify-center">
                    <i class="fas fa-check-circle text-white text-xl"></i>
                </div>
            </div>
            <p class="text-xs text-green-600 dark:text-green-400">Items devueltos</p>
        </div>

        <div class="stat-card bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border border-purple-200 dark:border-purple-800">
            <div class="flex items-start justify-between mb-3">
                <div>
                    <p class="text-sm text-purple-600 dark:text-purple-400 font-medium mb-1">Filtrados</p>
                    <p class="text-3xl font-bold text-purple-800 dark:text-purple-300">${filteredLoans}</p>
                </div>
                <div class="w-12 h-12 bg-purple-500 dark:bg-purple-600 rounded-full flex items-center justify-center">
                    <i class="fas fa-filter text-white text-xl"></i>
                </div>
            </div>
            <p class="text-xs text-purple-600 dark:text-purple-400">Préstamos mostrados</p>
        </div>
    `;
}

function updateLoansTable() {
    // If user is USER role, don't use this function - use updateUserLoansUI instead
    if (loansData.userRole === 'USER') {
        return;
    }

    const container = document.getElementById('loansTableContainer');
    if (!container) {
        console.warn('loansTableContainer not found');
        return;
    }

    if (loansData.isLoading) {
        container.innerHTML = `
            <div class="flex items-center justify-center py-12">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00AF00]"></div>
            </div>
        `;
        return;
    }

    if (!loansData.filteredLoans || loansData.filteredLoans.length === 0) {
        console.log('No filtered loans to display');
        container.innerHTML = `
            <div class="text-center py-12">
                <i class="fas fa-inbox text-4xl text-gray-400 dark:text-gray-500 mb-4"></i>
                <p class="text-gray-600 dark:text-gray-400 text-lg">No se encontraron préstamos</p>
                <p class="text-sm text-gray-500 dark:text-gray-500 mt-2">Intenta ajustar los filtros de búsqueda</p>
            </div>
        `;
        return;
    }

    const startIndex = (loansData.currentPage - 1) * loansData.itemsPerPage;
    const endIndex = startIndex + loansData.itemsPerPage;
    const currentLoans = loansData.filteredLoans.slice(startIndex, endIndex);

    let tableHtml = `
        <div class="overflow-x-auto">
            <table class="w-full">
                <thead>
                    <tr class="border-b border-gray-200 dark:border-gray-700">
                        <th class="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Número de Placa</th>
                        <th class="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Responsable</th>
                        <th class="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Prestador</th>
                        <th class="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Fecha Préstamo</th>
                        <th class="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Fecha Devolución</th>
                        <th class="text-center py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Estado</th>
                        <th class="text-center py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Acciones</th>
                    </tr>
                </thead>
                <tbody>
    `;

    currentLoans.forEach(loan => {
        const lendDate = loan.lendAt ? new Date(loan.lendAt).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }) : 'N/A';

        const returnDate = loan.returnAt ? new Date(loan.returnAt).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }) : '-';

        const statusText = getLoanStatusText(loan.returned);
        const statusColor = getLoanStatusColor(loan.returned);

        const returnButton = !loan.returned ? `
            <button onclick="handleReturnItemClick(${loan.id})" 
                class="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1">
                <i class="fas fa-undo"></i>
                <span>Devolver</span>
            </button>
        ` : `
            <span class="text-xs text-gray-500 dark:text-gray-400">Devuelto</span>
        `;

        tableHtml += `
            <tr class="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <td class="py-3 px-4 text-sm text-gray-800 dark:text-gray-200">${loan.licencePlateNumber || 'N/A'}</td>
                <td class="py-3 px-4 text-sm text-gray-800 dark:text-gray-200">${loan.responsibleName || 'N/A'}</td>
                <td class="py-3 px-4 text-sm text-gray-800 dark:text-gray-200">${loan.lenderName || 'N/A'}</td>
                <td class="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">${lendDate}</td>
                <td class="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">${returnDate}</td>
                <td class="py-3 px-4 text-center">
                    <span class="px-3 py-1 rounded-full text-xs font-semibold ${statusColor}">
                        ${statusText}
                    </span>
                </td>
                <td class="py-3 px-4 text-center">
                    ${returnButton}
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

// Update UI specifically for USER role
function updateUserLoansUI() {
    updateUserLoansStats();
    updateUserLoansContent();
}

// Update stats for USER role
function updateUserLoansStats() {
    const statsContainer = document.getElementById('loansStatsContainer');
    if (!statsContainer) return;

    // Always use the complete loans data (not filtered) for statistics
    // Loans received by user (where user is responsible)
    const allLoansReceived = loansData.loans || [];
    const activeLoansReceived = allLoansReceived.filter(loan => !loan.returned || loan.returned === null || loan.returned === false);
    const returnedLoansReceived = allLoansReceived.filter(loan => loan.returned === true);
    
    // Loans made by user (where user is lender)
    const allLoansMade = loansData.loansMade || [];

    statsContainer.innerHTML = `
        <div class="stat-card bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border border-yellow-200 dark:border-yellow-800">
            <div class="flex items-start justify-between mb-3">
                <div>
                    <p class="text-sm text-yellow-600 dark:text-yellow-400 font-medium mb-1">Préstamos Activos</p>
                    <p class="text-3xl font-bold text-yellow-800 dark:text-yellow-300">${activeLoansReceived.length}</p>
                </div>
                <div class="w-12 h-12 bg-yellow-500 dark:bg-yellow-600 rounded-full flex items-center justify-center">
                    <i class="fas fa-clock text-white text-xl"></i>
                </div>
            </div>
            <p class="text-xs text-yellow-600 dark:text-yellow-400">Items que tienes actualmente</p>
        </div>

        <div class="stat-card bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border border-green-200 dark:border-green-800">
            <div class="flex items-start justify-between mb-3">
                <div>
                    <p class="text-sm text-green-600 dark:text-green-400 font-medium mb-1">Préstamos Devueltos</p>
                    <p class="text-3xl font-bold text-green-800 dark:text-green-300">${returnedLoansReceived.length}</p>
                </div>
                <div class="w-12 h-12 bg-green-500 dark:bg-green-600 rounded-full flex items-center justify-center">
                    <i class="fas fa-check-circle text-white text-xl"></i>
                </div>
            </div>
            <p class="text-xs text-green-600 dark:text-green-400">Items que has devuelto</p>
        </div>

        <div class="stat-card bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border border-purple-200 dark:border-purple-800">
            <div class="flex items-start justify-between mb-3">
                <div>
                    <p class="text-sm text-purple-600 dark:text-purple-400 font-medium mb-1">Préstamos Realizados</p>
                    <p class="text-3xl font-bold text-purple-800 dark:text-purple-300">${allLoansMade.length}</p>
                </div>
                <div class="w-12 h-12 bg-purple-500 dark:bg-purple-600 rounded-full flex items-center justify-center">
                    <i class="fas fa-hand-holding text-white text-xl"></i>
                </div>
            </div>
            <p class="text-xs text-purple-600 dark:text-purple-400">Items que has prestado</p>
        </div>

        <div class="stat-card bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-800">
            <div class="flex items-start justify-between mb-3">
                <div>
                    <p class="text-sm text-blue-600 dark:text-blue-400 font-medium mb-1">Total Préstamos</p>
                    <p class="text-3xl font-bold text-blue-800 dark:text-blue-300">${allLoansReceived.length}</p>
                </div>
                <div class="w-12 h-12 bg-blue-500 dark:bg-blue-600 rounded-full flex items-center justify-center">
                    <i class="fas fa-list text-white text-xl"></i>
                </div>
            </div>
            <p class="text-xs text-blue-600 dark:text-blue-400">Todos tus préstamos recibidos</p>
        </div>
    `;
}

// Update content for USER role with tabs
function updateUserLoansContent() {
    const container = document.getElementById('loansTableContainer');
    if (!container) return;

    if (loansData.isLoading) {
        container.innerHTML = `
            <div class="flex items-center justify-center py-12">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00AF00]"></div>
            </div>
        `;
        return;
    }

    // Use filteredLoans if available, otherwise use loans
    const allLoans = (loansData.filteredLoans && loansData.filteredLoans.length > 0) ? loansData.filteredLoans : (loansData.loans || []);
    const activeLoans = allLoans.filter(loan => !loan.returned || loan.returned === null || loan.returned === false);
    const returnedLoans = allLoans.filter(loan => loan.returned === true);

    // Get current active tab from localStorage or default to 'active'
    let currentTab = localStorage.getItem('userLoansActiveTab') || 'active';
    
    // Loans made by user
    const allLoansMade = (loansData.filteredLoansMade && loansData.filteredLoansMade.length > 0) ? loansData.filteredLoansMade : (loansData.loansMade || []);
    const activeLoansMade = allLoansMade.filter(loan => !loan.returned || loan.returned === null || loan.returned === false);
    const returnedLoansMade = allLoansMade.filter(loan => loan.returned === true);

    let html = `
        <div class="mb-6">
            <div class="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
                <button onclick="switchUserLoansTab('active')" 
                    class="px-6 py-3 font-semibold text-sm transition-colors whitespace-nowrap ${
                        currentTab === 'active' 
                            ? 'border-b-2 border-[#00AF00] text-[#00AF00] dark:text-green-400' 
                            : 'text-gray-600 dark:text-gray-400 hover:text-[#00AF00] dark:hover:text-green-400'
                    }">
                    <i class="fas fa-clock mr-2"></i>
                    Préstamos Activos (${activeLoans.length})
                </button>
                <button onclick="switchUserLoansTab('history')" 
                    class="px-6 py-3 font-semibold text-sm transition-colors whitespace-nowrap ${
                        currentTab === 'history' 
                            ? 'border-b-2 border-[#00AF00] text-[#00AF00] dark:text-green-400' 
                            : 'text-gray-600 dark:text-gray-400 hover:text-[#00AF00] dark:hover:text-green-400'
                    }">
                    <i class="fas fa-history mr-2"></i>
                    Historial (${returnedLoans.length})
                </button>
                <button onclick="switchUserLoansTab('made')" 
                    class="px-6 py-3 font-semibold text-sm transition-colors whitespace-nowrap ${
                        currentTab === 'made' 
                            ? 'border-b-2 border-[#00AF00] text-[#00AF00] dark:text-green-400' 
                            : 'text-gray-600 dark:text-gray-400 hover:text-[#00AF00] dark:hover:text-green-400'
                    }">
                    <i class="fas fa-hand-holding mr-2"></i>
                    Préstamos Realizados (${allLoansMade.length})
                </button>
            </div>
        </div>
    `;

    if (currentTab === 'active') {
        html += renderActiveLoans(activeLoans);
    } else if (currentTab === 'history') {
        html += renderLoanHistory(returnedLoans);
    } else if (currentTab === 'made') {
        html += renderLoansMade(allLoansMade, activeLoansMade, returnedLoansMade);
    }

    container.innerHTML = html;
}

// Render active loans with return buttons
function renderActiveLoans(activeLoans) {
    if (activeLoans.length === 0) {
        return `
            <div class="text-center py-12">
                <i class="fas fa-check-circle text-4xl text-gray-400 dark:text-gray-500 mb-4"></i>
                <p class="text-gray-600 dark:text-gray-400 text-lg">No tienes préstamos activos</p>
                <p class="text-sm text-gray-500 dark:text-gray-500 mt-2">Todos tus items han sido devueltos</p>
            </div>
        `;
    }

    let html = '<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">';

    activeLoans.forEach(loan => {
        const lendDate = loan.lendAt ? new Date(loan.lendAt).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }) : 'N/A';

        const daysSinceLend = loan.lendAt ? Math.floor((new Date() - new Date(loan.lendAt)) / (1000 * 60 * 60 * 24)) : 0;

        html += `
            <div class="stat-card border-2 border-yellow-200 dark:border-yellow-800 hover:border-yellow-300 dark:hover:border-yellow-700 transition-all">
                <div class="flex items-start justify-between mb-3">
                    <div class="flex-1">
                        <div class="flex items-center gap-2 mb-2">
                            <i class="fas fa-box text-yellow-600 dark:text-yellow-400"></i>
                            <span class="font-semibold text-gray-800 dark:text-gray-200">Item #${loan.itemId || 'N/A'}</span>
                        </div>
                        <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">
                            <i class="fas fa-user mr-1"></i>
                            Prestado por: ${loan.lenderName || 'N/A'}
                        </p>
                        <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">
                            <i class="fas fa-calendar mr-1"></i>
                            ${lendDate}
                        </p>
                        <p class="text-sm text-gray-600 dark:text-gray-400">
                            <i class="fas fa-clock mr-1"></i>
                            ${daysSinceLend} día${daysSinceLend !== 1 ? 's' : ''} prestado
                        </p>
                        ${loan.detailsLend ? `
                            <p class="text-xs text-gray-500 dark:text-gray-500 mt-2 italic">
                                "${loan.detailsLend}"
                            </p>
                        ` : ''}
                    </div>
                </div>
                <div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button onclick="showReturnLoanModal(${loan.id})" 
                        class="w-full bg-[#00AF00] hover:bg-[#008800] text-white font-semibold py-2 px-4 rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2">
                        <i class="fas fa-undo"></i>
                        Devolver Item
                    </button>
                </div>
            </div>
        `;
    });

    html += '</div>';
    return html;
}

// Render loan history
function renderLoanHistory(returnedLoans) {
    if (returnedLoans.length === 0) {
        return `
            <div class="text-center py-12">
                <i class="fas fa-inbox text-4xl text-gray-400 dark:text-gray-500 mb-4"></i>
                <p class="text-gray-600 dark:text-gray-400 text-lg">No hay historial de préstamos</p>
                <p class="text-sm text-gray-500 dark:text-gray-500 mt-2">Los préstamos devueltos aparecerán aquí</p>
            </div>
        `;
    }

    // Sort by return date, most recent first
    const sortedLoans = [...returnedLoans].sort((a, b) => {
        if (!a.returnAt && !b.returnAt) return 0;
        if (!a.returnAt) return 1;
        if (!b.returnAt) return -1;
        return new Date(b.returnAt) - new Date(a.returnAt);
    });

    let html = '<div class="space-y-4">';

    sortedLoans.forEach(loan => {
        const lendDate = loan.lendAt ? new Date(loan.lendAt).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }) : 'N/A';

        const returnDate = loan.returnAt ? new Date(loan.returnAt).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }) : 'N/A';

        html += `
            <div class="stat-card border border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-700 transition-all">
                <div class="flex items-start justify-between">
                    <div class="flex-1">
                        <div class="flex items-center gap-2 mb-2">
                            <i class="fas fa-box text-green-600 dark:text-green-400"></i>
                            <span class="font-semibold text-gray-800 dark:text-gray-200">Item #${loan.itemId || 'N/A'}</span>
                            <span class="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
                                Devuelto
                            </span>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <p><i class="fas fa-user mr-1"></i> Prestado por: ${loan.lenderName || 'N/A'}</p>
                            <p><i class="fas fa-calendar-alt mr-1"></i> Prestado: ${lendDate}</p>
                            <p><i class="fas fa-check-circle mr-1"></i> Devuelto: ${returnDate}</p>
                        </div>
                        ${loan.detailsLend ? `
                            <p class="text-xs text-gray-500 dark:text-gray-500 mt-2 italic">
                                <strong>Motivo:</strong> "${loan.detailsLend}"
                            </p>
                        ` : ''}
                        ${loan.detailsReturn ? `
                            <p class="text-xs text-gray-500 dark:text-gray-500 mt-1 italic">
                                <strong>Observación devolución:</strong> "${loan.detailsReturn}"
                            </p>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    });

    html += '</div>';
    return html;
}

// Render loans made by user
function renderLoansMade(allLoansMade, activeLoansMade, returnedLoansMade) {
    if (allLoansMade.length === 0) {
        return `
            <div class="text-center py-12">
                <i class="fas fa-hand-holding text-4xl text-gray-400 dark:text-gray-500 mb-4"></i>
                <p class="text-gray-600 dark:text-gray-400 text-lg">No has realizado ningún préstamo</p>
                <p class="text-sm text-gray-500 dark:text-gray-500 mt-2">Los préstamos que realices aparecerán aquí</p>
            </div>
        `;
    }

    // Sort by lend date, most recent first
    const sortedLoans = [...allLoansMade].sort((a, b) => {
        if (!a.lendAt && !b.lendAt) return 0;
        if (!a.lendAt) return 1;
        if (!b.lendAt) return -1;
        return new Date(b.lendAt) - new Date(a.lendAt);
    });

    let html = `
        <div class="mb-4">
            <div class="flex gap-2 mb-4">
                <span class="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400">
                    <i class="fas fa-clock mr-1"></i> Activos: ${activeLoansMade.length}
                </span>
                <span class="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
                    <i class="fas fa-check-circle mr-1"></i> Devueltos: ${returnedLoansMade.length}
                </span>
            </div>
        </div>
        <div class="space-y-4">
    `;

    sortedLoans.forEach(loan => {
        const lendDate = loan.lendAt ? new Date(loan.lendAt).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }) : 'N/A';

        const returnDate = loan.returnAt ? new Date(loan.returnAt).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }) : null;

        const isActive = !loan.returned || loan.returned === null || loan.returned === false;
        const statusColor = isActive ? 'yellow' : 'green';
        const statusText = isActive ? 'Activo' : 'Devuelto';
        const borderColor = isActive ? 'border-yellow-200 dark:border-yellow-800' : 'border-green-200 dark:border-green-800';
        const iconColor = isActive ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400';

        html += `
            <div class="stat-card border-2 ${borderColor} hover:border-opacity-70 transition-all">
                <div class="flex items-start justify-between">
                    <div class="flex-1">
                        <div class="flex items-center gap-2 mb-2">
                            <i class="fas fa-box ${iconColor}"></i>
                            <span class="font-semibold text-gray-800 dark:text-gray-200">Item #${loan.itemId || 'N/A'}</span>
                            <span class="px-2 py-1 rounded-full text-xs font-semibold bg-${statusColor}-100 dark:bg-${statusColor}-900/30 text-${statusColor}-800 dark:text-${statusColor}-400">
                                ${statusText}
                            </span>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <p><i class="fas fa-user mr-1"></i> Prestado a: ${loan.responsibleName || 'N/A'}</p>
                            <p><i class="fas fa-calendar-alt mr-1"></i> Fecha préstamo: ${lendDate}</p>
                            ${returnDate ? `<p><i class="fas fa-check-circle mr-1"></i> Devuelto: ${returnDate}</p>` : ''}
                        </div>
                        ${loan.detailsLend ? `
                            <p class="text-xs text-gray-500 dark:text-gray-500 mt-2 italic">
                                <strong>Motivo:</strong> "${loan.detailsLend}"
                            </p>
                        ` : ''}
                        ${loan.detailsReturn ? `
                            <p class="text-xs text-gray-500 dark:text-gray-500 mt-1 italic">
                                <strong>Observación devolución:</strong> "${loan.detailsReturn}"
                            </p>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    });

    html += '</div>';
    return html;
}

// Switch between active and history tabs
function switchUserLoansTab(tab) {
    localStorage.setItem('userLoansActiveTab', tab);
    updateUserLoansContent();
}

// Show return loan modal (for USER role)
function showReturnLoanModal(loanId) {
    // Check if user is USER role - only allow for USER role
    const isUserRole = window.loansData && window.loansData.userRole === 'USER';
    if (!isUserRole) {
        console.warn('showReturnLoanModal should only be called for USER role');
        return;
    }

    const modal = document.getElementById('returnItemModal');
    if (!modal) {
        console.error('Return item modal not found');
        return;
    }

    // Set loan ID in the hidden input
    const loanIdInput = document.getElementById('returnLoanId');
    if (loanIdInput) {
        loanIdInput.value = loanId;
    }

    // Reset form
    const detailsTextarea = document.getElementById('returnDetails');
    if (detailsTextarea) {
        detailsTextarea.value = '';
    }

    modal.classList.remove('hidden');
}

// Close return loan modal (for USER role)
function closeReturnLoanModal() {
    // Check if user is USER role
    const isUserRole = window.loansData && window.loansData.userRole === 'USER';
    if (!isUserRole) {
        return;
    }

    const modal = document.getElementById('returnItemModal');
    if (modal) {
        modal.classList.add('hidden');
    }
    
    // Reset form
    const loanIdInput = document.getElementById('returnLoanId');
    if (loanIdInput) {
        loanIdInput.value = '';
    }
    
    const detailsTextarea = document.getElementById('returnDetails');
    if (detailsTextarea) {
        detailsTextarea.value = '';
    }
}

// Handle return loan form submission (for USER role - using existing submitReturnItem from loan-actions.js)
// This function is kept for compatibility but the form in HTML uses submitReturnItem from loan-actions.js
async function handleReturnLoanSubmit(e) {
    e.preventDefault();

    // Check if user is USER role
    const isUserRole = window.loansData && window.loansData.userRole === 'USER';
    if (!isUserRole) {
        return;
    }

    // Use the existing submitReturnItem function from loan-actions.js
    if (typeof window.submitReturnItem === 'function') {
        window.submitReturnItem();
    } else {
        console.error('submitReturnItem function not found');
        if (window.showErrorToast) {
            window.showErrorToast('Error', 'Función de devolución no disponible');
        }
    }
}

function updatePagination() {
    const container = document.getElementById('paginationContainer');
    if (!container) return;

    const totalPages = Math.ceil(loansData.filteredLoans.length / loansData.itemsPerPage);
    const currentPage = loansData.currentPage;
    const totalElements = loansData.filteredLoans.length;

    // Calculate start and end items
    const startItem = totalElements > 0 ? (currentPage - 1) * loansData.itemsPerPage + 1 : 0;
    const endItem = Math.min(currentPage * loansData.itemsPerPage, totalElements);

    let paginationHtml = `
        <div class="text-sm text-gray-600">
            Mostrando ${startItem}-${endItem} de ${totalElements} préstamo${totalElements !== 1 ? 's' : ''}
        </div>
        <div class="flex items-center gap-2 ml-auto">
    `;

    if (loansData && totalPages > 0) {
        // Previous button
        paginationHtml += `
            <button onclick="changePage(${currentPage - 1})" ${
            currentPage === 1 ? 'disabled' : ''
        } class="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                <i class="fas fa-chevron-left"></i>
            </button>
        `;

        // Page numbers - show up to 5 pages
        const maxVisiblePages = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        // Show page numbers
        for (let i = startPage; i <= endPage; i++) {
            paginationHtml += `
                <button onclick="changePage(${i})" class="px-3 py-2 border ${
                currentPage === i
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
            currentPage === totalPages ? 'disabled' : ''
        } class="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                <i class="fas fa-chevron-right"></i>
            </button>
        `;
    }

    paginationHtml += `</div>`;

    container.innerHTML = paginationHtml;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    // Initialize custom selects
    initializeCustomSelects();
    
    // For USER role, the return form uses submitReturnItem from loan-actions.js
    // No need to setup additional handler as the form already has onsubmit="event.preventDefault(); submitReturnItem();"
    
    // Load data after a small delay to ensure all scripts are loaded
    setTimeout(() => {
        if (typeof window.loadLoansData === 'function') {
            window.loadLoansData();
        } else {
            console.error('loadLoansData function not available');
        }
    }, 100);
});

function initializeCustomSelects() {
    // Initialize regional select
    const regionalSelect = document.getElementById('regionalSelect');
    if (regionalSelect) {
        regionalSelect.addEventListener('click', (e) => {
            e.stopPropagation();
            regionalSelect.classList.toggle('open');
        });
    }

    // Initialize institution select
    const institutionSelect = document.getElementById('institutionSelect');
    if (institutionSelect) {
        institutionSelect.addEventListener('click', (e) => {
            e.stopPropagation();
            institutionSelect.classList.toggle('open');
        });
    }

    // Initialize inventory select
    const inventorySelect = document.getElementById('inventorySelect');
    if (inventorySelect) {
        inventorySelect.addEventListener('click', (e) => {
            e.stopPropagation();
            inventorySelect.classList.toggle('open');
        });
    }

    // Close selects when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.custom-select')) {
            document.querySelectorAll('.custom-select').forEach(select => {
                select.classList.remove('open');
            });
        }
    });
}

window.updateLoansUI = updateLoansUI;
window.updateLoansTable = updateLoansTable;
window.updatePagination = updatePagination;
window.updateLoansStats = updateLoansStats;
window.updateUserLoansUI = updateUserLoansUI;
window.updateUserLoansContent = updateUserLoansContent;
window.switchUserLoansTab = switchUserLoansTab;
window.showReturnLoanModal = showReturnLoanModal;
window.closeReturnLoanModal = closeReturnLoanModal;
window.handleReturnLoanSubmit = handleReturnLoanSubmit;

