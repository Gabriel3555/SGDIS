// Loan Actions - Handle lending and returning items

// Data storage for loan forms
const loanFormData = {
    regionals: [],
    institutions: [],
    inventories: [],
    items: [],
    users: [],
    selectedRegional: null,
    selectedInstitution: null,
    selectedInventory: null,
    selectedItem: null,
    selectedResponsible: null
};

// Initialize loan form
async function initializeLoanForm() {
    try {
        await loadRegionalsForLoan();
        await loadUsersForLoan();
    } catch (error) {
        console.error('Error initializing loan form:', error);
        if (window.showErrorToast) {
            window.showErrorToast('Error', 'Error al inicializar el formulario de préstamos');
        }
    }
}

// Load regionals for loan form
async function loadRegionalsForLoan() {
    try {
        const token = localStorage.getItem('jwt');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch('/api/v1/regional', {
            method: 'GET',
            headers: headers
        });

        if (response.ok) {
            loanFormData.regionals = await response.json();
            populateRegionalSelectForLoan();
        } else {
            console.error('Failed to load regionals');
        }
    } catch (error) {
        console.error('Error loading regionals:', error);
    }
}

// Load institutions based on regional
async function loadInstitutionsForLoan(regionalId) {
    try {
        const token = localStorage.getItem('jwt');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        let endpoint = '/api/v1/institutions';
        if (regionalId && regionalId !== 'all') {
            endpoint = `/api/v1/institutions/institutionsByRegionalId/${regionalId}`;
        }

        const response = await fetch(endpoint, {
            method: 'GET',
            headers: headers
        });

        if (response.ok) {
            loanFormData.institutions = await response.json();
            populateInstitutionSelectForLoan();
        } else {
            console.error('Failed to load institutions');
        }
    } catch (error) {
        console.error('Error loading institutions:', error);
    }
}

// Load inventories based on institution
async function loadInventoriesForLoan(regionalId, institutionId) {
    try {
        const token = localStorage.getItem('jwt');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        let endpoint = '/api/v1/inventory?page=0&size=1000';
        if (regionalId && regionalId !== 'all' && institutionId && institutionId !== 'all') {
            endpoint = `/api/v1/inventory/regional/${regionalId}/institution/${institutionId}?page=0&size=1000`;
        } else if (institutionId && institutionId !== 'all') {
            endpoint = `/api/v1/inventory/institution/${institutionId}?page=0&size=1000`;
        } else if (regionalId && regionalId !== 'all') {
            endpoint = `/api/v1/inventory/regionalAdminInventories/${regionalId}?page=0&size=1000`;
        }

        const response = await fetch(endpoint, {
            method: 'GET',
            headers: headers
        });

        if (response.ok) {
            const data = await response.json();
            loanFormData.inventories = data.content || data || [];
            populateInventorySelectForLoan();
        } else {
            console.error('Failed to load inventories');
        }
    } catch (error) {
        console.error('Error loading inventories:', error);
    }
}

// Load items based on inventory
async function loadItemsForLoan(inventoryId) {
    try {
        if (!inventoryId || inventoryId === 'all') {
            loanFormData.items = [];
            populateItemSelectForLoan();
            return;
        }

        const token = localStorage.getItem('jwt');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(`/api/v1/items/inventory/${inventoryId}?page=0&size=1000`, {
            method: 'GET',
            headers: headers
        });

        if (response.ok) {
            const data = await response.json();
            loanFormData.items = data.content || data || [];
            populateItemSelectForLoan();
        } else {
            console.error('Failed to load items');
            loanFormData.items = [];
            populateItemSelectForLoan();
        }
    } catch (error) {
        console.error('Error loading items:', error);
        loanFormData.items = [];
        populateItemSelectForLoan();
    }
}

