using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using L4H.Infrastructure.Data;
using L4H.Infrastructure.Entities;

namespace L4H.Api.Controllers;

[ApiController]
[Route("api/v1/admin/site-content")]
[Authorize(Policy = "IsAdmin")]
[Tags("Admin - Site Content")]
public class AdminSiteContentController : ControllerBase
{
    private readonly L4HDbContext _context;

    public AdminSiteContentController(L4HDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<SiteContent>>> GetContent([FromQuery] string? type)
    {
        var query = _context.SiteContents.AsQueryable();
        if (!string.IsNullOrEmpty(type))
        {
            query = query.Where(c => c.ContentType == type);
        }
        return await query.OrderByDescending(c => c.CreatedAt).ToListAsync();
    }

    [HttpPost]
    public async Task<ActionResult<SiteContent>> CreateContent([FromBody] SiteContent content)
    {
        content.Id = Guid.NewGuid();
        content.CreatedAt = DateTime.UtcNow;
        content.UpdatedAt = DateTime.UtcNow;
        if (content.IsPublished && !content.PublishedAt.HasValue)
        {
            content.PublishedAt = DateTime.UtcNow;
        }

        _context.SiteContents.Add(content);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetContent), new { id = content.Id }, content);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateContent(Guid id, [FromBody] SiteContent content)
    {
        var existing = await _context.SiteContents.FindAsync(id);
        if (existing == null) return NotFound();

        existing.Title = content.Title;
        existing.Content = content.Content;
        existing.Summary = content.Summary;
        existing.Author = content.Author;
        existing.ImageUrl = content.ImageUrl;
        existing.IsPublished = content.IsPublished;
        existing.Tags = content.Tags;
        existing.UpdatedAt = DateTime.UtcNow;

        if (content.IsPublished && !existing.PublishedAt.HasValue)
        {
            existing.PublishedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
        return Ok(existing);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteContent(Guid id)
    {
        var existing = await _context.SiteContents.FindAsync(id);
        if (existing == null) return NotFound();

        _context.SiteContents.Remove(existing);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
