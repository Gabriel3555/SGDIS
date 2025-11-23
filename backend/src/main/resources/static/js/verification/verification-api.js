// Load verification data
async function loadVerificationData() {
    if (verificationData.isLoading) return;

    verificationData.isLoading = true;
    showLoadingState();

    try {
        await loadCurrentUserInfo();
        await loadInventories();
        await loadLatestVerifications();
        updateVerificationUI();

    } catch (error) {
        console.error('Error loading verification data:', error);

        let errorMessage = 'Error al cargar los datos de verificaciones: ' + error.message;

        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            errorMessage = 'Error de conexión. Verifica tu conexión a internet e intenta nuevamente.';
        } else if (error.message.includes('401')) {
            errorMessage = 'Sesión expirada. Por favor inicia sesión nuevamente.';
        } else if (error.message.includes('403')) {
            errorMessage = 'No tienes permisos para ver las verificaciones.';
        } else if (error.message.includes('404')) {
            errorMessage = 'Servicio de verificaciones no encontrado. Contacta al administrador.';
        } else if (error.message.includes('500')) {
            errorMessage = 'Error interno del servidor. Inténtalo más tarde.';
        }

        showErrorState(errorMessage);
        updateVerificationUI();
    } finally {
        verificationData.isLoading = false;
        hideLoadingState();
    }
}

async function loadCurrentUserInfo() {
    try {
        const token = localStorage.getItem('jwt');
        if (!token) {
            throw new Error('No authentication token found');
        }

        const response = await fetch('/api/v1/users/me', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const userData = await response.json();
            updateUserInfoDisplay(userData);
        } else {
            throw new Error('Failed to load user info');
        }
    } catch (error) {
        console.error('Error loading current user info:', error);
        updateUserInfoDisplay({
            fullName: 'Super Admin',
            role: 'ADMIN',
            email: 'admin@sena.edu.co'
        });
    }
}

async function loadInventories() {
    try {
        const token = localStorage.getItem('jwt');
        const headers = { 'Content-Type': 'application/json' };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch('/api/v1/inventory', {
            method: 'GET',
            headers: headers
        });

        if (response.ok) {
            const inventories = await response.json();
            verificationData.inventories = Array.isArray(inventories) ? inventories : [];
        } else {
            verificationData.inventories = [];
        }
    } catch (error) {
        console.error('Error loading inventories:', error);
        verificationData.inventories = [];
    }
}

async function loadLatestVerifications() {
    try {
        // Load verifications for all inventories
        const allVerifications = [];
        
        for (const inventory of verificationData.inventories) {
            try {
                const verifications = await getLatestVerifications(inventory.id);
                allVerifications.push(...verifications);
            } catch (error) {
                console.error(`Error loading verifications for inventory ${inventory.id}:`, error);
            }
        }

        verificationData.verifications = allVerifications;
        verificationData.filteredVerifications = [...verificationData.verifications];

        if (verificationData.verifications.length === 0) {
            showInfoToast('Información', 'No hay verificaciones registradas en el sistema.');
        }
    } catch (error) {
        console.error('Error loading verifications:', error);
        verificationData.verifications = [];
        verificationData.filteredVerifications = [];
    }
}

async function getLatestVerifications(inventoryId) {
    try {
        const token = localStorage.getItem('jwt');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(`/api/v1/verifications/inventories/${inventoryId}/verifications/latest`, {
            method: 'GET',
            headers: headers
        });

        if (response.ok) {
            const verifications = await response.json();
            return Array.isArray(verifications) ? verifications : [];
        } else if (response.status === 404) {
            return [];
        } else {
            throw new Error('Error al obtener las verificaciones');
        }
    } catch (error) {
        console.error('Error getting latest verifications:', error);
        return [];
    }
}

async function getItemVerifications(itemId) {
    try {
        const token = localStorage.getItem('jwt');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(`/api/v1/verifications/item/${itemId}`, {
            method: 'GET',
            headers: headers
        });

        if (response.ok) {
            const verifications = await response.json();
            return verifications;
        } else if (response.status === 404) {
            throw new Error('Item no encontrado');
        } else {
            throw new Error('Error al obtener las verificaciones del item');
        }
    } catch (error) {
        if (error.message && error.message.includes('Failed to fetch')) {
            throw new Error('Error de conexión. Verifica tu conexión a internet.');
        }
        throw error;
    }
}

