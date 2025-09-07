using FluentAssertions;
using L4H.Api.Services;
using L4H.Infrastructure.Data;
using L4H.Infrastructure.Entities;
using L4H.Shared.Models;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace L4H.Api.Tests.Services;

public class DailyDigestServiceTests : BaseIntegrationTest
{
    private readonly Mock<ILogger<DailyDigestService>> _loggerMock;

    public DailyDigestServiceTests(WebApplicationFactory<Program> factory) : base(factory)
    {
        _loggerMock = new Mock<ILogger<DailyDigestService>>();
    }

    [Fact]
    public async Task ProcessDailyDigests_WithNewMessages_ShouldCreateDigests()
    {
        // Arrange
        using var scope = Factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<L4HDbContext>();
        var scopeFactory = Factory.Services.GetRequiredService<IServiceScopeFactory>();
        
        // Clean up any corrupt data from previous test runs
        await CleanupCorruptDigestData(context);

        // Create test data with unique IDs
        var userId = TestData.User1Id;
        var caseId = TestData.Case1Id;
        var threadId = TestData.Thread1Id;

        // Check if user already exists
        var existingUser = await context.Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (existingUser == null)
        {
            var user = new User
            {
                Id = userId,
                Email = "dailydigesttest1@testing.com",
                PasswordHash = "SecureTest123!",
                EmailVerified = true,
                CreatedAt = DateTime.UtcNow,
                PasswordUpdatedAt = DateTime.UtcNow
            };
            context.Users.Add(user);
        }

        // Check if case already exists
        var existingCase = await context.Cases.FirstOrDefaultAsync(c => c.Id == caseId);
        if (existingCase == null)
        {
            var testCase = new Case
            {
                Id = caseId,
                UserId = userId,
                Status = "active",
                CreatedAt = DateTime.UtcNow,
                LastActivityAt = DateTimeOffset.UtcNow
            };
            context.Cases.Add(testCase);
        }

        // Check if thread already exists
        var existingThread = await context.MessageThreads.FirstOrDefaultAsync(t => t.Id == threadId);
        if (existingThread == null)
        {
            var thread = new MessageThread
            {
                Id = threadId,
                CaseId = caseId,
                Subject = "Immigration Questions",
                CreatedAt = DateTime.UtcNow.AddDays(-1),
                LastMessageAt = DateTime.UtcNow
            };
            context.MessageThreads.Add(thread);
        }

        // Create professional users
        var existingProfessional1 = await context.Users.FirstOrDefaultAsync(u => u.Id == TestData.ProfessionalUser1Id);
        if (existingProfessional1 == null)
        {
            var professionalUser1 = new User
            {
                Id = TestData.ProfessionalUser1Id,
                Email = "dailydigestprofessional1@testing.com",
                PasswordHash = "SecureTest123!",
                EmailVerified = true,
                CreatedAt = DateTime.UtcNow,
                PasswordUpdatedAt = DateTime.UtcNow
            };
            context.Users.Add(professionalUser1);
        }

        var existingProfessional2 = await context.Users.FirstOrDefaultAsync(u => u.Id == TestData.ProfessionalUser2Id);
        if (existingProfessional2 == null)
        {
            var professionalUser2 = new User
            {
                Id = TestData.ProfessionalUser2Id,
                Email = "dailydigestprofessional2@testing.com",
                PasswordHash = "SecureTest123!",
                EmailVerified = true,
                CreatedAt = DateTime.UtcNow,
                PasswordUpdatedAt = DateTime.UtcNow
            };
            context.Users.Add(professionalUser2);
        }

        // Messages from yesterday (should be included)
        var yesterday = DateTime.UtcNow.Date.AddDays(-1);
        var yesterdayMessages = new[]
        {
            new Message
            {
                Id = Guid.Parse("A5555555-5555-5555-5555-555555555555"),
                ThreadId = threadId,
                SenderUserId = TestData.ProfessionalUser1Id,
                Body = "I've reviewed your I-485 application and have some feedback.",
                SentAt = yesterday.AddHours(10)
            },
            new Message
            {
                Id = Guid.Parse("A6666666-6666-6666-6666-666666666666"),
                ThreadId = threadId,
                SenderUserId = userId,
                Body = "Thank you for the review. What changes do you recommend?",
                SentAt = yesterday.AddHours(14)
            },
            new Message
            {
                Id = Guid.Parse("A7777777-7777-7777-7777-777777777777"),
                ThreadId = threadId,
                SenderUserId = TestData.ProfessionalUser2Id,
                Body = "Please update section 3.2 with your current employment details.",
                SentAt = yesterday.AddHours(16)
            }
        };

        // Message from today (should NOT be included)
        var todayMessage = new Message
        {
            Id = Guid.Parse("A8888888-8888-8888-8888-888888888888"),
            ThreadId = threadId,
            SenderUserId = TestData.ProfessionalUser1Id,
            Body = "Today's message - should not be in yesterday's digest",
            SentAt = DateTime.UtcNow
        };

        context.Messages.AddRange(yesterdayMessages);
        context.Messages.Add(todayMessage);
        await context.SaveChangesAsync();

        var service = new DailyDigestService(scopeFactory, _loggerMock.Object);

        // Act
        await service.CreateDigestQueuesFromRecentMessages(CancellationToken.None);

        // Assert
        var digests = await context.DailyDigestQueues
            .Where(d => d.UserId == userId)
            .ToListAsync();

        digests.Should().HaveCount(1);
        var digest = digests.First();
        
        digest.CreatedAt.Date.Should().Be(DateTime.UtcNow.Date);
        digest.ItemsJson.Should().NotBeNullOrEmpty();
        digest.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromMinutes(1));
        
