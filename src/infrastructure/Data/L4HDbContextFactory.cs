using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace L4H.Infrastructure.Data;

public class L4HDbContextFactory : IDesignTimeDbContextFactory<L4HDbContext>
{
    public L4HDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<L4HDbContext>();
        
        // Try to get connection string from environment or configuration
        var connectionString = Environment.GetEnvironmentVariable("ConnectionStrings__SqlServer") 
                              ?? Environment.GetEnvironmentVariable("ConnectionStrings:SqlServer")
                              ?? "Server=localhost,14333;Database=L4H;User Id=sa;Password=SecureTest123!;TrustServerCertificate=True;";
        
        optionsBuilder.UseSqlServer(connectionString);
        
        return new L4HDbContext(optionsBuilder.Options);
    }
}