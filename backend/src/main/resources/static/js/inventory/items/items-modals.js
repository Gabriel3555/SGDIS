// Items Modals Functions

async function loadItemsData() {
  if (!window.itemsData || !window.itemsData.currentInventoryId) {
    console.error("No inventory ID set for loading items");
    return;
  }

  const container = document.getElementById("itemsContainer");
  if (container) {
    container.innerHTML = `
            <div class="animate-pulse space-y-4">
                <div class="h-32 bg-gray-200 rounded-xl"></div>
                <div class="h-32 bg-gray-200 rounded-xl"></div>
                <div class="h-32 bg-gray-200 rounded-xl"></div>
            </div>
        `;
  }

  try {
    const { currentPage, pageSize, currentInventoryId } = window.itemsData;
    const response = await window.fetchItemsByInventory(
      currentInventoryId,
      currentPage,
      pageSize
    );

    // Update items data
    window.itemsData.items = response.content || [];
    window.itemsData.totalPages = response.totalPages || 0;
    window.itemsData.totalElements = response.totalElements || 0;

    // Update UI
    if (window.updateItemsUI) {
      window.updateItemsUI();
    }
  } catch (error) {
    console.error("Error loading items:", error);
    if (container) {
      container.innerHTML = `
                <div class="text-center py-12">
                    <i class="fas fa-exclamation-triangle text-red-500 text-4xl mb-4"></i>
                    <p class="text-red-600">Error al cargar los items</p>
                    <button onclick="loadItemsData()" class="mt-4 bg-[#00AF00] hover:bg-[#008800] text-white font-semibold py-2 px-4 rounded-xl transition-colors">
                        Reintentar
                    </button>
                </div>
            `;
    }
    if (window.showErrorToast) {
      window.showErrorToast(
        "Error",
        "No se pudieron cargar los items del inventario"
      );
    }
  }
}

async function showViewItemModal(itemId) {
  const modal = document.getElementById("viewItemModal");
  if (!modal) return;

  const content = document.getElementById("viewItemContent");
  if (content) {
    content.innerHTML = `
            <div class="flex items-center justify-center py-8">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00AF00]"></div>
            </div>
        `;
  }

  modal.classList.remove("hidden");

  // Fetch item details (we'll need to get it from the items list or create a new endpoint)
  // For now, find it in the current items list
  if (window.itemsData && window.itemsData.items) {
    const item = window.itemsData.items.find((i) => i.id === itemId);
    if (item) {
      await populateViewItemModal(item);
    }
  }
}

// Carousel navigation functions
function navigateCarousel(carouselId, direction) {
  // Prevent double execution
  if (
    navigateCarousel._processing &&
    navigateCarousel._processing === carouselId
  ) {
    return;
  }
  navigateCarousel._processing = carouselId;

  setTimeout(() => {
    navigateCarousel._processing = null;
  }, 100);

  const carousel = document.getElementById(carouselId);
  if (!carousel) {
    console.error("Carousel not found:", carouselId);
    navigateCarousel._processing = null;
    return;
  }

  // Find images container - it's inside the carousel
  const imagesContainer = carousel.querySelector(".relative.w-full.h-64");
  if (!imagesContainer) {
    console.error("Images container not found in carousel:", carouselId);
    navigateCarousel._processing = null;
    return;
  }

  const images = imagesContainer.querySelectorAll("img[data-index]");
  if (images.length === 0) {
    console.error("No images found in carousel:", carouselId);
    navigateCarousel._processing = null;
    return;
  }

  // Get current index from data attribute on carousel (more reliable)
  let currentIndex = parseInt(carousel.getAttribute("data-current-index"), 10);

  // If not set, try to find visible image
  if (isNaN(currentIndex)) {
    images.forEach((img) => {
      const computedStyle = window.getComputedStyle(img);
      if (
        computedStyle.opacity === "1" ||
        img.classList.contains("opacity-100")
      ) {
        const imgIndex = parseInt(img.getAttribute("data-index"), 10);
        if (!isNaN(imgIndex)) {
          currentIndex = imgIndex;
        }
      }
    });
  }

  // If still not found, default to first image
  if (isNaN(currentIndex) || currentIndex < 0) {
    currentIndex = 0;
  }

  // Calculate new index (sequential: +1 or -1)
  let newIndex = currentIndex + direction;
  if (newIndex < 0) {
    newIndex = images.length - 1; // Wrap to last image
  } else if (newIndex >= images.length) {
    newIndex = 0; // Wrap to first image
  }

  goToCarouselImage(carouselId, newIndex);
}

function goToCarouselImage(carouselId, index) {
  // Prevent double execution
  const processingKey = `goToCarousel_${carouselId}_${index}`;
  if (
    goToCarouselImage._processing &&
    goToCarouselImage._processing === processingKey
  ) {
    return;
  }
  goToCarouselImage._processing = processingKey;

  setTimeout(() => {
    goToCarouselImage._processing = null;
  }, 100);

  const carousel = document.getElementById(carouselId);
  if (!carousel) {
    console.error("Carousel not found:", carouselId);
    goToCarouselImage._processing = null;
    return;
  }

  // Find images container - it's inside the carousel
  const imagesContainer = carousel.querySelector(".relative.w-full.h-64");
  if (!imagesContainer) {
    console.error("Images container not found in carousel:", carouselId);
    goToCarouselImage._processing = null;
    return;
  }

  const images = imagesContainer.querySelectorAll("img[data-index]");
  const indicators = carousel.querySelectorAll(
    `[id^="${carouselId}-indicator-"]`
  );
  const counter = document.getElementById(`${carouselId}-counter`);

  if (index < 0 || index >= images.length) {
    console.error(
      "Invalid index:",
      index,
      "for carousel with",
      images.length,
      "images"
    );
    goToCarouselImage._processing = null;
    return;
  }

  // Hide all images first - ensure all are hidden
  images.forEach((img) => {
    img.classList.remove("opacity-100");
    img.classList.add("opacity-0");
    img.style.opacity = "0";
    img.style.display = "block"; // Keep display but make invisible
  });

  // Show selected image - find by data-index attribute
  const targetImage = Array.from(images).find((img) => {
    const imgIndex = parseInt(img.getAttribute("data-index"), 10);
    return !isNaN(imgIndex) && imgIndex === index;
  });

  if (targetImage) {
    targetImage.classList.remove("opacity-0");
    targetImage.classList.add("opacity-100");
    targetImage.style.opacity = "1";
  } else {
    console.error("Target image not found for index:", index);
    goToCarouselImage._processing = null;
    return;
  }

  // Store current index in carousel data attribute for reliable tracking
  carousel.setAttribute("data-current-index", index.toString());

  // Update indicators
  indicators.forEach((indicator) => {
    const indicatorId = indicator.getAttribute("id");
    if (!indicatorId) return;

    const indicatorIndex = parseInt(
      indicatorId.replace(`${carouselId}-indicator-`, ""),
      10
    );
    if (!isNaN(indicatorIndex)) {
      if (indicatorIndex === index) {
        indicator.classList.remove("bg-white/50");
        indicator.classList.add("bg-white");
      } else {
        indicator.classList.remove("bg-white");
        indicator.classList.add("bg-white/50");
      }
    }
  });

  // Update counter
  if (counter) {
    counter.textContent = index + 1;
  }
}

