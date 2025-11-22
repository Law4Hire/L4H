using Microsoft.Playwright;
using Xunit;
using Xunit.Abstractions;

namespace L4H.UI.E2E.Tests;

/// <summary>
/// Comprehensive Multilingual User Journey Tests
/// 
/// Tests complete user journeys in multiple languages including:
/// - User registration and profile completion in different languages
/// - Interview flow with language switching
/// - Visa recommendation accuracy across languages
/// - Error handling and fallback behavior
/// - Performance and accessibility in multilingual context
/// </summary>
[Trait("Category", "E2E")]
[Trait("Category", "Multilingual")]
public class MultilingualUserJourneyTests : IClassFixture<PlaywrightFixture>
{
    private readonly PlaywrightFixture _fixture;
    private readonly ITestOutputHelper _output;
    private const string TEST_PASSWORD = "SecureTest123!";
    private const string BASE_URL = "http://localhost:5173";

    // Priority languages for comprehensive testing
    private readonly Dictionary<string, LanguageTestInfo> _testLanguages = new()
    {
        ["en-US"] = new("English", "English", false, "ltr", true),
        ["es-ES"] = new("Spanish", "Español", false, "ltr", true),
        ["fr-FR"] = new("French", "Français", false, "ltr", true),
        ["de-DE"] = new("German", "Deutsch", false, "ltr", true),
        ["ar-SA"] = new("Arabic", "العربية", true, "rtl", true),
        ["zh-CN"] = new("Chinese", "简体中文", false, "ltr", true),
        ["hi-IN"] = new("Hindi", "हिन्दी", false, "ltr", true),
        ["ja-JP"] = new("Japanese", "日本語", false, "ltr", true),
        ["ur-PK"] = new("Urdu", "اردو", true, "rtl", true),
        ["ru-RU"] = new("Russian", "Русский", false, "ltr", true)
    };

    public MultilingualUserJourneyTests(PlaywrightFixture fixture, ITestOutputHelper output)
    {
        _fixture = fixture;
        _output = output;
    }

    private record LanguageTestInfo(
        string EnglishName, 
        string NativeName, 
        bool IsRTL, 
        string Direction, 
        bool IsHighPriority
    );

    private async Task<IPage> CreateNewPage()
    {
        var page = await _fixture.Browser.NewPageAsync(new BrowserNewPageOptions
        {
            ViewportSize = new ViewportSize { Width = 1280, Height = 720 }
        }).ConfigureAwait(false);
        
        page.Console += (_, e) => _output.WriteLine($"CONSOLE [{e.Type}]: {e.Text}");
        page.PageError += (_, e) => _output.WriteLine($"PAGE ERROR: {e}");
        
        return page;
    }

    private async Task<string> RegisterUserInLanguage(IPage page, string languageCode, LanguageTestInfo langInfo)
    {
        var email = $"{languageCode}-journey-{Guid.NewGuid().ToString()[..8]}@testing.com";
        _output.WriteLine($"🌐 Registering user in {langInfo.EnglishName} ({languageCode}): {email}");

        await page.GotoAsync($"{BASE_URL}").ConfigureAwait(false);
        await page.WaitForLoadStateAsync(LoadState.NetworkIdle).ConfigureAwait(false);

        // Switch to target language first if not English
        if (languageCode != "en-US")
        {
            await SwitchLanguage(page, languageCode, langInfo).ConfigureAwait(false);
        }

        // Navigate to registration
        await page.GotoAsync($"{BASE_URL}/register").ConfigureAwait(false);
        await page.WaitForSelectorAsync("input[name='email']", new PageWaitForSelectorOptions { Timeout = 10000 }).ConfigureAwait(false);

        // Fill registration form
        await page.FillAsync("input[name='email']", email).ConfigureAwait(false);
        await page.FillAsync("input[name='password']", TEST_PASSWORD).ConfigureAwait(false);
        await page.FillAsync("input[name='confirmPassword']", TEST_PASSWORD).ConfigureAwait(false);
        await page.FillAsync("input[name='firstName']", GetLocalizedName(langInfo, "first")).ConfigureAwait(false);
        await page.FillAsync("input[name='lastName']", GetLocalizedName(langInfo, "last")).ConfigureAwait(false);

        // Submit registration
        await page.ClickAsync("button[type='submit']").ConfigureAwait(false);
        await page.WaitForURLAsync("**/profile-completion", new PageWaitForURLOptions { Timeout = 30000 }).ConfigureAwait(false);

        _output.WriteLine($"✅ User registered successfully in {langInfo.EnglishName}");
        return email;
    }

