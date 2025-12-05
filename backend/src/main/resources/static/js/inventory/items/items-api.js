// Items API Functions

async function fetchItemsByInventory(inventoryId, page = 0, size = 6) {
  try {
    const token = localStorage.getItem("jwt");
    const headers = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const url = `/api/v1/items/inventory/${inventoryId}?page=${page}&size=${size}`;
    console.debug(`Fetching items from: ${url}`);

    const response = await fetch(url, {
      method: "GET",
      headers: headers,
    });

    if (!response.ok) {
      let errorMessage = `Error al cargar los items (Código: ${response.status})`;
      let errorDetails = null;
      
      try {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          errorDetails = errorData;
          
          // Try to get a more descriptive error message
          errorMessage = errorData.message || 
                        errorData.detail || 
                        errorData.error || 
                        errorData.exception ||
                        errorMessage;
          
          // If it's a generic error message, try to add more context
          if (errorMessage === "Ha ocurrido un error inesperado" || 
              errorMessage === "An unexpected error occurred" ||
              errorMessage.includes("unexpected")) {
            // Try to get more details
            if (errorData.trace) {
              console.error("Full error trace:", errorData.trace);
            }
            if (errorData.path) {
              errorMessage += ` (Endpoint: ${errorData.path})`;
            }
            if (errorData.timestamp) {
              console.error("Error timestamp:", errorData.timestamp);
            }
          }
          
          // Log full error details for debugging
          console.error("Error response from backend:", {
            status: response.status,
            statusText: response.statusText,
            url: url,
            errorData: errorData,
            errorDataString: JSON.stringify(errorData, null, 2)
          });
          
          // Log each property of errorData separately for better visibility
          if (errorData) {
            console.error("Error details breakdown:", {
              message: errorData.message,
              detail: errorData.detail,
              error: errorData.error,
              timestamp: errorData.timestamp,
              path: errorData.path,
              status: errorData.status,
              trace: errorData.trace,
              allKeys: Object.keys(errorData)
            });
          }
        } else {
          const errorText = await response.text();
          if (errorText) {
            errorMessage = errorText;
            console.error("Error response text:", errorText);
          }
        }
      } catch (parseError) {
        console.error("Error parsing error response:", parseError);
      }
      
      const finalError = new Error(errorMessage);
      finalError.status = response.status;
      finalError.details = errorDetails;
      throw finalError;
    }

    const data = await response.json();
    console.debug(`Successfully fetched items:`, {
      totalElements: data.totalElements,
      totalPages: data.totalPages,
      itemsCount: data.content?.length || 0
    });
    return data;
  } catch (error) {
    console.error("Error fetching items:", {
      error: error,
      message: error.message,
      status: error.status,
      details: error.details,
      inventoryId: inventoryId,
      page: page,
      size: size
    });
    throw error;
  }
}

