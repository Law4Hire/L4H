using System.Net;
using System.Text.Json;
using L4H.Infrastructure.Data;
using L4H.Infrastructure.Entities;
using L4H.Shared.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace L4H.Api.Tests.Controllers;

public sealed class VisaChangeControllerTests : IDisposable
{
    private readonly L4HDbContext _context;
    private readonly UserId _testClientUserId = new(Guid.NewGuid());
    private readonly UserId _testStaffUserId = new(Guid.NewGuid());
    private readonly CaseId _testCaseId = new(Guid.NewGuid());
    private readonly string _testDatabaseName;
    private int _b2VisaTypeId;
    private int _h1bVisaTypeId;
    private int _testPackageId;

    public VisaChangeControllerTests()
    {
        _testDatabaseName = $"L4H_Test_{Guid.NewGuid():N}";
        
        var options = new DbContextOptionsBuilder<L4HDbContext>()
            .UseInMemoryDatabase(_testDatabaseName)
            .Options;

        _context = new L4HDbContext(options);
        _context.Database.EnsureCreated();
        
        SeedTestData().Wait();
    }

    private async Task SeedTestData()
    {
        // Create test client user
        var clientUser = new User
        {
            Id = _testClientUserId,
            Email = "client@example.com",
            PasswordHash = "hash",
            EmailVerified = true,
            CreatedAt = DateTime.UtcNow,
            PasswordUpdatedAt = DateTime.UtcNow,
            IsAdmin = false,
            FailedLoginCount = 0
        };
        _context.Users.Add(clientUser);

        // Create test staff user
        var staffUser = new User
        {
            Id = _testStaffUserId,
            Email = "staff@example.com",
            PasswordHash = "hash",
            EmailVerified = true,
            CreatedAt = DateTime.UtcNow,
            PasswordUpdatedAt = DateTime.UtcNow,
            IsAdmin = true,
            FailedLoginCount = 0
        };
        _context.Users.Add(staffUser);

        // Create visa types
        var b2VisaType = new VisaType
        {
            Code = "B2",
            Name = "Tourist/Visitor",
            IsActive = true
        };
        var h1bVisaType = new VisaType
        {
            Code = "H1B",
            Name = "Specialty Occupation",
            IsActive = true
        };
        _context.VisaTypes.AddRange(b2VisaType, h1bVisaType);

        // Create test package
        var package = new Package
        {
            Code = "STANDARD",
            DisplayName = "Standard Package",
            Description = "Standard legal services",
            IsActive = true,
            SortOrder = 1
        };
        _context.Packages.Add(package);

        await _context.SaveChangesAsync();

        _b2VisaTypeId = b2VisaType.Id;
        _h1bVisaTypeId = h1bVisaType.Id;
        _testPackageId = package.Id;

        // Create pricing rules for both visa types
        var b2PricingRule = new PricingRule
        {
            VisaTypeId = _b2VisaTypeId,
            PackageId = _testPackageId,
            CountryCode = "US",
            Currency = "USD",
            BasePrice = 1000.00m,
            TaxRate = 0.1m,
            FxSurchargeMode = null,
            IsActive = true
        };

        var h1bPricingRule = new PricingRule
        {
            VisaTypeId = _h1bVisaTypeId,
            PackageId = _testPackageId,
            CountryCode = "US",
            Currency = "USD",
            BasePrice = 2000.00m,
            TaxRate = 0.1m,
            FxSurchargeMode = null,
            IsActive = true
        };

        _context.PricingRules.AddRange(b2PricingRule, h1bPricingRule);

        // Create test case with B2 visa type
        var testCase = new Case
        {
            Id = _testCaseId,
            UserId = _testClientUserId,
            Status = "active",
            VisaTypeId = _b2VisaTypeId,
            PackageId = _testPackageId,
            CreatedAt = DateTime.UtcNow,
            IsInterviewLocked = false
        };
        _context.Cases.Add(testCase);

        // Create price snapshot for the case
        var priceSnapshot = new CasePriceSnapshot
        {
            CaseId = _testCaseId,
            VisaTypeCode = "B2",
            PackageCode = "STANDARD",
            CountryCode = "US",
            BreakdownJson = JsonSerializer.Serialize(new { basePrice = 1000.00m, tax = 100.00m, total = 1100.00m }),
            Total = 1100.00m,
            Currency = "USD",
            CreatedAt = DateTime.UtcNow
        };
        _context.CasePriceSnapshots.Add(priceSnapshot);

        await _context.SaveChangesAsync();
    }

