FROM eclipse-temurin:21-jdk-alpine
WORKDIR /app

# Copiar el JAR desde la raíz del proyecto
COPY backend-0.0.2.jar app.jar

# Puerto en el que Spring Boot corre por defecto
EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]