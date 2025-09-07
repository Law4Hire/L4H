using L4H.Infrastructure.Entities;
using L4H.Shared.Models;

namespace L4H.ScraperWorker.Services;

public interface IWorkflowDiff
{
    WorkflowDiffResult Diff(WorkflowVersion? approved, NormalizedWorkflow incoming);
}