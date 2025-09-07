using L4H.Infrastructure.Data;
using L4H.Infrastructure.Entities;
using L4H.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using System.Text;
using System.Text.Json;

namespace L4H.Api.Services;

public class AntivirusScanService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<AntivirusScanService> _logger;
    private readonly UploadOptions _uploadOptions;
    private readonly TimeSpan _scanInterval = TimeSpan.FromSeconds(20);

    // EICAR test string for development testing
    private const string EicarTestString = "X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*";

    public AntivirusScanService(
        IServiceScopeFactory scopeFactory, 
        ILogger<AntivirusScanService> logger,
        IOptions<UploadOptions> uploadOptions)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
        _uploadOptions = uploadOptions.Value;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        if (_uploadOptions.DisableAntivirusScan)
        {
            _logger.LogInformation("Antivirus scan service is disabled via configuration");
            return;
        }

        _logger.LogInformation("Antivirus scan service started");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ProcessPendingScans(stoppingToken).ConfigureAwait(false);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in antivirus scan service");
            }

            await Task.Delay(_scanInterval, stoppingToken).ConfigureAwait(false);
        }

        _logger.LogInformation("Antivirus scan service stopped");
    }

    private async Task ProcessPendingScans(CancellationToken cancellationToken)
    {
        using var scope = _scopeFactory.CreateScope();
        var context = (L4HDbContext)scope.ServiceProvider.GetService(typeof(L4HDbContext))!;

        // Get pending uploads
        var pendingUploads = await context.Uploads
            .Where(u => u.Status == "pending")
            .Take(10) // Process up to 10 at a time
            .ToListAsync(cancellationToken).ConfigureAwait(false);

        foreach (var upload in pendingUploads)
        {
            if (cancellationToken.IsCancellationRequested)
                break;

            try
            {
                await ProcessUpload(upload, context).ConfigureAwait(false);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to process upload {UploadId}", upload.Id);
                
                // Mark as rejected on scan failure
                upload.Status = "rejected";
                upload.VerdictAt = DateTime.UtcNow;
                LogAudit(context, "docs", "scan_failed", "Upload", upload.Id.ToString(),
                    new { uploadId = upload.Id, error = ex.Message });
            }
        }

        if (pendingUploads.Any())
        {
            await context.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        }
    }

    private async Task ProcessUpload(Upload upload, L4HDbContext context)
    {
        _logger.LogInformation("Processing upload scan: {UploadId}", upload.Id);

        // Build file path from upload key (format: "{token}/{filename}")
        var quarantinePath = Path.Combine(_uploadOptions.BasePath, _uploadOptions.QuarantineSubdir, upload.Key);
        
        // Check if file exists in quarantine directory
        if (!File.Exists(quarantinePath))
        {
            _logger.LogWarning("Upload file not found in quarantine: {UploadId}, Path: {Path}", upload.Id, quarantinePath);
            upload.Status = "rejected";
            upload.VerdictAt = DateTime.UtcNow;
            return;
        }

        // Read file for scanning
        byte[] fileData;
        try
        {
            fileData = await File.ReadAllBytesAsync(quarantinePath).ConfigureAwait(false);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to read file for scanning: {UploadId}", upload.Id);
            upload.Status = "rejected";
            upload.VerdictAt = DateTime.UtcNow;
            return;
        }

        // Perform scan
        var scanResult = await PerformDevScan(fileData, upload.OriginalName).ConfigureAwait(false);

        if (scanResult.IsInfected)
        {
            // Mark as infected and delete from quarantine
            upload.Status = "infected";
            upload.VerdictAt = DateTime.UtcNow;

            try
            {
                File.Delete(quarantinePath);
                
                // Also delete the token directory if it's empty
                var tokenDir = Path.GetDirectoryName(quarantinePath);
                if (!string.IsNullOrEmpty(tokenDir) && Directory.Exists(tokenDir) && !Directory.EnumerateFileSystemEntries(tokenDir).Any())
                {
                    Directory.Delete(tokenDir);
                }
                
                _logger.LogWarning("Infected file deleted from quarantine: {UploadId}", upload.Id);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to delete infected file from quarantine: {UploadId}", upload.Id);
            }

            LogAudit(context, "docs", "scan_infected", "Upload", upload.Id.ToString(),
                new { uploadId = upload.Id, verdict = scanResult.Verdict });
        }
        else
        {
            // File is clean - move to clean directory
            try
            {
                var cleanDir = Path.Combine(_uploadOptions.BasePath, _uploadOptions.CleanSubdir, upload.CaseId.Value.ToString(), Guid.NewGuid().ToString());
                Directory.CreateDirectory(cleanDir);
                
                var cleanPath = Path.Combine(cleanDir, Path.GetFileName(quarantinePath));
                
                // Move file to clean directory
                File.Move(quarantinePath, cleanPath);
                
                // Clean up empty token directory
                var tokenDir = Path.GetDirectoryName(quarantinePath);
                if (!string.IsNullOrEmpty(tokenDir) && Directory.Exists(tokenDir) && !Directory.EnumerateFileSystemEntries(tokenDir).Any())
                {
                    Directory.Delete(tokenDir);
                }

                // Update upload record
                upload.Status = "clean";
                upload.VerdictAt = DateTime.UtcNow;
                upload.StorageUrl = cleanPath;

                _logger.LogInformation("File scanned clean and moved to clean directory: {UploadId}", upload.Id);

                LogAudit(context, "docs", "scan_clean", "Upload", upload.Id.ToString(),
                    new { uploadId = upload.Id, verdict = scanResult.Verdict });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to move clean file to clean directory: {UploadId}", upload.Id);
                upload.Status = "rejected";
                upload.VerdictAt = DateTime.UtcNow;
            }
        }

        // Handle HEIC files (stub for future conversion)
        if (upload.OriginalName.ToLowerInvariant().EndsWith(".heic"))
        {
            _logger.LogInformation("HEIC file detected: {UploadId}. TODO: Add conversion to PNG", upload.Id);
            // TODO: Add HEIC to PNG conversion logic here in future
        }
    }

    private static async Task<ScanResult> PerformDevScan(byte[] fileData, string filename)
    {
        // Development scan logic
        await Task.Delay(100).ConfigureAwait(false); // Simulate scan time

        var contentText = Encoding.UTF8.GetString(fileData);
        
        // Check for EICAR test string
        if (contentText.Contains(EicarTestString))
        {
            return new ScanResult
            {
                IsInfected = true,
                Verdict = "EICAR test virus detected"
            };
        }

        // In development, assume all other files are clean
        return new ScanResult
        {
            IsInfected = false,
            Verdict = "Clean"
        };
    }

    private static void LogAudit(L4HDbContext context, string category, string action, string targetType, string targetId, object details)
    {
        var auditLog = new AuditLog
        {
            Category = category,
            ActorUserId = null, // System action
            Action = action,
            TargetType = targetType,
            TargetId = targetId,
            DetailsJson = JsonSerializer.Serialize(details),
            CreatedAt = DateTime.UtcNow
        };

        context.AuditLogs.Add(auditLog);
    }

    private class ScanResult
    {
        public bool IsInfected { get; set; }
        public string Verdict { get; set; } = string.Empty;
    }
}