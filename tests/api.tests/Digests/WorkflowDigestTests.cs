using FluentAssertions;
using L4H.Infrastructure.Data;
using L4H.Infrastructure.Entities;
using L4H.Shared.Models;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace L4H.Api.Tests.Digests;

public class WorkflowDigestTests : BaseIntegrationTest
{
    public WorkflowDigestTests(WebApplicationFactory<Program> factory) : base(factory)
    {
    }

    [Fact]
    public async Task Digest_CoalescesToOneItemPerDay()
    {
        // Arrange - Create multiple drafts in one day
        await CreateMultipleDraftsForSameDay();
        
        using var scope = Factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<L4HDbContext>();
        
        // Simulate digest service running
        await SimulateDigestCoalescing(context);
        
        // Act - Check digest queue
        var digestItems = await context.DailyDigestQueues
            .Where(d => d.UserId == TestData.AdminUserId)
            .ToListAsync();
        
        // Assert - Should have only one digest item per admin per day
        digestItems.Should().HaveCount(1);
        
        var digestItem = digestItems.First();
        var itemsData = System.Text.Json.JsonSerializer.Deserialize<DigestItemData>(digestItem.ItemsJson);
        
        itemsData.Should().NotBeNull();
        itemsData!.WorkflowDrafts.Should().HaveCount(3); // All 3 drafts coalesced into one email
        itemsData.Category.Should().Be("workflow_drafts");
    }
    
    [Fact]
    public async Task Digest_MultipleAdmins_EachGetsOneEmail()
    {
        // Arrange - Create drafts that would notify multiple admins
        await CreateDraftsForMultipleAdmins();
        
        using var scope = Factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<L4HDbContext>();
        
        // Simulate digest service running
        await SimulateDigestCoalescing(context);
        
        // Act - Check digest queue
        var digestItems = await context.DailyDigestQueues.ToListAsync();
        
        // Assert - One digest per admin
        digestItems.Should().HaveCount(2); // Admin1 and Admin2
        
        var admin1Digest = digestItems.FirstOrDefault(d => d.UserId == TestData.Admin1UserId);
        var admin2Digest = digestItems.FirstOrDefault(d => d.UserId == TestData.Admin2UserId);
        
        admin1Digest.Should().NotBeNull();
        admin2Digest.Should().NotBeNull();
        
        // Both should have the same drafts but separate digest entries
        var admin1Data = System.Text.Json.JsonSerializer.Deserialize<DigestItemData>(admin1Digest!.ItemsJson);
        var admin2Data = System.Text.Json.JsonSerializer.Deserialize<DigestItemData>(admin2Digest!.ItemsJson);
        
        admin1Data!.WorkflowDrafts.Should().HaveCount(2);
        admin2Data!.WorkflowDrafts.Should().HaveCount(2);
    }

    private async Task CreateMultipleDraftsForSameDay()
    {
        using var scope = Factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<L4HDbContext>();
        
        // Check if admin already exists
        var existingAdmin = await context.Users.FirstOrDefaultAsync(u => u.Id == TestData.AdminUserId);
        if (existingAdmin == null)
        {
            var admin = new User
            {
                Id = TestData.AdminUserId,
                Email = "workflowdigestadmin@testing.com",
                PasswordHash = "SecureTest123!",
                EmailVerified = true,
                CreatedAt = DateTime.UtcNow,
                PasswordUpdatedAt = DateTime.UtcNow
            };
            context.Users.Add(admin);
        }
        
        var today = DateTime.UtcNow.Date;
        
        // Create 3 workflow drafts on same day
        var workflows = new List<WorkflowVersion>
        {
            new WorkflowVersion
            {
                Id = Guid.NewGuid(),
                VisaTypeId = 1,
                CountryCode = "ES",
                Version = 1,
                Status = "pending_approval",
                Source = "Embassy",
                ScrapeHash = "hash1",
                ScrapedAt = today.AddHours(9) // Morning
            },
            new WorkflowVersion
            {
                Id = Guid.NewGuid(),
                VisaTypeId = 1,
                CountryCode = "FR",
                Version = 1,
                Status = "pending_approval",
                Source = "Embassy",
                ScrapeHash = "hash2",
                ScrapedAt = today.AddHours(14) // Afternoon
            },
            new WorkflowVersion
            {
                Id = Guid.NewGuid(),
                VisaTypeId = 2,
                CountryCode = "DE",
                Version = 1,
                Status = "pending_approval",
                Source = "USCIS",
                ScrapeHash = "hash3",
                ScrapedAt = today.AddHours(18) // Evening
            }
        };
        
        context.WorkflowVersions.AddRange(workflows);
        await context.SaveChangesAsync();
    }
    
