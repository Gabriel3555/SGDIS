function updateLoansUI() {
    updateLoansStats();
    updateLoansTable();
    updatePagination();
}

function updateLoansStats() {
    const statsContainer = document.getElementById('loansStatsContainer');
    if (!statsContainer) return;

    const totalLoans = loansData.loans.length;
    const activeLoans = loansData.loans.filter(loan => !loan.returned).length;
    const returnedLoans = loansData.loans.filter(loan => loan.returned === true).length;
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

    if (!loansData.filteredLoans || loansData.filteredLoans.length === 0) {
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
                        <th class="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">ID</th>
                        <th class="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Item ID</th>
                        <th class="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Responsable</th>
                        <th class="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Prestador</th>
                        <th class="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Fecha Préstamo</th>
                        <th class="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Fecha Devolución</th>
                        <th class="text-center py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Estado</th>
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

        tableHtml += `
            <tr class="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <td class="py-3 px-4 text-sm text-gray-800 dark:text-gray-200">${loan.id || 'N/A'}</td>
                <td class="py-3 px-4 text-sm text-gray-800 dark:text-gray-200">${loan.itemId || 'N/A'}</td>
                <td class="py-3 px-4 text-sm text-gray-800 dark:text-gray-200">${loan.responsibleName || 'N/A'}</td>
                <td class="py-3 px-4 text-sm text-gray-800 dark:text-gray-200">${loan.lenderName || 'N/A'}</td>
                <td class="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">${lendDate}</td>
                <td class="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">${returnDate}</td>
                <td class="py-3 px-4 text-center">
                    <span class="px-3 py-1 rounded-full text-xs font-semibold ${statusColor}">
                        ${statusText}
                    </span>
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

function updatePagination() {
    const container = document.getElementById('paginationContainer');
    if (!container) return;

    const totalPages = Math.ceil(loansData.filteredLoans.length / loansData.itemsPerPage);
    const currentPage = loansData.currentPage;

    if (totalPages <= 1) {
        container.innerHTML = `
            <div class="text-sm text-gray-600 dark:text-gray-400">
                Mostrando ${loansData.filteredLoans.length} préstamo(s)
            </div>
        `;
        return;
    }

    let paginationHtml = `
        <div class="text-sm text-gray-600 dark:text-gray-400">
            Mostrando ${((currentPage - 1) * loansData.itemsPerPage) + 1} - ${Math.min(currentPage * loansData.itemsPerPage, loansData.filteredLoans.length)} de ${loansData.filteredLoans.length} préstamo(s)
        </div>
        <div class="flex gap-2">
    `;

    // Previous button
    paginationHtml += `
        <button onclick="changePage(${currentPage - 1})" 
            ${currentPage === 1 ? 'disabled' : ''}
            class="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            <i class="fas fa-chevron-left"></i>
        </button>
    `;

    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
            paginationHtml += `
                <button onclick="changePage(${i})" 
                    ${i === currentPage ? 'class="px-3 py-2 rounded-lg bg-[#00AF00] text-white font-semibold"' : 'class="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"'}
                >
                    ${i}
                </button>
            `;
        } else if (i === currentPage - 3 || i === currentPage + 3) {
            paginationHtml += `<span class="px-3 py-2 text-gray-500">...</span>`;
        }
    }

    // Next button
    paginationHtml += `
        <button onclick="changePage(${currentPage + 1})" 
            ${currentPage === totalPages ? 'disabled' : ''}
            class="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            <i class="fas fa-chevron-right"></i>
        </button>
    `;

    paginationHtml += `</div>`;

    container.innerHTML = paginationHtml;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    // Initialize custom selects
    initializeCustomSelects();
    
    // Load data
    loadLoansData();
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

