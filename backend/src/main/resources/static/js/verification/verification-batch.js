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
function showBatchVerificationModal() {
    const modal = document.getElementById('batchVerificationModal');
    if (modal) {
        modal.classList.remove('hidden');
        resetBatchVerificationState();
        updateScannedItemsList();
    }
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

// Add Manual Plate
async function addManualPlate() {
    const input = document.getElementById('manualPlateInput');
    if (!input) return;
    
    const plateNumber = input.value.trim().toUpperCase();
    
    if (!plateNumber) {
        showErrorToast('Campo vacío', 'Por favor ingresa una placa');
        return;
    }
    
    // Validate plate format (basic validation - alphanumeric)
    if (!/^[A-Z0-9]+$/.test(plateNumber)) {
        showErrorToast('Placa inválida', 'La placa solo debe contener letras y números');
        return;
    }
    
    // Check if plate already scanned
    if (batchVerificationState.scannedItems.some(item => item.licencePlate === plateNumber)) {
        showWarningToast('Duplicado', `La placa ${plateNumber} ya fue agregada`);
        input.value = '';
        input.focus();
        return;
    }
    
    // Search for item by licence plate to get item name (same logic as scanned items)
    try {
        const item = await getItemByLicencePlate(plateNumber);
        
        // If item not found, show error and don't add to list
        if (!item) {
            showErrorToast('Placa no encontrada', `La placa ${plateNumber} no coincide con ningún item en el inventario`);
            input.value = '';
            input.focus();
            return;
        }
        
        const itemName = item.productName;
        
        // Add item to list with name (using same structure as addScannedItem)
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
        
        showSuccessToast('Placa agregada', `${itemName} agregado correctamente`);
    } catch (error) {
        console.error('Error fetching item:', error);
        showErrorToast('Error', `Error al buscar la placa ${plateNumber}. Intenta de nuevo.`);
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
            showErrorToast('Error', 'Biblioteca de escaneo no disponible. Por favor recarga la página.');
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

        showSuccessToast('Cámara iniciada', 'Escanea las placas de los items');

    } catch (error) {
        console.error('Error starting scanner:', error);
        showErrorToast('Error', 'No se pudo iniciar la cámara. Verifica los permisos.');
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
        console.error('Error stopping scanner:', error);
    }
}

// Handle Scanned Code
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
        showInfoToast('Ya escaneado', `La placa ${cleanedCode} ya fue escaneada`);
        return;
    }

    // Search for item by licence plate to get item name
    try {
        const item = await getItemByLicencePlate(cleanedCode);
        
        // If item not found, don't add to list
        if (!item) {
            showErrorToast('Placa no encontrada', `La placa ${cleanedCode} no coincide con ningún item en el inventario`);
            return;
        }
        
        const itemName = item.productName;
        
        // Capture photo automatically only if item exists
        capturePhotoForScannedCode(cleanedCode, itemName);
    } catch (error) {
        console.error('Error fetching item:', error);
        // Don't add item if there's an error fetching it
        showErrorToast('Error', `Error al buscar la placa ${cleanedCode}. Intenta de nuevo.`);
    }
}

