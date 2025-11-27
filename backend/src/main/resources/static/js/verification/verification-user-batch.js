// User-specific Batch Verification - Validates items belong to user's inventories
// Batch Verification State
let batchVerificationState = {
    scannedItems: [],
    html5QrCode: null,
    cameraStream: null,
    isScanning: false,
    lastScannedCode: null,
    scanCooldown: 2000 // 2 seconds cooldown between scans
};

// Show Batch Verification Modal
async function showBatchVerificationModal() {
    const modal = document.getElementById('batchVerificationModal');
    if (!modal) {
        showInventoryErrorToast('Error', 'No se pudo abrir el modal de verificación por lotes');
        return;
    }

    // Ensure inventories are loaded
    if (!verificationData.inventories || verificationData.inventories.length === 0) {
        // Try to load inventories first
        if (typeof loadUserInventories === 'function') {
            try {
                await loadUserInventories();
            } catch (error) {
                // If loading fails, show error and return
                showInventoryErrorToast('Error', 'No se pudieron cargar los inventarios. Intenta recargar la página.');
                return;
            }
        }
        
        // Validate again after loading
        if (!verificationData.inventories || verificationData.inventories.length === 0) {
            showInventoryErrorToast('Sin inventarios', 'No tienes inventarios asignados. No puedes realizar verificaciones.');
            return;
        }
    }
    
    // Open modal if validation passes
    modal.classList.remove('hidden');
    resetBatchVerificationState();
    updateScannedItemsList();
}

// Close Batch Verification Modal
function closeBatchVerificationModal() {
    const modal = document.getElementById('batchVerificationModal');
    if (modal) {
        stopBatchScanner();
        modal.classList.add('hidden');
        resetBatchVerificationState();
    }
}

// Reset Batch Verification State
function resetBatchVerificationState() {
    batchVerificationState.scannedItems = [];
    batchVerificationState.lastScannedCode = null;
    batchVerificationState.isScanning = false;
    updateScannedItemsList();
    
    // Clear manual input field
    const manualInput = document.getElementById('manualPlateInput');
    if (manualInput) {
        manualInput.value = '';
    }
}

// Add Manual Plate - Validates item belongs to user's inventories
async function addManualPlate() {
    const input = document.getElementById('manualPlateInput');
    if (!input) return;
    
    const plateNumber = input.value.trim().toUpperCase();
    
    if (!plateNumber) {
        showInventoryErrorToast('Campo vacío', 'Por favor ingresa una placa');
        return;
    }
    
    // Validate plate format (basic validation - alphanumeric)
    if (!/^[A-Z0-9]+$/.test(plateNumber)) {
        showInventoryErrorToast('Placa inválida', 'La placa solo debe contener letras y números');
        return;
    }
    
    // Check if plate already scanned
    if (batchVerificationState.scannedItems.some(item => item.licencePlate === plateNumber)) {
        showInventoryWarningToast('Duplicado', `La placa ${plateNumber} ya fue agregada`);
        input.value = '';
        input.focus();
        return;
    }
    
    // Search for item by licence plate
    // Note: We don't validate inventory ownership here because ItemDTO doesn't include inventoryId
    // The backend will validate authorization when creating the verification
    try {
        const item = await getItemByLicencePlate(plateNumber);
        
        // If item not found, show error
        if (!item) {
            showInventoryErrorToast('Placa no encontrada', `La placa ${plateNumber} no coincide con ningún item`);
            input.value = '';
            input.focus();
            return;
        }
        
        const itemName = item.productName;
        
        // Add item to list with name
        const scannedItem = {
            licencePlate: plateNumber,
            itemName: itemName,
            photo: null, // No photo when added manually
            evidence: null, // User can attach evidence later
            timestamp: new Date()
        };
        
        batchVerificationState.scannedItems.push(scannedItem);
        updateScannedItemsList();
        
        // Clear input and refocus
        input.value = '';
        input.focus();
        
        showInventorySuccessToast('Placa agregada', `${itemName} agregado correctamente a la lista de verificación`);
    } catch (error) {
        // Si el error es que no pertenece a inventarios, ya se muestra toast en la API
        if (!error.message || !error.message.includes('no pertenece')) {
            showInventoryErrorToast('Error al buscar placa', error.message || `No se pudo encontrar la placa ${plateNumber}. Verifica que la placa sea correcta.`);
        }
        input.value = '';
        input.focus();
    }
}

