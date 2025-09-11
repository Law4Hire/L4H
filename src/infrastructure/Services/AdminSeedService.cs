using L4H.Infrastructure.Data;
using L4H.Infrastructure.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

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
            IsStaff = isStaff
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
}