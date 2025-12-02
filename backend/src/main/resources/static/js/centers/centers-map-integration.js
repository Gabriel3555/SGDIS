// centers-map-integration.js - Integración del mapa de Colombia con la API SENA

// Variables globales
let regionalsData = [];
let centersData = [];
let currentSelectedDepartment = null;
let mapInstance = null;

// Mapeo de nombres de departamentos a códigos del mapa
const departmentCodeMap = {
    'Amazonas': 'COAMA',
    'Antioquia': 'COANT',
    'Arauca': 'COARA',
    'Atlántico': 'COATL',
    'Atlant': 'COATL',
    'Bolívar': 'COBOL',
    'Bolivar': 'COBOL',
    'Boyacá': 'COBOY',
    'Boyaca': 'COBOY',
    'Caldas': 'COCAL',
    'Caquetá': 'COCAQ',
    'Caqueta': 'COCAQ',
    'Casanare': 'COCAS',
    'Cauca': 'COCAU',
    'Cesar': 'COCES',
    'Chocó': 'COCHO',
    'Choco': 'COCHO',
    'Córdoba': 'COCOR',
    'Cordoba': 'COCOR',
    'Cundinamarca': 'COCUN',
    'Bogotá': 'CODC',
    'Bogota': 'CODC',
    'Distrito Capital': 'CODC',
    'Guainía': 'COGUA',
    'Guainia': 'COGUA',
    'Guaviare': 'COGUV',
    'Huila': 'COHUI',
    'La Guajira': 'COLAG',
    'Magdalena': 'COMAG',
    'Meta': 'COMET',
    'Nariño': 'CONAR',
    'Narino': 'CONAR',
    'Norte de Santander': 'CONSA',
    'Putumayo': 'COPUT',
    'Quindío': 'COQUI',
    'Quindio': 'COQUI',
    'Risaralda': 'CORIS',
    'Santander': 'COSAN',
    'San Andrés y Providencia': 'COSAP',
    'Sucre': 'COSUC',
    'Tolima': 'COTOL',
    'Valle del Cauca': 'COVAC',
    'Valle': 'COVAC',
    'Vaupés': 'COVAU',
    'Vaupes': 'COVAU',
    'Vichada': 'COVID'
};

// Inicializar
document.addEventListener('DOMContentLoaded', function() {
    loadMapData();
    loadCurrentUserInfo();
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
        console.error('Error loading user info:', error);
    }
}

// Cargar datos desde la API
async function loadMapData() {
    try {
        const token = localStorage.getItem('jwt');
        
        const [regionalsResponse, centersResponse] = await Promise.all([
            fetch('/api/v1/regional/map', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            }),
            fetch('/api/v1/institutions/map', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            })
        ]);

        if (regionalsResponse.ok && centersResponse.ok) {
            regionalsData = await regionalsResponse.json();
            centersData = await centersResponse.json();
            
            updateStats();
            initializeMap();
            
            // Ocultar loading
            document.getElementById('loading').style.display = 'none';
        } else {
            throw new Error('Error al cargar los datos');
        }
    } catch (error) {
        console.error('Error loading data:', error);
        document.getElementById('loading').innerHTML = `
            <p style="color: red; font-weight: bold;">
                <i class="fas fa-exclamation-triangle mr-2"></i>
                Error al cargar los datos del mapa
            </p>
        `;
    }
}

