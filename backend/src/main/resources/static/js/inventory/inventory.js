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
async function loadInventoryData() {
    if (typeof window.loadCurrentUserInfo === 'function') {
        await window.loadCurrentUserInfo();
    }
    if (typeof window.loadInventories === 'function') {
        await window.loadInventories();
    }
    if (typeof window.updateInventoryUI === 'function') {
        window.updateInventoryUI();
    }
}

// Logout function (consistent with users module)
function logout() {
    if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('jwt');
    }
    window.location.href = '/';
}

// Make global functions available

window.deleteInventory = deleteInventory;



window.loadInventoryData = loadInventoryData;
window.logout = logout;