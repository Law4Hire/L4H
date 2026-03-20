using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;

namespace L4H.Api.Infrastructure;

public class GlobalExceptionHandler : IExceptionHandler
{
    private readonly ILogger<GlobalExceptionHandler> _logger;
    private readonly IHostEnvironment _environment;

    public GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger, IHostEnvironment environment)
    {
        _logger = logger;
        _environment = environment;
    }

    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext,
        Exception exception,
        CancellationToken cancellationToken)
    {
        // Exception is already logged by the controller before rethrowing, 
        // but we can log here as a fallback or for global metrics.
        // To avoid duplicate logging if controller already logged it, we might check something?
        // But standard practice is to log in the handler.
        
        // If the exception was rethrown by a controller that already logged it, we might log it again.
        // However, redundancy is better than missing logs.
        _logger.LogError(exception, "An unhandled exception has occurred");

        var problemDetails = new ProblemDetails
        {
            Status = StatusCodes.Status500InternalServerError,
            Title = "An error occurred while processing your request",
            Detail = _environment.IsDevelopment()
                ? exception.Message
                : "Something went wrong on our side. Please try again or contact support if the problem continues."
        };

        httpContext.Response.StatusCode = problemDetails.Status.Value;

        await httpContext.Response.WriteAsJsonAsync(problemDetails, cancellationToken);

        return true;
    }
}
