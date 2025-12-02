// Load verification data
async function loadVerificationData() {
    if (verificationData.isLoading) return;

    verificationData.isLoading = true;
    showLoadingState();

    try {
        await loadCurrentUserInfo();
        
        // Check if user is superadmin
        const isSuperAdmin = (window.currentUserRole && window.currentUserRole.toUpperCase() === 'SUPERADMIN') || 
                             (window.location.pathname && window.location.pathname.includes('/superadmin'));
        
        if (isSuperAdmin) {
            // Use backend pagination for superadmin
            verificationData.useBackendPagination = true;
            await loadInventories();
            await loadVerificationsFromBackend(0); // Load first page
        } else {
            // Use client-side pagination for other roles
            verificationData.useBackendPagination = false;
            await loadInventories();
            await loadLatestVerifications();
        }
        
        // Update filters first to show inventories, then update UI
        if (typeof updateFilters === 'function') {
            updateFilters();
        }
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

/**
 * Loads verifications from backend with pagination (for superadmin)
 * @param {number} page - Page number (0-indexed)
 */
async function loadVerificationsFromBackend(page = 0) {
    try {
        const filters = {};
        
        // Apply filters
        if (verificationData.selectedInventory && verificationData.selectedInventory !== 'all') {
            filters.inventoryId = parseInt(verificationData.selectedInventory);
        }
        if (verificationData.selectedInstitution && verificationData.selectedInstitution !== 'all') {
            filters.institutionId = parseInt(verificationData.selectedInstitution);
        }
        if (verificationData.selectedRegional && verificationData.selectedRegional !== 'all') {
            filters.regionalId = parseInt(verificationData.selectedRegional);
        }
        
        const response = await fetchAllVerifications(page, verificationData.itemsPerPage, filters);
        
        // Update verification data
        verificationData.verifications = Array.isArray(response.content) ? response.content : [];
        verificationData.totalElements = response.totalElements || 0;
        verificationData.totalPages = response.totalPages || 0;
        verificationData.currentPage = (response.number || 0) + 1; // Convert to 1-indexed
        
        // Apply client-side filters (status, search) if needed
        if (typeof filterVerifications === 'function') {
            filterVerifications();
        } else {
            verificationData.filteredVerifications = [...verificationData.verifications];
        }
        
        // Update UI
        if (typeof updateVerificationTable === 'function') {
            updateVerificationTable();
        }
        if (typeof updatePagination === 'function') {
            updatePagination();
        }
    } catch (error) {
        console.error('Error loading verifications from backend:', error);
        verificationData.verifications = [];
        verificationData.filteredVerifications = [];
        verificationData.totalElements = 0;
        verificationData.totalPages = 0;
        throw error;
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

        // Get current user info to determine role
        let endpoint = '/api/v1/inventory';
        let isPaginated = false;
        
        try {
            const userResponse = await fetch('/api/v1/users/me', {
                method: 'GET',
                headers: headers
            });
            
            if (userResponse.ok) {
                const userData = await userResponse.json();
                const currentRole = userData.role || '';
                
                // Determine endpoint based on role
                if (currentRole === 'ADMIN_INSTITUTION') {
                    // Use paginated endpoint for institution inventories
                    endpoint = '/api/v1/inventory/institutionAdminInventories?page=0&size=1000';
                    isPaginated = true;
                } else if (currentRole === 'ADMIN_REGIONAL') {
                    // Use paginated endpoint for regional inventories
                    endpoint = '/api/v1/inventory/regionalAdminInventories?page=0&size=1000';
                    isPaginated = true;
                } else if (currentRole === 'SUPERADMIN') {
                    // Use paginated endpoint for superadmin (all inventories)
                    endpoint = '/api/v1/inventory?page=0&size=1000';
                    isPaginated = true;
                }
            }
        } catch (userError) {
            console.error('Error checking user role:', userError);
            // Continue with default endpoint if user check fails
        }

        const response = await fetch(endpoint, {
            method: 'GET',
            headers: headers
        });

        if (response.ok) {
            let inventories;
            if (isPaginated) {
                // Handle paginated response
                const pageData = await response.json();
                inventories = pageData.content || [];
            } else {
                // Handle non-paginated response
                inventories = await response.json();
            }
            verificationData.inventories = Array.isArray(inventories) ? inventories : [];
        } else {
            console.error('Error loading inventories:', response.status, response.statusText);
            verificationData.inventories = [];
        }
    } catch (error) {
        console.error('Error loading inventories:', error);
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

        // Load verifications for all inventories
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

        // Sort verifications by ID descending (highest ID first)
        allVerifications.sort((a, b) => {
            const aId = a.id || 0;
            const bId = b.id || 0;
            return bId - aId; // Highest ID first
        });

        verificationData.verifications = allVerifications;
        // Apply filters after loading
        if (typeof filterVerifications === 'function') {
            filterVerifications();
        } else {
            verificationData.filteredVerifications = [...verificationData.verifications];
            verificationData.currentPage = 1; // Reset to first page
        }

        // Only show info toast if we actually tried to load but got no results
        if (verificationData.verifications.length === 0 && verificationData.inventories.length > 0) {
            // Don't show toast for empty results - it's normal if there are no verifications
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
            body: JSON.stringify({ licencePlateNumber: licensePlate })
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
            
            // Verificar que el blob tenga contenido
            if (blob.size === 0) {
                showErrorToast('Error', 'El archivo de evidencia está vacío');
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
                } else if (contentType.includes('application/msword') || contentType.includes('application/vnd.openxmlformats-officedocument.wordprocessingml')) {
                    extension = 'docx';
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
            
            showSuccessToast('Descarga iniciada', 'La evidencia se está descargando');
            return true;
        } else if (response.status === 404) {
            showErrorToast('Evidencia no encontrada', 'Esta verificación no tiene evidencia asociada');
            return false;
        } else {
            const errorText = await response.text().catch(() => '');
            console.error('Error downloading evidence:', response.status, errorText);
            showErrorToast('Error', `Error al descargar la evidencia (${response.status})`);
            return false;
        }
    } catch (error) {
        console.error('Error downloading evidence:', error);
        if (error.message && error.message.includes('Failed to fetch')) {
            showErrorToast('Error de conexión', 'Verifica tu conexión a internet');
        } else {
            showErrorToast('Error', error.message || 'Error al descargar la evidencia');
        }
        return false;
    }
}

/**
 * Fetches paginated verifications from backend (for superadmin)
 * @param {number} page - Page number (0-indexed)
 * @param {number} size - Page size
 * @param {Object} filters - Optional filters {regionalId, institutionId, inventoryId, status}
 * @returns {Promise<Object>} Page object with verifications
 */
async function fetchAllVerifications(page = 0, size = 6, filters = {}) {
    try {
        const token = localStorage.getItem('jwt');
        const headers = {
            'Content-Type': 'application/json',
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        // Build query parameters
        const params = new URLSearchParams({
            page: page.toString(),
            size: size.toString()
        });

        if (filters.regionalId) {
            params.append('regionalId', filters.regionalId.toString());
        }
        if (filters.institutionId) {
            params.append('institutionId', filters.institutionId.toString());
        }
        if (filters.inventoryId) {
            params.append('inventoryId', filters.inventoryId.toString());
        }

        const response = await fetch(`/api/v1/verifications?${params.toString()}`, {
            method: 'GET',
            headers: headers,
            credentials: 'same-origin' // Use same-origin instead of include
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        // Transform the response to match frontend expectations
        if (data.content && Array.isArray(data.content)) {
            data.content = data.content.map(v => ({
                id: v.id || v.verificationId,
                itemId: v.itemId,
                licensePlate: v.itemLicencePlateNumber || v.licencePlateNumber,
                itemName: v.itemName,
                inventoryId: v.inventoryId,
                inventoryName: v.inventoryName,
                status: v.status || 'PENDING',
                hasEvidence: v.photoUrl && v.photoUrl.length > 0,
                verificationDate: v.verifiedAt || v.createdAt,
                photoUrl: v.photoUrl || null,
                photoUrls: v.photoUrl ? [v.photoUrl] : [],
                userId: v.userId,
                userFullName: v.userFullName,
                userEmail: v.userEmail
            }));
        }
        
        return data;
    } catch (error) {
        console.error('Error fetching verifications:', error);
        throw error;
    }
}

// Export functions
window.loadVerificationData = loadVerificationData;
window.loadVerificationsFromBackend = loadVerificationsFromBackend;
window.loadCurrentUserInfo = loadCurrentUserInfo;
window.loadInventories = loadInventories;
window.loadLatestVerifications = loadLatestVerifications;
window.getLatestVerifications = getLatestVerifications;
window.getItemVerifications = getItemVerifications;
window.createVerificationBySerial = createVerificationBySerial;
window.createVerificationByPlate = createVerificationByPlate;
window.uploadEvidence = uploadEvidence;
window.downloadEvidence = downloadEvidence;
window.fetchAllVerifications = fetchAllVerifications;