async function createItem(itemData) {
  try {
    const token = localStorage.getItem("jwt");
    const headers = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch("/api/v1/items/add", {
      method: "POST",
      headers: headers,
      body: JSON.stringify(itemData),
    });

    if (!response.ok) {
      let errorMessage = "Error al crear el item";
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

async function updateItem(itemId, itemData) {
  try {
    const token = localStorage.getItem("jwt");
    const headers = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`/api/v1/items/${itemId}`, {
      method: "PUT",
      headers: headers,
      body: JSON.stringify(itemData),
    });

    if (!response.ok) {
      let errorMessage = "Error al actualizar el item";
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

async function uploadItemImage(itemId, file) {
  try {
    const token = localStorage.getItem("jwt");
    const formData = new FormData();
    formData.append("file", file);

    const headers = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`/api/v1/items/${itemId}/image`, {
      method: "POST",
      headers: headers,
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "Error al subir la imagen");
    }

    return await response.text();
  } catch (error) {
    console.error("Error uploading item image:", error);
    throw error;
  }
}

async function getItemById(itemId, silent = false) {
  try {
    const token = localStorage.getItem("jwt");
    const headers = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`/api/v1/items/${itemId}`, {
      method: "GET",
      headers: headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const item = await response.json();
    return item;
  } catch (error) {
    // Only log as error if not silent (when we have a fallback)
    if (!silent) {
      console.error("Error fetching item by ID:", error);
    }
    throw error;
  }
}

async function getItemImages(itemId) {
  try {
    const token = localStorage.getItem("jwt");
    const headers = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`/api/v1/items/${itemId}/images`, {
      method: "GET",
      headers: headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const images = await response.json();

    // Ensure we return an array
    if (Array.isArray(images)) {
      return images;
    } else {
      return [];
    }
  } catch (error) {
    console.error("Error fetching item images:", error);
    throw error;
  }
}

async function deleteItem(itemId) {
  try {
    const token = localStorage.getItem("jwt");
    const headers = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`/api/v1/items/${itemId}`, {
      method: "DELETE",
      headers: headers,
    });

    if (!response.ok) {
      let errorMessage = "Error al eliminar el item";
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
    console.error("Error deleting item:", error);
    throw error;
  }
}

async function deleteItemImage(itemId, imageUrl) {
  try {
    const token = localStorage.getItem("jwt");
    const headers = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(
      `/api/v1/items/${itemId}/image?imageUrl=${encodeURIComponent(imageUrl)}`,
      {
        method: "DELETE",
        headers: headers,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "Error al eliminar la imagen");
    }

    return await response.text();
  } catch (error) {
    console.error("Error deleting item image:", error);
    throw error;
  }
}

async function fetchInventoryStatistics(inventoryId) {
  try {
    const token = localStorage.getItem("jwt");
    const headers = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(
      `/api/v1/inventory/${inventoryId}/statistics`,
      {
        method: "GET",
        headers: headers,
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching inventory statistics:", error);
    throw error;
  }
}

async function lendItem(itemId, responsibleId, details) {
  try {
    // Check if user has permission to create loans (for USER role)
    if (window.loansData && window.loansData.userRole === 'USER') {
      if (!window.loansData.canCreateLoans) {
        throw new Error('No tienes permisos para crear préstamos. Solo los propietarios y firmantes de inventarios pueden crear préstamos.');
      }
      
      // Verify that the item belongs to an inventory where user is owner or signatory
      if (window.itemsData && window.itemsData.currentInventoryId) {
        const inventoryId = window.itemsData.currentInventoryId;
        if (window.loansData.userInventoriesWithPermission && 
            !window.loansData.userInventoriesWithPermission.includes(inventoryId)) {
          throw new Error('No tienes permisos para crear préstamos en este inventario. Solo puedes crear préstamos en inventarios donde eres propietario o firmante.');
        }
      }
    }

    const token = localStorage.getItem("jwt");
    const headers = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch("/api/v1/loan/lend", {
      method: "POST",
      headers: headers,
      body: JSON.stringify({
        itemId: itemId,
        responsibleId: responsibleId,
        details: details || "",
      }),
    });

    if (!response.ok) {
      let errorMessage = "Error al prestar el item";
      let errorDetails = null;
      
      try {
        const contentType = response.headers.get("content-type");
        console.log("Error response status:", response.status);
        console.log("Error response content-type:", contentType);
        
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          console.log("Error data from server:", errorData);
          
          errorMessage =
            errorData.message ||
            errorData.detail ||
            errorData.error ||
            errorMessage;
          errorDetails = errorData;
        } else {
          const errorText = await response.text();
          console.log("Error text from server:", errorText);
          errorMessage = errorText || errorMessage;
        }
        
        // Check for specific loan error - dado de baja
        if (errorMessage.includes("dado de baja") || errorMessage.includes("está dado de baja")) {
          // El mensaje ya viene formateado desde el backend, solo lo mantenemos
          // No necesita traducción adicional
        }
        // Check for specific loan error - item currently lent
        else if (errorMessage.includes("cannot be lent") || errorMessage.includes("not been returned") || errorMessage.includes("currently lent")) {
          if (errorMessage.includes("currently lent to:")) {
            // Extract the responsible person's name from the error message
            const match = errorMessage.match(/currently lent to: (.+?)(?:\.|$)/);
            if (match && match[1]) {
              errorMessage = `Este item no puede ser prestado porque actualmente está prestado a: "${match[1].trim()}". Debe ser devuelto primero antes de poder prestarlo nuevamente.`;
            } else {
              errorMessage = "Este item no puede ser prestado porque tiene un préstamo activo. Debe ser devuelto primero.";
            }
          } else {
            errorMessage = "Este item no puede ser prestado porque tiene un préstamo activo. Debe ser devuelto primero.";
          }
        }
        
        console.log("Final error message:", errorMessage);
      } catch (parseError) {
        console.error("Error al parsear respuesta de error:", parseError);
        errorMessage = `Error al prestar el item (Código: ${response.status}). Por favor, inténtalo de nuevo.`;
      }
      
      const finalError = new Error(errorMessage);
      if (errorDetails) {
        finalError.details = errorDetails;
      }
      finalError.status = response.status;
      throw finalError;
    }

    return await response.json();
  } catch (error) {
    throw error;
  }
}

// Export functions globally
window.fetchItemsByInventory = fetchItemsByInventory;
window.createItem = createItem;
window.updateItem = updateItem;
window.getItemById = getItemById;
window.deleteItem = deleteItem;
window.uploadItemImage = uploadItemImage;
window.getItemImages = getItemImages;
window.deleteItemImage = deleteItemImage;
window.fetchInventoryStatistics = fetchInventoryStatistics;
window.lendItem = lendItem;
