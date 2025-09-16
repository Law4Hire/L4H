using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using L4H.Infrastructure.Data;
using L4H.Infrastructure.Entities;
using System.Globalization;

namespace L4H.Api.Controllers;

[ApiController]
[Route("v1/countries")]
public class CountriesController : ControllerBase
{
    private readonly L4HDbContext _context;
    private readonly ILogger<CountriesController> _logger;

    public CountriesController(L4HDbContext context, ILogger<CountriesController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Country>>> GetCountries()
    {
        try
        {
            var countries = await _context.Countries
                .Where(c => c.IsActive)
                .OrderBy(c => c.Name)
                .ToListAsync().ConfigureAwait(false);

            return Ok(countries);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching countries");
            return StatusCode(500, new { error = "Failed to fetch countries" });
        }
    }

    [HttpGet("{countryCode}")]
    public async Task<ActionResult<Country>> GetCountry(string countryCode)
    {
        try
        {
            var country = await _context.Countries
                .FirstOrDefaultAsync(c => c.Iso2.ToLower(CultureInfo.InvariantCulture) == countryCode.ToLower(CultureInfo.InvariantCulture) && c.IsActive).ConfigureAwait(false);

            if (country == null)
            {
                return NotFound(new { error = "Country not found" });
            }

            return Ok(country);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching country with code {CountryCode}", countryCode);
            return StatusCode(500, new { error = "Failed to fetch country" });
        }
    }

    [HttpGet("us/subdivisions")]
    public async Task<ActionResult<IEnumerable<USSubdivision>>> GetUSSubdivisions()
    {
        try
        {
            var subdivisions = await _context.USSubdivisions
                .OrderBy(s => s.Name)
                .ToListAsync().ConfigureAwait(false);

            return Ok(subdivisions);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching US subdivisions");
            return StatusCode(500, new { error = "Failed to fetch US subdivisions" });
        }
    }

    [HttpGet("{countryCode}/subdivisions")]
    public async Task<ActionResult<IEnumerable<object>>> GetCountrySubdivisions(string countryCode)
    {
        try
        {
            // Currently only US subdivisions are supported
            if (countryCode.ToLower(CultureInfo.InvariantCulture) == "us")
            {
                var subdivisions = await _context.USSubdivisions
                    .OrderBy(s => s.Name)
                    .ToListAsync().ConfigureAwait(false);

                return Ok(subdivisions);
            }

            return Ok(new List<object>());
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching subdivisions for country {CountryCode}", countryCode);
            return StatusCode(500, new { error = "Failed to fetch subdivisions" });
        }
    }
}