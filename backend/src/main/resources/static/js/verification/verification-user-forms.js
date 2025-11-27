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
    
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
        showInventoryErrorToast('Tipo de archivo inválido', 'Solo se permiten imágenes');
        event.target.value = '';
        return;
    }
    
    // If file is small enough, use it directly
    if (file.size <= MAX_FILE_SIZE) {
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
        return;
    }
    
    // File is too large, compress it
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            let currentWidth = img.width;
            let currentHeight = img.height;
            
            // Function to compress with progressive quality and size reduction
            const compressImage = function(quality, width, height, attempt = 0) {
                // Limit attempts to prevent infinite loop
                if (attempt > 10) {
                    showInventoryErrorToast('Imagen muy pesada', 'La imagen es demasiado pesada incluso después de comprimir. Por favor, intenta con otra imagen.');
                    event.target.value = '';
                    return;
                }
                
                // Create canvas with current dimensions
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                canvas.toBlob(function(blob) {
                    if (!blob) {
                        showInventoryErrorToast('Error', 'No se pudo procesar la imagen');
                        event.target.value = '';
                        return;
                    }
                    
                    // If file is within limit, use it
                    if (blob.size <= MAX_FILE_SIZE) {
                        const compressedFile = new File([blob], file.name, { type: 'image/jpeg' });
                        newVerificationEvidenceFile = compressedFile;
                        
                        // Show preview
                        const previewReader = new FileReader();
                        previewReader.onload = function(e) {
                            const preview = document.getElementById('newVerificationEvidencePreview');
                            const image = document.getElementById('newVerificationEvidenceImage');
                            const buttons = document.getElementById('newVerificationEvidenceButtons');
                            
                            if (image) image.src = e.target.result;
                            if (preview) preview.classList.remove('hidden');
                            if (buttons) buttons.classList.add('hidden');
                        };
                        previewReader.readAsDataURL(compressedFile);
                        
                        showInventorySuccessToast('Imagen seleccionada y comprimida', file.name);
                        return;
                    }
                    
                    // File is still too large, try with lower quality
                    if (quality > 0.3) {
                        // Reduce quality
                        compressImage(Math.max(0.3, quality - 0.1), width, height, attempt + 1);
                        return;
                    }
                    
                    // Quality is already at minimum, try reducing dimensions
                    if (width > 640 || height > 640) {
                        const newWidth = Math.floor(width * 0.8);
                        const newHeight = Math.floor(height * 0.8);
                        compressImage(0.5, newWidth, newHeight, attempt + 1);
                        return;
                    }
                    
                    // Can't compress more, show error
                    showInventoryErrorToast('Imagen muy pesada', 'La imagen es demasiado pesada incluso después de comprimir. Por favor, intenta con otra imagen.');
                    event.target.value = '';
                }, 'image/jpeg', quality);
            };
            
            // Start compression with initial quality of 0.8
            compressImage(0.8, currentWidth, currentHeight, 0);
        };
        img.onerror = function() {
            showInventoryErrorToast('Error', 'No se pudo cargar la imagen');
            event.target.value = '';
        };
        img.src = e.target.result;
    };
    reader.onerror = function() {
        showInventoryErrorToast('Error', 'No se pudo leer el archivo');
        event.target.value = '';
    };
    reader.readAsDataURL(file);
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
    
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    let currentWidth = video.videoWidth;
    let currentHeight = video.videoHeight;
    
    // Set canvas size to video size initially
    canvas.width = currentWidth;
    canvas.height = currentHeight;
    
    // Draw video frame to canvas
    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Function to compress with progressive quality reduction
    const compressImage = function(quality, width, height, attempt = 0) {
        // Limit attempts to prevent infinite loop
        if (attempt > 10) {
            showInventoryErrorToast('Imagen muy pesada', 'La imagen es demasiado pesada incluso después de comprimir. Por favor, intenta con otra foto o reduce la resolución de la cámara.');
            closeNewVerificationCamera();
            return;
        }
        
        // Set canvas size
        canvas.width = width;
        canvas.height = height;
        context.drawImage(video, 0, 0, width, height);
        
        canvas.toBlob(function(blob) {
            if (!blob) {
                showInventoryErrorToast('Error', 'No se pudo capturar la foto');
                return;
            }
            
            // If file is within limit, use it
            if (blob.size <= MAX_FILE_SIZE) {
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
                return;
            }
            
            // File is still too large, try with lower quality
            if (quality > 0.3) {
                // Reduce quality
                compressImage(Math.max(0.3, quality - 0.1), width, height, attempt + 1);
                return;
            }
            
            // Quality is already at minimum, try reducing dimensions
            if (width > 640 || height > 640) {
                const newWidth = Math.floor(width * 0.8);
                const newHeight = Math.floor(height * 0.8);
                compressImage(0.5, newWidth, newHeight, attempt + 1);
                return;
            }
            
            // Can't compress more, show error
            showInventoryErrorToast('Imagen muy pesada', 'La imagen es demasiado pesada incluso después de comprimir. Por favor, intenta con otra foto o reduce la resolución de la cámara.');
            closeNewVerificationCamera();
        }, 'image/jpeg', quality);
    };
    
    // Start compression with initial quality of 0.8
    compressImage(0.8, currentWidth, currentHeight, 0);
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
    
    if (!file) {
        if (fileNameDisplay) fileNameDisplay.textContent = 'JPG, PNG, PDF. Máx. 5MB';
        return;
    }
    
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
    
    // For PDF files, just validate size (can't compress PDFs easily)
    if (file.type === 'application/pdf') {
        if (file.size > MAX_FILE_SIZE) {
            showInventoryErrorToast('Archivo muy grande', 'El archivo PDF no debe superar 5MB');
            event.target.value = '';
            if (fileNameDisplay) fileNameDisplay.textContent = 'JPG, PNG, PDF. Máx. 5MB';
            return;
        }
        if (fileNameDisplay) fileNameDisplay.textContent = file.name;
        return;
    }
    
    // For images, compress if needed
    if (!file.type.startsWith('image/')) {
        showInventoryErrorToast('Tipo de archivo inválido', 'Solo se permiten imágenes o PDFs');
        event.target.value = '';
        if (fileNameDisplay) fileNameDisplay.textContent = 'JPG, PNG, PDF. Máx. 5MB';
        return;
    }
    
    // If image is small enough, use it directly
    if (file.size <= MAX_FILE_SIZE) {
        if (fileNameDisplay) fileNameDisplay.textContent = file.name;
        return;
    }
    
    // Image is too large, compress it
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            let currentWidth = img.width;
            let currentHeight = img.height;
            
            // Function to compress with progressive quality and size reduction
            const compressImage = function(quality, width, height, attempt = 0) {
                // Limit attempts to prevent infinite loop
                if (attempt > 10) {
                    showInventoryErrorToast('Imagen muy pesada', 'La imagen es demasiado pesada incluso después de comprimir. Por favor, intenta con otra imagen.');
                    event.target.value = '';
                    if (fileNameDisplay) fileNameDisplay.textContent = 'JPG, PNG, PDF. Máx. 5MB';
                    return;
                }
                
                // Create canvas with current dimensions
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                canvas.toBlob(function(blob) {
                    if (!blob) {
                        showInventoryErrorToast('Error', 'No se pudo procesar la imagen');
                        event.target.value = '';
                        if (fileNameDisplay) fileNameDisplay.textContent = 'JPG, PNG, PDF. Máx. 5MB';
                        return;
                    }
                    
                    // If file is within limit, replace the file input
                    if (blob.size <= MAX_FILE_SIZE) {
                        const compressedFile = new File([blob], file.name, { type: 'image/jpeg' });
                        
                        // Create a new FileList with the compressed file
                        const dataTransfer = new DataTransfer();
                        dataTransfer.items.add(compressedFile);
                        event.target.files = dataTransfer.files;
                        
                        if (fileNameDisplay) fileNameDisplay.textContent = file.name + ' (comprimida)';
                        showInventorySuccessToast('Imagen comprimida', 'La imagen se comprimió automáticamente');
                        return;
                    }
                    
                    // File is still too large, try with lower quality
                    if (quality > 0.3) {
                        // Reduce quality
                        compressImage(Math.max(0.3, quality - 0.1), width, height, attempt + 1);
                        return;
                    }
                    
                    // Quality is already at minimum, try reducing dimensions
                    if (width > 640 || height > 640) {
                        const newWidth = Math.floor(width * 0.8);
                        const newHeight = Math.floor(height * 0.8);
                        compressImage(0.5, newWidth, newHeight, attempt + 1);
                        return;
                    }
                    
                    // Can't compress more, show error
                    showInventoryErrorToast('Imagen muy pesada', 'La imagen es demasiado pesada incluso después de comprimir. Por favor, intenta con otra imagen.');
                    event.target.value = '';
                    if (fileNameDisplay) fileNameDisplay.textContent = 'JPG, PNG, PDF. Máx. 5MB';
                }, 'image/jpeg', quality);
            };
            
            // Start compression with initial quality of 0.8
            compressImage(0.8, currentWidth, currentHeight, 0);
        };
        img.onerror = function() {
            showInventoryErrorToast('Error', 'No se pudo cargar la imagen');
            event.target.value = '';
            if (fileNameDisplay) fileNameDisplay.textContent = 'JPG, PNG, PDF. Máx. 5MB';
        };
        img.src = e.target.result;
    };
    reader.onerror = function() {
        showInventoryErrorToast('Error', 'No se pudo leer el archivo');
        event.target.value = '';
        if (fileNameDisplay) fileNameDisplay.textContent = 'JPG, PNG, PDF. Máx. 5MB';
    };
    reader.readAsDataURL(file);
};

