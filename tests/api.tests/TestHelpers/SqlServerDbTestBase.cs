using L4H.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace L4H.Api.Tests.TestHelpers;

public abstract class SqlServerDbTestBase : IDisposable
{
    protected L4HDbContext DbContext { get; }
    private readonly ServiceProvider _serviceProvider;
    private readonly string _testDatabaseName;

    protected SqlServerDbTestBase()
    {
        _testDatabaseName = $"L4H_TestBase_{Guid.NewGuid():N}";
        var connectionString = $"Server=localhost,14333;Database={_testDatabaseName};User Id=sa;Password=SecureTest123!;TrustServerCertificate=True;";
        
        var services = new ServiceCollection();
        services.AddDbContext<L4HDbContext>(options =>
            options.UseSqlServer(connectionString));

        _serviceProvider = services.BuildServiceProvider();
        DbContext = _serviceProvider.GetRequiredService<L4HDbContext>();

        // Apply migrations to create the database with the latest schema
        DbContext.Database.Migrate();
    }

    public void Dispose()
    {
        Dispose(true);
        GC.SuppressFinalize(this);
    }

    protected virtual void Dispose(bool disposing)
    {
        if (disposing)
        {
            try
            {
                DbContext?.Database.EnsureDeleted();
                DbContext?.Dispose();
                _serviceProvider?.Dispose();
            }
            catch
            {
                // Ignore cleanup errors in tests
            }
        }
    }
}