// Import/Export functionality

let regionals = [];
let institutions = {};
let inventories = {};

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    loadRegionals();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    // Import dropdowns
    document.getElementById('importRegionalSelect').addEventListener('change', function() {
        const regionalId = this.value;
        loadInstitutionsForImport(regionalId);
        resetImportDropdowns(['institution', 'inventory']);
        updateImportButtonState();
    });

    document.getElementById('importInstitutionSelect').addEventListener('change', function() {
        const institutionId = this.value;
        loadInventoriesForImport(institutionId);
        resetImportDropdowns(['inventory']);
        updateImportButtonState();
    });

    document.getElementById('importInventorySelect').addEventListener('change', function() {
        updateImportButtonState();
    });

    // Export dropdowns
    document.getElementById('exportRegionalSelect').addEventListener('change', function() {
        const regionalId = this.value;
        loadInstitutionsForExport(regionalId);
        resetExportDropdowns(['institution', 'inventory']);
        updateExportButtonState();
    });

    document.getElementById('exportInstitutionSelect').addEventListener('change', function() {
        const institutionId = this.value;
        loadInventoriesForExport(institutionId);
        resetExportDropdowns(['inventory']);
        updateExportButtonState();
    });

    document.getElementById('exportInventorySelect').addEventListener('change', function() {
        updateExportButtonState();
    });

    // File input
    document.getElementById('importFileInput').addEventListener('change', function(e) {
        const file = e.target.files[0];
        const fileName = file?.name || 'Ningún archivo seleccionado';
        document.getElementById('importFileName').textContent = fileName;
        
        if (file) {
            previewExcelFile(file);
        } else {
            closePreview();
        }
        
        updateImportButtonState();
    });

    // Import button
    document.getElementById('importButton').addEventListener('click', handleImport);

    // Export button
    document.getElementById('exportButton').addEventListener('click', handleExport);
}

// Load all regionals
async function loadRegionals() {
    try {
        const token = localStorage.getItem('jwt');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch('/api/v1/regional', {
            method: 'GET',
            headers: headers
        });

        if (response.ok) {
            regionals = await response.json();
            populateRegionalDropdowns();
        } else {
            console.error('Error loading regionals:', response.status);
            showErrorToastLocal('Error', 'No se pudieron cargar las regionales');
        }
    } catch (error) {
        console.error('Error loading regionals:', error);
        showErrorToastLocal('Error', 'Error al cargar las regionales');
    }
}

// Populate regional dropdowns
function populateRegionalDropdowns() {
    const importSelect = document.getElementById('importRegionalSelect');
    const exportSelect = document.getElementById('exportRegionalSelect');

    // Clear existing options (except first)
    importSelect.innerHTML = '<option value="">Seleccionar regional...</option>';
    exportSelect.innerHTML = '<option value="">Seleccionar regional...</option>';

    regionals.forEach(regional => {
        const importOption = document.createElement('option');
        importOption.value = regional.id;
        importOption.textContent = regional.name;
        importSelect.appendChild(importOption);

        const exportOption = document.createElement('option');
        exportOption.value = regional.id;
        exportOption.textContent = regional.name;
        exportSelect.appendChild(exportOption);
    });
}

// Load institutions for import
async function loadInstitutionsForImport(regionalId) {
    if (!regionalId) {
        document.getElementById('importInstitutionSelect').innerHTML = '<option value="">Primero seleccione una regional...</option>';
        document.getElementById('importInstitutionSelect').disabled = true;
        return;
    }

    try {
        const token = localStorage.getItem('jwt');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(`/api/v1/institutions/institutionsByRegionalId/${regionalId}`, {
            method: 'GET',
            headers: headers
        });

        if (response.ok) {
            const institutionsList = await response.json();
            institutions[regionalId] = institutionsList;
            populateInstitutionDropdown('import', institutionsList);
        } else {
            console.error('Error loading institutions:', response.status);
            showErrorToastLocal('Error', 'No se pudieron cargar los centros');
        }
    } catch (error) {
        console.error('Error loading institutions:', error);
        showErrorToastLocal('Error', 'Error al cargar los centros');
    }
}

