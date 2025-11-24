// Items API Functions

async function fetchItemsByInventory(inventoryId, page = 0, size = 6) {
    try {
        const token = localStorage.getItem('jwt');
        const headers = {
            'Content-Type': 'application/json'
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`/api/v1/items/inventory/${inventoryId}?page=${page}&size=${size}`, {
            method: 'GET',
            headers: headers
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching items:', error);
        throw error;
    }
}

async function createItem(itemData) {
    try {
        const token = localStorage.getItem('jwt');
        const headers = {
            'Content-Type': 'application/json'
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch('/api/v1/items/add', {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(itemData)
        });

        if (!response.ok) {
            let errorMessage = 'Error al crear el item';
            try {
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorData.detail || errorData.error || errorMessage;
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

async function updateItem(itemId, itemData) {
    try {
        const token = localStorage.getItem('jwt');
        const headers = {
            'Content-Type': 'application/json'
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`/api/v1/items/${itemId}`, {
            method: 'PUT',
            headers: headers,
            body: JSON.stringify(itemData)
        });

        if (!response.ok) {
            let errorMessage = 'Error al actualizar el item';
            try {
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorData.detail || errorData.error || errorMessage;
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

async function uploadItemImage(itemId, file) {
    try {
        const token = localStorage.getItem('jwt');
        const formData = new FormData();
        formData.append('file', file);

        const headers = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`/api/v1/items/${itemId}/image`, {
            method: 'POST',
            headers: headers,
            body: formData
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Error al subir la imagen');
        }

        return await response.text();
    } catch (error) {
        console.error('Error uploading item image:', error);
        throw error;
    }
}

async function getItemImages(itemId) {
    try {
        const token = localStorage.getItem('jwt');
        const headers = {
            'Content-Type': 'application/json'
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`/api/v1/items/${itemId}/images`, {
            method: 'GET',
            headers: headers
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching item images:', error);
        throw error;
    }
}

async function deleteItemImage(itemId, imageUrl) {
    try {
        const token = localStorage.getItem('jwt');
        const headers = {
            'Content-Type': 'application/json'
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`/api/v1/items/${itemId}/image?imageUrl=${encodeURIComponent(imageUrl)}`, {
            method: 'DELETE',
            headers: headers
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Error al eliminar la imagen');
        }

        return await response.text();
    } catch (error) {
        console.error('Error deleting item image:', error);
        throw error;
    }
}

async function fetchInventoryStatistics(inventoryId) {
    try {
        const token = localStorage.getItem('jwt');
        const headers = {
            'Content-Type': 'application/json'
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`/api/v1/inventory/${inventoryId}/statistics`, {
            method: 'GET',
            headers: headers
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching inventory statistics:', error);
        throw error;
    }
}

// Export functions globally
window.fetchItemsByInventory = fetchItemsByInventory;
window.createItem = createItem;
window.updateItem = updateItem;
window.uploadItemImage = uploadItemImage;
window.getItemImages = getItemImages;
window.deleteItemImage = deleteItemImage;
window.fetchInventoryStatistics = fetchInventoryStatistics;

