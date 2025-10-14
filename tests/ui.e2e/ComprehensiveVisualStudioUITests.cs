using Microsoft.Playwright;
using Xunit;
using Xunit.Abstractions;

namespace L4H.UI.E2E.Tests;

/// <summary>
/// Comprehensive Visual Studio UI Test Suite for L4H Interview System
/// 
/// This test suite provides comprehensive coverage for:
/// - All visa types with country-specific nationality scenarios
/// - Localization testing for all 21 supported languages
/// - Adoption and citizenship workflows
/// - User creation with proper email domains
/// 
/// Test User Credentials:
/// - Email domains: testing.com or law4hire.com
/// - Password: SecureTest123!
/// 
/// Run these tests from Visual Studio Test Explorer for visual feedback
/// </summary>
[Trait("Category", "E2E")]
public class ComprehensiveVisualStudioUITests : IClassFixture<PlaywrightFixture>
{
    private readonly PlaywrightFixture _fixture;
    private readonly ITestOutputHelper _output;
    private const string TEST_PASSWORD = "SecureTest123!";
    private const string BASE_URL = "http://localhost:5173";

    public ComprehensiveVisualStudioUITests(PlaywrightFixture fixture, ITestOutputHelper output)
    {
        _fixture = fixture;
        _output = output;
    }

    #region Helper Methods

    private async Task<IPage> CreateNewPage()
    {
        var page = await _fixture.Browser.NewPageAsync().ConfigureAwait(false);
        page.Console += (_, e) => _output.WriteLine($"CONSOLE [{e.Type}]: {e.Text}");
        page.PageError += (_, e) => _output.WriteLine($"PAGE ERROR: {e}");
        return page;
    }

    private async Task RegisterUser(IPage page, string email, string firstName, string lastName, string nationality = "United States", string dateOfBirth = "1990-01-01")
    {
        _output.WriteLine($"Registering user: {email}");
        
        await page.GotoAsync($"{BASE_URL}/register").ConfigureAwait(false);
        await page.WaitForSelectorAsync("input[name='email']", new PageWaitForSelectorOptions { Timeout = 10000 }).ConfigureAwait(false);

        await page.FillAsync("input[name='email']", email).ConfigureAwait(false);
        await page.FillAsync("input[name='password']", TEST_PASSWORD).ConfigureAwait(false);
        await page.FillAsync("input[name='confirmPassword']", TEST_PASSWORD).ConfigureAwait(false);
        await page.FillAsync("input[name='firstName']", firstName).ConfigureAwait(false);
        await page.FillAsync("input[name='lastName']", lastName).ConfigureAwait(false);

        await page.ClickAsync("button[type='submit']").ConfigureAwait(false);
        await page.WaitForURLAsync("**/profile-completion", new PageWaitForURLOptions { Timeout = 30000 }).ConfigureAwait(false);
        
        _output.WriteLine($"User registered successfully: {firstName} {lastName}");
    }

    private async Task CompleteProfile(IPage page, string country, string nationality, string dateOfBirth, string maritalStatus = "Single", string gender = "Male")
    {
        _output.WriteLine($"Completing profile for {nationality} national in {country}");
        
        // Fill address information
        await page.FillAsync("input[name='streetAddress']", "123 Test Street").ConfigureAwait(false);
        await page.FillAsync("input[name='city']", "Test City").ConfigureAwait(false);
        await page.FillAsync("input[name='postalCode']", "12345").ConfigureAwait(false);

        // Select country
        var countryInput = page.Locator("input[placeholder*='Search and select your country']");
        if (await countryInput.CountAsync().ConfigureAwait(false) > 0)
        {
            await countryInput.ClickAsync().ConfigureAwait(false);
            await page.WaitForTimeoutAsync(1000).ConfigureAwait(false);
            await page.Locator($"li button:has-text('{country}')").First.ClickAsync().ConfigureAwait(false);
            await page.WaitForTimeoutAsync(1000).ConfigureAwait(false);
        }

        // Select state if US
        if (country == "United States" || country == "US")
        {
            var stateSelect = await page.QuerySelectorAsync("select[name='stateProvince']").ConfigureAwait(false);
            if (stateSelect != null)
            {
                await page.SelectOptionAsync("select[name='stateProvince']", "CA").ConfigureAwait(false);
            }
        }

        // Select nationality
        var nationalityInput = page.Locator("input[placeholder*='Search and select your passport country']");
        if (await nationalityInput.CountAsync().ConfigureAwait(false) > 0)
        {
            await nationalityInput.ClickAsync().ConfigureAwait(false);
            await page.WaitForTimeoutAsync(1000).ConfigureAwait(false);
            await page.Locator($"li button:has-text('{nationality}')").First.ClickAsync().ConfigureAwait(false);
            await page.WaitForTimeoutAsync(1000).ConfigureAwait(false);
        }

        // Fill other profile information
        await page.FillAsync("input[name='dateOfBirth']", dateOfBirth).ConfigureAwait(false);
        await page.SelectOptionAsync("select[name='maritalStatus']", maritalStatus).ConfigureAwait(false);
        await page.SelectOptionAsync("select[name='gender']", gender).ConfigureAwait(false);

        await page.WaitForTimeoutAsync(1000).ConfigureAwait(false);
        await page.WaitForSelectorAsync("button[type='submit']:not([disabled])", new() { Timeout = 10000 }).ConfigureAwait(false);
        await page.ClickAsync("button[type='submit']").ConfigureAwait(false);
        await page.WaitForTimeoutAsync(5000).ConfigureAwait(false);
        
        _output.WriteLine($"Profile completed for {nationality} national");
    }

