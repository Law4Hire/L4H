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

public class CannlawClientManagementIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly JsonSerializerOptions _jsonOptions;

    public CannlawClientManagementIntegrationTests(WebApplicationFactory<Program> factory)
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

    private async Task<(Attorney attorney1, Attorney attorney2, Client client1, Client client2, Client client3)> SeedTestDataAsync()
    {
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<L4HDbContext>();

        // Create test attorneys
        var attorney1 = new Attorney
        {
            Id = 1,
            FirstName = "John",
            LastName = "Smith",
            Email = "john.smith@cannlaw.com",
            Phone = "555-0101",
            Bio = "Immigration attorney with 10 years experience",
            PracticeAreas = "Immigration, Visa Applications",
            Credentials = "JD, Bar Certified",
            PhotoUrl = "/images/attorneys/john-smith.jpg",
            DirectPhone = "555-0102",
            DirectEmail = "john.direct@cannlaw.com",
            OfficeLocation = "Main Office",
            DefaultHourlyRate = 350.00m,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var attorney2 = new Attorney
        {
            Id = 2,
            FirstName = "Sarah",
            LastName = "Johnson",
            Email = "sarah.johnson@cannlaw.com",
            Phone = "555-0201",
            Bio = "Family immigration specialist",
            PracticeAreas = "Family Immigration, Citizenship",
            Credentials = "JD, Immigration Law Certified",
            PhotoUrl = "/images/attorneys/sarah-johnson.jpg",
            DirectPhone = "555-0202",
            DirectEmail = "sarah.direct@cannlaw.com",
            OfficeLocation = "Branch Office",
            DefaultHourlyRate = 325.00m,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        context.Attorneys.AddRange(attorney1, attorney2);

        // Create test clients with different case statuses
        var client1 = new Client
        {
            Id = 1,
            FirstName = "Maria",
            LastName = "Garcia",
            Email = "maria.garcia@email.com",
            Phone = "555-1001",
            Address = "123 Main St, City, State 12345",
            DateOfBirth = new DateTime(1985, 5, 15),
            CountryOfOrigin = "Mexico",
            AssignedAttorneyId = attorney1.Id,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            CreatedBy = "System",
            UpdatedBy = "System"
        };

        var client2 = new Client
        {
            Id = 2,
            FirstName = "Ahmed",
            LastName = "Hassan",
            Email = "ahmed.hassan@email.com",
            Phone = "555-1002",
            Address = "456 Oak Ave, City, State 12345",
            DateOfBirth = new DateTime(1990, 8, 22),
            CountryOfOrigin = "Egypt",
            AssignedAttorneyId = attorney2.Id,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            CreatedBy = "System",
            UpdatedBy = "System"
        };

        var client3 = new Client
        {
            Id = 3,
            FirstName = "Li",
            LastName = "Chen",
            Email = "li.chen@email.com",
            Phone = "555-1003",
            Address = "789 Pine St, City, State 12345",
            DateOfBirth = new DateTime(1988, 12, 3),
            CountryOfOrigin = "China",
            AssignedAttorneyId = null, // Unassigned
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            CreatedBy = "System",
            UpdatedBy = "System"
        };

        context.Clients.AddRange(client1, client2, client3);

        // Create test cases with different statuses
        var case1 = new Case
        {
            Id = 1,
            ClientId = client1.Id,
            CaseType = "Family Immigration",
            Status = CaseStatus.InProgress,
            Description = "Family reunification case",
            StartDate = DateTime.UtcNow.AddDays(-30),
            Notes = "Initial consultation completed",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var case2 = new Case
        {
            Id = 2,
            ClientId = client2.Id,
            CaseType = "Work Visa",
            Status = CaseStatus.Paid,
            Description = "H-1B application",
            StartDate = DateTime.UtcNow.AddDays(-15),
            Notes = "Payment received, forms in progress",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var case3 = new Case
        {
            Id = 3,
            ClientId = client3.Id,
            CaseType = "Student Visa",
            Status = CaseStatus.NotStarted,
            Description = "F-1 student visa application",
            StartDate = DateTime.UtcNow,
            Notes = "Initial intake scheduled",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        context.Cases.AddRange(case1, case2, case3);

        await context.SaveChangesAsync();
        return (attorney1, attorney2, client1, client2, client3);
    }

    #region Client Assignment Tests

    [Fact]
    public async Task AssignClient_AsAdmin_WithValidData_ReturnsSuccess()
    {
        // Arrange
        var (attorney1, attorney2, client1, client2, client3) = await SeedTestDataAsync();
        var client = CreateAuthenticatedClient("Admin");
        
        var assignmentRequest = new ClientAssignmentRequest
        {
            ClientId = client3.Id, // Unassigned client
            AttorneyId = attorney1.Id
        };

        // Act
        var response = await client.PostAsJsonAsync("/api/v1/clients/assign", assignmentRequest, _jsonOptions);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        
        // Verify assignment in database
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<L4HDbContext>();
        var updatedClient = await context.Clients.FindAsync(client3.Id);
        updatedClient!.AssignedAttorneyId.Should().Be(attorney1.Id);
    }

    [Fact]
    public async Task ReassignClient_AsAdmin_WithValidData_ReturnsSuccess()
    {
        // Arrange
        var (attorney1, attorney2, client1, client2, client3) = await SeedTestDataAsync();
        var client = CreateAuthenticatedClient("Admin");
        
        var reassignmentRequest = new ClientAssignmentRequest
        {
            ClientId = client1.Id, // Currently assigned to attorney1
            AttorneyId = attorney2.Id // Reassign to attorney2
        };

        // Act
        var response = await client.PostAsJsonAsync("/api/v1/clients/assign", reassignmentRequest, _jsonOptions);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        
        // Verify reassignment in database
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<L4HDbContext>();
        var updatedClient = await context.Clients.FindAsync(client1.Id);
        updatedClient!.AssignedAttorneyId.Should().Be(attorney2.Id);
    }

    [Fact]
    public async Task AssignClient_AsLegalProfessional_ReturnsForbidden()
    {
        // Arrange
        var (attorney1, attorney2, client1, client2, client3) = await SeedTestDataAsync();
        var client = CreateAuthenticatedClient("LegalProfessional", attorney1.Id);
        
        var assignmentRequest = new ClientAssignmentRequest
        {
            ClientId = client3.Id,
            AttorneyId = attorney1.Id
        };

        // Act
        var response = await client.PostAsJsonAsync("/api/v1/clients/assign", assignmentRequest, _jsonOptions);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task AssignClient_WithNonExistentClient_ReturnsNotFound()
    {
        // Arrange
        var (attorney1, attorney2, client1, client2, client3) = await SeedTestDataAsync();
        var client = CreateAuthenticatedClient("Admin");
        
        var assignmentRequest = new ClientAssignmentRequest
        {
            ClientId = 999, // Non-existent client
            AttorneyId = attorney1.Id
        };

        // Act
        var response = await client.PostAsJsonAsync("/api/v1/clients/assign", assignmentRequest, _jsonOptions);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task AssignClient_WithNonExistentAttorney_ReturnsNotFound()
    {
        // Arrange
        var (attorney1, attorney2, client1, client2, client3) = await SeedTestDataAsync();
        var client = CreateAuthenticatedClient("Admin");
        
        var assignmentRequest = new ClientAssignmentRequest
        {
            ClientId = client3.Id,
            AttorneyId = 999 // Non-existent attorney
        };

        // Act
        var response = await client.PostAsJsonAsync("/api/v1/clients/assign", assignmentRequest, _jsonOptions);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    #endregion

    #region Client Search and Filtering Tests

    [Fact]
    public async Task GetClients_AsAdmin_ReturnsAllClients()
    {
        // Arrange
        var (attorney1, attorney2, client1, client2, client3) = await SeedTestDataAsync();
        var client = CreateAuthenticatedClient("Admin");

        // Act
        var response = await client.GetAsync("/api/v1/clients");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<List<ClientResponse>>(_jsonOptions);
        result.Should().NotBeNull();
        result!.Count.Should().Be(3);
        result.Should().Contain(c => c.FirstName == "Maria");
        result.Should().Contain(c => c.FirstName == "Ahmed");
        result.Should().Contain(c => c.FirstName == "Li");
    }

    [Fact]
    public async Task GetClients_AsLegalProfessional_ReturnsOnlyAssignedClients()
    {
        // Arrange
        var (attorney1, attorney2, client1, client2, client3) = await SeedTestDataAsync();
        var client = CreateAuthenticatedClient("LegalProfessional", attorney1.Id);

        // Act
        var response = await client.GetAsync("/api/v1/clients");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<List<ClientResponse>>(_jsonOptions);
        result.Should().NotBeNull();
        result!.Count.Should().Be(1);
        result[0].FirstName.Should().Be("Maria"); // Only client assigned to attorney1
    }

    [Fact]
    public async Task SearchClients_ByName_ReturnsMatchingClients()
    {
        // Arrange
        var (attorney1, attorney2, client1, client2, client3) = await SeedTestDataAsync();
        var client = CreateAuthenticatedClient("Admin");

        // Act
        var response = await client.GetAsync("/api/v1/clients?search=Maria");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<List<ClientResponse>>(_jsonOptions);
        result.Should().NotBeNull();
        result!.Count.Should().Be(1);
        result[0].FirstName.Should().Be("Maria");
    }

    [Fact]
    public async Task SearchClients_ByAttorney_ReturnsClientsAssignedToAttorney()
    {
        // Arrange
        var (attorney1, attorney2, client1, client2, client3) = await SeedTestDataAsync();
        var client = CreateAuthenticatedClient("Admin");

        // Act
        var response = await client.GetAsync($"/api/v1/clients?attorneyId={attorney2.Id}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<List<ClientResponse>>(_jsonOptions);
        result.Should().NotBeNull();
        result!.Count.Should().Be(1);
        result[0].FirstName.Should().Be("Ahmed"); // Only client assigned to attorney2
    }

    [Fact]
    public async Task SearchClients_ByCaseStatus_ReturnsClientsWithMatchingStatus()
    {
        // Arrange
        var (attorney1, attorney2, client1, client2, client3) = await SeedTestDataAsync();
        var client = CreateAuthenticatedClient("Admin");

        // Act
        var response = await client.GetAsync("/api/v1/clients?caseStatus=InProgress");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<List<ClientResponse>>(_jsonOptions);
        result.Should().NotBeNull();
        result!.Count.Should().Be(1);
        result[0].FirstName.Should().Be("Maria"); // Client with InProgress case
    }

    [Fact]
    public async Task SearchClients_WithMultipleFilters_ReturnsFilteredResults()
    {
        // Arrange
        var (attorney1, attorney2, client1, client2, client3) = await SeedTestDataAsync();
        var client = CreateAuthenticatedClient("Admin");

        // Act
        var response = await client.GetAsync($"/api/v1/clients?attorneyId={attorney1.Id}&caseStatus=InProgress");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<List<ClientResponse>>(_jsonOptions);
        result.Should().NotBeNull();
        result!.Count.Should().Be(1);
        result[0].FirstName.Should().Be("Maria");
    }

    #endregion

    #region Case Status Transition Tests

    [Fact]
    public async Task UpdateCaseStatus_WithValidTransition_ReturnsSuccess()
    {
        // Arrange
        var (attorney1, attorney2, client1, client2, client3) = await SeedTestDataAsync();
        var client = CreateAuthenticatedClient("Admin");
        
        var statusUpdateRequest = new CaseStatusUpdateRequest
        {
            CaseId = 1, // client1's case
            NewStatus = CaseStatus.FormsCompleted,
            Notes = "All forms have been completed and reviewed"
        };

        // Act
        var response = await client.PutAsJsonAsync("/api/v1/clients/cases/status", statusUpdateRequest, _jsonOptions);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        
        // Verify status update in database
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<L4HDbContext>();
        var updatedCase = await context.Cases.FindAsync(1);
        updatedCase!.Status.Should().Be(CaseStatus.FormsCompleted);
        updatedCase.Notes.Should().Contain("All forms have been completed");
    }

    [Fact]
    public async Task UpdateCaseStatus_AsLegalProfessional_ForAssignedClient_ReturnsSuccess()
    {
        // Arrange
        var (attorney1, attorney2, client1, client2, client3) = await SeedTestDataAsync();
        var client = CreateAuthenticatedClient("LegalProfessional", attorney1.Id);
        
        var statusUpdateRequest = new CaseStatusUpdateRequest
        {
            CaseId = 1, // client1's case (assigned to attorney1)
            NewStatus = CaseStatus.FormsCompleted,
            Notes = "Forms completed by legal professional"
        };

        // Act
        var response = await client.PutAsJsonAsync("/api/v1/clients/cases/status", statusUpdateRequest, _jsonOptions);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task UpdateCaseStatus_AsLegalProfessional_ForUnassignedClient_ReturnsForbidden()
    {
        // Arrange
        var (attorney1, attorney2, client1, client2, client3) = await SeedTestDataAsync();
        var client = CreateAuthenticatedClient("LegalProfessional", attorney1.Id);
        
        var statusUpdateRequest = new CaseStatusUpdateRequest
        {
            CaseId = 2, // client2's case (assigned to attorney2, not attorney1)
            NewStatus = CaseStatus.FormsCompleted,
            Notes = "Unauthorized update attempt"
        };

        // Act
        var response = await client.PutAsJsonAsync("/api/v1/clients/cases/status", statusUpdateRequest, _jsonOptions);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task UpdateCaseStatus_ToComplete_RequiresConfirmation()
    {
        // Arrange
        var (attorney1, attorney2, client1, client2, client3) = await SeedTestDataAsync();
        var client = CreateAuthenticatedClient("Admin");
        
        var statusUpdateRequest = new CaseStatusUpdateRequest
        {
            CaseId = 1,
            NewStatus = CaseStatus.Complete,
            Notes = "Case completed successfully",
            RequiresConfirmation = true
        };

        // Act
        var response = await client.PutAsJsonAsync("/api/v1/clients/cases/status", statusUpdateRequest, _jsonOptions);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        
        // Verify completion date is set
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<L4HDbContext>();
        var updatedCase = await context.Cases.FindAsync(1);
        updatedCase!.Status.Should().Be(CaseStatus.Complete);
        updatedCase.CompletionDate.Should().NotBeNull();
        updatedCase.CompletionDate.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromMinutes(1));
    }

    [Fact]
    public async Task UpdateCaseStatus_ToClosedRejected_RequiresRejectionReason()
    {
        // Arrange
        var (attorney1, attorney2, client1, client2, client3) = await SeedTestDataAsync();
        var client = CreateAuthenticatedClient("Admin");
        
        var statusUpdateRequest = new CaseStatusUpdateRequest
        {
            CaseId = 1,
            NewStatus = CaseStatus.ClosedRejected,
            Notes = "Case rejected by government",
            RejectionReason = "Insufficient documentation provided"
        };

        // Act
        var response = await client.PutAsJsonAsync("/api/v1/clients/cases/status", statusUpdateRequest, _jsonOptions);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        
        // Verify rejection reason is saved
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<L4HDbContext>();
        var updatedCase = await context.Cases.FindAsync(1);
        updatedCase!.Status.Should().Be(CaseStatus.ClosedRejected);
        updatedCase.RejectionReason.Should().Be("Insufficient documentation provided");
    }

    [Fact]
    public async Task UpdateCaseStatus_WithNonExistentCase_ReturnsNotFound()
    {
        // Arrange
        var (attorney1, attorney2, client1, client2, client3) = await SeedTestDataAsync();
        var client = CreateAuthenticatedClient("Admin");
        
        var statusUpdateRequest = new CaseStatusUpdateRequest
        {
            CaseId = 999, // Non-existent case
            NewStatus = CaseStatus.Complete,
            Notes = "This should fail"
        };

        // Act
        var response = await client.PutAsJsonAsync("/api/v1/clients/cases/status", statusUpdateRequest, _jsonOptions);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    #endregion

    #region Case History Tracking Tests

    [Fact]
    public async Task GetCaseHistory_ReturnsChronologicalHistory()
    {
        // Arrange
        var (attorney1, attorney2, client1, client2, client3) = await SeedTestDataAsync();
        var client = CreateAuthenticatedClient("Admin");
        
        // Create multiple status updates
        var statusUpdate1 = new CaseStatusUpdateRequest
        {
            CaseId = 1,
            NewStatus = CaseStatus.Paid,
            Notes = "Payment received"
        };
        
        await client.PutAsJsonAsync("/api/v1/clients/cases/status", statusUpdate1, _jsonOptions);
        
        // Wait a moment to ensure different timestamps
        await Task.Delay(100);
        
        var statusUpdate2 = new CaseStatusUpdateRequest
        {
            CaseId = 1,
            NewStatus = CaseStatus.FormsCompleted,
            Notes = "Forms completed"
        };
        
        await client.PutAsJsonAsync("/api/v1/clients/cases/status", statusUpdate2, _jsonOptions);

        // Act
        var response = await client.GetAsync("/api/v1/clients/cases/1/history");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<List<CaseStatusHistoryResponse>>(_jsonOptions);
        result.Should().NotBeNull();
        result!.Count.Should().BeGreaterOrEqualTo(2);
        
        // Verify chronological order (most recent first)
        result.Should().BeInDescendingOrder(h => h.ChangedAt);
        result[0].NewStatus.Should().Be(CaseStatus.FormsCompleted);
        result[0].Notes.Should().Contain("Forms completed");
    }

    [Fact]
    public async Task GetCaseHistory_AsLegalProfessional_ForUnassignedCase_ReturnsForbidden()
    {
        // Arrange
        var (attorney1, attorney2, client1, client2, client3) = await SeedTestDataAsync();
        var client = CreateAuthenticatedClient("LegalProfessional", attorney1.Id);

        // Act - Try to access case history for client2 (assigned to attorney2)
        var response = await client.GetAsync("/api/v1/clients/cases/2/history");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    #endregion

    #region Role-Based Access Control Tests

    [Fact]
    public async Task GetClientProfile_AsAdmin_ReturnsFullProfile()
    {
        // Arrange
        var (attorney1, attorney2, client1, client2, client3) = await SeedTestDataAsync();
        var client = CreateAuthenticatedClient("Admin");

        // Act
        var response = await client.GetAsync($"/api/v1/clients/{client1.Id}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<ClientProfileResponse>(_jsonOptions);
        result.Should().NotBeNull();
        result!.FirstName.Should().Be("Maria");
        result.Email.Should().Be("maria.garcia@email.com");
        result.Cases.Should().NotBeEmpty();
    }

    [Fact]
    public async Task GetClientProfile_AsLegalProfessional_ForAssignedClient_ReturnsProfile()
    {
        // Arrange
        var (attorney1, attorney2, client1, client2, client3) = await SeedTestDataAsync();
        var client = CreateAuthenticatedClient("LegalProfessional", attorney1.Id);

        // Act
        var response = await client.GetAsync($"/api/v1/clients/{client1.Id}"); // client1 assigned to attorney1

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<ClientProfileResponse>(_jsonOptions);
        result.Should().NotBeNull();
        result!.FirstName.Should().Be("Maria");
    }

    [Fact]
    public async Task GetClientProfile_AsLegalProfessional_ForUnassignedClient_ReturnsForbidden()
    {
        // Arrange
        var (attorney1, attorney2, client1, client2, client3) = await SeedTestDataAsync();
        var client = CreateAuthenticatedClient("LegalProfessional", attorney1.Id);

        // Act
        var response = await client.GetAsync($"/api/v1/clients/{client2.Id}"); // client2 assigned to attorney2

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task CreateClient_AsAdmin_ReturnsSuccess()
    {
        // Arrange
        var (attorney1, attorney2, client1, client2, client3) = await SeedTestDataAsync();
        var client = CreateAuthenticatedClient("Admin");
        
        var createRequest = new CreateClientRequest
        {
            FirstName = "New",
            LastName = "Client",
            Email = "new.client@email.com",
            Phone = "555-9999",
            Address = "999 New St, City, State 12345",
            DateOfBirth = new DateTime(1992, 3, 10),
            CountryOfOrigin = "Canada",
            AssignedAttorneyId = attorney1.Id
        };

        // Act
        var response = await client.PostAsJsonAsync("/api/v1/clients", createRequest, _jsonOptions);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var result = await response.Content.ReadFromJsonAsync<ClientResponse>(_jsonOptions);
        result.Should().NotBeNull();
        result!.FirstName.Should().Be("New");
        result.Email.Should().Be("new.client@email.com");
        result.AssignedAttorneyId.Should().Be(attorney1.Id);
    }

    [Fact]
    public async Task CreateClient_AsLegalProfessional_ReturnsForbidden()
    {
        // Arrange
        var (attorney1, attorney2, client1, client2, client3) = await SeedTestDataAsync();
        var client = CreateAuthenticatedClient("LegalProfessional", attorney1.Id);
        
        var createRequest = new CreateClientRequest
        {
            FirstName = "New",
            LastName = "Client",
            Email = "new.client@email.com",
            Phone = "555-9999",
            Address = "999 New St, City, State 12345",
            DateOfBirth = new DateTime(1992, 3, 10),
            CountryOfOrigin = "Canada"
        };

        // Act
        var response = await client.PostAsJsonAsync("/api/v1/clients", createRequest, _jsonOptions);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    #endregion

    #region Data Validation Tests

    [Fact]
    public async Task CreateClient_WithInvalidEmail_ReturnsBadRequest()
    {
        // Arrange
        var (attorney1, attorney2, client1, client2, client3) = await SeedTestDataAsync();
        var client = CreateAuthenticatedClient("Admin");
        
        var createRequest = new CreateClientRequest
        {
            FirstName = "Test",
            LastName = "Client",
            Email = "invalid-email", // Invalid email format
            Phone = "555-9999",
            Address = "999 Test St, City, State 12345",
            DateOfBirth = new DateTime(1992, 3, 10),
            CountryOfOrigin = "Canada"
        };

        // Act
        var response = await client.PostAsJsonAsync("/api/v1/clients", createRequest, _jsonOptions);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task CreateClient_WithDuplicateEmail_ReturnsConflict()
    {
        // Arrange
        var (attorney1, attorney2, client1, client2, client3) = await SeedTestDataAsync();
        var client = CreateAuthenticatedClient("Admin");
        
        var createRequest = new CreateClientRequest
        {
            FirstName = "Duplicate",
            LastName = "Client",
            Email = "maria.garcia@email.com", // Existing email
            Phone = "555-9999",
            Address = "999 Test St, City, State 12345",
            DateOfBirth = new DateTime(1992, 3, 10),
            CountryOfOrigin = "Canada"
        };

        // Act
        var response = await client.PostAsJsonAsync("/api/v1/clients", createRequest, _jsonOptions);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Conflict);
    }

    [Fact]
    public async Task UpdateClient_WithValidData_ReturnsSuccess()
    {
        // Arrange
        var (attorney1, attorney2, client1, client2, client3) = await SeedTestDataAsync();
        var client = CreateAuthenticatedClient("Admin");
        
        var updateRequest = new UpdateClientRequest
        {
            FirstName = "Maria Updated",
            LastName = "Garcia-Smith",
            Email = "maria.updated@email.com",
            Phone = "555-1001-NEW",
            Address = "123 Updated St, City, State 12345",
            CountryOfOrigin = "Mexico"
        };

        // Act
        var response = await client.PutAsJsonAsync($"/api/v1/clients/{client1.Id}", updateRequest, _jsonOptions);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<ClientResponse>(_jsonOptions);
        result.Should().NotBeNull();
        result!.FirstName.Should().Be("Maria Updated");
        result.Email.Should().Be("maria.updated@email.com");
    }

    #endregion
}

// Test authentication handler for integration tests
public class TestAuthenticationHandler : AuthenticationHandler<AuthenticationSchemeOptions>
{
    public TestAuthenticationHandler(IOptionsMonitor<AuthenticationSchemeOptions> options,
        ILoggerFactory logger, UrlEncoder encoder, ISystemClock clock)
        : base(options, logger, encoder, clock)
    {
    }

    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        var authHeader = Request.Headers.Authorization.FirstOrDefault();
        if (authHeader == null)
        {
            return Task.FromResult(AuthenticateResult.Fail("No authorization header"));
        }

        var claimsString = authHeader.Parameter;
        if (string.IsNullOrEmpty(claimsString))
        {
            return Task.FromResult(AuthenticateResult.Fail("No claims provided"));
        }

        var claims = new List<Claim>();
        var claimPairs = claimsString.Split(',');
        
        foreach (var pair in claimPairs)
        {
            var parts = pair.Split(':');
            if (parts.Length == 2)
            {
                claims.Add(new Claim(parts[0], parts[1]));
            }
        }

        var identity = new ClaimsIdentity(claims, "Test");
        var principal = new ClaimsPrincipal(identity);
        var ticket = new AuthenticationTicket(principal, "Test");

        return Task.FromResult(AuthenticateResult.Success(ticket));
    }
}

// Request/Response models for testing
public class ClientAssignmentRequest
{
    public int ClientId { get; set; }
    public int AttorneyId { get; set; }
}

public class CaseStatusUpdateRequest
{
    public int CaseId { get; set; }
    public CaseStatus NewStatus { get; set; }
    public string Notes { get; set; } = string.Empty;
    public string? RejectionReason { get; set; }
    public bool RequiresConfirmation { get; set; }
}

public class CreateClientRequest
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public DateTime DateOfBirth { get; set; }
    public string CountryOfOrigin { get; set; } = string.Empty;
    public int? AssignedAttorneyId { get; set; }
}

public class UpdateClientRequest
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string CountryOfOrigin { get; set; } = string.Empty;
}

public class ClientResponse
{
    public int Id { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public int? AssignedAttorneyId { get; set; }
    public string? AssignedAttorneyName { get; set; }
    public List<CaseResponse> Cases { get; set; } = new();
}

public class ClientProfileResponse : ClientResponse
{
    public string Address { get; set; } = string.Empty;
    public DateTime DateOfBirth { get; set; }
    public string CountryOfOrigin { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class CaseResponse
{
    public int Id { get; set; }
    public string CaseType { get; set; } = string.Empty;
    public CaseStatus Status { get; set; }
    public string Description { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime? CompletionDate { get; set; }
    public string Notes { get; set; } = string.Empty;
}

public class CaseStatusHistoryResponse
{
    public int Id { get; set; }
    public CaseStatus PreviousStatus { get; set; }
    public CaseStatus NewStatus { get; set; }
    public string Notes { get; set; } = string.Empty;
    public DateTime ChangedAt { get; set; }
    public string ChangedBy { get; set; } = string.Empty;
}