// centers-map.js - Mapa Interactivo de Centros SENA

let map;
let centersData = [];
let regionalsData = [];
let markersLayer;
let regionalsLayer;
let colombiaBorderLayer;
let isFullscreen = false;
let selectedSuggestionIndex = -1;
let currentSearchTimeout = null;

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
            <svg width="${iconSize[0]}" height="${iconSize[1]}" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg" class="marker-animate-in">
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
    setupFloatingControls();
    setupKeyboardShortcuts();
    setupSearchSuggestions();
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
    
    // Update location indicator on map move
    map.on('moveend', () => {
        const center = map.getCenter();
        updateLocationIndicator(center.lat, center.lng);
    });
    
    // Handle popup open for smooth experience
    map.on('popupopen', (e) => {
        const popup = e.popup;
        const marker = popup._source;
        if (marker) {
            const latlng = marker.getLatLng();
            // Smooth pan to center popup
            map.panTo(latlng, { animate: true, duration: 0.5 });
        }
    });
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
    showLoadingOverlay();
    
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
            hideLoadingOverlay();
        } else {
            hideLoadingOverlay();
            showError('Error al cargar los datos del mapa');
        }
    } catch (error) {
        console.error('Error loading map data:', error);
        hideLoadingOverlay();
        showError('Error al cargar los datos del mapa: ' + error.message);
    }
}

function renderMarkers(filteredCenters = null, filteredRegionals = null) {
    // Limpiar marcadores existentes
    markersLayer.clearLayers();
    regionalsLayer.clearLayers();

    const centersToRender = filteredCenters || centersData;
    const regionalsToRender = filteredRegionals || regionalsData;

    // Añadir marcadores de regionales con animación escalonada
    regionalsToRender.forEach((regional, index) => {
        if (regional.latitude && regional.longitude) {
            setTimeout(() => {
                const marker = L.marker([regional.latitude, regional.longitude], { 
                    icon: regionalIcon,
                    riseOnHover: true
                })
                .bindPopup(createRegionalPopup(regional))
                .bindTooltip(regional.name, {
                    direction: 'top',
                    offset: [0, -45],
                    className: 'custom-tooltip'
                });
                
                // Click en regional muestra sus centros
                marker.on('click', () => {
                    const relatedCenters = centersData.filter(c => 
                        c.regionalId && c.regionalId.toString() === regional.id.toString()
                    );
                    if (relatedCenters.length > 0) {
                        updateFilterBadge(relatedCenters.length);
                    }
                });
                
                regionalsLayer.addLayer(marker);
            }, index * 30); // Stagger animation
        }
    });

    // Añadir marcadores de centros con animación escalonada
    centersToRender.forEach((center, index) => {
        if (center.latitude && center.longitude) {
            setTimeout(() => {
                const marker = L.marker([center.latitude, center.longitude], { 
                    icon: centerIcon,
                    riseOnHover: true
                })
                .bindPopup(createCenterPopup(center))
                .bindTooltip(center.name, {
                    direction: 'top',
                    offset: [0, -38],
                    className: 'custom-tooltip'
                });
                
                markersLayer.addLayer(marker);
            }, Math.min(index * 15, 500)); // Stagger animation, max 500ms delay
        }
    });

    // Añadir capas al mapa
    map.addLayer(regionalsLayer);
    map.addLayer(markersLayer);

    // Actualizar contador de visibles con animación
    animateNumber('visibleCenters', centersToRender.length);
}

// Animate number changes
function animateNumber(elementId, targetValue) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const currentValue = parseInt(element.textContent) || 0;
    const difference = targetValue - currentValue;
    const duration = 500;
    const steps = 20;
    const stepValue = difference / steps;
    const stepDuration = duration / steps;
    
    let current = currentValue;
    let step = 0;
    
    const interval = setInterval(() => {
        step++;
        current += stepValue;
        element.textContent = Math.round(current);
        
        if (step >= steps) {
            element.textContent = targetValue;
            clearInterval(interval);
        }
    }, stepDuration);
}

