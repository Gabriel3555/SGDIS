// centers-map.js - Mapa Interactivo de Centros SENA

let map;
let centersData = [];
let regionalsData = [];
let markersLayer;
let regionalsLayer;
let colombiaBorderLayer;

// Coordenadas de Colombia (centro aproximado)
const COLOMBIA_CENTER = [4.570868, -74.297333];
const COLOMBIA_ZOOM = 6;

// Colores SENA
const SENA_GREEN = '#00AF00';
const SENA_GREEN_DARK = '#008800';
const SENA_GREEN_LIGHT = '#39B54A';

// Crear iconos personalizados con SVG (colores SENA)
const createCustomIcon = (color, size = 'normal') => {
    const iconSize = size === 'large' ? [30, 49] : [25, 41];
    const iconAnchor = size === 'large' ? [15, 49] : [12, 41];
    const popupAnchor = size === 'large' ? [1, -42] : [1, -34];
    
    return L.divIcon({
        html: `
            <svg width="${iconSize[0]}" height="${iconSize[1]}" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
                <path d="M12.5 0C5.6 0 0 5.6 0 12.5c0 8.4 12.5 28.5 12.5 28.5S25 20.9 25 12.5C25 5.6 19.4 0 12.5 0z" 
                      fill="${color}" stroke="#fff" stroke-width="1.5"/>
                <circle cx="12.5" cy="12.5" r="5" fill="#fff"/>
            </svg>
        `,
        className: 'custom-marker-icon',
        iconSize: iconSize,
        iconAnchor: iconAnchor,
        popupAnchor: popupAnchor
    });
};

// Iconos personalizados
const centerIcon = createCustomIcon('#0078d4', 'normal');
const regionalIcon = createCustomIcon(SENA_GREEN, 'large');

// Inicializar el mapa
document.addEventListener('DOMContentLoaded', function() {
    initMap();
    loadMapData();
    loadCurrentUserInfo();
    setupFilters();
});

async function loadCurrentUserInfo() {
    try {
        const token = localStorage.getItem('jwt');
        if (!token) return;

        const response = await fetch('/api/v1/users/me', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const userData = await response.json();
            if (typeof updateUserInfoDisplay === 'function') {
                updateUserInfoDisplay(userData);
            }
        }
    } catch (error) {
        console.error('Error loading current user info:', error);
    }
}

function initMap() {
    // Inicializar el mapa de Leaflet
    map = L.map('map', {
        center: COLOMBIA_CENTER,
        zoom: COLOMBIA_ZOOM,
        minZoom: 5,
        maxZoom: 18,
        zoomControl: true
    });

    // Añadir capa de tiles con filtro verde SENA
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | SENA Colombia',
        className: 'map-tiles'
    }).addTo(map);

    // Agregar el contorno de Colombia
    addColombiaBorder();

    // Crear capas para marcadores con colores personalizados
    markersLayer = L.markerClusterGroup({
        chunkedLoading: true,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true,
        maxClusterRadius: 80,
        iconCreateFunction: function(cluster) {
            const count = cluster.getChildCount();
            let size = 'small';
            let sizeClass = '';
            
            if (count >= 10) {
                size = 'large';
                sizeClass = 'marker-cluster-large';
            } else if (count >= 5) {
                size = 'medium';
                sizeClass = 'marker-cluster-medium';
            } else {
                sizeClass = 'marker-cluster-small';
            }
            
            return L.divIcon({
                html: `<div class="cluster-inner" style="background-color: ${SENA_GREEN}; border: 3px solid #fff;"><span style="color: white; font-weight: bold;">${count}</span></div>`,
                className: 'marker-cluster ' + sizeClass,
                iconSize: L.point(40, 40)
            });
        }
    });
    
    regionalsLayer = L.layerGroup();

    // Añadir leyenda
    addLegend();
}

