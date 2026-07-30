# Step 1: Build the application using Maven and JDK 26
FROM maven:3.9-eclipse-temurin-26-noble AS build
WORKDIR /app
COPY . .

# Grant executable permission to the Maven wrapper
RUN chmod +x ./mvnw

# Compile and package the JAR file
RUN ./mvnw clean package -DskipTests

# Step 2: Use a lightweight JDK 26 image to run the app
FROM eclipse-temurin:26-jdk-jammy
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar

# Expose Spring Boot's default port
EXPOSE 8083

# Keep your JVM memory safely within Render's 512MB free tier limit
ENTRYPOINT ["java", "-Xmx350m", "-jar", "app.jar"]