        // Items JSON should contain thread info and message previews
        digest.ItemsJson.Should().Contain("Immigration Questions");
        digest.ItemsJson.Should().Contain("I\\u0027ve reviewed your I-485 application");
        digest.ItemsJson.Should().Contain("Please update section 3.2");
        digest.ItemsJson.Should().NotContain("Today's message"); // Should not include today's message
    }

    [Fact]
    public async Task ProcessDailyDigests_WithNoNewMessages_ShouldNotCreateDigest()
    {
        // Arrange
        using var scope = Factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<L4HDbContext>();
        
        // Clean up any corrupt data from previous test runs
        await CleanupCorruptDigestData(context);
        var scopeFactory = Factory.Services.GetRequiredService<IServiceScopeFactory>();

        var userId = TestData.User2Id;
        var caseId = TestData.Case2Id;

        // Check if user already exists
        var existingUser = await context.Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (existingUser == null)
        {
            var user = new User
            {
                Id = userId,
                Email = "dailydigesttest2@testing.com",
                PasswordHash = "SecureTest123!",
                EmailVerified = true,
                CreatedAt = DateTime.UtcNow,
                PasswordUpdatedAt = DateTime.UtcNow
            };
            context.Users.Add(user);
        }

        // Check if case already exists
        var existingCase = await context.Cases.FirstOrDefaultAsync(c => c.Id == caseId);
        if (existingCase == null)
        {
            var testCase = new Case
            {
                Id = caseId,
                UserId = userId,
                Status = "active",
                CreatedAt = DateTime.UtcNow,
                LastActivityAt = DateTimeOffset.UtcNow
            };
            context.Cases.Add(testCase);
        }

        await context.SaveChangesAsync();

        var service = new DailyDigestService(scopeFactory, _loggerMock.Object);

        // Act
        await service.ProcessDailyDigests(CancellationToken.None);

        // Assert
        var digests = await context.DailyDigestQueues
            .Where(d => d.UserId == userId)
            .ToListAsync();
        digests.Should().BeEmpty();
    }

    [Fact]
    public async Task ProcessDailyDigests_WithExistingDigest_ShouldNotCreateDuplicate()
    {
        // Arrange
        using var scope = Factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<L4HDbContext>();
        
        // Clean up any corrupt data from previous test runs
        await CleanupCorruptDigestData(context);
        var scopeFactory = Factory.Services.GetRequiredService<IServiceScopeFactory>();

        var userId = TestData.User3Id;
        var caseId = TestData.Case3Id;
        var threadId = TestData.Thread3Id;

        // Check if user already exists
        var existingUser = await context.Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (existingUser == null)
        {
            var user = new User
            {
                Id = userId,
                Email = "dailydigesttest3@testing.com",
                PasswordHash = "SecureTest123!",
                EmailVerified = true,
                CreatedAt = DateTime.UtcNow,
                PasswordUpdatedAt = DateTime.UtcNow
            };
            context.Users.Add(user);
        }

        // Check if case already exists
        var existingCase = await context.Cases.FirstOrDefaultAsync(c => c.Id == caseId);
        if (existingCase == null)
        {
            var testCase = new Case
            {
                Id = caseId,
                UserId = userId,
                Status = "active",
                CreatedAt = DateTime.UtcNow,
                LastActivityAt = DateTimeOffset.UtcNow
            };
            context.Cases.Add(testCase);
        }

        // Check if thread already exists
        var existingThread = await context.MessageThreads.FirstOrDefaultAsync(t => t.Id == threadId);
        if (existingThread == null)
        {
            var thread = new MessageThread
            {
                Id = threadId,
                CaseId = caseId,
                Subject = "Test Thread",
                CreatedAt = DateTime.UtcNow.AddDays(-1),
                LastMessageAt = DateTime.UtcNow.AddDays(-1)
            };
            context.MessageThreads.Add(thread);
        }

        // Check if professional user already exists
        var existingProfessional = await context.Users.FirstOrDefaultAsync(u => u.Id == TestData.ProfessionalUser1Id);
        if (existingProfessional == null)
        {
            var professionalUser = new User
            {
                Id = TestData.ProfessionalUser1Id,
                Email = "dailydigestprofessional1@testing.com",
                PasswordHash = "SecureTest123!",
                EmailVerified = true,
                CreatedAt = DateTime.UtcNow,
                PasswordUpdatedAt = DateTime.UtcNow
            };
            context.Users.Add(professionalUser);
        }

        // Message from yesterday
        var message = new Message
        {
            Id = Guid.NewGuid(), // Use dynamic GUID to avoid conflicts
            ThreadId = threadId,
            SenderUserId = TestData.ProfessionalUser1Id,
            Body = "Test message",
            SentAt = DateTime.UtcNow.Date.AddDays(-1).AddHours(12)
        };

        // Existing digest for yesterday
        var existingDigest = new DailyDigestQueue
        {
            Id = Guid.NewGuid(), // Use dynamic GUID to avoid conflicts
            UserId = userId,
            ItemsJson = "[]", // Valid empty JSON array
            CreatedAt = DateTime.UtcNow.AddDays(-1)
        };

        context.Messages.Add(message);
        context.DailyDigestQueues.Add(existingDigest);
        await context.SaveChangesAsync();

        var service = new DailyDigestService(scopeFactory, _loggerMock.Object);

        // Act
        await service.ProcessDailyDigests(CancellationToken.None);

        // Assert
        var digests = await context.DailyDigestQueues
            .Where(d => d.UserId == userId)
            .ToListAsync();

        digests.Should().HaveCount(1); // Should still be only 1 digest
        digests.First().Id.Should().Be(existingDigest.Id); // Should be the original digest
    }

    [Fact]
    public async Task ProcessDailyDigests_WithMultipleUsers_ShouldCreateSeparateDigests()
    {
        // Arrange
        using var scope = Factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<L4HDbContext>();
        
        // Clean up any corrupt data from previous test runs
        await CleanupCorruptDigestData(context);
        var scopeFactory = Factory.Services.GetRequiredService<IServiceScopeFactory>();

        var user1Id = TestData.User4Id;
        var user2Id = TestData.User5Id;
        var case1Id = TestData.Case4Id;
        var case2Id = TestData.Case5Id;
        var thread1Id = TestData.Thread4Id;
        var thread2Id = TestData.Thread5Id;

        // User 1 setup
        var existingUser1 = await context.Users.FirstOrDefaultAsync(u => u.Id == user1Id);
        if (existingUser1 == null)
        {
            var user1 = new User
            {
                Id = user1Id,
                Email = "dailydigesttest4@testing.com",
                PasswordHash = "SecureTest123!",
                EmailVerified = true,
                CreatedAt = DateTime.UtcNow,
                PasswordUpdatedAt = DateTime.UtcNow
            };
            context.Users.Add(user1);
        }

        var existingCase1 = await context.Cases.FirstOrDefaultAsync(c => c.Id == case1Id);
        if (existingCase1 == null)
        {
            var case1 = new Case
            {
                Id = case1Id,
                UserId = user1Id,
                Status = "active",
                CreatedAt = DateTime.UtcNow,
                LastActivityAt = DateTimeOffset.UtcNow
            };
            context.Cases.Add(case1);
        }

        var existingThread1 = await context.MessageThreads.FirstOrDefaultAsync(t => t.Id == thread1Id);
        if (existingThread1 == null)
        {
            var thread1 = new MessageThread
            {
                Id = thread1Id,
                CaseId = case1Id,
                Subject = "User 1 Thread",
                CreatedAt = DateTime.UtcNow.AddDays(-1),
                LastMessageAt = DateTime.UtcNow.AddDays(-1)
            };
            context.MessageThreads.Add(thread1);
        }

        // User 2 setup
        var existingUser2 = await context.Users.FirstOrDefaultAsync(u => u.Id == user2Id);
        if (existingUser2 == null)
        {
            var user2 = new User
            {
                Id = user2Id,
                Email = "dailydigesttest5@testing.com",
                PasswordHash = "SecureTest123!",
                EmailVerified = true,
                CreatedAt = DateTime.UtcNow,
                PasswordUpdatedAt = DateTime.UtcNow
            };
            context.Users.Add(user2);
        }

        var existingCase2 = await context.Cases.FirstOrDefaultAsync(c => c.Id == case2Id);
        if (existingCase2 == null)
        {
            var case2 = new Case
            {
                Id = case2Id,
                UserId = user2Id,
                Status = "active",
                CreatedAt = DateTime.UtcNow,
                LastActivityAt = DateTimeOffset.UtcNow
            };
            context.Cases.Add(case2);
        }

        var existingThread2 = await context.MessageThreads.FirstOrDefaultAsync(t => t.Id == thread2Id);
        if (existingThread2 == null)
        {
            var thread2 = new MessageThread
            {
                Id = thread2Id,
                CaseId = case2Id,
                Subject = "User 2 Thread",
                CreatedAt = DateTime.UtcNow.AddDays(-1),
                LastMessageAt = DateTime.UtcNow.AddDays(-1)
            };
            context.MessageThreads.Add(thread2);
        }

        // Create professional users if they don't exist
        var existingProfessional1 = await context.Users.FirstOrDefaultAsync(u => u.Id == TestData.ProfessionalUser1Id);
        if (existingProfessional1 == null)
        {
            var professionalUser1 = new User
            {
                Id = TestData.ProfessionalUser1Id,
                Email = "dailydigestprofessional1@testing.com",
                PasswordHash = "SecureTest123!",
                EmailVerified = true,
                CreatedAt = DateTime.UtcNow,
                PasswordUpdatedAt = DateTime.UtcNow
            };
            context.Users.Add(professionalUser1);
        }

        var existingProfessional2 = await context.Users.FirstOrDefaultAsync(u => u.Id == TestData.ProfessionalUser2Id);
        if (existingProfessional2 == null)
        {
            var professionalUser2 = new User
            {
                Id = TestData.ProfessionalUser2Id,
                Email = "dailydigestprofessional2@testing.com",
                PasswordHash = "SecureTest123!",
                EmailVerified = true,
                CreatedAt = DateTime.UtcNow,
                PasswordUpdatedAt = DateTime.UtcNow
            };
            context.Users.Add(professionalUser2);
        }

        var message1 = new Message
        {
            Id = Guid.Parse("ABBBBBBB-BBBB-BBBB-BBBB-BBBBBBBBBBBB"),
            ThreadId = thread1Id,
            SenderUserId = TestData.ProfessionalUser1Id,
            Body = "Message for user 1",
            SentAt = DateTime.UtcNow.Date.AddDays(-1).AddHours(10)
        };

        var message2 = new Message
        {
            Id = Guid.Parse("ACCCCCCC-CCCC-CCCC-CCCC-CCCCCCCCCCCC"),
            ThreadId = thread2Id,
            SenderUserId = TestData.ProfessionalUser2Id,
            Body = "Message for user 2",
            SentAt = DateTime.UtcNow.Date.AddDays(-1).AddHours(14)
        };

        context.Messages.AddRange(message1, message2);
        await context.SaveChangesAsync();

        var service = new DailyDigestService(scopeFactory, _loggerMock.Object);

        // Act
        await service.CreateDigestQueuesFromRecentMessages(CancellationToken.None);

        // Assert
        var digests = await context.DailyDigestQueues.ToListAsync();
        digests.Should().HaveCount(2);

        var digest1 = digests.First(d => d.UserId == user1Id);
        var digest2 = digests.First(d => d.UserId == user2Id);

        digest1.ItemsJson.Should().Contain("Message for user 1");
        digest1.ItemsJson.Should().NotContain("Message for user 2");

        digest2.ItemsJson.Should().Contain("Message for user 2");
        digest2.ItemsJson.Should().NotContain("Message for user 1");
    }

    [Fact]
    public async Task ProcessDailyDigests_WithUserMessagesOnly_ShouldNotCreateDigest()
    {
        // Arrange
        using var scope = Factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<L4HDbContext>();
        
        // Clean up any corrupt data from previous test runs
        await CleanupCorruptDigestData(context);
        var scopeFactory = Factory.Services.GetRequiredService<IServiceScopeFactory>();

        var userId = TestData.User6Id;
        var caseId = TestData.Case6Id;
        var threadId = TestData.Thread6Id;

        // Check if user already exists
        var existingUser = await context.Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (existingUser == null)
        {
            var user = new User
            {
                Id = userId,
                Email = "dailydigesttest6@testing.com",
                PasswordHash = "SecureTest123!",
                EmailVerified = true,
                CreatedAt = DateTime.UtcNow,
                PasswordUpdatedAt = DateTime.UtcNow
            };
            context.Users.Add(user);
        }

        // Check if case already exists
        var existingCase = await context.Cases.FirstOrDefaultAsync(c => c.Id == caseId);
        if (existingCase == null)
        {
            var testCase = new Case
            {
                Id = caseId,
                UserId = userId,
                Status = "active",
                CreatedAt = DateTime.UtcNow,
                LastActivityAt = DateTimeOffset.UtcNow
            };
            context.Cases.Add(testCase);
        }

        // Check if thread already exists
        var existingThread = await context.MessageThreads.FirstOrDefaultAsync(t => t.Id == threadId);
        if (existingThread == null)
        {
            var thread = new MessageThread
            {
                Id = threadId,
                CaseId = caseId,
                Subject = "Test Thread",
                CreatedAt = DateTime.UtcNow.AddDays(-1),
                LastMessageAt = DateTime.UtcNow.AddDays(-1)
            };
            context.MessageThreads.Add(thread);
        }

        // Only user messages (no professional messages)
        var userMessage = new Message
        {
            Id = L4H.Api.Tests.TestData.GenerateUniqueMessageId(),
            ThreadId = threadId,
            SenderUserId = userId,
            Body = "User's own message",
            SentAt = DateTime.UtcNow.Date.AddDays(-1).AddHours(12)
        };

        context.Messages.Add(userMessage);
        await context.SaveChangesAsync();

        var service = new DailyDigestService(scopeFactory, _loggerMock.Object);

        // Act
        await service.ProcessDailyDigests(CancellationToken.None);

        // Assert
        // Should not create digest for user's own messages only
        var digests = await context.DailyDigestQueues
            .Where(d => d.UserId == userId)
            .ToListAsync();
        digests.Should().BeEmpty();
    }


    private static async Task CleanupCorruptDigestData(L4HDbContext context)
    {
        // Find and remove any DailyDigestQueue entries with invalid JSON
        var corruptDigests = await context.DailyDigestQueues
            .Where(d => !string.IsNullOrEmpty(d.ItemsJson) && 
                       !d.ItemsJson.StartsWith("[") && 
                       !d.ItemsJson.StartsWith("{"))
            .ToListAsync();
            
        if (corruptDigests.Any())
        {
            context.DailyDigestQueues.RemoveRange(corruptDigests);
            await context.SaveChangesAsync();
        }
    }


    private static class TestData
    {
        public static readonly UserId User1Id = new UserId(Guid.Parse("A0000001-1234-1234-1234-123456789012")); // A prefix for DailyDigestService
        public static readonly UserId User2Id = new UserId(Guid.Parse("A0000002-1234-1234-1234-123456789012"));
        public static readonly UserId User3Id = new UserId(Guid.Parse("A0000003-1234-1234-1234-123456789012"));
        public static readonly UserId User4Id = new UserId(Guid.Parse("A0000004-1234-1234-1234-123456789012"));
        public static readonly UserId User5Id = new UserId(Guid.Parse("A0000005-1234-1234-1234-123456789012"));
        public static readonly UserId User6Id = new UserId(Guid.Parse("A0000006-1234-1234-1234-123456789012"));

        public static readonly UserId ProfessionalUser1Id = new UserId(Guid.Parse("A1000001-1234-1234-1234-123456789012"));
        public static readonly UserId ProfessionalUser2Id = new UserId(Guid.Parse("A2000001-1234-1234-1234-123456789012"));

        public static readonly CaseId Case1Id = new CaseId(Guid.Parse("A1111111-1111-1111-1111-111111111111"));
        public static readonly CaseId Case2Id = new CaseId(Guid.Parse("A2222222-2222-2222-2222-222222222222"));
        public static readonly CaseId Case3Id = new CaseId(Guid.Parse("A3333333-3333-3333-3333-333333333333"));
        public static readonly CaseId Case4Id = new CaseId(Guid.Parse("A4444444-4444-4444-4444-444444444444"));
        public static readonly CaseId Case5Id = new CaseId(Guid.Parse("A5555555-5555-5555-5555-555555555555"));
        public static readonly CaseId Case6Id = new CaseId(Guid.Parse("A6666666-6666-6666-6666-666666666666"));

        public static readonly Guid Thread1Id = Guid.Parse("A7111111-1111-1111-1111-111111111111");
        public static readonly Guid Thread2Id = Guid.Parse("A7222222-2222-2222-2222-222222222222");
        public static readonly Guid Thread3Id = Guid.Parse("A7333333-3333-3333-3333-333333333333");
        public static readonly Guid Thread4Id = Guid.Parse("A7444444-4444-4444-4444-444444444444");
        public static readonly Guid Thread5Id = Guid.Parse("A7555555-5555-5555-5555-555555555555");
        public static readonly Guid Thread6Id = Guid.Parse("A7666666-6666-6666-6666-666666666666");
    }
}