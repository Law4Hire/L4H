FROM mcr.microsoft.com/dotnet/runtime:9.0 AS base
WORKDIR /app

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src
COPY ["src/scraper/L4H.ScraperWorker.csproj", "src/scraper/"]
COPY ["src/infrastructure/L4H.Infrastructure.csproj", "src/infrastructure/"]
COPY ["src/shared/L4H.Shared.csproj", "src/shared/"]
RUN dotnet restore "src/scraper/L4H.ScraperWorker.csproj"
COPY . .
WORKDIR "/src/src/scraper"
RUN dotnet build "L4H.ScraperWorker.csproj" -c $BUILD_CONFIGURATION -o /app/build

FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "L4H.ScraperWorker.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .

# Copy test fixtures for fake provider
COPY tests/fixtures ./fixtures

# Create volume mount point
VOLUME ["/data/scraped"]

ENTRYPOINT ["dotnet", "L4H.ScraperWorker.dll"]