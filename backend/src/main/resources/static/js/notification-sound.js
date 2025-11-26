// Notification Sound Manager
// Módulo centralizado para manejar los sonidos de notificaciones

const NotificationSound = {
    /**
     * Reproduce un sonido de notificación
     */
    play() {
        // Verificar si el sonido está habilitado (por defecto sí)
        const soundEnabled = localStorage.getItem('sgdis-notification-sound') !== 'false';
        if (!soundEnabled) {
            return;
        }

        try {
            // Crear un tono más audible y agradable usando Web Audio API
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
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

            // Segundo tono más corto después de una breve pausa (patrón de notificación)
            setTimeout(() => {
                try {
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