// Load users for responsible selection (from user's institution for USER role)
async function loadUsersForLoan() {
    try {
        const token = localStorage.getItem('jwt');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        // For USER role, load users from their institution
        const isUserRole = window.loansData && window.loansData.userRole === 'USER';
        let endpoint = '/api/v1/users?page=0&size=1000';
        
        if (isUserRole) {
            endpoint = '/api/v1/users/institution?page=0&size=1000';
        }

        const response = await fetch(endpoint, {
            method: 'GET',
            headers: headers
        });

        if (response.ok) {
            const data = await response.json();
            loanFormData.users = data.users || data || [];
            
            // Filter out current user
            try {
                const currentUserResponse = await fetch('/api/v1/users/me', {
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
                });
                if (currentUserResponse.ok) {
                    const currentUser = await currentUserResponse.json();
                    loanFormData.users = loanFormData.users.filter(user => user.id !== currentUser.id);
                }
            } catch (e) {
                console.warn('Could not get current user info:', e);
            }
            
            populateResponsibleSelectForLoan();
        } else {
            console.error('Failed to load users');
        }
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

// Load user's inventories (owner or signatory) for USER role
async function loadUserInventoriesForLoan() {
    try {
        const token = localStorage.getItem('jwt');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        // Load both owner and signatory inventories
        const [ownedResponse, signatoryResponse] = await Promise.all([
            fetch('/api/v1/users/me/inventories/owner', { headers }),
            fetch('/api/v1/users/me/inventories/signatory', { headers })
        ]);

        let ownedInventories = [];
        let signatoryInventories = [];

        if (ownedResponse.ok) {
            ownedInventories = await ownedResponse.json();
        }
        if (signatoryResponse.ok) {
            signatoryInventories = await signatoryResponse.json();
        }

        // Combine and remove duplicates
        const allInventoriesMap = new Map();
        [...ownedInventories, ...signatoryInventories].forEach(inv => {
            if (inv && inv.id) {
                allInventoriesMap.set(inv.id, inv);
            }
        });

        loanFormData.inventories = Array.from(allInventoriesMap.values());
        populateInventorySelectForLoan();
    } catch (error) {
        console.error('Error loading user inventories:', error);
        loanFormData.inventories = [];
        populateInventorySelectForLoan();
    }
}

// Populate regional select
function populateRegionalSelectForLoan() {
    const select = document.getElementById('loanRegionalSelect');
    if (!select) return;

    const options = select.querySelector('.custom-select-options') || select;
    if (select.classList.contains('custom-select')) {
        const optionsContainer = select.querySelector('.custom-select-options');
        if (!optionsContainer) return;
        
        optionsContainer.innerHTML = '';
        
        loanFormData.regionals.forEach(regional => {
            const option = document.createElement('div');
            option.className = 'custom-select-option';
            option.setAttribute('data-value', regional.id);
            option.textContent = regional.name;
            option.onclick = async () => {
                document.getElementById('loanSelectedRegionalId').value = regional.id;
                document.querySelector('#loanRegionalSelect .custom-select-text').textContent = regional.name;
                document.getElementById('loanRegionalSelect').classList.remove('open');
                loanFormData.selectedRegional = regional.id;
                
                // Reset dependent selects
                loanFormData.selectedInstitution = null;
                loanFormData.selectedInventory = null;
                loanFormData.selectedItem = null;
                document.getElementById('loanSelectedInstitutionId').value = '';
                document.querySelector('#loanInstitutionSelect .custom-select-text').textContent = 'Seleccione una institución';
                document.getElementById('loanSelectedInventoryId').value = '';
                document.querySelector('#loanInventorySelect .custom-select-text').textContent = 'Seleccione un inventario';
                document.getElementById('loanSelectedItemId').value = '';
                document.querySelector('#loanItemSelect .custom-select-text').textContent = 'Seleccione un item';
                
                await loadInstitutionsForLoan(regional.id);
            };
            optionsContainer.appendChild(option);
        });
    }
}

// Populate institution select
function populateInstitutionSelectForLoan() {
    const select = document.getElementById('loanInstitutionSelect');
    if (!select) return;

    const optionsContainer = select.querySelector('.custom-select-options');
    if (!optionsContainer) return;
    
    optionsContainer.innerHTML = '';
    
    loanFormData.institutions.forEach(institution => {
        const option = document.createElement('div');
        option.className = 'custom-select-option';
        option.setAttribute('data-value', institution.id);
        option.textContent = institution.name;
        option.onclick = async () => {
            document.getElementById('loanSelectedInstitutionId').value = institution.id;
            document.querySelector('#loanInstitutionSelect .custom-select-text').textContent = institution.name;
            document.getElementById('loanInstitutionSelect').classList.remove('open');
            loanFormData.selectedInstitution = institution.id;
            
            // Reset dependent selects
            loanFormData.selectedInventory = null;
            loanFormData.selectedItem = null;
            document.getElementById('loanSelectedInventoryId').value = '';
            document.querySelector('#loanInventorySelect .custom-select-text').textContent = 'Seleccione un inventario';
            document.getElementById('loanSelectedItemId').value = '';
            document.querySelector('#loanItemSelect .custom-select-text').textContent = 'Seleccione un item';
            
            await loadInventoriesForLoan(loanFormData.selectedRegional, institution.id);
        };
        optionsContainer.appendChild(option);
    });
}

// Populate inventory select
function populateInventorySelectForLoan() {
    const select = document.getElementById('loanInventorySelect');
    if (!select) return;

    const optionsContainer = select.querySelector('.custom-select-options');
    if (!optionsContainer) return;
    
    optionsContainer.innerHTML = '';
    
    if (loanFormData.inventories.length === 0) {
        const noInventoriesOption = document.createElement('div');
        noInventoriesOption.className = 'custom-select-option text-gray-500';
        noInventoriesOption.textContent = 'No hay inventarios disponibles';
        noInventoriesOption.style.cursor = 'not-allowed';
        optionsContainer.appendChild(noInventoriesOption);
        return;
    }
    
    loanFormData.inventories.forEach(inventory => {
        const option = document.createElement('div');
        option.className = 'custom-select-option';
        option.setAttribute('data-value', inventory.id);
        option.textContent = inventory.name;
        option.onclick = async () => {
            document.getElementById('loanSelectedInventoryId').value = inventory.id;
            document.querySelector('#loanInventorySelect .custom-select-text').textContent = inventory.name;
            document.getElementById('loanInventorySelect').classList.remove('open');
            loanFormData.selectedInventory = inventory.id;
            
            // Reset item select
            loanFormData.selectedItem = null;
            document.getElementById('loanSelectedItemId').value = '';
            document.querySelector('#loanItemSelect .custom-select-text').textContent = 'Seleccione un item';
            
            await loadItemsForLoan(inventory.id);
        };
        optionsContainer.appendChild(option);
    });
}

// Populate item select
function populateItemSelectForLoan() {
    const select = document.getElementById('loanItemSelect');
    if (!select) return;

    const optionsContainer = select.querySelector('.custom-select-options');
    if (!optionsContainer) return;
    
    optionsContainer.innerHTML = '';
    
    if (loanFormData.items.length === 0) {
        const noItemsOption = document.createElement('div');
        noItemsOption.className = 'custom-select-option text-gray-500';
        noItemsOption.textContent = 'No hay items disponibles';
        noItemsOption.style.cursor = 'not-allowed';
        optionsContainer.appendChild(noItemsOption);
        return;
    }
    
    loanFormData.items.forEach(item => {
        const option = document.createElement('div');
        option.className = 'custom-select-option';
        option.setAttribute('data-value', item.id);
        const itemText = item.productName || item.name || `Item #${item.id}`;
        const itemCode = item.code || item.licensePlate || '';
        option.textContent = itemCode ? `${itemText} (${itemCode})` : itemText;
        option.onclick = () => {
            document.getElementById('loanSelectedItemId').value = item.id;
            document.querySelector('#loanItemSelect .custom-select-text').textContent = itemCode ? `${itemText} (${itemCode})` : itemText;
            document.getElementById('loanItemSelect').classList.remove('open');
            loanFormData.selectedItem = item.id;
        };
        optionsContainer.appendChild(option);
    });
}

// Populate responsible select
function populateResponsibleSelectForLoan() {
    const select = document.getElementById('loanResponsibleSelect');
    if (!select) return;

    const optionsContainer = select.querySelector('.custom-select-options');
    if (!optionsContainer) return;
    
    optionsContainer.innerHTML = '';
    
    if (loanFormData.users.length === 0) {
        const noUsersOption = document.createElement('div');
        noUsersOption.className = 'custom-select-option text-gray-500';
        noUsersOption.textContent = 'No hay usuarios disponibles';
        noUsersOption.style.cursor = 'not-allowed';
        optionsContainer.appendChild(noUsersOption);
        return;
    }
    
    loanFormData.users.forEach(user => {
        const option = document.createElement('div');
        option.className = 'custom-select-option';
        option.setAttribute('data-value', user.id);
        const userName = user.fullName || `${user.name || ''} ${user.lastName || ''}`.trim() || user.email || `Usuario #${user.id}`;
        option.textContent = userName;
        option.onclick = () => {
            document.getElementById('loanSelectedResponsibleId').value = user.id;
            document.querySelector('#loanResponsibleSelect .custom-select-text').textContent = userName;
            document.getElementById('loanResponsibleSelect').classList.remove('open');
            loanFormData.selectedResponsible = user.id;
        };
        optionsContainer.appendChild(option);
    });
}

// Handle lending an item
async function handleLendItem() {
    const itemId = document.getElementById('loanSelectedItemId').value;
    const responsibleId = document.getElementById('loanSelectedResponsibleId').value;
    const details = document.getElementById('loanDetails').value || '';

    // Validation
    if (!itemId) {
        if (window.showErrorToast) {
            window.showErrorToast('Error', 'Por favor seleccione un item');
        }
        return;
    }

    if (!responsibleId) {
        if (window.showErrorToast) {
            window.showErrorToast('Error', 'Por favor seleccione un responsable');
        }
        return;
    }

    try {
        const token = localStorage.getItem('jwt');
        if (!token) {
            if (window.showErrorToast) {
                window.showErrorToast('Error', 'No hay sesión activa');
            }
            return;
        }

        const response = await fetch('/api/v1/loan/lend', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                itemId: parseInt(itemId),
                responsibleId: parseInt(responsibleId),
                details: details
            })
        });

        if (response.ok) {
            const result = await response.json();
            
            // For USER role: check and remove duplicate loans after successful creation
            const isUserRole = window.loansData && window.loansData.userRole === 'USER';
            if (isUserRole) {
                await checkAndRemoveDuplicateLoansForUser(parseInt(itemId));
            }
            
            if (window.showSuccessToast) {
                window.showSuccessToast('Éxito', result.message || 'Item prestado exitosamente');
            }
            
            // Reset form
            resetLoanForm();
            
            // Close modal
            closeLendItemModal();
            
            // For USER role: reload page to avoid duplicates
            if (isUserRole) {
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            } else {
                // For other roles: reload loans data normally
                if (typeof loadLoansData === 'function') {
                    loadLoansData();
                }
            }
        } else {
            let errorMessage = 'Error al prestar el item';
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorData.detail || errorData.error || errorMessage;
            } catch (e) {
                const errorText = await response.text();
                errorMessage = errorText || errorMessage;
            }
            if (window.showErrorToast) {
                window.showErrorToast('Error', errorMessage);
            }
        }
    } catch (error) {
        console.error('Error lending item:', error);
        if (window.showErrorToast) {
            window.showErrorToast('Error', 'Error al prestar el item: ' + error.message);
        }
    }
}

