// Notification Sound Manager
// Módulo centralizado para manejar los sonidos de notificaciones

const NotificationSound = {
    audioContext: null,
    isInitialized: false,
    initializationAttempted: false,

    /**
     * Inicializa el AudioContext con una interacción del usuario
     */
    async initialize() {
        if (this.isInitialized || this.initializationAttempted) {
            return;
        }

        this.initializationAttempted = true;

        try {
            // Crear el AudioContext
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Intentar reanudar si está suspendido
            if (this.audioContext.state === 'suspended') {
                try {
                    await this.audioContext.resume();
                } catch (e) {
                    // AudioContext suspendido, esperando interacción del usuario
                }
            }

            if (this.audioContext.state === 'running') {
                this.isInitialized = true;
            }
        } catch (error) {
            console.log('Error al inicializar AudioContext:', error);
        }
    },

    /**
     * Reproduce un sonido de notificación
     */
    async play() {
        // Verificar si el sonido está habilitado (por defecto sí)
        const soundEnabled = localStorage.getItem('sgdis-notification-sound') !== 'false';
        if (!soundEnabled) {
            return;
        }

        try {
            // Crear o reutilizar el AudioContext
            let audioContext = this.audioContext;
            if (!audioContext) {
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
                this.audioContext = audioContext;
            }

            // Reanudar el AudioContext si está suspendido (requerido por políticas del navegador)
            if (audioContext.state === 'suspended') {
                console.log('AudioContext suspendido, intentando reanudar...');
                try {
                    await audioContext.resume();
                    console.log('AudioContext reanudado, estado:', audioContext.state);
                    // Si se reanudó exitosamente, marcar como inicializado
                    if (audioContext.state === 'running') {
                        this.isInitialized = true;
                    }
                } catch (resumeError) {
                    console.log('No se pudo reanudar el AudioContext:', resumeError);
                    // Intentar crear uno nuevo si falla
                    try {
                        audioContext = new (window.AudioContext || window.webkitAudioContext)();
                        this.audioContext = audioContext;
                        if (audioContext.state === 'suspended') {
                            await audioContext.resume();
                        }
                        console.log('Nuevo AudioContext creado, estado:', audioContext.state);
                    } catch (createError) {
                        console.log('No se pudo crear nuevo AudioContext:', createError);
                        return;
                    }
                }
            }

            // Verificar que el AudioContext esté en estado 'running' antes de reproducir
            if (audioContext.state !== 'running') {
                console.log('AudioContext no está en estado running, estado actual:', audioContext.state);
                // Intentar reanudar una vez más
                try {
                    await audioContext.resume();
                    if (audioContext.state !== 'running') {
                        console.log('No se pudo poner AudioContext en estado running');
                        return;
                    }
                } catch (e) {
                    console.log('Error al reanudar AudioContext:', e);
                    return;
                }
            }

            console.log('Reproduciendo sonido de notificación...');
            
            // Crear dos osciladores para un sonido más rico (nota principal + armónico)
            const oscillator1 = audioContext.createOscillator();
            const oscillator2 = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            const gainNode2 = audioContext.createGain();

            // Nota principal (más audible)
            oscillator1.connect(gainNode);
            gainNode.connect(audioContext.destination);
            oscillator1.frequency.value = 800;
            oscillator1.type = 'sine';

            // Armónico (más suave)
            oscillator2.connect(gainNode2);
            gainNode2.connect(audioContext.destination);
            oscillator2.frequency.value = 1200;
            oscillator2.type = 'sine';

            // Configurar volumen con fade out suave
            const now = audioContext.currentTime;
            gainNode.gain.setValueAtTime(0.4, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
            
            gainNode2.gain.setValueAtTime(0.2, now);
            gainNode2.gain.exponentialRampToValueAtTime(0.01, now + 0.6);

            // Reproducir ambos osciladores
            oscillator1.start(now);
            oscillator1.stop(now + 0.6);
            
            oscillator2.start(now);
            oscillator2.stop(now + 0.6);

            console.log('Sonido de notificación iniciado');

            // Segundo tono más corto después de una breve pausa (patrón de notificación)
            setTimeout(() => {
                try {
                    // Verificar que el AudioContext siga disponible
                    if (!audioContext || audioContext.state === 'closed') {
                        return;
                    }
                    
                    const oscillator3 = audioContext.createOscillator();
                    const gainNode3 = audioContext.createGain();
                    
                    oscillator3.connect(gainNode3);
                    gainNode3.connect(audioContext.destination);
                    oscillator3.frequency.value = 1000;
                    oscillator3.type = 'sine';
                    
                    const now2 = audioContext.currentTime;
                    gainNode3.gain.setValueAtTime(0.3, now2);
                    gainNode3.gain.exponentialRampToValueAtTime(0.01, now2 + 0.3);
                    
                    oscillator3.start(now2);
                    oscillator3.stop(now2 + 0.3);
                } catch (e) {
                    // Ignorar errores en el segundo tono
                    console.log('Error en segundo tono:', e);
                }
            }, 200);
        } catch (error) {
            console.log('No se pudo reproducir el sonido de notificación:', error);
        }
    },

    /**
     * Habilita o deshabilita el sonido de notificaciones
     */
    setEnabled(enabled) {
        localStorage.setItem('sgdis-notification-sound', enabled ? 'true' : 'false');
    },

    /**
     * Verifica si el sonido está habilitado
     */
    isEnabled() {
        return localStorage.getItem('sgdis-notification-sound') !== 'false';
    },

    /**
     * Alterna el estado del sonido
     */
    toggle() {
        const currentState = this.isEnabled();
        this.setEnabled(!currentState);
        return !currentState;
    }
};

// Hacer disponible globalmente
window.NotificationSound = NotificationSound;

// Inicializar AudioContext en la primera interacción del usuario
// Esto es necesario porque los navegadores bloquean el audio hasta que haya una interacción
const initAudioOnInteraction = () => {
    if (NotificationSound.isInitialized || NotificationSound.initializationAttempted) {
        return;
    }

    // Lista de eventos que pueden inicializar el audio
    const initEvents = ['click', 'touchstart', 'keydown', 'mousedown'];
    
    const initHandler = async () => {
        await NotificationSound.initialize();
        // Remover los listeners después de la primera inicialización exitosa
        initEvents.forEach(event => {
            document.removeEventListener(event, initHandler);
        });
    };

    // Agregar listeners para inicializar en la primera interacción
    initEvents.forEach(event => {
        document.addEventListener(event, initHandler, { once: true, passive: true });
    });
};

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAudioOnInteraction);
} else {
    initAudioOnInteraction();
}

