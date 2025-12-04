// Transfers Forms Functions

// Initialize forms when modals are opened
document.addEventListener('DOMContentLoaded', function() {
    const newTransferForm = document.getElementById('newTransferForm');
    if (newTransferForm) {
        newTransferForm.addEventListener('submit', handleNewTransferSubmit);
    }
    
    const approveTransferForm = document.getElementById('approveTransferForm');
    if (approveTransferForm) {
        approveTransferForm.addEventListener('submit', handleApproveTransferSubmit);
    }
    
    const rejectTransferForm = document.getElementById('rejectTransferForm');
    if (rejectTransferForm) {
        rejectTransferForm.addEventListener('submit', handleRejectTransferSubmit);
    }
});

function populateNewTransferForm(itemId = null) {
    const form = document.getElementById('newTransferForm');
    if (!form) return;
    
    // Check if user is superadmin, warehouse, or admin regional
    const isSuperAdmin = (window.currentUserRole && window.currentUserRole.toUpperCase() === 'SUPERADMIN') || 
                         (window.location.pathname && window.location.pathname.includes('/superadmin'));
    const isWarehouse = (window.currentUserRole && window.currentUserRole.toUpperCase() === 'WAREHOUSE') ||
                       (window.location.pathname && window.location.pathname.includes('/warehouse'));
    const isAdminRegional = (window.currentUserRole && window.currentUserRole.toUpperCase() === 'ADMIN_REGIONAL') ||
                           (window.location.pathname && window.location.pathname.includes('/admin_regional'));
    
    // If itemId is provided, pre-fill it
    const itemIdValue = itemId || '';
    
    if (isAdminRegional) {
        // For admin regional: use licence plate with verification, but only show inventories from admin regional's regional
        form.innerHTML = `
        <div class="space-y-4">
            <!-- Error message container -->
            <div id="transferFormError" class="hidden">
                <!-- Error messages will be displayed here -->
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Item a Transferir *</label>
                <!-- Inventory Info Display (shown after verification) -->
                <div id="itemInventoryInfo" class="mb-3 hidden">
                    <!-- Will be populated when item is verified -->
                </div>
                <div class="flex gap-2">
                    <input type="text" id="newTransferLicencePlate" 
                        class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00AF00]" 
                        placeholder="Placa del item" 
                        onkeypress="if(event.key === 'Enter') { event.preventDefault(); verifyItemByLicencePlate(); }"
                        required>
                    <button type="button" onclick="verifyItemByLicencePlate()" 
                        class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-colors flex items-center gap-2 whitespace-nowrap">
                        <i class="fas fa-search"></i>
                        <span class="hidden sm:inline">Verificar</span>
                    </button>
                </div>
                <input type="hidden" id="newTransferItemId" value="${itemIdValue}">
                <div id="itemVerificationResult" class="mt-2"></div>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Ingresa la placa del item y verifica su existencia. Solo puedes transferir items de tu regional.</p>
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Inventario de Destino *</label>
                
                <!-- Inventario Dropdown (only inventories from admin regional's regional) -->
                <div>
                    <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Inventario</label>
                    <div class="custom-select-container">
                        <div class="custom-select" id="newTransferInventorySelect">
                            <div class="custom-select-trigger">
                                <span class="custom-select-text">Seleccione un inventario</span>
                                <i class="fas fa-chevron-down custom-select-arrow"></i>
                            </div>
                            <div class="custom-select-dropdown">
                                <input type="text" class="custom-select-search" placeholder="Buscar inventario...">
                                <div class="custom-select-options" id="newTransferInventoryOptions">
                                    <!-- Options loaded dynamically -->
                                </div>
                            </div>
                        </div>
                        <input type="hidden" id="newTransferDestinationInventoryId" value="" required>
                    </div>
                </div>
                
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Solo puedes transferir a inventarios de tu regional. La transferencia se aprobará automáticamente.</p>
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Detalles / Observaciones</label>
                <textarea id="newTransferDetails" 
                    rows="4" 
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00AF00]" 
                    placeholder="Detalles adicionales sobre la transferencia (opcional, máximo 500 caracteres)"
                    maxlength="500"></textarea>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Información adicional sobre la transferencia</p>
            </div>
        </div>

        <div class="flex gap-3 pt-4 mt-6 border-t border-gray-200 dark:border-gray-700">
            <button type="button" onclick="closeNewTransferModal()" 
                class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                Cancelar
            </button>
            <button type="submit" 
                class="flex-1 px-4 py-2 bg-[#00AF00] hover:bg-[#008800] text-white rounded-xl transition-colors font-semibold">
                <i class="fas fa-check-circle mr-2"></i>
                Crear Transferencia (Aprobación Automática)
            </button>
        </div>
    `;
        
        // Initialize inventory select for admin regional
        const initAdminRegionalSelect = (retries = 0, maxRetries = 30) => {
            // Check if CustomSelect is available (check both window.CustomSelect and global CustomSelect)
            const CustomSelectClass = window.CustomSelect || (typeof CustomSelect !== 'undefined' ? CustomSelect : null);
            
            if (!CustomSelectClass && retries < maxRetries) {
                setTimeout(() => initAdminRegionalSelect(retries + 1, maxRetries), 200);
                return;
            }
            
            if (!CustomSelectClass) {
                console.error('CustomSelect not available. Please ensure users-modals.js is loaded before transfers-forms.js.');
                return;
            }
            
            const inventoryContainer = document.getElementById('newTransferInventorySelect');
            
            if (!inventoryContainer) {
                if (retries < maxRetries) {
                    setTimeout(() => initAdminRegionalSelect(retries + 1, maxRetries), 50);
                }
                return;
            }
            
            const inventoryOptions = inventoryContainer.querySelector('.custom-select-options');
            
            if (!inventoryOptions) {
                if (retries < maxRetries) {
                    setTimeout(() => initAdminRegionalSelect(retries + 1, maxRetries), 50);
                }
                return;
            }
            
            // Initialize inventory select
            if (!newTransferInventorySelect) {
                try {
                    const selectInstance = new CustomSelectClass('newTransferInventorySelect', {
                        placeholder: 'Seleccione un inventario',
                        onChange: (option) => {
                            if (option && option.value) {
                                const hiddenInput = document.getElementById('newTransferDestinationInventoryId');
                                if (hiddenInput) {
                                    hiddenInput.value = option.value;
                                }
                            } else {
                                const hiddenInput = document.getElementById('newTransferDestinationInventoryId');
                                if (hiddenInput) {
                                    hiddenInput.value = '';
                                }
                            }
                        }
                    });
                    
                    if (selectInstance && selectInstance.container) {
                        newTransferInventorySelect = selectInstance;
                    }
                } catch (error) {
                    console.error('Error initializing admin regional inventory select:', error);
                    return;
                }
            }
            
            // Load inventories for admin regional's regional
            setTimeout(() => {
                loadInventoriesForAdminRegionalTransferForm();
            }, 100);
        };
        
        // Wait a bit more to ensure DOM and CustomSelect are ready
        setTimeout(() => {
            initAdminRegionalSelect();
        }, 300);
        
        // Re-attach event listener after populating form HTML
        setTimeout(() => {
            const formElement = document.getElementById('newTransferForm');
            if (formElement) {
                // Remove existing listeners by cloning the form
                const newForm = formElement.cloneNode(true);
                formElement.parentNode.replaceChild(newForm, formElement);
                // Re-attach the submit handler
                newForm.addEventListener('submit', handleNewTransferSubmit);
            }
        }, 100);
    } else if (isSuperAdmin) {
        // For superadmin: use licence plate number with verification button
        form.innerHTML = `
        <div class="space-y-4">
            <!-- Error message container -->
            <div id="transferFormError" class="hidden">
                <!-- Error messages will be displayed here -->
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Item a Transferir *</label>
                <!-- Inventory Info Display (shown after verification) -->
                <div id="itemInventoryInfo" class="mb-3 hidden">
                    <!-- Will be populated when item is verified -->
                </div>
                <div class="flex gap-2">
                    <input type="text" id="newTransferLicencePlate" 
                        class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00AF00]" 
                        placeholder="Placa del item" 
                        onkeypress="if(event.key === 'Enter') { event.preventDefault(); verifyItemByLicencePlate(); }"
                        required>
                    <button type="button" onclick="verifyItemByLicencePlate()" 
                        class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-colors flex items-center gap-2 whitespace-nowrap">
                        <i class="fas fa-search"></i>
                        <span class="hidden sm:inline">Verificar</span>
                    </button>
                </div>
                <input type="hidden" id="newTransferItemId" value="${itemIdValue}">
                <div id="itemVerificationResult" class="mt-2"></div>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Ingresa la placa del item y verifica su existencia</p>
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Inventario de Destino *</label>
                
                <!-- Regional Dropdown -->
                <div class="mb-3">
                    <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Regional</label>
                    <div class="custom-select-container">
                        <div class="custom-select" id="newTransferRegionalSelect">
                            <div class="custom-select-trigger">
                                <span class="custom-select-text">Seleccione una regional</span>
                                <i class="fas fa-chevron-down custom-select-arrow"></i>
                            </div>
                            <div class="custom-select-dropdown">
                                <input type="text" class="custom-select-search" placeholder="Buscar regional...">
                                <div class="custom-select-options" id="newTransferRegionalOptions">
                                    <!-- Options loaded dynamically -->
                                </div>
                            </div>
                        </div>
                        <input type="hidden" id="newTransferRegionalId" value="">
                    </div>
                </div>
                
                <!-- Centro (Institution) Dropdown -->
                <div class="mb-3">
                    <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Centro</label>
                    <div class="custom-select-container">
                        <div class="custom-select" id="newTransferInstitutionSelect">
                            <div class="custom-select-trigger">
                                <span class="custom-select-text">Seleccione un centro</span>
                                <i class="fas fa-chevron-down custom-select-arrow"></i>
                            </div>
                            <div class="custom-select-dropdown">
                                <input type="text" class="custom-select-search" placeholder="Buscar centro...">
                                <div class="custom-select-options" id="newTransferInstitutionOptions">
                                    <!-- Options loaded dynamically -->
                                </div>
                            </div>
                        </div>
                        <input type="hidden" id="newTransferInstitutionId" value="">
                    </div>
                </div>
                
                <!-- Inventario Dropdown -->
                <div>
                    <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Inventario</label>
                    <div class="custom-select-container">
                        <div class="custom-select" id="newTransferInventorySelect">
                            <div class="custom-select-trigger">
                                <span class="custom-select-text">Seleccione un inventario</span>
                                <i class="fas fa-chevron-down custom-select-arrow"></i>
                            </div>
                            <div class="custom-select-dropdown">
                                <input type="text" class="custom-select-search" placeholder="Buscar inventario...">
                                <div class="custom-select-options" id="newTransferInventoryOptions">
                                    <!-- Options loaded dynamically -->
                                </div>
                            </div>
                        </div>
                        <input type="hidden" id="newTransferDestinationInventoryId" value="" required>
                    </div>
                </div>
                
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Seleccione la regional, centro e inventario de destino</p>
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Detalles / Observaciones</label>
                <textarea id="newTransferDetails" 
                    rows="4" 
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00AF00]" 
                    placeholder="Detalles adicionales sobre la transferencia (opcional, máximo 500 caracteres)"
                    maxlength="500"></textarea>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Información adicional sobre la transferencia</p>
            </div>
        </div>

        <div class="flex gap-3 pt-4">
            <button type="button" onclick="closeNewTransferModal()" 
                class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                Cancelar
            </button>
            <button type="submit" 
                class="flex-1 px-4 py-2 bg-[#00AF00] hover:bg-[#008800] text-white rounded-xl transition-colors">
                Solicitar Transferencia
            </button>
        </div>
    `;
        
        // Initialize selects after HTML is inserted
        // Wait for CustomSelect to be available and DOM to be ready
        const initSelects = () => {
            const CustomSelectClass = window.CustomSelect || CustomSelect;
            if (!CustomSelectClass) {
                // Retry if CustomSelect is not loaded yet
                setTimeout(initSelects, 100);
                return;
            }
            
            // Verify elements exist and are fully rendered
            const regionalContainer = document.getElementById('newTransferRegionalSelect');
            const regionalOptions = regionalContainer ? regionalContainer.querySelector('.custom-select-options') : null;
            
            if (!regionalContainer || !regionalOptions) {
                setTimeout(initSelects, 50);
                return;
            }
            
            // Verify all three selects have their required elements
            const institutionContainer = document.getElementById('newTransferInstitutionSelect');
            const inventoryContainer = document.getElementById('newTransferInventorySelect');
            
            if (!institutionContainer || !inventoryContainer) {
                setTimeout(initSelects, 50);
                return;
            }
            
            const institutionOptions = institutionContainer.querySelector('.custom-select-options');
            const inventoryOptions = inventoryContainer.querySelector('.custom-select-options');
            
            if (!institutionOptions || !inventoryOptions) {
                setTimeout(initSelects, 50);
                return;
            }
            
            // All elements are ready, initialize
            initializeTransferFormSelects();
            
            // Wait a bit more before loading data to ensure selects are fully initialized
            setTimeout(() => {
                loadRegionalsForTransferForm();
            }, 100);
        };
        
        // Use multiple frames to ensure DOM is ready
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                setTimeout(initSelects, 150);
            });
        });
    } else if (isWarehouse) {
        // For warehouse: use licence plate with verification, but only show inventories from warehouse's regional
        form.innerHTML = `
        <div class="space-y-4">
            <!-- Error message container -->
            <div id="transferFormError" class="hidden">
                <!-- Error messages will be displayed here -->
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Item a Transferir *</label>
                <!-- Inventory Info Display (shown after verification) -->
                <div id="itemInventoryInfo" class="mb-3 hidden">
                    <!-- Will be populated when item is verified -->
                </div>
                <div class="flex gap-2">
                    <input type="text" id="newTransferLicencePlate" 
                        class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00AF00]" 
                        placeholder="Placa del item" 
                        onkeypress="if(event.key === 'Enter') { event.preventDefault(); verifyItemByLicencePlate(); }"
                        required>
                    <button type="button" onclick="verifyItemByLicencePlate()" 
                        class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-colors flex items-center gap-2 whitespace-nowrap">
                        <i class="fas fa-search"></i>
                        <span class="hidden sm:inline">Verificar</span>
                    </button>
                </div>
                <input type="hidden" id="newTransferItemId" value="${itemIdValue}">
                <div id="itemVerificationResult" class="mt-2"></div>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Ingresa la placa del item y verifica su existencia. Solo puedes transferir items de tu institución.</p>
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Inventario de Destino *</label>
                
                <!-- Inventario Dropdown (only inventories from warehouse's regional) -->
                <div>
                    <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Inventario</label>
                    <div class="custom-select-container">
                        <div class="custom-select" id="newTransferInventorySelect">
                            <div class="custom-select-trigger">
                                <span class="custom-select-text">Seleccione un inventario</span>
                                <i class="fas fa-chevron-down custom-select-arrow"></i>
                            </div>
                            <div class="custom-select-dropdown">
                                <input type="text" class="custom-select-search" placeholder="Buscar inventario...">
                                <div class="custom-select-options" id="newTransferInventoryOptions">
                                    <!-- Options loaded dynamically -->
                                </div>
                            </div>
                        </div>
                        <input type="hidden" id="newTransferDestinationInventoryId" value="" required>
                    </div>
                </div>
                
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Solo puedes transferir a inventarios de tu regional. La transferencia se aprobará automáticamente.</p>
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Detalles / Observaciones</label>
                <textarea id="newTransferDetails" 
                    rows="4" 
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00AF00]" 
                    placeholder="Detalles adicionales sobre la transferencia (opcional, máximo 500 caracteres)"
                    maxlength="500"></textarea>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Información adicional sobre la transferencia</p>
            </div>
        </div>

        <div class="flex gap-3 pt-4 mt-6 border-t border-gray-200 dark:border-gray-700">
            <button type="button" onclick="closeNewTransferModal()" 
                class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                Cancelar
            </button>
            <button type="submit" 
                class="flex-1 px-4 py-2 bg-[#00AF00] hover:bg-[#008800] text-white rounded-xl transition-colors font-semibold">
                <i class="fas fa-check-circle mr-2"></i>
                Crear Transferencia (Aprobación Automática)
            </button>
        </div>
    `;
        
        // Initialize inventory select for warehouse
        const initWarehouseSelect = (retries = 0, maxRetries = 30) => {
            // Check if CustomSelect is available (check both window.CustomSelect and global CustomSelect)
            const CustomSelectClass = window.CustomSelect || (typeof CustomSelect !== 'undefined' ? CustomSelect : null);
            
            if (!CustomSelectClass && retries < maxRetries) {
                setTimeout(() => initWarehouseSelect(retries + 1, maxRetries), 200);
                return;
            }
            
            if (!CustomSelectClass) {
                console.error('CustomSelect not available. Please ensure centers.js is loaded before transfers-forms.js.');
                return;
            }
            
            const inventoryContainer = document.getElementById('newTransferInventorySelect');
            
            if (!inventoryContainer) {
                if (retries < maxRetries) {
                    setTimeout(() => initWarehouseSelect(retries + 1, maxRetries), 50);
                }
                return;
            }
            
            const inventoryOptions = inventoryContainer.querySelector('.custom-select-options');
            
            if (!inventoryOptions) {
                if (retries < maxRetries) {
                    setTimeout(() => initWarehouseSelect(retries + 1, maxRetries), 50);
                }
                return;
            }
            
            // Initialize inventory select
            if (!newTransferInventorySelect) {
                try {
                    console.log('Initializing warehouse inventory select...');
                    const selectInstance = new CustomSelectClass('newTransferInventorySelect', {
                        placeholder: 'Seleccione un inventario',
                        onChange: (option) => {
                            console.log('Inventory selected:', option);
                            if (option && option.value) {
                                const hiddenInput = document.getElementById('newTransferDestinationInventoryId');
                                if (hiddenInput) {
                                    hiddenInput.value = option.value;
                                    console.log('Set hidden input value to:', option.value);
                                }
                            } else {
                                const hiddenInput = document.getElementById('newTransferDestinationInventoryId');
                                if (hiddenInput) {
                                    hiddenInput.value = '';
                                }
                            }
                        }
                    });
                    
                    if (selectInstance && selectInstance.container) {
                        newTransferInventorySelect = selectInstance;
                        window.newTransferInventorySelect = selectInstance; // Also assign to window
                        console.log('Warehouse inventory select initialized successfully:', selectInstance);
                    } else {
                        console.error('Select instance created but container is missing');
                    }
                } catch (error) {
                    console.error('Error initializing warehouse inventory select:', error);
                    console.error('Error stack:', error.stack);
                    return;
                }
            } else {
                console.log('Warehouse inventory select already initialized');
            }
            
            // Load inventories for warehouse's regional
            setTimeout(() => {
                console.log('Loading inventories for warehouse transfer form...');
                loadInventoriesForWarehouseTransferForm();
            }, 100);
        };
        
        // Wait a bit more to ensure DOM and CustomSelect are ready
        setTimeout(() => {
            initWarehouseSelect();
        }, 300);
        
        // Re-attach event listener after populating form HTML (similar to transfers-user.js)
        // This is necessary because innerHTML replaces all content including event listeners
        const attachSubmitListener = () => {
            const formElement = document.getElementById('newTransferForm');
            if (formElement) {
                // Remove any existing listeners by cloning the form
                const newForm = formElement.cloneNode(true);
                formElement.parentNode.replaceChild(newForm, formElement);
                
                // Re-attach the submit handler
                const submitHandler = window.handleNewTransferSubmit || handleNewTransferSubmit;
                if (typeof submitHandler === 'function') {
                    // Remove any existing listener first
                    newForm.removeEventListener('submit', submitHandler);
                    // Add the listener
                    newForm.addEventListener('submit', (e) => {
                        console.log('Form submit event triggered');
                        submitHandler(e);
                    }, { once: false });
                    console.log('Submit listener attached to form');
                    
                    // Also attach direct click handler to submit button as fallback
                    const submitButton = newForm.querySelector('button[type="submit"]');
                    if (submitButton) {
                        console.log('Submit button found, attaching click handler');
                        // Remove any existing click handlers first
                        const newButton = submitButton.cloneNode(true);
                        submitButton.parentNode.replaceChild(newButton, submitButton);
                        
                        newButton.addEventListener('click', async (e) => {
                            console.log('Submit button clicked directly');
                            e.preventDefault();
                            e.stopPropagation();
                            
                            // Check if form submit handler will handle it
                            if (!isSubmittingTransfer) {
                                // Disable button immediately
                                newButton.disabled = true;
                                const originalText = newButton.innerHTML;
                                newButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Procesando...';
                                
                                // Try to trigger form submit event
                                const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
                                const formSubmitted = newForm.dispatchEvent(submitEvent);
                                
                                console.log('Form submit event dispatched, result:', formSubmitted);
                                
                                // If form submit didn't work, call handler directly
                                if (!formSubmitted || !isSubmittingTransfer) {
                                    console.log('Calling submit handler directly');
                                    const submitHandler = window.handleNewTransferSubmit || handleNewTransferSubmit;
                                    if (typeof submitHandler === 'function') {
                                        await submitHandler(submitEvent);
                                    }
                                }
                                
                                // Re-enable after a delay if submission fails
                                setTimeout(() => {
                                    if (!isSubmittingTransfer) {
                                        newButton.disabled = false;
                                        newButton.innerHTML = originalText;
                                    }
                                }, 2000);
                            } else {
                                console.log('Already submitting, ignoring click');
                            }
                        }, { once: false });
                    } else {
                        console.warn('Submit button not found in form');
                    }
                } else {
                    console.error('handleNewTransferSubmit function not found');
                }
            } else {
                console.warn('Form element not found, retrying...');
                setTimeout(attachSubmitListener, 100);
            }
        };
        
        setTimeout(attachSubmitListener, 200);
    } else if (isAdminRegional) {
        // For admin regional: use licence plate with verification, but only show inventories from admin regional's regional
        form.innerHTML = `
        <div class="space-y-4">
            <!-- Error message container -->
            <div id="transferFormError" class="hidden">
                <!-- Error messages will be displayed here -->
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Item a Transferir *</label>
                <!-- Inventory Info Display (shown after verification) -->
                <div id="itemInventoryInfo" class="mb-3 hidden">
                    <!-- Will be populated when item is verified -->
                </div>
                <div class="flex gap-2">
                    <input type="text" id="newTransferLicencePlate" 
                        class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00AF00]" 
                        placeholder="Placa del item" 
                        onkeypress="if(event.key === 'Enter') { event.preventDefault(); verifyItemByLicencePlate(); }"
                        required>
                    <button type="button" onclick="verifyItemByLicencePlate()" 
                        class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-colors flex items-center gap-2 whitespace-nowrap">
                        <i class="fas fa-search"></i>
                        <span class="hidden sm:inline">Verificar</span>
                    </button>
                </div>
                <input type="hidden" id="newTransferItemId" value="${itemIdValue}">
                <div id="itemVerificationResult" class="mt-2"></div>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Ingresa la placa del item y verifica su existencia. Solo puedes transferir items de tu regional.</p>
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Inventario de Destino *</label>
                
                <!-- Inventario Dropdown (only inventories from admin regional's regional) -->
                <div>
                    <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Inventario</label>
                    <div class="custom-select-container">
                        <div class="custom-select" id="newTransferInventorySelect">
                            <div class="custom-select-trigger">
                                <span class="custom-select-text">Seleccione un inventario</span>
                                <i class="fas fa-chevron-down custom-select-arrow"></i>
                            </div>
                            <div class="custom-select-dropdown">
                                <input type="text" class="custom-select-search" placeholder="Buscar inventario...">
                                <div class="custom-select-options" id="newTransferInventoryOptions">
                                    <!-- Options loaded dynamically -->
                                </div>
                            </div>
                        </div>
                        <input type="hidden" id="newTransferDestinationInventoryId" value="" required>
                    </div>
                </div>
                
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Solo puedes transferir a inventarios de tu regional. La transferencia se aprobará automáticamente.</p>
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Detalles / Observaciones</label>
                <textarea id="newTransferDetails" 
                    rows="4" 
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00AF00]" 
                    placeholder="Detalles adicionales sobre la transferencia (opcional, máximo 500 caracteres)"
                    maxlength="500"></textarea>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Información adicional sobre la transferencia</p>
            </div>
        </div>

        <div class="flex gap-3 pt-4 mt-6 border-t border-gray-200 dark:border-gray-700">
            <button type="button" onclick="closeNewTransferModal()" 
                class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                Cancelar
            </button>
            <button type="submit" 
                class="flex-1 px-4 py-2 bg-[#00AF00] hover:bg-[#008800] text-white rounded-xl transition-colors font-semibold">
                <i class="fas fa-check-circle mr-2"></i>
                Crear Transferencia (Aprobación Automática)
            </button>
        </div>
    `;
        
        // Initialize inventory select for admin regional
        const initAdminRegionalSelect = (retries = 0, maxRetries = 30) => {
            // Check if CustomSelect is available (check both window.CustomSelect and global CustomSelect)
            const CustomSelectClass = window.CustomSelect || (typeof CustomSelect !== 'undefined' ? CustomSelect : null);
            
            if (!CustomSelectClass && retries < maxRetries) {
                setTimeout(() => initAdminRegionalSelect(retries + 1, maxRetries), 200);
                return;
            }
            
            if (!CustomSelectClass) {
                console.error('CustomSelect not available. Please ensure users-modals.js is loaded before transfers-forms.js.');
                return;
            }
            
            const inventoryContainer = document.getElementById('newTransferInventorySelect');
            
            if (!inventoryContainer) {
                if (retries < maxRetries) {
                    setTimeout(() => initAdminRegionalSelect(retries + 1, maxRetries), 50);
                }
                return;
            }
            
            const inventoryOptions = inventoryContainer.querySelector('.custom-select-options');
            
            if (!inventoryOptions) {
                if (retries < maxRetries) {
                    setTimeout(() => initAdminRegionalSelect(retries + 1, maxRetries), 50);
                }
                return;
            }
            
            // Initialize inventory select
            if (!newTransferInventorySelect) {
                try {
                    const selectInstance = new CustomSelectClass('newTransferInventorySelect', {
                        placeholder: 'Seleccione un inventario',
                        onChange: (option) => {
                            if (option && option.value) {
                                const hiddenInput = document.getElementById('newTransferDestinationInventoryId');
                                if (hiddenInput) {
                                    hiddenInput.value = option.value;
                                }
                            } else {
                                const hiddenInput = document.getElementById('newTransferDestinationInventoryId');
                                if (hiddenInput) {
                                    hiddenInput.value = '';
                                }
                            }
                        }
                    });
                    
                    if (selectInstance && selectInstance.container) {
                        newTransferInventorySelect = selectInstance;
                    }
                } catch (error) {
                    console.error('Error initializing admin regional inventory select:', error);
                    return;
                }
            }
            
            // Load inventories for admin regional's regional
            setTimeout(() => {
                loadInventoriesForAdminRegionalTransferForm();
            }, 100);
        };
        
        // Wait a bit more to ensure DOM and CustomSelect are ready
        setTimeout(() => {
            initAdminRegionalSelect();
        }, 300);
        
        // Re-attach event listener after populating form HTML
        setTimeout(() => {
            const formElement = document.getElementById('newTransferForm');
            if (formElement) {
                // Remove existing listeners by cloning the form
                const newForm = formElement.cloneNode(true);
                formElement.parentNode.replaceChild(newForm, formElement);
                // Re-attach the submit handler
                newForm.addEventListener('submit', handleNewTransferSubmit);
            }
        }, 100);
    } else {
        // For other users: use item ID (original behavior)
        form.innerHTML = `
        <div class="space-y-4">
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Item a Transferir *</label>
                <input type="number" id="newTransferItemId" 
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00AF00]" 
                    placeholder="ID del item" 
                    value="${itemIdValue}"
                    required>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Ingresa el ID del item que deseas transferir</p>
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Inventario de Destino *</label>
                <input type="number" id="newTransferDestinationInventoryId" 
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00AF00]" 
                    placeholder="ID del inventario destino" 
                    required>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Ingresa el ID del inventario al que se transferirá el item</p>
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Detalles / Observaciones</label>
                <textarea id="newTransferDetails" 
                    rows="4" 
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00AF00]" 
                    placeholder="Detalles adicionales sobre la transferencia (opcional, máximo 500 caracteres)"
                    maxlength="500"></textarea>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Información adicional sobre la transferencia</p>
            </div>
        </div>

        <div class="flex gap-3 pt-4">
            <button type="button" onclick="closeNewTransferModal()" 
                class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                Cancelar
            </button>
            <button type="submit" 
                class="flex-1 px-4 py-2 bg-[#00AF00] hover:bg-[#008800] text-white rounded-xl transition-colors">
                Solicitar Transferencia
            </button>
        </div>
    `;
    }
}

