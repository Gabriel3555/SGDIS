# 📋 Tarjeta Trello: Implementar Endpoints de Notificaciones en Vista y Campana

## 📝 Descripción

Implementar la integración completa de los endpoints de notificaciones existentes en el backend con la vista de notificaciones y el componente de campana (bell) en el frontend del sistema SGDIS. La funcionalidad debe permitir a los usuarios visualizar todas sus notificaciones en una página dedicada, ver notificaciones no leídas en un dropdown desde la campana del header, marcar notificaciones como leídas individualmente o todas a la vez, y mantener sincronizado el contador de notificaciones no leídas en tiempo real.

El sistema debe consumir los endpoints REST existentes: `/api/v1/notifications/my-notifications` (paginado), `/api/v1/notifications/my-notifications/unread`, `/api/v1/notifications/my-notifications/unread/count`, `/api/v1/notifications/{id}/mark-as-read`, y `/api/v1/notifications/mark-all-as-read`. La implementación debe incluir manejo de estados de carga, errores, paginación, y actualización automática del contador mediante polling o WebSocket si está disponible.

---

## ✅ Criterios de Aceptación

### 1. **Vista Completa de Notificaciones**
- La página de notificaciones (`notifications.html`) debe mostrar todas las notificaciones del usuario con paginación
- Debe consumir el endpoint `GET /api/v1/notifications/my-notifications` con parámetros de paginación (page, size)
- Cada notificación debe mostrar: título, mensaje, tipo, fecha/hora de creación, y estado (leída/no leída)
- Debe tener indicadores visuales claros para distinguir notificaciones leídas de no leídas (colores, estilos diferentes)
- Debe incluir filtros: todas, solo no leídas, por tipo de notificación
- Debe permitir marcar notificaciones individuales como leídas mediante el endpoint `PUT /api/v1/notifications/{id}/mark-as-read`
- Debe incluir un botón para marcar todas como leídas usando `PUT /api/v1/notifications/mark-all-as-read`
- Debe mostrar un estado vacío cuando no hay notificaciones con un mensaje apropiado

### 2. **Componente de Campana (Bell) en el Header**
- La campana debe estar visible en el header de todas las páginas principales del sistema
- Debe mostrar un badge con el contador de notificaciones no leídas obtenido de `GET /api/v1/notifications/my-notifications/unread/count`
- El badge debe estar oculto cuando el contador es 0 y visible cuando hay notificaciones no leídas
- Al hacer clic en la campana, debe abrir un dropdown que muestre las últimas notificaciones no leídas (máximo 5-10)
- El dropdown debe consumir `GET /api/v1/notifications/my-notifications/unread` para obtener las notificaciones no leídas
- Cada notificación en el dropdown debe ser clickeable y marcar como leída al hacer clic
- El dropdown debe incluir un enlace "Ver todas las notificaciones" que redirija a la página completa
- El dropdown debe cerrarse al hacer clic fuera de él o al presionar ESC
- El contador debe actualizarse automáticamente cada 30-60 segundos mediante polling

### 3. **Funcionalidad de Marcar como Leída**
- Al marcar una notificación individual como leída, debe hacer una petición `PUT /api/v1/notifications/{id}/mark-as-read`
- La notificación debe actualizarse visualmente inmediatamente (cambiar de no leída a leída) sin recargar la página
- El contador de la campana debe actualizarse automáticamente después de marcar como leída
- Al marcar todas como leídas, debe hacer una petición `PUT /api/v1/notifications/mark-all-as-read`
- Todas las notificaciones visibles deben actualizarse visualmente y el contador debe llegar a 0
- Debe mostrar feedback visual (toast o mensaje) cuando se marca como leída exitosamente
- Debe manejar errores de forma elegante si falla la petición de marcar como leída

### 4. **Paginación y Rendimiento**
- La vista de notificaciones debe implementar paginación del lado del servidor usando los parámetros `page` y `size` del endpoint
- Debe mostrar controles de paginación: botones anterior/siguiente, número de página actual, total de páginas
- Debe cargar notificaciones de forma lazy (solo cuando se necesita) para mejorar el rendimiento
- Debe mostrar un indicador de carga mientras se obtienen las notificaciones
- Debe manejar correctamente el caso cuando no hay más páginas disponibles
- El dropdown de la campana debe limitar la cantidad de notificaciones mostradas (máximo 10) para mantener el rendimiento

### 5. **Manejo de Errores y Estados**
- Debe manejar errores de red, timeouts, y respuestas del servidor de forma apropiada
- Debe mostrar mensajes de error descriptivos cuando falla la carga de notificaciones
- Debe mostrar un estado de carga mientras se obtienen las notificaciones
- Debe manejar el caso cuando el usuario no está autenticado (redirigir al login)
- Debe validar que el token JWT esté presente antes de hacer peticiones
- Debe manejar el caso cuando no hay notificaciones (mostrar estado vacío apropiado)
- Debe implementar retry logic para peticiones fallidas (máximo 3 intentos)
- Debe limpiar el polling cuando el usuario cierra sesión o navega fuera de la página

---

## 🚀 Pasos para Realizarlo

