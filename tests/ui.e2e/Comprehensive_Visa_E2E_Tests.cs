using Microsoft.Playwright;
using Xunit;

namespace L4H.UI.E2E.Tests;

/// <summary>
/// Comprehensive E2E tests for all major visa types
/// Password: SecureTest123! (for manual testing)
/// Email format: {visatype}-test@l4h.test (e.g., o1-test@l4h.test)
/// </summary>
[Trait("Category", "E2E")]
public class Comprehensive_Visa_E2E_Tests : IClassFixture<PlaywrightFixture>
{
    private readonly PlaywrightFixture _fixture;
    private const string TEST_PASSWORD = "SecureTest123!";
    private const string BASE_URL = "http://localhost:5173";

    public Comprehensive_Visa_E2E_Tests(PlaywrightFixture fixture)
    {
        _fixture = fixture;
    }

    #region Helper Methods

    private async Task<IPage> CreateNewPage()
    {
        var page = await _fixture.Browser.NewPageAsync().ConfigureAwait(false);
        page.Console += (_, e) => Console.WriteLine($"CONSOLE [{e.Type}]: {e.Text}");
        page.PageError += (_, e) => Console.WriteLine($"PAGE ERROR: {e}");
        return page;
    }

    private static async Task RegisterUser(IPage page, string email, string firstName, string lastName)
    {
        await page.GotoAsync($"{BASE_URL}/register").ConfigureAwait(false);
        await page.WaitForSelectorAsync("input[name='email']", new PageWaitForSelectorOptions { Timeout = 10000 }).ConfigureAwait(false);

        await page.FillAsync("input[name='email']", email).ConfigureAwait(false);
        await page.FillAsync("input[name='password']", TEST_PASSWORD).ConfigureAwait(false);
        await page.FillAsync("input[name='confirmPassword']", TEST_PASSWORD).ConfigureAwait(false);
        await page.FillAsync("input[name='firstName']", firstName).ConfigureAwait(false);
        await page.FillAsync("input[name='lastName']", lastName).ConfigureAwait(false);

        await page.ClickAsync("button[type='submit']").ConfigureAwait(false);
        await page.WaitForURLAsync("**/profile-completion", new PageWaitForURLOptions { Timeout = 30000 }).ConfigureAwait(false);
    }

    private static async Task CompleteProfile(IPage page, string country, string nationality, string dateOfBirth, string maritalStatus = "Single", string gender = "Male")
    {
        // Fill street address
        await page.FillAsync("input[name='streetAddress']", "123 Test Street").ConfigureAwait(false);

        // Fill city
        await page.FillAsync("input[name='city']", "Test City").ConfigureAwait(false);

        // Fill postal code
        await page.FillAsync("input[name='postalCode']", "12345").ConfigureAwait(false);

        // Select country (SearchableSelect) - open dropdown and click option directly
        var countryInput = page.Locator("input[placeholder*='Search and select your country']");
        var countryCount = await countryInput.CountAsync().ConfigureAwait(false);
        if (countryCount > 0)
        {
            // Click to open dropdown
            await countryInput.ClickAsync().ConfigureAwait(false);
            await page.WaitForTimeoutAsync(1000).ConfigureAwait(false);

            // Click the country from the dropdown list
            await page.Locator($"li button:has-text('{country}')").First.ClickAsync().ConfigureAwait(false);
            await page.WaitForTimeoutAsync(1000).ConfigureAwait(false);
        }

        // If country is US, select a state
        if (country == "United States" || country == "US")
        {
            await page.WaitForTimeoutAsync(1000).ConfigureAwait(false);
            var stateSelect = await page.QuerySelectorAsync("select[name='stateProvince']").ConfigureAwait(false);
            if (stateSelect != null)
            {
                await page.SelectOptionAsync("select[name='stateProvince']", "CA").ConfigureAwait(false);
                await page.WaitForTimeoutAsync(500).ConfigureAwait(false);
            }
        }

        // Select nationality (SearchableSelect) - open dropdown and click option directly
        var nationalityInput = page.Locator("input[placeholder*='Search and select your passport country']");
        var nationalityCount = await nationalityInput.CountAsync().ConfigureAwait(false);
        if (nationalityCount > 0)
        {
            // Click to open dropdown
            await nationalityInput.ClickAsync().ConfigureAwait(false);
            await page.WaitForTimeoutAsync(1000).ConfigureAwait(false);

            // Click the nationality from the dropdown list
            await page.Locator($"li button:has-text('{nationality}')").First.ClickAsync().ConfigureAwait(false);
            await page.WaitForTimeoutAsync(1000).ConfigureAwait(false);
        }

        // Fill date of birth
        await page.FillAsync("input[name='dateOfBirth']", dateOfBirth).ConfigureAwait(false);

        // Select marital status
        await page.SelectOptionAsync("select[name='maritalStatus']", maritalStatus).ConfigureAwait(false);

        // Select gender
        await page.SelectOptionAsync("select[name='gender']", gender).ConfigureAwait(false);

        await page.WaitForTimeoutAsync(1000).ConfigureAwait(false);

        // Wait for the submit button to become enabled (indicating both country and nationality are selected)
        await page.WaitForSelectorAsync("button[type='submit']:not([disabled])", new() { Timeout = 10000 }).ConfigureAwait(false);

        await page.ClickAsync("button[type='submit']").ConfigureAwait(false);
        await page.WaitForTimeoutAsync(5000).ConfigureAwait(false);
    }

