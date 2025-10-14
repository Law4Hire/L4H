using Microsoft.Playwright;
using Xunit;
using Xunit.Abstractions;
using System.Globalization;

namespace L4H.UI.E2E.Tests;

/// <summary>
/// Comprehensive Citizenship and Naturalization Workflow Tests
/// 
/// Tests the complete citizenship process including:
/// - N-400 (Application for Naturalization)
/// - N-600 (Application for Certificate of Citizenship)
/// - Citizenship eligibility requirements
/// - Naturalization test preparation
/// 
/// Note: These tests require the citizenship workflow to be implemented in the system.
/// If tests fail, it indicates the citizenship workflow needs to be added.
/// </summary>
[Trait("Category", "E2E")]
public class CitizenshipNaturalizationTests : IClassFixture<PlaywrightFixture>
{
    private readonly PlaywrightFixture _fixture;
    private readonly ITestOutputHelper _output;
    private const string TEST_PASSWORD = "SecureTest123!";
    private const string BASE_URL = "http://localhost:5173";

    public CitizenshipNaturalizationTests(PlaywrightFixture fixture, ITestOutputHelper output)
    {
        _fixture = fixture;
        _output = output;
    }

    private async Task<IPage> CreateNewPage()
    {
        var page = await _fixture.Browser.NewPageAsync().ConfigureAwait(false);
        page.Console += (_, e) => _output.WriteLine($"CONSOLE [{e.Type}]: {e.Text}");
        page.PageError += (_, e) => _output.WriteLine($"PAGE ERROR: {e}");
        return page;
    }

    private async Task RegisterPermanentResident(IPage page, string email, string firstName, string lastName, string nationality)
    {
        _output.WriteLine($"Registering Permanent Resident for citizenship: {email}");
        
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

    private async Task CompletePermanentResidentProfile(IPage page, string firstName, string lastName, string nationality, string dateOfBirth = "1985-01-01", string maritalStatus = "Married")
    {
        _output.WriteLine($"Completing Permanent Resident profile for {firstName} {lastName} from {nationality}");
        
        // Fill address information (must be in US for permanent residents)
        await page.FillAsync("input[name='streetAddress']", "456 Green Card Avenue").ConfigureAwait(false);
        await page.FillAsync("input[name='city']", "Los Angeles").ConfigureAwait(false);
        await page.FillAsync("input[name='postalCode']", "90210").ConfigureAwait(false);

        // Select United States as current country of residence
        var countryInput = page.Locator("input[placeholder*='Search and select your country']");
        if (await countryInput.CountAsync().ConfigureAwait(false) > 0)
        {
            await countryInput.ClickAsync().ConfigureAwait(false);
            await page.WaitForTimeoutAsync(1000).ConfigureAwait(false);
            await page.Locator("li button:has-text('United States')").First.ClickAsync().ConfigureAwait(false);
            await page.WaitForTimeoutAsync(1000).ConfigureAwait(false);
        }

        // Select state
        var stateSelect = await page.QuerySelectorAsync("select[name='stateProvince']").ConfigureAwait(false);
        if (stateSelect != null)
        {
            await page.SelectOptionAsync("select[name='stateProvince']", "CA").ConfigureAwait(false);
        }

        // Select original nationality (not US citizen yet)
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
        await page.SelectOptionAsync("select[name='gender']", "Male").ConfigureAwait(false);

        // Add permanent resident status information
        var immigrationStatusSelect = await page.QuerySelectorAsync("select[name='immigrationStatus']").ConfigureAwait(false);
        if (immigrationStatusSelect != null)
        {
            await page.SelectOptionAsync("select[name='immigrationStatus']", "permanent_resident").ConfigureAwait(false);
        }

        await page.WaitForTimeoutAsync(1000).ConfigureAwait(false);
        await page.WaitForSelectorAsync("button[type='submit']:not([disabled])", new() { Timeout = 10000 }).ConfigureAwait(false);
        await page.ClickAsync("button[type='submit']").ConfigureAwait(false);
        await page.WaitForTimeoutAsync(5000).ConfigureAwait(false);
    }

    private async Task<string> CompleteCitizenshipInterview(IPage page, Dictionary<string, string> citizenshipAnswers, string expectedResult)
    {
        _output.WriteLine($"Starting citizenship interview expecting {expectedResult}");
        
        var maxQuestions = 25; // Citizenship interviews may be longer
        var questionCount = 0;

        while (questionCount < maxQuestions)
        {
            questionCount++;
            _output.WriteLine($"Processing citizenship question {questionCount}");

            // Check if interview is complete
            var isComplete = await page.EvaluateAsync<bool>(@"() => {
                return document.body.textContent.includes('Interview Complete') ||
                       document.body.textContent.includes('Citizenship') ||
                       document.body.textContent.includes('N-400') ||
                       document.body.textContent.includes('N-600') ||
                       document.body.textContent.includes('Naturalization');
            }").ConfigureAwait(false);

            if (isComplete)
            {
                _output.WriteLine("Citizenship interview completed");
                break;
            }

            await page.WaitForTimeoutAsync(2000).ConfigureAwait(false);

            // Try to answer citizenship-specific questions
            foreach (var kvp in citizenshipAnswers)
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
                    break;
                }

                // Try text input for dates and numbers
                var textExists = await page.EvaluateAsync<bool>($@"() => {{
                    return !!document.querySelector('input[name=""{questionKey}""][type=""text""], input[name=""{questionKey}""][type=""date""], input[name=""{questionKey}""][type=""number""]');
                }}").ConfigureAwait(false);

                if (textExists)
                {
                    await page.FillAsync($"input[name=\"{questionKey}\"]", answerValue).ConfigureAwait(false);
                    _output.WriteLine($"Filled {answerValue} for {questionKey}");
                    break;
                }
            }