// Función para agregar el contorno de Colombia
function addColombiaBorder() {
    // GeoJSON del contorno de Colombia
    const colombiaGeoJSON = {
        "type": "FeatureCollection",
        "features": [{
            "type": "Feature",
            "properties": { "name": "Colombia" },
            "geometry": {
                "type": "Polygon",
                "coordinates": [[
                    [-79.0, 1.5], [-78.9, 0.6], [-77.8, -0.5], [-75.5, -1.0], [-70.0, -1.5],
                    [-69.9, -1.0], [-67.8, -0.9], [-66.9, 0.0], [-67.1, 1.2], [-67.5, 2.0],
                    [-68.0, 3.0], [-69.5, 3.5], [-70.0, 4.0], [-71.0, 5.5], [-71.5, 6.5],
                    [-72.0, 7.5], [-72.5, 8.5], [-73.0, 10.5], [-72.5, 11.5], [-71.5, 12.5],
                    [-71.3, 12.0], [-73.0, 11.5], [-74.5, 11.0], [-75.5, 10.5], [-76.0, 10.0],
                    [-76.5, 9.0], [-77.0, 8.5], [-76.8, 7.5], [-77.2, 6.5], [-77.5, 5.5],
                    [-77.7, 4.5], [-78.0, 3.5], [-78.2, 2.5], [-78.5, 1.8], [-79.0, 1.5]
                ]]
            }
        }]
    };

    // Estilo del contorno con colores SENA
    const borderStyle = {
        color: SENA_GREEN,
        weight: 4,
        opacity: 0.8,
        fillColor: SENA_GREEN_LIGHT,
        fillOpacity: 0.1,
        dashArray: '10, 5'
    };

    // Agregar el contorno al mapa
    colombiaBorderLayer = L.geoJSON(colombiaGeoJSON, {
        style: borderStyle,
        onEachFeature: function(feature, layer) {
            if (feature.properties && feature.properties.name) {
                layer.bindTooltip(feature.properties.name, {
                    permanent: false,
                    direction: 'center',
                    className: 'country-label'
                });
            }
        }
    }).addTo(map);

    // Hacer que el contorno esté detrás de los marcadores
    colombiaBorderLayer.bringToBack();
}

function addLegend() {
    const legend = L.control({ position: 'bottomright' });

    legend.onAdd = function (map) {
        const div = L.DomUtil.create('div', 'legend');
        div.innerHTML = `
            <div style="background: white; padding: 15px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.2); border: 3px solid ${SENA_GREEN};">
                <h4 style="margin: 0 0 12px 0; font-weight: bold; color: ${SENA_GREEN_DARK}; font-size: 16px;">
                    <i class="fas fa-map-marked-alt" style="margin-right: 5px;"></i>Leyenda
                </h4>
                <div style="display: flex; align-items: center; margin-bottom: 10px;">
                    <div style="width: 24px; height: 24px; background-color: #0078d4; border-radius: 50%; margin-right: 10px; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>
                    <span style="font-size: 14px; color: #333;">Centro de Formación</span>
                </div>
                <div style="display: flex; align-items: center; margin-bottom: 10px;">
                    <div style="width: 24px; height: 24px; background-color: ${SENA_GREEN}; border-radius: 50%; margin-right: 10px; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>
                    <span style="font-size: 14px; color: #333;">Regional</span>
                </div>
                <div style="display: flex; align-items: center;">
                    <div style="width: 24px; height: 4px; background: linear-gradient(90deg, ${SENA_GREEN} 50%, transparent 50%); background-size: 10px 4px; margin-right: 10px; border-radius: 2px;"></div>
                    <span style="font-size: 14px; color: #333;">Límite Colombia</span>
                </div>
            </div>
        `;
        return div;
    };

    legend.addTo(map);
}

async function loadMapData() {
    try {
        const token = localStorage.getItem('jwt');
        
        // Cargar centros y regionales en paralelo
        const [centersResponse, regionalsResponse] = await Promise.all([
            fetch('/api/v1/institutions/map', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }),
            fetch('/api/v1/regional/map', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            })
        ]);

        if (centersResponse.ok && regionalsResponse.ok) {
            centersData = await centersResponse.json();
            regionalsData = await regionalsResponse.json();
            
            // Filtrar solo los que tienen coordenadas
            centersData = centersData.filter(c => c.latitude && c.longitude);
            regionalsData = regionalsData.filter(r => r.latitude && r.longitude);
            
            updateStats();
            populateRegionalFilter();
            renderMarkers();
        } else {
            showError('Error al cargar los datos del mapa');
        }
    } catch (error) {
        console.error('Error loading map data:', error);
        showError('Error al cargar los datos del mapa: ' + error.message);
    }
}

function renderMarkers(filteredCenters = null, filteredRegionals = null) {
    // Limpiar marcadores existentes
    markersLayer.clearLayers();
    regionalsLayer.clearLayers();

    const centersToRender = filteredCenters || centersData;
    const regionalsToRender = filteredRegionals || regionalsData;

    // Añadir marcadores de regionales
    regionalsToRender.forEach(regional => {
        if (regional.latitude && regional.longitude) {
            const marker = L.marker([regional.latitude, regional.longitude], { icon: regionalIcon })
                .bindPopup(createRegionalPopup(regional));
            regionalsLayer.addLayer(marker);
        }
    });

    // Añadir marcadores de centros
    centersToRender.forEach(center => {
        if (center.latitude && center.longitude) {
            const marker = L.marker([center.latitude, center.longitude], { icon: centerIcon })
                .bindPopup(createCenterPopup(center));
            markersLayer.addLayer(marker);
        }
    });

    // Añadir capas al mapa
    map.addLayer(regionalsLayer);
    map.addLayer(markersLayer);

    // Actualizar contador de visibles
    document.getElementById('visibleCenters').textContent = centersToRender.length;
}

