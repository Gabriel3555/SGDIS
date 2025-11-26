// Inventory Tree Hierarchy Component
// This file handles the tree visualization for inventory hierarchy using D3.js

// Encapsulate tree state to avoid variable conflicts
const inventoryTreeState = {
    currentInventoryId: null,
    treeData: null,
    treeSvg: null,
    treeG: null,
  treeZoom: null,
};

// Fetch inventory users (owner, managers, signatories)
async function fetchInventoryUsers(inventoryId) {
    try {
    const token = localStorage.getItem("jwt");
        if (!token) {
      throw new Error("No authentication token found");
        }

        const response = await fetch(`/api/v1/inventory/${inventoryId}/users`, {
      method: "GET",
            headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
        });

        if (!response.ok) {
            if (response.status === 404) {
        throw new Error("Inventario no encontrado");
            } else if (response.status === 401) {
        throw new Error("Sesión expirada. Por favor inicia sesión nuevamente.");
            } else if (response.status === 403) {
        throw new Error("No tienes permisos para ver esta información.");
            }
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
    console.error("Error fetching inventory users:", error);
        throw error;
    }
}

// Transform API data to hierarchical structure for D3
// Structure: Inventario -> Owner -> Signatories (horizontal) -> Managers (horizontal)
function transformToTreeData(apiData, inventoryName, inventoryImgUrl) {
    const root = {
    name: inventoryName || "Inventario",
    type: "inventory",
        id: inventoryTreeState.currentInventoryId,
    inventoryImgUrl: inventoryImgUrl || null,
    children: [],
    };

    // Nivel 2: Owner (Propietario) - directly connected to inventory
    let ownerNode = null;
    if (apiData.owner) {
        ownerNode = {
      name: apiData.owner.fullName || "Sin nombre",
      type: "owner",
            userId: apiData.owner.userId,
            imgUrl: apiData.owner.imgUrl || null,
      role: "Propietario",
      children: [],
    };
    root.children.push(ownerNode);
  } else {
    // If no owner, create placeholder
    ownerNode = {
      name: "Sin propietario",
      type: "empty-owner",
      children: [],
        };
        root.children.push(ownerNode);
    }

  // Nivel 3: Create intermediate node for signatories level
  const signaturesLevelNode = {
    name: "Firmantes",
    type: "level-signatories",
    children: [],
  };

  // Add all signatories as children of the level node
    if (apiData.signatories && apiData.signatories.length > 0) {
    apiData.signatories.forEach((signatory) => {
      signaturesLevelNode.children.push({
        name: signatory.fullName || "Sin nombre",
        type: "signatory",
                userId: signatory.userId,
                imgUrl: signatory.imgUrl || null,
        role: "Firmante",
        children: [],
      });
    });
        } else {
    // Add placeholder if no signatories
    signaturesLevelNode.children.push({
      name: "Sin firmantes",
      type: "empty",
      children: [],
    });
  }

  ownerNode.children.push(signaturesLevelNode);

  // Nivel 4: Create intermediate node for managers level
  const managersLevelNode = {
    name: "Manejadores",
    type: "level-managers",
    children: [],
  };

  // Add all managers as children of the level node
    if (apiData.managers && apiData.managers.length > 0) {
    apiData.managers.forEach((manager) => {
      managersLevelNode.children.push({
        name: manager.fullName || "Sin nombre",
        type: "manager",
                userId: manager.userId,
                imgUrl: manager.imgUrl || null,
        role: "Manejador",
        children: [],
      });
    });
        } else {
    // Add placeholder if no managers
    managersLevelNode.children.push({
      name: "Sin manejadores",
      type: "empty",
      children: [],
    });
  }

  signaturesLevelNode.children.push(managersLevelNode);

    return root;
}

// Show inventory tree modal
async function showInventoryTreeModal(inventoryId, inventoryName, inventoryImgUrl) {
    inventoryTreeState.currentInventoryId = inventoryId;
    
  const modal = document.getElementById("inventoryTreeModal");
    if (!modal) {
    console.error("Inventory tree modal not found");
        return;
    }

    // Show modal
  modal.classList.remove("hidden");
    
    // Show loading state
  const treeContainer = document.getElementById("inventoryTreeContainer");
  const loadingSpinner = document.getElementById("inventoryTreeLoading");
    
    if (treeContainer) {
    treeContainer.innerHTML = "";
    }
    if (loadingSpinner) {
    loadingSpinner.classList.remove("hidden");
    }

    // Set inventory name in modal
  const inventoryNameElement = document.getElementById("inventoryTreeName");
    if (inventoryNameElement) {
    inventoryNameElement.textContent =
      inventoryName || `Inventario #${inventoryId}`;
    }

    try {
        // Load D3 if not already loaded
        await loadD3Library();
        
        // Fetch data
        const apiData = await fetchInventoryUsers(inventoryId);
        
        // Transform to tree structure
    inventoryTreeState.treeData = transformToTreeData(apiData, inventoryName, inventoryImgUrl);
        
        // Hide loading
        if (loadingSpinner) {
      loadingSpinner.classList.add("hidden");
        }
        
        // Render tree
        renderInventoryTree(inventoryTreeState.treeData);
    } catch (error) {
    console.error("Error loading inventory tree:", error);
        
        // Hide loading
        if (loadingSpinner) {
      loadingSpinner.classList.add("hidden");
        }
        
        // Show error
        if (treeContainer) {
            treeContainer.innerHTML = `
                <div class="flex flex-col items-center justify-center p-8 text-center">
                    <i class="fas fa-exclamation-triangle text-red-500 text-5xl mb-4"></i>
                    <h3 class="text-xl font-semibold text-gray-800 dark:text-white mb-2">Error al cargar el árbol</h3>
                    <p class="text-gray-600 dark:text-gray-400 mb-4">${
                      error.message
                    }</p>
                    <button onclick="showInventoryTreeModal(${inventoryId}, '${(
        inventoryName || ""
      ).replace(/'/g, "\\'")}')" 
                        class="px-4 py-2 bg-[#00AF00] hover:bg-[#008800] text-white rounded-xl transition-colors">
                        <i class="fas fa-redo mr-2"></i>
                        Reintentar
                    </button>
                </div>
            `;
        }
    }
}

// Close inventory tree modal
function closeInventoryTreeModal() {
  const modal = document.getElementById("inventoryTreeModal");
    if (modal) {
    modal.classList.add("hidden");
    }
    
    // Clear tree
    if (inventoryTreeState.treeSvg) {
        inventoryTreeState.treeSvg.remove();
        inventoryTreeState.treeSvg = null;
        inventoryTreeState.treeG = null;
        inventoryTreeState.treeZoom = null;
    }
    
  const treeContainer = document.getElementById("inventoryTreeContainer");
    if (treeContainer) {
    treeContainer.innerHTML = "";
    }
    
    inventoryTreeState.currentInventoryId = null;
    inventoryTreeState.treeData = null;
}

// Refresh/reload the currently open inventory tree
async function refreshInventoryTree() {
  if (!inventoryTreeState.currentInventoryId) {
    console.warn("No inventory tree is currently open to refresh");
    return false;
  }

  const modal = document.getElementById("inventoryTreeModal");
  if (!modal || modal.classList.contains("hidden")) {
    console.warn("Inventory tree modal is not currently visible");
    return false;
  }

  try {
    const inventoryId = inventoryTreeState.currentInventoryId;
    const inventoryNameElement = document.getElementById("inventoryTreeName");
    const inventoryName = inventoryNameElement
      ? inventoryNameElement.textContent
      : `Inventario #${inventoryId}`;

    // Show loading state
    const treeContainer = document.getElementById("inventoryTreeContainer");
    const loadingSpinner = document.getElementById("inventoryTreeLoading");

    if (treeContainer) {
      treeContainer.innerHTML = "";
    }
    if (loadingSpinner) {
      loadingSpinner.classList.remove("hidden");
    }

    // Fetch updated data
    const apiData = await fetchInventoryUsers(inventoryId);
    
    // Get inventory image URL from stored tree data or fetch it
    let inventoryImgUrl = null;
    if (inventoryTreeState.treeData && inventoryTreeState.treeData.inventoryImgUrl) {
      inventoryImgUrl = inventoryTreeState.treeData.inventoryImgUrl;
    }

    // Transform to tree structure
    inventoryTreeState.treeData = transformToTreeData(apiData, inventoryName, inventoryImgUrl);

    // Hide loading
    if (loadingSpinner) {
      loadingSpinner.classList.add("hidden");
    }

    // Render updated tree
    renderInventoryTree(inventoryTreeState.treeData);

    return true;
  } catch (error) {
    console.error("Error refreshing inventory tree:", error);
    return false;
  }
}

// Load D3 library from CDN
function loadD3Library() {
    return new Promise((resolve, reject) => {
        // Check if already loaded
    if (typeof d3 !== "undefined") {
            resolve();
            return;
        }

    const d3Script = document.createElement("script");
    d3Script.src = "https://d3js.org/d3.v7.min.js";
        d3Script.onload = () => {
      if (typeof d3 !== "undefined") {
                resolve();
            } else {
        reject(new Error("Failed to load D3 library"));
            }
        };
    d3Script.onerror = () => reject(new Error("Failed to load D3 library"));
        document.head.appendChild(d3Script);
    });
}

// Render tree using D3 - Horizontal levels design
function renderInventoryTree(data) {
  const container = document.getElementById("inventoryTreeContainer");
    if (!container) {
    console.error("Tree container not found");
        return;
    }

    // Clear previous tree
  container.innerHTML = "";

    // Get container dimensions
    const width = container.clientWidth;
    const height = container.clientHeight || 600;

    // Create SVG
  inventoryTreeState.treeSvg = d3
    .select(container)
    .append("svg")
    .attr("width", width)
    .attr("height", height);

    // Create main group
  inventoryTreeState.treeG = inventoryTreeState.treeSvg.append("g");

  // Calculate center and spacing
  const centerX = width / 2;
  const nodeSpacing = 120; // Horizontal spacing between nodes
  const labelWidth = 200; // Width reserved for labels on the left

  // Define level configuration
  const levelConfig = {
    inventory: {
      color: "#00AF00",
      radius: 30,
      stroke: 3,
      y: 100,
    },
    owner: {
      color: "#008800",
      radius: 25,
      stroke: 2.5,
      y: 220,
    },
    signatory: {
      color: "#FF8C00",
      radius: 20,
      stroke: 2,
      y: 340,
    },
    manager: {
      color: "#0066CC",
      radius: 20,
      stroke: 2,
      y: 460,
    },
    empty: {
      color: "#9ca3af",
      radius: 15,
      stroke: 2,
    },
  };

  // Detect dark mode
  const isDarkMode = document.documentElement.classList.contains("dark");

  // Extract data from hierarchical structure
  const inventoryNode = {
    name: data.name || `Inventario ${data.id}`,
    type: "inventory",
    id: data.id,
    inventoryImgUrl: data.inventoryImgUrl || null,
  };

  const ownerNode =
    data.children && data.children[0]
      ? {
          name:
            data.children[0].name ||
            data.children[0].email ||
            `Usuario ${data.children[0].userId}`,
          type: data.children[0].type,
          userId: data.children[0].userId,
          imgUrl: data.children[0].imgUrl,
        }
      : null;

  // Extract signatories
  let signatories = [];
  if (ownerNode && data.children[0].children && data.children[0].children[0]) {
    const sigLevel = data.children[0].children[0];
    if (sigLevel.children && sigLevel.children.length > 0) {
      signatories = sigLevel.children
        .filter((child) => child.type === "signatory")
        .map((child) => ({
          ...child,
          name: child.name || child.email || `Usuario ${child.userId}`,
        }));
    }
  }

  // Extract managers
  let managers = [];
  if (
    data.children[0] &&
    data.children[0].children &&
    data.children[0].children[0]
  ) {
    // Look for managers in the hierarchy
    if (data.children[0].children[0].children) {
      const manLevel = data.children[0].children[0].children.find(
        (child) => child.type === "level-managers"
      );
      if (manLevel && manLevel.children) {
        managers = manLevel.children
          .filter((child) => child.type === "manager")
          .map((child) => ({
            ...child,
            name: child.name || child.email || `Usuario ${child.userId}`,
          }));
      }
    }
  }

  // If no signatories found, try alternative path
  if (signatories.length === 0 && ownerNode && data.children[0].children) {
    const sigLevel = data.children[0].children.find(
      (c) => c.type === "level-signatories"
    );
    if (sigLevel && sigLevel.children) {
      signatories = sigLevel.children
        .filter((child) => child.type === "signatory")
        .map((child) => ({
          ...child,
          name: child.name || child.email || `Usuario ${child.userId}`,
        }));
    }
  }

  // If no managers found, try alternative path
  if (managers.length === 0 && ownerNode && data.children[0].children) {
    const sigLevel = data.children[0].children.find(
      (c) => c.type === "level-signatories"
    );
    if (sigLevel && sigLevel.children) {
      const manLevel = sigLevel.children.find(
        (c) => c.type === "level-managers"
      );
      if (manLevel && manLevel.children) {
        managers = manLevel.children
          .filter((child) => child.type === "manager")
          .map((child) => ({
            ...child,
            name: child.name || child.email || `Usuario ${child.userId}`,
          }));
      }
    }
  }

  // Function to draw horizontal separator line
  function drawSeparator(y, label, color) {
    // Draw horizontal line
    inventoryTreeState.treeG
      .append("line")
      .attr("x1", 50)
      .attr("y1", y + 50)
      .attr("x2", width - 50)
      .attr("y2", y + 50)
      .attr("stroke", isDarkMode ? "#4B5563" : color) // Darker line in dark mode, color in light mode
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", "5,5")
      .attr("opacity", isDarkMode ? 0.5 : 0.3);
  }

  // Function to draw a node
  function drawNode(x, y, node, config, label, isEmpty = false) {
    const group = inventoryTreeState.treeG
      .append("g")
      .attr("class", "pyramid-node")
      .attr("transform", `translate(${x},${y})`)
      .style("opacity", 0);

    // Draw label on the left (only for first node in level)
    if (label) {
      group
        .append("text")
        .attr("x", -x + 20)
        .attr("y", 5)
        .attr("fill", isDarkMode ? "#D1D5DB" : "#1F2937") // Light gray in dark mode, dark gray in light mode
        .attr("font-size", 14)
        .attr("font-weight", "bold")
        .attr("text-anchor", "start")
        .text(label);
    }

    if (isEmpty) {
      // Draw empty state text
      group
        .append("text")
        .attr("x", 0)
        .attr("y", 5)
        .attr("fill", isDarkMode ? "#9CA3AF" : "#9CA3AF") // Medium gray for both modes
        .attr("font-size", 13)
        .attr("font-style", "italic")
        .attr("text-anchor", "middle")
        .text(node.name);
    } else {
      // Create clickable circle group
      const circleGroup = group
        .append("g")
        .attr("class", "node-circle-group")
        .style("cursor", "pointer");

      // Get initial letter from name
      const getInitial = (name) => {
        if (!name || name.trim() === "") return "?";
        const trimmed = name.trim();
        // Get first letter, handling special cases
        const firstChar = trimmed.charAt(0).toUpperCase();
        return firstChar.match(/[A-ZÁÉÍÓÚÑ]/) ? firstChar : "?";
      };

      const initial = getInitial(node.name);

      // Draw circle background
      circleGroup
        .append("circle")
        .attr("r", config.radius)
        .attr("fill", config.color)
        .attr("stroke", isDarkMode ? "#374151" : "#ffffff")
        .attr("stroke-width", config.stroke)
        .style("filter", "drop-shadow(0px 3px 6px rgba(0, 0, 0, 0.2))");

      // Add image if available (using clipPath for circular mask)
      const imageUrl = node.imgUrl || node.inventoryImgUrl;
      
      // Always add initial text first (will be hidden if image loads successfully)
      const initialText = circleGroup
        .append("text")
        .attr("x", 0)
        .attr("y", 0)
        .attr("dy", "0.35em")
        .attr("text-anchor", "middle")
        .attr("fill", "#ffffff")
        .attr("font-size", config.radius * 0.7)
        .attr("font-weight", "bold")
        .attr("font-family", "Arial, sans-serif")
        .text(initial);
      
      if (imageUrl) {
        // Create circular clip path
        const clipId = `clip-${Math.random().toString(36).substr(2, 9)}`;
        circleGroup
          .append("defs")
          .append("clipPath")
          .attr("id", clipId)
          .append("circle")
          .attr("r", config.radius - config.stroke / 2)
          .attr("cx", 0)
          .attr("cy", 0);

        // Add image with clip path
        const imageElement = circleGroup
          .append("image")
          .attr("xlink:href", imageUrl)
          .attr("x", -config.radius)
          .attr("y", -config.radius)
          .attr("width", config.radius * 2)
          .attr("height", config.radius * 2)
          .attr("clip-path", `url(#${clipId})`)
          .attr("preserveAspectRatio", "xMidYMid slice")
          .style("opacity", 0)
          .on("load", function() {
            // Image loaded successfully, hide initial and show image
            initialText.style("opacity", 0);
            d3.select(this).style("opacity", 1);
          })
          .on("error", function() {
            // If image fails to load, remove it and keep initial visible
            d3.select(this).remove();
            initialText.style("opacity", 1);
          });
        
        // Set initial text to hidden initially (will show if image fails)
        initialText.style("opacity", 0);
      }

      // Add click event based on node type
      circleGroup.on("click", function(event) {
        event.stopPropagation();
        
        if (node.type === "inventory") {
          // Open inventory detail modal
          if (typeof showViewInventoryModal === "function" && node.id) {
            showViewInventoryModal(node.id);
          }
        } else if (node.userId) {
          // Open user detail modal
          if (typeof showUserDetailsModal === "function") {
            showUserDetailsModal(node.userId);
          }
        }
      });

      // Add hover effect with tooltip
      circleGroup
        .on("mouseover", function() {
          d3.select(this)
            .select("circle")
            .transition()
            .duration(200)
            .attr("r", config.radius + 3)
            .style("filter", "drop-shadow(0px 5px 10px rgba(0, 0, 0, 0.3))");
          
          // Show tooltip with name
          const tooltip = d3.select("body")
            .append("div")
            .attr("class", "inventory-tree-tooltip")
            .style("position", "absolute")
            .style("background-color", isDarkMode ? "#1F2937" : "#ffffff")
            .style("color", isDarkMode ? "#E5E7EB" : "#1F2937")
            .style("padding", "8px 12px")
            .style("border-radius", "8px")
            .style("font-size", "12px")
            .style("font-weight", "bold")
            .style("pointer-events", "none")
            .style("z-index", "10010")
            .style("box-shadow", "0 4px 6px rgba(0, 0, 0, 0.2)")
            .style("border", isDarkMode ? "1px solid #374151" : "1px solid #E5E7EB")
            .html(node.name);
          
          // Position tooltip near mouse
          const tooltipNode = tooltip.node();
          const tooltipWidth = tooltipNode.offsetWidth;
          const tooltipHeight = tooltipNode.offsetHeight;
          
          tooltip
            .style("left", (event.pageX - tooltipWidth / 2) + "px")
            .style("top", (event.pageY - tooltipHeight - 15) + "px");
        })
        .on("mouseout", function() {
          d3.select(this)
            .select("circle")
            .transition()
            .duration(200)
            .attr("r", config.radius)
            .style("filter", "drop-shadow(0px 3px 6px rgba(0, 0, 0, 0.2))");
          
          // Remove tooltip
          d3.selectAll(".inventory-tree-tooltip").remove();
        });
    }

    // Fade in animation
    group.transition().duration(500).style("opacity", 1);

    return group;
  }

  // LEVEL 1: Draw Inventory
  drawNode(
    centerX,
    levelConfig.inventory.y,
    inventoryNode,
    levelConfig.inventory,
    "INVENTARIO"
  );
  drawSeparator(levelConfig.inventory.y, "", levelConfig.inventory.color);

  // LEVEL 2: Draw Owner
  if (ownerNode) {
    drawNode(
      centerX,
      levelConfig.owner.y,
      ownerNode,
      levelConfig.owner,
      "PROPIETARIO"
    );
  } else {
    drawNode(
      centerX,
      levelConfig.owner.y,
      { name: "Sin propietario asignado" },
      levelConfig.empty,
      "PROPIETARIO",
      true
    );
  }
  drawSeparator(levelConfig.owner.y, "", levelConfig.owner.color);

  // LEVEL 3: Draw Signatories
  const realSignatories = signatories.filter((sig) => sig.type !== "empty");
  if (realSignatories.length > 0) {
    const totalWidth = (realSignatories.length - 1) * nodeSpacing;
    const startX = centerX - totalWidth / 2;

    realSignatories.forEach((sig, index) => {
      const x = startX + index * nodeSpacing;
      const label = index === 0 ? "FIRMANTES" : null;
      drawNode(x, levelConfig.signatory.y, sig, levelConfig.signatory, label);
    });
  } else {
    // Show "Sin firmantes" message
    drawNode(
      centerX,
      levelConfig.signatory.y,
      { name: "Sin firmantes asignados" },
      levelConfig.empty,
      "FIRMANTES",
      true
    );
  }
  drawSeparator(levelConfig.signatory.y, "", levelConfig.signatory.color);

  // LEVEL 4: Draw Managers
  const realManagers = managers.filter((man) => man.type !== "empty");
  if (realManagers.length > 0) {
    const totalWidth = (realManagers.length - 1) * nodeSpacing;
    const startX = centerX - totalWidth / 2;

    realManagers.forEach((man, index) => {
      const x = startX + index * nodeSpacing;
      const label = index === 0 ? "MANEJADORES" : null;
      drawNode(x, levelConfig.manager.y, man, levelConfig.manager, label);
    });
  } else {
    // Show "Sin manejadores" message
    drawNode(
      centerX,
      levelConfig.manager.y,
      { name: "Sin manejadores asignados" },
      levelConfig.empty,
      "MANEJADORES",
      true
    );
  }
  drawSeparator(levelConfig.manager.y, "", levelConfig.manager.color);
}

// Refresh tree theme when dark mode changes
function refreshInventoryTreeTheme() {
  const modal = document.getElementById("inventoryTreeModal");
  if (!modal || modal.classList.contains("hidden")) {
    // Tree modal is not visible, no need to refresh
    return;
  }

  // Tree is visible, re-render with current data
  if (inventoryTreeState.treeData) {
    const treeContainer = document.getElementById("inventoryTreeContainer");
    if (treeContainer) {
      // Clear and re-render
      treeContainer.innerHTML = "";
      renderInventoryTree(inventoryTreeState.treeData);
    }
  }
}

// Listen for theme changes via custom event
document.addEventListener('themeChanged', function(event) {
  refreshInventoryTreeTheme();
});

// Setup MutationObserver to detect theme changes on html element
function setupInventoryTreeThemeObserver() {
  const htmlElement = document.documentElement;
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
        // Theme changed, refresh tree if visible
        refreshInventoryTreeTheme();
      }
    });
  });
  observer.observe(htmlElement, { attributes: true });
}

// Initialize observer when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupInventoryTreeThemeObserver);
} else {
  setupInventoryTreeThemeObserver();
}

// Export functions and state to global scope
window.showInventoryTreeModal = showInventoryTreeModal;
window.closeInventoryTreeModal = closeInventoryTreeModal;
window.refreshInventoryTree = refreshInventoryTree;
window.refreshInventoryTreeTheme = refreshInventoryTreeTheme;
window.inventoryTreeState = inventoryTreeState;