// Start Batch Scanner
async function startBatchScanner() {
    try {
        const containerId = "cameraContainer";
        const videoElement = document.getElementById('cameraVideo');
        const canvasElement = document.getElementById('cameraCanvas');
        const placeholder = document.getElementById('cameraPlaceholder');
        const overlay = document.getElementById('scanOverlay');
        
        // Check if Html5Qrcode is available
        if (typeof Html5Qrcode === 'undefined') {
            showInventoryErrorToast('Error', 'Biblioteca de escaneo no disponible. Por favor recarga la página.');
            return;
        }

        // Hide placeholder and show video
        if (placeholder) placeholder.style.display = 'none';
        if (videoElement) videoElement.style.display = 'block';
        if (overlay) overlay.classList.remove('hidden');

        // Create Html5Qrcode instance
        batchVerificationState.html5QrCode = new Html5Qrcode(containerId);

        // Start scanning
        await batchVerificationState.html5QrCode.start(
            { facingMode: "environment" }, // Use back camera if available
            {
                fps: 10,
                qrbox: { width: 400, height: 150 },
                aspectRatio: 1.0
            },
            (decodedText, decodedResult) => {
                handleScannedCode(decodedText);
            },
            (errorMessage) => {
                // Ignore scanning errors (they're expected during continuous scanning)
            }
        );

        batchVerificationState.isScanning = true;

        // Update UI
        document.getElementById('startCameraBtn').classList.add('hidden');
        document.getElementById('stopCameraBtn').classList.remove('hidden');
        document.getElementById('capturePhotoBtn').classList.remove('hidden');

        showInventorySuccessToast('Cámara iniciada', 'Escanea las placas de los items. La cámara capturará automáticamente al detectar un código.');

    } catch (error) {
        showInventoryErrorToast('Error al iniciar cámara', 'No se pudo iniciar la cámara. Verifica los permisos del navegador y que la cámara esté disponible.');
        stopBatchScanner();
    }
}

// Stop Batch Scanner
async function stopBatchScanner() {
    try {
        if (batchVerificationState.html5QrCode) {
            await batchVerificationState.html5QrCode.stop();
            batchVerificationState.html5QrCode.clear();
            batchVerificationState.html5QrCode = null;
        }

        batchVerificationState.isScanning = false;

        // Update UI
        const videoElement = document.getElementById('cameraVideo');
        const canvasElement = document.getElementById('cameraCanvas');
        const placeholder = document.getElementById('cameraPlaceholder');
        const overlay = document.getElementById('scanOverlay');

        if (videoElement) videoElement.style.display = 'none';
        if (canvasElement) canvasElement.style.display = 'none';
        if (placeholder) placeholder.style.display = 'flex';
        if (overlay) overlay.classList.add('hidden');

        document.getElementById('startCameraBtn').classList.remove('hidden');
        document.getElementById('stopCameraBtn').classList.add('hidden');
        document.getElementById('capturePhotoBtn').classList.add('hidden');

    } catch (error) {
        showInventoryWarningToast('Advertencia', 'Hubo un problema al detener la cámara, pero se cerró correctamente.');
    }
}