function createCenterPopup(center) {
    return `
        <div class="custom-popup">
            <h3 style="background: linear-gradient(135deg, #0078d4 0%, #005a9e 100%); color: white; padding: 14px; margin: 0; font-size: 16px; font-weight: bold; border-radius: 8px 8px 0 0; display: flex; align-items: center;">
                <i class="fas fa-building" style="margin-right: 10px; font-size: 18px;"></i>
                <span>${center.name || 'Sin nombre'}</span>
            </h3>
            <div style="padding: 16px; background: white;">
                <div style="margin-bottom: 10px; display: flex; align-items: start;">
                    <i class="fas fa-barcode" style="color: ${SENA_GREEN}; margin-right: 10px; margin-top: 2px; width: 20px;"></i>
                    <div>
                        <strong style="color: #333; font-size: 13px;">Código:</strong><br>
                        <span style="color: #666; font-size: 14px;">${center.codeInstitution || 'N/A'}</span>
                    </div>
                </div>
                <div style="margin-bottom: 10px; display: flex; align-items: start;">
                    <i class="fas fa-map-marked-alt" style="color: ${SENA_GREEN}; margin-right: 10px; margin-top: 2px; width: 20px;"></i>
                    <div>
                        <strong style="color: #333; font-size: 13px;">Regional:</strong><br>
                        <span style="color: #666; font-size: 14px;">${center.regionalName || 'N/A'}</span>
                    </div>
                </div>
                <div style="margin-bottom: 10px; display: flex; align-items: start;">
                    <i class="fas fa-city" style="color: ${SENA_GREEN}; margin-right: 10px; margin-top: 2px; width: 20px;"></i>
                    <div>
                        <strong style="color: #333; font-size: 13px;">Ciudad:</strong><br>
                        <span style="color: #666; font-size: 14px;">${center.cityName || 'N/A'}</span>
                    </div>
                </div>
                <div style="margin-bottom: 10px; display: flex; align-items: start;">
                    <i class="fas fa-map" style="color: ${SENA_GREEN}; margin-right: 10px; margin-top: 2px; width: 20px;"></i>
                    <div>
                        <strong style="color: #333; font-size: 13px;">Departamento:</strong><br>
                        <span style="color: #666; font-size: 14px;">${center.departamentName || 'N/A'}</span>
                    </div>
                </div>
                <div style="margin-top: 12px; padding-top: 12px; border-top: 2px dashed ${SENA_GREEN_LIGHT}; text-align: center;">
                    <i class="fas fa-location-dot" style="color: ${SENA_GREEN}; margin-right: 5px;"></i>
                    <span style="color: #999; font-size: 12px; font-family: monospace;">
                        ${center.latitude.toFixed(6)}, ${center.longitude.toFixed(6)}
                    </span>
                </div>
            </div>
        </div>
    `;
}

function createRegionalPopup(regional) {
    return `
        <div class="custom-popup">
            <h3 style="background: linear-gradient(135deg, ${SENA_GREEN} 0%, ${SENA_GREEN_DARK} 100%); color: white; padding: 14px; margin: 0; font-size: 16px; font-weight: bold; border-radius: 8px 8px 0 0; display: flex; align-items: center;">
                <i class="fas fa-map-marked-alt" style="margin-right: 10px; font-size: 18px;"></i>
                <span>${regional.name || 'Sin nombre'}</span>
            </h3>
            <div style="padding: 16px; background: white;">
                <div style="margin-bottom: 10px; display: flex; align-items: start;">
                    <i class="fas fa-id-card" style="color: ${SENA_GREEN}; margin-right: 10px; margin-top: 2px; width: 20px;"></i>
                    <div>
                        <strong style="color: #333; font-size: 13px;">Código Regional:</strong><br>
                        <span style="color: #666; font-size: 14px;">${regional.regionalCode || 'N/A'}</span>
                    </div>
                </div>
                <div style="margin-bottom: 10px; display: flex; align-items: start;">
                    <i class="fas fa-map" style="color: ${SENA_GREEN}; margin-right: 10px; margin-top: 2px; width: 20px;"></i>
                    <div>
                        <strong style="color: #333; font-size: 13px;">Departamento:</strong><br>
                        <span style="color: #666; font-size: 14px;">${regional.departamentName || 'N/A'}</span>
                    </div>
                </div>
                <div style="margin-bottom: 10px; display: flex; align-items: start;">
                    <i class="fas fa-building" style="color: ${SENA_GREEN}; margin-right: 10px; margin-top: 2px; width: 20px;"></i>
                    <div>
                        <strong style="color: #333; font-size: 13px;">Centros de Formación:</strong><br>
                        <span style="color: #666; font-size: 18px; font-weight: bold;">${regional.institutionsCount || 0}</span>
                    </div>
                </div>
                <div style="margin-top: 12px; padding-top: 12px; border-top: 2px dashed ${SENA_GREEN_LIGHT}; text-align: center;">
                    <i class="fas fa-location-dot" style="color: ${SENA_GREEN}; margin-right: 5px;"></i>
                    <span style="color: #999; font-size: 12px; font-family: monospace;">
                        ${regional.latitude.toFixed(6)}, ${regional.longitude.toFixed(6)}
                    </span>
                </div>
            </div>
        </div>
    `;
}

