using System.Diagnostics;
using Xunit;

namespace L4H.UI.Wrap.Tests;

public class VitestWrapperTests
{
    [Fact]
    [Trait("ui", "component")]
    public async Task L4H_Vitest_Tests_Should_Pass()
    {
        // Skip if npm is not available
        if (!IsNpmAvailable())
        {
            Assert.True(true, "Skipped: npm is not available on this system");
            return;
        }

        var projectPath = FindWebProjectPath("l4h");
        if (projectPath == null)
        {
            Assert.True(true, "Skipped: web/l4h directory not found");
            return;
        }

        var result = await RunVitestTests(projectPath).ConfigureAwait(true);

        Assert.True(result.Success, $"L4H Vitest tests failed. Exit code: {result.ExitCode}, Output: {result.Output}");
    }

    [Fact]
    [Trait("ui", "component")]
    public async Task Cannlaw_Vitest_Tests_Should_Pass()
    {
        // Skip if npm is not available
        if (!IsNpmAvailable())
        {
            Assert.True(true, "Skipped: npm is not available on this system");
            return;
        }

        var projectPath = FindWebProjectPath("cannlaw");
        if (projectPath == null)
        {
            Assert.True(true, "Skipped: web/cannlaw directory not found");
            return;
        }

        var result = await RunVitestTests(projectPath).ConfigureAwait(true);

        Assert.True(result.Success, $"Cannlaw Vitest tests failed. Exit code: {result.ExitCode}, Output: {result.Output}");
    }

    [Fact]
    [Trait("ui", "component")]
    public async Task SharedUI_Vitest_Tests_Should_Pass()
    {
        // Skip if npm is not available
        if (!IsNpmAvailable())
        {
            Assert.True(true, "Skipped: npm is not available on this system");
            return;
        }

        var projectPath = FindWebProjectPath("shared-ui");
        if (projectPath == null)
        {
            Assert.True(true, "Skipped: web/shared-ui directory not found");
            return;
        }

        var result = await RunVitestTests(projectPath).ConfigureAwait(true);

        Assert.True(result.Success, $"Shared UI Vitest tests failed. Exit code: {result.ExitCode}, Output: {result.Output}");
    }

    private static string? FindWebProjectPath(string projectName)
    {
        // Try to find the project root by looking for the solution file
        var currentDir = Directory.GetCurrentDirectory();
        var searchDir = new DirectoryInfo(currentDir);

        // Walk up the directory tree looking for the project root (where .sln file exists)
        while (searchDir != null)
        {
            // Check if we're at the project root (contains web directory)
            var webDir = Path.Combine(searchDir.FullName, "web", projectName);
            if (Directory.Exists(webDir))
            {
                return webDir;
            }

            searchDir = searchDir.Parent;
        }

        return null;
    }

    private static bool IsNpmAvailable()
    {
        try
        {
            var startInfo = new ProcessStartInfo
            {
                FileName = "npm",
                Arguments = "--version",
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };

            using var process = new Process { StartInfo = startInfo };
            process.Start();
            process.WaitForExit(5000); // Wait up to 5 seconds

            return process.ExitCode == 0;
        }
        catch
        {
            return false;
        }
    }

    private static async Task<(bool Success, int ExitCode, string Output)> RunVitestTests(string projectPath)
    {
        var startInfo = new ProcessStartInfo
        {
            FileName = "npm",
            Arguments = "ci && npm run test:run",
            WorkingDirectory = projectPath,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true
        };

        using var process = new Process { StartInfo = startInfo };
        
        var output = new List<string>();
        var error = new List<string>();

        process.OutputDataReceived += (sender, e) =>
        {
            if (!string.IsNullOrEmpty(e.Data))
                output.Add(e.Data);
        };

        process.ErrorDataReceived += (sender, e) =>
        {
            if (!string.IsNullOrEmpty(e.Data))
                error.Add(e.Data);
        };

        process.Start();
        process.BeginOutputReadLine();
        process.BeginErrorReadLine();

        await process.WaitForExitAsync().ConfigureAwait(false);

        var allOutput = string.Join(Environment.NewLine, output.Concat(error));
        
        return (process.ExitCode == 0, process.ExitCode, allOutput);
    }
}
