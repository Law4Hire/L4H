using Microsoft.Playwright;
using Xunit;
using Xunit.Abstractions;

namespace L4H.UI.E2E.Tests;

/// <summary>
/// Language Switching Workflow Tests
/// 
/// Tests specific language switching scenarios including:
/// - Mid-interview language changes
/// - Language persistence across sessions
/// - Accessibility during language switches
/// - Performance of language switching
/// - Error recovery during language changes
/// </summary>
[Trait("Category", "E2E")]
[Trait("Category", "LanguageSwitching")]
public class LanguageSwitchingWorkflowTests : IClassFixture<PlaywrightFixture>
{
    private readonly PlaywrightFixture _fixture;
    private readonly ITestOutputHelper _output;
    private const string TEST_PASSWORD = "SecureTest123!";
    private const string BASE_URL = "http://localhost:5173";

    // Language switching test scenarios
    private readonly Dictionary<string, LanguageSwitchScenario> _switchScenarios = new()
    {
        ["ltr-to-rtl"] = new("English to Arabic", "en-US", "ar-SA", true),
        ["rtl-to-ltr"] = new("Arabic to English", "ar-SA", "en-US", true),
        ["latin-to-cjk"] = new("English to Chinese", "en-US", "zh-CN", false),
        ["cjk-to-latin"] = new("Chinese to Spanish", "zh-CN", "es-ES", false),
        ["european-switch"] = new("French to German", "fr-FR", "de-DE", false),
        ["indic-switch"] = new("Hindi to Bengali", "hi-IN", "bn-BD", false),
        ["rtl-to-rtl"] = new("Arabic to Urdu", "ar-SA", "ur-PK", true)
    };

    public LanguageSwitchingWorkflowTests(PlaywrightFixture fixture, ITestOutputHelper output)
    {
        _fixture = fixture;
        _output = output;
    }

    private record LanguageSwitchScenario(
        string Description,
        string FromLanguage,
        string ToLanguage,
        bool InvolvesRTL
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

    private async Task<string> SetupTestUser(IPage page)
    {
        var email = $"lang-switch-{Guid.NewGuid().ToString()[..8]}@testing.com";
        
        await page.GotoAsync($"{BASE_URL}/register").ConfigureAwait(false);
        await page.WaitForSelectorAsync("input[name='email']", new PageWaitForSelectorOptions { Timeout = 10000 }).ConfigureAwait(false);

        await page.FillAsync("input[name='email']", email).ConfigureAwait(false);
        await page.FillAsync("input[name='password']", TEST_PASSWORD).ConfigureAwait(false);
        await page.FillAsync("input[name='confirmPassword']", TEST_PASSWORD).ConfigureAwait(false);
        await page.FillAsync("input[name='firstName']", "Test").ConfigureAwait(false);
        await page.FillAsync("input[name='lastName']", "User").ConfigureAwait(false);

        await page.ClickAsync("button[type='submit']").ConfigureAwait(false);
        await page.WaitForURLAsync("**/profile-completion", new PageWaitForURLOptions { Timeout = 30000 }).ConfigureAwait(false);

        // Complete profile quickly
        await page.FillAsync("input[name='streetAddress']", "123 Test St").ConfigureAwait(false);
        await page.FillAsync("input[name='city']", "Test City").ConfigureAwait(false);
        await page.FillAsync("input[name='postalCode']", "12345").ConfigureAwait(false);
        await page.FillAsync("input[name='dateOfBirth']", "1990-01-01").ConfigureAwait(false);
        await page.SelectOptionAsync("select[name='maritalStatus']", "Single").ConfigureAwait(false);
        await page.SelectOptionAsync("select[name='gender']", "Male").ConfigureAwait(false);

        await page.WaitForSelectorAsync("button[type='submit']:not([disabled])", new() { Timeout = 10000 }).ConfigureAwait(false);
        await page.ClickAsync("button[type='submit']").ConfigureAwait(false);
        await page.WaitForTimeoutAsync(3000).ConfigureAwait(false);

        return email;
    }

    private async Task<bool> SwitchToLanguage(IPage page, string languageCode)
    {
        _output.WriteLine($"🔄 Switching to language: {languageCode}");

        var selectors = new[]
        {
            $"[data-language='{languageCode}']",
            $"[data-lang='{languageCode}']",
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
                    _output.WriteLine($"✅ Language switched using: {selector}");
                    return true;
                }
            }
            catch (Exception ex)
            {
                _output.WriteLine($"⚠️ Failed selector {selector}: {ex.Message}");
            }
        }

