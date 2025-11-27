// Notification Bell Component for Dashboard
// Este módulo maneja la campanita de notificaciones en el navbar

const NotificationBell = {
    unreadCount: 0,
    notifications: [],
    isOpen: false,
    pollInterval: null,
    clickOutsideTimeout: null,

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
        // Verificar si ya existe la campanita
        if (document.getElementById('notification-bell-container')) {
            return;
        }

        // Buscar el header del dashboard
        const header = document.querySelector('header');
        if (!header) {
            return;
        }

        // Buscar el contenedor de items del header del lado derecho (donde está el usuario)
        // Buscar primero el div del usuario usando el ID único del avatar
        const userAvatar = document.getElementById('headerUserAvatar');
        if (!userAvatar) {
            return;
        }
        
        // Encontrar el div padre que contiene el avatar (el div del usuario)
        const userDiv = userAvatar.closest('.flex.items-center.gap-3.cursor-pointer') || 
                       userAvatar.parentElement;
        if (!userDiv) {
            return;
        }
        
        // El contenedor padre del usuario es el contenedor del lado derecho
        const headerItemsContainer = userDiv.parentElement;
        if (!headerItemsContainer || !headerItemsContainer.classList.contains('flex')) {
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

        // Insertar la campanita justo antes del div del usuario (como elemento hermano)
        headerItemsContainer.insertBefore(bellContainer, userDiv);
    },

    /**
     * Configura los event listeners
     */
    setupEventListeners() {
        const bellContainer = document.getElementById('notification-bell-container');
        const bell = document.getElementById('notificationBell');
        const markAllBtn = document.getElementById('markAllAsRead');
        const viewAllBtn = document.getElementById('viewAllNotifications');
        
        // Agregar listener específico al icono de la campanita
        if (bell) {
            bell.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleDropdown();
            });
        }
        
        // También agregar listener al contenedor para clicks en el badge
        if (bellContainer) {
            bellContainer.addEventListener('click', (e) => {
                // Si el click es en el icono o badge, hacer toggle
                if (bell && (bell.contains(e.target) || e.target.id === 'notificationBadge')) {
                    e.stopPropagation();
                    this.toggleDropdown();
                }
            });
        }

        if (markAllBtn) {
            markAllBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.markAllAsRead();
            });
        }
        
        if (viewAllBtn) {
            viewAllBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                // Detectar la ruta de notificaciones basándose en la URL actual
                const currentPath = window.location.pathname;
                let notificationsPath = '/superadmin/notifications'; // Default
                
                // Detectar el prefijo de ruta según la URL actual
                if (currentPath.includes('/admin-institution/')) {
                    notificationsPath = '/admin-institution/notifications';
                } else if (currentPath.includes('/admin_regional/')) {
                    notificationsPath = '/admin_regional/notifications';
                } else if (currentPath.includes('/warehouse/')) {
                    notificationsPath = '/warehouse/notifications';
                } else if (currentPath.includes('/user/')) {
                    notificationsPath = '/user/notifications';
                } else if (currentPath.includes('/superadmin/')) {
                    notificationsPath = '/superadmin/notifications';
                }
                
                window.location.href = notificationsPath;
            });
        }

        // Cerrar dropdown al hacer click fuera
        // Usar un pequeño delay para evitar conflictos con el toggle
        document.addEventListener('click', (e) => {
            const dropdown = document.getElementById('notificationDropdown');
            const container = document.getElementById('notification-bell-container');
            
            // Solo cerrar si el clic fue realmente fuera del contenedor y del dropdown
            if (dropdown && container && 
                !dropdown.contains(e.target) && 
                !container.contains(e.target) &&
                this.isOpen) {
                // Usar setTimeout para que el toggle se ejecute primero si se hizo clic en la campanita
                setTimeout(() => {
                    // Verificar nuevamente que el dropdown sigue abierto y el clic fue fuera
                    if (this.isOpen && 
                        !dropdown.contains(e.target) && 
                        !container.contains(e.target)) {
                        this.closeDropdown();
                    }
                }, 100);
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
                    'Authorization': `Bearer ${localStorage.getItem('jwt')}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.updateBadge(data.count);
            }
        } catch (error) {
            // Silently handle error
        }
    },

    /**
     * Carga las notificaciones no leídas
     */
    async loadNotifications() {
        try {
            const response = await fetch('/api/v1/notifications/my-notifications/unread', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('jwt')}`
                }
            });

            if (response.ok) {
                this.notifications = await response.json();
                this.renderNotifications();
            }
        } catch (error) {
            // Silently handle error
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
        if (!dropdown) {
            return;
        }
        
        const isCurrentlyHidden = dropdown.classList.contains('hidden');
        
        if (isCurrentlyHidden) {
            // Mostrar dropdown
            this.isOpen = true;
            dropdown.classList.remove('hidden');
            dropdown.style.display = 'block';
            this.loadNotifications();
        } else {
            // Ocultar dropdown
            this.isOpen = false;
            dropdown.classList.add('hidden');
            dropdown.style.display = 'none';
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
                    'Authorization': `Bearer ${localStorage.getItem('jwt')}`
                }
            });

            if (response.ok) {
                await this.loadUnreadCount();
                await this.loadNotifications();
            }
        } catch (error) {
            // Silently handle error
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
                    'Authorization': `Bearer ${localStorage.getItem('jwt')}`
                }
            });

            if (response.ok) {
                this.updateBadge(0);
                await this.loadNotifications();
            }
        } catch (error) {
            // Silently handle error
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
            // Actualizar contador y lista
            this.loadUnreadCount();
            if (this.isOpen) {
                this.loadNotifications();
            }
            
            // Mostrar animación en la campanita
            this.animateBell();
            
            // Reproducir sonido de notificación
            this.playNotificationSound();
        });
    },

    /**
     * Reproduce un sonido de notificación
     */
    playNotificationSound() {
        if (window.NotificationSound) {
            window.NotificationSound.play();
        }
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

// Variable para evitar múltiples inicializaciones
let notificationBellInitialized = false;

// Inicializar la campanita cuando el DOM esté listo
function initializeNotificationBell() {
    // Evitar múltiples inicializaciones
    if (notificationBellInitialized) {
        return;
    }

    const token = localStorage.getItem('jwt');
    if (!token) {
        return;
    }

    // Verificar que el header y el avatar existan antes de inicializar
    const header = document.querySelector('header');
    const userAvatar = document.getElementById('headerUserAvatar');
    
    if (!header || !userAvatar) {
        // Reintentar después de un breve delay
        setTimeout(initializeNotificationBell, 200);
        return;
    }

    // Intentar inicializar
    try {
        NotificationBell.init();
        notificationBellInitialized = true;
    } catch (error) {
        // Reintentar después de un segundo si falla
        setTimeout(() => {
            try {
                NotificationBell.init();
                notificationBellInitialized = true;
            } catch (retryError) {
                // Silently handle error
            }
        }, 1000);
    }
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(initializeNotificationBell, 100);
    });
} else {
    // DOM ya está listo, inicializar después de un breve delay
    setTimeout(initializeNotificationBell, 100);
}

// También intentar después de que se cargue completamente la página
window.addEventListener('load', () => {
    setTimeout(initializeNotificationBell, 300);
});

// Limpiar al cerrar la página
window.addEventListener('beforeunload', () => {
    NotificationBell.destroy();
});

