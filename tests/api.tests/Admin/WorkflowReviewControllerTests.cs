using FluentAssertions;
using L4H.Infrastructure.Data;
using L4H.Infrastructure.Entities;
using L4H.Shared.Models;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Xunit;

namespace L4H.Api.Tests.Admin;

public class WorkflowReviewControllerTests : BaseIntegrationTest
{
    private Guid _workflowId;
    private Guid _adminUserId;
    private Guid _testUserId;
    
    public WorkflowReviewControllerTests(WebApplicationFactory<Program> factory) : base(factory)
    {
    }

    [Fact]
    public async Task ListPending_WithAdminAuth_ShouldReturnDraftsWithSummaryCounts()
    {
        // Arrange
        await SetupTestDataWithPendingDrafts();
        var token = await GetAuthTokenAsync(isAdmin: true);
        Client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // Act
        var response = await Client.GetAsync("/v1/admin/workflows/pending?visaType=B2&country=ES");

        // Assert
        response.IsSuccessStatusCode.Should().BeTrue();

        var content = await response.Content.ReadAsStringAsync();
        var result = JsonSerializer.Deserialize<WorkflowPendingListResponse>(content, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        result.Should().NotBeNull();
        result!.Workflows.Should().HaveCount(1);
        
        var draft = result.Workflows.First();
        draft.VisaTypeId.Should().BeGreaterThan(0); // Should have a valid visa type ID
        draft.CountryCode.Should().Be("ES");
        draft.Status.Should().Be("pending_approval");
        draft.StepCount.Should().Be(3);
        draft.DoctorCount.Should().Be(2);
        draft.Source.Should().Be("Embassy");
    }

    [Fact]
    public async Task ListPending_WithSpanishLocale_ShouldReturnLocalizedMessages()
    {
        // Arrange
        await SetupTestDataWithPendingDrafts();
        var token = await GetAuthTokenAsync(isAdmin: true);
        Client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        Client.DefaultRequestHeaders.AcceptLanguage.Add(new StringWithQualityHeaderValue("es-ES"));

        // Act
        var response = await Client.GetAsync("/v1/admin/workflows/pending");

        // Assert
        response.IsSuccessStatusCode.Should().BeTrue();
        
        var content = await response.Content.ReadAsStringAsync();
        var result = JsonSerializer.Deserialize<WorkflowPendingListResponse>(content, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        
        // Should contain localized status messages
        result!.Workflows.Should().AllSatisfy(w => 
            w.StatusDisplayName.Should().Contain("Pendiente") // Spanish for pending (capitalized)
        );
    }

    [Fact]
    public async Task GetWorkflowDiff_WithValidId_ShouldReturnStepLevelDiffs()
    {
        // Arrange
        await SetupTestDataWithVersionedWorkflow();
        var token = await GetAuthTokenAsync(isAdmin: true);
        Client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // Act
        var response = await Client.GetAsync($"/v1/admin/workflows/{_workflowId}/diff");

        // Assert
        response.IsSuccessStatusCode.Should().BeTrue();

        var content = await response.Content.ReadAsStringAsync();
        var result = JsonSerializer.Deserialize<WorkflowDiffResponse>(content, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        result.Should().NotBeNull();
        result!.ModifiedSteps.Should().HaveCount(1);
        result.AddedSteps.Should().HaveCount(1);
        result.RemovedSteps.Should().HaveCount(0);
        result.TotalChanges.Should().Be(2);
    }

    [Fact]
    public async Task ApproveWorkflow_WithValidId_ShouldBumpVersionAndCreateAuditLog()
    {
        // Arrange
        await SetupTestDataWithPendingDrafts();
        var token = await GetAuthTokenAsync(isAdmin: true);
        Client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var request = new ApproveWorkflowRequest
        {
            Notes = "Approved after review"
        };

        // Act
        var response = await Client.PostAsync($"/v1/admin/workflows/{_workflowId}/approve",
            new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json"));

        // Assert
        response.IsSuccessStatusCode.Should().BeTrue();

        var content = await response.Content.ReadAsStringAsync();
        var result = JsonSerializer.Deserialize<ApproveWorkflowResponse>(content, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        result.Should().NotBeNull();
        result!.Success.Should().BeTrue();
        result.NewVersion.Should().Be(2);
        result.Message.Should().Contain("approved");

        // Verify database state
        using var scope = Factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<L4HDbContext>();
        
        var workflow = await context.WorkflowVersions.FindAsync(_workflowId);
        workflow.Should().NotBeNull();
        workflow!.Status.Should().Be("approved");
        workflow.Version.Should().Be(2);
        workflow.ApprovedBy.Should().Be(new L4H.Shared.Models.UserId(Guid.Parse("E7654321-4321-4321-4321-210987654321")));
        workflow.ApprovedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(10));

        // Verify audit log
        var auditLog = await context.AuditLogs
            .Where(a => a.Category == "workflow" && a.Action.Contains("approve"))
            .FirstOrDefaultAsync();
        
        auditLog.Should().NotBeNull();
        auditLog!.ActorUserId.Should().Be(new L4H.Shared.Models.UserId(Guid.Parse("E7654321-4321-4321-4321-210987654321")));
    }

    [Fact]
    public async Task ApproveWorkflow_AsNonAdmin_ShouldReturnForbidden()
    {
        // Arrange
        await SetupTestDataWithPendingDrafts();
        var token = await GetAuthTokenAsync(isAdmin: false);
        Client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var request = new ApproveWorkflowRequest
        {
            Notes = "Should not work"
        };

        // Act
        var response = await Client.PostAsync($"/v1/admin/workflows/{_workflowId}/approve",
            new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json"));

        // Assert
        response.StatusCode.Should().Be(System.Net.HttpStatusCode.Forbidden);
    }

    private async Task SetupTestDataWithPendingDrafts()
    {
        using var scope = Factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<L4HDbContext>();

        // Create test users with unique IDs
        _adminUserId = L4H.Api.Tests.TestData.GenerateUniqueAdminUserId();
        _testUserId = L4H.Api.Tests.TestData.GenerateUniqueUserId();
        _workflowId = L4H.Api.Tests.TestData.GenerateUniqueWorkflowId();
        
        // Create admin user with the hardcoded ID that TestAuthenticationHandler returns for admin requests
        var adminAuthUserId = new L4H.Shared.Models.UserId(Guid.Parse("E7654321-4321-4321-4321-210987654321"));
        var admin = new User
        {
            Id = adminAuthUserId,
            Email = "admin@example.com",
            PasswordHash = "hashed-password",
            EmailVerified = true,
            CreatedAt = DateTime.UtcNow,
            PasswordUpdatedAt = DateTime.UtcNow
        };

        var user = new User
        {
            Id = new L4H.Shared.Models.UserId(_testUserId),
            Email = "test@example.com",
            PasswordHash = "hashed-password",
            EmailVerified = true,
            CreatedAt = DateTime.UtcNow,
            PasswordUpdatedAt = DateTime.UtcNow
        };

        // Create test workflow draft
        var workflow = new WorkflowVersion
        {
            Id = _workflowId,
            VisaTypeId = TestData.B2VisaTypeId,
            CountryCode = "ES",
            Version = 1,
            Status = "pending_approval",
            Source = "Embassy",
            ScrapeHash = "test-hash-123",
            ScrapedAt = DateTime.UtcNow,
            SummaryJson = "{\"stepCount\": 3, \"doctorCount\": 2, \"sourceUrls\": [\"https://embassy.example.com\"]}"
        };

        // Create test steps
        var steps = new List<WorkflowStep>
        {
            new WorkflowStep
            {
                Id = Guid.NewGuid(),
                WorkflowVersionId = _workflowId,
                Ordinal = 1,
                Key = "medical_exam",
                Title = "Medical Examination",
                Description = "Complete medical examination with panel physician",
                DataJson = "{\"required\": true}"
            },
            new WorkflowStep
            {
                Id = Guid.NewGuid(),
                WorkflowVersionId = _workflowId,
                Ordinal = 2,
                Key = "fee_payment",
                Title = "Pay Application Fee",
                Description = "Pay the required application fee",
                DataJson = "{\"amount\": \"$185\"}"
            },
            new WorkflowStep
            {
                Id = Guid.NewGuid(),
                WorkflowVersionId = _workflowId,
                Ordinal = 3,
                Key = "interview",
                Title = "Attend Interview",
                Description = "Attend consular interview",
                DataJson = "{\"schedulable\": true}"
            }
        };

        // Create test doctors
        var doctors = new List<WorkflowDoctor>
        {
            new WorkflowDoctor
            {
                Id = Guid.NewGuid(),
                WorkflowVersionId = _workflowId,
                Name = "Dr. María García",
                Address = "Calle Mayor 123",
                Phone = "+34 91 123 4567",
                City = "Madrid",
                CountryCode = "ES",
                SourceUrl = "https://embassy.example.com/doctors"
            },
            new WorkflowDoctor
            {
                Id = Guid.NewGuid(),
                WorkflowVersionId = _workflowId,
                Name = "Dr. Carlos López",
                Address = "Paseo de la Castellana 456",
                Phone = "+34 91 765 4321",
                City = "Madrid",
                CountryCode = "ES",
                SourceUrl = "https://embassy.example.com/doctors"
            }
        };

        // Check if visa type already exists, if not create it
        var visaType = await context.VisaTypes.FirstOrDefaultAsync(vt => vt.Code == "B2");
        if (visaType == null)
        {
            visaType = new VisaType
            {
                Code = "B2",
                Name = "B2 Tourist Visa",
                IsActive = true
            };
            context.VisaTypes.Add(visaType);
            await context.SaveChangesAsync(); // Save to get the generated ID
        }

        context.Users.AddRange(admin, user);
        await context.SaveChangesAsync();

        // Update workflow to use the visa type ID
        workflow.VisaTypeId = visaType.Id;

        context.WorkflowVersions.Add(workflow);
        context.WorkflowSteps.AddRange(steps);
        context.WorkflowDoctors.AddRange(doctors);
        await context.SaveChangesAsync();
    }

    private async Task SetupTestDataWithVersionedWorkflow()
    {
        await SetupTestDataWithPendingDrafts();
        
        using var scope = Factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<L4HDbContext>();

        // Get the visa type ID from the existing workflow
        var existingWorkflow = await context.WorkflowVersions.FirstAsync(w => w.Id == _workflowId);
        
        // Create approved v2 (different from pending v1)
        var approvedWorkflow = new WorkflowVersion
        {
            Id = Guid.NewGuid(),
            VisaTypeId = existingWorkflow.VisaTypeId, // Use the same visa type ID
            CountryCode = "ES",
            Version = 2,
            Status = "approved",
            Source = "Embassy",
            ScrapeHash = "approved-hash-v2",
            ScrapedAt = DateTime.UtcNow.AddDays(-1),
            ApprovedBy = new L4H.Shared.Models.UserId(Guid.Parse("E7654321-4321-4321-4321-210987654321")),
            ApprovedAt = DateTime.UtcNow.AddDays(-1)
        };

        // Create steps for v2 (different from pending)
        var v2Steps = new List<WorkflowStep>
        {
            new WorkflowStep
            {
                Id = Guid.NewGuid(),
                WorkflowVersionId = approvedWorkflow.Id,
                Ordinal = 1,
                Key = "medical_exam",
                Title = "Medical Examination (Updated)",
                Description = "Complete medical examination with panel physician",
                DataJson = "{\"required\": true}"
            },
            new WorkflowStep
            {
                Id = Guid.NewGuid(),
                WorkflowVersionId = approvedWorkflow.Id,
                Ordinal = 2,
                Key = "fee_payment",
                Title = "Pay Application Fee",
                Description = "Pay the required application fee",
                DataJson = "{\"amount\": \"$160\"}"
            }
        };

        context.WorkflowVersions.Add(approvedWorkflow);
        context.WorkflowSteps.AddRange(v2Steps);
        await context.SaveChangesAsync();
    }

    private async Task<string> GetAuthTokenAsync(bool isAdmin = false)
    {
        using var scope = Factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<L4HDbContext>();
        
        var email = isAdmin ? "admin@example.com" : "test@example.com";
        var userId = isAdmin ? _adminUserId : _testUserId;
        
        var existingUser = await context.Users.FirstOrDefaultAsync(u => u.Email == email);
        if (existingUser == null)
        {
            var user = new User
            {
                Id = new L4H.Shared.Models.UserId(userId),
                Email = email,
                PasswordHash = "hashed-password",
                EmailVerified = true,
                CreatedAt = DateTime.UtcNow,
                PasswordUpdatedAt = DateTime.UtcNow
            };
            context.Users.Add(user);
            await context.SaveChangesAsync();
        }

        return isAdmin ? "admin-token" : "mock-jwt-token-for-testing";
    }


    private static class TestData
    {
        public static readonly UserId TestUserId = new UserId(Guid.Parse("C0000000-1234-1234-1234-123456789012")); // Match TestAuthenticationHandler
        public static readonly UserId AdminUserId = new UserId(Guid.Parse("87654321-4321-4321-4321-210987654321"));
        public static readonly Guid PendingWorkflowId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        public static readonly int B2VisaTypeId = 1;
    }
}