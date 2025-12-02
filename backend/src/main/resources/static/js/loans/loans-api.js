// Load loans data
async function loadLoansData() {
    if (loansData.isLoading) {
        return;
    }

    loansData.isLoading = true;
    showLoadingState();

    try {
        await loadCurrentUserInfo();
        
        // For USER role and ADMIN_INSTITUTION, skip regionals and institutions filters
        if (loansData.userRole !== 'USER' && loansData.userRole !== 'ADMIN_INSTITUTION') {
            await loadRegionals();
        }
        
        await loadInventories('all', 'all');
        await loadLoans();
        
        // Update UI for user role after loading everything
        if (loansData.userRole === 'USER' || loansData.userRole === 'ADMIN_INSTITUTION') {
            updateLoansUIForUserRole();
        }
        
        // loadLoans() will call filterLoans() which updates the UI
        // But ensure UI is updated as a fallback
        setTimeout(() => {
            if (typeof updateLoansUI === 'function') {
                updateLoansUI();
            }
            // Also update UI for user role and admin_institution
            if (loansData.userRole === 'USER' || loansData.userRole === 'ADMIN_INSTITUTION') {
                updateLoansUIForUserRole();
            }
        }, 200);
    } catch (error) {
        console.error('Error loading loans data:', error);
        showErrorState('Error al cargar los datos de préstamos: ' + error.message);
        // Initialize empty arrays if load fails
        loansData.loans = [];
        loansData.filteredLoans = [];
        if (typeof updateLoansUI === 'function') {
            updateLoansUI();
        }
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
            loansData.userRole = userData.role;
            
            // For USER role, check if user can create loans (owner or signatory)
            if (userData.role === 'USER') {
                await checkUserLoanPermissions();
            } else {
                loansData.canCreateLoans = true; // Other roles can create loans
            }
            
            updateUserInfoDisplay(userData);
            
            // Update UI immediately after loading user info
            setTimeout(() => {
                if (loansData.userRole === 'USER' || loansData.userRole === 'ADMIN_INSTITUTION') {
                    updateLoansUIForUserRole();
                }
            }, 100);
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
        loansData.userRole = 'SUPERADMIN';
        loansData.canCreateLoans = true;
    }
}

// Check if USER role can create loans (must be owner or signatory of at least one inventory)
async function checkUserLoanPermissions() {
    try {
        const token = localStorage.getItem('jwt');
        if (!token) return;

        const [ownedResponse, signatoryResponse] = await Promise.all([
            fetch('/api/v1/users/me/inventories/owner', {
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
            }),
            fetch('/api/v1/users/me/inventories/signatory', {
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
            })
        ]);

        let ownedInventories = [];
        let signatoryInventories = [];

        if (ownedResponse.ok) {
            ownedInventories = await ownedResponse.json();
        }
        if (signatoryResponse.ok) {
            signatoryInventories = await signatoryResponse.json();
        }

        // User can create loans if they are owner or signatory of at least one inventory
        loansData.canCreateLoans = ownedInventories.length > 0 || signatoryInventories.length > 0;
    } catch (error) {
        console.error('Error checking loan permissions:', error);
        loansData.canCreateLoans = false;
    }
}

