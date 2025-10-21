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
function showNewInventoryModal() {
    if (typeof window.showNewInventoryModal === 'function') {
        window.showNewInventoryModal();
    }
}

function closeNewInventoryModal() {
    if (typeof window.closeNewInventoryModal === 'function') {
        window.closeNewInventoryModal();
    }
}

function showViewInventoryModal(inventoryId) {
    if (typeof window.showViewInventoryModal === 'function') {
        window.showViewInventoryModal(inventoryId);
    }
}

function closeViewInventoryModal() {
    if (typeof window.closeViewInventoryModal === 'function') {
        window.closeViewInventoryModal();
    }
}

function showEditInventoryModal(inventoryId) {
    if (typeof window.showEditInventoryModal === 'function') {
        window.showEditInventoryModal(inventoryId);
    }
}

function closeEditInventoryModal() {
    if (typeof window.closeEditInventoryModal === 'function') {
        window.closeEditInventoryModal();
    }
}

function showDeleteInventoryModal(inventoryId) {
    if (typeof window.showDeleteInventoryModal === 'function') {
        window.showDeleteInventoryModal(inventoryId);
    }
}

function closeDeleteInventoryModal() {
    if (typeof window.closeDeleteInventoryModal === 'function') {
        window.closeDeleteInventoryModal();
    }
}

function showAssignInventoryModal(inventoryId) {
    if (typeof window.showAssignInventoryModal === 'function') {
        window.showAssignInventoryModal(inventoryId);
    }
}

function closeAssignInventoryModal() {
    if (typeof window.closeAssignInventoryModal === 'function') {
        window.closeAssignInventoryModal();
    }
}

function showAssignManagerModal(inventoryId) {
    if (typeof window.showAssignManagerModal === 'function') {
        window.showAssignManagerModal(inventoryId);
    }
}

function closeAssignManagerModal() {
    if (typeof window.closeAssignManagerModal === 'function') {
        window.closeAssignManagerModal();
    }
}

// Action functions
function viewInventory(inventoryId) {
    if (typeof window.viewInventory === 'function') {
        window.viewInventory(inventoryId);
    }
}

function editInventory(inventoryId) {
    if (typeof window.editInventory === 'function') {
        window.editInventory(inventoryId);
    }
}

function deleteInventory(inventoryId) {
    if (typeof window.showDeleteInventoryModal === 'function') {
        window.showDeleteInventoryModal(inventoryId);
    }
}

function showInventoryAssignment(inventoryId) {
    if (typeof window.showInventoryAssignment === 'function') {
        window.showInventoryAssignment(inventoryId);
    }
}

function showInventoryManagerAssignment(inventoryId) {
    if (typeof window.showInventoryManagerAssignment === 'function') {
        window.showInventoryManagerAssignment(inventoryId);
    }
}

// Filter functions
function setLocationFilter(location) {
    if (typeof window.setLocationFilter === 'function') {
        window.setLocationFilter(location);
    }
}

function setStatusFilter(status) {
    if (typeof window.setStatusFilter === 'function') {
        window.setStatusFilter(status);
    }
}

function applySearchFilter() {
    if (typeof window.applySearchFilter === 'function') {
        window.applySearchFilter();
    }
}

// Pagination functions
function changePage(page) {
    if (typeof window.changePage === 'function') {
        window.changePage(page);
    }
}

// Form submission handlers
async function handleNewInventorySubmit(e) {
    if (typeof window.handleNewInventorySubmit === 'function') {
        await window.handleNewInventorySubmit(e);
    }
}

async function handleEditInventorySubmit(e) {
    if (typeof window.handleEditInventorySubmit === 'function') {
        await window.handleEditInventorySubmit(e);
    }
}

async function handleAssignInventorySubmit(e) {
    if (typeof window.handleAssignInventorySubmit === 'function') {
        await window.handleAssignInventorySubmit(e);
    }
}

async function handleAssignManagerSubmit(e) {
    if (typeof window.handleAssignManagerSubmit === 'function') {
        await window.handleAssignManagerSubmit(e);
    }
}

// Load inventory data function
async function loadInventoryData() {
    if (typeof window.loadInventoryData === 'function') {
        await window.loadInventoryData();
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
window.showNewInventoryModal = showNewInventoryModal;
window.closeNewInventoryModal = closeNewInventoryModal;
window.showViewInventoryModal = showViewInventoryModal;
window.closeViewInventoryModal = closeViewInventoryModal;
window.showEditInventoryModal = showEditInventoryModal;
window.closeEditInventoryModal = closeEditInventoryModal;
window.showDeleteInventoryModal = showDeleteInventoryModal;
window.closeDeleteInventoryModal = closeDeleteInventoryModal;
window.showAssignInventoryModal = showAssignInventoryModal;
window.closeAssignInventoryModal = closeAssignInventoryModal;
window.showAssignManagerModal = showAssignManagerModal;
window.closeAssignManagerModal = closeAssignManagerModal;

window.viewInventory = viewInventory;
window.editInventory = editInventory;
window.deleteInventory = deleteInventory;
window.showInventoryAssignment = showInventoryAssignment;
window.showInventoryManagerAssignment = showInventoryManagerAssignment;

window.setLocationFilter = setLocationFilter;
window.setStatusFilter = setStatusFilter;
window.applySearchFilter = applySearchFilter;
window.changePage = changePage;

window.handleNewInventorySubmit = handleNewInventorySubmit;
window.handleEditInventorySubmit = handleEditInventorySubmit;
window.handleAssignInventorySubmit = handleAssignInventorySubmit;
window.handleAssignManagerSubmit = handleAssignManagerSubmit;

window.loadInventoryData = loadInventoryData;
window.logout = logout;