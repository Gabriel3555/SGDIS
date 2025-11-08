function filterInventories() {
    if (!inventoryData.inventories || !Array.isArray(inventoryData.inventories)) {
        return;
    }

    let filtered = [...inventoryData.inventories];

    // Filter by search term
    if (inventoryData.searchTerm && inventoryData.searchTerm.trim() !== '') {
        const searchLower = inventoryData.searchTerm.toLowerCase().trim();

        filtered = filtered.filter(inventory => {
            let matches = false;

            // Search in inventory name
            if (inventory.name && inventory.name.toLowerCase().includes(searchLower)) {
                matches = true;
            }

            // Search in location
            if (inventory.location && inventory.location.toLowerCase().includes(searchLower)) {
                matches = true;
            }

            // Search in UUID
            if (inventory.uuid && inventory.uuid.toString().toLowerCase().includes(searchLower)) {
                matches = true;
            }

            // Search in ID
            if (inventory.id && inventory.id.toString().toLowerCase().includes(searchLower)) {
                matches = true;
            }

            // Search in manager name if available
            if (inventory.managerName && inventory.managerName.toLowerCase().includes(searchLower)) {
                matches = true;
            }

            // Search in manager email if available
            if (inventory.managerEmail && inventory.managerEmail.toLowerCase().includes(searchLower)) {
                matches = true;
            }

            return matches;
        });
    }

    // Filter by location
    if (inventoryData.selectedLocation !== 'all') {
        filtered = filtered.filter(inventory => inventory.location === inventoryData.selectedLocation);
    }

    // Filter by status (for future use when status field is added)
    if (inventoryData.selectedStatus !== 'all') {
        // For now, we'll assume all inventories are active
        // When status field is added to the backend, this will work properly
        const isActive = inventoryData.selectedStatus === 'active';
        filtered = filtered.filter(inventory => {
            // For now, all inventories are considered active
            // This will be updated when the backend provides status information
            const inventoryStatus = true; // Default to active
            return inventoryStatus === isActive;
        });
    }

    inventoryData.filteredInventories = filtered;
    inventoryData.currentPage = 1;

    setTimeout(() => {
        if (typeof updateInventoryTable === 'function') {
            updateInventoryTable();
        }
        if (typeof updatePagination === 'function') {
            updatePagination();
        }
    }, 5);
}

// Get unique locations for filter dropdown
function getUniqueLocations() {
    if (!inventoryData.inventories || !Array.isArray(inventoryData.inventories)) {
        return [];
    }

    const locations = new Set();
    inventoryData.inventories.forEach(inventory => {
        if (inventory.location) {
            locations.add(inventory.location);
        }
    });

    return Array.from(locations).sort();
}

// Get location filter options as HTML
function getLocationFilterOptions() {
    const uniqueLocations = getUniqueLocations();
    let options = '<option value="all">Todas las ubicaciones</option>';

    uniqueLocations.forEach(location => {
        const locationText = getLocationText(location);
        const selected = inventoryData.selectedLocation === location ? 'selected' : '';
        options += `<option value="${location}" ${selected}>${locationText}</option>`;
    });

    return options;
}

// Get status filter options as HTML
function getStatusFilterOptions() {
    const statusOptions = [
        { value: 'all', text: 'Todos los estados' },
        { value: 'active', text: 'Activos' },
        { value: 'inactive', text: 'Inactivos' }
    ];

    let options = '';
    statusOptions.forEach(option => {
        const selected = inventoryData.selectedStatus === option.value ? 'selected' : '';
        options += `<option value="${option.value}" ${selected}>${option.text}</option>`;
    });

    return options;
}

window.filterInventories = filterInventories;
window.getUniqueLocations = getUniqueLocations;
window.getLocationFilterOptions = getLocationFilterOptions;
window.getStatusFilterOptions = getStatusFilterOptions;