    private static async Task<string> CompleteInterviewForVisa(IPage page, Dictionary<string, string> answers)
    {
        var maxQuestions = 15;
        var questionCount = 0;

        while (questionCount < maxQuestions)
        {
            questionCount++;

            // Check if interview is complete
            var isComplete = await page.EvaluateAsync<bool>(@"() => {
                return document.body.textContent.includes('Interview Complete') ||
                       document.body.textContent.includes('Congratulations');
            }").ConfigureAwait(false);

            if (isComplete)
            {
                break;
            }

            await page.WaitForTimeoutAsync(2000).ConfigureAwait(false);

            // Try to answer the current question
            foreach (var kvp in answers)
            {
                var questionKey = kvp.Key;
                var answerValue = kvp.Value;

                // Try select element
                var selectExists = await page.EvaluateAsync<bool>($@"() => {{
                    return !!document.querySelector('select[data-question-key=""{questionKey}""]');
                }}").ConfigureAwait(false);

                if (selectExists)
                {
                    await page.SelectOptionAsync($"select[data-question-key=\"{questionKey}\"]", answerValue).ConfigureAwait(false);
                    await page.WaitForTimeoutAsync(1000).ConfigureAwait(false);
                    break;
                }

                // Try radio button
                var radioExists = await page.EvaluateAsync<bool>($@"() => {{
                    return !!document.querySelector('input[name=""{questionKey}""]');
                }}").ConfigureAwait(false);

                if (radioExists)
                {
                    await page.ClickAsync($"input[name=\"{questionKey}\"][value=\"{answerValue}\"]").ConfigureAwait(false);
                    await page.WaitForTimeoutAsync(1000).ConfigureAwait(false);
                    break;
                }
            }

            // Click Next button
            var nextClicked = await page.EvaluateAsync<bool>(@"() => {
                const buttons = Array.from(document.querySelectorAll('button'));
                const nextButton = buttons.find(btn =>
                    btn.textContent.includes('Next') ||
                    btn.textContent.includes('next')
                );
                if (nextButton && !nextButton.disabled) {
                    nextButton.click();
                    return true;
                }
                return false;
            }").ConfigureAwait(false);

            if (!nextClicked)
            {
                break;
            }