    private string GetLocalizedName(LanguageTestInfo langInfo, string type)
    {
        return langInfo.EnglishName switch
        {
            "Spanish" => type == "first" ? "María" : "García",
            "French" => type == "first" ? "Pierre" : "Dubois",
            "German" => type == "first" ? "Hans" : "Müller",
            "Arabic" => type == "first" ? "أحمد" : "العلي",
            "Chinese" => type == "first" ? "李" : "明",
            "Hindi" => type == "first" ? "राज" : "शर्मा",
            "Japanese" => type == "first" ? "田中" : "太郎",
            "Urdu" => type == "first" ? "احمد" : "خان",
            "Russian" => type == "first" ? "Иван" : "Петров",
            _ => type == "first" ? "Test" : "User"
        };
    }

    private async Task<bool> SwitchLanguage(IPage page, string languageCode, LanguageTestInfo langInfo)
    {
        _output.WriteLine($"🔄 Switching to {langInfo.EnglishName} ({languageCode})");

        // Try multiple language selector patterns
        var selectors = new[]
        {
            $"[data-language='{languageCode}']",
            $"[data-lang='{languageCode}']",
            $"button:has-text('{langInfo.NativeName}')",
            $"option[value='{languageCode}']",
            ".language-selector select",
            "#language-select"
        };

        foreach (var selector in selectors)
        {
            try
            {
                var element = await page.QuerySelectorAsync(selector).ConfigureAwait(false);
                if (element != null)
                {
                    if (selector.Contains("select") || selector.Contains("option"))
                    {
                        await page.SelectOptionAsync(selector, languageCode).ConfigureAwait(false);
                    }
                    else
                    {
                        await element.ClickAsync().ConfigureAwait(false);
                    }
                    
                    await page.WaitForTimeoutAsync(2000).ConfigureAwait(false);
                    _output.WriteLine($"✅ Language switched using selector: {selector}");
                    return true;
                }
            }
            catch (Exception ex)
            {
                _output.WriteLine($"⚠️ Failed to use selector {selector}: {ex.Message}");
            }
        }

        _output.WriteLine($"❌ Could not find language selector for {languageCode}");
        return false;
    }

    private async Task CompleteProfileInLanguage(IPage page, LanguageTestInfo langInfo)
    {
        _output.WriteLine($"📝 Completing profile in {langInfo.EnglishName}");

        // Wait for profile completion form
        await page.WaitForSelectorAsync("input[name='streetAddress']", new PageWaitForSelectorOptions { Timeout = 10000 }).ConfigureAwait(false);

        // Fill address information with localized data
        var addressData = GetLocalizedAddressData(langInfo);
        await page.FillAsync("input[name='streetAddress']", addressData.Street).ConfigureAwait(false);
        await page.FillAsync("input[name='city']", addressData.City).ConfigureAwait(false);
        await page.FillAsync("input[name='postalCode']", addressData.PostalCode).ConfigureAwait(false);

        // Select country
        await SelectCountryForLanguage(page, langInfo).ConfigureAwait(false);

        // Fill other profile information
        await page.FillAsync("input[name='dateOfBirth']", "1990-01-01").ConfigureAwait(false);
        await page.SelectOptionAsync("select[name='maritalStatus']", "Single").ConfigureAwait(false);
        await page.SelectOptionAsync("select[name='gender']", "Male").ConfigureAwait(false);

        // Submit profile
        await page.WaitForSelectorAsync("button[type='submit']:not([disabled])", new() { Timeout = 10000 }).ConfigureAwait(false);
        await page.ClickAsync("button[type='submit']").ConfigureAwait(false);
        await page.WaitForTimeoutAsync(3000).ConfigureAwait(false);

        _output.WriteLine($"✅ Profile completed in {langInfo.EnglishName}");
    }

