// Show New Verification Modal
function showNewVerificationModal() {
    const modal = document.getElementById('newVerificationModal');
    if (modal) {
        modal.classList.remove('hidden');
        // Reset form
        document.getElementById('newVerificationForm').reset();
        selectVerificationType('serial');
        // Clear evidence
        if (typeof clearNewVerificationEvidence === 'function') {
            clearNewVerificationEvidence();
        }
    }
}

// Close New Verification Modal
function closeNewVerificationModal() {
    const modal = document.getElementById('newVerificationModal');
    if (modal) {
        modal.classList.add('hidden');
        // Clear evidence
        if (typeof clearNewVerificationEvidence === 'function') {
            clearNewVerificationEvidence();
        }
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
                        <label class="block text-sm font-medium text-gray-700 mb-1">Fecha de Verificación</label>
                        <p class="text-gray-900">${verification.verificationDate ? new Date(verification.verificationDate).toLocaleDateString('es-ES') : '-'}</p>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            ${verification.serialNumber ? 'Número de Serie' : 'Placa'}
                        </label>
                        <p class="text-gray-900 font-semibold">${verification.serialNumber || verification.licensePlate || '-'}</p>
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
                        ${verification.hasEvidence ? `
                            <div class="mt-3 space-y-3">
                                <div class="flex items-center gap-2 mb-2">
                                    <i class="fas fa-check-circle text-green-500"></i>
                                    <span class="text-gray-900 font-medium">Disponible</span>
                                </div>
                                <div id="evidence-preview-container-${verification.id}" class="relative group">
                                    <div class="flex items-center justify-center py-8">
                                        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00AF00]"></div>
                                    </div>
                                </div>
                                <div class="flex gap-2 mt-2">
                                    <button onclick="downloadEvidence(${verification.id})" 
                                        class="px-4 py-2 bg-[#00AF00] text-white rounded-lg hover:bg-[#008800] transition-colors flex items-center gap-2">
                                        <i class="fas fa-download"></i>
                                        Descargar
                                    </button>
                                    <button onclick="openImagePreviewForVerification(${verification.id})"
                                        class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2">
                                        <i class="fas fa-expand"></i>
                                        Ver completa
                                    </button>
                                </div>
                            </div>
                        ` : `
                            <div class="flex items-center gap-2">
                                <i class="fas fa-times-circle text-gray-300"></i>
                                <span class="text-gray-900">No disponible</span>
                            </div>
                        `}
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
        
        // Load evidence image if available
        if (verification.hasEvidence) {
            loadEvidencePreview(verification.id);
        }
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

// Load evidence preview with authentication
async function loadEvidencePreview(verificationId) {
    const container = document.getElementById(`evidence-preview-container-${verificationId}`);
    if (!container) return;

    try {
        const token = localStorage.getItem('jwt');
        const headers = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(`/api/v1/verifications/${verificationId}/evidence`, {
            method: 'GET',
            headers: headers
        });

        if (response.ok) {
            const blob = await response.blob();
            const imageUrl = URL.createObjectURL(blob);
            
            container.innerHTML = `
                <img src="${imageUrl}" 
                     alt="Evidencia de verificación"
                     class="w-full max-w-md rounded-lg shadow-md cursor-pointer hover:shadow-xl transition-shadow duration-200"
                     onclick="openImagePreviewForVerification(${verificationId})"
                />
                <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200 rounded-lg flex items-center justify-center pointer-events-none">
                    <i class="fas fa-search-plus text-white text-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"></i>
                </div>
            `;
        } else {
            throw new Error('No se pudo cargar la imagen');
        }
    } catch (error) {
        console.error('Error loading evidence preview:', error);
        container.innerHTML = `
            <div class="bg-gray-100 rounded-lg p-8 text-center">
                <i class="fas fa-image text-gray-400 text-4xl mb-2"></i>
                <p class="text-gray-600 text-sm">No se pudo cargar la vista previa</p>
            </div>
        `;
    }
}

// Open image preview for a specific verification
async function openImagePreviewForVerification(verificationId) {
    try {
        const token = localStorage.getItem('jwt');
        const headers = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(`/api/v1/verifications/${verificationId}/evidence`, {
            method: 'GET',
            headers: headers
        });

        if (response.ok) {
            const blob = await response.blob();
            const imageUrl = URL.createObjectURL(blob);
            openImagePreview(imageUrl);
        } else {
            showErrorToast('Error', 'No se pudo cargar la imagen');
        }
    } catch (error) {
        console.error('Error loading image:', error);
        showErrorToast('Error', 'No se pudo cargar la imagen');
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

// Open Image Preview in full screen
function openImagePreview(imageUrl) {
    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center';
    overlay.style.zIndex = '10005';
    overlay.onclick = function(e) {
        if (e.target === overlay) {
            document.body.removeChild(overlay);
        }
    };

    // Create image container
    const container = document.createElement('div');
    container.className = 'relative max-w-7xl max-h-screen p-4';

    // Create close button
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '<i class="fas fa-times text-2xl"></i>';
    closeBtn.className = 'absolute top-4 right-4 text-white hover:text-gray-300 bg-black bg-opacity-50 rounded-full w-10 h-10 flex items-center justify-center z-10';
    closeBtn.onclick = function() {
        document.body.removeChild(overlay);
    };

    // Create image
    const img = document.createElement('img');
    img.src = imageUrl;
    img.className = 'max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl';
    img.alt = 'Vista previa de evidencia';
    
    // Add loading spinner
    const spinner = document.createElement('div');
    spinner.className = 'animate-spin rounded-full h-12 w-12 border-b-2 border-white';
    container.appendChild(spinner);
    
    img.onload = function() {
        spinner.remove();
    };
    
    img.onerror = function() {
        spinner.remove();
        const errorMsg = document.createElement('div');
        errorMsg.className = 'text-white text-center p-4';
        errorMsg.innerHTML = '<i class="fas fa-exclamation-triangle text-4xl mb-4"></i><p>No se pudo cargar la imagen</p>';
        container.appendChild(errorMsg);
    };

    container.appendChild(closeBtn);
    container.appendChild(img);
    overlay.appendChild(container);
    document.body.appendChild(overlay);

    // Close on ESC key
    const handleEsc = function(e) {
        if (e.key === 'Escape') {
            document.body.removeChild(overlay);
            document.removeEventListener('keydown', handleEsc);
        }
    };
    document.addEventListener('keydown', handleEsc);
}

window.showNewVerificationModal = showNewVerificationModal;
window.closeNewVerificationModal = closeNewVerificationModal;
window.selectVerificationType = selectVerificationType;
window.showViewVerificationModal = showViewVerificationModal;
window.closeViewVerificationModal = closeViewVerificationModal;
window.showUploadEvidenceModal = showUploadEvidenceModal;
window.closeUploadEvidenceModal = closeUploadEvidenceModal;
window.handleEvidenceFileChange = handleEvidenceFileChange;
window.openImagePreview = openImagePreview;
window.loadEvidencePreview = loadEvidencePreview;
window.openImagePreviewForVerification = openImagePreviewForVerification;