// Load institutions for export
async function loadInstitutionsForExport(regionalId) {
    if (!regionalId) {
        document.getElementById('exportInstitutionSelect').innerHTML = '<option value="">Primero seleccione una regional...</option>';
        document.getElementById('exportInstitutionSelect').disabled = true;
        return;
    }

    try {
        const token = localStorage.getItem('jwt');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(`/api/v1/institutions/institutionsByRegionalId/${regionalId}`, {
            method: 'GET',
            headers: headers
        });

        if (response.ok) {
            const institutionsList = await response.json();
            institutions[regionalId] = institutionsList;
            populateInstitutionDropdown('export', institutionsList);
        } else {
            console.error('Error loading institutions:', response.status);
            showErrorToastLocal('Error', 'No se pudieron cargar los centros');
        }
    } catch (error) {
        console.error('Error loading institutions:', error);
        showErrorToastLocal('Error', 'Error al cargar los centros');
    }
}

// Populate institution dropdown
function populateInstitutionDropdown(type, institutionsList) {
    const select = document.getElementById(`${type}InstitutionSelect`);
    select.innerHTML = '<option value="">Seleccionar centro...</option>';
    
    institutionsList.forEach(institution => {
        const option = document.createElement('option');
        option.value = institution.institutionId || institution.id;
        option.textContent = institution.name;
        select.appendChild(option);
    });
    
    select.disabled = false;
}

// Load inventories for import
async function loadInventoriesForImport(institutionId) {
    if (!institutionId) {
        document.getElementById('importInventorySelect').innerHTML = '<option value="">Primero seleccione un centro...</option>';
        document.getElementById('importInventorySelect').disabled = true;
        return;
    }

    try {
        const token = localStorage.getItem('jwt');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        // Fetch all inventories (use large page size)
        const response = await fetch(`/api/v1/inventory/institutionAdminInventories/${institutionId}?page=0&size=1000`, {
            method: 'GET',
            headers: headers
        });

        if (response.ok) {
            const data = await response.json();
            const inventoriesList = Array.isArray(data) ? data : (data.content || []);
            inventories[institutionId] = inventoriesList;
            populateInventoryDropdown('import', inventoriesList);
        } else {
            console.error('Error loading inventories:', response.status);
            showErrorToastLocal('Error', 'No se pudieron cargar los inventarios');
        }
    } catch (error) {
        console.error('Error loading inventories:', error);
        showErrorToastLocal('Error', 'Error al cargar los inventarios');
    }
}

// Load inventories for export
async function loadInventoriesForExport(institutionId) {
    if (!institutionId) {
        document.getElementById('exportInventorySelect').innerHTML = '<option value="">Primero seleccione un centro...</option>';
        document.getElementById('exportInventorySelect').disabled = true;
        return;
    }

    try {
        const token = localStorage.getItem('jwt');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        // Fetch all inventories (use large page size)
        const response = await fetch(`/api/v1/inventory/institutionAdminInventories/${institutionId}?page=0&size=1000`, {
            method: 'GET',
            headers: headers
        });

        if (response.ok) {
            const data = await response.json();
            const inventoriesList = Array.isArray(data) ? data : (data.content || []);
            inventories[institutionId] = inventoriesList;
            populateInventoryDropdown('export', inventoriesList);
        } else {
            console.error('Error loading inventories:', response.status);
            showErrorToastLocal('Error', 'No se pudieron cargar los inventarios');
        }
    } catch (error) {
        console.error('Error loading inventories:', error);
        showErrorToastLocal('Error', 'Error al cargar los inventarios');
    }
}

// Populate inventory dropdown
function populateInventoryDropdown(type, inventoriesList) {
    const select = document.getElementById(`${type}InventorySelect`);
    select.innerHTML = '<option value="">Seleccionar inventario...</option>';
    
    inventoriesList.forEach(inventory => {
        const option = document.createElement('option');
        option.value = inventory.id || inventory.inventoryId;
        option.textContent = inventory.name;
        select.appendChild(option);
    });
    
    select.disabled = false;
}

// Reset dropdowns
function resetImportDropdowns(types) {
    if (types.includes('institution')) {
        document.getElementById('importInstitutionSelect').innerHTML = '<option value="">Primero seleccione una regional...</option>';
        document.getElementById('importInstitutionSelect').disabled = true;
    }
    if (types.includes('inventory')) {
        document.getElementById('importInventorySelect').innerHTML = '<option value="">Primero seleccione un centro...</option>';
        document.getElementById('importInventorySelect').disabled = true;
    }
}

