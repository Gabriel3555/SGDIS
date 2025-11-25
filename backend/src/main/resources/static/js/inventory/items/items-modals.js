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
    // Generate all image elements
    const imageElements = images
      .map((imgUrl, index) => {
        const escapedUrl = imgUrl.replace(/'/g, "\\'").replace(/"/g, "&quot;");
        return `
            <img src="${escapedUrl}" alt="${productName} - Imagen ${index + 1}" 
                 class="absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
                   index === 0 ? "opacity-100" : "opacity-0"
                 }" 
                 id="${carouselId}-img-${index}"
                 data-index="${index}">
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
  if (!window.itemsData || !window.itemsData.currentItemId) return;

  const itemId = window.itemsData.currentItemId;

  try {
    // Note: There's no delete endpoint in ItemController, so we'll need to add it
    // For now, we'll show an error
    if (window.showErrorToast) {
      window.showErrorToast(
        "Error",
        "La funcionalidad de eliminar items aún no está implementada"
      );
    }
    closeDeleteItemModal();
  } catch (error) {
    console.error("Error deleting item:", error);
    if (window.showErrorToast) {
      window.showErrorToast("Error", "No se pudo eliminar el item");
    }
  }
}

async function showTransferItemModal(itemId) {
  const modal = document.getElementById("transferItemModal");
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
  const itemNameElement = document.getElementById("transferItemName");
  if (itemNameElement) {
    itemNameElement.textContent = itemName;
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

    // Load all inventories
    const token = localStorage.getItem("jwt");
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const response = await fetch("/api/v1/inventory", {
      method: "GET",
      headers: headers,
    });

    if (response.ok) {
      const inventories = await response.json();

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
        window.showSuccessToast(
          "Transferencia solicitada",
          `La transferencia ha sido creada con estado ${
            result.status || "PENDING"
          }. ID: ${result.transferId}`
        );
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
      window.showErrorToast(
        "Error",
        error.message || "No se pudo crear la solicitud de transferencia"
      );
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
window.goToCarouselImage = goToCarouselImage;
window.populateViewItemModal = populateViewItemModal;
