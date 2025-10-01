# SGDIS - SENA Inventory Management System

[![Java](https://img.shields.io/badge/Java-17-orange)](https://openjdk.java.net/projects/jdk/17/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.5.5-brightgreen)](https://spring.io/projects/spring-boot)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-blue)](https://www.postgresql.org/)
[![React Native](https://img.shields.io/badge/React%20Native-0.72+-lightblue)](https://reactnative.dev/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

## 📋 Description

SGDIS (SENA Inventory Management System) is a comprehensive application for managing inventories of fixed assets and elements of the National Learning Service (SENA). The system allows control, tracking and administration of items distributed across multiple inventories with different access levels and granular permissions.

### 🎯 Purpose

Centralize and optimize SENA's inventory management, providing a robust platform for fixed asset control, facilitating physical verification processes, controlled write-offs, data import/export and detailed report generation.

### 👥 Target Users

- **Superadministrators**: Full system control, user management and global configuration
- **Warehouse Staff**: Logistics inventory management, write-off approvals and operational reports
- **Regular Users**: Physical verification, write-off requests and limited queries

## 🛠️ Technologies

### Backend
- **Java 17** - Main programming language
- **Spring Boot 3.5.5** - Framework for Java application development
- **Spring Security** - Authentication and authorization with JWT
- **Spring Data JPA** - Data persistence
- **PostgreSQL** - Relational database
- **Maven** - Dependency management and build

### Web Frontend
- **HTML5/CSS3** - Base structure and styles
- **Tailwind CSS** - Utility CSS framework
- **JavaScript (ES6+)** - Client-side logic
- **JWT** - Browser authentication management

### Mobile
- **React Native** - Framework for mobile application development
- **Expo** - Platform for development and distribution

### Infrastructure
- **Docker** - Application containerization
- **Docker Compose** - Service orchestration

## 🏗️ Architecture

The system follows a microservices architecture with clear separation of responsibilities:

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

### Main Components

- **REST API**: Endpoints for authentication, user management, inventories and items
- **JWT Authentication**: Secure token system for access control
- **Web Views**: Web interface served from `resources/static`
- **Database**: PostgreSQL with optimized relational design
- **Mobile App**: Native interface for mobile devices

## ✨ Main Features

### 🔐 Authentication Management
- Secure login with email/password
- Password recovery
- JWT session control
- Automatic redirection based on roles

### 👥 User Management
- User creation, modification and deletion
- Role assignment (Superadministrator, Warehouse Staff, Regular User)
- Granular permissions per user
- User status management

### 📦 Inventory Management
- Creation and administration of multiple inventories
- Owner assignment (centers/people)
- Inventory-based access control
- Change history

### 🔍 Item Management
- Complete item registration with optional photos
- Information editing and updating
- Controlled write-off system
- Physical existence verification
- Location updates
- Duplicate prevention

### 📊 Reports and Export
- Filtered report generation
- Export to Excel/PDF
- Mass import from Excel
- Standardized templates

### 🔒 Security and Audit
- Complete audit logs
- Role-based access control
- HTTPS encryption
- Data integrity validations

## 🚀 Installation and Configuration

### Prerequisites

- **Java 17** or higher
- **Maven 3.6+**
- **PostgreSQL 15+**
- **Node.js 18+** (for mobile development)
- **Docker** (optional, for deployment)

### Backend Configuration

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Gabriel3555/SGDIS.git
   cd SGDIS/backend
   ```

2. **Configure the database:**
   - Create PostgreSQL database
   - Update `application.properties` with credentials:
   ```properties
   spring.datasource.url=jdbc:postgresql://localhost:5432/sgdis_db
   spring.datasource.username=your_username
   spring.datasource.password=your_password
   ```

3. **Build and run:**
   ```bash
   ./mvnw clean install
   ./mvnw spring-boot:run
   ```

4. **Access the application:**
   - Web: `http://localhost:8080`
   - API Docs: `http://localhost:8080/swagger-ui.html`

### Mobile App Configuration

1. **Install dependencies:**
   ```bash
   cd mobile
   npm install
   ```

2. **Configure API endpoint:**
   - Update configuration in `mobile/src/config/api.js`

3. **Run in development:**
   ```bash
   npm start
   # or with Expo
   expo start
   ```

### Docker Deployment

```bash
# Build images
docker-compose build

# Run services
docker-compose up -d
```

## 📖 Usage

### System Access

1. **Initial registration:** Create administrator user
2. **Login:** Access with valid credentials
3. **Automatic redirection:** Based on user role

### Typical Workflow

1. **Superadministrator:**
   - Create users and assign roles
   - Configure granular permissions
   - Review audit logs

2. **Warehouse Staff:**
   - Create and manage inventories
   - Register/edit items
   - Approve/reject write-off requests
   - Generate reports

3. **Regular User:**
   - Physically verify items
   - Request item write-offs
   - Query assigned inventories

## 📁 Project Structure

```
SGDIS/
├── backend/                          # Spring Boot Backend
│   ├── src/main/java/com/sgdis/backend/
│   │   ├── auth/                     # Authentication module
│   │   │   ├── application/          # Use cases and DTOs
│   │   │   ├── domain/               # Domain entities
│   │   │   ├── infrastructure/       # Repositories and configuration
│   │   │   ├── security/             # Security configuration
│   │   │   └── web/                  # REST controllers
│   │   ├── user/                     # User module
│   │   └── BackendApplication.java   # Main class
│   ├── src/main/resources/
│   │   ├── static/                   # HTML web views
│   │   │   ├── index.html            # Login page
│   │   │   ├── register.html         # Registration page
│   │   │   └── dashboard/            # Role-based dashboards
│   │   └── application.properties    # Configuration
│   └── pom.xml                       # Maven dependencies
├── mobile/                           # React Native App
│   ├── src/
│   │   ├── components/               # Reusable components
│   │   ├── screens/                  # App screens
│   │   ├── navigation/               # Navigation configuration
│   │   └── services/                 # API services
│   ├── App.js                        # Entry point
│   └── package.json                  # Dependencies
├── docker-compose.yml                # Docker configuration
├── sena-inventory-srs.txt            # Requirements specification
└── README.md                         # This file
```

## 🔗 Main API Endpoints

### Authentication
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/token/refresh` - Token refresh

### User Management
- `GET /api/v1/users` - List users
- `POST /api/v1/users` - Create user
- `PUT /api/v1/users/{id}` - Update user
- `DELETE /api/v1/users/{id}` - Delete user

### Inventory Management
- `GET /api/v1/inventories` - List inventories
- `POST /api/v1/inventories` - Create inventory
- `PUT /api/v1/inventories/{id}` - Update inventory

### Item Management
- `GET /api/v1/items` - List items
- `POST /api/v1/items` - Create item
- `PUT /api/v1/items/{id}` - Update item
- `DELETE /api/v1/items/{id}` - Delete item

## 🔮 Future Integrations

According to the requirements specification, the following expansions are planned:

- **Integration with external accounting systems**
- **Purchasing/acquisition modules**
- **Preventive maintenance systems**
- **Additional native mobile applications**
- **Integration with email services**
- **APIs for integration with other SENA systems**

## 🤝 Contribution

1. Fork the project
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

### Development Guidelines

- Follow Java/Spring Boot coding standards
- Maintain test coverage > 80%
- Document APIs with OpenAPI/Swagger
- Follow SOLID principles and clean architecture

## 📄 License

This project is under the MIT License. See the `LICENSE` file for more details.

## 📞 Contact

- **Project:** SGDIS - SENA Inventory Management System
- **Repository:** [https://github.com/Gabriel3555/SGDIS](https://github.com/Gabriel3555/SGDIS)
- **Development Team:**
  - Julian Chaparro (Mobile Developer)
  - Carlos Parra (Frontend Developer)
  - Gabriel Barrantes (Backend Developer)
  - Cristian Gracia (Backend Developer)

## 🙏 Acknowledgments

- National Learning Service (SENA)
- Spring Boot and React Native development community
- Project contributors

---

**Version:** 0.0.1
**Last update:** September 2025
**Status:** Active development
=======

>>>>>>> 3c458e1aa930c2140a2e50c773689f8d82318c22
