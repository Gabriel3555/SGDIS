// Inventory Management Module - Main Entry Point
// This file serves as the main entry point for the inventory module
// It follows the same modular pattern as the users module

document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on the inventory page by multiple methods
    const isInventoryPage =
        window.location.pathname.includes('/inventory') ||
        window.location.pathname.includes('inventory.html') ||
        document.querySelector('#inventoryStatsContainer') !== null ||
        document.querySelector('#inventoryCardsContainer') !== null ||
        document.querySelector('#newInventoryModal') !== null;

    if (isInventoryPage) {
        // Small delay to ensure all elements are rendered
        setTimeout(() => {
            initializeInventoryPage();
        }, 100);
    }
});

// Initialize inventory page
function initializeInventoryPage() {
    loadInventoryData();
    setupEventListeners();
    
    // Check if we need to open a specific inventory modal
    const urlParams = new URLSearchParams(window.location.search);
    const viewInventoryId = urlParams.get('viewInventory');
    if (viewInventoryId) {
        // Small delay to ensure data is loaded
        setTimeout(() => {
            if (window.showViewInventoryModal) {
                window.showViewInventoryModal(parseInt(viewInventoryId, 10));
            }
        }, 500);
    }
}

// Setup event listeners for inventory-specific elements
function setupEventListeners() {
    // New inventory form
    const newInventoryForm = document.getElementById('newInventoryForm');
    if (newInventoryForm) {
        newInventoryForm.addEventListener('submit', handleNewInventorySubmit);
    }

    // Edit inventory form (if it exists)
    const editInventoryForm = document.getElementById('editInventoryForm');
    if (editInventoryForm) {
        editInventoryForm.addEventListener('submit', handleEditInventorySubmit);
    }

    // Edit inventory status switch
    const editInventoryStatus = document.getElementById('editInventoryStatus');
    if (editInventoryStatus) {
        editInventoryStatus.addEventListener('change', function() {
            const statusLabel = document.getElementById('editInventoryStatusLabel');
            if (statusLabel) {
                statusLabel.textContent = this.checked ? 'Activo' : 'Inactivo';
            }
        });
    }

    // Assign inventory form (if it exists)
    const assignInventoryForm = document.getElementById('assignInventoryForm');
    if (assignInventoryForm) {
        assignInventoryForm.addEventListener('submit', handleAssignInventorySubmit);
    }

    // Assign manager form (if it exists)
    const assignManagerForm = document.getElementById('assignManagerForm');
    if (assignManagerForm) {
        assignManagerForm.addEventListener('submit', handleAssignManagerSubmit);
    }

    // Delete confirmation buttons
    const deleteButtons = document.querySelectorAll('[data-action="delete-inventory"]');
    deleteButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const inventoryId = this.getAttribute('data-inventory-id');
            if (inventoryId) {
                showDeleteInventoryModal(inventoryId);
            }
        });
    });
}

// Global functions that need to be available for HTML onclick handlers
// These functions delegate to the appropriate modules

// Modal functions

// Action functions
async function deleteInventory(inventoryId) {
    try {
        //showDeleteInventoryModal(inventoryId);
        //return;

        // Call the deleteInventory function from inventory-api.js
        await deleteInventoryFromApi(inventoryId);

        // Optionally, reload the inventory data to update the UI
        await loadInventoryData();

        // Show a success message
        showInfoToast('Inventario eliminado', 'El inventario se ha eliminado correctamente.');
    } catch (error) {
        console.error('Error deleting inventory:', error);
        showErrorToast('Error al eliminar', error.message || 'No se pudo eliminar el inventario.');
    }
}

// Filter functions

// Pagination functions

// Form submission handlers

// Load inventory data function
// Note: This function should delegate to the one in inventory-api.js
// But to avoid conflicts, we'll check if the API version exists and use it
async function loadInventoryData() {
    // Check if showLoadingState and hideLoadingState exist (from inventory-data.js)
    if (typeof window.showLoadingState === 'function' && typeof window.hideLoadingState === 'function') {
        window.showLoadingState();
    }
    
    try {
        if (typeof window.loadCurrentUserInfo === 'function') {
            await window.loadCurrentUserInfo();
        }
        if (typeof window.loadInventories === 'function') {
            await window.loadInventories();
        }
        if (typeof window.updateInventoryUI === 'function') {
            window.updateInventoryUI();
        }
    } catch (error) {
        console.error('Error loading inventory data:', error);
    } finally {
        // Always hide loading state
        if (typeof window.hideLoadingState === 'function') {
            window.hideLoadingState();
        }
    }
}

// Logout function (consistent with users module)
function logout() {
    if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('jwt');
    }
    // Clear JWT cookie
    document.cookie = 'jwt=; path=/; max-age=0';
    // Clear refresh token from cookies
    document.cookie = 'refreshToken=; path=/; max-age=0';
    window.location.href = '/';
}

// Make global functions available

window.deleteInventory = deleteInventory;

// Don't override loadInventoryData if it's already set (from inventory-api.js)
// The inventory-api.js version handles loading states correctly
if (!window.loadInventoryData || typeof window.loadInventoryData !== 'function') {
    window.loadInventoryData = loadInventoryData;
}

window.logout = logout;