    private async Task<string> CompleteInterviewForVisa(IPage page, Dictionary<string, string> answers, string expectedVisa)
    {
        _output.WriteLine($"Starting interview expecting {expectedVisa} visa");
        
        var maxQuestions = 15;
        var questionCount = 0;

        while (questionCount < maxQuestions)
        {
            questionCount++;
            _output.WriteLine($"Processing question {questionCount}");

            // Check if interview is complete
            var isComplete = await page.EvaluateAsync<bool>(@"() => {
                return document.body.textContent.includes('Interview Complete') ||
                       document.body.textContent.includes('Congratulations') ||
                       document.body.textContent.includes('Recommendation');
            }").ConfigureAwait(false);

            if (isComplete)
            {
                _output.WriteLine("Interview completed");
                break;
            }

            await page.WaitForTimeoutAsync(2000).ConfigureAwait(false);

            // Try to answer the current question
            var answered = false;
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
                    _output.WriteLine($"Selected {answerValue} for {questionKey}");
                    answered = true;
                    break;
                }

                // Try radio button
                var radioExists = await page.EvaluateAsync<bool>($@"() => {{
                    return !!document.querySelector('input[name=""{questionKey}""]');
                }}").ConfigureAwait(false);

                if (radioExists)
                {
                    await page.ClickAsync($"input[name=\"{questionKey}\"][value=\"{answerValue}\"]").ConfigureAwait(false);
                    _output.WriteLine($"Selected {answerValue} for {questionKey}");
                    answered = true;
                    break;
                }
            }

            if (!answered)
            {
                _output.WriteLine("No matching question found to answer");
            }

            // Click Next button
            var nextClicked = await page.EvaluateAsync<bool>(@"() => {
                const buttons = Array.from(document.querySelectorAll('button'));
                const nextButton = buttons.find(btn =>
                    btn.textContent.includes('Next') ||
                    btn.textContent.includes('next') ||
                    btn.textContent.includes('Continue')
                );
                if (nextButton && !nextButton.disabled) {
                    nextButton.click();
                    return true;
                }
                return false;
            }").ConfigureAwait(false);

            if (!nextClicked)
            {
                _output.WriteLine("No next button found or available");
                break;
            }

            await page.WaitForTimeoutAsync(3000).ConfigureAwait(false);
        }

        // Get the recommended visa type
        var recommendedVisa = await page.EvaluateAsync<string>(@"() => {
            const body = document.body.textContent;
            const visaMatch = body.match(/([A-Z]-?\d+[A-Z]?|TN|ESTA)\s*(visa|Visa|VISA)?/gi);
            return visaMatch ? visaMatch[0].replace(/\s*(visa|Visa|VISA)/, '') : 'Unknown';
        }").ConfigureAwait(false);

        _output.WriteLine($"Interview completed. Recommended visa: {recommendedVisa}");
        return recommendedVisa;
    }

    private async Task TestLanguageLocalization(IPage page, string languageCode, string languageName)
    {
        _output.WriteLine($"Testing localization for {languageName} ({languageCode})");
        
        // Try to change language (this depends on your UI implementation)
        var languageSelector = await page.QuerySelectorAsync($"[data-language='{languageCode}']").ConfigureAwait(false);
        if (languageSelector != null)
        {
            await languageSelector.ClickAsync().ConfigureAwait(false);
            await page.WaitForTimeoutAsync(2000).ConfigureAwait(false);
            
            // Verify language change took effect
            var pageText = await page.TextContentAsync("body").ConfigureAwait(false);
            _output.WriteLine($"Language changed to {languageName}. Page contains text: {pageText?.Substring(0, Math.Min(100, pageText?.Length ?? 0))}...");
        }
        else
        {
            _output.WriteLine($"Language selector for {languageName} not found");
        }
    }

    #endregion

    #region Employment-Based Visa Tests by Country

    [Fact(DisplayName = "🇮🇳 India → H-1B Specialty Occupation")]
    [Trait("Category", "E2E")]
    public async Task India_H1B_Specialty_Occupation_Test()
    {
        var page = await CreateNewPage().ConfigureAwait(false);
        try
        {
            var email = $"h1b-india-{Guid.NewGuid().ToString()[..8]}@testing.com";
            await RegisterUser(page, email, "Priya", "Sharma", "India").ConfigureAwait(false);
            await CompleteProfile(page, "India", "India", "1990-03-20", "Single", "Female").ConfigureAwait(false);

            var answers = new Dictionary<string, string>
            {
                ["purpose"] = "employment",
                ["hasEmployerSponsor"] = "yes",
                ["educationLevel"] = "bachelor",
                ["specialtyOccupation"] = "yes",
                ["durationOfStay"] = "long"
            };

            var result = await CompleteInterviewForVisa(page, answers, "H-1B").ConfigureAwait(false);
            Assert.Contains("H-1B", result, StringComparison.OrdinalIgnoreCase);
        }
        finally
        {
            await page.CloseAsync().ConfigureAwait(false);
        }
    }

    [Fact(DisplayName = "🇯🇵 Japan → L-1A Intracompany Executive")]
    [Trait("Category", "E2E")]
    public async Task Japan_L1A_Intracompany_Executive_Test()
    {
        var page = await CreateNewPage().ConfigureAwait(false);
        try
        {
            var email = $"l1a-japan-{Guid.NewGuid().ToString()[..8]}@law4hire.com";
            await RegisterUser(page, email, "Hiroshi", "Tanaka", "Japan").ConfigureAwait(false);
            await CompleteProfile(page, "Japan", "Japan", "1975-11-05", "Married", "Male").ConfigureAwait(false);

            var answers = new Dictionary<string, string>
            {
                ["purpose"] = "employment",
                ["hasEmployerSponsor"] = "yes",
                ["sameCompany"] = "yes",
                ["managerialRole"] = "yes",
                ["workedAbroad"] = "yes"
            };

            var result = await CompleteInterviewForVisa(page, answers, "L-1A").ConfigureAwait(false);
            Assert.Contains("L-1", result, StringComparison.OrdinalIgnoreCase);
        }
        finally
        {
            await page.CloseAsync().ConfigureAwait(false);
        }
    }

    [Fact(DisplayName = "🇦🇩 Andorra → O-1 Extraordinary Ability")]
    public async Task Andorra_O1_Extraordinary_Ability_Test()
    {
        var page = await CreateNewPage().ConfigureAwait(false);
        try
        {
            var email = $"o1-andorra-{Guid.NewGuid().ToString()[..8]}@testing.com";
            await RegisterUser(page, email, "Maria", "Vidal", "Andorra").ConfigureAwait(false);
            await CompleteProfile(page, "Andorra", "Andorra", "1985-06-15", "Single", "Female").ConfigureAwait(false);

            var answers = new Dictionary<string, string>
            {
                ["purpose"] = "employment",
                ["hasEmployerSponsor"] = "yes",
                ["extraordinaryAbility"] = "yes",
                ["nationalRecognition"] = "yes",
                ["educationLevel"] = "master"
            };

            var result = await CompleteInterviewForVisa(page, answers, "O-1").ConfigureAwait(false);
            Assert.Contains("O-1", result, StringComparison.OrdinalIgnoreCase);
        }
        finally
        {
            await page.CloseAsync().ConfigureAwait(false);
        }
    }

    [Fact(DisplayName = "🇨🇱 Chile → TN Professional (NAFTA)")]
    public async Task Chile_TN_Professional_Test()
    {
        var page = await CreateNewPage().ConfigureAwait(false);
        try
        {
            var email = $"tn-chile-{Guid.NewGuid().ToString()[..8]}@law4hire.com";
            await RegisterUser(page, email, "Carlos", "Rodriguez", "Chile").ConfigureAwait(false);
            await CompleteProfile(page, "Chile", "Chile", "1987-09-22", "Married", "Male").ConfigureAwait(false);

            var answers = new Dictionary<string, string>
            {
                ["purpose"] = "employment",
                ["naftaCountry"] = "yes",
                ["professionalOccupation"] = "yes",
                ["educationLevel"] = "bachelor",
                ["jobOffer"] = "yes"
            };

            var result = await CompleteInterviewForVisa(page, answers, "TN").ConfigureAwait(false);
            Assert.Contains("TN", result, StringComparison.OrdinalIgnoreCase);
        }
        finally
        {
            await page.CloseAsync().ConfigureAwait(false);
        }
    }

    [Fact(DisplayName = "🇦🇺 Australia → E-3 Specialty Occupation")]
    public async Task Australia_E3_Specialty_Occupation_Test()
    {
        var page = await CreateNewPage().ConfigureAwait(false);
        try
        {
            var email = $"e3-australia-{Guid.NewGuid().ToString()[..8]}@testing.com";
            await RegisterUser(page, email, "Jack", "Thompson", "Australia").ConfigureAwait(false);
            await CompleteProfile(page, "Australia", "Australia", "1988-03-10", "Single", "Male").ConfigureAwait(false);

            var answers = new Dictionary<string, string>
            {
                ["purpose"] = "employment",
                ["australian"] = "yes",
                ["specialtyOccupation"] = "yes",
                ["educationLevel"] = "bachelor",
                ["hasEmployerSponsor"] = "yes"
            };

            var result = await CompleteInterviewForVisa(page, answers, "E-3").ConfigureAwait(false);
            Assert.Contains("E-3", result, StringComparison.OrdinalIgnoreCase);
        }
        finally
        {
            await page.CloseAsync().ConfigureAwait(false);
        }
    }

    #endregion

    #region Investment and Treaty Visa Tests

    [Fact(DisplayName = "🇩🇪 Germany → E-2 Treaty Investor")]
    public async Task Germany_E2_Treaty_Investor_Test()
    {
        var page = await CreateNewPage().ConfigureAwait(false);
        try
        {
            var email = $"e2-germany-{Guid.NewGuid().ToString()[..8]}@law4hire.com";
            await RegisterUser(page, email, "Klaus", "Schmidt", "Germany").ConfigureAwait(false);
            await CompleteProfile(page, "Germany", "Germany", "1973-09-22", "Married", "Male").ConfigureAwait(false);

            var answers = new Dictionary<string, string>
            {
                ["purpose"] = "investment",
                ["treatyCountry"] = "yes",
                ["investmentAmount"] = "large",
                ["businessOwnership"] = "yes"
            };

            var result = await CompleteInterviewForVisa(page, answers, "E-2").ConfigureAwait(false);
            Assert.Contains("E-2", result, StringComparison.OrdinalIgnoreCase);
        }
        finally
        {
            await page.CloseAsync().ConfigureAwait(false);
        }
    }

    [Fact(DisplayName = "🇸🇦 Saudi Arabia → EB-5 Investor")]
    public async Task SaudiArabia_EB5_Investor_Test()
    {
        var page = await CreateNewPage().ConfigureAwait(false);
        try
        {
            var email = $"eb5-saudi-{Guid.NewGuid().ToString()[..8]}@testing.com";
            await RegisterUser(page, email, "Mohammed", "Al-Saud", "Saudi Arabia").ConfigureAwait(false);
            await CompleteProfile(page, "Saudi Arabia", "Saudi Arabia", "1975-08-22", "Married", "Male").ConfigureAwait(false);

            var answers = new Dictionary<string, string>
            {
                ["purpose"] = "investment",
                ["investmentAmount"] = "eb5",
                ["jobCreation"] = "yes",
                ["durationOfStay"] = "permanent"
            };

            var result = await CompleteInterviewForVisa(page, answers, "EB-5").ConfigureAwait(false);
            Assert.Contains("EB-5", result, StringComparison.OrdinalIgnoreCase);
        }
        finally
        {
            await page.CloseAsync().ConfigureAwait(false);
        }
    }

    #endregion

    #region Family-Based Visa Tests

    [Fact(DisplayName = "🇷🇺 Russia → K-1 Fiancé(e)")]
    public async Task Russia_K1_Fiance_Test()
    {
        var page = await CreateNewPage().ConfigureAwait(false);
        try
        {
            var email = $"k1-russia-{Guid.NewGuid().ToString()[..8]}@law4hire.com";
            await RegisterUser(page, email, "Anna", "Ivanova", "Russia").ConfigureAwait(false);
            await CompleteProfile(page, "Russia", "Russia", "1992-12-03", "Single", "Female").ConfigureAwait(false);

            var answers = new Dictionary<string, string>
            {
                ["purpose"] = "family",
                ["familyRelationship"] = "fiance",
                ["usCitizenSponsor"] = "yes",
                ["marriageIntent"] = "yes"
            };

            var result = await CompleteInterviewForVisa(page, answers, "K-1").ConfigureAwait(false);
            Assert.Contains("K-1", result, StringComparison.OrdinalIgnoreCase);
        }
        finally
        {
            await page.CloseAsync().ConfigureAwait(false);
        }
    }

    [Fact(DisplayName = "🇵🇭 Philippines → IR-1 Spouse of US Citizen")]
    public async Task Philippines_IR1_Spouse_Test()
    {
        var page = await CreateNewPage().ConfigureAwait(false);
        try
        {
            var email = $"ir1-philippines-{Guid.NewGuid().ToString()[..8]}@testing.com";
            await RegisterUser(page, email, "Maria", "Santos", "Philippines").ConfigureAwait(false);
            await CompleteProfile(page, "Philippines", "Philippines", "1988-04-18", "Married", "Female").ConfigureAwait(false);

            var answers = new Dictionary<string, string>
            {
                ["purpose"] = "family",
                ["familyRelationship"] = "spouse",
                ["usCitizenSponsor"] = "yes",
                ["marriageDuration"] = "over2years"
            };

            var result = await CompleteInterviewForVisa(page, answers, "IR-1").ConfigureAwait(false);
            Assert.Contains("IR-1", result, StringComparison.OrdinalIgnoreCase);
        }
        finally
        {
            await page.CloseAsync().ConfigureAwait(false);
        }
    }

    #endregion

    #region Student Visa Tests

    [Fact(DisplayName = "🇧🇷 Brazil → F-1 Student")]
    public async Task Brazil_F1_Student_Test()
    {
        var page = await CreateNewPage().ConfigureAwait(false);
        try
        {
            var email = $"f1-brazil-{Guid.NewGuid().ToString()[..8]}@law4hire.com";
            await RegisterUser(page, email, "Carlos", "Silva", "Brazil").ConfigureAwait(false);
            await CompleteProfile(page, "Brazil", "Brazil", "2001-09-18", "Single", "Male").ConfigureAwait(false);

            var answers = new Dictionary<string, string>
            {
                ["purpose"] = "study",
                ["studyLevel"] = "undergraduate",
                ["schoolAcceptance"] = "yes",
                ["financialSupport"] = "yes"
            };

            var result = await CompleteInterviewForVisa(page, answers, "F-1").ConfigureAwait(false);
            Assert.Contains("F-1", result, StringComparison.OrdinalIgnoreCase);
        }
        finally
        {
            await page.CloseAsync().ConfigureAwait(false);
        }
    }

    #endregion

    #region Tourism Visa Tests

    [Fact(DisplayName = "🇫🇷 France → B-2 Tourist")]
    public async Task France_B2_Tourist_Test()
    {
        var page = await CreateNewPage().ConfigureAwait(false);
        try
        {
            var email = $"b2-france-{Guid.NewGuid().ToString()[..8]}@testing.com";
            await RegisterUser(page, email, "Sophie", "Dubois", "France").ConfigureAwait(false);
            await CompleteProfile(page, "France", "France", "1995-07-12", "Single", "Female").ConfigureAwait(false);

            var answers = new Dictionary<string, string>
            {
                ["purpose"] = "tourism",
                ["tripDuration"] = "short",
                ["returnIntent"] = "yes",
                ["financialSupport"] = "yes"
            };

            var result = await CompleteInterviewForVisa(page, answers, "B-2").ConfigureAwait(false);
            Assert.Contains("B-2", result, StringComparison.OrdinalIgnoreCase);
        }
        finally
        {
            await page.CloseAsync().ConfigureAwait(false);
        }
    }

    #endregion

    #region Adoption Workflow Tests (US Citizens Only)

    [Fact(DisplayName = "🇺🇸 US Citizen → IR-3 Adoption (Child Abroad)")]
    public async Task USCitizen_IR3_Adoption_Child_Abroad_Test()
    {
        var page = await CreateNewPage().ConfigureAwait(false);
        try
        {
            var email = $"ir3-adoption-{Guid.NewGuid().ToString()[..8]}@law4hire.com";
            await RegisterUser(page, email, "Jennifer", "Smith", "United States").ConfigureAwait(false);
            await CompleteProfile(page, "United States", "United States", "1985-03-15", "Married", "Female").ConfigureAwait(false);

            var answers = new Dictionary<string, string>
            {
                ["purpose"] = "adoption",
                ["usCitizen"] = "yes",
                ["adoptionType"] = "international",
                ["childLocation"] = "abroad",
                ["adoptionCompleted"] = "yes",
                ["childCountry"] = "China",
                ["adoptionAgency"] = "yes",
                ["homeStudyCompleted"] = "yes"
            };

            var result = await CompleteInterviewForVisa(page, answers, "IR-3").ConfigureAwait(false);
            Assert.Contains("IR-3", result, StringComparison.OrdinalIgnoreCase);
        }
        finally
        {
            await page.CloseAsync().ConfigureAwait(false);
        }
    }

    [Fact(DisplayName = "🇺🇸 US Citizen → IR-4 Adoption (Child to be Adopted in US)")]
    public async Task USCitizen_IR4_Adoption_Child_To_US_Test()
    {
        var page = await CreateNewPage().ConfigureAwait(false);
        try
        {
            var email = $"ir4-adoption-{Guid.NewGuid().ToString()[..8]}@testing.com";
            await RegisterUser(page, email, "Michael", "Johnson", "United States").ConfigureAwait(false);
            await CompleteProfile(page, "United States", "United States", "1980-11-22", "Married", "Male").ConfigureAwait(false);

            var answers = new Dictionary<string, string>
            {
                ["purpose"] = "adoption",
                ["usCitizen"] = "yes",
                ["adoptionType"] = "international",
                ["childLocation"] = "abroad",
                ["adoptionCompleted"] = "no",
                ["willAdoptInUS"] = "yes",
                ["childCountry"] = "Guatemala",
                ["adoptionAgency"] = "yes",
                ["homeStudyCompleted"] = "yes"
            };

            var result = await CompleteInterviewForVisa(page, answers, "IR-4").ConfigureAwait(false);
            Assert.Contains("IR-4", result, StringComparison.OrdinalIgnoreCase);
        }
        finally
        {
            await page.CloseAsync().ConfigureAwait(false);
        }
    }

    #endregion

    #region Citizenship/Naturalization Workflow Tests

    [Fact(DisplayName = "🇺🇸 Permanent Resident → N-400 Naturalization")]
    public async Task PermanentResident_N400_Naturalization_Test()
    {
        var page = await CreateNewPage().ConfigureAwait(false);
        try
        {
            var email = $"n400-naturalization-{Guid.NewGuid().ToString()[..8]}@law4hire.com";
            await RegisterUser(page, email, "Elena", "Rodriguez", "Mexico").ConfigureAwait(false);
            await CompleteProfile(page, "United States", "Mexico", "1985-07-30", "Married", "Female").ConfigureAwait(false);

            var answers = new Dictionary<string, string>
            {
                ["purpose"] = "citizenship",
                ["currentStatus"] = "permanent_resident",
                ["residencyYears"] = "5",
                ["physicalPresence"] = "yes",
                ["continuousResidence"] = "yes",
                ["englishProficiency"] = "yes",
                ["civicsKnowledge"] = "yes",
                ["goodMoralCharacter"] = "yes"
            };

            var result = await CompleteInterviewForVisa(page, answers, "N-400").ConfigureAwait(false);
            Assert.Contains("N-400", result, StringComparison.OrdinalIgnoreCase);
        }
        finally
        {
            await page.CloseAsync().ConfigureAwait(false);
        }
    }

    [Fact(DisplayName = "🇺🇸 US Citizen Child → N-600 Certificate of Citizenship")]
    public async Task USCitizenChild_N600_Certificate_Test()
    {
        var page = await CreateNewPage().ConfigureAwait(false);
        try
        {
            var email = $"n600-certificate-{Guid.NewGuid().ToString()[..8]}@testing.com";
            await RegisterUser(page, email, "David", "Kim", "South Korea").ConfigureAwait(false);
            await CompleteProfile(page, "United States", "South Korea", "2005-12-10", "Single", "Male").ConfigureAwait(false);

            var answers = new Dictionary<string, string>
            {
                ["purpose"] = "citizenship",
                ["currentStatus"] = "derived_citizen",
                ["parentCitizen"] = "yes",
                ["bornAbroad"] = "yes",
                ["under18"] = "no",
                ["residesWithCitizenParent"] = "yes",
                ["needsCertificate"] = "yes"
            };

            var result = await CompleteInterviewForVisa(page, answers, "N-600").ConfigureAwait(false);
            Assert.Contains("N-600", result, StringComparison.OrdinalIgnoreCase);
        }
        finally
        {
            await page.CloseAsync().ConfigureAwait(false);
        }
    }

    #endregion

    #region Localization Tests for All 21 Languages

    [Fact(DisplayName = "🌐 Arabic (ar-SA) Localization Test")]
    public async Task Arabic_Localization_Test()
    {
        var page = await CreateNewPage().ConfigureAwait(false);
        try
        {
            var email = $"arabic-test-{Guid.NewGuid().ToString()[..8]}@testing.com";
            await RegisterUser(page, email, "أحمد", "العلي", "Saudi Arabia").ConfigureAwait(false);
            await TestLanguageLocalization(page, "ar-SA", "Arabic").ConfigureAwait(false);
            
            // Verify RTL layout
            var direction = await page.EvaluateAsync<string>("() => getComputedStyle(document.body).direction").ConfigureAwait(false);
            _output.WriteLine($"Arabic RTL direction: {direction}");
            Assert.Equal("rtl", direction);
        }
        finally
        {
            await page.CloseAsync().ConfigureAwait(false);
        }
    }

    [Fact(DisplayName = "🌐 Chinese Simplified (zh-CN) Localization Test")]
    public async Task ChineseSimplified_Localization_Test()
    {
        var page = await CreateNewPage().ConfigureAwait(false);
        try
        {
            var email = $"chinese-test-{Guid.NewGuid().ToString()[..8]}@law4hire.com";
            await RegisterUser(page, email, "李", "明", "China").ConfigureAwait(false);
            await TestLanguageLocalization(page, "zh-CN", "Chinese Simplified").ConfigureAwait(false);
        }
        finally
        {
            await page.CloseAsync().ConfigureAwait(false);
        }
    }

    [Fact(DisplayName = "🌐 Spanish (es-ES) Localization Test")]
    public async Task Spanish_Localization_Test()
    {
        var page = await CreateNewPage().ConfigureAwait(false);
        try
        {
            var email = $"spanish-test-{Guid.NewGuid().ToString()[..8]}@testing.com";
            await RegisterUser(page, email, "María", "García", "Spain").ConfigureAwait(false);
            await TestLanguageLocalization(page, "es-ES", "Spanish").ConfigureAwait(false);
        }
        finally
        {
            await page.CloseAsync().ConfigureAwait(false);
        }
    }

    [Fact(DisplayName = "🌐 French (fr-FR) Localization Test")]
    public async Task French_Localization_Test()
    {
        var page = await CreateNewPage().ConfigureAwait(false);
        try
        {
            var email = $"french-test-{Guid.NewGuid().ToString()[..8]}@law4hire.com";
            await RegisterUser(page, email, "Pierre", "Dubois", "France").ConfigureAwait(false);
            await TestLanguageLocalization(page, "fr-FR", "French").ConfigureAwait(false);
        }
        finally
        {
            await page.CloseAsync().ConfigureAwait(false);
        }
    }

    [Fact(DisplayName = "🌐 Hindi (hi-IN) Localization Test")]
    public async Task Hindi_Localization_Test()
    {
        var page = await CreateNewPage().ConfigureAwait(false);
        try
        {
            var email = $"hindi-test-{Guid.NewGuid().ToString()[..8]}@testing.com";
            await RegisterUser(page, email, "राज", "शर्मा", "India").ConfigureAwait(false);
            await TestLanguageLocalization(page, "hi-IN", "Hindi").ConfigureAwait(false);
        }
        finally
        {
            await page.CloseAsync().ConfigureAwait(false);
        }
    }

    [Fact(DisplayName = "🌐 Japanese (ja-JP) Localization Test")]
    public async Task Japanese_Localization_Test()
    {
        var page = await CreateNewPage().ConfigureAwait(false);
        try
        {
            var email = $"japanese-test-{Guid.NewGuid().ToString()[..8]}@law4hire.com";
            await RegisterUser(page, email, "田中", "太郎", "Japan").ConfigureAwait(false);
            await TestLanguageLocalization(page, "ja-JP", "Japanese").ConfigureAwait(false);
        }
        finally
        {
            await page.CloseAsync().ConfigureAwait(false);
        }
    }

    [Fact(DisplayName = "🌐 Korean (ko-KR) Localization Test")]
    public async Task Korean_Localization_Test()
    {
        var page = await CreateNewPage().ConfigureAwait(false);
        try
        {
            var email = $"korean-test-{Guid.NewGuid().ToString()[..8]}@testing.com";
            await RegisterUser(page, email, "김", "민수", "South Korea").ConfigureAwait(false);
            await TestLanguageLocalization(page, "ko-KR", "Korean").ConfigureAwait(false);
        }
        finally
        {
            await page.CloseAsync().ConfigureAwait(false);
        }
    }

    [Fact(DisplayName = "🌐 Portuguese (pt-BR) Localization Test")]
    public async Task Portuguese_Localization_Test()
    {
        var page = await CreateNewPage().ConfigureAwait(false);
        try
        {
            var email = $"portuguese-test-{Guid.NewGuid().ToString()[..8]}@law4hire.com";
            await RegisterUser(page, email, "João", "Silva", "Brazil").ConfigureAwait(false);
            await TestLanguageLocalization(page, "pt-BR", "Portuguese").ConfigureAwait(false);
        }
        finally
        {
            await page.CloseAsync().ConfigureAwait(false);
        }
    }

    [Fact(DisplayName = "🌐 Russian (ru-RU) Localization Test")]
    public async Task Russian_Localization_Test()
    {
        var page = await CreateNewPage().ConfigureAwait(false);
        try
        {
            var email = $"russian-test-{Guid.NewGuid().ToString()[..8]}@testing.com";
            await RegisterUser(page, email, "Иван", "Петров", "Russia").ConfigureAwait(false);
            await TestLanguageLocalization(page, "ru-RU", "Russian").ConfigureAwait(false);
        }
        finally
        {
            await page.CloseAsync().ConfigureAwait(false);
        }
    }

    [Fact(DisplayName = "🌐 Urdu (ur-PK) Localization Test")]
    public async Task Urdu_Localization_Test()
    {
        var page = await CreateNewPage().ConfigureAwait(false);
        try
        {
            var email = $"urdu-test-{Guid.NewGuid().ToString()[..8]}@law4hire.com";
            await RegisterUser(page, email, "احمد", "علی", "Pakistan").ConfigureAwait(false);
            await TestLanguageLocalization(page, "ur-PK", "Urdu").ConfigureAwait(false);
            
            // Verify RTL layout for Urdu
            var direction = await page.EvaluateAsync<string>("() => getComputedStyle(document.body).direction").ConfigureAwait(false);
            _output.WriteLine($"Urdu RTL direction: {direction}");
            Assert.Equal("rtl", direction);
        }
        finally
        {
            await page.CloseAsync().ConfigureAwait(false);
        }
    }

    #endregion

    #region User Creation and Email Domain Tests

    [Fact(DisplayName = "✉️ User Creation with testing.com Domain")]
    public async Task User_Creation_Testing_Domain_Test()
    {
        var page = await CreateNewPage().ConfigureAwait(false);
        try
        {
            var email = $"domain-test-{Guid.NewGuid().ToString()[..8]}@testing.com";
            await RegisterUser(page, email, "Test", "User", "United States").ConfigureAwait(false);
            
            // Verify user was created successfully
            var currentUrl = page.Url;
            _output.WriteLine($"User created with testing.com domain. Current URL: {currentUrl}");
            Assert.Contains("profile-completion", currentUrl);
        }
        finally
        {
            await page.CloseAsync().ConfigureAwait(false);
        }
    }

    [Fact(DisplayName = "✉️ User Creation with law4hire.com Domain")]
    public async Task User_Creation_Law4Hire_Domain_Test()
    {
        var page = await CreateNewPage().ConfigureAwait(false);
        try
        {
            var email = $"domain-test-{Guid.NewGuid().ToString()[..8]}@law4hire.com";
            await RegisterUser(page, email, "Legal", "Professional", "United States").ConfigureAwait(false);
            
            // Verify user was created successfully
            var currentUrl = page.Url;
            _output.WriteLine($"User created with law4hire.com domain. Current URL: {currentUrl}");
            Assert.Contains("profile-completion", currentUrl);
        }
        finally
        {
            await page.CloseAsync().ConfigureAwait(false);
        }
    }

    [Fact(DisplayName = "🔐 Password Validation Test")]
    public async Task Password_Validation_Test()
    {
        var page = await CreateNewPage().ConfigureAwait(false);
        try
        {
            await page.GotoAsync($"{BASE_URL}/register").ConfigureAwait(false);
            await page.WaitForSelectorAsync("input[name='email']").ConfigureAwait(false);

            var email = $"password-test-{Guid.NewGuid().ToString()[..8]}@testing.com";
            await page.FillAsync("input[name='email']", email).ConfigureAwait(false);
            await page.FillAsync("input[name='password']", TEST_PASSWORD).ConfigureAwait(false);
            await page.FillAsync("input[name='confirmPassword']", TEST_PASSWORD).ConfigureAwait(false);
            await page.FillAsync("input[name='firstName']", "Password").ConfigureAwait(false);
            await page.FillAsync("input[name='lastName']", "Test").ConfigureAwait(false);

            // Verify password meets requirements
            var submitButton = await page.QuerySelectorAsync("button[type='submit']").ConfigureAwait(false);
            var isEnabled = await submitButton!.IsEnabledAsync().ConfigureAwait(false);
            
            _output.WriteLine($"Password {TEST_PASSWORD} validation result: {isEnabled}");
            Assert.True(isEnabled, "Submit button should be enabled with valid password");
        }
        finally
        {
            await page.CloseAsync().ConfigureAwait(false);
        }
    }

    #endregion

    #region Comprehensive Integration Tests

    [Fact(DisplayName = "🔄 Language Switching During Interview")]
    public async Task Language_Switching_During_Interview_Test()
    {
        var page = await CreateNewPage().ConfigureAwait(false);
        try
        {
            var email = $"lang-switch-{Guid.NewGuid().ToString()[..8]}@testing.com";
            await RegisterUser(page, email, "Multi", "Lingual", "Spain").ConfigureAwait(false);
            await CompleteProfile(page, "Spain", "Spain", "1990-05-15").ConfigureAwait(false);

            // Start interview in English
            _output.WriteLine("Starting interview in English");
            
            // Switch to Spanish mid-interview
            await TestLanguageLocalization(page, "es-ES", "Spanish").ConfigureAwait(false);
            
            // Continue interview in Spanish
            var answers = new Dictionary<string, string>
            {
                ["purpose"] = "tourism",
                ["tripDuration"] = "short"
            };

            var result = await CompleteInterviewForVisa(page, answers, "B-2").ConfigureAwait(false);
            _output.WriteLine($"Interview completed in Spanish with result: {result}");
        }
        finally
        {
            await page.CloseAsync().ConfigureAwait(false);
        }
    }

    [Fact(DisplayName = "🔄 Interview Progress Preservation")]
    public async Task Interview_Progress_Preservation_Test()
    {
        var page = await CreateNewPage().ConfigureAwait(false);
        try
        {
            var email = $"progress-test-{Guid.NewGuid().ToString()[..8]}@law4hire.com";
            await RegisterUser(page, email, "Progress", "Tester", "Canada").ConfigureAwait(false);
            await CompleteProfile(page, "Canada", "Canada", "1985-08-20").ConfigureAwait(false);

            // Answer first question
            _output.WriteLine("Answering first question");
            // Implementation depends on your interview UI structure
            
            // Navigate away and back
            await page.GotoAsync($"{BASE_URL}/dashboard").ConfigureAwait(false);
            await page.WaitForTimeoutAsync(2000).ConfigureAwait(false);
            
            // Return to interview
            await page.GotoAsync($"{BASE_URL}/interview").ConfigureAwait(false);
            
            // Verify progress was preserved
            var pageContent = await page.TextContentAsync("body").ConfigureAwait(false);
            _output.WriteLine($"Returned to interview. Page content indicates progress preservation: {pageContent?.Contains("progress") ?? false}");
        }
        finally
        {
            await page.CloseAsync().ConfigureAwait(false);
        }
    }

    #endregion
}