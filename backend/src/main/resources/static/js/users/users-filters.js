async function filterUsers() {
    // Check if filters are active
    const hasFilters = usersData.searchTerm || usersData.selectedRole !== 'all' || usersData.selectedStatus !== 'all';
    
    if (hasFilters) {
        // Reload all users for filtering
        showLoadingState();
        try {
            await loadUsers(0);
            
            if (!usersData.users || !Array.isArray(usersData.users)) {
                return;
            }

            let filtered = [...usersData.users];

            if (usersData.searchTerm && usersData.searchTerm.trim() !== '') {
                const searchLower = usersData.searchTerm.toLowerCase().trim();

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
            }

            if (usersData.selectedRole !== 'all') {
                filtered = filtered.filter(user => user.role === usersData.selectedRole);
            }

            if (usersData.selectedStatus !== 'all') {
                const isActive = usersData.selectedStatus === 'active';
                filtered = filtered.filter(user => {
                    const userStatus = user.status !== false;
                    return userStatus === isActive;
                });
            }

            usersData.filteredUsers = filtered;
            usersData.currentPage = 1;
            usersData.totalPages = Math.ceil(filtered.length / usersData.itemsPerPage);
            usersData.totalUsers = filtered.length;
            
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

    setTimeout(() => {
        if (typeof updateUsersUI === 'function') {
            updateUsersUI();
        }
    }, 5);
}

window.filterUsers = filterUsers;
window.setRoleFilter = setRoleFilter;
window.setStatusFilter = setStatusFilter;
window.applySearchFilter = applySearchFilter;