// Load loans data
async function loadLoansData() {
    if (loansData.isLoading) return;

    loansData.isLoading = true;
    showLoadingState();

    try {
        await loadCurrentUserInfo();
        await loadRegionals();
        await loadInventories('all', 'all');
        await loadLoans();
        updateLoansUI();

    } catch (error) {
        console.error('Error loading loans data:', error);
        showErrorState('Error al cargar los datos de préstamos: ' + error.message);
        updateLoansUI();
    } finally {
        loansData.isLoading = false;
        hideLoadingState();
    }
}

async function loadCurrentUserInfo() {
    try {
        const token = localStorage.getItem('jwt');
        if (!token) {
            throw new Error('No authentication token found');
        }

        const response = await fetch('/api/v1/users/me', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const userData = await response.json();
            updateUserInfoDisplay(userData);
        } else {
            throw new Error('Failed to load user info');
        }
    } catch (error) {
        console.error('Error loading current user info:', error);
        updateUserInfoDisplay({
            fullName: 'Super Admin',
            role: 'SUPERADMIN',
            email: 'admin@sena.edu.co'
        });
    }
}

async function loadRegionals() {
    try {
        const token = localStorage.getItem('jwt');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch('/api/v1/regional', {
            method: 'GET',
            headers: headers
        });

        if (response.ok) {
            loansData.regionals = await response.json();
            populateRegionalSelect();
        } else {
            console.error('Failed to load regionals');
        }
    } catch (error) {
        console.error('Error loading regionals:', error);
    }
}

async function loadInstitutions(regionalId) {
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
            loansData.institutions = await response.json();
            populateInstitutionSelect();
        } else {
            console.error('Failed to load institutions');
        }
    } catch (error) {
        console.error('Error loading institutions:', error);
    }
}

async function loadInventories(regionalId, institutionId) {
    try {
        const token = localStorage.getItem('jwt');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        let endpoint = '/api/v1/inventory?page=0&size=1000';
        if (regionalId && regionalId !== 'all' && institutionId && institutionId !== 'all') {
            endpoint = `/api/v1/inventory/regional/${regionalId}/institution/${institutionId}?page=0&size=1000`;
        } else if (regionalId && regionalId !== 'all') {
            // Need to get all institutions for regional first, then get inventories
            await loadInstitutions(regionalId);
            const institutionIds = loansData.institutions.map(i => i.id);
            // For now, load all and filter client-side
            endpoint = '/api/v1/inventory?page=0&size=1000';
        } else if (institutionId && institutionId !== 'all') {
            endpoint = `/api/v1/inventory/institution/${institutionId}?page=0&size=1000`;
        }

        const response = await fetch(endpoint, {
            method: 'GET',
            headers: headers
        });

        if (response.ok) {
            const data = await response.json();
            loansData.inventories = data.content || data || [];
            populateInventorySelect();
        } else {
            console.error('Failed to load inventories');
        }
    } catch (error) {
        console.error('Error loading inventories:', error);
    }
}

async function loadLoans() {
    try {
        const token = localStorage.getItem('jwt');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const params = new URLSearchParams();
        if (loansData.selectedRegional && loansData.selectedRegional !== 'all') {
            params.append('regionalId', loansData.selectedRegional);
        }
        if (loansData.selectedInstitution && loansData.selectedInstitution !== 'all') {
            params.append('institutionId', loansData.selectedInstitution);
        }
        if (loansData.selectedInventory && loansData.selectedInventory !== 'all') {
            params.append('inventoryId', loansData.selectedInventory);
        }

        const endpoint = `/api/v1/loan/filter?${params.toString()}`;
        const response = await fetch(endpoint, {
            method: 'GET',
            headers: headers
        });

        if (response.ok) {
            loansData.loans = await response.json();
            filterLoans();
        } else {
            throw new Error('Failed to load loans');
        }
    } catch (error) {
        console.error('Error loading loans:', error);
        throw error;
    }
}

function populateRegionalSelect() {
    const options = document.getElementById('regionalOptions');
    if (!options) return;

    options.innerHTML = '';
    
    // Add "All" option
    const allOption = document.createElement('div');
    allOption.className = 'custom-select-option';
    allOption.setAttribute('data-value', 'all');
    allOption.textContent = 'Todas las regionales';
    allOption.onclick = async () => {
        document.getElementById('selectedRegionalId').value = 'all';
        document.querySelector('#regionalSelect .custom-select-text').textContent = 'Todas las regionales';
        document.getElementById('regionalSelect').classList.remove('open');
        loansData.selectedRegional = 'all';
        loansData.selectedInstitution = 'all';
        loansData.selectedInventory = 'all';
        document.getElementById('selectedInstitutionId').value = 'all';
        document.querySelector('#institutionSelect .custom-select-text').textContent = 'Todas las instituciones';
        document.getElementById('selectedInventoryId').value = 'all';
        document.querySelector('#inventorySelect .custom-select-text').textContent = 'Todos los inventarios';
        await loadInventories('all', 'all');
        await loadLoans();
    };
    options.appendChild(allOption);
    
    loansData.regionals.forEach(regional => {
        const option = document.createElement('div');
        option.className = 'custom-select-option';
        option.setAttribute('data-value', regional.id);
        option.textContent = regional.name;
        option.onclick = async () => {
            document.getElementById('selectedRegionalId').value = regional.id;
            document.querySelector('#regionalSelect .custom-select-text').textContent = regional.name;
            document.getElementById('regionalSelect').classList.remove('open');
            await setRegionalFilter(regional.id);
        };
        options.appendChild(option);
    });
}

