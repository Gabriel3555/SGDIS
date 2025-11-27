// Sistema de notificaciones toast para el módulo de inventarios
// Basado en el sistema de notificaciones del módulo de usuarios pero adaptado para inventarios

// Crear el contenedor de toasts si no existe
function createInventoryToastContainer() {
    let container = document.getElementById('inventory-toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'inventory-toast-container';
        container.className = 'inventory-toast-container';
        document.body.appendChild(container);
    }
    return container;
}

// Función para mostrar una notificación toast
function showInventoryToast({ tipo = 'info', titulo = '', descripcion = '', autoCierre = true, duracion = 5000 }) {
    const contenedorToast = createInventoryToastContainer();

    // Crear el nuevo toast
    const nuevoToast = document.createElement('div');

    // Agregar clases correspondientes
    nuevoToast.classList.add('inventory-toast');
    nuevoToast.classList.add(`inventory-toast-${tipo}`);
    if (autoCierre) nuevoToast.classList.add('inventory-toast-auto-cierre');

    // Agregar id del toast
    const numeroAlAzar = Math.floor(Math.random() * 100);
    const fecha = Date.now();
    const toastId = `inventory-toast-${fecha}-${numeroAlAzar}`;
    nuevoToast.id = toastId;

    // Iconos según el tipo - Usando Font Awesome en lugar de SVGs
    const iconos = {
        exito: `<i class="fas fa-check-circle"></i>`,
        error: `<i class="fas fa-exclamation-circle"></i>`,
        info: `<i class="fas fa-info-circle"></i>`,
        warning: `<i class="fas fa-exclamation-triangle"></i>`
    };

    // Plantilla del toast
    const toast = `
        <div class="inventory-toast-contenido">
            <div class="inventory-toast-icono">
                ${iconos[tipo] || iconos.info}
            </div>
            <div class="inventory-toast-texto">
                ${titulo ? `<p class="inventory-toast-titulo">${titulo}</p>` : ''}
                ${descripcion ? `<p class="inventory-toast-descripcion">${descripcion}</p>` : ''}
            </div>
        </div>
        <button class="inventory-toast-btn-cerrar" onclick="closeInventoryToast('${toastId}')">
            <div class="inventory-toast-icono-cerrar">
                <i class="fas fa-times"></i>
            </div>
        </button>
    `;

    // Agregar la plantilla al nuevo toast
    nuevoToast.innerHTML = toast;

    // Agregamos el nuevo toast al contenedor
    contenedorToast.appendChild(nuevoToast);

    let timeoutId = null;
    let tiempoRestante = duracion;

    // Función para manejar el cierre del toast
    const handleAnimacionCierre = (e) => {
        if (e.animationName === 'inventory-toast-cierre') {
            nuevoToast.removeEventListener('animationend', handleAnimacionCierre);
            nuevoToast.remove();
        }
    };

    // Función para iniciar el contador
    const iniciarContador = () => {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(() => closeInventoryToast(toastId), tiempoRestante);
    };

    // Función para pausar el contador
    const pausarContador = () => {
        if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
        }
    };

    if (autoCierre && duracion > 0) {
        // Aplicar la duración correcta a la animación CSS
        nuevoToast.style.setProperty('--toast-duration', `${duracion}ms`);

        iniciarContador();

        // Pausar/reanudar contador con hover
        nuevoToast.addEventListener('mouseenter', pausarContador);
        nuevoToast.addEventListener('mouseleave', iniciarContador);
    }

    // Agregamos event listener para detectar cuando termine la animación
    nuevoToast.addEventListener('animationend', handleAnimacionCierre);

    return toastId;
}

// Función para cerrar un toast específico
function closeInventoryToast(toastId) {
    const toast = document.getElementById(toastId);
    if (toast) {
        toast.classList.add('inventory-toast-cerrando');
    }
}

// Funciones de conveniencia para diferentes tipos de notificaciones
function showInventorySuccessToast(titulo, descripcion, autoCierre = true, duracion = 5000) {
    return showInventoryToast({ tipo: 'exito', titulo, descripcion, autoCierre, duracion });
}

function showInventoryErrorToast(titulo, descripcion, autoCierre = true, duracion = 5000) {
    return showInventoryToast({ tipo: 'error', titulo, descripcion, autoCierre, duracion });
}

function showInventoryInfoToast(titulo, descripcion, autoCierre = true, duracion = 5000) {
    return showInventoryToast({ tipo: 'info', titulo, descripcion, autoCierre, duracion });
}

function showInventoryWarningToast(titulo, descripcion, autoCierre = true, duracion = 5000) {
    return showInventoryToast({ tipo: 'warning', titulo, descripcion, autoCierre, duracion });
}

// Función para extender el tiempo de una notificación
function extendInventoryToastTime(toastId, extraTime = 3000) {
    const toast = document.getElementById(toastId);
    if (toast && toast.classList.contains('inventory-toast-auto-cierre')) {
        // Actualizar la duración de la animación CSS
        toast.style.setProperty('--toast-duration', `${extraTime}ms`);

        // Reiniciar el timeout
        setTimeout(() => closeInventoryToast(toastId), extraTime);
        return true;
    }
    return false;
}

// Función para mostrar notificaciones con diferentes duraciones predefinidas
function showInventoryShortToast(tipo, titulo, descripcion) {
    return showInventoryToast({ tipo, titulo, descripcion, autoCierre: true, duracion: 3000 });
}

function showInventoryLongToast(tipo, titulo, descripcion) {
    return showInventoryToast({ tipo, titulo, descripcion, autoCierre: true, duracion: 8000 });
}

function showInventoryPersistentToast(tipo, titulo, descripcion) {
    return showInventoryToast({ tipo, titulo, descripcion, autoCierre: false });
}

// Hacer las funciones disponibles globalmente
window.showInventoryToast = showInventoryToast;
window.closeInventoryToast = closeInventoryToast;
window.showInventorySuccessToast = showInventorySuccessToast;
window.showInventoryErrorToast = showInventoryErrorToast;
window.showInventoryInfoToast = showInventoryInfoToast;
window.showInventoryWarningToast = showInventoryWarningToast;
window.extendInventoryToastTime = extendInventoryToastTime;
window.showInventoryShortToast = showInventoryShortToast;
window.showInventoryLongToast = showInventoryLongToast;
window.showInventoryPersistentToast = showInventoryPersistentToast;

// Alias para mantener compatibilidad con el resto del código
window.showSuccessToast = showInventorySuccessToast;
window.showErrorToast = showInventoryErrorToast;
window.showInfoToast = showInventoryInfoToast;
window.showWarningToast = showInventoryWarningToast;