// Handle returning an item
async function handleReturnItem(loanId) {
    const detailsReturn = document.getElementById('returnDetails').value || '';

    try {
        const token = localStorage.getItem('jwt');
        if (!token) {
            if (window.showErrorToast) {
                window.showErrorToast('Error', 'No hay sesión activa');
            }
            return;
        }

        const response = await fetch('/api/v1/loan/return', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                loanId: parseInt(loanId),
                detailsReturn: detailsReturn
            })
        });

        if (response.ok) {
            const result = await response.json();
            if (window.showSuccessToast) {
                window.showSuccessToast('Éxito', result.message || 'Item devuelto exitosamente');
            }
            
            // Close modal
            closeReturnItemModal();
            
            // Reload loans data
            if (typeof loadLoansData === 'function') {
                loadLoansData();
            }
        } else {
            let errorMessage = 'Error al devolver el item';
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorData.detail || errorData.error || errorMessage;
            } catch (e) {
                const errorText = await response.text();
                errorMessage = errorText || errorMessage;
            }
            if (window.showErrorToast) {
                window.showErrorToast('Error', errorMessage);
            }
        }
    } catch (error) {
        console.error('Error returning item:', error);
        if (window.showErrorToast) {
            window.showErrorToast('Error', 'Error al devolver el item: ' + error.message);
        }
    }
}

