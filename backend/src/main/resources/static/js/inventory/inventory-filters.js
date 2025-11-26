function filterInventories() {
    // Use window.inventoryData if available, otherwise fallback to inventoryData
    const data = window.inventoryData || inventoryData;
    
    if (!data || !data.inventories || !Array.isArray(data.inventories)) {
        return;
    }

    let filtered = [...data.inventories];

    // Filter by search term
    if (data.searchTerm && data.searchTerm.trim() !== '') {
        const searchLower = data.searchTerm.toLowerCase().trim();

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
    if (data.selectedLocation !== 'all') {
        filtered = filtered.filter(inventory => inventory.location === data.selectedLocation);
    }

    // Filter by status (for future use when status field is added)
    if (data.selectedStatus !== 'all') {
        // For now, we'll assume all inventories are active
        // When status field is added to the backend, this will work properly
        const isActive = data.selectedStatus === 'active';
        filtered = filtered.filter(inventory => {
            // For now, all inventories are considered active
            // This will be updated when the backend provides status information
            const inventoryStatus = true; // Default to active
            return inventoryStatus === isActive;
        });
    }

    // Filter by institution (for admin_regional and superadmin)
    const selectedInstitution = data.selectedInstitution || '';
    if (selectedInstitution && selectedInstitution !== '') {
        filtered = filtered.filter(inventory => {
            // Check multiple possible fields for institution ID
            const inventoryInstitutionId = inventory.institutionId || 
                                          inventory.institution?.id || 
                                          (inventory.institution && inventory.institution.id ? inventory.institution.id.toString() : null);
            
            if (inventoryInstitutionId) {
                return inventoryInstitutionId.toString() === selectedInstitution.toString();
            }
            return false;
        });
    }

    data.filteredInventories = filtered;
    data.currentPage = 1;
    
    // Also update local inventoryData reference if different
    if (inventoryData && inventoryData !== data) {
        inventoryData.filteredInventories = filtered;
        inventoryData.currentPage = 1;
    }

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