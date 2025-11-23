// Show New Verification Modal
function showNewVerificationModal() {
    const modal = document.getElementById('newVerificationModal');
    if (modal) {
        modal.classList.remove('hidden');
        // Reset form
        document.getElementById('newVerificationForm').reset();
        selectVerificationType('serial');
    }
}

// Close New Verification Modal
function closeNewVerificationModal() {
    const modal = document.getElementById('newVerificationModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

// Select Verification Type
function selectVerificationType(type) {
    verificationData.verificationType = type;
    
    const serialBtn = document.getElementById('serialTypeBtn');
    const plateBtn = document.getElementById('plateTypeBtn');
    const serialForm = document.getElementById('serialNumberForm');
    const plateForm = document.getElementById('licensePlateForm');
    
    if (type === 'serial') {
        serialBtn?.classList.add('selected');
        plateBtn?.classList.remove('selected');
        if (serialForm) serialForm.style.display = 'block';
        if (plateForm) plateForm.style.display = 'none';
    } else {
        plateBtn?.classList.add('selected');
        serialBtn?.classList.remove('selected');
        if (plateForm) plateForm.style.display = 'block';
        if (serialForm) serialForm.style.display = 'none';
    }
}

// Show View Verification Modal
async function showViewVerificationModal(verificationId) {
    const modal = document.getElementById('viewVerificationModal');
    const content = document.getElementById('viewVerificationContent');
    
    if (!modal || !content) return;
    
    modal.classList.remove('hidden');
    content.innerHTML = `
        <div class="flex items-center justify-center py-8">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00AF00]"></div>
        </div>
    `;
    
    try {
        const verification = verificationData.verifications.find(v => v.id === verificationId);
        
        if (!verification) {
            content.innerHTML = `
                <div class="text-center py-8">
                    <i class="fas fa-exclamation-triangle text-red-500 text-4xl mb-4"></i>
                    <p class="text-gray-600">No se encontró la verificación.</p>
                </div>
            `;
            return;
        }
        
        const statusColor = getStatusColor(verification.status);
        const statusText = getStatusText(verification.status);
        
        content.innerHTML = `
            <!-- Verification Information -->
            <div class="bg-gray-50 rounded-xl p-6">
                <h3 class="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <i class="fas fa-clipboard-check text-[#00AF00] mr-2"></i>
                    Información de la Verificación
                </h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">ID de Verificación</label>
                        <p class="text-gray-900 font-semibold">${verification.id || '-'}</p>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                        <span class="px-3 py-1 rounded-full text-xs font-medium ${statusColor}">
                            ${statusText}
                        </span>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            ${verification.serialNumber ? 'Número de Serie' : 'Placa'}
                        </label>
                        <p class="text-gray-900 font-semibold">${verification.serialNumber || verification.licensePlate || '-'}</p>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Fecha de Verificación</label>
                        <p class="text-gray-900">${verification.verificationDate ? new Date(verification.verificationDate).toLocaleDateString('es-ES') : '-'}</p>
                    </div>
                    <div class="md:col-span-2">
                        <label class="block text-sm font-medium text-gray-700 mb-1">Item</label>
                        <p class="text-gray-900">${verification.itemName || '-'}</p>
                    </div>
                    <div class="md:col-span-2">
                        <label class="block text-sm font-medium text-gray-700 mb-1">Inventario</label>
                        <p class="text-gray-900">${verification.inventoryName || '-'}</p>
                    </div>
                    <div class="md:col-span-2">
                        <label class="block text-sm font-medium text-gray-700 mb-1">Evidencia</label>
                        <div class="flex items-center gap-2">
                            ${verification.hasEvidence ? 
                                '<i class="fas fa-check-circle text-green-500"></i><span class="text-gray-900">Disponible</span>' : 
                                '<i class="fas fa-times-circle text-gray-300"></i><span class="text-gray-900">No disponible</span>'
                            }
                        </div>
                    </div>
                    ${verification.notes ? `
                        <div class="md:col-span-2">
                            <label class="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                            <p class="text-gray-900">${verification.notes}</p>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error loading verification details:', error);
        content.innerHTML = `
            <div class="text-center py-8">
                <i class="fas fa-exclamation-triangle text-red-500 text-4xl mb-4"></i>
                <p class="text-gray-600">Error al cargar los detalles de la verificación.</p>
            </div>
        `;
    }
}

// Close View Verification Modal
function closeViewVerificationModal() {
    const modal = document.getElementById('viewVerificationModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

// Show Upload Evidence Modal
function showUploadEvidenceModal(verificationId) {
    verificationData.currentVerificationId = verificationId;
    const modal = document.getElementById('uploadEvidenceModal');
    if (modal) {
        modal.classList.remove('hidden');
        document.getElementById('uploadEvidenceForm').reset();
        document.getElementById('evidenceFileName').textContent = 'JPG, PNG, PDF. Máx. 5MB';
    }
}

// Close Upload Evidence Modal
function closeUploadEvidenceModal() {
    const modal = document.getElementById('uploadEvidenceModal');
    if (modal) {
        modal.classList.add('hidden');
    }
    verificationData.currentVerificationId = null;
}

// Show Delete Verification Modal
function showDeleteVerificationModal(verificationId) {
    verificationData.currentVerificationId = verificationId;
    const modal = document.getElementById('deleteVerificationModal');
    if (modal) {
        modal.classList.remove('hidden');
    }
}

// Close Delete Verification Modal
function closeDeleteVerificationModal() {
    const modal = document.getElementById('deleteVerificationModal');
    if (modal) {
        modal.classList.add('hidden');
    }
    verificationData.currentVerificationId = null;
}

// Confirm Delete Evidence
async function confirmDeleteEvidence() {
    if (!verificationData.currentVerificationId) {
        showErrorToast('Error', 'No se ha seleccionado una verificación');
        return;
    }

    try {
        await deleteEvidence(verificationData.currentVerificationId);
        showSuccessToast('Evidencia eliminada', 'La evidencia se eliminó correctamente');
        closeDeleteVerificationModal();
        await loadVerificationData();
    } catch (error) {
        console.error('Error deleting evidence:', error);
        showErrorToast('Error', error.message || 'Error al eliminar la evidencia');
    }
}

// Handle Evidence File Change
function handleEvidenceFileChange(event) {
    const file = event.target.files[0];
    const fileNameDisplay = document.getElementById('evidenceFileName');
    
    if (file) {
        const fileSize = file.size / 1024 / 1024; // Convert to MB
        if (fileSize > 5) {
            showErrorToast('Archivo muy grande', 'El archivo no debe superar 5MB');
            event.target.value = '';
            fileNameDisplay.textContent = 'JPG, PNG, PDF. Máx. 5MB';
            return;
        }
        
        fileNameDisplay.textContent = file.name;
    } else {
        fileNameDisplay.textContent = 'JPG, PNG, PDF. Máx. 5MB';
    }
}

window.showNewVerificationModal = showNewVerificationModal;
window.closeNewVerificationModal = closeNewVerificationModal;
window.selectVerificationType = selectVerificationType;
window.showViewVerificationModal = showViewVerificationModal;
window.closeViewVerificationModal = closeViewVerificationModal;
window.showUploadEvidenceModal = showUploadEvidenceModal;
window.closeUploadEvidenceModal = closeUploadEvidenceModal;
window.showDeleteVerificationModal = showDeleteVerificationModal;
window.closeDeleteVerificationModal = closeDeleteVerificationModal;
window.confirmDeleteEvidence = confirmDeleteEvidence;
window.handleEvidenceFileChange = handleEvidenceFileChange;

