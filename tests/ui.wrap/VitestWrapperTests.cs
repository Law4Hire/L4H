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

        var projectPath = Path.Combine(Directory.GetCurrentDirectory(), "..", "..", "web", "l4h");
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

        var projectPath = Path.Combine(Directory.GetCurrentDirectory(), "..", "..", "web", "cannlaw");
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

        var projectPath = Path.Combine(Directory.GetCurrentDirectory(), "..", "..", "web", "shared-ui");
        var result = await RunVitestTests(projectPath).ConfigureAwait(true);
        
        Assert.True(result.Success, $"Shared UI Vitest tests failed. Exit code: {result.ExitCode}, Output: {result.Output}");
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
