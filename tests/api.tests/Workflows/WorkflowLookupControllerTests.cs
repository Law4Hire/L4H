using FluentAssertions;
using L4H.Infrastructure.Data;
using L4H.Infrastructure.Entities;
using L4H.Shared.Models;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using System.Net.Http.Headers;
using System.Text.Json;
using Xunit;
using L4H.Api.Tests;

namespace L4H.Api.Tests.Workflows;

public class WorkflowLookupControllerTests : BaseIntegrationTest
{
    public WorkflowLookupControllerTests(WebApplicationFactory<Program> factory) : base(factory)
    {
    }

    [Fact]
    public async Task GetWorkflow_WithApprovedVersion_ShouldReturnLatestApproved()
    {
        // Arrange
        await SetupTestDataWithApprovedWorkflow();
        var token = await GetAuthTokenAsync();
        Client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // Act
        var response = await Client.GetAsync("/v1/workflows?visaType=B2&country=ES");

        // Assert
        response.IsSuccessStatusCode.Should().BeTrue();

        var content = await response.Content.ReadAsStringAsync();
        var result = JsonSerializer.Deserialize<WorkflowLookupResponse>(content, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        result.Should().NotBeNull();
        result!.VisaTypeId.Should().Be(TestData.B2VisaTypeId);
        result.CountryCode.Should().Be("ES");
        result.Version.Should().Be(2); // Latest approved version
        result.Status.Should().Be("approved");
        result.Steps.Should().HaveCount(3);
        result.Doctors.Should().HaveCount(2);
    }

    [Fact]
    public async Task GetWorkflow_WithNoPendingOnlyDrafts_ShouldOnlyReturnApproved()
    {
        // Arrange
        await SetupTestDataWithMixedStatuses();
        var token = await GetAuthTokenAsync();
        Client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // Act
        var response = await Client.GetAsync("/v1/workflows?visaType=B2&country=ES");

        // Assert
        response.IsSuccessStatusCode.Should().BeTrue();

        var content = await response.Content.ReadAsStringAsync();
        var result = JsonSerializer.Deserialize<WorkflowLookupResponse>(content, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        result.Should().NotBeNull();
        result!.Status.Should().Be("approved");
        result.Version.Should().Be(1); // Only approved version
    }

    [Fact]
    public async Task GetWorkflow_WithNoApprovedVersion_ShouldReturn404Localized()
    {
        // Arrange
        await SetupTestDataWithOnlyDrafts();
        var token = await GetAuthTokenAsync();
        Client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        Client.DefaultRequestHeaders.AcceptLanguage.Add(new StringWithQualityHeaderValue("es-ES"));

        // Act
        var response = await Client.GetAsync("/v1/workflows?visaType=B2&country=ES");

        // Assert
        response.StatusCode.Should().Be(System.Net.HttpStatusCode.NotFound);

        var content = await response.Content.ReadAsStringAsync();
        var errorResponse = JsonSerializer.Deserialize<ErrorResponse>(content, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        
        errorResponse.Should().NotBeNull();
        errorResponse!.Message.Should().Contain("encontró"); // Spanish for "not found"
    }

    [Fact]
    public async Task GetWorkflow_CreatesAuditLogEntry()
    {
        // Arrange
        await SetupTestDataWithApprovedWorkflow();
        var token = await GetAuthTokenAsync();
        Client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // Act
        await Client.GetAsync("/v1/workflows?visaType=B2&country=ES");

        // Assert - Verify audit log was created
        using var scope = Factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<L4HDbContext>();
        
        var auditLog = await context.AuditLogs
            .Where(a => a.Category == "workflow" && a.Action.Contains("lookup"))
            .FirstOrDefaultAsync();
        
        auditLog.Should().NotBeNull();
        auditLog!.TargetType.Should().Be("WorkflowVersion");
        auditLog.ActorUserId.Should().Be(TestData.TestUserId);
    }

    private async Task SetupTestDataWithApprovedWorkflow()
    {
        using var scope = Factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<L4HDbContext>();

        // Check if user already exists
        var existingUser = await context.Users.FirstOrDefaultAsync(u => u.Id == TestData.TestUserId);
        if (existingUser == null)
        {
            var user = new User
            {
                Id = TestData.TestUserId,
                Email = "workflowlookuptest@testing.com",
                PasswordHash = "SecureTest123!",
                EmailVerified = true,
                CreatedAt = DateTime.UtcNow,
                PasswordUpdatedAt = DateTime.UtcNow
            };
            context.Users.Add(user);
        }

        // Check if visa type already exists
        var existingVisaType = await context.VisaTypes.FirstOrDefaultAsync(vt => vt.Code == "B2");
        if (existingVisaType == null)
        {
            var visaType = new VisaType
            {
                Code = "B2",
                Name = "B-2 Tourist Visa",
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            context.VisaTypes.Add(visaType);
            await context.SaveChangesAsync();
            TestData.B2VisaTypeId = visaType.Id;
        }
        else
        {
            TestData.B2VisaTypeId = existingVisaType.Id;
        }

        // Create approved workflow v2 (latest)
        var approvedWorkflow = new WorkflowVersion
        {
            Id = Guid.NewGuid(),
            VisaTypeId = TestData.B2VisaTypeId,
            CountryCode = "ES",
            Version = 2,
            Status = "approved",
            Source = "Embassy",
            ScrapeHash = "approved-hash-v2",
            ScrapedAt = DateTime.UtcNow,
            ApprovedAt = DateTime.UtcNow
        };

        // Create steps
        var steps = new List<WorkflowStep>
        {
            new WorkflowStep
            {
                Id = Guid.NewGuid(),
                WorkflowVersionId = approvedWorkflow.Id,
                Ordinal = 1,
                Key = "medical_exam",
                Title = "Medical Examination",
                Description = "Complete medical examination"
            },
            new WorkflowStep
            {
                Id = Guid.NewGuid(),
                WorkflowVersionId = approvedWorkflow.Id,
                Ordinal = 2,
                Key = "fee_payment",
                Title = "Pay Application Fee",
                Description = "Pay required fee"
            },
            new WorkflowStep
            {
                Id = Guid.NewGuid(),
                WorkflowVersionId = approvedWorkflow.Id,
                Ordinal = 3,
                Key = "interview",
                Title = "Consular Interview",
                Description = "Attend interview"
            }
        };

        // Create doctors
        var doctors = new List<WorkflowDoctor>
        {
            new WorkflowDoctor
            {
                Id = Guid.NewGuid(),
                WorkflowVersionId = approvedWorkflow.Id,
                Name = "Dr. Test One",
                Address = "Test Address 1",
                City = "Madrid",
                CountryCode = "ES"
            },
            new WorkflowDoctor
            {
                Id = Guid.NewGuid(),
                WorkflowVersionId = approvedWorkflow.Id,
                Name = "Dr. Test Two",
                Address = "Test Address 2",
                City = "Barcelona",
                CountryCode = "ES"
            }
        };

        context.WorkflowVersions.Add(approvedWorkflow);
        context.WorkflowSteps.AddRange(steps);
        context.WorkflowDoctors.AddRange(doctors);
        await context.SaveChangesAsync();
    }

    private async Task SetupTestDataWithMixedStatuses()
    {
        using var scope = Factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<L4HDbContext>();

        // Check if user already exists
        var existingUser = await context.Users.FirstOrDefaultAsync(u => u.Id == TestData.TestUserId);
        if (existingUser == null)
        {
            var user = new User
            {
                Id = TestData.TestUserId,
                Email = "workflowlookuptest@testing.com",
                PasswordHash = "SecureTest123!",
                EmailVerified = true,
                CreatedAt = DateTime.UtcNow,
                PasswordUpdatedAt = DateTime.UtcNow
            };
            context.Users.Add(user);
        }

        // Check if visa type already exists
        var existingVisaType = await context.VisaTypes.FirstOrDefaultAsync(vt => vt.Code == "B2");
        if (existingVisaType == null)
        {
            var visaType = new VisaType
            {
                Code = "B2",
                Name = "B-2 Tourist Visa",
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            context.VisaTypes.Add(visaType);
            await context.SaveChangesAsync();
            TestData.B2VisaTypeId = visaType.Id;
        }
        else
        {
            TestData.B2VisaTypeId = existingVisaType.Id;
        }

        // Approved v1
        var approvedWorkflow = new WorkflowVersion
        {
            Id = Guid.NewGuid(),
            VisaTypeId = TestData.B2VisaTypeId,
            CountryCode = "ES",
            Version = 1,
            Status = "approved",
            Source = "Embassy",
            ScrapeHash = "approved-hash",
            ScrapedAt = DateTime.UtcNow.AddDays(-1),
            ApprovedAt = DateTime.UtcNow.AddDays(-1)
        };

        // Pending v2 (should not be returned to non-admin)
        var pendingWorkflow = new WorkflowVersion
        {
            Id = Guid.NewGuid(),
            VisaTypeId = TestData.B2VisaTypeId,
            CountryCode = "ES",
            Version = 2,
            Status = "pending_approval",
            Source = "Embassy",
            ScrapeHash = "pending-hash",
            ScrapedAt = DateTime.UtcNow
        };

        context.WorkflowVersions.AddRange(approvedWorkflow, pendingWorkflow);
        await context.SaveChangesAsync();
    }

    private async Task SetupTestDataWithOnlyDrafts()
    {
        using var scope = Factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<L4HDbContext>();

        // Check if user already exists
        var existingUser = await context.Users.FirstOrDefaultAsync(u => u.Id == TestData.TestUserId);
        if (existingUser == null)
        {
            var user = new User
            {
                Id = TestData.TestUserId,
                Email = "workflowlookuptest@testing.com",
                PasswordHash = "SecureTest123!",
                EmailVerified = true,
                CreatedAt = DateTime.UtcNow,
                PasswordUpdatedAt = DateTime.UtcNow
            };
            context.Users.Add(user);
        }

        // Check if visa type already exists
        var existingVisaType = await context.VisaTypes.FirstOrDefaultAsync(vt => vt.Code == "B2");
        if (existingVisaType == null)
        {
            var visaType = new VisaType
            {
                Code = "B2",
                Name = "B-2 Tourist Visa",
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            context.VisaTypes.Add(visaType);
            await context.SaveChangesAsync();
            TestData.B2VisaTypeId = visaType.Id;
        }
        else
        {
            TestData.B2VisaTypeId = existingVisaType.Id;
        }

        // Only pending draft (no approved versions)
        var pendingWorkflow = new WorkflowVersion
        {
            Id = Guid.NewGuid(),
            VisaTypeId = TestData.B2VisaTypeId,
            CountryCode = "ES",
            Version = 1,
            Status = "pending_approval",
            Source = "Embassy",
            ScrapeHash = "pending-only-hash",
            ScrapedAt = DateTime.UtcNow
        };

        context.WorkflowVersions.Add(pendingWorkflow);
        await context.SaveChangesAsync();
    }

    private async Task<string> GetAuthTokenAsync()
    {
        using var scope = Factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<L4HDbContext>();
        
        var existingUser = await context.Users.FirstOrDefaultAsync(u => u.Id == TestData.TestUserId);
        if (existingUser == null)
        {
            var user = new User
            {
                Id = TestData.TestUserId,
                Email = "workflowtest@testing.com",
                PasswordHash = "SecureTest123!",
                EmailVerified = true,
                CreatedAt = DateTime.UtcNow,
                PasswordUpdatedAt = DateTime.UtcNow
            };
            context.Users.Add(user);
            await context.SaveChangesAsync();
        }

        return "mock-jwt-token-for-testing";
    }


    private static class TestData
    {
        public static readonly UserId TestUserId = new UserId(Guid.Parse("C0000000-1234-1234-1234-123456789012")); // C prefix for WorkflowLookupController
        public static int B2VisaTypeId = 1; // This will be updated after first creation
    }
}