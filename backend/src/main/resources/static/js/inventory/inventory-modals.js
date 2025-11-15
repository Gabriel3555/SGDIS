// Custom Select Component (copied from users-modals.js for use in inventory modals)
class CustomSelect {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;

        this.trigger = this.container.querySelector('.custom-select-trigger');
        this.dropdown = this.container.querySelector('.custom-select-dropdown');
        this.searchInput = this.container.querySelector('.custom-select-search');
        this.optionsContainer = this.container.querySelector('.custom-select-options');
        this.textElement = this.container.querySelector('.custom-select-text');
        this.hiddenInput = this.container.querySelector('input[type="hidden"]');

        this.options = [];
        this.filteredOptions = [];
        this.selectedValue = '';
        this.selectedText = '';
        this.placeholder = options.placeholder || 'Seleccionar...';
        this.searchable = options.searchable !== false;
        this.onChange = options.onChange || null;

        this.init();
    }

    init() {
        // Set initial placeholder
        this.textElement.textContent = this.placeholder;
        this.textElement.classList.add('custom-select-placeholder');

        // Event listeners
        this.trigger.addEventListener('click', () => this.toggle());
        this.searchInput.addEventListener('input', (e) => this.filterOptions(e.target.value));
        this.searchInput.addEventListener('keydown', (e) => this.handleKeydown(e));

        // Close on outside click
        document.addEventListener('click', (e) => {
            if (!this.container.contains(e.target)) {
                this.close();
            }
        });
    }

    setOptions(options) {
        this.options = options;
        this.filteredOptions = [...options];
        this.renderOptions();
    }

    renderOptions() {
        this.optionsContainer.innerHTML = '';

        if (this.filteredOptions.length === 0) {
            const noResults = document.createElement('div');
            noResults.className = 'custom-select-option disabled';
            noResults.textContent = 'No se encontraron resultados';
            this.optionsContainer.appendChild(noResults);
            return;
        }

        this.filteredOptions.forEach(option => {
            const optionElement = document.createElement('div');
            optionElement.className = 'custom-select-option';
            if (option.disabled) {
                optionElement.classList.add('disabled');
            }
            optionElement.textContent = option.label;
            optionElement.dataset.value = option.value;

            if (option.value === this.selectedValue) {
                optionElement.classList.add('selected');
            }

            if (!option.disabled) {
                optionElement.addEventListener('click', () => this.selectOption(option));
            }
            this.optionsContainer.appendChild(optionElement);
        });
    }

    filterOptions(searchTerm) {
        if (!searchTerm.trim()) {
            this.filteredOptions = [...this.options];
        } else {
            this.filteredOptions = this.options.filter(option =>
                option.label.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        this.renderOptions();
    }

    selectOption(option) {
        this.selectedValue = option.value;
        this.selectedText = option.label;

        this.textElement.textContent = option.label;
        this.textElement.classList.remove('custom-select-placeholder');

        if (this.hiddenInput) {
            this.hiddenInput.value = option.value;
        }

        this.close();

        if (this.onChange) {
            this.onChange(option);
        }
    }

    toggle() {
        const isOpen = this.container.classList.contains('open');

        // Close all other selects
        document.querySelectorAll('.custom-select.open').forEach(select => {
            if (select !== this.container) {
                select.classList.remove('open');
            }
        });

        if (isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    open() {
        this.container.classList.add('open');
        if (this.searchable && this.searchInput) {
            this.searchInput.focus();
        }
    }

    close() {
        this.container.classList.remove('open');
        if (this.searchInput) {
            this.searchInput.value = '';
            this.filterOptions('');
        }
    }

    handleKeydown(e) {
        if (e.key === 'Escape') {
            this.close();
        } else if (e.key === 'Enter') {
            e.preventDefault();
            const firstOption = this.optionsContainer.querySelector('.custom-select-option:not(.disabled)');
            if (firstOption) {
                const value = firstOption.dataset.value;
                const option = this.options.find(opt => opt.value === value);
                if (option) {
                    this.selectOption(option);
                }
            }
        }
    }

    getValue() {
        return this.selectedValue;
    }

    setValue(value) {
        const option = this.options.find(opt => opt.value === value);
        if (option) {
            this.selectOption(option);
        }
    }

    clear() {
        this.selectedValue = '';
        this.selectedText = '';
        this.textElement.textContent = this.placeholder;
        this.textElement.classList.add('custom-select-placeholder');

        if (this.hiddenInput) {
            this.hiddenInput.value = '';
        }

        this.renderOptions();
    }
}

function showDeleteInventoryModal(inventoryId) {
    inventoryData.currentInventoryId = inventoryId;

    const inventory = inventoryData.inventories.find(i => i && i.id == inventoryId);

    if (!inventory) {
        showErrorToast('Inventario no encontrado', 'El inventario que intenta eliminar no existe o ya fue eliminado.');
        return;
    }

    const message = document.getElementById('deleteInventoryMessage');
    const inventoryName = inventory.name || 'Inventario sin nombre';

    if (message) {
        message.textContent = `¿Está seguro de que desea eliminar el inventario "${inventoryName}"? Esta acción no se puede deshacer.`;
    }

    const modal = document.getElementById('deleteInventoryModal');
    if (modal) {
        modal.classList.remove('hidden');
    }
}

function closeDeleteInventoryModal() {
    const modal = document.getElementById('deleteInventoryModal');
    if (modal) {
        modal.classList.add('hidden');
    }

    inventoryData.currentInventoryId = null;
}

async function confirmDeleteInventory() {
    const inventoryId = inventoryData.currentInventoryId;
    if (inventoryId) {
        await window.deleteInventory(inventoryId);
        closeDeleteInventoryModal();
    }
}

window.confirmDeleteInventory = confirmDeleteInventory;
window.showDeleteInventoryModal = showDeleteInventoryModal;
window.closeDeleteInventoryModal = closeDeleteInventoryModal;

async function showViewInventoryModal(inventoryId) {
    try {
        // Set the current inventory ID
        inventoryData.currentInventoryId = inventoryId;
        
        // Show loading state
        showInventoryLoadingModal();
        
        // Fetch inventory details from API
        const inventoryDetails = await getInventoryById(inventoryId);
        
        // Populate the modal with inventory details
        populateViewInventoryModal(inventoryDetails);
        
        // Show the modal
        const modal = document.getElementById('viewInventoryModal');
        if (modal) {
            modal.classList.remove('hidden');
        }
    } catch (error) {
        console.error('Error loading inventory details:', error);
        showErrorToast('Error', 'No se pudieron cargar los detalles del inventario: ' + error.message);
        closeViewInventoryModal();
    }
}

function populateViewInventoryModal(inventory) {
    // Populate inventory details
    const nameElement = document.getElementById('viewInventoryName');
    const idElement = document.getElementById('viewInventoryId');
    const uuidElement = document.getElementById('viewInventoryUuid');
    const locationElement = document.getElementById('viewInventoryLocation');
    const quantityItemsElement = document.getElementById('viewInventoryQuantityItems');
    
    if (nameElement) nameElement.textContent = inventory.name || 'Sin nombre';
    if (idElement) idElement.textContent = inventory.id || 'N/A';
    if (uuidElement) uuidElement.textContent = inventory.uuid || 'No asignado';
    if (locationElement) locationElement.textContent = getLocationText(inventory.location) || 'Sin ubicación';
    if (quantityItemsElement) quantityItemsElement.textContent = inventory.quantityItems || 0;
    
    // Populate owner details
    const ownerName = document.getElementById('viewInventoryOwnerName');
    const ownerEmail = document.getElementById('viewInventoryOwnerEmail');
    const ownerRole = document.getElementById('viewInventoryOwnerRole');
    const ownerJobTitle = document.getElementById('viewInventoryOwnerJobTitle');
    const ownerDepartment = document.getElementById('viewInventoryOwnerDepartment');
    const ownerStatus = document.getElementById('viewInventoryOwnerStatus');
    const ownerAvatar = document.getElementById('viewInventoryOwnerAvatar');
    
    if (inventory.owner) {
        if (ownerName) ownerName.textContent = inventory.owner.fullName || 'Sin nombre completo';
        if (ownerEmail) ownerEmail.textContent = inventory.owner.email || 'Sin email';
        if (ownerRole) ownerRole.textContent = inventory.owner.role || 'Sin rol';
        if (ownerJobTitle) ownerJobTitle.textContent = inventory.owner.jobTitle || 'Sin cargo';
        if (ownerDepartment) ownerDepartment.textContent = inventory.owner.laborDepartment || 'Sin departamento';
        if (ownerStatus) {
            ownerStatus.textContent = inventory.owner.status ? 'Activo' : 'Inactivo';
            ownerStatus.className = `px-2 py-1 rounded-full text-xs font-medium ${inventory.owner.status ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`;
        }
        
        // Set owner avatar
        if (ownerAvatar) {
            if (inventory.owner.imgUrl) {
                ownerAvatar.innerHTML = `<img src="${inventory.owner.imgUrl}" alt="Avatar del propietario" class="w-full h-full object-cover rounded-full">`;
            } else {
                ownerAvatar.textContent = (inventory.owner.fullName || 'U').charAt(0).toUpperCase();
            }
        }
    } else {
        // Default values when no owner
        if (ownerName) ownerName.textContent = 'Sin propietario asignado';
        if (ownerEmail) ownerEmail.textContent = 'N/A';
        if (ownerRole) ownerRole.textContent = 'N/A';
        if (ownerJobTitle) ownerJobTitle.textContent = 'N/A';
        if (ownerDepartment) ownerDepartment.textContent = 'N/A';
        if (ownerStatus) {
            ownerStatus.textContent = 'Sin asignar';
            ownerStatus.className = 'px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800';
        }
        if (ownerAvatar) {
            ownerAvatar.textContent = 'U';
        }
    }
}

function showInventoryLoadingModal() {
    const modal = document.getElementById('viewInventoryModal');
    if (modal) {
        const content = modal.querySelector('.modal-content');
        if (content) {
            content.innerHTML = `
                <div class="flex items-center justify-center py-8">
                    <div class="text-center">
                        <i class="fas fa-spinner fa-spin text-2xl text-[#00AF00] mb-4"></i>
                        <p class="text-gray-600">Cargando detalles del inventario...</p>
                    </div>
                </div>
            `;
        }
    }
}

function closeViewInventoryModal() {
    const modal = document.getElementById('viewInventoryModal');
    if (modal) {
        modal.classList.add('hidden');
    }
    inventoryData.currentInventoryId = null;
}

window.showViewInventoryModal = showViewInventoryModal;
window.closeViewInventoryModal = closeViewInventoryModal;

async function showEditInventoryModal(inventoryId) {
    try {
        // Set the current inventory ID
        inventoryData.currentInventoryId = inventoryId;
        
        // Fetch inventory details from API
        const inventoryDetails = await getInventoryById(inventoryId);
        
        // Populate the form with current inventory data
        populateEditInventoryForm(inventoryDetails);
        
        // Show the modal
        const modal = document.getElementById('editInventoryModal');
        if (modal) {
            modal.classList.remove('hidden');
        }
    } catch (error) {
        console.error('Error loading inventory for editing:', error);
        showErrorToast('Error', 'No se pudieron cargar los datos del inventario para editar: ' + error.message);
    }
}

function populateEditInventoryForm(inventory) {
    const nameInput = document.getElementById('editInventoryName');
    const locationInput = document.getElementById('editInventoryLocation');
    const inventoryIdElement = document.getElementById('editInventoryId');
    
    if (nameInput) nameInput.value = inventory.name || '';
    if (locationInput) locationInput.value = inventory.location || '';
    if (inventoryIdElement) inventoryIdElement.textContent = inventory.id || 'N/A';
}

function closeEditInventoryModal() {
    const modal = document.getElementById('editInventoryModal');
    if (modal) {
        modal.classList.add('hidden');
    }
    
    // Clear form
    const nameInput = document.getElementById('editInventoryName');
    const locationInput = document.getElementById('editInventoryLocation');
    
    if (nameInput) nameInput.value = '';
    if (locationInput) locationInput.value = '';
    
    inventoryData.currentInventoryId = null;
}

// Toast notification helpers for edit operations
function showEditSuccessToast() {
    showSuccessToast('Inventario actualizado', 'El inventario se ha actualizado correctamente.');
}

function showEditErrorToast(message) {
    showErrorToast('Error al actualizar', message || 'No se pudo actualizar el inventario.');
}

window.showEditInventoryModal = showEditInventoryModal;
window.closeEditInventoryModal = closeEditInventoryModal;
window.showEditSuccessToast = showEditSuccessToast;
window.showEditErrorToast = showEditErrorToast;

async function showAssignInventoryModal(inventoryId) {
    try {
        // Set the current inventory ID
        inventoryData.currentInventoryId = inventoryId;
        
        // Fetch inventory details for display
        const inventoryDetails = await getInventoryById(inventoryId);
        
        // Populate the modal with inventory info
        populateAssignInventoryModal(inventoryDetails);
        
        // Show the modal
        const modal = document.getElementById('assignInventoryModal');
        if (modal) {
            modal.classList.remove('hidden');
        }
    } catch (error) {
        console.error('Error loading inventory for assignment:', error);
        showErrorToast('Error', 'No se pudieron cargar los datos del inventario: ' + error.message);
    }
}

async function populateAssignInventoryModal(inventory) {
    // Validate inventory data
    if (!inventory) {
        console.error('No inventory data provided to populateAssignInventoryModal');
        return;
    }

    const inventoryName = document.getElementById('assignInventoryName');
    const inventoryId = document.getElementById('assignInventoryId');
    
    if (inventoryName) {
        inventoryName.textContent = inventory.name || 'Sin nombre';
    } else {
        console.warn('assignInventoryName element not found');
    }
    
    if (inventoryId) {
        inventoryId.textContent = inventory.id || 'N/A';
    } else {
        console.warn('assignInventoryId element not found');
    }
    
    // Load users into the select dropdown
    await loadUsersForAssignment();
}

async function loadUsersForAssignment() {
    // Show loading state
    showUserSelectLoading();
    
    try {
        // Fetch users from API
        const users = await fetchUsers();
        
        if (users.length === 0) {
            const userSelect = document.getElementById('assignUserId');
            if (userSelect) {
                userSelect.innerHTML = '<option value="">No hay usuarios disponibles</option>';
            }
            return;
        }
        
        // Populate the select with users
        populateUserSelect(users);
        
    } catch (error) {
        console.error('Error loading users:', error);
        const userSelect = document.getElementById('assignUserId');
        if (userSelect) {
            userSelect.innerHTML = '<option value="">Error al cargar usuarios</option>';
        }
    } finally {
        // Hide loading state
        hideUserSelectLoading();
    }
}

function closeAssignInventoryModal() {
    const modal = document.getElementById('assignInventoryModal');
    if (modal) {
        modal.classList.add('hidden');
    }
    
    // Clear form
    if (window.assignUserSelect) {
        window.assignUserSelect.clear();
    }
    
    inventoryData.currentInventoryId = null;
}

// Toast notification helpers for assignment operations
function showAssignSuccessToast() {
    showSuccessToast('Inventario asignado', 'El inventario se ha asignado correctamente.');
}

function showAssignErrorToast(message) {
    showErrorToast('Error al asignar', message || 'No se pudo asignar el inventario.');
}

window.showAssignInventoryModal = showAssignInventoryModal;
window.closeAssignInventoryModal = closeAssignInventoryModal;
window.showAssignSuccessToast = showAssignSuccessToast;
window.showAssignErrorToast = showAssignErrorToast;
window.fetchUsers = fetchUsers;
window.populateUserSelect = populateUserSelect;
window.showUserSelectLoading = showUserSelectLoading;
window.hideUserSelectLoading = hideUserSelectLoading;
window.loadUsersForAssignment = loadUsersForAssignment;

// Manager Assignment Functions
async function showAssignManagerModal(inventoryId) {
    try {
        // Set the current inventory ID
        inventoryData.currentInventoryId = inventoryId;
        
        // Fetch inventory details for display
        const inventoryDetails = await getInventoryById(inventoryId);
        
        // Populate the modal with inventory info
        await populateAssignManagerModal(inventoryDetails);
        
        // Show the modal
        const modal = document.getElementById('assignManagerModal');
        if (modal) {
            modal.classList.remove('hidden');
        }
    } catch (error) {
        console.error('Error loading inventory for manager assignment:', error);
        showErrorToast('Error', 'No se pudieron cargar los datos del inventario: ' + error.message);
    }
}

async function populateAssignManagerModal(inventory) {
    // Validate inventory data
    if (!inventory) {
        console.error('No inventory data provided to populateAssignManagerModal');
        return;
    }

    const inventoryName = document.getElementById('assignManagerInventoryName');
    const inventoryId = document.getElementById('assignManagerInventoryId');
    
    if (inventoryName) {
        inventoryName.textContent = inventory.name || 'Sin nombre';
    } else {
        console.warn('assignManagerInventoryName element not found');
    }
    
    if (inventoryId) {
        inventoryId.textContent = inventory.id || 'N/A';
    } else {
        console.warn('assignManagerInventoryId element not found');
    }
    
    // Load users into the manager select dropdown
    await loadManagersForAssignment();
}

async function loadManagersForAssignment() {
    // Show loading state for manager select
    showManagerSelectLoading();
    
    try {
        // Fetch users from API for manager selection
        const users = await fetchUsers();
        
        if (users.length === 0) {
            populateManagerSelect([]);
            return;
        }
        
        // Populate the manager select with users
        populateManagerSelect(users);
        
    } catch (error) {
        console.error('Error loading managers:', error);
        populateManagerSelect([]);
    } finally {
        // Hide loading state
        hideManagerSelectLoading();
    }
}

function populateManagerSelect(users) {
    // Initialize CustomSelect if not already done
    if (!window.managerSelect) {
        window.managerSelect = new CustomSelect('managerIdSelect', {
            placeholder: 'Seleccionar gerente...',
            searchable: true
        });
    }

    // Format users as options
    const managerOptions = [];
    
    if (users && users.length > 0) {
        users.forEach(user => {
            // Format display name
            let displayName = '';
            if (user.fullName && user.fullName.trim()) {
                displayName = user.fullName;
            } else if (user.email) {
                displayName = user.email;
            } else {
                displayName = `Usuario ${user.userId || user.id}`;
            }
            
            // Add additional info if available
            if (user.jobTitle) {
                displayName += ` (${user.jobTitle})`;
            }
            
            managerOptions.push({
                value: String(user.userId || user.id),
                label: displayName
            });
        });
    } else {
        // Add no managers option (will be shown as disabled in CustomSelect)
        managerOptions.push({
            value: '',
            label: 'No hay usuarios disponibles',
            disabled: true
        });
    }
    
    window.managerSelect.setOptions(managerOptions);
}

function showManagerSelectLoading() {
    // Initialize CustomSelect if not already done
    if (!window.managerSelect) {
        window.managerSelect = new CustomSelect('managerIdSelect', {
            placeholder: 'Cargando gerentes...',
            searchable: true
        });
    }
    window.managerSelect.setOptions([{ value: '', label: 'Cargando gerentes...', disabled: true }]);
}

function hideManagerSelectLoading() {
    // Loading state is cleared when populateManagerSelect is called
    // This function is kept for compatibility but doesn't need to do anything
    // as the CustomSelect will be updated by populateManagerSelect
}

function closeAssignManagerModal() {
    const modal = document.getElementById('assignManagerModal');
    if (modal) {
        modal.classList.add('hidden');
    }
    
    // Clear form
    if (window.managerSelect) {
        window.managerSelect.clear();
    }
    
    inventoryData.currentInventoryId = null;
}

// Toast notification helpers for manager assignment operations
function showAssignManagerSuccessToast() {
    showSuccessToast('Gerente asignado', 'El gerente se ha asignado correctamente al inventario.');
}

function showAssignManagerErrorToast(message) {
    showErrorToast('Error al asignar gerente', message || 'No se pudo asignar el gerente.');
}

window.showAssignManagerModal = showAssignManagerModal;
window.closeAssignManagerModal = closeAssignManagerModal;
window.showAssignManagerSuccessToast = showAssignManagerSuccessToast;
window.showAssignManagerErrorToast = showAssignManagerErrorToast;

// Function to fetch users from API
async function fetchUsers() {
    try {
        const token = localStorage.getItem('jwt');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch('/api/v1/users', {
            method: 'GET',
            headers: headers
        });

        if (response.ok) {
            const users = await response.json();
            return Array.isArray(users) ? users : [];
        } else {
            throw new Error(`Failed to fetch users: ${response.status}`);
        }
    } catch (error) {
        console.error('Error fetching users:', error);
        return [];
    }
}

// Function to populate user select using CustomSelect
function populateUserSelect(users) {
    // Initialize CustomSelect if not already done
    if (!window.assignUserSelect) {
        window.assignUserSelect = new CustomSelect('assignUserIdSelect', {
            placeholder: 'Seleccionar usuario...',
            searchable: true
        });
    }

    // Format users as options
    const userOptions = [];
    
    if (users && users.length > 0) {
        users.forEach(user => {
            // Format display name
            let displayName = '';
            if (user.fullName && user.fullName.trim()) {
                displayName = user.fullName;
            } else if (user.email) {
                displayName = user.email;
            } else {
                displayName = `Usuario ${user.userId || user.id}`;
            }
            
            // Add additional info if available
            if (user.jobTitle) {
                displayName += ` (${user.jobTitle})`;
            }
            
            userOptions.push({
                value: String(user.userId || user.id),
                label: displayName
            });
        });
    } else {
        // Add no users option (will be shown as disabled in CustomSelect)
        userOptions.push({
            value: '',
            label: 'No hay usuarios disponibles',
            disabled: true
        });
    }
    
    window.assignUserSelect.setOptions(userOptions);
}

// Function to show loading state in user select
function showUserSelectLoading() {
    // Initialize CustomSelect if not already done
    if (!window.assignUserSelect) {
        window.assignUserSelect = new CustomSelect('assignUserIdSelect', {
            placeholder: 'Cargando usuarios...',
            searchable: true
        });
    }
    window.assignUserSelect.setOptions([{ value: '', label: 'Cargando usuarios...', disabled: true }]);
}

// Function to hide loading state in user select
function hideUserSelectLoading() {
    // Loading state is cleared when populateUserSelect is called
    // This function is kept for compatibility but doesn't need to do anything
    // as the CustomSelect will be updated by populateUserSelect
}