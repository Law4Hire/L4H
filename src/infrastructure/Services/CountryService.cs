using L4H.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System.Threading.Tasks;

namespace L4H.Infrastructure.Services;

public class CountryService
{
    private readonly L4HDbContext _context;

    public CountryService(L4HDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Resolves country mappings for cases like Andorra -> Spain
    /// </summary>
    public static Task<string> ResolveCountryMappingAsync(string countryIso2)
    {
        var result = countryIso2.ToUpperInvariant() switch
        {
            "AD" => "ES",
            _ => countryIso2.ToUpperInvariant()
        };
        return Task.FromResult(result);
    }

    /// <summary>
    /// Gets country name from ISO2 code
    /// </summary>
    public async Task<string?> GetCountryNameAsync(string countryIso2)
    {
        var country = await _context.Countries
            .FirstOrDefaultAsync(c => c.Iso2 == countryIso2.ToUpperInvariant()).ConfigureAwait(false);
        
        return country?.Name;
    }

    /// <summary>
    /// Checks if a country exists in our system
    /// </summary>
    public async Task<bool> CountryExistsAsync(string countryIso2)
    {
        return await _context.Countries
            .AnyAsync(c => c.Iso2 == countryIso2.ToUpperInvariant()).ConfigureAwait(false);
    }
}