function resetExportDropdowns(types) {
    if (types.includes('institution')) {
        document.getElementById('exportInstitutionSelect').innerHTML = '<option value="">Primero seleccione una regional...</option>';
        document.getElementById('exportInstitutionSelect').disabled = true;
    }
    if (types.includes('inventory')) {
        document.getElementById('exportInventorySelect').innerHTML = '<option value="">Primero seleccione un centro...</option>';
        document.getElementById('exportInventorySelect').disabled = true;
    }
}

// Update button states
function updateImportButtonState() {
    const inventoryId = document.getElementById('importInventorySelect').value;
    const fileInput = document.getElementById('importFileInput');
    const hasFile = fileInput.files.length > 0;
    const button = document.getElementById('importButton');
    
    button.disabled = !inventoryId || !hasFile;
}

function updateExportButtonState() {
    const inventoryId = document.getElementById('exportInventorySelect').value;
    const button = document.getElementById('exportButton');
    
    button.disabled = !inventoryId;
}

// Handle import
async function handleImport() {
    const inventoryId = document.getElementById('importInventorySelect').value;
    const fileInput = document.getElementById('importFileInput');
    const file = fileInput.files[0];

    if (!inventoryId || !file) {
        showErrorToastLocal('Error', 'Por favor seleccione un inventario y un archivo');
        return;
    }

    const progressDiv = document.getElementById('importProgress');
    const progressBar = document.getElementById('importProgressBar');
    const progressPercent = document.getElementById('importProgressPercent');
    const progressStatus = document.getElementById('importProgressStatus');
    const button = document.getElementById('importButton');
    
    progressDiv.classList.remove('hidden');
    button.disabled = true;

    // Simulate progress for upload
    let progress = 0;
    const progressInterval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress > 90) progress = 90; // Don't go to 100% until done
        updateImportProgress(progress, 'Subiendo archivo...');
    }, 200);

    try {
        const token = localStorage.getItem('jwt');
        const formData = new FormData();
        formData.append('file', file);
        formData.append('inventoryId', inventoryId);

        const headers = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        updateImportProgress(95, 'Procesando datos...');

        const response = await fetch('/api/v1/items/bulk-upload', {
            method: 'POST',
            headers: headers,
            body: formData
        });

        clearInterval(progressInterval);

        if (response.ok) {
            const result = await response.json();
            updateImportProgress(100, 'Completado');
            
            // Hide progress bar immediately
            setTimeout(() => {
                progressDiv.classList.add('hidden');
                resetImportProgress();
            }, 500);
            
            // Show success modal
            showImportSuccessModal(result);
        } else {
            const errorData = await response.json().catch(() => ({ detail: 'Error desconocido' }));
            progressDiv.classList.add('hidden');
            resetImportProgress();
            showErrorToastLocal('Error al importar', errorData.detail || 'Error desconocido');
        }
    } catch (error) {
        clearInterval(progressInterval);
        console.error('Error importing:', error);
        showErrorToastLocal('Error', 'Error al procesar el archivo');
        progressDiv.classList.add('hidden');
        resetImportProgress();
    } finally {
        button.disabled = false;
        updateImportButtonState();
    }
}

// Update import progress
function updateImportProgress(percent, status) {
    const progressBar = document.getElementById('importProgressBar');
    const progressPercent = document.getElementById('importProgressPercent');
    const progressStatus = document.getElementById('importProgressStatus');
    
    if (progressBar) {
        progressBar.style.width = `${Math.min(100, Math.max(0, percent))}%`;
    }
    if (progressPercent) {
        progressPercent.textContent = `${Math.round(percent)}%`;
    }
    if (progressStatus) {
        progressStatus.textContent = status || 'Procesando...';
    }
}

// Reset import progress
function resetImportProgress() {
    updateImportProgress(0, '');
}