// Inicializar el mapa con los datos
function initializeMap() {
    // Modificar la configuración del mapa para agregar eventos de click
    if (typeof simplemaps_countrymap_mapdata !== 'undefined') {
        // Agregar eventos a cada estado
        Object.keys(simplemaps_countrymap_mapdata.state_specific).forEach(stateCode => {
            const state = simplemaps_countrymap_mapdata.state_specific[stateCode];
            
            // Contar centros en este departamento
            const centersInState = getCentersByStateCode(stateCode);
            
            // Personalizar descripción
            state.description = `
                <div style="padding: 10px; min-width: 200px;">
                    <h4 style="margin: 0 0 10px 0; color: #00AF00; font-size: 16px; font-weight: bold;">
                        <i class="fas fa-map-marker-alt" style="margin-right: 5px;"></i>
                        ${state.name}
                    </h4>
                    <p style="margin: 5px 0; font-size: 14px;">
                        <i class="fas fa-building" style="color: #00AF00; margin-right: 5px;"></i>
                        <strong>Centros SENA:</strong> ${centersInState.length}
                    </p>
                    <p style="margin: 10px 0 0 0; font-size: 12px; color: #666; font-style: italic;">
                        Haga clic para ver los centros de formación
                    </p>
                </div>
            `;
            
            // Colorear según cantidad de centros
            if (centersInState.length > 0) {
                // Verde más oscuro para departamentos con más centros
                const intensity = Math.min(centersInState.length / 20, 1);
                state.color = interpolateColor('#FFFFFF', '#39B54A', intensity);
            }
        });
        
        // Esperar a que el mapa se inicialice
        setTimeout(() => {
            // Buscar el objeto del mapa
            if (typeof simplemaps_countrymap !== 'undefined') {
                mapInstance = simplemaps_countrymap;
                
                // Agregar evento de click con centrado mejorado
                simplemaps_countrymap.hooks.click_state = function(id) {
                    // Manejar el click del estado
                    handleStateClick(id);
                };
                
                // Hook después de completar el zoom
                simplemaps_countrymap.hooks.zooming_complete = function() {
                    // Obtener el contenedor del mapa
                    const mapDiv = document.getElementById('map');
                    const mapSvg = mapDiv ? mapDiv.querySelector('svg') : null;
                    
                    if (mapSvg && simplemaps_countrymap.zoom_level > 1) {
                        // Obtener la posición actual del SVG
                        const currentTransform = mapSvg.style.transform || '';
                        
                        // Extraer los valores de translate actuales
                        const translateMatch = currentTransform.match(/translate\(([^,]+)px,\s*([^)]+)px\)/);
                        
                        if (translateMatch) {
                            const currentX = parseFloat(translateMatch[1]) || 0;
                            const currentY = parseFloat(translateMatch[2]) || 0;
                            
                            // Bajar 50px más
                            const newY = currentY + 50;
                            
                            // Aplicar el nuevo transform manteniendo el resto de transformaciones
                            const otherTransforms = currentTransform.replace(/translate\([^)]+\)/, '');
                            mapSvg.style.transform = `translate(${currentX}px, ${newY}px) ${otherTransforms}`;
                        }
                    }
                };
                
                simplemaps_countrymap.hooks.over_state = function(id) {
                    // Opcional: agregar efectos al pasar el mouse
                };
                
                simplemaps_countrymap.hooks.zooming_complete = function() {
                    // Callback después de completar el zoom
                };
            }
        }, 500);
    }
}

// Obtener centros por código de departamento
function getCentersByStateCode(stateCode) {
    const stateName = simplemaps_countrymap_mapdata.state_specific[stateCode].name;
    
    return centersData.filter(center => {
        if (!center.departamentName) return false;
        
        // Normalizar y comparar
        const centerDept = normalizeString(center.departamentName);
        const mapDept = normalizeString(stateName);
        
        return centerDept === mapDept || 
               departmentCodeMap[center.departamentName] === stateCode;
    });
}

// Manejar click en departamento
function handleStateClick(stateCode) {
    currentSelectedDepartment = stateCode;
    const stateName = simplemaps_countrymap_mapdata.state_specific[stateCode].name;
    const centers = getCentersByStateCode(stateCode);
    
    // Actualizar contador
    document.getElementById('selectedCount').textContent = centers.length;
    
    // Mostrar panel de información
    showDepartmentInfo(stateName, centers, stateCode);
    
    // Scroll al panel
    document.getElementById('infoPanel').scrollIntoView({ 
        behavior: 'smooth', 
        block: 'nearest' 
    });
}