function updateStats() {
    document.getElementById('totalCenters').textContent = centersData.length;
    document.getElementById('totalRegionals').textContent = regionalsData.length;
    document.getElementById('visibleCenters').textContent = centersData.length;
}

function populateRegionalFilter() {
    const select = document.getElementById('regionalFilter');
    select.innerHTML = '<option value="">Todas las Regionales</option>';
    
    // Obtener regionales únicas
    const uniqueRegionals = [...new Set(centersData
        .filter(c => c.regionalName)
        .map(c => JSON.stringify({ id: c.regionalId, name: c.regionalName })))]
        .map(JSON.parse);
    
    uniqueRegionals.forEach(regional => {
        const option = document.createElement('option');
        option.value = regional.id;
        option.textContent = regional.name;
        select.appendChild(option);
    });
}

function setupFilters() {
    const regionalFilter = document.getElementById('regionalFilter');
    const searchInput = document.getElementById('searchInput');

    regionalFilter.addEventListener('change', applyFilters);
    searchInput.addEventListener('input', applyFilters);
}

function applyFilters() {
    const selectedRegionalId = document.getElementById('regionalFilter').value;
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();

    let filteredCenters = [...centersData];
    let filteredRegionals = [...regionalsData];

    // Filtrar por regional
    if (selectedRegionalId) {
        filteredCenters = filteredCenters.filter(c => 
            c.regionalId && c.regionalId.toString() === selectedRegionalId
        );
        filteredRegionals = filteredRegionals.filter(r => 
            r.id && r.id.toString() === selectedRegionalId
        );
    }

    // Filtrar por búsqueda
    if (searchTerm) {
        filteredCenters = filteredCenters.filter(c => 
            (c.name && c.name.toLowerCase().includes(searchTerm)) ||
            (c.codeInstitution && c.codeInstitution.toLowerCase().includes(searchTerm)) ||
            (c.cityName && c.cityName.toLowerCase().includes(searchTerm)) ||
            (c.regionalName && c.regionalName.toLowerCase().includes(searchTerm))
        );
    }

    renderMarkers(filteredCenters, filteredRegionals);

    // Ajustar el mapa para mostrar todos los marcadores filtrados
    if (filteredCenters.length > 0 || filteredRegionals.length > 0) {
        const bounds = L.latLngBounds();
        filteredCenters.forEach(c => {
            if (c.latitude && c.longitude) {
                bounds.extend([c.latitude, c.longitude]);
            }
        });
        filteredRegionals.forEach(r => {
            if (r.latitude && r.longitude) {
                bounds.extend([r.latitude, r.longitude]);
            }
        });
        if (bounds.isValid()) {
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }
}

function clearFilters() {
    document.getElementById('regionalFilter').value = '';
    document.getElementById('searchInput').value = '';
    applyFilters();
    centerMapOnColombia();
}

function centerMapOnColombia() {
    map.setView(COLOMBIA_CENTER, COLOMBIA_ZOOM);
}

function reloadMap() {
    const icon = document.getElementById('reloadIcon');
    icon.classList.add('fa-spin');
    
    loadMapData().then(() => {
        icon.classList.remove('fa-spin');
        showSuccess('Mapa actualizado correctamente');
    }).catch(error => {
        icon.classList.remove('fa-spin');
        showError('Error al actualizar el mapa');
    });
}

function showSuccess(message) {
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-[10000]';
    toast.innerHTML = `<i class="fas fa-check-circle mr-2"></i>${message}`;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

function showError(message) {
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-[10000]';
    toast.innerHTML = `<i class="fas fa-exclamation-circle mr-2"></i>${message}`;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

