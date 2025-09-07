using L4H.Shared.Models;

namespace L4H.ScraperWorker.Services;

public interface IWorkflowNormalizer
{
    NormalizedWorkflow Normalize(ScrapeResult raw);
}