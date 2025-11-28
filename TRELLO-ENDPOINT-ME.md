# 📋 Tarjeta Trello: Crear/Mejorar Endpoint /me

## 📝 Descripción

Desarrollar y mejorar el endpoint `/api/v1/users/me` para obtener información completa del usuario autenticado actualmente en el sistema SGDIS. El endpoint debe proporcionar toda la información relevante del usuario de forma eficiente, incluyendo datos básicos del perfil, información de la institución y regional asociadas, inventarios relacionados, estadísticas personales, y permisos. 

El endpoint debe ser optimizado para reducir el número de llamadas al frontend, incluyendo información relacionada que comúnmente se necesita junto con los datos del usuario. Además, debe implementar caché cuando sea apropiado, manejar errores de autenticación correctamente, y proporcionar respuestas rápidas y consistentes. El endpoint debe seguir las mejores prácticas de REST API y mantener compatibilidad con la aplicación móvil.

---

## ✅ Criterios de Aceptación

### 1. **Información Completa del Usuario**
- El endpoint debe devolver todos los datos básicos del usuario: id, email, nombre completo, cargo, departamento laboral, URL de imagen de perfil, rol, estado, e institución
- Debe incluir información completa de la institución asociada (id, nombre, dirección, teléfono si aplica)
- Debe incluir información de la regional a la que pertenece la institución (id, nombre)
- Debe devolver la lista de inventarios donde el usuario es propietario (`owner`)
- Debe devolver la lista de inventarios donde el usuario es firmante (`signatory`)
- Debe incluir estadísticas del usuario: cantidad de inventarios gestionados, cantidad de ítems verificados, préstamos activos, transferencias pendientes
- Debe incluir permisos y capacidades del usuario según su rol

### 2. **Rendimiento y Optimización**
- El endpoint debe responder en menos de 500ms en condiciones normales
- Debe realizar el mínimo número de consultas a la base de datos posible (usar JOINs o consultas optimizadas)
- Debe implementar proyecciones de JPA para traer solo los campos necesarios y evitar cargar relaciones innecesarias
- Debe usar `@EntityGraph` o `FetchType.LAZY` apropiadamente para evitar el problema N+1
- Debe considerar implementar caché a nivel de aplicación para datos que no cambian frecuentemente (como información de institución/regional)
- La respuesta debe ser serializada eficientemente sin datos redundantes

### 3. **Seguridad y Autenticación**
- El endpoint debe requerir autenticación JWT válida
- Debe validar que el token JWT esté activo y no expirado
- Debe devolver error 401 (Unauthorized) si no hay token o el token es inválido
- Debe devolver error 403 (Forbidden) si el usuario está inactivo o bloqueado
- No debe exponer información sensible como contraseñas o tokens internos
- Debe validar que el usuario existe y está activo antes de devolver sus datos
- Debe registrar en auditoría el acceso al endpoint para seguimiento de seguridad

### 4. **Estructura de Respuesta y DTOs**
- Debe usar un DTO específico `CurrentUserResponse` que incluya toda la información necesaria de forma estructurada
- La respuesta debe estar bien documentada con Swagger/OpenAPI
- Debe incluir metadatos útiles como fecha de última actualización del perfil, fecha de creación de cuenta
- Debe estructurar la respuesta de forma lógica: datos básicos, información laboral, relaciones (inventarios, institución, regional), estadísticas, permisos
- Debe manejar casos donde el usuario no tiene institución o regional asignada (valores null apropiados)
- La respuesta debe ser consistente entre web y móvil

### 5. **Manejo de Errores y Casos Especiales**
- Debe manejar correctamente el caso cuando el usuario no existe (aunque no debería pasar con autenticación válida)
- Debe manejar el caso cuando el usuario no tiene institución asignada
- Debe manejar el caso cuando la institución no tiene regional asignada
- Debe devolver mensajes de error descriptivos y útiles para debugging
- Debe registrar errores en logs para monitoreo
- Debe manejar excepciones de base de datos de forma elegante
- Debe validar que las relaciones (inventarios, institución) existen antes de incluirlas en la respuesta

---

## 🚀 Pasos para Realizarlo

