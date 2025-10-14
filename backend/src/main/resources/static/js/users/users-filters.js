function filterUsers() {
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