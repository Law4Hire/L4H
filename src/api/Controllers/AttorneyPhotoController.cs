using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using L4H.Infrastructure.Services;
using L4H.Infrastructure.Entities;

namespace L4H.Api.Controllers;

[ApiController]
[Route("api/v1/attorneys/{attorneyId}/photos")]
[Authorize(Policy = "IsAdmin")]
public class AttorneyPhotoController : ControllerBase
{
    private readonly IAttorneyPhotoService _photoService;

    public AttorneyPhotoController(IAttorneyPhotoService photoService)
    {
        _photoService = photoService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<AttorneyImage>>> GetPhotos(int attorneyId)
    {
        return Ok(await _photoService.GetPhotosAsync(attorneyId));
    }

    [HttpPost("upload")]
    public async Task<ActionResult<AttorneyImage>> UploadPhoto(int attorneyId, IFormFile file, [FromForm] string? altText = null)
    {
        try
        {
            var image = await _photoService.UploadPhotoAsync(attorneyId, file, altText);
            return Ok(image);
        }
        catch (KeyNotFoundException) { return NotFound(); }
        catch (ArgumentException ex) { return BadRequest(ex.Message); }
    }

    [HttpPatch("{photoId}/primary")]
    public async Task<ActionResult<AttorneyImage>> SetPrimary(int attorneyId, Guid photoId)
    {
        try
        {
            var image = await _photoService.SetPrimaryPhotoAsync(attorneyId, photoId);
            return Ok(image);
        }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    [HttpDelete("{photoId}")]
    public async Task<IActionResult> Delete(int attorneyId, Guid photoId)
    {
        try
        {
            await _photoService.DeletePhotoAsync(attorneyId, photoId);
            return NoContent();
        }
        catch (KeyNotFoundException) { return NotFound(); }
    }
}