// Handle export
async function handleExport() {
    const inventoryId = document.getElementById('exportInventorySelect').value;

    if (!inventoryId) {
        showErrorToastLocal('Error', 'Por favor seleccione un inventario');
        return;
    }

    const progressDiv = document.getElementById('exportProgress');
    const button = document.getElementById('exportButton');
    
    progressDiv.classList.remove('hidden');
    button.disabled = true;

    // Simulate progress
    let progress = 0;
    const progressInterval = setInterval(() => {
        progress += Math.random() * 20;
        if (progress > 85) progress = 85; // Don't go to 100% until done
        updateExportProgress(progress, 'Recopilando datos...');
    }, 150);

    try {
        const token = localStorage.getItem('jwt');
        const headers = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        updateExportProgress(90, 'Generando archivo Excel...');

        const response = await fetch(`/api/v1/items/inventory/${inventoryId}/export`, {
            method: 'GET',
            headers: headers
        });

        clearInterval(progressInterval);
        updateExportProgress(95, 'Preparando descarga...');

        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `items_inventario_${inventoryId}.xlsx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            updateExportProgress(100, 'Completado');
            showSuccessToastLocal('Exportación exitosa', 'El archivo se ha descargado correctamente');
            
            // Hide progress after delay
            setTimeout(() => {
                progressDiv.classList.add('hidden');
                resetExportProgress();
            }, 1500);
        } else {
            const errorData = await response.json().catch(() => ({ detail: 'Error desconocido' }));
            showErrorToastLocal('Error al exportar', errorData.detail || 'Error desconocido');
            progressDiv.classList.add('hidden');
            resetExportProgress();
        }
    } catch (error) {
        clearInterval(progressInterval);
        console.error('Error exporting:', error);
        showErrorToastLocal('Error', 'Error al generar el archivo');
        progressDiv.classList.add('hidden');
        resetExportProgress();
    } finally {
        button.disabled = false;
    }
}

// Update export progress
function updateExportProgress(percent, status) {
    const progressBar = document.getElementById('exportProgressBar');
    const progressPercent = document.getElementById('exportProgressPercent');
    const progressStatus = document.getElementById('exportProgressStatus');
    
    if (progressBar) {
        progressBar.style.width = `${Math.min(100, Math.max(0, percent))}%`;
    }
    if (progressPercent) {
        progressPercent.textContent = `${Math.round(percent)}%`;
    }
    if (progressStatus) {
        progressStatus.textContent = status || 'Procesando...';
    }
}

// Reset export progress
function resetExportProgress() {
    updateExportProgress(0, '');
}

// Show import success modal
function showImportSuccessModal(result) {
    const modal = document.getElementById('importSuccessModal');
    const title = document.getElementById('importSuccessTitle');
    const message = document.getElementById('importSuccessMessage');
    const details = document.getElementById('importSuccessDetails');
    
    if (result.failedItems > 0) {
        title.textContent = 'Importación con Errores';
        title.className = 'text-2xl font-bold text-orange-600 mb-2';
        message.textContent = `Se importaron ${result.successfulItems} items exitosamente, pero ${result.failedItems} items fallaron.`;
        
        let errorsHtml = '<div class="bg-orange-50 border border-orange-200 rounded-lg p-4 max-h-48 overflow-y-auto"><p class="font-semibold text-orange-800 mb-2">Errores encontrados:</p><ul class="list-disc list-inside text-xs text-orange-700 space-y-1">';
        const errorsToShow = result.errors.slice(0, 10);
        errorsToShow.forEach(error => {
            errorsHtml += `<li>${error}</li>`;
        });
        if (result.errors.length > 10) {
            errorsHtml += `<li class="text-orange-600">... y ${result.errors.length - 10} errores más</li>`;
        }
        errorsHtml += '</ul></div>';
        details.innerHTML = errorsHtml;
    } else {
        title.textContent = 'Importación Exitosa';
        title.className = 'text-2xl font-bold text-green-600 mb-2';
        message.textContent = `Se importaron ${result.successfulItems} items exitosamente.`;
        details.innerHTML = `<div class="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <p class="text-green-800 font-semibold">Total de items procesados: ${result.totalRows}</p>
            <p class="text-green-700">Items creados: ${result.successfulItems}</p>
        </div>`;
    }
    
    modal.classList.remove('hidden');
    
    // Reset form
    const fileInput = document.getElementById('importFileInput');
    fileInput.value = '';
    document.getElementById('importFileName').textContent = 'Ningún archivo seleccionado';
    closePreview();
}

// Close import success modal
function closeImportSuccessModal() {
    const modal = document.getElementById('importSuccessModal');
    modal.classList.add('hidden');
}

// Preview Excel file
function previewExcelFile(file) {
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            
            // Get first sheet
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            
            // Convert to JSON
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
            
            if (jsonData.length === 0) {
                showErrorToastLocal('Error', 'El archivo Excel está vacío');
                closePreview();
                return;
            }
            
            // Show preview
            displayPreview(jsonData);
        } catch (error) {
            console.error('Error reading Excel file:', error);
            showErrorToastLocal('Error', 'No se pudo leer el archivo Excel. Asegúrese de que es un archivo válido.');
            closePreview();
        }
    };
    
    reader.onerror = function() {
        showErrorToastLocal('Error', 'Error al leer el archivo');
        closePreview();
    };
    
    reader.readAsArrayBuffer(file);
}

// Display preview table
function displayPreview(data) {
    const previewSection = document.getElementById('previewSection');
    const tableHeader = document.getElementById('previewTableHeader');
    const tableBody = document.getElementById('previewTableBody');
    const rowCount = document.getElementById('previewRowCount');
    
    // Clear previous content
    tableHeader.innerHTML = '';
    tableBody.innerHTML = '';
    
    if (data.length === 0) {
        closePreview();
        return;
    }
    
    // Get headers (first row)
    const headers = data[0] || [];
    
    // Create header row
    headers.forEach((header, index) => {
        const th = document.createElement('th');
        th.className = 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider';
        th.textContent = header || `Columna ${String.fromCharCode(65 + index)}`;
        tableHeader.appendChild(th);
    });
    
    // Show first 20 rows (excluding header)
    const rowsToShow = Math.min(20, data.length - 1);
    const totalRows = data.length - 1; // Exclude header
    
    for (let i = 1; i <= rowsToShow; i++) {
        const row = data[i] || [];
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-gray-50';
        
        headers.forEach((_, colIndex) => {
            const td = document.createElement('td');
            td.className = 'px-4 py-2 text-sm text-gray-700 whitespace-nowrap';
            const cellValue = row[colIndex] !== undefined ? String(row[colIndex]) : '';
            td.textContent = cellValue.length > 50 ? cellValue.substring(0, 50) + '...' : cellValue;
            tr.appendChild(td);
        });
        
        tableBody.appendChild(tr);
    }
    
    // Show row count
    if (totalRows > rowsToShow) {
        rowCount.textContent = `Mostrando ${rowsToShow} de ${totalRows} filas (excluyendo encabezado)`;
    } else {
        rowCount.textContent = `Total: ${totalRows} filas (excluyendo encabezado)`;
    }
    
    previewSection.classList.remove('hidden');
}

// Close preview
function closePreview() {
    const previewSection = document.getElementById('previewSection');
    previewSection.classList.add('hidden');
    document.getElementById('previewTableHeader').innerHTML = '';
    document.getElementById('previewTableBody').innerHTML = '';
    document.getElementById('previewRowCount').textContent = '';
}

// Toast functions - use global functions, avoid recursion
const showSuccessToastLocal = function(title, message) {
    if (window.showInventorySuccessToast) {
        window.showInventorySuccessToast(title, message);
    } else if (window.showSuccessToast && window.showSuccessToast !== showSuccessToastLocal) {
        try {
            window.showSuccessToast(title, message);
        } catch (e) {
            alert(`${title}: ${message}`);
        }
    } else {
        alert(`${title}: ${message}`);
    }
};

const showErrorToastLocal = function(title, message) {
    if (window.showInventoryErrorToast) {
        window.showInventoryErrorToast(title, message);
    } else if (window.showErrorToast && window.showErrorToast !== showErrorToastLocal) {
        try {
            window.showErrorToast(title, message);
        } catch (e) {
            alert(`${title}: ${message}`);
        }
    } else {
        alert(`${title}: ${message}`);
    }
};

const showWarningToastLocal = function(title, message) {
    if (window.showInventoryWarningToast) {
        window.showInventoryWarningToast(title, message);
    } else if (window.showWarningToast && window.showWarningToast !== showWarningToastLocal) {
        try {
            window.showWarningToast(title, message);
        } catch (e) {
            alert(`${title}: ${message}`);
        }
    } else {
        alert(`${title}: ${message}`);
    }
};