// Mostrar información del departamento
function showDepartmentInfo(departmentName, centers, stateCode) {
    const panel = document.getElementById('infoPanel');
    const title = document.getElementById('infoPanelTitle');
    const content = document.getElementById('infoContent');
    const overlay = document.getElementById('infoPanelOverlay');
    
    title.textContent = departmentName;
    
    if (centers.length === 0) {
        content.innerHTML = `
            <div style="text-align: center; padding: 40px 20px; color: #999;">
                <i class="fas fa-inbox" style="font-size: 48px; margin-bottom: 15px; opacity: 0.5;"></i>
                <p style="font-size: 16px; font-weight: 600;">No hay centros de formación SENA registrados</p>
                <p style="font-size: 14px; margin-top: 10px;">en el departamento de ${departmentName}</p>
            </div>
        `;
    } else {
        let html = `
            <div style="background: linear-gradient(135deg, #00AF00 0%, #008800 100%); 
                        color: white; padding: 20px; border-radius: 12px; margin-bottom: 20px;
                        box-shadow: 0 4px 15px rgba(0, 175, 0, 0.3);">
                <div style="display: flex; justify-content: space-around; text-align: center;">
                    <div>
                        <div style="font-size: 36px; font-weight: bold;">${centers.length}</div>
                        <div style="font-size: 13px; opacity: 0.9;">Centros</div>
                    </div>
                    <div>
                        <div style="font-size: 36px; font-weight: bold;">${new Set(centers.map(c => c.cityName)).size}</div>
                        <div style="font-size: 13px; opacity: 0.9;">Ciudades</div>
                    </div>
                    <div>
                        <div style="font-size: 36px; font-weight: bold;">${new Set(centers.map(c => c.regionalName)).size}</div>
                        <div style="font-size: 13px; opacity: 0.9;">Regionales</div>
                    </div>
                </div>
            </div>
            <div class="centers-grid">
        `;
        
        centers.forEach(center => {
            html += `
                <div class="center-card" onclick="showCenterDetail('${center.id}')">
                    <h4>
                        <i class="fas fa-building"></i>
                        ${center.name}
                    </h4>
                    <p>
                        <i class="fas fa-barcode"></i>
                        Código: ${center.codeInstitution || 'N/A'}
                    </p>
                    <p>
                        <i class="fas fa-map-marked-alt"></i>
                        Regional: ${center.regionalName || 'N/A'}
                    </p>
                    <p>
                        <i class="fas fa-city"></i>
                        Ciudad: ${center.cityName || 'N/A'}
                    </p>
                </div>
            `;
        });
        
        html += '</div>';
        content.innerHTML = html;
    }
    
    panel.style.display = 'block';
    overlay.classList.add('active');
}

