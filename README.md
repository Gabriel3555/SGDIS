<div align="center">

# 🏛️ SGDIS - Sistema de Gestión de Inventarios SENA

[![Java](https://img.shields.io/badge/Java-17-orange?style=for-the-badge&logo=openjdk)](https://openjdk.java.net/projects/jdk/17/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.5.5-brightgreen?style=for-the-badge&logo=spring)](https://spring.io/projects/spring-boot)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-blue?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)
[![React Native](https://img.shields.io/badge/React%20Native-0.79.6-lightblue?style=for-the-badge&logo=react)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-54.0.25-black?style=for-the-badge&logo=expo)](https://expo.dev/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

**Sistema integral de gestión de inventarios de activos fijos y elementos del Servicio Nacional de Aprendizaje (SENA)**

[Características](#-características-principales) • [Instalación](#-instalación-y-configuración) • [Documentación](#-documentación) • [Contribuir](#-contribuir)

</div>

---

## 📋 Descripción

**SGDIS** (Sistema de Gestión de Inventarios SENA) es una aplicación integral diseñada para centralizar y optimizar la gestión de inventarios de activos fijos y elementos del Servicio Nacional de Aprendizaje (SENA). El sistema permite el control, seguimiento y administración de elementos distribuidos en múltiples inventarios con diferentes niveles de acceso y permisos granulares.

### 🎯 Propósito

Centralizar y optimizar la gestión de inventarios del SENA, proporcionando una plataforma robusta para el control de activos fijos, facilitando procesos de verificación física, bajas controladas, importación/exportación de datos y generación de reportes detallados.

### 👥 Usuarios Objetivo

- **Superadministradores**: Control total del sistema, gestión de usuarios y configuración global
- **Personal de Bodega**: Gestión logística de inventarios, aprobación de bajas y reportes operativos
- **Usuarios Regulares**: Verificación física, solicitudes de baja y consultas limitadas

---

## 🛠️ Stack Tecnológico

### 🔧 Backend

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **Java** | 17 | Lenguaje de programación principal |
| **Spring Boot** | 3.5.5 | Framework de desarrollo |
| **Spring Security** | 3.5.5 | Autenticación y autorización con JWT |
| **Spring Data JPA** | 3.5.5 | Persistencia de datos |
| **Spring WebSocket** | 3.5.5 | Comunicación en tiempo real |
| **Spring Mail** | 3.5.5 | Servicio de correo electrónico |
| **PostgreSQL** | 15+ | Base de datos relacional |
| **Maven** | 3.6+ | Gestión de dependencias y build |
| **Apache POI** | 5.2.5 | Procesamiento de archivos Excel |
| **Lombok** | Latest | Reducción de código boilerplate |
| **SpringDoc OpenAPI** | 2.8.11 | Documentación de API (Swagger) |
| **Auth0 JWT** | 4.5.0 | Manejo de tokens JWT |

### 🌐 Frontend Web

| Tecnología | Propósito |
|------------|-----------|
| **HTML5/CSS3** | Estructura base y estilos |
| **Tailwind CSS** | Framework CSS utility-first |
| **JavaScript (ES6+)** | Lógica del lado del cliente |
| **WebSocket Client** | Notificaciones en tiempo real |
| **JWT** | Gestión de autenticación en navegador |

### 📱 Aplicación Móvil

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **React Native** | 0.79.6 | Framework de desarrollo móvil |
| **Expo** | 54.0.25 | Plataforma de desarrollo y distribución |
| **React Navigation** | 7.x | Navegación entre pantallas |
| **Expo Camera** | 17.0.9 | Captura de fotografías |
| **Expo Image Picker** | 17.0.8 | Selección de imágenes |
| **AsyncStorage** | 2.2.0 | Almacenamiento local |
| **Axios** | 1.12.2 | Cliente HTTP |

### 🐳 Infraestructura

- **Docker** - Containerización de aplicaciones
- **Docker Compose** - Orquestación de servicios

---

## 🏗️ Arquitectura

El sistema sigue una **arquitectura hexagonal (Clean Architecture)** con separación clara de responsabilidades:

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
├─────────────────┬─────────────────┬─────────────────────────────┤
│  React Native   │   Web Browser   │      External Systems       │
│   Mobile App    │   (HTML/JS)     │      (Future APIs)          │
└────────┬────────┴────────┬────────┴──────────────┬──────────────┘
         │                 │                       │
         └─────────────────┼───────────────────────┘
                           │
         ┌─────────────────▼───────────────────────┐
         │         SPRING BOOT BACKEND             │
         │  ┌─────────────────────────────────────┐ │
         │  │      REST API + WebSocket           │ │
         │  │  ┌───────────────────────────────┐  │ │
         │  │  │   Application Layer (Use      │  │ │
         │  │  │    Cases / Services)         │  │ │
         │  │  └───────────────────────────────┘  │ │
         │  │  ┌───────────────────────────────┐  │ │
         │  │  │   Domain Layer (Entities)     │  │ │
         │  │  └───────────────────────────────┘  │ │
         │  │  ┌───────────────────────────────┐  │ │
         │  │  │ Infrastructure Layer (JPA,   │  │ │
         │  │  │  Repositories, External)     │  │ │
         │  │  └───────────────────────────────┘  │ │
         │  └─────────────────────────────────────┘ │
         └─────────────────┬─────────────────────────┘
                           │
         ┌─────────────────▼───────────────────────┐
         │         PostgreSQL Database             │
         │  ┌───────────────────────────────────┐  │
         │  │  Tables: users, inventories,     │  │
         │  │  items, cancellations, loans,    │  │
         │  │  transfers, verifications, etc.  │  │
         │  └───────────────────────────────────┘  │
         └─────────────────────────────────────────┘
```

### Componentes Principales

- **REST API**: Endpoints para autenticación, gestión de usuarios, inventarios, elementos, préstamos, transferencias, cancelaciones y más
- **WebSocket API**: Notificaciones en tiempo real
- **Autenticación JWT**: Sistema seguro de tokens para control de acceso
- **Vistas Web**: Interfaz web servida desde `resources/static`
- **Base de Datos**: PostgreSQL con diseño relacional optimizado
- **Aplicación Móvil**: Interfaz nativa para dispositivos móviles

---

## ✨ Características Principales

### 🔐 Gestión de Autenticación

- ✅ Login seguro con email/contraseña
- ✅ Recuperación de contraseña por email
- ✅ Control de sesión con JWT
- ✅ Redirección automática basada en roles
- ✅ Cambio de contraseña
- ✅ Actualización de perfil de usuario
- ✅ Refresh token para sesiones prolongadas

### 👥 Gestión de Usuarios

- ✅ Creación, modificación y eliminación de usuarios
- ✅ Asignación de roles (Superadministrador, Personal de Bodega, Usuario Regular)
- ✅ Permisos granulares por usuario
- ✅ Gestión de estado de usuarios (activo/inactivo)
- ✅ Asignación de usuarios a inventarios específicos
- ✅ Asignación de usuarios a regionales e instituciones
- ✅ Gestión de fotos de perfil
- ✅ Validación de dominios de email (@soy.sena.edu.co)

### 📦 Gestión de Inventarios

- ✅ Creación y administración de múltiples inventarios
- ✅ Asignación de propietarios (centros/personas)
- ✅ Control de acceso basado en inventarios
- ✅ Historial de cambios
- ✅ Filtrado y búsqueda avanzada
- ✅ Asignación de usuarios a inventarios

### 🔍 Gestión de Elementos (Items)

- ✅ Registro completo de elementos con fotos opcionales
- ✅ Edición y actualización de información
- ✅ Sistema de bajas controladas
- ✅ Verificación de existencia física
- ✅ Actualización de ubicación
- ✅ Prevención de duplicados
- ✅ Atributos personalizados por elemento
- ✅ Gestión de placas y números consecutivos
- ✅ Historial de cambios por elemento
- ✅ Múltiples imágenes por elemento

### 📋 Sistema de Cancelaciones (Bajas)

- ✅ Solicitud de cancelación de elementos
- ✅ Aprobación/rechazo de cancelaciones
- ✅ Carga de formatos de cancelación
- ✅ Descarga de formatos y ejemplos
- ✅ Gestión de razones y comentarios
- ✅ Historial completo de cancelaciones
- ✅ Cancelaciones masivas

### 🔄 Sistema de Transferencias

- ✅ Transferencia de elementos entre inventarios
- ✅ Seguimiento de estado de transferencias
- ✅ Aprobación de transferencias
- ✅ Historial de transferencias
- ✅ Notificaciones de transferencias

### 📚 Sistema de Préstamos

- ✅ Registro de préstamos de elementos
- ✅ Asignación de elementos a usuarios
- ✅ Seguimiento de préstamos activos
- ✅ Devolución de elementos
- ✅ Historial de préstamos
- ✅ Control de fechas de préstamo y devolución

### ✅ Sistema de Verificación Física

- ✅ Verificación física de elementos
- ✅ Captura de fotos durante verificación
- ✅ Registro de estado de verificación
- ✅ Historial de verificaciones
- ✅ Verificaciones programadas
- ✅ Reportes de verificación

### 🏢 Gestión Institucional

- ✅ Gestión de regionales
- ✅ Gestión de instituciones/centros
- ✅ Gestión de departamentos y ciudades
- ✅ Asignación de usuarios a regionales
- ✅ Jerarquía institucional

### 📊 Reportes y Exportación

- ✅ Generación de reportes filtrados
- ✅ Exportación a Excel (Apache POI)
- ✅ Exportación a PDF
- ✅ Importación masiva desde Excel
- ✅ Plantillas estandarizadas
- ✅ Reportes por inventario, usuario, fecha
- ✅ Reportes de auditoría

### 🔔 Sistema de Notificaciones

- ✅ Notificaciones en tiempo real (WebSocket)
- ✅ Notificaciones push en web
- ✅ Historial de notificaciones
- ✅ Notificaciones por tipo (cancelaciones, transferencias, préstamos)
- ✅ Campana de notificaciones
- ✅ Sonidos de notificación

### 📧 Servicio de Correo Electrónico

- ✅ Envío de emails de recuperación de contraseña
- ✅ Notificaciones por email
- ✅ Plantillas de email
- ✅ Configuración SMTP

### 🔒 Seguridad y Auditoría

- ✅ Logs de auditoría completos
- ✅ Control de acceso basado en roles (RBAC)
- ✅ Encriptación HTTPS
- ✅ Validaciones de integridad de datos
- ✅ Filtros de seguridad JWT
- ✅ Protección CSRF
- ✅ Validación de entrada de datos
- ✅ Manejo centralizado de excepciones

### 📁 Gestión de Archivos

- ✅ Carga de imágenes de elementos
- ✅ Carga de fotos de perfil
- ✅ Carga de formatos de cancelación
- ✅ Almacenamiento organizado por tipo
- ✅ Validación de tipos de archivo

---

## 🚀 Instalación y Configuración

### 📋 Prerrequisitos

- **Java 17** o superior
- **Maven 3.6+**
- **PostgreSQL 15+**
- **Node.js 18+** (para desarrollo móvil)
- **npm** o **yarn**
- **Docker** (opcional, para despliegue)

### ⚙️ Configuración del Backend

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/Gabriel3555/SGDIS.git
   cd SGDIS/backend
   ```

2. **Configurar la base de datos:**
   - Crear base de datos PostgreSQL:
     ```sql
     CREATE DATABASE sgdis_db;
     ```
   - Actualizar `application.properties` o `application-dev.properties` con las credenciales:
     ```properties
     spring.datasource.url=jdbc:postgresql://localhost:5432/sgdis_db
     spring.datasource.username=tu_usuario
     spring.datasource.password=tu_contraseña
     spring.jpa.hibernate.ddl-auto=update
     ```

3. **Configurar correo electrónico (opcional):**
   ```properties
   spring.mail.host=smtp.gmail.com
   spring.mail.port=587
   spring.mail.username=tu_email@gmail.com
   spring.mail.password=tu_contraseña
   spring.mail.properties.mail.smtp.auth=true
   spring.mail.properties.mail.smtp.starttls.enable=true
   ```

4. **Compilar y ejecutar:**
   ```bash
   # Windows
   mvnw.cmd clean install
   mvnw.cmd spring-boot:run
   
   # Linux/Mac
   ./mvnw clean install
   ./mvnw spring-boot:run
   ```

5. **Acceder a la aplicación:**
   - **Web**: `http://localhost:8080`
   - **API Docs (Swagger)**: `http://localhost:8080/swagger-ui.html`
   - **API Base**: `http://localhost:8080/api/v1`

### 📱 Configuración de la Aplicación Móvil

1. **Instalar dependencias:**
   ```bash
   cd mobile
   npm install
   ```

2. **Configurar endpoint de API:**
   - Actualizar la configuración en `mobile/src/Navigation/Services/Connection.js`:
     ```javascript
     const API_BASE_URL = 'http://tu-ip:8080/api/v1';
     ```

3. **Ejecutar en desarrollo:**
   ```bash
   # Iniciar Expo
   npm start
   # o
   expo start
   
   # Para Android
   npm run android
   
   # Para iOS
   npm run ios
   ```

### 🐳 Despliegue con Docker

```bash
# Construir imágenes
docker-compose build

# Ejecutar servicios
docker-compose up -d

# Ver logs
docker-compose logs -f

# Detener servicios
docker-compose down
```

---

## 📖 Uso del Sistema

### 🔑 Acceso al Sistema

1. **Registro inicial**: Crear usuario administrador
2. **Login**: Acceder con credenciales válidas
3. **Redirección automática**: Basada en el rol del usuario

### 🔄 Flujos de Trabajo Típicos

#### 👑 Superadministrador

1. Crear y gestionar usuarios
2. Asignar roles y permisos granulares
3. Crear y gestionar inventarios
4. Revisar logs de auditoría
5. Gestionar regionales e instituciones
6. Configurar el sistema globalmente
7. Aprobar/rechazar cancelaciones y transferencias

#### 📦 Personal de Bodega

1. Crear y gestionar inventarios
2. Registrar y editar elementos
3. Aprobar/rechazar solicitudes de cancelación
4. Gestionar transferencias entre inventarios
5. Generar reportes operativos
6. Gestionar préstamos de elementos
7. Revisar verificaciones físicas

#### 👤 Usuario Regular

1. Verificar físicamente elementos
2. Solicitar cancelaciones de elementos
3. Consultar inventarios asignados
4. Ver elementos en préstamo
5. Actualizar información de perfil
6. Cambiar contraseña

---

## 📁 Estructura del Proyecto

```
SGDIS/
├── backend/                                    # Backend Spring Boot
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/sgdis/backend/
│   │   │   │   ├── auth/                      # Módulo de autenticación
│   │   │   │   │   ├── application/            # Casos de uso y DTOs
│   │   │   │   │   ├── domain/                 # Entidades de dominio
│   │   │   │   │   ├── infrastructure/         # Repositorios y configuración
│   │   │   │   │   ├── security/                # Configuración de seguridad
│   │   │   │   │   └── web/                    # Controladores REST
│   │   │   │   ├── user/                       # Módulo de usuarios
│   │   │   │   ├── inventory/                  # Módulo de inventarios
│   │   │   │   ├── item/                       # Módulo de elementos
│   │   │   │   ├── cancellation/               # Módulo de cancelaciones
│   │   │   │   ├── loan/                       # Módulo de préstamos
│   │   │   │   ├── transfers/                  # Módulo de transferencias
│   │   │   │   ├── verification/               # Módulo de verificaciones
│   │   │   │   ├── notification/               # Módulo de notificaciones
│   │   │   │   ├── institution/                # Módulo de instituciones
│   │   │   │   ├── email/                      # Servicio de correo
│   │   │   │   ├── auditory/                   # Módulo de auditoría
│   │   │   │   ├── file/                       # Servicio de archivos
│   │   │   │   ├── data/                       # Datos maestros
│   │   │   │   │   ├── regional/               # Regionales
│   │   │   │   │   └── departaments_cities/    # Departamentos y ciudades
│   │   │   │   ├── exception/                  # Manejo de excepciones
│   │   │   │   ├── web/                        # Controladores web
│   │   │   │   └── BackendApplication.java      # Clase principal
│   │   │   └── resources/
│   │   │       ├── static/                     # Vistas web estáticas
│   │   │       │   ├── views/                  # Vistas HTML
│   │   │       │   │   ├── dashboard/          # Dashboards por rol
│   │   │       │   │   ├── users/               # Gestión de usuarios
│   │   │       │   │   ├── inventory/          # Gestión de inventarios
│   │   │       │   │   ├── items/              # Gestión de elementos
│   │   │       │   │   ├── cancellations/      # Gestión de cancelaciones
│   │   │       │   │   ├── loans/              # Gestión de préstamos
│   │   │       │   │   ├── transfers/          # Gestión de transferencias
│   │   │       │   │   ├── verification/       # Verificaciones físicas
│   │   │       │   │   ├── reports/            # Reportes
│   │   │       │   │   ├── notifications/      # Notificaciones
│   │   │       │   │   ├── auditory/           # Auditoría
│   │   │       │   │   └── configuration/      # Configuración
│   │   │       │   ├── js/                     # Scripts JavaScript
│   │   │       │   ├── css/                     # Estilos CSS
│   │   │       │   └── svg/                     # Imágenes y recursos
│   │   │       ├── application.properties      # Configuración principal
│   │   │       ├── application-dev.properties  # Configuración desarrollo
│   │   │       └── application-prod.properties # Configuración producción
│   │   └── test/                               # Pruebas unitarias
│   ├── Dockerfile                              # Configuración Docker
│   └── pom.xml                                 # Dependencias Maven
├── mobile/                                     # Aplicación React Native
│   ├── src/
│   │   ├── Navigation/                         # Configuración de navegación
│   │   │   ├── Services/                       # Servicios de conexión
│   │   │   └── Stack/                           # Stack de navegación
│   │   └── ThemeContext.js                     # Contexto de tema
│   ├── Screens/                                # Pantallas de la app
│   │   └── Auth/                               # Pantallas de autenticación
│   ├── assets/                                 # Recursos estáticos
│   ├── App.js                                  # Punto de entrada
│   ├── package.json                            # Dependencias npm
│   └── app.json                                # Configuración Expo
├── uploads/                                    # Archivos subidos
│   ├── users/                                  # Fotos de perfil
│   └── verifications/                          # Fotos de verificaciones
├── docker-compose.yml                          # Configuración Docker Compose
├── sena-inventory-srs.txt                      # Especificación de requisitos
└── README.md                                   # Este archivo
```

---

## 🔗 Endpoints Principales de la API

### 🔐 Autenticación

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/api/v1/auth/login` | Iniciar sesión |
| `POST` | `/api/v1/auth/register` | Registro de usuario |
| `POST` | `/api/v1/auth/token/refresh` | Refrescar token |
| `POST` | `/api/v1/auth/forgot-password` | Solicitar recuperación de contraseña |
| `POST` | `/api/v1/auth/reset-password` | Restablecer contraseña |

### 👥 Gestión de Usuarios

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/v1/users` | Listar usuarios |
| `GET` | `/api/v1/users/{id}` | Obtener usuario |
| `POST` | `/api/v1/users` | Crear usuario |
| `PUT` | `/api/v1/users/{id}` | Actualizar usuario |
| `DELETE` | `/api/v1/users/{id}` | Eliminar usuario |
| `PUT` | `/api/v1/users/{id}/photo` | Actualizar foto de perfil |
| `PUT` | `/api/v1/users/{id}/password` | Cambiar contraseña |

### 📦 Gestión de Inventarios

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/v1/inventories` | Listar inventarios |
| `GET` | `/api/v1/inventories/{id}` | Obtener inventario |
| `POST` | `/api/v1/inventories` | Crear inventario |
| `PUT` | `/api/v1/inventories/{id}` | Actualizar inventario |
| `DELETE` | `/api/v1/inventories/{id}` | Eliminar inventario |
| `POST` | `/api/v1/inventories/{id}/users` | Asignar usuarios |

### 🔍 Gestión de Elementos

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/v1/items` | Listar elementos |
| `GET` | `/api/v1/items/{id}` | Obtener elemento |
| `POST` | `/api/v1/items` | Crear elemento |
| `PUT` | `/api/v1/items/{id}` | Actualizar elemento |
| `DELETE` | `/api/v1/items/{id}` | Eliminar elemento |
| `POST` | `/api/v1/items/import` | Importar elementos desde Excel |
| `GET` | `/api/v1/items/export` | Exportar elementos a Excel |

### 📋 Gestión de Cancelaciones

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/v1/cancellations` | Listar cancelaciones |
| `POST` | `/api/v1/cancellations/ask` | Solicitar cancelación |
| `POST` | `/api/v1/cancellations/{id}/accept` | Aprobar cancelación |
| `POST` | `/api/v1/cancellations/{id}/refuse` | Rechazar cancelación |
| `POST` | `/api/v1/cancellations/upload-format` | Subir formato de cancelación |
| `GET` | `/api/v1/cancellations/download-format` | Descargar formato |

### 📚 Gestión de Préstamos

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/v1/loans` | Listar préstamos |
| `POST` | `/api/v1/loans` | Crear préstamo |
| `PUT` | `/api/v1/loans/{id}` | Actualizar préstamo |
| `POST` | `/api/v1/loans/{id}/return` | Devolver elemento |

### 🔄 Gestión de Transferencias

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/v1/transfers` | Listar transferencias |
| `POST` | `/api/v1/transfers` | Crear transferencia |
| `PUT` | `/api/v1/transfers/{id}` | Actualizar transferencia |
| `POST` | `/api/v1/transfers/{id}/approve` | Aprobar transferencia |

### ✅ Gestión de Verificaciones

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/v1/verifications` | Listar verificaciones |
| `POST` | `/api/v1/verifications` | Crear verificación |
| `GET` | `/api/v1/verifications/{id}` | Obtener verificación |

### 🔔 Notificaciones

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/v1/notifications` | Listar notificaciones |
| `PUT` | `/api/v1/notifications/{id}/read` | Marcar como leída |
| `WebSocket` | `/ws/notifications` | Conexión WebSocket |

### 🏢 Gestión Institucional

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/v1/institutions` | Listar instituciones |
| `GET` | `/api/v1/regionals` | Listar regionales |
| `GET` | `/api/v1/departments` | Listar departamentos |
| `GET` | `/api/v1/cities` | Listar ciudades |

### 📊 Auditoría

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/v1/auditory` | Listar registros de auditoría |
| `GET` | `/api/v1/auditory/{id}` | Obtener registro de auditoría |

> 📖 **Documentación completa de la API**: Accede a Swagger UI en `http://localhost:8080/swagger-ui.html` cuando el servidor esté en ejecución.

---

## 🎨 Características de la Interfaz

### 🌐 Interfaz Web

- ✅ Diseño responsive y moderno
- ✅ Modo oscuro/claro
- ✅ Notificaciones en tiempo real
- ✅ Navegación intuitiva por roles
- ✅ Dashboards personalizados
- ✅ Filtros y búsqueda avanzada
- ✅ Tablas interactivas con paginación
- ✅ Modales y formularios dinámicos
- ✅ Toasts y notificaciones visuales
- ✅ Monitoreo de inactividad

### 📱 Aplicación Móvil

- ✅ Interfaz nativa para Android e iOS
- ✅ Captura de fotos con cámara
- ✅ Selección de imágenes de galería
- ✅ Navegación por pestañas
- ✅ Autenticación persistente
- ✅ Sincronización con backend
- ✅ Diseño adaptativo

---

## 🔮 Integraciones Futuras

Según la especificación de requisitos, se planean las siguientes expansiones:

- 🔗 **Integración con sistemas contables externos**
- 🛒 **Módulos de compras/adquisiciones**
- 🔧 **Sistemas de mantenimiento preventivo**
- 📱 **Aplicaciones móviles nativas adicionales**
- 📧 **Integración avanzada con servicios de email**
- 🔌 **APIs para integración con otros sistemas SENA**
- 📊 **Dashboards analíticos avanzados**
- 🤖 **Automatización de procesos**

---

## 🤝 Contribuir

¡Las contribuciones son bienvenidas! Por favor, sigue estos pasos:

1. **Fork** el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. **Commit** tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. **Push** a la rama (`git push origin feature/AmazingFeature`)
5. Abre un **Pull Request**

### 📝 Guías de Desarrollo

- Sigue los estándares de código Java/Spring Boot
- Mantén cobertura de tests > 80%
- Documenta APIs con OpenAPI/Swagger
- Sigue principios SOLID y arquitectura limpia
- Escribe commits descriptivos
- Actualiza la documentación según sea necesario

### 🏗️ Estructura de Commits

Usa el formato convencional de commits:

```
feat: agregar nueva funcionalidad de exportación
fix: corregir bug en autenticación
docs: actualizar documentación de API
style: formatear código
refactor: refactorizar módulo de usuarios
test: agregar tests para cancelaciones
chore: actualizar dependencias
```

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

---

## 📞 Contacto e Información del Proyecto

### 👥 Equipo de Desarrollo

| Rol | Desarrollador | Especialización |
|-----|---------------|-----------------|
| 📱 **Mobile Developer** | Julian Chaparro | React Native, Expo |
| 🌐 **Frontend Developer** | Carlos Parra | HTML, CSS, JavaScript, Tailwind |
| ⚙️ **Backend Developer** | Gabriel Barrantes | Java, Spring Boot, PostgreSQL |
| ⚙️ **Backend Developer** | Cristian Gracia | Java, Spring Boot, PostgreSQL |

### 🔗 Enlaces

- **Repositorio**: [https://github.com/Gabriel3555/SGDIS](https://github.com/Gabriel3555/SGDIS)
- **Proyecto**: SGDIS - Sistema de Gestión de Inventarios SENA
- **Organización**: Servicio Nacional de Aprendizaje (SENA)

---

## 🙏 Agradecimientos

- **Servicio Nacional de Aprendizaje (SENA)** - Por la oportunidad y el apoyo
- **Comunidad Spring Boot** - Por el excelente framework
- **Comunidad React Native** - Por las herramientas de desarrollo móvil
- **Todos los contribuidores** - Por hacer este proyecto posible

---

<div align="center">

**Versión:** 1.0.0  
**Última actualización:** Diciembre 2024  
**Estado:** Desarrollo Activo 🚀

---

⭐ **Si este proyecto te resulta útil, considera darle una estrella en GitHub** ⭐

</div>
