using L4H.Infrastructure.Entities;
using L4H.Shared.Models;
using Microsoft.EntityFrameworkCore;

namespace L4H.ScraperWorker.Services;

public class WorkflowDiffEngine : IWorkflowDiff
{
    public WorkflowDiffResult Diff(WorkflowVersion? approved, NormalizedWorkflow incoming)
    {
        var result = new WorkflowDiffResult();
        
        if (approved == null)
        {
            // No previous version - everything is new
            result.AddedSteps = incoming.Steps.Select(s => new WorkflowStepDiff
            {
                Key = s.Key,
                ChangeType = "added",
                NewValue = s.Title,
                Title = s.Title,
                Description = s.Description
            }).ToList();
            
            return result;
        }
        
        var existingSteps = approved.Steps.ToList();
        var incomingSteps = incoming.Steps.ToList();
        
        // Create lookup dictionaries by key
        var existingByKey = existingSteps.ToDictionary(s => s.Key);
        var incomingByKey = incomingSteps.ToDictionary(s => s.Key);
        
        // Find added steps (in incoming but not in existing)
        foreach (var incomingStep in incomingSteps)
        {
            if (!existingByKey.ContainsKey(incomingStep.Key))
            {
                result.AddedSteps.Add(new WorkflowStepDiff
                {
                    Key = incomingStep.Key,
                    ChangeType = "added",
                    NewValue = incomingStep.Title,
                    Title = incomingStep.Title,
                    Description = incomingStep.Description
                });
            }
        }
        
        // Find removed steps (in existing but not in incoming)
        foreach (var existingStep in existingSteps)
        {
            if (!incomingByKey.ContainsKey(existingStep.Key))
            {
                result.RemovedSteps.Add(new WorkflowStepDiff
                {
                    Key = existingStep.Key,
                    ChangeType = "removed",
                    OldValue = existingStep.Title,
                    Title = existingStep.Title,
                    Description = existingStep.Description
                });
            }
        }
        
        // Find modified steps (same key but different content)
        foreach (var incomingStep in incomingSteps)
        {
            if (existingByKey.TryGetValue(incomingStep.Key, out var existingStep))
            {
                var changes = new List<string>();
                
                if (existingStep.Title != incomingStep.Title)
                {
                    changes.Add("title_changed");
                }
                
                if (existingStep.Description != incomingStep.Description)
                {
                    changes.Add("description_changed");
                }
                
                if (existingStep.Ordinal != incomingStep.Ordinal)
                {
                    changes.Add("order_changed");
                }
                
                if (changes.Any())
                {
                    result.ModifiedSteps.Add(new WorkflowStepDiff
                    {
                        Key = incomingStep.Key,
                        ChangeType = string.Join(",", changes),
                        OldValue = existingStep.Title,
                        NewValue = incomingStep.Title,
                        Title = incomingStep.Title,
                        Description = incomingStep.Description
                    });
                }
            }
        }
        
        return result;
    }
}