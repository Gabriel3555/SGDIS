// Cancellations API Functions

/**
 * Fetches all cancellations (for SUPERADMIN)
 * Note: This assumes there's a GET endpoint at /api/v1/cancellations
 * If it doesn't exist, you'll need to add it to the backend
 * @param {number} page - Page number (0-indexed)
 * @param {number} size - Page size
 * @returns {Promise<Object>} Page object with cancellations
 */
async function fetchAllCancellations(page = 0, size = 10) {
    try {
        const token = localStorage.getItem("jwt");
        const headers = {
            "Content-Type": "application/json",
        };
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }

        const response = await fetch(
            `/api/v1/cancellations?page=${page}&size=${size}`,
            {
                method: "GET",
                headers: headers,
            }
        );

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
        const contentDisposition = response.headers.get("content-disposition");
        let filename = `cancellation-${cancellationId}-format.pdf`;
        if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
            if (filenameMatch) {
                filename = filenameMatch[1];
            }
        }
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    } catch (error) {
        console.error("Error downloading format file:", error);
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
        const token = localStorage.getItem("jwt");
        const headers = {
            "Content-Type": "application/json",
        };
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }

        const response = await fetch(
            `/api/v1/cancellations/ask`,
            {
                method: "POST",
                headers: headers,
                body: JSON.stringify({
                    itemsId: itemsIds,
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
        const contentDisposition = response.headers.get("content-disposition");
        let filename = `cancellation-${cancellationId}-format-example.pdf`;
        if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
            if (filenameMatch) {
                filename = filenameMatch[1];
            }
        }
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    } catch (error) {
        console.error("Error downloading format example file:", error);
        throw error;
    }
}