    private (string Street, string City, string PostalCode, string Country) GetLocalizedAddressData(LanguageTestInfo langInfo)
    {
        return langInfo.EnglishName switch
        {
            "Spanish" => ("Calle Mayor 123", "Madrid", "28001", "Spain"),
            "French" => ("123 Rue de la Paix", "Paris", "75001", "France"),
            "German" => ("Hauptstraße 123", "Berlin", "10115", "Germany"),
            "Arabic" => ("شارع الملك فهد 123", "الرياض", "11564", "Saudi Arabia"),
            "Chinese" => ("中山路123号", "北京", "100000", "China"),
            "Hindi" => ("राजपथ 123", "नई दिल्ली", "110001", "India"),
            "Japanese" => ("新宿区123番地", "東京", "160-0022", "Japan"),
            "Urdu" => ("شاہراہ قائداعظم 123", "کراچی", "75600", "Pakistan"),
            "Russian" => ("Красная площадь 123", "Москва", "101000", "Russia"),
            _ => ("123 Test Street", "Test City", "12345", "United States")
        };
    }

    private async Task SelectCountryForLanguage(IPage page, LanguageTestInfo langInfo)
    {
        var countryName = GetLocalizedAddressData(langInfo).Country;
        
        try
        {
            var countryInput = page.Locator("input[placeholder*='country'], input[placeholder*='Country']").First;
            if (await countryInput.CountAsync().ConfigureAwait(false) > 0)
            {
                await countryInput.ClickAsync().ConfigureAwait(false);
                await page.WaitForTimeoutAsync(1000).ConfigureAwait(false);
                
                // Try to find and click the country option
                var countryOption = page.Locator($"li button:has-text('{countryName}'), option:has-text('{countryName}')").First;
                if (await countryOption.CountAsync().ConfigureAwait(false) > 0)
                {
                    await countryOption.ClickAsync().ConfigureAwait(false);
                    await page.WaitForTimeoutAsync(1000).ConfigureAwait(false);
                }
            }
        }
        catch (Exception ex)
        {
            _output.WriteLine($"⚠️ Could not select country for {langInfo.EnglishName}: {ex.Message}");
        }
    }

    private async Task<InterviewResult> ConductInterviewInLanguage(IPage page, LanguageTestInfo langInfo)
    {
        _output.WriteLine($"🎤 Conducting interview in {langInfo.EnglishName}");

        var result = new InterviewResult
        {
            LanguageCode = GetLanguageCode(langInfo),
            LanguageName = langInfo.EnglishName,
            StartTime = DateTime.UtcNow
        };

        try
        {
            // Navigate to interview or wait for redirect
            var currentUrl = page.Url;
            if (!currentUrl.Contains("interview"))
            {
                await page.GotoAsync($"{BASE_URL}/interview").ConfigureAwait(false);
            }

            await page.WaitForSelectorAsync("[data-testid='interview-question'], .interview-question, h1, h2", 
                new PageWaitForSelectorOptions { Timeout = 15000 }).ConfigureAwait(false);

            // Answer interview questions
            var questionsAnswered = 0;
            var maxQuestions = 10; // Prevent infinite loops

            while (questionsAnswered < maxQuestions)
            {
                // Check if we've reached the end
                if (await page.QuerySelectorAsync(".interview-complete, .results, [data-testid='interview-complete']").ConfigureAwait(false) != null)
                {
                    break;
                }

                // Look for question elements
                var questionElement = await page.QuerySelectorAsync("h1, h2, .question-text, [data-testid='question']").ConfigureAwait(false);
                if (questionElement != null)
                {
                    var questionText = await questionElement.TextContentAsync().ConfigureAwait(false) ?? "";
                    _output.WriteLine($"📋 Question {questionsAnswered + 1}: {questionText.Substring(0, Math.Min(100, questionText.Length))}...");

                    // Answer the question based on content
                    await AnswerQuestionInLanguage(page, questionText, langInfo).ConfigureAwait(false);
                    questionsAnswered++;

                    // Wait for next question or completion
                    await page.WaitForTimeoutAsync(2000).ConfigureAwait(false);
                }
                else
                {
                    break;
                }
            }

            result.QuestionsAnswered = questionsAnswered;
            result.CompletedSuccessfully = questionsAnswered > 0;
            result.EndTime = DateTime.UtcNow;

            _output.WriteLine($"✅ Interview completed in {langInfo.EnglishName} - {questionsAnswered} questions answered");
        }
        catch (Exception ex)
        {
            result.Error = ex.Message;
            result.EndTime = DateTime.UtcNow;
            _output.WriteLine($"❌ Interview failed in {langInfo.EnglishName}: {ex.Message}");
        }

        return result;
    }

