// Filtering functions for users management

// Filter users based on search term, role, and status
function filterUsers() {
    let filtered = [...usersData.users];

    // Filter by search term
    if (usersData.searchTerm) {
        const searchLower = usersData.searchTerm.toLowerCase();
        filtered = filtered.filter(user =>
            (user.fullName && user.fullName.toLowerCase().includes(searchLower)) ||
            (user.email && user.email.toLowerCase().includes(searchLower)) ||
            (user.role && user.role.toLowerCase().includes(searchLower))
        );
    }

    // Filter by role
    if (usersData.selectedRole !== 'all') {
        filtered = filtered.filter(user => user.role === usersData.selectedRole);
    }

    // Filter by status
    if (usersData.selectedStatus !== 'all') {
        const status = usersData.selectedStatus === 'active';
        filtered = filtered.filter(user => user.status === status);
    }

    usersData.filteredUsers = filtered;
    usersData.currentPage = 1;
    updateUsersUI();
}