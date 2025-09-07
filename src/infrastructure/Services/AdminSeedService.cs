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

        // Check if admin user already exists
        var existingAdmin = await _context.Users
            .FirstOrDefaultAsync(u => u.Email == adminEmail).ConfigureAwait(false);

        if (existingAdmin != null)
        {
            _logger.LogDebug("Admin user {AdminEmail} already exists, skipping seed", adminEmail);
            return;
        }

        // Get password from environment
        var adminPassword = _configuration["ADMIN_SEED_PASSWORD"];
        
        if (string.IsNullOrEmpty(adminPassword))
        {
            _logger.LogWarning("ADMIN_SEED_PASSWORD environment variable not set. Skipping admin user creation.");
            return;
        }

        try
        {
            // Create admin user
            var adminUser = new User
            {
                Email = adminEmail,
                PasswordHash = _passwordHasher.HashPassword(adminPassword),
                EmailVerified = true, // Admin starts verified
                CreatedAt = DateTime.UtcNow,
                PasswordUpdatedAt = DateTime.UtcNow,
                FailedLoginCount = 0,
                IsAdmin = true
            };

            _context.Users.Add(adminUser);
            
            // Create inactive case for admin
            var adminCase = new Case
            {
                UserId = adminUser.Id,
                Status = "inactive",
                CreatedAt = DateTime.UtcNow,
                LastActivityAt = DateTime.UtcNow
            };

            _context.Cases.Add(adminCase);

            await _context.SaveChangesAsync().ConfigureAwait(false);

            _logger.LogInformation("Successfully created admin user {AdminEmail}", adminEmail);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create admin user {AdminEmail}", adminEmail);
            throw;
        }
    }
}