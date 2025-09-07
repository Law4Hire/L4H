namespace L4H.Shared.Models;

// Scraper service models
public class ScrapeResult
{
    public required string Source { get; set; } // "Embassy" or "USCIS"
    public required string CountryCode { get; set; }
    public required string VisaTypeCode { get; set; }
    public required string Content { get; set; }
    public required string Url { get; set; }
    public DateTime FetchedAt { get; set; } = DateTime.UtcNow;
    public string? ContentType { get; set; }
    public Dictionary<string, string> Headers { get; set; } = new();
}

public class NormalizedWorkflow
{
    public required string Source { get; set; }
    public List<NormalizedStep> Steps { get; set; } = new();
    public List<NormalizedDoctor> Doctors { get; set; } = new();
    public List<string> SourceUrls { get; set; } = new();
    public required string ContentHash { get; set; }
    public Dictionary<string, object> Metadata { get; set; } = new();
}

public class NormalizedStep
{
    public required string Key { get; set; }
    public required string Title { get; set; }
    public required string Description { get; set; }
    public int Ordinal { get; set; }
    public Dictionary<string, object> Data { get; set; } = new();
}

public class NormalizedDoctor
{
    public required string Name { get; set; }
    public required string Address { get; set; }
    public string? Phone { get; set; }
    public required string City { get; set; }
    public required string CountryCode { get; set; }
    public required string SourceUrl { get; set; }
    public Dictionary<string, object> AdditionalInfo { get; set; } = new();
}

public class WorkflowDiffResult
{
    public List<WorkflowStepDiff> ModifiedSteps { get; set; } = new();
    public List<WorkflowStepDiff> AddedSteps { get; set; } = new();
    public List<WorkflowStepDiff> RemovedSteps { get; set; } = new();
    public int TotalChanges => ModifiedSteps.Count + AddedSteps.Count + RemovedSteps.Count;
}

public class ScraperResult
{
    public bool Success { get; set; }
    public Guid WorkflowId { get; set; }
    public bool IsDuplicate { get; set; }
    public List<string> Messages { get; set; } = new();
    public List<string> Errors { get; set; } = new();
}