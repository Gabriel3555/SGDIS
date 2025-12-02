// centers-map-custom.js - Mapa personalizado de Colombia sin librerías externas

// Colores SENA
const SENA_GREEN = '#00AF00';
const SENA_GREEN_DARK = '#008800';
const SENA_GREEN_LIGHT = '#39B54A';

// Datos del mapa
let regionalsData = [];
let centersData = [];
let selectedRegional = null;
let viewMode = 'regionals'; // 'regionals' o 'centers'

// Coordenadas SVG de las regionales principales de Colombia (simplificado)
const colombiaRegionsPath = {
    // Región Caribe
    'atlantico': 'M 520,150 L 560,140 L 580,155 L 570,170 L 530,165 Z',
    'bolivar': 'M 480,180 L 540,170 L 560,195 L 540,220 L 490,210 Z',
    'magdalena': 'M 560,140 L 600,135 L 610,160 L 595,180 L 570,170 Z',
    'cesar': 'M 600,180 L 640,175 L 650,200 L 630,220 L 600,210 Z',
    'laguajira': 'M 640,90 L 720,80 L 730,120 L 700,150 L 650,155 L 640,130 Z',
    'cordoba': 'M 440,195 L 490,185 L 510,210 L 490,235 L 450,225 Z',
    'sucre': 'M 510,210 L 550,205 L 565,230 L 545,245 L 510,235 Z',
    
    // Región Andina
    'antioquia': 'M 380,260 L 470,245 L 490,280 L 470,320 L 410,315 L 380,295 Z',
    'santander': 'M 520,240 L 590,230 L 610,265 L 595,300 L 540,295 L 520,270 Z',
    'nortesantander': 'M 610,210 L 670,205 L 685,240 L 670,270 L 620,265 Z',
    'boyaca': 'M 540,300 L 610,290 L 630,330 L 610,370 L 560,365 L 540,335 Z',
    'cundinamarca': 'M 470,340 L 540,330 L 560,370 L 540,410 L 480,405 L 470,375 Z',
    'caldas': 'M 380,330 L 430,325 L 445,355 L 430,380 L 390,375 Z',
    'risaralda': 'M 345,350 L 385,345 L 395,375 L 380,395 L 350,390 Z',
    'quindio': 'M 360,385 L 395,380 L 405,405 L 390,425 L 365,420 Z',
    'tolima': 'M 410,380 L 470,375 L 485,420 L 465,460 L 420,455 Z',
    'huila': 'M 430,460 L 485,455 L 500,500 L 480,540 L 440,535 Z',
    
    // Región Pacífica
    'choco': 'M 240,220 L 340,210 L 380,260 L 370,330 L 290,340 L 250,300 L 240,260 Z',
    'valledelcauca': 'M 320,380 L 400,370 L 420,430 L 400,480 L 340,475 L 320,430 Z',
    'cauca': 'M 340,480 L 410,475 L 430,530 L 410,580 L 360,575 L 340,530 Z',
    'narino': 'M 360,580 L 420,575 L 440,640 L 415,690 L 370,685 L 360,640 Z',
    
    // Región Orinoquía
    'arauca': 'M 670,270 L 750,260 L 770,300 L 750,335 L 690,330 Z',
    'casanare': 'M 610,330 L 690,325 L 710,380 L 690,425 L 630,420 Z',
    'vichada': 'M 690,425 L 760,420 L 775,480 L 760,535 L 710,530 Z',
    'meta': 'M 540,410 L 630,405 L 650,470 L 630,525 L 560,520 Z',
    
    // Región Amazonía
    'guaviare': 'M 560,525 L 640,520 L 660,580 L 640,630 L 580,625 Z',
    'guainia': 'M 710,530 L 770,525 L 785,590 L 770,640 L 730,635 Z',
    'vaupes': 'M 640,630 L 710,625 L 730,690 L 710,740 L 660,735 Z',
    'caqueta': 'M 480,540 L 560,535 L 580,600 L 560,660 L 500,655 Z',
    'amazonas': 'M 500,660 L 580,655 L 600,730 L 580,810 L 520,805 L 500,750 Z',
    'putumayo': 'M 420,640 L 490,635 L 510,700 L 490,750 L 440,745 Z'
};