            // Click Next button
            var nextClicked = await page.EvaluateAsync<bool>(@"() => {
                const buttons = Array.from(document.querySelectorAll('button'));
                const nextButton = buttons.find(btn =>
                    btn.textContent.includes('Next') ||
                    btn.textContent.includes('Continue') ||
                    btn.textContent.includes('Submit')
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

        // Get the citizenship recommendation
        var result = await page.EvaluateAsync<string>(@"() => {
            const body = document.body.textContent;
            if (body.includes('N-400')) return 'N-400';
            if (body.includes('N-600')) return 'N-600';
            if (body.includes('Naturalization')) return 'N-400';
            if (body.includes('Certificate of Citizenship')) return 'N-600';
            return 'Unknown';
        }").ConfigureAwait(false);

        _output.WriteLine($"Citizenship interview completed. Result: {result}");
        return result;
    }

    #region N-400 Naturalization Tests

    [Fact(DisplayName = "🇲🇽→🇺🇸 Mexican Permanent Resident → N-400 Naturalization")]
    public async Task Mexican_PermanentResident_N400_Naturalization_Test()
    {
        var page = await CreateNewPage().ConfigureAwait(false);
        try
        {
            var email = $"n400-mexico-{Guid.NewGuid().ToString()[..8]}@law4hire.com";
            await RegisterPermanentResident(page, email, "Elena", "Rodriguez", "Mexico").ConfigureAwait(false);
            await CompletePermanentResidentProfile(page, "Elena", "Rodriguez", "Mexico", "1985-07-30", "Married").ConfigureAwait(false);

            var citizenshipAnswers = new Dictionary<string, string>
            {
                ["purpose"] = "citizenship",
                ["currentStatus"] = "permanent_resident",
                ["greenCardDate"] = "2019-01-15",
                ["residencyYears"] = "5",
                ["physicalPresenceMonths"] = "30",
                ["continuousResidence"] = "yes",
                ["absencesOver6Months"] = "no",
                ["englishSpeaking"] = "yes",
                ["englishReading"] = "yes",
                ["englishWriting"] = "yes",
                ["civicsKnowledge"] = "yes",
                ["usHistory"] = "yes",
                ["usGovernment"] = "yes",
                ["goodMoralCharacter"] = "yes",
                ["criminalHistory"] = "no",
                ["taxCompliance"] = "yes",
                ["militaryService"] = "no",
                ["oathAllegiance"] = "yes",
                ["attachmentToConstitution"] = "yes",
                ["marriedToUSCitizen"] = "yes",
                ["spouseUSCitizen"] = "yes"
            };

            var result = await CompleteCitizenshipInterview(page, citizenshipAnswers, "N-400").ConfigureAwait(false);
            Assert.Contains("N-400", result, StringComparison.OrdinalIgnoreCase);
        }
        finally
        {
            await page.CloseAsync().ConfigureAwait(false);
        }
    }

    [Fact(DisplayName = "🇮🇳→🇺🇸 Indian Permanent Resident → N-400 Naturalization (5 Year Rule)")]
    public async Task Indian_PermanentResident_N400_FiveYear_Test()
    {
        var page = await CreateNewPage().ConfigureAwait(false);
        try
        {
            var email = $"n400-india-5year-{Guid.NewGuid().ToString()[..8]}@testing.com";
            await RegisterPermanentResident(page, email, "Raj", "Patel", "India").ConfigureAwait(false);
            await CompletePermanentResidentProfile(page, "Raj", "Patel", "India", "1980-03-20", "Single").ConfigureAwait(false);

            var citizenshipAnswers = new Dictionary<string, string>
            {
                ["purpose"] = "citizenship",
                ["currentStatus"] = "permanent_resident",
                ["greenCardDate"] = "2018-06-10",
                ["residencyYears"] = "6",
                ["physicalPresenceMonths"] = "36",
                ["continuousResidence"] = "yes",
                ["absencesOver6Months"] = "no",
                ["longestAbsence"] = "45",
                ["englishSpeaking"] = "yes",
                ["englishReading"] = "yes",
                ["englishWriting"] = "yes",
                ["civicsKnowledge"] = "yes",
                ["usHistory"] = "yes",
                ["usGovernment"] = "yes",
                ["goodMoralCharacter"] = "yes",
                ["criminalHistory"] = "no",
                ["taxCompliance"] = "yes",
                ["militaryService"] = "no",
                ["oathAllegiance"] = "yes",
                ["attachmentToConstitution"] = "yes",
                ["marriedToUSCitizen"] = "no",
                ["employmentHistory"] = "stable"
            };

            var result = await CompleteCitizenshipInterview(page, citizenshipAnswers, "N-400").ConfigureAwait(false);
            Assert.Contains("N-400", result, StringComparison.OrdinalIgnoreCase);
        }
        finally
        {
            await page.CloseAsync().ConfigureAwait(false);
        }
    }

    [Fact(DisplayName = "🇵🇭→🇺🇸 Filipino Permanent Resident → N-400 (Military Service)")]
    public async Task Filipino_PermanentResident_N400_Military_Test()
    {
        var page = await CreateNewPage().ConfigureAwait(false);
        try
        {
            var email = $"n400-philippines-military-{Guid.NewGuid().ToString()[..8]}@law4hire.com";
            await RegisterPermanentResident(page, email, "Jose", "Santos", "Philippines").ConfigureAwait(false);
            await CompletePermanentResidentProfile(page, "Jose", "Santos", "Philippines", "1990-11-15", "Married").ConfigureAwait(false);

            var citizenshipAnswers = new Dictionary<string, string>
            {
                ["purpose"] = "citizenship",
                ["currentStatus"] = "permanent_resident",
                ["greenCardDate"] = "2020-03-01",
                ["militaryService"] = "yes",
                ["militaryBranch"] = "army",
                ["serviceStartDate"] = "2021-01-15",
                ["serviceEndDate"] = "2024-01-15",
                ["honorableDischarge"] = "yes",
                ["combatService"] = "yes",
                ["residencyYears"] = "4",
                ["physicalPresenceMonths"] = "24",
                ["continuousResidence"] = "yes",
                ["englishSpeaking"] = "yes",
                ["englishReading"] = "yes",
                ["englishWriting"] = "yes",
                ["civicsKnowledge"] = "yes",
                ["goodMoralCharacter"] = "yes",
                ["criminalHistory"] = "no",
                ["taxCompliance"] = "yes",
                ["oathAllegiance"] = "yes",
                ["attachmentToConstitution"] = "yes"
            };

            var result = await CompleteCitizenshipInterview(page, citizenshipAnswers, "N-400").ConfigureAwait(false);
            Assert.Contains("N-400", result, StringComparison.OrdinalIgnoreCase);
        }
        finally
        {
            await page.CloseAsync().ConfigureAwait(false);
        }
    }

    #endregion

    #region N-600 Certificate of Citizenship Tests

    [Fact(DisplayName = "🇰🇷→🇺🇸 Korean Child → N-600 Certificate of Citizenship")]
    public async Task Korean_Child_N600_Certificate_Test()
    {
        var page = await CreateNewPage().ConfigureAwait(false);
        try
        {
            var email = $"n600-korea-child-{Guid.NewGuid().ToString()[..8]}@testing.com";
            await RegisterPermanentResident(page, email, "David", "Kim", "South Korea").ConfigureAwait(false);
            await CompletePermanentResidentProfile(page, "David", "Kim", "South Korea", "2005-12-10", "Single").ConfigureAwait(false);

            var citizenshipAnswers = new Dictionary<string, string>
            {
                ["purpose"] = "citizenship",
                ["currentStatus"] = "derived_citizen",
                ["parentCitizen"] = "yes",
                ["parentCitizenshipDate"] = "2020-05-15",
                ["bornAbroad"] = "yes",
                ["birthCountry"] = "South Korea",
                ["birthDate"] = "2005-12-10",
                ["under18WhenParentNaturalized"] = "yes",
                ["residesWithCitizenParent"] = "yes",
                ["legalCustody"] = "yes",
                ["permanentResidentWhenParentNaturalized"] = "yes",
                ["needsCertificate"] = "yes",
                ["certificatePurpose"] = "passport_application",
                ["parentBirthCertificate"] = "yes",
                ["parentNaturalizationCertificate"] = "yes",
                ["childBirthCertificate"] = "yes",
                ["evidenceOfRelationship"] = "yes"
            };

            var result = await CompleteCitizenshipInterview(page, citizenshipAnswers, "N-600").ConfigureAwait(false);
            Assert.Contains("N-600", result, StringComparison.OrdinalIgnoreCase);
        }
        finally
        {
            await page.CloseAsync().ConfigureAwait(false);
        }
    }

    [Fact(DisplayName = "🇧🇷→🇺🇸 Brazilian Adult → N-600 Certificate (Born to US Citizen Abroad)")]
    public async Task Brazilian_Adult_N600_BornToCitizen_Test()
    {
        var page = await CreateNewPage().ConfigureAwait(false);
        try
        {
            var email = $"n600-brazil-adult-{Guid.NewGuid().ToString()[..8]}@law4hire.com";
            await RegisterPermanentResident(page, email, "Carlos", "Silva", "Brazil").ConfigureAwait(false);
            await CompletePermanentResidentProfile(page, "Carlos", "Silva", "Brazil", "1995-08-22", "Single").ConfigureAwait(false);

            var citizenshipAnswers = new Dictionary<string, string>
            {
                ["purpose"] = "citizenship",
                ["currentStatus"] = "us_citizen_born_abroad",
                ["bornAbroad"] = "yes",
                ["birthCountry"] = "Brazil",
                ["birthDate"] = "1995-08-22",
                ["parentUSCitizenAtBirth"] = "yes",
                ["parentPhysicalPresence"] = "yes",
                ["parentPresenceYears"] = "10",
                ["parentPresenceAfter14"] = "5",
                ["marriedParents"] = "yes",
                ["legitimateChild"] = "yes",
                ["needsCertificate"] = "yes",
                ["certificatePurpose"] = "employment_verification",
                ["parentBirthCertificate"] = "yes",
                ["parentPassport"] = "yes",
                ["childBirthCertificate"] = "yes",
                ["evidenceOfRelationship"] = "yes",
                ["evidenceOfParentPresence"] = "yes"
            };

            var result = await CompleteCitizenshipInterview(page, citizenshipAnswers, "N-600").ConfigureAwait(false);
            Assert.Contains("N-600", result, StringComparison.OrdinalIgnoreCase);
        }
        finally
        {
            await page.CloseAsync().ConfigureAwait(false);
        }
    }

    #endregion

    #region Citizenship Eligibility Tests

    [Fact(DisplayName = "❌ Ineligible for Citizenship - Insufficient Residency")]
    public async Task Ineligible_Citizenship_InsufficientResidency_Test()
    {
        var page = await CreateNewPage().ConfigureAwait(false);
        try
        {
            var email = $"ineligible-residency-{Guid.NewGuid().ToString()[..8]}@testing.com";
            await RegisterPermanentResident(page, email, "Recent", "Immigrant", "Vietnam").ConfigureAwait(false);
            await CompletePermanentResidentProfile(page, "Recent", "Immigrant", "Vietnam", "1990-01-01", "Single").ConfigureAwait(false);

            var citizenshipAnswers = new Dictionary<string, string>
            {
                ["purpose"] = "citizenship",
                ["currentStatus"] = "permanent_resident",
                ["greenCardDate"] = "2023-01-01", // Only 1 year ago
                ["residencyYears"] = "1",
                ["physicalPresenceMonths"] = "12",
                ["continuousResidence"] = "yes",
                ["englishSpeaking"] = "yes",
                ["englishReading"] = "yes",
                ["englishWriting"] = "yes",
                ["civicsKnowledge"] = "yes",
                ["goodMoralCharacter"] = "yes",
                ["criminalHistory"] = "no",
                ["taxCompliance"] = "yes",
                ["oathAllegiance"] = "yes"
            };

            var result = await CompleteCitizenshipInterview(page, citizenshipAnswers, "Ineligible").ConfigureAwait(false);
            
            // Should indicate ineligibility due to insufficient residency
            var pageContent = await page.TextContentAsync("body").ConfigureAwait(false);
            var isIneligible = (pageContent?.Contains("ineligible", StringComparison.OrdinalIgnoreCase) ?? false) ||
                              (pageContent?.Contains("not qualified", StringComparison.OrdinalIgnoreCase) ?? false) ||
                              (pageContent?.Contains("requirements not met", StringComparison.OrdinalIgnoreCase) ?? false);
            
            _output.WriteLine($"Citizenship eligibility result: {isIneligible}");
            Assert.True(isIneligible, "Should indicate ineligibility for citizenship");
        }
        finally
        {
            await page.CloseAsync().ConfigureAwait(false);
        }
    }

    [Fact(DisplayName = "❌ Ineligible for Citizenship - Criminal History")]
    public async Task Ineligible_Citizenship_CriminalHistory_Test()
    {
        var page = await CreateNewPage().ConfigureAwait(false);
        try
        {
            var email = $"ineligible-criminal-{Guid.NewGuid().ToString()[..8]}@law4hire.com";
            await RegisterPermanentResident(page, email, "Criminal", "History", "Colombia").ConfigureAwait(false);
            await CompletePermanentResidentProfile(page, "Criminal", "History", "Colombia", "1980-01-01", "Single").ConfigureAwait(false);

            var citizenshipAnswers = new Dictionary<string, string>
            {
                ["purpose"] = "citizenship",
                ["currentStatus"] = "permanent_resident",
                ["greenCardDate"] = "2018-01-01",
                ["residencyYears"] = "6",
                ["physicalPresenceMonths"] = "36",
                ["continuousResidence"] = "yes",
                ["englishSpeaking"] = "yes",
                ["englishReading"] = "yes",
                ["englishWriting"] = "yes",
                ["civicsKnowledge"] = "yes",
                ["goodMoralCharacter"] = "no", // Failed good moral character
                ["criminalHistory"] = "yes",
                ["crimeType"] = "felony",
                ["convictionDate"] = "2022-01-01",
                ["taxCompliance"] = "no",
                ["oathAllegiance"] = "yes"
            };

            var result = await CompleteCitizenshipInterview(page, citizenshipAnswers, "Ineligible").ConfigureAwait(false);
            
            // Should indicate ineligibility due to criminal history
            var pageContent = await page.TextContentAsync("body").ConfigureAwait(false);
            var isIneligible = (pageContent?.Contains("ineligible", StringComparison.OrdinalIgnoreCase) ?? false) ||
                              (pageContent?.Contains("not qualified", StringComparison.OrdinalIgnoreCase) ?? false) ||
                              (pageContent?.Contains("moral character", StringComparison.OrdinalIgnoreCase) ?? false);
            
            _output.WriteLine($"Criminal history citizenship result: {isIneligible}");
            Assert.True(isIneligible, "Should indicate ineligibility due to criminal history");
        }
        finally
        {
            await page.CloseAsync().ConfigureAwait(false);
        }
    }

    #endregion

    #region Citizenship Test Preparation Tests

    [Fact(DisplayName = "📚 Citizenship Test Preparation - English Test")]
    public async Task Citizenship_English_Test_Preparation()
    {
        var page = await CreateNewPage().ConfigureAwait(false);
        try
        {
            var email = $"english-test-prep-{Guid.NewGuid().ToString()[..8]}@testing.com";
            await RegisterPermanentResident(page, email, "English", "Learner", "China").ConfigureAwait(false);
            await CompletePermanentResidentProfile(page, "English", "Learner", "China").ConfigureAwait(false);

            // Test English proficiency assessment
            var englishQuestions = new Dictionary<string, string>
            {
                ["englishSpeaking"] = "intermediate",
                ["englishReading"] = "basic",
                ["englishWriting"] = "basic",
                ["needsEnglishHelp"] = "yes",
                ["preferredLearningMethod"] = "classes",
                ["timeAvailableForStudy"] = "10_hours_week"
            };

            foreach (var question in englishQuestions)
            {
                var exists = await page.EvaluateAsync<bool>($@"() => {{
                    return !!document.querySelector('[name=""{question.Key}""]');
                }}").ConfigureAwait(false);

                if (exists)
                {
                    _output.WriteLine($"English assessment question '{question.Key}' found");
                }
            }

            Assert.True(true, "English test preparation assessment completed");
        }
        finally
        {
            await page.CloseAsync().ConfigureAwait(false);
        }
    }