async function populateViewItemModal(item) {
  const content = document.getElementById("viewItemContent");
  if (!content) return;

  const productName = item.productName || "Sin nombre";
  const acquisitionDate = item.acquisitionDate
    ? new Date(item.acquisitionDate).toLocaleDateString("es-ES")
    : "N/A";
  const acquisitionValue = item.acquisitionValue
    ? `$${item.acquisitionValue.toLocaleString("es-ES")}`
    : "N/A";
  const licencePlateNumber = item.licencePlateNumber || "N/A";
  const location = item.location || "N/A";
  const responsible = item.responsible || "N/A";

  // Get attributes
  let attributesHtml = "";
  if (item.attributes && typeof item.attributes === "object") {
    attributesHtml = '<div class="space-y-2">';
    for (const [key, value] of Object.entries(item.attributes)) {
      if (value) {
        attributesHtml += `
                    <div class="flex justify-between">
                        <span class="text-gray-600">${key}:</span>
                        <span class="font-medium">${value}</span>
                    </div>
                `;
      }
    }
    attributesHtml += "</div>";
  }

  // Load images from API
  let images = [];
  try {
    if (window.getItemImages) {
      const imagesResponse = await window.getItemImages(item.id);
      // Ensure we have an array and it's not limited
      if (Array.isArray(imagesResponse)) {
        images = imagesResponse;
      } else if (imagesResponse && typeof imagesResponse === "object") {
        // In case the API returns an object with an array property
        images = imagesResponse.images || imagesResponse.data || [];
      }
    }
  } catch (error) {
    // Silently handle error, will show empty carousel
  }

  const carouselId = `item-carousel-${item.id}`;

  // Ensure images is an array and filter out any null/undefined values
  if (!Array.isArray(images)) {
    images = [];
  }
  images = images.filter((img) => img && img.trim() !== "");

  // Build carousel HTML
  let carouselHtml = "";
  if (images && images.length > 0) {
    // Generate all image elements with delete buttons
    const imageElements = images
      .map((imgUrl, index) => {
        const escapedUrl = imgUrl.replace(/'/g, "\\'").replace(/"/g, "&quot;");
        const doubleEscapedUrl = imgUrl.replace(/'/g, "\\'").replace(/"/g, "&quot;").replace(/\\/g, "\\\\");
        return `
            <div class="absolute inset-0 transition-opacity duration-300 ${
              index === 0 ? "opacity-100" : "opacity-0"
            }" 
                 id="${carouselId}-img-container-${index}"
                 data-index="${index}">
              <img src="${escapedUrl}" alt="${productName} - Imagen ${index + 1}" 
                   class="w-full h-full object-cover"
                   id="${carouselId}-img-${index}"
                   data-index="${index}">
              <button type="button" 
                      onclick="deleteItemImageFromModal(${item.id}, '${doubleEscapedUrl}', '${carouselId}', ${index})"
                      class="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full transition-colors z-20 shadow-lg"
                      title="Eliminar imagen">
                <i class="fas fa-trash text-sm"></i>
              </button>
            </div>
          `;
      })
      .join("");

    // Generate indicator buttons
    const indicatorElements = images
      .map((_, index) => {
        return `
                <button type="button" onclick="goToCarouselImage('${carouselId}', ${index})" data-carousel-id="${carouselId}" data-image-index="${index}" 
                        class="carousel-indicator-btn w-2 h-2 rounded-full transition-all ${
                          index === 0 ? "bg-white" : "bg-white/50"
                        }" 
                        id="${carouselId}-indicator-${index}"></button>
              `;
      })
      .join("");

    carouselHtml = `
      <div class="relative w-full max-w-md mx-auto" id="${carouselId}" data-current-index="0">
        <div class="relative w-full h-64 bg-gray-200 dark:bg-gray-700 rounded-xl overflow-hidden">
          ${imageElements}
          ${
            images.length > 1
              ? `
            <button type="button" onclick="navigateCarousel('${carouselId}', -1)" data-carousel-id="${carouselId}" data-direction="-1" 
                    class="carousel-nav-btn absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors z-10">
              <i class="fas fa-chevron-left"></i>
            </button>
            <button type="button" onclick="navigateCarousel('${carouselId}', 1)" data-carousel-id="${carouselId}" data-direction="1" 
                    class="carousel-nav-btn absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors z-10">
              <i class="fas fa-chevron-right"></i>
            </button>
            <div class="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1 z-10 flex-wrap justify-center max-w-full px-2">
              ${indicatorElements}
            </div>
          `
              : ""
          }
        </div>
        <div class="text-center mt-2 text-sm text-gray-600 dark:text-gray-400">
          Imagen <span id="${carouselId}-counter">1</span> de ${images.length}
        </div>
      </div>
    `;
  } else {
    carouselHtml = `
      <div class="w-full max-w-md mx-auto">
        <div class="w-full h-64 bg-gray-200 dark:bg-gray-700 rounded-xl flex items-center justify-center text-gray-400 dark:text-gray-500">
          <div class="text-center">
            <i class="fas fa-images text-6xl mb-2"></i>
            <p class="text-sm">No hay imágenes disponibles</p>
          </div>
        </div>
      </div>
    `;
  }

  content.innerHTML = `
        <div class="mb-6">
            ${carouselHtml}
        </div>
        
        <div class="bg-gray-50 rounded-xl p-6 space-y-4">
            <h3 class="text-lg font-semibold text-gray-800 mb-4">Información del Item</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Nombre del Producto</label>
                    <p class="text-gray-900 font-semibold">${productName}</p>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Placa</label>
                    <p class="text-gray-900">${licencePlateNumber}</p>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Ubicación</label>
                    <p class="text-gray-900">${location}</p>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Responsable</label>
                    <p class="text-gray-900">${responsible}</p>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Fecha de Adquisición</label>
                    <p class="text-gray-900">${acquisitionDate}</p>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Valor de Adquisición</label>
                    <p class="text-gray-900 font-semibold">${acquisitionValue}</p>
                </div>
            </div>
            ${
              attributesHtml
                ? `
                <div class="mt-4">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Atributos</label>
                    ${attributesHtml}
                </div>
            `
                : ""
            }
        </div>
    `;

  // Store current item ID for edit modal
  if (window.itemsData) {
    window.itemsData.currentItemId = item.id;
  }

  // Setup carousel event listeners and initialize after HTML is inserted
  setTimeout(() => {
    initializeCarousel(carouselId);
    setupCarouselEventListeners(carouselId);
  }, 0);
}

// Function to delete an image from the view modal
async function deleteItemImageFromModal(itemId, imageUrl, carouselId, imageIndex) {
  if (!itemId || !imageUrl) {
    if (window.showErrorToast) {
      window.showErrorToast("Error", "No se pudo identificar la imagen a eliminar");
    }
    return;
  }

  // Confirm deletion
  if (!confirm("¿Está seguro que desea eliminar esta imagen? Esta acción no se puede deshacer.")) {
    return;
  }

  try {
    // Show loading state
    const deleteButton = document.querySelector(`#${carouselId}-img-container-${imageIndex} button`);
    if (deleteButton) {
      deleteButton.disabled = true;
      deleteButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    }

    // Call delete API
    if (window.deleteItemImage) {
      await window.deleteItemImage(itemId, imageUrl);
      
      // Show success message
      if (window.showSuccessToast) {
        window.showSuccessToast("Éxito", "Imagen eliminada correctamente");
      } else if (window.showErrorToast) {
        window.showErrorToast("Éxito", "Imagen eliminada correctamente");
      }

      // Reload the modal to show updated images
      if (window.itemsData && window.itemsData.items) {
        const item = window.itemsData.items.find(i => i.id === itemId);
        if (item && window.populateViewItemModal) {
          await window.populateViewItemModal(item);
        }
      } else if (window.showViewItemModal) {
        // Fallback: reload modal
        await window.showViewItemModal(itemId);
      }
    } else {
      throw new Error("La función de eliminar imagen no está disponible");
    }
  } catch (error) {
    console.error("Error deleting item image:", error);
    
    // Restore button state
    const deleteButton = document.querySelector(`#${carouselId}-img-container-${imageIndex} button`);
    if (deleteButton) {
      deleteButton.disabled = false;
      deleteButton.innerHTML = '<i class="fas fa-trash text-sm"></i>';
    }

    if (window.showErrorToast) {
      window.showErrorToast(
        "Error",
        error.message || "No se pudo eliminar la imagen"
      );
    }
  }
}