async function createVerificationBySerial(serialNumber) {
    try {
        const token = localStorage.getItem('jwt');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        // Note: The API endpoint seems incomplete in the documentation
        // Assuming it should be: POST /api/v1/verifications/by-serial
        const response = await fetch(`/api/v1/verifications/by-serial`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({ serialNumber: serialNumber })
        });

        if (response.ok) {
            const verification = await response.json();
            return verification;
        } else if (response.status === 404) {
            throw new Error('No se encontró un item con ese número de serie');
        } else if (response.status === 400) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Datos de verificación inválidos');
        } else {
            throw new Error('Error al crear la verificación');
        }
    } catch (error) {
        if (error.message && error.message.includes('Failed to fetch')) {
            throw new Error('Error de conexión. Verifica tu conexión a internet.');
        }
        throw error;
    }
}

async function createVerificationByPlate(licensePlate) {
    try {
        const token = localStorage.getItem('jwt');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(`/api/v1/verifications/by-licence-plate`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({ licencePlate: licensePlate })
        });

        if (response.ok) {
            const verification = await response.json();
            return verification;
        } else if (response.status === 404) {
            throw new Error('No se encontró un item con esa placa');
        } else if (response.status === 400) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Datos de verificación inválidos');
        } else {
            throw new Error('Error al crear la verificación');
        }
    } catch (error) {
        if (error.message && error.message.includes('Failed to fetch')) {
            throw new Error('Error de conexión. Verifica tu conexión a internet.');
        }
        throw error;
    }
}

async function uploadEvidence(verificationId, file) {
    try {
        const token = localStorage.getItem('jwt');
        const formData = new FormData();
        formData.append('file', file);

        const headers = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(`/api/v1/verifications/${verificationId}/evidence`, {
            method: 'POST',
            headers: headers,
            body: formData
        });

        if (response.ok) {
            const result = await response.json();
            return result;
        } else if (response.status === 404) {
            throw new Error('Verificación no encontrada');
        } else if (response.status === 400) {
            throw new Error('Archivo inválido o demasiado grande');
        } else {
            throw new Error('Error al subir la evidencia');
        }
    } catch (error) {
        if (error.message && error.message.includes('Failed to fetch')) {
            throw new Error('Error de conexión. Verifica tu conexión a internet.');
        }
        throw error;
    }
}

async function downloadEvidence(verificationId) {
    try {
        const token = localStorage.getItem('jwt');
        const headers = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(`/api/v1/verifications/${verificationId}/evidence`, {
            method: 'GET',
            headers: headers
        });

        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `evidencia_${verificationId}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            return true;
        } else if (response.status === 404) {
            throw new Error('Evidencia no encontrada');
        } else {
            throw new Error('Error al descargar la evidencia');
        }
    } catch (error) {
        if (error.message && error.message.includes('Failed to fetch')) {
            throw new Error('Error de conexión. Verifica tu conexión a internet.');
        }
        throw error;
    }
}

async function deleteEvidence(verificationId) {
    try {
        const token = localStorage.getItem('jwt');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(`/api/v1/verifications/${verificationId}/evidence`, {
            method: 'DELETE',
            headers: headers
        });

        if (response.ok) {
            return true;
        } else if (response.status === 404) {
            throw new Error('Evidencia no encontrada');
        } else {
            throw new Error('Error al eliminar la evidencia');
        }
    } catch (error) {
        if (error.message && error.message.includes('Failed to fetch')) {
            throw new Error('Error de conexión. Verifica tu conexión a internet.');
        }
        throw error;
    }
}

// Export functions
window.loadVerificationData = loadVerificationData;
window.loadCurrentUserInfo = loadCurrentUserInfo;
window.loadInventories = loadInventories;
window.loadLatestVerifications = loadLatestVerifications;
window.getLatestVerifications = getLatestVerifications;
window.getItemVerifications = getItemVerifications;
window.createVerificationBySerial = createVerificationBySerial;
window.createVerificationByPlate = createVerificationByPlate;
window.uploadEvidence = uploadEvidence;
window.downloadEvidence = downloadEvidence;
window.deleteEvidence = deleteEvidence;

