// Sistema de notificaciones toast para el módulo de usuarios
// Basado en el ejemplo de notificaciones-toast pero adaptado para el módulo de usuarios
//
// Características avanzadas:
// - Barra de progreso visual que muestra el tiempo restante
// - Auto-pausa del contador cuando el usuario hace hover
// - Funciones convenientes para diferentes duraciones
// - Posibilidad de extender el tiempo de una notificación
// - Animaciones suaves y diseño moderno

// Crear el contenedor de toasts si no existe
function createToastContainer() {
    let container = document.getElementById('users-toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'users-toast-container';
        container.className = 'users-toast-container';
        document.body.appendChild(container);
    }
    return container;
}

// Función para mostrar una notificación toast
function showToast({ tipo = 'info', titulo = '', descripcion = '', autoCierre = true, duracion = 5000 }) {
    const contenedorToast = createToastContainer();

    // Crear el nuevo toast
    const nuevoToast = document.createElement('div');

    // Agregar clases correspondientes
    nuevoToast.classList.add('users-toast');
    nuevoToast.classList.add(`users-toast-${tipo}`);
    if (autoCierre) nuevoToast.classList.add('users-toast-auto-cierre');

    // Agregar id del toast
    const numeroAlAzar = Math.floor(Math.random() * 100);
    const fecha = Date.now();
    const toastId = `toast-${fecha}-${numeroAlAzar}`;
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
        <div class="users-toast-contenido">
            <div class="users-toast-icono">
                ${iconos[tipo] || iconos.info}
            </div>
            <div class="users-toast-texto">
                ${titulo ? `<p class="users-toast-titulo">${titulo}</p>` : ''}
                ${descripcion ? `<p class="users-toast-descripcion">${descripcion}</p>` : ''}
            </div>
        </div>
        <button class="users-toast-btn-cerrar" onclick="closeToast('${toastId}')">
            <div class="users-toast-icono-cerrar">
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
        if (e.animationName === 'users-toast-cierre') {
            nuevoToast.removeEventListener('animationend', handleAnimacionCierre);
            nuevoToast.remove();
        }
    };

    // Función para iniciar el contador
    const iniciarContador = () => {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(() => closeToast(toastId), tiempoRestante);
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
function closeToast(toastId) {
    const toast = document.getElementById(toastId);
    if (toast) {
        toast.classList.add('users-toast-cerrando');
    }
}

// Funciones de conveniencia para diferentes tipos de notificaciones
function showSuccessToast(titulo, descripcion, autoCierre = true, duracion = 5000) {
    return showToast({ tipo: 'exito', titulo, descripcion, autoCierre, duracion });
}

function showErrorToast(titulo, descripcion, autoCierre = true, duracion = 5000) {
    return showToast({ tipo: 'error', titulo, descripcion, autoCierre, duracion });
}

function showInfoToast(titulo, descripcion, autoCierre = true, duracion = 5000) {
    return showToast({ tipo: 'info', titulo, descripcion, autoCierre, duracion });
}

function showWarningToast(titulo, descripcion, autoCierre = true, duracion = 5000) {
    return showToast({ tipo: 'warning', titulo, descripcion, autoCierre, duracion });
}

// Función para extender el tiempo de una notificación
function extendToastTime(toastId, extraTime = 3000) {
    const toast = document.getElementById(toastId);
    if (toast && toast.classList.contains('users-toast-auto-cierre')) {
        // Actualizar la duración de la animación CSS
        toast.style.setProperty('--toast-duration', `${extraTime}ms`);

        // Reiniciar el timeout
        setTimeout(() => closeToast(toastId), extraTime);
        return true;
    }
    return false;
}

// Función para actualizar la duración de una notificación
function updateToastDuration(toastId, newDuration) {
    const toast = document.getElementById(toastId);
    if (toast) {
        toast.style.setProperty('--toast-duration', `${newDuration}ms`);
        return true;
    }
    return false;
}

// Función para mostrar notificaciones con diferentes duraciones predefinidas
function showShortToast(tipo, titulo, descripcion) {
    return showToast({ tipo, titulo, descripcion, autoCierre: true, duracion: 3000 });
}

function showLongToast(tipo, titulo, descripcion) {
    return showToast({ tipo, titulo, descripcion, autoCierre: true, duracion: 8000 });
}

function showPersistentToast(tipo, titulo, descripcion) {
    return showToast({ tipo, titulo, descripcion, autoCierre: false });
}

// Hacer las funciones disponibles globalmente
window.showToast = showToast;
window.closeToast = closeToast;
window.showSuccessToast = showSuccessToast;
window.showErrorToast = showErrorToast;
window.showInfoToast = showInfoToast;
window.showWarningToast = showWarningToast;
window.extendToastTime = extendToastTime;
window.updateToastDuration = updateToastDuration;
window.showShortToast = showShortToast;
window.showLongToast = showLongToast;
window.showPersistentToast = showPersistentToast;