function populateInstitutionSelect() {
    const options = document.getElementById('institutionOptions');
    if (!options) return;

    options.innerHTML = '';
    
    // Add "All" option
    const allOption = document.createElement('div');
    allOption.className = 'custom-select-option';
    allOption.setAttribute('data-value', 'all');
    allOption.textContent = 'Todas las instituciones';
    allOption.onclick = async () => {
        document.getElementById('selectedInstitutionId').value = 'all';
        document.querySelector('#institutionSelect .custom-select-text').textContent = 'Todas las instituciones';
        document.getElementById('institutionSelect').classList.remove('open');
        loansData.selectedInstitution = 'all';
        loansData.selectedInventory = 'all';
        document.getElementById('selectedInventoryId').value = 'all';
        document.querySelector('#inventorySelect .custom-select-text').textContent = 'Todos los inventarios';
        await loadInventories(loansData.selectedRegional, 'all');
        await loadLoans();
    };
    options.appendChild(allOption);
    
    loansData.institutions.forEach(institution => {
        const option = document.createElement('div');
        option.className = 'custom-select-option';
        option.setAttribute('data-value', institution.id);
        option.textContent = institution.name;
        option.onclick = async () => {
            document.getElementById('selectedInstitutionId').value = institution.id;
            document.querySelector('#institutionSelect .custom-select-text').textContent = institution.name;
            document.getElementById('institutionSelect').classList.remove('open');
            await setInstitutionFilter(institution.id);
        };
        options.appendChild(option);
    });
}

function populateInventorySelect() {
    const options = document.getElementById('inventoryOptions');
    if (!options) return;

    options.innerHTML = '';
    
    // Add "All" option
    const allOption = document.createElement('div');
    allOption.className = 'custom-select-option';
    allOption.setAttribute('data-value', 'all');
    allOption.textContent = 'Todos los inventarios';
    allOption.onclick = async () => {
        document.getElementById('selectedInventoryId').value = 'all';
        document.querySelector('#inventorySelect .custom-select-text').textContent = 'Todos los inventarios';
        document.getElementById('inventorySelect').classList.remove('open');
        loansData.selectedInventory = 'all';
        await loadLoans();
    };
    options.appendChild(allOption);
    
    loansData.inventories.forEach(inventory => {
        const option = document.createElement('div');
        option.className = 'custom-select-option';
        option.setAttribute('data-value', inventory.id);
        option.textContent = inventory.name;
        option.onclick = async () => {
            document.getElementById('selectedInventoryId').value = inventory.id;
            document.querySelector('#inventorySelect .custom-select-text').textContent = inventory.name;
            document.getElementById('inventorySelect').classList.remove('open');
            await setInventoryFilter(inventory.id);
        };
        options.appendChild(option);
    });
}

function showLoadingState() {
    const refreshIcon = document.getElementById('refreshIcon');
    const refreshText = document.getElementById('refreshText');

    if (refreshIcon) refreshIcon.classList.add('animate-spin');
    if (refreshText) refreshText.textContent = 'Cargando...';
}

function hideLoadingState() {
    const refreshIcon = document.getElementById('refreshIcon');
    const refreshText = document.getElementById('refreshText');

    if (refreshIcon) refreshIcon.classList.remove('animate-spin');
    if (refreshText) refreshText.textContent = 'Actualizar';
}

function showErrorState(message) {
    if (window.showErrorToast) {
        window.showErrorToast('Error', message);
    }
}

function updateUserInfoDisplay(userData) {
    const headerUserName = document.getElementById('headerUserName');
    const headerUserRole = document.getElementById('headerUserRole');
    const headerUserAvatar = document.getElementById('headerUserAvatar');

    if (headerUserName) {
        headerUserName.textContent = userData.fullName || 'Usuario';
    }

    if (headerUserRole) {
        const roleNames = {
            'SUPERADMIN': 'Super Administrador',
            'ADMIN_REGIONAL': 'Administrador Regional',
            'ADMIN_INSTITUTION': 'Administrador de Institución',
            'WAREHOUSE': 'Almacén',
            'USER': 'Usuario'
        };
        headerUserRole.textContent = roleNames[userData.role] || userData.role || 'Usuario';
    }

    if (headerUserAvatar && userData.profileImageUrl) {
        headerUserAvatar.innerHTML = `<img src="${userData.profileImageUrl}" alt="Avatar">`;
    } else if (headerUserAvatar) {
        const initials = (userData.fullName || 'U').split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
        headerUserAvatar.textContent = initials;
        headerUserAvatar.style.backgroundColor = '#00AF00';
        headerUserAvatar.style.color = 'white';
    }
}

window.loadLoansData = loadLoansData;
window.loadLoans = loadLoans;
window.loadRegionals = loadRegionals;
window.loadInstitutions = loadInstitutions;
window.loadInventories = loadInventories;

