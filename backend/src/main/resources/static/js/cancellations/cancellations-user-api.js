// Cancellations User API Functions - Only for USER role

/**
 * Fetches cancellations for inventories where the current user is owner, signatory, or manager
 * @param {number} page - Page number (0-indexed)
 * @param {number} size - Page size
 * @returns {Promise<Object>} Page object with cancellations
 */
async function fetchUserCancellations(page = 0, size = 6) {
    try {
        const token = localStorage.getItem("jwt");
        const headers = {
            "Content-Type": "application/json",
        };
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }

        // Get user's inventories (owner, signatory, manager)
        const [ownedResponse, signatoryResponse, managedResponse] = await Promise.all([
            fetch('/api/v1/users/me/inventories/owner', {
                method: 'GET',
                headers: headers
            }),
            fetch('/api/v1/users/me/inventories/signatory', {
                method: 'GET',
                headers: headers
            }),
            fetch('/api/v1/users/me/inventories', {
                method: 'GET',
                headers: headers
            })
        ]);

        if (ownedResponse.status === 401 || signatoryResponse.status === 401 || managedResponse.status === 401) {
            localStorage.removeItem('jwt');
            window.location.href = '/';
            return {
                content: [],
                totalElements: 0,
                totalPages: 0,
                number: page,
                size: size
            };
        }

        const ownedInventories = ownedResponse.ok ? await ownedResponse.json() : [];
        const signatoryInventories = signatoryResponse.ok ? await signatoryResponse.json() : [];
        const managedInventories = managedResponse.ok ? await managedResponse.json() : [];

        // Use the new endpoint that returns cancellations from user's inventories
        const response = await fetch(`/api/v1/cancellations/my-inventories?page=${page}&size=${size}`, {
            method: "GET",
            headers: headers,
        });

        if (!response.ok) {
            if (response.status === 404 || response.status === 403) {
                // User doesn't have permission or endpoint doesn't exist
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

        const pageData = await response.json();
        return pageData;
    } catch (error) {
        console.error("Error fetching user cancellations:", error);
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
 * Fetches cancellation statistics for inventories where the current user is owner, signatory, or manager
 * @returns {Promise<Object>} Statistics object
 */
async function fetchUserCancellationStatistics() {
    try {
        const token = localStorage.getItem("jwt");
        const headers = {
            "Content-Type": "application/json",
        };
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }

        // Use the user-specific endpoint to get cancellations from user's inventories
        // This endpoint already filters by user's inventories automatically
        let allCancellations = [];
        let currentPage = 0;
        let hasMore = true;
        
        while (hasMore && currentPage < 50) {
            const response = await fetch(`/api/v1/cancellations/my-inventories?page=${currentPage}&size=100`, {
                method: "GET",
                headers: headers,
            });

            if (!response.ok) {
                if (response.status === 404 || response.status === 403) {
                    // If endpoint doesn't exist or user doesn't have permission, return empty stats
                    break;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const pageData = await response.json();
            
            if (pageData.content && pageData.content.length > 0) {
                allCancellations = allCancellations.concat(pageData.content);
                hasMore = !pageData.last && pageData.content.length === 100;
                currentPage++;
            } else {
                hasMore = false;
            }
        }

        // Remove duplicates
        const uniqueCancellations = [];
        const seenIds = new Set();
        allCancellations.forEach(c => {
            if (c.id && !seenIds.has(c.id)) {
                seenIds.add(c.id);
                uniqueCancellations.push(c);
            }
        });

        // Calculate statistics
        const total = uniqueCancellations.length;
        const pending = uniqueCancellations.filter(c => 
            c.approved === null || (!c.approved && !c.refusedAt)
        ).length;
        const approved = uniqueCancellations.filter(c => 
            c.approved === true && !c.refusedAt
        ).length;
        const rejected = uniqueCancellations.filter(c => 
            c.refusedAt !== null
        ).length;

        return {
            totalCancellations: total,
            pendingCancellations: pending,
            approvedCancellations: approved,
            rejectedCancellations: rejected
        };
    } catch (error) {
        console.error("Error fetching user cancellation statistics:", error);
        return {
            totalCancellations: 0,
            pendingCancellations: 0,
            approvedCancellations: 0,
            rejectedCancellations: 0
        };
    }
}

