using Microsoft.Playwright;
using Xunit;

namespace L4H.UI.E2E.Tests;

public class PlaywrightFixture : IAsyncLifetime
{
    public IPlaywright Playwright { get; private set; } = null!;
    public IBrowser Browser { get; private set; } = null!;

    public async Task InitializeAsync()
    {
        // Install Playwright browsers if not already installed
        Microsoft.Playwright.Program.Main(new[] { "install" });

        Playwright = await Microsoft.Playwright.Playwright.CreateAsync().ConfigureAwait(false);

        // Run headless in CI environments (when DISPLAY is not available)
        var headless = string.IsNullOrEmpty(Environment.GetEnvironmentVariable("DISPLAY"));

        Browser = await Playwright.Chromium.LaunchAsync(new BrowserTypeLaunchOptions
        {
            Headless = headless
        }).ConfigureAwait(false);
    }

    public async Task DisposeAsync()
    {
        if (Browser != null)
        {
            await Browser.DisposeAsync().ConfigureAwait(false);
        }

        if (Playwright != null)
        {
            Playwright.Dispose();
        }
    }
}