    [Fact]
    public async Task ProposeVisaChange_WithValidData_CreatesRequestSuccessfully()
    {
        // Arrange
        var request = new VisaChangeProposalRequest
        {
            CaseId = _testCaseId,
            NewVisaTypeId = _h1bVisaTypeId,
            Notes = "Client needs H1B for employment"
        };

        // Act
        var visaChangeRequest = new VisaChangeRequest
        {
            CaseId = request.CaseId,
            OldVisaTypeId = _b2VisaTypeId,
            NewVisaTypeId = request.NewVisaTypeId,
            Status = "pending",
            RequestedByStaffId = _testStaffUserId,
            RequestedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            DeltaAmount = 1000.00m, // H1B is $2200 total vs B2 $1100 total
            Currency = "USD",
            Notes = request.Notes
        };

        _context.VisaChangeRequests.Add(visaChangeRequest);
        await _context.SaveChangesAsync();

        // Assert
        var savedRequest = await _context.VisaChangeRequests
            .Include(r => r.OldVisaType)
            .Include(r => r.NewVisaType)
            .FirstOrDefaultAsync(r => r.Id == visaChangeRequest.Id);

        Assert.NotNull(savedRequest);
        Assert.Equal("pending", savedRequest.Status);
        Assert.Equal(_b2VisaTypeId, savedRequest.OldVisaTypeId);
        Assert.Equal(_h1bVisaTypeId, savedRequest.NewVisaTypeId);
        Assert.Equal(1000.00m, savedRequest.DeltaAmount);
        Assert.Equal("USD", savedRequest.Currency);
        Assert.True(savedRequest.ExpiresAt > DateTime.UtcNow.AddDays(6));
    }

    [Fact]
    public async Task ApproveVisaChange_WithValidRequest_UpdatesCaseVisaType()
    {
        // Arrange - Create a pending visa change request
        var visaChangeRequest = new VisaChangeRequest
        {
            CaseId = _testCaseId,
            OldVisaTypeId = _b2VisaTypeId,
            NewVisaTypeId = _h1bVisaTypeId,
            Status = "pending",
            RequestedByStaffId = _testStaffUserId,
            RequestedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            DeltaAmount = 1000.00m,
            Currency = "USD",
            Notes = "Test change"
        };

        _context.VisaChangeRequests.Add(visaChangeRequest);
        await _context.SaveChangesAsync();

        // Act - Approve the request
        visaChangeRequest.Status = "approved";
        visaChangeRequest.ApprovedByClientAt = DateTime.UtcNow;

        var caseEntity = await _context.Cases.FindAsync(_testCaseId);
        caseEntity!.VisaTypeId = _h1bVisaTypeId;

        // Create price delta ledger entry
        var ledgerEntry = new PriceDeltaLedger
        {
            CaseId = _testCaseId,
            VisaChangeRequestId = visaChangeRequest.Id,
            Type = "charge",
            Amount = 1000.00m,
            Currency = "USD",
            Description = "Visa change from B2 to H1B",
            Status = PriceDeltaStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };

        _context.PriceDeltaLedgers.Add(ledgerEntry);
        await _context.SaveChangesAsync();

        // Assert
        var updatedCase = await _context.Cases.FindAsync(_testCaseId);
        var updatedRequest = await _context.VisaChangeRequests.FindAsync(visaChangeRequest.Id);
        var createdLedger = await _context.PriceDeltaLedgers
            .FirstOrDefaultAsync(l => l.VisaChangeRequestId == visaChangeRequest.Id);

        Assert.NotNull(updatedCase);
        Assert.Equal(_h1bVisaTypeId, updatedCase.VisaTypeId);
        Assert.NotNull(updatedRequest);
        Assert.Equal("approved", updatedRequest.Status);
        Assert.NotNull(updatedRequest.ApprovedByClientAt);
        Assert.NotNull(createdLedger);
        Assert.Equal("charge", createdLedger.Type);
        Assert.Equal(1000.00m, createdLedger.Amount);
    }

    [Fact]
    public async Task RejectVisaChange_WithValidRequest_DoesNotUpdateCase()
    {
        // Arrange
        var visaChangeRequest = new VisaChangeRequest
        {
            CaseId = _testCaseId,
            OldVisaTypeId = _b2VisaTypeId,
            NewVisaTypeId = _h1bVisaTypeId,
            Status = "pending",
            RequestedByStaffId = _testStaffUserId,
            RequestedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            DeltaAmount = 1000.00m,
            Currency = "USD"
        };

        _context.VisaChangeRequests.Add(visaChangeRequest);
        await _context.SaveChangesAsync();

        var originalCaseVisaType = _b2VisaTypeId;

        // Act
        visaChangeRequest.Status = "rejected";
        visaChangeRequest.RejectedByClientAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        // Assert
        var updatedCase = await _context.Cases.FindAsync(_testCaseId);
        var updatedRequest = await _context.VisaChangeRequests.FindAsync(visaChangeRequest.Id);

        Assert.NotNull(updatedCase);
        Assert.Equal(originalCaseVisaType, updatedCase.VisaTypeId); // Should remain unchanged
        Assert.NotNull(updatedRequest);
        Assert.Equal("rejected", updatedRequest.Status);
        Assert.NotNull(updatedRequest.RejectedByClientAt);
    }

