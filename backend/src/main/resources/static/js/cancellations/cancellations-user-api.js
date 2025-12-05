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

        // Combine and get unique inventory IDs
        const inventoryMap = new Map();
        [...ownedInventories, ...signatoryInventories, ...managedInventories].forEach(inv => {
            if (inv && inv.id) {
                inventoryMap.set(inv.id, inv);
            }
        });

        const userInventoryIds = Array.from(inventoryMap.keys());

        if (userInventoryIds.length === 0) {
            return {
                content: [],
                totalElements: 0,
                totalPages: 0,
                number: page,
                size: size
            };
        }

        // Fetch all cancellations and filter by inventory IDs
        let allCancellations = [];
        let currentPage = 0;
        let hasMore = true;
        
        while (hasMore && currentPage < 50) { // Limit to prevent infinite loops
            const response = await fetch(`/api/v1/cancellations?page=${currentPage}&size=100`, {
                method: "GET",
                headers: headers,
            });

            if (!response.ok) {
                if (response.status === 404 || response.status === 403) {
                    // User doesn't have permission or endpoint doesn't exist
                    break;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const pageData = await response.json();
            
            if (pageData.content && pageData.content.length > 0) {
                // Filter cancellations that have items belonging to user's inventories
                const relevantCancellations = pageData.content.filter(cancellation => {
                    if (!cancellation.items || cancellation.items.length === 0) {
                        return false;
                    }
                    // Check if any item in the cancellation belongs to one of user's inventories
                    return cancellation.items.some(item => {
                        const itemInventoryId = item.inventoryId || item.inventory?.id;
                        return itemInventoryId && userInventoryIds.includes(itemInventoryId);
                    });
                });
                
                allCancellations = allCancellations.concat(relevantCancellations);
                hasMore = !pageData.last && pageData.content.length === 100;
                currentPage++;
            } else {
                hasMore = false;
            }
        }

        // Remove duplicates (in case same cancellation appears in multiple pages)
        const uniqueCancellations = [];
        const seenIds = new Set();
        allCancellations.forEach(c => {
            if (c.id && !seenIds.has(c.id)) {
                seenIds.add(c.id);
                uniqueCancellations.push(c);
            }
        });

        // Sort by ID descending
        uniqueCancellations.sort((a, b) => {
            if (!a.id || !b.id) return 0;
            return b.id - a.id;
        });

        // Apply pagination manually
        const start = page * size;
        const end = start + size;
        const paginatedCancellations = uniqueCancellations.slice(start, end);

        return {
            content: paginatedCancellations,
            totalElements: uniqueCancellations.length,
            totalPages: Math.ceil(uniqueCancellations.length / size),
            number: page,
            size: size,
            last: end >= uniqueCancellations.length
        };
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
            return {
                totalCancellations: 0,
                pendingCancellations: 0,
                approvedCancellations: 0,
                rejectedCancellations: 0
            };
        }

        const ownedInventories = ownedResponse.ok ? await ownedResponse.json() : [];
        const signatoryInventories = signatoryResponse.ok ? await signatoryResponse.json() : [];
        const managedInventories = managedResponse.ok ? await managedResponse.json() : [];

        // Combine and get unique inventory IDs
        const inventoryMap = new Map();
        [...ownedInventories, ...signatoryInventories, ...managedInventories].forEach(inv => {
            if (inv && inv.id) {
                inventoryMap.set(inv.id, inv);
            }
        });

        const userInventoryIds = Array.from(inventoryMap.keys());

        if (userInventoryIds.length === 0) {
            return {
                totalCancellations: 0,
                pendingCancellations: 0,
                approvedCancellations: 0,
                rejectedCancellations: 0
            };
        }

        // Fetch all cancellations and filter by inventory IDs
        let allCancellations = [];
        let currentPage = 0;
        let hasMore = true;
        
        while (hasMore && currentPage < 50) {
            const response = await fetch(`/api/v1/cancellations?page=${currentPage}&size=100`, {
                method: "GET",
                headers: headers,
            });

            if (!response.ok) {
                if (response.status === 404 || response.status === 403) {
                    break;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const pageData = await response.json();
            
            if (pageData.content && pageData.content.length > 0) {
                // Filter cancellations that have items belonging to user's inventories
                const relevantCancellations = pageData.content.filter(cancellation => {
                    if (!cancellation.items || cancellation.items.length === 0) {
                        return false;
                    }
                    // Check if any item in the cancellation belongs to one of user's inventories
                    return cancellation.items.some(item => {
                        const itemInventoryId = item.inventoryId || item.inventory?.id;
                        return itemInventoryId && userInventoryIds.includes(itemInventoryId);
                    });
                });
                
                allCancellations = allCancellations.concat(relevantCancellations);
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

