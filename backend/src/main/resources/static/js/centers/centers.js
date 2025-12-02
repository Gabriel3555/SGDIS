// centers.js - Gestión de Centros (Instituciones)

// Custom Select Component
if (typeof CustomSelect === "undefined" && typeof window.CustomSelect === "undefined") {
    var CustomSelect = class CustomSelect {
        constructor(containerId, options = {}) {
            this.container = document.getElementById(containerId);
            if (!this.container) {
                return;
            }

            this.trigger = this.container.querySelector(".custom-select-trigger");
            this.dropdown = this.container.querySelector(".custom-select-dropdown");
            this.searchInput = this.container.querySelector(".custom-select-search");
            this.optionsContainer = this.container.querySelector(".custom-select-options");
            this.textElement = this.container.querySelector(".custom-select-text");

            // Verify all required elements exist
            if (!this.trigger || !this.dropdown || !this.optionsContainer || !this.textElement) {
                return;
            }

            // Buscar el hidden input en el contenedor padre (custom-select-container)
            const parentContainer = this.container.closest('.custom-select-container');
            if (parentContainer) {
                this.hiddenInput = parentContainer.querySelector('input[type="hidden"]');
            }
            // Si no se encuentra, buscar dentro del mismo contenedor
            if (!this.hiddenInput) {
                this.hiddenInput = this.container.querySelector('input[type="hidden"]');
            }
            // Si aún no se encuentra, buscar en el parentElement
            if (!this.hiddenInput && this.container.parentElement) {
                this.hiddenInput = this.container.parentElement.querySelector('input[type="hidden"]');
            }

            this.options = [];
            this.filteredOptions = [];
            this.selectedValue = "";
            this.selectedText = "";
            this.placeholder = options.placeholder || "Seleccionar...";
            this.searchable = options.searchable !== false;
            this.onChange = options.onChange || null;
            this.isDisabled = !!options.disabled;

            this.init();
            this.setDisabled(this.isDisabled);
        }

        init() {
            if (!this.textElement || !this.optionsContainer) {
                return;
            }
            
            this.textElement.textContent = this.placeholder;
            this.textElement.classList.add("custom-select-placeholder");

            if (this.trigger) {
                this.trigger.addEventListener("click", (event) => {
                    if (this.isDisabled) {
                        event.preventDefault();
                        return;
                    }
                    this.toggle();
                });
            }

            if (this.searchInput) {
                this.searchInput.addEventListener("input", (e) => {
                    if (this.isDisabled) return;
                    this.filterOptions(e.target.value);
                });
                this.searchInput.addEventListener("keydown", (e) => {
                    if (this.isDisabled) return;
                    if (e.key === "Escape") this.close();
                });
            }

            document.addEventListener("click", (e) => {
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
            if (!this.optionsContainer) {
                return;
            }
            
            this.optionsContainer.innerHTML = "";

            if (this.filteredOptions.length === 0) {
                const noResults = document.createElement("div");
                noResults.className = "custom-select-option disabled";
                noResults.textContent = "No se encontraron resultados";
                this.optionsContainer.appendChild(noResults);
                return;
            }

            this.filteredOptions.forEach((option) => {
                const optionElement = document.createElement("div");
                optionElement.className = "custom-select-option";
                if (option.disabled) {
                    optionElement.classList.add("disabled");
                }
                optionElement.textContent = option.label;
                optionElement.dataset.value = option.value;

                if (option.value === this.selectedValue) {
                    optionElement.classList.add("selected");
                }

                if (!option.disabled) {
                    optionElement.addEventListener("click", () => {
                        if (this.isDisabled) return;
                        this.selectOption(option);
                    });
                }
                this.optionsContainer.appendChild(optionElement);
            });
        }

        filterOptions(searchTerm) {
            if (!searchTerm.trim()) {
                this.filteredOptions = [...this.options];
            } else {
                this.filteredOptions = this.options.filter((option) =>
                    option.label.toLowerCase().includes(searchTerm.toLowerCase())
                );
            }
            this.renderOptions();
        }

        selectOption(option) {
            this.selectedValue = option.value;
            this.selectedText = option.label;

            this.textElement.textContent = option.label;
            this.textElement.classList.remove("custom-select-placeholder");

            if (this.hiddenInput) {
                this.hiddenInput.value = option.value;
            }

            this.close();

            if (this.onChange) {
                this.onChange(option);
            }
        }

        toggle() {
            if (this.isDisabled) return;
            const isOpen = this.container.classList.contains("open");

            document.querySelectorAll(".custom-select.open").forEach((select) => {
                if (select !== this.container) {
                    select.classList.remove("open");
                }
            });

            if (isOpen) {
                this.close();
            } else {
                this.open();
            }
        }

        open() {
            if (this.isDisabled) return;
            this.container.classList.add("open");
            
            const container = this.container.closest('.custom-select-container');
            if (container) {
                container.classList.add('select-open');
            }
            
            // Calculate position - use fixed positioning for modals
            requestAnimationFrame(() => {
                if (this.dropdown && this.trigger) {
                    // Check if we're inside a modal
                    const isInModal = this.container.closest('[id$="Modal"]') !== null;
                    
                    if (isInModal) {
                        // Use fixed positioning for modals
                        const triggerRect = this.trigger.getBoundingClientRect();
                        this.dropdown.style.position = 'fixed';
                        this.dropdown.style.width = `${triggerRect.width}px`;
                        this.dropdown.style.top = `${triggerRect.bottom}px`;
                        this.dropdown.style.left = `${triggerRect.left}px`;
                    } else {
                        // Use absolute positioning for normal pages
                        const containerElement = this.container.closest('.custom-select-container');
                        if (containerElement) {
                            const containerRect = containerElement.getBoundingClientRect();
                            const triggerRect = this.trigger.getBoundingClientRect();
                            
                            const top = triggerRect.bottom - containerRect.top;
                            const left = triggerRect.left - containerRect.left;
                            const width = triggerRect.width;
                            
                            this.dropdown.style.position = 'absolute';
                            this.dropdown.style.top = `${top}px`;
                            this.dropdown.style.left = `${left}px`;
                            this.dropdown.style.width = `${width}px`;
                        } else {
                            // Fallback: use fixed positioning
                            const rect = this.trigger.getBoundingClientRect();
                            this.dropdown.style.position = 'fixed';
                            this.dropdown.style.width = `${rect.width}px`;
                            this.dropdown.style.top = `${rect.bottom}px`;
                            this.dropdown.style.left = `${rect.left}px`;
                        }
                    }
                }
            });
            
            if (this.searchable && this.searchInput) {
                setTimeout(() => {
                    if (this.searchInput) {
                        this.searchInput.focus();
                    }
                }, 10);
            }
        }

        close() {
            this.container.classList.remove("open");
            const container = this.container.closest('.custom-select-container');
            if (container) {
                container.classList.remove('select-open');
            }
            if (this.searchInput) {
                this.searchInput.value = "";
                this.filterOptions("");
            }
            if (this.dropdown) {
                this.dropdown.style.position = '';
                this.dropdown.style.top = '';
                this.dropdown.style.left = '';
                this.dropdown.style.width = '';
            }
        }

        getValue() {
            return this.selectedValue;
        }

        setValue(value) {
            const option = this.options.find((opt) => opt.value === value);
            if (option) {
                this.selectOption(option);
            }
        }

        clear() {
            this.selectedValue = "";
            this.selectedText = "";
            this.textElement.textContent = this.placeholder;
            this.textElement.classList.add("custom-select-placeholder");

            if (this.hiddenInput) {
                this.hiddenInput.value = "";
            }

            this.renderOptions();
        }

        setDisabled(disabled) {
            this.isDisabled = !!disabled;
            if (!this.container) return;

            if (this.isDisabled) {
                this.container.classList.add("custom-select-disabled");
                this.close();
                if (this.searchInput) {
                    this.searchInput.setAttribute("disabled", "disabled");
                }
            } else {
                this.container.classList.remove("custom-select-disabled");
                if (this.searchInput) {
                    this.searchInput.removeAttribute("disabled");
                }
            }
        }
    };
    window.CustomSelect = CustomSelect;
}

let centersData = [];
let allCentersData = []; // Almacenar todos los centros sin filtrar
let regionalsData = [];
let citiesData = [];
let currentEditingCenterId = null;
let newCenterRegionalSelect = null;
let newCenterCitySelect = null;
let editCenterRegionalSelect = null;
let editCenterCitySelect = null;
let filterRegionalSelect = null;
let filterCitySelect = null;
let filterCitiesData = []; // Ciudades para el filtro

// Cargar datos al iniciar
document.addEventListener('DOMContentLoaded', function() {
    loadCenters();
    loadRegionals();
    loadCurrentUserInfo();
    // Initialize filter selects will be called after regionals are loaded
});

async function loadCurrentUserInfo() {
    try {
        const token = localStorage.getItem('jwt');
        if (!token) return;

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
        }
    } catch (error) {
        console.error('Error loading current user info:', error);
    }
}

function updateUserInfoDisplay(userData) {
    const headerUserName = document.getElementById('headerUserName');
    const headerUserRole = document.getElementById('headerUserRole');
    const headerUserAvatar = document.getElementById('headerUserAvatar');

    if (headerUserName) {
        headerUserName.textContent = userData.fullName || 'Super Admin';
    }

    if (headerUserRole) {
        const roleText = {
            'SUPERADMIN': 'Super Administrador',
            'ADMIN_INSTITUTIONAL': 'Admin Institucional',
            'ADMIN_INSTITUTION': 'Admin Institucional',
            'ADMIN_REGIONAL': 'Admin Regional',
            'WAREHOUSE': 'Almacén',
            'USER': 'Usuario'
        }[userData.role] || userData.role || 'Super Admin';
        headerUserRole.textContent = roleText;
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
                    const initials = (userData.fullName || 'Super Admin').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                    headerUserAvatar.textContent = initials;
                }
            } else {
                // Fallback: use background image approach
                headerUserAvatar.style.backgroundImage = `url(${imgUrl})`;
                headerUserAvatar.style.backgroundSize = 'cover';
                headerUserAvatar.style.backgroundPosition = 'center';
                headerUserAvatar.textContent = '';
            }
        } else {
            const initials = (userData.fullName || 'Super Admin').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
            headerUserAvatar.textContent = initials;
            headerUserAvatar.style.backgroundImage = 'none';
        }
    }
}