/**
 * Verifies item existence by licence plate number
 */
async function verifyItemByLicencePlate() {
    const licencePlateInput = document.getElementById('newTransferLicencePlate');
    const resultDiv = document.getElementById('itemVerificationResult');
    const itemIdInput = document.getElementById('newTransferItemId');
    const inventoryInfoDiv = document.getElementById('itemInventoryInfo');
    
    if (!licencePlateInput || !resultDiv || !itemIdInput) {
        return;
    }
    
    const licencePlate = licencePlateInput.value.trim();
    
    if (!licencePlate) {
        resultDiv.innerHTML = `
            <div class="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p class="text-sm text-yellow-800 dark:text-yellow-300">
                    <i class="fas fa-exclamation-triangle mr-2"></i>
                    Por favor ingresa una placa
                </p>
            </div>
        `;
        // Hide inventory info
        if (inventoryInfoDiv) {
            inventoryInfoDiv.classList.add('hidden');
            inventoryInfoDiv.innerHTML = '';
        }
        return;
    }
    
    // Show loading state
    resultDiv.innerHTML = `
        <div class="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p class="text-sm text-blue-800 dark:text-blue-300">
                <i class="fas fa-spinner fa-spin mr-2"></i>
                Verificando...
            </p>
        </div>
    `;
    
    // Hide inventory info while loading
    if (inventoryInfoDiv) {
        inventoryInfoDiv.classList.add('hidden');
        inventoryInfoDiv.innerHTML = '';
    }
    
    try {
        const token = localStorage.getItem('jwt');
        const headers = {
            'Content-Type': 'application/json',
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch(`/api/v1/items/licence-plate/${encodeURIComponent(licencePlate)}`, {
            method: 'GET',
            headers: headers,
        });
        
        if (response.ok) {
            const item = await response.json();
            itemIdInput.value = item.itemId || item.id || '';
            
            resultDiv.innerHTML = `
                <div class="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <p class="text-sm text-green-800 dark:text-green-300 font-medium mb-1">
                        <i class="fas fa-check-circle mr-2"></i>
                        Item encontrado
                    </p>
                    <p class="text-xs text-green-700 dark:text-green-400">
                        ${item.productName || 'Sin nombre'} (ID: ${item.itemId || item.id})
                    </p>
                </div>
            `;
            
            // Show inventory info if available
            if (inventoryInfoDiv && item.inventoryId && item.inventoryName) {
                inventoryInfoDiv.innerHTML = `
                    <div class="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <div class="flex items-center gap-2">
                            <i class="fas fa-box text-blue-600 dark:text-blue-400"></i>
                            <div>
                                <p class="text-xs text-blue-600 dark:text-blue-400 font-medium mb-0.5">Inventario Actual</p>
                                <p class="text-sm text-blue-800 dark:text-blue-300 font-semibold">${item.inventoryName}</p>
                                <p class="text-xs text-blue-700 dark:text-blue-400">ID: ${item.inventoryId}</p>
                            </div>
                        </div>
                    </div>
                `;
                inventoryInfoDiv.classList.remove('hidden');
            } else if (inventoryInfoDiv && item.inventoryId) {
                // If we only have the ID, show it
                inventoryInfoDiv.innerHTML = `
                    <div class="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <div class="flex items-center gap-2">
                            <i class="fas fa-box text-blue-600 dark:text-blue-400"></i>
                            <div>
                                <p class="text-xs text-blue-600 dark:text-blue-400 font-medium mb-0.5">Inventario Actual</p>
                                <p class="text-sm text-blue-800 dark:text-blue-300 font-semibold">ID: ${item.inventoryId}</p>
                            </div>
                        </div>
                    </div>
                `;
                inventoryInfoDiv.classList.remove('hidden');
            }
        } else if (response.status === 404) {
            itemIdInput.value = '';
            resultDiv.innerHTML = `
                <div class="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <p class="text-sm text-yellow-800 dark:text-yellow-300 font-medium mb-1">
                        <i class="fas fa-search mr-2"></i>
                        Item no encontrado
                    </p>
                    <p class="text-xs text-yellow-700 dark:text-yellow-400">
                        No se encontró ningún item con la placa: <strong>${licencePlate}</strong>
                    </p>
                    <p class="text-xs text-yellow-600 dark:text-yellow-500 mt-1">
                        Verifica que la placa sea correcta e intenta nuevamente
                    </p>
                </div>
            `;
            // Hide inventory info
            if (inventoryInfoDiv) {
                inventoryInfoDiv.classList.add('hidden');
                inventoryInfoDiv.innerHTML = '';
            }
        } else {
            // Try to get error message from response
            let errorMessage = 'Error al verificar el item';
            try {
                const errorData = await response.json();
                const rawMessage = errorData.message || errorData.detail || errorData.error || '';
                
                // Translate common error messages to Spanish
                if (rawMessage.includes('Item not found with licence plate number')) {
                    const plateMatch = rawMessage.match(/licence plate number:\s*(\S+)/);
                    const plateNumber = plateMatch ? plateMatch[1] : '';
                    errorMessage = `No se encontró ningún item con la placa: ${plateNumber}`;
                } else if (rawMessage.includes('not found')) {
                    errorMessage = 'Item no encontrado';
                } else if (rawMessage) {
                    errorMessage = rawMessage;
                }
            } catch (parseError) {
                // If response is not JSON, use status text
                errorMessage = response.statusText || errorMessage;
            }
            
            itemIdInput.value = '';
            resultDiv.innerHTML = `
                <div class="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p class="text-sm text-red-800 dark:text-red-300 font-medium mb-1">
                        <i class="fas fa-exclamation-triangle mr-2"></i>
                        Error al verificar el item
                    </p>
                    <p class="text-xs text-red-700 dark:text-red-400">
                        ${errorMessage}
                    </p>
                    <p class="text-xs text-red-600 dark:text-red-500 mt-1">
                        Por favor intenta nuevamente o contacta al administrador si el problema persiste
                    </p>
                </div>
            `;
            // Hide inventory info
            if (inventoryInfoDiv) {
                inventoryInfoDiv.classList.add('hidden');
                inventoryInfoDiv.innerHTML = '';
            }
        }
    } catch (error) {
        console.error('Error verifying item:', error);
        itemIdInput.value = '';
        
        // Determine error message and translate to Spanish
        let errorMessage = 'Error al verificar el item';
        if (error.message) {
            if (error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
                errorMessage = 'No se pudo conectar con el servidor. Verifica tu conexión a internet.';
            } else if (error.message.includes('Item not found with licence plate number')) {
                const plateMatch = error.message.match(/licence plate number:\s*(\S+)/);
                const plateNumber = plateMatch ? plateMatch[1] : licencePlate;
                errorMessage = `No se encontró ningún item con la placa: ${plateNumber}`;
            } else if (error.message.includes('not found')) {
                errorMessage = 'Item no encontrado';
            } else {
                // Try to translate common English error messages
                errorMessage = error.message
                    .replace('Item not found', 'Item no encontrado')
                    .replace('with licence plate number', 'con la placa')
                    .replace('Error', 'Error');
            }
        }
        
        resultDiv.innerHTML = `
            <div class="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p class="text-sm text-red-800 dark:text-red-300 font-medium mb-1">
                    <i class="fas fa-exclamation-triangle mr-2"></i>
                    Error al verificar el item
                </p>
                <p class="text-xs text-red-700 dark:text-red-400">
                    ${errorMessage}
                </p>
                <p class="text-xs text-red-600 dark:text-red-500 mt-1">
                    Por favor intenta nuevamente o contacta al administrador si el problema persiste
                </p>
            </div>
        `;
        // Hide inventory info
        if (inventoryInfoDiv) {
            inventoryInfoDiv.classList.add('hidden');
            inventoryInfoDiv.innerHTML = '';
        }
    }
}

// Flag to prevent multiple simultaneous submissions
let isSubmittingTransfer = false;

async function handleNewTransferSubmit(event) {
    event.preventDefault();
    event.stopPropagation();
    
    // Prevent multiple simultaneous submissions
    if (isSubmittingTransfer) {
        console.log('Transfer submission already in progress, ignoring duplicate call');
        return;
    }
    
    // Set flag immediately
    isSubmittingTransfer = true;
    console.log('handleNewTransferSubmit called');
    
    // Disable submit button immediately
    const submitButton = event.target.querySelector('button[type="submit"]');
    if (submitButton) {
        submitButton.disabled = true;
        const originalText = submitButton.innerHTML;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Procesando...';
        
        // Store original text for restoration if needed
        submitButton.dataset.originalText = originalText;
    }
    
    try {
        // Check if user is superadmin, warehouse, or admin regional
        const isSuperAdmin = (window.currentUserRole && window.currentUserRole.toUpperCase() === 'SUPERADMIN') || 
                             (window.location.pathname && window.location.pathname.includes('/superadmin'));
        const isWarehouse = (window.currentUserRole && window.currentUserRole.toUpperCase() === 'WAREHOUSE') ||
                           (window.location.pathname && window.location.pathname.includes('/warehouse'));
        const isAdminRegional = (window.currentUserRole && window.currentUserRole.toUpperCase() === 'ADMIN_REGIONAL') ||
                               (window.location.pathname && window.location.pathname.includes('/admin_regional'));
        
        console.log('User role check:', { isSuperAdmin, isWarehouse, isAdminRegional });
        
        // For superadmin, warehouse, and admin regional, verify item first if not already verified
        if (isSuperAdmin || isWarehouse || isAdminRegional) {
            const licencePlateInput = document.getElementById('newTransferLicencePlate');
            const itemIdInput = document.getElementById('newTransferItemId');
            
            if (licencePlateInput && licencePlateInput.value.trim() && (!itemIdInput || !itemIdInput.value.trim())) {
                // Item not verified yet, verify it first
                await verifyItemByLicencePlate();
                
                // Wait a bit for verification to complete
                await new Promise(resolve => setTimeout(resolve, 500));
                
                // Check if verification was successful
                if (!itemIdInput || !itemIdInput.value.trim()) {
                    if (window.showErrorToast) {
                        window.showErrorToast('Error', 'Por favor verifica el item antes de continuar');
                    }
                    isSubmittingTransfer = false;
                    return;
                }
            }
        }
        
        let itemId;
        if (isSuperAdmin || isWarehouse || isAdminRegional) {
            // For superadmin, warehouse, and admin regional, get itemId from hidden input
            itemId = document.getElementById('newTransferItemId')?.value?.trim();
        } else {
            // For other users, get from visible input
            itemId = document.getElementById('newTransferItemId')?.value?.trim();
        }
        
        const destinationInventoryId = document.getElementById('newTransferDestinationInventoryId')?.value?.trim();
        const details = document.getElementById('newTransferDetails')?.value?.trim() || '';
        
        if (!itemId || !destinationInventoryId) {
            if (window.showErrorToast) {
                window.showErrorToast('Error', 'Por favor completa todos los campos requeridos y verifica el item');
            }
            isSubmittingTransfer = false;
            return;
        }
        
        // Hide any previous errors
        const errorContainer = document.getElementById('transferFormError');
        if (errorContainer) {
            errorContainer.classList.add('hidden');
            errorContainer.innerHTML = '';
        }
        
        // Validate that both inventories belong to the same institution before showing summary
        console.log('Validating institution match...');
        const validationError = await validateInstitutionMatch(itemId, destinationInventoryId);
        console.log('Validation result:', validationError);
        if (validationError) {
            // Show error in form
            if (errorContainer) {
                errorContainer.innerHTML = `
                    <div class="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl">
                        <div class="flex items-start gap-3">
                            <i class="fas fa-exclamation-triangle text-yellow-600 dark:text-yellow-400 text-lg mt-0.5"></i>
                            <div class="flex-1">
                                <p class="text-sm font-medium text-yellow-800 dark:text-yellow-300 mb-1">
                                    Validación de Centro
                                </p>
                                <p class="text-xs text-yellow-700 dark:text-yellow-400">
                                    ${validationError}
                                </p>
                                <p class="text-xs text-yellow-600 dark:text-yellow-500 mt-2 opacity-90">
                                    <i class="fas fa-info-circle mr-1"></i>
                                    Los inventarios deben pertenecer al mismo centro para realizar la transferencia.
                                </p>
                            </div>
                            <button onclick="document.getElementById('transferFormError').classList.add('hidden')" 
                                class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    </div>
                `;
                errorContainer.classList.remove('hidden');
                errorContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
            
            if (window.showErrorToast) {
                window.showErrorToast('Validación', validationError);
            }
            isSubmittingTransfer = false;
            return;
        }
        
        console.log('All validations passed, showing summary modal');
        console.log('Calling showTransferSummaryModal with:', { itemId, destinationInventoryId, details });
        
        // Show summary modal for all roles (including Admin Regional)
        try {
            await showTransferSummaryModal(itemId, destinationInventoryId, details);
            console.log('showTransferSummaryModal completed');
        } catch (error) {
            console.error('Error in showTransferSummaryModal:', error);
            throw error; // Re-throw to be caught by outer catch
        }
    } catch (error) {
        console.error('Error in handleNewTransferSubmit:', error);
        if (window.showErrorToast) {
            window.showErrorToast('Error', 'Error al procesar la transferencia: ' + (error.message || 'Error desconocido'));
        }
        // Reset flag on error
        resetTransferSubmissionFlag();
    } finally {
        // Don't reset flag here if modal was shown successfully
        // The flag will be reset when the modal is closed
    }
}

// Reset submission flag when modal is closed
function resetTransferSubmissionFlag() {
    isSubmittingTransfer = false;
    // Re-enable submit button if form still exists
    const form = document.getElementById('newTransferForm');
    if (form) {
        const submitButton = form.querySelector('button[type="submit"]');
        if (submitButton && submitButton.dataset.originalText) {
            submitButton.disabled = false;
            submitButton.innerHTML = submitButton.dataset.originalText;
            delete submitButton.dataset.originalText;
        }
    }
}

// Reset submission flag when modal is closed
function resetTransferSubmissionFlag() {
    isSubmittingTransfer = false;
    // Re-enable submit button if form still exists
    const form = document.getElementById('newTransferForm');
    if (form) {
        const submitButton = form.querySelector('button[type="submit"]');
        if (submitButton && submitButton.dataset.originalText) {
            submitButton.disabled = false;
            submitButton.innerHTML = submitButton.dataset.originalText;
            delete submitButton.dataset.originalText;
        }
    }
}

/**
 * Validates that both inventories belong to the same institution
 */
async function validateInstitutionMatch(itemId, destinationInventoryId) {
    try {
        const token = localStorage.getItem('jwt');
        const headers = {
            'Content-Type': 'application/json',
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        // Get current inventory from item
        const inventoryInfoDiv = document.getElementById('itemInventoryInfo');
        let currentInventoryId = null;
        
        if (inventoryInfoDiv && !inventoryInfoDiv.classList.contains('hidden')) {
            const inventoryText = inventoryInfoDiv.textContent;
            const idMatch = inventoryText.match(/ID:\s*(\d+)/);
            if (idMatch) {
                currentInventoryId = idMatch[1];
            }
        }
        
        if (!currentInventoryId) {
            // Try to get item info to find current inventory
            try {
                const itemResponse = await fetch(`/api/v1/items/licence-plate/${document.getElementById('newTransferLicencePlate')?.value || ''}`, {
                    method: 'GET',
                    headers: headers,
                });
                if (itemResponse.ok) {
                    const item = await itemResponse.json();
                    // We need to get the inventory from the item, but we don't have that in the response
                    // So we'll let the backend handle the validation
                    return null;
                }
            } catch (error) {
                // Let backend handle validation
                return null;
            }
            return null; // Let backend handle validation if we can't get current inventory
        }
        
        // Fetch both inventories to compare institutions
        const [currentInventoryResponse, destinationInventoryResponse] = await Promise.all([
            fetch(`/api/v1/inventory/${currentInventoryId}`, {
                method: 'GET',
                headers: headers,
            }),
            fetch(`/api/v1/inventory/${destinationInventoryId}`, {
                method: 'GET',
                headers: headers,
            })
        ]);
        
        if (currentInventoryResponse.ok && destinationInventoryResponse.ok) {
            const currentInventory = await currentInventoryResponse.json();
            const destinationInventory = await destinationInventoryResponse.json();
            
            // Check if both have institutions
            if (!currentInventory.institutionId || !destinationInventory.institutionId) {
                return 'Ambos inventarios deben pertenecer a un centro para realizar la transferencia';
            }
            
            // Check if institutions match
            if (currentInventory.institutionId !== destinationInventory.institutionId) {
                const currentInstitutionName = currentInventory.institutionName || 'Centro origen';
                const destinationInstitutionName = destinationInventory.institutionName || 'Centro destino';
                return `Los inventarios deben pertenecer al mismo centro. Inventario origen: ${currentInstitutionName}, Inventario destino: ${destinationInstitutionName}`;
            }
        }
        
        return null; // Validation passed
    } catch (error) {
        console.error('Error validating institution match:', error);
        // Let backend handle validation if frontend validation fails
        return null;
    }
}

/**
 * Shows transfer summary modal with transfer details
 */
async function showTransferSummaryModal(itemId, destinationInventoryId, details) {
    console.log('showTransferSummaryModal called with:', { itemId, destinationInventoryId, details });
    const modal = document.getElementById('transferSummaryModal');
    const content = document.getElementById('transferSummaryContent');
    
    if (!modal) {
        console.error('transferSummaryModal not found in DOM');
        if (window.showErrorToast) {
            window.showErrorToast('Error', 'No se pudo mostrar el resumen. El modal no existe en la página.');
        }
        resetTransferSubmissionFlag();
        return;
    }
    
    if (!content) {
        console.error('transferSummaryContent not found in DOM');
        if (window.showErrorToast) {
            window.showErrorToast('Error', 'No se pudo mostrar el resumen. El contenido del modal no existe.');
        }
        resetTransferSubmissionFlag();
        return;
    }
    
    console.log('Modal and content found, proceeding...');
    
    // Show loading state
    content.innerHTML = `
        <div class="flex items-center justify-center py-8">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00AF00]"></div>
        </div>
    `;
    
    // Remove hidden class and ensure modal is visible
    modal.classList.remove('hidden');
    console.log('Modal hidden class removed');
    
    // Force modal to be visible (in case of CSS issues)
    if (modal.style) {
        modal.style.display = 'flex';
        modal.style.zIndex = '9999';
    }
    console.log('Modal display set to flex, z-index set to 9999');
    console.log('Modal element:', modal);
    console.log('Modal classes:', modal.className);
    
    try {
        const token = localStorage.getItem('jwt');
        const headers = {
            'Content-Type': 'application/json',
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        // Get item info from verification result
        const verificationResult = document.getElementById('itemVerificationResult');
        let itemName = 'Item ID: ' + itemId;
        let itemLicencePlate = null;
        
        if (verificationResult) {
            const resultText = verificationResult.textContent;
            const nameMatch = resultText.match(/([^(]+)\s*\(ID:/);
            if (nameMatch) {
                itemName = nameMatch[1].trim();
            }
        }
        
        // Get licence plate from input
        const licencePlateInput = document.getElementById('newTransferLicencePlate');
        if (licencePlateInput && licencePlateInput.value.trim()) {
            itemLicencePlate = licencePlateInput.value.trim();
        }
        
        // Fetch both inventories to get institution info
        let currentInventoryInfo = null;
        let destinationInventoryInfo = null;
        
        // Get current inventory ID
        console.log('Getting current inventory ID...');
        const inventoryInfoDiv = document.getElementById('itemInventoryInfo');
        let currentInventoryId = null;
        let currentInventoryName = 'No disponible';
        
        if (inventoryInfoDiv && !inventoryInfoDiv.classList.contains('hidden')) {
            const inventoryText = inventoryInfoDiv.textContent;
            console.log('Inventory info div text:', inventoryText);
            const idMatch = inventoryText.match(/ID:\s*(\d+)/);
            if (idMatch) {
                currentInventoryId = idMatch[1];
                console.log('Current inventory ID found:', currentInventoryId);
            }
            const nameMatch = inventoryText.match(/font-semibold[^>]*>([^<]+)/);
            if (nameMatch) {
                currentInventoryName = nameMatch[1].trim();
            }
        } else {
            console.log('Inventory info div not found or hidden, trying to get from item...');
            // Try to get inventory ID from item directly
            try {
                const itemResponse = await fetch(`/api/v1/items/${itemId}`, {
                    method: 'GET',
                    headers: headers,
                });
                if (itemResponse.ok) {
                    const item = await itemResponse.json();
                    if (item.inventoryId) {
                        currentInventoryId = item.inventoryId.toString();
                        console.log('Current inventory ID from item:', currentInventoryId);
                    }
                }
            } catch (error) {
                console.warn('Could not get inventory from item:', error);
            }
        }
        
        // Fetch both inventories
        console.log('Fetching inventory details...');
        try {
            if (currentInventoryId) {
                console.log('Fetching current inventory:', currentInventoryId);
                const currentInventoryResponse = await fetch(`/api/v1/inventory/${currentInventoryId}`, {
                    method: 'GET',
                    headers: headers,
                });
                if (currentInventoryResponse.ok) {
                    currentInventoryInfo = await currentInventoryResponse.json();
                    console.log('Current inventory info:', currentInventoryInfo);
                    if (currentInventoryInfo.name) {
                        currentInventoryName = currentInventoryInfo.name;
                    }
                } else {
                    console.warn('Failed to fetch current inventory:', currentInventoryResponse.status);
                }
            } else {
                console.log('No current inventory ID, skipping current inventory fetch');
            }
            
            console.log('Fetching destination inventory:', destinationInventoryId);
            const destinationInventoryResponse = await fetch(`/api/v1/inventory/${destinationInventoryId}`, {
                method: 'GET',
                headers: headers,
            });
            if (destinationInventoryResponse.ok) {
                destinationInventoryInfo = await destinationInventoryResponse.json();
                console.log('Destination inventory info:', destinationInventoryInfo);
            } else {
                console.error('Failed to fetch destination inventory:', destinationInventoryResponse.status);
                const errorText = await destinationInventoryResponse.text();
                console.error('Error response:', errorText);
                // Don't throw, continue with available data
                console.warn('Continuing without destination inventory details');
            }
        } catch (error) {
            console.error('Error fetching inventory details:', error);
            // Don't show error, continue with available data
            console.warn('Continuing with partial data due to fetch error');
        }
        
        // Ensure we have at least destination inventory info (required)
        if (!destinationInventoryInfo) {
            console.warn('No destination inventory info, fetching again...');
            try {
                const destinationInventoryResponse = await fetch(`/api/v1/inventory/${destinationInventoryId}`, {
                    method: 'GET',
                    headers: headers,
                });
                if (destinationInventoryResponse.ok) {
                    destinationInventoryInfo = await destinationInventoryResponse.json();
                    console.log('Destination inventory info fetched on retry:', destinationInventoryInfo);
                } else {
                    console.error('Failed to fetch destination inventory on retry');
                    // Show error and return
                    content.innerHTML = `
                        <div class="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                            <p class="text-sm text-red-800 dark:text-red-300 font-medium mb-1">
                                <i class="fas fa-exclamation-triangle mr-2"></i>
                                Error al cargar información
                            </p>
                            <p class="text-xs text-red-700 dark:text-red-400">
                                No se pudo cargar la información del inventario de destino. Por favor intenta nuevamente.
                            </p>
                        </div>
                    `;
                    resetTransferSubmissionFlag();
                    return;
                }
            } catch (retryError) {
                console.error('Error on retry:', retryError);
                content.innerHTML = `
                    <div class="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                        <p class="text-sm text-red-800 dark:text-red-300 font-medium mb-1">
                            <i class="fas fa-exclamation-triangle mr-2"></i>
                            Error al cargar información
                        </p>
                        <p class="text-xs text-red-700 dark:text-red-400">
                            ${retryError.message || 'No se pudieron cargar los detalles de los inventarios'}
                        </p>
                    </div>
                `;
                resetTransferSubmissionFlag();
                return;
            }
        }
        
        // Validate institutions match (only if we have both inventory infos)
        if (currentInventoryInfo && destinationInventoryInfo) {
            console.log('Validating institutions match...', {
                current: currentInventoryInfo.institutionId,
                destination: destinationInventoryInfo.institutionId
            });
            
            if (!currentInventoryInfo.institutionId || !destinationInventoryInfo.institutionId) {
                console.warn('One or both inventories missing institutionId');
                content.innerHTML = `
                    <div class="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                        <p class="text-sm text-red-800 dark:text-red-300 font-medium mb-1">
                            <i class="fas fa-times-circle mr-2"></i>
                            Error de Validación
                        </p>
                        <p class="text-xs text-red-700 dark:text-red-400">
                            Ambos inventarios deben pertenecer a un centro para realizar la transferencia
                        </p>
                    </div>
                `;
                resetTransferSubmissionFlag();
                return;
            }
            
            if (currentInventoryInfo.institutionId !== destinationInventoryInfo.institutionId) {
                const currentInstitutionName = currentInventoryInfo.institutionName || 'Centro origen';
                const destinationInstitutionName = destinationInventoryInfo.institutionName || 'Centro destino';
                console.warn('Institutions do not match');
                content.innerHTML = `
                    <div class="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl">
                        <p class="text-sm text-yellow-800 dark:text-yellow-300 font-medium mb-1">
                            <i class="fas fa-exclamation-triangle mr-2"></i>
                            Validación de Centro
                        </p>
                        <p class="text-xs text-yellow-700 dark:text-yellow-400 mb-2">
                            Los inventarios deben pertenecer al mismo centro para realizar la transferencia.
                        </p>
                        <div class="mt-3 space-y-2">
                            <p class="text-xs text-yellow-700 dark:text-yellow-400">
                                <strong>Inventario origen:</strong> ${currentInstitutionName}
                            </p>
                            <p class="text-xs text-yellow-700 dark:text-yellow-400">
                                <strong>Inventario destino:</strong> ${destinationInstitutionName}
                            </p>
                        </div>
                    </div>
                `;
                resetTransferSubmissionFlag();
                return;
            }
        } else {
            console.log('Missing inventory info, proceeding with available data', {
                hasCurrent: !!currentInventoryInfo,
                hasDestination: !!destinationInventoryInfo
            });
        }
        
        // Check if user is admin regional or warehouse for auto-approval message
        const isAdminRegional = (window.currentUserRole && window.currentUserRole.toUpperCase() === 'ADMIN_REGIONAL') ||
                               (window.location.pathname && window.location.pathname.includes('/admin_regional'));
        const isWarehouse = (window.currentUserRole && window.currentUserRole.toUpperCase() === 'WAREHOUSE') ||
                           (window.location.pathname && window.location.pathname.includes('/warehouse'));
        
        console.log('Building summary content...', { isAdminRegional, isWarehouse, currentInventoryInfo, destinationInventoryInfo });
        
        // Build summary content
        console.log('Building summary HTML...');
        content.innerHTML = `
            <div class="space-y-4">
                ${(isAdminRegional || isWarehouse) ? `
                    <div class="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                        <h3 class="text-lg font-semibold text-green-800 dark:text-green-300 mb-3">
                            <i class="fas fa-check-circle mr-2"></i>
                            Resumen de la Transferencia
                        </h3>
                        <p class="text-sm text-green-700 dark:text-green-400 font-medium mb-2">
                            <i class="fas fa-bolt mr-2"></i>
                            La transferencia será aprobada automáticamente al confirmar
                        </p>
                        <p class="text-xs text-green-600 dark:text-green-500">
                            Revisa los detalles antes de confirmar la transferencia
                        </p>
                    </div>
                ` : `
                    <div class="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                        <h3 class="text-lg font-semibold text-blue-800 dark:text-blue-300 mb-3">
                            <i class="fas fa-info-circle mr-2"></i>
                            Resumen de la Transferencia
                        </h3>
                        <p class="text-sm text-blue-700 dark:text-blue-400">
                            Revisa los detalles antes de confirmar la transferencia
                        </p>
                    </div>
                `}
                
                <div class="space-y-3">
                    <div class="p-4 border border-gray-200 dark:border-gray-700 rounded-xl">
                        <p class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Item a Transferir</p>
                        <p class="text-sm font-semibold text-gray-800 dark:text-gray-200">
                            ${itemName}
                        </p>
                        ${itemLicencePlate ? `
                            <p class="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                Placa: ${itemLicencePlate}
                            </p>
                        ` : ''}
                        <p class="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            ID: ${itemId}
                        </p>
                    </div>
                    
                    <div class="p-4 border border-gray-200 dark:border-gray-700 rounded-xl">
                        <p class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Inventario Actual</p>
                        <p class="text-sm font-semibold text-gray-800 dark:text-gray-200">
                            ${currentInventoryName}
                        </p>
                        ${currentInventoryId ? `
                            <p class="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                ID: ${currentInventoryId}
                            </p>
                        ` : ''}
                        ${currentInventoryInfo && currentInventoryInfo.institutionName ? `
                            <p class="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                <i class="fas fa-building mr-1"></i>
                                Centro: ${currentInventoryInfo.institutionName}
                            </p>
                        ` : ''}
                    </div>
                    
                    <div class="p-4 border-2 border-[#00AF00] dark:border-[#00AF00] rounded-xl bg-green-50 dark:bg-green-900/20">
                        <p class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Inventario de Destino</p>
                        <p class="text-sm font-semibold text-gray-800 dark:text-gray-200">
                            ${destinationInventoryInfo ? (destinationInventoryInfo.name || 'Sin nombre') : 'Inventario ID: ' + destinationInventoryId}
                        </p>
                        <p class="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            ID: ${destinationInventoryId}
                        </p>
                        ${destinationInventoryInfo && destinationInventoryInfo.institutionName ? `
                            <p class="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                <i class="fas fa-building mr-1"></i>
                                Centro: ${destinationInventoryInfo.institutionName}
                            </p>
                        ` : ''}
                    </div>
                    
                    ${currentInventoryInfo && destinationInventoryInfo && 
                      currentInventoryInfo.institutionId && destinationInventoryInfo.institutionId &&
                      currentInventoryInfo.institutionId === destinationInventoryInfo.institutionId ? `
                        <div class="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                            <p class="text-xs text-green-700 dark:text-green-400">
                                <i class="fas fa-check-circle mr-2"></i>
                                <strong>Validación exitosa:</strong> Ambos inventarios pertenecen al mismo centro
                            </p>
                        </div>
                    ` : ''}
                    
                    ${details ? `
                        <div class="p-4 border border-gray-200 dark:border-gray-700 rounded-xl">
                            <p class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Detalles / Observaciones</p>
                            <p class="text-sm text-gray-800 dark:text-gray-200">
                                ${details}
                            </p>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
        
        // Store transfer data for confirmation
        window.pendingTransferData = {
            itemId: parseInt(itemId),
            destinationInventoryId: parseInt(destinationInventoryId),
            details: details
        };
        console.log('Transfer data stored:', window.pendingTransferData);
        
        // Update button text for Admin Regional and Warehouse (isWarehouse already declared above)
        if (isAdminRegional || isWarehouse) {
            const confirmButton = document.querySelector('#transferSummaryModal button[onclick="confirmTransferRequest()"]');
            if (confirmButton) {
                confirmButton.innerHTML = `
                    <i class="fas fa-check-circle mr-2"></i>
                    Crear Transferencia (Aprobación Automática)
                `;
                console.log('Confirm button updated for warehouse/admin regional');
            } else {
                console.warn('Confirm button not found in modal');
            }
        }
        
        console.log('Modal content populated, modal should be visible');
        console.log('Content length:', content.innerHTML.length);
        console.log('Modal visible check:', !modal.classList.contains('hidden'), 'Display:', modal.style.display);
        
    } catch (error) {
        console.error('Error in showTransferSummaryModal:', error);
        console.error('Error stack:', error.stack);
        console.error('Error loading transfer summary:', error);
        content.innerHTML = `
            <div class="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                <p class="text-sm text-red-800 dark:text-red-300">
                    <i class="fas fa-exclamation-triangle mr-2"></i>
                    Error al cargar el resumen: ${error.message || 'Error desconocido'}
                </p>
            </div>
        `;
        // Reset flag on error
        resetTransferSubmissionFlag();
        
        // Show error toast
        if (window.showErrorToast) {
            window.showErrorToast('Error', 'No se pudo cargar el resumen de la transferencia: ' + (error.message || 'Error desconocido'));
        }
    }
}

/**
 * Closes transfer summary modal
 */
function closeTransferSummaryModal() {
    const modal = document.getElementById('transferSummaryModal');
    if (modal) {
        modal.classList.add('hidden');
    }
    window.pendingTransferData = null;
    // Reset submission flag when modal is closed
    resetTransferSubmissionFlag();
}

/**
 * Confirms and submits the transfer request
 */
async function confirmTransferRequest() {
    if (!window.pendingTransferData) {
        if (window.showErrorToast) {
            window.showErrorToast('Error', 'No hay datos de transferencia para confirmar');
        }
        return;
    }
    
    // Check if user is admin regional or warehouse
    const isAdminRegional = (window.currentUserRole && window.currentUserRole.toUpperCase() === 'ADMIN_REGIONAL') ||
                           (window.location.pathname && window.location.pathname.includes('/admin_regional'));
    const isWarehouse = (window.currentUserRole && window.currentUserRole.toUpperCase() === 'WAREHOUSE') ||
                       (window.location.pathname && window.location.pathname.includes('/warehouse'));
    
    const confirmButton = document.querySelector('#transferSummaryModal button[onclick="confirmTransferRequest()"]');
    const originalButtonText = confirmButton ? confirmButton.innerHTML : '';
    
    try {
        if (confirmButton) {
            confirmButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Procesando...';
            confirmButton.disabled = true;
        }
        
        console.log('Confirming transfer request...', window.pendingTransferData);
        const response = await window.requestTransfer(window.pendingTransferData);
        console.log('Transfer request response:', response);
        
        // Close all transfer-related modals
        if (typeof closeTransferSummaryModal === 'function') {
            closeTransferSummaryModal();
        }
        if (typeof closeNewTransferModal === 'function') {
            closeNewTransferModal();
        }
        if (typeof window.closeViewTransferModal === 'function') {
            window.closeViewTransferModal();
        }
        if (typeof window.closeApproveTransferModal === 'function') {
            window.closeApproveTransferModal();
        }
        if (typeof window.closeRejectTransferModal === 'function') {
            window.closeRejectTransferModal();
        }
        
        // Also close modals by directly hiding them (fallback)
        const modalsToClose = [
            'transferSummaryModal',
            'newTransferModal',
            'viewTransferModal',
            'approveTransferModal',
            'rejectTransferModal'
        ];
        modalsToClose.forEach(modalId => {
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.classList.add('hidden');
                modal.style.display = 'none';
            }
        });
        
        // Show success message after modals are closed
        setTimeout(() => {
            let title, message;
            
            if (isAdminRegional || isWarehouse) {
                title = 'Transferencia Aprobada Automáticamente';
                message = 'La transferencia ha sido creada y aprobada automáticamente por el sistema.';
            } else {
                title = 'Transferencia Solicitada';
                message = response.message || 'La transferencia ha sido solicitada exitosamente';
            }
            
            // Use showSuccessToast if available, otherwise fallback to alert
            if (window.showSuccessToast) {
                try {
                    window.showSuccessToast(title, message);
                } catch (error) {
                    console.error('Error showing success toast:', error);
                    alert(title + ': ' + message);
                }
            } else {
                alert(title + ': ' + message);
            }
        }, 300);
        
        // Reload transfers data
        if (isWarehouse && window.loadWarehouseTransfersData) {
            await window.loadWarehouseTransfersData();
        } else if (window.loadTransfersData) {
            await window.loadTransfersData();
        } else if (isAdminRegional && window.loadTransfersForAdminRegional) {
            await window.loadTransfersForAdminRegional();
        }
    } catch (error) {
        console.error('Error requesting transfer:', error);
        
        // Get error message
        let errorMessage = error.message || 'No se pudo solicitar la transferencia';
        
        // Determine if it's an institution validation error
        const isInstitutionError = errorMessage.includes('mismo centro') || 
                                  errorMessage.includes('pertenecer al mismo') ||
                                  errorMessage.includes('pertenecer a una institución');
        
        // Show visual error in the summary modal
        const content = document.getElementById('transferSummaryContent');
        if (content) {
            const bgColor = isInstitutionError ? 'bg-yellow-50 dark:bg-yellow-900/20' : 'bg-red-50 dark:bg-red-900/20';
            const borderColor = isInstitutionError ? 'border-yellow-200 dark:border-yellow-800' : 'border-red-200 dark:border-red-800';
            const textColor = isInstitutionError ? 'text-yellow-800 dark:text-yellow-300' : 'text-red-800 dark:text-red-300';
            const iconColor = isInstitutionError ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400';
            const icon = isInstitutionError ? 'fa-exclamation-triangle' : 'fa-times-circle';
            const title = isInstitutionError ? 'Validación de Centro' : 'Error al solicitar transferencia';
            
            const errorHtml = `
                <div class="p-4 ${bgColor} border ${borderColor} rounded-xl mb-4">
                    <p class="text-sm ${textColor} font-medium mb-1">
                        <i class="fas ${icon} ${iconColor} mr-2"></i>
                        ${title}
                    </p>
                    <p class="text-xs ${textColor}">
                        ${errorMessage}
                    </p>
                    ${isInstitutionError ? `
                        <p class="text-xs ${textColor} mt-2 opacity-90">
                            <i class="fas fa-info-circle mr-1"></i>
                            Los inventarios deben pertenecer al mismo centro para realizar la transferencia.
                        </p>
                    ` : ''}
                </div>
            `;
            content.innerHTML = errorHtml + content.innerHTML;
        }
        
        // Also show toast notification
        if (window.showErrorToast) {
            window.showErrorToast(
                isInstitutionError ? 'Validación de Centro' : 'Error al Solicitar Transferencia', 
                errorMessage + (isInstitutionError ? ' Los inventarios deben pertenecer al mismo centro.' : ''),
                true,
                6000
            );
        }
    } finally {
        if (confirmButton) {
            confirmButton.innerHTML = originalButtonText;
            confirmButton.disabled = false;
        }
    }
}

function populateApproveTransferForm(transferId) {
    const form = document.getElementById('approveTransferForm');
    if (!form) return;
    
    form.innerHTML = `
        <div class="space-y-4">
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notas de Aprobación</label>
                <textarea id="approveTransferNotes" 
                    rows="4" 
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00AF00]" 
                    placeholder="Notas adicionales sobre la aprobación (opcional, máximo 500 caracteres)"
                    maxlength="500"></textarea>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Información adicional sobre la aprobación</p>
            </div>
        </div>

        <div class="flex gap-3 pt-4">
            <button type="button" onclick="closeApproveTransferModal()" 
                class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                Cancelar
            </button>
            <button type="submit" 
                class="flex-1 px-4 py-2 bg-[#00AF00] hover:bg-[#008800] text-white rounded-xl transition-colors">
                Aprobar Transferencia
            </button>
        </div>
    `;
}

async function handleApproveTransferSubmit(event) {
    event.preventDefault();
    
    if (!window.transfersData || !window.transfersData.currentTransferId) {
        if (window.showErrorToast) {
            window.showErrorToast('Error de Validación', 'No se ha seleccionado una transferencia para aprobar.');
        }
        return;
    }
    
    const transferId = window.transfersData.currentTransferId;
    const approvalNotes = document.getElementById('approveTransferNotes')?.value?.trim() || '';
    
    const submitButton = event.target.querySelector('button[type="submit"]');
    const originalButtonText = submitButton ? submitButton.innerHTML : '';
    
    try {
        if (submitButton) {
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Procesando...';
            submitButton.disabled = true;
        }
        
        // Show processing notification
        if (window.showInfoToast) {
            window.showInfoToast('Procesando', 'Aprobando la transferencia...', true, 2000);
        }
        
        const approvalData = {
            approvalNotes: approvalNotes
        };
        
        const response = await window.approveTransfer(transferId, approvalData);
        
        if (window.showSuccessToast) {
            window.showSuccessToast(
                'Transferencia Aprobada', 
                response.message || 'La transferencia ha sido aprobada exitosamente. El inventario será actualizado.',
                true,
                5000
            );
        }
        
        closeApproveTransferModal();
        
        // Reload transfers data - check which page we're on
        const path = window.location.pathname || '';
        if (path.includes('/admin_institution/transfers') || path.includes('/admininstitution/transfers')) {
            if (window.loadTransfersForAdminInstitution) {
                await window.loadTransfersForAdminInstitution();
            }
        } else if (path.includes('/admin_regional/transfers')) {
            if (window.loadTransfersForAdminRegional) {
                await window.loadTransfersForAdminRegional();
            }
        } else if (window.loadTransfersData) {
            await window.loadTransfersData();
        }
    } catch (error) {
        console.error('Error approving transfer:', error);
        if (window.showErrorToast) {
            window.showErrorToast(
                'Error al Aprobar', 
                error.message || 'No se pudo aprobar la transferencia. Por favor, verifica los datos e intenta nuevamente.',
                true,
                5000
            );
        }
    } finally {
        if (submitButton) {
            submitButton.innerHTML = originalButtonText;
            submitButton.disabled = false;
        }
    }
}

function populateRejectTransferForm(transferId) {
    const form = document.getElementById('rejectTransferForm');
    if (!form) return;
    
    form.innerHTML = `
        <div class="space-y-4">
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notas de Rechazo</label>
                <textarea id="rejectTransferNotes" 
                    rows="4" 
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500" 
                    placeholder="Razón del rechazo (opcional, máximo 500 caracteres)"
                    maxlength="500"></textarea>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Información adicional sobre el rechazo</p>
            </div>
        </div>

        <div class="flex gap-3 pt-4">
            <button type="button" onclick="closeRejectTransferModal()" 
                class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                Cancelar
            </button>
            <button type="submit" 
                class="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors">
                Rechazar Transferencia
            </button>
        </div>
    `;
}

async function handleRejectTransferSubmit(event) {
    event.preventDefault();
    
    if (!window.transfersData || !window.transfersData.currentTransferId) {
        if (window.showErrorToast) {
            window.showErrorToast('Error de Validación', 'No se ha seleccionado una transferencia para rechazar.');
        }
        return;
    }
    
    const transferId = window.transfersData.currentTransferId;
    const rejectionNotes = document.getElementById('rejectTransferNotes')?.value?.trim() || '';
    
    const submitButton = event.target.querySelector('button[type="submit"]');
    const originalButtonText = submitButton ? submitButton.innerHTML : '';
    
    try {
        if (submitButton) {
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Procesando...';
            submitButton.disabled = true;
        }
        
        // Show processing notification
        if (window.showInfoToast) {
            window.showInfoToast('Procesando', 'Rechazando la transferencia...', true, 2000);
        }
        
        const rejectionData = {
            rejectionNotes: rejectionNotes
        };
        
        const response = await window.rejectTransfer(transferId, rejectionData);
        
        if (window.showSuccessToast) {
            window.showSuccessToast(
                'Transferencia Rechazada', 
                response.message || 'La transferencia ha sido rechazada exitosamente. El solicitante será notificado.',
                true,
                5000
            );
        }
        
        closeRejectTransferModal();
        
        // Reload transfers data - check which page we're on
        const path = window.location.pathname || '';
        if (path.includes('/admin_institution/transfers') || path.includes('/admininstitution/transfers')) {
            if (window.loadTransfersForAdminInstitution) {
                await window.loadTransfersForAdminInstitution();
            }
        } else if (path.includes('/admin_regional/transfers')) {
            if (window.loadTransfersForAdminRegional) {
                await window.loadTransfersForAdminRegional();
            }
        } else if (window.loadTransfersData) {
            await window.loadTransfersData();
        }
    } catch (error) {
        console.error('Error rejecting transfer:', error);
        if (window.showErrorToast) {
            window.showErrorToast(
                'Error al Rechazar', 
                error.message || 'No se pudo rechazar la transferencia. Por favor, verifica los datos e intenta nuevamente.',
                true,
                5000
            );
        }
    } finally {
        if (submitButton) {
            submitButton.innerHTML = originalButtonText;
            submitButton.disabled = false;
        }
    }
}

// Variables for transfer form selects
let newTransferRegionalSelect = null;
let newTransferInstitutionSelect = null;
let newTransferInventorySelect = null;

// Ensure CustomSelect is available - it should be loaded from centers.js
// Wait for it to be available
if (typeof window.CustomSelect === "undefined" && typeof CustomSelect === "undefined") {
    // Wait a bit for centers.js to load
    setTimeout(() => {
        if (typeof window.CustomSelect === "undefined" && typeof CustomSelect === "undefined") {
            console.warn("CustomSelect not found. Please ensure centers.js is loaded before transfers-forms.js");
        }
    }, 500);
}

/**
 * Initialize transfer form selects for superadmin
 */
function initializeTransferFormSelects() {
    // Check if CustomSelect is available
    const CustomSelectClass = window.CustomSelect || CustomSelect;
    if (!CustomSelectClass) {
        console.error('CustomSelect is not available');
        return;
    }
    
    // Verify elements exist before initializing
    const regionalContainer = document.getElementById('newTransferRegionalSelect');
    const institutionContainer = document.getElementById('newTransferInstitutionSelect');
    const inventoryContainer = document.getElementById('newTransferInventorySelect');
    
    if (!regionalContainer || !institutionContainer || !inventoryContainer) {
        console.warn('Transfer form select containers not found, retrying...');
        setTimeout(() => initializeTransferFormSelects(), 100);
        return;
    }
    
    // Initialize regional select
    if (!newTransferRegionalSelect) {
        try {
            const selectInstance = new CustomSelectClass('newTransferRegionalSelect', {
                placeholder: 'Seleccione una regional',
                onChange: async (option) => {
                    if (option && option.value) {
                        // Clear and disable institution and inventory selects
                        if (newTransferInstitutionSelect) {
                            newTransferInstitutionSelect.clear();
                            newTransferInstitutionSelect.setDisabled(true);
                        }
                        if (newTransferInventorySelect) {
                            newTransferInventorySelect.clear();
                            newTransferInventorySelect.setDisabled(true);
                        }
                        // Load institutions for selected regional
                        await loadInstitutionsForTransferForm(parseInt(option.value));
                    } else {
                        // Clear all dependent selects
                        if (newTransferInstitutionSelect) {
                            newTransferInstitutionSelect.clear();
                            newTransferInstitutionSelect.setDisabled(true);
                        }
                        if (newTransferInventorySelect) {
                            newTransferInventorySelect.clear();
                            newTransferInventorySelect.setDisabled(true);
                        }
                    }
                }
            });
            
            // Only assign if initialization was successful
            if (selectInstance && selectInstance.container) {
                newTransferRegionalSelect = selectInstance;
            } else {
                console.warn('Failed to initialize regional select - container or elements not found');
            }
        } catch (error) {
            console.error('Error initializing regional select:', error);
        }
    }

    // Initialize institution select
    if (!newTransferInstitutionSelect) {
        try {
            const selectInstance = new CustomSelectClass('newTransferInstitutionSelect', {
                placeholder: 'Seleccione un centro',
                onChange: async (option) => {
                    if (option && option.value) {
                        // Clear and disable inventory select
                        if (newTransferInventorySelect) {
                            newTransferInventorySelect.clear();
                            newTransferInventorySelect.setDisabled(true);
                        }
                        // Load inventories for selected institution
                        await loadInventoriesForTransferForm(parseInt(option.value));
                    } else {
                        // Clear inventory select
                        if (newTransferInventorySelect) {
                            newTransferInventorySelect.clear();
                            newTransferInventorySelect.setDisabled(true);
                        }
                    }
                }
            });
            
            // Only assign if initialization was successful
            if (selectInstance && selectInstance.container) {
                newTransferInstitutionSelect = selectInstance;
                // Initially disabled
                if (newTransferInstitutionSelect.setDisabled) {
                    newTransferInstitutionSelect.setDisabled(true);
                }
            } else {
                console.warn('Failed to initialize institution select - container or elements not found');
            }
        } catch (error) {
            console.error('Error initializing institution select:', error);
        }
    }

    // Initialize inventory select
    if (!newTransferInventorySelect) {
        try {
            const selectInstance = new CustomSelectClass('newTransferInventorySelect', {
                placeholder: 'Seleccione un inventario',
                onChange: (option) => {
                    if (option && option.value) {
                        const hiddenInput = document.getElementById('newTransferDestinationInventoryId');
                        if (hiddenInput) {
                            hiddenInput.value = option.value;
                        }
                    } else {
                        const hiddenInput = document.getElementById('newTransferDestinationInventoryId');
                        if (hiddenInput) {
                            hiddenInput.value = '';
                        }
                    }
                }
            });
            
            // Only assign if initialization was successful
            if (selectInstance && selectInstance.container) {
                newTransferInventorySelect = selectInstance;
                // Initially disabled
                if (newTransferInventorySelect.setDisabled) {
                    newTransferInventorySelect.setDisabled(true);
                }
            } else {
                console.warn('Failed to initialize inventory select - container or elements not found');
            }
        } catch (error) {
            console.error('Error initializing inventory select:', error);
        }
    }
}

/**
 * Load regionals for transfer form
 */
async function loadRegionalsForTransferForm() {
    try {
        // Wait for select to be initialized
        if (!newTransferRegionalSelect) {
            console.warn('Regional select not initialized yet, retrying...');
            setTimeout(() => loadRegionalsForTransferForm(), 200);
            return;
        }
        
        const response = await fetch('/api/v1/regional', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const regionals = await response.json();
            const regionalOptions = regionals.map(regional => ({
                value: regional.id.toString(),
                label: regional.name
            }));

            if (newTransferRegionalSelect && typeof newTransferRegionalSelect.setOptions === 'function') {
                newTransferRegionalSelect.setOptions(regionalOptions);
            } else {
                console.warn('Regional select is not properly initialized');
            }
        }
    } catch (error) {
        console.error('Error loading regionals for transfer form:', error);
    }
}

/**
 * Load institutions for transfer form based on regional
 */
async function loadInstitutionsForTransferForm(regionalId) {
    try {
        const response = await fetch(`/api/v1/institutions/institutionsByRegionalId/${regionalId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const institutions = await response.json();
            const institutionOptions = institutions.map(institution => ({
                value: institution.institutionId ? institution.institutionId.toString() : institution.id.toString(),
                label: institution.name
            }));

            if (newTransferInstitutionSelect) {
                newTransferInstitutionSelect.setOptions(institutionOptions);
                newTransferInstitutionSelect.setDisabled(false);
            }
        } else {
            throw new Error('Error al cargar las instituciones');
        }
    } catch (error) {
        console.error('Error loading institutions for transfer form:', error);
        if (newTransferInstitutionSelect) {
            newTransferInstitutionSelect.setOptions([]);
        }
    }
}

/**
 * Load inventories for warehouse transfer form (from warehouse's regional)
 */
async function loadInventoriesForAdminRegionalTransferForm() {
    try {
        const token = localStorage.getItem('jwt');
        if (!token) {
            throw new Error('No authentication token found');
        }

        // Get current user info to get regional ID
        const userResponse = await fetch('/api/v1/users/me', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!userResponse.ok) {
            throw new Error('Error al cargar la información del usuario');
        }

        const userData = await userResponse.json();
        const institutionName = userData.institution;

        if (!institutionName) {
            throw new Error('Usuario no tiene una institución asignada');
        }

        // Fetch all institutions to find the user's institution
        const institutionsResponse = await fetch('/api/v1/institutions', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!institutionsResponse.ok) {
            throw new Error('Error al cargar las instituciones');
        }

        const institutions = await institutionsResponse.json();
        const userInstitution = institutions.find(inst => inst.name === institutionName);

        if (!userInstitution || !userInstitution.regionalId) {
            throw new Error('No se pudo determinar la regional del usuario');
        }

        const regionalId = userInstitution.regionalId;

        // Load inventories for the regional
        const response = await fetch(`/api/v1/inventory/regionalAdminInventories?page=0&size=10000`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Error al cargar los inventarios');
        }

        const data = await response.json();
        const inventories = Array.isArray(data.content) ? data.content : [];

        if (!inventories || inventories.length === 0) {
            if (newTransferInventorySelect) {
                newTransferInventorySelect.setOptions([{
                    value: '',
                    label: 'No hay inventarios disponibles en tu regional'
                }]);
                newTransferInventorySelect.setDisabled(true);
            }
            if (window.showErrorToast) {
                window.showErrorToast('Sin inventarios', 'No se encontraron inventarios en tu regional para realizar transferencias.');
            }
            return;
        }

        const inventoryOptions = inventories.map(inventory => ({
            value: inventory.inventoryId ? inventory.inventoryId.toString() : inventory.id.toString(),
            label: inventory.name || `Inventario ${inventory.inventoryId || inventory.id}`
        }));

        if (newTransferInventorySelect) {
            newTransferInventorySelect.setOptions(inventoryOptions);
            newTransferInventorySelect.setDisabled(false);
        }
    } catch (error) {
        console.error('Error loading inventories for admin regional transfer form:', error);
        if (newTransferInventorySelect) {
            newTransferInventorySelect.setOptions([{
                value: '',
                label: 'Error al cargar inventarios'
            }]);
            newTransferInventorySelect.setDisabled(true);
        }
        if (window.showErrorToast) {
            window.showErrorToast('Error', 'No se pudieron cargar los inventarios: ' + error.message);
        }
    }
}

async function loadInventoriesForWarehouseTransferForm() {
    try {
        console.log('loadInventoriesForWarehouseTransferForm called');
        const selectInstance = newTransferInventorySelect || window.newTransferInventorySelect;
        
        if (!selectInstance) {
            console.error('newTransferInventorySelect is not initialized');
            // Try to initialize it again
            const inventoryContainer = document.getElementById('newTransferInventorySelect');
            if (inventoryContainer) {
                const CustomSelectClass = window.CustomSelect || (typeof CustomSelect !== 'undefined' ? CustomSelect : null);
                if (CustomSelectClass) {
                    try {
                        const selectInstance = new CustomSelectClass('newTransferInventorySelect', {
                            placeholder: 'Seleccione un inventario',
                            onChange: (option) => {
                                if (option && option.value) {
                                    const hiddenInput = document.getElementById('newTransferDestinationInventoryId');
                                    if (hiddenInput) {
                                        hiddenInput.value = option.value;
                                    }
                                } else {
                                    const hiddenInput = document.getElementById('newTransferDestinationInventoryId');
                                    if (hiddenInput) {
                                        hiddenInput.value = '';
                                    }
                                }
                            }
                        });
                        newTransferInventorySelect = selectInstance;
                        window.newTransferInventorySelect = selectInstance;
                        console.log('Re-initialized warehouse inventory select');
                    } catch (error) {
                        console.error('Error re-initializing select:', error);
                    }
                }
            }
        }
        
        // Use the function from transfers-warehouse.js if available
        if (window.loadInventoriesForWarehouseTransfer) {
            console.log('Using loadInventoriesForWarehouseTransfer from transfers-warehouse.js');
            const inventories = await window.loadInventoriesForWarehouseTransfer();
            console.log('Inventories loaded:', inventories);
            
            if (!inventories || inventories.length === 0) {
                const select = newTransferInventorySelect || window.newTransferInventorySelect;
                if (select) {
                    select.setOptions([{
                        value: '',
                        label: 'No hay inventarios disponibles en tu regional'
                    }]);
                    select.setDisabled(true);
                }
                if (window.showErrorToast) {
                    window.showErrorToast('Sin inventarios', 'No se encontraron inventarios en tu regional para realizar transferencias.');
                }
                return;
            }
            
            const inventoryOptions = inventories.map(inventory => ({
                value: inventory.inventoryId ? inventory.inventoryId.toString() : inventory.id.toString(),
                label: inventory.name || `Inventario ${inventory.inventoryId || inventory.id}`
            }));

            const select = newTransferInventorySelect || window.newTransferInventorySelect;
            if (select) {
                console.log('Setting options to select:', inventoryOptions);
                select.setOptions(inventoryOptions);
                select.setDisabled(false);
                console.log('Options set successfully, select enabled');
            } else {
                console.error('Select instance not available when trying to set options');
            }
            return;
        }
        
        // Fallback: try to load from institution endpoint
        const token = localStorage.getItem('jwt');
        const headers = {
            'Content-Type': 'application/json'
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`/api/v1/inventory/institutionAdminInventories?page=0&size=1000`, {
            method: 'GET',
            headers: headers
        });

        if (response.ok) {
            const data = await response.json();
            const inventories = Array.isArray(data.content) ? data.content : (Array.isArray(data) ? data : []);
            
            if (inventories.length === 0) {
                if (newTransferInventorySelect) {
                    newTransferInventorySelect.setOptions([{
                        value: '',
                        label: 'No hay inventarios disponibles'
                    }]);
                    newTransferInventorySelect.setDisabled(true);
                }
                return;
            }
            
            const inventoryOptions = inventories.map(inventory => ({
                value: inventory.inventoryId ? inventory.inventoryId.toString() : inventory.id.toString(),
                label: inventory.name || `Inventario ${inventory.inventoryId || inventory.id}`
            }));

            if (newTransferInventorySelect) {
                newTransferInventorySelect.setOptions(inventoryOptions);
                newTransferInventorySelect.setDisabled(false);
            }
        } else {
            let errorMessage = `Error al cargar inventarios: ${response.statusText}`;
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorData.detail || errorMessage;
            } catch (e) {
                // Ignore parse error
            }
            throw new Error(errorMessage);
        }
    } catch (error) {
        console.error('Error loading inventories for warehouse transfer form:', error);
        if (newTransferInventorySelect) {
            newTransferInventorySelect.setOptions([{
                value: '',
                label: 'Error al cargar inventarios'
            }]);
            newTransferInventorySelect.setDisabled(true);
        }
        if (window.showErrorToast) {
            window.showErrorToast('Error', `No se pudieron cargar los inventarios: ${error.message}`);
        }
    }
}

/**
 * Load inventories for transfer form based on institution
 */
async function loadInventoriesForTransferForm(institutionId) {
    try {
        const token = localStorage.getItem('jwt');
        const headers = {
            'Content-Type': 'application/json'
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        // Fetch all inventories for the institution (using a large page size to get all)
        const response = await fetch(`/api/v1/inventory/institutionAdminInventories/${institutionId}?page=0&size=1000`, {
            method: 'GET',
            headers: headers
        });

        if (response.ok) {
            const data = await response.json();
            const inventories = Array.isArray(data.content) ? data.content : (Array.isArray(data) ? data : []);
            
            const inventoryOptions = inventories.map(inventory => ({
                value: inventory.inventoryId ? inventory.inventoryId.toString() : inventory.id.toString(),
                label: inventory.name || `Inventario ${inventory.inventoryId || inventory.id}`
            }));

            if (newTransferInventorySelect) {
                newTransferInventorySelect.setOptions(inventoryOptions);
                newTransferInventorySelect.setDisabled(false);
            }
        } else {
            throw new Error('Error al cargar los inventarios');
        }
    } catch (error) {
        console.error('Error loading inventories for transfer form:', error);
        if (newTransferInventorySelect) {
            newTransferInventorySelect.setOptions([]);
        }
    }
}

// Export functions globally
window.populateNewTransferForm = populateNewTransferForm;
window.handleNewTransferSubmit = handleNewTransferSubmit;
window.resetTransferSubmissionFlag = resetTransferSubmissionFlag;
window.populateApproveTransferForm = populateApproveTransferForm;
window.handleApproveTransferSubmit = handleApproveTransferSubmit;
window.populateRejectTransferForm = populateRejectTransferForm;
window.handleRejectTransferSubmit = handleRejectTransferSubmit;
window.verifyItemByLicencePlate = verifyItemByLicencePlate;
window.initializeTransferFormSelects = initializeTransferFormSelects;
window.loadRegionalsForTransferForm = loadRegionalsForTransferForm;
window.loadInventoriesForWarehouseTransferForm = loadInventoriesForWarehouseTransferForm;
window.loadInventoriesForAdminRegionalTransferForm = loadInventoriesForAdminRegionalTransferForm;
window.showTransferSummaryModal = showTransferSummaryModal;
window.closeTransferSummaryModal = closeTransferSummaryModal;
window.confirmTransferRequest = confirmTransferRequest;
window.validateInstitutionMatch = validateInstitutionMatch;

