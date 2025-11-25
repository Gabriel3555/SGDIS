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
});

function populateNewTransferForm(itemId = null) {
    const form = document.getElementById('newTransferForm');
    if (!form) return;
    
    // If itemId is provided, pre-fill it
    const itemIdValue = itemId || '';
    
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

async function handleNewTransferSubmit(event) {
    event.preventDefault();
    
    const itemId = document.getElementById('newTransferItemId')?.value?.trim();
    const destinationInventoryId = document.getElementById('newTransferDestinationInventoryId')?.value?.trim();
    const details = document.getElementById('newTransferDetails')?.value?.trim() || '';
    
    if (!itemId || !destinationInventoryId) {
        if (window.showErrorToast) {
            window.showErrorToast('Error', 'Por favor completa todos los campos requeridos');
        }
        return;
    }
    
    const submitButton = event.target.querySelector('button[type="submit"]');
    const originalButtonText = submitButton ? submitButton.innerHTML : '';
    
    try {
        if (submitButton) {
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Procesando...';
            submitButton.disabled = true;
        }
        
        const transferData = {
            itemId: parseInt(itemId),
            destinationInventoryId: parseInt(destinationInventoryId),
            details: details
        };
        
        const response = await window.requestTransfer(transferData);
        
        if (window.showSuccessToast) {
            window.showSuccessToast('Transferencia Solicitada', response.message || 'La transferencia ha sido solicitada exitosamente');
        }
        
        closeNewTransferModal();
        
        // Reload transfers data
        if (window.loadTransfersData) {
            await window.loadTransfersData();
        }
    } catch (error) {
        console.error('Error requesting transfer:', error);
        if (window.showErrorToast) {
            window.showErrorToast('Error', error.message || 'No se pudo solicitar la transferencia');
        }
    } finally {
        if (submitButton) {
            submitButton.innerHTML = originalButtonText;
            submitButton.disabled = false;
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
            window.showErrorToast('Error', 'No se ha seleccionado una transferencia');
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
        
        const approvalData = {
            approvalNotes: approvalNotes
        };
        
        const response = await window.approveTransfer(transferId, approvalData);
        
        if (window.showSuccessToast) {
            window.showSuccessToast('Transferencia Aprobada', response.message || 'La transferencia ha sido aprobada exitosamente');
        }
        
        closeApproveTransferModal();
        
        // Reload transfers data
        if (window.loadTransfersData) {
            await window.loadTransfersData();
        }
    } catch (error) {
        console.error('Error approving transfer:', error);
        if (window.showErrorToast) {
            window.showErrorToast('Error', error.message || 'No se pudo aprobar la transferencia');
        }
    } finally {
        if (submitButton) {
            submitButton.innerHTML = originalButtonText;
            submitButton.disabled = false;
        }
    }
}

// Export functions globally
window.populateNewTransferForm = populateNewTransferForm;
window.handleNewTransferSubmit = handleNewTransferSubmit;
window.populateApproveTransferForm = populateApproveTransferForm;
window.handleApproveTransferSubmit = handleApproveTransferSubmit;