// Get Item by Licence Plate
async function getItemByLicencePlate(licencePlate) {
    try {
        const token = localStorage.getItem('jwt');
        if (!token) {
            return null;
        }

        const encodedPlate = encodeURIComponent(licencePlate);
        const response = await fetch(`/api/v1/items/licence-plate/${encodedPlate}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const item = await response.json();
            return item;
        } else if (response.status === 404) {
            return null; // Item not found
        } else {
            throw new Error('Error fetching item');
        }
    } catch (error) {
        console.error('Error getting item by licence plate:', error);
        return null;
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
        console.error('Error capturing photo:', error);
        addScannedItem(licencePlate, null, itemName);
    }
}

// Helper function to capture frame from video to canvas
function captureFrameToCanvas(videoElement, canvasElement, licencePlate, isManual = false, itemName = null) {
    try {
        // Create canvas from video frame
        canvasElement.width = videoElement.videoWidth || 640;
        canvasElement.height = videoElement.videoHeight || 480;
        const ctx = canvasElement.getContext('2d');
        ctx.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);

        // Convert canvas to blob
        canvasElement.toBlob(async (blob) => {
            if (blob) {
                if (isManual) {
                    // Manual capture - prompt for licence plate
                    const file = new File([blob], `manual_capture_${Date.now()}.jpg`, { type: 'image/jpeg' });
                    const licencePlate = prompt('Ingresa el número de placa para esta foto:');
                    if (licencePlate && licencePlate.trim()) {
                        // Search for item when manually entered
                        try {
                            const item = await getItemByLicencePlate(licencePlate.trim());
                            const itemName = item ? item.productName : null;
                            addScannedItem(licencePlate.trim(), file, itemName);
                        } catch (error) {
                            addScannedItem(licencePlate.trim(), file, null);
                        }
                    } else {
                        showErrorToast('Error', 'Debes ingresar un número de placa');
                    }
                } else {
                    // Automatic capture from scan
                    const file = new File([blob], `plate_${licencePlate}_${Date.now()}.jpg`, { type: 'image/jpeg' });
                    addScannedItem(licencePlate, file, itemName);
                }
            } else {
                if (!isManual) {
                    addScannedItem(licencePlate, null, itemName);
                }
            }
        }, 'image/jpeg', 0.8);
    } catch (error) {
        console.error('Error capturing frame:', error);
        if (!isManual) {
            addScannedItem(licencePlate, null, itemName);
        }
    }
}

// Capture Photo Manually
function captureBatchPhoto() {
    if (!batchVerificationState.isScanning || !batchVerificationState.html5QrCode) {
        showErrorToast('Error', 'La cámara no está activa');
        return;
    }

    const container = document.getElementById('cameraContainer');
    const canvasElement = document.getElementById('cameraCanvas');

    if (!container || !canvasElement) {
        showErrorToast('Error', 'Elementos de cámara no disponibles');
        return;
    }

    // Get video element from Html5Qrcode container
    const videoElement = container.querySelector('video');
    
    if (!videoElement) {
        showErrorToast('Error', 'Video no disponible');
        return;
    }

    try {
        captureFrameToCanvas(videoElement, canvasElement, null, true);
    } catch (error) {
        console.error('Error capturing photo manually:', error);
        showErrorToast('Error', 'No se pudo capturar la foto');
    }
}

// Add Scanned Item
function addScannedItem(licencePlate, photoFile, itemName = null) {
    const item = {
        licencePlate: licencePlate,
        itemName: itemName,
        photo: photoFile,
        evidence: null, // Evidencia adicional adjuntada por el usuario
        timestamp: new Date()
    };

    batchVerificationState.scannedItems.push(item);
    updateScannedItemsList();
    
    const message = itemName 
        ? `Placa ${licencePlate} - ${itemName} agregada`
        : `Placa ${licencePlate} agregada`;
    showSuccessToast('Placa escaneada', message);
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
        showSuccessToast('Evidencia adjuntada', `Evidencia adjuntada para ${batchVerificationState.scannedItems[index].licencePlate}`);
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
        showSuccessToast('Evidencia capturada', `Evidencia capturada con la cámara para ${batchVerificationState.scannedItems[index].licencePlate}`);
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
        showErrorToast('Error', 'No hay placas escaneadas para verificar');
        return;
    }

    try {
        showLoadingState();
        
        const token = localStorage.getItem('jwt');
        if (!token) {
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
                                console.error(`Error uploading evidence for ${verificationResult.licencePlateNumber}`);
                                return { success: false, licencePlate: verificationResult.licencePlateNumber };
                            }
                        }).catch(error => {
                            console.error(`Error uploading evidence for ${verificationResult.licencePlateNumber}:`, error);
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
                    showSuccessToast('Evidencias subidas', `Se subieron ${evidenceUploadCount} evidencias adicionales`);
                }
            }
        }

        // Show results
        if (result.successfulItems === result.totalItems) {
            showSuccessToast('Éxito', `Se crearon ${result.successfulItems} verificaciones exitosamente`);
        } else {
            showInfoToast(
                'Verificación parcial', 
                `Se crearon ${result.successfulItems} de ${result.totalItems} verificaciones. ${result.failedItems} fallaron.`
            );
        }

        // Close modal and reload data
        closeBatchVerificationModal();
        await loadVerificationData();

    } catch (error) {
        console.error('Error finalizing batch verification:', error);
        showErrorToast('Error', error.message || 'Error al crear las verificaciones');
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
window.removeScannedItem = removeScannedItem;
window.handleEvidenceChange = handleEvidenceChange;
window.removeEvidence = removeEvidence;
window.takeEvidencePhoto = takeEvidencePhoto;
window.handleEvidenceCameraChange = handleEvidenceCameraChange;
window.finalizeBatchVerification = finalizeBatchVerification;