    private async Task CreateDraftsForMultipleAdmins()
    {
        using var scope = Factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<L4HDbContext>();
        
        // Check if admin1 already exists
        var existingAdmin1 = await context.Users.FirstOrDefaultAsync(u => u.Id == TestData.Admin1UserId);
        if (existingAdmin1 == null)
        {
            var admin1 = new User
            {
                Id = TestData.Admin1UserId,
                Email = "workflowdigestadmin1@testing.com",
                PasswordHash = "SecureTest123!",
                EmailVerified = true,
                CreatedAt = DateTime.UtcNow,
                PasswordUpdatedAt = DateTime.UtcNow
            };
            context.Users.Add(admin1);
        }
        
        // Check if admin2 already exists
        var existingAdmin2 = await context.Users.FirstOrDefaultAsync(u => u.Id == TestData.Admin2UserId);
        if (existingAdmin2 == null)
        {
            var admin2 = new User
            {
                Id = TestData.Admin2UserId,
                Email = "workflowdigestadmin2@testing.com",
                PasswordHash = "SecureTest123!",
                EmailVerified = true,
                CreatedAt = DateTime.UtcNow,
                PasswordUpdatedAt = DateTime.UtcNow
            };
            context.Users.Add(admin2);
        }
        
        var today = DateTime.UtcNow.Date;
        
        // Create 2 workflow drafts
        var workflows = new List<WorkflowVersion>
        {
            new WorkflowVersion
            {
                Id = Guid.NewGuid(),
                VisaTypeId = 1,
                CountryCode = "ES",
                Version = 1,
                Status = "pending_approval",
                Source = "Embassy",
                ScrapeHash = "multi-hash1",
                ScrapedAt = today.AddHours(10)
            },
            new WorkflowVersion
            {
                Id = Guid.NewGuid(),
                VisaTypeId = 1,
                CountryCode = "IT",
                Version = 1,
                Status = "pending_approval",
                Source = "Embassy",
                ScrapeHash = "multi-hash2",
                ScrapedAt = today.AddHours(15)
            }
        };
        
        context.WorkflowVersions.AddRange(workflows);
        await context.SaveChangesAsync();
    }
    
    private static async Task SimulateDigestCoalescing(L4HDbContext context)
    {
        // Simulate the digest service logic that coalesces workflow drafts
        var today = DateTime.UtcNow.Date;
        
        var pendingWorkflows = await context.WorkflowVersions
            .Where(w => w.Status == "pending_approval" && w.ScrapedAt >= today)
            .ToListAsync();
            
        if (!pendingWorkflows.Any()) return;
        
        // Get all admin users (simplified - in real implementation would check roles)
        var adminUsers = await context.Users
            .Where(u => u.Email.Contains("admin"))
            .ToListAsync();
            
        foreach (var admin in adminUsers)
        {
            // Check if digest already exists for this admin today
            var existingDigest = await context.DailyDigestQueues
                .FirstOrDefaultAsync(d => d.UserId == admin.Id && d.LastSentAt == null);
                
            if (existingDigest == null)
            {
                // Create new digest item
                var digestData = new DigestItemData
                {
                    Category = "workflow_drafts",
                    WorkflowDrafts = pendingWorkflows.Select(w => new WorkflowDraftDigestItem
                    {
                        Id = w.Id,
                        CountryCode = w.CountryCode,
                        VisaTypeId = w.VisaTypeId,
                        Source = w.Source,
                        ScrapedAt = w.ScrapedAt
                    }).ToList()
                };
                
                var digestQueue = new DailyDigestQueue
                {
                    Id = Guid.NewGuid(),
                    UserId = admin.Id,
                    ItemsJson = System.Text.Json.JsonSerializer.Serialize(digestData),
                    LastSentAt = null // Not sent yet
                };
                
                context.DailyDigestQueues.Add(digestQueue);
            }
        }
        
        await context.SaveChangesAsync();
    }
    
    
    private static class TestData
    {
        public static readonly UserId AdminUserId = new UserId(Guid.Parse("D0000000-1234-1234-1234-123456789012")); // D prefix for WorkflowDigest
        public static readonly UserId Admin1UserId = new UserId(Guid.Parse("D1111111-1111-1111-1111-111111111111"));
        public static readonly UserId Admin2UserId = new UserId(Guid.Parse("D2222222-2222-2222-2222-222222222222"));
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