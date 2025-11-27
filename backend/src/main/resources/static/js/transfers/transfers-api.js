// Transfers API Functions

/**
 * Fetches transfers for a specific inventory
 * @param {number} inventoryId - The inventory ID
 * @returns {Promise<Array<TransferSummaryResponse>>}
 */
async function fetchTransfersByInventory(inventoryId) {
    try {
        const token = localStorage.getItem("jwt");
        const headers = {
            "Content-Type": "application/json",
        };
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }

        const response = await fetch(
            `/api/v1/transfers/inventory/${inventoryId}`,
            {
                method: "GET",
                headers: headers,
            }
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error fetching transfers by inventory:", error);
        throw error;
    }
}

/**
 * Fetches transfers for a specific item
 * @param {number} itemId - The item ID
 * @returns {Promise<Array<TransferSummaryResponse>>}
 */
async function fetchTransfersByItem(itemId) {
    try {
        const token = localStorage.getItem("jwt");
        const headers = {
            "Content-Type": "application/json",
        };
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }

        const response = await fetch(
            `/api/v1/transfers/item/${itemId}`,
            {
                method: "GET",
                headers: headers,
            }
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error fetching transfers by item:", error);
        throw error;
    }
}

/**
 * Requests a new transfer
 * @param {Object} transferData - Transfer request data
 * @param {number} transferData.itemId - Item ID to transfer
 * @param {number} transferData.destinationInventoryId - Destination inventory ID
 * @param {string} transferData.details - Optional details/notes
 * @returns {Promise<RequestTransferResponse>}
 */
async function requestTransfer(transferData) {
    try {
        const token = localStorage.getItem("jwt");
        const headers = {
            "Content-Type": "application/json",
        };
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }

        const response = await fetch("/api/v1/transfers/request", {
            method: "POST",
            headers: headers,
            body: JSON.stringify(transferData),
        });

        if (!response.ok) {
            let errorMessage = "Error al solicitar la transferencia";
            try {
                const contentType = response.headers.get("content-type");
                if (contentType && contentType.includes("application/json")) {
                    const errorData = await response.json();
                    errorMessage =
                        errorData.message ||
                        errorData.detail ||
                        errorData.error ||
                        errorMessage;
                } else {
                    const errorText = await response.text();
                    errorMessage = errorText || errorMessage;
                }
            } catch (parseError) {
                // Error al parsear respuesta
            }
            throw new Error(errorMessage);
        }

        return await response.json();
    } catch (error) {
        throw error;
    }
}

/**
 * Approves a transfer
 * @param {number} transferId - Transfer ID to approve
 * @param {Object} approvalData - Approval data
 * @param {string} approvalData.approvalNotes - Optional approval notes
 * @returns {Promise<ApproveTransferResponse>}
 */
async function approveTransfer(transferId, approvalData = {}) {
    try {
        const token = localStorage.getItem("jwt");
        const headers = {
            "Content-Type": "application/json",
        };
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }

        const response = await fetch(`/api/v1/transfers/${transferId}/approve`, {
            method: "POST",
            headers: headers,
            body: JSON.stringify(approvalData),
        });

        if (!response.ok) {
            let errorMessage = "Error al aprobar la transferencia";
            try {
                const contentType = response.headers.get("content-type");
                if (contentType && contentType.includes("application/json")) {
                    const errorData = await response.json();
                    errorMessage =
                        errorData.message ||
                        errorData.detail ||
                        errorData.error ||
                        errorMessage;
                } else {
                    const errorText = await response.text();
                    errorMessage = errorText || errorMessage;
                }
            } catch (parseError) {
                // Error al parsear respuesta
            }
            throw new Error(errorMessage);
        }

        return await response.json();
    } catch (error) {
        throw error;
    }
}

/**
 * Fetches all transfers with pagination (for superadmin)
 * @param {number} page - Page number (0-indexed)
 * @param {number} size - Page size
 * @returns {Promise<Object>} Page object with transfers
 */
async function fetchAllTransfers(page = 0, size = 6) {
    try {
        const token = localStorage.getItem("jwt");
        const headers = {
            "Content-Type": "application/json",
        };
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }

        const response = await fetch(
            `/api/v1/transfers?page=${page}&size=${size}`,
            {
                method: "GET",
                headers: headers,
            }
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error fetching all transfers:", error);
        throw error;
    }
}

/**
 * Fetches transfer statistics
 * @returns {Promise<Object>} Statistics object
 */
async function fetchTransferStatistics() {
    try {
        const token = localStorage.getItem("jwt");
        const headers = {
            "Content-Type": "application/json",
        };
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }

        const response = await fetch(
            `/api/v1/transfers/statistics`,
            {
                method: "GET",
                headers: headers,
            }
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error fetching transfer statistics:", error);
        throw error;
    }
}

// Export functions globally
window.fetchTransfersByInventory = fetchTransfersByInventory;
window.fetchTransfersByItem = fetchTransfersByItem;
window.requestTransfer = requestTransfer;
window.approveTransfer = approveTransfer;
window.fetchAllTransfers = fetchAllTransfers;
window.fetchTransferStatistics = fetchTransferStatistics;

