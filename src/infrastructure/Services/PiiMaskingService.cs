using System.Text.RegularExpressions;

namespace L4H.Infrastructure.Services;

public interface IPiiMaskingService
{
    string MaskPii(string input);
}

public class PiiMaskingService : IPiiMaskingService
{
    private readonly List<RedactionRule> _redactionRules;

    public PiiMaskingService()
    {
        _redactionRules = new List<RedactionRule>
        {
            // Email addresses
            new(@"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b", "***@***.***"),
            
            // Phone numbers (various formats)
            new(@"\b\d{3}[-.]?\d{3}[-.]?\d{4}\b", "***-***-****"),
            new(@"\(\d{3}\)\s*\d{3}[-.]?\d{4}", "(***) ***-****"),
            
            // SSN (XXX-XX-XXXX)
            new(@"\b\d{3}-\d{2}-\d{4}\b", "***-**-****"),
            
            // Credit card numbers (basic pattern)
            new(@"\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b", "****-****-****-****"),
            
            // Passport numbers (basic pattern)
            new(@"\b[A-Z]{1,2}\d{6,9}\b", "**######"),
        };
    }

    public string MaskPii(string input)
    {
        if (string.IsNullOrEmpty(input))
        {
            return input;
        }

        var masked = input;
        foreach (var rule in _redactionRules)
        {
            masked = rule.Pattern.Replace(masked, rule.Replacement);
        }

        return masked;
    }

    private record RedactionRule(Regex Pattern, string Replacement)
    {
        public RedactionRule(string pattern, string replacement) 
            : this(new Regex(pattern, RegexOptions.IgnoreCase), replacement)
        {
        }
    }
}
