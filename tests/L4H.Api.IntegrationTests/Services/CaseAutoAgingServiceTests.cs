using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.EntityFrameworkCore;
using L4H.Infrastructure.Data;
using L4H.Infrastructure.Entities;
using L4H.Api.Services;
using L4H.Shared.Models;

namespace L4H.Api.IntegrationTests.Services;

public class CaseAutoAgingServiceTests : IDisposable
{
    private readonly ServiceProvider _serviceProvider;
    private readonly L4HDbContext _context;
    private readonly ILogger<CaseAutoAgingService> _logger;

    public CaseAutoAgingServiceTests()
    {
        var services = new ServiceCollection();
        
        services.AddDbContext<L4HDbContext>(options =>
            options.UseSqlServer("Server=localhost,14333;Database=L4H_Test;User Id=sa;Password=SecureTest123!;TrustServerCertificate=True;"));
        
        services.AddLogging();
        services.AddLocalization(options => options.ResourcesPath = "Resources");
        
        _serviceProvider = services.BuildServiceProvider();
        _context = _serviceProvider.GetRequiredService<L4HDbContext>();
        _logger = _serviceProvider.GetRequiredService<ILogger<CaseAutoAgingService>>();
    }

    [Fact]
    public async Task ProcessAutoAging_WithOldActiveCases_AgesThemToInactive()
    {
        // Arrange
        var oldDate = DateTimeOffset.UtcNow.AddDays(-35); // 35 days old
        var recentDate = DateTimeOffset.UtcNow.AddDays(-5); // 5 days old

        var oldCases = new[]
        {
            new Case
            {
                Id = new CaseId(Guid.NewGuid()),
                UserId = new UserId(Guid.NewGuid()),
                Status = "pending",
                LastActivityAt = oldDate,
                CreatedAt = DateTime.UtcNow.AddDays(-40),
                UpdatedAt = DateTime.UtcNow.AddDays(-35)
            },
            new Case
            {
                Id = new CaseId(Guid.NewGuid()),
                UserId = new UserId(Guid.NewGuid()),
                Status = "paid",
                LastActivityAt = oldDate,
                CreatedAt = DateTime.UtcNow.AddDays(-45),
                UpdatedAt = DateTime.UtcNow.AddDays(-35)
            },
            new Case
            {
                Id = new CaseId(Guid.NewGuid()),
                UserId = new UserId(Guid.NewGuid()),
                Status = "active",
                LastActivityAt = oldDate,
                CreatedAt = DateTime.UtcNow.AddDays(-50),
                UpdatedAt = DateTime.UtcNow.AddDays(-35)
            }
        };

        var recentCase = new Case
        {
            Id = new CaseId(Guid.NewGuid()),
            UserId = new UserId(Guid.NewGuid()),
            Status = "active",
            LastActivityAt = recentDate,
            CreatedAt = DateTime.UtcNow.AddDays(-10),
            UpdatedAt = DateTime.UtcNow.AddDays(-5)
        };

        _context.Cases.AddRange(oldCases);
        _context.Cases.Add(recentCase);
        await _context.SaveChangesAsync();

        var service = new CaseAutoAgingService(_serviceProvider, _logger);

        // Act - Call the private method via reflection for testing
        var method = typeof(CaseAutoAgingService)
            .GetMethod("ProcessAutoAgingAsync", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
        Assert.NotNull(method);
        await (Task)method.Invoke(service, Array.Empty<object>())!;

        // Assert
        var updatedCases = await _context.Cases.ToListAsync();
        
        // All old cases should be inactive
        foreach (var oldCase in oldCases)
        {
            var updated = updatedCases.First(c => c.Id == oldCase.Id);
            Assert.Equal("inactive", updated.Status);
            Assert.True(updated.LastActivityAt > oldDate); // Should have updated timestamp
        }

        // Recent case should remain active
        var recentUpdated = updatedCases.First(c => c.Id == recentCase.Id);
        Assert.Equal("active", recentUpdated.Status);

        // Should have created audit logs
        var auditLogs = await _context.AuditLogs.ToListAsync();
        Assert.Equal(3, auditLogs.Count); // One for each aged case
        
        foreach (var log in auditLogs)
        {
            Assert.Equal("case", log.Category);
            Assert.Equal("auto_age_inactive", log.Action);
            Assert.Equal("Case", log.TargetType);
            Assert.Null(log.ActorUserId); // System action
            Assert.Contains("Auto-aged due to 30+ days of inactivity", log.DetailsJson);
        }
    }

    [Fact]
    public async Task ProcessAutoAging_WithClosedOrDeniedCases_DoesNotAge()
    {
        // Arrange
        var oldDate = DateTimeOffset.UtcNow.AddDays(-35);

        var terminalCases = new[]
        {
            new Case
            {
                Id = new CaseId(Guid.NewGuid()),
                UserId = new UserId(Guid.NewGuid()),
                Status = "closed",
                LastActivityAt = oldDate,
                CreatedAt = DateTime.UtcNow.AddDays(-40),
                UpdatedAt = DateTime.UtcNow.AddDays(-35)
            },
            new Case
            {
                Id = new CaseId(Guid.NewGuid()),
                UserId = new UserId(Guid.NewGuid()),
                Status = "denied",
                LastActivityAt = oldDate,
                CreatedAt = DateTime.UtcNow.AddDays(-40),
                UpdatedAt = DateTime.UtcNow.AddDays(-35)
            }
        };

        _context.Cases.AddRange(terminalCases);
        await _context.SaveChangesAsync();

        var service = new CaseAutoAgingService(_serviceProvider, _logger);

        // Act
        var method = typeof(CaseAutoAgingService)
            .GetMethod("ProcessAutoAgingAsync", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
        Assert.NotNull(method);
        await (Task)method.Invoke(service, Array.Empty<object>())!;

        // Assert - Terminal cases should remain unchanged
        var updatedCases = await _context.Cases.ToListAsync();
        Assert.Equal("closed", updatedCases.First(c => c.Status == "closed").Status);
        Assert.Equal("denied", updatedCases.First(c => c.Status == "denied").Status);

        // Should not have created any audit logs
        var auditLogs = await _context.AuditLogs.ToListAsync();
        Assert.Empty(auditLogs);
    }

    [Fact]
    public async Task ProcessAutoAging_WithAlreadyInactiveCases_DoesNotAge()
    {
        // Arrange
        var oldDate = DateTimeOffset.UtcNow.AddDays(-35);

        var inactiveCase = new Case
        {
            Id = new CaseId(Guid.NewGuid()),
            UserId = new UserId(Guid.NewGuid()),
            Status = "inactive",
            LastActivityAt = oldDate,
            CreatedAt = DateTime.UtcNow.AddDays(-40),
            UpdatedAt = DateTime.UtcNow.AddDays(-35)
        };

        _context.Cases.Add(inactiveCase);
        await _context.SaveChangesAsync();

        var service = new CaseAutoAgingService(_serviceProvider, _logger);

        // Act
        var method = typeof(CaseAutoAgingService)
            .GetMethod("ProcessAutoAgingAsync", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
        Assert.NotNull(method);
        await (Task)method.Invoke(service, Array.Empty<object>())!;

        // Assert - Inactive case should remain unchanged
        var updatedCase = await _context.Cases.FirstAsync();
        Assert.Equal("inactive", updatedCase.Status);
        Assert.Equal(oldDate, updatedCase.LastActivityAt); // Should not have updated timestamp

        // Should not have created any audit logs
        var auditLogs = await _context.AuditLogs.ToListAsync();
        Assert.Empty(auditLogs);
    }

    [Fact]
    public async Task ProcessAutoAging_WithNoCases_DoesNothing()
    {
        // Arrange - Empty database
        var service = new CaseAutoAgingService(_serviceProvider, _logger);

        // Act
        var method = typeof(CaseAutoAgingService)
            .GetMethod("ProcessAutoAgingAsync", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
        Assert.NotNull(method);
        await (Task)method.Invoke(service, Array.Empty<object>())!;

        // Assert - Should not have any side effects
        var cases = await _context.Cases.ToListAsync();
        var auditLogs = await _context.AuditLogs.ToListAsync();
        
        Assert.Empty(cases);
        Assert.Empty(auditLogs);
    }

    [Theory]
    [InlineData("pending", true)]
    [InlineData("paid", true)]
    [InlineData("active", true)]
    [InlineData("inactive", false)]
    [InlineData("closed", false)]
    [InlineData("denied", false)]
    public async Task ProcessAutoAging_StatusEligibility_BehavesCorrectly(string status, bool shouldAge)
    {
        // Arrange
        var oldDate = DateTimeOffset.UtcNow.AddDays(-35);

        var testCase = new Case
        {
            Id = new CaseId(Guid.NewGuid()),
            UserId = new UserId(Guid.NewGuid()),
            Status = status,
            LastActivityAt = oldDate,
            CreatedAt = DateTime.UtcNow.AddDays(-40),
            UpdatedAt = DateTime.UtcNow.AddDays(-35)
        };

        _context.Cases.Add(testCase);
        await _context.SaveChangesAsync();

        var service = new CaseAutoAgingService(_serviceProvider, _logger);

        // Act
        var method = typeof(CaseAutoAgingService)
            .GetMethod("ProcessAutoAgingAsync", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
        Assert.NotNull(method);
        await (Task)method.Invoke(service, Array.Empty<object>())!;

        // Assert
        var updatedCase = await _context.Cases.FirstAsync();
        if (shouldAge)
        {
            Assert.Equal("inactive", updatedCase.Status);
            Assert.True(updatedCase.LastActivityAt > oldDate);
        }
        else
        {
            Assert.Equal(status, updatedCase.Status);
            Assert.Equal(oldDate, updatedCase.LastActivityAt);
        }

        var auditLogs = await _context.AuditLogs.ToListAsync();
        if (shouldAge)
        {
            Assert.Single(auditLogs);
        }
        else
        {
            Assert.Empty(auditLogs);
        }
    }

    public void Dispose()
    {
        _context.Dispose();
        _serviceProvider.Dispose();
    }
}