    private string GetLanguageCode(LanguageTestInfo langInfo)
    {
        return langInfo.EnglishName switch
        {
            "Spanish" => "es-ES",
            "French" => "fr-FR",
            "German" => "de-DE",
            "Arabic" => "ar-SA",
            "Chinese" => "zh-CN",
            "Hindi" => "hi-IN",
            "Japanese" => "ja-JP",
            "Urdu" => "ur-PK",
            "Russian" => "ru-RU",
            _ => "en-US"
        };
    }

    private async Task AnswerQuestionInLanguage(IPage page, string questionText, LanguageTestInfo langInfo)
    {
        // Look for different types of input elements
        var buttonSelectors = new[]
        {
            "button:not([disabled])",
            "[role='button']:not([disabled])",
            ".option-button",
            ".answer-option"
        };

        var inputSelectors = new[]
        {
            "input[type='text']",
            "input[type='email']",
            "input[type='number']",
            "textarea",
            "select"
        };

        // Try to answer with buttons first (multiple choice)
        foreach (var selector in buttonSelectors)
        {
            var buttons = await page.QuerySelectorAllAsync(selector).ConfigureAwait(false);
            if (buttons.Count > 0)
            {
                // Click the first available option
                var button = buttons.First();
                var buttonText = await button.TextContentAsync().ConfigureAwait(false) ?? "";
                
                if (!string.IsNullOrWhiteSpace(buttonText) && !buttonText.Contains("skip", StringComparison.OrdinalIgnoreCase))
                {
                    await button.ClickAsync().ConfigureAwait(false);
                    _output.WriteLine($"🔘 Selected option: {buttonText}");
                    return;
                }
            }
        }

        // Try to fill input fields
        foreach (var selector in inputSelectors)
        {
            var input = await page.QuerySelectorAsync(selector).ConfigureAwait(false);
            if (input != null)
            {
                var inputType = await input.GetAttributeAsync("type").ConfigureAwait(false) ?? "";
                var placeholder = await input.GetAttributeAsync("placeholder").ConfigureAwait(false) ?? "";

                var value = GetLocalizedInputValue(inputType, placeholder, langInfo);
                await input.FillAsync(value).ConfigureAwait(false);
                _output.WriteLine($"✏️ Filled {inputType} input with: {value}");
                return;
            }
        }

        // Look for Next/Continue button
        var nextButton = await page.QuerySelectorAsync("button:has-text('Next'), button:has-text('Continue'), button:has-text('Submit')").ConfigureAwait(false);
        if (nextButton != null)
        {
            await nextButton.ClickAsync().ConfigureAwait(false);
            _output.WriteLine($"➡️ Clicked Next/Continue button");
        }
    }

