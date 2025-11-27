// User-specific verification forms - Validates items belong to user's inventories
// Store evidence file for new verification
let newVerificationEvidenceFile = null;
let newVerificationCameraStream = null;

// Handle New Verification Form Submission
document.addEventListener('DOMContentLoaded', function() {
    const newVerificationForm = document.getElementById('newVerificationForm');
    
    if (newVerificationForm) {
        newVerificationForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            try {
                let verification;
                
                if (verificationData.verificationType === 'serial') {
                    const serialNumber = document.getElementById('newVerificationSerial').value.trim();
                    
                    if (!serialNumber) {
                        showInventoryErrorToast('Campo requerido', 'Por favor ingresa un número de serie');
                        return;
                    }
                    
                    // Validate that user has inventories
                    if (!verificationData.inventories || verificationData.inventories.length === 0) {
                        showInventoryErrorToast('Sin inventarios', 'No tienes inventarios asignados. No puedes realizar verificaciones.');
                        return;
                    }
                    
                    showInventoryInfoToast('Creando verificación', 'Verificando item por número de serie...');
                    verification = await createVerificationBySerial(serialNumber);
                } else {
                    const licensePlate = document.getElementById('newVerificationPlate').value.trim();
                    
                    if (!licensePlate) {
                        showInventoryErrorToast('Campo requerido', 'Por favor ingresa un número de placa');
                        return;
                    }
                    
                    // Validate that user has inventories
                    if (!verificationData.inventories || verificationData.inventories.length === 0) {
                        showInventoryErrorToast('Sin inventarios', 'No tienes inventarios asignados. No puedes realizar verificaciones.');
                        return;
                    }
                    
                    showInventoryInfoToast('Creando verificación', 'Verificando item por placa...');
                    verification = await createVerificationByPlate(licensePlate);
                }
                
                // Upload evidence if available
                if (newVerificationEvidenceFile && verification && verification.verificationId) {
                    try {
                        showInventoryInfoToast('Subiendo evidencia', 'Subiendo evidencia de la verificación...');
                        await uploadEvidence(verification.verificationId, newVerificationEvidenceFile);
                        // El toast de éxito ya se muestra en uploadEvidence
                    } catch (evidenceError) {
                        showInventoryWarningToast('Verificación creada', 'Verificación creada pero no se pudo subir la evidencia. Puedes subirla más tarde.');
                    }
                }
                // El toast de verificación creada ya se muestra en la API
                
                closeNewVerificationModal();
                clearNewVerificationEvidence();
                showInventoryInfoToast('Actualizando datos', 'Recargando verificaciones...');
                await loadVerificationData();
                
            } catch (error) {
                // El error ya muestra toast en la API si es 403 (item no pertenece a inventarios) o 404
                // Solo mostrar toast adicional si no es un error de inventario o item no encontrado
                if (!error.message.includes('no pertenece') && 
                    !error.message.includes('no se encontró') && 
                    !error.message.includes('No se encontró') &&
                    !error.message.includes('no está en mi inventario')) {
                    showInventoryErrorToast('Error al crear verificación', error.message || 'No se pudo crear la verificación. Intenta nuevamente.');
                }
            }
        });
    }
    
    // Handle Upload Evidence Form Submission
    const uploadEvidenceForm = document.getElementById('uploadEvidenceForm');
    
    if (uploadEvidenceForm) {
        uploadEvidenceForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const fileInput = document.getElementById('evidenceFile');
            const file = fileInput.files[0];
            
            if (!file) {
                showInventoryErrorToast('Archivo requerido', 'Por favor selecciona un archivo');
                return;
            }
            
            if (!verificationData.currentVerificationId) {
                showInventoryErrorToast('Error', 'No se ha seleccionado una verificación');
                return;
            }
            
            try {
                showInventoryInfoToast('Subiendo evidencia', 'Subiendo archivo de evidencia...');
                await uploadEvidence(verificationData.currentVerificationId, file);
                closeUploadEvidenceModal();
                showInventoryInfoToast('Actualizando datos', 'Recargando verificaciones...');
                await loadVerificationData();
            } catch (error) {
                showInventoryErrorToast('Error al subir evidencia', error.message || 'No se pudo subir la evidencia. Intenta nuevamente.');
            }
        });
    }
});