// Handle Scanned Code - Validates item belongs to user's inventories
async function handleScannedCode(code) {
    const now = Date.now();
    
    // Cooldown check to prevent duplicate scans
    if (batchVerificationState.lastScannedCode === code && 
        (now - (batchVerificationState.lastScannedTime || 0)) < batchVerificationState.scanCooldown) {
        return;
    }

    batchVerificationState.lastScannedCode = code;
    batchVerificationState.lastScannedTime = now;

    // Clean the code (trim whitespace)
    const cleanedCode = code.trim();

    // Check if already scanned
    if (batchVerificationState.scannedItems.some(item => item.licencePlate === cleanedCode)) {
        showInventoryInfoToast('Ya escaneado', `La placa ${cleanedCode} ya fue escaneada`);
        return;
    }

    // Search for item by licence plate
    // Note: We don't validate inventory ownership here because ItemDTO doesn't include inventoryId
    // The backend will validate authorization when creating the verification
    try {
        const item = await getItemByLicencePlate(cleanedCode);
        
        // If item not found, don't add to list
        if (!item) {
            showInventoryErrorToast('Placa no encontrada', `La placa ${cleanedCode} no coincide con ningún item en el sistema`);
            return;
        }
        
        const itemName = item.productName;
        showInventoryInfoToast('Item encontrado', `Escaneando ${itemName}...`);
        
        // Capture photo automatically only if item exists
        capturePhotoForScannedCode(cleanedCode, itemName);
    } catch (error) {
        // Si el error es que no pertenece a inventarios, ya se muestra toast en la API
        if (!error.message || !error.message.includes('no pertenece')) {
            showInventoryErrorToast('Error al escanear', error.message || `No se pudo procesar la placa ${cleanedCode}. Intenta nuevamente.`);
        }
    }
}

// Capture Photo for Scanned Code
async function capturePhotoForScannedCode(licencePlate, itemName = null) {
    try {
        const container = document.getElementById('cameraContainer');
        const canvasElement = document.getElementById('cameraCanvas');

        if (!container || !canvasElement || !batchVerificationState.isScanning || !batchVerificationState.html5QrCode) {
            // If camera not available, add without photo
            addScannedItem(licencePlate, null, itemName);
            return;
        }

        // Try to get video element from Html5Qrcode container
        const videoElement = container.querySelector('video');
        
        if (!videoElement) {
            // If no video element found, add without photo
            addScannedItem(licencePlate, null, itemName);
            return;
        }

        // Wait for video to be ready
        if (videoElement.readyState < 2) {
            videoElement.addEventListener('loadeddata', () => {
                captureFrameToCanvas(videoElement, canvasElement, licencePlate, false, itemName);
            }, { once: true });
        } else {
            captureFrameToCanvas(videoElement, canvasElement, licencePlate, false, itemName);
        }

    } catch (error) {
        showInventoryWarningToast('Foto no capturada', 'No se pudo capturar la foto automáticamente, pero el item fue agregado. Puedes agregar evidencia manualmente.');
        // Add item without photo if capture fails
        addScannedItem(licencePlate, null, itemName);
    }
}

// Capture Frame to Canvas
function captureFrameToCanvas(videoElement, canvasElement, licencePlate, isManual, itemName) {
    try {
        canvasElement.width = videoElement.videoWidth;
        canvasElement.height = videoElement.videoHeight;
        
        const context = canvasElement.getContext('2d');
        context.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
        
        canvasElement.toBlob((blob) => {
            if (blob) {
                const photoFile = new File([blob], `photo_${licencePlate}_${Date.now()}.jpg`, { type: 'image/jpeg' });
                addScannedItem(licencePlate, photoFile, itemName);
            } else {
                addScannedItem(licencePlate, null, itemName);
            }
        }, 'image/jpeg', 0.9);
    } catch (error) {
        showInventoryWarningToast('Error al capturar foto', 'No se pudo capturar la foto del frame, pero el item fue agregado.');
        addScannedItem(licencePlate, null, itemName);
    }
}

// Capture Batch Photo Manually
function captureBatchPhoto() {
    const container = document.getElementById('cameraContainer');
    const videoElement = container ? container.querySelector('video') : null;
    const canvasElement = document.getElementById('cameraCanvas');
    
    if (!videoElement || !canvasElement) {
        showInventoryErrorToast('Error', 'La cámara no está disponible');
        return;
    }
    
    captureFrameToCanvas(videoElement, canvasElement, 'manual_' + Date.now(), true, null);
    showInventorySuccessToast('Foto capturada', 'Foto capturada manualmente y agregada a la lista');
}

