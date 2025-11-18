FROM mcr.microsoft.com/dotnet/aspnet:10.0.0-rc.2 AS base
WORKDIR /app
EXPOSE 7070

FROM mcr.microsoft.com/dotnet/sdk:10.0.100-rc.2 AS build
WORKDIR /src
COPY ["src/upload-gateway/L4H.UploadGateway.csproj", "src/upload-gateway/"]
RUN dotnet restore "src/upload-gateway/L4H.UploadGateway.csproj"
COPY . .
WORKDIR "/src/upload-gateway"
RUN dotnet build "L4H.UploadGateway.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "L4H.UploadGateway.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app

# Install curl for healthcheck
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

COPY --from=publish /app/publish .

# Create upload directory
RUN mkdir -p /data/uploads

ENTRYPOINT ["dotnet", "L4H.UploadGateway.dll"]