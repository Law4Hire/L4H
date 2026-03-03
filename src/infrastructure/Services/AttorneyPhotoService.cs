using L4H.Infrastructure.Data;
using L4H.Infrastructure.Entities;
using L4H.Infrastructure.Interfaces;
using L4H.Shared.Models.Dtos;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.AspNetCore.Http;

namespace L4H.Infrastructure.Services;

public interface IAttorneyPhotoService
{
    Task<IEnumerable<AttorneyImage>> GetPhotosAsync(int attorneyId);
    Task<AttorneyImage> UploadPhotoAsync(int attorneyId, IFormFile file);
    Task<AttorneyImage> SetPrimaryPhotoAsync(int attorneyId, Guid photoId);
    Task DeletePhotoAsync(int attorneyId, Guid photoId);
}

public class AttorneyPhotoService : IAttorneyPhotoService
{
    private readonly L4HDbContext _context;
    private readonly IFileUploadService _fileUploadService;
    private readonly ILogger<AttorneyPhotoService> _logger;

    public AttorneyPhotoService(
        L4HDbContext context, 
        IFileUploadService fileUploadService,
        ILogger<AttorneyPhotoService> logger)
    {
        _context = context;
        _fileUploadService = fileUploadService;
        _logger = logger;
    }

    public async Task<IEnumerable<AttorneyImage>> GetPhotosAsync(int attorneyId)
    {
        return await _context.AttorneyImages
            .Where(i => i.AttorneyId == attorneyId)
            .OrderByDescending(i => i.CreatedAt)
            .ToListAsync();
    }

    public async Task<AttorneyImage> UploadPhotoAsync(int attorneyId, IFormFile file)
    {
        var attorney = await _context.Attorneys.FindAsync(attorneyId)
            ?? throw new KeyNotFoundException($"Attorney {attorneyId} not found.");

        if (!_fileUploadService.IsValidImageFile(file))
        {
            throw new ArgumentException("Invalid image file format.");
        }

        var fileUrl = await _fileUploadService.UploadAttorneyPhotoAsync(file);

        var image = new AttorneyImage
        {
            AttorneyId = attorneyId,
            FileUrl = fileUrl,
            FileName = file.FileName,
            IsPrimary = !await _context.AttorneyImages.AnyAsync(i => i.AttorneyId == attorneyId)
        };

        _context.AttorneyImages.Add(image);
        
        if (image.IsPrimary)
        {
            attorney.PhotoUrl = new Uri(fileUrl, UriKind.RelativeOrAbsolute);
        }

        await _context.SaveChangesAsync();
        return image;
    }

    public async Task<AttorneyImage> SetPrimaryPhotoAsync(int attorneyId, Guid photoId)
    {
        var attorney = await _context.Attorneys.FindAsync(attorneyId)
            ?? throw new KeyNotFoundException($"Attorney {attorneyId} not found.");

        var images = await _context.AttorneyImages
            .Where(i => i.AttorneyId == attorneyId)
            .ToListAsync();

        var primaryImage = images.FirstOrDefault(i => i.Id == photoId)
            ?? throw new KeyNotFoundException($"Photo {photoId} not found for attorney {attorneyId}.");

        foreach (var img in images)
        {
            img.IsPrimary = (img.Id == photoId);
        }

        attorney.PhotoUrl = new Uri(primaryImage.FileUrl, UriKind.RelativeOrAbsolute);

        await _context.SaveChangesAsync();
        return primaryImage;
    }

    public async Task DeletePhotoAsync(int attorneyId, Guid photoId)
    {
        var image = await _context.AttorneyImages
            .FirstOrDefaultAsync(i => i.AttorneyId == attorneyId && i.Id == photoId)
            ?? throw new KeyNotFoundException($"Photo {photoId} not found.");

        await _fileUploadService.DeleteFileAsync(image.FileUrl);
        _context.AttorneyImages.Remove(image);

        if (image.IsPrimary)
        {
            var nextPrimary = await _context.AttorneyImages
                .Where(i => i.AttorneyId == attorneyId && i.Id != photoId)
                .OrderByDescending(i => i.CreatedAt)
                .FirstOrDefaultAsync();

            if (nextPrimary != null)
            {
                nextPrimary.IsPrimary = true;
                var attorney = await _context.Attorneys.FindAsync(attorneyId);
                if (attorney != null) attorney.PhotoUrl = new Uri(nextPrimary.FileUrl, UriKind.RelativeOrAbsolute);
            }
            else
            {
                var attorney = await _context.Attorneys.FindAsync(attorneyId);
                if (attorney != null) attorney.PhotoUrl = null;
            }
        }

        await _context.SaveChangesAsync();
    }
}