function initializeCarousel(carouselId) {
  const carousel = document.getElementById(carouselId);
  if (!carousel) return;

  // Find images container
  const imagesContainer = carousel.querySelector(".relative.w-full.h-64");
  if (!imagesContainer) return;

  const images = imagesContainer.querySelectorAll("img[data-index]");
  if (images.length === 0) return;

  // Ensure only the first image is visible
  images.forEach((img, index) => {
    if (index === 0) {
      img.classList.remove("opacity-0");
      img.classList.add("opacity-100");
      img.style.opacity = "1";
    } else {
      img.classList.remove("opacity-100");
      img.classList.add("opacity-0");
      img.style.opacity = "0";
    }
  });

  // Set initial index
  carousel.setAttribute("data-current-index", "0");

  // Update counter
  const counter = document.getElementById(`${carouselId}-counter`);
  if (counter) {
    counter.textContent = "1";
  }

  // Update indicators
  const indicators = carousel.querySelectorAll(
    `[id^="${carouselId}-indicator-"]`
  );
  indicators.forEach((indicator, index) => {
    if (index === 0) {
      indicator.classList.remove("bg-white/50");
      indicator.classList.add("bg-white");
    } else {
      indicator.classList.remove("bg-white");
      indicator.classList.add("bg-white/50");
    }
  });
}

function setupCarouselEventListeners(carouselId) {
  // We're using onclick inline handlers only to avoid double execution
  // This function is kept for potential future use but doesn't add listeners
  // to avoid conflicts with onclick inline handlers that would cause double clicks
}

function closeViewItemModal() {
  const modal = document.getElementById("viewItemModal");
  if (modal) {
    modal.classList.add("hidden");
  }
}

function showNewItemModal() {
  const modal = document.getElementById("newItemModal");
  if (modal) {
    modal.classList.remove("hidden");
  }
  // Form will be populated by items-forms.js
}

function closeNewItemModal() {
  const modal = document.getElementById("newItemModal");
  if (modal) {
    modal.classList.add("hidden");
  }
  const form = document.getElementById("newItemForm");
  if (form) {
    form.reset();
  }
}

function showEditItemModal(itemId) {
  const modal = document.getElementById("editItemModal");
  if (!modal) return;

  // Store current item ID
  if (window.itemsData) {
    window.itemsData.currentItemId = itemId;
  }

  modal.classList.remove("hidden");
  // Form will be populated by items-forms.js
}

function closeEditItemModal() {
  const modal = document.getElementById("editItemModal");
  if (modal) {
    modal.classList.add("hidden");
  }
  const form = document.getElementById("editItemForm");
  if (form) {
    form.reset();
  }
}

function showDeleteItemModal(itemId) {
  const modal = document.getElementById("deleteItemModal");
  if (!modal) return;

  // Store current item ID
  if (window.itemsData) {
    window.itemsData.currentItemId = itemId;
  }

  // Find item to show name
  if (window.itemsData && window.itemsData.items) {
    const item = window.itemsData.items.find((i) => i.id === itemId);
    if (item) {
      const messageElement = document.getElementById("deleteItemMessage");
      if (messageElement) {
        messageElement.textContent = `¿Está seguro que desea eliminar el item "${
          item.productName || "Sin nombre"
        }"? Esta acción no se puede deshacer.`;
      }
    }
  }

  modal.classList.remove("hidden");
}

function closeDeleteItemModal() {
  const modal = document.getElementById("deleteItemModal");
  if (modal) {
    modal.classList.add("hidden");
  }
}

async function confirmDeleteItem() {
  if (!window.itemsData || !window.itemsData.currentItemId) {
    if (window.showErrorToast) {
      window.showErrorToast("Error", "No se ha seleccionado un item para eliminar");
    }
    return;
  }

  const itemId = window.itemsData.currentItemId;

  try {
    // Show loading state
    const deleteButton = document.querySelector('#deleteItemModal button[onclick="confirmDeleteItem()"]');
    if (deleteButton) {
      deleteButton.disabled = true;
      deleteButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Eliminando...';
    }

    // Call delete API
    if (window.deleteItem) {
      const response = await window.deleteItem(itemId);
      
      // Show success message
      if (window.showSuccessToast) {
        window.showSuccessToast(
          "Éxito",
          response.message || `Item "${response.itemName || 'eliminado'}" eliminado correctamente`
        );
      } else if (window.showErrorToast) {
        window.showErrorToast(
          "Éxito",
          response.message || "Item eliminado correctamente"
        );
      }

      // Close modal
      closeDeleteItemModal();

      // Reload items list
      if (window.loadItemsData) {
        await window.loadItemsData();
      } else if (window.updateItemsUI) {
        window.updateItemsUI();
      }
    } else {
      throw new Error("La función de eliminar item no está disponible");
    }
  } catch (error) {
    console.error("Error deleting item:", error);
    
    // Restore button state
    const deleteButton = document.querySelector('#deleteItemModal button[onclick="confirmDeleteItem()"]');
    if (deleteButton) {
      deleteButton.disabled = false;
      deleteButton.innerHTML = 'Eliminar Item';
    }

    if (window.showErrorToast) {
      window.showErrorToast(
        "Error",
        error.message || "No se pudo eliminar el item"
      );
    }
  }
}

// Roles that can perform direct transfers (immediate, no approval needed)
const DIRECT_TRANSFER_ROLES = ["SUPERADMIN", "ADMIN_INSTITUTION", "ADMIN_REGIONAL", "WAREHOUSE"];

