// Handle New Verification Form Submission
document.addEventListener('DOMContentLoaded', function() {
    const newVerificationForm = document.getElementById('newVerificationForm');
    
    if (newVerificationForm) {
        newVerificationForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            try {
                let verification;
                
                // Get the optional photo file
                const fileInput = document.getElementById('newVerificationEvidenceFile');
                const photoFile = fileInput && fileInput.files.length > 0 ? fileInput.files[0] : null;
                
                if (verificationData.verificationType === 'serial') {
                    const serialNumber = document.getElementById('newVerificationSerial').value.trim();
                    
                    if (!serialNumber) {
                        showErrorToast('Campo requerido', 'Por favor ingresa un número de serie');
                        return;
                    }
                    
                    verification = await createVerificationBySerial(serialNumber, photoFile);
                } else {
                    const licensePlate = document.getElementById('newVerificationPlate').value.trim();
                    
                    if (!licensePlate) {
                        showErrorToast('Campo requerido', 'Por favor ingresa un número de placa');
                        return;
                    }
                    
                    verification = await createVerificationByPlate(licensePlate, photoFile);
                }
                
                showSuccessToast('Verificación creada', 'La verificación se creó exitosamente');
                closeNewVerificationModal();
                await loadVerificationData();
                
            } catch (error) {
                console.error('Error creating verification:', error);
                showErrorToast('Error al crear verificación', error.message || 'Inténtalo de nuevo');
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
                showErrorToast('Archivo requerido', 'Por favor selecciona un archivo');
                return;
            }
            
            if (!verificationData.currentVerificationId) {
                showErrorToast('Error', 'No se ha seleccionado una verificación');
                return;
            }
            
            try {
                await uploadEvidence(verificationData.currentVerificationId, file);
                showSuccessToast('Evidencia subida', 'La evidencia se subió correctamente');
                closeUploadEvidenceModal();
                await loadVerificationData();
            } catch (error) {
                console.error('Error uploading evidence:', error);
                showErrorToast('Error al subir evidencia', error.message || 'Inténtalo de nuevo');
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

window.handleUploadEvidenceFormSubmit = function() {
    const form = document.getElementById('uploadEvidenceForm');
    if (form) {
        form.dispatchEvent(new Event('submit'));
    }
};

