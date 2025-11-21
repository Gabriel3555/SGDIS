// Inventory Tree Hierarchy Component
// This file handles the tree visualization for inventory hierarchy using D3.js

// Encapsulate tree state to avoid variable conflicts
const inventoryTreeState = {
    currentInventoryId: null,
    treeData: null,
    treeSvg: null,
    treeG: null,
    treeZoom: null
};

// Fetch inventory users (owner, managers, signatories)
async function fetchInventoryUsers(inventoryId) {
    try {
        const token = localStorage.getItem('jwt');
        if (!token) {
            throw new Error('No authentication token found');
        }

        const response = await fetch(`/api/v1/inventory/${inventoryId}/users`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('Inventario no encontrado');
            } else if (response.status === 401) {
                throw new Error('Sesión expirada. Por favor inicia sesión nuevamente.');
            } else if (response.status === 403) {
                throw new Error('No tienes permisos para ver esta información.');
            }
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching inventory users:', error);
        throw error;
    }
}

// Transform API data to hierarchical structure for D3
// Structure: Inventario -> Owner -> Signatures -> Managers (chain)
function transformToTreeData(apiData, inventoryName) {
    const root = {
        name: inventoryName || 'Inventario',
        type: 'inventory',
        id: inventoryTreeState.currentInventoryId,
        children: []
    };

    // Nivel 2: Owner (Propietario) - directly connected to inventory
    let ownerNode = null;
    if (apiData.owner) {
        ownerNode = {
            name: apiData.owner.fullName || 'Sin nombre',
            type: 'owner',
            userId: apiData.owner.userId,
            imgUrl: apiData.owner.imgUrl || null,
            role: 'Propietario',
            children: []
        };
        root.children.push(ownerNode);
    }

    // Nivel 3: Signatures (Firmantes) - connected to owner
    let signaturesNode = null;
    if (apiData.signatories && apiData.signatories.length > 0) {
        signaturesNode = {
            name: apiData.signatories.length === 1 
                ? (apiData.signatories[0].fullName || 'Sin nombre')
                : `Firmantes (${apiData.signatories.length})`,
            type: apiData.signatories.length === 1 ? 'signatory' : 'signatories-group',
            count: apiData.signatories.length,
            children: apiData.signatories.length === 1 ? [] : apiData.signatories.map(signatory => ({
                name: signatory.fullName || 'Sin nombre',
                type: 'signatory',
                userId: signatory.userId,
                imgUrl: signatory.imgUrl || null,
                role: 'Firmante'
            }))
        };
        
        // Connect to owner if exists, otherwise to root
        if (ownerNode) {
            ownerNode.children.push(signaturesNode);
        } else {
            root.children.push(signaturesNode);
        }
    }

    // Nivel 4: Managers (Manejadores) - connected to signatures (or owner if no signatures)
    if (apiData.managers && apiData.managers.length > 0) {
        const managersNode = {
            name: apiData.managers.length === 1
                ? (apiData.managers[0].fullName || 'Sin nombre')
                : `Manejadores (${apiData.managers.length})`,
            type: apiData.managers.length === 1 ? 'manager' : 'managers-group',
            count: apiData.managers.length,
            children: apiData.managers.length === 1 ? [] : apiData.managers.map(manager => ({
                name: manager.fullName || 'Sin nombre',
                type: 'manager',
                userId: manager.userId,
                imgUrl: manager.imgUrl || null,
                role: 'Manejador'
            }))
        };
        
        // Connect to signatures if exists, otherwise to owner, otherwise to root
        if (signaturesNode) {
            signaturesNode.children.push(managersNode);
        } else if (ownerNode) {
            ownerNode.children.push(managersNode);
        } else {
            root.children.push(managersNode);
        }
    }

    // If no children at all, add a placeholder
    if (root.children.length === 0) {
        root.children.push({
            name: 'Sin usuarios asignados',
            type: 'empty',
            message: 'No hay usuarios asignados a este inventario'
        });
    }

    return root;
}