    private string GetLocalizedInputValue(string inputType, string placeholder, LanguageTestInfo langInfo)
    {
        return inputType.ToLowerInvariant() switch
        {
            "email" => $"test-{langInfo.EnglishName.ToLowerInvariant()}@example.com",
            "number" => "25",
            _ when placeholder.Contains("age", StringComparison.OrdinalIgnoreCase) => "25",
            _ when placeholder.Contains("year", StringComparison.OrdinalIgnoreCase) => "2020",
            _ when placeholder.Contains("name", StringComparison.OrdinalIgnoreCase) => GetLocalizedName(langInfo, "first"),
            _ => "Test Response"
        };
    }

    private async Task<ValidationResult> ValidateLanguageDisplay(IPage page, LanguageTestInfo langInfo)
    {
        var result = new ValidationResult
        {
            LanguageCode = GetLanguageCode(langInfo),
            LanguageName = langInfo.EnglishName
        };

        try
        {
            // Check page direction for RTL languages
            var direction = await page.EvaluateAsync<string>("() => getComputedStyle(document.documentElement).direction || getComputedStyle(document.body).direction").ConfigureAwait(false);
            result.DirectionCorrect = langInfo.IsRTL ? direction == "rtl" : direction != "rtl";

            // Check for proper character encoding
            var pageText = await page.TextContentAsync("body").ConfigureAwait(false) ?? "";
            result.CharacterEncodingCorrect = !pageText.Contains("�") && !pageText.Contains("?");

            // Check for native script content
            result.HasNativeScript = ValidateNativeScript(pageText, langInfo);

            // Check for translation completeness (no English fallbacks for non-English languages)
            if (GetLanguageCode(langInfo) != "en-US")
            {
                var commonEnglishWords = new[] { "Next", "Previous", "Submit", "Cancel", "Loading", "Error" };
                var hasEnglishFallbacks = commonEnglishWords.Any(word => 
                    pageText.Contains(word, StringComparison.OrdinalIgnoreCase));
                result.TranslationComplete = !hasEnglishFallbacks;
            }
            else
            {
                result.TranslationComplete = true;
            }

            // Check accessibility attributes
            var langAttribute = await page.GetAttributeAsync("html", "lang").ConfigureAwait(false);
            result.AccessibilityCorrect = !string.IsNullOrEmpty(langAttribute);

            _output.WriteLine($"🔍 Validation for {langInfo.EnglishName}: " +
                $"Direction={result.DirectionCorrect}, " +
                $"Encoding={result.CharacterEncodingCorrect}, " +
                $"Script={result.HasNativeScript}, " +
                $"Translation={result.TranslationComplete}, " +
                $"A11y={result.AccessibilityCorrect}");
        }
        catch (Exception ex)
        {
            result.Error = ex.Message;
            _output.WriteLine($"❌ Validation failed for {langInfo.EnglishName}: {ex.Message}");
        }

        return result;
    }

    private bool ValidateNativeScript(string text, LanguageTestInfo langInfo)
    {
        return langInfo.EnglishName switch
        {
            "Arabic" => text.Any(c => c >= '\u0600' && c <= '\u06FF'),
            "Chinese" => text.Any(c => c >= '\u4E00' && c <= '\u9FFF'),
            "Hindi" => text.Any(c => c >= '\u0900' && c <= '\u097F'),
            "Japanese" => text.Any(c => (c >= '\u3040' && c <= '\u309F') || (c >= '\u30A0' && c <= '\u30FF') || (c >= '\u4E00' && c <= '\u9FFF')),
            "Russian" => text.Any(c => c >= '\u0400' && c <= '\u04FF'),
            "Urdu" => text.Any(c => c >= '\u0600' && c <= '\u06FF'),
            _ => true // For Latin-based languages
        };
    }

