// Batch Verification State
let batchVerificationState = {
    verifiedItems: [], // Items already verified and saved
    html5QrCode: null,
    cameraStream: null,
    isScanning: false,
    isPaused: false, // New: to pause scanning while taking photo
    lastScannedCode: null,
    scanCooldown: 2000, // 2 seconds cooldown between scans
    currentItem: null, // Current item being verified
    currentPhoto: null, // Current photo being reviewed
    currentPhotoBlob: null // Current photo blob for confirmation
};

// Show Batch Verification Modal
function showBatchVerificationModal() {
    const modal = document.getElementById('batchVerificationModal');
    if (modal) {
        modal.classList.remove('hidden');
        resetBatchVerificationState();
        updateVerifiedItemsList();
    }
}

// Close Batch Verification Modal
function closeBatchVerificationModal() {
    const modal = document.getElementById('batchVerificationModal');
    if (modal) {
        stopBatchScanner();
        modal.classList.add('hidden');
        resetBatchVerificationState();
        // Reload data to show newly created verifications
        if (typeof loadVerificationData === 'function') {
            loadVerificationData();
        }
    }
}

// Reset Batch Verification State
function resetBatchVerificationState() {
    batchVerificationState.verifiedItems = [];
    batchVerificationState.lastScannedCode = null;
    batchVerificationState.isScanning = false;
    batchVerificationState.isPaused = false;
    batchVerificationState.currentItem = null;
    batchVerificationState.currentPhoto = null;
    batchVerificationState.currentPhotoBlob = null;
    updateVerifiedItemsList();
}