// Reset loan form
function resetLoanForm() {
    loanFormData.selectedRegional = null;
    loanFormData.selectedInstitution = null;
    loanFormData.selectedInventory = null;
    loanFormData.selectedItem = null;
    loanFormData.selectedResponsible = null;
    
    document.getElementById('loanSelectedRegionalId').value = '';
    document.querySelector('#loanRegionalSelect .custom-select-text').textContent = 'Seleccione una regional';
    document.getElementById('loanSelectedInstitutionId').value = '';
    document.querySelector('#loanInstitutionSelect .custom-select-text').textContent = 'Seleccione una institución';
    document.getElementById('loanSelectedInventoryId').value = '';
    document.querySelector('#loanInventorySelect .custom-select-text').textContent = 'Seleccione un inventario';
    document.getElementById('loanSelectedItemId').value = '';
    document.querySelector('#loanItemSelect .custom-select-text').textContent = 'Seleccione un item';
    document.getElementById('loanSelectedResponsibleId').value = '';
    document.querySelector('#loanResponsibleSelect .custom-select-text').textContent = 'Seleccione un responsable';
    document.getElementById('loanDetails').value = '';
}

// Open lend item modal
async function openLendItemModal() {
    const modal = document.getElementById('lendItemModal');
    if (!modal) return;

    // Check if user is USER role
    const isUserRole = window.loansData && window.loansData.userRole === 'USER';
    
    // Show/hide fields based on role
    const regionalContainer = document.getElementById('loanRegionalContainer');
    const institutionContainer = document.getElementById('loanInstitutionContainer');
    
    if (isUserRole) {
        // Hide Regional and Institution fields for USER role
        if (regionalContainer) regionalContainer.style.display = 'none';
        if (institutionContainer) institutionContainer.style.display = 'none';
    } else {
        // Show Regional and Institution fields for other roles
        if (regionalContainer) regionalContainer.style.display = 'block';
        if (institutionContainer) institutionContainer.style.display = 'block';
    }

    modal.classList.remove('hidden');
    resetLoanForm();
    
    if (isUserRole) {
        // For USER role: load user inventories and users from institution
        await loadUserInventoriesForLoan();
        await loadUsersForLoan();
    } else {
        // For other roles: use normal flow
        await initializeLoanForm();
    }
    
    // Initialize selects if not already done
    setTimeout(() => {
        initializeLoanSelects();
    }, 100);
}

