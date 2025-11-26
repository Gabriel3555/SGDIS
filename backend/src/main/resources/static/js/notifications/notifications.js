// Notifications Management Script

let currentPage = 0;
let currentFilter = 'all';
let totalPages = 0;
let totalElements = 0;
const pageSize = 20;

/**
 * Carga las notificaciones desde el API
 */
async function loadNotifications(page = 0, filter = 'all') {
    try {
        const token = localStorage.getItem('jwt');
        if (!token) {
            console.error('No hay token de autenticación');
            return;
        }

        const container = document.getElementById('notificationsContainer');
        const paginationContainer = document.getElementById('paginationContainer');
        
        // Mostrar loading
        container.innerHTML = `
            <div class="text-center py-12">
                <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-sena-verde"></div>
                <p class="mt-4 text-gray-600 dark:text-gray-400">Cargando notificaciones...</p>
            </div>
        `;
        paginationContainer.classList.add('hidden');

        // Construir URL con paginación
        let url = `/api/v1/notifications/my-notifications?page=${page}&size=${pageSize}&sort=createdAt,desc`;
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Error al cargar notificaciones');
        }

        const data = await response.json();
        
        currentPage = data.number;
        totalPages = data.totalPages;
        totalElements = data.totalElements;

        // Filtrar notificaciones según el filtro seleccionado
        let notifications = data.content;
        if (filter === 'unread') {
            notifications = notifications.filter(n => !n.isRead);
        } else if (filter === 'read') {
            notifications = notifications.filter(n => n.isRead);
        }

        renderNotifications(notifications);
        updatePagination();
        
    } catch (error) {
        console.error('Error al cargar notificaciones:', error);
        const container = document.getElementById('notificationsContainer');
        container.innerHTML = `
            <div class="text-center py-12">
                <i class="fas fa-exclamation-triangle text-4xl text-red-500 mb-4"></i>
                <p class="text-gray-600 dark:text-gray-400">Error al cargar notificaciones</p>
                <button onclick="loadNotifications(currentPage, currentFilter)" 
                    class="mt-4 px-4 py-2 bg-sena-verde text-white rounded-xl hover:bg-sena-verde-oscuro">
                    Reintentar
                </button>
            </div>
        `;
    }
}

/**
 * Renderiza las notificaciones en el contenedor
 */