// Posiciones aproximadas para los marcadores de regionales (centros de las regiones)
const regionalPositions = {
    'atlantico': { x: 540, y: 155 },
    'bolivar': { x: 515, y: 195 },
    'magdalena': { x: 585, y: 155 },
    'cesar': { x: 620, y: 195 },
    'laguajira': { x: 685, y: 115 },
    'cordoba': { x: 470, y: 215 },
    'sucre': { x: 530, y: 225 },
    'antioquia': { x: 435, y: 285 },
    'santander': { x: 560, y: 265 },
    'nortesantander': { x: 645, y: 235 },
    'boyaca': { x: 575, y: 330 },
    'cundinamarca': { x: 505, y: 370 },
    'bogota': { x: 505, y: 370 }, // Mismo que Cundinamarca
    'caldas': { x: 410, y: 350 },
    'risaralda': { x: 368, y: 370 },
    'quindio': { x: 378, y: 405 },
    'tolima': { x: 445, y: 415 },
    'huila': { x: 460, y: 495 },
    'choco': { x: 295, y: 270 },
    'valledelcauca': { x: 360, y: 425 },
    'valle': { x: 360, y: 425 },
    'cauca': { x: 375, y: 530 },
    'narino': { x: 390, y: 635 },
    'arauca': { x: 710, y: 300 },
    'casanare': { x: 650, y: 375 },
    'vichada': { x: 725, y: 475 },
    'meta': { x: 585, y: 465 },
    'guaviare': { x: 600, y: 575 },
    'guainia': { x: 740, y: 580 },
    'vaupes': { x: 675, y: 685 },
    'caqueta': { x: 520, y: 595 },
    'amazonas': { x: 540, y: 730 },
    'putumayo': { x: 465, y: 690 }
};