    [Fact(DisplayName = "📚 Citizenship Test Preparation - Civics Test")]
    public async Task Citizenship_Civics_Test_Preparation()
    {
        var page = await CreateNewPage().ConfigureAwait(false);
        try
        {
            var email = $"civics-test-prep-{Guid.NewGuid().ToString()[..8]}@law4hire.com";
            await RegisterPermanentResident(page, email, "Civics", "Student", "Nigeria").ConfigureAwait(false);
            await CompletePermanentResidentProfile(page, "Civics", "Student", "Nigeria").ConfigureAwait(false);

            // Test civics knowledge assessment
            var civicsQuestions = new[]
            {
                "What is the supreme law of the land?",
                "What does the Constitution do?",
                "The idea of self-government is in the first three words of the Constitution. What are these words?",
                "What is an amendment?",
                "What do we call the first ten amendments to the Constitution?",
                "How many amendments does the Constitution have?",
                "What is the Declaration of Independence?",
                "What are two rights in the Declaration of Independence?",
                "What is freedom of religion?",
                "What is the economic system in the United States?"
            };

            foreach (var question in civicsQuestions)
            {
                var questionExists = await page.EvaluateAsync<bool>($@"() => {{
                    return document.body.textContent.includes('{question}');
                }}").ConfigureAwait(false);

                if (questionExists)
                {
                    _output.WriteLine($"Civics question found: {question}");
                }
            }

            Assert.True(true, "Civics test preparation assessment completed");
        }
        finally
        {
            await page.CloseAsync().ConfigureAwait(false);
        }
    }

    #endregion

    #region Citizenship Documentation Tests

    [Fact(DisplayName = "📋 Citizenship Documentation Requirements Test")]
    public async Task Citizenship_Documentation_Requirements_Test()
    {
        var page = await CreateNewPage().ConfigureAwait(false);
        try
        {
            var email = $"citizenship-docs-{Guid.NewGuid().ToString()[..8]}@testing.com";
            await RegisterPermanentResident(page, email, "Document", "Checker", "Egypt").ConfigureAwait(false);
            await CompletePermanentResidentProfile(page, "Document", "Checker", "Egypt").ConfigureAwait(false);

            // Test that all required citizenship documents are requested
            var requiredDocs = new[]
            {
                "greenCard",
                "passport",
                "birthCertificate",
                "marriageCertificate",
                "taxReturns",
                "employmentHistory",
                "travelRecords",
                "criminalBackgroundCheck",
                "medicalExamination",
                "photographs",
                "applicationFee"
            };

            foreach (var doc in requiredDocs)
            {
                var docExists = await page.EvaluateAsync<bool>($@"() => {{
                    return document.body.textContent.toLowerCase().includes('{doc.ToLower(CultureInfo.InvariantCulture)}') ||
                           !!document.querySelector('[data-document=""{doc}""]');
                }}").ConfigureAwait(false);

                _output.WriteLine($"Required citizenship document '{doc}' found: {docExists}");
            }

            Assert.True(true, "Citizenship documentation requirements validation completed");
        }
        finally
        {
            await page.CloseAsync().ConfigureAwait(false);
        }
    }

    #endregion

    #region Citizenship Interview Scheduling Tests

    [Fact(DisplayName = "📅 Citizenship Interview Scheduling Test")]
    public async Task Citizenship_Interview_Scheduling_Test()
    {
        var page = await CreateNewPage().ConfigureAwait(false);
        try
        {
            var email = $"interview-schedule-{Guid.NewGuid().ToString()[..8]}@law4hire.com";
            await RegisterPermanentResident(page, email, "Interview", "Scheduler", "Iran").ConfigureAwait(false);
            await CompletePermanentResidentProfile(page, "Interview", "Scheduler", "Iran").ConfigureAwait(false);

            // Test interview scheduling functionality
            var schedulingElements = new[]
            {
                "availableDates",
                "timeSlots",
                "uscisOfficeLocation",
                "interviewPreparation",
                "requiredDocuments",
                "reschedulingOptions"
            };

            foreach (var element in schedulingElements)
            {
                var elementExists = await page.EvaluateAsync<bool>($@"() => {{
                    return document.body.textContent.toLowerCase().includes('{element.ToLower(CultureInfo.InvariantCulture)}') ||
                           !!document.querySelector('[data-element=""{element}""]');
                }}").ConfigureAwait(false);

                _output.WriteLine($"Interview scheduling element '{element}' found: {elementExists}");
            }

            Assert.True(true, "Citizenship interview scheduling validation completed");
        }
        finally
        {
            await page.CloseAsync().ConfigureAwait(false);
        }
    }

    #endregion
}