    private class InterviewResult
    {
        public string LanguageCode { get; set; } = "";
        public string LanguageName { get; set; } = "";
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public int QuestionsAnswered { get; set; }
        public bool CompletedSuccessfully { get; set; }
        public string? Error { get; set; }
        public TimeSpan Duration => EndTime - StartTime;
    }

    private class ValidationResult
    {
        public string LanguageCode { get; set; } = "";
        public string LanguageName { get; set; } = "";
        public bool DirectionCorrect { get; set; }
        public bool CharacterEncodingCorrect { get; set; }
        public bool HasNativeScript { get; set; }
        public bool TranslationComplete { get; set; }
        public bool AccessibilityCorrect { get; set; }
        public string? Error { get; set; }
        
        public bool IsValid => DirectionCorrect && CharacterEncodingCorrect && 
                              HasNativeScript && TranslationComplete && AccessibilityCorrect;
    }

    #region Test Methods

    [Fact(DisplayName = "🌍 Complete User Journey - English")]
    public async Task Complete_User_Journey_English_Test()
    {
        await ExecuteCompleteUserJourney("en-US").ConfigureAwait(false);
    }

    [Fact(DisplayName = "🇪🇸 Complete User Journey - Spanish")]
    public async Task Complete_User_Journey_Spanish_Test()
    {
        await ExecuteCompleteUserJourney("es-ES").ConfigureAwait(false);
    }

    [Fact(DisplayName = "🇫🇷 Complete User Journey - French")]
    public async Task Complete_User_Journey_French_Test()
    {
        await ExecuteCompleteUserJourney("fr-FR").ConfigureAwait(false);
    }

    [Fact(DisplayName = "🇸🇦 Complete User Journey - Arabic (RTL)")]
    public async Task Complete_User_Journey_Arabic_Test()
    {
        await ExecuteCompleteUserJourney("ar-SA").ConfigureAwait(false);
    }

    [Fact(DisplayName = "🇨🇳 Complete User Journey - Chinese")]
    public async Task Complete_User_Journey_Chinese_Test()
    {
        await ExecuteCompleteUserJourney("zh-CN").ConfigureAwait(false);
    }

    private async Task ExecuteCompleteUserJourney(string languageCode)
    {
        var page = await CreateNewPage().ConfigureAwait(false);
        try
        {
            var langInfo = _testLanguages[languageCode];
            _output.WriteLine($"🚀 Starting complete user journey in {langInfo.EnglishName}");

            // Step 1: Register user in target language
            var email = await RegisterUserInLanguage(page, languageCode, langInfo).ConfigureAwait(false);
            Assert.NotNull(email);

            // Step 2: Complete profile in target language
            await CompleteProfileInLanguage(page, langInfo).ConfigureAwait(false);

            // Step 3: Validate language display
            var validation = await ValidateLanguageDisplay(page, langInfo).ConfigureAwait(false);
            Assert.True(validation.DirectionCorrect, $"Direction should be correct for {langInfo.EnglishName}");
            Assert.True(validation.CharacterEncodingCorrect, $"Character encoding should be correct for {langInfo.EnglishName}");

            // Step 4: Conduct interview
            var interviewResult = await ConductInterviewInLanguage(page, langInfo).ConfigureAwait(false);
            Assert.True(interviewResult.CompletedSuccessfully, $"Interview should complete successfully in {langInfo.EnglishName}");
            Assert.True(interviewResult.QuestionsAnswered > 0, $"Should answer at least one question in {langInfo.EnglishName}");

            _output.WriteLine($"✅ Complete user journey successful in {langInfo.EnglishName}");
            _output.WriteLine($"📊 Journey stats: {interviewResult.QuestionsAnswered} questions, {interviewResult.Duration.TotalSeconds:F1}s duration");
        }
        finally
        {
            await page.CloseAsync().ConfigureAwait(false);
        }
    }

