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
                        showErrorToast('Campo requerido', 'Por favor ingresa un número de serie');
                        return;
                    }
                    
                    // Validate that user has inventories
                    if (!verificationData.inventories || verificationData.inventories.length === 0) {
                        showErrorToast('Sin inventarios', 'No tienes inventarios asignados. No puedes realizar verificaciones.');
                        return;
                    }
                    
                    verification = await createVerificationBySerial(serialNumber);
                } else {
                    const licensePlate = document.getElementById('newVerificationPlate').value.trim();
                    
                    if (!licensePlate) {
                        showErrorToast('Campo requerido', 'Por favor ingresa un número de placa');
                        return;
                    }
                    
                    // Validate that user has inventories
                    if (!verificationData.inventories || verificationData.inventories.length === 0) {
                        showErrorToast('Sin inventarios', 'No tienes inventarios asignados. No puedes realizar verificaciones.');
                        return;
                    }
                    
                    verification = await createVerificationByPlate(licensePlate);
                }
                
                // Upload evidence if available
                if (newVerificationEvidenceFile && verification && verification.verificationId) {
                    try {
                        await uploadEvidence(verification.verificationId, newVerificationEvidenceFile);
                        showSuccessToast('Verificación creada', 'La verificación y evidencia se crearon exitosamente');
                    } catch (evidenceError) {
                        console.error('Error uploading evidence:', evidenceError);
                        showWarningToast('Verificación creada', 'Verificación creada pero no se pudo subir la evidencia');
                    }
                } else {
                    showSuccessToast('Verificación creada', 'La verificación se creó exitosamente');
                }
                
                closeNewVerificationModal();
                clearNewVerificationEvidence();
                await loadVerificationData();
                
            } catch (error) {
                console.error('Error creating verification:', error);
                showErrorToast('Error al crear verificación', error.message || 'Inténtalo de nuevo');
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
        showErrorToast('Archivo muy grande', 'El archivo no debe superar 5MB');
        event.target.value = '';
        return;
    }
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
        showErrorToast('Tipo de archivo inválido', 'Solo se permiten imágenes');
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
    
    showSuccessToast('Imagen seleccionada', file.name);
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
        console.error('Error accessing camera:', error);
        showErrorToast('Error de cámara', 'No se pudo acceder a la cámara. Verifica los permisos.');
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
    
    // Set canvas size to video size
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw video frame to canvas
    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert canvas to blob
    canvas.toBlob(function(blob) {
        if (!blob) {
            showErrorToast('Error', 'No se pudo capturar la foto');
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
        showSuccessToast('Foto capturada', 'Foto capturada correctamente');
        
    }, 'image/jpeg', 0.9);
};