// Check if current user can transfer items from current inventory
async function checkTransferPermissions() {
  try {
    const currentInventoryId = window.itemsData ? window.itemsData.currentInventoryId : null;
    if (!currentInventoryId) return { canTransfer: false, isDirectTransfer: false, reason: "No se pudo identificar el inventario actual" };

    const token = localStorage.getItem("jwt");
    if (!token) return { canTransfer: false, isDirectTransfer: false, reason: "Sesión no válida" };

    // Get current user info
    const userResponse = await fetch("/api/v1/users/me", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    if (!userResponse.ok) {
      return { canTransfer: false, isDirectTransfer: false, reason: "No se pudo verificar tu usuario" };
    }

    const currentUser = await userResponse.json();

    // Check if user has a role that allows direct transfers
    if (DIRECT_TRANSFER_ROLES.includes(currentUser.role)) {
      return { canTransfer: true, isDirectTransfer: true };
    }

    // For other roles, check if they belong to the inventory (owner, manager, signatory)
    const inventoryUsersResponse = await fetch(`/api/v1/inventory/${currentInventoryId}/users`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    if (!inventoryUsersResponse.ok) {
      // If we can't get the inventory users, let the backend handle it
      return { canTransfer: true, isDirectTransfer: false };
    }

    const inventoryUsers = await inventoryUsersResponse.json();

    // Check if current user is owner
    if (inventoryUsers.owner && inventoryUsers.owner.userId === currentUser.id) {
      return { canTransfer: true, isDirectTransfer: false };
    }

    // Check if current user is a manager
    if (inventoryUsers.managers && inventoryUsers.managers.some(m => m.userId === currentUser.id)) {
      return { canTransfer: true, isDirectTransfer: false };
    }

    // Check if current user is a signatory
    if (inventoryUsers.signatories && inventoryUsers.signatories.some(s => s.userId === currentUser.id)) {
      return { canTransfer: true, isDirectTransfer: false };
    }

    return { 
      canTransfer: false, 
      isDirectTransfer: false,
      reason: "Solo SUPERADMIN, Administrador Institucional, Administrador Regional, Warehouse, o usuarios asignados al inventario (propietario, manejadores, firmantes) pueden solicitar transferencias."
    };
  } catch (error) {
    console.error("Error checking transfer permissions:", error);
    // If there's an error, let the request proceed and let backend handle it
    return { canTransfer: true, isDirectTransfer: false };
  }
}

async function showTransferItemModal(itemId) {
  const modal = document.getElementById("transferItemModal");
  if (!modal) return;

  // Check transfer permissions first
  const permissionCheck = await checkTransferPermissions();
  if (!permissionCheck.canTransfer) {
    if (window.showErrorToast) {
      window.showErrorToast(
        "Sin permisos para transferir",
        permissionCheck.reason
      );
    }
    return;
  }

  // Store current item ID and if it's a direct transfer
  if (window.itemsData) {
    window.itemsData.currentItemId = itemId;
    window.itemsData.isDirectTransfer = permissionCheck.isDirectTransfer || false;
  }

  // Find item to show name
  let itemName = "Item";
  if (window.itemsData && window.itemsData.items) {
    const item = window.itemsData.items.find((i) => i.id === itemId);
    if (item) {
      itemName = item.productName || "Sin nombre";
    }
  }

  // Set item name
  const itemNameElement = document.getElementById("transferItemName");
  if (itemNameElement) {
    itemNameElement.textContent = itemName;
  }

  // Update the info message based on transfer type
  const infoBox = modal.querySelector('.bg-blue-50, .dark\\:bg-blue-900\\/20');
  if (infoBox) {
    if (permissionCheck.isDirectTransfer) {
      infoBox.className = 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl p-4';
      infoBox.innerHTML = `
        <div class="flex items-start gap-2">
          <i class="fas fa-bolt text-green-500 dark:text-green-400 mt-1"></i>
          <p class="text-sm text-green-800 dark:text-green-300">
            <span class="font-semibold">Transferencia directa:</span> El item será movido <span class="font-semibold">inmediatamente</span> al inventario de destino.
          </p>
        </div>
      `;
    } else {
      infoBox.className = 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-4';
      infoBox.innerHTML = `
        <div class="flex items-start gap-2">
          <i class="fas fa-info-circle text-blue-500 dark:text-blue-400 mt-1"></i>
          <p class="text-sm text-blue-800 dark:text-blue-300">
            La transferencia quedará en estado <span class="font-semibold">PENDIENTE</span> hasta que sea aprobada por el responsable del inventario de destino.
          </p>
        </div>
      `;
    }
  }

  // Update button text based on transfer type
  const submitButton = modal.querySelector('button[type="submit"]');
  if (submitButton) {
    if (permissionCheck.isDirectTransfer) {
      submitButton.innerHTML = '<i class="fas fa-bolt mr-2"></i>Transferir Ahora';
    } else {
      submitButton.innerHTML = '<i class="fas fa-exchange-alt mr-2"></i>Solicitar Transferencia';
    }
  }

  // Load available inventories for transfer
  await loadTransferInventories();

  modal.classList.remove("hidden");
}

function closeTransferItemModal() {
  const modal = document.getElementById("transferItemModal");
  if (modal) {
    modal.classList.add("hidden");
  }
  const form = document.getElementById("transferItemForm");
  if (form) {
    form.reset();
  }
}

async function loadTransferInventories() {
  const select = document.getElementById("transferDestinationInventory");
  if (!select) return;

  // Clear current options except the first one
  select.innerHTML = '<option value="">Seleccionar inventario...</option>';

  try {
    // Get current inventory ID to exclude it from the list
    const currentInventoryId = window.itemsData
      ? window.itemsData.currentInventoryId
      : null;

    const token = localStorage.getItem("jwt");
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    // First get current user to determine which endpoint to use
    let useInstitutionEndpoint = true;
    try {
      const userResponse = await fetch("/api/v1/users/me", {
        method: "GET",
        headers: headers,
      });
      if (userResponse.ok) {
        const currentUser = await userResponse.json();
        // Only SUPERADMIN sees all inventories, others see only their institution's
        useInstitutionEndpoint = currentUser.role !== "SUPERADMIN";
      }
    } catch (e) {
      console.warn("Could not determine user role, using institution endpoint");
    }

    // Use institution inventories endpoint to show only inventories from the same center
    const endpoint = useInstitutionEndpoint 
      ? "/api/v1/inventory/institutionAdminInventories?page=0&size=1000"
      : "/api/v1/inventory";

    const response = await fetch(endpoint, {
      method: "GET",
      headers: headers,
    });

    if (response.ok) {
      const payload = await response.json();
      
      // Handle both array and paginated response formats
      let inventories = [];
      if (Array.isArray(payload)) {
        inventories = payload;
      } else if (payload && Array.isArray(payload.content)) {
        inventories = payload.content;
      }

      // Filter out current inventory
      const availableInventories = inventories.filter(
        (inv) => inv.id !== currentInventoryId
      );

      // Add options
      availableInventories.forEach((inventory) => {
        const option = document.createElement("option");
        option.value = inventory.id;
        option.textContent = `${inventory.name}${
          inventory.location ? " - " + inventory.location : ""
        }`;
        select.appendChild(option);
      });

      if (availableInventories.length === 0) {
        const option = document.createElement("option");
        option.value = "";
        option.textContent = "No hay inventarios disponibles";
        option.disabled = true;
        select.appendChild(option);
      }
    }
  } catch (error) {
    console.error("Error loading inventories for transfer:", error);
    if (window.showErrorToast) {
      window.showErrorToast(
        "Error",
        "No se pudieron cargar los inventarios disponibles"
      );
    }
  }
}

async function confirmTransferItem() {
  if (!window.itemsData || !window.itemsData.currentItemId) return;

  const itemId = window.itemsData.currentItemId;
  const destinationInventoryId = document.getElementById(
    "transferDestinationInventory"
  ).value;
  const details = document.getElementById("transferDetails").value.trim();

  if (!destinationInventoryId) {
    if (window.showErrorToast) {
      window.showErrorToast(
        "Campo requerido",
        "Por favor selecciona un inventario de destino"
      );
    }
    return;
  }

  try {
    // Create transfer request
    const token = localStorage.getItem("jwt");
    const headers = {
      "Content-Type": "application/json",
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const requestBody = {
      itemId: itemId,
      destinationInventoryId: parseInt(destinationInventoryId, 10),
      details: details || "",
    };

    const response = await fetch("/api/v1/transfers/request", {
      method: "POST",
      headers: headers,
      body: JSON.stringify(requestBody),
    });

    if (response.ok) {
      const result = await response.json();
      if (window.showSuccessToast) {
        // Check if it was a direct transfer (APPROVED) or pending
        const isDirectTransfer = result.status === "APPROVED";
        if (isDirectTransfer) {
          window.showSuccessToast(
            "¡Transferencia completada!",
            `El item ha sido transferido exitosamente al inventario de destino.`
          );
        } else {
          window.showSuccessToast(
            "Transferencia solicitada",
            `La transferencia ha sido creada con estado PENDIENTE. ID: ${result.transferId}`
          );
        }
      }
      closeTransferItemModal();
      // Reload items to reflect any changes
      await loadItemsData();
    } else {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || "Error al crear la solicitud de transferencia"
      );
    }
  } catch (error) {
    console.error("Error creating transfer request:", error);
    if (window.showErrorToast) {
      // Provide a more user-friendly message for permission errors
      let errorMessage = error.message || "No se pudo crear la solicitud de transferencia";
      let errorTitle = "Error";
      
      if (errorMessage.includes("permisos") || errorMessage.includes("No cuentas")) {
        errorTitle = "Sin permisos para transferir";
        errorMessage = "Solo SUPERADMIN, Administrador Institucional, Administrador Regional, Warehouse, o usuarios asignados al inventario pueden solicitar transferencias.";
      }
      
      window.showErrorToast(errorTitle, errorMessage);
    }
  }
}

// Setup transfer form handler
document.addEventListener("DOMContentLoaded", function () {
  const transferForm = document.getElementById("transferItemForm");
  if (transferForm) {
    transferForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      await confirmTransferItem();
    });
  }
});

// Lend Item Modal Functions
async function showLendItemModal(itemId) {
  const modal = document.getElementById("lendItemModal");
  if (!modal) return;

  // Store current item ID
  if (window.itemsData) {
    window.itemsData.currentItemId = itemId;
  }

  // Find item to show name
  let itemName = "Item";
  if (window.itemsData && window.itemsData.items) {
    const item = window.itemsData.items.find((i) => i.id === itemId);
    if (item) {
      itemName = item.productName || "Sin nombre";
    }
  }

  // Set item name
  const itemNameElement = document.getElementById("lendItemName");
  if (itemNameElement) {
    itemNameElement.textContent = itemName;
  }

  modal.classList.remove("hidden");
}

