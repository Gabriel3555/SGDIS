// Cache for institutions to avoid multiple API calls
let institutionsCache = null;
let institutionsCacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

async function loadInstitutionsCache() {
    const now = Date.now();
    // Use cache if it's still valid
    if (institutionsCache && institutionsCacheTimestamp && (now - institutionsCacheTimestamp) < CACHE_DURATION) {
        return institutionsCache;
    }
    
    try {
        const token = localStorage.getItem('jwt');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        
        const response = await fetch('/api/v1/institutions', {
            method: 'GET',
            headers: headers
        });
        
        if (response.ok) {
            institutionsCache = await response.json();
            institutionsCacheTimestamp = now;
            return institutionsCache;
        }
    } catch (error) {
        console.error('Error loading institutions cache:', error);
    }
    
    return institutionsCache || [];
}

async function filterUsers() {
    // Ensure we're using window.usersData for consistency
    if (!window.usersData) {
        window.usersData = usersData;
    }
    const data = window.usersData;
    
    // Check if filters are active (including regional and institution for super admin and admin regional)
    const isSuperAdmin = (data.currentLoggedInUserRole && data.currentLoggedInUserRole.toUpperCase() === 'SUPERADMIN') ||
                         (window.location.pathname && window.location.pathname.includes('/superadmin'));
    const isAdminRegional = (data.currentLoggedInUserRole && data.currentLoggedInUserRole.toUpperCase() === 'ADMIN_REGIONAL') ||
                            (window.location.pathname && window.location.pathname.includes('/admin_regional'));
    const hasFilters = data.searchTerm || 
                      data.selectedRole !== 'all' || 
                      data.selectedStatus !== 'all' ||
                      (isSuperAdmin && (data.selectedRegional || data.selectedInstitution)) ||
                      (isAdminRegional && data.selectedInstitution);
    
    if (hasFilters) {
        // Reload all users for filtering
        showLoadingState();
        try {
            await loadUsers(0);
            
            if (!data.users || !Array.isArray(data.users)) {
                console.warn('No users data available for filtering');
                return;
            }

            let filtered = [...data.users];
            
            // For superadmin, exclude all SUPERADMIN users from the start
            if (isSuperAdmin) {
                filtered = filtered.filter(user => user && user.role !== 'SUPERADMIN');
            }
            
            // For warehouse, only show USER role users
            const isWarehouse = (data.currentLoggedInUserRole && data.currentLoggedInUserRole.toUpperCase() === 'WAREHOUSE') ||
                               (window.location.pathname && window.location.pathname.includes('/warehouse'));
            if (isWarehouse) {
                filtered = filtered.filter(user => user && user.role === 'USER');
            }
            
            console.log('Starting with', filtered.length, 'users to filter');
            
            // Load institutions cache if needed for regional/institution filtering
            if (isSuperAdmin && (data.selectedRegional || data.selectedInstitution)) {
                await loadInstitutionsCache();
            }

            if (data.searchTerm && data.searchTerm.trim() !== '') {
                const searchLower = data.searchTerm.toLowerCase().trim();

                filtered = filtered.filter(user => {
                    let matches = false;

                    if (user.fullName && user.fullName.toLowerCase().includes(searchLower)) {
                        matches = true;
                    }

                    if (user.email && user.email.toLowerCase().includes(searchLower)) {
                        matches = true;
                    }

                    if (user.role) {
                        const roleText = getRoleText(user.role).toLowerCase();
                        if (roleText.includes(searchLower)) {
                            matches = true;
                        }
                    }

                    return matches;
                });
                console.log('After search filter:', filtered.length);
            }

            if (data.selectedRole !== 'all') {
                filtered = filtered.filter(user => user.role === data.selectedRole);
                console.log('After role filter:', filtered.length);
            }

            if (data.selectedStatus !== 'all') {
                const isActive = data.selectedStatus === 'active';
                filtered = filtered.filter(user => {
                    const userStatus = user.status !== false;
                    return userStatus === isActive;
                });
                console.log('After status filter:', filtered.length);
            }

            // Filter by regional (super admin only)
            // Since user.institution is just a string (name), we need to map it to institution data
            if (isSuperAdmin && data.selectedRegional) {
                try {
                    // Load institutions for the selected regional to get their names
                    const token = localStorage.getItem('jwt');
                    const headers = { 'Content-Type': 'application/json' };
                    if (token) headers['Authorization'] = `Bearer ${token}`;
                    
                    const institutionsResponse = await fetch(`/api/v1/institutions/institutionsByRegionalId/${data.selectedRegional}`, {
                        method: 'GET',
                        headers: headers
                    });
                    
                    if (institutionsResponse.ok) {
                        const institutions = await institutionsResponse.json();
                        if (Array.isArray(institutions)) {
                            const institutionNames = new Set(institutions.map(inst => inst.name).filter(name => name));
                            
                            filtered = filtered.filter(user => {
                                if (!user.institution) {
                                    return false;
                                }
                                return institutionNames.has(user.institution);
                            });
                        }
                    }
                } catch (error) {
                    // Silently handle error
                }
            }

            // Filter by institution (super admin and admin regional)
            if ((isSuperAdmin || isAdminRegional) && data.selectedInstitution) {
                let allInstitutions = [];
                
                if (isAdminRegional) {
                    // For Admin Regional, load institutions from their regional
                    try {
                        const token = localStorage.getItem('jwt');
                        const headers = { 'Content-Type': 'application/json' };
                        if (token) headers['Authorization'] = `Bearer ${token}`;
                        
                        // Get current user info to find their regional
                        const currentUser = window.currentUserData || window.usersData?.currentLoggedInUser || null;
                        let institutionName = null;
                        
                        if (currentUser && currentUser.institution) {
                            institutionName = currentUser.institution;
                        } else {
                            const userResponse = await fetch('/api/v1/users/me', { headers });
                            if (userResponse.ok) {
                                const userData = await userResponse.json();
                                institutionName = userData.institution;
                            }
                        }
                        
                        if (institutionName) {
                            // Get all institutions to find the user's institution
                            const allInstResponse = await fetch('/api/v1/institutions', { headers });
                            if (allInstResponse.ok) {
                                const allInst = await allInstResponse.json();
                                const userInstitution = allInst.find(inst => inst.name === institutionName);
                                
                                if (userInstitution && userInstitution.regionalId) {
                                    // Load institutions from the user's regional
                                    const regionalInstResponse = await fetch(`/api/v1/institutions/institutionsByRegionalId/${userInstitution.regionalId}`, { headers });
                                    if (regionalInstResponse.ok) {
                                        allInstitutions = await regionalInstResponse.json();
                                    }
                                }
                            }
                        }
                    } catch (error) {
                        console.error('Error loading institutions for admin regional filter:', error);
                    }
                } else {
                    // For SuperAdmin, use cached institutions
                    allInstitutions = institutionsCache || await loadInstitutionsCache();
                }
                
                if (allInstitutions && Array.isArray(allInstitutions) && allInstitutions.length > 0) {
                    const selectedInstitution = allInstitutions.find(inst => 
                        (inst.id && inst.id.toString() === data.selectedInstitution.toString()) ||
                        (inst.institutionId && inst.institutionId.toString() === data.selectedInstitution.toString())
                    );
                    
                    if (selectedInstitution && selectedInstitution.name) {
                        const institutionName = selectedInstitution.name;
                        
                        filtered = filtered.filter(user => {
                            if (!user.institution) {
                                return false;
                            }
                            return user.institution === institutionName;
                        });
                    }
                }
            }

            // Sort by ID descending (highest ID first)
            filtered.sort((a, b) => {
                const idA = a.id || 0;
                const idB = b.id || 0;
                return idB - idA; // Descending order
            });
            
            data.filteredUsers = filtered;
            data.currentPage = 1;
            data.totalPages = Math.ceil(filtered.length / data.itemsPerPage);
            data.totalUsers = filtered.length;
            
            // Also update the local usersData reference
            if (usersData && usersData !== data) {
                usersData.filteredUsers = filtered;
                usersData.currentPage = 1;
                usersData.totalPages = data.totalPages;
                usersData.totalUsers = data.totalUsers;
            }
            
            console.log('Final filtered users:', filtered.length);
            
        } finally {
            hideLoadingState();
        }
    } else {
        // No filters, reload with backend pagination
        showLoadingState();
        try {
            await loadUsers(0);
        } finally {
            hideLoadingState();
        }
    }

    // Update UI but preserve filters (don't call updateUsersUI which recreates filters)
    setTimeout(() => {
        if (typeof updateUserStats === 'function') {
            updateUserStats();
        }
        if (typeof updateViewModeButtons === 'function') {
            updateViewModeButtons();
        }
        const viewMode = data.viewMode || "table";
        if (viewMode === "table") {
            if (typeof updateUsersTable === 'function') {
                updateUsersTable();
            }
        } else {
            if (typeof updateUsersCards === 'function') {
                updateUsersCards();
            }
        }
        if (typeof updatePagination === 'function') {
            updatePagination();
        }
    }, 5);
}

window.filterUsers = filterUsers;
window.setRoleFilter = setRoleFilter;
window.setStatusFilter = setStatusFilter;
window.applySearchFilter = applySearchFilter;