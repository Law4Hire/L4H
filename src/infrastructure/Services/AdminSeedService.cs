using L4H.Infrastructure.Data;
using L4H.Infrastructure.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Security.Cryptography;
using System.Text;

namespace L4H.Infrastructure.Services;

public interface IAdminSeedService
{
    Task SeedAdminAsync();
}

public class AdminSeedService : IAdminSeedService
{
    private readonly L4HDbContext _context;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IConfiguration _configuration;
    private readonly ILogger<AdminSeedService> _logger;

    public AdminSeedService(
        L4HDbContext context,
        IPasswordHasher passwordHasher,
        IConfiguration configuration,
        ILogger<AdminSeedService> logger)
    {
        _context = context;
        _passwordHasher = passwordHasher;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task SeedAdminAsync()
    {
        const string adminEmail = "dcann@cannlaw.com";
        const string testEmail = "abu@testing.com";
        const string defaultPassword = "SecureTest123!"; // Hardcoded for development/testing

        _logger.LogInformation("Creating admin and test users with default password for development");

        try
        {
            // Seed admin user
            await SeedUserIfNotExists(adminEmail, defaultPassword, "Denise", "Cann", isAdmin: true, isStaff: false).ConfigureAwait(false);

            // Seed test user as legal professional
            await SeedUserIfNotExists(testEmail, defaultPassword, "Abu", "Testing", isAdmin: false, isStaff: true).ConfigureAwait(false);

            // Seed demo verification token for testing
            await SeedDemoVerificationTokenAsync().ConfigureAwait(false);

            _logger.LogInformation("Successfully completed user seeding");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to seed users");
            throw;
        }
    }

    private async Task SeedUserIfNotExists(string email, string password, string firstName, string lastName, bool isAdmin, bool isStaff)
    {
        // Check if user already exists
        var existingUser = await _context.Users
            .FirstOrDefaultAsync(u => u.Email == email).ConfigureAwait(false);

        if (existingUser != null)
        {
            _logger.LogDebug("User {Email} already exists, skipping seed", email);
            return;
        }

        // Create user
        var user = new User
        {
            Email = email,
            FirstName = firstName,
            LastName = lastName,
            PasswordHash = _passwordHasher.HashPassword(password),
            EmailVerified = true, // Seeded users start verified
            CreatedAt = DateTime.UtcNow,
            PasswordUpdatedAt = DateTime.UtcNow,
            FailedLoginCount = 0,
            IsAdmin = isAdmin,
            IsStaff = isStaff,
            IsActive = true // Seeded users should be active
        };

        _context.Users.Add(user);
        
        // Create inactive case for each user
        var userCase = new Case
        {
            UserId = user.Id,
            Status = "inactive",
            CreatedAt = DateTime.UtcNow,
            LastActivityAt = DateTime.UtcNow
        };

        _context.Cases.Add(userCase);

        await _context.SaveChangesAsync().ConfigureAwait(false);

        var role = isAdmin ? "Admin" : isStaff ? "Legal Professional" : "User";
        _logger.LogInformation("Successfully created {Role} user {Email}", role, email);
    }

    private async Task SeedDemoVerificationTokenAsync()
    {
        const string demoToken = "demo-token-2745e95d-0f5e-4152-8d73-ceebcfb79a5d";
        const string testEmail = "demo@verification.test";

        // Check if demo verification token already exists
        var tokenHash = HashToken(demoToken);
        var existingToken = await _context.EmailVerificationTokens
            .FirstOrDefaultAsync(vt => vt.TokenHash == tokenHash).ConfigureAwait(false);

        if (existingToken != null)
        {
            _logger.LogDebug("Demo verification token already exists, skipping seed");
            return;
        }

        // Check if demo user exists, if not create one
        var demoUser = await _context.Users
            .FirstOrDefaultAsync(u => u.Email == testEmail).ConfigureAwait(false);

        if (demoUser == null)
        {
            demoUser = new User
            {
                Email = testEmail,
                FirstName = "Demo",
                LastName = "User",
                PasswordHash = _passwordHasher.HashPassword("DemoPassword123!"),
                EmailVerified = false, // Not verified yet - this is what we're testing
                CreatedAt = DateTime.UtcNow,
                PasswordUpdatedAt = DateTime.UtcNow,
                FailedLoginCount = 0,
                IsAdmin = false,
                IsStaff = false,
                IsActive = true // Demo user should be active
            };

            _context.Users.Add(demoUser);
            await _context.SaveChangesAsync().ConfigureAwait(false);
        }

        // Create demo verification token
        var verificationToken = new EmailVerificationToken
        {
            Id = Guid.NewGuid(),
            UserId = demoUser.Id,
            TokenHash = tokenHash,
            ExpiresAt = DateTime.UtcNow.AddYears(1), // Long expiry for demo purposes
            CreatedAt = DateTime.UtcNow
        };

        _context.EmailVerificationTokens.Add(verificationToken);
        await _context.SaveChangesAsync().ConfigureAwait(false);

        _logger.LogInformation("Successfully created demo verification token for testing");
    }

    private static string HashToken(string token)
    {
        using var sha256 = SHA256.Create();
        var hashBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(token));
        return Convert.ToBase64String(hashBytes);
    }
}