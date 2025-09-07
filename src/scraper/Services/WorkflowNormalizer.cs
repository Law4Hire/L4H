using AngleSharp;
using AngleSharp.Html.Dom;
using AngleSharp.Dom;
using L4H.Shared.Models;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using System.Globalization;

namespace L4H.ScraperWorker.Services;

public class WorkflowNormalizer : IWorkflowNormalizer
{
    private readonly AngleSharp.IConfiguration _config;

    public WorkflowNormalizer()
    {
        _config = Configuration.Default;
    }

    public NormalizedWorkflow Normalize(ScrapeResult raw)
    {
        var context = BrowsingContext.New(_config);
        var document = context.OpenAsync(req => req.Content(raw.Content)).Result;
        
        var htmlDocument = document as IHtmlDocument ?? throw new InvalidOperationException("Document is not HTML");
        var steps = ExtractSteps(htmlDocument, raw.Source);
        var doctors = ExtractDoctors(htmlDocument);
        
        return new NormalizedWorkflow
        {
            Source = raw.Source,
            Steps = steps,
            Doctors = doctors,
            SourceUrls = new List<string> { raw.Url },
            ContentHash = ComputeContentHash(raw.Content),
            Metadata = new Dictionary<string, object>
            {
                { "fetchedAt", raw.FetchedAt },
                { "contentType", raw.ContentType ?? "text/html" },
                { "stepCount", steps.Count },
                { "doctorCount", doctors.Count }
            }
        };
    }

    private static List<NormalizedStep> ExtractSteps(IHtmlDocument document, string source)
    {
        var steps = new List<NormalizedStep>();
        
        if (source == "Embassy")
        {
            steps = ExtractEmbassySteps(document);
        }
        else if (source == "USCIS")
        {
            steps = ExtractUscisSteps(document);
        }
        
        // Ensure steps have proper ordinals
        for (int i = 0; i < steps.Count; i++)
        {
            steps[i].Ordinal = i + 1;
        }
        
        return steps;
    }

    private static List<NormalizedStep> ExtractEmbassySteps(IHtmlDocument document)
    {
        var steps = new List<NormalizedStep>();
        
        // Look for ordered lists with steps
        var orderedLists = document.QuerySelectorAll("ol, .requirements-section, .steps");
        
        foreach (var list in orderedLists)
        {
            var listItems = list.QuerySelectorAll("li");
            foreach (var item in listItems)
            {
                var title = ExtractStepTitle(item);
                var description = ExtractStepDescription(item);
                
                if (!string.IsNullOrWhiteSpace(title))
                {
                    steps.Add(new NormalizedStep
                    {
                        Key = GenerateStepKey(title),
                        Title = title,
                        Description = description,
                        Data = new Dictionary<string, object>()
                    });
                }
            }
        }
        
        // If no structured steps found, look for headings
        if (!steps.Any())
        {
            var headings = document.QuerySelectorAll("h2, h3, h4");
            foreach (var heading in headings)
            {
                var title = heading.TextContent.Trim();
                if (IsStepTitle(title))
                {
                    var description = ExtractNextParagraph(heading);
                    steps.Add(new NormalizedStep
                    {
                        Key = GenerateStepKey(title),
                        Title = title,
                        Description = description,
                        Data = new Dictionary<string, object>()
                    });
                }
            }
        }
        
        return steps;
    }

    private static List<NormalizedStep> ExtractUscisSteps(IHtmlDocument document)
    {
        var steps = new List<NormalizedStep>();
        
        // Look for USCIS step structure
        var stepDivs = document.QuerySelectorAll(".step, .requirements-section .step");
        
        foreach (var stepDiv in stepDivs)
        {
            var heading = stepDiv.QuerySelector("h3, h2, .step-title");
            if (heading != null)
            {
                var title = heading.TextContent.Trim();
                var description = ExtractStepDescription(stepDiv);
                
                steps.Add(new NormalizedStep
                {
                    Key = GenerateStepKey(title),
                    Title = title,
                    Description = description,
                    Data = ExtractStepData(stepDiv)
                });
            }
        }
        
        return steps;
    }

    private static List<NormalizedDoctor> ExtractDoctors(IHtmlDocument document)
    {
        var doctors = new List<NormalizedDoctor>();
        
        // Look for doctor entries
        var doctorElements = document.QuerySelectorAll(".doctor, .physician, .panel-physician");
        
        foreach (var doctorElement in doctorElements)
        {
            var doctor = ExtractDoctorInfo(doctorElement);
            if (doctor != null)
            {
                doctors.Add(doctor);
            }
        }
        
        return doctors;
    }