async function loadCenters() {
    try {
        const token = localStorage.getItem('jwt');
        const response = await fetch('/api/v1/institutions', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            allCentersData = await response.json();
            centersData = [...allCentersData]; // Inicializar con todos los centros
            renderCenters();
        } else {
            throw new Error('Error al cargar los centros');
        }
    } catch (error) {
        console.error('Error loading centers:', error);
        showError('Error al cargar los centros: ' + error.message);
    }
}

async function loadRegionals() {
    try {
        const response = await fetch('/api/v1/regional', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            regionalsData = await response.json();
            populateRegionalSelects();
            // Initialize filter selects if not already initialized
            if (!filterRegionalSelect) {
                initializeFilterSelects();
            }
            populateFilterRegionalSelect();
        }
    } catch (error) {
        console.error('Error loading regionals:', error);
    }
}

async function loadCitiesByRegional(regionalId) {
    try {
        // Obtener la regional para obtener su departamento
        const regional = regionalsData.find(r => r.id === regionalId);
        if (!regional || !regional.departamentId) {
            console.warn('Regional no encontrada o sin departamento');
            citiesData = [];
            populateCitySelects();
            return;
        }

        // Cargar las ciudades del departamento de la regional
        const response = await fetch(`/api/v1/departments/${regional.departamentId}/cities`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            citiesData = await response.json();
            populateCitySelects();
        } else {
            throw new Error('Error al cargar las ciudades');
        }
    } catch (error) {
        console.error('Error loading cities:', error);
        citiesData = [];
        populateCitySelects();
    }
}