// Update UI based on user role and permissions
function updateLoansUIForUserRole() {
    // Only proceed if we have user role information
    if (!loansData.userRole) {
        console.log('User role not yet loaded, skipping UI update');
        return;
    }

    const headerSection = document.querySelector('main .flex.flex-col.sm\\:flex-row');
    if (!headerSection) {
        console.log('Header section not found, retrying...');
        setTimeout(updateLoansUIForUserRole, 200);
        return;
    }

    // Update page title and subtitle for USER role
    const pageTitle = document.getElementById('loansPageTitle');
    const pageSubtitle = document.getElementById('loansPageSubtitle');
    if (loansData.userRole === 'USER') {
        if (pageTitle) {
            pageTitle.textContent = 'Mis Préstamos';
        }
        if (pageSubtitle) {
            pageSubtitle.textContent = 'Gestiona tus préstamos activos y revisa tu historial';
        }
    } else {
        if (pageTitle) {
            pageTitle.textContent = 'Gestión de Préstamos';
        }
        if (pageSubtitle) {
            pageSubtitle.textContent = 'Control y administración de préstamos de items';
        }
    }

    // Remove existing permission banner if any
    const existingBanner = document.getElementById('loanPermissionBanner');
    if (existingBanner) {
        existingBanner.remove();
    }

    // Hide/show filters for USER role and ADMIN_INSTITUTION
    const regionalFilter = document.getElementById('regionalFilterContainer');
    const institutionFilter = document.getElementById('institutionFilterContainer');
    const filtersContainer = document.getElementById('filtersContainer');
    const filtersSection = document.getElementById('filtersSection');
    
    const isAdminInstitution = loansData.userRole === 'ADMIN_INSTITUTION';
    const isUserRole = loansData.userRole === 'USER';
    
    if (isUserRole) {
        // Hide regional and institution filters for USER role
        if (regionalFilter) {
            regionalFilter.style.display = 'none';
            regionalFilter.classList.add('hidden');
        }
        if (institutionFilter) {
            institutionFilter.style.display = 'none';
            institutionFilter.classList.add('hidden');
        }
        if (filtersContainer) {
            filtersContainer.className = 'grid grid-cols-1 gap-4';
        }
        // Hide filters section entirely for USER role
        if (filtersSection) {
            filtersSection.style.display = 'none';
        }
    } else if (isAdminInstitution) {
        // Hide regional and institution filters for ADMIN_INSTITUTION role
        if (regionalFilter) {
            regionalFilter.style.display = 'none';
            regionalFilter.classList.add('hidden');
        }
        if (institutionFilter) {
            institutionFilter.style.display = 'none';
            institutionFilter.classList.add('hidden');
        }
        if (filtersContainer) {
            filtersContainer.className = 'grid grid-cols-1 gap-4';
        }
        // Show filters section but only with inventory filter
        if (filtersSection) {
            filtersSection.style.display = 'block';
        }
    } else {
        // Show all filters for other roles
        if (regionalFilter) {
            regionalFilter.style.display = 'block';
            regionalFilter.classList.remove('hidden');
        }
        if (institutionFilter) {
            institutionFilter.style.display = 'block';
            institutionFilter.classList.remove('hidden');
        }
        if (filtersContainer) {
            filtersContainer.className = 'grid grid-cols-1 md:grid-cols-3 gap-4';
        }
        if (filtersSection) {
            filtersSection.style.display = 'block';
        }
    }

    // For USER role, add button to create loans if they have permissions
    if (loansData.userRole === 'USER' && loansData.canCreateLoans) {
        // Add "Nuevo Préstamo" button next to refresh button
        const headerButtons = headerSection.querySelector('.btn-update')?.parentElement;
        if (headerButtons) {
            // Remove existing button if any
            const existingBtn = document.getElementById('newLoanButton');
            if (existingBtn) {
                existingBtn.remove();
            }
            
            // Create new button
            const newLoanBtn = document.createElement('button');
            newLoanBtn.id = 'newLoanButton';
            newLoanBtn.onclick = function() { showNewLoanModal(); };
            newLoanBtn.className = 'bg-sena-verde hover:bg-sena-verde-oscuro text-white font-semibold py-2 px-4 rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2';
            newLoanBtn.innerHTML = '<i class="fas fa-hand-holding"></i><span>Nuevo Préstamo</span>';
            headerButtons.insertBefore(newLoanBtn, headerButtons.querySelector('.btn-update'));
        }
    } else if (loansData.userRole === 'USER' && !loansData.canCreateLoans) {
        // Remove button if it exists and user doesn't have permissions
        const newLoanBtn = document.getElementById('newLoanButton');
        if (newLoanBtn) {
            newLoanBtn.remove();
        }
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

        // Check if current user is USER role or ADMIN_INSTITUTION - if so, only load inventories accordingly
        // Use stored role if available, otherwise fetch
        let userInfo = null;
        let isUserRole = false;
        let isAdminInstitution = false;
        
        if (loansData.userRole) {
            isUserRole = loansData.userRole === 'USER';
            isAdminInstitution = loansData.userRole === 'ADMIN_INSTITUTION';
        } else {
            userInfo = await getCurrentUserInfo();
            isUserRole = userInfo && userInfo.role === 'USER';
            isAdminInstitution = userInfo && userInfo.role === 'ADMIN_INSTITUTION';
            if (userInfo) {
                loansData.userRole = userInfo.role;
            }
        }

        if (isUserRole) {
            // For USER role, load only inventories where user is owner or signatory
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

            // Combine and deduplicate
            const inventoryMap = new Map();
            [...ownedInventories, ...signatoryInventories].forEach(inv => {
                if (!inventoryMap.has(inv.id)) {
                    inventoryMap.set(inv.id, inv);
                }
            });

            loansData.inventories = Array.from(inventoryMap.values());
            loansData.userInventoriesWithPermission = loansData.inventories.map(inv => inv.id);
            populateInventorySelect();
            return;
        }
        
        if (isAdminInstitution) {
            // For ADMIN_INSTITUTION role, load only inventories from their institution
            const response = await fetch('/api/v1/inventory/institutionAdminInventories?page=0&size=1000', {
                method: 'GET',
                headers: headers
            });

            if (response.ok) {
                const data = await response.json();
                loansData.inventories = data.content || data || [];
                populateInventorySelect();
            } else {
                console.error('Failed to load inventories for institution');
                loansData.inventories = [];
            }
            return;
        }

        // For other roles, use the original logic
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

// Helper function to get current user info
async function getCurrentUserInfo() {
    try {
        const token = localStorage.getItem('jwt');
        if (!token) return null;

        const response = await fetch('/api/v1/users/me', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            return await response.json();
        }
        return null;
    } catch (error) {
        console.error('Error getting user info:', error);
        return null;
    }
}

async function loadLoans() {
    try {
        const token = localStorage.getItem('jwt');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        // Check if current user is USER role or ADMIN_INSTITUTION
        const userInfo = await getCurrentUserInfo();
        const isUserRole = userInfo && userInfo.role === 'USER';
        const isAdminInstitution = (userInfo && userInfo.role === 'ADMIN_INSTITUTION') || 
                                   (loansData.userRole === 'ADMIN_INSTITUTION');

        // For USER role, load only their loans (both received and made)
        if (isUserRole) {
            console.log('Loading user loans from /api/v1/users/me/loans');
            
            // Load loans where user is responsible (received loans)
            const receivedResponse = await fetch('/api/v1/users/me/loans', {
                method: 'GET',
                headers: headers
            });

            // Load loans where user is lender (loans made)
            const madeResponse = await fetch('/api/v1/users/me/loans-made', {
                method: 'GET',
                headers: headers
            });

            if (receivedResponse.ok) {
                let loans = await receivedResponse.json();
                loans = Array.isArray(loans) ? loans : [];
                
                loansData.loans = loans;
                console.log('Loaded user loans (received):', loansData.loans.length, loans);
                
                // Always initialize filteredLoans with all loans first
                loansData.filteredLoans = [...loansData.loans];
                console.log('Initialized filteredLoans:', loansData.filteredLoans.length);
            } else {
                console.error('Failed to load user loans:', receivedResponse.status);
                loansData.loans = [];
                loansData.filteredLoans = [];
            }

            if (madeResponse.ok) {
                let loansMade = await madeResponse.json();
                loansMade = Array.isArray(loansMade) ? loansMade : [];
                
                loansData.loansMade = loansMade;
                loansData.filteredLoansMade = [...loansData.loansMade];
                console.log('Loaded user loans (made):', loansData.loansMade.length, loansMade);
            } else {
                console.error('Failed to load loans made:', madeResponse.status);
                loansData.loansMade = [];
                loansData.filteredLoansMade = [];
            }
            
            // Apply filters immediately - filterLoans should be available by now
            if (typeof window.filterLoans === 'function') {
                console.log('Calling filterLoans()');
                window.filterLoans();
            } else {
                console.warn('filterLoans function not available, updating UI directly');
                // Directly update UI components
                if (typeof window.updateLoansUI === 'function') {
                    window.updateLoansUI();
                } else {
                    // Fallback: update each component individually
                    if (typeof window.updateLoansTable === 'function') {
                        window.updateLoansTable();
                    }
                    if (typeof window.updatePagination === 'function') {
                        window.updatePagination();
                    }
                    if (typeof window.updateLoansStats === 'function') {
                        window.updateLoansStats();
                    }
                }
            }
            return;
        }

        // For other roles, use the filter endpoint
        const params = new URLSearchParams();
        
        // For ADMIN_INSTITUTION, automatically filter by their institution
        if (isAdminInstitution && userInfo && userInfo.institution && userInfo.institution.id) {
            params.append('institutionId', userInfo.institution.id);
            console.log('ADMIN_INSTITUTION: filtering loans by institution ID:', userInfo.institution.id);
        } else {
            // For other roles, use the selected filters
            if (loansData.selectedRegional && loansData.selectedRegional !== 'all') {
                params.append('regionalId', loansData.selectedRegional);
            }
            if (loansData.selectedInstitution && loansData.selectedInstitution !== 'all') {
                params.append('institutionId', loansData.selectedInstitution);
            }
        }
        
        // Add inventory filter if selected (but don't override institution filter for admin_institution)
        if (loansData.selectedInventory && loansData.selectedInventory !== 'all') {
            params.append('inventoryId', loansData.selectedInventory);
        }

        let endpoint = '/api/v1/loan/filter';
        const paramsString = params.toString();
        if (paramsString) {
            endpoint += `?${paramsString}`;
        }
        
        const response = await fetch(endpoint, {
            method: 'GET',
            headers: headers
        });

        if (response.ok) {
            let loans = await response.json();
            loans = Array.isArray(loans) ? loans : [];
            
            // For USER role, filter loans to only show those from inventories where user is owner or signatory
            if (isUserRole && loansData.userInventoriesWithPermission) {
                loans = loans.filter(loan => {
                    // Check if loan's inventory is in the allowed list
                    return loan.inventoryId && loansData.userInventoriesWithPermission.includes(loan.inventoryId);
                });
            }
            
            loansData.loans = loans;
            
            // Always initialize filteredLoans with all loans first
            loansData.filteredLoans = [...loansData.loans];
            
            // Apply filters immediately - filterLoans should be available by now
            if (typeof window.filterLoans === 'function') {
                window.filterLoans();
            } else {
                console.warn('filterLoans function not available, updating UI directly');
                // Directly update UI components
                if (typeof window.updateLoansUI === 'function') {
                    window.updateLoansUI();
                } else {
                    // Fallback: update each component individually
                    if (typeof window.updateLoansTable === 'function') {
                        window.updateLoansTable();
                    }
                    if (typeof window.updatePagination === 'function') {
                        window.updatePagination();
                    }
                    if (typeof window.updateLoansStats === 'function') {
                        window.updateLoansStats();
                    }
                }
            }
        } else {
            const errorText = await response.text();
            console.error('Failed to load loans:', response.status, errorText);
            loansData.loans = [];
            loansData.filteredLoans = [];
            throw new Error(`Failed to load loans: ${response.status} - ${errorText}`);
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
            'ADMIN_INSTITUTIONAL': 'Admin Institucional',
            'WAREHOUSE': 'Encargado de Almacén',
            'USER': 'Usuario'
        };
        headerUserRole.textContent = roleNames[userData.role] || userData.role || 'Usuario';
    }

    if (headerUserAvatar) {
        if (userData.imgUrl || userData.profilePhotoUrl || userData.profileImageUrl) {
            const imgUrl = userData.imgUrl || userData.profilePhotoUrl || userData.profileImageUrl;
            
            // Try to use createImageWithSpinner from dashboard.js if available
            if (typeof createImageWithSpinner === 'function') {
                const spinnerHtml = createImageWithSpinner(
                    imgUrl,
                    userData.fullName || 'Usuario',
                    'w-full h-full object-cover',
                    'w-full h-full',
                    'rounded-full'
                );
                if (spinnerHtml) {
                    headerUserAvatar.innerHTML = spinnerHtml;
                } else {
                    const initials = (userData.fullName || 'U').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                    headerUserAvatar.textContent = initials;
                    headerUserAvatar.style.backgroundColor = '#00AF00';
                    headerUserAvatar.style.color = 'white';
                    headerUserAvatar.style.backgroundImage = 'none';
                }
            } else {
                // Fallback: use background image approach
                headerUserAvatar.style.backgroundImage = `url(${imgUrl})`;
                headerUserAvatar.style.backgroundSize = 'cover';
                headerUserAvatar.style.backgroundPosition = 'center';
                headerUserAvatar.textContent = '';
            }
        } else {
            const initials = (userData.fullName || 'U').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
            headerUserAvatar.textContent = initials;
            headerUserAvatar.style.backgroundColor = '#00AF00';
            headerUserAvatar.style.color = 'white';
            headerUserAvatar.style.backgroundImage = 'none';
        }
    }
}

// Show new loan modal
async function showNewLoanModal() {
    const modal = document.getElementById('newLoanModal');
    if (!modal) return;

    // Only show if user has permissions
    if (loansData.userRole === 'USER' && !loansData.canCreateLoans) {
        if (window.showErrorToast) {
            window.showErrorToast('No tienes permisos para crear préstamos. Solo los propietarios y firmantes pueden crear préstamos.');
        } else {
            alert('No tienes permisos para crear préstamos. Solo los propietarios y firmantes pueden crear préstamos.');
        }
        return;
    }

    // Populate inventory select with user's inventories (owner or signatory)
    const inventorySelect = document.getElementById('newLoanInventory');
    if (inventorySelect && loansData.inventories && loansData.inventories.length > 0) {
        inventorySelect.innerHTML = '<option value="">Seleccionar inventario...</option>';
        loansData.inventories.forEach(inventory => {
            const option = document.createElement('option');
            option.value = inventory.id;
            option.textContent = inventory.name || `Inventario #${inventory.id}`;
            inventorySelect.appendChild(option);
        });
    }

    // Load users for responsible selection
    await loadUsersForLoan();

    // Reset form
    const form = document.getElementById('newLoanForm');
    if (form) form.reset();
    
    // Hide item selection
    const itemContainer = document.getElementById('itemSelectionContainer');
    if (itemContainer) itemContainer.style.display = 'none';

    modal.classList.remove('hidden');
}

// Load users for responsible selection
async function loadUsersForLoan() {
    const responsibleSelect = document.getElementById('newLoanResponsibleId');
    const usersLoading = document.getElementById('usersLoading');

    if (!responsibleSelect) return;

    // Show loading
    if (usersLoading) usersLoading.style.display = 'block';
    responsibleSelect.innerHTML = '<option value="">Cargando usuarios...</option>';
    responsibleSelect.disabled = true;

    try {
        const token = localStorage.getItem('jwt');
        if (!token) {
            throw new Error('No authentication token found');
        }

        // Get current user to exclude from list
        let currentUserId = null;
        try {
            const currentUserResponse = await fetch('/api/v1/users/me', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            if (currentUserResponse.ok) {
                const currentUser = await currentUserResponse.json();
                currentUserId = currentUser.id;
            }
        } catch (userError) {
            console.warn('Could not get current user info:', userError);
        }

        // Fetch all users from institution endpoint - load all pages
        let allUsers = [];
        let page = 0;
        let hasMore = true;
        const pageSize = 1000;

        while (hasMore) {
            const response = await fetch(`/api/v1/users/institution?page=${page}&size=${pageSize}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                let errorMessage = 'Error al cargar los usuarios';
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorData.detail || errorData.error || errorMessage;
                    
                    // If user doesn't have institution assigned
                    if (response.status === 404) {
                        errorMessage = 'No tienes una institución asignada. Contacta a un administrador.';
                    }
                } catch (parseError) {
                    const errorText = await response.text();
                    if (errorText) {
                        errorMessage = errorText;
                    }
                }
                throw new Error(errorMessage);
            }

            const data = await response.json();
            const users = data.users || (Array.isArray(data) ? data : []);
            
            // Debug: Log to see what we're getting
            console.log(`Page ${page}: Received ${users.length} users, total so far: ${allUsers.length + users.length}`);
            console.log(`Total users in response: ${data.totalUsers || 'unknown'}, Last page: ${data.last}`);
            
            if (users.length > 0) {
                allUsers = allUsers.concat(users);
                // Check if there are more pages
                hasMore = !data.last && users.length === pageSize;
                page++;
            } else {
                hasMore = false;
            }
        }

        // Filter out current user
        if (currentUserId) {
            allUsers = allUsers.filter(user => user.id !== currentUserId);
        }

        responsibleSelect.innerHTML = '<option value="">Seleccionar usuario responsable...</option>';
        
        if (allUsers.length === 0) {
            responsibleSelect.innerHTML = '<option value="">No hay usuarios disponibles en tu institución</option>';
        } else {
            // Sort users by full name
            allUsers.sort((a, b) => {
                const nameA = (a.fullName || `${a.name || ''} ${a.lastName || ''}`.trim() || a.email || '').toLowerCase();
                const nameB = (b.fullName || `${b.name || ''} ${b.lastName || ''}`.trim() || b.email || '').toLowerCase();
                return nameA.localeCompare(nameB);
            });

            allUsers.forEach(user => {
                const option = document.createElement('option');
                option.value = user.id;
                option.textContent = user.fullName || `${user.name || ''} ${user.lastName || ''}`.trim() || user.email || `Usuario #${user.id}`;
                responsibleSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading users:', error);
        responsibleSelect.innerHTML = `<option value="">${error.message || 'Error al cargar usuarios'}</option>`;
        if (window.showErrorToast) {
            window.showErrorToast('Error', error.message || 'No se pudieron cargar los usuarios de tu institución');
        }
    } finally {
        if (usersLoading) usersLoading.style.display = 'none';
        responsibleSelect.disabled = false;
    }
}

// Close new loan modal
function closeNewLoanModal() {
    const modal = document.getElementById('newLoanModal');
    if (modal) {
        modal.classList.add('hidden');
    }
    const form = document.getElementById('newLoanForm');
    if (form) {
        form.reset();
    }
    const itemContainer = document.getElementById('itemSelectionContainer');
    if (itemContainer) itemContainer.style.display = 'none';
}

// Load items for selected inventory
async function loadItemsForLoan() {
    const inventorySelect = document.getElementById('newLoanInventory');
    const itemSelect = document.getElementById('newLoanItem');
    const itemContainer = document.getElementById('itemSelectionContainer');
    const itemsLoading = document.getElementById('itemsLoading');

    if (!inventorySelect || !itemSelect || !itemContainer) return;

    const inventoryId = inventorySelect.value;
    
    if (!inventoryId) {
        itemContainer.style.display = 'none';
        return;
    }

    // Show loading
    itemContainer.style.display = 'block';
    if (itemsLoading) itemsLoading.style.display = 'block';
    itemSelect.innerHTML = '<option value="">Cargando items...</option>';
    itemSelect.disabled = true;

    try {
        const token = localStorage.getItem('jwt');
        if (!token) {
            throw new Error('No authentication token found');
        }

        // Fetch items from inventory
        const response = await fetch(`/api/v1/items/inventory/${inventoryId}?page=0&size=1000`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            const items = data.content || data || [];

            itemSelect.innerHTML = '<option value="">Verificando disponibilidad de items...</option>';
            
            if (items.length === 0) {
                itemSelect.innerHTML = '<option value="">No hay items disponibles en este inventario</option>';
            } else {
                // Filter items that are active and check loan status
                const availableItems = [];
                const checkPromises = items
                    .filter(item => item.status !== false)
                    .map(async (item) => {
                        try {
                            // Check if item has an active loan
                            const loanResponse = await fetch(`/api/v1/loan/item/${item.id}/last`, {
                                headers: {
                                    'Authorization': `Bearer ${token}`,
                                    'Content-Type': 'application/json'
                                }
                            });
                            
                            if (loanResponse.ok) {
                                const lastLoan = await loanResponse.json();
                                // Item is available if there's no loan or the loan is returned
                                if (!lastLoan || lastLoan.returned === true || lastLoan.returned === null) {
                                    availableItems.push(item);
                                }
                            } else if (loanResponse.status === 404) {
                                // No loan found, item is available
                                availableItems.push(item);
                            } else {
                                // Error checking loan, include item anyway (backend will validate)
                                availableItems.push(item);
                            }
                        } catch (loanError) {
                            console.warn(`Error checking loan for item ${item.id}:`, loanError);
                            // On error, include item anyway (backend will validate)
                            availableItems.push(item);
                        }
                    });
                
                await Promise.all(checkPromises);
                
                itemSelect.innerHTML = '<option value="">Seleccionar item...</option>';
                
                if (availableItems.length === 0) {
                    itemSelect.innerHTML = '<option value="">No hay items disponibles para préstamo en este inventario</option>';
                } else {
                    availableItems.forEach(item => {
                        const option = document.createElement('option');
                        option.value = item.id;
                        option.textContent = `${item.productName || 'Sin nombre'} - ${item.licencePlateNumber || 'N/A'}`;
                        itemSelect.appendChild(option);
                    });
                }
            }
        } else {
            throw new Error('Error al cargar los items');
        }
    } catch (error) {
        console.error('Error loading items:', error);
        itemSelect.innerHTML = '<option value="">Error al cargar items</option>';
        if (window.showErrorToast) {
            window.showErrorToast('Error', 'No se pudieron cargar los items del inventario');
        }
    } finally {
        if (itemsLoading) itemsLoading.style.display = 'none';
        itemSelect.disabled = false;
    }
}

// Function to check and remove duplicate loans
async function checkAndRemoveDuplicateLoans(itemId) {
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

        // Get the last 2 loans (most recent first)
        const lastLoan = loans[0];
        const secondLastLoan = loans[1];

        // Check if they are duplicates
        // Compare: itemId, responsibleId, details, and if they were created within a few seconds of each other
        const areDuplicates = 
            lastLoan.itemId === secondLastLoan.itemId &&
            lastLoan.responsibleId === secondLastLoan.responsibleId &&
            lastLoan.detailsLend === secondLastLoan.detailsLend &&
            lastLoan.returned === secondLastLoan.returned;

        if (areDuplicates) {
            // Check if they were created very close in time (within 5 seconds)
            const lastLoanDate = new Date(lastLoan.lendAt);
            const secondLastLoanDate = new Date(secondLastLoan.lendAt);
            const timeDiff = Math.abs(lastLoanDate - secondLastLoanDate) / 1000; // difference in seconds

            if (timeDiff < 5) {
                // They are duplicates, delete the most recent one (lastLoan)
                console.log('Préstamos duplicados detectados, eliminando el más reciente...');
                
                const deleteResponse = await fetch(`/api/v1/loan/${lastLoan.id}`, {
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
    } catch (error) {
        console.error('Error al verificar préstamos duplicados:', error);
        // Don't throw, just log the error
    }
}

// Handle new loan form submission
async function handleNewLoanSubmit(e) {
    e.preventDefault();

    // Prevent multiple submissions
    const submitButton = e.target.querySelector('button[type="submit"]');
    if (submitButton && submitButton.disabled) {
        return; // Already processing
    }

    const inventoryId = document.getElementById('newLoanInventory')?.value;
    const itemId = document.getElementById('newLoanItem')?.value;
    const responsibleId = document.getElementById('newLoanResponsibleId')?.value;
    const details = document.getElementById('newLoanDetails')?.value?.trim();

    if (!inventoryId || !itemId || !responsibleId) {
        if (window.showErrorToast) {
            window.showErrorToast('Error', 'Por favor complete todos los campos requeridos');
        } else {
            alert('Por favor complete todos los campos requeridos');
        }
        return;
    }

    // Disable submit button to prevent duplicate submissions
    if (submitButton) {
        const originalText = submitButton.innerHTML;
        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Creando...';
    }

    try {
        const token = localStorage.getItem('jwt');
        if (!token) {
            throw new Error('No authentication token found');
        }

        const response = await fetch('/api/v1/loan/lend', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                itemId: parseInt(itemId, 10),
                responsibleId: parseInt(responsibleId, 10),
                details: details || ''
            })
        });

        if (!response.ok) {
            let errorMessage = 'Error al crear el préstamo';
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorData.detail || errorData.error || errorMessage;
                
                // Check for specific loan error
                if (errorMessage.includes('cannot be lent') || errorMessage.includes('not been returned')) {
                    errorMessage = 'Este item no puede ser prestado porque tiene un préstamo activo. Debe ser devuelto primero.';
                }
            } catch (parseError) {
                const errorText = await response.text();
                if (errorText) {
                    errorMessage = errorText;
                    if (errorMessage.includes('cannot be lent') || errorMessage.includes('not been returned')) {
                        errorMessage = 'Este item no puede ser prestado porque tiene un préstamo activo. Debe ser devuelto primero.';
                    }
                }
            }
            throw new Error(errorMessage);
        }

        const result = await response.json();

        if (window.showSuccessToast) {
            window.showSuccessToast('Préstamo creado', 'El préstamo se ha creado exitosamente');
        }

        closeNewLoanModal();
        
        // Verify and remove duplicate loans if any
        await checkAndRemoveDuplicateLoans(parseInt(itemId, 10));
        
        await loadLoans();
        
        // Reload page after a short delay to ensure data is updated
        setTimeout(() => {
            window.location.reload();
        }, 500);
    } catch (error) {
        console.error('Error creating loan:', error);
        if (window.showErrorToast) {
            window.showErrorToast('Error', error.message || 'No se pudo crear el préstamo');
        } else {
            alert(error.message || 'No se pudo crear el préstamo');
        }
    } finally {
        // Re-enable submit button
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.innerHTML = '<i class="fas fa-hand-holding mr-2"></i>Crear Préstamo';
        }
    }
}

// Setup form handler when DOM is ready (only once)
let newLoanFormHandlerSetup = false;
function setupNewLoanFormHandler() {
    if (newLoanFormHandlerSetup) return; // Already setup
    
    const newLoanForm = document.getElementById('newLoanForm');
    if (newLoanForm) {
        // Remove any existing listener to prevent duplicates
        const newForm = newLoanForm.cloneNode(true);
        newLoanForm.parentNode.replaceChild(newForm, newLoanForm);
        newForm.addEventListener('submit', handleNewLoanSubmit);
        newLoanFormHandlerSetup = true;
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupNewLoanFormHandler);
} else {
    setupNewLoanFormHandler();
}

// Return a loan item
async function returnLoanItem(loanId, detailsReturn = '') {
    try {
        const token = localStorage.getItem('jwt');
        if (!token) {
            throw new Error('No authentication token found');
        }

        const response = await fetch('/api/v1/loan/return', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                loanId: parseInt(loanId, 10),
                detailsReturn: detailsReturn || ''
            })
        });

        if (!response.ok) {
            let errorMessage = 'Error al devolver el item';
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorData.detail || errorData.error || errorMessage;
            } catch (parseError) {
                const errorText = await response.text();
                if (errorText) {
                    errorMessage = errorText;
                }
            }
            throw new Error(errorMessage);
        }

        const result = await response.json();

        if (window.showSuccessToast) {
            window.showSuccessToast('Item devuelto', 'El item se ha devuelto exitosamente');
        }

        // Reload loans data
        await loadLoans();
        return result;
    } catch (error) {
        console.error('Error returning loan item:', error);
        if (window.showErrorToast) {
            window.showErrorToast('Error', error.message || 'No se pudo devolver el item');
        } else {
            alert(error.message || 'No se pudo devolver el item');
        }
        throw error;
    }
}

window.loadLoansData = loadLoansData;
window.loadLoans = loadLoans;
window.loadRegionals = loadRegionals;
window.loadInstitutions = loadInstitutions;
window.loadInventories = loadInventories;
window.getCurrentUserInfo = getCurrentUserInfo;
window.updateLoansUIForUserRole = updateLoansUIForUserRole;
window.showNewLoanModal = showNewLoanModal;
window.closeNewLoanModal = closeNewLoanModal;
window.loadItemsForLoan = loadItemsForLoan;
window.loadUsersForLoan = loadUsersForLoan;
window.returnLoanItem = returnLoanItem;