// Update filter badge
function updateFilterBadge(count) {
    // Remove existing badge
    const existingBadge = document.querySelector('.filter-active-badge');
    if (existingBadge) existingBadge.remove();
    
    if (count > 0) {
        const filterLabel = document.querySelector('.filter-card label');
        if (filterLabel) {
            const badge = document.createElement('span');
            badge.className = 'filter-active-badge';
            badge.textContent = `${count} centros`;
            filterLabel.appendChild(badge);
        }
    }
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
    animateNumber('totalCenters', centersData.length);
    animateNumber('totalRegionals', regionalsData.length);
    animateNumber('visibleCenters', centersData.length);
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
    
    const hasFilters = selectedRegionalId || searchTerm;

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
    
    // Update filter badge
    const existingBadge = document.querySelector('.filter-active-badge');
    if (existingBadge) existingBadge.remove();
    
    if (hasFilters && filteredCenters.length < centersData.length) {
        updateFilterBadge(filteredCenters.length);
        showInfo(`Mostrando ${filteredCenters.length} de ${centersData.length} centros`);
    }

    // Ajustar el mapa para mostrar todos los marcadores filtrados con animación suave
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
            map.flyToBounds(bounds, { 
                padding: [50, 50],
                duration: 0.8
            });
        }
    }
}

function clearFilters() {
    document.getElementById('regionalFilter').value = '';
    document.getElementById('searchInput').value = '';
    
    // Remove filter badge
    const existingBadge = document.querySelector('.filter-active-badge');
    if (existingBadge) existingBadge.remove();
    
    // Hide suggestions
    hideSuggestions();
    
    renderMarkers();
    centerMapOnColombia();
    
    showSuccess('Filtros limpiados');
}

