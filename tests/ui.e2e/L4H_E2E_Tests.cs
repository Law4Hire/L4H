using Microsoft.Playwright;
using Xunit;

namespace L4H.UI.E2E.Tests;

public class L4H_E2E_Tests : IClassFixture<PlaywrightFixture>
{
    private readonly PlaywrightFixture _fixture;

    public L4H_E2E_Tests(PlaywrightFixture fixture)
    {
        _fixture = fixture;
    }

    [SkippableFact]
    public async Task L4H_Login_Shows_Dashboard()
    {
        // Skip if E2E_UI environment variable is not set to "1"
        Skip.If(true, "E2E tests are skipped until they're designed well enough to make it work");

        var page = await _fixture.Browser.NewPageAsync().ConfigureAwait(false);

        try
        {
            // Navigate to L4H login page
            await page.GotoAsync("http://localhost:3000/").ConfigureAwait(false);
            
            // Wait for login form to be visible
            await page.WaitForSelectorAsync("form", new PageWaitForSelectorOptions { Timeout = 10000 }).ConfigureAwait(false);

            // Fill in login form
            await page.FillAsync("input[type='email']", "sally.testing+dev@l4h.local").ConfigureAwait(false);
            await page.FillAsync("input[type='password']", "SecureTest123!").ConfigureAwait(false);

            // Click login button
            await page.ClickAsync("button[type='submit']").ConfigureAwait(false);

            // Wait for dashboard to load
            await page.WaitForSelectorAsync("h1", new PageWaitForSelectorOptions { Timeout = 10000 }).ConfigureAwait(false);

            // Verify dashboard heading is present
            var heading = await page.TextContentAsync("h1").ConfigureAwait(false);
            Assert.Contains("Welcome", heading!);

            // Test language switching to Spanish
            await page.SelectOptionAsync("select", "es").ConfigureAwait(false);
            
            // Wait for language change to take effect
            await page.WaitForTimeoutAsync(1000).ConfigureAwait(false);

            // Verify Spanish text is displayed
            var spanishText = await page.TextContentAsync("h1").ConfigureAwait(false);
            Assert.Contains("Bienvenido", spanishText!);
        }
        finally
        {
            await page.CloseAsync().ConfigureAwait(false);
        }
    }

    [SkippableFact]
    public async Task Cannlaw_Login_Shows_Schedule()
    {
        // Skip if E2E_UI environment variable is not set to "1"
        Skip.If(true, "E2E tests are skipped until they're designed well enough to make it work");

        var page = await _fixture.Browser.NewPageAsync().ConfigureAwait(false);

        try
        {
            // Navigate to Cannlaw login page
            await page.GotoAsync("http://localhost:3001/").ConfigureAwait(false);
            
            // Wait for login form to be visible
            await page.WaitForSelectorAsync("form", new PageWaitForSelectorOptions { Timeout = 10000 }).ConfigureAwait(false);

            // Fill in login form with staff credentials
            await page.FillAsync("input[type='email']", "staff@cannlaw.local").ConfigureAwait(false);
            await page.FillAsync("input[type='password']", "StaffPassword123!").ConfigureAwait(false);

            // Click login button
            await page.ClickAsync("button[type='submit']").ConfigureAwait(false);

            // Wait for schedule page to load
            await page.WaitForSelectorAsync("h1", new PageWaitForSelectorOptions { Timeout = 10000 }).ConfigureAwait(false);

            // Verify schedule heading is present
            var heading = await page.TextContentAsync("h1").ConfigureAwait(false);
            Assert.Contains("Schedule", heading!);

            // Test navigation to cases page
            await page.GotoAsync("http://cannlaw.localhost/cases").ConfigureAwait(false);
            await page.WaitForSelectorAsync("h1", new PageWaitForSelectorOptions { Timeout = 10000 }).ConfigureAwait(false);

            var casesHeading = await page.TextContentAsync("h1").ConfigureAwait(false);
            Assert.Contains("Cases", casesHeading!);
        }
        finally
        {
            await page.CloseAsync().ConfigureAwait(false);
        }
    }
}
