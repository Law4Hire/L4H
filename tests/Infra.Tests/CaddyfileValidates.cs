using FluentAssertions;
using Xunit;

namespace L4H.Infra.Tests;

public class CaddyfileValidates
{
    [Fact]
    public void Caddyfile_ShouldContainRequiredEnvironmentVariables()
    {
        // Arrange
        // Get the project root directory (go up from bin/Debug/net9.0 to project root)
        var projectRoot = Path.GetFullPath(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "..", "..", "..", "..", ".."));
        var caddyfilePath = Path.Combine(projectRoot, "ops", "caddy", "Caddyfile.prod");
        var caddyfileContent = File.ReadAllText(caddyfilePath);

        // Act & Assert
        caddyfileContent.Should().Contain("{env.L4H_DOMAIN}", "L4H domain environment variable should be present");
        caddyfileContent.Should().Contain("{env.CANNLAW_DOMAIN}", "Cannlaw domain environment variable should be present");
        caddyfileContent.Should().Contain("{env.LE_EMAIL}", "Let's Encrypt email environment variable should be present");
    }

    [Fact]
    public void Caddyfile_ShouldContainRequiredRoutes()
    {
        // Arrange
        // Get the project root directory (go up from bin/Debug/net9.0 to project root)
        var projectRoot = Path.GetFullPath(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "..", "..", "..", "..", ".."));
        var caddyfilePath = Path.Combine(projectRoot, "ops", "caddy", "Caddyfile.prod");
        var caddyfileContent = File.ReadAllText(caddyfilePath);

        // Act & Assert
        caddyfileContent.Should().Contain("/api/*", "API route should be present");
        caddyfileContent.Should().Contain("/gateway/*", "Gateway route should be present");
        caddyfileContent.Should().Contain("reverse_proxy api:8080", "API reverse proxy should be configured");
        caddyfileContent.Should().Contain("reverse_proxy upload-gateway:7070", "Upload gateway reverse proxy should be configured");
    }

    [Fact]
    public void Caddyfile_ShouldHaveCorrectStaticFileConfiguration()
    {
        // Arrange
        // Get the project root directory (go up from bin/Debug/net9.0 to project root)
        var projectRoot = Path.GetFullPath(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "..", "..", "..", "..", ".."));
        var caddyfilePath = Path.Combine(projectRoot, "ops", "caddy", "Caddyfile.prod");
        var caddyfileContent = File.ReadAllText(caddyfilePath);

        // Act & Assert
        caddyfileContent.Should().Contain("root * /srv/www/l4h", "L4H static file root should be configured");
        caddyfileContent.Should().Contain("root * /srv/www/cannlaw", "Cannlaw static file root should be configured");
        caddyfileContent.Should().Contain("file_server", "File server should be enabled");
        caddyfileContent.Should().Contain("encode zstd gzip", "Compression should be enabled");
    }

    [Fact]
    public void Caddyfile_ShouldHaveAutoHttpsConfiguration()
    {
        // Arrange
        // Get the project root directory (go up from bin/Debug/net9.0 to project root)
        var projectRoot = Path.GetFullPath(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "..", "..", "..", "..", ".."));
        var caddyfilePath = Path.Combine(projectRoot, "ops", "caddy", "Caddyfile.prod");
        var caddyfileContent = File.ReadAllText(caddyfilePath);

        // Act & Assert
        caddyfileContent.Should().Contain("auto_https disable_redirects", "Auto HTTPS should be configured to disable redirects");
    }

    [SkippableFact]
    public void Caddyfile_ShouldValidateWithCaddy()
    {
        // Skip if Docker is not available
        Skip.IfNot(CanRunDocker(), "Docker is not available or CAN_RUN_DOCKER is not set to 1");

        // Arrange
        // Get the project root directory (go up from bin/Debug/net9.0 to project root)
        var projectRoot = Path.GetFullPath(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "..", "..", "..", "..", ".."));
        var caddyfilePath = Path.Combine(projectRoot, "ops", "caddy", "Caddyfile.prod");
        var tempDir = Path.GetTempPath();
        var tempCaddyfile = Path.Combine(tempDir, "Caddyfile.prod");
        
        // Copy Caddyfile to temp directory and substitute environment variables with test values
        var caddyfileContent = File.ReadAllText(caddyfilePath);
        caddyfileContent = caddyfileContent.Replace("{env.L4H_DOMAIN}", "test.l4h.com");
        caddyfileContent = caddyfileContent.Replace("{env.CANNLAW_DOMAIN}", "test.cannlaw.com");
        caddyfileContent = caddyfileContent.Replace("{env.LE_EMAIL}", "test@example.com");
        File.WriteAllText(tempCaddyfile, caddyfileContent);

        try
        {
            // Act
            var result = RunDockerCommand($"run --rm -v \"{tempDir}:/cfg\" caddy:2 caddy validate --config /cfg/Caddyfile.prod");

            // Assert
            result.ExitCode.Should().Be(0, "Caddyfile should be valid according to Caddy");
        }
        finally
        {
            // Cleanup
            if (File.Exists(tempCaddyfile))
            {
                File.Delete(tempCaddyfile);
            }
        }
    }

    private static bool CanRunDocker()
    {
        var canRunDocker = Environment.GetEnvironmentVariable("CAN_RUN_DOCKER");
        return canRunDocker == "1";
    }

    private static (int ExitCode, string Output) RunDockerCommand(string arguments)
    {
        var startInfo = new System.Diagnostics.ProcessStartInfo
        {
            FileName = "docker",
            Arguments = arguments,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true
        };

        using var process = new System.Diagnostics.Process { StartInfo = startInfo };
        process.Start();
        var output = process.StandardOutput.ReadToEnd();
        var error = process.StandardError.ReadToEnd();
        process.WaitForExit();

        return (process.ExitCode, output + error);
    }
}