window.handleNewVerificationFormSubmit = function() {
    const form = document.getElementById('newVerificationForm');
    if (form) {
        form.dispatchEvent(new Event('submit'));
    }
};

// Handle file selection for new verification
window.handleNewVerificationFileChange = function(event) {
    const file = event.target.files[0];
    
    if (!file) return;
    
    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
        showInventoryErrorToast('Archivo muy grande', 'El archivo no debe superar 5MB');
        event.target.value = '';
        return;
    }
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
        showInventoryErrorToast('Tipo de archivo inválido', 'Solo se permiten imágenes');
        event.target.value = '';
        return;
    }
    
    newVerificationEvidenceFile = file;
    
    // Show preview
    const reader = new FileReader();
    reader.onload = function(e) {
        const preview = document.getElementById('newVerificationEvidencePreview');
        const image = document.getElementById('newVerificationEvidenceImage');
        const buttons = document.getElementById('newVerificationEvidenceButtons');
        
        if (image) image.src = e.target.result;
        if (preview) preview.classList.remove('hidden');
        if (buttons) buttons.classList.add('hidden');
    };
    reader.readAsDataURL(file);
    
    showInventorySuccessToast('Imagen seleccionada', file.name);
};

// Clear evidence
window.clearNewVerificationEvidence = function() {
    newVerificationEvidenceFile = null;
    
    const fileInput = document.getElementById('newVerificationEvidenceFile');
    const preview = document.getElementById('newVerificationEvidencePreview');
    const image = document.getElementById('newVerificationEvidenceImage');
    const buttons = document.getElementById('newVerificationEvidenceButtons');
    
    if (fileInput) fileInput.value = '';
    if (image) image.src = '';
    if (preview) preview.classList.add('hidden');
    if (buttons) buttons.classList.remove('hidden');
};

// Open camera for new verification
window.openNewVerificationCamera = async function() {
    const modal = document.getElementById('newVerificationCameraModal');
    const video = document.getElementById('newVerificationCameraVideo');
    
    if (!modal || !video) return;
    
    try {
        newVerificationCameraStream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment' },
            audio: false 
        });
        
        video.srcObject = newVerificationCameraStream;
        modal.classList.remove('hidden');
        
    } catch (error) {
        showInventoryErrorToast('Error de cámara', 'No se pudo acceder a la cámara. Verifica los permisos del navegador.');
    }
};

// Close camera for new verification
window.closeNewVerificationCamera = function() {
    const modal = document.getElementById('newVerificationCameraModal');
    const video = document.getElementById('newVerificationCameraVideo');
    
    if (newVerificationCameraStream) {
        newVerificationCameraStream.getTracks().forEach(track => track.stop());
        newVerificationCameraStream = null;
    }
    
    if (video) video.srcObject = null;
    if (modal) modal.classList.add('hidden');
};

