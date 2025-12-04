// User-specific verification API - Only loads user's own inventories
// Load verification data for USER role
async function loadVerificationData() {
    if (verificationData.isLoading) return;

    verificationData.isLoading = true;
    showLoadingState();

    try {
        await loadCurrentUserInfo();
        await loadUserInventories(); // Load only user's inventories
        await loadLatestVerifications();
        // Update filters first to show inventories, then update UI
        if (typeof updateFilters === 'function') {
            updateFilters();
        }
        // Wait for updateVerificationUI to be available
        let attempts = 0;
        while (typeof window.updateVerificationUI !== 'function' && attempts < 10) {
            await new Promise(resolve => setTimeout(resolve, 50));
            attempts++;
        }
        if (typeof window.updateVerificationUI === 'function') {
            window.updateVerificationUI();
        } else if (typeof updateVerificationUI === 'function') {
            updateVerificationUI();
        }

    } catch (error) {
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

        showInventoryErrorToast('Error al cargar datos', errorMessage);
        showErrorState(errorMessage);
        // Wait for updateVerificationUI to be available
        let attempts = 0;
        while (typeof window.updateVerificationUI !== 'function' && attempts < 10) {
            await new Promise(resolve => setTimeout(resolve, 50));
            attempts++;
        }
        if (typeof window.updateVerificationUI === 'function') {
            window.updateVerificationUI();
        } else if (typeof updateVerificationUI === 'function') {
            updateVerificationUI();
        }
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
            // Wait for updateUserInfoDisplay to be available
            let attempts = 0;
            while (typeof window.updateUserInfoDisplay !== 'function' && attempts < 10) {
                await new Promise(resolve => setTimeout(resolve, 50));
                attempts++;
            }
            if (typeof window.updateUserInfoDisplay === 'function') {
                window.updateUserInfoDisplay(userData);
            } else if (typeof updateUserInfoDisplay === 'function') {
                updateUserInfoDisplay(userData);
            } else {
                console.warn('updateUserInfoDisplay function not available yet');
            }
        } else {
            throw new Error('Failed to load user info');
        }
    } catch (error) {
        console.error('Error loading current user info:', error);
        const defaultUserData = {
            fullName: 'Usuario',
            role: 'USER',
            email: 'user@sena.edu.co'
        };
        // Wait for updateUserInfoDisplay to be available
        let attempts = 0;
        while (typeof window.updateUserInfoDisplay !== 'function' && attempts < 10) {
            await new Promise(resolve => setTimeout(resolve, 50));
            attempts++;
        }
        if (typeof window.updateUserInfoDisplay === 'function') {
            window.updateUserInfoDisplay(defaultUserData);
        } else if (typeof updateUserInfoDisplay === 'function') {
            updateUserInfoDisplay(defaultUserData);
        }
    }
}

// Load only user's inventories (owner, managed, signatory)
async function loadUserInventories() {
    try {
        const token = localStorage.getItem('jwt');
        if (!token) {
            throw new Error('No authentication token found');
        }

        const headers = { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };

        // Load all three types of inventories in parallel
        const [ownedResponse, managedResponse, signatoryResponse] = await Promise.all([
            fetch('/api/v1/users/me/inventories/owner', {
                method: 'GET',
                headers: headers
            }),
            fetch('/api/v1/users/me/inventories', {
                method: 'GET',
                headers: headers
            }),
            fetch('/api/v1/users/me/inventories/signatory', {
                method: 'GET',
                headers: headers
            })
        ]);

        if (ownedResponse.status === 401 || managedResponse.status === 401 || signatoryResponse.status === 401) {
            localStorage.removeItem('jwt');
            window.location.href = '/';
            return;
        }

        const ownedInventories = ownedResponse.ok ? await ownedResponse.json() : [];
        const managedInventories = managedResponse.ok ? await managedResponse.json() : [];
        const signatoryInventories = signatoryResponse.ok ? await signatoryResponse.json() : [];

        // Combine all inventories and remove duplicates by ID
        const allInventoriesMap = new Map();
        
        [...ownedInventories, ...managedInventories, ...signatoryInventories].forEach(inv => {
            if (inv && inv.id) {
                allInventoriesMap.set(inv.id, inv);
            }
        });

        verificationData.inventories = Array.from(allInventoriesMap.values());
        
        if (verificationData.inventories.length === 0) {
            showInventoryWarningToast('Sin inventarios', 'No tienes inventarios asignados. No podrás realizar verificaciones hasta que te asignen un inventario.');
        }
    } catch (error) {
        showInventoryErrorToast('Error al cargar inventarios', 'No se pudieron cargar tus inventarios. Intenta recargar la página.');
        verificationData.inventories = [];
    }
}