// Close lend item modal
function closeLendItemModal() {
    const modal = document.getElementById('lendItemModal');
    if (modal) {
        modal.classList.add('hidden');
        resetLoanForm();
        
        // Restore visibility of Regional and Institution fields (in case they were hidden for USER role)
        const regionalContainer = document.getElementById('loanRegionalContainer');
        const institutionContainer = document.getElementById('loanInstitutionContainer');
        if (regionalContainer) regionalContainer.style.display = 'block';
        if (institutionContainer) institutionContainer.style.display = 'block';
    }
}

// Open return item modal
function openReturnItemModal(loanId) {
    const modal = document.getElementById('returnItemModal');
    if (modal) {
        modal.classList.remove('hidden');
        document.getElementById('returnLoanId').value = loanId;
        document.getElementById('returnDetails').value = '';
    }
}

// Close return item modal
function closeReturnItemModal() {
    const modal = document.getElementById('returnItemModal');
    if (modal) {
        modal.classList.add('hidden');
        document.getElementById('returnLoanId').value = '';
        document.getElementById('returnDetails').value = '';
    }
}

// Handle return item button click
function handleReturnItemClick(loanId) {
    openReturnItemModal(loanId);
}

// Submit return item
function submitReturnItem() {
    const loanId = document.getElementById('returnLoanId').value;
    if (!loanId) {
        if (window.showErrorToast) {
            window.showErrorToast('Error', 'ID de préstamo no válido');
        }
        return;
    }
    handleReturnItem(loanId);
}