// Start Batch Scanner
async function startBatchScanner() {
    try {
        const containerId = "cameraContainer";
        const videoElement = document.getElementById('cameraVideo');
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

        // Get supported formats
        const formatsToSupport = [];
        if (typeof Html5QrcodeSupportedFormats !== 'undefined') {
            formatsToSupport.push(
                Html5QrcodeSupportedFormats.QR_CODE,
                Html5QrcodeSupportedFormats.CODE_128,
                Html5QrcodeSupportedFormats.CODE_39,
                Html5QrcodeSupportedFormats.CODE_93,
                Html5QrcodeSupportedFormats.EAN_13,
                Html5QrcodeSupportedFormats.EAN_8,
                Html5QrcodeSupportedFormats.UPC_A,
                Html5QrcodeSupportedFormats.UPC_E,
                Html5QrcodeSupportedFormats.CODABAR,
                Html5QrcodeSupportedFormats.ITF
            );
        }

        // Configuration for barcode support
        const config = {
            fps: 10,
            qrbox: { width: 300, height: 150 }, // Wider box for barcodes
            aspectRatio: 2.0, // Better for barcodes
            experimentalFeatures: {
                useBarCodeDetectorIfSupported: true
            }
        };

        // Add formats if supported
        if (formatsToSupport.length > 0) {
            config.formatsToSupport = formatsToSupport;
        }

        // Start scanning with barcode support
        await batchVerificationState.html5QrCode.start(
            { facingMode: "environment" }, // Use back camera if available
            config,
            (decodedText, decodedResult) => {
                if (!batchVerificationState.isPaused) {
                    handleScannedCode(decodedText);
                }
            },
            (errorMessage) => {
                // Ignore scanning errors (they're expected during continuous scanning)
            }
        );

        batchVerificationState.isScanning = true;

        // Update UI
        document.getElementById('startCameraBtn').classList.add('hidden');
        document.getElementById('stopCameraBtn').classList.remove('hidden');

        showSuccessToast('Cámara iniciada', 'Escanea códigos de barras o QR de placas');

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
        batchVerificationState.isPaused = false;

        // Update UI
        const videoElement = document.getElementById('cameraVideo');
        const placeholder = document.getElementById('cameraPlaceholder');
        const overlay = document.getElementById('scanOverlay');

        if (videoElement) videoElement.style.display = 'none';
        if (placeholder) placeholder.style.display = 'flex';
        if (overlay) overlay.classList.add('hidden');

        document.getElementById('startCameraBtn').classList.remove('hidden');
        document.getElementById('stopCameraBtn').classList.add('hidden');

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

    // Check if already verified
    if (batchVerificationState.verifiedItems.some(item => item.licencePlate === cleanedCode)) {
        showInfoToast('Ya verificado', `La placa ${cleanedCode} ya fue verificada`);
        return;
    }

    // Pause scanning while we process this item
    batchVerificationState.isPaused = true;

    // Search for item by licence plate to get item name
    try {
        const item = await getItemByLicencePlate(cleanedCode);
        const itemName = item ? item.productName : null;
        
        // Store current item info
        batchVerificationState.currentItem = {
            licencePlate: cleanedCode,
            itemName: itemName
        };

        // Show instruction to take photo
        showInfoToast('Placa escaneada', `Ahora toma una foto del ítem con la placa ${cleanedCode}`);
        
        // Wait a moment then capture photo
        setTimeout(() => {
            requestPhotoCapture(cleanedCode, itemName);
        }, 1500);

    } catch (error) {
        console.error('Error fetching item:', error);
        // Continue with scan even if item lookup fails
        batchVerificationState.currentItem = {
            licencePlate: cleanedCode,
            itemName: null
        };
        
        setTimeout(() => {
            requestPhotoCapture(cleanedCode, null);
        }, 1500);
    }
}

// Request Photo Capture
function requestPhotoCapture(licencePlate, itemName) {
    // Automatically capture photo after a moment
    setTimeout(() => {
        capturePhotoForVerification(licencePlate, itemName);
    }, 500);
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

// Capture Photo for Verification
async function capturePhotoForVerification(licencePlate, itemName = null) {
    try {
        const container = document.getElementById('cameraContainer');
        const canvasElement = document.getElementById('cameraCanvas');

        if (!container || !canvasElement || !batchVerificationState.isScanning || !batchVerificationState.html5QrCode) {
            showErrorToast('Error', 'Cámara no disponible');
            resumeScanning();
            return;
        }

        // Try to get video element from Html5Qrcode container
        const videoElement = container.querySelector('video');
        
        if (!videoElement) {
            showErrorToast('Error', 'Video no disponible');
            resumeScanning();
            return;
        }

        // Wait for video to be ready
        if (videoElement.readyState < 2) {
            videoElement.addEventListener('loadeddata', () => {
                captureFrameForConfirmation(videoElement, canvasElement, licencePlate, itemName);
            }, { once: true });
        } else {
            captureFrameForConfirmation(videoElement, canvasElement, licencePlate, itemName);
        }

    } catch (error) {
        console.error('Error capturing photo:', error);
        showErrorToast('Error', 'No se pudo capturar la foto');
        resumeScanning();
    }
}

// Capture Frame for Confirmation
function captureFrameForConfirmation(videoElement, canvasElement, licencePlate, itemName = null) {
    try {
        // Create canvas from video frame
        canvasElement.width = videoElement.videoWidth || 640;
        canvasElement.height = videoElement.videoHeight || 480;
        const ctx = canvasElement.getContext('2d');
        ctx.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);

        // Convert canvas to blob
        canvasElement.toBlob(async (blob) => {
            if (blob) {
                // Store the blob
                batchVerificationState.currentPhotoBlob = blob;
                
                // Show confirmation modal
                showPhotoConfirmation(licencePlate, itemName, blob);
            } else {
                showErrorToast('Error', 'No se pudo capturar la foto');
                resumeScanning();
            }
        }, 'image/jpeg', 0.8);
    } catch (error) {
        console.error('Error capturing frame:', error);
        showErrorToast('Error', 'No se pudo capturar la foto');
        resumeScanning();
    }
}

// Show Photo Confirmation Modal
function showPhotoConfirmation(licencePlate, itemName, photoBlob) {
    const modal = document.getElementById('photoConfirmationModal');
    const preview = document.getElementById('photoPreview');
    const plateSpan = document.querySelector('#photoConfirmPlateNumber span');
    const itemNameP = document.getElementById('photoConfirmItemName');

    if (!modal || !preview) {
        showErrorToast('Error', 'Modal de confirmación no disponible');
        resumeScanning();
        return;
    }

    // Set plate number
    if (plateSpan) {
        plateSpan.textContent = licencePlate;
    }

    // Set item name
    if (itemNameP) {
        itemNameP.textContent = itemName ? `Item: ${itemName}` : 'Item no encontrado en el sistema';
    }

    // Create URL for preview
    const photoUrl = URL.createObjectURL(photoBlob);
    preview.src = photoUrl;

    // Show modal
    modal.classList.remove('hidden');
}

// Approve Photo
async function approvePhoto() {
    const licencePlate = batchVerificationState.currentItem?.licencePlate;
    const itemName = batchVerificationState.currentItem?.itemName;
    const photoBlob = batchVerificationState.currentPhotoBlob;

    if (!licencePlate || !photoBlob) {
        showErrorToast('Error', 'Datos incompletos');
        closePhotoConfirmation();
        resumeScanning();
        return;
    }

    // Show loading
    document.getElementById('photoConfirmLoading').classList.remove('hidden');
    document.getElementById('rejectPhotoBtn').disabled = true;
    document.getElementById('approvePhotoBtn').disabled = true;

    try {
        // Create verification immediately
        const photoFile = new File([photoBlob], `plate_${licencePlate}_${Date.now()}.jpg`, { type: 'image/jpeg' });
        
        // Call API to create verification with photo
        const response = await createVerificationByPlate(licencePlate, photoFile);

        // Add to verified items list
        batchVerificationState.verifiedItems.push({
            licencePlate: licencePlate,
            itemName: itemName,
            verificationId: response.verificationId,
            timestamp: new Date()
        });

        updateVerifiedItemsList();

        showSuccessToast('Verificación guardada', `Placa ${licencePlate} verificada exitosamente`);

        // Close confirmation modal
        closePhotoConfirmation();

        // Resume scanning for next item
        resumeScanning();

    } catch (error) {
        console.error('Error saving verification:', error);
        showErrorToast('Error', error.message || 'No se pudo guardar la verificación');
        
        // Re-enable buttons
        document.getElementById('photoConfirmLoading').classList.add('hidden');
        document.getElementById('rejectPhotoBtn').disabled = false;
        document.getElementById('approvePhotoBtn').disabled = false;
    }
}

// Reject Photo
function rejectPhoto() {
    const licencePlate = batchVerificationState.currentItem?.licencePlate;
    const itemName = batchVerificationState.currentItem?.itemName;

    closePhotoConfirmation();
    
    // Show message and retake photo
    showInfoToast('Foto rechazada', 'Toma otra foto del ítem');
    
    setTimeout(() => {
        requestPhotoCapture(licencePlate, itemName);
    }, 1000);
}

// Close Photo Confirmation Modal
function closePhotoConfirmation() {
    const modal = document.getElementById('photoConfirmationModal');
    const preview = document.getElementById('photoPreview');
    
    if (modal) {
        modal.classList.add('hidden');
    }

    // Clean up blob URL
    if (preview && preview.src) {
        URL.revokeObjectURL(preview.src);
        preview.src = '';
    }

    // Reset loading state
    document.getElementById('photoConfirmLoading').classList.add('hidden');
    document.getElementById('rejectPhotoBtn').disabled = false;
    document.getElementById('approvePhotoBtn').disabled = false;
}

// Resume Scanning
function resumeScanning() {
    batchVerificationState.isPaused = false;
    batchVerificationState.currentItem = null;
    batchVerificationState.currentPhoto = null;
    batchVerificationState.currentPhotoBlob = null;
}

// Update Verified Items List
function updateVerifiedItemsList() {
    const listContainer = document.getElementById('scannedItemsList');
    const countElement = document.getElementById('scannedCount');
    const finalizeBtn = document.getElementById('finalizeBatchBtn');
    const finalizeCount = document.getElementById('finalizeCount');

    if (!listContainer) return;

    const items = batchVerificationState.verifiedItems;

    if (items.length === 0) {
        listContainer.innerHTML = `
            <div class="text-center py-8 text-gray-500">
                <i class="fas fa-inbox text-4xl mb-2"></i>
                <p>No hay verificaciones guardadas aún</p>
            </div>
        `;
        if (countElement) countElement.textContent = '0';
        if (finalizeBtn) finalizeBtn.disabled = false; // Always enabled to close
        if (finalizeCount) finalizeCount.textContent = '0';
        return;
    }

    listContainer.innerHTML = items.map((item, index) => {
        return `
            <div class="flex items-center gap-4 p-4 bg-green-50 rounded-lg border border-green-200">
                <div class="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                    <i class="fas fa-check text-white text-xl"></i>
                </div>
                <div class="flex-1">
                    <div class="font-semibold text-gray-800">${item.licencePlate}</div>
                    ${item.itemName ? `<div class="text-sm text-gray-600 mt-1">${item.itemName}</div>` : ''}
                    <div class="text-sm text-green-600 mt-1">
                        <i class="fas fa-check-circle mr-1"></i>
                        Verificado ${new Date(item.timestamp).toLocaleTimeString('es-ES')}
                    </div>
                </div>
            </div>
        `;
    }).join('');

    if (countElement) countElement.textContent = items.length.toString();
    if (finalizeBtn) finalizeBtn.disabled = false;
    if (finalizeCount) finalizeCount.textContent = items.length.toString();
}

// Finalize Batch Verification - Now just closes the modal
async function finalizeBatchVerification() {
    const items = batchVerificationState.verifiedItems;

    if (items.length === 0) {
        // No items verified, just close
        closeBatchVerificationModal();
        return;
    }

    // Show summary
    showSuccessToast(
        'Verificaciones completadas', 
        `Se guardaron ${items.length} verificación${items.length === 1 ? '' : 'es'} exitosamente`
    );

    // Close modal and reload data
    closeBatchVerificationModal();
}

// Export functions
window.showBatchVerificationModal = showBatchVerificationModal;
window.closeBatchVerificationModal = closeBatchVerificationModal;
window.startBatchScanner = startBatchScanner;
window.stopBatchScanner = stopBatchScanner;
window.finalizeBatchVerification = finalizeBatchVerification;
window.approvePhoto = approvePhoto;
window.rejectPhoto = rejectPhoto;
