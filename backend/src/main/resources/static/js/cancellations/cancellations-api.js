// Cancellations API Functions

/**
 * Fetches all cancellations (for SUPERADMIN) or by institution (for WAREHOUSE)
 * @param {number} page - Page number (0-indexed)
 * @param {number} size - Page size
 * @param {string} userRole - User role (SUPERADMIN or WAREHOUSE)
 * @returns {Promise<Object>} Page object with cancellations
 */
async function fetchAllCancellations(page = 0, size = 6, userRole = 'SUPERADMIN') {
    try {
        const token = localStorage.getItem("jwt");
        const headers = {
            "Content-Type": "application/json",
        };
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }

        // Use different endpoint for warehouse
        const endpoint = (userRole === 'WAREHOUSE' || userRole === 'warehouse') 
            ? `/api/v1/cancellations/my-institution?page=${page}&size=${size}`
            : `/api/v1/cancellations?page=${page}&size=${size}`;

        const response = await fetch(endpoint, {
            method: "GET",
            headers: headers,
        });

        if (!response.ok) {
            if (response.status === 404 || response.status === 500) {
                // Endpoint might not exist yet or error, return empty page
                console.warn(`Failed to fetch cancellations: ${response.status}`);
                return {
                    content: [],
                    totalElements: 0,
                    totalPages: 0,
                    number: page,
                    size: size
                };
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error fetching cancellations:", error);
        // Return empty page on error
        return {
            content: [],
            totalElements: 0,
            totalPages: 0,
            number: page,
            size: size
        };
    }
}

/**
 * Fetches cancellation statistics (for SUPERADMIN) or by institution (for WAREHOUSE)
 * @param {string} userRole - User role (SUPERADMIN or WAREHOUSE)
 * @returns {Promise<Object>} Statistics object
 */
async function fetchCancellationStatistics(userRole = 'SUPERADMIN') {
    try {
        const token = localStorage.getItem("jwt");
        const headers = {
            "Content-Type": "application/json",
        };
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }

        // Use different endpoint for warehouse
        const endpoint = (userRole === 'WAREHOUSE' || userRole === 'warehouse') 
            ? `/api/v1/cancellations/my-institution/statistics`
            : null; // Superadmin calculates stats from all cancellations

        if (endpoint) {
            const response = await fetch(endpoint, {
                method: "GET",
                headers: headers,
            });

            if (!response.ok) {
                if (response.status === 404 || response.status === 500) {
                    console.warn(`Failed to fetch cancellation statistics: ${response.status}`);
                    return {
                        totalCancellations: 0,
                        pendingCancellations: 0,
                        approvedCancellations: 0,
                        rejectedCancellations: 0
                    };
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } else {
            // For superadmin, calculate from all cancellations
            return null; // Will be calculated from cancellationsData.cancellations
        }
    } catch (error) {
        console.error("Error fetching cancellation statistics:", error);
        return {
            totalCancellations: 0,
            pendingCancellations: 0,
            approvedCancellations: 0,
            rejectedCancellations: 0
        };
    }
}

/**
 * Accepts a cancellation request
 * @param {number} cancellationId - Cancellation ID
 * @param {string} comment - Comment for acceptance
 * @returns {Promise<Object>} Response object
 */
async function acceptCancellation(cancellationId, comment) {
    try {
        const token = localStorage.getItem("jwt");
        const headers = {
            "Content-Type": "application/json",
        };
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }

        const response = await fetch(
            `/api/v1/cancellations/${cancellationId}/accept`,
            {
                method: "POST",
                headers: headers,
                body: JSON.stringify({
                    cancellationId: cancellationId,
                    comment: comment
                }),
            }
        );

        if (!response.ok) {
            let errorMessage = "Error al aprobar la cancelación";
            try {
                const contentType = response.headers.get("content-type");
                if (contentType && contentType.includes("application/json")) {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorMessage;
                } else {
                    const errorText = await response.text();
                    errorMessage = errorText || errorMessage;
                }
            } catch (e) {
                console.error("Error parsing error response:", e);
            }
            throw new Error(errorMessage);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error accepting cancellation:", error);
        throw error;
    }
}

/**
 * Refuses a cancellation request
 * @param {number} cancellationId - Cancellation ID
 * @param {string} comment - Comment for refusal
 * @returns {Promise<Object>} Response object
 */
async function refuseCancellation(cancellationId, comment) {
    try {
        const token = localStorage.getItem("jwt");
        const headers = {
            "Content-Type": "application/json",
        };
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }

        const response = await fetch(
            `/api/v1/cancellations/${cancellationId}/refuse`,
            {
                method: "POST",
                headers: headers,
                body: JSON.stringify({
                    cancellationId: cancellationId,
                    comment: comment
                }),
            }
        );

        if (!response.ok) {
            let errorMessage = "Error al rechazar la cancelación";
            try {
                const contentType = response.headers.get("content-type");
                if (contentType && contentType.includes("application/json")) {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorMessage;
                } else {
                    const errorText = await response.text();
                    errorMessage = errorText || errorMessage;
                }
            } catch (e) {
                console.error("Error parsing error response:", e);
            }
            throw new Error(errorMessage);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error refusing cancellation:", error);
        throw error;
    }
}

/**
 * Downloads the format file for a cancellation
 * @param {number} cancellationId - Cancellation ID
 */
async function downloadCancellationFormat(cancellationId) {
    try {
        const token = localStorage.getItem("jwt");
        const headers = {};
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }

        const response = await fetch(
            `/api/v1/cancellations/${cancellationId}/download-format`,
            {
                method: "GET",
                headers: headers,
            }
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        
        // Mejorar el parsing del Content-Disposition header
        const contentDisposition = response.headers.get("content-disposition");
        let filename = `cancellation-${cancellationId}-format.pdf`;
        
        if (contentDisposition) {
            // Intentar extraer el nombre del archivo del header
            // Formato: attachment; filename="nombre_archivo.pdf" o attachment; filename*=UTF-8''nombre_archivo.pdf
            const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
            const matches = contentDisposition.match(filenameRegex);
            
            if (matches && matches[1]) {
                // Remover comillas si existen
                filename = matches[1].replace(/['"]/g, '');
                
                // Manejar formato RFC 5987 (filename*=UTF-8''nombre)
                if (filename.startsWith("UTF-8''")) {
                    filename = decodeURIComponent(filename.substring(7));
                }
                
                // Limpiar el nombre del archivo de caracteres problemáticos
                filename = filename.trim();
                
                // Si el nombre no tiene extensión, agregar .pdf por defecto
                if (!filename.includes('.')) {
                    filename += '.pdf';
                }
            }
        }
        
        // Asegurar que el nombre del archivo sea válido
        filename = filename.replace(/[<>:"/\\|?*]/g, '_'); // Reemplazar caracteres inválidos
        filename = filename.replace(/\s+/g, '_'); // Reemplazar espacios con guiones bajos
        
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        if (typeof showInventorySuccessToast === 'function') {
            showInventorySuccessToast('Descarga iniciada', `El archivo ${filename} se está descargando`);
        }
    } catch (error) {
        console.error("Error downloading format file:", error);
        if (typeof showInventoryErrorToast === 'function') {
            showInventoryErrorToast('Error al descargar', 'No se pudo descargar el archivo. Por favor, intente nuevamente.');
        }
        throw error;
    }
}

/**
 * Asks for cancellation of items
 * @param {Array<number>} itemsIds - Array of item IDs to cancel
 * @param {string} reason - Reason for cancellation
 * @returns {Promise<Object>} Response object
 */
async function askForCancellation(itemsIds, reason) {
    try {
        // Intentar refrescar el token si está expirado
        if (typeof refreshJWTToken === 'function') {
            try {
                await refreshJWTToken(false);
            } catch (refreshError) {
                console.warn("Error al refrescar token:", refreshError);
            }
        }
        
        const token = localStorage.getItem("jwt");
        if (!token || token === "undefined" || token === "null" || token.trim() === "") {
            throw new Error("No estás autenticado. Por favor, inicia sesión nuevamente.");
        }
        
        const headers = {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        };

        // Ensure all item IDs are numbers, not strings
        const numericItemsIds = itemsIds.map(id => {
            if (typeof id === 'string') {
                const parsed = parseInt(id, 10);
                if (isNaN(parsed)) {
                    throw new Error(`ID de item inválido: ${id}`);
                }
                return parsed;
            } else if (typeof id === 'number') {
                return id;
            } else {
                throw new Error(`Tipo de ID no soportado: ${typeof id}`);
            }
        });

        const response = await fetch(
            `/api/v1/cancellations/ask`,
            {
                method: "POST",
                headers: headers,
                body: JSON.stringify({
                    itemsId: numericItemsIds,
                    reason: reason
                }),
            }
        );

        if (!response.ok) {
            let errorMessage = "Error al solicitar la cancelación";
            try {
                const contentType = response.headers.get("content-type");
                if (contentType && contentType.includes("application/json")) {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorData.detail || errorData.error || errorMessage;
                    
                    // Si es error 401, intentar refrescar el token y reintentar una vez
                    if (response.status === 401 && typeof refreshJWTToken === 'function') {
                        try {
                            const refreshed = await refreshJWTToken(true);
                            if (refreshed) {
                                // Reintentar la petición con el nuevo token
                                const newToken = localStorage.getItem("jwt");
                                if (newToken && newToken !== "undefined" && newToken !== "null" && newToken.trim() !== "") {
                                    headers["Authorization"] = `Bearer ${newToken}`;
                                    const retryResponse = await fetch(
                                        `/api/v1/cancellations/ask`,
                                        {
                                            method: "POST",
                                            headers: headers,
                                            body: JSON.stringify({
                                                itemsId: numericItemsIds,
                                                reason: reason
                                            }),
                                        }
                                    );
                                    
                                    if (retryResponse.ok) {
                                        const retryData = await retryResponse.json();
                                        return retryData;
                                    }
                                }
                            }
                        } catch (refreshError) {
                            console.error("Error al refrescar token:", refreshError);
                        }
                    }
                    
                    // Check for authentication errors
                    if (response.status === 401 || errorMessage.includes("no autenticado") || errorMessage.includes("anonymousUser")) {
                        errorMessage = "No estás autenticado. Por favor, inicia sesión nuevamente.";
                        // Optionally clear invalid token
                        localStorage.removeItem('jwt');
                    }
                } else {
                    const errorText = await response.text();
                    errorMessage = errorText || errorMessage;
                }
            } catch (e) {
                console.error("Error parsing error response:", e);
            }
            
            // Handle specific status codes
            if (response.status === 401) {
                errorMessage = "No estás autenticado. Por favor, inicia sesión nuevamente.";
                localStorage.removeItem('jwt');
            } else if (response.status === 403) {
                errorMessage = "No tienes permisos para realizar esta acción.";
            }
            
            throw new Error(errorMessage);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error asking for cancellation:", error);
        throw error;
    }
}

/**
 * Downloads the format example file for a cancellation
 * @param {number} cancellationId - Cancellation ID
 */
async function downloadCancellationFormatExample(cancellationId) {
    try {
        const token = localStorage.getItem("jwt");
        const headers = {};
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }

        const response = await fetch(
            `/api/v1/cancellations/${cancellationId}/download-format-example`,
            {
                method: "GET",
                headers: headers,
            }
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        
        // Mejorar el parsing del Content-Disposition header
        const contentDisposition = response.headers.get("content-disposition");
        let filename = `cancellation-${cancellationId}-format-example.pdf`;
        
        if (contentDisposition) {
            // Intentar extraer el nombre del archivo del header
            // Formato: attachment; filename="nombre_archivo.pdf" o attachment; filename*=UTF-8''nombre_archivo.pdf
            const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
            const matches = contentDisposition.match(filenameRegex);
            
            if (matches && matches[1]) {
                // Remover comillas si existen
                filename = matches[1].replace(/['"]/g, '');
                
                // Manejar formato RFC 5987 (filename*=UTF-8''nombre)
                if (filename.startsWith("UTF-8''")) {
                    filename = decodeURIComponent(filename.substring(7));
                }
                
                // Limpiar el nombre del archivo de caracteres problemáticos
                filename = filename.trim();
                
                // Si el nombre no tiene extensión, agregar .pdf por defecto
                if (!filename.includes('.')) {
                    filename += '.pdf';
                }
            }
        }
        
        // Asegurar que el nombre del archivo sea válido
        filename = filename.replace(/[<>:"/\\|?*]/g, '_'); // Reemplazar caracteres inválidos
        filename = filename.replace(/\s+/g, '_'); // Reemplazar espacios con guiones bajos
        
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        if (typeof showInventorySuccessToast === 'function') {
            showInventorySuccessToast('Descarga iniciada', `El archivo ${filename} se está descargando`);
        }
    } catch (error) {
        console.error("Error downloading format example file:", error);
        if (typeof showInventoryErrorToast === 'function') {
            showInventoryErrorToast('Error al descargar', 'No se pudo descargar el archivo. Por favor, intente nuevamente.');
        }
        throw error;
    }
}

/**
 * Uploads a format file for a cancellation (GIL-F-011 - FORMATO CONCEPTO TÉCNICO DE BIENES)
 * @param {number} cancellationId - Cancellation ID
 * @param {File} file - File to upload
 * @returns {Promise<string>} Success message
 */
async function uploadCancellationFormat(cancellationId, file) {
    try {
        const token = localStorage.getItem("jwt");
        if (!token) {
            throw new Error("No authentication token found");
        }

        if (!file) {
            throw new Error("No file selected");
        }

        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch(
            `/api/v1/cancellations/${cancellationId}/upload-format`,
            {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`
                },
                body: formData,
            }
        );

        if (!response.ok) {
            let errorMessage = "Error al subir el archivo";
            try {
                const contentType = response.headers.get("content-type");
                if (contentType && contentType.includes("application/json")) {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorData.detail || errorMessage;
                } else {
                    const errorText = await response.text();
                    errorMessage = errorText || errorMessage;
                }
            } catch (e) {
                console.error("Error parsing error response:", e);
            }
            throw new Error(errorMessage);
        }

        const message = await response.text();
        return message || "Formato subido correctamente";
    } catch (error) {
        console.error("Error uploading format file:", error);
        throw error;
    }
}

/**
 * Downloads the GIL-F-011 format template
 * @returns {Promise<void>}
 */
async function downloadFormatTemplate() {
    try {
        const token = localStorage.getItem("jwt");
        const headers = {};
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }

        const response = await fetch(
            `/api/v1/cancellations/download-format-template`,
            {
                method: "GET",
                headers: headers,
            }
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        
        // Mejorar el parsing del Content-Disposition header
        const contentDisposition = response.headers.get("content-disposition");
        let filename = "GIL-F-011FormatoConceptoTecnicodeBienes.xlsx";
        
        if (contentDisposition) {
            // Intentar extraer el nombre del archivo del header
            const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
            const matches = contentDisposition.match(filenameRegex);
            
            if (matches && matches[1]) {
                // Remover comillas si existen
                filename = matches[1].replace(/['"]/g, '');
                
                // Manejar formato RFC 5987 (filename*=UTF-8''nombre)
                if (filename.startsWith("UTF-8''")) {
                    filename = decodeURIComponent(filename.substring(7));
                }
                
                // Limpiar el nombre del archivo de caracteres problemáticos
                filename = filename.trim();
                
                // Si el nombre no tiene extensión, agregar .xlsx por defecto
                if (!filename.includes('.')) {
                    filename += '.xlsx';
                }
            }
        }
        
        // Asegurar que el nombre del archivo sea válido
        filename = filename.replace(/[<>:"/\\|?*]/g, '_'); // Reemplazar caracteres inválidos
        filename = filename.replace(/\s+/g, '_'); // Reemplazar espacios con guiones bajos
        
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        if (typeof showInventorySuccessToast === 'function') {
            showInventorySuccessToast('Descarga iniciada', `El formato GIL-F-011 se está descargando`);
        }
    } catch (error) {
        console.error("Error downloading format template:", error);
        if (typeof showInventoryErrorToast === 'function') {
            showInventoryErrorToast('Error al descargar', 'No se pudo descargar el formato. Por favor, intente nuevamente.');
        }
        throw error;
    }
}

// Export function to global scope
window.downloadFormatTemplate = downloadFormatTemplate;

/**
 * Uploads a format example file for a cancellation
 * @param {number} cancellationId - Cancellation ID
 * @param {File} file - File to upload
 * @returns {Promise<string>} Success message
 */
async function uploadCancellationFormatExample(cancellationId, file) {
    try {
        const token = localStorage.getItem("jwt");
        if (!token) {
            throw new Error("No authentication token found");
        }

        if (!file) {
            throw new Error("No file selected");
        }

        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch(
            `/api/v1/cancellations/${cancellationId}/upload-format-example`,
            {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`
                },
                body: formData,
            }
        );

        if (!response.ok) {
            let errorMessage = "Error al subir el archivo";
            try {
                const contentType = response.headers.get("content-type");
                if (contentType && contentType.includes("application/json")) {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorData.detail || errorMessage;
                } else {
                    const errorText = await response.text();
                    errorMessage = errorText || errorMessage;
                }
            } catch (e) {
                console.error("Error parsing error response:", e);
            }
            throw new Error(errorMessage);
        }

        const message = await response.text();
        return message || "Formato subido correctamente";
    } catch (error) {
        console.error("Error uploading format example file:", error);
        throw error;
    }
}