// Add Scanned Item
function addScannedItem(licencePlate, photo, itemName) {
    const scannedItem = {
        licencePlate: licencePlate,
        itemName: itemName || 'Item desconocido',
        photo: photo,
        evidence: null,
        timestamp: new Date()
    };
    
    batchVerificationState.scannedItems.push(scannedItem);
    updateScannedItemsList();
    
    const message = photo ? 
        `Placa ${licencePlate} escaneada y foto capturada` : 
        `Placa ${licencePlate} escaneada`;
    
        showInventorySuccessToast('Item agregado', message);
}

// Remove Scanned Item
function removeScannedItem(index) {
    batchVerificationState.scannedItems.splice(index, 1);
    updateScannedItemsList();
}

// Handle Evidence Change
function handleEvidenceChange(index, file) {
    if (file && batchVerificationState.scannedItems[index]) {
        batchVerificationState.scannedItems[index].evidence = file;
        updateScannedItemsList();
        showInventorySuccessToast('Evidencia adjuntada', `Evidencia adjuntada para ${batchVerificationState.scannedItems[index].licencePlate}`);
    }
}

// Remove Evidence
function removeEvidence(index) {
    if (batchVerificationState.scannedItems[index]) {
        batchVerificationState.scannedItems[index].evidence = null;
        // Reset the file inputs
        const input = document.getElementById(`evidenceInput_${index}`);
        const cameraInput = document.getElementById(`evidenceCameraInput_${index}`);
        if (input) {
            input.value = '';
        }
        if (cameraInput) {
            cameraInput.value = '';
        }
        updateScannedItemsList();
    }
}

// Take Evidence Photo
function takeEvidencePhoto(index) {
    const cameraInput = document.getElementById(`evidenceCameraInput_${index}`);
    if (cameraInput) {
        cameraInput.click();
    }
}

// Handle Evidence Camera Change
function handleEvidenceCameraChange(index, file) {
    if (file && batchVerificationState.scannedItems[index]) {
        batchVerificationState.scannedItems[index].evidence = file;
        updateScannedItemsList();
        showInventorySuccessToast('Evidencia capturada', `Evidencia capturada con la cámara para ${batchVerificationState.scannedItems[index].licencePlate}`);
    }
}