### Paso 1: **Análisis y Diseño del DTO de Respuesta**
- Revisar el `UserResponse` actual y identificar información faltante
- Diseñar el nuevo DTO `CurrentUserResponse` con estructura anidada para: datos básicos, institución (con regional), inventarios (owner y signatory), estadísticas, permisos
- Crear DTOs auxiliares si es necesario: `InstitutionInfoResponse`, `RegionalInfoResponse`, `InventorySummaryResponse`, `UserStatisticsResponse`, `UserPermissionsResponse`
- Definir qué información debe incluirse según el rol del usuario (algunos roles pueden necesitar información adicional)
- Documentar la estructura completa de la respuesta con ejemplos en Swagger
- Revisar qué información necesita el frontend y la aplicación móvil para evitar llamadas adicionales

### Paso 2: **Backend - Optimización de Consultas y Servicio**
- Crear caso de uso `GetCurrentUserUseCase` siguiendo la arquitectura hexagonal del proyecto
- Implementar método en `UserService` o crear `CurrentUserService` especializado
- Optimizar consultas usando `@EntityGraph` para cargar relaciones necesarias en una sola consulta
- Usar proyecciones de Spring Data JPA para traer solo campos necesarios
- Implementar consultas personalizadas en el repositorio si es necesario para optimizar JOINs
- Agregar métodos en repositorios relacionados (InventoryRepository) para obtener inventarios del usuario de forma eficiente
- Implementar lógica para calcular estadísticas del usuario (contar inventarios, verificaciones, préstamos, transferencias)
- Agregar validaciones de seguridad: verificar que el usuario está activo, que existe, etc.

### Paso 3: **Backend - Controlador y Endpoint**
- Mejorar el endpoint existente `GET /api/v1/users/me` en `UserController`
- Actualizar la implementación para usar el nuevo caso de uso y DTO
- Agregar documentación Swagger completa con ejemplos de respuesta
- Implementar manejo de excepciones con `@ExceptionHandler` si es necesario
- Agregar validación de autenticación explícita (aunque Spring Security ya lo hace, documentarlo)
- Agregar logging apropiado para debugging y monitoreo
- Implementar caché si es apropiado usando `@Cacheable` de Spring (para datos de institución/regional que no cambian frecuentemente)
- Agregar headers de respuesta apropiados (Content-Type, Cache-Control si aplica)

### Paso 4: **Integración con Auditoría y Seguridad**
- Integrar con el sistema de auditoría existente para registrar accesos al endpoint
- Agregar validación de estado del usuario (si está activo) antes de devolver datos
- Implementar rate limiting si es necesario para prevenir abuso del endpoint
- Agregar validación de permisos si hay información sensible que solo ciertos roles deben ver
- Revisar y actualizar la configuración de seguridad de Spring Security si es necesario
- Asegurar que el endpoint respeta las políticas de CORS del proyecto

### Paso 5: **Pruebas y Validación**
- Crear pruebas unitarias para el caso de uso `GetCurrentUserUseCase`
- Crear pruebas unitarias para el servicio con diferentes escenarios (usuario con/sin institución, con/sin inventarios)
- Crear pruebas de integración para el endpoint completo con diferentes roles
- Probar rendimiento con herramientas como JMeter o similar para verificar tiempos de respuesta
- Validar que la respuesta es correcta para todos los roles (SUPERADMIN, ADMIN_REGIONAL, ADMIN_INSTITUTION, WAREHOUSE, USER)
- Probar casos edge: usuario sin institución, institución sin regional, usuario sin inventarios
- Probar manejo de errores: token inválido, usuario inactivo, usuario eliminado
- Validar que la respuesta funciona correctamente en el frontend existente
- Validar compatibilidad con la aplicación móvil si existe consumo de este endpoint
- Revisar logs para asegurar que no hay consultas N+1 o problemas de rendimiento

---

## 📌 Notas Adicionales

- El endpoint `/api/v1/users/me` ya existe parcialmente en `UserController.java` (línea 157-162), por lo que este trabajo se enfoca en mejorarlo y expandirlo
- Revisar `backend/src/main/java/com/sgdis/backend/user/application/dto/UserResponse.java` para entender la estructura actual
- El endpoint es usado extensivamente en el frontend (más de 50 referencias encontradas), por lo que cualquier cambio debe mantener compatibilidad o ser versionado
- Considerar crear un endpoint adicional `/api/v1/users/me/summary` si la información completa es muy pesada y se necesita una versión ligera
- Revisar `AuthService.getCurrentUser()` para entender cómo se obtiene el usuario actual
- Considerar agregar información de última sesión o actividad si es relevante para el negocio
- El endpoint debe seguir las convenciones REST del proyecto y mantener consistencia con otros endpoints