// Initialize custom selects for loan form
function initializeLoanSelects() {
    // Regional select
    const regionalSelect = document.getElementById('loanRegionalSelect');
    if (regionalSelect) {
        const trigger = regionalSelect.querySelector('.custom-select-trigger');
        if (trigger) {
            trigger.onclick = () => {
                regionalSelect.classList.toggle('open');
            };
        }
        // Search functionality
        const searchInput = regionalSelect.querySelector('.custom-select-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                filterSelectOptions(regionalSelect, e.target.value);
            });
        }
    }

    // Institution select
    const institutionSelect = document.getElementById('loanInstitutionSelect');
    if (institutionSelect) {
        const trigger = institutionSelect.querySelector('.custom-select-trigger');
        if (trigger) {
            trigger.onclick = () => {
                institutionSelect.classList.toggle('open');
            };
        }
        // Search functionality
        const searchInput = institutionSelect.querySelector('.custom-select-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                filterSelectOptions(institutionSelect, e.target.value);
            });
        }
    }

    // Inventory select
    const inventorySelect = document.getElementById('loanInventorySelect');
    if (inventorySelect) {
        const trigger = inventorySelect.querySelector('.custom-select-trigger');
        if (trigger) {
            trigger.onclick = () => {
                inventorySelect.classList.toggle('open');
            };
        }
        // Search functionality
        const searchInput = inventorySelect.querySelector('.custom-select-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                filterSelectOptions(inventorySelect, e.target.value);
            });
        }
    }

    // Item select
    const itemSelect = document.getElementById('loanItemSelect');
    if (itemSelect) {
        const trigger = itemSelect.querySelector('.custom-select-trigger');
        if (trigger) {
            trigger.onclick = () => {
                itemSelect.classList.toggle('open');
            };
        }
        // Search functionality
        const searchInput = itemSelect.querySelector('.custom-select-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                filterSelectOptions(itemSelect, e.target.value);
            });
        }
    }

    // Responsible select
    const responsibleSelect = document.getElementById('loanResponsibleSelect');
    if (responsibleSelect) {
        const trigger = responsibleSelect.querySelector('.custom-select-trigger');
        if (trigger) {
            trigger.onclick = () => {
                responsibleSelect.classList.toggle('open');
            };
        }
        // Search functionality
        const searchInput = responsibleSelect.querySelector('.custom-select-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                filterSelectOptions(responsibleSelect, e.target.value);
            });
        }
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

