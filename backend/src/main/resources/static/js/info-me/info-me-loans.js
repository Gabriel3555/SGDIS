// Load user loans
async function loadUserLoans() {
    const loansLoading = document.getElementById('loansLoading');
    const loansContent = document.getElementById('loansContent');
    const loansList = document.getElementById('loansList');
    const loansEmpty = document.getElementById('loansEmpty');

    try {
        const token = localStorage.getItem('jwt');
        if (!token) {
            throw new Error('No authentication token found');
        }

        const response = await fetch('/api/v1/users/me/loans', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const loans = await response.json();
            displayLoans(loans);
            loansLoading.style.display = 'none';
            loansContent.style.display = 'block';
        } else if (response.status === 401) {
            localStorage.removeItem('jwt');
            window.location.href = '/';
        } else {
            throw new Error('Error al cargar los préstamos');
        }
    } catch (error) {
        console.error('Error loading user loans:', error);
        loansLoading.innerHTML = `
            <i class="fas fa-exclamation-triangle text-2xl text-red-500 mb-2"></i>
            <p class="text-red-600">Error al cargar los préstamos</p>
            <button onclick="loadUserLoans()" class="mt-4 px-4 py-2 bg-sena-verde hover:bg-sena-verde-oscuro text-white rounded-lg transition-colors">
                Reintentar
            </button>
        `;
    }
}

// Display loans in the UI
function displayLoans(loans) {
    const loansList = document.getElementById('loansList');
    const loansEmpty = document.getElementById('loansEmpty');

    if (!loans || loans.length === 0) {
        loansList.style.display = 'none';
        loansEmpty.style.display = 'block';
        return;
    }

    loansList.style.display = 'block';
    loansEmpty.style.display = 'none';

    loansList.innerHTML = loans.map(loan => {
        const lendDate = loan.lendAt ? new Date(loan.lendAt).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }) : 'Fecha no disponible';

        const returnDate = loan.returnAt ? new Date(loan.returnAt).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }) : null;

        const isReturned = loan.returned === true;
        const statusBadge = isReturned 
            ? '<span class="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">Devuelto</span>'
            : '<span class="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">Prestado</span>';

        return `
            <div class="loan-card border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div class="flex items-start justify-between mb-3">
                    <div class="flex-1">
                        <div class="flex items-center gap-3 mb-2">
                            <i class="fas fa-box text-green-600 text-xl"></i>
                            <div>
                                <h4 class="font-bold text-gray-800">Item #${loan.itemId || 'N/A'}</h4>
                                <p class="text-sm text-gray-600">Prestado por: ${loan.lenderName || 'N/A'}</p>
                            </div>
                        </div>
                        ${loan.detailsLend ? `
                            <p class="text-sm text-gray-600 mb-2">
                                <i class="fas fa-info-circle text-gray-400"></i>
                                ${loan.detailsLend}
                            </p>
                        ` : ''}
                        ${isReturned && loan.detailsReturn ? `
                            <p class="text-sm text-gray-600 mb-2">
                                <i class="fas fa-check-circle text-green-600"></i>
                                <strong>Detalles de devolución:</strong> ${loan.detailsReturn}
                            </p>
                        ` : ''}
                    </div>
                    ${statusBadge}
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div class="flex items-center gap-2 text-gray-600">
                        <i class="fas fa-calendar-alt text-gray-400"></i>
                        <span><strong>Fecha de préstamo:</strong> ${lendDate}</span>
                    </div>
                    ${returnDate ? `
                        <div class="flex items-center gap-2 text-gray-600">
                            <i class="fas fa-calendar-check text-gray-400"></i>
                            <span><strong>Fecha de devolución:</strong> ${returnDate}</span>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

// Initialize loans when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Wait a bit for the profile to load first
    setTimeout(() => {
        loadUserLoans();
    }, 500);
});

