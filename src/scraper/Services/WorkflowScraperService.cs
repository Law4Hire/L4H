using L4H.Infrastructure.Data;
using L4H.Infrastructure.Entities;
using L4H.Shared.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Localization;
using Microsoft.Extensions.Logging;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Globalization;

namespace L4H.ScraperWorker.Services;

public class WorkflowScraperService
{
    private readonly IWorkflowSource _source;
    private readonly IWorkflowNormalizer _normalizer;
    private readonly IWorkflowDiff _diffEngine;
    private readonly L4HDbContext _context;
    private readonly ILogger<WorkflowScraperService> _logger;
    private readonly IStringLocalizer _localizer;

    public WorkflowScraperService(
        IWorkflowSource source,
        IWorkflowNormalizer normalizer,
        IWorkflowDiff diffEngine,
        L4HDbContext context,
        ILogger<WorkflowScraperService> logger,
        IStringLocalizer localizer)
    {
        _source = source;
        _normalizer = normalizer;
        _diffEngine = diffEngine;
        _context = context;
        _logger = logger;
        _localizer = localizer;
    }

    public async Task<ScraperResult> ScrapeAndProcessAsync(string visaTypeCode, string countryCode, CancellationToken cancellationToken)
    {
        _logger.LogInformation(_localizer["Scraper.RunStarted"], visaTypeCode, countryCode);
        
        try
        {
            // Handle country service mappings (e.g., Andorra -> Spain)
            var actualCountryCode = await ResolveCountryMappingAsync(countryCode, cancellationToken).ConfigureAwait(false);
            
            // Fetch raw data
            var scrapeResult = await _source.FetchAsync(visaTypeCode, actualCountryCode, cancellationToken).ConfigureAwait(false);
            
            // Store scraped document for traceability
            await StoreScrapedDocumentAsync(scrapeResult, cancellationToken).ConfigureAwait(false);
            
            // Normalize the content
            var normalized = _normalizer.Normalize(scrapeResult);
            
            // Check for duplicates by content hash
            var existingWorkflow = await _context.WorkflowVersions
                .FirstOrDefaultAsync(w => w.ScrapeHash == normalized.ContentHash && 
                                        w.CountryCode == countryCode &&
                                        w.Status == "pending_approval", cancellationToken).ConfigureAwait(false);
            
            if (existingWorkflow != null)
            {
                _logger.LogInformation(_localizer["Scraper.NoChange"], visaTypeCode, countryCode);
                return new ScraperResult
                {
                    Success = true,
                    WorkflowId = existingWorkflow.Id,
                    IsDuplicate = true,
                    Messages = { _localizer["Scraper.NoChange"] }
                };
            }
            
            // Get the latest approved version for diffing
            var latestApproved = await _context.WorkflowVersions
                .Include(w => w.Steps)
                .Include(w => w.Doctors)
                .Where(w => w.CountryCode == countryCode && w.Status == "approved")
                .OrderByDescending(w => w.Version)
                .FirstOrDefaultAsync(cancellationToken).ConfigureAwait(false);
            
            // Generate diff
            var diff = _diffEngine.Diff(latestApproved, normalized);
            
            // Create new workflow version
            var newVersion = await CreateWorkflowVersionAsync(
                visaTypeCode, countryCode, normalized, latestApproved?.Version ?? 0, cancellationToken).ConfigureAwait(false);
            
            // Create digest items for admins
            await CreateDigestItemsAsync(newVersion, cancellationToken).ConfigureAwait(false);
            
            _logger.LogInformation(_localizer["Scraper.DraftCreated"], newVersion.Id, diff.TotalChanges);
            
            return new ScraperResult
            {
                Success = true,
                WorkflowId = newVersion.Id,
                IsDuplicate = false,
                Messages = { _localizer["Scraper.RunCompleted"] }
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during scraping for {VisaType} {Country}", visaTypeCode, countryCode);
            return new ScraperResult
            {
                Success = false,
                Errors = { ex.Message }
            };
        }
    }

    private async Task<string> ResolveCountryMappingAsync(string countryCode, CancellationToken cancellationToken)
    {
        var mapping = await _context.CountryServiceMappings
            .FirstOrDefaultAsync(m => m.Service == "PanelPhysician" && m.FromCountry == countryCode, cancellationToken).ConfigureAwait(false);
        
        if (mapping != null)
        {
            _logger.LogInformation(_localizer["Scraper.AndorraUsesSpain"], countryCode, mapping.ToCountry);
            return mapping.ToCountry;
        }
        
        return countryCode;
    }

    private async Task StoreScrapedDocumentAsync(ScrapeResult scrapeResult, CancellationToken cancellationToken)
    {
        var sha256 = ComputeSha256(scrapeResult.Content);
        
        // Check if we already have this exact content
        var existing = await _context.ScrapedDocuments
            .FirstOrDefaultAsync(d => d.Sha256 == sha256, cancellationToken).ConfigureAwait(false);
        
        if (existing != null)
            return;
        
        var document = new ScrapedDocument
        {
            CountryCode = scrapeResult.CountryCode,
            VisaTypeCode = scrapeResult.VisaTypeCode,
            Source = scrapeResult.Source,
            Url = scrapeResult.Url,
            FetchedAt = scrapeResult.FetchedAt,
            Sha256 = sha256,
            Content = scrapeResult.Content,
            HeadersJson = JsonSerializer.Serialize(scrapeResult.Headers)
        };
        
        _context.ScrapedDocuments.Add(document);
        await _context.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
    }

    private async Task<WorkflowVersion> CreateWorkflowVersionAsync(
        string visaTypeCode, 
        string countryCode, 
        NormalizedWorkflow normalized, 
        int lastVersion, 
        CancellationToken cancellationToken)
    {
        // Get visa type ID
        var visaType = await _context.VisaTypes
            .FirstOrDefaultAsync(v => v.Code == visaTypeCode, cancellationToken).ConfigureAwait(false);
        
        if (visaType == null)
        {
            throw new InvalidOperationException($"Visa type {visaTypeCode} not found");
        }
        
        var workflow = new WorkflowVersion
        {
            VisaTypeId = visaType.Id,
            CountryCode = countryCode,
            Version = lastVersion + 1,
            Status = "pending_approval",
            Source = normalized.Source,
            ScrapeHash = normalized.ContentHash,
            ScrapedAt = DateTime.UtcNow,
            SummaryJson = JsonSerializer.Serialize(new
            {
                stepCount = normalized.Steps.Count,
                doctorCount = normalized.Doctors.Count,
                sourceUrls = normalized.SourceUrls
            })
        };
        
        _context.WorkflowVersions.Add(workflow);
        await _context.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        
        // Add steps
        foreach (var step in normalized.Steps)
        {
            var workflowStep = new WorkflowStep
            {
                WorkflowVersionId = workflow.Id,
                Ordinal = step.Ordinal,
                Key = step.Key,
                Title = step.Title,
                Description = step.Description,
                DataJson = step.Data.Any() ? JsonSerializer.Serialize(step.Data) : null
            };
            _context.WorkflowSteps.Add(workflowStep);
        }
        
        // Add doctors
        foreach (var doctor in normalized.Doctors)
        {
            var workflowDoctor = new WorkflowDoctor
            {
                WorkflowVersionId = workflow.Id,
                Name = doctor.Name,
                Address = doctor.Address,
                Phone = doctor.Phone,
                City = doctor.City,
                CountryCode = doctor.CountryCode,
                SourceUrl = doctor.SourceUrl
            };
            _context.WorkflowDoctors.Add(workflowDoctor);
        }
        
        await _context.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        return workflow;
    }

    private async Task CreateDigestItemsAsync(WorkflowVersion workflow, CancellationToken cancellationToken)
    {
        // Get admin users (simplified - in real implementation would check roles)
        var adminUsers = await _context.Users
            .Where(u => u.Email.Contains("admin"))
            .ToListAsync(cancellationToken).ConfigureAwait(false);
        
        foreach (var admin in adminUsers)
        {
            // Check if digest already exists for this admin today
            var today = DateTime.UtcNow.Date;
            var existingDigest = await _context.DailyDigestQueues
                .FirstOrDefaultAsync(d => d.UserId == admin.Id && 
                                        d.CreatedAt >= today && 
                                        d.LastSentAt == null, cancellationToken).ConfigureAwait(false);
            
            if (existingDigest != null)
            {
                // Update existing digest with new workflow
                var existingData = JsonSerializer.Deserialize<DigestItemData>(existingDigest.ItemsJson);
                existingData?.WorkflowDrafts.Add(new WorkflowDraftDigestItem
                {
                    Id = workflow.Id,
                    CountryCode = workflow.CountryCode,
                    VisaTypeId = workflow.VisaTypeId,
                    Source = workflow.Source,
                    ScrapedAt = workflow.ScrapedAt
                });
                existingDigest.ItemsJson = JsonSerializer.Serialize(existingData);
                existingDigest.UpdatedAt = DateTime.UtcNow;
            }
            else
            {
                // Create new digest item
                var digestData = new DigestItemData
                {
                    Category = "workflow_drafts",
                    WorkflowDrafts = new List<WorkflowDraftDigestItem>
                    {
                        new WorkflowDraftDigestItem
                        {
                            Id = workflow.Id,
                            CountryCode = workflow.CountryCode,
                            VisaTypeId = workflow.VisaTypeId,
                            Source = workflow.Source,
                            ScrapedAt = workflow.ScrapedAt
                        }
                    }
                };
                
                var digestQueue = new DailyDigestQueue
                {
                    Id = Guid.NewGuid(),
                    UserId = admin.Id,
                    ItemsJson = JsonSerializer.Serialize(digestData),
                    LastSentAt = null,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                
                _context.DailyDigestQueues.Add(digestQueue);
            }
        }
        
        await _context.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
    }

    private static string ComputeSha256(string content)
    {
        using var sha256 = SHA256.Create();
        var bytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(content));
        return Convert.ToHexString(bytes).ToLower(CultureInfo.InvariantCulture);
    }
}

// Supporting classes for digest data
public class DigestItemData
{
    public required string Category { get; set; }
    public List<WorkflowDraftDigestItem> WorkflowDrafts { get; set; } = new();
}

public class WorkflowDraftDigestItem
{
    public Guid Id { get; set; }
    public required string CountryCode { get; set; }
    public int VisaTypeId { get; set; }
    public required string Source { get; set; }
    public DateTime ScrapedAt { get; set; }
}