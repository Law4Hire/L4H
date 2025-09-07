using Microsoft.Extensions.DependencyInjection;
using Moq;
using L4H.Infrastructure.Services.Graph;
using L4H.Infrastructure.Services.Teams;
using L4H.Infrastructure.Services.Payments;
using L4H.Api.Services;
using L4H.Api.Services.Providers;
using L4H.Api.Tests.Fakes;

namespace L4H.Api.Tests;

/// <summary>
/// Helper class to register test-specific services and mocks
/// </summary>
public static class TestServiceRegistration
{
    public static void RegisterTestServices(IServiceCollection services)
    {
        // Register implementations for existing services using fake providers
        
        // Graph services
        RegisterGraphServices(services);
        
        // Teams services  
        RegisterTeamsServices(services);
        
        // Payment services
        RegisterPaymentServices(services);
        
        // Upload services
        RegisterUploadServices(services);
        
        // Mock services for interfaces that don't exist yet
        RegisterMockServices(services);
    }
    
    private static void RegisterGraphServices(IServiceCollection services)
    {
        // Use existing fake implementations
        // Use singleton for FakeGraphCalendarProvider to allow tests to control SimulateFailure state
        services.AddSingleton<ICalendarProvider, FakeGraphCalendarProvider>();
        // Use singleton for FakeGraphMailProvider to allow tests to verify sent mails
        services.AddSingleton<IMailProvider, FakeGraphMailProvider>();
    }
    
    private static void RegisterTeamsServices(IServiceCollection services)
    {
        // Use API-specific fake meetings provider for testing
        services.AddScoped<L4H.Api.Services.Providers.IMeetingsProvider, FakeApiMeetingsProvider>();
        // Use infrastructure fake meetings provider for testing (singleton to allow tests to control SimulateFailure state)
        services.AddSingleton<L4H.Infrastructure.Services.Teams.IMeetingsProvider, L4H.Infrastructure.Services.Teams.FakeMeetingsProvider>();
    }
    
    private static void RegisterPaymentServices(IServiceCollection services)
    {
        // Use API-specific fake payment provider
        services.AddScoped<L4H.Api.Services.Providers.IPaymentProvider, FakeApiPaymentProvider>();
    }
    
    private static void RegisterUploadServices(IServiceCollection services)
    {
        // Register upload-related services
        services.AddScoped<UploadTokenService>();
        services.AddScoped<AntivirusScanService>();
        
        // Configure upload options to disable antivirus scan for all tests
        services.Configure<L4H.Api.Models.UploadOptions>(options =>
        {
            options.DisableAntivirusScan = true;
        });
    }
    
    private static void RegisterMockServices(IServiceCollection services)
    {
        // For services that don't have interfaces yet, we'll create minimal mocks
        // or skip registration if the tests can handle missing services
    }
}