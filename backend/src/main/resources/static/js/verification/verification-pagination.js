function updatePagination() {
    const container = document.getElementById('paginationContainer');
    if (!container) return;

    const totalPages = Math.ceil(verificationData.filteredVerifications.length / verificationData.itemsPerPage);
    const currentPage = verificationData.currentPage;

    if (totalPages <= 1) {
        container.innerHTML = `
            <div class="text-sm text-gray-600">
                Mostrando ${verificationData.filteredVerifications.length} verificación${verificationData.filteredVerifications.length !== 1 ? 'es' : ''}
            </div>
        `;
        return;
    }

    const startItem = (currentPage - 1) * verificationData.itemsPerPage + 1;
    const endItem = Math.min(currentPage * verificationData.itemsPerPage, verificationData.filteredVerifications.length);

    let paginationHTML = `
        <div class="text-sm text-gray-600">
            Mostrando ${startItem} - ${endItem} de ${verificationData.filteredVerifications.length} verificaciones
        </div>
        <div class="flex gap-2">
    `;

    // Previous button
    paginationHTML += `
        <button onclick="changePage(${currentPage - 1})" 
            ${currentPage === 1 ? 'disabled' : ''} 
            class="px-3 py-2 rounded-lg border transition-colors ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'}">
            <i class="fas fa-chevron-left"></i>
        </button>
    `;

    // Page numbers
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage < maxVisiblePages - 1) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    if (startPage > 1) {
        paginationHTML += `
            <button onclick="changePage(1)" 
                class="px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors">
                1
            </button>
        `;
        if (startPage > 2) {
            paginationHTML += `<span class="px-2 py-2 text-gray-500">...</span>`;
        }
    }

    for (let i = startPage; i <= endPage; i++) {
        paginationHTML += `
            <button onclick="changePage(${i})" 
                class="px-3 py-2 rounded-lg border transition-colors ${i === currentPage ? 'bg-[#00AF00] text-white border-[#00AF00]' : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'}">
                ${i}
            </button>
        `;
    }

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            paginationHTML += `<span class="px-2 py-2 text-gray-500">...</span>`;
        }
        paginationHTML += `
            <button onclick="changePage(${totalPages})" 
                class="px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors">
                ${totalPages}
            </button>
        `;
    }

    // Next button
    paginationHTML += `
        <button onclick="changePage(${currentPage + 1})" 
            ${currentPage === totalPages ? 'disabled' : ''} 
            class="px-3 py-2 rounded-lg border transition-colors ${currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'}">
            <i class="fas fa-chevron-right"></i>
        </button>
    `;

    paginationHTML += `</div>`;

    container.innerHTML = paginationHTML;
}

window.updatePagination = updatePagination;

