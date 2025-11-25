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
        console.log('Iniciando escáner...');
        
        // Check if Html5Qrcode is available
        if (typeof Html5Qrcode === 'undefined') {
            console.error('Html5Qrcode no está definido');
            showErrorToast('Error', 'Biblioteca de escaneo no disponible. Por favor recarga la página.');
            return;
        }
        
        console.log('Html5Qrcode disponible');

        const cameraContainer = document.getElementById('cameraContainer');
        const placeholder = document.getElementById('cameraPlaceholder');
        const overlay = document.getElementById('scanOverlay');
        
        if (!cameraContainer) {
            console.error('Container de cámara no encontrado');
            showErrorToast('Error', 'Contenedor de cámara no encontrado');
            return;
        }

        // Hide placeholder and show overlay
        if (placeholder) placeholder.style.display = 'none';
        if (overlay) overlay.classList.remove('hidden');

        // Create Html5Qrcode instance with the container ID
        console.log('Creando instancia Html5Qrcode...');
        batchVerificationState.html5QrCode = new Html5Qrcode("cameraContainer");

        // Get available cameras
        console.log('Solicitando cámaras disponibles...');
        const cameras = await Html5Qrcode.getCameras();
        console.log('Cámaras disponibles:', cameras);
        
        if (!cameras || cameras.length === 0) {
            throw new Error('No se encontraron cámaras disponibles');
        }

        // Try to use the back camera (environment) first, otherwise use first available
        const cameraId = cameras.length > 1 ? cameras[cameras.length - 1].id : cameras[0].id;
        console.log('Usando cámara:', cameraId);

        // Start scanning
        console.log('Iniciando escaneo...');
        await batchVerificationState.html5QrCode.start(
            { facingMode: "environment" }, // Use back camera if available
            config,
            (decodedText, decodedResult) => {
                console.log('Código escaneado:', decodedText);
                handleScannedCode(decodedText);
            },
            (errorMessage) => {
                // Ignore scanning errors (they're expected during continuous scanning)
            }
        );

        batchVerificationState.isScanning = true;
        console.log('Escáner iniciado exitosamente');

        // Update UI
        document.getElementById('startCameraBtn').classList.add('hidden');
        document.getElementById('stopCameraBtn').classList.remove('hidden');
        document.getElementById('capturePhotoBtn').classList.remove('hidden');

        showSuccessToast('Cámara iniciada', 'Escanea códigos de barras o QR de placas');

    } catch (error) {
        console.error('Error detallado al iniciar scanner:', error);
        let errorMessage = 'No se pudo iniciar la cámara.';
        
        if (error.name === 'NotAllowedError' || error.message.includes('Permission')) {
            errorMessage = 'Permiso de cámara denegado. Por favor permite el acceso a la cámara.';
        } else if (error.name === 'NotFoundError') {
            errorMessage = 'No se encontró ninguna cámara en el dispositivo.';
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        showErrorToast('Error', errorMessage);
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
        const itemName = item ? item.productName : null;
        
        // Capture photo automatically
        capturePhotoForScannedCode(cleanedCode, itemName);
    } catch (error) {
        console.error('Error fetching item:', error);
        // Continue with scan even if item lookup fails
        capturePhotoForScannedCode(cleanedCode, null);
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