function populateRegionalSelects() {
    // Inicializar CustomSelect para nuevo centro
    if (!newCenterRegionalSelect) {
        newCenterRegionalSelect = new CustomSelect('newCenterRegionalSelect', {
            placeholder: 'Seleccione una regional',
            onChange: async (option) => {
                if (option && option.value) {
                    if (newCenterCitySelect) {
                        newCenterCitySelect.setDisabled(true);
                        newCenterCitySelect.clear();
                    }
                    await loadCitiesByRegional(parseInt(option.value));
                    if (newCenterCitySelect) {
                        newCenterCitySelect.setDisabled(false);
                    }
                } else {
                    if (newCenterCitySelect) {
                        newCenterCitySelect.clear();
                        newCenterCitySelect.setDisabled(true);
                    }
                }
            }
        });
    }

    // Inicializar CustomSelect para editar centro
    if (!editCenterRegionalSelect) {
        editCenterRegionalSelect = new CustomSelect('editCenterRegionalSelect', {
            placeholder: 'Seleccione una regional',
            onChange: async (option) => {
                if (option && option.value) {
                    if (editCenterCitySelect) {
                        editCenterCitySelect.setDisabled(true);
                        editCenterCitySelect.clear();
                    }
                    await loadCitiesByRegional(parseInt(option.value));
                    if (editCenterCitySelect) {
                        editCenterCitySelect.setDisabled(false);
                    }
                } else {
                    if (editCenterCitySelect) {
                        editCenterCitySelect.clear();
                        editCenterCitySelect.setDisabled(true);
                    }
                }
            }
        });
    }

    // Poblar opciones de regionales
    const regionalOptions = regionalsData.map(regional => ({
        value: regional.id.toString(),
        label: regional.name
    }));

    if (newCenterRegionalSelect) {
        newCenterRegionalSelect.setOptions(regionalOptions);
    }
    if (editCenterRegionalSelect) {
        editCenterRegionalSelect.setOptions(regionalOptions);
    }
}

