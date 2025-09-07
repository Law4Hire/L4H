using L4H.Shared.Models;
using System.Security.Cryptography;
using System.Text;
using System.Globalization;

namespace L4H.ScraperWorker.Services;

public class FakeWorkflowSource : IWorkflowSource
{
    private readonly Dictionary<string, bool> _unavailableCountries = new();
    private readonly string _fixturesPath;

    public FakeWorkflowSource()
    {
        // Default fixtures path - adjust based on runtime location
        _fixturesPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "fixtures");
        
        // If not found, try relative path from project root
        if (!Directory.Exists(_fixturesPath))
        {
            _fixturesPath = Path.Combine(
                Directory.GetCurrentDirectory(), 
                "..", "..", "..", "..", "..",
                "tests", "fixtures"
            );
        }
    }

    public void SetEmbassyUnavailable(string countryCode)
    {
        _unavailableCountries[countryCode] = true;
    }

    public async Task<ScrapeResult> FetchAsync(string visaTypeCode, string countryIso2, CancellationToken ct)
    {
        // First try embassy source (unless marked unavailable)
        if (!_unavailableCountries.ContainsKey(countryIso2))
        {
            var embassyResult = await TryFetchEmbassyAsync(visaTypeCode, countryIso2, ct).ConfigureAwait(false);
            if (embassyResult != null)
                return embassyResult;
        }

        // Fallback to USCIS
        return await FetchUscisAsync(visaTypeCode, countryIso2, ct).ConfigureAwait(false);
    }

    private async Task<ScrapeResult?> TryFetchEmbassyAsync(string visaTypeCode, string countryIso2, CancellationToken ct)
    {
        var fixturePath = Path.Combine(_fixturesPath, $"embassy_{countryIso2.ToLower(CultureInfo.InvariantCulture)}_doctors.html");
        
        if (!File.Exists(fixturePath))
            return null;

        var content = await File.ReadAllTextAsync(fixturePath, ct).ConfigureAwait(false);
        
        return new ScrapeResult
        {
            Source = "Embassy",
            CountryCode = countryIso2,
            VisaTypeCode = visaTypeCode,
            Content = content,
            Url = $"https://embassy-{countryIso2.ToLower(CultureInfo.InvariantCulture)}.example.com/doctors",
            FetchedAt = DateTime.UtcNow,
            ContentType = "text/html",
            Headers = new Dictionary<string, string>
            {
                { "Content-Type", "text/html; charset=utf-8" },
                { "Server", "Embassy-Fake/1.0" }
            }
        };
    }

    private async Task<ScrapeResult> FetchUscisAsync(string visaTypeCode, string countryIso2, CancellationToken ct)
    {
        var fixturePath = Path.Combine(_fixturesPath, $"uscis_{visaTypeCode.ToLower(CultureInfo.InvariantCulture)}_requirements.html");
        
        string content;
        if (File.Exists(fixturePath))
        {
            content = await File.ReadAllTextAsync(fixturePath, ct).ConfigureAwait(false);
        }
        else
        {
            // Generate generic USCIS content if no specific fixture
            content = GenerateGenericUscisContent(visaTypeCode, countryIso2);
        }
        
        return new ScrapeResult
        {
            Source = "USCIS",
            CountryCode = countryIso2,
            VisaTypeCode = visaTypeCode,
            Content = content,
            Url = $"https://www.uscis.gov/working-in-the-united-states/{visaTypeCode.ToLower(CultureInfo.InvariantCulture)}",
            FetchedAt = DateTime.UtcNow,
            ContentType = "text/html",
            Headers = new Dictionary<string, string>
            {
                { "Content-Type", "text/html; charset=utf-8" },
                { "Server", "USCIS-Fake/1.0" }
            }
        };
    }

    private static string GenerateGenericUscisContent(string visaTypeCode, string countryIso2)
    {
        var timestamp = DateTime.UtcNow.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);
        return $@"<!DOCTYPE html>
<html>
<head>
    <title>{visaTypeCode} Visa Requirements - USCIS</title>
</head>
<body>
    <div class=""uscis-content"">
        <h1>{visaTypeCode} Requirements</h1>
        
        <div class=""requirements-section"">
            <h2>Required Steps for {visaTypeCode} Application</h2>
            
            <div class=""step"">
                <h3>Step 1: File Petition</h3>
                <p>File the appropriate petition with USCIS.</p>
            </div>
            
            <div class=""step"">
                <h3>Step 2: Document Preparation</h3>
                <p>Gather all required supporting documents.</p>
            </div>
            
            <div class=""step"">
                <h3>Step 3: Medical Examination</h3>
                <p>Complete medical examination with authorized panel physician in {countryIso2}.</p>
            </div>
            
            <div class=""step"">
                <h3>Step 4: Interview</h3>
                <p>Attend consular interview if required.</p>
            </div>
        </div>
        
        <p><em>Source: USCIS Generic Guidelines</em></p>
        <p><em>Generated for testing: {timestamp}</em></p>
    </div>
</body>
</html>";
    }
}