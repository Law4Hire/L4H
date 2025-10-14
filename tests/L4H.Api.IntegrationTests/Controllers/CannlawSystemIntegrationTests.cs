using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using L4H.Infrastructure.Data;
using L4H.Infrastructure.Entities;
using L4H.Shared.Models;
using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Text.Encodings.Web;
using FluentAssertions;
using Xunit;

namespace L4H.Api.IntegrationTests.Controllers;

/// <summary>
/// Comprehensive integration tests that validate complete workflows across the Cannlaw client billing system
/// </summary>
public class CannlawSystemIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly JsonSerializerOptions _jsonOptions;

    public CannlawSystemIntegrationTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                // Remove existing DbContext
                var descriptor = services.SingleOrDefault(
                    d => d.ServiceType == typeof(DbContextOptions<L4HDbContext>));
                if (descriptor != null) services.Remove(descriptor);

                // Use in-memory database for testing
                services.AddDbContext<L4HDbContext>(options =>
                {
                    options.UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString());
                });

                // Add test authentication
                services.AddAuthentication("Test")
                    .AddScheme<AuthenticationSchemeOptions, TestAuthenticationHandler>("Test", options => { });
            });
        });

        _jsonOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };
    }

    private HttpClient CreateAuthenticatedClient(string role = "Admin", int? attorneyId = null)
    {
        var client = _factory.CreateClient();
        var userId = Guid.NewGuid().ToString();
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, userId),
            new(ClaimTypes.Role, role)
        };
        
        if (attorneyId.HasValue)
        {
            claims.Add(new("AttorneyId", attorneyId.Value.ToString()));
        }

        var claimsString = string.Join(",", claims.Select(c => $"{c.Type}:{c.Value}"));
        client.DefaultRequestHeaders.Authorization = 
            new System.Net.Http.Headers.AuthenticationHeaderValue("Test", claimsString);
        return client;
    }

    #region Complete Client Lifecycle Workflow Tests

    [Fact]
    public async Task CompleteClientWorkflow_FromCreationToCompletion_WorksEndToEnd()
    {
        // This test validates the complete client management workflow:
        // 1. Admin creates attorney
        // 2. Admin creates client and assigns to attorney
        // 3. Attorney starts time tracking
        // 4. Attorney uploads client documents
        // 5. Attorney updates case status through various stages
        // 6. Attorney stops time tracking
        // 7. Admin reviews billing information
        // 8. Case is completed

        var adminClient = CreateAuthenticatedClient("Admin");

        // Step 1: Create attorney
        var createAttorneyRequest = new CreateAttorneyRequest
        {
            FirstName = "Sarah",
            LastName = "Johnson",
            Email = "sarah.johnson@cannlaw.com",
            Phone = "555-0201",
            Bio = "Immigration law specialist",
            PracticeAreas = "Family Immigration, Citizenship",
            Credentials = "JD, Immigration Law Certified",
            DefaultHourlyRate = 325.00m
        };

        var attorneyResponse = await adminClient.PostAsJsonAsync("/api/v1/attorneys", createAttorneyRequest, _jsonOptions);
        attorneyResponse.StatusCode.Should().Be(HttpStatusCode.Created);
        var attorney = await attorneyResponse.Content.ReadFromJsonAsync<AttorneyResponse>(_jsonOptions);
        attorney.Should().NotBeNull();

        // Step 2: Create client and assign to attorney
        var createClientRequest = new CreateClientRequest
        {
            FirstName = "Maria",
            LastName = "Rodriguez",
            Email = "maria.rodriguez@email.com",
            Phone = "555-1001",
            Address = "123 Main St, City, State 12345",
            DateOfBirth = new DateTime(1985, 5, 15),
            CountryOfOrigin = "Mexico",
            AssignedAttorneyId = attorney!.Id
        };

        var clientResponse = await adminClient.PostAsJsonAsync("/api/v1/clients", createClientRequest, _jsonOptions);
        clientResponse.StatusCode.Should().Be(HttpStatusCode.Created);
        var client = await clientResponse.Content.ReadFromJsonAsync<ClientResponse>(_jsonOptions);
        client.Should().NotBeNull();
        client!.AssignedAttorneyId.Should().Be(attorney.Id);

        // Step 3: Create initial case
        var createCaseRequest = new CreateCaseRequest
        {
            ClientId = client.Id,
            CaseType = "Family Immigration",
            Description = "Family reunification petition",
            Notes = "Initial consultation completed"
        };

        var caseResponse = await adminClient.PostAsJsonAsync("/api/v1/clients/cases", createCaseRequest, _jsonOptions);
        caseResponse.StatusCode.Should().Be(HttpStatusCode.Created);
        var caseEntity = await caseResponse.Content.ReadFromJsonAsync<CaseResponse>(_jsonOptions);
        caseEntity.Should().NotBeNull();

        // Switch to attorney client for remaining operations
        var attorneyClient = CreateAuthenticatedClient("LegalProfessional", attorney.Id);

        // Step 4: Start time tracking for initial consultation
        var startTimerRequest = new StartTimerRequest
        {
            ClientId = client.Id,
            Description = "Initial case review and document preparation"
        };

        var timerResponse = await attorneyClient.PostAsJsonAsync("/api/v1/time-tracking/start", startTimerRequest, _jsonOptions);
        timerResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        // Step 5: Upload client documents
        var pdfBytes = CreateTestPdfBytes();
        var documentContent = new MultipartFormDataContent();
        var fileContent = new ByteArrayContent(pdfBytes);
        fileContent.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("application/pdf");
        documentContent.Add(fileContent, "document", "passport.pdf");
        documentContent.Add(new StringContent("PersonalDocuments"), "category");
        documentContent.Add(new StringContent("Client's passport copy"), "description");

        var documentResponse = await attorneyClient.PostAsync($"/api/v1/clients/{client.Id}/documents", documentContent);
        documentResponse.StatusCode.Should().Be(HttpStatusCode.Created);

        // Step 6: Update case status to In Progress
        var statusUpdateRequest = new CaseStatusUpdateRequest
        {
            CaseId = caseEntity!.Id,
            NewStatus = CaseStatus.InProgress,
            Notes = "Documents received, case processing started"
        };

        var statusResponse = await attorneyClient.PutAsJsonAsync("/api/v1/clients/cases/status", statusUpdateRequest, _jsonOptions);
        statusResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        // Simulate work time (30 minutes)
        using (var scope = _factory.Services.CreateScope())
        {
            var context = scope.ServiceProvider.GetRequiredService<L4HDbContext>();
            var activeTimer = await context.ActiveTimers.FirstAsync(t => t.AttorneyId == attorney.Id);
            activeTimer.StartTime = DateTime.UtcNow.AddMinutes(-30);
            await context.SaveChangesAsync();
        }

        // Step 7: Stop time tracking
        var stopTimerRequest = new StopTimerRequest
        {
            Notes = "Completed initial document review and case setup"
        };

        var stopResponse = await attorneyClient.PostAsJsonAsync("/api/v1/time-tracking/stop", stopTimerRequest, _jsonOptions);
        stopResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var timeEntry = await stopResponse.Content.ReadFromJsonAsync<TimeEntryResponse>(_jsonOptions);
        timeEntry.Should().NotBeNull();
        timeEntry!.Duration.Should().Be(0.5m); // 30 minutes = 0.5 hours
        timeEntry.BillableAmount.Should().Be(162.50m); // 0.5 * $325

        // Step 8: Progress case through various statuses
        var statusUpdates = new[]
        {
            (CaseStatus.Paid, "Payment received from client"),
            (CaseStatus.FormsCompleted, "All forms completed and reviewed"),
            (CaseStatus.Complete, "Case successfully completed")
        };

        foreach (var (status, notes) in statusUpdates)
        {
            var updateRequest = new CaseStatusUpdateRequest
            {
                CaseId = caseEntity.Id,
                NewStatus = status,
                Notes = notes,
                RequiresConfirmation = status == CaseStatus.Complete
            };

            var updateResponse = await attorneyClient.PutAsJsonAsync("/api/v1/clients/cases/status", updateRequest, _jsonOptions);
            updateResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        }

        // Step 9: Admin reviews billing information
        var billingSummaryResponse = await adminClient.GetAsync("/api/v1/billing/summary");
        billingSummaryResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var billingSummary = await billingSummaryResponse.Content.ReadFromJsonAsync<List<AttorneyBillingSummaryResponse>>(_jsonOptions);
        billingSummary.Should().NotBeNull();
        billingSummary!.Should().HaveCount(1);
        billingSummary[0].AttorneyId.Should().Be(attorney.Id);
        billingSummary[0].TotalHours.Should().Be(0.5m);
        billingSummary[0].TotalBillableAmount.Should().Be(162.50m);

        // Step 10: Verify case history
        var historyResponse = await adminClient.GetAsync($"/api/v1/clients/cases/{caseEntity.Id}/history");
        historyResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var history = await historyResponse.Content.ReadFromJsonAsync<List<CaseStatusHistoryResponse>>(_jsonOptions);
        history.Should().NotBeNull();
        history!.Count.Should().BeGreaterOrEqualTo(4); // NotStarted -> InProgress -> Paid -> FormsCompleted -> Complete

        // Step 11: Verify final case state
        var finalCaseResponse = await adminClient.GetAsync($"/api/v1/clients/{client.Id}");
        finalCaseResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var finalClient = await finalCaseResponse.Content.ReadFromJsonAsync<ClientProfileResponse>(_jsonOptions);
        finalClient.Should().NotBeNull();
        finalClient!.Cases.Should().HaveCount(1);
        finalClient.Cases[0].Status.Should().Be(CaseStatus.Complete);
        finalClient.Cases[0].CompletionDate.Should().NotBeNull();
    }

    #endregion

    #region Role-Based Access Control Validation Tests

    [Fact]
    public async Task RoleBasedAccessControl_AcrossAllEndpoints_EnforcesPermissionsCorrectly()
    {
        // Setup test data
        var adminClient = CreateAuthenticatedClient("Admin");
        
        // Create attorney and client as admin
        var attorney = await CreateTestAttorneyAsync(adminClient);
        var client = await CreateTestClientAsync(adminClient, attorney.Id);
        
        var attorneyClient = CreateAuthenticatedClient("LegalProfessional", attorney.Id);
        var unauthorizedAttorneyClient = CreateAuthenticatedClient("LegalProfessional", 999); // Non-existent attorney

        // Test attorney management endpoints
        var createAttorneyRequest = new CreateAttorneyRequest
        {
            FirstName = "Test",
            LastName = "Attorney",
            Email = "test@cannlaw.com",
            Phone = "555-0000",
            Bio = "Test bio",
            PracticeAreas = "Test",
            Credentials = "Test",
            DefaultHourlyRate = 300.00m
        };

        // Admin should be able to create attorneys
        var adminCreateResponse = await adminClient.PostAsJsonAsync("/api/v1/attorneys", createAttorneyRequest, _jsonOptions);
        adminCreateResponse.StatusCode.Should().Be(HttpStatusCode.Created);

        // Legal professional should not be able to create attorneys
        var attorneyCreateResponse = await attorneyClient.PostAsJsonAsync("/api/v1/attorneys", createAttorneyRequest, _jsonOptions);
        attorneyCreateResponse.StatusCode.Should().Be(HttpStatusCode.Forbidden);

        // Test client management endpoints
        var createClientRequest = new CreateClientRequest
        {
            FirstName = "Test",
            LastName = "Client",
            Email = "testclient@email.com",
            Phone = "555-1111",
            Address = "Test Address",
            DateOfBirth = new DateTime(1990, 1, 1),
            CountryOfOrigin = "Test Country"
        };

        // Admin should be able to create clients
        var adminClientCreateResponse = await adminClient.PostAsJsonAsync("/api/v1/clients", createClientRequest, _jsonOptions);
        adminClientCreateResponse.StatusCode.Should().Be(HttpStatusCode.Created);

        // Legal professional should not be able to create clients
        var attorneyClientCreateResponse = await attorneyClient.PostAsJsonAsync("/api/v1/clients", createClientRequest, _jsonOptions);
        attorneyClientCreateResponse.StatusCode.Should().Be(HttpStatusCode.Forbidden);

        // Test client access restrictions
        // Attorney should be able to access assigned client
        var assignedClientResponse = await attorneyClient.GetAsync($"/api/v1/clients/{client.Id}");
        assignedClientResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        // Unauthorized attorney should not be able to access client
        var unauthorizedClientResponse = await unauthorizedAttorneyClient.GetAsync($"/api/v1/clients/{client.Id}");
        unauthorizedClientResponse.StatusCode.Should().Be(HttpStatusCode.Forbidden);

        // Test billing access
        // Admin should see all billing information
        var adminBillingResponse = await adminClient.GetAsync("/api/v1/billing/summary");
        adminBillingResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        // Attorney should only see their own billing
        var attorneyBillingResponse = await attorneyClient.GetAsync("/api/v1/billing/summary");
        attorneyBillingResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var attorneyBilling = await attorneyBillingResponse.Content.ReadFromJsonAsync<List<AttorneyBillingSummaryResponse>>(_jsonOptions);
        attorneyBilling.Should().NotBeNull();
        attorneyBilling!.Should().HaveCount(1);
        attorneyBilling[0].AttorneyId.Should().Be(attorney.Id);

        // Test client assignment (admin only)
        var assignmentRequest = new ClientAssignmentRequest
        {
            ClientId = client.Id,
            AttorneyId = attorney.Id
        };

        var adminAssignResponse = await adminClient.PostAsJsonAsync("/api/v1/clients/assign", assignmentRequest, _jsonOptions);
        adminAssignResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var attorneyAssignResponse = await attorneyClient.PostAsJsonAsync("/api/v1/clients/assign", assignmentRequest, _jsonOptions);
        attorneyAssignResponse.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    #endregion

    #region Data Consistency and Validation Tests

    [Fact]
    public async Task DataConsistency_AcrossRelatedEntities_MaintainsIntegrity()
    {
        var adminClient = CreateAuthenticatedClient("Admin");
        
        // Create attorney and client
        var attorney = await CreateTestAttorneyAsync(adminClient);
        var client = await CreateTestClientAsync(adminClient, attorney.Id);
        
        var attorneyClient = CreateAuthenticatedClient("LegalProfessional", attorney.Id);

        // Create time entries
        var timeEntries = new[]
        {
            new CreateTimeEntryRequest
            {
                ClientId = client.Id,
                Duration = 0.5m,
                Description = "Initial consultation",
                Date = DateTime.UtcNow.Date
            },
            new CreateTimeEntryRequest
            {
                ClientId = client.Id,
                Duration = 1.0m,
                Description = "Document preparation",
                Date = DateTime.UtcNow.Date
            }
        };

        foreach (var entry in timeEntries)
        {
            var response = await attorneyClient.PostAsJsonAsync("/api/v1/time-tracking/entries", entry, _jsonOptions);
            response.StatusCode.Should().Be(HttpStatusCode.Created);
        }

        // Verify billing calculations are consistent
        var billingSummaryResponse = await adminClient.GetAsync("/api/v1/billing/summary");
        var billingSummary = await billingSummaryResponse.Content.ReadFromJsonAsync<List<AttorneyBillingSummaryResponse>>(_jsonOptions);
        
        billingSummary.Should().NotBeNull();
        billingSummary!.Should().HaveCount(1);
        billingSummary[0].TotalHours.Should().Be(1.5m);
        billingSummary[0].TotalBillableAmount.Should().Be(1.5m * attorney.DefaultHourlyRate);

        // Verify detailed billing matches summary
        var detailedBillingResponse = await adminClient.GetAsync($"/api/v1/billing/detailed?attorneyId={attorney.Id}");
        var detailedBilling = await detailedBillingResponse.Content.ReadFromJsonAsync<DetailedBillingResponse>(_jsonOptions);
        
        detailedBilling.Should().NotBeNull();
        detailedBilling!.TotalHours.Should().Be(billingSummary[0].TotalHours);
        detailedBilling.TotalBillableAmount.Should().Be(billingSummary[0].TotalBillableAmount);
        detailedBilling.TimeEntries.Should().HaveCount(2);

        // Test cascading updates - update attorney rate
        var updateRateRequest = new UpdateBillingRateRequest
        {
            AttorneyId = attorney.Id,
            NewHourlyRate = 375.00m,
            EffectiveDate = DateTime.UtcNow.Date.AddDays(1)
        };

        var rateUpdateResponse = await adminClient.PostAsJsonAsync("/api/v1/billing/rates", updateRateRequest, _jsonOptions);
        rateUpdateResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        // Create new time entry with updated rate
        var newEntry = new CreateTimeEntryRequest
        {
            ClientId = client.Id,
            Duration = 0.5m,
            Description = "Follow-up consultation",
            Date = DateTime.UtcNow.Date.AddDays(1)
        };

        var newEntryResponse = await attorneyClient.PostAsJsonAsync("/api/v1/time-tracking/entries", newEntry, _jsonOptions);
        newEntryResponse.StatusCode.Should().Be(HttpStatusCode.Created);
        var newTimeEntry = await newEntryResponse.Content.ReadFromJsonAsync<TimeEntryResponse>(_jsonOptions);
        
        // Verify new entry uses updated rate
        newTimeEntry.Should().NotBeNull();
        newTimeEntry!.HourlyRate.Should().Be(375.00m);
        newTimeEntry.BillableAmount.Should().Be(0.5m * 375.00m);
    }

    #endregion

    #region Performance and Scalability Tests

    [Fact]
    public async Task SystemPerformance_WithMultipleClients_HandlesLoadEfficiently()
    {
        var adminClient = CreateAuthenticatedClient("Admin");
        
        // Create multiple attorneys
        var attorneys = new List<AttorneyResponse>();
        for (int i = 1; i <= 3; i++)
        {
            var attorney = await CreateTestAttorneyAsync(adminClient, $"Attorney{i}", $"attorney{i}@cannlaw.com");
            attorneys.Add(attorney);
        }

        // Create multiple clients for each attorney
        var clients = new List<ClientResponse>();
        foreach (var attorney in attorneys)
        {
            for (int i = 1; i <= 5; i++)
            {
                var client = await CreateTestClientAsync(adminClient, attorney.Id, $"Client{attorney.Id}-{i}", $"client{attorney.Id}-{i}@email.com");
                clients.Add(client);
            }
        }

        // Create time entries for each client
        foreach (var attorney in attorneys)
        {
            var attorneyClient = CreateAuthenticatedClient("LegalProfessional", attorney.Id);
            var attorneyClients = clients.Where(c => c.AssignedAttorneyId == attorney.Id).ToList();
            
            foreach (var client in attorneyClients)
            {
                // Create 3 time entries per client
                for (int i = 1; i <= 3; i++)
                {
                    var entry = new CreateTimeEntryRequest
                    {
                        ClientId = client.Id,
                        Duration = 0.5m,
                        Description = $"Work session {i}",
                        Date = DateTime.UtcNow.Date.AddDays(-i)
                    };

                    var response = await attorneyClient.PostAsJsonAsync("/api/v1/time-tracking/entries", entry, _jsonOptions);
                    response.StatusCode.Should().Be(HttpStatusCode.Created);
                }
            }
        }

        // Test search performance with large dataset
        var searchStartTime = DateTime.UtcNow;
        var searchResponse = await adminClient.GetAsync("/api/v1/clients?search=Client");
        var searchEndTime = DateTime.UtcNow;
        
        searchResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var searchResults = await searchResponse.Content.ReadFromJsonAsync<List<ClientResponse>>(_jsonOptions);
        searchResults.Should().NotBeNull();
        searchResults!.Count.Should().Be(15); // 3 attorneys * 5 clients each
        
        // Search should complete within reasonable time (< 2 seconds)
        (searchEndTime - searchStartTime).TotalSeconds.Should().BeLessThan(2);

        // Test billing summary performance
        var billingStartTime = DateTime.UtcNow;
        var billingResponse = await adminClient.GetAsync("/api/v1/billing/summary");
        var billingEndTime = DateTime.UtcNow;
        
        billingResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var billingSummary = await billingResponse.Content.ReadFromJsonAsync<List<AttorneyBillingSummaryResponse>>(_jsonOptions);
        billingSummary.Should().NotBeNull();
        billingSummary!.Count.Should().Be(3);
        
        // Each attorney should have 15 time entries (5 clients * 3 entries each)
        foreach (var summary in billingSummary)
        {
            summary.TotalEntries.Should().Be(15);
            summary.TotalHours.Should().Be(7.5m); // 15 entries * 0.5 hours each
        }
        
        // Billing calculation should complete within reasonable time (< 2 seconds)
        (billingEndTime - billingStartTime).TotalSeconds.Should().BeLessThan(2);
    }

    #endregion

    #region Error Handling and Recovery Tests

    [Fact]
    public async Task ErrorHandling_WithInvalidOperations_ReturnsAppropriateErrors()
    {
        var adminClient = CreateAuthenticatedClient("Admin");
        var attorney = await CreateTestAttorneyAsync(adminClient);
        var client = await CreateTestClientAsync(adminClient, attorney.Id);
        var attorneyClient = CreateAuthenticatedClient("LegalProfessional", attorney.Id);

        // Test invalid time entry duration
        var invalidTimeEntry = new CreateTimeEntryRequest
        {
            ClientId = client.Id,
            Duration = 0.15m, // Invalid - not a 6-minute increment
            Description = "Invalid duration",
            Date = DateTime.UtcNow.Date
        };

        var invalidResponse = await attorneyClient.PostAsJsonAsync("/api/v1/time-tracking/entries", invalidTimeEntry, _jsonOptions);
        invalidResponse.StatusCode.Should().Be(HttpStatusCode.BadRequest);

        // Test duplicate email for client
        var duplicateClientRequest = new CreateClientRequest
        {
            FirstName = "Duplicate",
            LastName = "Client",
            Email = client.Email, // Same email as existing client
            Phone = "555-9999",
            Address = "Test Address",
            DateOfBirth = new DateTime(1990, 1, 1),
            CountryOfOrigin = "Test Country"
        };

        var duplicateResponse = await adminClient.PostAsJsonAsync("/api/v1/clients", duplicateClientRequest, _jsonOptions);
        duplicateResponse.StatusCode.Should().Be(HttpStatusCode.Conflict);

        // Test invalid case status transition
        var invalidStatusUpdate = new CaseStatusUpdateRequest
        {
            CaseId = 999, // Non-existent case
            NewStatus = CaseStatus.Complete,
            Notes = "Invalid case"
        };

        var invalidStatusResponse = await attorneyClient.PutAsJsonAsync("/api/v1/clients/cases/status", invalidStatusUpdate, _jsonOptions);
        invalidStatusResponse.StatusCode.Should().Be(HttpStatusCode.NotFound);

        // Test concurrent timer prevention
        var startTimer1 = new StartTimerRequest
        {
            ClientId = client.Id,
            Description = "First timer"
        };

        var timer1Response = await attorneyClient.PostAsJsonAsync("/api/v1/time-tracking/start", startTimer1, _jsonOptions);
        timer1Response.StatusCode.Should().Be(HttpStatusCode.OK);

        var startTimer2 = new StartTimerRequest
        {
            ClientId = client.Id,
            Description = "Second timer"
        };

        var timer2Response = await attorneyClient.PostAsJsonAsync("/api/v1/time-tracking/start", startTimer2, _jsonOptions);
        timer2Response.StatusCode.Should().Be(HttpStatusCode.Conflict);
    }

    #endregion

    #region Helper Methods

    private async Task<AttorneyResponse> CreateTestAttorneyAsync(HttpClient client, string firstName = "John", string email = "john.smith@cannlaw.com")
    {
        var request = new CreateAttorneyRequest
        {
            FirstName = firstName,
            LastName = "Smith",
            Email = email,
            Phone = "555-0101",
            Bio = "Immigration attorney",
            PracticeAreas = "Immigration, Visa Applications",
            Credentials = "JD, Bar Certified",
            DefaultHourlyRate = 350.00m
        };

        var response = await client.PostAsJsonAsync("/api/v1/attorneys", request, _jsonOptions);
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<AttorneyResponse>(_jsonOptions))!;
    }

    private async Task<ClientResponse> CreateTestClientAsync(HttpClient client, int attorneyId, string firstName = "Maria", string email = "maria.garcia@email.com")
    {
        var request = new CreateClientRequest
        {
            FirstName = firstName,
            LastName = "Garcia",
            Email = email,
            Phone = "555-1001",
            Address = "123 Main St, City, State 12345",
            DateOfBirth = new DateTime(1985, 5, 15),
            CountryOfOrigin = "Mexico",
            AssignedAttorneyId = attorneyId
        };

        var response = await client.PostAsJsonAsync("/api/v1/clients", request, _jsonOptions);
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<ClientResponse>(_jsonOptions))!;
    }

    private static byte[] CreateTestPdfBytes()
    {
        var pdfContent = "%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \ntrailer\n<< /Size 4 /Root 1 0 R >>\nstartxref\n174\n%%EOF";
        return System.Text.Encoding.UTF8.GetBytes(pdfContent);
    }

    #endregion
}

// Additional request/response models
public class CreateAttorneyRequest
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Bio { get; set; } = string.Empty;
    public string PracticeAreas { get; set; } = string.Empty;
    public string Credentials { get; set; } = string.Empty;
    public decimal DefaultHourlyRate { get; set; }
}

public class AttorneyResponse
{
    public int Id { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Bio { get; set; } = string.Empty;
    public string PracticeAreas { get; set; } = string.Empty;
    public string Credentials { get; set; } = string.Empty;
    public decimal DefaultHourlyRate { get; set; }
    public bool IsActive { get; set; }
}

public class CreateCaseRequest
{
    public int ClientId { get; set; }
    public string CaseType { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Notes { get; set; } = string.Empty;
}