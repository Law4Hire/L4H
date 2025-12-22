using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using L4H.Infrastructure.Data;
using L4H.Infrastructure.Entities;

namespace L4H.Api.Controllers;

[ApiController]
[Route("api/v1/admin/interview-categories")]
[Authorize(Policy = "IsAdmin")]
[Tags("Admin - Interview Categories")]
public class AdminInterviewQuestionCategoriesController : ControllerBase
{
    private readonly L4HDbContext _context;

    public AdminInterviewQuestionCategoriesController(L4HDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<InterviewQuestionCategory>>> GetCategories()
    {
        return await _context.InterviewQuestionCategories
            .OrderBy(c => c.DisplayOrder)
            .ToListAsync();
    }

    [HttpPost]
    public async Task<ActionResult<InterviewQuestionCategory>> CreateCategory([FromBody] InterviewQuestionCategory category)
    {
        category.Id = Guid.NewGuid();
        category.CreatedAt = DateTime.UtcNow;
        category.UpdatedAt = DateTime.UtcNow;

        _context.InterviewQuestionCategories.Add(category);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetCategories), new { id = category.Id }, category);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateCategory(Guid id, [FromBody] InterviewQuestionCategory category)
    {
        var existing = await _context.InterviewQuestionCategories.FindAsync(id);
        if (existing == null) return NotFound();

        existing.Value = category.Value;
        existing.Label = category.Label;
        existing.DisplayOrder = category.DisplayOrder;
        existing.IsActive = category.IsActive;
        existing.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return Ok(existing);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteCategory(Guid id)
    {
        var existing = await _context.InterviewQuestionCategories.FindAsync(id);
        if (existing == null) return NotFound();

        _context.InterviewQuestionCategories.Remove(existing);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