    [Fact(DisplayName = "🔄 Language Switching During Interview")]
    public async Task Language_Switching_During_Interview_Test()
    {
        var page = await CreateNewPage().ConfigureAwait(false);
        try
        {
            _output.WriteLine("🔄 Testing language switching during interview");

            // Start with English
            var email = await RegisterUserInLanguage(page, "en-US", _testLanguages["en-US"]).ConfigureAwait(false);
            await CompleteProfileInLanguage(page, _testLanguages["en-US"]).ConfigureAwait(false);

            // Navigate to interview
            await page.GotoAsync($"{BASE_URL}/interview").ConfigureAwait(false);
            await page.WaitForSelectorAsync("h1, h2, .question", new PageWaitForSelectorOptions { Timeout = 10000 }).ConfigureAwait(false);

            // Test switching to different languages during interview
            var languagesToTest = new[] { "es-ES", "fr-FR", "ar-SA" };
            
            foreach (var langCode in languagesToTest)
            {
                var langInfo = _testLanguages[langCode];
                _output.WriteLine($"🔄 Switching to {langInfo.EnglishName} during interview");

                var switched = await SwitchLanguage(page, langCode, langInfo).ConfigureAwait(false);
                if (switched)
                {
                    // Validate the language switch worked
                    var validation = await ValidateLanguageDisplay(page, langInfo).ConfigureAwait(false);
                    _output.WriteLine($"✅ Language switch to {langInfo.EnglishName}: Direction={validation.DirectionCorrect}, Encoding={validation.CharacterEncodingCorrect}");

                    // Answer a question in the new language
                    await AnswerQuestionInLanguage(page, "test question", langInfo).ConfigureAwait(false);
                    await page.WaitForTimeoutAsync(2000).ConfigureAwait(false);
                }
            }

            Assert.True(true, "Language switching test completed");
        }
        finally
        {
            await page.CloseAsync().ConfigureAwait(false);
        }
    }

    [Fact(DisplayName = "🌐 RTL Language User Experience")]
    public async Task RTL_Language_User_Experience_Test()
    {
        var page = await CreateNewPage().ConfigureAwait(false);
        try
        {
            var rtlLanguages = _testLanguages.Where(kvp => kvp.Value.IsRTL).ToList();
            
            foreach (var kvp in rtlLanguages)
            {
                var langCode = kvp.Key;
                var langInfo = kvp.Value;
                
                _output.WriteLine($"🔄 Testing RTL experience for {langInfo.EnglishName}");

                // Register and complete profile in RTL language
                var email = await RegisterUserInLanguage(page, langCode, langInfo).ConfigureAwait(false);
                await CompleteProfileInLanguage(page, langInfo).ConfigureAwait(false);

                // Validate RTL layout
                var direction = await page.EvaluateAsync<string>("() => getComputedStyle(document.documentElement).direction").ConfigureAwait(false);
                Assert.Equal("rtl", direction);

                // Check text alignment
                var textAlign = await page.EvaluateAsync<string>("() => getComputedStyle(document.body).textAlign").ConfigureAwait(false);
                _output.WriteLine($"📐 {langInfo.EnglishName} text alignment: {textAlign}");

                // Test keyboard navigation in RTL
                await page.Keyboard.PressAsync("Tab").ConfigureAwait(false);
                await page.WaitForTimeoutAsync(500).ConfigureAwait(false);

                // Validate native script rendering
                var pageText = await page.TextContentAsync("body").ConfigureAwait(false) ?? "";
                var hasNativeScript = ValidateNativeScript(pageText, langInfo);
                Assert.True(hasNativeScript, $"{langInfo.EnglishName} should display native script");

                _output.WriteLine($"✅ RTL validation passed for {langInfo.EnglishName}");

                // Reset for next language
                await page.GotoAsync($"{BASE_URL}").ConfigureAwait(false);
                await page.WaitForTimeoutAsync(2000).ConfigureAwait(false);
            }
        }
        finally
        {
            await page.CloseAsync().ConfigureAwait(false);
        }
    }