### Paso 1: **Crear/Mejorar el Archivo JavaScript de Notificaciones**
- Crear o mejorar el archivo `notifications.js` en `backend/src/main/resources/static/js/notifications/`
- Implementar objeto `NotificationsManager` que maneje toda la lógica de notificaciones
- Crear función `loadNotifications(page, size)` que consuma `GET /api/v1/notifications/my-notifications` con paginación
- Implementar función `loadUnreadNotifications()` que consuma `GET /api/v1/notifications/my-notifications/unread`
- Crear función `getUnreadCount()` que consuma `GET /api/v1/notifications/my-notifications/unread/count`
- Implementar función `markAsRead(notificationId)` que consuma `PUT /api/v1/notifications/{id}/mark-as-read`
- Crear función `markAllAsRead()` que consuma `PUT /api/v1/notifications/mark-all-as-read`
- Agregar manejo de errores y estados de carga para todas las funciones
- Implementar sistema de polling para actualizar el contador automáticamente cada 30-60 segundos

### Paso 2: **Implementar la Vista Completa de Notificaciones**
- Mejorar el archivo `notifications.html` existente con la estructura completa de la página
- Agregar sección de header con título, descripción y botón "Marcar todas como leídas"
- Crear contenedor para la lista de notificaciones con diseño de tarjetas
- Implementar función `renderNotifications(notifications)` que renderice las notificaciones en el DOM
- Agregar indicadores visuales para notificaciones leídas vs no leídas (colores, estilos, iconos)
- Implementar controles de paginación: botones anterior/siguiente, información de página actual
- Crear función `updatePagination(currentPage, totalPages, totalElements)` que actualice los controles
- Agregar filtros: dropdown o botones para filtrar por estado (todas, no leídas) y por tipo
- Implementar estado vacío cuando no hay notificaciones con mensaje y icono apropiados
- Agregar indicador de carga mientras se obtienen las notificaciones

### Paso 3: **Mejorar el Componente de Campana (Bell)**
- Mejorar el archivo `notifications-bell.js` existente para integrarlo completamente con los endpoints
- Asegurar que la campana se inserte correctamente en el header de todas las páginas
- Implementar función `updateUnreadCount()` que actualice el badge con el contador de no leídas
- Crear función `renderDropdownNotifications()` que muestre las notificaciones no leídas en el dropdown
- Implementar función `toggleDropdown()` que abra/cierre el dropdown al hacer clic en la campana
- Agregar event listener para cerrar el dropdown al hacer clic fuera de él
- Implementar función `handleNotificationClick(notificationId)` que marque como leída y actualice el dropdown
- Agregar enlace "Ver todas las notificaciones" en el footer del dropdown que redirija a la página completa
- Implementar polling automático para actualizar el contador cada 30-60 segundos
- Agregar limpieza del polling cuando se cierra el dropdown o se navega fuera

### Paso 4: **Integración y Sincronización**
- Integrar `NotificationsManager` con la vista de notificaciones y el componente de campana
- Asegurar que cuando se marca una notificación como leída en la vista, se actualice también en la campana
- Implementar actualización bidireccional: cambios en la vista se reflejan en la campana y viceversa
- Agregar event listeners para sincronizar el estado cuando se marca "todas como leídas"
- Implementar actualización automática del contador después de cualquier acción (marcar como leída)
- Agregar notificaciones toast para feedback cuando se realizan acciones (marcar como leída, error, etc.)
- Integrar con el sistema de autenticación para validar el token JWT antes de hacer peticiones
- Asegurar que el polling se detenga cuando el usuario cierra sesión

### Paso 5: **Pruebas, Optimización y Documentación**
- Probar la carga de notificaciones con diferentes cantidades (0, pocas, muchas)
- Probar la paginación: navegar entre páginas, verificar que se cargan correctamente
- Probar marcar notificaciones individuales como leídas y verificar actualización visual
- Probar marcar todas como leídas y verificar que todas se actualizan
- Probar el dropdown de la campana: abrir, cerrar, hacer clic en notificaciones
- Probar el polling: verificar que el contador se actualiza automáticamente
- Probar manejo de errores: desconexión de red, timeout, respuesta de error del servidor
- Optimizar el rendimiento: lazy loading, limitar cantidad de notificaciones en dropdown
- Probar en diferentes navegadores: Chrome, Firefox, Safari, Edge
- Probar en dispositivos móviles para verificar que el dropdown funciona correctamente
- Documentar el código con comentarios explicativos
- Verificar que no hay memory leaks (limpiar event listeners, detener polling)

---

## 📌 Notas Adicionales

- Los endpoints del backend ya están implementados en `NotificationController.java`:
  - `GET /api/v1/notifications/my-notifications` (con paginación)
  - `GET /api/v1/notifications/my-notifications/unread`
  - `GET /api/v1/notifications/my-notifications/unread/count`
  - `PUT /api/v1/notifications/{id}/mark-as-read`
  - `PUT /api/v1/notifications/mark-all-as-read`
- Ya existe un archivo `notifications-bell.js` parcialmente implementado que debe mejorarse
- Ya existe una vista `notifications.html` que debe completarse con la funcionalidad
- El sistema debe usar el token JWT almacenado en `localStorage.getItem('jwt')` para autenticación
- Considerar integrar con WebSocket si está disponible para actualizaciones en tiempo real en lugar de solo polling
- Las notificaciones deben seguir el diseño y estilo visual del resto de la aplicación (Tailwind CSS, colores SENA)
- El componente de campana debe ser responsive y funcionar correctamente en móviles
- Considerar agregar sonido de notificación cuando llega una nueva (si está implementado `notification-sound.js`)

