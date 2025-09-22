# SGDIS - Sistema de Gestión de Inventarios SENA

[![Java](https://img.shields.io/badge/Java-17-orange)](https://openjdk.java.net/projects/jdk/17/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.5.5-brightgreen)](https://spring.io/projects/spring-boot)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-blue)](https://www.postgresql.org/)
[![React Native](https://img.shields.io/badge/React%20Native-0.72+-lightblue)](https://reactnative.dev/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

## 📋 Descripción

SGDIS (Sistema de Gestión de Inventarios SENA) es una aplicación integral para la gestión de inventarios de activos fijos y elementos del Servicio Nacional de Aprendizaje (SENA). El sistema permite el control, seguimiento y administración de ítems distribuidos en múltiples inventarios con diferentes niveles de acceso y permisos granulares.

### 🎯 Propósito

Centralizar y optimizar la gestión de inventarios del SENA, proporcionando una plataforma robusta para el control de activos fijos, facilitando procesos de verificación física, bajas controladas, importación/exportación de datos y generación de reportes detallados.

### 👥 Usuarios Objetivo

- **Superadministradores**: Control total del sistema, gestión de usuarios y configuración global
- **Almacenistas**: Gestión logística de inventarios, aprobación de bajas y reportes operativos
- **Usuarios Normales**: Verificación física, solicitudes de baja y consultas limitadas

## 🛠️ Tecnologías

### Backend
- **Java 17** - Lenguaje de programación principal
- **Spring Boot 3.5.5** - Framework para desarrollo de aplicaciones Java
- **Spring Security** - Autenticación y autorización con JWT
- **Spring Data JPA** - Persistencia de datos
- **PostgreSQL** - Base de datos relacional
- **Maven** - Gestión de dependencias y construcción

### Frontend Web
- **HTML5/CSS3** - Estructura y estilos base
- **Tailwind CSS** - Framework CSS utilitario
- **JavaScript (ES6+)** - Lógica del lado cliente
- **JWT** - Gestión de autenticación en el navegador

### Móvil
- **React Native** - Framework para desarrollo de aplicaciones móviles
- **Expo** - Plataforma para desarrollo y distribución

### Infraestructura
- **Docker** - Contenerización de la aplicación
- **Docker Compose** - Orquestación de servicios

## 🏗️ Arquitectura

El sistema sigue una arquitectura de microservicios con separación clara de responsabilidades:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Native  │    │   Spring Boot   │    │   PostgreSQL    │
│   Mobile App    │◄──►│   REST API      │◄──►│   Database      │
│                 │    │   Backend       │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Web Browser   │
                    │   (HTML/JS)     │
                    └─────────────────┘
```

### Componentes Principales

- **API REST**: Endpoints para autenticación, gestión de usuarios, inventarios e ítems
- **Autenticación JWT**: Sistema seguro de tokens para control de acceso
- **Vistas Web**: Interfaz web servida desde `resources/static`
- **Base de Datos**: PostgreSQL con diseño relacional optimizado
- **App Móvil**: Interfaz nativa para dispositivos móviles

## ✨ Características Principales

### 🔐 Gestión de Autenticación
- Login seguro con email/contraseña
- Recuperación de contraseña
- Control de sesiones con JWT
- Redirección automática según roles

### 👥 Gestión de Usuarios
- Creación, modificación y eliminación de usuarios
- Asignación de roles (Superadministrador, Almacenista, Usuario Normal)
- Permisos granulares por usuario
- Gestión de estados de usuario

### 📦 Gestión de Inventarios
- Creación y administración de múltiples inventarios
- Asignación de propietarios (centros/personas)
- Control de acceso por inventario
- Historial de cambios

### 🔍 Gestión de Ítems
- Registro completo de ítems con fotos opcionales
- Edición y actualización de información
- Sistema de bajas controlado
- Verificación física de existencia
- Actualización de ubicaciones
- Prevención de duplicados

### 📊 Reportes y Exportación
- Generación de reportes filtrados
- Exportación a Excel/PDF
- Importación masiva desde Excel
- Plantillas estandarizadas

### 🔒 Seguridad y Auditoría
- Logs completos de auditoría
- Control de acceso basado en roles
- Encriptación HTTPS
- Validaciones de integridad de datos

## 🚀 Instalación y Configuración

### Prerrequisitos

- **Java 17** o superior
- **Maven 3.6+**
- **PostgreSQL 15+**
- **Node.js 18+** (para desarrollo móvil)
- **Docker** (opcional, para despliegue)

### Configuración del Backend

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/Gabriel3555/SGDIS.git
   cd SGDIS/backend
   ```

2. **Configurar la base de datos:**
   - Crear base de datos PostgreSQL
   - Actualizar `application.properties` con credenciales:
   ```properties
   spring.datasource.url=jdbc:postgresql://localhost:5432/sgdis_db
   spring.datasource.username=your_username
   spring.datasource.password=your_password
   ```

3. **Construir y ejecutar:**
   ```bash
   ./mvnw clean install
   ./mvnw spring-boot:run
   ```

4. **Acceder a la aplicación:**
   - Web: `http://localhost:8080`
   - API Docs: `http://localhost:8080/swagger-ui.html`

### Configuración de la App Móvil

1. **Instalar dependencias:**
   ```bash
   cd mobile
   npm install
   ```

2. **Configurar API endpoint:**
   - Actualizar configuración en `mobile/src/config/api.js`

3. **Ejecutar en desarrollo:**
   ```bash
   npm start
   # o con Expo
   expo start
   ```

### Despliegue con Docker

```bash
# Construir imágenes
docker-compose build

# Ejecutar servicios
docker-compose up -d
```

## 📖 Uso

### Acceso al Sistema

1. **Registro inicial:** Crear usuario administrador
2. **Login:** Acceder con credenciales válidas
3. **Redirección automática:** Según rol del usuario

### Flujo de Trabajo Típico

1. **Superadministrador:**
   - Crear usuarios y asignar roles
   - Configurar permisos granulares
   - Revisar auditoría

2. **Almacenista:**
   - Crear y gestionar inventarios
   - Registrar/editar ítems
   - Aprobar/rechazar solicitudes de baja
   - Generar reportes

3. **Usuario Normal:**
   - Verificar ítems físicamente
   - Solicitar bajas de ítems
   - Consultar inventarios asignados

## 📁 Estructura del Proyecto

```
SGDIS/
├── backend/                          # Backend Spring Boot
│   ├── src/main/java/com/sgdis/backend/
│   │   ├── auth/                     # Módulo de autenticación
│   │   │   ├── application/          # Casos de uso y DTOs
│   │   │   ├── domain/               # Entidades de dominio
│   │   │   ├── infrastructure/       # Repositorios y configuración
│   │   │   ├── security/             # Configuración de seguridad
│   │   │   └── web/                  # Controladores REST
│   │   ├── user/                     # Módulo de usuarios
│   │   └── BackendApplication.java   # Clase principal
│   ├── src/main/resources/
│   │   ├── static/                   # Vistas web HTML
│   │   │   ├── index.html            # Página de login
│   │   │   ├── register.html         # Página de registro
│   │   │   └── dashboard/            # Dashboards por rol
│   │   └── application.properties    # Configuración
│   └── pom.xml                       # Dependencias Maven
├── mobile/                           # App React Native
│   ├── src/
│   │   ├── components/               # Componentes reutilizables
│   │   ├── screens/                  # Pantallas de la app
│   │   ├── navigation/               # Configuración de navegación
│   │   └── services/                 # Servicios API
│   ├── App.js                        # Punto de entrada
│   └── package.json                  # Dependencias
├── docker-compose.yml                # Configuración Docker
├── sena-inventory-srs.txt            # Especificación de requisitos
└── README.md                         # Este archivo
```

## 🔗 API Endpoints Principales

### Autenticación
- `POST /api/v1/auth/login` - Inicio de sesión
- `POST /api/v1/auth/register` - Registro de usuario
- `POST /api/v1/auth/token/refresh` - Renovación de token

### Gestión de Usuarios
- `GET /api/v1/users` - Listar usuarios
- `POST /api/v1/users` - Crear usuario
- `PUT /api/v1/users/{id}` - Actualizar usuario
- `DELETE /api/v1/users/{id}` - Eliminar usuario

### Gestión de Inventarios
- `GET /api/v1/inventories` - Listar inventarios
- `POST /api/v1/inventories` - Crear inventario
- `PUT /api/v1/inventories/{id}` - Actualizar inventario

### Gestión de Ítems
- `GET /api/v1/items` - Listar ítems
- `POST /api/v1/items` - Crear ítem
- `PUT /api/v1/items/{id}` - Actualizar ítem
- `DELETE /api/v1/items/{id}` - Eliminar ítem

## 🔮 Futuras Integraciones

Según la especificación de requisitos, se planean las siguientes expansiones:

- **Integración con sistemas contables externos**
- **Módulos de compras/adquisiciones**
- **Sistemas de mantenimiento preventivo**
- **Aplicaciones móviles nativas adicionales**
- **Integración con servicios de correo electrónico**
- **APIs para integración con otros sistemas del SENA**

## 🤝 Contribución

1. Fork el proyecto
2. Crear rama para feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

### Guías de Desarrollo

- Seguir estándares de codificación Java/Spring Boot
- Mantener cobertura de tests > 80%
- Documentar APIs con OpenAPI/Swagger
- Seguir principios SOLID y clean architecture

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 📞 Contacto

- **Proyecto:** SGDIS - Sistema de Gestión de Inventarios SENA
- **Repositorio:** [https://github.com/Gabriel3555/SGDIS](https://github.com/Gabriel3555/SGDIS)
- **Equipo de Desarrollo:**
  - Julian Chaparro (Desarrollador Movil)
  - Carlos Parra (Desarrollador Frontend)
  - Gabriel Barrantes (Desarrollador Backend)
  - Cristian Gracia (Desarrollador Backend)

## 🙏 Agradecimientos

- Servicio Nacional de Aprendizaje (SENA)
- Comunidad de desarrollo Spring Boot y React Native
- Contribuidores del proyecto

---

**Versión:** 0.0.1
**Última actualización:** Septiembre 2024
**Estado:** En desarrollo activo