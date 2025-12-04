// Batch Verification State
let batchVerificationState = {
    scannedItems: [],
    html5QrCode: null,
    cameraStream: null,
    isScanning: false,
    lastScannedCode: null,
    scanCooldown: 2000 // 2 seconds cooldown between scans
};

// Ensure toast functions are available (fallback if not loaded)
if (typeof window.showSuccessToast === 'undefined') {
    console.warn('showSuccessToast not available, using fallback');
    window.showSuccessToast = function(title, message) {
        alert(`${title}: ${message}`);
    };
}
if (typeof window.showErrorToast === 'undefined') {
    console.warn('showErrorToast not available, using fallback');
    window.showErrorToast = function(title, message) {
        alert(`ERROR: ${title}: ${message}`);
    };
}
if (typeof window.showWarningToast === 'undefined') {
    console.warn('showWarningToast not available, using fallback');
    window.showWarningToast = function(title, message) {
        alert(`ADVERTENCIA: ${title}: ${message}`);
    };
}
if (typeof window.showInfoToast === 'undefined') {
    console.warn('showInfoToast not available, using fallback');
    window.showInfoToast = function(title, message) {
        alert(`INFO: ${title}: ${message}`);
    };
}

// Show Batch Verification Modal
function showBatchVerificationModal() {
    const modal = document.getElementById('batchVerificationModal');
    if (modal) {
        modal.classList.remove('hidden');
        resetBatchVerificationState();
        updateScannedItemsList();
    } else {
        console.error('Batch verification modal not found');
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

// Validate item belongs to user's regional (for ADMIN_REGIONAL only)
async function validateItemRegionalForAdminRegional(item) {
    // Check if we're on admin regional page
    const path = window.location.pathname || '';
    const isAdminRegionalPage = path.includes('/admin_regional/verification');
    
    if (!isAdminRegionalPage) {
        return true; // No validation needed for other roles
    }
    
    if (!item || !item.inventoryId) {
        showErrorToast('Error', 'El ítem no tiene información de inventario válida');
        return false;
    }
    
    try {
        const token = localStorage.getItem('jwt');
        if (!token) {
            showErrorToast('Error', 'No se encontró token de autenticación');
            return false;
        }
        
        // Get user's regional ID from window or load it
        let userRegionalId = window.currentUserRegionalId || currentUserRegionalId;
        
        // If not found, try to load it using the verification function
        if (!userRegionalId && typeof loadCurrentUserInfoForVerifications === 'function') {
            await loadCurrentUserInfoForVerifications();
            userRegionalId = window.currentUserRegionalId || currentUserRegionalId;
        }
        
        // If we still don't have the regional ID, reject the item
        if (!userRegionalId) {
            showErrorToast('Error', 'No se pudo obtener la información de tu regional. Por favor, recarga la página.');
            return false;
        }
        
        // Get inventory to check regional
        const inventoryResponse = await fetch(`/api/v1/inventory/${item.inventoryId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!inventoryResponse.ok) {
            showErrorToast('Error', 'No se pudo obtener la información del inventario');
            return false;
        }
        
        const inventory = await inventoryResponse.json();
        
        // Validate regional match - STRICT: must match exactly
        const inventoryRegionalId = inventory.regionalId || inventory.institution?.regionalId || 
                                   (inventory.institution && inventory.institution.regionalId ? inventory.institution.regionalId : null);
        
        if (!inventoryRegionalId) {
            // If inventory doesn't have regional info, it might be because the item is cancelled
            // Let the backend handle this validation - it will check if item is cancelled first
            // Don't block here, return true and let backend validate
            console.warn('Inventory missing regional info - backend will validate if item is cancelled');
            return true; // Allow it through, backend will check cancellation status
        }
        
        if (userRegionalId.toString() !== inventoryRegionalId.toString()) {
            const regionalName = inventory.regionalName || inventory.institution?.regionalName || 'otra regional';
            showErrorToast(
                'Ítem no pertenece a tu regional', 
                `El ítem pertenece a ${regionalName}. Solo puedes verificar ítems de tu regional.`
            );
            return false;
        }
        
        // All validations passed
        return true;
    } catch (error) {
        console.error('Error validating item regional:', error);
        showErrorToast('Error', 'Error al validar el ítem. Por favor, intenta de nuevo.');
        return false; // Reject on error for security
    }
}

// Validate item belongs to user's institution (for ADMIN_INSTITUTION only)
async function validateItemInstitutionForAdminInstitution(item) {
    // Check if we're on admin institution page
    const path = window.location.pathname || '';
    const isAdminInstitutionPage = path.includes('/admin_institution/verification') || path.includes('/admininstitution/verification');
    
    if (!isAdminInstitutionPage) {
        return true; // No validation needed for other roles
    }
    
    if (!item || !item.inventoryId) {
        showErrorToast('Error', 'El ítem no tiene información de inventario válida');
        return false;
    }
    
    try {
        const token = localStorage.getItem('jwt');
        if (!token) {
            showErrorToast('Error', 'No se encontró token de autenticación');
            return false;
        }
        
        // Get user's institution ID from window or load it
        let userInstitutionId = window.currentUserInstitutionId;
        
        // If not found, try to get it from current user data (from /api/v1/users/me)
        if (!userInstitutionId && window.currentUserData && window.currentUserData.institutionId) {
            userInstitutionId = window.currentUserData.institutionId;
            window.currentUserInstitutionId = userInstitutionId;
        }
        
        // If still not found, try to load it using the verification function
        if (!userInstitutionId && typeof loadCurrentUserInfoForVerifications === 'function') {
            await loadCurrentUserInfoForVerifications();
            userInstitutionId = window.currentUserInstitutionId;
        }
        
        // If we still don't have the institution ID, reject the item
        if (!userInstitutionId) {
            showErrorToast('Error', 'No se pudo obtener la información de tu institución. Por favor, recarga la página.');
            return false;
        }
        
        // Get inventory to check institution
        const inventoryResponse = await fetch(`/api/v1/inventory/${item.inventoryId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!inventoryResponse.ok) {
            showErrorToast('Error', 'No se pudo obtener la información del inventario');
            return false;
        }
        
        const inventory = await inventoryResponse.json();
        
        // Validate institution match - STRICT: must match exactly
        if (!inventory.institutionId) {
            showErrorToast('Error', 'El inventario no tiene información de institución válida');
            return false;
        }
        
        if (userInstitutionId.toString() !== inventory.institutionId.toString()) {
            const institutionName = inventory.institutionName || 'otra institución';
            showErrorToast(
                'Ítem no pertenece a tu institución', 
                `El ítem pertenece a ${institutionName}. Solo puedes verificar ítems de tu institución.`
            );
            return false;
        }
        
        // All validations passed
        return true;
    } catch (error) {
        console.error('Error validating item institution:', error);
        showErrorToast('Error', 'Error al validar el ítem. Por favor, intenta de nuevo.');
        return false; // Reject on error for security
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
            showErrorToast('Placa no encontrada', `La placa ${plateNumber} no coincide con ningún item en el inventario o no tienes acceso a él`);
            input.value = '';
            input.focus();
            return;
        }
        
        // Check if item is cancelled (given de baja) before adding to list
        const isCancelled = await checkItemCancellationStatus(item);
        if (isCancelled) {
            const itemName = item.productName || 'Item';
            const plateInfo = item.licencePlateNumber ? ` (Placa: ${item.licencePlateNumber})` : '';
            showErrorToast(
                '⚠️ Item dado de baja', 
                `El item "${itemName}"${plateInfo} está dado de baja y no puede ser verificado.`
            );
            input.value = '';
            input.focus();
            return;
        }
        
        // Validate item belongs to user's institution (for ADMIN_INSTITUTION only)
        // Note: We validate here for UX, but backend will do final validation
        const isValidInstitution = await validateItemInstitutionForAdminInstitution(item);
        if (!isValidInstitution) {
            input.value = '';
            input.focus();
            return;
        }
        
        // Validate item belongs to user's regional (for ADMIN_REGIONAL only)
        // Note: If inventory info is missing (e.g., item cancelled), allow it through
        // Backend will check cancellation status and return appropriate error
        const isValidRegional = await validateItemRegionalForAdminRegional(item);
        if (!isValidRegional) {
            // Don't block if it's a missing data issue - backend will handle cancellation check
            // Only block if it's a clear "wrong regional" permission issue
            // The validateItemRegionalForAdminRegional function now returns true for missing data
            // and only returns false for clear permission issues
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
        
        const successMessage = itemName 
            ? `Placa ${plateNumber} - ${itemName} agregada correctamente`
            : `Placa ${plateNumber} agregada correctamente`;
        showSuccessToast('Placa agregada', successMessage);
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
            showErrorToast('Placa no encontrada', `La placa ${cleanedCode} no coincide con ningún item en el inventario o no tienes acceso a él`);
            return;
        }
        
        // Check if item is cancelled (given de baja) before adding to list
        const isCancelled = await checkItemCancellationStatus(item);
        if (isCancelled) {
            const itemName = item.productName || 'Item';
            const plateInfo = item.licencePlateNumber || cleanedCode;
            showErrorToast(
                '⚠️ Item dado de baja', 
                `El item "${itemName}" (Placa: ${plateInfo}) está dado de baja y no puede ser verificado.`
            );
            return;
        }
        
        // Validate item belongs to user's institution (for ADMIN_INSTITUTION only)
        const isValidInstitution = await validateItemInstitutionForAdminInstitution(item);
        if (!isValidInstitution) {
            return;
        }
        
        // Validate item belongs to user's regional (for ADMIN_REGIONAL only)
        const isValidRegional = await validateItemRegionalForAdminRegional(item);
        if (!isValidRegional) {
            return;
        }
        
        const itemName = item.productName;
        
        // Capture photo automatically only if item exists
        capturePhotoForScannedCode(cleanedCode, itemName);
    } catch (error) {
        console.error('Error handling scanned code:', error);
        showErrorToast('Error al procesar placa', error.message || `No se pudo procesar la placa ${cleanedCode}`);
    }
}

// Check if item is cancelled (given de baja)
// This function attempts to create a verification to check cancellation status
// If the item is cancelled, the backend will return an error
async function checkItemCancellationStatus(item) {
    if (!item || (!item.id && !item.licencePlateNumber && !item.licencePlate)) {
        return false;
    }
    
    try {
        const token = localStorage.getItem('jwt');
        if (!token) {
            return false; // Can't check without token, let backend handle it
        }
        
        const licencePlate = item.licencePlateNumber || item.licencePlate;
        if (!licencePlate) {
            return false; // Need licence plate to check
        }
        
        // Try to create a verification to check if item is cancelled
        // The backend will return an error if the item is cancelled
        const response = await fetch(`/api/v1/verifications/by-licence-plate`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                licencePlateNumber: licencePlate
            })
        });
        
        if (response.ok) {
            // Verification was created successfully, item is not cancelled
            // Note: This creates a real verification, but it's acceptable since
            // the user is trying to verify the item anyway
            return false; // Item is not cancelled
        } else {
            // Check if error is about cancellation
            try {
                const errorData = await response.json();
                const errorMessage = errorData.message || errorData.error || '';
                
                // Check if error message indicates item is cancelled
                if (errorMessage.includes('dado de baja') || 
                    errorMessage.includes('está dado de baja') ||
                    errorMessage.toLowerCase().includes('baja')) {
                    return true; // Item is cancelled
                }
            } catch (e) {
                // Couldn't parse error, assume not cancelled
            }
            return false; // Other error, not cancellation
        }
    } catch (error) {
        console.error('Error checking cancellation status:', error);
        return false; // On error, assume not cancelled and let backend handle it
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
            // Try to get error message from response
            let errorMessage = 'Error al buscar el item';
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorData.error || errorMessage;
            } catch (e) {
                if (response.status === 400) {
                    errorMessage = 'Error en la solicitud. Verifica que la placa sea válida';
                } else if (response.status === 403) {
                    errorMessage = 'No tienes permisos para acceder a este item';
                } else if (response.status === 401) {
                    errorMessage = 'Sesión expirada. Por favor inicia sesión nuevamente';
                } else {
                    errorMessage = `Error al buscar el item (${response.status})`;
                }
            }
            // Show toast for API errors (not 404)
            if (typeof showErrorToast === 'function') {
                showErrorToast('Error al buscar item', errorMessage);
            }
            throw new Error(errorMessage);
        }
    } catch (error) {
        console.error('Error getting item by licence plate:', error);
        // Only show toast if it wasn't already shown above (for non-404 errors)
        if (error.message && !error.message.includes('Error al buscar el item')) {
            if (typeof showErrorToast === 'function') {
                showErrorToast('Error de conexión', 'No se pudo conectar con el servidor. Verifica tu conexión a internet.');
            }
        }
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
            await addScannedItem(licencePlate, null, itemName);
            return;
        }

        // Try to get video element from Html5Qrcode container
        const videoElement = container.querySelector('video');
        
        if (!videoElement) {
            // If no video element found, add without photo
            await addScannedItem(licencePlate, null, itemName);
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
        await addScannedItem(licencePlate, null, itemName);
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
                            await addScannedItem(licencePlate.trim(), file, itemName);
                        } catch (error) {
                            await addScannedItem(licencePlate.trim(), file, null);
                        }
                    } else {
                        showErrorToast('Error', 'Debes ingresar un número de placa');
                    }
                } else {
                    // Automatic capture from scan - item was already validated in handleScannedCode
                    const file = new File([blob], `plate_${licencePlate}_${Date.now()}.jpg`, { type: 'image/jpeg' });
                    await addScannedItem(licencePlate, file, itemName);
                }
            } else {
                if (!isManual) {
                    // Automatic capture - item was already validated in handleScannedCode
                    await addScannedItem(licencePlate, null, itemName);
                }
            }
        }, 'image/jpeg', 0.8);
    } catch (error) {
        console.error('Error capturing frame:', error);
        if (!isManual) {
            // Use async IIFE to handle await in catch block
            (async () => {
                await addScannedItem(licencePlate, null, itemName);
            })();
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
async function addScannedItem(licencePlate, photoFile, itemName = null) {
    // Validate item belongs to user's institution (for ADMIN_INSTITUTION only)
    // We need to get the item again to validate
    const path = window.location.pathname || '';
    const isAdminInstitutionPage = path.includes('/admin_institution/verification') || path.includes('/admininstitution/verification');
    const isAdminRegionalPage = path.includes('/admin_regional/verification');
    
    if (isAdminInstitutionPage || isAdminRegionalPage) {
        try {
            const item = await getItemByLicencePlate(licencePlate);
            if (item) {
                // Validate item belongs to user's institution (for ADMIN_INSTITUTION only)
                if (isAdminInstitutionPage) {
                    const isValidInstitution = await validateItemInstitutionForAdminInstitution(item);
                    if (!isValidInstitution) {
                        return; // Don't add item if validation fails
                    }
                }
                
                // Validate item belongs to user's regional (for ADMIN_REGIONAL only)
                if (isAdminRegionalPage) {
                    const isValidRegional = await validateItemRegionalForAdminRegional(item);
                    if (!isValidRegional) {
                        return; // Don't add item if validation fails
                    }
                }
            }
        } catch (error) {
            console.error('Error validating item in addScannedItem:', error);
            // If validation fails, don't add the item for admin institution/regional
            if (isAdminInstitutionPage) {
                showErrorToast('Error de validación', 'No se pudo validar que el ítem pertenezca a tu institución');
                return;
            }
        }
    }
    
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
            showErrorToast('Sin placas para verificar', 'Debes escanear o agregar al menos una placa antes de finalizar la verificación');
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
            let errorMessage = 'Error al crear las verificaciones';
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorData.error || errorMessage;
                
                // Handle specific error cases
                if (response.status === 400) {
                    errorMessage = errorData.message || 'Datos inválidos. Verifica las placas ingresadas.';
                } else if (response.status === 401) {
                    errorMessage = 'Sesión expirada. Por favor, inicia sesión nuevamente.';
                } else if (response.status === 403) {
                    errorMessage = errorData.message || 'No tienes permisos para realizar esta acción.';
                } else if (response.status === 500) {
                    errorMessage = 'Error del servidor. Por favor, intenta más tarde.';
                }
            } catch (e) {
                // If can't parse error, use status-based message
                if (response.status === 400) {
                    errorMessage = 'Datos inválidos en la solicitud';
                } else if (response.status === 401) {
                    errorMessage = 'Sesión expirada. Por favor, inicia sesión nuevamente.';
                } else if (response.status === 403) {
                    errorMessage = 'No tienes permisos para realizar esta acción';
                } else if (response.status === 500) {
                    errorMessage = 'Error del servidor. Por favor, intenta más tarde.';
                }
            }
            throw new Error(errorMessage);
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
                    const evidenceMessage = evidenceUploadCount === 1 
                        ? 'Se subió 1 evidencia adicional correctamente'
                        : `Se subieron ${evidenceUploadCount} evidencias adicionales correctamente`;
                    showSuccessToast('Evidencias subidas', evidenceMessage);
                }
            }
        }

        // Show results with detailed messages
        if (result.successfulItems === result.totalItems && result.totalItems > 0) {
            const message = result.totalItems === 1 
                ? 'Se creó 1 verificación exitosamente' 
                : `Se crearon ${result.successfulItems} verificaciones exitosamente`;
            showSuccessToast('Verificación completada', message);
        } else if (result.successfulItems > 0) {
            // Partial success
            const failedDetails = result.results
                .filter(r => !r.success)
                .map(r => `${r.licencePlateNumber}: ${r.message || 'Error desconocido'}`)
                .join(', ');
            
            showWarningToast(
                'Verificación parcial', 
                `Se crearon ${result.successfulItems} de ${result.totalItems} verificaciones. ${result.failedItems} fallaron.${failedDetails ? ' Detalles: ' + failedDetails : ''}`
            );
        } else {
            // All failed
            const errorDetails = result.results
                .map(r => `${r.licencePlateNumber}: ${r.message || 'Error desconocido'}`)
                .join(', ');
            showErrorToast(
                'Error en la verificación', 
                `No se pudo crear ninguna verificación. ${errorDetails}`
            );
        }

        // Close modal and reload data
        closeBatchVerificationModal();
        // Reload verifications - check if we're on admin institution page
        const path = window.location.pathname || '';
        const isAdminInstitutionPage = path.includes('/admin_institution/verification') || path.includes('/admininstitution/verification');
        if (isAdminInstitutionPage && typeof loadVerificationsForAdminInstitution === 'function') {
            await loadVerificationsForAdminInstitution();
        } else if (typeof loadVerificationData === 'function') {
            await loadVerificationData();
        }

    } catch (error) {
        console.error('Error finalizing batch verification:', error);
        let errorMessage = 'Error al crear las verificaciones';
        
        if (error.message) {
            errorMessage = error.message;
        } else if (error.response) {
            try {
                const errorData = await error.response.json();
                errorMessage = errorData.message || errorMessage;
            } catch (e) {
                // If can't parse error response, use default
            }
        }
        
        showErrorToast('Error al procesar verificaciones', errorMessage);
    } finally {
        hideLoadingState();
    }
}

// Export functions (already exported above, but keep this for consistency)
// Export functions to global scope
if (typeof window !== 'undefined') {
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
    window.getItemByLicencePlate = getItemByLicencePlate;
    window.validateItemInstitutionForAdminInstitution = validateItemInstitutionForAdminInstitution;
    window.validateItemRegionalForAdminRegional = validateItemRegionalForAdminRegional;
}