function centerMapOnColombia() {
    map.flyTo(COLOMBIA_CENTER, COLOMBIA_ZOOM, {
        duration: 1
    });
    
    // Update location indicator
    const indicator = document.getElementById('locationText');
    if (indicator) {
        indicator.textContent = 'Colombia';
    }
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

// ============================================
// TOAST NOTIFICATIONS (Improved)
// ============================================

function showToast(message, type = 'success', duration = 3000) {
    // Remove existing toasts
    document.querySelectorAll('.toast-notification').forEach(t => t.remove());
    
    const toast = document.createElement('div');
    toast.className = `toast-notification ${type}`;
    
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        info: 'fa-info-circle'
    };
    
    toast.innerHTML = `
        <i class="fas ${icons[type]} toast-icon"></i>
        <span>${message}</span>
        <i class="fas fa-times toast-close" onclick="this.parentElement.remove()"></i>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('hiding');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

function showSuccess(message) {
    showToast(message, 'success');
}

function showError(message) {
    showToast(message, 'error');
}

function showInfo(message) {
    showToast(message, 'info');
}

// ============================================
// LOADING STATE
// ============================================

function showLoadingOverlay() {
    const overlay = document.getElementById('mapLoadingOverlay');
    if (overlay) {
        overlay.classList.remove('hidden');
    }
}

function hideLoadingOverlay() {
    const overlay = document.getElementById('mapLoadingOverlay');
    if (overlay) {
        // Small delay for smoother UX
        setTimeout(() => {
            overlay.classList.add('hidden');
        }, 500);
    }
}

// ============================================
// FLOATING CONTROLS
// ============================================

function setupFloatingControls() {
    // Fullscreen button
    const btnFullscreen = document.getElementById('btnFullscreen');
    if (btnFullscreen) {
        btnFullscreen.addEventListener('click', toggleFullscreen);
    }
    
    // My location button
    const btnMyLocation = document.getElementById('btnMyLocation');
    if (btnMyLocation) {
        btnMyLocation.addEventListener('click', goToMyLocation);
    }
    
    // Show all button
    const btnShowAll = document.getElementById('btnShowAll');
    if (btnShowAll) {
        btnShowAll.addEventListener('click', showAllMarkers);
    }
    
    // Keyboard help button
    const btnKeyboardHelp = document.getElementById('btnKeyboardHelp');
    if (btnKeyboardHelp) {
        btnKeyboardHelp.addEventListener('click', toggleKeyboardHints);
    }
}

function toggleFullscreen() {
    const mapWrapper = document.getElementById('mapWrapper');
    const btnFullscreen = document.getElementById('btnFullscreen');
    
    isFullscreen = !isFullscreen;
    
    if (isFullscreen) {
        mapWrapper.classList.add('fullscreen');
        btnFullscreen.innerHTML = '<i class="fas fa-compress"></i>';
        btnFullscreen.classList.add('active');
        showInfo('Presiona Esc para salir de pantalla completa');
    } else {
        mapWrapper.classList.remove('fullscreen');
        btnFullscreen.innerHTML = '<i class="fas fa-expand"></i>';
        btnFullscreen.classList.remove('active');
    }
    
    // Refresh map size
    setTimeout(() => {
        map.invalidateSize();
    }, 300);
}

function goToMyLocation() {
    if (!navigator.geolocation) {
        showError('Tu navegador no soporta geolocalización');
        return;
    }
    
    showInfo('Obteniendo tu ubicación...');
    
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            map.flyTo([latitude, longitude], 12, {
                duration: 1.5
            });
            
            // Add temporary marker
            const userMarker = L.marker([latitude, longitude], {
                icon: L.divIcon({
                    html: `
                        <div style="
                            width: 20px;
                            height: 20px;
                            background: #3b82f6;
                            border: 3px solid white;
                            border-radius: 50%;
                            box-shadow: 0 0 0 6px rgba(59, 130, 246, 0.3);
                            animation: pulse-blue 2s infinite;
                        "></div>
                    `,
                    className: '',
                    iconSize: [20, 20],
                    iconAnchor: [10, 10]
                })
            }).addTo(map);
            
            userMarker.bindPopup('<strong>Tu ubicación</strong>').openPopup();
            
            // Remove after 10 seconds
            setTimeout(() => {
                map.removeLayer(userMarker);
            }, 10000);
            
            showSuccess('Ubicación encontrada');
            updateLocationIndicator(latitude, longitude);
        },
        (error) => {
            showError('No se pudo obtener tu ubicación');
        },
        { enableHighAccuracy: true }
    );
}

function showAllMarkers() {
    if (centersData.length === 0 && regionalsData.length === 0) {
        showInfo('No hay marcadores para mostrar');
        return;
    }
    
    const bounds = L.latLngBounds();
    
    centersData.forEach(c => {
        if (c.latitude && c.longitude) {
            bounds.extend([c.latitude, c.longitude]);
        }
    });
    
    regionalsData.forEach(r => {
        if (r.latitude && r.longitude) {
            bounds.extend([r.latitude, r.longitude]);
        }
    });
    
    if (bounds.isValid()) {
        map.flyToBounds(bounds, {
            padding: [50, 50],
            duration: 1
        });
    }
}

function toggleKeyboardHints() {
    const hints = document.getElementById('keyboardHints');
    const btn = document.getElementById('btnKeyboardHelp');
    
    if (hints) {
        hints.classList.toggle('visible');
        btn.classList.toggle('active');
        
        // Auto-hide after 5 seconds
        if (hints.classList.contains('visible')) {
            setTimeout(() => {
                hints.classList.remove('visible');
                btn.classList.remove('active');
            }, 5000);
        }
    }
}

// ============================================
// KEYBOARD SHORTCUTS
// ============================================

function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Don't trigger when typing in inputs
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return;
        }
        
        switch(e.key.toLowerCase()) {
            case 'f':
                e.preventDefault();
                toggleFullscreen();
                break;
            case 'l':
                e.preventDefault();
                goToMyLocation();
                break;
            case 'a':
                e.preventDefault();
                showAllMarkers();
                break;
            case 'r':
                e.preventDefault();
                reloadMap();
                break;
            case 'escape':
                if (isFullscreen) {
                    toggleFullscreen();
                }
                break;
            case '?':
                e.preventDefault();
                toggleKeyboardHints();
                break;
        }
    });
}

// ============================================
// SEARCH SUGGESTIONS
// ============================================

function setupSearchSuggestions() {
    const searchInput = document.getElementById('searchInput');
    const suggestionsContainer = document.getElementById('searchSuggestions');
    
    if (!searchInput || !suggestionsContainer) return;
    
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim().toLowerCase();
        
        if (currentSearchTimeout) {
            clearTimeout(currentSearchTimeout);
        }
        
        if (query.length < 2) {
            hideSuggestions();
            return;
        }
        
        currentSearchTimeout = setTimeout(() => {
            showSearchSuggestions(query);
        }, 150);
    });
    
    searchInput.addEventListener('keydown', (e) => {
        const suggestions = suggestionsContainer.querySelectorAll('.suggestion-item');
        
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            selectedSuggestionIndex = Math.min(selectedSuggestionIndex + 1, suggestions.length - 1);
            updateSelectedSuggestion(suggestions);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            selectedSuggestionIndex = Math.max(selectedSuggestionIndex - 1, -1);
            updateSelectedSuggestion(suggestions);
        } else if (e.key === 'Enter' && selectedSuggestionIndex >= 0) {
            e.preventDefault();
            suggestions[selectedSuggestionIndex].click();
        } else if (e.key === 'Escape') {
            hideSuggestions();
        }
    });
    
    // Hide suggestions when clicking outside
    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !suggestionsContainer.contains(e.target)) {
            hideSuggestions();
        }
    });
    
    searchInput.addEventListener('focus', () => {
        if (searchInput.value.trim().length >= 2) {
            showSearchSuggestions(searchInput.value.trim().toLowerCase());
        }
    });
}

function showSearchSuggestions(query) {
    const container = document.getElementById('searchSuggestions');
    if (!container) return;
    
    const matchingCenters = centersData.filter(c => 
        (c.name && c.name.toLowerCase().includes(query)) ||
        (c.codeInstitution && c.codeInstitution.toLowerCase().includes(query)) ||
        (c.cityName && c.cityName.toLowerCase().includes(query))
    ).slice(0, 5);
    
    const matchingRegionals = regionalsData.filter(r =>
        (r.name && r.name.toLowerCase().includes(query))
    ).slice(0, 3);
    
    if (matchingCenters.length === 0 && matchingRegionals.length === 0) {
        container.innerHTML = `
            <div class="suggestion-item" style="justify-content: center; color: #888;">
                <i class="fas fa-search"></i>
                <span>No se encontraron resultados</span>
            </div>
        `;
        container.classList.add('visible');
        return;
    }
    
    let html = '';
    
    matchingRegionals.forEach((r, i) => {
        html += `
            <div class="suggestion-item" data-type="regional" data-id="${r.id}" data-lat="${r.latitude}" data-lng="${r.longitude}">
                <i class="fas fa-map-marked-alt" style="color: ${SENA_GREEN};"></i>
                <div class="suggestion-text">
                    <div class="suggestion-name">${highlightMatch(r.name, query)}</div>
                    <div class="suggestion-detail">Regional • ${r.departamentName || ''}</div>
                </div>
            </div>
        `;
    });
    
    matchingCenters.forEach((c, i) => {
        html += `
            <div class="suggestion-item" data-type="center" data-id="${c.id}" data-lat="${c.latitude}" data-lng="${c.longitude}">
                <i class="fas fa-building" style="color: #0078d4;"></i>
                <div class="suggestion-text">
                    <div class="suggestion-name">${highlightMatch(c.name, query)}</div>
                    <div class="suggestion-detail">${c.regionalName || ''} • ${c.cityName || ''}</div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
    container.classList.add('visible');
    selectedSuggestionIndex = -1;
    
    // Add click listeners
    container.querySelectorAll('.suggestion-item').forEach(item => {
        item.addEventListener('click', () => {
            const lat = parseFloat(item.dataset.lat);
            const lng = parseFloat(item.dataset.lng);
            const type = item.dataset.type;
            
            if (!isNaN(lat) && !isNaN(lng)) {
                map.flyTo([lat, lng], 15, { duration: 1 });
                
                // Find and open the popup
                setTimeout(() => {
                    const layers = type === 'regional' ? regionalsLayer : markersLayer;
                    layers.eachLayer(layer => {
                        const latlng = layer.getLatLng();
                        if (Math.abs(latlng.lat - lat) < 0.0001 && Math.abs(latlng.lng - lng) < 0.0001) {
                            layer.openPopup();
                        }
                    });
                }, 1200);
                
                updateLocationIndicator(lat, lng);
            }
            
            hideSuggestions();
            document.getElementById('searchInput').value = item.querySelector('.suggestion-name').textContent;
        });
    });
}