        // Try JavaScript approach
        try
        {
            await page.EvaluateAsync($"() => {{ if (window.i18n) window.i18n.changeLanguage('{languageCode}'); }}").ConfigureAwait(false);
            await page.WaitForTimeoutAsync(2000).ConfigureAwait(false);
            _output.WriteLine($"✅ Language switched via JavaScript");
            return true;
        }
        catch (Exception ex)
        {
            _output.WriteLine($"❌ JavaScript switch failed: {ex.Message}");
        }

        return false;
    }

    private async Task<LanguageSwitchResult> ValidateLanguageSwitch(IPage page, string fromLang, string toLang)
    {
        var result = new LanguageSwitchResult
        {
            FromLanguage = fromLang,
            ToLanguage = toLang,
            SwitchTime = DateTime.UtcNow
        };

        try
        {
            // Check HTML lang attribute
            var htmlLang = await page.GetAttributeAsync("html", "lang").ConfigureAwait(false);
            result.HtmlLangCorrect = htmlLang == toLang;

            // Check document direction
            var direction = await page.EvaluateAsync<string>("() => getComputedStyle(document.documentElement).direction").ConfigureAwait(false);
            var expectedDirection = IsRTLLanguage(toLang) ? "rtl" : "ltr";
            result.DirectionCorrect = direction == expectedDirection;

            // Check for translation loading
            await page.WaitForTimeoutAsync(1000).ConfigureAwait(false);
            var pageText = await page.TextContentAsync("body").ConfigureAwait(false) ?? "";
            result.ContentLoaded = !string.IsNullOrWhiteSpace(pageText);

            // Check for proper character encoding
            result.CharacterEncodingCorrect = !pageText.Contains("�");

            // Validate native script for target language
            result.NativeScriptPresent = ValidateNativeScript(pageText, toLang);

            // Check accessibility attributes
            var ariaLang = await page.EvaluateAsync<string>("() => document.documentElement.getAttribute('aria-lang') || ''").ConfigureAwait(false);
            result.AccessibilityAttributesCorrect = !string.IsNullOrEmpty(htmlLang);

            result.Success = result.HtmlLangCorrect && result.DirectionCorrect && 
                           result.ContentLoaded && result.CharacterEncodingCorrect;

            _output.WriteLine($"🔍 Switch validation {fromLang}→{toLang}: " +
                $"Lang={result.HtmlLangCorrect}, " +
                $"Dir={result.DirectionCorrect}, " +
                $"Content={result.ContentLoaded}, " +
                $"Encoding={result.CharacterEncodingCorrect}, " +
                $"Script={result.NativeScriptPresent}");
        }
        catch (Exception ex)
        {
            result.Error = ex.Message;
            _output.WriteLine($"❌ Validation error {fromLang}→{toLang}: {ex.Message}");
        }

        return result;
    }

    private bool IsRTLLanguage(string languageCode)
    {
        return languageCode switch
        {
            "ar-SA" or "ur-PK" or "ar" or "ur" => true,
            _ => false
        };
    }

    private bool ValidateNativeScript(string text, string languageCode)
    {
        return languageCode switch
        {
            "ar-SA" or "ur-PK" => text.Any(c => c >= '\u0600' && c <= '\u06FF'),
            "zh-CN" => text.Any(c => c >= '\u4E00' && c <= '\u9FFF'),
            "hi-IN" => text.Any(c => c >= '\u0900' && c <= '\u097F'),
            "bn-BD" => text.Any(c => c >= '\u0980' && c <= '\u09FF'),
            "ja-JP" => text.Any(c => (c >= '\u3040' && c <= '\u309F') || (c >= '\u30A0' && c <= '\u30FF') || (c >= '\u4E00' && c <= '\u9FFF')),
            "ru-RU" => text.Any(c => c >= '\u0400' && c <= '\u04FF'),
            _ => true // Latin-based languages
        };
    }

    private async Task<InterviewSwitchResult> TestLanguageSwitchDuringInterview(IPage page, string fromLang, string toLang)
    {
        var result = new InterviewSwitchResult
        {
            FromLanguage = fromLang,
            ToLanguage = toLang,
            StartTime = DateTime.UtcNow
        };

        try
        {
            // Navigate to interview
            await page.GotoAsync($"{BASE_URL}/interview").ConfigureAwait(false);
            await page.WaitForSelectorAsync("h1, h2, .question", new PageWaitForSelectorOptions { Timeout = 10000 }).ConfigureAwait(false);

            // Set initial language
            await SwitchToLanguage(page, fromLang).ConfigureAwait(false);
            await page.WaitForTimeoutAsync(2000).ConfigureAwait(false);

            // Answer first question in original language
            var firstQuestion = await page.TextContentAsync("h1, h2, .question").ConfigureAwait(false) ?? "";
            result.FirstQuestionText = firstQuestion.Substring(0, Math.Min(100, firstQuestion.Length));

            // Try to answer the question
            var answered = await AnswerCurrentQuestion(page).ConfigureAwait(false);
            result.FirstQuestionAnswered = answered;

            if (answered)
            {
                await page.WaitForTimeoutAsync(2000).ConfigureAwait(false);

                // Switch language mid-interview
                var switchStart = DateTime.UtcNow;
                var switched = await SwitchToLanguage(page, toLang).ConfigureAwait(false);
                var switchDuration = DateTime.UtcNow - switchStart;
                
                result.LanguageSwitched = switched;
                result.SwitchDuration = switchDuration;

                if (switched)
                {
                    // Validate the switch
                    var validation = await ValidateLanguageSwitch(page, fromLang, toLang).ConfigureAwait(false);
                    result.SwitchValidation = validation;

                    // Try to continue interview in new language
                    await page.WaitForTimeoutAsync(2000).ConfigureAwait(false);
                    var secondQuestion = await page.TextContentAsync("h1, h2, .question").ConfigureAwait(false) ?? "";
                    result.SecondQuestionText = secondQuestion.Substring(0, Math.Min(100, secondQuestion.Length));

                    var continuedAnswering = await AnswerCurrentQuestion(page).ConfigureAwait(false);
                    result.ContinuedInNewLanguage = continuedAnswering;

                    result.Success = validation.Success && continuedAnswering;
                }
            }

            result.EndTime = DateTime.UtcNow;
        }
        catch (Exception ex)
        {
            result.Error = ex.Message;
            result.EndTime = DateTime.UtcNow;
            _output.WriteLine($"❌ Interview switch test failed {fromLang}→{toLang}: {ex.Message}");
        }

        return result;
    }

    private async Task<bool> AnswerCurrentQuestion(IPage page)
    {
        try
        {
            // Look for answer options
            var buttons = await page.QuerySelectorAllAsync("button:not([disabled]), [role='button']:not([disabled])").ConfigureAwait(false);
            
            foreach (var button in buttons)
            {
                var buttonText = await button.TextContentAsync().ConfigureAwait(false) ?? "";
                if (!string.IsNullOrWhiteSpace(buttonText) && 
                    !buttonText.ToLower().Contains("skip") &&
                    !buttonText.ToLower().Contains("language") &&
                    buttonText.Length > 2)
                {
                    await button.ClickAsync().ConfigureAwait(false);
                    _output.WriteLine($"🔘 Answered with: {buttonText}");
                    return true;
                }
            }

            // Try input fields
            var inputs = await page.QuerySelectorAllAsync("input[type='text'], input[type='number'], textarea").ConfigureAwait(false);
            if (inputs.Count > 0)
            {
                await inputs[0].FillAsync("Test Answer").ConfigureAwait(false);
                
                // Look for submit/next button
                var submitButton = await page.QuerySelectorAsync("button[type='submit'], button:has-text('Next'), button:has-text('Continue')").ConfigureAwait(false);
                if (submitButton != null)
                {
                    await submitButton.ClickAsync().ConfigureAwait(false);
                    _output.WriteLine($"✏️ Filled input and submitted");
                    return true;
                }
            }

            return false;
        }
        catch (Exception ex)
        {
            _output.WriteLine($"⚠️ Could not answer question: {ex.Message}");
            return false;
        }
    }

    private class LanguageSwitchResult
    {
        public string FromLanguage { get; set; } = "";
        public string ToLanguage { get; set; } = "";
        public DateTime SwitchTime { get; set; }
        public bool HtmlLangCorrect { get; set; }
        public bool DirectionCorrect { get; set; }
        public bool ContentLoaded { get; set; }
        public bool CharacterEncodingCorrect { get; set; }
        public bool NativeScriptPresent { get; set; }
        public bool AccessibilityAttributesCorrect { get; set; }
        public bool Success { get; set; }
        public string? Error { get; set; }
    }

    private class InterviewSwitchResult
    {
        public string FromLanguage { get; set; } = "";
        public string ToLanguage { get; set; } = "";
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public string FirstQuestionText { get; set; } = "";
        public bool FirstQuestionAnswered { get; set; }
        public bool LanguageSwitched { get; set; }
        public TimeSpan SwitchDuration { get; set; }
        public LanguageSwitchResult? SwitchValidation { get; set; }
        public string SecondQuestionText { get; set; } = "";
        public bool ContinuedInNewLanguage { get; set; }
        public bool Success { get; set; }
        public string? Error { get; set; }
        public TimeSpan TotalDuration => EndTime - StartTime;
    }

    #region Test Methods

    [Fact(DisplayName = "🔄 LTR to RTL Language Switch")]
    public async Task LTR_To_RTL_Language_Switch_Test()
    {
        var page = await CreateNewPage().ConfigureAwait(false);
        try
        {
            var scenario = _switchScenarios["ltr-to-rtl"];
            _output.WriteLine($"🔄 Testing {scenario.Description}");

            await SetupTestUser(page).ConfigureAwait(false);

            // Start with English
            await SwitchToLanguage(page, scenario.FromLanguage).ConfigureAwait(false);
            var initialValidation = await ValidateLanguageSwitch(page, "", scenario.FromLanguage).ConfigureAwait(false);
            Assert.True(initialValidation.Success, $"Initial language setup should succeed");

            // Switch to Arabic
            await SwitchToLanguage(page, scenario.ToLanguage).ConfigureAwait(false);
            var switchValidation = await ValidateLanguageSwitch(page, scenario.FromLanguage, scenario.ToLanguage).ConfigureAwait(false);
            
            Assert.True(switchValidation.Success, $"Language switch from {scenario.FromLanguage} to {scenario.ToLanguage} should succeed");
            Assert.True(switchValidation.DirectionCorrect, "RTL direction should be applied");
            Assert.True(switchValidation.HtmlLangCorrect, "HTML lang attribute should be updated");

            _output.WriteLine($"✅ {scenario.Description} completed successfully");
        }
        finally
        {
            await page.CloseAsync().ConfigureAwait(false);
        }
    }

    [Fact(DisplayName = "🔄 RTL to LTR Language Switch")]
    public async Task RTL_To_LTR_Language_Switch_Test()
    {
        var page = await CreateNewPage().ConfigureAwait(false);
        try
        {
            var scenario = _switchScenarios["rtl-to-ltr"];
            _output.WriteLine($"🔄 Testing {scenario.Description}");

            await SetupTestUser(page).ConfigureAwait(false);

            // Start with Arabic
            await SwitchToLanguage(page, scenario.FromLanguage).ConfigureAwait(false);
            var initialValidation = await ValidateLanguageSwitch(page, "", scenario.FromLanguage).ConfigureAwait(false);
            Assert.True(initialValidation.DirectionCorrect, "Initial RTL direction should be correct");

            // Switch to English
            await SwitchToLanguage(page, scenario.ToLanguage).ConfigureAwait(false);
            var switchValidation = await ValidateLanguageSwitch(page, scenario.FromLanguage, scenario.ToLanguage).ConfigureAwait(false);
            
            Assert.True(switchValidation.Success, $"Language switch from {scenario.FromLanguage} to {scenario.ToLanguage} should succeed");
            Assert.True(switchValidation.DirectionCorrect, "LTR direction should be applied");

            _output.WriteLine($"✅ {scenario.Description} completed successfully");
        }
        finally
        {
            await page.CloseAsync().ConfigureAwait(false);
        }
    }

    [Fact(DisplayName = "🔄 CJK Language Switch")]
    public async Task CJK_Language_Switch_Test()
    {
        var page = await CreateNewPage().ConfigureAwait(false);
        try
        {
            var scenario = _switchScenarios["latin-to-cjk"];
            _output.WriteLine($"🔄 Testing {scenario.Description}");

            await SetupTestUser(page).ConfigureAwait(false);

            // Switch to Chinese
            await SwitchToLanguage(page, scenario.ToLanguage).ConfigureAwait(false);
            var switchValidation = await ValidateLanguageSwitch(page, scenario.FromLanguage, scenario.ToLanguage).ConfigureAwait(false);
            
            Assert.True(switchValidation.Success, $"Language switch to {scenario.ToLanguage} should succeed");
            Assert.True(switchValidation.CharacterEncodingCorrect, "Chinese characters should display correctly");
            
            if (switchValidation.NativeScriptPresent)
            {
                _output.WriteLine("✅ Chinese characters detected in content");
            }

            _output.WriteLine($"✅ {scenario.Description} completed successfully");
        }
        finally
        {
            await page.CloseAsync().ConfigureAwait(false);
        }
    }

    [Fact(DisplayName = "🎤 Language Switch During Interview")]
    public async Task Language_Switch_During_Interview_Test()
    {
        var page = await CreateNewPage().ConfigureAwait(false);
        try
        {
            _output.WriteLine("🎤 Testing language switch during interview");

            await SetupTestUser(page).ConfigureAwait(false);

            // Test multiple language switches during interview
            var testCases = new[]
            {
                ("en-US", "es-ES"),
                ("es-ES", "fr-FR"),
                ("fr-FR", "ar-SA")
            };

            foreach (var (fromLang, toLang) in testCases)
            {
                _output.WriteLine($"🔄 Testing interview switch: {fromLang} → {toLang}");

                var result = await TestLanguageSwitchDuringInterview(page, fromLang, toLang).ConfigureAwait(false);
                
                Assert.True(result.FirstQuestionAnswered, $"Should answer first question in {fromLang}");
                
                if (result.LanguageSwitched)
                {
                    Assert.True(result.SwitchValidation?.Success ?? false, $"Language switch to {toLang} should be valid");
                    Assert.True(result.ContinuedInNewLanguage, $"Should continue interview in {toLang}");
                    
                    _output.WriteLine($"✅ Interview switch {fromLang}→{toLang}: " +
                        $"Duration={result.SwitchDuration.TotalMilliseconds:F0}ms, " +
                        $"Continued={result.ContinuedInNewLanguage}");
                }
                else
                {
                    _output.WriteLine($"⚠️ Could not switch language from {fromLang} to {toLang}");
                }

                // Small delay between test cases
                await page.WaitForTimeoutAsync(1000).ConfigureAwait(false);
            }
        }
        finally
        {
            await page.CloseAsync().ConfigureAwait(false);
        }
    }

    [Fact(DisplayName = "💾 Language Persistence Test")]
    public async Task Language_Persistence_Test()
    {
        var page = await CreateNewPage().ConfigureAwait(false);
        try
        {
            _output.WriteLine("💾 Testing language persistence across page reloads");

            await SetupTestUser(page).ConfigureAwait(false);

            // Switch to Spanish
            await SwitchToLanguage(page, "es-ES").ConfigureAwait(false);
            var initialValidation = await ValidateLanguageSwitch(page, "en-US", "es-ES").ConfigureAwait(false);
            Assert.True(initialValidation.Success, "Initial language switch should succeed");

            // Reload the page
            await page.ReloadAsync().ConfigureAwait(false);
            await page.WaitForLoadStateAsync(LoadState.NetworkIdle).ConfigureAwait(false);

            // Check if language persisted
            var htmlLang = await page.GetAttributeAsync("html", "lang").ConfigureAwait(false);
            var persistedCorrectly = htmlLang == "es-ES";

            if (persistedCorrectly)
            {
                _output.WriteLine("✅ Language persisted correctly after page reload");
            }
            else
            {
                _output.WriteLine($"⚠️ Language did not persist. Expected: es-ES, Got: {htmlLang}");
            }

            // Test navigation persistence
            await page.GotoAsync($"{BASE_URL}/interview").ConfigureAwait(false);
            await page.WaitForLoadStateAsync(LoadState.NetworkIdle).ConfigureAwait(false);

            var navHtmlLang = await page.GetAttributeAsync("html", "lang").ConfigureAwait(false);
            var navigationPersisted = navHtmlLang == "es-ES";

            if (navigationPersisted)
            {
                _output.WriteLine("✅ Language persisted correctly across navigation");
            }
            else
            {
                _output.WriteLine($"⚠️ Language did not persist across navigation. Expected: es-ES, Got: {navHtmlLang}");
            }

            // At least one persistence method should work
            Assert.True(persistedCorrectly || navigationPersisted, "Language should persist either across reloads or navigation");
        }
        finally
        {
            await page.CloseAsync().ConfigureAwait(false);
        }
    }

    [Fact(DisplayName = "⚡ Language Switch Performance Test")]
    public async Task Language_Switch_Performance_Test()
    {
        var page = await CreateNewPage().ConfigureAwait(false);
        try
        {
            _output.WriteLine("⚡ Testing language switch performance");

            await SetupTestUser(page).ConfigureAwait(false);

            var performanceResults = new List<(string Switch, TimeSpan Duration, bool Success)>();
            var languages = new[] { "en-US", "es-ES", "fr-FR", "de-DE", "ar-SA", "zh-CN" };

            for (int i = 0; i < languages.Length - 1; i++)
            {
                var fromLang = languages[i];
                var toLang = languages[i + 1];

                _output.WriteLine($"⚡ Performance test: {fromLang} → {toLang}");

                var startTime = DateTime.UtcNow;
                var switched = await SwitchToLanguage(page, toLang).ConfigureAwait(false);
                var switchDuration = DateTime.UtcNow - startTime;

                if (switched)
                {
                    var validation = await ValidateLanguageSwitch(page, fromLang, toLang).ConfigureAwait(false);
                    performanceResults.Add(($"{fromLang}→{toLang}", switchDuration, validation.Success));
                    
                    _output.WriteLine($"📊 {fromLang}→{toLang}: {switchDuration.TotalMilliseconds:F0}ms, Success={validation.Success}");
                }
                else
                {
                    performanceResults.Add(($"{fromLang}→{toLang}", switchDuration, false));
                    _output.WriteLine($"❌ {fromLang}→{toLang}: Failed to switch");
                }

                // Performance assertion
                Assert.True(switchDuration.TotalSeconds < 5, $"Language switch should complete within 5 seconds");
            }

            // Overall performance summary
            var successfulSwitches = performanceResults.Where(r => r.Success).ToList();
            if (successfulSwitches.Any())
            {
                var avgDuration = successfulSwitches.Average(r => r.Duration.TotalMilliseconds);
                var maxDuration = successfulSwitches.Max(r => r.Duration.TotalMilliseconds);
                
                _output.WriteLine($"📈 Performance Summary: Avg={avgDuration:F0}ms, Max={maxDuration:F0}ms, Success Rate={successfulSwitches.Count}/{performanceResults.Count}");
                
                Assert.True(avgDuration < 3000, "Average language switch time should be under 3 seconds");
            }
        }
        finally
        {
            await page.CloseAsync().ConfigureAwait(false);
        }
    }

    [Fact(DisplayName = "♿ Accessibility During Language Switch")]
    public async Task Accessibility_During_Language_Switch_Test()
    {
        var page = await CreateNewPage().ConfigureAwait(false);
        try
        {
            _output.WriteLine("♿ Testing accessibility during language switches");

            await SetupTestUser(page).ConfigureAwait(false);

            // Test accessibility attributes during language switches
            var testLanguages = new[] { "en-US", "es-ES", "ar-SA", "zh-CN" };

            foreach (var lang in testLanguages)
            {
                _output.WriteLine($"♿ Testing accessibility for {lang}");

                await SwitchToLanguage(page, lang).ConfigureAwait(false);
                await page.WaitForTimeoutAsync(1000).ConfigureAwait(false);

                // Check HTML lang attribute
                var htmlLang = await page.GetAttributeAsync("html", "lang").ConfigureAwait(false);
                Assert.Equal(lang, htmlLang);

                // Check document direction
                var direction = await page.EvaluateAsync<string>("() => getComputedStyle(document.documentElement).direction").ConfigureAwait(false);
                var expectedDirection = IsRTLLanguage(lang) ? "rtl" : "ltr";
                Assert.Equal(expectedDirection, direction);

                // Test keyboard navigation
                await page.Keyboard.PressAsync("Tab").ConfigureAwait(false);
                await page.WaitForTimeoutAsync(500).ConfigureAwait(false);

                // Check for ARIA attributes
                var ariaElements = await page.QuerySelectorAllAsync("[aria-label], [aria-describedby], [role]").ConfigureAwait(false);
                _output.WriteLine($"♿ {lang}: Found {ariaElements.Count} elements with ARIA attributes");

                // Test screen reader announcements (basic check)
                var liveRegions = await page.QuerySelectorAllAsync("[aria-live], [role='status'], [role='alert']").ConfigureAwait(false);
                _output.WriteLine($"♿ {lang}: Found {liveRegions.Count} live regions for announcements");

                _output.WriteLine($"✅ Accessibility validation passed for {lang}");
            }
        }
        finally
        {
            await page.CloseAsync().ConfigureAwait(false);
        }
    }

    [Fact(DisplayName = "🔧 Error Recovery During Language Switch")]
    public async Task Error_Recovery_During_Language_Switch_Test()
    {
        var page = await CreateNewPage().ConfigureAwait(false);
        try
        {
            _output.WriteLine("🔧 Testing error recovery during language switches");

            await SetupTestUser(page).ConfigureAwait(false);

            // Test 1: Block translation file requests
            await page.RouteAsync("**/locales/**", route => route.AbortAsync()).ConfigureAwait(false);

            // Try to switch language with blocked resources
            var switchedWithError = await SwitchToLanguage(page, "es-ES").ConfigureAwait(false);
            
            // Application should still function
            var pageText = await page.TextContentAsync("body").ConfigureAwait(false) ?? "";
            Assert.True(pageText.Length > 100, "Page should still have content despite translation loading errors");

            // Test 2: Unblock resources and try again
            await page.UnrouteAsync("**/locales/**").ConfigureAwait(false);
            
            await page.WaitForTimeoutAsync(2000).ConfigureAwait(false);
            var recoveredSwitch = await SwitchToLanguage(page, "fr-FR").ConfigureAwait(false);
            
            if (recoveredSwitch)
            {
                var validation = await ValidateLanguageSwitch(page, "es-ES", "fr-FR").ConfigureAwait(false);
                _output.WriteLine($"✅ Recovered from error: Switch successful={validation.Success}");
            }

            // Test 3: Invalid language code
            await page.EvaluateAsync("() => { if (window.i18n) window.i18n.changeLanguage('invalid-lang'); }").ConfigureAwait(false);
            await page.WaitForTimeoutAsync(2000).ConfigureAwait(false);

            // Should fallback gracefully
            var fallbackText = await page.TextContentAsync("body").ConfigureAwait(false) ?? "";
            Assert.True(fallbackText.Length > 50, "Should fallback gracefully with invalid language code");

            _output.WriteLine("✅ Error recovery tests completed");
        }
        finally
        {
            await page.CloseAsync().ConfigureAwait(false);
        }
    }

    #endregion
}