// WebSocket Client for Notifications
// Este módulo maneja la conexión WebSocket para recibir notificaciones en tiempo real

class WebSocketNotificationClient {
    constructor() {
        this.stompClient = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = Infinity; // Reintentar indefinidamente
        this.reconnectDelay = 3000;
        this.userId = null;
        this.heartbeatInterval = null;
        this.connectionCheckInterval = null;
        this.subscription = null;
    }

    /**
     * Inicializa la conexión WebSocket
     */
    connect() {
        // Obtener el userId del localStorage o del token JWT
        const token = localStorage.getItem('jwt') || localStorage.getItem('token');
        if (!token) {
            return;
        }

        // Extraer userId del token (decodificar JWT)
        this.userId = this.getUserIdFromToken(token);
        if (!this.userId) {
            console.error('No se pudo obtener el userId del token');
            return;
        }

        const protocol = window.location.protocol === 'https:' ? 'https://' : 'http://';
        const host = window.location.host;
        const socketUrl = `${protocol}${host}/ws`;

        // Usar SockJS y STOMP para la conexión
        const socket = new SockJS(socketUrl);
        this.stompClient = Stomp.over(socket);

        // Desactivar logs de debug en producción
        this.stompClient.debug = (str) => {
            // Solo mostrar errores
            if (str.toLowerCase().includes('error')) {
                console.error(str);
            }
        };

        // Verificar que SockJS y Stomp estén disponibles antes de conectar
        if (typeof SockJS === 'undefined') {
            console.error('SockJS no está disponible. Asegúrate de incluir la librería SockJS.');
            return;
        }
        if (typeof Stomp === 'undefined') {
            console.error('Stomp no está disponible. Asegúrate de incluir la librería Stomp.');
            return;
        }

        // Configurar heartbeat para mantener la conexión activa
        const headers = {
            heartbeat: {
                outgoing: 10000, // Enviar ping cada 10 segundos
                incoming: 10000  // Esperar pong cada 10 segundos
            }
        };

        // Conectar al WebSocket
        this.stompClient.connect(
            headers,
            (frame) => {
                this.isConnected = true;
                this.reconnectAttempts = 0;
                this.subscribeToNotifications();
                this.startConnectionMonitoring();
            },
            (error) => {
                console.error('Error en la conexión WebSocket:', error);
                this.isConnected = false;
                this.stopConnectionMonitoring();
                this.handleReconnect();
            }
        );
    }

    /**
     * Se suscribe al canal de notificaciones del usuario
     */
    subscribeToNotifications() {
        if (!this.stompClient || !this.isConnected) {
            console.error('No hay conexión activa al WebSocket');
            return;
        }

        // Verificar que SockJS y Stomp estén disponibles
        if (typeof SockJS === 'undefined') {
            console.error('SockJS no está disponible');
            return;
        }
        if (typeof Stomp === 'undefined') {
            console.error('Stomp no está disponible');
            return;
        }

        // Suscribirse al canal de notificaciones personal del usuario
        this.subscription = this.stompClient.subscribe(`/user/queue/notifications`, (message) => {
            try {
                const notification = JSON.parse(message.body);
                this.handleNotification(notification);
            } catch (error) {
                console.error('Error al parsear notificación:', error);
            }
        });

        if (!this.subscription) {
            console.error('No se pudo suscribir a notificaciones');
        }
    }

    /**
     * Maneja las notificaciones recibidas
     */
    async handleNotification(notification) {
        // Mostrar la notificación usando el sistema de notificaciones existente
        this.showNotification(notification);

        // Reproducir sonido si está disponible
        await this.playNotificationSound();

        // Disparar evento personalizado para que otros módulos puedan reaccionar
        const event = new CustomEvent('sgdis-notification', {
            detail: notification
        });
        window.dispatchEvent(event);
    }

    /**
     * Muestra la notificación en la UI
     */
    showNotification(notification) {
        const { type, title, message, data } = notification;

        // Usar el sistema de notificaciones existente si está disponible
        if (typeof showSuccessToast === 'function') {
            if (type === 'INVENTORY_CREATED') {
                showSuccessToast(title, message);
            } else {
                showSuccessToast(title, message);
            }
        } else {
            // Fallback a notificaciones del navegador
            this.showBrowserNotification(title, message);
        }
    }

