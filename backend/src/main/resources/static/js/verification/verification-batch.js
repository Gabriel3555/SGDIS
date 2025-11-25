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
                qrbox: { width: 250, height: 250 },
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
function handleScannedCode(code) {
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

    // Capture photo automatically
    capturePhotoForScannedCode(cleanedCode);
}

// Capture Photo for Scanned Code
async function capturePhotoForScannedCode(licencePlate) {
    try {
        const container = document.getElementById('cameraContainer');
        const canvasElement = document.getElementById('cameraCanvas');

        if (!container || !canvasElement || !batchVerificationState.isScanning || !batchVerificationState.html5QrCode) {
            // If camera not available, add without photo
            addScannedItem(licencePlate, null);
            return;
        }

        // Try to get video element from Html5Qrcode container
        const videoElement = container.querySelector('video');
        
        if (!videoElement) {
            // If no video element found, add without photo
            addScannedItem(licencePlate, null);
            return;
        }

        // Wait for video to be ready
        if (videoElement.readyState < 2) {
            videoElement.addEventListener('loadeddata', () => {
                captureFrameToCanvas(videoElement, canvasElement, licencePlate);
            }, { once: true });
        } else {
            captureFrameToCanvas(videoElement, canvasElement, licencePlate);
        }

    } catch (error) {
        console.error('Error capturing photo:', error);
        addScannedItem(licencePlate, null);
    }
}

// Helper function to capture frame from video to canvas
function captureFrameToCanvas(videoElement, canvasElement, licencePlate, isManual = false) {
    try {
        // Create canvas from video frame
        canvasElement.width = videoElement.videoWidth || 640;
        canvasElement.height = videoElement.videoHeight || 480;
        const ctx = canvasElement.getContext('2d');
        ctx.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);

        // Convert canvas to blob
        canvasElement.toBlob((blob) => {
            if (blob) {
                if (isManual) {
                    // Manual capture - prompt for licence plate
                    const file = new File([blob], `manual_capture_${Date.now()}.jpg`, { type: 'image/jpeg' });
                    const licencePlate = prompt('Ingresa el número de placa para esta foto:');
                    if (licencePlate && licencePlate.trim()) {
                        addScannedItem(licencePlate.trim(), file);
                    } else {
                        showErrorToast('Error', 'Debes ingresar un número de placa');
                    }
                } else {
                    // Automatic capture from scan
                    const file = new File([blob], `plate_${licencePlate}_${Date.now()}.jpg`, { type: 'image/jpeg' });
                    addScannedItem(licencePlate, file);
                }
            } else {
                if (!isManual) {
                    addScannedItem(licencePlate, null);
                }
            }
        }, 'image/jpeg', 0.8);
    } catch (error) {
        console.error('Error capturing frame:', error);
        if (!isManual) {
            addScannedItem(licencePlate, null);
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
function addScannedItem(licencePlate, photoFile) {
    const item = {
        licencePlate: licencePlate,
        photo: photoFile,
        timestamp: new Date()
    };

    batchVerificationState.scannedItems.push(item);
    updateScannedItemsList();
    showSuccessToast('Placa escaneada', `Placa ${licencePlate} agregada`);
}

// Remove Scanned Item
function removeScannedItem(index) {
    batchVerificationState.scannedItems.splice(index, 1);
    updateScannedItemsList();
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

        return `
            <div class="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                ${photoPreview}
                <div class="flex-1">
                    <div class="font-semibold text-gray-800">${item.licencePlate}</div>
                    <div class="text-sm text-gray-500">
                        ${new Date(item.timestamp).toLocaleString('es-ES')}
                    </div>
                </div>
                <button onclick="removeScannedItem(${index})" 
                    class="text-red-600 hover:text-red-800 transition-colors">
                    <i class="fas fa-trash"></i>
                </button>
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
window.startBatchScanner = startBatchScanner;
window.stopBatchScanner = stopBatchScanner;
window.captureBatchPhoto = captureBatchPhoto;
window.removeScannedItem = removeScannedItem;
window.finalizeBatchVerification = finalizeBatchVerification;

