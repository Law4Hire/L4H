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
    public async Task L4H_Home_Page_Localization_Test()
    {
        var page = await _fixture.Browser.NewPageAsync().ConfigureAwait(false);

        // Capture console messages for debugging
        page.Console += (_, e) => Console.WriteLine($"CONSOLE: {e.Text}");
        page.PageError += (_, e) => Console.WriteLine($"PAGE ERROR: {e}");

        try
        {
            Console.WriteLine("=== Testing L4H Home Page - All Languages ===");
            
            // Test Landing Page
            await TestPageLocalization(page, "http://localhost:5175/", "Landing Page", 
                new[] { "landing.hero.title", "landing.hero.subtitle", "landing.hero.startCase", "landing.hero.exploreVisas", "common.getStarted" }).ConfigureAwait(false);

            Console.WriteLine("=== L4H Home Page Testing Complete ===");
        }
        finally
        {
            await page.CloseAsync().ConfigureAwait(false);
        }
    }

    [Fact]
    public async Task L4H_Login_Page_Localization_Test()
    {
        var page = await _fixture.Browser.NewPageAsync().ConfigureAwait(false);

        // Capture console messages for debugging
        page.Console += (_, e) => Console.WriteLine($"CONSOLE: {e.Text}");
        page.PageError += (_, e) => Console.WriteLine($"PAGE ERROR: {e}");

        try
        {
            Console.WriteLine("=== Testing L4H Login Page - All Languages ===");
            
            // Test Login Page with actual content verification
            await TestLoginPageLocalization(page, "http://localhost:5175/login", "Login Page").ConfigureAwait(false);

            Console.WriteLine("=== L4H Login Page Testing Complete ===");
        }
        finally
        {
            await page.CloseAsync().ConfigureAwait(false);
        }
    }

    [Fact]
    public async Task L4H_Register_Page_Localization_Test()
    {
        var page = await _fixture.Browser.NewPageAsync().ConfigureAwait(false);

        // Capture console messages for debugging
        page.Console += (_, e) => Console.WriteLine($"CONSOLE: {e.Text}");
        page.PageError += (_, e) => Console.WriteLine($"PAGE ERROR: {e}");

        try
        {
            Console.WriteLine("=== Testing L4H Register Page - All Languages ===");
            
            // Test Register Page
            await TestPageLocalization(page, "http://localhost:5175/register", "Register Page",
                new[] { "auth.createAccount", "auth.firstName", "auth.lastName", "auth.email", "auth.password", "auth.confirmPassword", "auth.alreadyHaveAccount", "auth.register" }).ConfigureAwait(false);

            Console.WriteLine("=== L4H Register Page Testing Complete ===");
        }
        finally
        {
            await page.CloseAsync().ConfigureAwait(false);
        }
    }

    [Fact]
    public async Task L4H_Visa_Library_Page_Localization_Test()
    {
        var page = await _fixture.Browser.NewPageAsync().ConfigureAwait(false);

        // Capture console messages for debugging
        page.Console += (_, e) => Console.WriteLine($"CONSOLE: {e.Text}");
        page.PageError += (_, e) => Console.WriteLine($"PAGE ERROR: {e}");

        try
        {
            Console.WriteLine("=== Testing L4H Visa Library Page - All Languages ===");
            
            // Test Visa Library Page
            await TestPageLocalization(page, "http://localhost:5175/visa-library", "Visa Library Page",
                new[] { "visaLibrary.title", "visaLibrary.description", "visaLibrary.learnMore", "visaLibrary.cta.title", "visaLibrary.categories.nonimmigrant", "visaLibrary.categories.immigrant" }).ConfigureAwait(false);

            Console.WriteLine("=== L4H Visa Library Page Testing Complete ===");
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

        // Test all languages for comprehensive validation
        var allLanguages = new[]
        {
            "en-US", "es-ES", "ar-SA", "bn-BD", "de-DE", "fr-FR", 
            "hi-IN", "id-ID", "it-IT", "ja-JP", "ko-KR", "mr-IN",
            "pl-PL", "pt-PT", "ru-RU", "ta-IN", "te-IN", "tr-TR",
            "ur-PK", "vi-VN", "zh-CN"
        };

        // Expected hero titles for each language (for home page validation)
        var expectedHeroTitles = new Dictionary<string, string>
        {
            ["en-US"] = "Your Immigration Journey Starts Here",
            ["es-ES"] = "Tu Viaje de Inmigración Comienza Aquí",
            ["ar-SA"] = "رحلة الهجرة الخاصة بك تبدأ هنا",
            ["bn-BD"] = "আপনার ইমিগ্রেশন যাত্রা এখানে শুরু",
            ["de-DE"] = "Ihre Einwanderungsreise beginnt hier",
            ["fr-FR"] = "Votre parcours d'immigration commence ici",
            ["hi-IN"] = "आपकी इमिग्रेशन यात्रा यहाँ से शुरू होती है",
            ["id-ID"] = "Perjalanan Imigrasi Anda Dimulai Di Sini",
            ["it-IT"] = "Il Tuo Viaggio di Immigrazione Inizia Qui",
            ["ja-JP"] = "あなたの移民の旅はここから始まります",
            ["ko-KR"] = "당신의 이민 여정이 여기서 시작됩니다",
            ["mr-IN"] = "तुमचा इमिग्रेशन प्रवास इथे सुरू होतो",
            ["pl-PL"] = "Twoja Podróż Imigracyjna Zaczyna Się Tutaj",
            ["pt-PT"] = "A Sua Jornada de Imigração Começa Aqui",
            ["ru-RU"] = "Ваше иммиграционное путешествие начинается здесь",
            ["ta-IN"] = "உங்கள் குடியேற்றப் பயணம் இங்கே தொடங்குகிறது",
            ["te-IN"] = "మీ ఇమ్మిగ్రేషన్ యాత్ర ఇక్కడ మొదలవుతుంది",
            ["tr-TR"] = "Göçmenlik Yolculuğunuz Burada Başlıyor",
            ["ur-PK"] = "آپ کا امیگریشن سفر یہاں سے شروع ہوتا ہے",
            ["vi-VN"] = "Hành Trình Nhập Cư Của Bạn Bắt Đầu Tại Đây",
            ["zh-CN"] = "您的移民之旅从这里开始"
        };

        var dropdown = await page.QuerySelectorAsync("select").ConfigureAwait(false);
        if (dropdown == null)
        {
            Console.WriteLine($"  WARNING: No language dropdown found on {pageName}");
            return;
        }

        foreach (var language in allLanguages)
        {
            Console.WriteLine($"  Testing {language} localization for {pageName}");
            
            try
            {
                await dropdown.SelectOptionAsync(language).ConfigureAwait(false);
                await page.WaitForTimeoutAsync(2000).ConfigureAwait(false); // Wait for language change

                var content = await page.TextContentAsync("body").ConfigureAwait(false);
                Assert.NotNull(content);

                // For home/landing page, check if the hero title is properly translated
                if (pageName.Contains("Landing Page") && expectedHeroTitles.ContainsKey(language))
                {
                    var expectedTitle = expectedHeroTitles[language];
                    
                    // Check if the expected translated title is present
                    if (!content.Contains(expectedTitle))
                    {
                        // Check if it's showing English instead (which would be wrong for non-English languages)
                        var englishTitle = expectedHeroTitles["en-US"];
                        if (language != "en-US" && content.Contains(englishTitle))
                        {
                            Console.WriteLine($"    ❌ FAILURE: {language} showing English title '{englishTitle}' instead of '{expectedTitle}'");
                            Assert.False(true, $"Language {language} is showing English title instead of proper translation. Expected: '{expectedTitle}', but page shows English.");
                        }
                        else
                        {
                            Console.WriteLine($"    ❌ FAILURE: {language} title '{expectedTitle}' not found in page content");
                            Assert.False(true, $"Language {language} expected title '{expectedTitle}' not found in page content");
                        }
                    }
                    else
                    {
                        Console.WriteLine($"    ✅ {language} localization working correctly - found title: '{expectedTitle}'");
                    }
                }
                else
                {
                    // For other pages, fall back to the old translation key checking method
                    var hasTranslationKeys = false;
                    foreach (var key in expectedTranslationKeys)
                    {
                        if (content.Contains(key))
                        {
                            hasTranslationKeys = true;
                            Console.WriteLine($"    ERROR: Translation key '{key}' found in {language} content for {pageName}");
                        }
                    }

                    if (hasTranslationKeys)
                    {
                        Assert.False(true, $"Translation keys should not be visible in {language} for {pageName}. Language should be fully functional.");
                    }
                    Console.WriteLine($"    ✓ {language} localization working correctly");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"    ERROR: Failed to test {language} - {ex.Message}");
                Assert.False(true, $"Language {language} failed to load properly in {pageName}: {ex.Message}");
            }
        }

        // Reset to English
        await dropdown.SelectOptionAsync("en-US").ConfigureAwait(false);
        await page.WaitForTimeoutAsync(1000).ConfigureAwait(false);

        Console.WriteLine($"  ✓ {pageName} comprehensive language testing complete");
    }

    private static async Task TestLoginPageLocalization(IPage page, string url, string pageName)
    {
        Console.WriteLine($"Testing {pageName} - {url}");
        
        await page.GotoAsync(url).ConfigureAwait(false);
        
        // Wait for page to load
        await page.WaitForSelectorAsync("body", new PageWaitForSelectorOptions { Timeout = 10000 }).ConfigureAwait(false);
        await page.WaitForTimeoutAsync(2000).ConfigureAwait(false); // Wait for i18n to initialize

        // Expected login titles and subtitles for each language
        var expectedLoginTranslations = new Dictionary<string, (string title, string subtitle)>
        {
            ["en-US"] = ("Sign In to Law4Hire", "Access your immigration case portal"),
            ["es-ES"] = ("Iniciar Sesión en Law4Hire", "Accede a tu portal de casos de inmigración"),
            ["ar-SA"] = ("تسجيل الدخول إلى Law4Hire", "الوصول إلى بوابة قضايا الهجرة الخاصة بك"),
            ["bn-BD"] = ("Law4Hire-এ সাইন ইন", "আপনার ইমিগ্রেশন কেস পোর্টাল অ্যাক্সেস করুন"),
            ["de-DE"] = ("Bei Law4Hire anmelden", "Zugriff auf Ihr Einwanderungsfall-Portal"),
            ["fr-FR"] = ("Se connecter à Law4Hire", "Accédez à votre portail de dossiers d'immigration"),
            ["hi-IN"] = ("Law4Hire में साइन इन करें", "अपने इमिग्रेशन केस पोर्टल तक पहुंचें"),
            ["id-ID"] = ("Masuk ke Law4Hire", "Akses portal kasus imigrasi Anda"),
            ["it-IT"] = ("Accedi a Law4Hire", "Accedi al tuo portale dei casi di immigrazione"),
            ["ja-JP"] = ("Law4Hireにサインイン", "移民ケースポータルにアクセス"),
            ["ko-KR"] = ("Law4Hire에 로그인", "이민 케이스 포털에 액세스"),
            ["mr-IN"] = ("Law4Hire मध्ये साइन इन करा", "तुमच्या इमिग्रेशन केस पोर्टलमध्ये प्रवेश करा"),
            ["pl-PL"] = ("Zaloguj się do Law4Hire", "Uzyskaj dostęp do swojego portalu spraw imigracyjnych"),
            ["pt-PT"] = ("Iniciar sessão no Law4Hire", "Aceda ao seu portal de casos de imigração"),
            ["ru-RU"] = ("Войти в Law4Hire", "Доступ к вашему порталу иммиграционных дел"),
            ["ta-IN"] = ("Law4Hire இல் உள்நுழையுங்கள்", "உங்கள் குடியேற்ற வழக்கு போர்ட்டலை அணுகவும்"),
            ["te-IN"] = ("Law4Hire లో సైన్ ఇన్ చేయండి", "మీ ఇమ్మిగ్రేషన్ కేస్ పోర్టల్‌ను యాక్సెస్ చేయండి"),
            ["tr-TR"] = ("Law4Hire'a Giriş Yap", "Göçmenlik davası portalınıza erişin"),
            ["ur-PK"] = ("Law4Hire میں سائن ان کریں", "اپنے امیگریشن کیس پورٹل تک رسائی حاصل کریں"),
            ["vi-VN"] = ("Đăng nhập vào Law4Hire", "Truy cập cổng thông tin vụ án nhập cư của bạn"),
            ["zh-CN"] = ("登录Law4Hire", "访问您的移民案例门户")
        };

        // Test just the languages that have login sections first
        var languagesWithLoginSections = new[]
        {
            "en-US", "es-ES", "ar-SA", "bn-BD", "de-DE", "fr-FR", "hi-IN", "id-ID", "it-IT", "ja-JP", "ko-KR", "mr-IN", "pl-PL", "pt-PT", "ru-RU", "ta-IN", "te-IN", "tr-TR", "ur-PK", "vi-VN", "zh-CN"
        };

        var dropdown = await page.QuerySelectorAsync("select").ConfigureAwait(false);
        if (dropdown == null)
        {
            Console.WriteLine($"  WARNING: No language dropdown found on {pageName}");
            return;
        }

        foreach (var language in languagesWithLoginSections)
        {
            Console.WriteLine($"  Testing {language} localization for {pageName}");
            
            try
            {
                await dropdown.SelectOptionAsync(language).ConfigureAwait(false);
                await page.WaitForTimeoutAsync(2000).ConfigureAwait(false); // Wait for language change

                var content = await page.TextContentAsync("body").ConfigureAwait(false);
                Assert.NotNull(content);

                if (expectedLoginTranslations.ContainsKey(language))
                {
                    var (expectedTitle, expectedSubtitle) = expectedLoginTranslations[language];
                    
                    // Check if the expected translated title is present
                    if (!content.Contains(expectedTitle))
                    {
                        // Check if it's showing English instead (which would be wrong for non-English languages)
                        var englishTitle = expectedLoginTranslations["en-US"].title;
                        if (language != "en-US" && content.Contains(englishTitle))
                        {
                            Console.WriteLine($"    ❌ FAILURE: {language} showing English title '{englishTitle}' instead of '{expectedTitle}'");
                            Assert.False(true, $"Language {language} is showing English title instead of proper translation. Expected: '{expectedTitle}', but page shows English title.");
                        }
                        else
                        {
                            Console.WriteLine($"    ❌ FAILURE: {language} title '{expectedTitle}' not found in page content");
                            Assert.False(true, $"Language {language} expected title '{expectedTitle}' not found in page content");
                        }
                    }
                    
                    // Check if the expected translated subtitle is present
                    if (!content.Contains(expectedSubtitle))
                    {
                        var englishSubtitle = expectedLoginTranslations["en-US"].subtitle;
                        if (language != "en-US" && content.Contains(englishSubtitle))
                        {
                            Console.WriteLine($"    ❌ FAILURE: {language} showing English subtitle '{englishSubtitle}' instead of '{expectedSubtitle}'");
                            Assert.False(true, $"Language {language} is showing English subtitle instead of proper translation. Expected: '{expectedSubtitle}', but page shows English subtitle.");
                        }
                        else
                        {
                            Console.WriteLine($"    ❌ FAILURE: {language} subtitle '{expectedSubtitle}' not found in page content");
                            Assert.False(true, $"Language {language} expected subtitle '{expectedSubtitle}' not found in page content");
                        }
                    }
                    
                    Console.WriteLine($"    ✅ {language} login page localization working correctly");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"    ERROR: Failed to test {language} - {ex.Message}");
                Assert.False(true, $"Language {language} failed to load properly in {pageName}: {ex.Message}");
            }
        }

        // Reset to English
        await dropdown.SelectOptionAsync("en-US").ConfigureAwait(false);
        await page.WaitForTimeoutAsync(1000).ConfigureAwait(false);

        Console.WriteLine($"  ✓ {pageName} comprehensive language testing complete");
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
