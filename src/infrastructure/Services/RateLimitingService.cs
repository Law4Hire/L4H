using L4H.Shared.Models;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Localization;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Logging;
using System.Net;

namespace L4H.Infrastructure.Services;

public interface IRateLimitingService
{
    Task<Result<bool>> CheckRateLimitAsync(string key, int maxRequests, TimeSpan window, CancellationToken cancellationToken = default);
    Task<Result<bool>> CheckUserRateLimitAsync(UserId userId, int maxRequests, TimeSpan window, CancellationToken cancellationToken = default);
    Task<Result<bool>> CheckIpRateLimitAsync(string ipAddress, int maxRequests, TimeSpan window, CancellationToken cancellationToken = default);
}

public class RateLimitingService : IRateLimitingService
{
    private readonly IMemoryCache _cache;
    private readonly IStringLocalizer<L4H.Infrastructure.Resources.Shared> _localizer;
    private readonly ILogger<RateLimitingService> _logger;

    public RateLimitingService(
        IMemoryCache cache,
        IStringLocalizer<L4H.Infrastructure.Resources.Shared> localizer,
        ILogger<RateLimitingService> logger)
    {
        _cache = cache;
        _localizer = localizer;
        _logger = logger;
    }

    public Task<Result<bool>> CheckRateLimitAsync(string key, int maxRequests, TimeSpan window, CancellationToken cancellationToken = default)
    {
        try
        {
            var cacheKey = $"rate_limit:{key}";
            var now = DateTime.UtcNow;
            var windowStart = now - window;

            // Get existing requests from cache
            List<DateTime> requests;
            if (_cache.TryGetValue(cacheKey, out List<DateTime>? cachedRequests) && cachedRequests != null)
            {
                requests = cachedRequests;
                // Remove expired requests
                requests.RemoveAll(r => r < windowStart);
            }
            else
            {
                requests = new List<DateTime>();
            }

            // Check if we're at the limit
            if (requests.Count >= maxRequests)
            {
                _logger.LogWarning("Rate limit exceeded for key {Key}. Current count: {Count}, Max: {Max}",
                    key, requests.Count, maxRequests);

                return Task.FromResult(Result<bool>.Failure(_localizer["Auth.RateLimitExceeded"]));
            }

            // Add current request
            requests.Add(now);

            // Store back in cache with expiration
            var cacheOptions = new MemoryCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = window.Add(TimeSpan.FromMinutes(1)) // Add buffer
            };
            _cache.Set(cacheKey, requests, cacheOptions);

            return Task.FromResult(Result<bool>.Success(true));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking rate limit for key {Key}", key);
            // Fail open - allow request if rate limiting fails
            return Task.FromResult(Result<bool>.Success(true));
        }
    }

    public async Task<Result<bool>> CheckUserRateLimitAsync(UserId userId, int maxRequests, TimeSpan window, CancellationToken cancellationToken = default)
    {
        return await CheckRateLimitAsync($"user:{userId.Value}", maxRequests, window, cancellationToken).ConfigureAwait(false);
    }

    public async Task<Result<bool>> CheckIpRateLimitAsync(string ipAddress, int maxRequests, TimeSpan window, CancellationToken cancellationToken = default)
    {
        return await CheckRateLimitAsync($"ip:{ipAddress}", maxRequests, window, cancellationToken).ConfigureAwait(false);
    }
}