async function loadLatestVerifications() {
    try {
        // Check if we have inventories
        if (!verificationData.inventories || verificationData.inventories.length === 0) {
            verificationData.verifications = [];
            verificationData.filteredVerifications = [];
            return;
        }

        // Load verifications for all user inventories
        const allVerifications = [];
        
        for (const inventory of verificationData.inventories) {
            if (!inventory || !inventory.id) {
                continue; // Skip invalid inventories
            }
            
            const verifications = await getLatestVerifications(inventory.id);
            if (verifications && verifications.length > 0) {
                allVerifications.push(...verifications);
            }
        }

        // Sort verifications by date (most recent first)
        allVerifications.sort((a, b) => {
            const dateA = new Date(a.verificationDate || 0);
            const dateB = new Date(b.verificationDate || 0);
            return dateB - dateA; // Most recent first
        });

        verificationData.verifications = allVerifications;
        // Apply filters after loading
        if (typeof filterVerifications === 'function') {
            filterVerifications();
        } else {
            verificationData.filteredVerifications = [...verificationData.verifications];
            verificationData.currentPage = 1; // Reset to first page
        }
        
        // Ensure UI is updated after loading
        if (typeof window.updateVerificationUI === 'function') {
            window.updateVerificationUI();
        } else if (typeof updateVerificationUI === 'function') {
            updateVerificationUI();
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
        if (!token) {
            console.warn('No authentication token found for getting verifications');
            return [];
        }

        const headers = { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };

        const response = await fetch(`/api/v1/verifications/inventories/${inventoryId}/verifications/latest`, {
            credentials: 'include',
            method: 'GET',
            headers: headers,
            credentials: 'same-origin'
        });

        if (response.ok) {
            const verifications = await response.json();
            // Transform the response to match frontend expectations
            const transformedVerifications = Array.isArray(verifications) 
                ? verifications.map(v => ({
                    id: v.id || v.verificationId,
                    itemId: v.itemId,
                    licensePlate: v.itemLicencePlateNumber,
                    itemName: v.itemName,
                    inventoryId: v.inventoryId,
                    inventoryName: v.inventoryName,
                    status: v.status || 'PENDING',
                    hasEvidence: v.photoUrl && v.photoUrl.length > 0,
                    verificationDate: v.verifiedAt,
                    photoUrl: v.photoUrl || null,
                    photoUrls: v.photoUrl ? [v.photoUrl] : [], // Keep for compatibility
                    userId: v.userId,
                    userFullName: v.userFullName,
                    userEmail: v.userEmail
                }))
                : [];
            return transformedVerifications;
        } else if (response.status === 404) {
            // Inventory not found or no verifications - return empty array
            return [];
        } else if (response.status === 401 || response.status === 403) {
            // Authentication/Authorization error - log but don't throw
            console.warn(`Authentication/Authorization error for inventory ${inventoryId}: ${response.status}`);
            return [];
        } else {
            // Other error - log but return empty array to continue processing
            console.warn(`Error getting verifications for inventory ${inventoryId}: ${response.status}`);
            return [];
        }
    } catch (error) {
        // Network errors, CORS errors, etc. - log but return empty array
        console.warn(`Error getting latest verifications for inventory ${inventoryId}:`, error.message || error);
        return [];
    }
}

// Get item by serial number (for display purposes only)
// Note: We don't validate inventory ownership here because ItemDTO doesn't include inventoryId
// The backend will validate authorization when creating the verification
async function getItemBySerial(serialNumber) {
    try {
        const token = localStorage.getItem('jwt');
        if (!token) {
            throw new Error('No authentication token found');
        }

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };

        const response = await fetch(`/api/v1/items/serial/${encodeURIComponent(serialNumber)}`, {
            method: 'GET',
            headers: headers
        });

        if (response.ok) {
            const item = await response.json();
            return item;
        } else if (response.status === 404) {
            throw new Error('No se encontró un ítem con ese número de serie');
        } else {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Error al obtener el ítem');
        }
    } catch (error) {
        if (error.message && error.message.includes('Failed to fetch')) {
            throw new Error('Error de conexión. Verifica tu conexión a internet.');
        }
        throw error;
    }
}