// Inicializar
document.addEventListener('DOMContentLoaded', function() {
    drawColombiaMap();
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

// Dibujar el mapa de Colombia
function drawColombiaMap() {
    const svg = document.getElementById('colombiaMap');
    
    // Dibujar las regiones
    Object.keys(colombiaRegionsPath).forEach(regionKey => {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', colombiaRegionsPath[regionKey]);
        path.setAttribute('class', 'regional-path');
        path.setAttribute('data-region', regionKey);
        path.setAttribute('id', `region-${regionKey}`);
        
        // Eventos
        path.addEventListener('click', () => handleRegionClick(regionKey));
        path.addEventListener('mouseenter', (e) => showTooltip(e, regionKey));
        path.addEventListener('mouseleave', hideTooltip);
        path.addEventListener('mousemove', moveTooltip);
        
        svg.appendChild(path);
    });
}

// Cargar datos del API
async function loadMapData() {
    try {
        const token = localStorage.getItem('jwt');
        
        // Cargar regionales y centros
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
            renderMarkers();
            
            // Ocultar loading
            document.getElementById('loading').style.display = 'none';
        }
    } catch (error) {
        console.error('Error loading data:', error);
        document.getElementById('loading').innerHTML = '<p style="color: red;">Error al cargar los datos</p>';
    }
}

// Renderizar marcadores
function renderMarkers() {
    const svg = document.getElementById('colombiaMap');
    
    // Limpiar marcadores existentes
    document.querySelectorAll('.regional-marker, .center-marker').forEach(m => m.remove());
    
    if (viewMode === 'regionals' || !selectedRegional) {
        // Mostrar marcadores de regionales
        regionalsData.forEach(regional => {
            const regionalKey = normalizeRegionalName(regional.name);
            const pos = regionalPositions[regionalKey];
            
            if (pos) {
                const marker = createMarker(pos.x, pos.y, 'regional', regional);
                svg.appendChild(marker);
            }
        });
    }
    
    if (selectedRegional) {
        // Mostrar centros de la regional seleccionada
        const filteredCenters = centersData.filter(c => c.regionalId === selectedRegional.id);
        
        filteredCenters.forEach((center, index) => {
            // Calcular posición dentro de la región
            const regionalKey = normalizeRegionalName(selectedRegional.name);
            const basePos = regionalPositions[regionalKey];
            
            if (basePos) {
                // Distribuir los centros alrededor de la posición base
                const angle = (index / filteredCenters.length) * Math.PI * 2;
                const radius = 30;
                const x = basePos.x + Math.cos(angle) * radius;
                const y = basePos.y + Math.sin(angle) * radius;
                
                const marker = createMarker(x, y, 'center', center);
                svg.appendChild(marker);
            }
        });
    }
}

// Crear un marcador
function createMarker(x, y, type, data) {
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', x);
    circle.setAttribute('cy', y);
    circle.setAttribute('class', type === 'regional' ? 'regional-marker' : 'center-marker');
    circle.setAttribute('r', type === 'regional' ? 8 : 6);
    circle.setAttribute('data-type', type);
    circle.setAttribute('data-id', data.id);
    
    circle.addEventListener('click', () => handleMarkerClick(type, data));
    circle.addEventListener('mouseenter', (e) => showMarkerTooltip(e, type, data));
    circle.addEventListener('mouseleave', hideTooltip);
    circle.addEventListener('mousemove', moveTooltip);
    
    return circle;
}

// Manejar click en región
function handleRegionClick(regionKey) {
    // Buscar la regional correspondiente
    const regional = regionalsData.find(r => 
        normalizeRegionalName(r.name) === regionKey
    );
    
    if (regional) {
        selectRegional(regional);
    }
}

// Manejar click en marcador
function handleMarkerClick(type, data) {
    if (type === 'regional') {
        selectRegional(data);
    } else {
        showCenterInfo(data);
    }
}

// Seleccionar una regional
function selectRegional(regional) {
    selectedRegional = regional;
    
    // Actualizar UI
    document.querySelectorAll('.regional-path').forEach(p => p.classList.remove('active'));
    const regionalKey = normalizeRegionalName(regional.name);
    const path = document.getElementById(`region-${regionalKey}`);
    if (path) {
        path.classList.add('active');
    }
    
    // Actualizar stats
    document.getElementById('selectedRegional').textContent = regional.name;
    
    // Mostrar centros
    viewMode = 'centers';
    renderMarkers();
    showRegionalInfo(regional);
}

// Mostrar información de regional
function showRegionalInfo(regional) {
    const filteredCenters = centersData.filter(c => c.regionalId === regional.id);
    
    let html = `
        <div style="background: linear-gradient(135deg, ${SENA_GREEN} 0%, ${SENA_GREEN_DARK} 100%); 
                    color: white; padding: 15px; border-radius: 12px; margin-bottom: 15px;">
            <h4 style="font-size: 18px; font-weight: bold; margin: 0 0 10px 0;">
                <i class="fas fa-map-marked-alt mr-2"></i>${regional.name}
            </h4>
            <p style="margin: 5px 0; font-size: 14px;">
                <i class="fas fa-id-card mr-2"></i>Código: ${regional.regionalCode || 'N/A'}
            </p>
            <p style="margin: 5px 0; font-size: 14px;">
                <i class="fas fa-building mr-2"></i>Centros: ${filteredCenters.length}
            </p>
        </div>
        <h4 style="color: ${SENA_GREEN}; font-weight: bold; margin-bottom: 10px;">
            <i class="fas fa-list mr-2"></i>Centros de Formación (${filteredCenters.length})
        </h4>
    `;
    
    if (filteredCenters.length === 0) {
        html += '<p style="color: #999; font-style: italic;">No hay centros registrados en esta regional.</p>';
    } else {
        filteredCenters.forEach(center => {
            html += `
                <div class="info-item" onclick='showCenterDetail(${JSON.stringify(center).replace(/'/g, "&apos;")})'>
                    <h4><i class="fas fa-building mr-2"></i>${center.name}</h4>
                    <p><i class="fas fa-barcode mr-1"></i>Código: ${center.codeInstitution || 'N/A'}</p>
                    <p><i class="fas fa-city mr-1"></i>Ciudad: ${center.cityName || 'N/A'}</p>
                </div>
            `;
        });
    }
    
    document.getElementById('infoContent').innerHTML = html;
}

// Mostrar detalle de centro
function showCenterInfo(center) {
    const html = `
        <div style="background: linear-gradient(135deg, #0078d4 0%, #005a9e 100%); 
                    color: white; padding: 15px; border-radius: 12px; margin-bottom: 15px;">
            <h4 style="font-size: 18px; font-weight: bold; margin: 0 0 10px 0;">
                <i class="fas fa-building mr-2"></i>${center.name}
            </h4>
            <p style="margin: 5px 0; font-size: 14px;">
                <i class="fas fa-barcode mr-2"></i>Código: ${center.codeInstitution || 'N/A'}
            </p>
            <p style="margin: 5px 0; font-size: 14px;">
                <i class="fas fa-map-marked-alt mr-2"></i>Regional: ${center.regionalName || 'N/A'}
            </p>
            <p style="margin: 5px 0; font-size: 14px;">
                <i class="fas fa-city mr-2"></i>Ciudad: ${center.cityName || 'N/A'}
            </p>
            <p style="margin: 5px 0; font-size: 14px;">
                <i class="fas fa-map mr-2"></i>Departamento: ${center.departamentName || 'N/A'}
            </p>
        </div>
        <button onclick="goBackToRegional()" class="w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg" style="margin-top: 10px;">
            <i class="fas fa-arrow-left mr-2"></i>Volver a Regional
        </button>
    `;
    
    document.getElementById('infoContent').innerHTML = html;
}

// Volver a la regional
function goBackToRegional() {
    if (selectedRegional) {
        showRegionalInfo(selectedRegional);
    }
}

// Función global para mostrar detalle
window.showCenterDetail = function(center) {
    showCenterInfo(center);
};

// Actualizar estadísticas
function updateStats() {
    document.getElementById('totalRegionals').textContent = regionalsData.length;
    document.getElementById('totalCenters').textContent = centersData.length;
}

// Reiniciar mapa
function resetMap() {
    selectedRegional = null;
    viewMode = 'regionals';
    document.querySelectorAll('.regional-path').forEach(p => p.classList.remove('active'));
    document.getElementById('selectedRegional').textContent = '-';
    document.getElementById('infoContent').innerHTML = '<p style="color: #666; font-size: 14px;">Haz clic en una región para ver sus centros.</p>';
    renderMarkers();
}

// Cambiar vista
function toggleView() {
    viewMode = viewMode === 'regionals' ? 'centers' : 'regionals';
    renderMarkers();
}

// Normalizar nombre de regional
function normalizeRegionalName(name) {
    return name.toLowerCase()
        .replace(/á/g, 'a').replace(/é/g, 'e').replace(/í/g, 'i')
        .replace(/ó/g, 'o').replace(/ú/g, 'u').replace(/ñ/g, 'n')
        .replace(/\s+/g, '').replace(/-/g, '').replace(/\./g, '')
        .replace('d.c.', '').replace('dc', '');
}

// Tooltips
function showTooltip(e, regionKey) {
    const tooltip = document.getElementById('tooltip');
    const regional = regionalsData.find(r => normalizeRegionalName(r.name) === regionKey);
    
    if (regional) {
        tooltip.textContent = regional.name;
        tooltip.classList.add('show');
    }
}

function showMarkerTooltip(e, type, data) {
    const tooltip = document.getElementById('tooltip');
    tooltip.textContent = data.name;
    tooltip.classList.add('show');
}

function hideTooltip() {
    const tooltip = document.getElementById('tooltip');
    tooltip.classList.remove('show');
}

function moveTooltip(e) {
    const tooltip = document.getElementById('tooltip');
    tooltip.style.left = (e.pageX + 15) + 'px';
    tooltip.style.top = (e.pageY + 15) + 'px';
}

