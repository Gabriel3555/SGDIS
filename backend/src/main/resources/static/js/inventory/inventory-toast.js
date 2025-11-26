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

    // Iconos según el tipo
    const iconos = {
        exito: `<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                    <path d="M10.97 4.97a.235.235 0 0 0-.02.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.061L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-1.071-1.05z"/>
                </svg>`,
        error: `<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M11.46.146A.5.5 0 0 0 11.107 0H4.893a.5.5 0 0 0-.353.146L.146 4.54A.5.5 0 0 0 0 4.893v6.214a.5.5 0 0 0 .146.353l4.394 4.394a.5.5 0 0 0 .353.146h6.214a.5.5 0 0 0 .353-.146l4.394-4.394a.5.5 0 0 0 .146-.353V4.893a.5.5 0 0 0-.146-.353L11.46.146zM8 4c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995A.905.905 0 0 1 8 4zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
                </svg>`,
        info: `<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/>
                </svg>`,
        warning: `<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
                </svg>`
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
                <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
                </svg>
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