function renderNotifications(notifications) {
    const container = document.getElementById('notificationsContainer');

    if (notifications.length === 0) {
        container.innerHTML = `
            <div class="text-center py-12">
                <i class="fas fa-bell-slash text-5xl text-gray-400 mb-4"></i>
                <p class="text-gray-600 dark:text-gray-400 text-lg">No hay notificaciones</p>
            </div>
        `;
        return;
    }

    container.innerHTML = notifications.map(notification => `
        <div class="notification-item p-4 border-b border-gray-200 dark:border-gray-700 ${!notification.isRead ? 'bg-green-50 dark:bg-green-900/20' : 'bg-white dark:bg-gray-800'} cursor-pointer"
             onclick="markAsRead(${notification.id})">
            <div class="flex items-start gap-4">
                <div class="flex-shrink-0 w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                    ${getNotificationIcon(notification.type)}
                </div>
                <div class="flex-1 min-w-0">
                    <div class="flex items-start justify-between gap-2">
                        <div class="flex-1">
                            <h3 class="font-semibold text-gray-800 dark:text-gray-100 mb-1">
                                ${escapeHtml(notification.title)}
                            </h3>
                            <p class="text-gray-600 dark:text-gray-400 text-sm mb-2">
                                ${escapeHtml(notification.message)}
                            </p>
                            <div class="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                                <span>
                                    <i class="fas fa-clock mr-1"></i>
                                    ${formatTime(notification.createdAt)}
                                </span>
                                ${notification.isRead ? `
                                    <span class="text-green-600 dark:text-green-400">
                                        <i class="fas fa-check-circle mr-1"></i>
                                        Leída
                                    </span>
                                ` : `
                                    <span class="text-orange-600 dark:text-orange-400">
                                        <i class="fas fa-circle mr-1"></i>
                                        No leída
                                    </span>
                                `}
                            </div>
                        </div>
                        ${!notification.isRead ? `
                            <div class="flex-shrink-0">
                                <div class="w-3 h-3 bg-sena-verde rounded-full"></div>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

/**
 * Obtiene el icono según el tipo de notificación
 */
function getNotificationIcon(type) {
    const icons = {
        'INVENTORY_CREATED': '<i class="fas fa-box text-sena-verde text-xl"></i>',
        'ITEM_ADDED': '<i class="fas fa-plus-circle text-blue-500 text-xl"></i>',
        'LOAN_CREATED': '<i class="fas fa-hand-holding text-yellow-500 text-xl"></i>',
        'TRANSFER_CREATED': '<i class="fas fa-exchange-alt text-purple-500 text-xl"></i>',
        'VERIFICATION_CREATED': '<i class="fas fa-clipboard-check text-green-500 text-xl"></i>',
        'DEFAULT': '<i class="fas fa-bell text-gray-500 text-xl"></i>'
    };
    return icons[type] || icons['DEFAULT'];
}

/**
 * Formatea el tiempo de la notificación
 */
function formatTime(timestamp) {
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
    
    return date.toLocaleDateString('es-ES', { 
        day: 'numeric', 
        month: 'short',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
}

/**
 * Marca una notificación como leída
 */
async function markAsRead(notificationId) {
    try {
        const token = localStorage.getItem('jwt');
        if (!token) {
            console.error('No hay token de autenticación');
            return;
        }

        const response = await fetch(`/api/v1/notifications/${notificationId}/mark-as-read`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            // Recargar notificaciones
            await loadNotifications(currentPage, currentFilter);
            
            // Actualizar el contador en la campanita si existe
            if (window.NotificationBell && typeof window.NotificationBell.loadUnreadCount === 'function') {
                window.NotificationBell.loadUnreadCount();
            }
        } else {
            throw new Error('Error al marcar notificación como leída');
        }
    } catch (error) {
        console.error('Error al marcar notificación como leída:', error);
        alert('Error al marcar la notificación como leída');
    }
}

/**
 * Marca todas las notificaciones como leídas
 */
async function markAllAsRead() {
    if (!confirm('¿Está seguro que desea marcar todas las notificaciones como leídas?')) {
        return;
    }

    try {
        const token = localStorage.getItem('jwt');
        if (!token) {
            console.error('No hay token de autenticación');
            return;
        }

        const response = await fetch('/api/v1/notifications/mark-all-as-read', {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            // Recargar notificaciones
            await loadNotifications(currentPage, currentFilter);
            
            // Actualizar el contador en la campanita si existe
            if (window.NotificationBell && typeof window.NotificationBell.loadUnreadCount === 'function') {
                window.NotificationBell.loadUnreadCount();
            }
        } else {
            throw new Error('Error al marcar todas como leídas');
        }
    } catch (error) {
        console.error('Error al marcar todas como leídas:', error);
        alert('Error al marcar todas las notificaciones como leídas');
    }
}

/**
 * Filtra las notificaciones
 */
function filterNotifications(filter) {
    currentFilter = filter;
    
    // Actualizar botones de filtro
    document.getElementById('filterAll').className = filter === 'all' 
        ? 'px-4 py-2 rounded-xl font-medium transition-colors bg-sena-verde text-white'
        : 'px-4 py-2 rounded-xl font-medium transition-colors bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600';
    
    document.getElementById('filterUnread').className = filter === 'unread'
        ? 'px-4 py-2 rounded-xl font-medium transition-colors bg-sena-verde text-white'
        : 'px-4 py-2 rounded-xl font-medium transition-colors bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600';
    
    document.getElementById('filterRead').className = filter === 'read'
        ? 'px-4 py-2 rounded-xl font-medium transition-colors bg-sena-verde text-white'
        : 'px-4 py-2 rounded-xl font-medium transition-colors bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600';
    
    // Recargar notificaciones con el filtro
    loadNotifications(0, filter);
}

/**
 * Actualiza la paginación
 */
function updatePagination() {
    const paginationContainer = document.getElementById('paginationContainer');
    const pageInfo = document.getElementById('pageInfo');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');

    if (totalPages <= 1) {
        paginationContainer.classList.add('hidden');
        return;
    }

    paginationContainer.classList.remove('hidden');
    pageInfo.textContent = `Página ${currentPage + 1} de ${totalPages} (${totalElements} total)`;
    
    prevBtn.disabled = currentPage === 0;
    nextBtn.disabled = currentPage >= totalPages - 1;
}

/**
 * Página anterior
 */
function previousPage() {
    if (currentPage > 0) {
        loadNotifications(currentPage - 1, currentFilter);
    }
}

/**
 * Página siguiente
 */
function nextPage() {
    if (currentPage < totalPages - 1) {
        loadNotifications(currentPage + 1, currentFilter);
    }
}

/**
 * Escapa HTML para prevenir XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function () {
    loadNotifications(0, 'all');
    
    // Actualizar el filtro inicial
    filterNotifications('all');
});