// Update Scanned Items List
function updateScannedItemsList() {
    const listContainer = document.getElementById('scannedItemsList');
    const countElement = document.getElementById('scannedCount');
    const finalizeBtn = document.getElementById('finalizeBatchBtn');
    const finalizeCount = document.getElementById('finalizeCount');

    if (!listContainer) return;

    const items = batchVerificationState.scannedItems;

    if (items.length === 0) {
        listContainer.innerHTML = `
            <div class="text-center py-8 text-gray-500">
                <i class="fas fa-inbox text-4xl mb-2"></i>
                <p>No hay placas escaneadas aún</p>
            </div>
        `;
        if (countElement) countElement.textContent = '0';
        if (finalizeBtn) finalizeBtn.disabled = true;
        if (finalizeCount) finalizeCount.textContent = '0';
        return;
    }

    listContainer.innerHTML = items.map((item, index) => {
        const photoPreview = item.photo ? 
            `<img src="${URL.createObjectURL(item.photo)}" alt="Foto" class="w-20 h-20 object-cover rounded-lg">` :
            `<div class="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                <i class="fas fa-image text-gray-400"></i>
            </div>`;

        const evidencePreview = item.evidence ? 
            `<div class="mt-2 flex items-center gap-2">
                <i class="fas fa-paperclip text-green-600"></i>
                <span class="text-xs text-green-600 font-medium">${item.evidence.name}</span>
                <button onclick="removeEvidence(${index})" class="text-red-600 hover:text-red-800 ml-2">
                    <i class="fas fa-times text-xs"></i>
                </button>
            </div>` : '';

        return `
            <div class="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div class="flex items-center gap-4 mb-3">
                    ${photoPreview}
                    <div class="flex-1">
                        <div class="font-semibold text-gray-800">${item.licencePlate}</div>
                        ${item.itemName ? `<div class="text-sm text-gray-600 mt-1">${item.itemName}</div>` : ''}
                        <div class="text-sm text-gray-500 mt-1">
                            ${new Date(item.timestamp).toLocaleString('es-ES')}
                        </div>
                    </div>
                    <button onclick="removeScannedItem(${index})" 
                        class="text-red-600 hover:text-red-800 transition-colors">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <div class="border-t border-gray-200 pt-3">
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                        <i class="fas fa-paperclip mr-1"></i>
                        Adjuntar Evidencia
                    </label>
                    <div class="flex items-center gap-2 mb-2">
                        <input 
                            type="file" 
                            id="evidenceInput_${index}" 
                            accept="image/*,.pdf,.doc,.docx"
                            onchange="handleEvidenceChange(${index}, this.files[0])"
                            class="flex-1 text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                        <button 
                            onclick="takeEvidencePhoto(${index})"
                            class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2 text-sm font-semibold"
                            title="Tomar evidencia con la cámara">
                            <i class="fas fa-camera"></i>
                            <span>Tomar Foto</span>
                        </button>
                    </div>
                    <input 
                        type="file" 
                        id="evidenceCameraInput_${index}" 
                        accept="image/*"
                        capture="camera"
                        style="display: none;"
                        onchange="handleEvidenceCameraChange(${index}, this.files[0])"
                    />
                    ${evidencePreview}
                </div>
            </div>
        `;
    }).join('');

    if (countElement) countElement.textContent = items.length.toString();
    if (finalizeBtn) finalizeBtn.disabled = items.length === 0;
    if (finalizeCount) finalizeCount.textContent = items.length.toString();
}