function populateCitySelects() {
    // Inicializar CustomSelect para nuevo centro si no existe
    if (!newCenterCitySelect) {
        newCenterCitySelect = new CustomSelect('newCenterCitySelect', {
            placeholder: 'Seleccione una ciudad'
        });
    }

    // Inicializar CustomSelect para editar centro si no existe
    if (!editCenterCitySelect) {
        editCenterCitySelect = new CustomSelect('editCenterCitySelect', {
            placeholder: 'Seleccione una ciudad'
        });
    }

    // Poblar opciones de ciudades
    const cityOptions = citiesData.map(city => ({
        value: city.id.toString(),
        label: city.city
    }));

    if (newCenterCitySelect) {
        newCenterCitySelect.setOptions(cityOptions);
        newCenterCitySelect.setDisabled(cityOptions.length === 0);
    }
    if (editCenterCitySelect) {
        editCenterCitySelect.setOptions(cityOptions);
        editCenterCitySelect.setDisabled(cityOptions.length === 0);
    }
}

function renderCenters() {
    const container = document.getElementById('centersTableContainer');
    if (!container) return;

    if (centersData.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8 text-gray-500 dark:text-gray-400">
                <i class="fas fa-building text-4xl mb-4"></i>
                <p>No hay centros registrados</p>
            </div>
        `;
        return;
    }

    let html = `
        <div class="overflow-x-auto">
            <table class="w-full">
                <thead>
                    <tr class="border-b border-gray-200 dark:border-gray-700">
                        <th class="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">ID</th>
                        <th class="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Nombre</th>
                        <th class="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Código</th>
                        <th class="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Regional</th>
                        <th class="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Ciudad</th>
                        <th class="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Acciones</th>
                    </tr>
                </thead>
                <tbody>
    `;

    centersData.forEach(center => {
        html += `
            <tr class="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                <td class="py-3 px-4 text-gray-700 dark:text-gray-300">${center.institutionId || center.id || '-'}</td>
                <td class="py-3 px-4 text-gray-700 dark:text-gray-300">${center.name || '-'}</td>
                <td class="py-3 px-4 text-gray-700 dark:text-gray-300">${center.codeInstitution || '-'}</td>
                <td class="py-3 px-4 text-gray-700 dark:text-gray-300">${center.regionalName || '-'}</td>
                <td class="py-3 px-4 text-gray-700 dark:text-gray-300">${center.cityName || '-'}</td>
                <td class="py-3 px-4 text-right">
                    <button onclick="showEditCenterModal(${center.institutionId || center.id})" class="text-blue-600 hover:text-blue-800 mr-3">
                        <i class="fas fa-edit"></i>
                    </button>
                </td>
            </tr>
        `;
    });

    html += `
                </tbody>
            </table>
        </div>
    `;

    container.innerHTML = html;
}

function showNewCenterModal() {
    const modal = document.getElementById('newCenterModal');
    if (modal) {
        modal.classList.remove('hidden');
        document.getElementById('newCenterForm').reset();
        
        // Limpiar selects
        if (newCenterRegionalSelect) {
            newCenterRegionalSelect.clear();
        }
        if (newCenterCitySelect) {
            newCenterCitySelect.clear();
            newCenterCitySelect.setDisabled(true);
        }
    }
}

function closeNewCenterModal() {
    const modal = document.getElementById('newCenterModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

async function showEditCenterModal(centerId) {
    const center = centersData.find(c => (c.institutionId || c.id) === centerId);
    if (!center) return;

    currentEditingCenterId = centerId;
    const modal = document.getElementById('editCenterModal');
    
    document.getElementById('editCenterId').value = centerId;
    document.getElementById('editCenterName').value = center.name || '';
    document.getElementById('editCenterCode').value = center.codeInstitution || '';
    
    if (center.regionalId && editCenterRegionalSelect) {
        editCenterRegionalSelect.setValue(center.regionalId.toString());
        
        if (editCenterCitySelect) {
            editCenterCitySelect.setDisabled(true);
            editCenterCitySelect.clear();
        }
        
        await loadCitiesByRegional(center.regionalId);
        
        if (editCenterCitySelect) {
            editCenterCitySelect.setDisabled(false);
            if (center.cityId) {
                setTimeout(() => {
                    editCenterCitySelect.setValue(center.cityId.toString());
                }, 100);
            }
        }
    } else {
        if (editCenterRegionalSelect) {
            editCenterRegionalSelect.clear();
        }
        if (editCenterCitySelect) {
            editCenterCitySelect.clear();
            editCenterCitySelect.setDisabled(true);
        }
    }

    if (modal) {
        modal.classList.remove('hidden');
    }
}

function closeEditCenterModal() {
    const modal = document.getElementById('editCenterModal');
    if (modal) {
        modal.classList.add('hidden');
        currentEditingCenterId = null;
    }
}

async function handleCreateCenter(event) {
    event.preventDefault();
    
    const name = document.getElementById('centerName').value;
    const code = document.getElementById('centerCode').value;
    const regionalId = newCenterRegionalSelect ? parseInt(newCenterRegionalSelect.getValue()) : null;
    const cityId = newCenterCitySelect ? parseInt(newCenterCitySelect.getValue()) : null;

    try {
        const token = localStorage.getItem('jwt');
        const response = await fetch('/api/v1/institutions/add', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: name,
                codeInstitution: code,
                regionalId: regionalId,
                cityId: cityId
            })
        });

        if (response.ok) {
            showSuccess('Centro creado exitosamente');
            closeNewCenterModal();
            loadCenters();
        } else {
            const error = await response.json();
            throw new Error(error.message || 'Error al crear el centro');
        }
    } catch (error) {
        console.error('Error creating center:', error);
        showError('Error al crear el centro: ' + error.message);
    }
}

async function handleUpdateCenter(event) {
    event.preventDefault();
    
    const centerId = document.getElementById('editCenterId').value;
    const name = document.getElementById('editCenterName').value;
    const code = document.getElementById('editCenterCode').value;
    const regionalId = editCenterRegionalSelect ? parseInt(editCenterRegionalSelect.getValue()) : null;
    const cityId = editCenterCitySelect ? parseInt(editCenterCitySelect.getValue()) : null;

    try {
        const token = localStorage.getItem('jwt');
        const response = await fetch(`/api/v1/institutions/${centerId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: name,
                codeInstitution: code,
                regionalId: regionalId,
                cityId: cityId
            })
        });

        if (response.ok) {
            showSuccess('Centro actualizado exitosamente');
            closeEditCenterModal();
            loadCenters();
        } else {
            const error = await response.json();
            throw new Error(error.message || 'Error al actualizar el centro');
        }
    } catch (error) {
        console.error('Error updating center:', error);
        showError('Error al actualizar el centro: ' + error.message);
    }
}

