// Notification Bell Component for Dashboard
// Este módulo maneja la campanita de notificaciones en el navbar

const NotificationBell = {
    unreadCount: 0,
    notifications: [],
    isOpen: false,
    pollInterval: null,

    /**
     * Inicializa la campanita de notificaciones
     */
    async init() {
        this.createBellElement();
        await this.loadUnreadCount();
        await this.loadNotifications();
        this.setupEventListeners();
        this.startPolling();
        this.setupWebSocketListener();
    },

    /**
     * Crea el elemento HTML de la campanita
     */
    createBellElement() {
        const navbar = document.querySelector('.navbar') || 
                      document.querySelector('header') || 
                      document.querySelector('.main-content');
        
        if (!navbar) {
            console.error('No se encontró el navbar para agregar la campanita');
            return;
        }

        const bellContainer = document.createElement('div');
        bellContainer.id = 'notification-bell-container';
        bellContainer.className = 'notification-bell-container';
        bellContainer.innerHTML = `
            <div class="notification-bell" id="notificationBell">
                <i class="fas fa-bell text-gray-600 dark:text-gray-300 text-xl cursor-pointer hover:text-sena-verde transition-colors"></i>
                <span class="notification-badge hidden" id="notificationBadge">0</span>
            </div>
            
            <div class="notification-dropdown hidden" id="notificationDropdown">
                <div class="notification-header">
                    <h3 class="text-lg font-bold text-gray-800 dark:text-white">Notificaciones</h3>
                    <button class="text-sm text-sena-verde hover:text-sena-verde-oscuro" id="markAllAsRead">
                        Marcar todas como leídas
                    </button>
                </div>
                
                <div class="notification-list" id="notificationList">
                    <div class="text-center py-4 text-gray-500">
                        Cargando notificaciones...
                    </div>
                </div>
                
                <div class="notification-footer">
                    <button class="text-sm text-sena-verde hover:text-sena-verde-oscuro font-medium" id="viewAllNotifications">
                        Ver todas las notificaciones
                    </button>
                </div>
            </div>
        `;

        // Insertar antes del botón de logout o al final del navbar
        const logoutButton = navbar.querySelector('[onclick="logout()"]');
        if (logoutButton && logoutButton.parentElement) {
            logoutButton.parentElement.insertBefore(bellContainer, logoutButton.parentElement);
        } else {
            navbar.appendChild(bellContainer);
        }
    },

    /**
     * Configura los event listeners
     */
    setupEventListeners() {
        const bell = document.getElementById('notificationBell');
        const markAllBtn = document.getElementById('markAllAsRead');
        
        if (bell) {
            bell.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleDropdown();
            });
        }

        if (markAllBtn) {
            markAllBtn.addEventListener('click', () => this.markAllAsRead());
        }

        // Cerrar dropdown al hacer click fuera
        document.addEventListener('click', (e) => {
            const dropdown = document.getElementById('notificationDropdown');
            const bell = document.getElementById('notificationBell');
            
            if (dropdown && bell && 
                !dropdown.contains(e.target) && 
                !bell.contains(e.target)) {
                this.closeDropdown();
            }
        });
    },

    /**
     * Carga el contador de notificaciones no leídas
     */
    async loadUnreadCount() {
        try {
            const response = await fetch('/api/v1/notifications/my-notifications/unread/count', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.updateBadge(data.count);
            }
        } catch (error) {
            console.error('Error al cargar contador de notificaciones:', error);
        }
    },

    /**
     * Carga las notificaciones no leídas
     */
    async loadNotifications() {
        try {
            const response = await fetch('/api/v1/notifications/my-notifications/unread', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                this.notifications = await response.json();
                this.renderNotifications();
            }
        } catch (error) {
            console.error('Error al cargar notificaciones:', error);
        }
    },

    /**
     * Renderiza las notificaciones en el dropdown
     */
    renderNotifications() {
        const list = document.getElementById('notificationList');
        if (!list) return;

        if (this.notifications.length === 0) {
            list.innerHTML = `
                <div class="text-center py-8 text-gray-500 dark:text-gray-400">
                    <i class="fas fa-bell-slash text-3xl mb-2"></i>
                    <p>No tienes notificaciones nuevas</p>
                </div>
            `;
            return;
        }

        list.innerHTML = this.notifications.map(notification => `
            <div class="notification-item ${notification.isRead ? 'read' : 'unread'}" 
                 data-id="${notification.id}"
                 onclick="NotificationBell.markAsRead(${notification.id})">
                <div class="notification-icon">
                    ${this.getNotificationIcon(notification.type)}
                </div>
                <div class="notification-content">
                    <h4 class="notification-title">${notification.title}</h4>
                    <p class="notification-message">${notification.message}</p>
                    <span class="notification-time">${this.formatTime(notification.createdAt)}</span>
                </div>
                ${!notification.isRead ? '<div class="unread-dot"></div>' : ''}
            </div>
        `).join('');
    },

    /**
     * Obtiene el icono según el tipo de notificación
     */
    getNotificationIcon(type) {
        const icons = {
            'INVENTORY_CREATED': '<i class="fas fa-box text-sena-verde"></i>',
            'ITEM_ADDED': '<i class="fas fa-plus-circle text-blue-500"></i>',
            'LOAN_CREATED': '<i class="fas fa-hand-holding text-yellow-500"></i>',
            'DEFAULT': '<i class="fas fa-bell text-gray-500"></i>'
        };
        return icons[type] || icons['DEFAULT'];
    },

    /**
     * Formatea el tiempo de la notificación
     */
    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        
        if (minutes < 1) return 'Justo ahora';
        if (minutes < 60) return `Hace ${minutes} min`;
        if (hours < 24) return `Hace ${hours} h`;
        if (days < 7) return `Hace ${days} d`;
        
        return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    },

    /**
     * Actualiza el badge con el número de notificaciones
     */
    updateBadge(count) {
        this.unreadCount = count;
        const badge = document.getElementById('notificationBadge');
        
        if (badge) {
            if (count > 0) {
                badge.textContent = count > 99 ? '99+' : count;
                badge.classList.remove('hidden');
            } else {
                badge.classList.add('hidden');
            }
        }
    },

    /**
     * Muestra/oculta el dropdown
     */
    toggleDropdown() {
        const dropdown = document.getElementById('notificationDropdown');
        if (dropdown) {
            this.isOpen = !this.isOpen;
            dropdown.classList.toggle('hidden');
            
            if (this.isOpen) {
                this.loadNotifications();
            }
        }
    },

    /**
     * Cierra el dropdown
     */
    closeDropdown() {
        const dropdown = document.getElementById('notificationDropdown');
        if (dropdown) {
            this.isOpen = false;
            dropdown.classList.add('hidden');
        }
    },

    /**
     * Marca una notificación como leída
     */
    async markAsRead(notificationId) {
        try {
            const response = await fetch(`/api/v1/notifications/${notificationId}/mark-as-read`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                await this.loadUnreadCount();
                await this.loadNotifications();
            }
        } catch (error) {
            console.error('Error al marcar notificación como leída:', error);
        }
    },

    /**
     * Marca todas las notificaciones como leídas
     */
    async markAllAsRead() {
        try {
            const response = await fetch('/api/v1/notifications/mark-all-as-read', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                this.updateBadge(0);
                await this.loadNotifications();
            }
        } catch (error) {
            console.error('Error al marcar todas como leídas:', error);
        }
    },

    /**
     * Inicia el polling para actualizar notificaciones
     */
    startPolling() {
        // Actualizar cada 30 segundos
        this.pollInterval = setInterval(() => {
            this.loadUnreadCount();
            if (this.isOpen) {
                this.loadNotifications();
            }
        }, 30000);
    },

    /**
     * Configura el listener de WebSocket para actualizaciones en tiempo real
     */
    setupWebSocketListener() {
        window.addEventListener('sgdis-notification', (event) => {
            console.log('Nueva notificación recibida vía WebSocket:', event.detail);
            
            // Actualizar contador y lista
            this.loadUnreadCount();
            if (this.isOpen) {
                this.loadNotifications();
            }
            
            // Mostrar animación en la campanita
            this.animateBell();
        });
    },

    /**
     * Anima la campanita cuando llega una notificación
     */
    animateBell() {
        const bell = document.querySelector('#notificationBell i');
        if (bell) {
            bell.classList.add('notification-bell-shake');
            setTimeout(() => {
                bell.classList.remove('notification-bell-shake');
            }, 1000);
        }
    },

    /**
     * Limpia recursos al destruir el componente
     */
    destroy() {
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
        }
    }
};

// Inicializar la campanita cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    // Esperar un poco para asegurar que el dashboard esté completamente cargado
    setTimeout(() => {
        if (localStorage.getItem('token')) {
            NotificationBell.init();
        }
    }, 1000);
});

// Limpiar al cerrar la página
window.addEventListener('beforeunload', () => {
    NotificationBell.destroy();
});

