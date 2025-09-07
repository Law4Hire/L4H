# Build stage
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy project files
COPY ["src/api/L4H.Api.csproj", "src/api/"]
COPY ["src/shared/L4H.Shared.csproj", "src/shared/"]
COPY ["src/infrastructure/L4H.Infrastructure.csproj", "src/infrastructure/"]

# Restore dependencies
RUN dotnet restore "src/api/L4H.Api.csproj"

# Copy source code
COPY ["src/api/", "src/api/"]
COPY ["src/shared/", "src/shared/"]
COPY ["src/infrastructure/", "src/infrastructure/"]

# Build the application
WORKDIR /src/src/api
RUN dotnet build "L4H.Api.csproj" -c Release -o /app/build

# Publish the application
RUN dotnet publish "L4H.Api.csproj" -c Release -o /app/publish --no-restore

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app

# Copy published app
COPY --from=build /app/publish .

# Copy entrypoint script
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Create non-root user
RUN adduser --disabled-password --gecos '' appuser && chown -R appuser /app
USER appuser

# Expose port
EXPOSE 8080

# Set environment variables
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/healthz || exit 1

ENTRYPOINT ["/app/entrypoint.sh"]