// Get item by licence plate (for display purposes only)
// Note: We don't validate inventory ownership here because ItemDTO doesn't include inventoryId
// The backend will validate authorization when creating the verification
async function getItemByLicencePlate(licencePlateNumber) {
    try {
        const token = localStorage.getItem('jwt');
        if (!token) {
            throw new Error('No authentication token found');
        }

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };

        const response = await fetch(`/api/v1/items/licence-plate/${encodeURIComponent(licencePlateNumber)}`, {
            method: 'GET',
            headers: headers
        });

        if (response.ok) {
            const item = await response.json();
            return item;
        } else if (response.status === 404) {
            throw new Error('No se encontró un ítem con esa placa');
        } else {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Error al obtener el ítem');
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

        const response = await fetch(`/api/v1/verifications/by-serial`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({ serial: serialNumber })
        });

        if (response.ok) {
            const verification = await response.json();
            showInventorySuccessToast('Verificación creada', 'La verificación se creó exitosamente por número de serie');
            return verification;
        } else if (response.status === 404) {
            showInventoryErrorToast('Item no encontrado', 'No se encontró un item con ese número de serie en el sistema');
            throw new Error('No se encontró un item con ese número de serie');
        } else if (response.status === 403) {
            const errorData = await response.json().catch(() => ({}));
            // Backend validates authorization - if 403, item doesn't belong to user's inventories
            const errorMsg = 'Ese item no está en mi inventario. Solo puedes verificar items de los cuales eres owner, manager o signatory.';
            showInventoryErrorToast('Item no está en tu inventario', errorMsg);
            throw new Error(errorMsg);
        } else if (response.status === 400) {
            const errorData = await response.json().catch(() => ({}));
            showInventoryErrorToast('Datos inválidos', errorData.message || 'Los datos de verificación son inválidos. Verifica la información.');
            throw new Error(errorData.message || 'Datos de verificación inválidos');
        } else {
            const errorData = await response.json().catch(() => ({}));
            showInventoryErrorToast('Error al crear verificación', errorData.message || 'No se pudo crear la verificación. Intenta nuevamente.');
            throw new Error(errorData.message || 'Error al crear la verificación');
        }
    } catch (error) {
        if (error.message && error.message.includes('Failed to fetch')) {
            showInventoryErrorToast('Error de conexión', 'Verifica tu conexión a internet e intenta nuevamente.');
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
            body: JSON.stringify({ licencePlateNumber: licensePlate })
        });

        if (response.ok) {
            const verification = await response.json();
            showInventorySuccessToast('Verificación creada', 'La verificación se creó exitosamente por placa');
            return verification;
        } else if (response.status === 404) {
            showInventoryErrorToast('Item no encontrado', 'No se encontró un item con esa placa en el sistema');
            throw new Error('No se encontró un item con esa placa');
        } else if (response.status === 403) {
            const errorData = await response.json().catch(() => ({}));
            // Backend validates authorization - if 403, item doesn't belong to user's inventories
            const errorMsg = 'Ese item no está en mi inventario. Solo puedes verificar items de los cuales eres owner, manager o signatory.';
            showInventoryErrorToast('Item no está en tu inventario', errorMsg);
            throw new Error(errorMsg);
        } else if (response.status === 400) {
            const errorData = await response.json().catch(() => ({}));
            showInventoryErrorToast('Datos inválidos', errorData.message || 'Los datos de verificación son inválidos. Verifica la información.');
            throw new Error(errorData.message || 'Datos de verificación inválidos');
        } else {
            const errorData = await response.json().catch(() => ({}));
            showInventoryErrorToast('Error al crear verificación', errorData.message || 'No se pudo crear la verificación. Intenta nuevamente.');
            throw new Error(errorData.message || 'Error al crear la verificación');
        }
    } catch (error) {
        if (error.message && error.message.includes('Failed to fetch')) {
            showInventoryErrorToast('Error de conexión', 'Verifica tu conexión a internet e intenta nuevamente.');
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
            showInventorySuccessToast('Evidencia subida', 'La evidencia se subió correctamente');
            return result;
        } else if (response.status === 404) {
            showInventoryErrorToast('Verificación no encontrada', 'La verificación especificada no existe');
            throw new Error('Verificación no encontrada');
        } else if (response.status === 400) {
            showInventoryErrorToast('Archivo inválido', 'El archivo es inválido o demasiado grande. Máximo 5MB');
            throw new Error('Archivo inválido o demasiado grande');
        } else {
            showInventoryErrorToast('Error al subir evidencia', 'No se pudo subir la evidencia. Intenta nuevamente.');
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
            
            // Verificar que el blob tenga contenido
            if (blob.size === 0) {
                showInventoryErrorToast('Error', 'El archivo de evidencia está vacío');
                return false;
            }

            // Obtener el nombre del archivo del header Content-Disposition o determinar por tipo
            let filename = `evidencia_${verificationId}`;
            const contentDisposition = response.headers.get('Content-Disposition');
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
                if (filenameMatch && filenameMatch[1]) {
                    filename = filenameMatch[1].replace(/['"]/g, '');
                }
            } else {
                // Determinar extensión por Content-Type
                const contentType = response.headers.get('Content-Type') || '';
                let extension = 'pdf';
                if (contentType.includes('image/jpeg') || contentType.includes('image/jpg')) {
                    extension = 'jpg';
                } else if (contentType.includes('image/png')) {
                    extension = 'png';
                } else if (contentType.includes('image/')) {
                    extension = contentType.split('/')[1].split(';')[0];
                } else if (contentType.includes('application/pdf')) {
                    extension = 'pdf';
                }
                filename = `evidencia_${verificationId}.${extension}`;
            }

            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            
            // Limpiar después de un breve delay
            setTimeout(() => {
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            }, 100);
            
            showInventorySuccessToast('Descarga iniciada', 'La evidencia se está descargando');
            return true;
        } else if (response.status === 404) {
            showInventoryErrorToast('Evidencia no encontrada', 'Esta verificación no tiene evidencia asociada');
            return false;
        } else {
            const errorText = await response.text().catch(() => '');
            console.error('Error downloading evidence:', response.status, errorText);
            showInventoryErrorToast('Error', `Error al descargar la evidencia (${response.status})`);
            return false;
        }
    } catch (error) {
        console.error('Error downloading evidence:', error);
        if (error.message && error.message.includes('Failed to fetch')) {
            showInventoryErrorToast('Error de conexión', 'Verifica tu conexión a internet');
        } else {
            showInventoryErrorToast('Error', error.message || 'Error al descargar la evidencia');
        }
        return false;
    }
}

// Export functions
window.loadVerificationData = loadVerificationData;
window.loadCurrentUserInfo = loadCurrentUserInfo;
window.loadUserInventories = loadUserInventories;
window.loadLatestVerifications = loadLatestVerifications;
window.getLatestVerifications = getLatestVerifications;
window.getItemBySerial = getItemBySerial;
window.getItemByLicencePlate = getItemByLicencePlate;
window.createVerificationBySerial = createVerificationBySerial;
window.createVerificationByPlate = createVerificationByPlate;
window.uploadEvidence = uploadEvidence;
window.downloadEvidence = downloadEvidence;

