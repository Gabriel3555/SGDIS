// WebSocket Client for Notifications
// Este módulo maneja la conexión WebSocket para recibir notificaciones en tiempo real

class WebSocketNotificationClient {
    constructor() {
        this.stompClient = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 3000;
        this.userId = null;
    }

    /**
     * Inicializa la conexión WebSocket
     */
    connect() {
        // Obtener el userId del localStorage o del token JWT
        const token = localStorage.getItem('token');
        if (!token) {
            console.log('No hay token disponible, no se puede conectar al WebSocket');
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

        console.log('Conectando al WebSocket:', socketUrl);

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

        // Conectar al WebSocket
        this.stompClient.connect(
            {},
            (frame) => {
                console.log('WebSocket conectado exitosamente');
                this.isConnected = true;
                this.reconnectAttempts = 0;
                this.subscribeToNotifications();
            },
            (error) => {
                console.error('Error en la conexión WebSocket:', error);
                this.isConnected = false;
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

        // Suscribirse al canal de notificaciones personal del usuario
        this.stompClient.subscribe(`/user/queue/notifications`, (message) => {
            const notification = JSON.parse(message.body);
            this.handleNotification(notification);
        });

        console.log(`Suscrito a notificaciones para el usuario ${this.userId}`);
    }

    /**
     * Maneja las notificaciones recibidas
     */
    handleNotification(notification) {
        console.log('Notificación recibida:', notification);

        // Mostrar la notificación usando el sistema de notificaciones existente
        this.showNotification(notification);

        // Reproducir sonido si está disponible
        this.playNotificationSound();

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
    playNotificationSound() {
        if (window.NotificationSound) {
            window.NotificationSound.play();
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
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.log('Máximo de intentos de reconexión alcanzado');
            return;
        }

        this.reconnectAttempts++;
        console.log(`Reintentando conexión en ${this.reconnectDelay / 1000}s (intento ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

        setTimeout(() => {
            this.connect();
        }, this.reconnectDelay);
    }

    /**
     * Desconecta el WebSocket
     */
    disconnect() {
        if (this.stompClient && this.isConnected) {
            this.stompClient.disconnect(() => {
                console.log('WebSocket desconectado');
                this.isConnected = false;
            });
        }
    }

    /**
     * Solicita permiso para notificaciones del navegador
     */
    static requestNotificationPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission().then(permission => {
                console.log('Permiso de notificaciones:', permission);
            });
        }
    }
}

// Crear instancia global del cliente WebSocket
window.wsNotificationClient = new WebSocketNotificationClient();

// Inicializar conexión cuando el documento esté listo y haya un token
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (token) {
        // Esperar un poco para asegurar que todo está cargado
        setTimeout(() => {
            window.wsNotificationClient.connect();
            // Solicitar permiso para notificaciones del navegador
            WebSocketNotificationClient.requestNotificationPermission();
        }, 1000);
    }
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