    private static NormalizedDoctor? ExtractDoctorInfo(IElement doctorElement)
    {
        var nameElement = doctorElement.QuerySelector("h3, .name, .doctor-name");
        if (nameElement == null) return null;
        
        var name = nameElement.TextContent.Trim();
        if (string.IsNullOrWhiteSpace(name)) return null;
        
        var address = ExtractTextByLabel(doctorElement, "Address") ?? "";
        var phone = ExtractTextByLabel(doctorElement, "Phone") ?? "";
        var city = ExtractTextByLabel(doctorElement, "City") ?? "";
        
        // Extract country code (default to source document context)
        var countryCode = ExtractCountryCode(doctorElement) ?? "ES";
        
        return new NormalizedDoctor
        {
            Name = name,
            Address = address,
            Phone = phone,
            City = city,
            CountryCode = countryCode,
            SourceUrl = "https://embassy.example.com/doctors", // Will be set by caller
            AdditionalInfo = new Dictionary<string, object>()
        };
    }

    private static string ExtractStepTitle(IElement element)
    {
        // Try different patterns for step titles
        var strongElement = element.QuerySelector("strong, b, .step-title");
        if (strongElement != null)
            return strongElement.TextContent.Trim();
        
        var heading = element.QuerySelector("h1, h2, h3, h4, h5, h6");
        if (heading != null)
            return heading.TextContent.Trim();
        
        // Fallback: use first sentence or line
        var text = element.TextContent.Trim();
        var firstLine = text.Split('\n')[0].Trim();
        return firstLine.Length > 100 ? firstLine.Substring(0, 100) + "..." : firstLine;
    }

    private static string ExtractStepDescription(IElement element)
    {
        var paragraphs = element.QuerySelectorAll("p");
        var descriptions = new List<string>();
        
        foreach (var p in paragraphs)
        {
            var text = p.TextContent.Trim();
            if (!string.IsNullOrWhiteSpace(text))
                descriptions.Add(text);
        }
        
        if (descriptions.Any())
            return string.Join(" ", descriptions);
        
        // Fallback: use all text content
        return element.TextContent.Trim();
    }

    private static string ExtractNextParagraph(IElement heading)
    {
        var next = heading.NextElementSibling;
        while (next != null)
        {
            if (next.TagName.Equals("P", StringComparison.OrdinalIgnoreCase))
                return next.TextContent.Trim();
            next = next.NextElementSibling;
        }
        return "";
    }

    private static Dictionary<string, object> ExtractStepData(IElement element)
    {
        var data = new Dictionary<string, object>();
        
        // Look for lists within step
        var lists = element.QuerySelectorAll("ul, ol");
        if (lists.Any())
        {
            var requirements = new List<string>();
            foreach (var list in lists)
            {
                var items = list.QuerySelectorAll("li");
                foreach (var item in items)
                {
                    requirements.Add(item.TextContent.Trim());
                }
            }
            if (requirements.Any())
                data["requirements"] = requirements;
        }
        
        return data;
    }

    private static string? ExtractTextByLabel(IElement element, string label)
    {
        // Look for label patterns like "Address:" or "<strong>Address:</strong>"
        var text = element.TextContent;
        var pattern = $@"\b{Regex.Escape(label)}\s*:?\s*([^\n\r]+)";
        var match = Regex.Match(text, pattern, RegexOptions.IgnoreCase);
        
        if (match.Success)
            return match.Groups[1].Value.Trim();
        
        return null;
    }

    private static string? ExtractCountryCode(IElement element)
    {
        // This would normally extract from context, for fake implementation return null
        return null;
    }

    private static bool IsStepTitle(string title)
    {
        var stepKeywords = new[] { "step", "requirement", "examination", "appointment", "fee", "interview", "document", "form" };
        return stepKeywords.Any(keyword => title.ToLower(CultureInfo.InvariantCulture).Contains(keyword));
    }

    private static string GenerateStepKey(string title)
    {
        // Generate a stable key from the title
        var clean = Regex.Replace(title.ToLower(CultureInfo.InvariantCulture), @"[^a-z0-9\s]", "");
        var words = clean.Split(new[] { ' ' }, StringSplitOptions.RemoveEmptyEntries);
        
        // Take first few meaningful words
        var keyWords = words.Where(w => w.Length > 2).Take(3).ToArray();
        return string.Join("_", keyWords);
    }

    private static string ComputeContentHash(string content)
    {
        using var sha256 = SHA256.Create();
        var bytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(content));
        return Convert.ToHexString(bytes).ToLower(CultureInfo.InvariantCulture);
    }
}