function closeLendItemModal() {
  const modal = document.getElementById("lendItemModal");
  if (modal) {
    modal.classList.add("hidden");
  }
  const form = document.getElementById("lendItemForm");
  if (form) {
    form.reset();
  }
}

async function confirmLendItem() {
  if (!window.itemsData || !window.itemsData.currentItemId) return;

  const itemId = window.itemsData.currentItemId;
  const responsibleName = document
    .getElementById("lendResponsibleName")
    .value.trim();
  const details = document.getElementById("lendDetails").value.trim();

  if (!responsibleName) {
    if (window.showErrorToast) {
      window.showErrorToast(
        "Campo requerido",
        "Por favor ingresa el nombre del responsable"
      );
    }
    return;
  }

  try {
    if (window.lendItem) {
      const result = await window.lendItem(itemId, responsibleName, details);

      if (window.showSuccessToast) {
        window.showSuccessToast(
          "Item prestado",
          result.message || "El item ha sido prestado exitosamente"
        );
      }

      // Close modal
      closeLendItemModal();

      // Reload items to reflect changes
      if (window.loadItemsData) {
        await window.loadItemsData();
      }
    } else {
      throw new Error("Función lendItem no está disponible");
    }
  } catch (error) {
    console.error("Error lending item:", error);
    if (window.showErrorToast) {
      window.showErrorToast(
        "Error",
        error.message || "No se pudo prestar el item"
      );
    }
  }
}

// Setup lend form handler
document.addEventListener("DOMContentLoaded", function () {
  const lendForm = document.getElementById("lendItemForm");
  if (lendForm) {
    lendForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      await confirmLendItem();
    });
  }
});

// Approve Transfer Modal Functions
async function showApproveTransferModal(itemId) {
  const modal = document.getElementById("approveTransferModal");
  if (!modal) return;

  // Store current item ID
  if (window.itemsData) {
    window.itemsData.currentItemId = itemId;
  }

  modal.classList.remove("hidden");

  // Load pending transfers for this item
  await loadPendingTransfers(itemId);
}

function closeApproveTransferModal() {
  const modal = document.getElementById("approveTransferModal");
  if (modal) {
    modal.classList.add("hidden");
  }
}

