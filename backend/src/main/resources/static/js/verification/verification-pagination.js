function updatePagination() {
    const container = document.getElementById('paginationContainer');
    if (!container) return;

    // Use backend pagination data if available, otherwise use client-side data
    const totalPages = verificationData.useBackendPagination 
        ? verificationData.totalPages 
        : Math.ceil(verificationData.filteredVerifications.length / verificationData.itemsPerPage);
    const currentPage = verificationData.currentPage;
    const totalElements = verificationData.useBackendPagination 
        ? verificationData.totalElements 
        : verificationData.filteredVerifications.length;

    // Calculate start and end items
    const startItem = totalElements > 0 ? (currentPage - 1) * verificationData.itemsPerPage + 1 : 0;
    const endItem = Math.min(currentPage * verificationData.itemsPerPage, totalElements);

    let paginationHTML = `
        <div class="text-sm text-gray-600">
            Mostrando ${startItem}-${endItem} de ${totalElements} verificación${totalElements !== 1 ? 'es' : ''}
        </div>
        <div class="flex items-center gap-2 ml-auto">
    `;

    if (verificationData && totalPages > 0) {
        // Previous button
        paginationHTML += `
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
            paginationHTML += `
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
        paginationHTML += `
            <button onclick="changePage(${currentPage + 1})" ${
            currentPage === totalPages ? 'disabled' : ''
        } class="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                <i class="fas fa-chevron-right"></i>
            </button>
        `;
    }

    paginationHTML += `</div>`;

    container.innerHTML = paginationHTML;
}

window.updatePagination = updatePagination;