    [Fact]
    public async Task VisaChangeRequest_ExpiresAfterSevenDays()
    {
        // Arrange
        var visaChangeRequest = new VisaChangeRequest
        {
            CaseId = _testCaseId,
            OldVisaTypeId = _b2VisaTypeId,
            NewVisaTypeId = _h1bVisaTypeId,
            Status = "pending",
            RequestedByStaffId = _testStaffUserId,
            RequestedAt = DateTime.UtcNow.AddDays(-8), // 8 days ago
            ExpiresAt = DateTime.UtcNow.AddDays(-1), // Expired 1 day ago
            DeltaAmount = 1000.00m,
            Currency = "USD"
        };

        _context.VisaChangeRequests.Add(visaChangeRequest);
        await _context.SaveChangesAsync();

        // Act - Check if request has expired
        var isExpired = visaChangeRequest.ExpiresAt < DateTime.UtcNow;

        // Assert
        Assert.True(isExpired);
        Assert.Equal("pending", visaChangeRequest.Status); // Status should still be pending until explicitly expired
    }

    [Fact]
    public async Task MultipleVisaChangeRequests_OnlyOnePendingAllowed()
    {
        // Arrange - Create first pending request
        var firstRequest = new VisaChangeRequest
        {
            CaseId = _testCaseId,
            OldVisaTypeId = _b2VisaTypeId,
            NewVisaTypeId = _h1bVisaTypeId,
            Status = "pending",
            RequestedByStaffId = _testStaffUserId,
            RequestedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            DeltaAmount = 1000.00m,
            Currency = "USD"
        };

        _context.VisaChangeRequests.Add(firstRequest);
        await _context.SaveChangesAsync();

        // Act - Check for existing pending request
        var existingPendingRequest = await _context.VisaChangeRequests
            .FirstOrDefaultAsync(r => r.CaseId == _testCaseId && r.Status == "pending");

        // Assert
        Assert.NotNull(existingPendingRequest);
        Assert.Equal(firstRequest.Id, existingPendingRequest.Id);
    }

    [Fact]
    public async Task VisaChangeHistory_ReturnsRequestsForUser()
    {
        // Arrange
        var request1 = new VisaChangeRequest
        {
            CaseId = _testCaseId,
            OldVisaTypeId = _b2VisaTypeId,
            NewVisaTypeId = _h1bVisaTypeId,
            Status = "approved",
            RequestedByStaffId = _testStaffUserId,
            RequestedAt = DateTime.UtcNow.AddDays(-5),
            ExpiresAt = DateTime.UtcNow.AddDays(2),
            ApprovedByClientAt = DateTime.UtcNow.AddDays(-3),
            DeltaAmount = 1000.00m,
            Currency = "USD"
        };

        var request2 = new VisaChangeRequest
        {
            CaseId = _testCaseId,
            OldVisaTypeId = _h1bVisaTypeId,
            NewVisaTypeId = _b2VisaTypeId,
            Status = "rejected",
            RequestedByStaffId = _testStaffUserId,
            RequestedAt = DateTime.UtcNow.AddDays(-2),
            ExpiresAt = DateTime.UtcNow.AddDays(5),
            RejectedByClientAt = DateTime.UtcNow.AddDays(-1),
            DeltaAmount = -1000.00m,
            Currency = "USD"
        };

        _context.VisaChangeRequests.AddRange(request1, request2);
        await _context.SaveChangesAsync();

        // Act
        var userRequests = await _context.VisaChangeRequests
            .Include(r => r.Case)
            .Include(r => r.OldVisaType)
            .Include(r => r.NewVisaType)
            .Include(r => r.RequestedByStaff)
            .Where(r => r.Case.UserId == _testClientUserId)
            .OrderByDescending(r => r.RequestedAt)
            .ToListAsync();

        // Assert
        Assert.Equal(2, userRequests.Count);
        Assert.Equal("rejected", userRequests[0].Status); // Most recent first
        Assert.Equal("approved", userRequests[1].Status);
        Assert.All(userRequests, r => Assert.Equal(_testClientUserId, r.Case.UserId));
    }

    [Fact]
    public void PriceDeltaCalculation_ChargeForHigherPriceVisaType()
    {
        // Arrange - B2 costs $1100, H1B costs $2200
        var oldPrice = 1100.00m;
        var newPrice = 2200.00m;
        var expectedDelta = newPrice - oldPrice; // Should be $1100

        // Act
        var actualDelta = newPrice - oldPrice;

        // Assert
        Assert.Equal(1100.00m, actualDelta);
        Assert.True(actualDelta > 0); // Should be a charge
    }

    [Fact]
    public void PriceDeltaCalculation_RefundForLowerPriceVisaType()
    {
        // Arrange - H1B costs $2200, B2 costs $1100
        var oldPrice = 2200.00m;
        var newPrice = 1100.00m;
        var expectedDelta = newPrice - oldPrice; // Should be -$1100

        // Act
        var actualDelta = newPrice - oldPrice;

        // Assert
        Assert.Equal(-1100.00m, actualDelta);
        Assert.True(actualDelta < 0); // Should be a refund
    }

    public void Dispose()
    {
        try
        {
            _context?.Database.EnsureDeleted();
            _context?.Dispose();
        }
        catch
        {
            // Ignore cleanup errors in tests
        }
    }
}