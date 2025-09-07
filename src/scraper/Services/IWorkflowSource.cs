using L4H.Shared.Models;

namespace L4H.ScraperWorker.Services;

public interface IWorkflowSource
{
    Task<ScrapeResult> FetchAsync(string visaTypeCode, string countryIso2, CancellationToken ct);
}