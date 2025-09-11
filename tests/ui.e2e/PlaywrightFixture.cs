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
        Browser = await Playwright.Chromium.LaunchAsync(new BrowserTypeLaunchOptions
        {
            Headless = false, // Non-headless so we can see what's happening
            SlowMo = 500 // Slow down actions for visibility
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
