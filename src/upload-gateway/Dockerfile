FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 7070

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY ["src/upload-gateway/L4H.UploadGateway.csproj", "src/upload-gateway/"]
RUN dotnet restore "src/upload-gateway/L4H.UploadGateway.csproj"
COPY . .
WORKDIR "/src/src/upload-gateway"
RUN dotnet build "L4H.UploadGateway.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "L4H.UploadGateway.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .

# Create upload directory
RUN mkdir -p /data/uploads

ENTRYPOINT ["dotnet", "L4H.UploadGateway.dll"]