# Build stage - Using .NET 10 RC2 SDK
FROM mcr.microsoft.com/dotnet/sdk:10.0.100-rc.2 AS build
WORKDIR /src

# Copy project files
COPY ["src/api/L4H.Api.csproj", "api/"]
COPY ["src/shared/L4H.Shared.csproj", "shared/"]
COPY ["src/infrastructure/L4H.Infrastructure.csproj", "infrastructure/"]

# Restore dependencies
RUN dotnet restore "api/L4H.Api.csproj"

# Copy source code
COPY ["src/api/", "api/"]
COPY ["src/shared/", "shared/"]
COPY ["src/infrastructure/", "infrastructure/"]

# Build the application
WORKDIR /src/api
RUN dotnet build "L4H.Api.csproj" -c Release -o /app/build

# Publish the application
RUN dotnet publish "L4H.Api.csproj" -c Release -o /app/publish --no-restore

# Runtime stage - Using .NET 10 RC2 runtime
FROM mcr.microsoft.com/dotnet/aspnet:10.0.0-rc.2 AS runtime
WORKDIR /app

# Install curl for healthcheck
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Copy published app
COPY --from=build /app/publish .

# Create non-root user
RUN useradd -m appuser && chown -R appuser /app
USER appuser

# Expose port
EXPOSE 8080

# Set environment variables
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/healthz || exit 1

# Start the application
CMD ["dotnet", "L4H.Api.dll"]