// Finalize Batch Verification
async function finalizeBatchVerification() {
    const items = batchVerificationState.scannedItems;

    if (items.length === 0) {
        showInventoryErrorToast('Error', 'No hay placas escaneadas para verificar');
        return;
    }

    try {
        showInventoryInfoToast('Procesando verificaciones', `Creando ${items.length} verificación(es)...`);
        showLoadingState();
        
        const token = localStorage.getItem('jwt');
        if (!token) {
            showInventoryErrorToast('Sesión expirada', 'Por favor inicia sesión nuevamente');
            throw new Error('No authentication token found');
        }

        // Prepare FormData
        const formData = new FormData();

        // Add licence plates as JSON array
        const licencePlates = items.map(item => item.licencePlate);
        formData.append('items', JSON.stringify(licencePlates));

        // Add photos in order (send empty blob for items without photos to maintain order)
        items.forEach((item) => {
            if (item.photo) {
                formData.append('photos', item.photo);
            } else {
                // Send empty blob to maintain order
                formData.append('photos', new Blob(), 'empty.jpg');
            }
        });

        // Send request
        const response = await fetch('/api/v1/verifications/batch', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Error al crear las verificaciones');
        }

        const result = await response.json();

        // Upload additional evidence files for successful verifications
        if (result.results && result.results.length > 0) {
            let evidenceUploadCount = 0;
            const evidenceUploadPromises = [];

            result.results.forEach((verificationResult) => {
                if (verificationResult.success && verificationResult.verificationId) {
                    // Find the corresponding scanned item by licence plate
                    const scannedItem = items.find(item => item.licencePlate === verificationResult.licencePlateNumber);
                    
                    if (scannedItem && scannedItem.evidence) {
                        // Upload evidence for this verification
                        const evidenceFormData = new FormData();
                        evidenceFormData.append('file', scannedItem.evidence);
                        
                        const evidencePromise = fetch(`/api/v1/verifications/${verificationResult.verificationId}/evidence`, {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${token}`
                            },
                            body: evidenceFormData
                        }).then(response => {
                            if (response.ok) {
                                evidenceUploadCount++;
                                return { success: true, licencePlate: verificationResult.licencePlateNumber };
                            } else {
                                showInventoryWarningToast('Evidencia no subida', `No se pudo subir la evidencia adicional para ${verificationResult.licencePlateNumber}`);
                                return { success: false, licencePlate: verificationResult.licencePlateNumber };
                            }
                        }).catch(error => {
                            showInventoryWarningToast('Error en evidencia', `Error al subir evidencia adicional para ${verificationResult.licencePlateNumber}`);
                            return { success: false, licencePlate: verificationResult.licencePlateNumber };
                        });
                        
                        evidenceUploadPromises.push(evidencePromise);
                    }
                }
            });

            // Wait for all evidence uploads to complete
            if (evidenceUploadPromises.length > 0) {
                await Promise.all(evidenceUploadPromises);
                if (evidenceUploadCount > 0) {
                    showInventorySuccessToast('Evidencias subidas', `Se subieron ${evidenceUploadCount} evidencias adicionales`);
                }
            }
        }

        // Show results with details about failed items
        if (result.successfulItems === result.totalItems) {
            showInventorySuccessToast('Verificaciones completadas', `Se crearon ${result.successfulItems} verificaciones exitosamente`);
        } else {
            // Show which items failed and why
            const failedItems = result.results ? result.results.filter(r => !r.success) : [];
            let failedMessage = `Se crearon ${result.successfulItems} de ${result.totalItems} verificaciones. ${result.failedItems} fallaron.`;
            
            if (failedItems.length > 0) {
                const failedPlates = failedItems.map(f => f.licencePlateNumber || 'Desconocido').join(', ');
                failedMessage += ` Items que fallaron: ${failedPlates}. Estos items no están en tu inventario. Solo puedes verificar items de los cuales eres owner, manager o signatory.`;
            }
            
            showInventoryWarningToast('Verificación parcial', failedMessage);
        }

        // Close modal and reload data
        closeBatchVerificationModal();
        showInventoryInfoToast('Actualizando datos', 'Recargando verificaciones...');
        await loadVerificationData();

    } catch (error) {
        // Si el error contiene información sobre items que no pertenecen, ya se muestra toast
        if (error.message && (error.message.includes('no pertenece') || error.message.includes('not authorized') || error.message.includes('no está en mi inventario'))) {
            const errorMsg = error.message.includes('no está en mi inventario') 
                ? error.message 
                : 'Algunos items no están en tu inventario. Solo puedes verificar items de los cuales eres owner, manager o signatory.';
            showInventoryErrorToast('Item no está en tu inventario', errorMsg);
        } else {
            showInventoryErrorToast('Error al crear verificaciones', error.message || 'No se pudieron crear las verificaciones. Verifica que todos los items pertenezcan a tus inventarios.');
        }
    } finally {
        hideLoadingState();
    }
}

// Export functions
window.showBatchVerificationModal = showBatchVerificationModal;
window.closeBatchVerificationModal = closeBatchVerificationModal;
window.addManualPlate = addManualPlate;
window.startBatchScanner = startBatchScanner;
window.stopBatchScanner = stopBatchScanner;
window.captureBatchPhoto = captureBatchPhoto;
window.handleNewVerificationFileChange = handleNewVerificationFileChange;
window.clearNewVerificationEvidence = clearNewVerificationEvidence;
window.captureNewVerificationPhoto = captureNewVerificationPhoto;
window.openNewVerificationCamera = openNewVerificationCamera;
window.removeScannedItem = removeScannedItem;
window.handleEvidenceChange = handleEvidenceChange;
window.removeEvidence = removeEvidence;
window.takeEvidencePhoto = takeEvidencePhoto;
window.handleEvidenceCameraChange = handleEvidenceCameraChange;
window.finalizeBatchVerification = finalizeBatchVerification;