function renderApprovalTransferCard(transfer, requestedAt) {
  const escapedItemName = (transfer.itemName || "Item")
    .replace(/'/g, "\\'")
    .replace(/"/g, "&quot;");

  return `
    <div class="bg-white dark:bg-gray-800 rounded-xl p-6 border-2 border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
      <div class="flex items-start justify-between mb-4">
        <div class="flex-1">
          <h4 class="text-lg font-bold text-gray-900 dark:text-white mb-2">${
            transfer.itemName || "Item"
          }</h4>
          <div class="space-y-1">
            <p class="text-sm text-gray-600 dark:text-gray-400">
              <i class="fas fa-user mr-2 text-blue-500"></i>
              Solicitado por: <span class="font-semibold text-gray-800 dark:text-gray-200">${
                transfer.requestedByName || "Usuario"
              }</span>
            </p>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              <i class="fas fa-clock mr-2 text-blue-500"></i>
              ${requestedAt}
            </p>
          </div>
        </div>
        <span class="px-4 py-2 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 rounded-full text-sm font-bold flex items-center gap-2 shadow-sm">
          <i class="fas fa-hourglass-half"></i>
          ${transfer.status}
        </span>
      </div>
      
      <div class="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 rounded-xl p-4 mb-4 space-y-3">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
            <i class="fas fa-warehouse text-white"></i>
          </div>
          <div class="flex-1">
            <p class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-semibold">Desde (Tu inventario)</p>
            <p class="font-semibold text-gray-900 dark:text-white">${
              transfer.sourceInventoryName || "Inventario origen"
            }</p>
          </div>
        </div>
        
        <div class="flex justify-center">
          <div class="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
            <i class="fas fa-arrow-right text-white"></i>
          </div>
        </div>
        
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
            <i class="fas fa-warehouse text-white"></i>
          </div>
          <div class="flex-1">
            <p class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Hacia (Destino)</p>
            <p class="font-semibold text-gray-900 dark:text-white">${
              transfer.destinationInventoryName || "Inventario destino"
            }</p>
          </div>
        </div>
      </div>
      
      ${
        transfer.details
          ? `
        <div class="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 rounded-r-lg">
          <p class="text-sm text-blue-900 dark:text-blue-300">
            <i class="fas fa-info-circle mr-2"></i>
            <strong>Detalles de la solicitud:</strong><br>
            <span class="ml-6">${transfer.details}</span>
          </p>
        </div>
      `
          : ""
      }
      
      <div class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-xl p-3 mb-4">
        <p class="text-sm text-yellow-800 dark:text-yellow-300 flex items-start gap-2">
          <i class="fas fa-exclamation-triangle mt-0.5"></i>
          <span>Al aprobar, el item será transferido inmediatamente al inventario de destino.</span>
        </p>
      </div>
      
      <div class="flex gap-3 mt-4">
        <button onclick="approveTransferDirectly(${
          transfer.id
        }, '${escapedItemName}')"
          class="flex-1 px-6 py-3 bg-gradient-to-r from-[#00AF00] to-[#008800] hover:from-[#008800] hover:to-[#006600] text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg">
          <i class="fas fa-check-circle mr-2"></i>
          Confirmar y Aprobar
        </button>
        <button onclick="cancelTransferDirectly(${transfer.id})"
          class="px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-red-500 hover:text-white text-gray-700 dark:text-gray-300 font-semibold rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
          title="Cancelar transferencia">
          <i class="fas fa-times-circle"></i>
        </button>
      </div>
    </div>
  `;
}

async function loadPendingTransfers(itemId) {
  const content = document.getElementById("approveTransferContent");
  if (!content) return;

  // Show loading
  content.innerHTML = `
        <div class="flex items-center justify-center py-8">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00AF00]"></div>
        </div>
    `;

  try {
    // Get current inventory ID
    const currentInventoryId = window.itemsData
      ? window.itemsData.currentInventoryId
      : null;

    // Fetch transfers for this item (we'll need an endpoint for this)
    // For now, we'll use a mock endpoint structure
    const token = localStorage.getItem("jwt");
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    // Get all transfers and filter by item and status
    const response = await fetch(`/api/v1/transfers/item/${itemId}`, {
      method: "GET",
      headers: headers,
    });

    if (response.ok) {
      const transfers = await response.json();

      // Filter only outgoing transfers (requested by current inventory - to self-approve)
      const outgoingTransfers = transfers.filter((t) => {
        return (
          t.status === "PENDING" && t.sourceInventoryId == currentInventoryId
        );
      });

      if (outgoingTransfers.length === 0) {
        content.innerHTML = `
                    <div class="text-center py-8">
                        <i class="fas fa-inbox text-gray-300 text-5xl mb-4"></i>
                        <p class="text-gray-500 dark:text-gray-400">No hay transferencias pendientes de aprobación para este item</p>
                        <p class="text-xs text-gray-400 dark:text-gray-500 mt-2">Las transferencias que solicites aparecerán aquí para que las apruebes</p>
                    </div>
                `;
        return;
      }

      let html = '<div class="space-y-4">';

      outgoingTransfers.forEach((transfer) => {
        const requestedAt = transfer.requestedAt
          ? new Date(transfer.requestedAt).toLocaleString("es-ES")
          : "N/A";

        html += renderApprovalTransferCard(transfer, requestedAt);
      });

      html += "</div>";
      content.innerHTML = html;
    } else {
      throw new Error("No se pudieron cargar las transferencias");
    }
  } catch (error) {
    console.error("Error loading pending transfers:", error);
    content.innerHTML = `
            <div class="text-center py-8">
                <i class="fas fa-exclamation-triangle text-red-500 text-4xl mb-4"></i>
                <p class="text-red-600 dark:text-red-400">Error al cargar las transferencias pendientes</p>
                <button onclick="loadPendingTransfers(${itemId})" class="mt-4 bg-[#00AF00] hover:bg-[#008800] text-white font-semibold py-2 px-4 rounded-xl transition-colors">
                    Reintentar
                </button>
            </div>
        `;
  }
}

async function approveTransferDirectly(transferId, itemName) {
  if (
    !confirm(
      `¿Confirmar la transferencia del item "${itemName}" al inventario de destino?\n\nEsta acción moverá el item inmediatamente.`
    )
  ) {
    return;
  }

  try {
    const token = localStorage.getItem("jwt");
    const headers = {
      "Content-Type": "application/json",
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const response = await fetch(`/api/v1/transfers/${transferId}/approve`, {
      method: "POST",
      headers: headers,
      body: JSON.stringify({
        approvalNotes: "Auto-aprobado por el solicitante",
      }),
    });

    if (response.ok) {
      const result = await response.json();
      if (window.showSuccessToast) {
        window.showSuccessToast(
          "¡Transferencia Completada!",
          `El item "${itemName}" ha sido transferido exitosamente al inventario de destino.`
        );
      }
      closeApproveTransferModal();
      // Reload items to reflect the transfer (item will be removed from current inventory)
      await loadItemsData();
    } else {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Error al aprobar la transferencia");
    }
  } catch (error) {
    console.error("Error approving transfer:", error);
    if (window.showErrorToast) {
      window.showErrorToast(
        "Error al Aprobar",
        error.message ||
          "No se pudo completar la transferencia. Inténtalo de nuevo."
      );
    }
  }
}

async function cancelTransferDirectly(transferId) {
  if (
    !confirm(
      "¿Estás seguro de que deseas cancelar esta solicitud de transferencia?"
    )
  ) {
    return;
  }

  try {
    const token = localStorage.getItem("jwt");
    const headers = {
      "Content-Type": "application/json",
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    // Note: We'll need to add a cancel/delete endpoint
    const response = await fetch(`/api/v1/transfers/${transferId}/cancel`, {
      method: "DELETE",
      headers: headers,
    });

    if (response.ok) {
      if (window.showSuccessToast) {
        window.showSuccessToast(
          "Transferencia Cancelada",
          "La solicitud de transferencia ha sido cancelada exitosamente."
        );
      }
      closeApproveTransferModal();
      await loadItemsData();
    } else {
      // If endpoint doesn't exist yet, try delete endpoint
      const deleteResponse = await fetch(`/api/v1/transfers/${transferId}`, {
        method: "DELETE",
        headers: headers,
      });

      if (deleteResponse.ok) {
        if (window.showSuccessToast) {
          window.showSuccessToast(
            "Transferencia Cancelada",
            "La solicitud de transferencia ha sido cancelada."
          );
        }
        closeApproveTransferModal();
        await loadItemsData();
      } else {
        if (window.showErrorToast) {
          window.showErrorToast(
            "Funcionalidad no disponible",
            "La función de cancelar transferencias aún no está implementada en el backend."
          );
        }
      }
    }
  } catch (error) {
    console.error("Error cancelling transfer:", error);
    if (window.showErrorToast) {
      window.showErrorToast("Error", "No se pudo cancelar la transferencia.");
    }
  }
}

// Item Transfer History Modal Functions
async function showItemTransferHistoryModal(itemId) {
  const modal = document.getElementById("itemTransferHistoryModal");
  if (!modal) return;

  // Store current item ID
  if (window.itemsData) {
    window.itemsData.currentItemId = itemId;
  }

  // Set item name
  let itemName = "Item";
  if (window.itemsData && window.itemsData.items) {
    const item = window.itemsData.items.find((i) => i.id === itemId);
    if (item) {
      itemName = item.productName || "Sin nombre";
    }
  }

  const itemNameElement = document.getElementById("historyItemName");
  if (itemNameElement) {
    itemNameElement.textContent = itemName;
  }

  modal.classList.remove("hidden");

  // Load transfer history for this item
  await loadItemTransferHistory(itemId);
}

function closeItemTransferHistoryModal() {
  const modal = document.getElementById("itemTransferHistoryModal");
  if (modal) {
    modal.classList.add("hidden");
  }
}

function getStatusBadgeClass(status) {
  const statusClasses = {
    PENDING:
      "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400",
    APPROVED:
      "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400",
    COMPLETED:
      "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400",
    REJECTED: "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400",
    CANCELLED: "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-400",
  };
  return (
    statusClasses[status] ||
    "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-400"
  );
}

function getStatusIcon(status) {
  const statusIcons = {
    PENDING: "fa-hourglass-half",
    APPROVED: "fa-check-circle",
    COMPLETED: "fa-check-double",
    REJECTED: "fa-times-circle",
    CANCELLED: "fa-ban",
  };
  return statusIcons[status] || "fa-question-circle";
}

function renderTransferHistoryCard(transfer) {
  const requestedAt = transfer.requestedAt
    ? new Date(transfer.requestedAt).toLocaleString("es-ES")
    : "N/A";
  const completedAt = transfer.completedAt
    ? new Date(transfer.completedAt).toLocaleString("es-ES")
    : null;

  const statusClass = getStatusBadgeClass(transfer.status);
  const statusIcon = getStatusIcon(transfer.status);

  // Determine if this transfer is outgoing (source) or incoming (destination)
  const currentInventoryId = window.itemsData
    ? window.itemsData.currentInventoryId
    : null;
  const isOutgoing = transfer.sourceInventoryId == currentInventoryId;
  const direction = isOutgoing ? "Salida" : "Entrada";
  const directionColor = isOutgoing
    ? "text-red-600 dark:text-red-400"
    : "text-green-600 dark:text-green-400";
  const directionIcon = isOutgoing ? "fa-arrow-up" : "fa-arrow-down";

  return `
    <div class="bg-white dark:bg-gray-800 rounded-xl p-6 border-2 border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
      <div class="flex items-start justify-between mb-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 ${
            isOutgoing
              ? "bg-red-100 dark:bg-red-900/30"
              : "bg-green-100 dark:bg-green-900/30"
          } rounded-full flex items-center justify-center">
            <i class="fas ${directionIcon} ${directionColor}"></i>
          </div>
          <div>
            <h4 class="text-lg font-bold text-gray-900 dark:text-white">${direction}</h4>
            <p class="text-sm text-gray-600 dark:text-gray-400">ID: ${
              transfer.transferId || transfer.id
            }</p>
          </div>
        </div>
        <span class="px-4 py-2 ${statusClass} rounded-full text-sm font-bold flex items-center gap-2 shadow-sm">
          <i class="fas ${statusIcon}"></i>
          ${transfer.status}
        </span>
      </div>
      
      <div class="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-4 mb-4 space-y-3">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
            <i class="fas fa-warehouse text-white"></i>
          </div>
          <div class="flex-1">
            <p class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-semibold">Origen</p>
            <p class="font-semibold text-gray-900 dark:text-white">${
              transfer.sourceInventoryName || "Inventario origen"
            }</p>
          </div>
        </div>
        
        <div class="flex justify-center">
          <div class="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
            <i class="fas fa-arrow-right text-white"></i>
          </div>
        </div>
        
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
            <i class="fas fa-warehouse text-white"></i>
          </div>
          <div class="flex-1">
            <p class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Destino</p>
            <p class="font-semibold text-gray-900 dark:text-white">${
              transfer.destinationInventoryName || "Inventario destino"
            }</p>
          </div>
        </div>
      </div>
      
      <div class="space-y-2 text-sm">
        <div class="flex items-start gap-2">
          <i class="fas fa-user text-blue-500 mt-1"></i>
          <div>
            <p class="text-gray-600 dark:text-gray-400">Solicitado por:</p>
            <p class="font-semibold text-gray-800 dark:text-gray-200">${
              transfer.requestedByName || "Usuario"
            }</p>
          </div>
        </div>
        
        <div class="flex items-start gap-2">
          <i class="fas fa-clock text-blue-500 mt-1"></i>
          <div>
            <p class="text-gray-600 dark:text-gray-400">Fecha de solicitud:</p>
            <p class="font-semibold text-gray-800 dark:text-gray-200">${requestedAt}</p>
          </div>
        </div>
        
        ${
          completedAt
            ? `
          <div class="flex items-start gap-2">
            <i class="fas fa-check text-green-500 mt-1"></i>
            <div>
              <p class="text-gray-600 dark:text-gray-400">Fecha de completado:</p>
              <p class="font-semibold text-gray-800 dark:text-gray-200">${completedAt}</p>
            </div>
          </div>
        `
            : ""
        }
        
        ${
          transfer.details
            ? `
          <div class="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 rounded-r-lg">
            <p class="text-sm text-blue-900 dark:text-blue-300">
              <i class="fas fa-info-circle mr-2"></i>
              <strong>Detalles:</strong><br>
              <span class="ml-6">${transfer.details}</span>
            </p>
          </div>
        `
            : ""
        }
        
        ${
          transfer.approvalNotes
            ? `
          <div class="mt-2 p-4 bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 rounded-r-lg">
            <p class="text-sm text-green-900 dark:text-green-300">
              <i class="fas fa-comment mr-2"></i>
              <strong>Notas de aprobación:</strong><br>
              <span class="ml-6">${transfer.approvalNotes}</span>
            </p>
          </div>
        `
            : ""
        }
      </div>
    </div>
  `;
}

async function loadItemTransferHistory(itemId) {
  const content = document.getElementById("itemTransferHistoryContent");
  if (!content) return;

  // Show loading
  content.innerHTML = `
    <div class="flex items-center justify-center py-8">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00AF00]"></div>
    </div>
  `;

  try {
    // Get current inventory ID
    const currentInventoryId = window.itemsData
      ? window.itemsData.currentInventoryId
      : null;

    if (!currentInventoryId) {
      throw new Error("No se pudo obtener el ID del inventario actual");
    }

    // Fetch transfers for this inventory
    const token = localStorage.getItem("jwt");
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const response = await fetch(
      `/api/v1/transfers/inventory/${currentInventoryId}`,
      {
        method: "GET",
        headers: headers,
      }
    );

    if (response.ok) {
      const allTransfers = await response.json();

      // Filter transfers that involve this specific item
      const itemTransfers = allTransfers.filter(
        (t) => t.itemId === itemId || t.item?.id === itemId
      );

      if (itemTransfers.length === 0) {
        content.innerHTML = `
          <div class="text-center py-12">
            <i class="fas fa-inbox text-gray-300 dark:text-gray-600 text-5xl mb-4"></i>
            <p class="text-gray-500 dark:text-gray-400 text-lg">No hay transferencias registradas para este item</p>
            <p class="text-xs text-gray-400 dark:text-gray-500 mt-2">Las transferencias que se realicen aparecerán aquí</p>
          </div>
        `;
        return;
      }

      // Sort transfers by date (most recent first)
      itemTransfers.sort((a, b) => {
        const dateA = a.requestedAt ? new Date(a.requestedAt) : new Date(0);
        const dateB = b.requestedAt ? new Date(b.requestedAt) : new Date(0);
        return dateB - dateA;
      });

      let html = '<div class="space-y-4">';
      itemTransfers.forEach((transfer) => {
        html += renderTransferHistoryCard(transfer);
      });
      html += "</div>";

      content.innerHTML = html;
    } else {
      throw new Error("No se pudieron cargar las transferencias");
    }
  } catch (error) {
    console.error("Error loading item transfer history:", error);
    content.innerHTML = `
      <div class="text-center py-12">
        <i class="fas fa-exclamation-triangle text-red-500 text-5xl mb-4"></i>
        <p class="text-red-600 dark:text-red-400 text-lg">Error al cargar el historial de transferencias</p>
        <p class="text-gray-600 dark:text-gray-400 text-sm mt-2">${error.message}</p>
        <button onclick="loadItemTransferHistory(${itemId})" class="mt-4 bg-[#00AF00] hover:bg-[#008800] text-white font-semibold py-2 px-4 rounded-xl transition-colors">
          <i class="fas fa-sync-alt mr-2"></i>
          Reintentar
        </button>
      </div>
    `;
  }
}

// Export functions globally
window.loadItemsData = loadItemsData;
window.showViewItemModal = showViewItemModal;
window.closeViewItemModal = closeViewItemModal;
window.showNewItemModal = showNewItemModal;
window.closeNewItemModal = closeNewItemModal;
window.showEditItemModal = showEditItemModal;
window.closeEditItemModal = closeEditItemModal;
window.showDeleteItemModal = showDeleteItemModal;
window.closeDeleteItemModal = closeDeleteItemModal;
window.confirmDeleteItem = confirmDeleteItem;
window.deleteItemImageFromModal = deleteItemImageFromModal;
window.checkTransferPermissions = checkTransferPermissions;
window.showTransferItemModal = showTransferItemModal;
window.closeTransferItemModal = closeTransferItemModal;
window.confirmTransferItem = confirmTransferItem;
window.showLendItemModal = showLendItemModal;
window.closeLendItemModal = closeLendItemModal;
window.confirmLendItem = confirmLendItem;
window.showApproveTransferModal = showApproveTransferModal;
window.closeApproveTransferModal = closeApproveTransferModal;
window.renderApprovalTransferCard = renderApprovalTransferCard;
window.loadPendingTransfers = loadPendingTransfers;
window.approveTransferDirectly = approveTransferDirectly;
window.cancelTransferDirectly = cancelTransferDirectly;
window.showItemTransferHistoryModal = showItemTransferHistoryModal;
window.closeItemTransferHistoryModal = closeItemTransferHistoryModal;
window.loadItemTransferHistory = loadItemTransferHistory;
window.navigateCarousel = navigateCarousel;

// Store item loans data globally for filtering
let itemLoansData = {
    allLoans: [],
    currentFilter: 'all'
};

async function showItemLoansHistoryModal(itemId) {
    const modal = document.getElementById("itemLoansHistoryModal");
    if (!modal) return;

    // Store current item ID
    if (window.itemsData) {
        window.itemsData.currentItemId = itemId;
    }

    // Set item name
    let itemName = "Item";
    if (window.itemsData && window.itemsData.items) {
        const item = window.itemsData.items.find((i) => i.id === itemId);
        if (item) {
            itemName = item.productName || "Sin nombre";
        }
    }

    const itemNameElement = document.getElementById("loansHistoryItemName");
    if (itemNameElement) {
        itemNameElement.textContent = itemName;
    }

    modal.classList.remove("hidden");

    // Show loading state
    const contentElement = document.getElementById("itemLoansHistoryContent");
    const statsElement = document.getElementById("itemLoansStats");
    const filtersElement = document.getElementById("itemLoansFilters");
    
    if (contentElement) {
        contentElement.innerHTML = `
            <div class="flex items-center justify-center py-8">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
            </div>
        `;
    }
    if (statsElement) statsElement.style.display = 'none';
    if (filtersElement) filtersElement.style.display = 'none';

    // Load loans history for this item
    await loadItemLoansHistory(itemId);
}

function closeItemLoansHistoryModal() {
    const modal = document.getElementById("itemLoansHistoryModal");
    if (modal) {
        modal.classList.add("hidden");
    }
    
    // Reset filter state
    itemLoansData.currentFilter = 'all';
    itemLoansData.allLoans = [];
}

async function loadItemLoansHistory(itemId) {
    try {
        const token = localStorage.getItem('jwt');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(`/api/v1/loan/item/${itemId}`, {
            method: 'GET',
            headers: headers
        });

        let loans = [];
        if (response.ok) {
            loans = await response.json();
        } else {
            throw new Error('Error al cargar el historial de préstamos');
        }

        // Store loans globally
        itemLoansData.allLoans = loans;
        itemLoansData.currentFilter = 'all';

        // Display loans with statistics
        displayItemLoansHistory(loans);
    } catch (error) {
        console.error('Error loading item loans history:', error);
        const contentElement = document.getElementById("itemLoansHistoryContent");
        if (contentElement) {
            contentElement.innerHTML = `
                <div class="text-center py-12">
                    <i class="fas fa-exclamation-triangle text-red-500 text-4xl mb-4"></i>
                    <p class="text-red-600 dark:text-red-400 mb-4">Error al cargar el historial de préstamos</p>
                    <button onclick="loadItemLoansHistory(${itemId})" class="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors">
                        Reintentar
                    </button>
                </div>
            `;
        }
        if (window.showErrorToast) {
            window.showErrorToast('Error', 'No se pudo cargar el historial de préstamos');
        }
    }
}

function displayItemLoansHistory(loans) {
    const contentElement = document.getElementById("itemLoansHistoryContent");
    const statsElement = document.getElementById("itemLoansStats");
    const filtersElement = document.getElementById("itemLoansFilters");

    if (!contentElement) return;

    // Calculate statistics
    const totalLoans = loans.length;
    const activeLoans = loans.filter(loan => !loan.returned).length;
    const returnedLoans = loans.filter(loan => loan.returned === true).length;

    // Update statistics
    if (statsElement) {
        document.getElementById('itemTotalLoansCount').textContent = totalLoans;
        document.getElementById('itemActiveLoansCount').textContent = activeLoans;
        document.getElementById('itemReturnedLoansCount').textContent = returnedLoans;
        statsElement.style.display = 'grid';
    }

    // Show filters if there are loans
    if (filtersElement && totalLoans > 0) {
        filtersElement.style.display = 'flex';
        // Reset filter buttons
        document.getElementById('itemFilterAll').className = 'px-4 py-2 rounded-lg font-medium transition-colors bg-cyan-600 text-white';
        document.getElementById('itemFilterActive').className = 'px-4 py-2 rounded-lg font-medium transition-colors bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600';
        document.getElementById('itemFilterReturned').className = 'px-4 py-2 rounded-lg font-medium transition-colors bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600';
    }

    // Filter loans based on current filter
    let filteredLoans = loans;
    if (itemLoansData.currentFilter === 'active') {
        filteredLoans = loans.filter(loan => !loan.returned);
    } else if (itemLoansData.currentFilter === 'returned') {
        filteredLoans = loans.filter(loan => loan.returned === true);
    }

    if (!filteredLoans || filteredLoans.length === 0) {
        const emptyMessage = itemLoansData.currentFilter === 'all' 
            ? 'Este item no tiene préstamos registrados'
            : itemLoansData.currentFilter === 'active'
            ? 'Este item no tiene préstamos activos'
            : 'Este item no tiene préstamos devueltos';
        contentElement.innerHTML = `
            <div class="text-center py-12">
                <i class="fas fa-inbox text-4xl text-gray-400 dark:text-gray-500 mb-4"></i>
                <p class="text-gray-600 dark:text-gray-400 text-lg">${emptyMessage}</p>
            </div>
        `;
        return;
    }

    contentElement.innerHTML = filteredLoans.map(loan => {
        const lendDate = loan.lendAt ? new Date(loan.lendAt).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }) : 'Fecha no disponible';

        const returnDate = loan.returnAt ? new Date(loan.returnAt).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }) : null;

        const isReturned = loan.returned === true;
        const statusBadge = isReturned 
            ? '<span class="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 rounded-full text-xs font-semibold"><i class="fas fa-check-circle mr-1"></i>Devuelto</span>'
            : '<span class="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 rounded-full text-xs font-semibold"><i class="fas fa-clock mr-1"></i>Prestado</span>';

        // Calculate duration if returned
        let durationInfo = '';
        if (isReturned && loan.lendAt && loan.returnAt) {
            const lendDateObj = new Date(loan.lendAt);
            const returnDateObj = new Date(loan.returnAt);
            const diffTime = Math.abs(returnDateObj - lendDateObj);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            durationInfo = `<div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                <i class="fas fa-hourglass-half"></i> Duración: ${diffDays} día${diffDays !== 1 ? 's' : ''}
            </div>`;
        } else if (!isReturned && loan.lendAt) {
            const lendDateObj = new Date(loan.lendAt);
            const now = new Date();
            const diffTime = Math.abs(now - lendDateObj);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            durationInfo = `<div class="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                <i class="fas fa-hourglass-half"></i> Prestado hace: ${diffDays} día${diffDays !== 1 ? 's' : ''}
            </div>`;
        }

        return `
            <div class="loan-card bg-white dark:bg-gray-800 border ${isReturned ? 'border-green-200 dark:border-green-800' : 'border-yellow-200 dark:border-yellow-800'} rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <div class="flex items-start justify-between mb-4">
                    <div class="flex-1">
                        <div class="flex items-center gap-3 mb-2">
                            <div class="w-10 h-10 ${isReturned ? 'bg-green-100 dark:bg-green-900/30' : 'bg-yellow-100 dark:bg-yellow-900/30'} rounded-full flex items-center justify-center">
                                <i class="fas fa-user ${isReturned ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}"></i>
                            </div>
                            <div class="flex-1">
                                <h4 class="text-lg font-bold text-gray-900 dark:text-white">Responsable: ${loan.responsibleName || 'N/A'}</h4>
                                <p class="text-sm text-gray-600 dark:text-gray-400">Prestado por: ${loan.lenderName || 'N/A'}</p>
                                ${durationInfo}
                            </div>
                        </div>
                        ${loan.detailsLend ? `
                            <div class="mt-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-sm text-gray-600 dark:text-gray-300">
                                <i class="fas fa-info-circle text-gray-400 dark:text-gray-500 mr-1"></i>
                                <strong>Detalles del préstamo:</strong> ${loan.detailsLend}
                            </div>
                        ` : ''}
                        ${isReturned && loan.detailsReturn ? `
                            <div class="mt-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-sm text-gray-600 dark:text-gray-300">
                                <i class="fas fa-check-circle text-green-600 dark:text-green-400 mr-1"></i>
                                <strong>Detalles de devolución:</strong> ${loan.detailsReturn}
                            </div>
                        ` : ''}
                    </div>
                    ${statusBadge}
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div class="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <i class="fas fa-calendar-alt text-gray-400 dark:text-gray-500"></i>
                        <span><strong>Fecha de préstamo:</strong> ${lendDate}</span>
                    </div>
                    ${returnDate ? `
                        <div class="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <i class="fas fa-calendar-check text-gray-400 dark:text-gray-500"></i>
                            <span><strong>Fecha de devolución:</strong> ${returnDate}</span>
                        </div>
                    ` : '<div class="text-gray-400 dark:text-gray-500 text-xs">Pendiente de devolución</div>'}
                </div>
            </div>
        `;
    }).join('');
}