            await page.WaitForTimeoutAsync(3000).ConfigureAwait(false);
        }

        // Get the recommended visa type
        var recommendedVisa = await page.EvaluateAsync<string>(@"() => {
            const body = document.body.textContent;
            const match = body.match(/([A-Z]-?\d+[A-Z]?)\s+(visa|Visa)/i);
            return match ? match[1] : 'Unknown';
        }").ConfigureAwait(false);

        return recommendedVisa;
    }

    #endregion

    #region Employment-Based Visa Tests

    [Fact]
    public async Task O1_Visa_Extraordinary_Ability_Test()
    {
        var page = await CreateNewPage().ConfigureAwait(false);
        try
        {
            var email = $"o1-test-{Guid.NewGuid().ToString().Substring(0, 8)}@l4h.test";

            await RegisterUser(page, email, "Alexander", "Einstein").ConfigureAwait(false);
            await CompleteProfile(page, "United States", "United States", "1985-06-15", "Single", "Male").ConfigureAwait(false);

            var answers = new Dictionary<string, string>
            {
                ["purpose"] = "employment",
                ["employerSponsor"] = "yes",
                ["extraordinaryAbility"] = "yes",
                ["educationLevel"] = "phd"
            };

            var result = await CompleteInterviewForVisa(page, answers).ConfigureAwait(false);

            Assert.Contains("O-1", result, StringComparison.OrdinalIgnoreCase);
        }
        finally
        {
            await page.CloseAsync().ConfigureAwait(false);
        }
    }

    [Fact]
    public async Task H1B_Visa_Specialty_Occupation_Test()
    {
        var page = await CreateNewPage().ConfigureAwait(false);
        try
        {
            var email = $"h1b-test-{Guid.NewGuid().ToString().Substring(0, 8)}@l4h.test";

            await RegisterUser(page, email, "Priya", "Sharma").ConfigureAwait(false);
            await CompleteProfile(page, "India", "India", "1990-03-20", "Married", "Female").ConfigureAwait(false);

            var answers = new Dictionary<string, string>
            {
                ["purpose"] = "employment",
                ["employerSponsor"] = "yes",
                ["extraordinaryAbility"] = "no",
                ["educationLevel"] = "bachelors",
                ["specialtyOccupation"] = "yes"
            };

            var result = await CompleteInterviewForVisa(page, answers).ConfigureAwait(false);

            Assert.Contains("H-1B", result, StringComparison.OrdinalIgnoreCase);
        }
        finally
        {
            await page.CloseAsync().ConfigureAwait(false);
        }
    }

    [Fact]
    public async Task L1_Visa_Intracompany_Transfer_Test()
    {
        var page = await CreateNewPage().ConfigureAwait(false);
        try
        {
            var email = $"l1-test-{Guid.NewGuid().ToString().Substring(0, 8)}@l4h.test";

            await RegisterUser(page, email, "Hiroshi", "Tanaka").ConfigureAwait(false);
            await CompleteProfile(page, "Japan", "Japan", "1982-11-05", "Married", "Male").ConfigureAwait(false);

            var answers = new Dictionary<string, string>
            {
                ["purpose"] = "employment",
                ["employerSponsor"] = "yes",
                ["sameCompany"] = "yes",
                ["workedAbroad"] = "yes",
                ["managerialRole"] = "yes"
            };

            var result = await CompleteInterviewForVisa(page, answers).ConfigureAwait(false);

            Assert.Contains("L-1", result, StringComparison.OrdinalIgnoreCase);
        }
        finally
        {
            await page.CloseAsync().ConfigureAwait(false);
        }
    }

    #endregion

    #region Tourist/Business Visa Tests

    [Fact]
    public async Task B2_Visa_Tourist_Test()
    {
        var page = await CreateNewPage().ConfigureAwait(false);
        try
        {
            var email = $"b2-test-{Guid.NewGuid().ToString().Substring(0, 8)}@l4h.test";

            await RegisterUser(page, email, "Sophie", "Dubois").ConfigureAwait(false);
            await CompleteProfile(page, "France", "France", "1995-07-12", "Single", "Female").ConfigureAwait(false);

            var answers = new Dictionary<string, string>
            {
                ["purpose"] = "tourism",
                ["tripDuration"] = "short",
                ["returnIntent"] = "yes"
            };

            var result = await CompleteInterviewForVisa(page, answers).ConfigureAwait(false);

            Assert.Contains("B-2", result, StringComparison.OrdinalIgnoreCase);
        }
        finally
        {
            await page.CloseAsync().ConfigureAwait(false);
        }
    }

    [Fact]
    public async Task B1_Visa_Business_Test()
    {
        var page = await CreateNewPage().ConfigureAwait(false);
        try
        {
            var email = $"b1-test-{Guid.NewGuid().ToString().Substring(0, 8)}@l4h.test";

            await RegisterUser(page, email, "Chen", "Wei").ConfigureAwait(false);
            await CompleteProfile(page, "China", "China", "1980-02-28", "Married", "Male").ConfigureAwait(false);

            var answers = new Dictionary<string, string>
            {
                ["purpose"] = "business",
                ["treatyCountry"] = "no"
            };

            var result = await CompleteInterviewForVisa(page, answers).ConfigureAwait(false);

            Assert.Contains("B-1", result, StringComparison.OrdinalIgnoreCase);
        }
        finally
        {
            await page.CloseAsync().ConfigureAwait(false);
        }
    }

    #endregion

    #region Student Visa Tests

    [Fact]
    public async Task F1_Visa_Student_Test()
    {
        var page = await CreateNewPage().ConfigureAwait(false);
        try
        {
            var email = $"f1-test-{Guid.NewGuid().ToString().Substring(0, 8)}@l4h.test";

            await RegisterUser(page, email, "Maria", "Garcia").ConfigureAwait(false);
            await CompleteProfile(page, "Mexico", "Mexico", "2001-09-18", "Single", "Female").ConfigureAwait(false);

            var answers = new Dictionary<string, string>
            {
                ["purpose"] = "study",
                ["isStudent"] = "yes",
                ["studyLevel"] = "academic"
            };

            var result = await CompleteInterviewForVisa(page, answers).ConfigureAwait(false);

            Assert.Contains("F-1", result, StringComparison.OrdinalIgnoreCase);
        }
        finally
        {
            await page.CloseAsync().ConfigureAwait(false);
        }
    }

    #endregion

    #region Diplomatic/Government Visa Tests

    [Fact]
    public async Task A1_Visa_Diplomatic_Test()
    {
        var page = await CreateNewPage().ConfigureAwait(false);
        try
        {
            var email = $"a1-test-{Guid.NewGuid().ToString().Substring(0, 8)}@l4h.test";

            await RegisterUser(page, email, "Ambassador", "Smith").ConfigureAwait(false);
            await CompleteProfile(page, "Japan", "Japan", "1970-04-10", "Married", "Male").ConfigureAwait(false);

            var answers = new Dictionary<string, string>
            {
                ["purpose"] = "diplomatic",
                ["diplomat"] = "yes",
                ["governmentOfficial"] = "yes",
                ["internationalOrg"] = "no"
            };

            var result = await CompleteInterviewForVisa(page, answers).ConfigureAwait(false);

            Assert.Contains("A-1", result, StringComparison.OrdinalIgnoreCase);
        }
        finally
        {
            await page.CloseAsync().ConfigureAwait(false);
        }
    }

    #endregion

    #region Family-Based Visa Tests

    [Fact]
    public async Task K1_Visa_Fiance_Test()
    {
        var page = await CreateNewPage().ConfigureAwait(false);
        try
        {
            var email = $"k1-test-{Guid.NewGuid().ToString().Substring(0, 8)}@l4h.test";

            await RegisterUser(page, email, "Anna", "Ivanova").ConfigureAwait(false);
            await CompleteProfile(page, "Russia", "Russia", "1992-12-03", "Single", "Female").ConfigureAwait(false);

            var answers = new Dictionary<string, string>
            {
                ["purpose"] = "family",
                ["familyRelationship"] = "fiance",
                ["usFamilyStatus"] = "citizen"
            };

            var result = await CompleteInterviewForVisa(page, answers).ConfigureAwait(false);

            Assert.Contains("K-1", result, StringComparison.OrdinalIgnoreCase);
        }
        finally
        {
            await page.CloseAsync().ConfigureAwait(false);
        }
    }

    #endregion

    #region Investment Visa Tests

    [Fact]
    public async Task EB5_Visa_Investor_Test()
    {
        var page = await CreateNewPage().ConfigureAwait(false);
        try
        {
            var email = $"eb5-test-{Guid.NewGuid().ToString().Substring(0, 8)}@l4h.test";

            await RegisterUser(page, email, "Mohammed", "Al-Saud").ConfigureAwait(false);
            await CompleteProfile(page, "Saudi Arabia", "Saudi Arabia", "1975-08-22", "Married", "Male").ConfigureAwait(false);

            var answers = new Dictionary<string, string>
            {
                ["purpose"] = "investment",
                ["isInvestor"] = "yes",
                ["investmentAmount"] = "1000000"
            };

            var result = await CompleteInterviewForVisa(page, answers).ConfigureAwait(false);

            Assert.Contains("EB-5", result, StringComparison.OrdinalIgnoreCase);
        }
        finally
        {
            await page.CloseAsync().ConfigureAwait(false);
        }
    }

    #endregion

    #region Country-Specific Visa Tests

    [Fact]
    public async Task E1_Visa_Treaty_Trader_Test()
    {
        var page = await CreateNewPage().ConfigureAwait(false);
        try
        {
            var email = $"e1-test-{Guid.NewGuid().ToString().Substring(0, 8)}@l4h.test";

            await RegisterUser(page, email, "Akira", "Yamamoto").ConfigureAwait(false);
            await CompleteProfile(page, "Japan", "Japan", "1978-05-15", "Married", "Male").ConfigureAwait(false);

            var answers = new Dictionary<string, string>
            {
                ["purpose"] = "business",
                ["treatyCountry"] = "yes",
                ["tradeActivity"] = "yes",
                ["investment"] = "no"
            };

            var result = await CompleteInterviewForVisa(page, answers).ConfigureAwait(false);

            Assert.Contains("E-1", result, StringComparison.OrdinalIgnoreCase);
        }
        finally
        {
            await page.CloseAsync().ConfigureAwait(false);
        }
    }

    [Fact]
    public async Task E2_Visa_Treaty_Investor_Test()
    {
        var page = await CreateNewPage().ConfigureAwait(false);
        try
        {
            var email = $"e2-test-{Guid.NewGuid().ToString().Substring(0, 8)}@l4h.test";

            await RegisterUser(page, email, "Klaus", "Schmidt").ConfigureAwait(false);
            await CompleteProfile(page, "Germany", "Germany", "1973-09-22", "Married", "Male").ConfigureAwait(false);

            var answers = new Dictionary<string, string>
            {
                ["purpose"] = "business",
                ["treatyCountry"] = "yes",
                ["investment"] = "yes",
                ["tradeActivity"] = "no"
            };

            var result = await CompleteInterviewForVisa(page, answers).ConfigureAwait(false);

            Assert.Contains("E-2", result, StringComparison.OrdinalIgnoreCase);
        }
        finally
        {
            await page.CloseAsync().ConfigureAwait(false);
        }
    }

    [Fact]
    public async Task E3_Visa_Australian_Specialty_Occupation_Test()
    {
        var page = await CreateNewPage().ConfigureAwait(false);
        try
        {
            var email = $"e3-test-{Guid.NewGuid().ToString().Substring(0, 8)}@l4h.test";

            await RegisterUser(page, email, "Jack", "Thompson").ConfigureAwait(false);
            await CompleteProfile(page, "Australia", "Australia", "1988-03-10", "Single", "Male").ConfigureAwait(false);

            var answers = new Dictionary<string, string>
            {
                ["purpose"] = "employment",
                ["australian"] = "yes",
                ["specialtyOccupation"] = "yes",
                ["educationLevel"] = "bachelors",
                ["employerSponsor"] = "yes"
            };

            var result = await CompleteInterviewForVisa(page, answers).ConfigureAwait(false);

            Assert.Contains("E-3", result, StringComparison.OrdinalIgnoreCase);
        }
        finally
        {
            await page.CloseAsync().ConfigureAwait(false);
        }
    }

    [Fact]
    public async Task TN_Visa_NAFTA_Professional_Canadian_Test()
    {
        var page = await CreateNewPage().ConfigureAwait(false);
        try
        {
            var email = $"tn-canadian-test-{Guid.NewGuid().ToString().Substring(0, 8)}@l4h.test";

            await RegisterUser(page, email, "Emily", "McDonald").ConfigureAwait(false);
            await CompleteProfile(page, "Canada", "Canada", "1987-11-30", "Single", "Female").ConfigureAwait(false);

            var answers = new Dictionary<string, string>
            {
                ["purpose"] = "employment",
                ["naftaCountry"] = "yes",
                ["professionalOccupation"] = "yes",
                ["educationLevel"] = "bachelors",
                ["jobOffer"] = "yes"
            };

            var result = await CompleteInterviewForVisa(page, answers).ConfigureAwait(false);

            Assert.Contains("TN", result, StringComparison.OrdinalIgnoreCase);
        }
        finally
        {
            await page.CloseAsync().ConfigureAwait(false);
        }
    }

    [Fact]
    public async Task TN_Visa_NAFTA_Professional_Mexican_Test()
    {
        var page = await CreateNewPage().ConfigureAwait(false);
        try
        {
            var email = $"tn-mexican-test-{Guid.NewGuid().ToString().Substring(0, 8)}@l4h.test";

            await RegisterUser(page, email, "Carlos", "Rodriguez").ConfigureAwait(false);
            await CompleteProfile(page, "Mexico", "Mexico", "1985-07-18", "Married", "Male").ConfigureAwait(false);

            var answers = new Dictionary<string, string>
            {
                ["purpose"] = "employment",
                ["naftaCountry"] = "yes",
                ["professionalOccupation"] = "yes",
                ["educationLevel"] = "bachelors",
                ["jobOffer"] = "yes"
            };

            var result = await CompleteInterviewForVisa(page, answers).ConfigureAwait(false);

            Assert.Contains("TN", result, StringComparison.OrdinalIgnoreCase);
        }
        finally
        {
            await page.CloseAsync().ConfigureAwait(false);
        }
    }

    #endregion

    #region Marital Status-Specific Visa Tests

    [Fact]
    public async Task K3_Visa_Spouse_Test()
    {
        var page = await CreateNewPage().ConfigureAwait(false);
        try
        {
            var email = $"k3-test-{Guid.NewGuid().ToString().Substring(0, 8)}@l4h.test";

            await RegisterUser(page, email, "Svetlana", "Petrov").ConfigureAwait(false);
            await CompleteProfile(page, "Russia", "Russia", "1990-08-25", "Married", "Female").ConfigureAwait(false);

            var answers = new Dictionary<string, string>
            {
                ["purpose"] = "family",
                ["familyRelation"] = "spouse",
                ["usCitizenSponsor"] = "yes",
                ["marriedToUsCitizen"] = "yes",
                ["pendingPetition"] = "yes"
            };

            var result = await CompleteInterviewForVisa(page, answers).ConfigureAwait(false);

            Assert.Contains("K-3", result, StringComparison.OrdinalIgnoreCase);
        }
        finally
        {
            await page.CloseAsync().ConfigureAwait(false);
        }
    }

    #endregion
}
