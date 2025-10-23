using System.Collections.Frozen;
using System.Globalization;

namespace L4H.Api.Configuration;

/// <summary>
/// Static localization configuration using .NET 10 FrozenDictionary for optimal performance.
/// FrozenDictionary provides better lookup performance and reduced memory allocation compared to regular Dictionary.
/// </summary>
public static class LocalizationConfiguration
{
    /// <summary>
    /// Supported culture codes for the L4H platform.
    /// Using FrozenSet for O(1) lookup with minimal memory overhead.
    /// </summary>
    public static readonly FrozenSet<string> SupportedCultureCodes = new HashSet<string>
    {
        "ar-SA", // Arabic (Saudi Arabia)
        "bn-BD", // Bengali (Bangladesh)
        "de-DE", // German (Germany)
        "en-US", // English (United States) - Default
        "es-ES", // Spanish (Spain)
        "fr-FR", // French (France)
        "hi-IN", // Hindi (India)
        "id-ID", // Indonesian (Indonesia)
        "it-IT", // Italian (Italy)
        "ja-JP", // Japanese (Japan)
        "ko-KR", // Korean (South Korea)
        "mr-IN", // Marathi (India)
        "pl-PL", // Polish (Poland)
        "pt-BR", // Portuguese (Brazil)
        "ru-RU", // Russian (Russia)
        "ta-IN", // Tamil (India)
        "te-IN", // Telugu (India)
        "tl-PH", // Tagalog (Philippines)
        "tr-TR", // Turkish (Turkey)
        "ur-PK", // Urdu (Pakistan)
        "vi-VN", // Vietnamese (Vietnam)
        "zh-CN"  // Chinese (China)
    }.ToFrozenSet();

    /// <summary>
    /// Mapping of culture codes to display names.
    /// Using FrozenDictionary for optimal read performance.
    /// </summary>
    public static readonly FrozenDictionary<string, string> CultureDisplayNames = new Dictionary<string, string>
    {
        ["ar-SA"] = "العربية (السعودية)",
        ["bn-BD"] = "বাংলা (বাংলাদেশ)",
        ["de-DE"] = "Deutsch (Deutschland)",
        ["en-US"] = "English (United States)",
        ["es-ES"] = "Español (España)",
        ["fr-FR"] = "Français (France)",
        ["hi-IN"] = "हिन्दी (भारत)",
        ["id-ID"] = "Bahasa Indonesia (Indonesia)",
        ["it-IT"] = "Italiano (Italia)",
        ["ja-JP"] = "日本語 (日本)",
        ["ko-KR"] = "한국어 (대한민국)",
        ["mr-IN"] = "मराठी (भारत)",
        ["pl-PL"] = "Polski (Polska)",
        ["pt-BR"] = "Português (Brasil)",
        ["ru-RU"] = "Русский (Россия)",
        ["ta-IN"] = "தமிழ் (இந்தியா)",
        ["te-IN"] = "తెలుగు (భారతదేశం)",
        ["tl-PH"] = "Tagalog (Pilipinas)",
        ["tr-TR"] = "Türkçe (Türkiye)",
        ["ur-PK"] = "اردو (پاکستان)",
        ["vi-VN"] = "Tiếng Việt (Việt Nam)",
        ["zh-CN"] = "中文 (中国)"
    }.ToFrozenDictionary();

    /// <summary>
    /// Right-to-left (RTL) language codes.
    /// Using FrozenSet for efficient lookup.
    /// </summary>
    public static readonly FrozenSet<string> RtlCultureCodes = new HashSet<string>
    {
        "ar-SA", // Arabic
        "ur-PK"  // Urdu
    }.ToFrozenSet();

    /// <summary>
    /// Default culture code for the application.
    /// </summary>
    public const string DefaultCultureCode = "en-US";

    /// <summary>
    /// Gets the CultureInfo instances for all supported cultures.
    /// Cached for performance.
    /// </summary>
    private static readonly Lazy<FrozenSet<CultureInfo>> _supportedCultures = new(() =>
        SupportedCultureCodes
            .Select(code => new CultureInfo(code))
            .ToFrozenSet()
    );

    public static FrozenSet<CultureInfo> SupportedCultures => _supportedCultures.Value;

    /// <summary>
    /// Determines if a culture code is supported.
    /// </summary>
    public static bool IsSupportedCulture(string cultureCode) =>
        SupportedCultureCodes.Contains(cultureCode);

    /// <summary>
    /// Determines if a culture uses right-to-left text direction.
    /// </summary>
    public static bool IsRtlCulture(string cultureCode) =>
        RtlCultureCodes.Contains(cultureCode);

    /// <summary>
    /// Gets the display name for a culture code, or the code itself if not found.
    /// </summary>
    public static string GetDisplayName(string cultureCode) =>
        CultureDisplayNames.TryGetValue(cultureCode, out var displayName)
            ? displayName
            : cultureCode;
}
