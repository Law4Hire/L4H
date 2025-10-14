using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using L4H.Infrastructure.Data;

namespace L4H.Api.Controllers;

[ApiController]
[Route("v1/public")]
[Tags("Public Information")]
public class PublicController : ControllerBase
{
    private readonly L4HDbContext _context;

    public PublicController(L4HDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Get all available visa types for public viewing
    /// </summary>
    [HttpGet("visa-types")]
    [ProducesResponseType<IEnumerable<VisaTypeInfo>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetVisaTypes()
    {
        var visaTypes = await _context.VisaClasses
            .Where(v => v.IsActive)
            .Select(v => new VisaTypeInfo
            {
                Code = v.Code ?? string.Empty,
                Name = v.Name ?? string.Empty,
                GeneralCategory = v.GeneralCategory ?? string.Empty,
                Description = GetVisaDescription(v.Code ?? string.Empty)
            })
            .OrderBy(v => v.GeneralCategory)
            .ThenBy(v => v.Name)
            .ToListAsync()
            .ConfigureAwait(false);

        return Ok(visaTypes);
    }

    /// <summary>
    /// Get all available visa types (alias for compatibility)
    /// </summary>
    [HttpGet("~/api/v1/visa-types")]
    [ProducesResponseType<IEnumerable<VisaTypeInfo>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetVisaTypesAlias()
    {
        return await GetVisaTypes().ConfigureAwait(false);
    }

    /// <summary>
    /// Get simple list of all visa type codes and names
    /// </summary>
    [HttpGet("visa-list")]
    [ProducesResponseType<IEnumerable<VisaListItem>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetVisaList()
    {
        var visaList = await _context.VisaClasses
            .Where(v => v.IsActive)
            .Select(v => new VisaListItem
            {
                Code = v.Code,
                Name = v.Name
            })
            .OrderBy(v => v.Code)
            .ToListAsync()
            .ConfigureAwait(false);

        return Ok(visaList);
    }

    private static string GetVisaDescription(string code)
    {
        return code switch
        {
            "B1" => "Business visitor visa for temporary business activities in the United States.",
            "B2" => "Tourist visa for pleasure, vacation, or visiting family and friends.",
            "F1" => "Student visa for academic studies at accredited US institutions.",
            "F2" => "Dependent visa for spouses and children of F1 students.",
            "H1B" => "Specialty occupation visa for professionals with bachelor's degree or higher.",
            "H2A" => "Temporary agricultural worker visa for seasonal farm labor.",
            "H2B" => "Temporary non-agricultural worker visa for seasonal or peak load work.",
            "H4" => "Dependent visa for spouses and children of H1B visa holders.",
            "J1" => "Exchange visitor visa for cultural exchange programs.",
            "L1A" => "Intracompany transferee visa for managers and executives.",
            "L1B" => "Intracompany transferee visa for employees with specialized knowledge.",
            "L2" => "Dependent visa for spouses and children of L1 visa holders.",
            "O1" => "Extraordinary ability visa for individuals with exceptional skills.",
            "TN" => "NAFTA professional visa for Canadian and Mexican citizens.",
            "E2" => "Treaty investor visa for substantial investment in US business.",
            "EB1" => "First preference employment-based green card for priority workers.",
            "EB2" => "Second preference employment-based green card for advanced degree holders.",
            "EB3" => "Third preference employment-based green card for skilled workers.",
            "EB5" => "Fifth preference employment-based green card for investors.",
            _ => "US immigration visa classification. Contact us for detailed information."
        };
    }
}

public class VisaTypeInfo
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string GeneralCategory { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
}

public class VisaListItem
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
}