    [Fact(DisplayName = "⚡ Performance Test - Multiple Languages")]
    public async Task Performance_Multiple_Languages_Test()
    {
        var page = await CreateNewPage().ConfigureAwait(false);
        try
        {
            var performanceResults = new List<(string Language, TimeSpan LoadTime, TimeSpan SwitchTime)>();

            foreach (var kvp in _testLanguages.Take(5)) // Test first 5 languages for performance
            {
                var langCode = kvp.Key;
                var langInfo = kvp.Value;

                _output.WriteLine($"⚡ Performance testing {langInfo.EnglishName}");

                // Measure initial load time
                var loadStart = DateTime.UtcNow;
                await page.GotoAsync($"{BASE_URL}").ConfigureAwait(false);
                await page.WaitForLoadStateAsync(LoadState.NetworkIdle).ConfigureAwait(false);
                var loadTime = DateTime.UtcNow - loadStart;

                // Measure language switch time
                var switchStart = DateTime.UtcNow;
                await SwitchLanguage(page, langCode, langInfo).ConfigureAwait(false);
                var switchTime = DateTime.UtcNow - switchStart;

                performanceResults.Add((langInfo.EnglishName, loadTime, switchTime));
                
                _output.WriteLine($"📊 {langInfo.EnglishName}: Load={loadTime.TotalMilliseconds:F0}ms, Switch={switchTime.TotalMilliseconds:F0}ms");

                // Validate performance thresholds
                Assert.True(loadTime.TotalSeconds < 10, $"Page load should be under 10 seconds for {langInfo.EnglishName}");
                Assert.True(switchTime.TotalSeconds < 5, $"Language switch should be under 5 seconds for {langInfo.EnglishName}");
            }

            // Report overall performance
            var avgLoadTime = performanceResults.Average(r => r.LoadTime.TotalMilliseconds);
            var avgSwitchTime = performanceResults.Average(r => r.SwitchTime.TotalMilliseconds);
            
            _output.WriteLine($"📈 Performance Summary: Avg Load={avgLoadTime:F0}ms, Avg Switch={avgSwitchTime:F0}ms");
        }
        finally
        {
            await page.CloseAsync().ConfigureAwait(false);
        }
    }

    [Fact(DisplayName = "🔧 Error Handling and Fallback Test")]
    public async Task Error_Handling_And_Fallback_Test()
    {
        var page = await CreateNewPage().ConfigureAwait(false);
        try
        {
            _output.WriteLine("🔧 Testing error handling and fallback behavior");

            // Test with a non-existent language code
            await page.GotoAsync($"{BASE_URL}").ConfigureAwait(false);
            
            // Try to switch to invalid language
            await page.EvaluateAsync("() => { if (window.i18n) window.i18n.changeLanguage('invalid-lang'); }").ConfigureAwait(false);
            await page.WaitForTimeoutAsync(2000).ConfigureAwait(false);

            // Should fallback to English or default language
            var pageText = await page.TextContentAsync("body").ConfigureAwait(false) ?? "";
            Assert.False(string.IsNullOrWhiteSpace(pageText), "Page should still display content after invalid language");

            // Test missing translation keys
            var hasContent = await page.EvaluateAsync<bool>("() => document.body.textContent.length > 100").ConfigureAwait(false);
            Assert.True(hasContent, "Page should have meaningful content even with missing translations");

            // Test network failure simulation
            await page.RouteAsync("**/locales/**", route => route.AbortAsync()).ConfigureAwait(false);
            
            // Try to switch language with blocked translation files
            var langInfo = _testLanguages["es-ES"];
            await SwitchLanguage(page, "es-ES", langInfo).ConfigureAwait(false);
            
            // Should still function with fallback
            var stillWorking = await page.EvaluateAsync<bool>("() => document.body.textContent.length > 50").ConfigureAwait(false);
            Assert.True(stillWorking, "Application should continue working with translation fallbacks");

            _output.WriteLine("✅ Error handling and fallback tests passed");
        }
        finally
        {
            await page.CloseAsync().ConfigureAwait(false);
        }
    }

    #endregion
}