function highlightMatch(text, query) {
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<strong style="color: ' + SENA_GREEN + ';">$1</strong>');
}

function updateSelectedSuggestion(suggestions) {
    suggestions.forEach((s, i) => {
        s.classList.toggle('active', i === selectedSuggestionIndex);
    });
}

function hideSuggestions() {
    const container = document.getElementById('searchSuggestions');
    if (container) {
        container.classList.remove('visible');
        selectedSuggestionIndex = -1;
    }
}

// ============================================
// LOCATION INDICATOR
// ============================================

function updateLocationIndicator(lat, lng) {
    const indicator = document.getElementById('locationText');
    if (!indicator) return;
    
    // Try to find nearest center or regional
    let nearest = null;
    let minDistance = Infinity;
    
    [...centersData, ...regionalsData].forEach(item => {
        if (item.latitude && item.longitude) {
            const distance = Math.sqrt(
                Math.pow(item.latitude - lat, 2) + 
                Math.pow(item.longitude - lng, 2)
            );
            if (distance < minDistance) {
                minDistance = distance;
                nearest = item;
            }
        }
    });
    
    if (nearest && minDistance < 0.5) {
        indicator.textContent = nearest.cityName || nearest.departamentName || 'Colombia';
    } else {
        indicator.textContent = 'Colombia';
    }
}

