using Microsoft.Playwright;
using Xunit;
using System.Threading.Tasks;

namespace L4H.UI.E2E.Tests;

[Trait("Category", "E2E")]
public class O1_Visa_E2E_Test : IClassFixture<PlaywrightFixture>
{
    private readonly PlaywrightFixture _fixture;

    public O1_Visa_E2E_Test(PlaywrightFixture fixture)
    {
        _fixture = fixture;
    }

    [Fact]
    public async Task O1_Visa_Full_Workflow_Test()
    {
        var page = await _fixture.Browser.NewPageAsync().ConfigureAwait(false);
        page.Console += (_, e) => Console.WriteLine($"CONSOLE: {e.Text}");
        page.PageError += (_, e) => Console.WriteLine($"PAGE ERROR: {e}");

        try
        {
            // 1. Navigate to registration page and create a new user
            var randomEmail = $"testuser_{System.Guid.NewGuid()}@example.com";
            await page.GotoAsync("http://localhost:5173/register").ConfigureAwait(false);
            await page.FillAsync("input[name='firstName']", "Test").ConfigureAwait(false);
            await page.FillAsync("input[name='lastName']", "User").ConfigureAwait(false);
            await page.FillAsync("input[name='email']", randomEmail).ConfigureAwait(false);
            await page.FillAsync("input[name='password']", "SecureTest123!").ConfigureAwait(false);
            await page.FillAsync("input[name='confirmPassword']", "SecureTest123!").ConfigureAwait(false);
            await page.ClickAsync("button[type='submit']").ConfigureAwait(false);

            // Wait for navigation to profile completion page
            try
            {
                await page.WaitForURLAsync("**/profile-completion", new PageWaitForURLOptions { Timeout = 60000 }).ConfigureAwait(false);
            }
            catch (System.TimeoutException)
            {
                await page.ScreenshotAsync(new PageScreenshotOptions { Path = "e2e-user-creation-error.png" }).ConfigureAwait(false);
                throw;
            }
            await page.FillAsync("input[name='streetAddress']", "123 Main St").ConfigureAwait(false);
            await page.FillAsync("input[name='city']", "Anytown").ConfigureAwait(false);
            await page.FillAsync("input[name='postalCode']", "12345").ConfigureAwait(false);
            await page.SelectOptionAsync("select[name='country']", "US").ConfigureAwait(false);
            await page.SelectOptionAsync("select[name='stateProvince']", "CA").ConfigureAwait(false);
            await page.SelectOptionAsync("select[name='nationality']", "US").ConfigureAwait(false);
            await page.FillAsync("input[name='dateOfBirth']", "1990-01-01").ConfigureAwait(false);
            await page.SelectOptionAsync("select[name='maritalStatus']", "Single").ConfigureAwait(false);
            await page.SelectOptionAsync("select[name='gender']", "Male").ConfigureAwait(false);
            await page.ClickAsync("button[type='submit']").ConfigureAwait(false);

            // 4. Start the interview
            await page.WaitForURLAsync("**/interview**").ConfigureAwait(false);

            // 5. Answer the interview questions for an O-1 visa
            // Question 1: Purpose
            await page.SelectOptionAsync("select", new SelectOptionValue { Value = "employment" }).ConfigureAwait(false);
            await page.ClickAsync("button:has-text('Next')").ConfigureAwait(false);

            // Question 2: Employer Sponsor
            await page.ClickAsync("input[value='yes']").ConfigureAwait(false);
            await page.ClickAsync("button:has-text('Next')").ConfigureAwait(false);

            // Question 3: Extraordinary Ability
            await page.ClickAsync("input[value='yes']").ConfigureAwait(false);
            await page.ClickAsync("button:has-text('Next')").ConfigureAwait(false);

            // 6. Complete the interview
            await page.ClickAsync("button:has-text('Complete Interview')").ConfigureAwait(false);

            // 7. Navigate to the dashboard and verify the visa assignment
            await page.WaitForURLAsync("**/dashboard").ConfigureAwait(false);

            var visaTypeName = await page.TextContentAsync(".visa-type-name-selector").ConfigureAwait(false);
            Assert.Equal("O-1", visaTypeName);
        }
        finally
        {
            await page.CloseAsync().ConfigureAwait(false);
        }
    }
}