// Filter select options based on search term
function filterSelectOptions(selectElement, searchTerm) {
    const optionsContainer = selectElement.querySelector('.custom-select-options');
    if (!optionsContainer) return;

    const options = optionsContainer.querySelectorAll('.custom-select-option');
    const searchLower = searchTerm.toLowerCase();

    options.forEach(option => {
        const text = option.textContent.toLowerCase();
        if (text.includes(searchLower)) {
            option.style.display = '';
        } else {
            option.style.display = 'none';
        }
    });
}

// Check and remove duplicate loans for USER role only
async function checkAndRemoveDuplicateLoansForUser(itemId) {
    try {
        const token = localStorage.getItem('jwt');
        if (!token) return;

        // Get all loans for this item
        const response = await fetch(`/api/v1/loan/item/${itemId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            console.warn('No se pudieron obtener los préstamos para verificar duplicados');
            return;
        }

        const loans = await response.json();
        
        // Check if there are at least 2 loans
        if (loans.length < 2) {
            return; // No duplicates possible
        }

        // Get the last 2 loans (most recent first - they should be sorted by creation date)
        // Sort by lendAt descending to get most recent first
        const sortedLoans = [...loans].sort((a, b) => {
            const dateA = a.lendAt ? new Date(a.lendAt).getTime() : 0;
            const dateB = b.lendAt ? new Date(b.lendAt).getTime() : 0;
            return dateB - dateA;
        });

        const lastLoan = sortedLoans[0];
        const secondLastLoan = sortedLoans[1];

        // Check if they are duplicates
        // Compare: itemId, responsibleId, detailsLend, and returned status
        const areDuplicates = 
            lastLoan.itemId === secondLastLoan.itemId &&
            lastLoan.responsibleId === secondLastLoan.responsibleId &&
            (lastLoan.detailsLend || '') === (secondLastLoan.detailsLend || '') &&
            lastLoan.returned === secondLastLoan.returned;

        if (areDuplicates) {
            // Check if they were created very close in time (within 5 seconds)
            const lastLoanDate = lastLoan.lendAt ? new Date(lastLoan.lendAt) : null;
            const secondLastLoanDate = secondLastLoan.lendAt ? new Date(secondLastLoan.lendAt) : null;
            
            if (lastLoanDate && secondLastLoanDate) {
                const timeDiff = Math.abs(lastLoanDate.getTime() - secondLastLoanDate.getTime());
                const fiveSeconds = 5 * 1000; // 5 seconds in milliseconds
                
                if (timeDiff <= fiveSeconds) {
                    // They are duplicates created within 5 seconds - delete the second one (older)
                    console.log('Duplicado detectado, eliminando préstamo ID:', secondLastLoan.id);
                    
                    const deleteResponse = await fetch(`/api/v1/loan/${secondLastLoan.id}`, {
                        method: 'DELETE',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });

                    if (deleteResponse.ok) {
                        console.log('Préstamo duplicado eliminado exitosamente');
                    } else {
                        console.warn('No se pudo eliminar el préstamo duplicado');
                    }
                }
            }
        }
    } catch (error) {
        console.error('Error verificando duplicados:', error);
        // Don't throw error, just log it
    }
}

// Export functions
window.initializeLoanForm = initializeLoanForm;
window.handleLendItem = handleLendItem;
window.handleReturnItem = handleReturnItem;
window.openLendItemModal = openLendItemModal;
window.closeLendItemModal = closeLendItemModal;
window.openReturnItemModal = openReturnItemModal;
window.closeReturnItemModal = closeReturnItemModal;
window.handleReturnItemClick = handleReturnItemClick;
window.submitReturnItem = submitReturnItem;
window.initializeLoanSelects = initializeLoanSelects;
window.checkAndRemoveDuplicateLoansForUser = checkAndRemoveDuplicateLoansForUser;

