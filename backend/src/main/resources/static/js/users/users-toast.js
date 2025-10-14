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

    // Iconos según el tipo
    const iconos = {
        exito: `<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2zm10.03 4.97a.75.75 0 0 1 .011 1.05l-3.992 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.75.75 0 0 1 1.08-.022z"/>
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