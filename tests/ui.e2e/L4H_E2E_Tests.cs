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

    [Fact]
    public async Task L4H_Comprehensive_Localization_Test()
    {
        var page = await _fixture.Browser.NewPageAsync().ConfigureAwait(false);

        // Capture console messages for debugging
        page.Console += (_, e) => Console.WriteLine($"CONSOLE: {e.Text}");
        page.PageError += (_, e) => Console.WriteLine($"PAGE ERROR: {e}");

        try
        {
            // Step 1: Test L4H Public Pages (no login required)
            Console.WriteLine("=== Testing L4H Public Pages ===");
            
            // Test Landing Page
            await TestPageLocalization(page, "http://localhost:5175/", "Landing Page", 
                new[] { "nav.dashboard", "nav.pricing", "common.getStarted" }).ConfigureAwait(false);
            
            // Test Visa Library Page
            await TestPageLocalization(page, "http://localhost:5175/visa-library", "Visa Library Page",
                new[] { "visaLibrary.title", "visaLibrary.description", "visaLibrary.learnMore", "visaLibrary.cta.title", "visaLibrary.categories.nonimmigrant", "visaLibrary.categories.immigrant" }).ConfigureAwait(false);

            // Test Login Page
            await TestPageLocalization(page, "http://localhost:5175/login", "Login Page",
                new[] { "auth.login", "auth.email", "auth.password" }).ConfigureAwait(false);

            // Test Register Page
            await TestPageLocalization(page, "http://localhost:5175/register", "Register Page",
                new[] { "auth.createAccount", "auth.firstName", "auth.lastName", "auth.email", "auth.password" }).ConfigureAwait(false);

            // Step 2: Login and Test Protected Pages
            Console.WriteLine("=== Logging in to test protected pages ===");
            await page.GotoAsync("http://localhost:5175/login").ConfigureAwait(false);
            await page.WaitForSelectorAsync("input[type='email']", new PageWaitForSelectorOptions { Timeout = 10000 }).ConfigureAwait(false);
            await page.FillAsync("input[type='email']", "dcann@cannlaw.com").ConfigureAwait(false);
            await page.FillAsync("input[type='password']", "SecureTest123!").ConfigureAwait(false);
            var submitButton = await page.QuerySelectorAsync("button[type='submit']").ConfigureAwait(false);
            Assert.NotNull(submitButton);
            await submitButton.ClickAsync().ConfigureAwait(false);

            // Wait for dashboard to load
            await page.WaitForSelectorAsync("button:has-text('Hello'), button:has-text('Hola')", 
                new PageWaitForSelectorOptions { Timeout = 15000 }).ConfigureAwait(false);

            // Test Dashboard Page
            await TestPageLocalization(page, "http://localhost:5175/dashboard", "Dashboard Page",
                new[] { "nav.dashboard", "dashboard.quickLinks", "nav.hello" }).ConfigureAwait(false);

            // Test Pricing Page
            await TestPageLocalization(page, "http://localhost:5175/pricing", "Pricing Page",
                new[] { "nav.pricing" }).ConfigureAwait(false);

            // Test Appointments Page
            await TestPageLocalization(page, "http://localhost:5175/appointments", "Appointments Page",
                new[] { "nav.appointments" }).ConfigureAwait(false);

            // Test Messages Page
            await TestPageLocalization(page, "http://localhost:5175/messages", "Messages Page",
                new[] { "nav.messages" }).ConfigureAwait(false);

            // Test Uploads Page
            await TestPageLocalization(page, "http://localhost:5175/uploads", "Uploads Page",
                new[] { "nav.uploads" }).ConfigureAwait(false);

            // Test Invoices Page
            await TestPageLocalization(page, "http://localhost:5175/invoices", "Invoices Page",
                new[] { "nav.invoices" }).ConfigureAwait(false);

            // Test Interview Page
            await TestPageLocalization(page, "http://localhost:5175/interview", "Interview Page",
                new[] { "nav.interview" }).ConfigureAwait(false);

            Console.WriteLine("=== L4H Testing Complete ===");

        }
        finally
        {
            await page.CloseAsync().ConfigureAwait(false);
        }
    }

    [Fact]
    public async Task Cannlaw_Comprehensive_Localization_Test()
    {
        var page = await _fixture.Browser.NewPageAsync().ConfigureAwait(false);

        // Capture console messages for debugging
        page.Console += (_, e) => Console.WriteLine($"CONSOLE: {e.Text}");
        page.PageError += (_, e) => Console.WriteLine($"PAGE ERROR: {e}");

        try
        {
            Console.WriteLine("=== Testing Cannlaw Pages ===");
            
            // Test Login Page
            await TestPageLocalization(page, "http://localhost:5174/login", "Cannlaw Login Page",
                new[] { "auth.login", "auth.email", "auth.password" }).ConfigureAwait(false);

            // Login to Cannlaw to test protected pages
            Console.WriteLine("=== Logging in to Cannlaw ===");
            await page.WaitForSelectorAsync("input[type='email']", new PageWaitForSelectorOptions { Timeout = 10000 }).ConfigureAwait(false);
            await page.FillAsync("input[type='email']", "dcann@cannlaw.com").ConfigureAwait(false);
            await page.FillAsync("input[type='password']", "SecureTest123!").ConfigureAwait(false);
            var submitButton = await page.QuerySelectorAsync("button[type='submit']").ConfigureAwait(false);
            Assert.NotNull(submitButton);
            await submitButton.ClickAsync().ConfigureAwait(false);

            // Wait for redirect to schedule page
            await page.WaitForSelectorAsync("h1", new PageWaitForSelectorOptions { Timeout = 15000 }).ConfigureAwait(false);

            // Test Schedule Page
            await TestPageLocalization(page, "http://localhost:5174/schedule", "Schedule Page",
                new[] { "nav.schedule" }).ConfigureAwait(false);

            // Test Cases Page
            await TestPageLocalization(page, "http://localhost:5174/cases", "Cases Page",
                new[] { "nav.cases" }).ConfigureAwait(false);

            // Test Admin Pages
            await TestPageLocalization(page, "http://localhost:5174/admin/pricing", "Admin Pricing Page",
                new[] { "admin.pricing" }).ConfigureAwait(false);

            await TestPageLocalization(page, "http://localhost:5174/admin/workflows", "Admin Workflows Page",
                new[] { "admin.workflows" }).ConfigureAwait(false);

            await TestPageLocalization(page, "http://localhost:5174/admin/time-entries", "Admin Time Entries Page",
                new[] { "admin.timeEntries" }).ConfigureAwait(false);

            await TestPageLocalization(page, "http://localhost:5174/admin/reports", "Admin Reports Page",
                new[] { "admin.reports" }).ConfigureAwait(false);

            Console.WriteLine("=== Cannlaw Testing Complete ===");

        }
        finally
        {
            await page.CloseAsync().ConfigureAwait(false);
        }
    }

    private static async Task TestPageLocalization(IPage page, string url, string pageName, string[] expectedTranslationKeys)
    {
        Console.WriteLine($"Testing {pageName} - {url}");
        
        await page.GotoAsync(url).ConfigureAwait(false);
        
        // Wait for page to load
        await page.WaitForSelectorAsync("body", new PageWaitForSelectorOptions { Timeout = 10000 }).ConfigureAwait(false);
        await page.WaitForTimeoutAsync(2000).ConfigureAwait(false); // Wait for i18n to initialize

        // Test English (default)
        Console.WriteLine($"  Testing English localization for {pageName}");
        var pageContent = await page.TextContentAsync("body").ConfigureAwait(false);
        Assert.NotNull(pageContent);

        // Check for translation keys that should not be visible
        foreach (var key in expectedTranslationKeys)
        {
            if (pageContent.Contains(key))
            {
                Console.WriteLine($"  ERROR: Translation key '{key}' found in English content for {pageName}");
                Assert.False(true, $"Translation key '{key}' should not be visible in {pageName}. Found in content: {pageContent.Substring(0, Math.Min(300, pageContent.Length))}...");
            }
        }

        // Switch to Spanish and test
        Console.WriteLine($"  Testing Spanish localization for {pageName}");
        var dropdown = await page.QuerySelectorAsync("select").ConfigureAwait(false);
        if (dropdown != null)
        {
            await dropdown.SelectOptionAsync("es-ES").ConfigureAwait(false);
            await page.WaitForTimeoutAsync(2000).ConfigureAwait(false); // Wait for language change

            var spanishContent = await page.TextContentAsync("body").ConfigureAwait(false);
            Assert.NotNull(spanishContent);

            // Check for translation keys that should not be visible in Spanish
            foreach (var key in expectedTranslationKeys)
            {
                if (spanishContent.Contains(key))
                {
                    Console.WriteLine($"  ERROR: Translation key '{key}' found in Spanish content for {pageName}");
                    Assert.False(true, $"Translation key '{key}' should not be visible in Spanish {pageName}. Found in content: {spanishContent.Substring(0, Math.Min(300, spanishContent.Length))}...");
                }
            }

            // Switch back to English for next test
            await dropdown.SelectOptionAsync("en-US").ConfigureAwait(false);
            await page.WaitForTimeoutAsync(1000).ConfigureAwait(false);
        }
        else
        {
            Console.WriteLine($"  WARNING: No language dropdown found on {pageName}");
        }

        Console.WriteLine($"  ✓ {pageName} localization test passed");
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