function showSuccess(message) {
    // Simple toast notification
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

function showError(message) {
    // Simple toast notification
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

/**
 * Initialize filter selects for regional and city
 */
function initializeFilterSelects() {
    // Initialize regional filter select
    if (!filterRegionalSelect) {
        filterRegionalSelect = new CustomSelect('filterRegionalSelect', {
            placeholder: 'Todas las regionales',
            onChange: async (option) => {
                if (option && option.value) {
                    // Load cities for selected regional
                    if (filterCitySelect) {
                        filterCitySelect.setDisabled(true);
                        filterCitySelect.clear();
                    }
                    await loadFilterCitiesByRegional(parseInt(option.value));
                    if (filterCitySelect) {
                        filterCitySelect.setDisabled(false);
                    }
                } else {
                    // Clear city filter when no regional is selected
                    if (filterCitySelect) {
                        filterCitySelect.clear();
                        filterCitySelect.setDisabled(true);
                    }
                    filterCitiesData = [];
                }
                // Apply filters
                applyFilters();
            }
        });
    }

    // Initialize city filter select
    if (!filterCitySelect) {
        filterCitySelect = new CustomSelect('filterCitySelect', {
            placeholder: 'Todas las ciudades',
            onChange: (option) => {
                // Apply filters when city changes
                applyFilters();
            }
        });
        // Initially disabled until a regional is selected
        if (filterCitySelect) {
            filterCitySelect.setDisabled(true);
        }
    }
}

/**
 * Populate regional filter select
 */
function populateFilterRegionalSelect() {
    if (!filterRegionalSelect) return;

    const regionalOptions = [
        { value: '', label: 'Todas las regionales' },
        ...regionalsData.map(regional => ({
            value: regional.id.toString(),
            label: regional.name
        }))
    ];

    filterRegionalSelect.setOptions(regionalOptions);
}

/**
 * Load cities for filter based on selected regional
 */
async function loadFilterCitiesByRegional(regionalId) {
    try {
        // Get the regional to obtain its department
        const regional = regionalsData.find(r => r.id === regionalId);
        if (!regional || !regional.departamentId) {
            console.warn('Regional no encontrada o sin departamento');
            filterCitiesData = [];
            populateFilterCitySelect();
            return;
        }

        // Load cities from the regional's department
        const response = await fetch(`/api/v1/departments/${regional.departamentId}/cities`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            filterCitiesData = await response.json();
            populateFilterCitySelect();
        } else {
            throw new Error('Error al cargar las ciudades');
        }
    } catch (error) {
        console.error('Error loading filter cities:', error);
        filterCitiesData = [];
        populateFilterCitySelect();
    }
}

/**
 * Populate city filter select
 */
function populateFilterCitySelect() {
    if (!filterCitySelect) return;

    const cityOptions = [
        { value: '', label: 'Todas las ciudades' },
        ...filterCitiesData.map(city => ({
            value: city.id.toString(),
            label: city.city
        }))
    ];

    filterCitySelect.setOptions(cityOptions);
}

/**
 * Apply filters based on selected regional and city
 */
function applyFilters() {
    const selectedRegionalId = filterRegionalSelect ? filterRegionalSelect.getValue() : '';
    const selectedCityId = filterCitySelect ? filterCitySelect.getValue() : '';

    // Filter centers
    let filtered = [...allCentersData];

    if (selectedRegionalId) {
        filtered = filtered.filter(center => {
            const centerRegionalId = center.regionalId ? center.regionalId.toString() : '';
            return centerRegionalId === selectedRegionalId;
        });
    }

    if (selectedCityId) {
        filtered = filtered.filter(center => {
            const centerCityId = center.cityId ? center.cityId.toString() : '';
            return centerCityId === selectedCityId;
        });
    }

    centersData = filtered;
    renderCenters();
}

