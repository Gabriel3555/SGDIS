// Custom Select Component (copied from users-modals.js for use in inventory modals)
// Solo declarar si no existe ya (para evitar conflictos si se carga users-modals.js)
if (
  typeof CustomSelect === "undefined" &&
  typeof window.CustomSelect === "undefined"
) {
  var CustomSelect = class CustomSelect {
    constructor(containerId, options = {}) {
      this.container = document.getElementById(containerId);
      if (!this.container) {
        console.error(`CustomSelect: Container with id "${containerId}" not found`);
        return;
      }

      this.trigger = this.container.querySelector(".custom-select-trigger");
      this.dropdown = this.container.querySelector(".custom-select-dropdown");
      this.searchInput = this.container.querySelector(".custom-select-search");
      this.optionsContainer = this.container.querySelector(
        ".custom-select-options"
      );
      this.textElement = this.container.querySelector(".custom-select-text");
      
      // Debug: log if optionsContainer is found
      if (!this.optionsContainer) {
        console.error(`CustomSelect: optionsContainer not found for "${containerId}"`, {
          container: this.container,
          hasDropdown: !!this.dropdown,
          html: this.container.innerHTML.substring(0, 200)
        });
      }

      // Try to find hidden input inside container first, then in parent container
      this.hiddenInput = this.container.querySelector('input[type="hidden"]');
      if (!this.hiddenInput && this.container.parentElement) {
        this.hiddenInput = this.container.parentElement.querySelector(
          'input[type="hidden"]'
        );
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
      // Verify all required elements exist
      if (!this.container || !this.trigger || !this.textElement) {
        console.warn('CustomSelect initialization failed: missing required elements', {
          container: !!this.container,
          trigger: !!this.trigger,
          textElement: !!this.textElement,
          containerId: this.container?.id
        });
        return;
      }

      // Set initial placeholder
      this.textElement.textContent = this.placeholder;
      this.textElement.classList.add("custom-select-placeholder");

      // Event listeners
      if (this.trigger) {
        // Remove any existing listeners to prevent duplicates
        const newTrigger = this.trigger.cloneNode(true);
        this.trigger.parentNode.replaceChild(newTrigger, this.trigger);
        this.trigger = newTrigger;
        
        // Add click listener to trigger
        this.trigger.addEventListener("click", (event) => {
          event.preventDefault();
          event.stopPropagation();
          if (this.isDisabled) {
            return;
          }
          this.toggle();
        });
        
        // Also add click listener to the entire container as fallback
        this.container.addEventListener("click", (event) => {
          // Only handle if click is on the container itself or trigger, not on dropdown
          if (event.target === this.container || event.target === this.trigger || this.trigger.contains(event.target)) {
            event.preventDefault();
            event.stopPropagation();
            if (this.isDisabled) {
              return;
            }
            this.toggle();
          }
        });
      }

      if (this.searchInput) {
        this.searchInput.addEventListener("input", (e) => {
          if (this.isDisabled) {
            e.preventDefault();
            return;
          }
          this.filterOptions(e.target.value);
        });
        this.searchInput.addEventListener("keydown", (e) => {
          if (this.isDisabled) {
            e.preventDefault();
            return;
          }
          this.handleKeydown(e);
        });
      }

      // Close on outside click
      document.addEventListener("click", (e) => {
        if (!this.container.contains(e.target)) {
          this.close();
        }
      });
    }

    setOptions(options) {
      this.options = options || [];
      this.filteredOptions = [...this.options];
      
      // If a value is already selected, try to preserve it
      const currentValue = this.selectedValue;
      const currentText = this.selectedText;
      
      // Re-render options
      this.renderOptions();
      
      // If we had a selected value, try to restore it
      if (currentValue && currentValue !== '') {
        const option = this.options.find(opt => String(opt.value) === String(currentValue));
        if (option) {
          // Value still exists in new options, keep it selected
          this.selectedValue = option.value;
          this.selectedText = option.label;
          if (this.textElement) {
            this.textElement.textContent = option.label;
            this.textElement.classList.remove("custom-select-placeholder");
          }
        } else {
          // Value no longer exists, clear selection
          if (currentValue !== '') {
            this.clear();
          }
        }
      }
    }

    renderOptions() {
      // Verify optionsContainer exists, if not try to find it again
      if (!this.optionsContainer) {
        this.optionsContainer = this.container.querySelector(".custom-select-options");
      }

      if (!this.optionsContainer) {
        console.error('CustomSelect: optionsContainer not found', this.container);
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
            if (this.isDisabled) {
              return;
            }
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

      // Re-find textElement in case DOM was updated
      if (!this.textElement || !this.container.contains(this.textElement)) {
        this.textElement = this.container.querySelector(".custom-select-text");
      }

      // Ensure textElement exists before updating
      if (this.textElement) {
        this.textElement.textContent = option.label;
        this.textElement.classList.remove("custom-select-placeholder");
        
        // Force update by directly setting innerHTML as well
        if (this.textElement.innerHTML !== option.label) {
          this.textElement.innerHTML = option.label;
        }
      } else {
        console.error('CustomSelect: textElement not found when trying to update text');
        // Try to find it one more time
        const textEl = this.container.querySelector(".custom-select-text");
        if (textEl) {
          textEl.textContent = option.label;
          textEl.classList.remove("custom-select-placeholder");
          this.textElement = textEl;
        }
      }

      if (this.hiddenInput) {
        this.hiddenInput.value = option.value;
      }

      // Re-render options to update selected state
      this.renderOptions();

      this.close();

      // Verify the text was updated after a short delay
      setTimeout(() => {
        const currentText = this.container.querySelector(".custom-select-text");
        if (currentText && currentText.textContent !== option.label) {
          console.warn('CustomSelect: Text was reset after selectOption, fixing...');
          currentText.textContent = option.label;
          currentText.classList.remove("custom-select-placeholder");
        }
      }, 100);

      if (this.onChange) {
        this.onChange(option);
      }
    }

    toggle() {
      if (this.isDisabled) {
        console.log('CustomSelect toggle: isDisabled = true');
        return;
      }
      
      if (!this.container) {
        console.error('CustomSelect toggle: container is null');
        return;
      }
      
      const isOpen = this.container.classList.contains("open");

      // Close all other selects
      document.querySelectorAll(".custom-select.open").forEach((select) => {
        if (select !== this.container) {
          select.classList.remove("open");
          const container = select.closest('.custom-select-container');
          if (container) {
            container.classList.remove('select-open');
            container.classList.remove('dropdown-up');
          }
        }
      });

      if (isOpen) {
        this.close();
      } else {
        this.open();
      }
    }

    open() {
      if (this.isDisabled) {
        return;
      }
      this.container.classList.add("open");
      
      // Add class to parent container to increase z-index
      const container = this.container.closest('.custom-select-container');
      if (container) {
        container.classList.add('select-open');
      }
      
      // Check if dropdown should open upward
      // Use setTimeout to ensure dropdown is rendered first
      setTimeout(() => {
        if (this.dropdown && this.trigger) {
          this.updateDropdownPosition();
        }
      }, 10);
      
      // Add scroll listener to update position when scrolling
      if (!this._scrollListener) {
        this._scrollListener = () => {
          if (this.container && this.container.classList.contains("open")) {
            this.updateDropdownPosition();
          }
        };
        window.addEventListener('scroll', this._scrollListener, true);
        // Also listen to scroll on the container's parent elements
        let parent = this.container.parentElement;
        while (parent && parent !== document.body) {
          parent.addEventListener('scroll', this._scrollListener, true);
          parent = parent.parentElement;
        }
      }
    }
    
    updateDropdownPosition() {
      if (!this.dropdown || !this.trigger || !this.container) {
        return;
      }
      
      // Ensure container has position relative for absolute positioning to work
      const containerStyle = window.getComputedStyle(this.container);
      if (containerStyle.position === 'static') {
        this.container.style.position = 'relative';
      }
      
      const triggerRect = this.trigger.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const spaceBelow = viewportHeight - triggerRect.bottom;
      const spaceAbove = triggerRect.top;
      const dropdownHeight = 250; // Approximate max height of dropdown
      
      // Check if we're in the filter section (bottom half of viewport)
      const isInBottomHalf = triggerRect.top > (viewportHeight * 0.6);
      
      // If not enough space below but enough space above, open upward
      // Or if in bottom half of viewport, prefer upward
      if ((spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) || 
          (isInBottomHalf && spaceAbove > dropdownHeight)) {
        this.container.classList.add('dropdown-up');
      } else {
        this.container.classList.remove('dropdown-up');
      }
      
      // Use absolute positioning relative to the container instead of fixed
      // This keeps the dropdown attached to the trigger even when scrolling
      // The CSS already has position: absolute, so we just need to set width and top/bottom
      this.dropdown.style.position = 'absolute';
      this.dropdown.style.width = `${this.trigger.offsetWidth}px`;
      this.dropdown.style.left = '0';
      this.dropdown.style.right = 'auto';
      this.dropdown.style.minWidth = `${this.trigger.offsetWidth}px`;
      
      if (this.container.classList.contains('dropdown-up')) {
        // Open upward - position above the trigger
        this.dropdown.style.bottom = `${this.trigger.offsetHeight}px`;
        this.dropdown.style.top = 'auto';
      } else {
        // Open downward - position below the trigger
        this.dropdown.style.top = `${this.trigger.offsetHeight}px`;
        this.dropdown.style.bottom = 'auto';
      }
      
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
        container.classList.remove('dropdown-up'); // Ensure this is removed on close
      }
      if (this.searchInput) {
        this.searchInput.value = "";
        this.filterOptions("");
      }
      // Reset dropdown position properties
      if (this.dropdown) {
        this.dropdown.style.position = '';
        this.dropdown.style.top = '';
        this.dropdown.style.bottom = '';
        this.dropdown.style.left = '';
        this.dropdown.style.width = '';
        this.dropdown.style.right = '';
      }
      
      // Remove scroll listeners when closed
      if (this._scrollListener) {
        window.removeEventListener('scroll', this._scrollListener, true);
        // Remove from parent elements
        let parent = this.container?.parentElement;
        while (parent && parent !== document.body) {
          parent.removeEventListener('scroll', this._scrollListener, true);
          parent = parent.parentElement;
        }
        this._scrollListener = null;
      }
    }

    handleKeydown(e) {
      if (this.isDisabled) {
        e.preventDefault();
        return;
      }
      if (e.key === "Escape") {
        this.close();
      } else if (e.key === "Enter") {
        e.preventDefault();
        const firstOption = this.optionsContainer.querySelector(
          ".custom-select-option:not(.disabled)"
        );
        if (firstOption) {
          const value = firstOption.dataset.value;
          const option = this.options.find((opt) => opt.value === value);
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
      // Convert value to string for comparison
      const stringValue = value !== null && value !== undefined ? String(value) : '';
      
      // Re-find textElement in case DOM was updated
      if (!this.textElement || !this.container.contains(this.textElement)) {
        this.textElement = this.container.querySelector(".custom-select-text");
      }
      
      // If value is empty, clear the selection
      if (stringValue === '') {
        this.clear();
        return;
      }
      
      // Check if the value is already set and the text is correct
      const currentValue = this.selectedValue !== null && this.selectedValue !== undefined ? String(this.selectedValue) : '';
      const currentText = this.textElement?.textContent || '';
      
      if (currentValue === stringValue && currentText !== this.placeholder && currentText !== '') {
        // Value is already set and text is correct, just ensure hidden input is synced
        if (this.hiddenInput) {
          this.hiddenInput.value = stringValue;
        }
        // Re-render options to update selected state
        this.renderOptions();
        return;
      }
      
      // Find the option that matches the value
      const option = this.options.find((opt) => {
        const optValue = opt.value !== null && opt.value !== undefined ? String(opt.value) : '';
        return optValue === stringValue;
      });
      
      if (option) {
        // Update the selected value and text without triggering onChange
        this.selectedValue = option.value;
        this.selectedText = option.label;
        
        // Update the text element - force update
        if (this.textElement) {
          this.textElement.textContent = option.label;
          this.textElement.innerHTML = option.label; // Also set innerHTML to be sure
          this.textElement.classList.remove("custom-select-placeholder");
        } else {
          // Try to find it again
          const textEl = this.container.querySelector(".custom-select-text");
          if (textEl) {
            textEl.textContent = option.label;
            textEl.innerHTML = option.label;
            textEl.classList.remove("custom-select-placeholder");
            this.textElement = textEl;
          }
        }
        
        // Update hidden input
        if (this.hiddenInput) {
          this.hiddenInput.value = option.value;
        }
        
        // Re-render options to update selected state (without triggering onChange)
        this.renderOptions();
      } else {
        // If option not found, check if we have a current text that matches
        // This can happen if setValue is called before options are loaded
        // or if the options were just updated
        if (this.textElement && this.textElement.textContent !== this.placeholder && this.textElement.textContent !== '') {
          // Text is already set and looks correct, just store the value
          this.selectedValue = stringValue;
          if (this.hiddenInput) {
            this.hiddenInput.value = stringValue;
          }
          // Don't update text - keep the current text
          this.renderOptions();
        } else {
          // No text set or text is placeholder, store the value but don't update text
          this.selectedValue = stringValue;
          if (this.hiddenInput) {
            this.hiddenInput.value = stringValue;
          }
          console.warn(`CustomSelect: Option with value "${stringValue}" not found in ${this.options.length} options. Value stored but text not updated.`);
        }
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
      if (!this.container) {
        return;
      }

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
  // Hacer disponible globalmente
  window.CustomSelect = CustomSelect;
} // Fin del if (typeof CustomSelect === 'undefined')

async function showDeleteInventoryModal(inventoryId) {
  inventoryData.currentInventoryId = inventoryId;

  const inventory = inventoryData.inventories.find(
    (i) => i && i.id == inventoryId
  );

  if (!inventory) {
    showErrorToast(
      "Inventario no encontrado",
      "El inventario que intenta eliminar no existe o ya fue eliminado."
    );
    return;
  }

  // Store current inventory data globally for deletion
  window.currentDeleteInventory = inventory;

  // Populate inventory info
  const inventoryNameElement = document.getElementById("deleteInventoryName");
  const inventoryIdElement = document.getElementById(
    "deleteInventoryIdDisplay"
  );
  const inventoryName = inventory.name || "Inventario sin nombre";

  if (inventoryNameElement) {
    inventoryNameElement.textContent = inventoryName;
  }

  if (inventoryIdElement) {
    inventoryIdElement.textContent = inventory.id || "N/A";
  }

  // Reset delete role selection
  resetDeleteRoleSelection();

  const modal = document.getElementById("deleteInventoryModal");
  if (modal) {
    modal.classList.remove("hidden");
  }
}

function closeDeleteInventoryModal() {
  const modal = document.getElementById("deleteInventoryModal");
  if (modal) {
    modal.classList.add("hidden");
  }

  // Reset delete role selection
  resetDeleteRoleSelection();

  // Clear delete role user select
  if (window.deleteRoleUserSelect) {
    window.deleteRoleUserSelect.clear();
  }

  inventoryData.currentInventoryId = null;
}

// Show modal to remove roles (managers/signatories) - dedicated modal
function showRemoveRoleModal(inventoryId) {
  if (!inventoryId) {
    showErrorToast("Error", "ID de inventario no válido");
    return;
  }

  // Set current inventory ID
  inventoryData.currentInventoryId = inventoryId;

  // Get inventory name for display
  const inventory = inventoryData.inventories.find((inv) => inv.id == inventoryId);
  const inventoryName = inventory ? inventory.name : "Inventario";

  const inventoryNameElement = document.getElementById("removeRoleInventoryName");
  const inventoryIdElement = document.getElementById("removeRoleInventoryIdDisplay");

  if (inventoryNameElement) {
    inventoryNameElement.textContent = inventoryName;
  }

  if (inventoryIdElement) {
    inventoryIdElement.textContent = inventoryId;
  }

  // Reset delete role selection
  resetRemoveRoleSelection();

  const modal = document.getElementById("removeRoleModal");
  if (modal) {
    modal.classList.remove("hidden");
    
    // Destroy existing CustomSelect instance if it exists
    if (window.removeRoleUserSelect) {
      try {
        // Remove event listeners if there's a cleanup method
        if (window.removeRoleUserSelect.destroy) {
          window.removeRoleUserSelect.destroy();
        }
      } catch (error) {
        console.warn("Error destroying existing CustomSelect:", error);
      }
      window.removeRoleUserSelect = null;
    }
    
    // Initialize CustomSelect when modal is shown (wait a bit for DOM to be ready)
    setTimeout(() => {
      const selectElement = document.getElementById("removeRoleUserIdSelect");
      if (selectElement) {
        try {
          const CustomSelectClass = window.CustomSelect || (typeof CustomSelect !== 'undefined' ? CustomSelect : null);
          if (!CustomSelectClass) {
            console.error("CustomSelect class not available");
            return;
          }
          
          window.removeRoleUserSelect = new CustomSelectClass("removeRoleUserIdSelect", {
            placeholder: "Seleccionar usuario...",
            searchable: true,
          });
        } catch (error) {
          console.error("Error initializing CustomSelect for remove role modal:", error);
        }
      }
    }, 150);
  }
}

function closeRemoveRoleModal() {
  const modal = document.getElementById("removeRoleModal");
  if (modal) {
    modal.classList.add("hidden");
  }

  // Reset delete role selection
  resetRemoveRoleSelection();

  // Clear remove role user select
  if (window.removeRoleUserSelect) {
    try {
      window.removeRoleUserSelect.clear();
    } catch (error) {
      console.warn("Error clearing removeRoleUserSelect:", error);
    }
  }

  inventoryData.currentInventoryId = null;
}

// Reset remove role selection (reuse same logic as delete role)
function resetRemoveRoleSelection() {
  const managerBtn = document.getElementById("removeManagerRoleBtn");
  const signatoryBtn = document.getElementById("removeSignatoryRoleBtn");
  const userSection = document.getElementById("removeRoleUserSection");
  const roleDescription = document.getElementById("removeRoleDescription");

  // Remove selected class from both buttons
  if (managerBtn) {
    managerBtn.classList.remove(
      "border-red-600",
      "bg-red-50",
      "text-red-600",
      "selected"
    );
    managerBtn.classList.add("border-gray-300", "text-gray-700");
  }
  if (signatoryBtn) {
    signatoryBtn.classList.remove(
      "border-red-600",
      "bg-red-50",
      "text-red-600",
      "selected"
    );
    signatoryBtn.classList.add("border-gray-300", "text-gray-700");
  }

  // Hide user section
  if (userSection) {
    userSection.classList.add("hidden");
  }

  // Reset description
  if (roleDescription) {
    roleDescription.textContent =
      "Selecciona el usuario al que se le quitará el rol";
  }

  // Clear selected role
  window.selectedDeleteRole = null;
}

// Select role to remove (reuse same logic)
async function selectRemoveRole(role) {
  const managerBtn = document.getElementById("removeManagerRoleBtn");
  const signatoryBtn = document.getElementById("removeSignatoryRoleBtn");
  const userSection = document.getElementById("removeRoleUserSection");
  const roleDescription = document.getElementById("removeRoleDescription");

  // Remove selected class from both buttons
  if (managerBtn) {
    managerBtn.classList.remove(
      "border-red-600",
      "bg-red-50",
      "text-red-600",
      "selected"
    );
    managerBtn.classList.add("border-gray-300", "text-gray-700");
  }
  if (signatoryBtn) {
    signatoryBtn.classList.remove(
      "border-red-600",
      "bg-red-50",
      "text-red-600",
      "selected"
    );
    signatoryBtn.classList.add("border-gray-300", "text-gray-700");
  }

  // Add selected class to clicked button
  if (role === "manager" && managerBtn) {
    managerBtn.classList.remove("border-gray-300", "text-gray-700");
    managerBtn.classList.add(
      "border-red-600",
      "bg-red-50",
      "text-red-600",
      "selected"
    );
    if (roleDescription) {
      roleDescription.textContent =
        "Selecciona el manejador que deseas quitar de este inventario";
    }
  } else if (role === "signatory" && signatoryBtn) {
    signatoryBtn.classList.remove("border-gray-300", "text-gray-700");
    signatoryBtn.classList.add(
      "border-red-600",
      "bg-red-50",
      "text-red-600",
      "selected"
    );
    if (roleDescription) {
      roleDescription.textContent =
        "Selecciona el firmante que deseas quitar de este inventario";
    }
  }

  // Store selected role
  window.selectedDeleteRole = role;

  // Show user section and load users for the selected role
  if (userSection) {
    userSection.classList.remove("hidden");
    
    // Wait a bit for the section to be visible before initializing CustomSelect
    setTimeout(async () => {
      // Ensure CustomSelect is initialized for remove role modal
      const selectElement = document.getElementById("removeRoleUserIdSelect");
      if (selectElement && !window.removeRoleUserSelect) {
        try {
          const CustomSelectClass = window.CustomSelect || (typeof CustomSelect !== 'undefined' ? CustomSelect : null);
          if (CustomSelectClass) {
            window.removeRoleUserSelect = new CustomSelectClass("removeRoleUserIdSelect", {
              placeholder: "Seleccionar usuario...",
              searchable: true,
            });
          }
        } catch (error) {
          console.error("Error initializing CustomSelect in selectRemoveRole:", error);
        }
      }
      
      // Load users based on role
      if (!inventoryData.currentInventoryId) {
        showErrorToast("Error", "No se ha seleccionado un inventario");
        return;
      }

      await loadUsersForRemoveRole(role, inventoryData.currentInventoryId);
    }, 150);
  } else {
    // If section doesn't exist, try loading anyway
    if (!inventoryData.currentInventoryId) {
      showErrorToast("Error", "No se ha seleccionado un inventario");
      return;
    }

    await loadUsersForRemoveRole(role, inventoryData.currentInventoryId);
  }
}

// Delete role selection function
async function selectDeleteRole(role) {
  const managerBtn = document.getElementById("deleteManagerRoleBtn");
  const signatoryBtn = document.getElementById("deleteSignatoryRoleBtn");
  const userSection = document.getElementById("deleteRoleUserSection");
  const roleDescription = document.getElementById("deleteRoleDescription");

  // Remove selected class from both buttons
  if (managerBtn) {
    managerBtn.classList.remove(
      "border-red-600",
      "bg-red-50",
      "text-red-600",
      "selected"
    );
    managerBtn.classList.add("border-gray-300", "text-gray-700");
  }
  if (signatoryBtn) {
    signatoryBtn.classList.remove(
      "border-red-600",
      "bg-red-50",
      "text-red-600",
      "selected"
    );
    signatoryBtn.classList.add("border-gray-300", "text-gray-700");
  }

  // Add selected class to clicked button
  if (role === "manager" && managerBtn) {
    managerBtn.classList.add(
      "border-red-600",
      "bg-red-50",
      "text-red-600",
      "selected"
    );
    managerBtn.classList.remove("border-gray-300", "text-gray-700");
    if (roleDescription) {
      roleDescription.textContent =
        "Selecciona el manejador que deseas eliminar del inventario";
    }
  } else if (role === "signatory" && signatoryBtn) {
    signatoryBtn.classList.add(
      "border-red-600",
      "bg-red-50",
      "text-red-600",
      "selected"
    );
    signatoryBtn.classList.remove("border-gray-300", "text-gray-700");
    if (roleDescription) {
      roleDescription.textContent =
        "Selecciona el firmante que deseas eliminar del inventario";
    }
  }

  // Store selected role
  window.selectedDeleteRole = role;

  // Show user section and load users for the selected role
  if (userSection) {
    userSection.classList.remove("hidden");
  }

  // Load users based on role
  if (!inventoryData.currentInventoryId) {
    showErrorToast("Error", "No se ha seleccionado un inventario");
    return;
  }

  await loadUsersForDeleteRole(role, inventoryData.currentInventoryId);
}

// Reset delete role selection
function resetDeleteRoleSelection() {
  const managerBtn = document.getElementById("deleteManagerRoleBtn");
  const signatoryBtn = document.getElementById("deleteSignatoryRoleBtn");
  const userSection = document.getElementById("deleteRoleUserSection");
  const roleDescription = document.getElementById("deleteRoleDescription");

  // Remove selected class from both buttons
  if (managerBtn) {
    managerBtn.classList.remove(
      "border-red-600",
      "bg-red-50",
      "text-red-600",
      "selected"
    );
    managerBtn.classList.add("border-gray-300", "text-gray-700");
  }
  if (signatoryBtn) {
    signatoryBtn.classList.remove(
      "border-red-600",
      "bg-red-50",
      "text-red-600",
      "selected"
    );
    signatoryBtn.classList.add("border-gray-300", "text-gray-700");
  }

  // Hide user section
  if (userSection) {
    userSection.classList.add("hidden");
  }

  // Reset description
  if (roleDescription) {
    roleDescription.textContent =
      "Selecciona el usuario al que se le eliminará el rol";
  }

  // Clear selected role
  window.selectedDeleteRole = null;
}

// Load users for remove role (dedicated function for remove role modal)
async function loadUsersForRemoveRole(role, inventoryId) {
  // Ensure CustomSelect is initialized before loading
  const selectElement = document.getElementById("removeRoleUserIdSelect");
  if (selectElement && !window.removeRoleUserSelect) {
    try {
      const CustomSelectClass = window.CustomSelect || (typeof CustomSelect !== 'undefined' ? CustomSelect : null);
      if (CustomSelectClass) {
        window.removeRoleUserSelect = new CustomSelectClass("removeRoleUserIdSelect", {
          placeholder: "Seleccionar usuario...",
          searchable: true,
        });
      }
    } catch (error) {
      console.error("Error initializing CustomSelect in loadUsersForRemoveRole:", error);
    }
  }
  
  showRemoveRoleUserSelectLoading();

  try {
    let users = [];
    let response = null;

    if (role === "manager") {
      response = await getInventoryManagers(inventoryId);
    } else if (role === "signatory") {
      response = await getInventorySignatories(inventoryId);
    }

    // Handle different response formats
    if (Array.isArray(response)) {
      users = response;
    } else if (response && Array.isArray(response.managers)) {
      users = response.managers;
    } else if (response && Array.isArray(response.signatories)) {
      users = response.signatories;
    } else if (response && Array.isArray(response.data)) {
      users = response.data;
    } else {
      console.warn("Unexpected response format for role users:", response);
      users = [];
    }

    if (!users || users.length === 0) {
      populateRemoveRoleUserSelect([]);
      showInfoToast(
        "Sin usuarios",
        `No hay ${
          role === "manager" ? "manejadores" : "firmantes"
        } asignados a este inventario`
      );
      return;
    }

    populateRemoveRoleUserSelect(users);
  } catch (error) {
    console.error("Error loading users for remove role:", error);
    populateRemoveRoleUserSelect([]);
    showErrorToast(
      "Error",
      `No se pudieron cargar los ${
        role === "manager" ? "manejadores" : "firmantes"
      }`
    );
  } finally {
    hideRemoveRoleUserSelectLoading();
  }
}

// Show loading state for remove role user select
function showRemoveRoleUserSelectLoading() {
  if (!window.removeRoleUserSelect) {
    const CustomSelectClass = window.CustomSelect || (typeof CustomSelect !== 'undefined' ? CustomSelect : null);
    if (CustomSelectClass) {
      try {
        window.removeRoleUserSelect = new CustomSelectClass("removeRoleUserIdSelect", {
          placeholder: "Cargando usuarios...",
          searchable: true,
        });
      } catch (error) {
        console.error("Error initializing CustomSelect for loading state:", error);
        return;
      }
    }
  }
  if (window.removeRoleUserSelect) {
    window.removeRoleUserSelect.setOptions([
      { value: "", label: "Cargando usuarios...", disabled: true },
    ]);
  }
}

// Hide loading state for remove role user select
function hideRemoveRoleUserSelectLoading() {
  // Loading state is cleared when populateRemoveRoleUserSelect is called
}

// Populate remove role user select
function populateRemoveRoleUserSelect(users) {
  // Initialize CustomSelect if not already done
  const selectElement = document.getElementById("removeRoleUserIdSelect");
  if (!selectElement) {
    console.error("CustomSelect element not found: removeRoleUserIdSelect");
    return;
  }
  
  if (!window.removeRoleUserSelect) {
    try {
      const CustomSelectClass = window.CustomSelect || (typeof CustomSelect !== 'undefined' ? CustomSelect : null);
      if (CustomSelectClass) {
        window.removeRoleUserSelect = new CustomSelectClass("removeRoleUserIdSelect", {
          placeholder: "Seleccionar usuario...",
          searchable: true,
        });
      }
    } catch (error) {
      console.error("Error initializing CustomSelect:", error);
      // Try to reinitialize
      setTimeout(() => {
        try {
          const CustomSelectClass = window.CustomSelect || (typeof CustomSelect !== 'undefined' ? CustomSelect : null);
          if (CustomSelectClass) {
            window.removeRoleUserSelect = new CustomSelectClass("removeRoleUserIdSelect", {
              placeholder: "Seleccionar usuario...",
              searchable: true,
            });
            // Retry populating after initialization
            populateRemoveRoleUserSelect(users);
          }
        } catch (retryError) {
          console.error("Error retrying CustomSelect initialization:", retryError);
        }
      }, 200);
      return;
    }
  }

  // Format users as options
  const userOptions = [];

  if (users && users.length > 0) {
    users.forEach((user) => {
      // Format display name
      let displayName = "";
      if (user.fullName && user.fullName.trim()) {
        displayName = user.fullName;
      } else if (user.email) {
        displayName = user.email;
      } else {
        displayName = `Usuario ${user.id || "N/A"}`;
      }

      // Add additional info if available
      if (user.email && user.fullName) {
        displayName += ` (${user.email})`;
      }

      userOptions.push({
        value: String(user.id),
        label: displayName,
      });
    });
  } else {
    // Add no users option (will be shown as disabled in CustomSelect)
    userOptions.push({
      value: "",
      label: "No hay usuarios disponibles",
      disabled: true,
    });
  }

  if (window.removeRoleUserSelect) {
    window.removeRoleUserSelect.setOptions(userOptions);
  }
}

// Populate delete role user select
function populateDeleteRoleUserSelect(users) {
  // Initialize CustomSelect if not already done
  const selectElement = document.getElementById("deleteRoleUserIdSelect");
  if (!selectElement) {
    console.error("CustomSelect element not found: deleteRoleUserIdSelect");
    return;
  }
  
  if (!window.deleteRoleUserSelect) {
    try {
      window.deleteRoleUserSelect = new CustomSelect("deleteRoleUserIdSelect", {
        placeholder: "Seleccionar usuario...",
        searchable: true,
      });
    } catch (error) {
      console.error("Error initializing CustomSelect:", error);
      // Try to reinitialize
      setTimeout(() => {
        try {
          window.deleteRoleUserSelect = new CustomSelect("deleteRoleUserIdSelect", {
            placeholder: "Seleccionar usuario...",
            searchable: true,
          });
          // Retry populating after initialization
          populateDeleteRoleUserSelect(users);
        } catch (retryError) {
          console.error("Error retrying CustomSelect initialization:", retryError);
        }
      }, 200);
      return;
    }
  }

  // Format users as options
  const userOptions = [];

  if (users && users.length > 0) {
    users.forEach((user) => {
      // Format display name
      let displayName = "";
      if (user.fullName && user.fullName.trim()) {
        displayName = user.fullName;
      } else if (user.email) {
        displayName = user.email;
      } else {
        displayName = `Usuario ${user.id || "N/A"}`;
      }

      // Add additional info if available
      if (user.email && user.fullName) {
        displayName += ` (${user.email})`;
      }

      userOptions.push({
        value: String(user.id),
        label: displayName,
      });
    });
  } else {
    // Add no users option (will be shown as disabled in CustomSelect)
    userOptions.push({
      value: "",
      label: "No hay usuarios disponibles",
      disabled: true,
    });
  }

  window.deleteRoleUserSelect.setOptions(userOptions);
}

// Show loading state for delete role user select
function showDeleteRoleUserSelectLoading() {
  if (!window.deleteRoleUserSelect) {
    window.deleteRoleUserSelect = new CustomSelect("deleteRoleUserIdSelect", {
      placeholder: "Cargando usuarios...",
      searchable: true,
    });
  }
  window.deleteRoleUserSelect.setOptions([
    { value: "", label: "Cargando usuarios...", disabled: true },
  ]);
}

// Hide loading state for delete role user select
function hideDeleteRoleUserSelectLoading() {
  // Loading state is cleared when populateDeleteRoleUserSelect is called
}

// Confirm delete role
async function confirmDeleteRole() {
  if (!inventoryData.currentInventoryId) {
    showErrorToast("Error", "No se ha seleccionado un inventario");
    return;
  }

  const role = window.selectedDeleteRole;
  if (!role) {
    showErrorToast(
      "Rol no seleccionado",
      "Por favor selecciona un tipo de rol (Manejador o Firmante)"
    );
    return;
  }

  // Get user ID from CustomSelect or hidden input
  // Check both modals (delete and remove role)
  let userId = "";
  if (window.removeRoleUserSelect && window.removeRoleUserSelect.getValue) {
    userId = window.removeRoleUserSelect.getValue();
  }
  if (!userId && window.deleteRoleUserSelect && window.deleteRoleUserSelect.getValue) {
    userId = window.deleteRoleUserSelect.getValue();
  }
  if (!userId) {
    const removeRoleUserIdElement = document.getElementById("removeRoleUserId");
    if (removeRoleUserIdElement && removeRoleUserIdElement.value) {
      userId = removeRoleUserIdElement.value;
    }
  }
  if (!userId) {
    const userIdElement = document.getElementById("deleteRoleUserId");
    if (userIdElement) {
      userId = userIdElement.value;
    }
  }

  if (!userId || userId.trim() === "") {
    showErrorToast(
      "Usuario no seleccionado",
      "Por favor selecciona un usuario para eliminar su rol"
    );
    return;
  }

  const numericUserId = parseInt(userId);
  if (isNaN(numericUserId)) {
    showErrorToast(
      "ID de usuario inválido",
      "El usuario seleccionado no es válido"
    );
    return;
  }

  try {
    // Validate inventoryId is a valid number
    const numericInventoryId = parseInt(inventoryData.currentInventoryId);
    if (isNaN(numericInventoryId)) {
      showErrorToast("Error", "ID de inventario inválido");
      console.error("Invalid inventory ID:", inventoryData.currentInventoryId);
      return;
    }

    let result;
    const deleteData = {
      inventoryId: numericInventoryId, // Backend expects numeric ID (Long)
    };

    if (role === "manager") {
      deleteData.managerId = numericUserId;
      console.log("Eliminando manejador:", deleteData);
      result = await deleteManager(deleteData);
      showSuccessToast(
        "Manejador eliminado",
        "El manejador se ha eliminado correctamente del inventario"
      );
    } else if (role === "signatory") {
      deleteData.signatoryId = numericUserId;
      console.log("Eliminando firmante:", deleteData);
      result = await deleteSignatory(deleteData);
      showSuccessToast(
        "Firmante eliminado",
        "El firmante se ha eliminado correctamente del inventario"
      );
    }

    // Close modal after successful deletion
    closeDeleteInventoryModal();
    
    // Also close remove role modal if it's open
    const removeRoleModal = document.getElementById("removeRoleModal");
    if (removeRoleModal && !removeRoleModal.classList.contains("hidden")) {
      closeRemoveRoleModal();
    }

    // Reload inventory data
    await loadInventoryData();
  } catch (error) {
    console.error("Error deleting role:", error);

    let errorMessage = error.message || "Inténtalo de nuevo.";

    if (errorMessage.includes("401") || errorMessage.includes("expired")) {
      errorMessage = "Sesión expirada. Por favor inicia sesión nuevamente.";
    } else if (
      errorMessage.includes("403") ||
      errorMessage.includes("permission")
    ) {
      errorMessage =
        "No tienes permisos para eliminar roles de este inventario.";
    } else if (errorMessage.includes("404")) {
      errorMessage = "Usuario o inventario no encontrado.";
    }

    showErrorToast("Error al eliminar rol", errorMessage);
  }
}

// Make selectDeleteRole and confirmDeleteRole available globally
window.selectDeleteRole = selectDeleteRole;
window.confirmDeleteRole = confirmDeleteRole;
window.showRemoveRoleModal = showRemoveRoleModal;
window.closeRemoveRoleModal = closeRemoveRoleModal;
window.selectRemoveRole = selectRemoveRole;

async function confirmDeleteInventory() {
  const inventoryId = parseInt(inventoryData.currentInventoryId);
  if (!isNaN(inventoryId)) {
    await window.deleteInventory(inventoryId);
    closeDeleteInventoryModal();
  } else {
    showErrorToast("Error", "ID de inventario inválido");
    console.error("Invalid inventory ID:", inventoryData.currentInventoryId);
  }
}

window.confirmDeleteInventory = confirmDeleteInventory;
window.showDeleteInventoryModal = showDeleteInventoryModal;
window.closeDeleteInventoryModal = closeDeleteInventoryModal;

// Store current inventory ID for items view
let currentInventoryId = null;

async function showViewInventoryModal(inventoryId) {
  try {
    // Set the current inventory ID
    inventoryData.currentInventoryId = inventoryId;
    currentInventoryId = inventoryId;
    if (window.itemsData) {
      window.itemsData.currentInventoryId = inventoryId;
    }

    // Store in sessionStorage for items page
    sessionStorage.setItem("currentInventoryId", inventoryId.toString());

    // Show loading state
    showInventoryLoadingModal();

    // Fetch inventory details from API
    const inventoryDetails = await getInventoryById(inventoryId);

    // Populate the modal with inventory details
    populateViewInventoryModal(inventoryDetails);

    // Show the modal
    const modal = document.getElementById("viewInventoryModal");
    if (modal) {
      modal.classList.remove("hidden");
    }
  } catch (error) {
    console.error("Error loading inventory details:", error);
    showErrorToast(
      "Error",
      "No se pudieron cargar los detalles del inventario: " + error.message
    );
    closeViewInventoryModal();
  }
}

// Navigate to items page
function navigateToItems() {
  if (currentInventoryId) {
    // Store inventory ID in sessionStorage
    sessionStorage.setItem("currentInventoryId", currentInventoryId.toString());
    // Store return URL
    sessionStorage.setItem("returnToInventory", "true");

    // Get base route based on current URL
    const path = window.location.pathname;
    let baseRoute = '/superadmin';
    
    if (path.includes('/admin_regional/')) {
      baseRoute = '/admin_regional';
    } else if (path.includes('/admin_institution/') || path.includes('/admininstitution/')) {
      baseRoute = '/admin_institution';
    } else if (path.includes('/warehouse/')) {
      baseRoute = '/warehouse';
    }

    // Navigate to the appropriate items page
    const targetPath = `${baseRoute}/items?inventoryId=${currentInventoryId}`;
    window.location.href = targetPath;
  }
}

window.navigateToItems = navigateToItems;

function populateViewInventoryModal(inventory) {
  // Populate inventory image
  const imageElement = document.getElementById("viewInventoryImage");
  const imageButton = document.getElementById("viewInventoryImageButton");
  const imagePlaceholder = document.getElementById(
    "viewInventoryImagePlaceholder"
  );

  if (inventory.imgUrl) {
    // Show button with image
    if (imageButton && imageElement) {
      imageButton.style.display = "flex";
      imageElement.innerHTML = `<img src="${inventory.imgUrl}" alt="${
        inventory.name || "Inventario"
      }" class="w-full h-full object-cover rounded-xl">`;
      // Store image URL for the full size modal
      imageButton.setAttribute("data-image-url", inventory.imgUrl);

      // Add click event listener as backup
      imageButton.onclick = function (e) {
        e.preventDefault();
        e.stopPropagation();
        showInventoryImageModal();
        return false;
      };
    }
    if (imagePlaceholder) {
      imagePlaceholder.style.display = "none";
    }
  } else {
    // Show placeholder
    if (imageButton) {
      imageButton.style.display = "none";
    }
    if (imagePlaceholder) {
      imagePlaceholder.style.display = "flex";
    }
  }

  // Populate inventory details
  const nameElement = document.getElementById("viewInventoryName");
  const locationElement = document.getElementById("viewInventoryLocation");
  const quantityItemsElement = document.getElementById("viewInventoryQuantityItems");
  const statusElement = document.getElementById("viewInventoryStatus");
  const institutionElement = document.getElementById("viewInventoryInstitution");
  const totalPriceElement = document.getElementById("viewInventoryTotalPrice");

  // Basic info
  if (nameElement) nameElement.textContent = inventory.name || "Sin nombre";
  
  // Location with icon
  if (locationElement) {
    const locationText = getLocationText(inventory.location) || "Sin ubicación";
    locationElement.innerHTML = `<i class="fas fa-map-marker-alt text-[#00AF00]"></i><span>${locationText}</span>`;
  }
  
  // Quantity Items
  if (quantityItemsElement)
    quantityItemsElement.textContent = inventory.quantityItems || 0;

  // Status
  if (statusElement) {
    const isActive = inventory.status !== false;
    statusElement.textContent = isActive ? "Activo" : "Inactivo";
    statusElement.className = `px-3 py-1 rounded-full text-xs font-medium ${
      isActive
        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
        : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
    }`;
  }

  // Institution
  if (institutionElement) {
    const institutionName = inventory.institutionName || "Sin institución";
    institutionElement.innerHTML = `<i class="fas fa-building text-[#00AF00]"></i><span>${institutionName}</span>`;
  }

  // Total Price
  if (totalPriceElement) {
    const totalPrice = inventory.totalPrice || 0;
    totalPriceElement.textContent = `$${totalPrice.toLocaleString('es-ES', {minimumFractionDigits: 0, maximumFractionDigits: 0})}`;
  }

  // Populate owner details
  const ownerName = document.getElementById("viewInventoryOwnerName");
  const ownerEmail = document.getElementById("viewInventoryOwnerEmail");
  const ownerRole = document.getElementById("viewInventoryOwnerRole");
  const ownerJobTitle = document.getElementById("viewInventoryOwnerJobTitle");
  const ownerDepartment = document.getElementById("viewInventoryOwnerDepartment");
  const ownerInstitution = document.getElementById("viewInventoryOwnerInstitution");
  const ownerStatus = document.getElementById("viewInventoryOwnerStatus");
  const ownerAvatar = document.getElementById("viewInventoryOwnerAvatar");

  if (inventory.owner) {
    // Owner Name
    if (ownerName)
      ownerName.textContent = inventory.owner.fullName || "Sin nombre completo";
    
    // Owner Email with icon
    if (ownerEmail) {
      const email = inventory.owner.email || "Sin email";
      ownerEmail.innerHTML = `<i class="fas fa-envelope text-[#00AF00]"></i><span>${email}</span>`;
    }
    
    // Owner Role
    if (ownerRole) ownerRole.textContent = inventory.owner.role || "Sin rol";
    
    // Owner Job Title
    if (ownerJobTitle)
      ownerJobTitle.textContent = inventory.owner.jobTitle || "Sin cargo";
    
    // Owner Department
    if (ownerDepartment)
      ownerDepartment.textContent =
        inventory.owner.laborDepartment || "Sin departamento";
    
    // Owner Institution
    if (ownerInstitution) {
      const institution = inventory.owner.institution || "Sin institución asignada";
      ownerInstitution.innerHTML = `<i class="fas fa-building text-[#00AF00]"></i><span>${institution}</span>`;
    }
    
    // Owner Status
    if (ownerStatus) {
      ownerStatus.textContent = inventory.owner.status ? "Activo" : "Inactivo";
      ownerStatus.className = `px-3 py-1 rounded-full text-xs font-medium ${
        inventory.owner.status
          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
          : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
      }`;
    }

    // Set owner avatar
    if (ownerAvatar) {
      if (inventory.owner.imgUrl) {
        ownerAvatar.innerHTML = `<img src="${inventory.owner.imgUrl}" alt="Avatar del propietario" class="w-full h-full object-cover rounded-full">`;
      } else {
        const initial = (inventory.owner.fullName || "U").charAt(0).toUpperCase();
        ownerAvatar.innerHTML = `<span class="text-white font-bold text-2xl">${initial}</span>`;
      }
    }
  } else {
    // Default values when no owner
    if (ownerName) ownerName.textContent = "Sin propietario asignado";
    if (ownerEmail) {
      ownerEmail.innerHTML = `<i class="fas fa-envelope text-[#00AF00]"></i><span>N/A</span>`;
    }
    if (ownerRole) ownerRole.textContent = "N/A";
    if (ownerJobTitle) ownerJobTitle.textContent = "N/A";
    if (ownerDepartment) ownerDepartment.textContent = "N/A";
    if (ownerInstitution) {
      ownerInstitution.innerHTML = `<i class="fas fa-building text-[#00AF00]"></i><span>N/A</span>`;
    }
    if (ownerStatus) {
      ownerStatus.textContent = "Sin asignar";
      ownerStatus.className =
        "px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
    if (ownerAvatar) {
      ownerAvatar.innerHTML = `<span class="text-white font-bold text-2xl">U</span>`;
    }
  }
}

function showInventoryLoadingModal() {
  const modal = document.getElementById("viewInventoryModal");
  if (modal) {
    const content = modal.querySelector(".modal-content");
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
  const modal = document.getElementById("viewInventoryModal");
  if (modal) {
    modal.classList.add("hidden");
  }
  inventoryData.currentInventoryId = null;
}

// Inventory Image Modal Functions
function showInventoryImageModal() {
  const imageButton = document.getElementById("viewInventoryImageButton");
  const imageElement = document.getElementById("viewInventoryImage");

  // Try to get image URL from button attribute or from the img element inside
  let imageUrl = null;
  if (imageButton) {
    imageUrl = imageButton.getAttribute("data-image-url");
  }

  // If not found in attribute, try to get from the img element
  if (!imageUrl && imageElement) {
    const img = imageElement.querySelector("img");
    if (img && img.src) {
      imageUrl = img.src;
    }
  }

  if (!imageUrl) {
    return;
  }

  const imageModal = document.getElementById("inventoryImageModal");
  const fullSizeImage = document.getElementById("inventoryImageFullSize");

  if (imageModal && fullSizeImage) {
    fullSizeImage.src = imageUrl;
    imageModal.classList.remove("hidden");

    // Prevent body scroll when modal is open
    document.body.style.overflow = "hidden";
  }
}

function closeInventoryImageModal() {
  const imageModal = document.getElementById("inventoryImageModal");

  if (imageModal) {
    imageModal.classList.add("hidden");

    // Restore body scroll
    document.body.style.overflow = "";
  }
}

// Close image modal on Escape key
document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") {
    const imageModal = document.getElementById("inventoryImageModal");
    if (imageModal && !imageModal.classList.contains("hidden")) {
      closeInventoryImageModal();
    }
  }
});

// Close image modal when clicking outside the image
document.addEventListener("click", function (e) {
  const imageModal = document.getElementById("inventoryImageModal");
  if (imageModal && !imageModal.classList.contains("hidden")) {
    const modalContent = imageModal.querySelector(".relative");
    const closeButton = imageModal.querySelector(
      'button[onclick*="closeInventoryImageModal"]'
    );
    // Don't close if clicking on the image or close button
    if (
      modalContent &&
      !modalContent.contains(e.target) &&
      e.target !== closeButton &&
      !closeButton.contains(e.target)
    ) {
      closeInventoryImageModal();
    }
  }
});

window.showViewInventoryModal = showViewInventoryModal;
window.closeViewInventoryModal = closeViewInventoryModal;
window.showInventoryImageModal = showInventoryImageModal;
window.closeInventoryImageModal = closeInventoryImageModal;

async function showEditInventoryModal(inventoryId) {
  try {
    // Set the current inventory ID
    inventoryData.currentInventoryId = inventoryId;

    // Fetch inventory details from API
    const inventoryDetails = await getInventoryById(inventoryId);

    // Populate the form with current inventory data
    populateEditInventoryForm(inventoryDetails);

    // Show the modal
    const modal = document.getElementById("editInventoryModal");
    if (modal) {
      modal.classList.remove("hidden");
    }
  } catch (error) {
    console.error("Error loading inventory for editing:", error);
    showErrorToast(
      "Error",
      "No se pudieron cargar los datos del inventario para editar: " +
        error.message
    );
  }
}

function populateEditInventoryForm(inventory) {
  const nameInput = document.getElementById("editInventoryName");
  const locationInput = document.getElementById("editInventoryLocation");
  const inventoryIdElement = document.getElementById("editInventoryId");
  const statusCheckbox = document.getElementById("editInventoryStatus");
  const statusLabel = document.getElementById("editInventoryStatusLabel");

  if (nameInput) nameInput.value = inventory.name || "";
  if (locationInput) locationInput.value = inventory.location || "";
  if (inventoryIdElement)
    inventoryIdElement.textContent = inventory.id || "N/A";
  
  // Set status checkbox
  if (statusCheckbox) {
    statusCheckbox.checked = inventory.status !== false;
  }
  
  // Update status label
  if (statusLabel) {
    statusLabel.textContent = inventory.status !== false ? "Activo" : "Inactivo";
  }
}

function closeEditInventoryModal() {
  const modal = document.getElementById("editInventoryModal");
  if (modal) {
    modal.classList.add("hidden");
  }

  // Clear form
  const nameInput = document.getElementById("editInventoryName");
  const locationInput = document.getElementById("editInventoryLocation");
  const statusCheckbox = document.getElementById("editInventoryStatus");
  const statusLabel = document.getElementById("editInventoryStatusLabel");

  if (nameInput) nameInput.value = "";
  if (locationInput) locationInput.value = "";
  if (statusCheckbox) statusCheckbox.checked = true;
  if (statusLabel) statusLabel.textContent = "Activo";

  inventoryData.currentInventoryId = null;
}

// Toast notification helpers for edit operations
function showEditSuccessToast() {
  showSuccessToast(
    "Inventario actualizado",
    "El inventario se ha actualizado correctamente."
  );
}

function showEditErrorToast(message) {
  showErrorToast(
    "Error al actualizar",
    message || "No se pudo actualizar el inventario."
  );
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
    const modal = document.getElementById("assignInventoryModal");
    if (modal) {
      modal.classList.remove("hidden");
    }
  } catch (error) {
    console.error("Error loading inventory for assignment:", error);
    showErrorToast(
      "Error",
      "No se pudieron cargar los datos del inventario: " + error.message
    );
  }
}

async function populateAssignInventoryModal(inventory) {
  // Validate inventory data
  if (!inventory) {
    console.error("No inventory data provided to populateAssignInventoryModal");
    return;
  }

  // Store current inventory data globally for inventory assignment
  window.currentInventoryAssignment = inventory;

  const inventoryName = document.getElementById("assignInventoryName");
  const inventoryId = document.getElementById("assignInventoryId");

  if (inventoryName) {
    inventoryName.textContent = inventory.name || "Sin nombre";
  } else {
    console.warn("assignInventoryName element not found");
  }

  if (inventoryId) {
    inventoryId.textContent = inventory.id || "N/A";
  } else {
    console.warn("assignInventoryId element not found");
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
      const userSelect = document.getElementById("assignUserId");
      if (userSelect) {
        userSelect.innerHTML =
          '<option value="">No hay usuarios disponibles</option>';
      }
      return;
    }

    // Populate the select with users
    populateUserSelect(users);
  } catch (error) {
    console.error("Error loading users:", error);
    const userSelect = document.getElementById("assignUserId");
    if (userSelect) {
      userSelect.innerHTML =
        '<option value="">Error al cargar usuarios</option>';
    }
  } finally {
    // Hide loading state
    hideUserSelectLoading();
  }
}

function closeAssignInventoryModal() {
  const modal = document.getElementById("assignInventoryModal");
  if (modal) {
    modal.classList.add("hidden");
  }

  // Clear form
  if (window.assignUserSelect) {
    window.assignUserSelect.clear();
  }

  inventoryData.currentInventoryId = null;
}

// Toast notification helpers for assignment operations
function showAssignSuccessToast() {
  showSuccessToast(
    "Inventario asignado",
    "El inventario se ha asignado correctamente."
  );
}

function showAssignErrorToast(message) {
  showErrorToast(
    "Error al asignar",
    message || "No se pudo asignar el inventario."
  );
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

// New Inventory Modal Functions
async function showNewInventoryModal() {
  const modal = document.getElementById("newInventoryModal");
  if (modal) {
    modal.classList.remove("hidden");
  }

  resetRegionalSelection();

  // Don't load users initially - wait for institution selection
  // Initialize owner select with placeholder message
  if (window.newInventoryOwnerSelect) {
    window.newInventoryOwnerSelect.setOptions([
      { value: "", label: "Selecciona primero una institución", disabled: true },
    ]);
  } else {
    // Initialize CustomSelect if not already done
    if (!window.newInventoryOwnerSelect) {
      window.newInventoryOwnerSelect = new CustomSelect(
        "newInventoryOwnerIdSelect",
        {
          placeholder: "Selecciona primero una institución",
          searchable: true,
        }
      );
      window.newInventoryOwnerSelect.setOptions([
        { value: "", label: "Selecciona primero una institución", disabled: true },
      ]);
    }
  }

  const tasks = [];

  if (isInventoryInstitutionLocked()) {
    hideRegionalField();
    tasks.push(
      loadInstitutionsForNewInventory({
        forceFullList: true,
        lockToCurrentInstitution: true,
      }).then(() => {
        // After institutions are loaded and auto-selected, load users for that institution
        if (window.newInventoryInstitutionSelect) {
          const selectedInstitutionId = window.newInventoryInstitutionSelect.getValue();
          if (selectedInstitutionId) {
            loadUsersForNewInventory(selectedInstitutionId);
          }
        }
      })
    );
  } else if (shouldDisplayInventoryRegionalSelect()) {
    showRegionalField();
    setInstitutionSelectAwaitingRegional();
    tasks.push(loadRegionalsForNewInventory());
  } else {
    hideRegionalField();
    tasks.push(loadInstitutionsForNewInventory());
    // For SUPERADMIN or similar, allow loading all users initially
    // But they will be filtered when an institution is selected
    // Don't load users here - wait for institution selection or load all if no institution is required
  }

  await Promise.all(tasks);
}

async function loadUsersForNewInventory(institutionId = null) {
  // Show loading state
  showNewInventoryOwnerSelectLoading();

  try {
    const token = localStorage.getItem("jwt");
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    // Check if current user is ADMIN_INSTITUTION
    let currentUser = null;
    let currentUserRole = null;
    try {
      const userResponse = await fetch("/api/v1/users/me", {
        method: "GET",
        headers: headers,
      });
      if (userResponse.ok) {
        currentUser = await userResponse.json();
        currentUserRole = currentUser.role;
      }
    } catch (userError) {
      console.warn("Could not get current user info:", userError);
    }

    let users = [];
    const isAdminInstitution = currentUserRole === "ADMIN_INSTITUTION" ||
                               (window.location.pathname && window.location.pathname.includes("/admin_institution"));

    if (isAdminInstitution) {
      // For ADMIN_INSTITUTION, load only users from their institution
      let page = 0;
      let hasMore = true;
      const pageSize = 1000;

      while (hasMore) {
        const response = await fetch(`/api/v1/users/institution?page=${page}&size=${pageSize}`, {
          method: "GET",
          headers: headers,
        });

        if (!response.ok) {
          let errorMessage = "Error al cargar los usuarios";
          try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorData.detail || errorData.error || errorMessage;
            
            if (response.status === 404) {
              errorMessage = "No tienes una institución asignada. Contacta a un administrador.";
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
        const pageUsers = data.users || (Array.isArray(data) ? data : []);
        
        if (pageUsers.length > 0) {
          users = users.concat(pageUsers);
          // Check if there are more pages
          hasMore = !data.last && pageUsers.length === pageSize;
          page++;
        } else {
          hasMore = false;
        }
      }

      // Filter out current user
      if (currentUser && currentUser.id) {
        users = users.filter(user => user.id !== currentUser.id);
      }
    } else {
      // For other roles, use the original fetchUsers function
      users = await fetchUsers();
    }

    if (users.length === 0) {
      populateNewInventoryOwnerSelect([]);
      return;
    }

    // Filter users by institution if institutionId is provided
    let filteredUsers = users;
    if (institutionId && institutionId !== '') {
      const institutionIdNum = parseInt(institutionId);
      
      // First, try to get the institution name from the selected institution
      let institutionName = null;
      try {
        const token = localStorage.getItem("jwt");
        const headers = { "Content-Type": "application/json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;
        
        const institutionsResponse = await fetch("/api/v1/institutions", {
          method: "GET",
          headers: headers,
        });
        
        if (institutionsResponse.ok) {
          const institutions = await institutionsResponse.json();
          const selectedInstitution = institutions.find(inst => {
            const instId = inst.id || inst.institutionId;
            return instId && parseInt(instId) === institutionIdNum;
          });
          
          if (selectedInstitution) {
            institutionName = selectedInstitution.name || selectedInstitution.nombre;
          }
        }
      } catch (error) {
        console.warn("Error fetching institution name:", error);
      }
      
      // Filter users by institution
      filteredUsers = users.filter(user => {
        // Check different possible structures for institutionId in user object
        const userInstitutionId = user.institutionId || 
                                 user.institution?.id || 
                                 (user.institution && typeof user.institution === 'object' ? user.institution.id : null);
        
        // If user has institutionId as number, compare directly
        if (userInstitutionId !== null && userInstitutionId !== undefined) {
          const matches = parseInt(userInstitutionId) === institutionIdNum;
          if (matches) {
            console.log('User matched by institutionId:', user.fullName || user.email, 'institutionId:', userInstitutionId);
          }
          return matches;
        }
        
        // If user has institution as string (name), compare with institution name
        if (institutionName && user.institution) {
          const userInstitutionName = typeof user.institution === 'string' 
            ? user.institution 
            : (user.institution.name || user.institution.nombre);
          const matches = userInstitutionName === institutionName;
          if (matches) {
            console.log('User matched by institution name:', user.fullName || user.email, 'institution:', userInstitutionName);
          }
          return matches;
        }
        
        return false;
      });
      
      console.log(`Filtered ${filteredUsers.length} users from ${users.length} total users for institution ID ${institutionIdNum} (${institutionName || 'name not found'})`);

      if (filteredUsers.length === 0) {
        populateNewInventoryOwnerSelect([]);
        showInfoToast(
          "Sin usuarios",
          "No hay usuarios disponibles en esta institución"
        );
        return;
      }
    }

    // Populate the select with filtered users
    populateNewInventoryOwnerSelect(filteredUsers);
  } catch (error) {
    console.error("Error loading users for new inventory:", error);
    populateNewInventoryOwnerSelect([]);
  } finally {
    hideNewInventoryOwnerSelectLoading();
  }
}

function populateNewInventoryOwnerSelect(users) {
  // Initialize CustomSelect if not already done
  if (!window.newInventoryOwnerSelect) {
    window.newInventoryOwnerSelect = new CustomSelect(
      "newInventoryOwnerIdSelect",
      {
        placeholder: "Seleccionar propietario...",
        searchable: true,
      }
    );
  }

  // Format users as options
  const userOptions = [];

  if (users && users.length > 0) {
    users.forEach((user) => {
      // Format display name
      let displayName = "";
      if (user.fullName && user.fullName.trim()) {
        displayName = user.fullName;
      } else if (user.email) {
        displayName = user.email;
      } else {
        displayName = `Usuario ${user.id || "N/A"}`;
      }

      // Add additional info if available
      if (user.jobTitle) {
        displayName += ` (${user.jobTitle})`;
      }

      userOptions.push({
        value: String(user.id),
        label: displayName,
      });
    });
  } else {
    // Add no users option (will be shown as disabled in CustomSelect)
    userOptions.push({
      value: "",
      label: "No hay usuarios disponibles",
      disabled: true,
    });
  }

  window.newInventoryOwnerSelect.setOptions(userOptions);
}

function showNewInventoryOwnerSelectLoading() {
  // Initialize CustomSelect if not already done
  if (!window.newInventoryOwnerSelect) {
    window.newInventoryOwnerSelect = new CustomSelect(
      "newInventoryOwnerIdSelect",
      {
        placeholder: "Cargando usuarios...",
        searchable: true,
      }
    );
  }
  window.newInventoryOwnerSelect.setOptions([
    { value: "", label: "Cargando usuarios...", disabled: true },
  ]);
}

function hideNewInventoryOwnerSelectLoading() {
  // Loading state is cleared when populateNewInventoryOwnerSelect is called
}

const INVENTORY_INSTITUTION_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const INVENTORY_REGIONAL_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
let inventoryInstitutionsCache = null;
let inventoryInstitutionsCacheTimestamp = 0;
let inventoryRegionalsCache = null;
let inventoryRegionalsCacheTimestamp = 0;
const inventoryInstitutionsByRegionalCache = new Map();

function ensureNewInventoryInstitutionSelect() {
  if (!window.newInventoryInstitutionSelect) {
    window.newInventoryInstitutionSelect = new CustomSelect(
      "newInventoryInstitutionIdSelect",
      {
        placeholder: "Seleccionar institución...",
        searchable: true,
        onChange: function(option) {
          // When institution changes, reload users filtered by that institution
          const institutionId = option ? option.value : null;
          if (institutionId && institutionId !== '') {
            // Clear current owner selection
            if (window.newInventoryOwnerSelect) {
              window.newInventoryOwnerSelect.clear();
            }
            // Reload users filtered by institution
            loadUsersForNewInventory(institutionId);
          } else {
            // If no institution selected, clear owner select
            if (window.newInventoryOwnerSelect) {
              window.newInventoryOwnerSelect.clear();
              window.newInventoryOwnerSelect.setOptions([
                { value: "", label: "Selecciona primero una institución", disabled: true },
              ]);
            }
          }
        },
      }
    );
  }
  return window.newInventoryInstitutionSelect;
}

function ensureNewInventoryRegionalSelect() {
  if (!window.newInventoryRegionalSelect) {
    window.newInventoryRegionalSelect = new CustomSelect(
      "newInventoryRegionalIdSelect",
      {
        placeholder: "Seleccionar regional...",
        searchable: true,
        onChange: handleRegionalSelection,
      }
    );
  }
  return window.newInventoryRegionalSelect;
}

function isInventoryInstitutionLocked() {
  try {
    if (
      typeof window.shouldUseInstitutionInventories === "function" &&
      window.shouldUseInstitutionInventories()
    ) {
      return true;
    }
  } catch (error) {
    console.warn("Error determining inventory scope:", error);
  }

  const path = window.location.pathname || "";
  return (
    path.includes("/admin_institution") || path.includes("/admininstitution")
  );
}

function shouldDisplayInventoryRegionalSelect() {
  if (isInventoryInstitutionLocked()) {
    return false;
  }

  const path = window.location.pathname || "";
  if (path.includes("/superadmin")) {
    return true;
  }

  const role = (window.currentUserRole || "").toUpperCase();
  return role === "SUPERADMIN";
}

function showRegionalField() {
  const field = document.getElementById("newInventoryRegionalField");
  if (field) {
    field.classList.remove("hidden");
  }
}

function hideRegionalField() {
  const field = document.getElementById("newInventoryRegionalField");
  if (field) {
    field.classList.add("hidden");
  }
}

function updateRegionalHelperText(text) {
  const helper = document.getElementById("newInventoryRegionalHelper");
  if (helper) {
    helper.textContent =
      text ||
      "Selecciona una regional para ver sus instituciones disponibles";
  }
}

function updateInstitutionHelperText(text) {
  const helper = document.getElementById("newInventoryInstitutionHelper");
  if (helper) {
    helper.textContent =
      text || "Selecciona la institución a la que pertenecerá el inventario";
  }
}

function showLockedInstitutionInfo(name) {
  const info = document.getElementById("newInventoryInstitutionLockedInfo");
  const institutionName = document.getElementById(
    "newInventoryLockedInstitutionName"
  );

  if (institutionName) {
    institutionName.textContent = name || "Tu institución actual";
  }
  if (info) {
    info.classList.remove("hidden");
  }
}

function hideLockedInstitutionInfo() {
  const info = document.getElementById("newInventoryInstitutionLockedInfo");
  if (info) {
    info.classList.add("hidden");
  }
}

function setInstitutionSelectAwaitingRegional() {
  const selectInstance = ensureNewInventoryInstitutionSelect();
  selectInstance.clear();
  selectInstance.setOptions([
    {
      value: "",
      label: "Selecciona una regional para ver las instituciones",
      disabled: true,
    },
  ]);
  if (selectInstance.setDisabled) {
    selectInstance.setDisabled(true);
  }
  updateInstitutionHelperText(
    "Selecciona una regional para habilitar las instituciones disponibles"
  );
  hideLockedInstitutionInfo();
}

function enableInstitutionSelect() {
  const selectInstance = ensureNewInventoryInstitutionSelect();
  if (selectInstance.setDisabled) {
    selectInstance.setDisabled(false);
  }
  hideLockedInstitutionInfo();
  updateInstitutionHelperText();
}

function enforceInstitutionLock() {
  const selectInstance = ensureNewInventoryInstitutionSelect();
  if (selectInstance.setDisabled) {
    selectInstance.setDisabled(true);
  }
  const lockedName =
    (window.currentUserData && window.currentUserData.institution) ||
    "tu institución actual";
  showLockedInstitutionInfo(lockedName);
  updateInstitutionHelperText(
    "Tu rol asigna los inventarios a tu institución actual"
  );

  if (!selectInstance.getValue || !selectInstance.getValue()) {
    console.warn("No se pudo asignar la institución del usuario actual");
    if (typeof showErrorToast === "function") {
      showErrorToast(
        "Institución no encontrada",
        "No se pudo identificar la institución de tu usuario. Contacta al administrador."
      );
    }
  }
}

function resetRegionalSelection() {
  const regionalInput = document.getElementById("newInventoryRegionalId");
  if (regionalInput) {
    regionalInput.value = "";
  }
  if (window.newInventoryRegionalSelect && window.newInventoryRegionalSelect.clear) {
    window.newInventoryRegionalSelect.clear();
  }
  updateRegionalHelperText();
}

async function handleRegionalSelection(option) {
  const regionalId = option && option.value ? option.value : "";
  const regionalName = option && option.label ? option.label : "";

  if (!regionalId) {
    setInstitutionSelectAwaitingRegional();
    return;
  }

  updateRegionalHelperText(
    `Instituciones disponibles en ${regionalName || "la regional seleccionada"}`
  );

  const institutionSelect = ensureNewInventoryInstitutionSelect();
  institutionSelect.clear();
  if (institutionSelect.setDisabled) {
    institutionSelect.setDisabled(true);
  }

  await loadInstitutionsForNewInventory({ regionalId });
}

async function loadRegionalsForNewInventory() {
  showNewInventoryRegionalSelectLoading();

  try {
    const regionals = await fetchInventoryRegionals();
    populateNewInventoryRegionalSelect(regionals);
  } catch (error) {
    console.error("Error loading regionals for new inventory:", error);
    populateNewInventoryRegionalSelect([]);
  }
}

function populateNewInventoryRegionalSelect(regionals) {
  const selectInstance = ensureNewInventoryRegionalSelect();

  const regionalOptions = Array.isArray(regionals)
    ? regionals.map((regional) => ({
        value: String(regional.id),
        label: regional.name,
      }))
    : [];

  if (regionalOptions.length === 0) {
    regionalOptions.push({
      value: "",
      label: "No hay regionales disponibles",
      disabled: true,
    });
    updateRegionalHelperText("No hay regionales disponibles");
    selectInstance.setDisabled(true);
  } else {
    updateRegionalHelperText();
    selectInstance.setDisabled(false);
  }

  selectInstance.setOptions(regionalOptions);
}

function showNewInventoryRegionalSelectLoading() {
  const selectInstance = ensureNewInventoryRegionalSelect();
  selectInstance.setOptions([
    { value: "", label: "Cargando regionales...", disabled: true },
  ]);
  selectInstance.setDisabled(true);
  updateRegionalHelperText("Cargando regionales disponibles...");
}

window.isInventoryInstitutionLocked = isInventoryInstitutionLocked;
window.shouldDisplayInventoryRegionalSelect = shouldDisplayInventoryRegionalSelect;

async function loadInstitutionsForNewInventory(options = {}) {
  const {
    regionalId = null,
    forceFullList = false,
    lockToCurrentInstitution = false,
  } = options;

  const requiresRegional = shouldDisplayInventoryRegionalSelect();

  if (!forceFullList && requiresRegional && !regionalId) {
    setInstitutionSelectAwaitingRegional();
    return;
  }

  showNewInventoryInstitutionSelectLoading();

  try {
    let institutions = [];

    if (!forceFullList && regionalId) {
      institutions = await fetchInstitutionsByRegionalId(regionalId);
    } else {
      institutions = await fetchInventoryInstitutions();
    }

    populateNewInventoryInstitutionSelect(institutions);

    if (lockToCurrentInstitution || isInventoryInstitutionLocked()) {
      enforceInstitutionLock();
    } else {
      enableInstitutionSelect();
    }
  } catch (error) {
    console.error("Error loading institutions for new inventory:", error);
    populateNewInventoryInstitutionSelect([]);
  } finally {
    hideNewInventoryInstitutionSelectLoading();
  }
}

function populateNewInventoryInstitutionSelect(institutions) {
  const selectInstance = ensureNewInventoryInstitutionSelect();

  const institutionOptions = [];

  if (institutions && institutions.length > 0) {
    institutions.forEach((institution) => {
      const institutionId = getInstitutionIdFromResponse(institution);
      if (!institutionId) {
        return;
      }

      const label =
        institution.name ||
        institution.institutionName ||
        `Institución ${institutionId}`;

      institutionOptions.push({
        value: String(institutionId),
        label,
      });
    });
  }

  if (institutionOptions.length === 0) {
    institutionOptions.push({
      value: "",
      label: "No hay instituciones disponibles",
      disabled: true,
    });
    selectInstance.setDisabled(true);
    updateInstitutionHelperText("No hay instituciones disponibles para la selección actual");
  }

  if (!isInventoryInstitutionLocked() && institutionOptions.length > 0) {
    selectInstance.setDisabled(false);
    hideLockedInstitutionInfo();
  }

  selectInstance.setOptions(institutionOptions);
  autoSelectInstitutionForCurrentUser(institutions);
}

function showNewInventoryInstitutionSelectLoading() {
  const selectInstance = ensureNewInventoryInstitutionSelect();
  selectInstance.setOptions([
    { value: "", label: "Cargando instituciones...", disabled: true },
  ]);
  if (selectInstance.setDisabled) {
    selectInstance.setDisabled(true);
  }
  updateInstitutionHelperText("Cargando instituciones disponibles...");
}

function hideNewInventoryInstitutionSelectLoading() {
  // Loading state cleared in populate function
}

function autoSelectInstitutionForCurrentUser(institutions) {
  if (
    !window.currentUserData ||
    !window.currentUserData.institution ||
    !Array.isArray(institutions) ||
    institutions.length === 0 ||
    !window.newInventoryInstitutionSelect
  ) {
    return;
  }

  // Handle both string and object types for institution
  let institutionName = null;
  if (typeof window.currentUserData.institution === 'string') {
    institutionName = window.currentUserData.institution;
  } else if (typeof window.currentUserData.institution === 'object') {
    institutionName = window.currentUserData.institution.name || 
                     window.currentUserData.institution.institutionName;
  }

  if (!institutionName || typeof institutionName !== 'string') {
    return;
  }

  const targetInstitutionName = institutionName.toLowerCase();
  const matchingInstitution = institutions.find((institution) => {
    const name =
      (institution.name || institution.institutionName || "").toLowerCase();
    return name && name === targetInstitutionName;
  });

  if (matchingInstitution) {
    const institutionId = getInstitutionIdFromResponse(matchingInstitution);
    if (institutionId) {
      window.newInventoryInstitutionSelect.setValue(String(institutionId));
      // Load users for the auto-selected institution
      loadUsersForNewInventory(String(institutionId));
    }
  }
}

function getInstitutionIdFromResponse(institution) {
  if (!institution || typeof institution !== "object") {
    return null;
  }

  if (
    institution.id !== undefined &&
    institution.id !== null &&
    institution.id !== ""
  ) {
    return institution.id;
  }

  if (
    institution.institutionId !== undefined &&
    institution.institutionId !== null &&
    institution.institutionId !== ""
  ) {
    return institution.institutionId;
  }

  return null;
}

async function fetchInstitutionsByRegionalId(regionalId) {
  if (!regionalId) {
    return [];
  }

  const cacheKey = String(regionalId);
  const now = Date.now();
  const cached = inventoryInstitutionsByRegionalCache.get(cacheKey);

  if (cached && now - cached.timestamp < INVENTORY_INSTITUTION_CACHE_TTL) {
    return cached.data;
  }

  try {
    const token = localStorage.getItem("jwt");
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const response = await fetch(
      `/api/v1/institutions/institutionsByRegionalId/${regionalId}`,
      {
        method: "GET",
        headers,
      }
    );

    if (!response.ok) {
      throw new Error(
        `Failed to fetch institutions for regional ${regionalId}: ${response.status}`
      );
    }

    const data = await response.json();
    const institutions = Array.isArray(data) ? data : [];
    inventoryInstitutionsByRegionalCache.set(cacheKey, {
      data: institutions,
      timestamp: now,
    });
    return institutions;
  } catch (error) {
    console.error("Error fetching institutions by regional:", error);
    return [];
  }
}

async function fetchInventoryInstitutions() {
  const now = Date.now();
  if (
    inventoryInstitutionsCache &&
    now - inventoryInstitutionsCacheTimestamp < INVENTORY_INSTITUTION_CACHE_TTL
  ) {
    return inventoryInstitutionsCache;
  }

  try {
    const token = localStorage.getItem("jwt");
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const response = await fetch("/api/v1/institutions", {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch institutions: ${response.status}`);
    }

    const data = await response.json();
    const institutions = Array.isArray(data) ? data : [];
    inventoryInstitutionsCache = institutions;
    inventoryInstitutionsCacheTimestamp = now;
    return institutions;
  } catch (error) {
    console.error("Error fetching institutions:", error);
    return [];
  }
}

async function fetchInventoryRegionals() {
  const now = Date.now();
  if (
    inventoryRegionalsCache &&
    now - inventoryRegionalsCacheTimestamp < INVENTORY_REGIONAL_CACHE_TTL
  ) {
    return inventoryRegionalsCache;
  }

  try {
    const token = localStorage.getItem("jwt");
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const response = await fetch("/api/v1/regional", {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch regionals: ${response.status}`);
    }

    const data = await response.json();
    const regionals = Array.isArray(data) ? data : [];
    inventoryRegionalsCache = regionals;
    inventoryRegionalsCacheTimestamp = now;
    return regionals;
  } catch (error) {
    console.error("Error fetching regionals:", error);
    return [];
  }
}

function closeNewInventoryModal() {
  const modal = document.getElementById("newInventoryModal");
  if (modal) {
    modal.classList.add("hidden");
  }

  // Clear form
  const form = document.getElementById("newInventoryForm");
  if (form) {
    form.reset();
  }

  // Clear image preview
  const imagePreview = document.getElementById("newInventoryImagePreview");
  if (imagePreview) {
    imagePreview.innerHTML = '<i class="fas fa-box"></i>';
    imagePreview.classList.remove("has-image");
  }

  // Clear image input
  const imageInput = document.getElementById("newInventoryPhoto");
  if (imageInput) {
    imageInput.value = "";
  }

  // Clear owner select
  if (window.newInventoryOwnerSelect) {
    window.newInventoryOwnerSelect.clear();
  }

  // Clear institution select
  if (window.newInventoryInstitutionSelect) {
    window.newInventoryInstitutionSelect.clear();
  }

  if (window.newInventoryInstitutionSelect && window.newInventoryInstitutionSelect.setDisabled && !isInventoryInstitutionLocked()) {
    window.newInventoryInstitutionSelect.setDisabled(false);
  }

  hideLockedInstitutionInfo();
  resetRegionalSelection();
  if (shouldDisplayInventoryRegionalSelect()) {
    setInstitutionSelectAwaitingRegional();
  }
}

// Export new inventory modal functions
window.showNewInventoryModal = showNewInventoryModal;
window.closeNewInventoryModal = closeNewInventoryModal;

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
    const modal = document.getElementById("assignManagerModal");
    if (modal) {
      modal.classList.remove("hidden");
    }
  } catch (error) {
    console.error("Error loading inventory for manager assignment:", error);
    showErrorToast(
      "Error",
      "No se pudieron cargar los datos del inventario: " + error.message
    );
  }
}

async function populateAssignManagerModal(inventory) {
  // Validate inventory data
  if (!inventory) {
    console.error("No inventory data provided to populateAssignManagerModal");
    return;
  }

  const inventoryName = document.getElementById("assignManagerInventoryName");
  const inventoryId = document.getElementById("assignManagerInventoryId");

  if (inventoryName) {
    inventoryName.textContent = inventory.name || "Sin nombre";
  } else {
    console.warn("assignManagerInventoryName element not found");
  }

  if (inventoryId) {
    inventoryId.textContent = inventory.id || "N/A";
  } else {
    console.warn("assignManagerInventoryId element not found");
  }

  // Store current inventory data globally for role assignment
  window.currentRoleAssignmentInventory = inventory;

  // Load users into the single select dropdown
  await loadUsersForRoleAssignment(inventory.id);

  // Reset role selection
  resetRoleSelection();
}

async function loadUsersForRoleAssignment(inventoryId) {
  // Show loading state for user select
  showRoleUserSelectLoading();

  try {
    // Get inventory data to find its regional
    const inventory = window.currentRoleAssignmentInventory || 
                     inventoryData.inventories?.find(inv => inv.id == inventoryId);
    
    console.log("Loading users for role assignment - Inventory:", inventory);
    
    if (!inventory) {
      console.warn("Inventory not found, loading all users");
      const users = await fetchUsers();
      populateRoleUserSelect(users);
      return;
    }

    // Get regional ID from inventory
    let inventoryRegionalId = null;
    
    // Try different possible structures for regional ID
    if (inventory.regionalId) {
      inventoryRegionalId = inventory.regionalId;
    } else if (inventory.regional?.id) {
      inventoryRegionalId = inventory.regional.id;
    } else if (inventory.institution?.regional?.id) {
      inventoryRegionalId = inventory.institution.regional.id;
    } else if (inventory.institutionId) {
      // If we only have institutionId, fetch the institution to get its regional
      try {
        const token = localStorage.getItem("jwt");
        const headers = { "Content-Type": "application/json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;
        
        const institutionsResponse = await fetch("/api/v1/institutions", {
          method: "GET",
          headers: headers,
        });
        
        if (institutionsResponse.ok) {
          const institutions = await institutionsResponse.json();
          const institution = institutions.find(inst => {
            const instId = inst.id || inst.institutionId;
            return instId && parseInt(instId) === parseInt(inventory.institutionId);
          });
          
          if (institution) {
            inventoryRegionalId = institution.regionalId || institution.regional?.id;
          }
        }
      } catch (error) {
        console.warn("Error fetching institution to get regional:", error);
      }
    }

    console.log("Inventory Regional ID:", inventoryRegionalId);

    // Fetch all users from API
    const allUsers = await fetchUsers();
    console.log("Total users fetched:", allUsers.length);

    if (allUsers.length === 0) {
      populateRoleUserSelect([]);
      return;
    }

    // Filter users by regional if we have a regional ID
    let filteredUsers = allUsers;
    if (inventoryRegionalId) {
      const regionalIdNum = parseInt(inventoryRegionalId);
      
      // Get all institutions for this regional to filter users
      let institutionIdsInRegional = [];
      let institutionsInRegional = [];
      try {
        const token = localStorage.getItem("jwt");
        const headers = { "Content-Type": "application/json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;
        
        const institutionsResponse = await fetch(`/api/v1/institutions/institutionsByRegionalId/${regionalIdNum}`, {
          method: "GET",
          headers: headers,
        });
        
        if (institutionsResponse.ok) {
          institutionsInRegional = await institutionsResponse.json();
          institutionIdsInRegional = institutionsInRegional.map(inst => {
            return parseInt(inst.id || inst.institutionId);
          }).filter(id => !isNaN(id));
        }
      } catch (error) {
        console.warn("Error fetching institutions for regional:", error);
      }
      
      console.log("Institutions in regional:", institutionIdsInRegional);
      
      // Filter users by regional
      filteredUsers = allUsers.filter(user => {
        // Check if user has institutionId that matches an institution in the regional
        const userInstitutionId = user.institutionId || 
                                 user.institution?.id || 
                                 (user.institution && typeof user.institution === 'object' ? user.institution.id : null);
        
        if (userInstitutionId && institutionIdsInRegional.length > 0) {
          const userInstIdNum = parseInt(userInstitutionId);
          const matches = institutionIdsInRegional.includes(userInstIdNum);
          if (matches) {
            console.log("User matched by institutionId:", user.fullName || user.email, "institutionId:", userInstIdNum);
          }
          return matches;
        }
        
        // Fallback: check if user has regionalId directly
        const userRegionalId = user.regionalId || 
                              user.regional?.id ||
                              user.institution?.regional?.id;
        
        if (userRegionalId) {
          const matches = parseInt(userRegionalId) === regionalIdNum;
          if (matches) {
            console.log("User matched by regionalId:", user.fullName || user.email, "regionalId:", userRegionalId);
          }
          return matches;
        }
        
        // If user has institution as string (name), try to match by institution name
        if (user.institution && typeof user.institution === 'string' && institutionsInRegional.length > 0) {
          const userInstitutionName = user.institution;
          const matchingInstitution = institutionsInRegional.find(inst => {
            const instName = inst.name || inst.nombre;
            return instName && instName === userInstitutionName;
          });
          
          if (matchingInstitution) {
            console.log("User matched by institution name:", user.fullName || user.email, "institution:", userInstitutionName);
            return true;
          }
        }
        
        return false;
      });

      console.log(`Filtered ${filteredUsers.length} users from ${allUsers.length} total users for regional ID ${regionalIdNum}`);

      if (filteredUsers.length === 0) {
        populateRoleUserSelect([]);
        showInfoToast(
          "Sin usuarios",
          "No hay usuarios disponibles en la regional de este inventario"
        );
        return;
      }
    } else {
      console.warn("No regional ID found for inventory, showing all users");
    }

    // Populate the user select with filtered users
    populateRoleUserSelect(filteredUsers);
  } catch (error) {
    console.error("Error loading users for role assignment:", error);
    populateRoleUserSelect([]);
  } finally {
    // Hide loading state
    hideRoleUserSelectLoading();
  }
}

function populateRoleUserSelect(users) {
  // Initialize CustomSelect if not already done
  if (!window.roleUserSelect) {
    window.roleUserSelect = new CustomSelect("roleUserIdSelect", {
      placeholder: "Seleccionar usuario...",
      searchable: true,
    });
  }

  // Format users as options
  const userOptions = [];

  if (users && users.length > 0) {
    users.forEach((user) => {
      // Format display name
      let displayName = "";
      if (user.fullName && user.fullName.trim()) {
        displayName = user.fullName;
      } else if (user.email) {
        displayName = user.email;
      } else {
        displayName = `Usuario ${user.id || "N/A"}`;
      }

      // Add additional info if available
      if (user.jobTitle) {
        displayName += ` (${user.jobTitle})`;
      }

      userOptions.push({
        value: String(user.id),
        label: displayName,
      });
    });
  } else {
    // Add no users option (will be shown as disabled in CustomSelect)
    userOptions.push({
      value: "",
      label: "No hay usuarios disponibles",
      disabled: true,
    });
  }

  window.roleUserSelect.setOptions(userOptions);
}

function showRoleUserSelectLoading() {
  // Initialize CustomSelect if not already done
  if (!window.roleUserSelect) {
    window.roleUserSelect = new CustomSelect("roleUserIdSelect", {
      placeholder: "Cargando usuarios...",
      searchable: true,
    });
  }
  window.roleUserSelect.setOptions([
    { value: "", label: "Cargando usuarios...", disabled: true },
  ]);
}

function hideRoleUserSelectLoading() {
  // Loading state is cleared when populateRoleUserSelect is called
}

// Role selection function
function selectRole(role) {
  const managerBtn = document.getElementById("managerRoleBtn");
  const signatoryBtn = document.getElementById("signatoryRoleBtn");
  const selectedRoleInput = document.getElementById("selectedRole");
  const roleDescription = document.getElementById("roleDescription");

  // Remove selected class from both buttons
  if (managerBtn) {
    managerBtn.classList.remove(
      "border-[#00AF00]",
      "bg-green-50",
      "text-[#00AF00]"
    );
    managerBtn.classList.add("border-gray-300", "text-gray-700");
  }
  if (signatoryBtn) {
    signatoryBtn.classList.remove(
      "border-[#00AF00]",
      "bg-green-50",
      "text-[#00AF00]"
    );
    signatoryBtn.classList.add("border-gray-300", "text-gray-700");
  }

  // Add selected class to clicked button
  if (role === "manager" && managerBtn) {
    managerBtn.classList.add(
      "border-[#00AF00]",
      "bg-green-50",
      "text-[#00AF00]"
    );
    managerBtn.classList.remove("border-gray-300", "text-gray-700");
    if (roleDescription) {
      roleDescription.textContent =
        "El inventario será administrado por el manejador seleccionado";
    }
  } else if (role === "signatory" && signatoryBtn) {
    signatoryBtn.classList.add(
      "border-[#00AF00]",
      "bg-green-50",
      "text-[#00AF00]"
    );
    signatoryBtn.classList.remove("border-gray-300", "text-gray-700");
    if (roleDescription) {
      roleDescription.textContent =
        "El usuario seleccionado firmará el inventario";
    }
  }

  // Set the hidden input value
  if (selectedRoleInput) {
    selectedRoleInput.value = role;
  }
}

function resetRoleSelection() {
  const managerBtn = document.getElementById("managerRoleBtn");
  const signatoryBtn = document.getElementById("signatoryRoleBtn");
  const selectedRoleInput = document.getElementById("selectedRole");
  const roleDescription = document.getElementById("roleDescription");

  // Remove selected class from both buttons
  if (managerBtn) {
    managerBtn.classList.remove(
      "border-[#00AF00]",
      "bg-green-50",
      "text-[#00AF00]"
    );
    managerBtn.classList.add("border-gray-300", "text-gray-700");
  }
  if (signatoryBtn) {
    signatoryBtn.classList.remove(
      "border-[#00AF00]",
      "bg-green-50",
      "text-[#00AF00]"
    );
    signatoryBtn.classList.add("border-gray-300", "text-gray-700");
  }

  // Clear hidden input
  if (selectedRoleInput) {
    selectedRoleInput.value = "";
  }

  // Reset description
  if (roleDescription) {
    roleDescription.textContent = "Selecciona un rol para continuar";
  }
}

// Make selectRole available globally
window.selectRole = selectRole;

async function loadManagersForAssignment() {
  // This function is now deprecated - use loadUsersForRoleAssignment instead
  console.warn("loadManagersForAssignment is deprecated");
}

function populateManagerSelect(users) {
  // This function is now deprecated - use populateRoleUserSelect instead
  console.warn("populateManagerSelect is deprecated");
}

function showManagerSelectLoading() {
  // This function is now deprecated
  console.warn("showManagerSelectLoading is deprecated");
}

function hideManagerSelectLoading() {
  // This function is now deprecated
  console.warn("hideManagerSelectLoading is deprecated");
}

function closeAssignManagerModal() {
  const modal = document.getElementById("assignManagerModal");
  if (modal) {
    modal.classList.add("hidden");
  }

  // Clear form
  if (window.roleUserSelect) {
    window.roleUserSelect.clear();
  }

  // Reset role selection
  resetRoleSelection();

  inventoryData.currentInventoryId = null;
}

// Signatory Assignment Functions (now deprecated)
async function loadSignatoriesForAssignment() {
  // This function is now deprecated - use loadUsersForRoleAssignment instead
  console.warn("loadSignatoriesForAssignment is deprecated");
}

function populateSignatorySelect(users) {
  // This function is now deprecated - use populateRoleUserSelect instead
  console.warn("populateSignatorySelect is deprecated");
}

function showSignatorySelectLoading() {
  // This function is now deprecated
  console.warn("showSignatorySelectLoading is deprecated");
}

function hideSignatorySelectLoading() {
  // This function is now deprecated
  console.warn("hideSignatorySelectLoading is deprecated");
}

// Toast notification helpers for manager assignment operations
function showAssignManagerSuccessToast() {
  showSuccessToast(
    "Manejador asignado",
    "El manejador se ha asignado correctamente al inventario."
  );
}

//
function showAssignManagerErrorToast(message) {
  showErrorToast(
    "Error al asignar manejador",
    message || "No se pudo asignar el manejador."
  );
}

// Toast notification helpers for signatory assignment operations
function showAssignSignatorySuccessToast() {
  showSuccessToast(
    "Firmante asignado",
    "El firmante se ha asignado correctamente al inventario."
  );
}

function showAssignSignatoryErrorToast(message) {
  showErrorToast(
    "Error al asignar firmante",
    message || "No se pudo asignar el firmante."
  );
}

window.showAssignManagerModal = showAssignManagerModal;
window.closeAssignManagerModal = closeAssignManagerModal;
window.showAssignManagerSuccessToast = showAssignManagerSuccessToast;
window.showAssignManagerErrorToast = showAssignManagerErrorToast;
window.showAssignSignatorySuccessToast = showAssignSignatorySuccessToast;
window.showAssignSignatoryErrorToast = showAssignSignatoryErrorToast;

// Function to fetch users from API
async function fetchUsers() {
  try {
    const token = localStorage.getItem("jwt");
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    // Fetch all users with pagination
    let allUsers = [];
    let page = 0;
    let hasMore = true;
    const pageSize = 1000;

    while (hasMore) {
      const response = await fetch(`/api/v1/users?page=${page}&size=${pageSize}`, {
        method: "GET",
        headers: headers,
      });

      if (response.ok) {
        const pagedResponse = await response.json();

        // Handle both paginated response (PagedUserResponse) and direct array
        let pageUsers = [];
        if (pagedResponse.users && Array.isArray(pagedResponse.users)) {
          // Paginated response structure
          pageUsers = pagedResponse.users;
          // Check if there are more pages
          hasMore = !pagedResponse.last && pageUsers.length === pageSize;
        } else if (Array.isArray(pagedResponse)) {
          // Direct array response (fallback)
          pageUsers = pagedResponse;
          hasMore = false; // If it's a direct array, assume it's all the data
        } else {
          console.warn(
            "Unexpected response format from /api/v1/users:",
            pagedResponse
          );
          hasMore = false;
        }

        if (pageUsers.length > 0) {
          allUsers = allUsers.concat(pageUsers);
          page++;
        } else {
          hasMore = false;
        }
      } else {
        throw new Error(`Failed to fetch users: ${response.status}`);
      }
    }

    return allUsers;
  } catch (error) {
    console.error("Error fetching users:", error);
    return [];
  }
}

// Function to populate user select using CustomSelect
function populateUserSelect(users) {
  // Initialize CustomSelect if not already done
  if (!window.assignUserSelect) {
    window.assignUserSelect = new CustomSelect("assignUserIdSelect", {
      placeholder: "Seleccionar usuario...",
      searchable: true,
    });
  }

  // Format users as options
  const userOptions = [];

  if (users && users.length > 0) {
    users.forEach((user) => {
      // Format display name
      let displayName = "";
      if (user.fullName && user.fullName.trim()) {
        displayName = user.fullName;
      } else if (user.email) {
        displayName = user.email;
      } else {
        displayName = `Usuario ${user.id || "N/A"}`;
      }

      // Add additional info if available
      if (user.jobTitle) {
        displayName += ` (${user.jobTitle})`;
      }

      userOptions.push({
        value: String(user.id),
        label: displayName,
      });
    });
  } else {
    // Add no users option (will be shown as disabled in CustomSelect)
    userOptions.push({
      value: "",
      label: "No hay usuarios disponibles",
      disabled: true,
    });
  }

  window.assignUserSelect.setOptions(userOptions);
}

// Function to show loading state in user select
function showUserSelectLoading() {
  // Initialize CustomSelect if not already done
  if (!window.assignUserSelect) {
    window.assignUserSelect = new CustomSelect("assignUserIdSelect", {
      placeholder: "Cargando usuarios...",
      searchable: true,
    });
  }
  window.assignUserSelect.setOptions([
    { value: "", label: "Cargando usuarios...", disabled: true },
  ]);
}

// Function to hide loading state in user select
function hideUserSelectLoading() {
  // Loading state is cleared when populateUserSelect is called
  // This function is kept for compatibility but doesn't need to do anything
  // as the CustomSelect will be updated by populateUserSelect
}

// User Details Modal Functions (for Tree)
async function showUserDetailsModal(userId) {
  const modal = document.getElementById("userDetailsModal");
  if (!modal) {
    console.error("User details modal not found");
    return;
  }

  // Show modal
  modal.classList.remove("hidden");

  // Show loading state
  const loadingSpinner = document.getElementById("userDetailsLoading");
  const contentDiv = document.getElementById("userDetailsContent");

  if (loadingSpinner) {
    loadingSpinner.classList.remove("hidden");
  }
  if (contentDiv) {
    contentDiv.style.display = "none";
  }

  try {
    // Fetch user data
    const userData = await fetchUserById(userId);

    // Hide loading
    if (loadingSpinner) {
      loadingSpinner.classList.add("hidden");
    }
    if (contentDiv) {
      contentDiv.style.display = "block";
    }

    // Populate modal with user data
    populateUserDetailsModal(userData);
  } catch (error) {
    console.error("Error loading user details:", error);

    // Hide loading
    if (loadingSpinner) {
      loadingSpinner.classList.add("hidden");
    }

    // Show error in content area
    if (contentDiv) {
      contentDiv.style.display = "block";
      contentDiv.innerHTML = `
        <div class="flex flex-col items-center justify-center p-8 text-center">
          <i class="fas fa-exclamation-triangle text-red-500 text-5xl mb-4"></i>
          <h3 class="text-xl font-semibold text-gray-800 dark:text-white mb-2">Error al cargar usuario</h3>
          <p class="text-gray-600 dark:text-gray-400 mb-4">${error.message}</p>
          <button onclick="showUserDetailsModal(${userId})" 
            class="px-4 py-2 bg-[#00AF00] hover:bg-[#008800] text-white rounded-xl transition-colors">
            <i class="fas fa-redo mr-2"></i>
            Reintentar
          </button>
        </div>
      `;
    }
  }
}

function closeUserDetailsModal() {
  const modal = document.getElementById("userDetailsModal");
  if (modal) {
    modal.classList.add("hidden");
  }
}

async function fetchUserById(userId) {
  try {
    const token = localStorage.getItem("jwt");
    if (!token) {
      throw new Error("No se encontró token de autenticación");
    }

    const response = await fetch(`/api/v1/users/${userId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Usuario no encontrado");
      } else if (response.status === 401) {
        throw new Error("Sesión expirada. Por favor inicia sesión nuevamente.");
      } else if (response.status === 403) {
        throw new Error("No tienes permisos para ver esta información.");
      }
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching user by ID:", error);
    throw error;
  }
}

function populateUserDetailsModal(user) {
  // Avatar
  const avatarElement = document.getElementById("userDetailsAvatar");
  if (avatarElement) {
    if (user.imgUrl) {
      avatarElement.innerHTML = `<img src="${user.imgUrl}" alt="Avatar" class="w-full h-full object-cover">`;
    } else {
      const initial = (user.fullName || user.email || "U")
        .charAt(0)
        .toUpperCase();
      avatarElement.innerHTML = `<span class="text-white font-bold text-3xl">${initial}</span>`;
    }
  }

  // Full Name
  const fullNameElement = document.getElementById("userDetailsFullName");
  if (fullNameElement) {
    fullNameElement.textContent = user.fullName || "Sin nombre completo";
  }

  // Email
  const emailElement = document.getElementById("userDetailsEmail");
  if (emailElement) {
    emailElement.textContent = user.email || "Sin email";
  }

  // Status
  const statusElement = document.getElementById("userDetailsStatus");
  if (statusElement) {
    statusElement.textContent = user.status ? "Activo" : "Inactivo";
    statusElement.className = `px-3 py-1 rounded-full text-xs font-medium ${
      user.status
        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
        : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
    }`;
  }

  // ID
  const idElement = document.getElementById("userDetailsId");
  if (idElement) {
    idElement.textContent = user.id || "N/A";
  }

  // Role
  const roleElement = document.getElementById("userDetailsRole");
  if (roleElement) {
    roleElement.textContent = user.role || "Sin rol";
  }

  // Job Title
  const jobTitleElement = document.getElementById("userDetailsJobTitle");
  if (jobTitleElement) {
    jobTitleElement.textContent = user.jobTitle || "Sin cargo";
  }

  // Labor Department
  const laborDepartmentElement = document.getElementById(
    "userDetailsLaborDepartment"
  );
  if (laborDepartmentElement) {
    laborDepartmentElement.textContent =
      user.laborDepartment || "Sin departamento";
  }

  // Institution
  const institutionElement = document.getElementById("userDetailsInstitution");
  if (institutionElement) {
    institutionElement.textContent = user.institution || "Sin institución";
  }
}

// Function to manually update user details modal theme
function updateUserDetailsModalTheme() {
  const modal = document.getElementById("userDetailsModal");
  if (!modal || modal.classList.contains("hidden")) {
    // Modal is not visible, no need to update
    return;
  }

  // The CSS in dark-mode.css with specific selectors will handle the styling
  // This function exists to force a re-render if needed
  // For now, we just ensure the modal re-evaluates its styles
}

// Listen for theme changes to update user details modal if open
document.addEventListener("themeChanged", function (event) {
  updateUserDetailsModalTheme();
});

// Setup MutationObserver to detect theme changes on html element
function setupUserDetailsModalThemeObserver() {
  const htmlElement = document.documentElement;
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (
        mutation.type === "attributes" &&
        mutation.attributeName === "class"
      ) {
        // Theme changed, update modal if visible
        updateUserDetailsModalTheme();
      }
    });
  });
  observer.observe(htmlElement, { attributes: true });
}

// Initialize observer when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener(
    "DOMContentLoaded",
    setupUserDetailsModalThemeObserver
  );
} else {
  setupUserDetailsModalThemeObserver();
}

// Export user details functions
window.showUserDetailsModal = showUserDetailsModal;
window.closeUserDetailsModal = closeUserDetailsModal;
window.updateUserDetailsModalTheme = updateUserDetailsModalTheme;
