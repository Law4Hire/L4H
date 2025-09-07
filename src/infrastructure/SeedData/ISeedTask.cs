namespace L4H.Infrastructure.SeedData;

public interface ISeedTask
{
    string Name { get; }
    Task ExecuteAsync();
}