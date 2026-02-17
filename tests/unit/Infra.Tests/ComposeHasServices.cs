using FluentAssertions;
using YamlDotNet.Serialization;
using Xunit;

namespace L4H.Infra.Tests;

public class ComposeHasServices
{
    [Fact]
    public void ComposeFile_ShouldContainRequiredServices()
    {
        // Arrange
        var composePath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "compose.prod.yml");
        var composeContent = File.ReadAllText(composePath);

        // Act
        var deserializer = new DeserializerBuilder().Build();
        var compose = deserializer.Deserialize<dynamic>(composeContent);

        // Assert
        var services = compose["services"] as Dictionary<object, object>;
        services.Should().NotBeNull("Services section should exist");

        var serviceNames = services!.Keys.Cast<string>().ToList();
        serviceNames.Should().Contain("api", "API service should be present");
        serviceNames.Should().Contain("upload-gateway", "Upload gateway service should be present");
        serviceNames.Should().Contain("sqlserver", "SQL Server service should be present");
        serviceNames.Should().Contain("scraper", "Scraper service should be present");
        serviceNames.Should().Contain("caddy", "Caddy service should be present");
    }

    [Fact]
    public void ComposeFile_ShouldHaveRequiredEnvironmentVariables()
    {
        // Arrange
        var composePath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "compose.prod.yml");
        var composeContent = File.ReadAllText(composePath);

        // Act & Assert
        composeContent.Should().Contain("${LE_EMAIL}", "LE_EMAIL environment variable should be present");
        composeContent.Should().Contain("${L4H_DOMAIN}", "L4H_DOMAIN environment variable should be present");
        composeContent.Should().Contain("${CANNLAW_DOMAIN}", "CANNLAW_DOMAIN environment variable should be present");
        composeContent.Should().Contain("${SQL_SA_PASSWORD}", "SQL_SA_PASSWORD environment variable should be present");
        composeContent.Should().Contain("${JWT_SIGNING_KEY}", "JWT_SIGNING_KEY environment variable should be present");
        composeContent.Should().Contain("${ADMIN_SEED_PASSWORD}", "ADMIN_SEED_PASSWORD environment variable should be present");
        composeContent.Should().Contain("${UPLOADS_TOKEN_SIGNING_KEY}", "UPLOADS_TOKEN_SIGNING_KEY environment variable should be present");
        composeContent.Should().Contain("${GH_ORG}", "GH_ORG environment variable should be present");
        composeContent.Should().Contain("${IMAGE_TAG}", "IMAGE_TAG environment variable should be present");
    }

    [Fact]
    public void ComposeFile_ShouldHaveRequiredVolumes()
    {
        // Arrange
        var composePath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "compose.prod.yml");
        var composeContent = File.ReadAllText(composePath);

        // Act
        var deserializer = new DeserializerBuilder().Build();
        var compose = deserializer.Deserialize<dynamic>(composeContent);

        // Assert
        var volumes = compose["volumes"] as Dictionary<object, object>;
        volumes.Should().NotBeNull("Volumes section should exist");

        var volumeNames = volumes!.Keys.Cast<string>().ToList();
        volumeNames.Should().Contain("mssql-data", "MSSQL data volume should be present");
        volumeNames.Should().Contain("uploads-data", "Uploads data volume should be present");
        volumeNames.Should().Contain("caddy-data", "Caddy data volume should be present");
        volumeNames.Should().Contain("caddy-config", "Caddy config volume should be present");
        volumeNames.Should().Contain("web-l4h", "Web L4H volume should be present");
        volumeNames.Should().Contain("web-cannlaw", "Web Cannlaw volume should be present");
    }

    [Fact]
    public void ComposeFile_ShouldHaveHealthChecks()
    {
        // Arrange
        var composePath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "compose.prod.yml");
        var composeContent = File.ReadAllText(composePath);

        // Act & Assert
        composeContent.Should().Contain("healthcheck:", "Health checks should be configured");
        composeContent.Should().Contain("test:", "Health check tests should be present");
        composeContent.Should().Contain("interval:", "Health check intervals should be configured");
        composeContent.Should().Contain("timeout:", "Health check timeouts should be configured");
        composeContent.Should().Contain("retries:", "Health check retries should be configured");
    }

    [Fact]
    public void ComposeFile_ShouldHaveServiceDependencies()
    {
        // Arrange
        var composePath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "compose.prod.yml");
        var composeContent = File.ReadAllText(composePath);

        // Act & Assert
        composeContent.Should().Contain("depends_on:", "Service dependencies should be configured");
        composeContent.Should().Contain("condition: service_healthy", "Health check conditions should be present");
    }

    [Fact]
    public void ComposeFile_ShouldHaveCorrectImageReferences()
    {
        // Arrange
        var composePath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "compose.prod.yml");
        var composeContent = File.ReadAllText(composePath);

        // Act & Assert
        composeContent.Should().Contain("ghcr.io/${GH_ORG}/l4h-api:${IMAGE_TAG}", "API image should reference GHCR");
        composeContent.Should().Contain("ghcr.io/${GH_ORG}/l4h-upload-gateway:${IMAGE_TAG}", "Upload gateway image should reference GHCR");
        composeContent.Should().Contain("ghcr.io/${GH_ORG}/l4h-scraper:${IMAGE_TAG}", "Scraper image should reference GHCR");
        composeContent.Should().Contain("mcr.microsoft.com/mssql/server:2022-latest", "SQL Server should use official Microsoft image");
        composeContent.Should().Contain("caddy:2", "Caddy should use official Caddy image");
    }
}