// Capture photo from camera
window.captureNewVerificationPhoto = function() {
    const video = document.getElementById('newVerificationCameraVideo');
    const canvas = document.getElementById('newVerificationCameraCanvas');
    
    if (!video || !canvas) return;
    
    // Maximum dimensions for the image (to reduce file size)
    const MAX_WIDTH = 1920;
    const MAX_HEIGHT = 1920;
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
    
    // Calculate new dimensions maintaining aspect ratio
    let width = video.videoWidth;
    let height = video.videoHeight;
    
    if (width > MAX_WIDTH || height > MAX_HEIGHT) {
        if (width > height) {
            height = (height * MAX_WIDTH) / width;
            width = MAX_WIDTH;
        } else {
            width = (width * MAX_HEIGHT) / height;
            height = MAX_HEIGHT;
        }
    }
    
    // Set canvas size to calculated dimensions
    canvas.width = width;
    canvas.height = height;
    
    // Draw video frame to canvas (scaled)
    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, width, height);
    
    // Function to compress and validate image
    const compressImage = function(quality) {
        canvas.toBlob(function(blob) {
            if (!blob) {
                showInventoryErrorToast('Error', 'No se pudo capturar la foto');
                return;
            }
            
            // Check file size
            if (blob.size > MAX_FILE_SIZE && quality > 0.3) {
                // If too large and quality can still be reduced, try again with lower quality
                compressImage(quality - 0.1);
                return;
            }
            
            if (blob.size > MAX_FILE_SIZE) {
                // If still too large even at minimum quality, try reducing dimensions further
                const reducedWidth = Math.floor(width * 0.8);
                const reducedHeight = Math.floor(height * 0.8);
                canvas.width = reducedWidth;
                canvas.height = reducedHeight;
                context.drawImage(video, 0, 0, reducedWidth, reducedHeight);
                compressImage(0.5); // Try with reduced size and medium quality
                return;
            }
            
            // Create file from blob
            const file = new File([blob], `evidencia_${Date.now()}.jpg`, { type: 'image/jpeg' });
            newVerificationEvidenceFile = file;
            
            // Show preview
            const reader = new FileReader();
            reader.onload = function(e) {
                const preview = document.getElementById('newVerificationEvidencePreview');
                const image = document.getElementById('newVerificationEvidenceImage');
                const buttons = document.getElementById('newVerificationEvidenceButtons');
                
                if (image) image.src = e.target.result;
                if (preview) preview.classList.remove('hidden');
                if (buttons) buttons.classList.add('hidden');
            };
            reader.readAsDataURL(file);
            
            closeNewVerificationCamera();
            showInventorySuccessToast('Foto capturada', 'Foto capturada correctamente');
            
        }, 'image/jpeg', quality);
    };
    
    // Start compression with initial quality of 0.8
    compressImage(0.8);
};

// Show Upload Evidence Modal
window.showUploadEvidenceModal = function(verificationId) {
    verificationData.currentVerificationId = verificationId;
    const modal = document.getElementById('uploadEvidenceModal');
    if (modal) {
        modal.classList.remove('hidden');
        const form = document.getElementById('uploadEvidenceForm');
        const fileInput = document.getElementById('evidenceFile');
        const fileNameDisplay = document.getElementById('evidenceFileName');
        if (form) form.reset();
        if (fileInput) fileInput.value = '';
        if (fileNameDisplay) fileNameDisplay.textContent = 'JPG, PNG, PDF. Máx. 5MB';
    }
};

// Close Upload Evidence Modal
window.closeUploadEvidenceModal = function() {
    const modal = document.getElementById('uploadEvidenceModal');
    if (modal) {
        modal.classList.add('hidden');
    }
    verificationData.currentVerificationId = null;
};

// Handle Evidence File Change
window.handleEvidenceFileChange = function(event) {
    const file = event.target.files[0];
    const fileNameDisplay = document.getElementById('evidenceFileName');
    
    if (file) {
        const fileSize = file.size / 1024 / 1024; // Convert to MB
        if (fileSize > 5) {
            showInventoryErrorToast('Archivo muy grande', 'El archivo no debe superar 5MB');
            event.target.value = '';
            if (fileNameDisplay) fileNameDisplay.textContent = 'JPG, PNG, PDF. Máx. 5MB';
            return;
        }
        
        if (fileNameDisplay) fileNameDisplay.textContent = file.name;
    } else {
        if (fileNameDisplay) fileNameDisplay.textContent = 'JPG, PNG, PDF. Máx. 5MB';
    }
};