// Show inventory tree modal
async function showInventoryTreeModal(inventoryId, inventoryName) {
    inventoryTreeState.currentInventoryId = inventoryId;
    
    const modal = document.getElementById('inventoryTreeModal');
    if (!modal) {
        console.error('Inventory tree modal not found');
        return;
    }

    // Show modal
    modal.classList.remove('hidden');
    
    // Show loading state
    const treeContainer = document.getElementById('inventoryTreeContainer');
    const loadingSpinner = document.getElementById('inventoryTreeLoading');
    
    if (treeContainer) {
        treeContainer.innerHTML = '';
    }
    if (loadingSpinner) {
        loadingSpinner.classList.remove('hidden');
    }

    // Set inventory name in modal
    const inventoryNameElement = document.getElementById('inventoryTreeName');
    if (inventoryNameElement) {
        inventoryNameElement.textContent = inventoryName || `Inventario #${inventoryId}`;
    }

    try {
        // Load D3 if not already loaded
        await loadD3Library();
        
        // Fetch data
        const apiData = await fetchInventoryUsers(inventoryId);
        
        // Transform to tree structure
        inventoryTreeState.treeData = transformToTreeData(apiData, inventoryName);
        
        // Hide loading
        if (loadingSpinner) {
            loadingSpinner.classList.add('hidden');
        }
        
        // Render tree
        renderInventoryTree(inventoryTreeState.treeData);
        
    } catch (error) {
        console.error('Error loading inventory tree:', error);
        
        // Hide loading
        if (loadingSpinner) {
            loadingSpinner.classList.add('hidden');
        }
        
        // Show error
        if (treeContainer) {
            treeContainer.innerHTML = `
                <div class="flex flex-col items-center justify-center p-8 text-center">
                    <i class="fas fa-exclamation-triangle text-red-500 text-5xl mb-4"></i>
                    <h3 class="text-xl font-semibold text-gray-800 dark:text-white mb-2">Error al cargar el árbol</h3>
                    <p class="text-gray-600 dark:text-gray-400 mb-4">${error.message}</p>
                    <button onclick="showInventoryTreeModal(${inventoryId}, '${(inventoryName || '').replace(/'/g, "\\'")}')" 
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
    const modal = document.getElementById('inventoryTreeModal');
    if (modal) {
        modal.classList.add('hidden');
    }
    
    // Clear tree
    if (inventoryTreeState.treeSvg) {
        inventoryTreeState.treeSvg.remove();
        inventoryTreeState.treeSvg = null;
        inventoryTreeState.treeG = null;
        inventoryTreeState.treeZoom = null;
    }
    
    const treeContainer = document.getElementById('inventoryTreeContainer');
    if (treeContainer) {
        treeContainer.innerHTML = '';
    }
    
    inventoryTreeState.currentInventoryId = null;
    inventoryTreeState.treeData = null;
}

// Load D3 library from CDN
function loadD3Library() {
    return new Promise((resolve, reject) => {
        // Check if already loaded
        if (typeof d3 !== 'undefined') {
            resolve();
            return;
        }

        const d3Script = document.createElement('script');
        d3Script.src = 'https://d3js.org/d3.v7.min.js';
        d3Script.onload = () => {
            if (typeof d3 !== 'undefined') {
                resolve();
            } else {
                reject(new Error('Failed to load D3 library'));
            }
        };
        d3Script.onerror = () => reject(new Error('Failed to load D3 library'));
        document.head.appendChild(d3Script);
    });
}

// Render tree using D3
function renderInventoryTree(data) {
    const container = document.getElementById('inventoryTreeContainer');
    if (!container) {
        console.error('Tree container not found');
        return;
    }

    // Clear previous tree
    container.innerHTML = '';

    // Get container dimensions
    const width = container.clientWidth;
    const height = container.clientHeight || 600;

    // Create SVG
    inventoryTreeState.treeSvg = d3.select(container)
        .append('svg')
        .attr('width', width)
        .attr('height', height);

    // Create zoom behavior
    inventoryTreeState.treeZoom = d3.zoom()
        .scaleExtent([0.1, 3])
        .on('zoom', (event) => {
            inventoryTreeState.treeG.attr('transform', event.transform);
        });

    inventoryTreeState.treeSvg.call(inventoryTreeState.treeZoom);

    // Create main group
    inventoryTreeState.treeG = inventoryTreeState.treeSvg.append('g');

    // Set initial transform (center the tree vertically)
    const initialTransform = d3.zoomIdentity
        .translate(width / 2, 80)
        .scale(0.9);
    inventoryTreeState.treeG.attr('transform', initialTransform);
    inventoryTreeState.treeSvg.call(inventoryTreeState.treeZoom.transform, initialTransform);

    // Create tree layout - VERTICAL (chain/pyramid)
    const treeLayout = d3.tree()
        .size([width - 200, height - 150])  // [width, height] for vertical layout
        .separation((a, b) => {
            // For chain structure, keep siblings close together
            if (a.parent === b.parent) {
                return 1.2;
            }
            return 1.5;
        });

    // Convert data to hierarchy
    const root = d3.hierarchy(data);
    const treeData = treeLayout(root);

    // Get node colors based on type
    function getNodeColor(nodeType) {
        switch (nodeType) {
            case 'inventory':
                return '#00AF00';
            case 'owner':
                return '#008800';
            case 'manager':
                return '#00AF00';
            case 'signatory':
                return '#00AF00';
            case 'managers-group':
            case 'signatories-group':
                return '#E8F5E8';
            case 'empty':
                return '#9ca3af';
            default:
                return '#00AF00';
        }
    }

    function getTextColor(nodeType) {
        if (nodeType === 'managers-group' || nodeType === 'signatories-group') {
            return '#00AF00';
        }
        if (nodeType === 'empty') {
            return '#6b7280';
        }
        return '#ffffff';
    }

    function getNodeRadius(nodeType) {
        switch (nodeType) {
            case 'inventory':
                return 25;
            case 'managers-group':
            case 'signatories-group':
                return 20;
            default:
                return 18;
        }
    }

    // Draw links - VERTICAL
    const links = inventoryTreeState.treeG.selectAll('.link')
        .data(treeData.links())
        .enter()
        .append('path')
        .attr('class', 'tree-link')
        .attr('d', d3.linkVertical()
            .x(d => d.x)
            .y(d => d.y))
        .attr('fill', 'none')
        .attr('stroke', '#00AF00')
        .attr('stroke-width', 2)
        .attr('opacity', 0.6)
        .style('transition', 'opacity 0.3s ease')
        .on('mouseover', function() {
            d3.select(this).attr('opacity', 1).attr('stroke-width', 3);
        })
        .on('mouseout', function() {
            d3.select(this).attr('opacity', 0.6).attr('stroke-width', 2);
        });

    // Draw nodes - VERTICAL (x is horizontal, y is vertical)
    const nodes = inventoryTreeState.treeG.selectAll('.node')
        .data(treeData.descendants())
        .enter()
        .append('g')
        .attr('class', 'node')
        .attr('transform', d => `translate(${d.x},${d.y})`)
        .style('opacity', 0);

    // Add circles for nodes
    nodes.append('circle')
        .attr('r', d => getNodeRadius(d.data.type))
        .attr('fill', d => getNodeColor(d.data.type))
        .attr('stroke', '#ffffff')
        .attr('stroke-width', 2)
        .style('cursor', d => d.children || d._children ? 'pointer' : 'default')
        .on('click', function(event, d) {
            if (d.children) {
                d._children = d.children;
                d.children = null;
            } else {
                d.children = d._children;
                d._children = null;
            }
            updateTree();
        });

    // Add text backgrounds
    nodes.append('rect')
        .attr('x', d => getNodeRadius(d.data.type) + 10)
        .attr('y', -15)
        .attr('width', d => (d.data.name.length * 7) + 20)
        .attr('height', d => d.data.role ? 32 : 20)
        .attr('fill', d => getNodeColor(d.data.type))
        .attr('rx', 4)
        .attr('stroke', d => getNodeColor(d.data.type))
        .attr('stroke-width', 1);

    // Add node names
    nodes.append('text')
        .attr('class', 'node-name')
        .attr('x', d => getNodeRadius(d.data.type) + 20)
        .attr('y', 0)
        .attr('fill', d => getTextColor(d.data.type))
        .attr('font-size', 12)
        .attr('font-weight', 'bold')
        .text(d => d.data.name);

    // Add role text if exists
    nodes.filter(d => d.data.role)
        .append('text')
        .attr('x', d => getNodeRadius(d.data.type) + 20)
        .attr('y', 15)
        .attr('fill', d => getTextColor(d.data.type))
        .attr('font-size', 10)
        .attr('opacity', 0.9)
        .text(d => d.data.role);

    // Add expand/collapse indicator
    nodes.filter(d => d.children || d._children)
        .append('text')
        .attr('x', 0)
        .attr('y', 5)
        .attr('fill', '#ffffff')
        .attr('font-size', 14)
        .attr('text-anchor', 'middle')
        .attr('font-weight', 'bold')
        .text(d => d.children ? '-' : '+');

    // Apply fade-in animation to all nodes
    nodes.transition()
        .duration(500)
        .style('opacity', 1);

    // Update tree function
    function updateTree() {
        const updatedTreeData = treeLayout(root);

        // Update links
        const updatedLinks = inventoryTreeState.treeG.selectAll('.link')
            .data(updatedTreeData.links());

        updatedLinks.exit().remove();

        const newLinks = updatedLinks.enter()
            .append('path')
            .attr('class', 'tree-link')
            .attr('fill', 'none')
            .attr('stroke', '#00AF00')
            .attr('stroke-width', 2)
            .attr('opacity', 0.6)
            .style('transition', 'opacity 0.3s ease')
            .on('mouseover', function() {
                d3.select(this).attr('opacity', 1).attr('stroke-width', 3);
            })
            .on('mouseout', function() {
                d3.select(this).attr('opacity', 0.6).attr('stroke-width', 2);
            });

        updatedLinks.merge(newLinks)
            .attr('d', d3.linkVertical()
                .x(d => d.x)
                .y(d => d.y));

        // Update nodes
        const updatedNodes = inventoryTreeState.treeG.selectAll('.node')
            .data(updatedTreeData.descendants(), d => d.data.name + d.data.type);

        updatedNodes.exit()
            .transition()
            .duration(300)
            .style('opacity', 0)
            .remove();

        const newNodes = updatedNodes.enter()
            .append('g')
            .attr('class', 'node')
            .style('opacity', 0);

        newNodes.merge(updatedNodes)
            .transition()
            .duration(300)
            .attr('transform', d => `translate(${d.x},${d.y})`)
            .style('opacity', 1);

        // Update circles
        newNodes.append('circle')
            .attr('r', d => getNodeRadius(d.data.type))
            .attr('fill', d => getNodeColor(d.data.type))
            .attr('stroke', '#ffffff')
            .attr('stroke-width', 2)
            .style('cursor', d => d.children || d._children ? 'pointer' : 'default')
            .on('click', function(event, d) {
                if (d.children) {
                    d._children = d.children;
                    d.children = null;
                } else {
                    d.children = d._children;
                    d._children = null;
                }
                updateTree();
            });

        updatedNodes.select('circle')
            .attr('r', d => getNodeRadius(d.data.type))
            .attr('fill', d => getNodeColor(d.data.type));

        // Update text backgrounds
        newNodes.append('rect')
            .attr('x', d => getNodeRadius(d.data.type) + 10)
            .attr('y', -15)
            .attr('width', d => (d.data.name.length * 7) + 20)
            .attr('height', d => d.data.role ? 32 : 20)
            .attr('fill', d => getNodeColor(d.data.type))
            .attr('rx', 4)
            .attr('stroke', d => getNodeColor(d.data.type))
            .attr('stroke-width', 1);

        updatedNodes.select('rect')
            .attr('width', d => (d.data.name.length * 7) + 20)
            .attr('height', d => d.data.role ? 32 : 20)
            .attr('fill', d => getNodeColor(d.data.type))
            .attr('stroke', d => getNodeColor(d.data.type));

        // Update names
        newNodes.append('text')
            .attr('class', 'node-name')
            .attr('x', d => getNodeRadius(d.data.type) + 20)
            .attr('y', 0)
            .attr('fill', d => getTextColor(d.data.type))
            .attr('font-size', 12)
            .attr('font-weight', 'bold')
            .text(d => d.data.name);

        updatedNodes.select('text.node-name')
            .text(d => d.data.name);

        // Update roles
        const roleTexts = updatedNodes.selectAll('text.role');
        roleTexts.remove();
        
        updatedNodes.filter(d => d.data.role)
            .append('text')
            .attr('class', 'role')
            .attr('x', d => getNodeRadius(d.data.type) + 20)
            .attr('y', 15)
            .attr('fill', d => getTextColor(d.data.type))
            .attr('font-size', 10)
            .attr('opacity', 0.9)
            .text(d => d.data.role);

        // Update expand/collapse indicators
        const indicators = updatedNodes.selectAll('text.indicator');
        indicators.remove();

        updatedNodes.filter(d => d.children || d._children)
            .append('text')
            .attr('class', 'indicator')
            .attr('x', 0)
            .attr('y', 5)
            .attr('fill', '#ffffff')
            .attr('font-size', 14)
            .attr('text-anchor', 'middle')
            .attr('font-weight', 'bold')
            .text(d => d.children ? '-' : '+');
    }
}

// Export functions to global scope
window.showInventoryTreeModal = showInventoryTreeModal;
window.closeInventoryTreeModal = closeInventoryTreeModal;