// Mostrar detalle de un centro
window.showCenterDetail = function(centerId) {
    const center = centersData.find(c => c.id.toString() === centerId.toString());
    if (!center) return;
    
    const content = document.getElementById('infoContent');
    content.innerHTML = `
        <div style="animation: slideUp 0.5s ease-out;">
            <button onclick="goBackToDepartment()" class="control-btn" style="margin-bottom: 20px;">
                <i class="fas fa-arrow-left"></i>
                <span>Volver al Departamento</span>
            </button>
            
            <div style="background: linear-gradient(135deg, #0078d4 0%, #005a9e 100%); 
                        color: white; padding: 25px; border-radius: 12px; margin-bottom: 20px;
                        box-shadow: 0 4px 15px rgba(0, 120, 212, 0.3);">
                <h3 style="margin: 0 0 15px 0; font-size: 20px; font-weight: bold;">
                    <i class="fas fa-building mr-2"></i>
                    ${center.name}
                </h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; font-size: 14px;">
                    <div>
                        <i class="fas fa-barcode mr-2"></i>
                        <strong>Código:</strong><br>
                        <span style="font-size: 16px; margin-left: 24px;">${center.codeInstitution || 'N/A'}</span>
                    </div>
                    <div>
                        <i class="fas fa-map-marked-alt mr-2"></i>
                        <strong>Regional:</strong><br>
                        <span style="font-size: 16px; margin-left: 24px;">${center.regionalName || 'N/A'}</span>
                    </div>
                    <div>
                        <i class="fas fa-city mr-2"></i>
                        <strong>Ciudad:</strong><br>
                        <span style="font-size: 16px; margin-left: 24px;">${center.cityName || 'N/A'}</span>
                    </div>
                    <div>
                        <i class="fas fa-map mr-2"></i>
                        <strong>Departamento:</strong><br>
                        <span style="font-size: 16px; margin-left: 24px;">${center.departamentName || 'N/A'}</span>
                    </div>
                </div>
            </div>
        </div>
    `;
};

// Volver al departamento
window.goBackToDepartment = function() {
    if (currentSelectedDepartment) {
        handleStateClick(currentSelectedDepartment);
    }
};

// Reiniciar mapa
window.resetMap = function() {
    currentSelectedDepartment = null;
    document.getElementById('selectedCount').textContent = '0';
    document.getElementById('infoPanel').style.display = 'none';
    document.getElementById('infoPanelOverlay').classList.remove('active');
    
    if (mapInstance && mapInstance.back) {
        mapInstance.back();
    }
};

// Mostrar todos los centros
window.showAllCenters = function() {
    const panel = document.getElementById('infoPanel');
    const title = document.getElementById('infoPanelTitle');
    const content = document.getElementById('infoContent');
    const overlay = document.getElementById('infoPanelOverlay');
    
    title.textContent = 'Todos los Centros SENA de Colombia';
    document.getElementById('selectedCount').textContent = centersData.length;
    
    let html = '<div class="centers-grid">';
    
    centersData.forEach(center => {
        html += `
            <div class="center-card" onclick="showCenterDetail('${center.id}')">
                <h4>
                    <i class="fas fa-building"></i>
                    ${center.name}
                </h4>
                <p>
                    <i class="fas fa-barcode"></i>
                    Código: ${center.codeInstitution || 'N/A'}
                </p>
                <p>
                    <i class="fas fa-map-marked-alt"></i>
                    Regional: ${center.regionalName || 'N/A'}
                </p>
                <p>
                    <i class="fas fa-map"></i>
                    Departamento: ${center.departamentName || 'N/A'}
                </p>
                <p>
                    <i class="fas fa-city"></i>
                    Ciudad: ${center.cityName || 'N/A'}
                </p>
            </div>
        `;
    });
    
    html += '</div>';
    content.innerHTML = html;
    panel.style.display = 'block';
    overlay.classList.add('active');
};

// Actualizar estadísticas
function updateStats() {
    document.getElementById('totalCenters').textContent = centersData.length;
    document.getElementById('totalRegionals').textContent = regionalsData.length || 33;
}

// Utilidades
function normalizeString(str) {
    return str.toLowerCase()
        .replace(/á/g, 'a').replace(/é/g, 'e').replace(/í/g, 'i')
        .replace(/ó/g, 'o').replace(/ú/g, 'u').replace(/ñ/g, 'n')
        .trim();
}

function interpolateColor(color1, color2, factor) {
    const c1 = hexToRgb(color1);
    const c2 = hexToRgb(color2);
    
    const r = Math.round(c1.r + (c2.r - c1.r) * factor);
    const g = Math.round(c1.g + (c2.g - c1.g) * factor);
    const b = Math.round(c1.b + (c2.b - c1.b) * factor);
    
    return rgbToHex(r, g, b);
}

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function rgbToHex(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