    /**
     * Muestra notificación del navegador
     */
    showBrowserNotification(title, message) {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, {
                body: message,
                icon: '/svg/box.png',
                badge: '/svg/box.png'
            });
        }
    }

    /**
     * Reproduce un sonido de notificación
     */
    async playNotificationSound() {
        if (window.NotificationSound) {
            // Asegurar que el AudioContext esté inicializado
            if (!window.NotificationSound.isInitialized) {
                await window.NotificationSound.initialize();
            }
            // Reproducir el sonido
            await window.NotificationSound.play();
        }
    }

    /**
     * Extrae el userId del token JWT
     */
    getUserIdFromToken(token) {
        try {
            const payload = token.split('.')[1];
            const decoded = JSON.parse(atob(payload));
            return decoded.userId || decoded.sub || decoded.id;
        } catch (error) {
            console.error('Error al decodificar el token:', error);
            return null;
        }
    }

    /**
     * Maneja la reconexión automática
     */
    handleReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts && this.maxReconnectAttempts !== Infinity) {
            return;
        }

        this.reconnectAttempts++;

        setTimeout(() => {
            // Verificar que no esté ya conectado antes de reconectar
            if (!this.isConnected) {
                this.connect();
            }
        }, this.reconnectDelay);
    }

    /**
     * Monitorea la conexión y reconecta si se pierde
     */
    startConnectionMonitoring() {
        // Limpiar cualquier intervalo anterior
        this.stopConnectionMonitoring();

        // Verificar la conexión cada 30 segundos
        this.connectionCheckInterval = setInterval(() => {
            if (!this.isConnected || !this.stompClient || !this.stompClient.connected) {
                this.isConnected = false;
                this.stopConnectionMonitoring();
                // Cancelar suscripción anterior si existe
                if (this.subscription) {
                    try {
                        this.subscription.unsubscribe();
                    } catch (e) {
                        // Error al cancelar suscripción, continuar
                    }
                    this.subscription = null;
                }
                this.handleReconnect();
            }
        }, 30000); // Verificar cada 30 segundos
    }

    /**
     * Detiene el monitoreo de conexión
     */
    stopConnectionMonitoring() {
        if (this.connectionCheckInterval) {
            clearInterval(this.connectionCheckInterval);
            this.connectionCheckInterval = null;
        }
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }

    /**
     * Desconecta el WebSocket
     */
    disconnect() {
        this.stopConnectionMonitoring();
        
        // Cancelar suscripción
        if (this.subscription) {
            try {
                this.subscription.unsubscribe();
            } catch (e) {
                // Error al cancelar suscripción, continuar
            }
            this.subscription = null;
        }

        if (this.stompClient && this.isConnected) {
            this.stompClient.disconnect(() => {
                this.isConnected = false;
            });
        }
    }

    /**
     * Solicita permiso para notificaciones del navegador
     */
    static requestNotificationPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }
}

// Crear instancia global del cliente WebSocket
window.wsNotificationClient = new WebSocketNotificationClient();

// Inicializar conexión cuando el documento esté listo y haya un token
let wsInitAttempts = 0;
const MAX_WS_INIT_ATTEMPTS = 5; // Máximo de 5 intentos

function initializeWebSocket() {
    const token = localStorage.getItem('jwt') || localStorage.getItem('token');
    if (token) {
        // Verificar que las librerías estén cargadas
        if (typeof SockJS === 'undefined' || typeof Stomp === 'undefined') {
            wsInitAttempts++;
            if (wsInitAttempts >= MAX_WS_INIT_ATTEMPTS) {
                console.warn('SockJS o Stomp no están disponibles después de ' + MAX_WS_INIT_ATTEMPTS + ' intentos. WebSocket no se inicializará.');
                return;
            }
            console.warn('SockJS o Stomp no están disponibles, reintentando en 1 segundo... (intento ' + wsInitAttempts + '/' + MAX_WS_INIT_ATTEMPTS + ')');
            setTimeout(initializeWebSocket, 1000);
            return;
        }
        
        // Resetear contador si las librerías están disponibles
        wsInitAttempts = 0;
        
        // Esperar un poco para asegurar que todo está cargado
        setTimeout(() => {
            if (window.wsNotificationClient && !window.wsNotificationClient.isConnected) {
                window.wsNotificationClient.connect();
                // Solicitar permiso para notificaciones del navegador
                WebSocketNotificationClient.requestNotificationPermission();
            }
        }, 1000);
    }
}

document.addEventListener('DOMContentLoaded', initializeWebSocket);

// También intentar cuando la página esté completamente cargada
window.addEventListener('load', () => {
    setTimeout(initializeWebSocket, 2000);
});

// Desconectar cuando la página se cierre
window.addEventListener('beforeunload', () => {
    if (window.wsNotificationClient) {
        window.wsNotificationClient.disconnect();
    }
});

// Reconectar cuando se hace login
window.addEventListener('sgdis-login', () => {
    setTimeout(() => {
        if (window.wsNotificationClient && !window.wsNotificationClient.isConnected) {
            window.wsNotificationClient.connect();
        }
    }, 500);
});

// Desconectar cuando se hace logout
window.addEventListener('sgdis-logout', () => {
    if (window.wsNotificationClient) {
        window.wsNotificationClient.disconnect();
    }
});