function filterItemLoans(filter) {
    itemLoansData.currentFilter = filter;
    
    // Update filter buttons
    document.getElementById('itemFilterAll').className = filter === 'all' 
        ? 'px-4 py-2 rounded-lg font-medium transition-colors bg-cyan-600 text-white'
        : 'px-4 py-2 rounded-lg font-medium transition-colors bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600';
    
    document.getElementById('itemFilterActive').className = filter === 'active'
        ? 'px-4 py-2 rounded-lg font-medium transition-colors bg-cyan-600 text-white'
        : 'px-4 py-2 rounded-lg font-medium transition-colors bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600';
    
    document.getElementById('itemFilterReturned').className = filter === 'returned'
        ? 'px-4 py-2 rounded-lg font-medium transition-colors bg-cyan-600 text-white'
        : 'px-4 py-2 rounded-lg font-medium transition-colors bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600';

    // Re-display loans with new filter
    displayItemLoansHistory(itemLoansData.allLoans);
}

window.showItemLoansHistoryModal = showItemLoansHistoryModal;
window.closeItemLoansHistoryModal = closeItemLoansHistoryModal;
window.filterItemLoans = filterItemLoans;
window.goToCarouselImage = goToCarouselImage;
window.populateViewItemModal = populateViewItemModal;
